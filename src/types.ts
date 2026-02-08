/**
 * Visual variant for menu items (action, submenu, checkbox, radio).
 */
export type MenuItemVariant = "default" | "danger" | "info" | "success" | "warning" | "muted";

/**
 * Badge shown to the right of the label/shortcut. Simple (string/number) or fully customizable.
 * With object: use `content` + `className`, or `render()` for a custom element.
 */
export type BadgeConfig = string | number | {
  /** Text or number to display. Ignored if `render` is provided. */
  content?: string | number;
  /** CSS class(es) on the badge element (in addition to the default .cm-item-badge when not using render). */
  className?: string;
  /** Return a custom element for full control. Element is appended as-is; set aria-hidden="true" if decorative. */
  render?: () => HTMLElement;
};

/**
 * Config for the loading spinner. Can be set globally (config.spinner) or per item (loadingIcon, loadingSize, loadingSpeed).
 */
export interface SpinnerConfig {
  /** Custom spinner: SVG string or HTMLElement. Omit to use the default CSS circle. */
  icon?: string | HTMLElement;
  /** Size in px (number) or CSS length (e.g. "0.75rem"). */
  size?: number | string;
  /** Duration of one full rotation in ms. Default 600. */
  speed?: number;
}

/**
 * Modifier symbol for shortcut display: plain string or { text, icon } for custom symbols.
 */
export type ModifierSymbol = string | {
  /** Text to display. */
  text: string;
  /** Icon to display. */
  icon: string;
};

/**
 * Single part of a shortcut (modifier or key) for display.
 */
export interface ShortcutPart {
  /** The name of the part. */
  name: string;
  /** The display of the part. */
  display: string;
}

/**
 * Base properties for all menu items.
 */
export type MenuItemBase = {
  /** The ID of the item. */
  id?: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Whether the item is visible. */
  visible?: boolean;
  /** When true, show loading state and block interaction. */
  loading?: boolean;
  /** Custom loading spinner icon (SVG string or HTMLElement). Overrides config.spinner.icon. */
  loadingIcon?: string | HTMLElement;
  /** Loading spinner size in px or CSS length. Overrides config.spinner.size. */
  loadingSize?: number | string;
  /** Loading spinner rotation speed: ms per full turn. Overrides config.spinner.speed. */
  loadingSpeed?: number;
  /** Visual variant; adds class cm-item--{variant}. */
  variant?: MenuItemVariant;
  /** CSS class(es) on the item. */
  className?: string;
};

/**
 * Menu item action.
 */
export type MenuItemAction = MenuItemBase & {
  /** The type of the action. */
  type: "item";
  /** The label of the action. */
  label: string;
  /** Optional icon in the action. */
  icon?: string | HTMLElement;
  /** Shortcut key for the action. */
  shortcut?: string;
  /** Optional badge shown to the right of the label/shortcut. String/number or BadgeConfig (content, className, render). */
  badge?: BadgeConfig;
  /** The function to call when the action is clicked. */
  onClick?: (event: MenuClickEvent) => void;
  /** When false, keep the menu open after click. Default is true (close). */
  closeOnAction?: boolean;
  /** Return a custom element for full control over appearance. Library still sets role, tabindex, and wires click. */
  render?: (item: MenuItemAction) => HTMLElement;
};

/**
 * Where to open the submenu relative to the parent.
 */
export type SubmenuPlacement = "right" | "left" | "auto";

/**
 * Submenu children: array, or sync/async function that returns items (resolved when submenu opens).
 */
export type SubmenuChildren = MenuItem[] | (() => MenuItem[]) | (() => Promise<MenuItem[]>);

/**
 * Submenu item.
 */
export type MenuItemSubmenu = MenuItemBase & {
  /** The type of the submenu. */
  type: "submenu";
  /** The label of the submenu. */
  label: string;
  /** Optional icon in the submenu. */
  icon?: string | HTMLElement;
  /** Shortcut key for the submenu. */
  shortcut?: string;
  /** Optional badge shown to the right of the label/shortcut. String/number or BadgeConfig (content, className, render). */
  badge?: BadgeConfig;
  /** The children of the submenu. Array or function returning items (or Promise); resolved when submenu opens. */
  children: SubmenuChildren;
  /** Where to open the submenu relative to the parent. Overrides config.submenuPlacement. */
  submenuPlacement?: SubmenuPlacement;
};

