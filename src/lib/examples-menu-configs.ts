import type { MenuItem } from "@enegalan/contextmenu.js";

export type ExamplesMenuConfig = {
  label: string;
  description?: string;
  menu: MenuItem[];
  hasButton?: boolean;
  code: string;
};

export const EXAMPLES_MENU_CONFIGS: Record<string, ExamplesMenuConfig> = {
  basic: {
    label: "Basic",
    description:
      "Actions, separator, and a submenu (Copy, Paste, More → Rename/Delete).",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => alert("Copy") },
    { type: "item", label: "Paste", shortcut: "Ctrl+V", onClick: () => alert("Paste") },
    { type: "separator" },
    {
      type: "submenu",
      label: "More",
      children: [
        { type: "item", label: "Rename", onClick: () => alert("Rename") },
        { type: "item", label: "Delete", onClick: () => alert("Delete") },
      ],
    },
  ],
});

const el = document.getElementById("target");
if (el) menu.bind(el);`,
    menu: [
      { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => alert("Copy") },
      { type: "item", label: "Paste", shortcut: "Ctrl+V", onClick: () => alert("Paste") },
      { type: "separator" },
      {
        type: "submenu",
        label: "More",
        children: [
          { type: "item", label: "Rename", onClick: () => alert("Rename") },
          { type: "item", label: "Delete", onClick: () => alert("Delete") },
        ],
      },
    ],
  },
  nested: {
    label: "Nested",
    description:
      "Multi-level submenus: Open → Recent → files; use hover or Arrow Right.",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    { type: "item", label: "New", onClick: () => {} },
    {
      type: "submenu",
      label: "Open",
      children: [
        { type: "item", label: "File...", onClick: () => {} },
        {
          type: "submenu",
          label: "Recent",
          children: [
            { type: "item", label: "doc.pdf", onClick: () => {} },
            { type: "item", label: "sheet.xlsx", onClick: () => {} },
          ],
        },
      ],
    },
    { type: "separator" },
    { type: "item", label: "Save", shortcut: "Ctrl+S", onClick: () => {} },
  ],
});

document.getElementById("target")?.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  menu.open(e);
});`,
    menu: [
      { type: "item", label: "New", onClick: () => {} },
      {
        type: "submenu",
        label: "Open",
        children: [
          { type: "item", label: "File...", onClick: () => {} },
          {
            type: "submenu",
            label: "Recent",
            children: [
              { type: "item", label: "doc.pdf", onClick: () => {} },
              { type: "item", label: "sheet.xlsx", onClick: () => {} },
            ],
          },
        ],
      },
      { type: "separator" },
      { type: "item", label: "Save", shortcut: "Ctrl+S", onClick: () => {} },
    ],
  },
  custom: {
    label: "Custom renderers",
    description:
      "Custom `render` on an item; first row is custom markup, second is default.",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    {
      type: "item",
      label: "Custom row",
      render: (item) => {
        const el = document.createElement("div");
        el.className = "flex items-center gap-2 px-3 py-2 italic";
        el.textContent = "Custom render: " + item.label;
        return el;
      },
      onClick: () => {},
    },
    { type: "item", label: "Default row", onClick: () => {} },
  ],
});

