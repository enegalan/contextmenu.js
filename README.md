# contextmenu.js

A smooth, customizable context-menu library. TypeScript-first, framework-agnostic, with keyboard and screen-reader support.

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
    { type: "submenu", label: "More", children: [
      { label: "Rename", onClick: () => rename() },
      { label: "Delete", onClick: () => remove() },
    ]},
  ],
});

// Open on right-click (desktop) or long-press (touch)
menu.bind(element);

// Or manually
element.addEventListener("contextmenu", (e) => { e.preventDefault(); menu.open(e); });

// Programmatic
const selected = await menu.open(x, y);
menu.close();
menu.openAtElement(button, { placement: "bottom-start" });
```

---

## Instance methods

What you get from `createContextMenu(config)`:

| Method | Description |
|--------|-------------|
| `open(x?, y?)` / `open(event)` | Show menu at coordinates or at the event position. Returns a `Promise<MenuItem \| undefined>` that resolves with the selected item when the menu closes, or `undefined` if closed without selection. |
| `close()` | Close the menu. Returns a `Promise<void>` that resolves when the close animation finishes. |
| `toggle(x?, y?)` | Open if closed, close if open. |
| `openAtElement(el, options?)` | Show menu next to an element. `options.placement`: `"bottom-start"`, `"top-end"`, `"auto"`, etc. `options.offset`: `{ x, y }` in px. |
| `isOpen()` | `true` if the menu is visible. |
| `getAnchor()` | Returns `{ x, y }` of the last open anchor, or `null`. |
| `getMenu()` | Copy of the current menu (array of items). |
| `getRootElement()` | The wrapper DOM element (for tests or styling). |
| `unbind(element?)` | Remove bind from the given element, or from the currently bound element if no argument. |
| `setMenu(menu)` | Replace the menu. `menu` is an array of menu items. |
| `updateMenu(updater)` | Change the menu from current state. `updater` is a function: `(currentItems) => newItems`. See example below. |
| `setTheme(theme)` | Change theme at runtime. `theme`: `{ class?: string, tokens?: { bg: "...", fg: "..." } }` or `undefined` to clear. |
| `setPosition(position)` | Change position config for next open. `position`: `{ offset?: { x, y }, padding?: number, flip?: boolean, shift?: boolean }`. |
| `setAnimation(animation)` | Change animation at runtime. `animation`: `{ enter?: number, leave?: number, disabled?: boolean }` (times in ms). |
| `bind(element, options?)` | Open menu on right-click / long-press. `options.longPressMs`: delay for long-press (default 500). |
| `destroy()` | Remove menu and all listeners. |

**updateMenu example** — e.g. to persist a checkbox:

```js
menu.updateMenu((current) =>
  current.map((item) =>
    item.type === "checkbox" && item.label === "Dark mode"
      ? { ...item, checked: !item.checked }
      : item
  )
);
```

**setTheme / setPosition / setAnimation example** — same shape as in config:

```js
menu.setTheme({ class: "my-dark", tokens: { bg: "#1a1a1a", fg: "#eee" } });
menu.setPosition({ padding: 12 });
menu.setAnimation({ enter: 150, leave: 100 });
menu.setTheme(undefined); // clear theme
```

---

## Config options

What you pass to `createContextMenu({ ... })`:

| Option | Type | Description |
|--------|------|-------------|
| `menu` | `MenuItem[]` or `() => MenuItem[]` | The menu tree. If a function, it runs each time the menu opens (dynamic menu). |
| `submenuArrow` | `boolean` or object | `true` = default arrow. Object: `{ icon?, size?, className?, opacity? }`. |
| `spinner` | `{ icon?, size?, speed? }` | Default loading spinner. `icon`: SVG string or HTMLElement. `size`: px or CSS length. `speed`: ms per full rotation (default 600). Overridable per item via `loadingIcon`, `loadingSize`, `loadingSpeed`. |
| `theme` | `{ class?, tokens? }` | `class`: CSS class on menu. `tokens`: e.g. `{ bg: "#111", fg: "#eee" }` (sets `--cm-bg`, `--cm-fg`). |
| `animation` | `{ enter?, leave?, disabled? }` | `enter` / `leave`: ms or `{ duration, easing }`. `disabled: true` = no animation. |
| `position` | `{ offset?, padding?, flip?, shift? }` | `offset`: `{ x, y }`. `padding`: viewport padding (px). `flip` / `shift`: keep menu in view. |
| `portal` | `HTMLElement` or function | Where to mount the menu. Default: `document.body`. |
| `getAnchor` | `() => { x, y }` or `DOMRect` | Used when `open()` is called with no arguments. |
| `submenuPlacement` | `"right"` \| `"left"` \| `"auto"` | Where to open submenus. `"auto"` uses RTL and viewport space (default). |
| `bind` | `HTMLElement` or `{ element, options? }` | Same as calling `menu.bind(element, options)` after create. |
| `onOpen` | `(event?: MouseEvent) => void` | Called when menu opens. `event` is set when opened by right-click or bind. |
| `onClose` | `() => void` | Called when menu closes (after leave animation). |
| `onBeforeOpen` | `(event?: MouseEvent) => boolean \| void \| Promise<...>` | Called before opening. Return `false` (or a Promise resolving to `false`) to cancel. |
| `onBeforeClose` | `() => boolean \| void \| Promise<...>` | Called before closing. Return `false` (or a Promise resolving to `false`) to cancel. |
| `onItemHover` | `(payload: { item, nativeEvent }) => void` | Called when the user hovers or focuses an interactive item. |
| `closeOnResize` | `boolean` | If `true`, menu closes on window resize. |

---

## Menu item types

Each entry in `menu` (or in a submenu’s `children`) is one of these.

**Action** — clickable row

- `label` (string), `icon?`, `shortcut?`, `disabled?`, `loading?`, `variant?`, `onClick?`, `closeOnAction?`, `render?`
- `onClick` receives `{ item, nativeEvent, close }`. By default the menu closes on click; set `closeOnAction: false` to keep it open.
- `loading`: when `true`, shows a spinner and blocks interaction (use `setMenu` / `updateMenu` to clear). Optional: `loadingIcon` (SVG or HTMLElement), `loadingSize` (px or CSS length), `loadingSpeed` (ms per rotation) to override config.
- `variant`: `"default"` | `"danger"` | `"info"` | `"success"` | `"warning"` | `"muted"` (adds class e.g. `cm-item--danger`).

**Link** — navigation item

- `type: "link"`, `label`, `href`, optional `icon?`, `shortcut?`, `target?` (e.g. `"_blank"`), `rel?` (e.g. `"noopener"`), `disabled?`, `loading?`, `variant?`, `className?`
- Renders as `<a>`. Ctrl/Cmd+click opens in new tab without preventing default.

**Submenu** — opens a nested menu

- `type: "submenu"`, `label`, `children` (array of items), `icon?`, `shortcut?`, `disabled?`, `variant?`, `submenuPlacement?`
- `submenuPlacement`: `"right"` | `"left"` | `"auto"` overrides the config for this submenu.
- Opens on hover or Arrow Right / Enter.

**Separator**

- `type: "separator"` (optional `id`, `className`).

**Checkbox**

- `type: "checkbox"`, `label`, `checked?`, `onChange?`, plus `leadingIcon?`, `shortcut?`, `icon?` / `uncheckedIcon?`, `disabled?`, `loading?`, `closeOnAction?`, `variant?`, `render?`
- `onChange` receives `{ item, checked, nativeEvent, close }`. State is not stored; use a function menu or `setMenu` / `updateMenu` to persist.

**Radio**

- `type: "radio"`, `label`, `name`, `value`, `checked?`, `onSelect?`, plus same optional props as checkbox (including `loading?`).
- One item per group (same `name`) should have `checked: true`. Update menu to reflect selection.

**Label** — non-clickable header

- `type: "label"`, `label` (string), optional `id`, `className`.

---

## Theming

Load the default CSS and override with variables:

```css
@import "contextmenu.js/src/style.css";

