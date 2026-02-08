# contextmenu.js

A smooth and highly customizable JavaScript context-menu library. TypeScript-first, framework-agnostic, with full keyboard and screen-reader support.

## Install

```bash
npm install contextmenu.js
```

## Quick start

```js
import { createContextMenu } from "contextmenu.js";
import "contextmenu.js/src/style.css";

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

// Attach at creation (right-click / long-press on the element)
const menuWithBind = createContextMenu({ menu: [...], bind: element });
// Or with options: bind: { element, options: { longPressMs: 500 } }

// Or attach later
menu.bind(element);

// Or wire manually
element.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  menu.open(e);
});

// Programmatic
menu.open(x, y);
menu.close();

// Open anchored to an element (e.g. button)
menu.openAtElement(button, { placement: "bottom-start" });

// Query state
menu.isOpen();
menu.getMenu();
```

## API

### `createContextMenu(config)`

Returns an instance with:

- **`open(x?, y?)`** / **`open(event: MouseEvent)`** – Show menu at (x, y) or at the event’s client coordinates.
- **`close()`** – Close the menu (idempotent).
- **`toggle(x?, y?)`** – Open if closed, close if open.
- **`openAtElement(element, options?)`** – Show menu anchored to an element. Options: **`placement?`** (default `'bottom-start'`), **`offset?`** `{ x, y }` in px.
- **`isOpen()`** – Returns whether the menu is currently open.
- **`getMenu()`** – Returns a copy of the current menu tree.
- **`bind(element, options?)`** – Attach to an element: right-click opens on desktop, long-press (default 500 ms) opens on touch. Options: **`longPressMs?`** – delay in ms. Listeners are removed on **`destroy()`**.
- **`destroy()`** – Remove DOM, bound listeners, and cleanup.
- **`setMenu(menu)`** – Replace the menu tree for the next open.

### Config

- **`menu`** – Array of `MenuItem`, or a function `() => MenuItem[]` that returns the menu each time the menu is opened (dynamic menu).
- **`submenuArrow?`** – `boolean | SubmenuArrowConfig` – When `true`, parent items with a submenu show the default CSS arrow. When an object, customize it: **`icon?`** – SVG string or `HTMLElement` (omit for default triangle); **`size?`** – `number` (px) or CSS length (e.g. `"0.5rem"`); **`className?`** – extra class on the arrow wrapper; **`opacity?`** – 0–1. Omit or `false` to hide.
- **`theme?`** – `{ class?: string; tokens?: Record<string, string> }` – Extra class on the root and CSS variable overrides (e.g. `tokens: { "bg": "#111" }` sets `--cm-bg`).
- **`animation?`** – `{ enter?: number | { duration, easing }; leave?: number | { duration, easing }; disabled?: boolean }` – Durations in ms; `disabled: true` turns off animations.
- **`position?`** – `{ offset?: { x, y }; padding?: number; flip?: boolean; shift?: boolean }` – Offset from anchor; viewport padding; flip/shift to keep menu in view.
- **`portal?`** – `HTMLElement` or `() => HTMLElement` – Container to mount the menu (default: `document.body`).
- **`getAnchor?`** – `() => { x, y } | DOMRect` – When `open()` is called with no arguments, this provides the anchor point or rect for positioning.
- **`bind?`** – `HTMLElement` or `{ element: HTMLElement; options?: BindOptions }` – Element to attach so the menu opens on contextmenu (desktop) and long-press (touch). Same effect as calling `instance.bind(element, options)` after creation. **Options**: **`longPressMs?`** – delay in ms for touch long-press (default 500).
- **`onOpen?`** / **`onClose?`** – Lifecycle callbacks. **`onOpen(event?)`** receives the `MouseEvent` when the menu was opened via contextmenu or `bind`; `undefined` when opened programmatically (e.g. `open(x, y)` or long-press). Use it to capture the right-click target for dynamic menus. onClose runs after the leave animation.

### Menu items

- **Action**: `{ label, icon?, shortcut?, disabled?, onClick?, closeOnAction?, render?, ... }` – `onClick(event)` receives `{ item, nativeEvent, close }`. **`closeOnAction?`** – when `false`, the menu stays open after click (default is true). Optional `render(item)` returns a custom `HTMLElement` (library still sets role/tabindex/aria).
- **Submenu**: `{ type: "submenu", label, children: MenuItem[], disabled?, ... }` – Nested menus; open on hover or Arrow Right / Enter. When `disabled` is true, the submenu cannot be opened.
- **Separator**: `{ type: "separator" }`.
- **Checkbox**: `{ type: "checkbox", label, checked?, leadingIcon?, shortcut?, icon?, uncheckedIcon?, checkedClassName?, uncheckedClassName?, disabled?, onChange?, closeOnAction?, render?, ... }` – `onChange(event)` receives `{ item, checked, nativeEvent, close }`. **`closeOnAction?`** – when `false`, the menu stays open after change (default is true). **`icon?`** – indicator when checked (e.g. SVG). **`uncheckedIcon?`** – indicator when unchecked (if omitted, empty). **`checkedClassName?`** / **`uncheckedClassName?`** – CSS class(es) on the indicator wrapper for styling each state. **`leadingIcon?`** – optional icon in the row (before label). **`render?(item)`** – custom `HTMLElement` for full control. Toggle state is not stored; use a function menu or `setMenu` to persist.
- **Radio**: `{ type: "radio", label, name, value, checked?, leadingIcon?, shortcut?, icon?, uncheckedIcon?, checkedClassName?, uncheckedClassName?, disabled?, onSelect?, closeOnAction?, render?, ... }` – `onSelect(event)` receives `{ item, value, nativeEvent, close }`. **`closeOnAction?`** – when `false`, the menu stays open after select (default is true). **`icon?`** – indicator when selected. **`uncheckedIcon?`** – indicator when not selected. **`checkedClassName?`** / **`uncheckedClassName?`** – CSS class(es) on the indicator wrapper for each state. **`leadingIcon?`** – optional icon in the row. **`render?(item)`** – custom `HTMLElement` for full control. Only one in a group (same `name`) should have `checked: true`; update the menu to reflect selection.
- **Label**: `{ type: "label", label }` – Non-focusable section header (e.g. "View", "Sort by"). Optional `id`, `className`.

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
@import "contextmenu.js/src/style.css";
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

Variables: `--cm-bg`, `--cm-fg`, `--cm-radius`, `--cm-shadow`, `--cm-item-padding-x`, `--cm-item-padding-y`, `--cm-font-size`, `--cm-border`, `--cm-menu-padding`, `--cm-menu-min-width`, `--cm-separator-bg`, `--cm-separator-margin`, `--cm-separator-height`, `--cm-item-hover-bg`, `--cm-item-active-bg`, `--cm-disabled-opacity`, `--cm-shortcut-font-size`, `--cm-shortcut-opacity`, `--cm-z-index`. For default submenu arrow: `--cm-submenu-arrow-size` (e.g. `5px`). For labels: `--cm-label-font-size`, `--cm-label-opacity`. For checkbox/radio: `--cm-check-size`, `--cm-radio-size`.

## Accessibility

- **ARIA**: Root has `role="menu"`, items `role="menuitem"` (or `menuitemcheckbox` / `menuitemradio` for checkbox/radio items), submenus `aria-haspopup="menu"` and `aria-expanded`; separators `role="separator"`; labels `role="presentation"`.
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
