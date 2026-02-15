import type { AnimationConfig, CloseContext, ContextMenuInstanceState } from "../lib/types.js";
import { DEFAULT_LEAVE_MS, LEAVE_ANIMATION_SAFETY_MS, ROOT } from "../lib/constants.js";
import { OPEN_MENU_INSTANCES } from "../lib/instances.js";
import { addClasses, removeClasses, setStyles } from "../utils/index.js";
import { closeSubmenuWithAnimation } from "./submenu.js";

/**
 * Gets the leave duration in milliseconds.
 * @param animation - The animation configuration.
 * @returns The leave duration in milliseconds.
 */
export function getLeaveDurationMs(animation: AnimationConfig | undefined): number {
  if (animation?.disabled) return 0;
  const raw = animation?.leave ?? DEFAULT_LEAVE_MS;
  return typeof raw === "number" ? raw : raw.duration;
}

/**
 * Runs the after leave animation.
 * @param panel - The panel to run the animation on.
 * @param leaveMs - The leave duration in milliseconds.
 * @param onEnd - The function to call when the animation ends.
 * @returns The function to cancel the animation.
 */
export function runAfterLeaveAnimation(
  panel: HTMLElement,
  leaveMs: number,
  onEnd: () => void
): { cancel(): void } {
  let done = false;
  let t: ReturnType<typeof setTimeout>;
  const finish = (): void => {
    if (done) return;
    done = true;
    clearTimeout(t);
    panel.removeEventListener("transitionend", finish);
    onEnd();
  };
  panel.addEventListener("transitionend", finish, { once: true });
  t = setTimeout(finish, leaveMs + LEAVE_ANIMATION_SAFETY_MS);
  return {
    cancel(): void {
      if (done) return;
      done = true;
      clearTimeout(t);
      panel.removeEventListener("transitionend", finish);
    },
  };
}

/**
 * Enables the scroll lock.
 * @param state - The state of the context menu.
 * @returns The function to enable the scroll lock.
 */
export function enableScrollLock(state: ContextMenuInstanceState): void {
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
 * Disables the scroll lock.
 * @param state - The state of the context menu.
 * @returns The function to disable the scroll lock.
 */
export function disableScrollLock(state: ContextMenuInstanceState): void {
  if (!state.scrollLockHandler) return;
  const listener = state.scrollLockHandler as unknown as EventListener;
  document.removeEventListener("wheel", listener, true);
  document.removeEventListener("touchmove", listener, true);
  state.scrollLockHandler = null;
}

/**
 * Cancels the leave animation.
 * @param state - The state of the context menu.
 * @returns The function to cancel the leave animation.
 */
export function cancelLeaveAnimation(state: ContextMenuInstanceState): void {
  state.leaveAnimationCancel?.();
  state.leaveAnimationCancel = undefined;
  removeClasses(state.root, ROOT.LEAVE_CLASS);
}

/**
 * Closes the menu.
 * @param state - The state of the context menu.
 * @returns The promise to resolve the close.
 */
export function realClose(state: ContextMenuInstanceState): Promise<void> {
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
        let next: () => void = () => _performRootClose(state);
        for (let i = toClose.length - 1; i >= 0; i--) {
          const { panel, trigger } = toClose[i];
          const prev = next;
          next = () => closeSubmenuWithAnimation(panel, trigger, state, { clearOpenSubmenu: false, onDone: prev });
        }
        next();
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
function _onFullyClosed(state: ContextMenuInstanceState): void {
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
function _performRootClose(state: ContextMenuInstanceState): void {
  const leaveMs = getLeaveDurationMs(state.currentConfig.animation);
  const closeContext: CloseContext = { selectedItem: state.lastSelectedItem, anchor: state.lastAnchor };
  if (leaveMs > 0) {
    removeClasses(state.root, ROOT.OPEN_CLASS);
    addClasses(state.root, ROOT.LEAVE_CLASS);
    const onEnd = (): void => {
      state.leaveAnimationCancel = undefined;
      removeClasses(state.root, ROOT.LEAVE_CLASS);
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
