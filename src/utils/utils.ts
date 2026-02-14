import type { ContextMenuConfig, MenuItemVariant } from "../lib/types.js";
import { ATTRS, CSS_VARS, ID_PREFIX } from "../lib/constants.js";

/**
 * Checks if a value is a mouse event.
 * @param x - The value to check.
 * @returns True if the value is a mouse event, false otherwise.
 */
export function isOpenMouseEvent(x: unknown): x is MouseEvent {
  return typeof x === "object" && x !== null && "clientX" in x && "clientY" in x;
}

/**
 * Gets the portal element.
 * @param portal - The portal to get.
 * @returns The portal element.
 */
export function getPortal(portal: ContextMenuConfig["portal"]): HTMLElement {
  if (portal == null) return document.body;
  return typeof portal === "function" ? portal() : portal;
}

/**
 * Gets the viewport size.
 * @returns The viewport size.
 */
export function getViewportSize(): { vw: number; vh: number } {
  const el = document.documentElement;
  return { vw: el.clientWidth, vh: el.clientHeight };
}

/**
 * Sets attributes on an element.
 * @param el - The element to set attributes on.
 * @param attrs - The attributes to set.
 */
export function setAttrs(el: HTMLElement, attrs: Record<string, string>): void {
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

/**
 * Sets styles on an element.
 * @param el - The element to set styles on.
 * @param styles - The styles to set.
 */
export function setStyles(el: HTMLElement, styles: Record<string, string>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (key.startsWith("--")) {
      el.style.setProperty(key, value);
    } else {
      (el.style as unknown as Record<string, string>)[key] = value;
    }
  }
}

/**
 * Adds classes to an element.
 * @param el - The element to add classes to.
 * @param classes - The classes to add.
 */
export function addClasses(el: HTMLElement, ...classes: (string | undefined | null | false)[]): void {
  for (const c of classes) {
    if (!c) continue;
    el.classList.add(...c.trim().split(/\s+/).filter(Boolean));
  }
}

/**
 * Converts a size to CSS.
 * @param size - The size to convert.
 * @returns The CSS size.
 */
export function sizeToCss(size: number | string): string {
  return typeof size === "number" ? `${size}px` : size;
}

/**
 * Gets the coordinates from an anchor.
 * @param anchor - The anchor to get the coordinates from.
 * @returns The coordinates from the anchor.
 */
export function getCoordsFromAnchor(anchor: { x: number; y: number } | DOMRect): { x: number; y: number } {
  if ("width" in anchor && "height" in anchor) {
    const rect = anchor as DOMRect;
    return { x: rect.left + rect.width / 2, y: rect.top };
  }
  return anchor as { x: number; y: number };
}

/**
 * Gets the variant class.
 * @param variant - The variant to get the class for.
 * @returns The variant class.
 */
export function getVariantClass(variant: MenuItemVariant | undefined): string | null {
  if (!variant) return null;
  return `${ID_PREFIX}item--${variant.trim()}`;
}

/**
 * Applies the animation configuration to an element.
 * @param root - The element to apply the animation configuration to.
 * @param config - The configuration to apply.
 */
export function applyAnimationConfig(root: HTMLElement, config: ContextMenuConfig): void {
  const anim = config.animation;
  if (!anim || anim.disabled) return;
  const animType = anim.type === "slide" ? "slide" : "fade";
  root.setAttribute(ATTRS.ANIMATION_TYPE, animType);
  const enter = anim.enter ?? 120;
  const leave = anim.leave ?? 80;
  const enterMs = typeof enter === "number" ? enter : enter.duration;
  const leaveMs = typeof leave === "number" ? leave : leave.duration;
  const enterEasing = typeof enter === "number" ? "ease-out" : enter.easing;
  const leaveEasing = typeof leave === "number" ? "ease-in" : leave.easing;
  setStyles(root, {
    [CSS_VARS.ENTER_DURATION]: `${enterMs}ms`,
    [CSS_VARS.LEAVE_DURATION]: `${leaveMs}ms`,
    [CSS_VARS.ENTER_EASING]: enterEasing,
    [CSS_VARS.LEAVE_EASING]: leaveEasing,
  });
}

/**
 * Applies the theme to an element.
 * @param el - The element to apply the theme to.
 * @param theme - The theme to apply.
 */
export function applyThemeToElement(el: HTMLElement, theme: ContextMenuConfig["theme"]): void {
  const prevClass = el.getAttribute(ATTRS.THEME_CLASS);
  if (prevClass) {
    prevClass.trim().split(/\s+/).forEach((c) => el.classList.remove(c));
  }
  el.removeAttribute(ATTRS.THEME_CLASS);
  if (theme?.class) {
    addClasses(el, ...theme.class.trim().split(/\s+/).filter(Boolean));
    el.setAttribute(ATTRS.THEME_CLASS, theme.class);
  }
  if (theme?.tokens) {
    const tokens: Record<string, string> = {};
    for (const [key, value] of Object.entries(theme.tokens)) {
      tokens[key.startsWith("--") ? key : CSS_VARS.PREFIX + key] = value;
    }
    setStyles(el, tokens);
  }
}