.cm-menu {
  --cm-bg: #1e1e1e;
  --cm-fg: #eee;
  --cm-radius: 8px;
}
```

Or pass `theme` when creating the menu:

```js
createContextMenu({
  menu: [...],
  theme: { class: "my-menu", tokens: { bg: "#1e1e1e", fg: "#eee" } },
});
```

**Main variables:** `--cm-bg`, `--cm-fg`, `--cm-radius`, `--cm-shadow`, `--cm-menu-padding`, `--cm-menu-min-width`, `--cm-menu-max-height` (use `none` for no scroll), `--cm-item-radius`, `--cm-item-padding-x`, `--cm-item-padding-y`, `--cm-item-hover-bg`, `--cm-item-active-bg`, `--cm-font-size`, `--cm-border`, `--cm-separator-bg`, `--cm-separator-margin`, `--cm-separator-height`, `--cm-disabled-opacity`, `--cm-z-index`, `--cm-spinner-size`. Variants: `.cm-item--danger`, `.cm-item--info`, `.cm-item--success`, `.cm-item--warning`, `.cm-item--muted`.

**Animation variables** (also set by config `animation` at runtime): `--cm-enter-duration` (default 120ms), `--cm-leave-duration` (default 80ms), `--cm-enter-easing` (default ease-out), `--cm-leave-easing` (default ease-in). Override in CSS or via the `animation` option.

---

## Accessibility

- **ARIA:** Root `role="menu"`, items `menuitem` / `menuitemcheckbox` / `menuitemradio`, submenus `aria-haspopup` and `aria-expanded`, separators `separator`, labels `presentation`.
- **Keyboard:** Arrows (move, open/close submenu), Enter/Space (activate), Escape (close), Home/End (first/last). **Shortcuts:** With the menu open, pressing an item’s shortcut (e.g. `Ctrl+C` or `Cmd+C`) runs that item; Ctrl and Cmd are treated as equivalent (macOS and Windows/Linux). Focus returns to trigger on close.
- **Focus:** Roving tabindex on the menu.

---

## Bundle size

Build output is minified. Approximate sizes:

| Asset | Minified | Gzipped |
|-------|----------|---------|
| `dist/index.js` (ESM) | ~23 KB | ~6.7 KB |
| `dist/index.cjs` (CJS) | ~23 KB | ~6.9 KB |
| `src/style.css` | ~7.5 KB | ~1.7 KB |

---

## Build

```bash
npm install
npm run build
```

Output: `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`. Styles: `src/style.css` (no build).

**Dev + example:**

```bash
npm run dev
```

---

## License

MIT
