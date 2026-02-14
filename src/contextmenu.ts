import type { BindOptions,ContextMenuConfig, ContextMenuInstance, ContextMenuState, MenuItem, OpenAtElementOptions, OpenContext, OpenAtElementPlacement, SpinnerConfig } from "./lib/types.js";
import { ROOT, CLASSES, DEFAULT_LONG_PRESS_MS } from "./lib/constants.js";
import { OPEN_MENU_INSTANCES } from "./lib/instances.js";
import { getCoordsFromAnchor, getPortal, getViewportSize, isOpenMouseEvent, setAttrs, setStyles, applyThemeToElement, applyAnimationConfig, normalizeItem, deepCloneMenu, positionMenu } from "./utils/index.js";
import { createItemNode, normalizeSubmenuArrow, enableScrollLock, disableScrollLock, getFocusableItems, setRovingTabindex, clearRovingFocus, makeHoverFocusHandler, handleKeydown, openSubmenuPanel, scheduleSubmenuOpen, scheduleSubmenuClose, cancelSubmenuClose, closeSubmenuWithAnimation, onEnterMenuItem, cancelLeaveAnimation, realClose } from "./menu/index.js";

/**
 * @private
 * Gets the spinner options.
 * @param state - The state of the context menu.
 * @param it - The item to get the spinner options for.
 * @returns The spinner options.
 */
function _getSpinnerOptions(state: ContextMenuState, it: MenuItem): SpinnerConfig {
  const base = state.currentConfig.spinner ?? {};
  const hasOverrides =
    it && typeof it === "object" &&
    ("loadingIcon" in it || "loadingSize" in it || "loadingSpeed" in it);
  if (!hasOverrides) return base;
  return {
    ...base,
    ...("loadingIcon" in it && it.loadingIcon !== undefined && { icon: it.loadingIcon }),
    ...("loadingSize" in it && it.loadingSize !== undefined && { size: it.loadingSize }),
    ...("loadingSpeed" in it && it.loadingSpeed !== undefined && { speed: it.loadingSpeed }),
  };
}

/**
 * @private
 * Builds the root content.
 * @param state - The state of the context menu.
 */
function _buildRootContent(state: ContextMenuState): void {
  const fragment = document.createDocumentFragment();
  state.menu.forEach((item) => {
    const node = createItemNode(item, state.closeWithSelection, state.openSubmenuPanel, state.scheduleSubmenuOpen, state.scheduleSubmenuClose, state.makeHoverFocusHandler(state.root), (el) => state.onEnterMenuItem(el), state.submenuArrowConfig, state.refreshContent, (it, ev) => state.currentConfig.onItemHover?.({ item: it, nativeEvent: ev }), state.getSpinnerOptions, state.currentConfig.shortcutIcons, state.currentConfig.platform, clearRovingFocus);
    if (node) fragment.appendChild(node);
  });
  state.root.replaceChildren(fragment);
}

/**
 * @private
 * Opens the menu.
 * @param state - The state of the context menu.
 * @param xOrEvent - The x or event to open the menu at.
 * @param y - The y to open the menu at.
 * @returns The promise to resolve the open.
 */
function _openImpl(state: ContextMenuState, xOrEvent?: number | MouseEvent, y?: number): Promise<MenuItem | undefined> {
  return new Promise((resolve) => {
    state.openPromiseResolve = resolve;
    (async () => {
      if (typeof state.currentConfig.menu === "function") {
        state.menu = state.currentConfig.menu().map(normalizeItem);
      }
      const openEvent = isOpenMouseEvent(xOrEvent) ? xOrEvent : undefined;
      let xCoord: number;
      let yCoord: number;
      if (openEvent) {
        xCoord = openEvent.clientX;
        yCoord = openEvent.clientY;
      } else {
        const noCoords = xOrEvent === undefined && y === undefined;
        if (noCoords && state.currentConfig.getAnchor) {
          const anchor = state.currentConfig.getAnchor();
          const coords = getCoordsFromAnchor(anchor);
          xCoord = coords.x;
          yCoord = coords.y;
        } else {
          xCoord = (xOrEvent as number) ?? 0;
          yCoord = y ?? 0;
        }
      }
      const openContext: OpenContext = {
        x: xCoord,
        y: yCoord,
        target: openEvent?.target instanceof Element ? openEvent.target : null,
        event: openEvent,
      };
      const allow = await Promise.resolve(state.currentConfig.onBeforeOpen?.(openEvent, openContext));
      if (allow === false) {
        state.openPromiseResolve?.(undefined);
        state.openPromiseResolve = null;
        return;
      }
      OPEN_MENU_INSTANCES.add(state.self);
      const others = [...OPEN_MENU_INSTANCES].filter((o) => o !== state.self);
      await Promise.all(others.map((o) => o.close()));
      cancelLeaveAnimation(state);
      if (state.isOpen) await state.realClose();
      state.lastAnchor = { x: xCoord, y: yCoord };
      state.lastSelectedItem = undefined;
      state.lastFocusTarget = document.activeElement as HTMLElement | null;
      state.isOpen = true;
      state.buildRootContent();
      if (!state.wrapper.parentElement) state.portal.appendChild(state.wrapper);
      enableScrollLock(state);
      state.outsideClickHandler = (e: MouseEvent): void => {
        if (!state.wrapper.contains(e.target as Node)) void state.realClose();
      };
      document.addEventListener("mousedown", state.outsideClickHandler, true);
      if (state.currentConfig.closeOnResize) {
        state.resizeHandler = (): void => void state.realClose();
        window.addEventListener("resize", state.resizeHandler);
      }
      positionMenu(state.root, xCoord, yCoord, state.currentConfig);
      setStyles(state.root, { display: "" });

      const applyOpenState = (): void => {
        state.root.classList.add(ROOT.OPEN_CLASS);
        state.currentConfig.onOpen?.(openEvent);
        const items = getFocusableItems(state.root);
        if (items.length) setRovingTabindex(items, 0);
      };
      const anim = state.currentConfig.animation;
      if (anim?.disabled) {
        applyOpenState();
        return;
      }
      state.root.getClientRects();
      requestAnimationFrame(applyOpenState);
    })();
  });
}

