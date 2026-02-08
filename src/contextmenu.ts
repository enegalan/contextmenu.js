import type {
  BadgeConfig,
  BindOptions,
  CloseContext,
  ContextMenuConfig,
  ContextMenuInstance,
  MenuItem,
  MenuItemAction,
  MenuItemCheckbox,
  MenuItemLabel,
  MenuItemLink,
  MenuItemRadio,
  MenuItemSubmenu,
  MenuClickEvent,
  MenuCheckboxChangeEvent,
  MenuRadioSelectEvent,
  OpenAtElementOptions,
  OpenContext,
  SpinnerConfig,
  SubmenuArrowConfig,
  SubmenuChildren,
} from "./types.js";
import type { MenuItemVariant } from "./types.js";
import {
  ROOT_CLASS,
  ROOT_OPEN_CLASS,
  ROOT_LEAVE_CLASS,
  SUBMENU_OPEN_CLASS,
  SUBMENU_HOVER_DELAY_MS,
  SUBMENU_CLOSE_DELAY_MS,
  DEFAULT_LONG_PRESS_MS,
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
  CLASS_ITEM_BADGE,
  CLASS_ITEM_RADIO,
  CLASS_RADIO,
  CLASS_RADIO_CUSTOM,
  CLASS_SUBMENU_TRIGGER,
  CLASS_WRAPPER,
  CLASS_SUBMENU,
  CLASS_ITEM_VARIANT_DANGER,
  CLASS_ITEM_VARIANT_INFO,
  CLASS_ITEM_VARIANT_SUCCESS,
  CLASS_ITEM_VARIANT_WARNING,
  CLASS_ITEM_VARIANT_MUTED,
  CSS_VAR_PREFIX,
  CSS_VAR_ENTER_DURATION,
  CSS_VAR_LEAVE_DURATION,
  CSS_VAR_ENTER_EASING,
  CSS_VAR_LEAVE_EASING,
  CSS_VAR_SUBMENU_ARROW_SIZE,
  THEME_CLASS_DATA_ATTR,
  ANIMATION_TYPE_DATA_ATTR,
} from "./constants.js";

const OPEN_MENU_INSTANCES = new Set<{ close(): Promise<void> }>();

function getPortal(portal: ContextMenuConfig["portal"]): HTMLElement {
  if (portal == null) return document.body;
  return typeof portal === "function" ? portal() : portal;
}

function isMacLikePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const p = navigator.platform ?? "";
  if (/Mac|iPhone|iPod|iPad/i.test(p)) return true;
  const ua = navigator.userAgent ?? "";
  if (/Mac|iPhone|iPod|iPad/i.test(ua)) return true;
  const platform = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform;
  return platform === "macOS" || platform === "iOS";
}

const MAC_MODIFIER_SYMBOLS: Record<string, string> = {
  cmd: "⌘",
  ctrl: "⌃",
  alt: "⌥",
  shift: "⇧",
};

function formatShortcutForDisplay(shortcut: string): string {
  if (!shortcut || typeof shortcut !== "string") return shortcut;
  const parts = shortcut.split("+").map((p) => p.trim());
  if (parts.length === 0) return shortcut;
  const keyPart = parts[parts.length - 1] ?? "";
  const modParts = parts.slice(0, -1).map((p) => p.toLowerCase());
  const useCmd = isMacLikePlatform();
  const keyDisplay = keyPart.length === 1 ? keyPart.toUpperCase() : keyPart;
  if (useCmd) {
    const symbols = modParts.map((m) => (m === "ctrl" ? MAC_MODIFIER_SYMBOLS.cmd : MAC_MODIFIER_SYMBOLS[m as keyof typeof MAC_MODIFIER_SYMBOLS] ?? m));
    return symbols.join("") + keyDisplay;
  }
  if (modParts.length === 0) return keyDisplay;
  const winMods = modParts.map((m) => (m === "cmd" ? "Ctrl" : m.charAt(0).toUpperCase() + m.slice(1)));
  return winMods.join("+") + "+" + keyDisplay;
}

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

function resolveSubmenuChildren(children: SubmenuChildren): Promise<MenuItem[]> {
  if (Array.isArray(children)) {
    return Promise.resolve(children.map(normalizeItem));
  }
  const result = children();
  return Promise.resolve(result).then((arr) => arr.map(normalizeItem));
}

function positionMenu(
  el: HTMLElement,
  x: number,
  y: number,
  config: ContextMenuConfig
): void {
  const pos = config.position ?? {};
  const offsetX = pos.offset?.x ?? 0;
  const offsetY = pos.offset?.y ?? 0;
  const padding = pos.padding ?? 8;
  const flip = pos.flip !== false;
  const shift = pos.shift !== false;

  el.style.display = "";
  el.getClientRects();
  const rect = el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

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

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function applyAnimationConfig(
  root: HTMLElement,
  config: ContextMenuConfig
): void {
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
  root.style.setProperty(CSS_VAR_ENTER_DURATION, `${enterMs}ms`);
  root.style.setProperty(CSS_VAR_LEAVE_DURATION, `${leaveMs}ms`);
  root.style.setProperty(CSS_VAR_ENTER_EASING, enterEasing);
  root.style.setProperty(CSS_VAR_LEAVE_EASING, leaveEasing);
}

function appendIcon(el: HTMLElement, icon: string | HTMLElement): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASS_ICON;
  if (typeof icon === "string") wrap.textContent = icon;
  else wrap.appendChild(icon);
  el.appendChild(wrap);
}

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

function sizeToCss(size: number | string): string {
  return typeof size === "number" ? `${size}px` : size;
}

const DEFAULT_SPINNER_SPEED_MS = 600;

function appendLoadingSpinner(
  container: HTMLElement,
  options: SpinnerConfig
): void {
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
    } else {
      spinner.appendChild(icon.cloneNode(true));
    }
  }
  if (options.size !== undefined) {
    const sizeCss = sizeToCss(options.size);
    spinner.style.width = sizeCss;
    spinner.style.height = sizeCss;
    spinner.style.minWidth = sizeCss;
    spinner.style.minHeight = sizeCss;
  }
  const speedMs = options.speed ?? DEFAULT_SPINNER_SPEED_MS;
  spinner.style.setProperty(CSS_VAR_SPINNER_DURATION, `${speedMs}ms`);
  container.appendChild(spinner);
}

