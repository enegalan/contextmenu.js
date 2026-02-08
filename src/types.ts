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

export interface ContextMenuConfig {
  menu: MenuItem[];
  theme?: ThemeConfig;
  animation?: AnimationConfig;
  position?: PositionConfig;
  getAnchor?: () => { x: number; y: number } | DOMRect;
  portal?: HTMLElement | (() => HTMLElement);
  onOpen?: () => void;
  onClose?: () => void;
}

export interface ContextMenuInstance {
  open(x?: number, y?: number): void;
  open(event: MouseEvent): void;
  close(): void;
  toggle(x?: number, y?: number): void;
  destroy(): void;
  setMenu(menu: MenuItem[]): void;
}
