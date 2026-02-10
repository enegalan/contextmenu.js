"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createContextMenu } from "@enegalan/contextmenu.js";
import "@enegalan/contextmenu.js/dist/style.css";
import { EXAMPLES_MENU_CONFIGS } from "@/lib/examples-menu-configs";
import { cn } from "@/lib/utils";

export function ExamplesPreview({
  preset,
  compact = false,
}: {
  preset: string;
  compact?: boolean;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { resolvedTheme } = useTheme();
  const config = EXAMPLES_MENU_CONFIGS[preset];

  useEffect(() => {
    if (!config) return;

    const theme =
      resolvedTheme === "dark"
        ? { class: "cm-theme-dark" }
        : undefined;

    const menu = createContextMenu({ menu: config.menu, theme });

    const triggerEl = triggerRef.current;
    const buttonEl = buttonRef.current;

    if (config.hasButton && buttonEl && triggerEl) {
      buttonEl.onclick = () => menu.openAtElement(buttonEl, { placement: "bottom-start" });
      triggerEl.oncontextmenu = (e) => {
        e.preventDefault();
        menu.open(e);
      };
    } else if (triggerEl) {
      menu.bind(triggerEl);
    }

    return () => {
      menu.destroy();
    };
  }, [preset, config, resolvedTheme]);

  if (!config) return null;

  return (
    <div
      data-slot="preview"
      dir="ltr"
      className={cn(
        "crafting-grid relative flex w-full flex-col overflow-hidden rounded-t-lg",
        compact ? "min-h-[200px]" : "min-h-[360px]"
      )}
    >
      <div
        data-align="center"
        className={cn(
          "preview relative flex flex-col gap-4 flex-1 w-full justify-center items-center rounded-t-lg border-x border-b border-border",
          compact ? "p-6" : "p-10"
        )}
      >
        <div
          ref={triggerRef}
          data-slot="context-menu-trigger"
          style={{ WebkitTouchCallout: "none" }}
          className="select-none flex aspect-video w-full max-w-xs flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-white dark:bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm"
        >
          {config.hasButton ? (
            <>
              <span className="hidden pointer-fine:inline-block">Or right-click here</span>
              <span className="hidden pointer-coarse:inline-block">Or long-press here</span>
            </>
          ) : (
            <>
              <span className="hidden pointer-fine:inline-block">Right click here</span>
              <span className="hidden pointer-coarse:inline-block">Long press here</span>
            </>
          )}
        </div>
        {config.hasButton && (
          <button
            ref={buttonRef}
            type="button"
            className="mb-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted/80"
          >
            Open at button
          </button>
        )}
      </div>
    </div>
  );
}
