import type {
  BadgeConfig,
  BindOptions,
  CloseContext,
  ContextMenuConfig,
  ContextMenuInstance,
  ContextMenuState,
  EventRegistry,
  MenuItem,
  MenuItemAction,
  MenuItemCheckbox,
  MenuItemLabel,
  MenuItemLink,
  MenuItemRadio,
  MenuItemSubmenu,
  MenuItemVariant,
  MenuClickEvent,
  ShortcutPart,
  ModifierSymbol,
  OpenAtElementOptions,
  OpenContext,
  Placement,
  SpinnerConfig,
  SubmenuArrowConfig,
  SubmenuChildren,
} from "./types.js";
import {
  ROOT_CLASS,
  ROOT_OPEN_CLASS,
  ROOT_LEAVE_CLASS,
  SUBMENU_OPEN_CLASS,
  SUBMENU_HOVER_DELAY_MS,
  SUBMENU_CLOSE_DELAY_MS,
  DEFAULT_LONG_PRESS_MS,
  DEFAULT_SPINNER_SPEED_MS,
  CLASS_ICON,
  CLASS_SUBMENU_ARROW,
  CLASS_SUBMENU_ARROW_ICON,
  CLASS_SEPARATOR,
  CLASS_ITEM,
  CLASS_ITEM_LOADING,
  CLASS_ITEM_LEADING,
  CLASS_ITEM_LABEL,
  CLASS_SPINNER,
  CLASS_SPINNER_CUSTOM,
  CLASS_LABEL,
  CSS_VAR_SPINNER_DURATION,
  CLASS_ITEM_CHECKBOX,
  CLASS_CHECKED,
  CLASS_CHECK,
  CLASS_CHECK_CUSTOM,
  CLASS_SHORTCUT,
  CLASS_SHORTCUT_ICON,
  CLASS_ITEM_BADGE,
  CLASS_ITEM_RADIO,
  CLASS_RADIO,
  CLASS_RADIO_CUSTOM,
  CLASS_SUBMENU_TRIGGER,
  CLASS_WRAPPER,
  CLASS_SUBMENU,
  CM_ITEM_KEY,
  CM_SUBMENU_KEY,
  DEFAULT_SUBMENU_ARROW_SVG,
  MAC_MODIFIER_SYMBOLS,
  SHORTCUT_KEY_SYMBOLS,
  WIN_MODIFIER_SYMBOLS,
  CSS_VAR_PREFIX,
  CSS_VAR_ENTER_DURATION,
  CSS_VAR_LEAVE_DURATION,
  CSS_VAR_ENTER_EASING,
  CSS_VAR_LEAVE_EASING,
  THEME_CLASS_DATA_ATTR,
  ANIMATION_TYPE_DATA_ATTR,
  MENU_ROLE_SELECTOR,
  ID_PREFIX,
} from "./constants.js";

const OPEN_MENU_INSTANCES = new Set<{ close(): Promise<void> }>();

/**
 * Enable scroll lock outside the wrapper while the menu is open.
 * @param state - The state.
 */
function enableScrollLock(state: ContextMenuState): void {
  if (state.scrollLockHandler || state.currentConfig.lockScrollOutside === false) return;
  const handler = (event: WheelEvent | TouchEvent): void => {
    const target = event.target as Node | null;
    if (!target) return;
    if (state.wrapper.contains(target)) return;
    if ("preventDefault" in event) event.preventDefault();
  };
  state.scrollLockHandler = handler;
  const listener = handler as unknown as EventListener;
  document.addEventListener("wheel", listener, { passive: false, capture: true });
  document.addEventListener("touchmove", listener, { passive: false, capture: true });
}

/**
 * Disable scroll lock outside the wrapper.
 * @param state - The state.
 */
function disableScrollLock(state: ContextMenuState): void {
  if (!state.scrollLockHandler) return;
  const listener = state.scrollLockHandler as unknown as EventListener;
  document.removeEventListener("wheel", listener, true);
  document.removeEventListener("touchmove", listener, true);
  state.scrollLockHandler = null;
}

/**
 * Get the portal element.
 * @param portal - The portal element or function that returns the portal element.
 * @returns The portal element.
 */
function getPortal(portal: ContextMenuConfig["portal"]): HTMLElement {
  if (portal == null) return document.body;
  return typeof portal === "function" ? portal() : portal;
}

/**
 * Get the viewport size.
 * @returns The viewport size.
 */
function getViewportSize(): { vw: number; vh: number } {
  const el = document.documentElement;
  return { vw: el.clientWidth, vh: el.clientHeight };
}

/**
 * Set the attributes on the element.
 * @param el - The element.
 * @param attrs - The attributes to set.
 */
function setAttrs(el: HTMLElement, attrs: Record<string, string>): void {
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

/**
 * Set the styles on the element.
 * @param el - The element.
 * @param styles - The styles to set.
 */
function setStyles(el: HTMLElement, styles: Record<string, string>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (key.startsWith("--")) {
      el.style.setProperty(key, value);
    } else {
      (el.style as unknown as Record<string, string>)[key] = value;
    }
  }
}

/**
 * Add the classes to the element.
 * @param el - The element.
 * @param classes - The classes to add.
 */
function addClasses(el: HTMLElement, ...classes: (string | undefined | null | false)[]): void {
  for (const c of classes) {
    if (!c) continue;
    el.classList.add(...c.trim().split(/\s+/).filter(Boolean));
  }
}

/**
 * Check if the platform is Mac-like.
 * @returns True if the platform is Mac-like, false otherwise.
 */
function isMacLikePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform;
  if (uaData === "macOS" || uaData === "iOS") return true;
  const ua = navigator.userAgent ?? "";
  return /Mac|iPhone|iPod|iPad/i.test(ua);
}

/**
 * Get the modifier display.
 * @param v - The modifier symbol.
 * @param fallback - The fallback string.
 * @returns The modifier display.
 */
function modifierDisplay(v: ModifierSymbol | undefined, fallback: string): string {
  if (v == null) return fallback;
  return typeof v === "string" ? v : v.text;
}

/**
 * Get the shortcut parts.
 * @param shortcut - The shortcut string.
 * @param platformOverride - The platform override.
 * @returns The shortcut parts.
 */
function getShortcutParts(
  shortcut: string,
  platformOverride?: "mac" | "win" | "auto"
): { mods: ShortcutPart[]; key: ShortcutPart; useCmd: boolean } | null {
  if (!shortcut || typeof shortcut !== "string") return null;
  const parts = shortcut.split("+").map((p) => p.trim());
  if (parts.length === 0) return null;
  const keyPart = parts[parts.length - 1] ?? "";
  const modParts = parts.slice(0, -1).map((p) => p.toLowerCase());
  const keyLower = keyPart.toLowerCase();
  const keyDisplay = SHORTCUT_KEY_SYMBOLS[keyLower] ?? (keyPart.length === 1 ? keyPart.toUpperCase() : keyPart);
  const useCmd = platformOverride === "win" ? false : platformOverride === "mac" ? true : isMacLikePlatform();
  const symbolMap = useCmd ? MAC_MODIFIER_SYMBOLS : WIN_MODIFIER_SYMBOLS;
  const mods: ShortcutPart[] = modParts.map((m) => ({
    name: m,
    display:
      useCmd && m === "ctrl"
        ? MAC_MODIFIER_SYMBOLS.cmd
        : SHORTCUT_KEY_SYMBOLS[m] ?? modifierDisplay(symbolMap[m as keyof typeof symbolMap], m),
  }));
  return {
    mods,
    key: { name: keyLower, display: keyDisplay },
    useCmd,
  };
}

/**
 * Normalize the item.
 * @param raw - The raw item.
 * @returns The normalized item.
 */