function normalizeSubmenuArrow(
  value: ContextMenuConfig["submenuArrow"]
): SubmenuArrowConfig | null {
  if (value === false || value === undefined) return null;
  if (value === true) return {};
  return value;
}

function appendSubmenuArrow(parent: HTMLElement, config: SubmenuArrowConfig): void {
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  wrap.className = CLASS_SUBMENU_ARROW;
  if (config.className) wrap.classList.add(config.className);
  if (config.opacity !== undefined) wrap.style.opacity = String(config.opacity);
  const icon = config.icon;
  const hasIcon = icon !== undefined && icon !== null;
  if (hasIcon) {
    wrap.classList.add(CLASS_SUBMENU_ARROW_ICON);
    if (config.size !== undefined) {
      const size = sizeToCss(config.size);
      wrap.style.width = size;
      wrap.style.height = size;
      wrap.style.minWidth = size;
      wrap.style.minHeight = size;
    }
    if (typeof icon === "string") {
      const tmp = document.createElement("div");
      tmp.innerHTML = icon;
      while (tmp.firstChild) wrap.appendChild(tmp.firstChild);
    } else wrap.appendChild(icon.cloneNode(true));
  } else if (config.size !== undefined) {
    wrap.style.setProperty(CSS_VAR_SUBMENU_ARROW_SIZE, sizeToCss(config.size));
  }
  parent.appendChild(wrap);
}

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
  getSpinnerOptions?: (item: MenuItem) => SpinnerConfig
): HTMLElement | null {
  const arrowConfig = submenuArrowConfig ?? null;
  if ("visible" in item && item.visible === false) return null;

  if (item.type === "separator") {
    const el = document.createElement("div");
    el.setAttribute("role", "separator");
    el.className = CLASS_SEPARATOR;
    if (item.className) el.classList.add(item.className);
    return el;
  }

  if (item.type === "label") {
    const labelItem = item as MenuItemLabel;
    const el = document.createElement("div");
    el.setAttribute("role", "presentation");
    el.className = `${CLASS_ITEM} ${CLASS_ITEM_LABEL}`;
    if (labelItem.className) el.classList.add(labelItem.className);
    if (labelItem.id) el.id = labelItem.id;
    const labelSpan = document.createElement("span");
    labelSpan.className = CLASS_LABEL;
    labelSpan.textContent = labelItem.label;
    el.appendChild(labelSpan);
    return el;
  }

  if (item.type === "checkbox") {
    const chk = item as MenuItemCheckbox;
    let el: HTMLElement;
    if (chk.render) {
      el = chk.render(chk);
    } else {
      el = document.createElement("div");
      el.className = `${CLASS_ITEM} ${CLASS_ITEM_CHECKBOX}`;
      if (chk.className) el.classList.add(chk.className);
      const variantClass = getVariantClass(chk.variant);
      if (variantClass) el.classList.add(variantClass);
      if (chk.checked) el.classList.add(CLASS_CHECKED);
      const checkSpan = document.createElement("span");
      checkSpan.setAttribute("aria-hidden", "true");
      const hasCustomCheck = chk.icon || chk.uncheckedIcon;
      checkSpan.className = CLASS_CHECK + (hasCustomCheck ? ` ${CLASS_CHECK_CUSTOM}` : "");
      if (chk.checked && chk.checkedClassName) checkSpan.classList.add(...chk.checkedClassName.trim().split(/\s+/));
      if (!chk.checked && chk.uncheckedClassName) checkSpan.classList.add(...chk.uncheckedClassName.trim().split(/\s+/));
      if (hasCustomCheck) {
        const indicatorIcon = chk.checked ? chk.icon : chk.uncheckedIcon;
        if (indicatorIcon) {
          if (typeof indicatorIcon === "string") {
            checkSpan.innerHTML = indicatorIcon;
          } else {
            checkSpan.appendChild(indicatorIcon.cloneNode(true));
          }
        }
      }
      el.appendChild(checkSpan);
      const leadingSlot = document.createElement("span");
      leadingSlot.className = CLASS_ITEM_LEADING;
      leadingSlot.setAttribute("aria-hidden", "true");
      el.appendChild(leadingSlot);
      const labelSpan = document.createElement("span");
      labelSpan.className = CLASS_LABEL;
      labelSpan.textContent = chk.label;
      el.appendChild(labelSpan);
      if (chk.leadingIcon) appendIcon(el, chk.leadingIcon);
      if (chk.shortcut) {
        const sc = document.createElement("span");
        sc.setAttribute("aria-hidden", "true");
        sc.className = CLASS_SHORTCUT;
        sc.textContent = formatShortcutForDisplay(chk.shortcut);
        el.appendChild(sc);
      }
    }
    (el as unknown as { _cmCheckbox?: MenuItemCheckbox })._cmCheckbox = chk;
    (el as unknown as { _cmItem?: MenuItem })._cmItem = chk;
    el.setAttribute("role", "menuitemcheckbox");
    el.setAttribute("aria-checked", chk.checked ? "true" : "false");
    el.setAttribute("tabindex", "-1");
    if (chk.id) el.id = chk.id;
    if (chk.disabled) el.setAttribute("aria-disabled", "true");
    if (chk.loading) {
      el.classList.add(CLASS_ITEM_LOADING);
      el.setAttribute("aria-busy", "true");
      const opts = getSpinnerOptions?.(chk) ?? {};
      const leadingSlot = el.querySelector(`.${CLASS_ITEM_LEADING}`) as HTMLElement | null;
      if (leadingSlot) {
        appendLoadingSpinner(leadingSlot, opts);
      } else {
        const wrap = document.createElement("span");
        wrap.className = CLASS_ITEM_LEADING;
        appendLoadingSpinner(wrap, opts);
        el.insertBefore(wrap, el.querySelector(`.${CLASS_LABEL}`) ?? el.firstChild);
      }
    }
    const fireCheckboxHover = (e: MouseEvent | FocusEvent): void => {
      onHoverFocus?.(el);
      onEnterParentItem?.(el);
      onItemHoverCallback?.(chk, e);
      if (chk.disabled) clearRovingFocus(el.closest("[role='menu']") as HTMLElement | null);
    };
    el.addEventListener("mouseenter", fireCheckboxHover);
    el.addEventListener("focus", fireCheckboxHover);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (chk.disabled || chk.loading || !chk.onChange) return;
      const event: MenuCheckboxChangeEvent = {
        item: chk,
        checked: !chk.checked,
        nativeEvent: e,
        close,
      };
      chk.onChange(event);
      refreshContent?.();
      const shouldClose = chk.closeOnAction !== false;
      if (shouldClose) close(chk);
    });
    return el;
  }

  if (item.type === "radio") {
    const radioItem = item as MenuItemRadio;
    let el: HTMLElement;
    if (radioItem.render) {
      el = radioItem.render(radioItem);
    } else {
      el = document.createElement("div");
      el.className = `${CLASS_ITEM} ${CLASS_ITEM_RADIO}`;
      if (radioItem.className) el.classList.add(radioItem.className);
      const variantClassRadio = getVariantClass(radioItem.variant);
      if (variantClassRadio) el.classList.add(variantClassRadio);
      if (radioItem.checked) el.classList.add(CLASS_CHECKED);
      const radioSpan = document.createElement("span");
      radioSpan.setAttribute("aria-hidden", "true");
      const hasCustomRadio = radioItem.icon || radioItem.uncheckedIcon;
      radioSpan.className = CLASS_RADIO + (hasCustomRadio ? ` ${CLASS_RADIO_CUSTOM}` : "");
      if (radioItem.checked && radioItem.checkedClassName) radioSpan.classList.add(...radioItem.checkedClassName.trim().split(/\s+/));
      if (!radioItem.checked && radioItem.uncheckedClassName) radioSpan.classList.add(...radioItem.uncheckedClassName.trim().split(/\s+/));
      if (hasCustomRadio) {
        const indicatorIcon = radioItem.checked ? radioItem.icon : radioItem.uncheckedIcon;
        if (indicatorIcon) {
          if (typeof indicatorIcon === "string") {
            radioSpan.innerHTML = indicatorIcon;
          } else {
            radioSpan.appendChild(indicatorIcon.cloneNode(true));
          }
        }
      }
      el.appendChild(radioSpan);
      const leadingSlot = document.createElement("span");
      leadingSlot.className = CLASS_ITEM_LEADING;
      leadingSlot.setAttribute("aria-hidden", "true");
      el.appendChild(leadingSlot);
      const labelSpan = document.createElement("span");
      labelSpan.className = CLASS_LABEL;
      labelSpan.textContent = radioItem.label;
      el.appendChild(labelSpan);
      if (radioItem.leadingIcon) appendIcon(el, radioItem.leadingIcon);
      if (radioItem.shortcut) {
        const sc = document.createElement("span");
        sc.setAttribute("aria-hidden", "true");
        sc.className = CLASS_SHORTCUT;
        sc.textContent = formatShortcutForDisplay(radioItem.shortcut);
        el.appendChild(sc);
      }
    }
    (el as unknown as { _cmRadio?: MenuItemRadio })._cmRadio = radioItem;
    (el as unknown as { _cmItem?: MenuItem })._cmItem = radioItem;
    el.setAttribute("role", "menuitemradio");
    el.setAttribute("aria-checked", radioItem.checked ? "true" : "false");
    el.setAttribute("tabindex", "-1");
    if (radioItem.id) el.id = radioItem.id;
    if (radioItem.disabled) el.setAttribute("aria-disabled", "true");
    if (radioItem.loading) {
      el.classList.add(CLASS_ITEM_LOADING);
      el.setAttribute("aria-busy", "true");
      const opts = getSpinnerOptions?.(radioItem) ?? {};
      const leadingSlot = el.querySelector(`.${CLASS_ITEM_LEADING}`) as HTMLElement | null;
      if (leadingSlot) {
        appendLoadingSpinner(leadingSlot, opts);
      } else {
        const wrap = document.createElement("span");
        wrap.className = CLASS_ITEM_LEADING;
        appendLoadingSpinner(wrap, opts);
        el.insertBefore(wrap, el.querySelector(`.${CLASS_LABEL}`) ?? el.firstChild);
      }
    }
    const fireRadioHover = (e: MouseEvent | FocusEvent): void => {
      onHoverFocus?.(el);
      onEnterParentItem?.(el);
      onItemHoverCallback?.(radioItem, e);
      if (radioItem.disabled) clearRovingFocus(el.closest("[role='menu']") as HTMLElement | null);
    };
    el.addEventListener("mouseenter", fireRadioHover);
    el.addEventListener("focus", fireRadioHover);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (radioItem.disabled || radioItem.loading || !radioItem.onSelect) return;
      const event: MenuRadioSelectEvent = {
        item: radioItem,
        value: radioItem.value,
        nativeEvent: e,
        close,
      };
      radioItem.onSelect(event);
      refreshContent?.();
      const shouldClose = radioItem.closeOnAction !== false;
      if (shouldClose) close(radioItem);
    });
    return el;
  }

  if (item.type === "submenu") {
    const sub = item as MenuItemSubmenu;
    const el = document.createElement("div");
    (el as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu = sub;
    (el as unknown as { _cmItem?: MenuItem })._cmItem = sub;
    el.setAttribute("role", "menuitem");
    el.setAttribute("aria-haspopup", "menu");
    el.setAttribute("aria-expanded", "false");
    el.setAttribute("tabindex", "-1");
    el.className = `${CLASS_ITEM} ${CLASS_SUBMENU_TRIGGER}`;
    if (sub.className) el.classList.add(sub.className);
    const variantClassSub = getVariantClass(sub.variant);
    if (variantClassSub) el.classList.add(variantClassSub);
    if (sub.id) el.id = sub.id;
    if (sub.disabled) el.setAttribute("aria-disabled", "true");

    const label = document.createElement("span");
    label.className = CLASS_LABEL;
    label.textContent = sub.label;
    el.appendChild(label);
    if (sub.icon) appendIcon(el, sub.icon);
    if (sub.shortcut) {
      const sc = document.createElement("span");
      sc.setAttribute("aria-hidden", "true");
      sc.className = CLASS_SHORTCUT;
      sc.textContent = formatShortcutForDisplay(sub.shortcut);
      el.appendChild(sc);
    }
    if (sub.badge !== undefined) appendBadge(el, sub.badge);
    if (arrowConfig) appendSubmenuArrow(el, arrowConfig);

    const fireSubmenuHover = (e: MouseEvent | FocusEvent): void => {
      onHoverFocus?.(el);
      onEnterParentItem?.(el);
      onItemHoverCallback?.(sub, e);
      if (sub.disabled) {
        clearRovingFocus(el.closest("[role='menu']") as HTMLElement | null);
        return;
      }
      if (scheduleSubmenuOpen) scheduleSubmenuOpen(sub, el);
      else triggerSubmenu(sub, el);
    };
    el.addEventListener("mouseenter", fireSubmenuHover);
    el.addEventListener("focus", fireSubmenuHover);
    el.addEventListener("mouseleave", () => {
      if (scheduleSubmenuClose) scheduleSubmenuClose(el);
    });
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (sub.disabled) return;
      triggerSubmenu(sub, el);
    });
    return el;
  }

  if (item.type === "link") {
    const linkItem = item as MenuItemLink;
    const el = document.createElement("a");
    el.className = CLASS_ITEM;
    if (linkItem.className) el.classList.add(linkItem.className);
    const variantClassLink = getVariantClass(linkItem.variant);
    if (variantClassLink) el.classList.add(variantClassLink);
    if (!linkItem.disabled) {
      el.href = linkItem.href;
      if (linkItem.target) el.target = linkItem.target;
      if (linkItem.rel) el.rel = linkItem.rel;
    }
    const leadingSlot = document.createElement("span");
    leadingSlot.className = CLASS_ITEM_LEADING;
    leadingSlot.setAttribute("aria-hidden", "true");
    el.appendChild(leadingSlot);
    const label = document.createElement("span");
    label.className = CLASS_LABEL;
    label.textContent = linkItem.label;
    el.appendChild(label);
    if (linkItem.icon) appendIcon(el, linkItem.icon);
    if (linkItem.shortcut) {
      const sc = document.createElement("span");
      sc.setAttribute("aria-hidden", "true");
      sc.className = CLASS_SHORTCUT;
      sc.textContent = formatShortcutForDisplay(linkItem.shortcut);
      el.appendChild(sc);
    }
    if (linkItem.badge !== undefined) appendBadge(el, linkItem.badge);
    (el as unknown as { _cmItem?: MenuItem })._cmItem = linkItem;
    el.setAttribute("role", "menuitem");
    el.setAttribute("tabindex", "-1");
    if (linkItem.id) el.id = linkItem.id;
    if (linkItem.disabled) el.setAttribute("aria-disabled", "true");
    if (linkItem.loading) {
      el.classList.add(CLASS_ITEM_LOADING);
      el.setAttribute("aria-busy", "true");
      appendLoadingSpinner(leadingSlot, getSpinnerOptions?.(linkItem) ?? {});
    }
    const fireLinkHover = (e: MouseEvent | FocusEvent): void => {
      onHoverFocus?.(el);
      onEnterParentItem?.(el);
      onItemHoverCallback?.(linkItem, e);
      if (linkItem.disabled) clearRovingFocus(el.closest("[role='menu']") as HTMLElement | null);
    };
    el.addEventListener("mouseenter", fireLinkHover);
    el.addEventListener("focus", fireLinkHover);
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
      } else {
        window.location.href = linkItem.href;
      }
      close(linkItem);
    });
    return el;
  }

  const action = item as MenuItemAction;
  let el: HTMLElement;
  if (action.render) {
    el = action.render(action);
  } else {
    el = document.createElement("div");
    el.className = CLASS_ITEM;
    if (action.className) el.classList.add(action.className);
    const variantClassAction = getVariantClass(action.variant);
    if (variantClassAction) el.classList.add(variantClassAction);
    const leadingSlot = document.createElement("span");
    leadingSlot.className = CLASS_ITEM_LEADING;
    leadingSlot.setAttribute("aria-hidden", "true");
    el.appendChild(leadingSlot);
    const label = document.createElement("span");
    label.className = CLASS_LABEL;
    label.textContent = action.label;
    el.appendChild(label);
    if (action.icon) appendIcon(el, action.icon);
    if (action.shortcut) {
      const sc = document.createElement("span");
      sc.setAttribute("aria-hidden", "true");
      sc.className = CLASS_SHORTCUT;
      sc.textContent = formatShortcutForDisplay(action.shortcut);
      el.appendChild(sc);
    }
    if (action.badge !== undefined) appendBadge(el, action.badge);
  }
  (el as unknown as { _cmItem?: MenuItem })._cmItem = action;
  el.setAttribute("role", "menuitem");
  el.setAttribute("tabindex", "-1");
  if (action.id) el.id = action.id;
  if (action.disabled) el.setAttribute("aria-disabled", "true");
  if (action.loading) {
    el.classList.add(CLASS_ITEM_LOADING);
    el.setAttribute("aria-busy", "true");
    const opts = getSpinnerOptions?.(action) ?? {};
    const leadingSlot = el.querySelector(`.${CLASS_ITEM_LEADING}`) as HTMLElement | null;
    if (leadingSlot) {
      appendLoadingSpinner(leadingSlot, opts);
    } else {
      const wrap = document.createElement("span");
      wrap.className = CLASS_ITEM_LEADING;
      appendLoadingSpinner(wrap, opts);
      el.insertBefore(wrap, el.querySelector(`.${CLASS_LABEL}`) ?? el.firstChild);
    }
  }
  const fireActionHover = (e: MouseEvent | FocusEvent): void => {
    onHoverFocus?.(el);
    onEnterParentItem?.(el);
    onItemHoverCallback?.(action, e);
    if (action.disabled) clearRovingFocus(el.closest("[role='menu']") as HTMLElement | null);
  };
  el.addEventListener("mouseenter", fireActionHover);
  el.addEventListener("focus", fireActionHover);
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
    const shouldClose = action.closeOnAction !== false;
    if (shouldClose) close(action);
  });
  return el;
}

