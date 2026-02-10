export const EXAMPLES_CDN_VERSION = "1.4.0";
const CDN_BASE = `https://unpkg.com/@enegalan/contextmenu.js@${EXAMPLES_CDN_VERSION}`;

export type ExamplesPreset = { label: string; files: Record<string, string> };

export const EXAMPLES_PRESETS: Record<string, ExamplesPreset> = {
  basic: {
    label: "Basic",
    files: {
      "/index.js": `import { createContextMenu } from "@enegalan/contextmenu.js";
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
if (el) menu.bind(el);
`,
      "/index.html": `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>contextmenu.js</title>
</head>
<body>
  <div id="target" style="padding: 2rem; background: #f0f0f0; border-radius: 8px; margin: 2rem;">
    Right-click or long-press here
  </div>
  <script type="module" src="/index.js"></script>
</body>
</html>
`,
    },
  },
  nested: {
    label: "Nested",
    files: {
      "/index.js": `import { createContextMenu } from "@enegalan/contextmenu.js";
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
});
`,
      "/index.html": `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>contextmenu.js</title>
</head>
<body>
  <div id="target" style="padding: 2rem; background: #f0f0f0; border-radius: 8px; margin: 2rem;">
    Right-click here for nested menus
  </div>
  <script type="module" src="/index.js"></script>
</body>
</html>
`,
    },
  },
  programmatic: {
    label: "Programmatic",
    files: {
      "/index.js": `import { createContextMenu } from "@enegalan/contextmenu.js";
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
if (target) target.oncontextmenu = (e) => { e.preventDefault(); menu.open(e); };
`,
      "/index.html": `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>contextmenu.js</title>
</head>
<body>
  <button id="open-btn" style="padding: 0.5rem 1rem; margin: 2rem;">Open at button</button>
  <div id="target" style="padding: 2rem; background: #f0f0f0; border-radius: 8px; margin: 2rem;">
    Or right-click here
  </div>
  <script type="module" src="/index.js"></script>
</body>
</html>
`,
    },
  },
};

export function rewritePresetScriptForCDN(js: string, cdnBase: string = CDN_BASE): string {
  return js
    .replace(/from\s+["']@enegalan\/contextmenu\.js["']/g, `from "${cdnBase}/dist/index.js"`)
    .replace(/import\s+["']@enegalan\/contextmenu\.js\/dist\/style\.css["']/g, `import "${cdnBase}/dist/style.css"`);
}