/**
 * @private
 * Clears the long press timer.
 * @param state - The state of the context menu.
 */
function _clearLongPressTimer(state: ContextMenuState): void {
  if (!state.longPressTimer) return;
  clearTimeout(state.longPressTimer);
  state.longPressTimer = null;
}

/**
 * @private
 * Unbinds the menu.
 * @param state - The state of the context menu.
 * @param el - The element to unbind the menu from.
 */
function _unbind(state: ContextMenuState, el?: HTMLElement): void {
  if (el != null && state.boundElement !== el) return;
  if (!state.boundElement) return;
  _clearLongPressTimer(state);
  if (state.boundContextmenu) state.boundElement.removeEventListener("contextmenu", state.boundContextmenu);
  if (state.boundTouchstart) state.boundElement.removeEventListener("touchstart", state.boundTouchstart);
  state.boundElement.removeEventListener("touchend", state.boundTouchEndOrCancel);
  state.boundElement.removeEventListener("touchcancel", state.boundTouchEndOrCancel);
  state.boundElement = null;
  state.boundContextmenu = null;
  state.boundTouchstart = null;
}

/**
 * @private
 * Binds the menu.
 * @param state - The state of the context menu.
 * @param el - The element to bind the menu to.
 * @param options - The options to bind the menu with.
 */
function _bind(state: ContextMenuState, el: HTMLElement, options?: BindOptions): void {
  _unbind(state);
  const longPressMs = options?.longPressMs ?? DEFAULT_LONG_PRESS_MS;
  state.boundContextmenu = (e: MouseEvent): void => {
    e.preventDefault();
    if ("pointerType" in e && (e as PointerEvent).pointerType === "touch") return;
    _openImpl(state, e);
  };
  state.boundTouchstart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    _clearLongPressTimer(state);
    state.longPressX = e.touches[0].clientX;
    state.longPressY = e.touches[0].clientY;
    state.longPressTimer = setTimeout(() => {
      state.longPressTimer = null;
      _openImpl(state, state.longPressX, state.longPressY);
    }, longPressMs);
  };
  state.boundTouchEndOrCancel = (): void => _clearLongPressTimer(state);
  el.addEventListener("contextmenu", state.boundContextmenu);
  el.addEventListener("touchstart", state.boundTouchstart, { passive: true });
  el.addEventListener("touchend", state.boundTouchEndOrCancel, { passive: true });
  el.addEventListener("touchcancel", state.boundTouchEndOrCancel, { passive: true });
  state.boundElement = el;
}

/**
 * @private
 * Destroys the menu.
 * @param state - The state of the context menu.
 */
function _destroy(state: ContextMenuState): void {
  _unbind(state);
  if (state.outsideClickHandler) {
    document.removeEventListener("mousedown", state.outsideClickHandler, true);
    state.outsideClickHandler = null;
  }
  if (state.resizeHandler) {
    window.removeEventListener("resize", state.resizeHandler);
    state.resizeHandler = null;
  }
  disableScrollLock(state);
  state.leaveAnimationCancel?.();
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.wrapper.remove();
  state.wrapper.removeEventListener("keydown", state.keydownHandler);
}