function getFocusableItems(menuEl: HTMLElement): HTMLElement[] {
  return Array.from(
    menuEl.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([aria-disabled='true']), [role='menuitemcheckbox']:not([aria-disabled='true']), [role='menuitemradio']:not([aria-disabled='true'])"
    )
  );
}

function setRovingTabindex(items: HTMLElement[], focusedIndex: number): void {
  items.forEach((node, i) => {
    node.setAttribute("tabindex", i === focusedIndex ? "0" : "-1");
  });
  if (items[focusedIndex]) items[focusedIndex].focus();
}

function clearRovingFocus(menuEl: HTMLElement | null): void {
  if (!menuEl) return;
  const items = getFocusableItems(menuEl);
  items.forEach((node) => node.setAttribute("tabindex", "-1"));
  menuEl.focus();
}

function makeHoverFocusHandler(menuEl: HTMLElement): (el: HTMLElement) => void {
  return (el: HTMLElement) => {
    const items = getFocusableItems(menuEl);
    const idx = items.indexOf(el);
    if (idx >= 0) setRovingTabindex(items, idx);
  };
}

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

function getCoordsFromAnchor(anchor: { x: number; y: number } | DOMRect): { x: number; y: number } {
  if ("width" in anchor && "height" in anchor) {
    const rect = anchor as DOMRect;
    return { x: rect.left + rect.width / 2, y: rect.top };
  }
  return anchor as { x: number; y: number };
}