function normalizeItem(raw: MenuItem): MenuItem {
  const item = { ...raw } as MenuItem;
  if ("visible" in item && item.visible === undefined) (item as MenuItemAction).visible = true;
  const hasExplicitType = "type" in raw && (raw as { type?: string }).type != null && (raw as { type?: string }).type !== "";
  if (!hasExplicitType) {
    if ("children" in item) (item as unknown as MenuItemSubmenu).type = "submenu";
    else if ("href" in item && (item as MenuItemLink).href != null) (item as unknown as MenuItemLink).type = "link";
    else if ("label" in item && !("children" in item)) (item as MenuItemAction).type = "item";
  }
  if ("children" in item && item.type === "submenu") {
    const rawChildren = (item as MenuItemSubmenu).children;
    if (Array.isArray(rawChildren)) {
      (item as MenuItemSubmenu).children = rawChildren.map(normalizeItem);
    }
  }
  return item;
}

/**
 * Resolve the submenu children.
 * @param children - The submenu children.
 * @returns The resolved submenu children.
 */
async function resolveSubmenuChildren(children: SubmenuChildren): Promise<MenuItem[]> {
  const arr = Array.isArray(children) ? children : await children();
  return arr.map(normalizeItem);
}

/**
 * Position the menu.
 * @param el - The element.
 * @param x - The x coordinate.
 * @param y - The y coordinate.
 * @param config - The configuration.
 */
function positionMenu(el: HTMLElement, x: number, y: number, config: ContextMenuConfig): void {
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
 * Apply the animation configuration.
 * @param root - The root element.
 * @param config - The configuration.
 */
function applyAnimationConfig(root: HTMLElement, config: ContextMenuConfig): void {
  const anim = config.animation;
  if (!anim || anim.disabled) return;
  const animType = anim.type === "slide" ? "slide" : "fade";
  root.setAttribute(ANIMATION_TYPE_DATA_ATTR, animType);
  const enter = anim.enter ?? 120;
  const leave = anim.leave ?? 80;
  const enterMs = typeof enter === "number" ? enter : enter.duration;
  const leaveMs = typeof leave === "number" ? leave : leave.duration;
  const enterEasing = typeof enter === "number" ? "ease-out" : enter.easing;
  const leaveEasing = typeof leave === "number" ? "ease-in" : leave.easing;
  setStyles(root, {
    [CSS_VAR_ENTER_DURATION]: `${enterMs}ms`,
    [CSS_VAR_LEAVE_DURATION]: `${leaveMs}ms`,
    [CSS_VAR_ENTER_EASING]: enterEasing,
    [CSS_VAR_LEAVE_EASING]: leaveEasing,
  });
}

/**
 * Append the icon to the element.
 * @param el - The element.
 * @param icon - The icon.
 */
function appendIcon(el: HTMLElement, icon: string | HTMLElement): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASS_ICON;
  if (typeof icon === "string") wrap.textContent = icon;
  else wrap.appendChild(icon);
  el.appendChild(wrap);
}

/**
 * Append the badge to the element.
 * @param el - The element.
 * @param badge - The badge.
 */
function appendBadge(el: HTMLElement, badge: BadgeConfig): void {
  if (typeof badge === "string" || typeof badge === "number") {
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.className = CLASS_ITEM_BADGE;
    span.textContent = String(badge);
    el.appendChild(span);
    return;
  }
  if (badge.render) {
    const node = badge.render();
    if (!node.getAttribute("aria-hidden")) node.setAttribute("aria-hidden", "true");
    el.appendChild(node);
    return;
  }
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.className = CLASS_ITEM_BADGE;
  if (badge.className) span.classList.add(...badge.className.trim().split(/\s+/));
  span.textContent = String(badge.content ?? "");
  el.appendChild(span);
}

/**
 * Append the shortcut icon to the element.
 * @param container - The container element.
 * @param icon - The icon.
 */
function appendShortcutIcon(container: HTMLElement, icon: string | HTMLElement): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASS_SHORTCUT_ICON;
  if (typeof icon === "string") {
    const tmp = document.createElement("div");
    tmp.innerHTML = icon;
    while (tmp.firstChild) wrap.appendChild(tmp.firstChild);
  } else wrap.appendChild(icon.cloneNode(true));
  container.appendChild(wrap);
}

/**
 * Append the shortcut to the element.
 * @param el - The element.
 * @param shortcut - The shortcut.
 * @param shortcutIcons - The shortcut icons.
 * @param platformOverride - The platform override.
 */
function appendShortcut(
  el: HTMLElement,
  shortcut: string,
  shortcutIcons?: Record<string, string | HTMLElement>,
  platformOverride?: "mac" | "win" | "auto"
): void {
  const sc = document.createElement("span");
  sc.setAttribute("aria-hidden", "true");
  sc.className = CLASS_SHORTCUT;
  const parsed = getShortcutParts(shortcut, platformOverride);
  if (!parsed) {
    sc.textContent = shortcut;
    el.appendChild(sc);
    return;
  }
  const { mods, key, useCmd } = parsed;
  const resolveIcon = (name: string): string | HTMLElement | undefined => {
    const v = shortcutIcons?.[name];
    if (v !== undefined) return v;
    if (name === "win" || name === "windows") {
      if (useCmd) return undefined;
      const entry = WIN_MODIFIER_SYMBOLS.win;
      return typeof entry === "string" ? undefined : entry.icon;
    }
    return undefined;
  };
  for (const part of mods) {
    const icon = resolveIcon(part.name);
    if (icon) appendShortcutIcon(sc, icon);
    else sc.appendChild(document.createTextNode(part.display));
  }
  const keyIcon = resolveIcon(key.name);
  if (keyIcon) appendShortcutIcon(sc, keyIcon);
  else sc.appendChild(document.createTextNode(key.display));
  el.appendChild(sc);
}

/**
 * Append the item content to the element.
 * @param el - The element.
 * @param label - The label.
 * @param opts - The options.
 * @returns The item content element.
 */
function appendItemContent(
  el: HTMLElement,
  label: string,
  opts?: {
    icon?: string | HTMLElement;
    shortcut?: string;
    badge?: BadgeConfig;
    shortcutIcons?: Record<string, string | HTMLElement>;
    platform?: "mac" | "win" | "auto";
  }
): HTMLElement {
  const leadingSlot = document.createElement("span");
  leadingSlot.className = CLASS_ITEM_LEADING;
  leadingSlot.setAttribute("aria-hidden", "true");
  el.appendChild(leadingSlot);
  const labelSpan = document.createElement("span");
  labelSpan.className = CLASS_LABEL;
  labelSpan.textContent = label;
  el.appendChild(labelSpan);
  if (opts?.icon) appendIcon(el, opts.icon);
  if (opts?.shortcut) appendShortcut(el, opts.shortcut, opts.shortcutIcons, opts.platform);
  if (opts?.badge !== undefined) appendBadge(el, opts.badge);
  return leadingSlot;
}

/**
 * Apply the loading to the item.
 * @param el - The element.
 * @param opts - The options.
 */
function applyLoadingToItem(
  el: HTMLElement,
  opts: SpinnerConfig
): void {
  const leadingSlot = el.querySelector(`.${CLASS_ITEM_LEADING}`) as HTMLElement | null;
  if (leadingSlot) appendLoadingSpinner(leadingSlot, opts);
  else {
    const wrap = document.createElement("span");
    wrap.className = CLASS_ITEM_LEADING;
    appendLoadingSpinner(wrap, opts);
    el.insertBefore(wrap, el.querySelector(`.${CLASS_LABEL}`) ?? el.firstChild);
  }
}

/**
 * Apply the item loading state.
 * @param el - The element.
 * @param item - The item.
 * @param getSpinnerOptions - The function to get the spinner options.
 */
function applyItemLoadingState(
  el: HTMLElement,
  item: MenuItem,
  getSpinnerOptions?: (it: MenuItem) => SpinnerConfig
): void {
  addClasses(el, CLASS_ITEM_LOADING);
  el.setAttribute("aria-busy", "true");
  applyLoadingToItem(el, getSpinnerOptions?.(item) ?? {});
}

/**
 * Set the item id and disabled state.
 * @param el - The element.
 * @param id - The id.
 * @param disabled - The disabled state.
 */
function setItemIdDisabled(el: HTMLElement, id?: string, disabled?: boolean): void {
  if (id) el.id = id;
  if (disabled) el.setAttribute("aria-disabled", "true");
}

