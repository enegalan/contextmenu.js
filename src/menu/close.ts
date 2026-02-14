import type { CloseContext, ContextMenuState } from "../lib/types.js";
import { ROOT } from "../lib/constants.js";
import { OPEN_MENU_INSTANCES } from "../lib/instances.js";
import { setStyles } from "../utils/index.js";
import { runAfterLeaveAnimation } from "./animation.js";
import { enableScrollLock, disableScrollLock } from "./scroll-lock.js";
import { closeSubmenuWithAnimation } from "./submenu.js";

/**
 * Cancels the leave animation.
 * @param state - The state of the context menu.
 * @returns The function to cancel the leave animation.
 */
export function cancelLeaveAnimation(state: ContextMenuState): void {
  state.leaveAnimationCancel?.();
  state.leaveAnimationCancel = undefined;
  state.root.classList.remove(ROOT.LEAVE_CLASS);
}

/**
 * Closes the menu.
 * @param state - The state of the context menu.
 * @returns The promise to resolve the close.
 */
export function realClose(state: ContextMenuState): Promise<void> {
  return new Promise((resolve) => {
    (async () => {
      disableScrollLock(state);
      const allow = await Promise.resolve(state.currentConfig.onBeforeClose?.());
      if (allow === false) {
        if (state.isOpen) enableScrollLock(state);
        resolve();
        return;
      }
      if (!state.isOpen) {
        resolve();
        return;
      }
      state.closePromiseResolve = resolve;
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
            _performRootClose(state);
            return;
          }
          const { panel, trigger } = toClose[idx];
          idx--;
          closeSubmenuWithAnimation(panel, trigger, state, { clearOpenSubmenu: false, onDone: closeNext });
        };
        closeNext();
        return;
      }
      _performRootClose(state);
    })();
  });
}

/**
 * @private
 * Called when the root is fully closed.
 * @param state - The state of the context menu.
 * @returns The function to cancel the leave animation.
 */
function _onFullyClosed(state: ContextMenuState): void {
  OPEN_MENU_INSTANCES.delete(state.self);
  state.openPromiseResolve?.(state.lastSelectedItem);
  state.openPromiseResolve = null;
  state.closePromiseResolve?.();
  state.closePromiseResolve = null;
}

/**
 * @private
 * Performs the root close.
 * @param state - The state of the context menu.
 * @returns The function to cancel the leave animation.
 */
function _performRootClose(state: ContextMenuState): void {
  const anim = state.currentConfig.animation;
  const rawLeave = anim?.leave ?? 80;
  const leaveMs: number = anim?.disabled ? 0 : (typeof rawLeave === "number" ? rawLeave : rawLeave.duration);
  const closeContext: CloseContext = { selectedItem: state.lastSelectedItem, anchor: state.lastAnchor };

  if (leaveMs > 0 && !anim?.disabled) {
    state.root.classList.remove(ROOT.OPEN_CLASS);
    state.root.classList.add(ROOT.LEAVE_CLASS);
    const onEnd = (): void => {
      state.leaveAnimationCancel = undefined;
      state.root.classList.remove(ROOT.LEAVE_CLASS);
      setStyles(state.root, { display: "none" });
      state.wrapper.remove();
      _onFullyClosed(state);
      state.currentConfig.onClose?.(closeContext);
      state.currentConfig.onAfterClose?.(closeContext);
      if (state.lastFocusTarget && typeof state.lastFocusTarget.focus === "function") state.lastFocusTarget.focus();
    };
    state.leaveAnimationCancel = runAfterLeaveAnimation(state.root, leaveMs, onEnd).cancel;
  } else {
    setStyles(state.root, { display: "none" });
    state.wrapper.remove();
    _onFullyClosed(state);
    state.currentConfig.onClose?.(closeContext);
    state.currentConfig.onAfterClose?.(closeContext);
    if (state.lastFocusTarget && typeof state.lastFocusTarget.focus === "function") state.lastFocusTarget.focus();
  }
}
