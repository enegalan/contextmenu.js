import type { BadgeConfig, ContextMenuConfig, EventRegistry, MenuItem, MenuItemAction, MenuItemCheckbox, MenuItemLabel, MenuItemLink, MenuItemRadio, MenuItemSubmenu, MenuClickEvent, SpinnerConfig, SubmenuArrowConfig } from "../lib/types.js";
import { CLASSES, CSS_VARS, CM_ITEM_KEY, CM_SUBMENU_KEY, DEFAULT_SPINNER_SPEED_MS, DEFAULT_SUBMENU_ARROW_SVG, MENU_ROLE_SELECTOR, WIN_MODIFIER_SYMBOLS } from "../lib/constants.js";
import { addClasses, setAttrs, setStyles, sizeToCss, getVariantClass, getShortcutParts } from "../utils/index.js";

/**
 * Gets the cm item from an element.
 * @param el - The element to get the cm item from.
 * @returns The cm item from the element.
 */
export function getCmItem(el: HTMLElement): MenuItem | undefined {
  const o = el as unknown as Record<string, unknown>;
  const sub = o[CM_SUBMENU_KEY] as MenuItemSubmenu | undefined;
  return sub ?? (o[CM_ITEM_KEY] as MenuItem | undefined);
}

/**
 * Gets the cm submenu from an element.
 * @param el - The element to get the cm submenu from.
 * @returns The cm submenu from the element.
 */
export function getCmSubmenu(el: HTMLElement): MenuItemSubmenu | undefined {
  return (el as unknown as Record<string, unknown>)[CM_SUBMENU_KEY] as MenuItemSubmenu | undefined;
}

/**
 * Normalizes the submenu arrow configuration.
 * @param value - The value to normalize.
 * @returns The normalized submenu arrow configuration.
 */
export function normalizeSubmenuArrow(value: ContextMenuConfig["submenuArrow"]): SubmenuArrowConfig | null {
  if (value === false || value === undefined) return null;
  if (value === true) return { icon: DEFAULT_SUBMENU_ARROW_SVG, size: 14 };
  return value;
}

/**
 * Creates a menu item node.
 * @param item - The item to create the item node for.
 * @param close - The function to close the menu.
 * @param openSubmenuPanel - The function to open the submenu panel.
 * @param scheduleSubmenuOpen - The function to schedule the submenu open.
 * @param scheduleSubmenuClose - The function to schedule the submenu close.
 * @param onHoverFocus - The function to handle the hover focus.
 * @param onEnterParentItem - The function to handle the enter parent item.
 * @param submenuArrowConfig - The configuration for the submenu arrow.
 * @param refreshContent - The function to refresh the content.
 * @param onItemHoverCallback - The function to handle the item hover callback.
 * @param getSpinnerOptions - The function to get the spinner options.
 * @param shortcutIcons - The icons for the shortcut.
 * @param platform - The platform.
 * @param clearRovingFocus - The function to clear the roving focus.
 * @returns The menu item node.
 */