/**
 * Assign the cm item to the element.
 * @param el - The element.
 * @param item - The item.
 * @param extras - The extras.
 */
function assignCmItem(
  el: HTMLElement,
  item: MenuItem,
  extras?: { _cmCheckbox?: MenuItemCheckbox; _cmRadio?: MenuItemRadio; _cmSubmenu?: MenuItemSubmenu }
): void {
  const o = el as unknown as Record<string, unknown>;
  o[CM_ITEM_KEY] = item;
  if (extras?._cmCheckbox) o._cmCheckbox = extras._cmCheckbox;
  if (extras?._cmRadio) o._cmRadio = extras._cmRadio;
  if (extras?._cmSubmenu) o[CM_SUBMENU_KEY] = extras._cmSubmenu;
}

/**
 * Get the cm item from the element.
 * @param el - The element.
 * @returns The cm item.
 */
function getCmItem(el: HTMLElement): MenuItem | undefined {
  const o = el as unknown as Record<string, unknown>;
  const sub = o[CM_SUBMENU_KEY] as MenuItemSubmenu | undefined;
  return sub ?? (o[CM_ITEM_KEY] as MenuItem | undefined);
}

/**
 * Get the cm submenu from the element.
 * @param el - The element.
 * @returns The cm submenu.
 */
function getCmSubmenu(el: HTMLElement): MenuItemSubmenu | undefined {
  return (el as unknown as Record<string, unknown>)[CM_SUBMENU_KEY] as MenuItemSubmenu | undefined;
}

/**
 * Add the item hover listeners.
 * @param el - The element.
 * @param item - The item.
 * @param callbacks - The callbacks.
 */
function addItemHoverListeners(
  el: HTMLElement,
  item: MenuItem,
  callbacks: {
    onHoverFocus?: (el: HTMLElement) => void;
    onEnterParentItem?: (el: HTMLElement) => void;
    onItemHoverCallback?: (item: MenuItem, nativeEvent: MouseEvent | FocusEvent) => void;
    afterFire?: (e: MouseEvent | FocusEvent) => void;
    onMouseLeave?: () => void;
  }
): void {
  const fire = (e: MouseEvent | FocusEvent): void => {
    callbacks.onHoverFocus?.(el);
    callbacks.onEnterParentItem?.(el);
    callbacks.onItemHoverCallback?.(item, e);
    if ("disabled" in item && item.disabled) clearRovingFocus(el.closest(MENU_ROLE_SELECTOR) as HTMLElement | null);
    callbacks.afterFire?.(e);
  };
  el.addEventListener("mouseenter", fire);
  el.addEventListener("focus", fire);
  if (callbacks.onMouseLeave) el.addEventListener("mouseleave", callbacks.onMouseLeave);
}

/**
 * Attach custom DOM event handlers from an item's events registry to the element.
 * @param el - The element.
 * @param events - Event registry or function that returns it.
 */
function attachItemEvents(el: HTMLElement, events: EventRegistry | (() => EventRegistry) | undefined): void {
  if (events == null) return;
  const registry = typeof events === "function" ? events() : events;
  for (const [eventName, entry] of Object.entries(registry)) {
    if (entry == null) continue;
    if (typeof entry === "function") el.addEventListener(eventName, entry as EventListener);
    else el.addEventListener(eventName, entry.listener as EventListener, entry.options);
  }
}

/**
 * Append the state indicator to the element.
 * @param el - The element.
 * @param checked - The checked state.
 * @param icon - The icon.
 * @param uncheckedIcon - The unchecked icon.
 * @param baseClass - The base class.
 * @param customClass - The custom class.
 * @param checkedClassName - The checked class name.
 * @param uncheckedClassName - The unchecked class name.
 */
function appendStateIndicator(
  el: HTMLElement,
  checked: boolean | undefined,
  icon: string | HTMLElement | undefined,
  uncheckedIcon: string | HTMLElement | undefined,
  baseClass: string,
  customClass: string,
  checkedClassName?: string,
  uncheckedClassName?: string
): void {
  const isChecked = Boolean(checked);
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  const hasCustom = (icon !== undefined && icon !== null) || (uncheckedIcon !== undefined && uncheckedIcon !== null);
  span.className = baseClass + (hasCustom ? ` ${customClass}` : "");
  if (isChecked && checkedClassName) span.classList.add(...checkedClassName.trim().split(/\s+/));
  if (!isChecked && uncheckedClassName) span.classList.add(...uncheckedClassName.trim().split(/\s+/));
  if (hasCustom) {
    const indicatorIcon = isChecked ? icon : uncheckedIcon;
    if (indicatorIcon) {
      if (typeof indicatorIcon === "string") span.innerHTML = indicatorIcon;
      else span.appendChild(indicatorIcon.cloneNode(true));
    }
  }
  el.appendChild(span);
}

/**
 * Convert the size to CSS.
 * @param size - The size.
 * @returns The CSS size.
 */
function sizeToCss(size: number | string): string {
  return typeof size === "number" ? `${size}px` : size;
}

/**
 * Append the loading spinner to the element.
 * @param container - The container element.
 * @param options - The options.
 */
function appendLoadingSpinner(container: HTMLElement, options: SpinnerConfig): void {
  const spinner = document.createElement("span");
  spinner.className = CLASS_SPINNER;
  spinner.setAttribute("aria-hidden", "true");
  const icon = options.icon;
  const hasCustomIcon = icon !== undefined && icon !== null;
  if (hasCustomIcon && icon !== undefined) {
    spinner.classList.add(CLASS_SPINNER_CUSTOM);
    if (typeof icon === "string") {
      const tmp = document.createElement("div");
      tmp.innerHTML = icon;
      while (tmp.firstChild) spinner.appendChild(tmp.firstChild);
    } else spinner.appendChild(icon.cloneNode(true));
  }
  const speedMs = options.speed ?? DEFAULT_SPINNER_SPEED_MS;
  const spinnerStyles: Record<string, string> = { [CSS_VAR_SPINNER_DURATION]: `${speedMs}ms` };
  if (options.size !== undefined) {
    const sizeCss = sizeToCss(options.size);
    spinnerStyles.width = sizeCss;
    spinnerStyles.height = sizeCss;
    spinnerStyles.minWidth = sizeCss;
    spinnerStyles.minHeight = sizeCss;
  }
  setStyles(spinner, spinnerStyles);
  container.appendChild(spinner);
}

/**
 * Normalize the submenu arrow.
 * @param value - The value.
 * @returns The normalized submenu arrow.
 */
function normalizeSubmenuArrow(value: ContextMenuConfig["submenuArrow"]): SubmenuArrowConfig | null {
  if (value === false || value === undefined) return null;
  if (value === true) return { icon: DEFAULT_SUBMENU_ARROW_SVG, size: 14 };
  return value;
}

/**
 * Append the submenu arrow to the element.
 * @param parent - The parent element.
 * @param config - The configuration.
 */
function appendSubmenuArrow(parent: HTMLElement, config: SubmenuArrowConfig): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASS_SUBMENU_ARROW;
  if (config.className) wrap.classList.add(config.className);
  const icon = config.icon ?? DEFAULT_SUBMENU_ARROW_SVG;
  const size = config.size ?? 14;
  const arrowStyles: Record<string, string> = {};
  if (config.opacity !== undefined) arrowStyles.opacity = String(config.opacity);
  const sizeCss = sizeToCss(size);
  arrowStyles.width = sizeCss;
  arrowStyles.height = sizeCss;
  arrowStyles.minWidth = sizeCss;
  arrowStyles.minHeight = sizeCss;
  if (Object.keys(arrowStyles).length > 0) setStyles(wrap, arrowStyles);
  wrap.classList.add(CLASS_SUBMENU_ARROW_ICON);
  if (typeof icon === "string") {
    const tmp = document.createElement("div");
    tmp.innerHTML = icon;
    while (tmp.firstChild) wrap.appendChild(tmp.firstChild);
  } else wrap.appendChild(icon.cloneNode(true));
  parent.appendChild(wrap);
}

/**
 * Create the state item node.
 * @param item - The item.
 * @param type - The type.
 * @param callbacks - The callbacks.
 * @returns The state item node.
 */
