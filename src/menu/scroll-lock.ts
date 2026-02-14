import type { ContextMenuState } from "../lib/types.js";

/**
 * Enables scroll lock.
 * @param state - The state of the context menu.
 */
export function enableScrollLock(state: ContextMenuState): void {
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
 * Disables scroll lock.
 * @param state - The state of the context menu.
 */
export function disableScrollLock(state: ContextMenuState): void {
  if (!state.scrollLockHandler) return;
  const listener = state.scrollLockHandler as unknown as EventListener;
  document.removeEventListener("wheel", listener, true);
  document.removeEventListener("touchmove", listener, true);
  state.scrollLockHandler = null;
}
