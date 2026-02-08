/** Visual variant for menu items (action, submenu, checkbox, radio). Styled via .cm-item--danger, etc. */
export type MenuItemVariant = "default" | "danger" | "info" | "success" | "warning" | "muted";

export type MenuItemBase = {
  /** The ID of the item. */
  id?: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Whether the item is visible. */
  visible?: boolean;
  /** Visual variant; adds class cm-item--{variant}. */
  variant?: MenuItemVariant;
  /** CSS class(es) on the item. */
  className?: string;
};

export type MenuItemAction = MenuItemBase & {
  /** The type of the action. */
  type: "item";
  /** The label of the action. */
  label: string;
  /** Optional icon in the action. */
  icon?: string | HTMLElement;
  /** Shortcut key for the action. */
  shortcut?: string;
  /** The function to call when the action is clicked. */
  onClick?: (event: MenuClickEvent) => void;
  /** When false, keep the menu open after click. Default is true (close). */
  closeOnAction?: boolean;
  /** Return a custom element for full control over appearance. Library still sets role, tabindex, and wires click. */
  render?: (item: MenuItemAction) => HTMLElement;
};

export type MenuItemSubmenu = MenuItemBase & {
  /** The type of the submenu. */
  type: "submenu";
  /** The label of the submenu. */
  label: string;
  /** Optional icon in the submenu. */
  icon?: string | HTMLElement;
  /** Shortcut key for the submenu. */
  shortcut?: string;
  /** The children of the submenu. */
  children: MenuItem[];
};

export type MenuItemSeparator = {
  /** The type of the separator. */
  type: "separator";
  /** The ID of the separator. */
  id?: string;
  /** CSS class(es) on the separator. */
  className?: string;
};

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

export type MenuItem = MenuItemAction | MenuItemSubmenu | MenuItemSeparator | MenuItemCheckbox | MenuItemRadio | MenuItemLabel;

export interface MenuClickEvent {
  /** The item that was clicked. */
  item: MenuItemAction;
  /** The native event that caused the click. */
  nativeEvent: MouseEvent | KeyboardEvent;
  /** The function to close the menu. */
  close: () => void;
}

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

export interface ThemeConfig {
  /** The CSS class(es) to apply to the menu. */
  class?: string;
  /** The tokens to apply to the menu. */
  tokens?: Record<string, string>;
}

export interface AnimationConfig {
  /** The duration of the enter animation. */
  enter?: number | { duration: number; easing: string };
  /** The duration of the leave animation. */
  leave?: number | { duration: number; easing: string };
  /** Whether the animations are disabled. */
  disabled?: boolean;
}

export interface PositionConfig {
  /** The offset from the anchor. */
  offset?: { x: number; y: number };
  /** The padding around the menu. */
  padding?: number;
  /** Whether to flip the menu to keep it in view. */
  flip?: boolean;
  /** Whether to shift the menu to keep it in view. */
  shift?: boolean;
}

/**
 * Config for the arrow shown on parent items that have a submenu.
 * Set to `true` to use the default arrow with no options.
 */
export interface SubmenuArrowConfig {
  /** Custom icon: SVG string or HTMLElement. Omit to use the default CSS arrow. */
  icon?: string | HTMLElement;
  /** Size in px (number) or CSS length (e.g. "0.5rem"). For default arrow, scales the triangle; for custom icon, sets width and height. */
  size?: number | string;
  /** Extra class name(s) on the arrow wrapper. */
  className?: string;
  /** Opacity 0–1. */
  opacity?: number;
}

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

export type OpenAtElementOptions = {
  /** The placement of the menu; "auto" picks the best side based on viewport space. */
  placement?: OpenAtElementPlacement;
  /** The offset from the anchor. */
  offset?: { x: number; y: number };
};

/**
 * Element to bind so the menu opens on contextmenu (desktop) and long-press (touch).
 * Either pass the element directly or { element, options } for bind options (e.g. longPressMs).
 */
export type ContextMenuBindConfig =
  | HTMLElement
  | { element: HTMLElement; options?: BindOptions };

export interface ContextMenuConfig {
  /** The menu items. */
  menu: MenuItem[] | (() => MenuItem[]);
  /** The configuration for the submenu arrow. */
  submenuArrow?: boolean | SubmenuArrowConfig;
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
  /** The function to call when the menu is closed. */
  onClose?: () => void;
  /** Element to bind so the menu opens on contextmenu and long-press. Same as calling instance.bind(element, options) after creation. */
  bind?: ContextMenuBindConfig;
  /** When true, close the menu on window resize. */
  closeOnResize?: boolean;
}

export interface BindOptions {
  /** The duration of the long press in milliseconds. */
  longPressMs?: number;
}

export interface ContextMenuInstance {
  /** The function to open the menu. */
  open(x?: number, y?: number): void;
  /** The function to open the menu. */
  open(event: MouseEvent): void;
  /** The function to close the menu. */
  close(): void;
  /** The function to toggle the menu. */
  toggle(x?: number, y?: number): void;
  /** The function to open the menu at an element. */
  openAtElement(element: HTMLElement, options?: OpenAtElementOptions): void;
  /** The function to check if the menu is open. */
  isOpen(): boolean;
  /** The function to get the menu. */
  getMenu(): MenuItem[];
  /** The wrapper element (contains root menu and submenus). */
  getRootElement(): HTMLElement;
  /** Update the menu by applying an updater to the current menu. */
  updateMenu(updater: (current: MenuItem[]) => MenuItem[]): void;
  /** The function to bind the menu to an element. */
  bind(element: HTMLElement, options?: BindOptions): void;
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
