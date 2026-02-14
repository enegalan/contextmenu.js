/**
 * Editable representation of menu items for the playground.
 * We convert these to real MenuItem[] when passing to createContextMenu.
 */

export type MenuItemVariant = "default" | "danger" | "info" | "success" | "warning" | "muted";

export interface EditableItemBase {
  id: string;
}

export interface EditableAction extends EditableItemBase {
  type: "item";
  label: string;
  icon?: string;
  shortcut?: string;
  badge?: string | number | { content?: string | number; className?: string; useRender?: boolean };
  variant?: MenuItemVariant;
  disabled?: boolean;
  visible?: boolean;
  loading?: boolean;
  loadingSize?: number | string;
  loadingSpeed?: number;
  closeOnAction?: boolean;
}

export interface EditableSeparator extends EditableItemBase {
  type: "separator";
  className?: string;
}

export interface EditableLabel extends EditableItemBase {
  type: "label";
  label: string;
  className?: string;
}

export interface EditableLink extends EditableItemBase {
  type: "link";
  label: string;
  href: string;
  icon?: string;
  shortcut?: string;
  badge?: string | number;
  target?: string;
  rel?: string;
  variant?: MenuItemVariant;
  disabled?: boolean;
}

export interface EditableCheckbox extends EditableItemBase {
  type: "checkbox";
  label: string;
  leadingIcon?: string;
  shortcut?: string;
  checked: boolean;
  variant?: MenuItemVariant;
  disabled?: boolean;
  closeOnAction?: boolean;
}

export interface EditableRadio extends EditableItemBase {
  type: "radio";
  label: string;
  name: string;
  value: string;
  leadingIcon?: string;
  shortcut?: string;
  checked: boolean;
  variant?: MenuItemVariant;
  disabled?: boolean;
  closeOnAction?: boolean;
}

export interface EditableSubmenu extends EditableItemBase {
  type: "submenu";
  label: string;
  icon?: string;
  shortcut?: string;
  badge?: string | number;
  children: EditableMenuItem[];
  submenuPlacement?: "right" | "left" | "auto";
  lazy?: boolean;
  variant?: MenuItemVariant;
  disabled?: boolean;
}

export type EditableMenuItem =
  | EditableAction
  | EditableSeparator
  | EditableLabel
  | EditableLink
  | EditableCheckbox
  | EditableRadio
  | EditableSubmenu;

export interface PlaygroundTheme {
  preset: "auto" | "dark" | "custom";
  class?: string;
  tokens?: Record<string, string>;
}

export interface PlaygroundAnimation {
  type: "fade" | "slide";
  enterDuration: number;
  enterEasing: string;
  leaveDuration: number;
  leaveEasing: string;
  disabled: boolean;
}

export interface PlaygroundPosition {
  offsetX: number;
  offsetY: number;
  padding: number;
  flip: boolean;
  shift: boolean;
}

export interface PlaygroundSubmenuConfig {
  placement: "right" | "left" | "auto";
  arrow: boolean;
  arrowSize?: number | string;
  arrowOpacity?: number;
}

export interface PlaygroundBehavior {
  lockScrollOutside: boolean;
  closeOnResize: boolean;
  longPressMs: number;
}

export type PlaygroundPlatform = "auto" | "mac" | "win";

export interface PlaygroundState {
  menuItems: EditableMenuItem[];
  theme: PlaygroundTheme;
  animation: PlaygroundAnimation;
  position: PlaygroundPosition;
  submenu: PlaygroundSubmenuConfig;
  platform: PlaygroundPlatform;
  behavior: PlaygroundBehavior;
  useOpenAtElementButton: boolean;
}

export const defaultTheme: PlaygroundTheme = {
  preset: "auto",
};

export const defaultAnimation: PlaygroundAnimation = {
  type: "fade",
  enterDuration: 120,
  enterEasing: "ease-out",
  leaveDuration: 80,
  leaveEasing: "ease-in",
  disabled: false,
};

export const defaultPosition: PlaygroundPosition = {
  offsetX: 12,
  offsetY: 4,
  padding: 12,
  flip: true,
  shift: true,
};

export const defaultSubmenu: PlaygroundSubmenuConfig = {
  placement: "auto",
  arrow: true,
  arrowSize: 5,
  arrowOpacity: 0.7,
};

export const defaultBehavior: PlaygroundBehavior = {
  lockScrollOutside: true,
  closeOnResize: false,
  longPressMs: 500,
};

export const defaultMenuItems: EditableMenuItem[] = [
  { id: "1", type: "item", label: "Copy", shortcut: "Ctrl+C" },
  { id: "2", type: "item", label: "Paste", shortcut: "Ctrl+V" },
  { id: "3", type: "separator" },
  {
    id: "4",
    type: "submenu",
    label: "More",
    children: [
      { id: "4a", type: "item", label: "Rename" },
      { id: "4b", type: "item", label: "Delete", variant: "danger" },
    ],
  },
];