function createStateItemNode(
  item: MenuItemCheckbox | MenuItemRadio,
  type: "checkbox" | "radio",
  callbacks: {
    close: (selectedItem?: MenuItem) => void;
    refreshContent?: () => void;
    getSpinnerOptions?: (it: MenuItem) => SpinnerConfig;
    onHoverFocus?: (el: HTMLElement) => void;
    onEnterParentItem?: (el: HTMLElement) => void;
    onItemHoverCallback?: (item: MenuItem, nativeEvent: MouseEvent | FocusEvent) => void;
    shortcutIcons?: Record<string, string | HTMLElement>;
    platform?: "mac" | "win" | "auto";
  }
): HTMLElement {
  const { close, refreshContent, getSpinnerOptions, onHoverFocus, onEnterParentItem, onItemHoverCallback, shortcutIcons, platform } = callbacks;

  let role: string;
  let itemClass: string;
  let indicatorBase: string;
  let indicatorCustom: string;
  let assignExtra: { _cmCheckbox?: MenuItemCheckbox; _cmRadio?: MenuItemRadio };
  if (type === "checkbox") {
    role = "menuitemcheckbox";
    itemClass = CLASS_ITEM_CHECKBOX;
    indicatorBase = CLASS_CHECK;
    indicatorCustom = CLASS_CHECK_CUSTOM;
    assignExtra = { _cmCheckbox: item as MenuItemCheckbox };
  } else {
    role = "menuitemradio";
    itemClass = CLASS_ITEM_RADIO;
    indicatorBase = CLASS_RADIO;
    indicatorCustom = CLASS_RADIO_CUSTOM;
    assignExtra = { _cmRadio: item as MenuItemRadio };
  }

  let el: HTMLElement;
  if (item.render) el = item.render(item as MenuItemCheckbox & MenuItemRadio);
  else {
    el = document.createElement("div");
    el.className = `${CLASS_ITEM} ${itemClass}`;
    addClasses(el, item.className, getVariantClass(item.variant), item.checked && CLASS_CHECKED);
    appendStateIndicator(el, item.checked, item.icon, item.uncheckedIcon, indicatorBase, indicatorCustom, item.checkedClassName, item.uncheckedClassName);
    appendItemContent(el, item.label, { icon: item.leadingIcon, shortcut: item.shortcut, shortcutIcons, platform });
  }

  assignCmItem(el, item, assignExtra);
  setAttrs(el, { role, "aria-checked": item.checked ? "true" : "false", tabindex: "-1" });
  setItemIdDisabled(el, item.id, item.disabled);
  if (item.loading) applyItemLoadingState(el, item, getSpinnerOptions);
  addItemHoverListeners(el, item, { onHoverFocus, onEnterParentItem, onItemHoverCallback });
  attachItemEvents(el, item.events);

  let handleTypeAction: (e: MouseEvent) => void;
  if (type === "checkbox") {
    const chk = item as MenuItemCheckbox;
    handleTypeAction = (e) => {
      if (!chk.onChange) return;
      chk.onChange({ item: chk, checked: !chk.checked, nativeEvent: e, close });
    };
  } else {
    const radioItem = item as MenuItemRadio;
    handleTypeAction = (e) => {
      if (!radioItem.onSelect) return;
      radioItem.onSelect({ item: radioItem, value: radioItem.value, nativeEvent: e, close });
    };
  }

  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.disabled || item.loading) return;
    handleTypeAction(e);
    refreshContent?.();
    if (item.closeOnAction !== false) close(item);
  });
  return el;
}

/**
 * Create the item node.
 * @param item - The item.
 * @param close - The function to close the menu.
 * @param triggerSubmenu - The function to trigger the submenu.
 * @param scheduleSubmenuOpen - The function to schedule the submenu open.
 * @param scheduleSubmenuClose - The function to schedule the submenu close.
 * @param onHoverFocus - The function to handle the hover focus.
 * @param onEnterParentItem - The function to handle the enter parent item.
 * @param submenuArrowConfig - The submenu arrow configuration.
 * @param refreshContent - The function to refresh the content.
 * @param onItemHoverCallback - The function to handle the item hover callback.
 * @param getSpinnerOptions - The function to get the spinner options.
 * @param shortcutIcons - The shortcut icons.
 * @param platform - The platform.
 * @returns The item node.
 */
function createItemNode(
  item: MenuItem,
  close: (selectedItem?: MenuItem) => void,
  triggerSubmenu: (item: MenuItemSubmenu, el: HTMLElement) => void,
  scheduleSubmenuOpen?: (sub: MenuItemSubmenu, el: HTMLElement) => void,
  scheduleSubmenuClose?: (triggerEl: HTMLElement) => void,
  onHoverFocus?: (el: HTMLElement) => void,
  onEnterParentItem?: (el: HTMLElement) => void,
  submenuArrowConfig?: SubmenuArrowConfig | null,
  refreshContent?: () => void,
  onItemHoverCallback?: (item: MenuItem, nativeEvent: MouseEvent | FocusEvent) => void,
  getSpinnerOptions?: (item: MenuItem) => SpinnerConfig,
  shortcutIcons?: Record<string, string | HTMLElement>,
  platform?: "mac" | "win" | "auto"
): HTMLElement | null {
  const arrowConfig = submenuArrowConfig ?? null;
  if ("visible" in item && item.visible === false) return null;

  if (item.type === "separator") {
    const el = document.createElement("div");
    el.setAttribute("role", "separator");
    el.className = CLASS_SEPARATOR;
    addClasses(el, item.className);
    if ("events" in item && item.events) attachItemEvents(el, item.events);
    return el;
  }

  if (item.type === "label") {
    const labelItem = item as MenuItemLabel;
    const el = document.createElement("div");
    el.setAttribute("role", "presentation");
    el.className = `${CLASS_ITEM} ${CLASS_ITEM_LABEL}`;
    addClasses(el, labelItem.className);
    setItemIdDisabled(el, labelItem.id);
    const labelSpan = document.createElement("span");
    labelSpan.className = CLASS_LABEL;
    labelSpan.textContent = labelItem.label;
    el.appendChild(labelSpan);
    if ("events" in labelItem && labelItem.events) attachItemEvents(el, labelItem.events);
    return el;
  }

  if (item.type === "checkbox" || item.type === "radio") {
    return createStateItemNode(
      item as MenuItemCheckbox | MenuItemRadio,
      item.type,
      { close, refreshContent, getSpinnerOptions, onHoverFocus, onEnterParentItem, onItemHoverCallback, shortcutIcons, platform }
    );
  }

  if (item.type === "submenu") {
    const sub = item as MenuItemSubmenu;
    const el = document.createElement("div");
    assignCmItem(el, sub, { _cmSubmenu: sub });
    setAttrs(el, { role: "menuitem", "aria-haspopup": "menu", "aria-expanded": "false", tabindex: "-1" });
    el.className = `${CLASS_ITEM} ${CLASS_SUBMENU_TRIGGER}`;
    addClasses(el, sub.className, getVariantClass(sub.variant));
    setItemIdDisabled(el, sub.id, sub.disabled);

    const label = document.createElement("span");
    label.className = CLASS_LABEL;
    label.textContent = sub.label;
    el.appendChild(label);
    if (sub.icon) appendIcon(el, sub.icon);
    if (sub.shortcut) appendShortcut(el, sub.shortcut, shortcutIcons, platform);
    if (sub.badge !== undefined) appendBadge(el, sub.badge);
    if (arrowConfig) appendSubmenuArrow(el, arrowConfig);

    addItemHoverListeners(el, sub, {
      onHoverFocus,
      onEnterParentItem,
      onItemHoverCallback,
      afterFire: () => {
        if (!sub.disabled) {
          if (scheduleSubmenuOpen) scheduleSubmenuOpen(sub, el);
          else triggerSubmenu(sub, el);
        }
      },
      onMouseLeave: scheduleSubmenuClose ? () => scheduleSubmenuClose(el) : undefined,
    });
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (sub.disabled) return;
      triggerSubmenu(sub, el);
    });
    attachItemEvents(el, sub.events);
    return el;
  }

  if (item.type === "link") {
    const linkItem = item as MenuItemLink;
    const el = document.createElement("a");
    el.className = CLASS_ITEM;
    addClasses(el, linkItem.className, getVariantClass(linkItem.variant));
    if (!linkItem.disabled) {
      el.href = linkItem.href;
      if (linkItem.target) el.target = linkItem.target;
      if (linkItem.rel) el.rel = linkItem.rel;
    }
    appendItemContent(el, linkItem.label, { icon: linkItem.icon, shortcut: linkItem.shortcut, badge: linkItem.badge, shortcutIcons, platform });
    assignCmItem(el, linkItem);
    setAttrs(el, { role: "menuitem", tabindex: "-1" });
    setItemIdDisabled(el, linkItem.id, linkItem.disabled);
    if (linkItem.loading) applyItemLoadingState(el, linkItem, getSpinnerOptions);
    addItemHoverListeners(el, linkItem, { onHoverFocus, onEnterParentItem, onItemHoverCallback });
    el.addEventListener("click", (e) => {
      if (linkItem.disabled || linkItem.loading) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier) {
        close(linkItem);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (linkItem.target === "_blank") {
        window.open(linkItem.href, "_blank", linkItem.rel ? `rel=${linkItem.rel}` : undefined);
      } else window.location.href = linkItem.href;
      close(linkItem);
    });
    attachItemEvents(el, linkItem.events);
    return el;
  }

  const action = item as MenuItemAction;
  let el: HTMLElement;
  if (action.render) el = action.render(action);
  else {
    el = document.createElement("div");
    el.className = CLASS_ITEM;
    addClasses(el, action.className, getVariantClass(action.variant));
    appendItemContent(el, action.label, { icon: action.icon, shortcut: action.shortcut, badge: action.badge, shortcutIcons, platform });
  }
  assignCmItem(el, action);
  setAttrs(el, { role: "menuitem", tabindex: "-1" });
  setItemIdDisabled(el, action.id, action.disabled);
  if (action.loading) applyItemLoadingState(el, action, getSpinnerOptions);
  addItemHoverListeners(el, action, { onHoverFocus, onEnterParentItem, onItemHoverCallback });
  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (action.disabled || action.loading || !action.onClick) return;
    const event: MenuClickEvent = {
      item: action,
      nativeEvent: e,
      close,
    };
    action.onClick(event);
    if (action.closeOnAction !== false) close(action);
  });
  attachItemEvents(el, action.events);
  return el;
}