/**
 * Menu item separator.
 */
export type MenuItemSeparator = {
  /** The type of the separator. */
  type: "separator";
  /** The ID of the separator. */
  id?: string;
  /** CSS class(es) on the separator. */
  className?: string;
};

/**
 * Menu item checkbox.
 */
export type MenuItemCheckbox = MenuItemBase & {
  /** The type of the checkbox. */
  type: "checkbox";
  /** The label of the checkbox. */
  label: string;
  /** Optional icon in the row. */
  leadingIcon?: string | HTMLElement;
  /** Shortcut key for the checkbox. */
  shortcut?: string;
  /** Whether the checkbox is checked. */
  checked?: boolean;
  /** Custom indicator when checked. */
  icon?: string | HTMLElement;
  /** Custom indicator when unchecked. If omitted, the indicator area is empty when unchecked. */
  uncheckedIcon?: string | HTMLElement;
  /** CSS class(es) on the indicator wrapper when checked. */
  checkedClassName?: string;
  /** CSS class(es) on the indicator wrapper when unchecked. */
  uncheckedClassName?: string;
  /** The function to call when the checkbox is changed. */
  onChange?: (event: MenuCheckboxChangeEvent) => void;
  /** When false, keep the menu open after change. Default is true (close). */
  closeOnAction?: boolean;
  /** Return a custom element for full control over appearance. Library still sets role, aria-checked, tabindex, and wires click. */
  render?: (item: MenuItemCheckbox) => HTMLElement;
};

/**
 * Menu item radio.
 */
export type MenuItemRadio = MenuItemBase & {
  /** The type of the radio button. */
  type: "radio";
  /** The label of the radio button. */
  label: string;
  /** The name of the radio button. */
  name: string;
  /** The value of the radio button. */
  value: string;
  /** Optional icon in the row. */
  leadingIcon?: string | HTMLElement;
  /** Shortcut key for the radio button. */
  shortcut?: string;
  /** Whether the radio button is checked. */
  checked?: boolean;
  /** Custom indicator when selected. */
  icon?: string | HTMLElement;
  /** Custom indicator when not selected. If omitted, the indicator area is empty when unselected. */
  uncheckedIcon?: string | HTMLElement;
  /** CSS class(es) on the indicator wrapper when selected. */
  checkedClassName?: string;
  /** CSS class(es) on the indicator wrapper when not selected. */
  uncheckedClassName?: string;
  /** The function to call when the radio button is selected. */
  onSelect?: (event: MenuRadioSelectEvent) => void;
  /** When false, keep the menu open after select. Default is true (close). */
  closeOnAction?: boolean;
  /** Return a custom element for full control over appearance. Library still sets role, aria-checked, tabindex, and wires click. */
  render?: (item: MenuItemRadio) => HTMLElement;
};

/**
 * Menu item label.
 */
export type MenuItemLabel = {
  /** The type of the label. */
  type: "label";
  /** The label of the label. */
  label: string;
  /** The ID of the label. */
  id?: string;
  /** CSS class(es) on the label. */
  className?: string;
};

/**
 * Menu item link.
 */
export type MenuItemLink = MenuItemBase & {
  /** The type of the link. */
  type: "link";
  /** The label of the link. */
  label: string;
  /** The URL to navigate to. */
  href: string;
  /** Optional icon in the link. */
  icon?: string | HTMLElement;
  /** Shortcut key for the link. */
  shortcut?: string;
  /** Optional badge shown to the right of the label/shortcut. String/number or BadgeConfig (content, className, render). */
  badge?: BadgeConfig;
  /** Link target, e.g. "_blank". */
  target?: string;
  /** Link rel, e.g. "noopener". */
  rel?: string;
};

/**
 * Menu item.
 */
export type MenuItem = MenuItemAction | MenuItemSubmenu | MenuItemSeparator | MenuItemCheckbox | MenuItemRadio | MenuItemLabel | MenuItemLink;

/**
 * Menu click event.
 */
export interface MenuClickEvent {
  /** The item that was clicked. */
  item: MenuItemAction;
  /** The native event that caused the click. */
  nativeEvent: MouseEvent | KeyboardEvent;
  /** The function to close the menu. */
  close: () => void;
}

/**
 * Menu checkbox change event.
 */
