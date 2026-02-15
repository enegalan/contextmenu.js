import type { ModifierSymbol } from "./types.js";

export const ID_PREFIX = "cm-";
export const CM_ITEM_KEY = "_cmItem";
export const CM_SUBMENU_KEY = "_cmSubmenu";

export const ROOT = {
  CLASS: "cm-menu",
  OPEN_CLASS: "cm-open",
  LEAVE_CLASS: "cm-leave",
  SUBMENU_OPEN_CLASS: "cm-submenu-open",
} as const;

export const SUBMENU_HOVER_DELAY_MS = 200;
export const SUBMENU_CLOSE_DELAY_MS = 150;
export const DEFAULT_LONG_PRESS_MS = 500;
export const LEAVE_ANIMATION_SAFETY_MS = 50;
export const DEFAULT_LEAVE_MS = 80;
export const DEFAULT_SPINNER_SPEED_MS = 600;

export const CLASSES = {
  ICON: "cm-icon",
  SUBMENU_ARROW: "cm-submenu-arrow",
  SUBMENU_ARROW_ICON: "cm-submenu-arrow--icon",
  SEPARATOR: "cm-separator",
  ITEM: "cm-item",
  ITEM_LOADING: "cm-item-loading",
  ITEM_LEADING: "cm-item-leading",
  ITEM_LABEL: "cm-item-label",
  SPINNER: "cm-spinner",
  SPINNER_CUSTOM: "cm-spinner--custom",
  LABEL: "cm-label",
  ITEM_CHECKBOX: "cm-item-checkbox",
  CHECKED: "cm-checked",
  CHECK: "cm-check",
  CHECK_CUSTOM: "cm-check--custom",
  SHORTCUT: "cm-shortcut",
  SHORTCUT_ICON: "cm-shortcut-icon",
  ITEM_BADGE: "cm-item-badge",
  ITEM_RADIO: "cm-item-radio",
  RADIO: "cm-radio",
  RADIO_CUSTOM: "cm-radio--custom",
  SUBMENU_TRIGGER: "cm-submenu-trigger",
  WRAPPER: "cm-wrapper",
  SUBMENU: "cm-submenu",
} as const;

export const MENU_ROLE_SELECTOR = "[role='menu']";

export const ATTRS = {
  THEME_CLASS: "data-cm-theme-class",
  ANIMATION_TYPE: "data-cm-animation",
} as const;

export const CSS_VARS = {
  PREFIX: "--cm-",
  SPINNER_DURATION: "--cm-spinner-duration",
  ENTER_DURATION: "--cm-enter-duration",
  LEAVE_DURATION: "--cm-leave-duration",
  ENTER_EASING: "--cm-enter-easing",
  LEAVE_EASING: "--cm-leave-easing",
  SUBMENU_ARROW_SIZE: "--cm-submenu-arrow-size",
} as const;

const WIN_KEY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4875 4875" fill="currentColor" aria-hidden="true"><path xmlns="http://www.w3.org/2000/svg" fill="currentColor" d="M0 0h2311v2310H0zm2564 0h2311v2310H2564zM0 2564h2311v2311H0zm2564 0h2311v2311H2564"/></svg>';

export const DEFAULT_SUBMENU_ARROW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/></svg>';

export const MAC_MODIFIER_SYMBOLS: Record<string, string> = {
  cmd: "⌘",
  alt: "⌥",
  win: "⌘",
  windows: "⌘",
};

export const WIN_MODIFIER_SYMBOLS: Record<string, ModifierSymbol> = {
  cmd: "⊞",
  alt: "⎇",
  win: { text: "⊞", icon: WIN_KEY_ICON },
  windows: { text: "⊞", icon: WIN_KEY_ICON },
};

export const SHORTCUT_KEY_SYMBOLS: Record<string, string> = {
  ctrl: "⌃",
  shift: "⇧",
  enter: "↵",
  return: "↵",
  tab: "⇥",
  backspace: "⌫",
  escape: "⎋",
  esc: "⎋",
  delete: "⌦",
  space: "␣",
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
  home: "⇱",
  end: "⇲",
  pageup: "⇞",
  pagedown: "⇟",
  insert: "⎀",
  ins: "⎀",
};
