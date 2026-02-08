import type { ModifierSymbol } from "./types.js";

export const ID_PREFIX = "cm-";
export const CM_ITEM_KEY = "_cmItem";
export const CM_SUBMENU_KEY = "_cmSubmenu";

export const ROOT_CLASS = "cm-menu";
export const ROOT_OPEN_CLASS = "cm-open";
export const ROOT_LEAVE_CLASS = "cm-leave";
export const SUBMENU_OPEN_CLASS = "cm-submenu-open";

export const SUBMENU_HOVER_DELAY_MS = 200;
export const SUBMENU_CLOSE_DELAY_MS = 150;
export const DEFAULT_LONG_PRESS_MS = 500;
export const DEFAULT_SPINNER_SPEED_MS = 600;

export const CLASS_ICON = "cm-icon";
export const CLASS_SUBMENU_ARROW = "cm-submenu-arrow";
export const CLASS_SUBMENU_ARROW_ICON = "cm-submenu-arrow--icon";
export const CLASS_SEPARATOR = "cm-separator";
export const CLASS_ITEM = "cm-item";
export const CLASS_ITEM_LOADING = "cm-item-loading";
export const CLASS_ITEM_LEADING = "cm-item-leading";
export const CLASS_ITEM_LABEL = "cm-item-label";
export const CLASS_SPINNER = "cm-spinner";
export const CLASS_SPINNER_CUSTOM = "cm-spinner--custom";
export const CSS_VAR_SPINNER_DURATION = "--cm-spinner-duration";
export const CLASS_LABEL = "cm-label";
export const CLASS_ITEM_CHECKBOX = "cm-item-checkbox";
export const CLASS_CHECKED = "cm-checked";
export const CLASS_CHECK = "cm-check";
export const CLASS_CHECK_CUSTOM = "cm-check--custom";
export const CLASS_SHORTCUT = "cm-shortcut";
export const CLASS_SHORTCUT_ICON = "cm-shortcut-icon";
export const CLASS_ITEM_BADGE = "cm-item-badge";
export const CLASS_ITEM_RADIO = "cm-item-radio";
export const CLASS_RADIO = "cm-radio";
export const CLASS_RADIO_CUSTOM = "cm-radio--custom";
export const CLASS_SUBMENU_TRIGGER = "cm-submenu-trigger";
export const CLASS_WRAPPER = "cm-wrapper";
export const CLASS_SUBMENU = "cm-submenu";

export const MENU_ROLE_SELECTOR = "[role='menu']";

export const THEME_CLASS_DATA_ATTR = "data-cm-theme-class";
export const ANIMATION_TYPE_DATA_ATTR = "data-cm-animation";

export const CSS_VAR_PREFIX = "--cm-";
export const CSS_VAR_ENTER_DURATION = "--cm-enter-duration";
export const CSS_VAR_LEAVE_DURATION = "--cm-leave-duration";
export const CSS_VAR_ENTER_EASING = "--cm-enter-easing";
export const CSS_VAR_LEAVE_EASING = "--cm-leave-easing";
export const CSS_VAR_SUBMENU_ARROW_SIZE = "--cm-submenu-arrow-size";

export const WIN_KEY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4875 4875" fill="currentColor" aria-hidden="true"><path xmlns="http://www.w3.org/2000/svg" fill="currentColor" d="M0 0h2311v2310H0zm2564 0h2311v2310H2564zM0 2564h2311v2311H0zm2564 0h2311v2311H2564"/></svg>';

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