export interface MenuCheckboxChangeEvent {
  /** The checkbox that was changed. */
  item: MenuItemCheckbox;
  /** Whether the checkbox is checked. */
  checked: boolean;
  /** The native event that caused the change. */
  nativeEvent: MouseEvent | KeyboardEvent;
  /** The function to close the menu. */
  close: () => void;
}

/**
 * Menu radio select event.
 */
export interface MenuRadioSelectEvent {
  /** The radio button that was selected. */
  item: MenuItemRadio;
  /** The value of the radio button. */
  value: string;
  /** The native event that caused the selection. */
  nativeEvent: MouseEvent | KeyboardEvent;
  /** The function to close the menu. */
  close: () => void;
}

/**
 * Theme configuration.
 */
export interface ThemeConfig {
  /** The CSS class(es) to apply to the menu. */
  class?: string;
  /** The tokens to apply to the menu. */
  tokens?: Record<string, string>;
}

/**
 * Animation type.
 */
export type AnimationType = "fade" | "slide";

/**
 * Animation configuration.
 */
export interface AnimationConfig {
  /** Animation style: "fade" (opacity + scale) or "slide" (opacity + translate). Default "fade". */
  type?: AnimationType;
  /** The duration of the enter animation. */
  enter?: number | { duration: number; easing: string };
  /** The duration of the leave animation. */
  leave?: number | { duration: number; easing: string };
  /** Whether the animations are disabled. */
  disabled?: boolean;
}

/**
 * Position configuration.
 */
export interface PositionConfig {
  /** The offset from the anchor. */
  offset?: { x: number; y: number };
  /** The padding around the menu. */
  padding?: number;
  /** Whether to flip the menu to keep it in view. */
  flip?: boolean;
  /** Whether to shift the menu to keep it in view. */
  shift?: boolean;
  /** Base z-index for the root menu. Used with submenuZIndexStep for stacking. */
  zIndexBase?: number;
  /** Z-index increment per submenu level so each submenu stacks above the previous. 0 = no increment. */
  submenuZIndexStep?: number;
}

/**
 * Config for the arrow shown on parent items that have a submenu.
 * Set to `true` to use the default arrow with no options.
 */
export interface SubmenuArrowConfig {
  /** Custom icon: SVG string or HTMLElement. When submenuArrow is true the default is a chevron SVG; omit icon in an object to use the CSS triangle. */
  icon?: string | HTMLElement;
  /** Size in px (number) or CSS length (e.g. "0.5rem"). For default arrow, scales the triangle; for custom icon, sets width and height. */
  size?: number | string;
  /** Extra class name(s) on the arrow wrapper. */
  className?: string;
  /** Opacity 0–1. */
  opacity?: number;
}

/**
 * Placement for opening the menu at an element.
 */
export type OpenAtElementPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end"
  | "auto";

/**
 * Options for opening the menu at an element.
 */
export type OpenAtElementOptions = {
  /** The placement of the menu; "auto" picks the best side based on viewport space. */
  placement?: OpenAtElementPlacement;
  /** The offset from the anchor. */
  offset?: { x: number; y: number };
};

/**
 * Placement for opening the menu at an element.
 */
export type Placement = NonNullable<OpenAtElementOptions["placement"]>;

/**
 * Element to bind so the menu opens on contextmenu (desktop) and long-press (touch).
 * Either pass the element directly or { element, options } for bind options (e.g. longPressMs).
 */
export type ContextMenuBindConfig =
  | HTMLElement
  | { element: HTMLElement; options?: BindOptions };

/** Context passed to onBeforeOpen (and optionally to other open hooks). */
export interface OpenContext {
  /** X coordinate where the menu will open. */
  x: number;
  /** Y coordinate where the menu will open. */
  y: number;
  /** Element that received the context menu event, if any. */
  target?: Element | null;
  /** The MouseEvent that triggered the open, when opened via contextmenu or bind. */
  event?: MouseEvent;
}

/** Context passed to onClose and onAfterClose when the menu closes. */
export interface CloseContext {
  /** The item that was selected (clicked), if any. */
  selectedItem?: MenuItem;
  /** Anchor coordinates used for the last open, or null. */
  anchor: { x: number; y: number } | null;
}

/**
 * Context menu configuration.
 */
