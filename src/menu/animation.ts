import type { AnimationConfig } from "../lib/types.js";
import { DEFAULT_LEAVE_MS, LEAVE_ANIMATION_SAFETY_MS } from "../lib/constants.js";

/**
 * Returns the leave animation duration in ms. Returns 0 when animation is disabled.
 */
export function getLeaveDurationMs(animation: AnimationConfig | undefined): number {
  if (animation?.disabled) return 0;
  const raw = animation?.leave ?? DEFAULT_LEAVE_MS;
  return typeof raw === "number" ? raw : raw.duration;
}

/**
 * Run a callback after the leave animation ends, either on transitionend or after a safety timeout.
 * Returns a cancel function to clear the listener and timeout.
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
