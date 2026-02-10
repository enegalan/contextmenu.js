# contextmenu.js

A smooth, customizable context menu library. TypeScript-first, framework-agnostic, with keyboard and screen-reader support.

## Installation

```bash
npm install @enegalan/contextmenu.js
```

Import the default CSS so the menu is styled:

```js
import "@enegalan/contextmenu.js/dist/style.css";
```

The library ships as ESM by default. For CommonJS use `dist/index.cjs`.

## Quick example

```js
import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

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

menu.bind(document.getElementById("my-element"));
```

Right-click (or long-press on touch) the element to open the menu.

## License

MIT