/**
 * Get the focusable items.
 * @param menuEl - The menu element.
 * @returns The focusable items.
 */
function getFocusableItems(menuEl: HTMLElement): HTMLElement[] {
  return Array.from(
    menuEl.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([aria-disabled='true']), [role='menuitemcheckbox']:not([aria-disabled='true']), [role='menuitemradio']:not([aria-disabled='true'])"
    )
  );
}

/**
 * Set the roving tabindex.
 * @param items - The items.
 * @param focusedIndex - The focused index.
 */
function setRovingTabindex(items: HTMLElement[], focusedIndex: number): void {
  items.forEach((node, i) => {
    node.setAttribute("tabindex", i === focusedIndex ? "0" : "-1");
  });
  if (items[focusedIndex]) items[focusedIndex].focus();
}

/**
 * Clear the roving focus.
 * @param menuEl - The menu element.
 */
function clearRovingFocus(menuEl: HTMLElement | null): void {
  if (!menuEl) return;
  const items = getFocusableItems(menuEl);
  items.forEach((node) => node.setAttribute("tabindex", "-1"));
  menuEl.focus();
}

/**
 * Make the hover focus handler.
 * @param menuEl - The menu element.
 * @returns The hover focus handler.
 */
function makeHoverFocusHandler(menuEl: HTMLElement): (el: HTMLElement) => void {
  return (el: HTMLElement) => {
    const items = getFocusableItems(menuEl);
    const idx = items.indexOf(el);
    if (idx >= 0) setRovingTabindex(items, idx);
  };
}

/**
 * Deep clone the menu.
 * @param items - The items.
 * @returns The deep cloned menu.
 */
function deepCloneMenu(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    const clone = { ...item } as MenuItem;
    if ("children" in clone && clone.type === "submenu") {
      const subChildren = (clone as MenuItemSubmenu).children;
      (clone as MenuItemSubmenu).children = Array.isArray(subChildren)
        ? deepCloneMenu(subChildren)
        : subChildren;
    }
    return clone;
  });
}

/**
 * Get the coordinates from the anchor.
 * @param anchor - The anchor.
 * @returns The coordinates.
 */
function getCoordsFromAnchor(anchor: { x: number; y: number } | DOMRect): { x: number; y: number } {
  if ("width" in anchor && "height" in anchor) {
    const rect = anchor as DOMRect;
    return { x: rect.left + rect.width / 2, y: rect.top };
  }
  return anchor as { x: number; y: number };
}

/**
 * Get the variant class.
 * @param variant - The variant.
 * @returns The variant class.
 */
function getVariantClass(variant: MenuItemVariant | undefined): string | null {
  if (!variant) return null;
  return `${ID_PREFIX}item--${variant.trim()}`;
}

/**
 * Normalize the key for the shortcut.
 * @param key - The key.
 * @returns The normalized key.
 */
function normalizeKeyForShortcut(key: string): string {
  if (key.length === 1) return key.toLowerCase();
  return key;
}

/**
 * Check if the shortcut matches the event.
 * @param shortcut - The shortcut.
 * @param e - The event.
 * @returns True if the shortcut matches the event, false otherwise.
 */
function shortcutMatchesEvent(shortcut: string, e: KeyboardEvent): boolean {
  const parts = shortcut.split("+").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;

  const keyPart = parts[parts.length - 1] ?? "";
  if (normalizeKeyForShortcut(keyPart) !== normalizeKeyForShortcut(e.key)) return false;

  const mods = parts.slice(0, -1).map((p) => p.toLowerCase());
  const wantsCtrlOrCmd = mods.includes("ctrl") || mods.includes("cmd");

  if (wantsCtrlOrCmd) {
    const useCmd = isMacLikePlatform();
    const correctPressed = useCmd ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
    if (!correctPressed) return false;
  } else if (e.ctrlKey || e.metaKey) {
    return false;
  }

  const modifierMatches = (modName: string, pressed: boolean): boolean =>
    mods.includes(modName) ? pressed : !pressed;
  if (!modifierMatches("alt", e.altKey)) return false;
  if (!modifierMatches("shift", e.shiftKey)) return false;
  return true;
}

/**
 * Apply the theme to the element.
 * @param el - The element.
 * @param theme - The theme.
 */
function applyThemeToElement(el: HTMLElement, theme: ContextMenuConfig["theme"]): void {
  const prevClass = el.getAttribute(THEME_CLASS_DATA_ATTR);
  if (prevClass) {
    prevClass.trim().split(/\s+/).forEach((c) => el.classList.remove(c));
  }
  el.removeAttribute(THEME_CLASS_DATA_ATTR);
  if (theme?.class) {
    addClasses(el, ...theme.class.trim().split(/\s+/).filter(Boolean));
    el.setAttribute(THEME_CLASS_DATA_ATTR, theme.class);
  }
  if (theme?.tokens) {
    const tokens: Record<string, string> = {};
    for (const [key, value] of Object.entries(theme.tokens)) {
      tokens[key.startsWith("--") ? key : CSS_VAR_PREFIX + key] = value;
    }
    setStyles(el, tokens);
  }
}

/**
 * Cancel the leave animation.
 * @param state - The state.
 */
function cancelLeaveAnimation(state: ContextMenuState): void {
  if (state.leaveTimeout) {
    clearTimeout(state.leaveTimeout);
    state.leaveTimeout = null;
  }
  if (state.leaveTransitionHandler) {
    state.root.removeEventListener("transitionend", state.leaveTransitionHandler);
    state.leaveTransitionHandler = null;
  }
  state.root.classList.remove(ROOT_LEAVE_CLASS);
}

