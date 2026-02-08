# contextmenu.js

A smooth and highly customizable JavaScript context-menu library. TypeScript-first, framework-agnostic, with full keyboard and screen-reader support.

## Install

```bash
npm install contextmenu.js
```

## Quick start

```js
import { createContextMenu } from "contextmenu.js";
import "contextmenu.js/src/default-styles.css";

const menu = createContextMenu({
  menu: [
    { label: "Copy", shortcut: "Ctrl+C", onClick: () => copy() },
    { label: "Paste", shortcut: "Ctrl+V", onClick: ({ close }) => { paste(); close(); } },
    { type: "separator" },
    {
      type: "submenu",
      label: "More",
      children: [
        { label: "Rename", onClick: () => rename() },
        { label: "Delete", onClick: () => remove() },
      ],
    },
  ],
});

// Right-click
element.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  menu.open(e);
});

// Programmatic
menu.open(x, y);
menu.close();
```

## API

### `createContextMenu(config)`

Returns an instance with:

- **`open(x?, y?)`** / **`open(event: MouseEvent)`** – Show menu at (x, y) or at the event’s client coordinates.
- **`close()`** – Close the menu (idempotent).
- **`toggle(x?, y?)`** – Open if closed, close if open.
- **`destroy()`** – Remove DOM and listeners.
- **`setMenu(menu)`** – Replace the menu tree for the next open.

### Config

- **`menu`** – Array of `MenuItem` (see below).
- **`submenuArrow?`** – `boolean | SubmenuArrowConfig` – When `true`, parent items with a submenu show the default CSS arrow. When an object, customize it: **`icon?`** – SVG string or `HTMLElement` (omit for default triangle); **`size?`** – `number` (px) or CSS length (e.g. `"0.5rem"`); **`className?`** – extra class on the arrow wrapper; **`opacity?`** – 0–1. Omit or `false` to hide.
- **`theme?`** – `{ class?: string; tokens?: Record<string, string> }` – Extra class on the root and CSS variable overrides (e.g. `tokens: { "bg": "#111" }` sets `--cm-bg`).
- **`animation?`** – `{ enter?: number | { duration, easing }; leave?: number | { duration, easing }; disabled?: boolean }` – Durations in ms; `disabled: true` turns off animations.
- **`position?`** – `{ offset?: { x, y }; padding?: number; flip?: boolean; shift?: boolean }` – Offset from anchor; viewport padding; flip/shift to keep menu in view.
- **`portal?`** – `HTMLElement` or `() => HTMLElement` – Container to mount the menu (default: `document.body`).
- **`onOpen?`** / **`onClose?`** – Lifecycle callbacks (onClose runs after the leave animation).

### Menu items

- **Action**: `{ label, icon?, shortcut?, disabled?, onClick?, render?, ... }` – `onClick(event)` receives `{ item, nativeEvent, close }`. Optional `render(item)` returns a custom `HTMLElement` (library still sets role/tabindex/aria).
- **Submenu**: `{ type: "submenu", label, children: MenuItem[], disabled?, ... }` – Nested menus; open on hover or Arrow Right / Enter. When `disabled` is true, the submenu cannot be opened.
- **Separator**: `{ type: "separator" }`.

## Theming

Load the default styles and override with CSS variables:

```css
@import "contextmenu.js/src/style.css";

.cm-menu {
  --cm-bg: #1e1e1e;
  --cm-fg: #eee;
  --cm-radius: 8px;
}
```

**Dark mode:** load the dark theme stylesheet and set the theme class:

```css
@import "contextmenu.js/src/default-styles.css";
```


Pass tokens when creating the menu:

```js
createContextMenu({
  menu: [...],
  theme: {
    class: "my-menu",
    tokens: { bg: "#1e1e1e", fg: "#eee" },
  },
});
```

Variables: `--cm-bg`, `--cm-fg`, `--cm-radius`, `--cm-shadow`, `--cm-item-padding-x`, `--cm-item-padding-y`, `--cm-font-size`, `--cm-border`, `--cm-menu-padding`, `--cm-menu-min-width`, `--cm-separator-bg`, `--cm-separator-margin`, `--cm-separator-height`, `--cm-item-hover-bg`, `--cm-item-active-bg`, `--cm-disabled-opacity`, `--cm-shortcut-font-size`, `--cm-shortcut-opacity`, `--cm-z-index`. For default submenu arrow: `--cm-submenu-arrow-size` (e.g. `5px`).

## Accessibility

- **ARIA**: Root has `role="menu"`, items `role="menuitem"`, submenus `aria-haspopup="menu"` and `aria-expanded`; separators `role="separator"`.
- **Keyboard**: Arrow Up/Down (move), Arrow Right (open submenu), Arrow Left (close submenu or menu), Enter/Space (activate or open submenu), Escape (close), Home/End (first/last item). Focus is restored to the trigger on close.
- **Focus**: Roving tabindex; one keydown listener on the menu container.

## Build

```bash
npm install
npm run build
```

Output: `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`. Default styles remain in `src/style.css` (no build step).

## Example

Run the dev server; it builds the library, starts a static server, and opens the basic example in your browser:

```bash
npm run dev
```

## License

MIT
