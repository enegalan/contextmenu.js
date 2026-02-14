import type { ModifierSymbol, ShortcutPart } from "../lib/types.js";
import { MAC_MODIFIER_SYMBOLS, SHORTCUT_KEY_SYMBOLS, WIN_MODIFIER_SYMBOLS } from "../lib/constants.js";

/**
 * Gets the parts of a shortcut.
 * @param shortcut - The shortcut to get the parts of.
 * @param platformOverride - The platform to override the default platform.
 * @returns The parts of the shortcut.
 */
export function getShortcutParts(
  shortcut: string,
  platformOverride?: "mac" | "win" | "auto"
): { mods: ShortcutPart[]; key: ShortcutPart; useCmd: boolean } | null {
  if (!shortcut || typeof shortcut !== "string") return null;
  const parts = shortcut.split("+").map((p) => p.trim());
  if (parts.length === 0) return null;
  const keyPart = parts[parts.length - 1] ?? "";
  const modParts = parts.slice(0, -1).map((p) => p.toLowerCase());
  const keyLower = keyPart.toLowerCase();
  const keyDisplay = SHORTCUT_KEY_SYMBOLS[keyLower] ?? (keyPart.length === 1 ? keyPart.toUpperCase() : keyPart);
  const useCmd = platformOverride === "win" ? false : platformOverride === "mac" ? true : _isMacLikePlatform();
  const symbolMap = useCmd ? MAC_MODIFIER_SYMBOLS : WIN_MODIFIER_SYMBOLS;
  const mods: ShortcutPart[] = modParts.map((m) => ({
    name: m,
    display:
      useCmd && m === "ctrl"
        ? MAC_MODIFIER_SYMBOLS.cmd
        : SHORTCUT_KEY_SYMBOLS[m] ?? _modifierDisplay(symbolMap[m as keyof typeof symbolMap], m),
  }));
  return {
    mods,
    key: { name: keyLower, display: keyDisplay },
    useCmd,
  };
}

/**
 * Checks if a shortcut matches a keyboard event.
 * @param shortcut - The shortcut to check.
 * @param e - The keyboard event to check.
 * @returns True if the shortcut matches the event, false otherwise.
 */
export function shortcutMatchesEvent(shortcut: string, e: KeyboardEvent): boolean {
  const parts = shortcut.split("+").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;

  const keyPart = parts[parts.length - 1] ?? "";
  if (_normalizeKeyForShortcut(keyPart) !== _normalizeKeyForShortcut(e.key)) return false;

  const mods = parts.slice(0, -1).map((p) => p.toLowerCase());
  const wantsCtrlOrCmd = mods.includes("ctrl") || mods.includes("cmd");

  if (wantsCtrlOrCmd) {
    const useCmd = _isMacLikePlatform();
    const correctPressed = useCmd ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
    if (!correctPressed) return false;
  } else if (e.ctrlKey || e.metaKey) return false;

  const modifierMatches = (modName: string, pressed: boolean): boolean =>
    mods.includes(modName) ? pressed : !pressed;
  if (!modifierMatches("alt", e.altKey)) return false;
  if (!modifierMatches("shift", e.shiftKey)) return false;
  return true;
}

/**
 * @private
 * Checks if the platform is Mac-like.
 * @returns True if the platform is Mac-like, false otherwise.
 */
function _isMacLikePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform;
  if (uaData === "macOS" || uaData === "iOS") return true;
  const ua = navigator.userAgent ?? "";
  return /Mac|iPhone|iPod|iPad/i.test(ua);
}

/**
 * @private
 * Gets the display of a modifier.
 * @param v - The modifier to get the display of.
 * @param fallback - The fallback to use if the modifier is not found.
 * @returns The display of the modifier.
 */
function _modifierDisplay(v: ModifierSymbol | undefined, fallback: string): string {
  if (v == null) return fallback;
  return typeof v === "string" ? v : v.text;
}

/**
 * @private
 * Normalizes a key for a shortcut.
 * @param key - The key to normalize.
 * @returns The normalized key.
 */
function _normalizeKeyForShortcut(key: string): string {
  if (key.length === 1) return key.toLowerCase();
  return key;
}