export interface ContextMenuConfig {
  /** The menu items. */
  menu: MenuItem[] | (() => MenuItem[]);
  /** The configuration for the submenu arrow. */
  submenuArrow?: boolean | SubmenuArrowConfig;
  /** Default configuration for the loading spinner. Overridable per item via loadingIcon, loadingSize, loadingSpeed. */
  spinner?: SpinnerConfig;
  /** Where to open submenus relative to the parent. "auto" uses RTL and viewport space. */
  submenuPlacement?: SubmenuPlacement;
  /** The configuration for the theme. */
  theme?: ThemeConfig;
  /** The configuration for the animations. */
  animation?: AnimationConfig;
  /** The configuration for the position. */
  position?: PositionConfig;
  /** The function to get the anchor. */
  getAnchor?: () => { x: number; y: number } | DOMRect;
  /** The container to mount the menu. */
  portal?: HTMLElement | (() => HTMLElement);
  /** The function to call when the menu is opened. Receives the MouseEvent when opened via contextmenu or bind; undefined when opened programmatically (e.g. open(x, y) or long-press). */
  onOpen?: (event?: MouseEvent) => void;
  /** The function to call when the menu is closed. Receives close context (selectedItem, anchor). */
  onClose?: (context?: CloseContext) => void;
  /** Called before the menu opens. Return false (or a Promise resolving to false) to cancel. Receives event and open context. */
  onBeforeOpen?: (event?: MouseEvent, context?: OpenContext) => boolean | void | Promise<boolean | void>;
  /** Called after the menu is fully closed (after leave animation). Receives close context. */
  onAfterClose?: (context?: CloseContext) => void;
  /** Called before the menu closes. Return false (or a Promise resolving to false) to cancel. */
  onBeforeClose?: () => boolean | void | Promise<boolean | void>;
  /** Called when the user hovers or focuses an interactive item. */
  onItemHover?: (payload: { item: MenuItem; nativeEvent: MouseEvent | FocusEvent }) => void;
  /** Element to bind so the menu opens on contextmenu and long-press. Same as calling instance.bind(element, options) after creation. */
  bind?: ContextMenuBindConfig;
  /** When true, close the menu on window resize. */
  closeOnResize?: boolean;
  /** Optional map of shortcut part names to SVG string or HTMLElement. Keys: modifier/key names (e.g. ctrl, shift, enter, tab). When set, shortcuts render these icons instead of Unicode symbols (useful on Windows where symbols may not look good). */
  shortcutIcons?: Record<string, string | HTMLElement>;
  /** Override platform so the menu adapts to that OS (e.g. shortcut display). "auto" (default) = detect. Use "win" on macOS to preview Windows look. */
  platform?: "mac" | "win" | "auto";
}

/**
 * Bind options.
 */
export interface BindOptions {
  /** The duration of the long press in milliseconds. */
  longPressMs?: number;
}

/**
 * Context menu instance.
 */
export interface ContextMenuInstance {
  /** Opens the menu at coordinates or at the event position. Returns a Promise that resolves with the selected item when the menu closes, or undefined if closed without selection. */
  open(x?: number, y?: number): Promise<MenuItem | undefined>;
  /** Opens the menu at the event position. */
  open(event: MouseEvent): Promise<MenuItem | undefined>;
  /** Closes the menu. Returns a Promise that resolves when the close animation finishes (or immediately if no animation). */
  close(): Promise<void>;
  /** The function to toggle the menu. */
  toggle(x?: number, y?: number): void;
  /** The function to open the menu at an element. */
  openAtElement(element: HTMLElement, options?: OpenAtElementOptions): void;
  /** The function to check if the menu is open. */
  isOpen(): boolean;
  /** Returns the anchor coordinates used for the last open, or null. */
  getAnchor(): { x: number; y: number } | null;
  /** The function to get the menu. */
  getMenu(): MenuItem[];
  /** The wrapper element (contains root menu and submenus). */
  getRootElement(): HTMLElement;
  /** Update the menu by applying an updater to the current menu. */
  updateMenu(updater: (current: MenuItem[]) => MenuItem[]): void;
  /** The function to bind the menu to an element. */
  bind(element: HTMLElement, options?: BindOptions): void;
  /** Removes bind from the given element, or from the currently bound element if no argument. */
  unbind(element?: HTMLElement): void;
  /** The function to destroy the menu. */
  destroy(): void;
  /** The function to set the menu. */
  setMenu(menu: MenuItem[]): void;
  /** Update theme at runtime; applies to root and open submenus if menu is open. */
  setTheme(theme: ThemeConfig | undefined): void;
  /** Update position config at runtime (used on next open). */
  setPosition(position: PositionConfig | undefined): void;
  /** Update animation config at runtime; applies to root and open submenus if menu is open. */
  setAnimation(animation: AnimationConfig | undefined): void;
}