function getVariantClass(variant: MenuItemVariant | undefined): string | null {
  if (!variant) return null;
  switch (variant) {
    case "danger":
      return CLASS_ITEM_VARIANT_DANGER;
    case "info":
      return CLASS_ITEM_VARIANT_INFO;
    case "success":
      return CLASS_ITEM_VARIANT_SUCCESS;
    case "warning":
      return CLASS_ITEM_VARIANT_WARNING;
    case "muted":
      return CLASS_ITEM_VARIANT_MUTED;
    default:
      return null;
  }
}

function normalizeKeyForShortcut(key: string): string {
  if (key.length === 1) return key.toLowerCase();
  return key;
}

function shortcutMatchesEvent(shortcut: string, e: KeyboardEvent): boolean {
  const parts = shortcut.split("+").map((p) => p.trim());
  if (parts.length === 0) return false;
  const shortcutKey = normalizeKeyForShortcut(parts[parts.length - 1] ?? "");
  const eventKey = normalizeKeyForShortcut(e.key);
  if (shortcutKey !== eventKey) return false;
  const mods = parts.slice(0, -1).map((p) => p.toLowerCase());
  const hasCtrl = mods.includes("ctrl");
  const hasCmd = mods.includes("cmd");
  const hasAlt = mods.includes("alt");
  const hasShift = mods.includes("shift");
  if (hasCtrl || hasCmd) {
    const useCmd = isMacLikePlatform();
    if (useCmd) {
      if (!e.metaKey || e.ctrlKey) return false;
    } else {
      if (!e.ctrlKey || e.metaKey) return false;
    }
  } else if (e.ctrlKey || e.metaKey) return false;
  if (hasAlt) {
    if (!e.altKey) return false;
  } else if (e.altKey) return false;
  if (hasShift) {
    if (!e.shiftKey) return false;
  } else if (e.shiftKey) return false;
  return true;
}

