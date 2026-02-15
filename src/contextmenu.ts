import type { BindOptions, ContextMenuConfig, ContextMenuInstance, ContextMenuInstanceOptions, ContextMenuInstanceState, MenuItem, OpenAtElementOptions, OpenContext, OpenAtElementPlacement, SpinnerConfig } from "./lib/types.js";
import { ROOT, CLASSES, DEFAULT_LONG_PRESS_MS } from "./lib/constants.js";
import { OPEN_MENU_INSTANCES } from "./lib/instances.js";
import { getCoordsFromAnchor, getPortal, getViewportSize, isOpenMouseEvent, setAttrs, setStyles, applyThemeToElement, applyAnimationConfig, normalizeItem, deepCloneMenu } from "./utils/index.js";
import { createItemNode, type ItemNodeContext, normalizeSubmenuArrow, enableScrollLock, disableScrollLock, getFocusableItems, setRovingTabindex, clearRovingFocus, makeHoverFocusHandler, handleKeydown, openSubmenuPanel, scheduleSubmenuOpen, scheduleSubmenuClose, cancelSubmenuClose, closeSubmenuWithAnimation, onEnterMenuItem, cancelLeaveAnimation, realClose } from "./menu/index.js";

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

  const state: ContextMenuInstanceState = {
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
    self: { close: () => realClose(state) },
    closeWithSelection: (selectedItem?) => {
      if (selectedItem !== undefined) state.lastSelectedItem = selectedItem;
      void realClose(state);
    },
    realClose: () => realClose(state),
    openSubmenuPanel: (sub, triggerEl) => openSubmenuPanel(state, sub, triggerEl),
    scheduleSubmenuOpen: (sub, triggerEl) => scheduleSubmenuOpen(state, sub, triggerEl),
    scheduleSubmenuClose: (triggerEl) => scheduleSubmenuClose(state, triggerEl),
    cancelSubmenuClose: () => cancelSubmenuClose(state),
    closeSubmenuWithAnimation: (panel, trigger, options) => closeSubmenuWithAnimation(panel, trigger, state, options),
    buildRootContent: () => _buildRootContent(state),
    refreshContent: () => _refreshContent(state),
    getSpinnerOptions: (it) => _getSpinnerOptions(state, it),
    makeHoverFocusHandler: makeHoverFocusHandler,
    onEnterMenuItem: (el) => onEnterMenuItem(state, el),
    keydownHandler: (e: KeyboardEvent) => handleKeydown(state, e),
  };

  wrapper.addEventListener("keydown", state.keydownHandler);

  const bindConfig = currentConfig.bind;
  if (bindConfig != null) {
    const el = bindConfig instanceof HTMLElement ? bindConfig : bindConfig.element;
    _bind(state, el, bindConfig instanceof HTMLElement ? undefined : bindConfig.options);
  }

  return _createInstance(state);
}


/**
 * @private
 * Positions the menu.
 * @param el - The element to position.
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @param config - The configuration.
 */
function _positionMenu(el: HTMLElement, x: number, y: number, config: ContextMenuConfig): void {
  const pos = config.position ?? {};
  const offsetX = pos.offset?.x ?? 0;
  const offsetY = pos.offset?.y ?? 0;
  const padding = pos.padding ?? 8;
  const flip = pos.flip !== false;
  const shift = pos.shift !== false;

  setStyles(el, { display: "" });
  el.getClientRects();
  const rect = el.getBoundingClientRect();
  const { vw, vh } = getViewportSize();

  let left = x + offsetX;
  let top = y + offsetY;

  if (flip) {
    if (top + rect.height > vh - padding) top = y - rect.height - offsetY;
    if (left + rect.width > vw - padding) left = x - rect.width - offsetX;
    if (left < padding) left = padding;
    if (top < padding) top = padding;
  }
  if (shift) {
    left = Math.max(padding, Math.min(vw - rect.width - padding, left));
    top = Math.max(padding, Math.min(vh - rect.height - padding, top));
  }

  setStyles(el, { left: `${left}px`, top: `${top}px` });
}

/**
 * @private
 * Gets the spinner options.
 * @param state - The state of the context menu.
 * @param it - The item to get the spinner options for.
 * @returns The spinner options.
 */
function _getSpinnerOptions(state: ContextMenuInstanceState, it: MenuItem): SpinnerConfig {
  const base = state.currentConfig.spinner ?? {};
  if (!it || typeof it !== "object") return base;
  const overrides: Partial<SpinnerConfig> = {};
  if ("loadingIcon" in it && it.loadingIcon !== undefined) overrides.icon = it.loadingIcon;
  if ("loadingSize" in it && it.loadingSize !== undefined) overrides.size = it.loadingSize;
  if ("loadingSpeed" in it && it.loadingSpeed !== undefined) overrides.speed = it.loadingSpeed;
  if (Object.keys(overrides).length === 0) return base;
  return { ...base, ...overrides };
}

/**
 * @private
 * Builds the root content.
 * @param state - The state of the context menu.
 */