const el = document.getElementById("target");
if (el) menu.bind(el);`,
    menu: [
      {
        type: "item",
        label: "Custom row",
        render: (item: MenuItem) => {
          const el = document.createElement("div");
          el.className = "flex items-center gap-2 px-3 py-2 italic";
          el.textContent = "Custom render: " + item.label;
          return el;
        },
        onClick: () => {},
      },
      { type: "item", label: "Default row", onClick: () => {} },
    ],
  },
  programmatic: {
    label: "Programmatic",
    description:
      "Open from code: right-click here or use the button to open at element.",
    hasButton: true,
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    { type: "item", label: "Option A", onClick: () => alert("A") },
    { type: "item", label: "Option B", onClick: () => alert("B") },
  ],
});

const btn = document.getElementById("open-btn");
const target = document.getElementById("target");
if (btn) btn.onclick = () => menu.openAtElement(btn, { placement: "bottom-start" });
if (target) target.oncontextmenu = (e) => {
  e.preventDefault();
  menu.open(e);
};`,
    menu: [
      { type: "item", label: "Option A", onClick: () => alert("A") },
      { type: "item", label: "Option B", onClick: () => alert("B") },
    ],
  },
  "view-options": {
    label: "View options",
    description:
      "Checkboxes for toggles and a radio group for single choice (e.g. zoom level).",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

let showGrid = true;
let showRulers = false;
let zoom = "100%";

const menu = createContextMenu({
  menu: [
    { type: "checkbox", label: "Show grid", checked: showGrid, onChange: (v) => { showGrid = v; console.log("Grid:", v); } },
    { type: "checkbox", label: "Show rulers", checked: showRulers, onChange: (v) => { showRulers = v; } },
    { type: "checkbox", label: "Snap to grid", checked: true, onChange: () => {} },
    { type: "separator" },
    { type: "label", label: "Zoom" },
    { type: "radio", name: "zoom", label: "50%", value: "50%", checked: zoom === "50%", onSelect: () => { zoom = "50%"; } },
    { type: "radio", name: "zoom", label: "100%", value: "100%", checked: zoom === "100%", onSelect: () => { zoom = "100%"; } },
    { type: "radio", name: "zoom", label: "200%", value: "200%", checked: zoom === "200%", onSelect: () => { zoom = "200%"; } },
  ],
});

const el = document.getElementById("target");
if (el) menu.bind(el);`,
    menu: [
      { type: "checkbox", label: "Show grid", checked: true, onChange: () => {} },
      { type: "checkbox", label: "Show rulers", checked: false, onChange: () => {} },
      { type: "checkbox", label: "Snap to grid", checked: true, onChange: () => {} },
      { type: "separator" },
      { type: "label", label: "Zoom" },
      { type: "radio", name: "zoom", label: "50%", value: "50%", checked: false, onSelect: () => {} },
      { type: "radio", name: "zoom", label: "100%", value: "100%", checked: true, onSelect: () => {} },
      { type: "radio", name: "zoom", label: "200%", value: "200%", checked: false, onSelect: () => {} },
    ],
  },
  "links-actions": {
    label: "Links & danger",
    description:
      "Action items, external links (type: \"link\"), and a danger variant for destructive actions.",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => {} },
    { type: "item", label: "Paste", shortcut: "Ctrl+V", onClick: () => {} },
    { type: "separator" },
    { type: "link", label: "Documentation", href: "https://github.com/egalan/contextmenu.js", target: "_blank", rel: "noopener noreferrer" },
    { type: "separator" },
    { type: "item", label: "Delete", variant: "danger", onClick: () => alert("Delete") },
  ],
});

const el = document.getElementById("target");
if (el) menu.bind(el);`,
    menu: [
      { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => {} },
      { type: "item", label: "Paste", shortcut: "Ctrl+V", onClick: () => {} },
      { type: "separator" },
      { type: "link", label: "Documentation", href: "https://github.com/egalan/contextmenu.js", target: "_blank", rel: "noopener noreferrer" },
      { type: "separator" },
      { type: "item", label: "Delete", variant: "danger", onClick: () => {} },
    ],
  },
  "share-export": {
    label: "Share & export",
    description:
      "Submenus for Share (copy link, email, social) and Export (PDF, PNG).",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    {
      type: "submenu",
      label: "Share",
      children: [
        { type: "item", label: "Copy link", shortcut: "Ctrl+Shift+C", onClick: () => alert("Link copied") },
        { type: "item", label: "Email", onClick: () => {} },
        { type: "separator" },
        { type: "item", label: "Twitter", onClick: () => {} },
        { type: "item", label: "LinkedIn", onClick: () => {} },
      ],
    },
    {
      type: "submenu",
      label: "Export",
      children: [
        { type: "item", label: "Export as PDF", onClick: () => {} },
        { type: "item", label: "Export as PNG", onClick: () => {} },
      ],
    },
  ],
});

const el = document.getElementById("target");
if (el) menu.bind(el);`,
    menu: [
      {
        type: "submenu",
        label: "Share",
        children: [
          { type: "item", label: "Copy link", shortcut: "Ctrl+Shift+C", onClick: () => {} },
          { type: "item", label: "Email", onClick: () => {} },
          { type: "separator" },
          { type: "item", label: "Twitter", onClick: () => {} },
          { type: "item", label: "LinkedIn", onClick: () => {} },
        ],
      },
      {
        type: "submenu",
        label: "Export",
        children: [
          { type: "item", label: "Export as PDF", onClick: () => {} },
          { type: "item", label: "Export as PNG", onClick: () => {} },
        ],
      },
    ],
  },
  disabled: {
    label: "Disabled items",
    description:
      "Items with disabled: true are not clickable and appear muted.",
    code: `import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

const menu = createContextMenu({
  menu: [
    { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => {} },
    { type: "item", label: "Paste", shortcut: "Ctrl+V", disabled: true, onClick: () => {} },
    { type: "item", label: "Cut", shortcut: "Ctrl+X", disabled: true, onClick: () => {} },
    { type: "separator" },
    { type: "item", label: "Delete", variant: "danger", onClick: () => {} },
  ],
});

const el = document.getElementById("target");
if (el) menu.bind(el);`,
    menu: [
      { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => {} },
      { type: "item", label: "Paste", shortcut: "Ctrl+V", disabled: true, onClick: () => {} },
      { type: "item", label: "Cut", shortcut: "Ctrl+X", disabled: true, onClick: () => {} },
      { type: "separator" },
      { type: "item", label: "Delete", variant: "danger", onClick: () => {} },
    ],
  },
};
