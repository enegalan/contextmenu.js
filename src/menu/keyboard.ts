import type { ContextMenuState } from "../lib/types.js";
import { CLASSES, MENU_ROLE_SELECTOR } from "../lib/constants.js";
import { getCmItem, getCmSubmenu } from "./item-nodes";
import { shortcutMatchesEvent } from "../utils/index.js";

/**
 * Gets the focusable items from a menu element.
 * @param menuEl - The menu element to get the focusable items from.
 * @returns The focusable items from the menu element.
 */
export function getFocusableItems(menuEl: HTMLElement): HTMLElement[] {
  return Array.from(
    menuEl.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([aria-disabled='true']), [role='menuitemcheckbox']:not([aria-disabled='true']), [role='menuitemradio']:not([aria-disabled='true'])"
    )
  );
}

/**
 * Sets the roving tabindex on a list of items.
 * @param items - The items to set the roving tabindex on.
 * @param focusedIndex - The index of the focused item.
 */
export function setRovingTabindex(items: HTMLElement[], focusedIndex: number): void {
  items.forEach((node, i) => {
    node.setAttribute("tabindex", i === focusedIndex ? "0" : "-1");
  });
  if (items[focusedIndex]) items[focusedIndex].focus();
}

/**
 * Clears the roving focus on a menu element.
 * @param menuEl - The menu element to clear the roving focus on.
 */
export function clearRovingFocus(menuEl: HTMLElement | null): void {
  if (!menuEl) return;
  const items = getFocusableItems(menuEl);
  items.forEach((node) => node.setAttribute("tabindex", "-1"));
  menuEl.focus();
}

/**
 * Makes a hover focus handler.
 * @param menuEl - The menu element to make the hover focus handler for.
 * @returns The hover focus handler.
 */
export function makeHoverFocusHandler(menuEl: HTMLElement): (el: HTMLElement) => void {
  return (el: HTMLElement) => {
    const items = getFocusableItems(menuEl);
    const idx = items.indexOf(el);
    if (idx >= 0) setRovingTabindex(items, idx);
  };
}

/**
 * Handles a keydown event.
 * @param state - The state of the context menu.
 * @param e - The keyboard event.
 */
export function handleKeydown(state: ContextMenuState, e: KeyboardEvent): void {
  const target = e.target as HTMLElement;
  const menuEl = target.closest(MENU_ROLE_SELECTOR) as HTMLElement;
  if (!menuEl) return;
  const isSub = menuEl.classList.contains(CLASSES.SUBMENU);
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
