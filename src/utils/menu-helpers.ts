import type { ContextMenuConfig, MenuItem, MenuItemAction, MenuItemLink, MenuItemSubmenu, SubmenuChildren } from "../lib/types.js";
import { getViewportSize, setStyles } from "./utils.js";

/**
 * Positions the menu element at the given coordinates with flip/shift.
 */
export function positionMenu(el: HTMLElement, x: number, y: number, config: ContextMenuConfig): void {
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
 * Normalizes a menu item.
 * @param raw - The raw menu item.
 * @returns The normalized menu item.
 */
export function normalizeItem(raw: MenuItem): MenuItem {
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
 * Deep clone a menu.
 * @param items - The menu items to clone.
 * @returns The cloned menu items.
 */
export function deepCloneMenu(items: MenuItem[]): MenuItem[] {
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