export function createItemNode(
  item: MenuItem,
  close: (selectedItem?: MenuItem) => void,
  openSubmenuPanel: (item: MenuItemSubmenu, el: HTMLElement) => void,
  scheduleSubmenuOpen?: (sub: MenuItemSubmenu, el: HTMLElement) => void,
  scheduleSubmenuClose?: (triggerEl: HTMLElement) => void,
  onHoverFocus?: (el: HTMLElement) => void,
  onEnterParentItem?: (el: HTMLElement) => void,
  submenuArrowConfig?: SubmenuArrowConfig | null,
  refreshContent?: () => void,
  onItemHoverCallback?: (item: MenuItem, nativeEvent: MouseEvent | FocusEvent) => void,
  getSpinnerOptions?: (item: MenuItem) => SpinnerConfig,
  shortcutIcons?: Record<string, string | HTMLElement>,
  platform?: "mac" | "win" | "auto",
  clearRovingFocus?: (menuEl: HTMLElement | null) => void
): HTMLElement | null {
  const arrowConfig = submenuArrowConfig ?? null;
  if ("visible" in item && item.visible === false) return null;

  if (item.type === "separator") {
    const el = document.createElement("div");
    el.setAttribute("role", "separator");
    el.className = CLASSES.SEPARATOR;
    addClasses(el, item.className);

    if ("events" in item && item.events) _attachItemEvents(el, item.events);
    return el;
  }

  if (item.type === "label") {
    const labelItem = item as MenuItemLabel;
    const el = document.createElement("div");
    el.setAttribute("role", "presentation");
    el.className = `${CLASSES.ITEM} ${CLASSES.ITEM_LABEL}`;
    addClasses(el, labelItem.className);
    _setItemIdDisabled(el, labelItem.id);
    const labelSpan = document.createElement("span");
    labelSpan.className = CLASSES.LABEL;
    labelSpan.textContent = labelItem.label;
    el.appendChild(labelSpan);

    if ("events" in labelItem && labelItem.events) _attachItemEvents(el, labelItem.events);
    return el;
  }

  if (item.type === "checkbox" || item.type === "radio") {
    return _createStateItemNode(
      item as MenuItemCheckbox | MenuItemRadio,
      item.type,
      { close, refreshContent, getSpinnerOptions, onHoverFocus, onEnterParentItem, onItemHoverCallback, shortcutIcons, platform, clearRovingFocus }
    );
  }

  if (item.type === "submenu") {
    const sub = item as MenuItemSubmenu;
    const el = document.createElement("div");
    _assignCmItem(el, sub, { _cmSubmenu: sub });
    setAttrs(el, { role: "menuitem", "aria-haspopup": "menu", "aria-expanded": "false", tabindex: "-1" });
    el.className = `${CLASSES.ITEM} ${CLASSES.SUBMENU_TRIGGER}`;
    addClasses(el, sub.className, getVariantClass(sub.variant));
    _setItemIdDisabled(el, sub.id, sub.disabled);

    const label = document.createElement("span");
    label.className = CLASSES.LABEL;
    label.textContent = sub.label;
    el.appendChild(label);
    if (sub.icon) _appendIcon(el, sub.icon);
    if (sub.shortcut) _appendShortcut(el, sub.shortcut, shortcutIcons, platform);
    if (sub.badge !== undefined) _appendBadge(el, sub.badge);
    if (arrowConfig) _appendSubmenuArrow(el, arrowConfig);

    _addItemHoverListeners(el, sub, {
      onHoverFocus,
      onEnterParentItem,
      onItemHoverCallback,
      clearRovingFocus,
      afterFire: () => {
        if (!sub.disabled) {
          if (scheduleSubmenuOpen) scheduleSubmenuOpen(sub, el);
          else openSubmenuPanel(sub, el);
        }
      },
      onMouseLeave: scheduleSubmenuClose ? () => scheduleSubmenuClose(el) : undefined,
    });
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (sub.disabled) return;
      openSubmenuPanel(sub, el);
    }
  );
    _attachItemEvents(el, sub.events);
    return el;
  }

  if (item.type === "link") {
    const linkItem = item as MenuItemLink;
    const el = document.createElement("a");
    el.className = CLASSES.ITEM;
    addClasses(el, linkItem.className, getVariantClass(linkItem.variant));
    if (!linkItem.disabled) {
      el.href = linkItem.href;
      if (linkItem.target) el.target = linkItem.target;
      if (linkItem.rel) el.rel = linkItem.rel;
    }
    _appendItemContent(el, linkItem.label, { icon: linkItem.icon, shortcut: linkItem.shortcut, badge: linkItem.badge, shortcutIcons, platform });
    _assignCmItem(el, linkItem);
    setAttrs(el, { role: "menuitem", tabindex: "-1" });
    _setItemIdDisabled(el, linkItem.id, linkItem.disabled);
    if (linkItem.loading) _applyItemLoadingState(el, linkItem, getSpinnerOptions);
    _addItemHoverListeners(el, linkItem, { onHoverFocus, onEnterParentItem, onItemHoverCallback, clearRovingFocus });
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
    }
  );
    _attachItemEvents(el, linkItem.events);
    return el;
  }

  const action = item as MenuItemAction;
  let el: HTMLElement;
  if (action.render) el = action.render(action);
  else {
    el = document.createElement("div");
    el.className = CLASSES.ITEM;
    addClasses(el, action.className, getVariantClass(action.variant));
    _appendItemContent(el, action.label, { icon: action.icon, shortcut: action.shortcut, badge: action.badge, shortcutIcons, platform });
  }
  _assignCmItem(el, action);
  setAttrs(el, { role: "menuitem", tabindex: "-1" });
  _setItemIdDisabled(el, action.id, action.disabled);
  if (action.loading) _applyItemLoadingState(el, action, getSpinnerOptions);
  _addItemHoverListeners(el, action, { onHoverFocus, onEnterParentItem, onItemHoverCallback, clearRovingFocus });
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
  }
);
  _attachItemEvents(el, action.events);
  return el;
}