function applyThemeToElement(el: HTMLElement, theme: ContextMenuConfig["theme"]): void {
  const prevClass = el.getAttribute(THEME_CLASS_DATA_ATTR);
  if (prevClass) {
    prevClass.trim().split(/\s+/).forEach((c) => el.classList.remove(c));
  }
  el.removeAttribute(THEME_CLASS_DATA_ATTR);
  if (theme?.class) {
    const classes = theme.class.trim().split(/\s+/).filter(Boolean);
    classes.forEach((c) => el.classList.add(c));
    el.setAttribute(THEME_CLASS_DATA_ATTR, theme.class);
  }
  if (theme?.tokens) {
    for (const [key, value] of Object.entries(theme.tokens)) {
      el.style.setProperty(key.startsWith("--") ? key : CSS_VAR_PREFIX + key, value);
    }
  }
}

export function createContextMenu(config: ContextMenuConfig): ContextMenuInstance {
  const currentConfig: ContextMenuConfig = { ...config };
  const rawMenu = typeof currentConfig.menu === "function" ? currentConfig.menu() : (currentConfig.menu ?? []);
  let menu: MenuItem[] = rawMenu.map(normalizeItem);
  const portal = getPortal(currentConfig.portal);
  const wrapper = document.createElement("div");
  wrapper.className = CLASS_WRAPPER;
  const root = document.createElement("div");
  root.setAttribute("role", "menu");
  root.setAttribute("aria-orientation", "vertical");
  root.setAttribute("tabindex", "-1");
  root.className = ROOT_CLASS;
  root.style.cssText = "display:none;";

  applyThemeToElement(root, currentConfig.theme);
  applyAnimationConfig(root, currentConfig);
  const posConfig = currentConfig.position;
  if (posConfig?.zIndexBase != null) {
    root.style.zIndex = String(posConfig.zIndexBase);
  }
  wrapper.appendChild(root);

  const submenuArrowConfig = normalizeSubmenuArrow(currentConfig.submenuArrow);

  let isOpen = false;
  let lastFocusTarget: HTMLElement | null = null;
  let leaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let leaveTransitionHandler: (() => void) | null = null;
  const openSubmenus: Array<{ panel: HTMLElement; trigger: HTMLElement }> = [];
  let submenuHoverTimer: ReturnType<typeof setTimeout> | null = null;
  let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
  let resizeHandler: (() => void) | null = null;

  let boundElement: HTMLElement | null = null;
  let boundContextmenu: ((e: MouseEvent) => void) | null = null;
  let boundTouchstart: ((e: TouchEvent) => void) | null = null;
  let boundTouchEndOrCancel: (e: TouchEvent) => void = (): void => {};
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressX = 0;
  let longPressY = 0;

  let lastAnchor: { x: number; y: number } | null = null;
  let lastSelectedItem: MenuItem | undefined = undefined;
  let openPromiseResolve: ((value: MenuItem | undefined) => void) | null = null;
  let closePromiseResolve: (() => void) | null = null;

  const self = { close: (): Promise<void> => realClose() };

  function cancelLeaveAnimation(): void {
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      leaveTimeout = null;
    }
    if (leaveTransitionHandler) {
      root.removeEventListener("transitionend", leaveTransitionHandler);
      leaveTransitionHandler = null;
    }
    root.classList.remove(ROOT_LEAVE_CLASS);
  }

  function onFullyClosed(): void {
    OPEN_MENU_INSTANCES.delete(self);
    openPromiseResolve?.(lastSelectedItem);
    openPromiseResolve = null;
    closePromiseResolve?.();
    closePromiseResolve = null;
  }

  function realClose(): Promise<void> {
    return new Promise((resolve) => {
      (async () => {
        const allow = await Promise.resolve(currentConfig.onBeforeClose?.());
        if (allow === false) {
          resolve();
          return;
        }
        if (!isOpen) {
          resolve();
          return;
        }
        closePromiseResolve = resolve;
        isOpen = false;
        if (outsideClickHandler) {
          document.removeEventListener("mousedown", outsideClickHandler, true);
          outsideClickHandler = null;
        }
        if (resizeHandler) {
          window.removeEventListener("resize", resizeHandler);
          resizeHandler = null;
        }
        cancelLeaveAnimation();
        if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
        submenuHoverTimer = null;

        function doRootClose(): void {
          const anim = currentConfig.animation;
          const rawLeave = anim?.leave ?? 80;
          const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);
          const closeContext: CloseContext = { selectedItem: lastSelectedItem, anchor: lastAnchor };

          if (leaveMs > 0 && !anim?.disabled) {
            root.classList.remove(ROOT_OPEN_CLASS);
            root.classList.add(ROOT_LEAVE_CLASS);
            const onEnd = (): void => {
              if (leaveTimeout) clearTimeout(leaveTimeout);
              leaveTimeout = null;
              if (leaveTransitionHandler) {
                root.removeEventListener("transitionend", leaveTransitionHandler);
                leaveTransitionHandler = null;
              }
              root.classList.remove(ROOT_LEAVE_CLASS);
              root.style.display = "none";
              wrapper.remove();
              onFullyClosed();
              currentConfig.onClose?.(closeContext);
              currentConfig.onAfterClose?.(closeContext);
              if (lastFocusTarget && typeof lastFocusTarget.focus === "function") lastFocusTarget.focus();
            };
            leaveTransitionHandler = onEnd;
            root.addEventListener("transitionend", onEnd, { once: true });
            leaveTimeout = setTimeout(onEnd, leaveMs + 50);
          } else {
            root.style.display = "none";
            wrapper.remove();
            onFullyClosed();
            currentConfig.onClose?.(closeContext);
            currentConfig.onAfterClose?.(closeContext);
            if (lastFocusTarget && typeof lastFocusTarget.focus === "function") lastFocusTarget.focus();
          }
        }

        if (openSubmenus.length > 0) {
          const toClose = openSubmenus.slice();
          openSubmenus.length = 0;
          let idx = toClose.length - 1;
          const closeNext = (): void => {
            if (idx < 0) {
              doRootClose();
              return;
            }
            const { panel, trigger } = toClose[idx];
            idx--;
            closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: false, onDone: closeNext });
          };
          closeNext();
          return;
        }
        doRootClose();
      })();
    });
  }

  function closeWithSelection(selectedItem?: MenuItem): void {
    if (selectedItem !== undefined) lastSelectedItem = selectedItem;
    void realClose();
  }

  function closePublic(): Promise<void> {
    return realClose();
  }

  function closeSubmenuWithAnimation(
    panel: HTMLElement,
    trigger: HTMLElement,
    options: { clearOpenSubmenu?: boolean; onDone?: () => void } = {}
  ): void {
    const { clearOpenSubmenu = true, onDone } = options;
    const anim = currentConfig.animation;
    const rawLeave = anim?.leave ?? 80;
    const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);

    const finish = (): void => {
      panel.remove();
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.remove(SUBMENU_OPEN_CLASS);
      if (clearOpenSubmenu) {
        const idx = openSubmenus.findIndex((e) => e.panel === panel);
        if (idx >= 0) openSubmenus.splice(idx, 1);
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

  async function openSubmenuPanel(sub: MenuItemSubmenu, triggerEl: HTMLElement): Promise<void> {
    let containIndex = -1;
    if (root.contains(triggerEl)) {
      containIndex = -1;
    } else {
      for (let i = 0; i < openSubmenus.length; i++) {
        if (openSubmenus[i].panel.contains(triggerEl)) {
          containIndex = i;
          break;
        }
      }
    }
    for (let j = openSubmenus.length - 1; j > containIndex; j--) {
      const { panel: p, trigger: t } = openSubmenus[j];
      closeSubmenuWithAnimation(p, t, { clearOpenSubmenu: true });
    }
    const resolvedChildren = await resolveSubmenuChildren(sub.children);
    const panel = document.createElement("div");
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-label", sub.label);
    panel.setAttribute("aria-orientation", "vertical");
    panel.setAttribute("tabindex", "-1");
    panel.className = `${ROOT_CLASS} ${CLASS_SUBMENU}`;
    panel.addEventListener("mouseenter", cancelSubmenuClose);
    applyThemeToElement(panel, currentConfig.theme);
    applyAnimationConfig(panel, currentConfig);
    const step = currentConfig.position?.submenuZIndexStep ?? 0;
    const base = currentConfig.position?.zIndexBase ?? 9999;
    if (step > 0) {
      panel.style.zIndex = String(base + (openSubmenus.length + 1) * step);
    }

    resolvedChildren.forEach((child) => {
      const node = createItemNode(child, closeWithSelection, (subItem, el) => void openSubmenuPanel(subItem as MenuItemSubmenu, el), scheduleSubmenuOpen, scheduleSubmenuClose, makeHoverFocusHandler(panel), onEnterMenuItem, submenuArrowConfig, refreshContent, (it, ev) => currentConfig.onItemHover?.({ item: it, nativeEvent: ev }), getSpinnerOptions);
      if (node) panel.appendChild(node);
    });

    wrapper.appendChild(panel);
    const triggerRect = triggerEl.getBoundingClientRect();
    const padding = currentConfig.position?.padding ?? 8;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const isRtl = getComputedStyle(triggerEl).direction === "rtl";
    const placement = sub.submenuPlacement ?? currentConfig.submenuPlacement ?? "auto";
    panel.style.display = "";
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
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    triggerEl.setAttribute("aria-expanded", "true");
    triggerEl.classList.add(SUBMENU_OPEN_CLASS);
    openSubmenus.push({ panel, trigger: triggerEl });

    requestAnimationFrame(() => {
      panel.classList.add(ROOT_OPEN_CLASS);
    });
  }

  function scheduleSubmenuOpen(sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
    const top = openSubmenus[openSubmenus.length - 1];
    if (top && top.trigger === triggerEl) {
      triggerEl.focus();
      return;
    }
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = setTimeout(() => {
      submenuHoverTimer = null;
      const currentTop = openSubmenus[openSubmenus.length - 1];
      if (currentTop && currentTop.trigger === triggerEl) return;
      void openSubmenuPanel(sub, triggerEl);
    }, SUBMENU_HOVER_DELAY_MS);
  }

  function scheduleSubmenuClose(triggerEl: HTMLElement): void {
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = setTimeout(() => {
      submenuHoverTimer = null;
      const idx = openSubmenus.findIndex((e) => e.trigger === triggerEl);
      if (idx < 0) return;
      for (let j = openSubmenus.length - 1; j >= idx; j--) {
        const { panel, trigger } = openSubmenus[j];
        closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true });
      }
    }, SUBMENU_CLOSE_DELAY_MS);
  }

  function cancelSubmenuClose(): void {
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = null;
  }

  function closeAllSubmenus(): void {
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    submenuHoverTimer = null;
    if (openSubmenus.length === 0) return;
    for (let j = openSubmenus.length - 1; j >= 0; j--) {
      const { panel, trigger } = openSubmenus[j];
      closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true });
    }
  }

  function onEnterMenuItem(el: HTMLElement): void {
    if (openSubmenus.length === 0) return;
    cancelSubmenuClose();
    const menuEl = el.closest("[role='menu']") as HTMLElement | null;
    if (!menuEl) return;
    let levelIndex = -1;
    if (menuEl !== root) {
      for (let i = 0; i < openSubmenus.length; i++) {
        if (openSubmenus[i].panel === menuEl) {
          levelIndex = i;
          break;
        }
      }
    }
    for (let j = openSubmenus.length - 1; j > levelIndex; j--) {
      const { panel, trigger } = openSubmenus[j];
      closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true });
    }
  }

  function triggerSubmenu(sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
    void openSubmenuPanel(sub, triggerEl);
  }

  function refreshContent(): void {
    if (isOpen && typeof currentConfig.menu === "function") {
      menu = currentConfig.menu().map(normalizeItem);
      buildRootContent();
    }
  }

  function getSpinnerOptions(it: MenuItem): SpinnerConfig {
    const base = currentConfig.spinner ?? {};
    const hasOverrides =
      it &&
      typeof it === "object" &&
      ("loadingIcon" in it || "loadingSize" in it || "loadingSpeed" in it);
    if (!hasOverrides) return base;
    return {
      ...base,
      ...("loadingIcon" in it && it.loadingIcon !== undefined && { icon: it.loadingIcon }),
      ...("loadingSize" in it && it.loadingSize !== undefined && { size: it.loadingSize }),
      ...("loadingSpeed" in it && it.loadingSpeed !== undefined && { speed: it.loadingSpeed }),
    };
  }

  function buildRootContent(): void {
    root.innerHTML = "";
    menu.forEach((item) => {
      const node = createItemNode(item, closeWithSelection, triggerSubmenu, scheduleSubmenuOpen, scheduleSubmenuClose, makeHoverFocusHandler(root), onEnterMenuItem, submenuArrowConfig, refreshContent, (it, ev) => currentConfig.onItemHover?.({ item: it, nativeEvent: ev }), getSpinnerOptions);
      if (node) root.appendChild(node);
    });
  }

  function open(xOrEvent?: number | MouseEvent, y?: number): Promise<MenuItem | undefined> {
    return new Promise((resolve) => {
      openPromiseResolve = resolve;
      (async () => {
        if (typeof currentConfig.menu === "function") {
          menu = currentConfig.menu().map(normalizeItem);
        }
        const openEvent = typeof xOrEvent === "object" && xOrEvent !== null ? xOrEvent : undefined;
        let x: number;
        let yCoord: number;
        if (openEvent) {
          x = openEvent.clientX;
          yCoord = openEvent.clientY;
        } else {
          const noCoords = xOrEvent === undefined && y === undefined;
          if (noCoords && currentConfig.getAnchor) {
            const anchor = currentConfig.getAnchor();
            const coords = getCoordsFromAnchor(anchor);
            x = coords.x;
            yCoord = coords.y;
          } else {
            x = (xOrEvent as number) ?? 0;
            yCoord = y ?? 0;
          }
        }
        const openContext: OpenContext = {
          x,
          y: yCoord,
          target: openEvent?.target instanceof Element ? openEvent.target : null,
          event: openEvent,
        };
        const allow = await Promise.resolve(currentConfig.onBeforeOpen?.(openEvent, openContext));
        if (allow === false) {
          openPromiseResolve?.(undefined);
          openPromiseResolve = null;
          return;
        }
        OPEN_MENU_INSTANCES.add(self);
        const others = [...OPEN_MENU_INSTANCES].filter((o) => o !== self);
        await Promise.all(others.map((o) => o.close()));
        cancelLeaveAnimation();
        if (isOpen) await realClose();
        lastAnchor = { x, y: yCoord };
        lastSelectedItem = undefined;
        lastFocusTarget = document.activeElement as HTMLElement | null;
        isOpen = true;
        buildRootContent();
        if (!wrapper.parentElement) portal.appendChild(wrapper);
    outsideClickHandler = (e: MouseEvent): void => {
      if (!wrapper.contains(e.target as Node)) void closePublic();
    };
    document.addEventListener("mousedown", outsideClickHandler, true);
    if (currentConfig.closeOnResize) {
      resizeHandler = (): void => void closePublic();
          window.addEventListener("resize", resizeHandler);
        }
        positionMenu(root, x, yCoord, currentConfig);
        root.style.display = "";

        const anim = currentConfig.animation;
        if (anim?.disabled) {
          root.classList.add(ROOT_OPEN_CLASS);
          currentConfig.onOpen?.(openEvent);
          const items = getFocusableItems(root);
          if (items.length) setRovingTabindex(items, 0);
          return;
        }
        root.getClientRects();
        requestAnimationFrame(() => {
          root.classList.add(ROOT_OPEN_CLASS);
          currentConfig.onOpen?.(openEvent);
          const items = getFocusableItems(root);
          if (items.length) setRovingTabindex(items, 0);
        });
      })();
    });
  }

  function handleKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const menuEl = target.closest("[role='menu']") as HTMLElement;
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
        const next = (idx + 1) % items.length;
        setRovingTabindex(items, next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = idx === 0 ? items.length - 1 : idx - 1;
        setRovingTabindex(items, prev);
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        const sub = (target as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu;
        if (sub) void openSubmenuPanel(sub, target);
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (isSub && openSubmenus.length > 0) {
          const { panel, trigger } = openSubmenus[openSubmenus.length - 1];
          closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true, onDone: () => trigger.focus() });
        } else {
          void closePublic();
        }
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        const sub = (target as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu;
        if (sub) void openSubmenuPanel(sub, target);
        else target.click();
        break;
      }
      case "Escape": {
        e.preventDefault();
        if (isSub && openSubmenus.length > 0) {
          const { panel, trigger } = openSubmenus[openSubmenus.length - 1];
          closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true, onDone: () => trigger.focus() });
        } else {
          void closePublic();
        }
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
          const sub = (el as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu;
          const it = sub ?? (el as unknown as { _cmItem?: MenuItem })._cmItem;
          if (!it || !("shortcut" in it) || !it.shortcut) return false;
          return shortcutMatchesEvent(it.shortcut, e);
        });
        if (itemWithShortcut) {
          e.preventDefault();
          const sub = (itemWithShortcut as unknown as { _cmSubmenu?: MenuItemSubmenu })._cmSubmenu;
          if (sub) {
            void openSubmenuPanel(sub, itemWithShortcut);
            requestAnimationFrame(() => {
              const last = openSubmenus[openSubmenus.length - 1];
              if (last) {
                const subItems = getFocusableItems(last.panel);
                if (subItems.length) setRovingTabindex(subItems, 0);
              }
            });
          } else {
            itemWithShortcut.click();
          }
        }
        break;
      }
    }
  }

  wrapper.addEventListener("keydown", handleKeydown);

  function clearLongPressTimer(): void {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function unbind(el?: HTMLElement): void {
    if (el != null && boundElement !== el) return;
    if (!boundElement) return;
    clearLongPressTimer();
    if (boundContextmenu) boundElement.removeEventListener("contextmenu", boundContextmenu);
    if (boundTouchstart) boundElement.removeEventListener("touchstart", boundTouchstart);
    boundElement.removeEventListener("touchend", boundTouchEndOrCancel);
    boundElement.removeEventListener("touchcancel", boundTouchEndOrCancel);
    boundElement = null;
    boundContextmenu = null;
    boundTouchstart = null;
  }

  function bind(el: HTMLElement, options?: BindOptions): void {
    unbind();
    const longPressMs = options?.longPressMs ?? DEFAULT_LONG_PRESS_MS;
    boundContextmenu = (e: MouseEvent): void => {
      e.preventDefault();
      if ("pointerType" in e && (e as PointerEvent).pointerType === "touch") return;
      open(e);
    };
    boundTouchstart = (e: TouchEvent): void => {
      if (e.touches.length !== 1) return;
      clearLongPressTimer();
      longPressX = e.touches[0].clientX;
      longPressY = e.touches[0].clientY;
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        open(longPressX, longPressY);
      }, longPressMs);
    };
    boundTouchEndOrCancel = (): void => clearLongPressTimer();
    el.addEventListener("contextmenu", boundContextmenu);
    el.addEventListener("touchstart", boundTouchstart, { passive: true });
    el.addEventListener("touchend", boundTouchEndOrCancel, { passive: true });
    el.addEventListener("touchcancel", boundTouchEndOrCancel, { passive: true });
    boundElement = el;
  }

  function destroy(): void {
    unbind();
    if (outsideClickHandler) {
      document.removeEventListener("mousedown", outsideClickHandler, true);
      outsideClickHandler = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    if (leaveTimeout) clearTimeout(leaveTimeout);
    if (submenuHoverTimer) clearTimeout(submenuHoverTimer);
    wrapper.remove();
    wrapper.removeEventListener("keydown", handleKeydown);
  }

  function setMenu(newMenu: MenuItem[]): void {
    menu = newMenu.map(normalizeItem);
    if (isOpen) buildRootContent();
  }

  function updateMenu(updater: (current: MenuItem[]) => MenuItem[]): void {
    setMenu(updater(deepCloneMenu(menu)));
  }

  function setTheme(theme: ContextMenuConfig["theme"]): void {
    currentConfig.theme = theme;
    applyThemeToElement(root, theme);
    for (const { panel } of openSubmenus) {
      applyThemeToElement(panel, theme);
    }
  }

  function setPosition(position: ContextMenuConfig["position"]): void {
    currentConfig.position = position;
  }

  function setAnimation(animation: ContextMenuConfig["animation"]): void {
    currentConfig.animation = animation;
    applyAnimationConfig(root, currentConfig);
    for (const { panel } of openSubmenus) {
      applyAnimationConfig(panel, currentConfig);
    }
  }

  type Placement = NonNullable<OpenAtElementOptions["placement"]>;

  function openAtElement(element: HTMLElement, options?: OpenAtElementOptions): void {
    const offset = options?.offset ?? { x: 0, y: 0 };
    const rect = element.getBoundingClientRect();
    let placement: Placement = options?.placement ?? "bottom-start";
    if (placement === "auto") {
      const padding = currentConfig.position?.padding ?? 8;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
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
      case "bottom-start":
        x = rect.left;
        y = rect.bottom;
        break;
      case "bottom-end":
        x = rect.right;
        y = rect.bottom;
        break;
      case "top-start":
        x = rect.left;
        y = rect.top;
        break;
      case "top-end":
        x = rect.right;
        y = rect.top;
        break;
      case "left-start":
        x = rect.left;
        y = rect.top;
        break;
      case "left-end":
        x = rect.left;
        y = rect.bottom;
        break;
      case "right-start":
        x = rect.right;
        y = rect.top;
        break;
      case "right-end":
        x = rect.right;
        y = rect.bottom;
        break;
      default:
        x = rect.left;
        y = rect.bottom;
    }
    open(x + offset.x, y + offset.y);
  }

  const instance: ContextMenuInstance = {
    open,
    close: closePublic,
    toggle(x?: number, y?: number) {
      if (isOpen) void closePublic();
      else void open(x ?? 0, y ?? 0);
    },
    openAtElement,
    isOpen: () => isOpen,
    getAnchor: () => lastAnchor,
    getMenu: () => deepCloneMenu(menu),
    getRootElement: () => wrapper,
    updateMenu,
    bind,
    unbind,
    destroy,
    setMenu,
    setTheme,
    setPosition,
    setAnimation,
  };

  const bindConfig = currentConfig.bind;
  if (bindConfig != null) {
    const el = bindConfig instanceof HTMLElement ? bindConfig : bindConfig.element;
    const options = bindConfig instanceof HTMLElement ? undefined : bindConfig.options;
    bind(el, options);
  }

  return instance;
}