/**
 * On fully closed.
 * @param state - The state.
 */
function onFullyClosed(state: ContextMenuState): void {
  OPEN_MENU_INSTANCES.delete(state.self);
  state.openPromiseResolve?.(state.lastSelectedItem);
  state.openPromiseResolve = null;
  state.closePromiseResolve?.();
  state.closePromiseResolve = null;
}

/**
 * Perform the root close.
 * @param state - The state.
 */
function performRootClose(state: ContextMenuState): void {
  const anim = state.currentConfig.animation;
  const rawLeave = anim?.leave ?? 80;
  const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);
  const closeContext: CloseContext = { selectedItem: state.lastSelectedItem, anchor: state.lastAnchor };

  if (leaveMs > 0 && !anim?.disabled) {
    state.root.classList.remove(ROOT_OPEN_CLASS);
    state.root.classList.add(ROOT_LEAVE_CLASS);
    const onEnd = (): void => {
      if (state.leaveTimeout) clearTimeout(state.leaveTimeout);
      state.leaveTimeout = null;
      if (state.leaveTransitionHandler) {
        state.root.removeEventListener("transitionend", state.leaveTransitionHandler);
        state.leaveTransitionHandler = null;
      }
      state.root.classList.remove(ROOT_LEAVE_CLASS);
      setStyles(state.root, { display: "none" });
      state.wrapper.remove();
      onFullyClosed(state);
      state.currentConfig.onClose?.(closeContext);
      state.currentConfig.onAfterClose?.(closeContext);
      if (state.lastFocusTarget && typeof state.lastFocusTarget.focus === "function") state.lastFocusTarget.focus();
    };
    state.leaveTransitionHandler = onEnd;
    state.root.addEventListener("transitionend", onEnd, { once: true });
    state.leaveTimeout = setTimeout(onEnd, leaveMs + 50);
  } else {
    setStyles(state.root, { display: "none" });
    state.wrapper.remove();
    onFullyClosed(state);
    state.currentConfig.onClose?.(closeContext);
    state.currentConfig.onAfterClose?.(closeContext);
    if (state.lastFocusTarget && typeof state.lastFocusTarget.focus === "function") state.lastFocusTarget.focus();
  }
}

/**
 * Close the submenu with animation.
 * @param panel - The panel element.
 * @param trigger - The trigger element.
 * @param state - The state.
 * @param options - The options.
 */
function closeSubmenuWithAnimation(
  panel: HTMLElement,
  trigger: HTMLElement,
  state: ContextMenuState,
  options: { clearOpenSubmenu?: boolean; onDone?: () => void } = {}
): void {
  const { clearOpenSubmenu = true, onDone } = options;
  const anim = state.currentConfig.animation;
  const rawLeave = anim?.leave ?? 80;
  const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);

  const finish = (): void => {
    panel.remove();
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove(SUBMENU_OPEN_CLASS);
    if (clearOpenSubmenu) {
      const idx = state.openSubmenus.findIndex((e) => e.panel === panel);
      if (idx >= 0) state.openSubmenus.splice(idx, 1);
    }
    onDone?.();
  };

  if (leaveMs <= 0 || anim?.disabled) {
    finish();
    return;
  }

  panel.classList.remove(ROOT_OPEN_CLASS);
  panel.classList.add(ROOT_LEAVE_CLASS);
  let done = false;
  const onEnd = (): void => {
    if (done) return;
    done = true;
    panel.removeEventListener("transitionend", onEnd);
    if (t) clearTimeout(t);
    finish();
  };
  panel.addEventListener("transitionend", onEnd, { once: true });
  const t = setTimeout(onEnd, leaveMs + 50);
}

/**
 * Perform the real close.
 * @param state - The state.
 * @returns The promise to resolve the close.
 */
function realClose(state: ContextMenuState): Promise<void> {
  return new Promise((resolve) => {
    (async () => {
      const allow = await Promise.resolve(state.currentConfig.onBeforeClose?.());
      if (allow === false) {
        resolve();
        return;
      }
      if (!state.isOpen) {
        resolve();
        return;
      }
      state.closePromiseResolve = resolve;
      disableScrollLock(state);
      state.isOpen = false;
      if (state.outsideClickHandler) {
        document.removeEventListener("mousedown", state.outsideClickHandler, true);
        state.outsideClickHandler = null;
      }
      if (state.resizeHandler) {
        window.removeEventListener("resize", state.resizeHandler);
        state.resizeHandler = null;
      }
      cancelLeaveAnimation(state);
      if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
      state.submenuHoverTimer = null;

      if (state.openSubmenus.length > 0) {
        const toClose = state.openSubmenus.slice();
        state.openSubmenus.length = 0;
        let idx = toClose.length - 1;
        const closeNext = (): void => {
          if (idx < 0) {
            performRootClose(state);
            return;
          }
          const { panel, trigger } = toClose[idx];
          idx--;
          closeSubmenuWithAnimation(panel, trigger, state, { clearOpenSubmenu: false, onDone: closeNext });
        };
        closeNext();
        return;
      }
      performRootClose(state);
    })();
  });
}

/**
 * Open the submenu panel.
 * @param state - The state.
 * @param sub - The submenu.
 * @param triggerEl - The trigger element.
 * @returns The promise to resolve the open.
 */
async function openSubmenuPanel(state: ContextMenuState, sub: MenuItemSubmenu, triggerEl: HTMLElement): Promise<void> {
  let containIndex = -1;
  if (state.root.contains(triggerEl)) containIndex = -1;
  else {
    for (let i = 0; i < state.openSubmenus.length; i++) {
      if (!state.openSubmenus[i].panel.contains(triggerEl)) continue;
      containIndex = i;
      break;
    }
  }
  for (let j = state.openSubmenus.length - 1; j > containIndex; j--) {
    const { panel: p, trigger: t } = state.openSubmenus[j];
    state.closeSubmenuWithAnimation(p, t, { clearOpenSubmenu: true });
  }
  const resolvedChildren = await resolveSubmenuChildren(sub.children);
  const panel = document.createElement("div");
  setAttrs(panel, { role: "menu", "aria-label": sub.label, "aria-orientation": "vertical", tabindex: "-1" });
  panel.className = `${ROOT_CLASS} ${CLASS_SUBMENU}`;
  panel.addEventListener("mouseenter", state.cancelSubmenuClose);
  applyThemeToElement(panel, state.currentConfig.theme);
  applyAnimationConfig(panel, state.currentConfig);
  const step = state.currentConfig.position?.submenuZIndexStep ?? 0;
  const base = state.currentConfig.position?.zIndexBase ?? 9999;
  if (step > 0) setStyles(panel, { zIndex: String(base + (state.openSubmenus.length + 1) * step) });

  resolvedChildren.forEach((child) => {
    const node = createItemNode(child, state.closeWithSelection, (subItem, el) => void state.openSubmenuPanel(subItem as MenuItemSubmenu, el), state.scheduleSubmenuOpen, state.scheduleSubmenuClose, state.makeHoverFocusHandler(panel), state.onEnterMenuItem, state.submenuArrowConfig, state.refreshContent, (it, ev) => state.currentConfig.onItemHover?.({ item: it, nativeEvent: ev }), state.getSpinnerOptions, state.currentConfig.shortcutIcons, state.currentConfig.platform);
    if (node) panel.appendChild(node);
  });

  state.wrapper.appendChild(panel);
  const triggerRect = triggerEl.getBoundingClientRect();
  const padding = state.currentConfig.position?.padding ?? 8;
  const { vw, vh } = getViewportSize();
  const isRtl = getComputedStyle(triggerEl).direction === "rtl";
  const placement = sub.submenuPlacement ?? state.currentConfig.submenuPlacement ?? "auto";
  setStyles(panel, { display: "" });
  panel.getClientRects();
  const rect = panel.getBoundingClientRect();
  let left: number;
  if (placement === "left") {
    left = triggerRect.left - rect.width - 2;
    if (left < padding) left = triggerRect.right + 2;
  } else if (placement === "right") {
    left = triggerRect.right + 2;
    if (left + rect.width > vw - padding) left = triggerRect.left - rect.width - 2;
  } else {
    if (isRtl) {
      left = triggerRect.left - rect.width - 2;
      if (left < padding) left = triggerRect.right + 2;
    } else {
      left = triggerRect.right + 2;
      if (left + rect.width > vw - padding) left = triggerRect.left - rect.width - 2;
    }
  }
  let top = triggerRect.top;
  if (top + rect.height > vh - padding) top = vh - rect.height - padding;
  if (top < padding) top = padding;
  setStyles(panel, { left: `${left}px`, top: `${top}px` });

  triggerEl.setAttribute("aria-expanded", "true");
  triggerEl.classList.add(SUBMENU_OPEN_CLASS);
  state.openSubmenus.push({ panel, trigger: triggerEl });

  requestAnimationFrame(() => panel.classList.add(ROOT_OPEN_CLASS));
}