/**
 * @private
 * Appends an icon to an element.
 * @param el - The element to append the icon to.
 * @param icon - The icon to append.
 */
function _appendIcon(el: HTMLElement, icon: string | HTMLElement): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASSES.ICON;
  if (typeof icon === "string") wrap.textContent = icon;
  else wrap.appendChild(icon);
  el.appendChild(wrap);
}

/**
 * @private
 * Appends a badge to an element.
 * @param el - The element to append the badge to.
 * @param badge - The badge to append.
 */
function _appendBadge(el: HTMLElement, badge: BadgeConfig): void {
  if (typeof badge === "string" || typeof badge === "number") {
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.className = CLASSES.ITEM_BADGE;
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
  span.className = CLASSES.ITEM_BADGE;
  if (badge.className) span.classList.add(...badge.className.trim().split(/\s+/));
  span.textContent = String(badge.content ?? "");
  el.appendChild(span);
}

/**
 * @private
 * Appends a shortcut icon to an element.
 * @param container - The element to append the shortcut icon to.
 * @param icon - The shortcut icon to append.
 */
function _appendShortcutIcon(container: HTMLElement, icon: string | HTMLElement): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASSES.SHORTCUT_ICON;
  if (typeof icon === "string") {
    const tmp = document.createElement("div");
    tmp.innerHTML = icon;
    while (tmp.firstChild) wrap.appendChild(tmp.firstChild);
  } else wrap.appendChild(icon.cloneNode(true));
  container.appendChild(wrap);
}

/**
 * @private
 * Appends a shortcut to an element.
 * @param el - The element to append the shortcut to.
 * @param shortcut - The shortcut to append.
 * @param shortcutIcons - The shortcut icons to append.
 * @param platformOverride - The platform to override the default platform.
 */
function _appendShortcut(
  el: HTMLElement,
  shortcut: string,
  shortcutIcons?: Record<string, string | HTMLElement>,
  platformOverride?: "mac" | "win" | "auto"
): void {
  const sc = document.createElement("span");
  sc.setAttribute("aria-hidden", "true");
  sc.className = CLASSES.SHORTCUT;
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
    if (icon) _appendShortcutIcon(sc, icon);
    else sc.appendChild(document.createTextNode(part.display));
  }
  const keyIcon = resolveIcon(key.name);
  if (keyIcon) _appendShortcutIcon(sc, keyIcon);
  else sc.appendChild(document.createTextNode(key.display));
  el.appendChild(sc);
}

/**
 * @private
 * Appends the item content to an element.
 * @param el - The element to append the item content to.
 * @param label - The label of the item.
 * @param opts - The options for the item content.
 */
function _appendItemContent(
  el: HTMLElement,
  label: string,
  opts?: {
    icon?: string | HTMLElement;
    shortcut?: string;
    badge?: BadgeConfig;
    shortcutIcons?: Record<string, string | HTMLElement>;
    platform?: "mac" | "win" | "auto";
  }
): void {
  // Append leading slot
  const leadingSlot = document.createElement("span");
  leadingSlot.className = CLASSES.ITEM_LEADING;
  leadingSlot.setAttribute("aria-hidden", "true");
  el.appendChild(leadingSlot);

  // Append label
  const labelSpan = document.createElement("span");
  labelSpan.className = CLASSES.LABEL;
  labelSpan.textContent = label;
  el.appendChild(labelSpan);

  // Append icon, shortcut and badge
  if (opts?.icon) _appendIcon(el, opts.icon);
  if (opts?.shortcut) _appendShortcut(el, opts.shortcut, opts.shortcutIcons, opts.platform);
  if (opts?.badge !== undefined) _appendBadge(el, opts.badge);
}