export function defaultPlaygroundState(): PlaygroundState {
  return {
    menuItems: defaultMenuItems,
    theme: defaultTheme,
    animation: defaultAnimation,
    position: defaultPosition,
    submenu: defaultSubmenu,
    platform: "auto",
    behavior: defaultBehavior,
    useOpenAtElementButton: false,
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/** Find an item by id in the tree (depth-first). */
export function findMenuItem(items: EditableMenuItem[], id: string): EditableMenuItem | null {
  for (const it of items) {
    if (it.id === id) return it;
    if (it.type === "submenu" && "children" in it) {
      const found = findMenuItem(it.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Update an item by id; returns new items array. */
export function updateMenuItem(
  items: EditableMenuItem[],
  id: string,
  updater: (item: EditableMenuItem) => EditableMenuItem
): EditableMenuItem[] {
  return items.map((it) => {
    if (it.id === id) return updater(it);
    if (it.type === "submenu" && "children" in it)
      return { ...it, children: updateMenuItem(it.children, id, updater) };
    return it;
  });
}

export type PlaygroundPresetKey =
  | "all-types"
  | "badges-spinners"
  | "variants"
  | "dark-theme"
  | "slide-animation"
  | "nested-lazy"
  | "checkboxes-radios"
  | "links-openAtElement";

/** Apply a preset: returns partial state to merge. */
export function getPresetState(preset: PlaygroundPresetKey): Partial<PlaygroundState> {
  const base = defaultPlaygroundState();
  switch (preset) {
    case "all-types":
      return {
        menuItems: [
          { id: "a1", type: "item", label: "Action", shortcut: "Ctrl+A" },
          { id: "a2", type: "separator" },
          { id: "a3", type: "label", label: "Section" },
          { id: "a4", type: "item", label: "Another action" },
          { id: "a5", type: "link", label: "Documentation", href: "https://github.com/egalan/contextmenu.js", target: "_blank", rel: "noopener noreferrer" },
          { id: "a6", type: "separator" },
          { id: "a7", type: "checkbox", label: "Toggle option", checked: true },
          { id: "a8", type: "radio", name: "choice", label: "Option A", value: "a", checked: true },
          { id: "a9", type: "radio", name: "choice", label: "Option B", value: "b", checked: false },
          { id: "a10", type: "separator" },
          {
            id: "a11",
            type: "submenu",
            label: "Submenu",
            children: [
              { id: "a11a", type: "item", label: "Child 1" },
              { id: "a11b", type: "item", label: "Child 2" },
            ],
          },
        ],
      };
    case "badges-spinners":
      return {
        menuItems: [
          { id: "b1", type: "item", label: "With badge", badge: "New" },
          { id: "b2", type: "item", label: "Count", badge: 42 },
          { id: "b3", type: "item", label: "Loading state", loading: true },
          { id: "b4", type: "item", label: "Loading slow", loading: true, loadingSpeed: 1200 },
        ],
      };
    case "variants":
      return {
        menuItems: [
          { id: "v1", type: "item", label: "Default" },
          { id: "v2", type: "item", label: "Danger", variant: "danger" },
          { id: "v3", type: "item", label: "Info", variant: "info" },
          { id: "v4", type: "item", label: "Success", variant: "success" },
          { id: "v5", type: "item", label: "Warning", variant: "warning" },
          { id: "v6", type: "item", label: "Muted", variant: "muted" },
        ],
      };
    case "dark-theme":
      return { theme: { preset: "dark" } };
    case "slide-animation":
      return {
        animation: {
          ...base.animation,
          type: "slide",
          enterDuration: 150,
          leaveDuration: 100,
        },
      };
    case "nested-lazy":
      return {
        menuItems: [
          {
            id: "n1",
            type: "submenu",
            label: "Open (lazy)",
            lazy: true,
            children: [
              { id: "n1a", type: "item", label: "Lazy item 1" },
              {
                id: "n1b",
                type: "submenu",
                label: "Nested",
                children: [
                  { id: "n1b1", type: "item", label: "Deep 1" },
                  { id: "n1b2", type: "item", label: "Deep 2" },
                ],
              },
            ],
          },
        ],
      };
    case "checkboxes-radios":
      return {
        menuItems: [
          { id: "c1", type: "checkbox", label: "Show grid", checked: true },
          { id: "c2", type: "checkbox", label: "Show rulers", checked: false },
          { id: "c3", type: "separator" },
          { id: "c4", type: "label", label: "Zoom" },
          { id: "c5", type: "radio", name: "zoom", label: "50%", value: "50%", checked: false },
          { id: "c6", type: "radio", name: "zoom", label: "100%", value: "100%", checked: true },
          { id: "c7", type: "radio", name: "zoom", label: "200%", value: "200%", checked: false },
        ],
      };
    case "links-openAtElement":
      return {
        menuItems: [
          { id: "l1", type: "item", label: "Copy", shortcut: "Ctrl+C" },
          { id: "l2", type: "item", label: "Paste", shortcut: "Ctrl+V" },
          { id: "l3", type: "separator" },
          { id: "l4", type: "link", label: "Docs", href: "https://contextmenujs.vercel.app/docs/introduction", target: "_blank", rel: "noopener noreferrer" },
          { id: "l5", type: "link", label: "GitHub", href: "https://github.com/egalan/contextmenu.js", target: "_blank", rel: "noopener noreferrer" },
        ],
        useOpenAtElementButton: true,
      };
    default:
      return {};
  }
}

export const PRESET_LABELS: Record<PlaygroundPresetKey, string> = {
  "all-types": "All item types",
  "badges-spinners": "Badges & spinners",
  variants: "Variants",
  "dark-theme": "Dark theme",
  "slide-animation": "Slide animation",
  "nested-lazy": "Nested & lazy",
  "checkboxes-radios": "Checkboxes & radios",
  "links-openAtElement": "Links & open at button",
};