/**
 * Context menu state.
 */
export interface ContextMenuState {
  /** The current configuration. */
  currentConfig: ContextMenuConfig;
  /** The current menu. */
  menu: MenuItem[];
  /** The portal element. */
  portal: HTMLElement;
  /** The wrapper element. */
  wrapper: HTMLElement;
  /** The root element. */
  root: HTMLElement;
  /** The configuration for the submenu arrow. */
  submenuArrowConfig: SubmenuArrowConfig | null;
  /** Whether the menu is open. */
  isOpen: boolean;
  /** The last focus target. */
  lastFocusTarget: HTMLElement | null;
  /** The timeout for the leave animation. */
  leaveTimeout: ReturnType<typeof setTimeout> | null;
  /** The transition handler for the leave animation. */
  leaveTransitionHandler: (() => void) | null;
  /** The open submenus. */
  openSubmenus: Array<{ panel: HTMLElement; trigger: HTMLElement }>;
  /** The timer for the submenu hover. */
  submenuHoverTimer: ReturnType<typeof setTimeout> | null;
  /** The handler for outside clicks. */
  outsideClickHandler: ((e: MouseEvent) => void) | null;
  /** The handler for resize events. */
  resizeHandler: (() => void) | null;
  /** The bound element. */
  boundElement: HTMLElement | null;
  /** The handler for contextmenu events. */
  boundContextmenu: ((e: MouseEvent) => void) | null;
  /** The handler for touchstart events. */
  boundTouchstart: ((e: TouchEvent) => void) | null;
  /** The handler for touchend or cancel events. */
  boundTouchEndOrCancel: (e: TouchEvent) => void;
  /** The timer for the long press. */
  longPressTimer: ReturnType<typeof setTimeout> | null;
  /** The x coordinate of the long press. */
  longPressX: number;
  /** The y coordinate of the long press. */
  longPressY: number;
  /** The last anchor. */
  lastAnchor: { x: number; y: number } | null;
  /** The last selected item. */
  lastSelectedItem: MenuItem | undefined;
  /** The promise to resolve the open promise. */
  openPromiseResolve: ((value: MenuItem | undefined) => void) | null;
  /** The promise to resolve the close promise. */
  closePromiseResolve: (() => void) | null;
  /** The self object. */
  self: { close(): Promise<void> };
  /** The function to close the menu with a selection. */
  closeWithSelection: (selectedItem?: MenuItem) => void;
  /** The function to close the menu. */
  realClose: () => Promise<void>;
  /** The function to open the submenu panel. */
  openSubmenuPanel: (sub: MenuItemSubmenu, triggerEl: HTMLElement) => Promise<void>;
  /** The function to schedule the submenu open. */
  scheduleSubmenuOpen: (sub: MenuItemSubmenu, triggerEl: HTMLElement) => void;
  /** The function to schedule the submenu close. */
  scheduleSubmenuClose: (triggerEl: HTMLElement) => void;
  /** The function to cancel the submenu close. */
  cancelSubmenuClose: () => void;
  /** The function to close the submenu with animation. */
  closeSubmenuWithAnimation: (panel: HTMLElement, trigger: HTMLElement, options?: { clearOpenSubmenu?: boolean; onDone?: () => void }) => void;
  /** The function to build the root content. */
  buildRootContent: () => void;
  /** The function to refresh the content. */
  refreshContent: () => void;
  /** The function to get the spinner options. */
  getSpinnerOptions: (it: MenuItem) => SpinnerConfig;
  /** The function to make the hover focus handler. */
  makeHoverFocusHandler: (menuEl: HTMLElement) => (el: HTMLElement) => void;
  /** The function to enter the menu item. */
  onEnterMenuItem: (el: HTMLElement) => void;
  /** The function to trigger the submenu. */
  triggerSubmenu: (sub: MenuItemSubmenu, triggerEl: HTMLElement) => void;
  /** The keydown handler. */
  _keydownHandler: (e: KeyboardEvent) => void;
}