/**
 * @private
 * Applies the loading state to an item.
 * @param el - The element to apply the loading state to.
 * @param item - The item to apply the loading state to.
 * @param getSpinnerOptions - The function to get the spinner options.
 */
function _applyItemLoadingState(
  el: HTMLElement,
  item: MenuItem,
  getSpinnerOptions?: (it: MenuItem) => SpinnerConfig
): void {
  addClasses(el, CLASSES.ITEM_LOADING);
  el.setAttribute("aria-busy", "true");
  const opts = getSpinnerOptions?.(item) ?? {};
  const leadingSlot = el.querySelector(`.${CLASSES.ITEM_LEADING}`) as HTMLElement | null;
  if (leadingSlot) _appendLoadingSpinner(leadingSlot, opts);
  else {
    const wrap = document.createElement("span");
    wrap.className = CLASSES.ITEM_LEADING;
    _appendLoadingSpinner(wrap, opts);
    el.insertBefore(wrap, el.querySelector(`.${CLASSES.LABEL}`) ?? el.firstChild);
  }
}

/**
 * @private
 * Sets the id and disabled attribute on an element.
 * @param el - The element to set the id and disabled attribute on.
 * @param id - The id to set on the element.
 * @param disabled - The disabled attribute to set on the element.
 */
function _setItemIdDisabled(el: HTMLElement, id?: string, disabled?: boolean): void {
  if (id) el.id = id;
  if (disabled) el.setAttribute("aria-disabled", "true");
}

/**
 * @private
 * Assigns the cm item to an element.
 * @param el - The element to assign the cm item to.
 * @param item - The item to assign to the element.
 * @param extras - The extras to assign to the element.
 */
