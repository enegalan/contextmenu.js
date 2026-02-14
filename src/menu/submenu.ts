import type { ContextMenuState, MenuItem, MenuItemSubmenu } from "../lib/types.js";
import { ROOT, CLASSES, SUBMENU_HOVER_DELAY_MS, SUBMENU_CLOSE_DELAY_MS, MENU_ROLE_SELECTOR } from "../lib/constants.js";
import { setAttrs, setStyles, getViewportSize, applyThemeToElement, applyAnimationConfig, normalizeItem } from "../utils/index.js";
import { runAfterLeaveAnimation } from "./animation.js";
import { createItemNode } from "./item-nodes.js";
import { clearRovingFocus } from "./keyboard.js";

/**
 * Closes a submenu with animation.
 * @param panel - The panel to close.
 * @param trigger - The trigger to close.
 * @param state - The state of the context menu.
 * @param options - The options for the close.
 * @returns The function to close the submenu with animation.
 */
export function closeSubmenuWithAnimation(
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
    trigger.classList.remove(ROOT.SUBMENU_OPEN_CLASS);
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

  panel.classList.remove(ROOT.OPEN_CLASS);
  panel.classList.add(ROOT.LEAVE_CLASS);
  runAfterLeaveAnimation(panel, leaveMs, finish);
}

/**
 * Schedules a submenu open.
 * @param state - The state of the context menu.
 * @param sub - The submenu to open.
 * @param triggerEl - The trigger element to open the submenu.
 * @returns The function to schedule the submenu open.
 */
export function scheduleSubmenuOpen(state: ContextMenuState, sub: MenuItemSubmenu, triggerEl: HTMLElement): void {
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
    void openSubmenuPanel(state, sub, triggerEl);
  }, state.currentConfig.timing?.submenuHoverDelayMs ?? SUBMENU_HOVER_DELAY_MS);
}

/**
 * Schedules a submenu close.
 * @param state - The state of the context menu.
 * @param triggerEl - The trigger element to close the submenu.
 * @returns The function to schedule the submenu close.
 */
export function scheduleSubmenuClose(state: ContextMenuState, triggerEl: HTMLElement): void {
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.submenuHoverTimer = setTimeout(() => {
    state.submenuHoverTimer = null;
    const idx = state.openSubmenus.findIndex((e) => e.trigger === triggerEl);
    if (idx < 0) return;
    for (let j = state.openSubmenus.length - 1; j >= idx; j--) {
      const { panel, trigger } = state.openSubmenus[j];
      state.closeSubmenuWithAnimation(panel, trigger, { clearOpenSubmenu: true });
    }
  }, state.currentConfig.timing?.submenuCloseDelayMs ?? SUBMENU_CLOSE_DELAY_MS);
}

/**
 * Cancels a submenu close.
 * @param state - The state of the context menu.
 * @returns The function to cancel the submenu close.
 */
export function cancelSubmenuClose(state: ContextMenuState): void {
  if (state.submenuHoverTimer) clearTimeout(state.submenuHoverTimer);
  state.submenuHoverTimer = null;
}

/**
 * Handles a menu item enter event.
 * @param state - The state of the context menu.
 * @param el - The element that was entered.
 * @returns The function to handle the menu item enter event.
 */
export function onEnterMenuItem(state: ContextMenuState, el: HTMLElement): void {
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
 * Opens a submenu panel.
 * @param state - The state of the context menu.
 * @param sub - The submenu to open.
 * @param triggerEl - The trigger element to open the submenu.
 * @returns The function to open the submenu panel.
 */
export async function openSubmenuPanel(state: ContextMenuState, sub: MenuItemSubmenu, triggerEl: HTMLElement): Promise<void> {
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
  let resolvedChildren: MenuItem[] = Array.isArray(sub.children) ? sub.children : await sub.children();
  resolvedChildren = resolvedChildren.map(normalizeItem);
  const panel = document.createElement("div");
  setAttrs(panel, { role: "menu", "aria-label": sub.label, "aria-orientation": "vertical", tabindex: "-1" });
  panel.className = `${ROOT.CLASS} ${CLASSES.SUBMENU}`;
  panel.addEventListener("mouseenter", state.cancelSubmenuClose);
  applyThemeToElement(panel, state.currentConfig.theme);
  applyAnimationConfig(panel, state.currentConfig);
  const step = state.currentConfig.position?.submenuZIndexStep ?? 0;
  const base = state.currentConfig.position?.zIndexBase ?? 9999;
  if (step > 0) setStyles(panel, { zIndex: String(base + (state.openSubmenus.length + 1) * step) });

  const fragment = document.createDocumentFragment();
  resolvedChildren.forEach((child) => {
    const node = createItemNode(child, state.closeWithSelection, (subItem, el) => void state.openSubmenuPanel(subItem as MenuItemSubmenu, el), state.scheduleSubmenuOpen, state.scheduleSubmenuClose, state.makeHoverFocusHandler(panel), state.onEnterMenuItem, state.submenuArrowConfig, state.refreshContent, (it, ev) => state.currentConfig.onItemHover?.({ item: it, nativeEvent: ev }), state.getSpinnerOptions, state.currentConfig.shortcutIcons, state.currentConfig.platform, clearRovingFocus);
    if (node) fragment.appendChild(node);
  });
  panel.appendChild(fragment);

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
  triggerEl.classList.add(ROOT.SUBMENU_OPEN_CLASS);
  state.openSubmenus.push({ panel, trigger: triggerEl });

  requestAnimationFrame(() => panel.classList.add(ROOT.OPEN_CLASS));
}
