"use client";

import { useEffect, useRef } from "react";
import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";

export function LiveDemo() {
  const targetRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<ReturnType<typeof createContextMenu> | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const menu = createContextMenu({
      menu: [
        { type: "item", label: "Copy", shortcut: "Ctrl+C", onClick: () => {} },
        { type: "item", label: "Paste", shortcut: "Ctrl+V", onClick: () => {} },
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
    });

    menu.bind(el);
    menuRef.current = menu;
    return () => {
      menu.destroy();
      menuRef.current = null;
    };
  }, []);

  return (
    <section className="border-b border-border/40 px-4 py-16">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Try it
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Right-click or long-press the area below to open the context menu.
        </p>
        <div
          ref={targetRef}
          className="mt-8 min-h-[200px] rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted/50"
        >
          Right-click or long-press here
        </div>
      </div>
    </section>
  );
}
