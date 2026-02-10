/**
 * Shadcn-aligned CSS for the examples iframe. Matches globals.css tokens.
 */
export const EXAMPLES_IFRAME_STYLES = `
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--foreground);
  --grid-size: 24px;
  --grid-line: 1px;
  --grid-line-color: oklch(0.75 0 0 / 0.4);
  background-color: var(--muted);
  background-image:
    linear-gradient(to right, var(--grid-line-color) var(--grid-line), transparent var(--grid-line)),
    linear-gradient(to bottom, var(--grid-line-color) var(--grid-line), transparent var(--grid-line));
  background-size: var(--grid-size) var(--grid-size);
}
.dark body {
  --grid-line-color: oklch(0.5 0 0 / 0.35);
}
#target {
  padding: 2rem;
  background: var(--muted);
  color: var(--muted-foreground);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  margin: 2rem;
  box-shadow: 0 1px 2px oklch(0 0 0 / 0.05);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
#open-btn {
  padding: 0.5rem 1rem;
  margin: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
#open-btn:hover {
  background: var(--accent);
  color: var(--accent-foreground);
}
`;