/**
 * @private
 * Sets the menu.
 * @param state - The state of the context menu.
 * @param newMenu - The new menu to set.
 */
function _setMenu(state: ContextMenuState, newMenu: MenuItem[]): void {
  state.menu = newMenu.map(normalizeItem);
  if (state.isOpen) state.buildRootContent();
}

/**
 * @private
 * Sets the theme.
 * @param state - The state of the context menu.
 * @param theme - The theme to set.
 */
function _setTheme(state: ContextMenuState, theme: ContextMenuConfig["theme"]): void {
  state.currentConfig.theme = theme;
  applyThemeToElement(state.root, theme);
  for (const { panel } of state.openSubmenus) applyThemeToElement(panel, theme);
}

/**
 * @private
 * Sets the position.
 * @param state - The state of the context menu.
 * @param position - The position to set.
 */
function _setPosition(state: ContextMenuState, position: ContextMenuConfig["position"]): void {
  state.currentConfig.position = position;
}

/**
 * @private
 * Sets the animation.
 * @param state - The state of the context menu.
 * @param animation - The animation to set.
 */
function _setAnimation(state: ContextMenuState, animation: ContextMenuConfig["animation"]): void {
  state.currentConfig.animation = animation;
  applyAnimationConfig(state.root, state.currentConfig);
  for (const { panel } of state.openSubmenus) applyAnimationConfig(panel, state.currentConfig);
}

/**
 * @private
 * Sets the lock scroll outside.
 * @param state - The state of the context menu.
 * @param lock - The lock to set.
 */
function _setLockScrollOutside(state: ContextMenuState, lock: boolean): void {
  state.currentConfig.lockScrollOutside = lock;
  if (!state.isOpen) return;
  if (lock) enableScrollLock(state);
  else disableScrollLock(state);
}

/**
 * @private
 * Refreshes the content.
 * @param state - The state of the context menu.
 */
function _refreshContent(state: ContextMenuState): void {
  if (!state.isOpen || typeof state.currentConfig.menu !== "function") return;
  state.menu = state.currentConfig.menu().map(normalizeItem);
  state.buildRootContent();
}

/**
 * @private
 * Opens the menu at an element.
 * @param state - The state of the context menu.
 * @param element - The element to open the menu at.
 * @param options - The options to open the menu at.
 */
function _openAtElement(state: ContextMenuState, element: HTMLElement, options?: OpenAtElementOptions): void {
  const offset = options?.offset ?? { x: 0, y: 0 };
  const rect = element.getBoundingClientRect();
  let placement: OpenAtElementPlacement = options?.placement ?? "bottom-start";
  if (placement === "auto") {
    const padding = state.currentConfig.position?.padding ?? 8;
    const { vw, vh } = getViewportSize();
    const spaceTop = rect.top - padding;
    const spaceBottom = vh - rect.bottom - padding;
    const spaceLeft = rect.left - padding;
    const spaceRight = vw - rect.right - padding;
    const vertical = spaceBottom >= spaceTop ? "bottom" : "top";
    const isRtl = getComputedStyle(element).direction === "rtl";
    const spaceStart = isRtl ? spaceRight : spaceLeft;
    const spaceEnd = isRtl ? spaceLeft : spaceRight;
    const startOrEnd = spaceEnd >= spaceStart ? (isRtl ? "end" : "start") : isRtl ? "start" : "end";
    placement = `${vertical}-${startOrEnd}` as OpenAtElementPlacement;
  }
  let x: number;
  let y: number;
  switch (placement) {
    case "bottom-start": x = rect.left; y = rect.bottom; break;
    case "bottom-end": x = rect.right; y = rect.bottom; break;
    case "top-start": x = rect.left; y = rect.top; break;
    case "top-end": x = rect.right; y = rect.top; break;
    case "left-start": x = rect.left; y = rect.top; break;
    case "left-end": x = rect.left; y = rect.bottom; break;
    case "right-start": x = rect.right; y = rect.top; break;
    case "right-end": x = rect.right; y = rect.bottom; break;
    default: x = rect.left; y = rect.bottom;
  }
  _openImpl(state, x + offset.x, y + offset.y);
}

/**
 * @private
 * Creates an instance of the menu.
 * @param state - The state of the context menu.
 * @returns The instance of the menu.
 */