/**
 * Schedule the submenu open.
 * @param state - The state.
 * @param sub - The submenu.
 * @param triggerEl - The trigger element.
 */
function scheduleSubmenuOpen(state: ContextMenuState, sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
  const top = state.openSubmenus[state.openSubmenus.length - 1];
  if (top && top.trigger === triggerEl) {
    triggerEl.focus();
    return;
  }
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.submenuHoverTimer = setTimeout(() => {
    state.submenuHoverTimer = null;
    const currentTop = state.openSubmenus[state.openSubmenus.length - 1];
    if (currentTop && currentTop.trigger === triggerEl) return;
    void state.openSubmenuPanel(sub, triggerEl);
  }, SUBMENU_HOVER_DELAY_MS);
}

/**
 * Schedule the submenu close.
 * @param state - The state.
 * @param triggerEl - The trigger element.
 */
function scheduleSubmenuClose(state: ContextMenuState, triggerEl: HTMLElement): void {
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.submenuHoverTimer = setTimeout(() => {
    state.submenuHoverTimer = null;
    const idx = state.openSubmenus.findIndex((e) => e.trigger === triggerEl);
    if (idx < 0) return;
    for (let j = state.openSubmenus.length - 1; j >= idx; j--) {
      const { panel, trigger } = state.openSubmenus[j];
      state.closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true });
    }
  }, SUBMENU_CLOSE_DELAY_MS);
}

/**
 * Cancel the submenu close.
 * @param state - The state.
 */
function cancelSubmenuClose(state: ContextMenuState): void {
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.submenuHoverTimer = null;
}

/**
 * On enter menu item.
 * @param state - The state.
 * @param el - The element.
 */
function onEnterMenuItem(state: ContextMenuState, el: HTMLElement): void {
  if (state.openSubmenus.length === 0) return;
  state.cancelSubmenuClose();
  const menuEl = el.closest(MENU_ROLE_SELECTOR) as HTMLElement | null;
  if (!menuEl) return;
  let levelIndex = -1;
  if (menuEl !== state.root) {
    for (let i = 0; i < state.openSubmenus.length; i++) {
      if (state.openSubmenus[i].panel !== menuEl) continue;
      levelIndex = i;
      break;
    }
  }
  for (let j = state.openSubmenus.length - 1; j > levelIndex; j--) {
    const { panel, trigger } = state.openSubmenus[j];
    state.closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true });
  }
}

/**
 * Refresh the content.
 * @param state - The state.
 */
function refreshContent(state: ContextMenuState): void {
  if (!state.isOpen || typeof state.currentConfig.menu !== "function") return;
  state.menu = state.currentConfig.menu().map(normalizeItem);
  state.buildRootContent();
}

/**
 * Get the spinner options.
 * @param state - The state.
 * @param it - The item.
 * @returns The spinner options.
 */
function getSpinnerOptions(state: ContextMenuState, it: MenuItem): SpinnerConfig {
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
 * Build the root content.
 * @param state - The state.
 */
function buildRootContent(state: ContextMenuState): void {
  state.root.innerHTML = "";
  state.menu.forEach((item) => {
    const node = createItemNode(item, state.closeWithSelection, state.triggerSubmenu, state.scheduleSubmenuOpen, state.scheduleSubmenuClose, state.makeHoverFocusHandler(state.root), (el) => state.onEnterMenuItem(el), state.submenuArrowConfig, state.refreshContent, (it, ev) => state.currentConfig.onItemHover?.({ item: it, nativeEvent: ev }), state.getSpinnerOptions, state.currentConfig.shortcutIcons, state.currentConfig.platform);
    if (node) state.root.appendChild(node);
  });
}

/**
 * Open the implementation.
 * @param state - The state.
 * @param xOrEvent - The x or event.
 * @param y - The y coordinate.
 * @returns The promise to resolve the open.
 */
function openImpl(state: ContextMenuState, xOrEvent?: number | MouseEvent, y?: number): Promise<MenuItem | undefined> {
  return new Promise((resolve) => {
    state.openPromiseResolve = resolve;
    (async () => {
      if (typeof state.currentConfig.menu === "function") {
        state.menu = state.currentConfig.menu().map(normalizeItem);
      }
      const openEvent = typeof xOrEvent === "object" && xOrEvent !== null ? xOrEvent : undefined;
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
        state.root.classList.add(ROOT_OPEN_CLASS);
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
 * Handle the keydown event.
 * @param state - The state.
 * @param e - The event.
 */
function handleKeydown(state: ContextMenuState, e: KeyboardEvent): void {
  const target = e.target as HTMLElement;
  const menuEl = target.closest(MENU_ROLE_SELECTOR) as HTMLElement;
  if (!menuEl) return;
  const isSub = menuEl.classList.contains(CLASS_SUBMENU);
  const items = getFocusableItems(menuEl);
  let idx = items.indexOf(target);
  if (idx === -1) {
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setRovingTabindex(items, 0);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setRovingTabindex(items, items.length - 1);
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown": {
      e.preventDefault();
      setRovingTabindex(items, (idx + 1) % items.length);
      break;
    }
    case "ArrowUp": {
      e.preventDefault();
      setRovingTabindex(items, idx === 0 ? items.length - 1 : idx - 1);
      break;
    }
    case "ArrowRight": {
      e.preventDefault();
      const sub = getCmSubmenu(target);
      if (sub) void state.openSubmenuPanel(sub, target);
      break;
    }
    case "ArrowLeft": {
      e.preventDefault();
      if (isSub && state.openSubmenus.length > 0) {
        const { panel, trigger } = state.openSubmenus[state.openSubmenus.length - 1];
        state.closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true, onDone: () => trigger.focus() });
      } else void state.realClose();
      break;
    }
    case "Enter":
    case " ": {
      e.preventDefault();
      const sub = getCmSubmenu(target);
      if (sub) void state.openSubmenuPanel(sub, target);
      else target.click();
      break;
    }
    case "Escape": {
      e.preventDefault();
      if (isSub && state.openSubmenus.length > 0) {
        const { panel, trigger } = state.openSubmenus[state.openSubmenus.length - 1];
        state.closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true, onDone: () => trigger.focus() });
      } else void state.realClose();
      break;
    }
    case "Home": {
      e.preventDefault();
      setRovingTabindex(items, 0);
      break;
    }
    case "End": {
      e.preventDefault();
      setRovingTabindex(items, items.length - 1);
      break;
    }
    default: {
      const itemWithShortcut = items.find((el) => {
        const it = getCmItem(el);
        if (!it || !("shortcut" in it) || !it.shortcut) return false;
        return shortcutMatchesEvent(it.shortcut, e);
      });
      if (itemWithShortcut) {
        e.preventDefault();
        const sub = getCmSubmenu(itemWithShortcut);
        if (sub) {
          void state.openSubmenuPanel(sub, itemWithShortcut);
          requestAnimationFrame(() => {
            const last = state.openSubmenus[state.openSubmenus.length - 1];
            if (!last) return;
            const subItems = getFocusableItems(last.panel);
            if (subItems.length) setRovingTabindex(subItems, 0);
          });
        } else itemWithShortcut.click();
      }
      break;
    }
  }
}

/**
 * Clear the long press timer.
 * @param state - The state.
 */
function clearLongPressTimer(state: ContextMenuState): void {
  if (!state.longPressTimer) return;
  clearTimeout(state.longPressTimer);
  state.longPressTimer = null;
}

/**
 * Unbind the element.
 * @param state - The state.
 * @param el - The element.
 */
function unbind(state: ContextMenuState, el?: HTMLElement): void {
  if (el != null && state.boundElement !== el) return;
  if (!state.boundElement) return;
  clearLongPressTimer(state);
  if (state.boundContextmenu) state.boundElement.removeEventListener("contextmenu", state.boundContextmenu);
  if (state.boundTouchstart) state.boundElement.removeEventListener("touchstart", state.boundTouchstart);
  state.boundElement.removeEventListener("touchend", state.boundTouchEndOrCancel);
  state.boundElement.removeEventListener("touchcancel", state.boundTouchEndOrCancel);
  state.boundElement = null;
  state.boundContextmenu = null;
  state.boundTouchstart = null;
}

/**
 * Bind the element.
 * @param state - The state.
 * @param el - The element.
 * @param options - The options.
 */
function bind(state: ContextMenuState, el: HTMLElement, options?: BindOptions): void {
  unbind(state);
  const longPressMs = options?.longPressMs ?? DEFAULT_LONG_PRESS_MS;
  state.boundContextmenu = (e: MouseEvent): void => {
    e.preventDefault();
    if ("pointerType" in e && (e as PointerEvent).pointerType === "touch") return;
    openImpl(state, e);
  };
  state.boundTouchstart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    clearLongPressTimer(state);
    state.longPressX = e.touches[0].clientX;
    state.longPressY = e.touches[0].clientY;
    state.longPressTimer = setTimeout(() => {
      state.longPressTimer = null;
      openImpl(state, state.longPressX, state.longPressY);
    }, longPressMs);
  };
  state.boundTouchEndOrCancel = (): void => clearLongPressTimer(state);
  el.addEventListener("contextmenu", state.boundContextmenu);
  el.addEventListener("touchstart", state.boundTouchstart, { passive: true });
  el.addEventListener("touchend", state.boundTouchEndOrCancel, { passive: true });
  el.addEventListener("touchcancel", state.boundTouchEndOrCancel, { passive: true });
  state.boundElement = el;
}

