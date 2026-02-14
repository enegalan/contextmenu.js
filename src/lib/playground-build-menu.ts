import type { MenuItem } from "@enegalan/contextmenu.js";
import type {
  EditableMenuItem,
  EditableAction,
  EditableSeparator,
  EditableLabel,
  EditableLink,
  EditableCheckbox,
  EditableRadio,
  EditableSubmenu,
} from "./playground-state";

function noop(): void {}

function buildMenuItem(editable: EditableMenuItem): MenuItem {
  switch (editable.type) {
    case "item": {
      const a = editable as EditableAction;
      const badge =
        typeof a.badge === "object" && a.badge?.useRender
          ? {
              render: () => {
                const el = document.createElement("span");
                el.className = "cm-item-badge";
                el.setAttribute("aria-hidden", "true");
                el.textContent = "Custom";
                return el;
              },
            }
          : a.badge;
      return {
        type: "item",
        id: a.id,
        label: a.label,
        ...(a.icon && { icon: a.icon }),
        ...(a.shortcut && { shortcut: a.shortcut }),
        ...(badge !== undefined && { badge }),
        ...(a.variant && { variant: a.variant }),
        ...(a.disabled !== undefined && { disabled: a.disabled }),
        ...(a.visible !== undefined && { visible: a.visible }),
        ...(a.loading !== undefined && { loading: a.loading }),
        ...(a.loadingSize !== undefined && { loadingSize: a.loadingSize }),
        ...(a.loadingSpeed !== undefined && { loadingSpeed: a.loadingSpeed }),
        ...(a.closeOnAction !== undefined && { closeOnAction: a.closeOnAction }),
        onClick: ({ close }) => {
          noop();
          close();
        },
      };
    }
    case "separator": {
      const s = editable as EditableSeparator;
      return { type: "separator", id: s.id, ...(s.className && { className: s.className }) };
    }
    case "label": {
      const l = editable as EditableLabel;
      return { type: "label", id: l.id, label: l.label, ...(l.className && { className: l.className }) };
    }
    case "link": {
      const l = editable as EditableLink;
      return {
        type: "link",
        id: l.id,
        label: l.label,
        href: l.href,
        ...(l.icon && { icon: l.icon }),
        ...(l.shortcut && { shortcut: l.shortcut }),
        ...(l.badge !== undefined && { badge: l.badge }),
        ...(l.target && { target: l.target }),
        ...(l.rel && { rel: l.rel }),
        ...(l.variant && { variant: l.variant }),
        ...(l.disabled !== undefined && { disabled: l.disabled }),
      };
    }
    case "checkbox": {
      const c = editable as EditableCheckbox;
      return {
        type: "checkbox",
        id: c.id,
        label: c.label,
        ...(c.leadingIcon && { leadingIcon: c.leadingIcon }),
        ...(c.shortcut && { shortcut: c.shortcut }),
        checked: c.checked,
        ...(c.variant && { variant: c.variant }),
        ...(c.disabled !== undefined && { disabled: c.disabled }),
        ...(c.closeOnAction !== undefined && { closeOnAction: c.closeOnAction }),
        onChange: ({ close }) => {
          noop();
          close();
        },
      };
    }
    case "radio": {
      const r = editable as EditableRadio;
      return {
        type: "radio",
        id: r.id,
        label: r.label,
        name: r.name,
        value: r.value,
        ...(r.leadingIcon && { leadingIcon: r.leadingIcon }),
        ...(r.shortcut && { shortcut: r.shortcut }),
        checked: r.checked,
        ...(r.variant && { variant: r.variant }),
        ...(r.disabled !== undefined && { disabled: r.disabled }),
        ...(r.closeOnAction !== undefined && { closeOnAction: r.closeOnAction }),
        onSelect: ({ close }) => {
          noop();
          close();
        },
      };
    }
    case "submenu": {
      const s = editable as EditableSubmenu;
      const childrenMenu: MenuItem[] = (s.children ?? []).map(buildMenuItem);
      const children = s.lazy
        ? () =>
            new Promise<MenuItem[]>((resolve) =>
              setTimeout(() => resolve(childrenMenu), 500)
            )
        : childrenMenu;
      return {
        type: "submenu",
        id: s.id,
        label: s.label,
        ...(s.icon && { icon: s.icon }),
        ...(s.shortcut && { shortcut: s.shortcut }),
        ...(s.badge !== undefined && { badge: s.badge }),
        ...(s.submenuPlacement && { submenuPlacement: s.submenuPlacement }),
        ...(s.variant && { variant: s.variant }),
        ...(s.disabled !== undefined && { disabled: s.disabled }),
        children,
      };
    }
    default:
      return { type: "separator" };
  }
}

export interface PlaygroundMenuCallbacks {
  onCheckboxChange?: (id: string, checked: boolean) => void;
  onRadioSelect?: (id: string, name: string, value: string) => void;
}

function buildMenuItemWithCallbacks(
  editable: EditableMenuItem,
  callbacks: PlaygroundMenuCallbacks | undefined
): MenuItem {
  const item = buildMenuItem(editable);
  if (editable.type === "checkbox" && callbacks?.onCheckboxChange) {
    (item as { onChange?: (ev: { item: { id?: string }; checked: boolean; close: () => void }) => void }).onChange = (ev) => {
      if (ev.item.id) callbacks.onCheckboxChange!(ev.item.id, ev.checked);
      ev.close();
    };
  }
  if (editable.type === "radio" && callbacks?.onRadioSelect) {
    (item as { onSelect?: (ev: { item: { id?: string; name: string; value: string }; close: () => void }) => void }).onSelect = (ev) => {
      if (ev.item.id) callbacks.onRadioSelect!(ev.item.id, ev.item.name, ev.item.value);
      ev.close();
    };
  }
  return item;
}

export function buildMenuFromEditable(
  items: EditableMenuItem[] | undefined,
  callbacks?: PlaygroundMenuCallbacks
): MenuItem[] {
  const list = items ?? [];
  if (!callbacks?.onCheckboxChange && !callbacks?.onRadioSelect)
    return list.map(buildMenuItem);
  return list.map((it) => buildMenuItemWithCallbacks(it, callbacks));
}