function _buildRootContent(state: ContextMenuInstanceState): void {
  const itemContext: ItemNodeContext = {
    close: state.closeWithSelection,
    openSubmenuPanel: state.openSubmenuPanel,
    scheduleSubmenuOpen: state.scheduleSubmenuOpen,
    scheduleSubmenuClose: state.scheduleSubmenuClose,
    onHoverFocus: state.makeHoverFocusHandler(state.root),
    onEnterParentItem: (el) => state.onEnterMenuItem(el),
    submenuArrowConfig: state.submenuArrowConfig,
    refreshContent: state.refreshContent,
    onItemHover: (it, ev) => state.currentConfig.onItemHover?.({ item: it, nativeEvent: ev }),
    getSpinnerOptions: state.getSpinnerOptions,
    shortcutIcons: state.currentConfig.shortcutIcons,
    platform: state.currentConfig.platform,
    clearRovingFocus,
  };
  const fragment = document.createDocumentFragment();
  state.menu.forEach((item) => {
    const node = createItemNode(item, itemContext);
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
function _openImpl(state: ContextMenuInstanceState, xOrEvent?: number | MouseEvent, y?: number): Promise<MenuItem | undefined> {
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
          const coords = getCoordsFromAnchor(state.currentConfig.getAnchor());
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
      _positionMenu(state.root, xCoord, yCoord, state.currentConfig);
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
function _clearLongPressTimer(state: ContextMenuInstanceState): void {
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
function _unbind(state: ContextMenuInstanceState, el?: HTMLElement): void {
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
function _bind(state: ContextMenuInstanceState, el: HTMLElement, options?: BindOptions): void {
  _unbind(state);
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
    }, options?.longPressMs ?? DEFAULT_LONG_PRESS_MS);
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
function _destroy(state: ContextMenuInstanceState): void {
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
function _setMenu(state: ContextMenuInstanceState, newMenu: MenuItem[]): void {
  state.menu = newMenu.map(normalizeItem);
  if (state.isOpen) state.buildRootContent();
}

/**
 * @private
 * Sets the options.
 * @param state - The state of the context menu.
 * @param options - The options to set.
 */
function _setOptions(state: ContextMenuInstanceState, options: ContextMenuInstanceOptions): void {
  if (options.theme !== undefined) {
    state.currentConfig.theme = options.theme;
    applyThemeToElement(state.root, options.theme);
    for (const { panel } of state.openSubmenus) applyThemeToElement(panel, options.theme);
  }
  if (options.position !== undefined) state.currentConfig.position = options.position;
  if (options.animation !== undefined) {
    state.currentConfig.animation = options.animation;
    applyAnimationConfig(state.root, state.currentConfig);
    for (const { panel } of state.openSubmenus) applyAnimationConfig(panel, state.currentConfig);
  }
  if (options.lockScrollOutside !== undefined) {
    state.currentConfig.lockScrollOutside = options.lockScrollOutside;
    if (state.isOpen) {
      if (options.lockScrollOutside) enableScrollLock(state);
      else disableScrollLock(state);
    }
  }
}

/**
 * @private
 * Refreshes the content.
 * @param state - The state of the context menu.
 */
function _refreshContent(state: ContextMenuInstanceState): void {
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
 * @returns The promise to resolve the open.
 */
function _openAtElement(state: ContextMenuInstanceState, element: HTMLElement, options?: OpenAtElementOptions): Promise<MenuItem | undefined> {
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
  const PLACEMENT_COORDS: Record<Exclude<OpenAtElementPlacement, "auto">, { x: number; y: number }> = {
    "bottom-start": { x: rect.left, y: rect.bottom },
    "bottom-end": { x: rect.right, y: rect.bottom },
    "top-start": { x: rect.left, y: rect.top },
    "top-end": { x: rect.right, y: rect.top },
    "left-start": { x: rect.left, y: rect.top },
    "left-end": { x: rect.left, y: rect.bottom },
    "right-start": { x: rect.right, y: rect.top },
    "right-end": { x: rect.right, y: rect.bottom },
  };
  const { x, y } = PLACEMENT_COORDS[placement as Exclude<OpenAtElementPlacement, "auto">] ?? PLACEMENT_COORDS["bottom-start"];
  return _openImpl(state, x + offset.x, y + offset.y);
}

/**
 * @private
 * Creates an instance of the menu.
 * @param state - The state of the context menu.
 * @returns The instance of the menu.
 */
function _createInstance(state: ContextMenuInstanceState): ContextMenuInstance {
  return {
    open(xOrEventOrElement?: number | MouseEvent | HTMLElement, yOrOptions?: number | OpenAtElementOptions): Promise<MenuItem | undefined> {
      if (xOrEventOrElement === undefined && yOrOptions === undefined) return _openImpl(state);
      if (xOrEventOrElement instanceof HTMLElement) return _openAtElement(state, xOrEventOrElement, yOrOptions as OpenAtElementOptions | undefined);
      if (isOpenMouseEvent(xOrEventOrElement)) return _openImpl(state, xOrEventOrElement);
      return _openImpl(state, xOrEventOrElement as number, yOrOptions as number | undefined);
    },
    close: () => state.realClose(),
    toggle(x?, y?) {
      if (state.isOpen) void state.realClose();
      else void _openImpl(state, x ?? 0, y ?? 0);
    },
    getState: () => ({
      isOpen: state.isOpen,
      anchor: state.lastAnchor,
      menu: deepCloneMenu(state.menu),
      rootElement: state.wrapper,
    }),
    setMenu(menuOrUpdater) {
      if (typeof menuOrUpdater === "function") _setMenu(state, menuOrUpdater(deepCloneMenu(state.menu)));
      else _setMenu(state, menuOrUpdater);
    },
    bind(el?, options?) {
      if (el == null) _unbind(state);
      else _bind(state, el, options);
    },
    destroy: () => _destroy(state),
    setOptions: (options) => _setOptions(state, options),
  };
}