function _createInstance(state: ContextMenuState): ContextMenuInstance {
  return {
    open: (xOrEvent?: number | MouseEvent, y?: number) => _openImpl(state, xOrEvent, y),
    close: () => state.realClose(),
    toggle(x?, y?) {
      if (state.isOpen) void state.realClose();
      else void _openImpl(state, x ?? 0, y ?? 0);
    },
    openAtElement: (element, options?) => _openAtElement(state, element, options),
    isOpen: () => state.isOpen,
    getAnchor: () => state.lastAnchor,
    getMenu: () => deepCloneMenu(state.menu),
    getRootElement: () => state.wrapper,
    updateMenu: (updater) => _setMenu(state, updater(deepCloneMenu(state.menu))),
    bind: (el, options?) => _bind(state, el, options),
    unbind: (el?) => _unbind(state, el),
    destroy: () => _destroy(state),
    setMenu: (newMenu) => _setMenu(state, newMenu),
    setTheme: (theme) => _setTheme(state, theme),
    setPosition: (position) => _setPosition(state, position),
    setAnimation: (animation) => _setAnimation(state, animation),
    setLockScrollOutside: (lock) => _setLockScrollOutside(state, lock),
  };
}

/**
 * Creates a context menu.
 * @param config - The configuration for the context menu.
 * @returns The context menu instance.
 */
export function createContextMenu(config: ContextMenuConfig): ContextMenuInstance {
  const currentConfig = { ...config };
  const rawMenu = typeof currentConfig.menu === "function" ? currentConfig.menu() : (currentConfig.menu ?? []);
  const menu = rawMenu.map(normalizeItem);
  const portal = getPortal(currentConfig.portal);
  const wrapper = document.createElement("div");
  wrapper.className = CLASSES.WRAPPER;
  const root = document.createElement("div");
  setAttrs(root, { role: "menu", "aria-orientation": "vertical", tabindex: "-1" });
  root.className = ROOT.CLASS;
  setStyles(root, { display: "none", ...(currentConfig.position?.zIndexBase != null ? { zIndex: String(currentConfig.position.zIndexBase) } : {}) });
  applyThemeToElement(root, currentConfig.theme);
  applyAnimationConfig(root, currentConfig);
  wrapper.appendChild(root);

  const state: ContextMenuState = {
    currentConfig,
    menu,
    portal,
    wrapper,
    root,
    submenuArrowConfig: normalizeSubmenuArrow(currentConfig.submenuArrow),
    isOpen: false,
    lastFocusTarget: null,
    openSubmenus: [],
    submenuHoverTimer: null,
    outsideClickHandler: null,
    resizeHandler: null,
    scrollLockHandler: null,
    boundElement: null,
    boundContextmenu: null!,
    boundTouchstart: null!,
    boundTouchEndOrCancel: (): void => {},
    longPressTimer: null,
    longPressX: 0,
    longPressY: 0,
    lastAnchor: null,
    lastSelectedItem: undefined,
    openPromiseResolve: null,
    closePromiseResolve: null,
    self: null!,
    closeWithSelection: null!,
    realClose: null!,
    openSubmenuPanel: null!,
    scheduleSubmenuOpen: null!,
    scheduleSubmenuClose: null!,
    cancelSubmenuClose: null!,
    closeSubmenuWithAnimation: null!,
    buildRootContent: null!,
    refreshContent: null!,
    getSpinnerOptions: null!,
    makeHoverFocusHandler: makeHoverFocusHandler,
    onEnterMenuItem: null!,
    keydownHandler: null!,
  };

  state.self = { close: () => realClose(state) };
  state.closeWithSelection = (selectedItem?) => {
    if (selectedItem !== undefined) state.lastSelectedItem = selectedItem;
    void realClose(state);
  };
  state.realClose = () => realClose(state);
  state.openSubmenuPanel = (sub, triggerEl) => openSubmenuPanel(state, sub, triggerEl);
  state.scheduleSubmenuOpen = (sub, triggerEl) => scheduleSubmenuOpen(state, sub, triggerEl);
  state.scheduleSubmenuClose = (triggerEl) => scheduleSubmenuClose(state, triggerEl);
  state.cancelSubmenuClose = () => cancelSubmenuClose(state);
  state.closeSubmenuWithAnimation = (panel, trigger, options) => closeSubmenuWithAnimation(panel, trigger, state, options);
  state.buildRootContent = () => _buildRootContent(state);
  state.refreshContent = () => _refreshContent(state);
  state.getSpinnerOptions = (it) => _getSpinnerOptions(state, it);
  state.onEnterMenuItem = (el) => onEnterMenuItem(state, el);
  state.keydownHandler = (e: KeyboardEvent) => handleKeydown(state, e);
  wrapper.addEventListener("keydown", state.keydownHandler);

  const bindConfig = currentConfig.bind;
  if (bindConfig != null) {
    const el = bindConfig instanceof HTMLElement ? bindConfig : bindConfig.element;
    _bind(state, el, bindConfig instanceof HTMLElement ? undefined : bindConfig.options);
  }

  return _createInstance(state);
}