function _assignCmItem(
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
 * @private
 * Adds the item hover listeners to an element.
 * @param el - The element to add the item hover listeners to.
 * @param item - The item to add the item hover listeners to.
 * @param callbacks - The callbacks to add the item hover listeners to.
 */
function _addItemHoverListeners(
  el: HTMLElement,
  item: MenuItem,
  callbacks: {
    onHoverFocus?: (el: HTMLElement) => void;
    onEnterParentItem?: (el: HTMLElement) => void;
    onItemHoverCallback?: (item: MenuItem, nativeEvent: MouseEvent | FocusEvent) => void;
    afterFire?: (e: MouseEvent | FocusEvent) => void;
    onMouseLeave?: () => void;
    clearRovingFocus?: (menuEl: HTMLElement | null) => void;
  }
): void {
  const fire = (e: MouseEvent | FocusEvent): void => {
    callbacks.onHoverFocus?.(el);
    callbacks.onEnterParentItem?.(el);
    callbacks.onItemHoverCallback?.(item, e);
    if ("disabled" in item && item.disabled) callbacks.clearRovingFocus?.(el.closest(MENU_ROLE_SELECTOR) as HTMLElement | null);
    callbacks.afterFire?.(e);
  };
  el.addEventListener("mouseenter", fire);
  el.addEventListener("focus", fire);
  if (callbacks.onMouseLeave) el.addEventListener("mouseleave", callbacks.onMouseLeave);
}

/**
 * @private
 * Attaches the item events to an element.
 * @param el - The element to attach the item events to.
 * @param events - The events to attach to the element.
 */
function _attachItemEvents(el: HTMLElement, events: EventRegistry | (() => EventRegistry) | undefined): void {
  if (events == null) return;
  const registry = typeof events === "function" ? events() : events;
  for (const [eventName, entry] of Object.entries(registry)) {
    if (entry == null) continue;
    if (typeof entry === "function") el.addEventListener(eventName, entry as EventListener);
    else el.addEventListener(eventName, entry.listener as EventListener, entry.options);
  }
}

/**
 * @private
 * Appends the state indicator to an element.
 * @param el - The element to append the state indicator to.
 * @param checked - The checked state of the element.
 * @param icon - The icon to append to the element.
 * @param uncheckedIcon - The unchecked icon to append to the element.
 * @param baseClass - The base class of the element.
 * @param customClass - The custom class of the element.
 * @param checkedClassName - The class name of the checked state.
 * @param uncheckedClassName - The class name of the unchecked state.
 */
function _appendStateIndicator(
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
 * @private
 * Appends the loading spinner to a container.
 * @param container - The container to append the loading spinner to.
 * @param options - The options for the loading spinner.
 */
function _appendLoadingSpinner(container: HTMLElement, options: SpinnerConfig): void {
  const spinner = document.createElement("span");
  spinner.className = CLASSES.SPINNER;
  spinner.setAttribute("aria-hidden", "true");
  const icon = options.icon;
  const hasCustomIcon = icon !== undefined && icon !== null;
  if (hasCustomIcon && icon !== undefined) {
    spinner.classList.add(CLASSES.SPINNER_CUSTOM);
    if (typeof icon === "string") {
      const tmp = document.createElement("div");
      tmp.innerHTML = icon;
      while (tmp.firstChild) spinner.appendChild(tmp.firstChild);
    } else spinner.appendChild(icon.cloneNode(true));
  }
  const speedMs = options.speed ?? DEFAULT_SPINNER_SPEED_MS;
  const spinnerStyles: Record<string, string> = { [CSS_VARS.SPINNER_DURATION]: `${speedMs}ms` };
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
 * @private
 * Appends the submenu arrow to a parent element.
 * @param parent - The parent element to append the submenu arrow to.
 * @param config - The configuration for the submenu arrow.
 */
function _appendSubmenuArrow(parent: HTMLElement, config: SubmenuArrowConfig): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASSES.SUBMENU_ARROW;
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
  wrap.classList.add(CLASSES.SUBMENU_ARROW_ICON);
  if (typeof icon === "string") {
    const tmp = document.createElement("div");
    tmp.innerHTML = icon;
    while (tmp.firstChild) wrap.appendChild(tmp.firstChild);
  } else wrap.appendChild(icon.cloneNode(true));
  parent.appendChild(wrap);
}

/**
 * @private
 * Creates a state item node.
 * @param item - The item to create the state item node for.
 * @param type - The type of the item.
 * @param callbacks - The callbacks for the state item node.
 */
function _createStateItemNode(
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
    clearRovingFocus?: (menuEl: HTMLElement | null) => void;
  }
): HTMLElement {
  const { close, refreshContent, getSpinnerOptions, onHoverFocus, onEnterParentItem, onItemHoverCallback, shortcutIcons, platform, clearRovingFocus } = callbacks;

  let role: string;
  let itemClass: string;
  let indicatorBase: string;
  let indicatorCustom: string;
  let assignExtra: { _cmCheckbox?: MenuItemCheckbox; _cmRadio?: MenuItemRadio };
  if (type === "checkbox") {
    role = "menuitemcheckbox";
    itemClass = CLASSES.ITEM_CHECKBOX;
    indicatorBase = CLASSES.CHECK;
    indicatorCustom = CLASSES.CHECK_CUSTOM;
    assignExtra = { _cmCheckbox: item as MenuItemCheckbox };
  } else {
    role = "menuitemradio";
    itemClass = CLASSES.ITEM_RADIO;
    indicatorBase = CLASSES.RADIO;
    indicatorCustom = CLASSES.RADIO_CUSTOM;
    assignExtra = { _cmRadio: item as MenuItemRadio };
  }

  let el: HTMLElement;
  if (item.render) el = item.render(item as MenuItemCheckbox & MenuItemRadio);
  else {
    el = document.createElement("div");
    el.className = `${CLASSES.ITEM} ${itemClass}`;
    addClasses(el, item.className, getVariantClass(item.variant), item.checked && CLASSES.CHECKED);
    _appendStateIndicator(el, item.checked, item.icon, item.uncheckedIcon, indicatorBase, indicatorCustom, item.checkedClassName, item.uncheckedClassName);
    _appendItemContent(el, item.label, { icon: item.leadingIcon, shortcut: item.shortcut, shortcutIcons, platform });
  }

  _assignCmItem(el, item, assignExtra);
  setAttrs(el, { role, "aria-checked": item.checked ? "true" : "false", tabindex: "-1" });
  _setItemIdDisabled(el, item.id, item.disabled);
  if (item.loading) _applyItemLoadingState(el, item, getSpinnerOptions);
  _addItemHoverListeners(el, item, { onHoverFocus, onEnterParentItem, onItemHoverCallback, clearRovingFocus });
  _attachItemEvents(el, item.events);

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
