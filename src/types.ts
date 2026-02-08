export type MenuItemBase = {
  id?: string;
  disabled?: boolean;
  visible?: boolean;
  className?: string;
};

export type MenuItemAction = MenuItemBase & {
  type?: "item";
  label: string;
  icon?: string | HTMLElement;
  shortcut?: string;
  onClick?: (event: MenuClickEvent) => void;
  render?: (item: MenuItemAction) => HTMLElement;
};

export type MenuItemSubmenu = MenuItemBase & {
  type: "submenu";
  label: string;
  icon?: string | HTMLElement;
  shortcut?: string;
  children: MenuItem[];
};

export type MenuItemSeparator = {
  type: "separator";
  id?: string;
  className?: string;
};

export type MenuItem = MenuItemAction | MenuItemSubmenu | MenuItemSeparator;

export interface MenuClickEvent {
  item: MenuItemAction;
  nativeEvent: MouseEvent | KeyboardEvent;
  close: () => void;
}

export interface ThemeConfig {
  class?: string;
  tokens?: Record<string, string>;
}

export interface AnimationConfig {
  enter?: number | { duration: number; easing: string };
  leave?: number | { duration: number; easing: string };
  disabled?: boolean;
}

export interface PositionConfig {
  offset?: { x: number; y: number };
  padding?: number;
  flip?: boolean;
  shift?: boolean;
}

/**
 * Config for the arrow shown on parent items that have a submenu.
 * Set to `true` to use the default arrow with no options.
 */
export interface SubmenuArrowConfig {
  /** Custom icon: SVG string (e.g. inline SVG) or HTMLElement. Omit to use the default CSS arrow. */
  icon?: string | HTMLElement;
  /** Size in px (number) or CSS length (e.g. "0.5rem"). For default arrow, scales the triangle; for custom icon, sets width and height. */
  size?: number | string;
  /** Extra class name(s) on the arrow wrapper. */
  className?: string;
  /** Opacity 0–1. Default arrow uses 0.7 when not set. */
  opacity?: number;
}

export interface ContextMenuConfig {
  menu: MenuItem[];
  /** When true, use default submenu arrow. When object, configure icon, size, className, opacity. Omit or false to hide. */
  submenuArrow?: boolean | SubmenuArrowConfig;
  theme?: ThemeConfig;
  animation?: AnimationConfig;
  position?: PositionConfig;
  getAnchor?: () => { x: number; y: number } | DOMRect;
  portal?: HTMLElement | (() => HTMLElement);
  onOpen?: () => void;
  onClose?: () => void;
}

export interface BindOptions {
  longPressMs?: number;
}

export interface ContextMenuInstance {
  open(x?: number, y?: number): void;
  open(event: MouseEvent): void;
  close(): void;
  toggle(x?: number, y?: number): void;
  bind(element: HTMLElement, options?: BindOptions): void;
  destroy(): void;
  setMenu(menu: MenuItem[]): void;
}
