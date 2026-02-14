"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

export function LiveDemo() {
  const { resolvedTheme } = useTheme();
  const targetRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<ReturnType<typeof createContextMenu> | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const theme = resolvedTheme === "dark" ? { class: "cm-theme-dark" } : undefined;
    const menu = createContextMenu({
      menu: [
        { type: "link", label: "View docs", href: "/docs/introduction" },
        { type: "link", label: "Try examples", href: "/examples/basic-menu" },
        { type: "separator" },
        {
          type: "item",
          label: "Copy",
          shortcut: "Ctrl+C",
          onClick: () => {
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
              navigator.clipboard.writeText("contextmenu.js").then(() => {
                setFeedback("Copied!");
                if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
                feedbackTimerRef.current = setTimeout(() => {
                  setFeedback(null);
                  feedbackTimerRef.current = null;
                }, 2000);
              });
            }
          },
        },
        {
          type: "item",
          label: "Paste",
          shortcut: "Ctrl+V",
          onClick: () => {},
        },
        { type: "separator" },
        {
          type: "submenu",
          label: "More",
          children: [
            { type: "item", label: "Rename", onClick: () => {} },
            { type: "item", label: "Delete", variant: "danger", onClick: () => {} },
          ],
        },
      ],
      theme,
      platform: "auto",
    });

    menu.bind(el);
    menuRef.current = menu;
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      menu.destroy();
      menuRef.current = null;
    };
  }, [resolvedTheme]);

  return (
    <section className="border-b border-border/40 px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Try it
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Right-click or long-press the area below. Keyboard and screen-reader
          friendly.
        </p>
        <div
          ref={targetRef}
          className="mt-8 min-h-[200px] rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted/50 relative"
        >
          <span className="hidden pointer-fine:inline">Right-click here</span>
          <span className="hidden pointer-coarse:inline">Long-press here</span>
          {feedback && (
            <span
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-primary animate-in fade-in-0 duration-200"
              role="status"
            >
              {feedback}
            </span>
          )}
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Or{" "}
          <Link
            href="/docs/introduction"
            className="underline underline-offset-2 hover:text-foreground"
          >
            read the docs
          </Link>{" "}
          and{" "}
          <Link
            href="/examples/basic-menu"
            className="underline underline-offset-2 hover:text-foreground"
          >
            explore examples
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
