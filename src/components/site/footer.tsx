import Link from "next/link";

const GITHUB_URL = "https://github.com/egalan/contextmenu.js";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 px-4 py-8">
      <div className="container mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          contextmenu.js — smooth, customizable context menus. MIT License.
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