/**
 * Destroy the state.
 * @param state - The state.
 */
function destroy(state: ContextMenuState): void {
  unbind(state);
  if (state.outsideClickHandler) {
    document.removeEventListener("mousedown", state.outsideClickHandler, true);
    state.outsideClickHandler = null;
  }
  if (state.resizeHandler) {
    window.removeEventListener("resize", state.resizeHandler);
    state.resizeHandler = null;
  }
  disableScrollLock(state);
  if (state.leaveTimeout) clearTimeout(state.leaveTimeout);
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.wrapper.remove();
  state.wrapper.removeEventListener("keydown", state._keydownHandler);
}

/**
 * Set the menu.
 * @param state - The state.
 * @param newMenu - The new menu.
 */
function setMenu(state: ContextMenuState, newMenu: MenuItem[]): void {
  state.menu = newMenu.map(normalizeItem);
  if (state.isOpen) state.buildRootContent();
}

/**
 * Set the theme.
 * @param state - The state.
 * @param theme - The theme.
 */
function setTheme(state: ContextMenuState, theme: ContextMenuConfig["theme"]): void {
  state.currentConfig.theme = theme;
  applyThemeToElement(state.root, theme);
  for (const { panel } of state.openSubmenus) applyThemeToElement(panel, theme);
}

/**
 * Set the position.
 * @param state - The state.
 * @param position - The position.
 */
function setPosition(state: ContextMenuState, position: ContextMenuConfig["position"]): void {
  state.currentConfig.position = position;
}

/**
 * Set the animation.
 * @param state - The state.
 * @param animation - The animation.
 */
function setAnimation(state: ContextMenuState, animation: ContextMenuConfig["animation"]): void {
  state.currentConfig.animation = animation;
  applyAnimationConfig(state.root, state.currentConfig);
  for (const { panel } of state.openSubmenus) applyAnimationConfig(panel, state.currentConfig);
}

/**
 * Set lockScrollOutside at runtime.
 * @param state - The state.
 * @param lock - Whether to lock scroll outside while open.
 */
function setLockScrollOutside(state: ContextMenuState, lock: boolean): void {
  state.currentConfig.lockScrollOutside = lock;
  if (!state.isOpen) return;
  if (lock) enableScrollLock(state);
  else disableScrollLock(state);
}

/**
 * Open the menu at an element.
 * @param state - The state.
 * @param element - The element.
 * @param options - The options.
 */
function openAtElement(state: ContextMenuState, element: HTMLElement, options?: OpenAtElementOptions): void {
  const offset = options?.offset ?? { x: 0, y: 0 };
  const rect = element.getBoundingClientRect();
  let placement: Placement = options?.placement ?? "bottom-start";
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
    placement = `${vertical}-${startOrEnd}` as Placement;
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
  openImpl(state, x + offset.x, y + offset.y);
}

/**
 * Create the instance.
 * @param state - The state.
 * @returns The instance.
 */
function createInstance(state: ContextMenuState): ContextMenuInstance {
  return {
    open: (xOrEvent?: number | MouseEvent, y?: number) => openImpl(state, xOrEvent, y),
    close: () => state.realClose(),
    toggle(x?, y?) {
      if (state.isOpen) void state.realClose();
      else void openImpl(state, x ?? 0, y ?? 0);
    },
    openAtElement: (element, options?) => openAtElement(state, element, options),
    isOpen: () => state.isOpen,
    getAnchor: () => state.lastAnchor,
    getMenu: () => deepCloneMenu(state.menu),
    getRootElement: () => state.wrapper,
    updateMenu: (updater) => setMenu(state, updater(deepCloneMenu(state.menu))),
    bind: (el, options?) => bind(state, el, options),
    unbind: (el?) => unbind(state, el),
    destroy: () => destroy(state),
    setMenu: (newMenu) => setMenu(state, newMenu),
    setTheme: (theme) => setTheme(state, theme),
    setPosition: (position) => setPosition(state, position),
    setAnimation: (animation) => setAnimation(state, animation),
    setLockScrollOutside: (lock) => setLockScrollOutside(state, lock),
  };
}

/**
 * Create the context menu.
 * @param config - The configuration.
 * @returns The context menu instance.
 */
export function createContextMenu(config: ContextMenuConfig): ContextMenuInstance {
  const currentConfig = { ...config };
  const rawMenu = typeof currentConfig.menu === "function" ? currentConfig.menu() : (currentConfig.menu ?? []);
  const menu = rawMenu.map(normalizeItem);
  const portal = getPortal(currentConfig.portal);
  const wrapper = document.createElement("div");
  wrapper.className = CLASS_WRAPPER;
  const root = document.createElement("div");
  setAttrs(root, { role: "menu", "aria-orientation": "vertical", tabindex: "-1" });
  root.className = ROOT_CLASS;
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
    leaveTimeout: null,
    leaveTransitionHandler: null,
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
    makeHoverFocusHandler: null!,
    onEnterMenuItem: null!,
    triggerSubmenu: null!,
    _keydownHandler: null!,
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
  state.buildRootContent = () => buildRootContent(state);
  state.refreshContent = () => refreshContent(state);
  state.getSpinnerOptions = (it) => getSpinnerOptions(state, it);
  state.makeHoverFocusHandler = makeHoverFocusHandler;
  state.onEnterMenuItem = (el) => onEnterMenuItem(state, el);
  state.triggerSubmenu = (sub, triggerEl) => void state.openSubmenuPanel(sub, triggerEl);

  state._keydownHandler = (e: KeyboardEvent) => handleKeydown(state, e);
  wrapper.addEventListener("keydown", state._keydownHandler);

  const bindConfig = currentConfig.bind;
  if (bindConfig != null) {
    const el = bindConfig instanceof HTMLElement ? bindConfig : bindConfig.element;
    bind(state, el, bindConfig instanceof HTMLElement ? undefined : bindConfig.options);
  }

  return createInstance(state);
}
