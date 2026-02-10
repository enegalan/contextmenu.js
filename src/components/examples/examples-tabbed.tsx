"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";
import { EXAMPLES_MENU_CONFIGS } from "@/lib/examples-menu-configs";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/docs/copy-button";
import { ExamplesPreview } from "./examples-preview";
import { cn } from "@/lib/utils";

const DEFAULT_PRESET = "basic";
const ENTRIES = Object.entries(EXAMPLES_MENU_CONFIGS);

export function ExamplesPreviewBlock({
  label,
  description,
  preset,
  code,
  compact = false,
}: {
  label: string;
  description?: string;
  preset: string;
  code: string;
  compact?: boolean;
}) {
  return (
    <div
      data-slot="component-preview"
      className="group relative mt-4 flex flex-col overflow-hidden"
    >
      <div data-slot="preview" className="flex flex-col">
        <div className="border-0 border-b-0 bg-transparent px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description ?? "Right-click or long-press here to open the context menu."}
          </p>
        </div>
        <ExamplesPreview preset={preset} compact={compact} />
      </div>
      <ExamplesCode code={code} />
    </div>
  );
}

function Examples() {
  const [selected, setSelected] = useState(DEFAULT_PRESET);
  const config = EXAMPLES_MENU_CONFIGS[selected];
  if (!config) return null;

  return (
    <div className="flex flex-col gap-8">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {ENTRIES.map(([key, { label, description }]) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                "hover:border-border hover:bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected === key
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              )}
            >
              <span className="block text-sm font-medium text-foreground">{label}</span>
              {description && (
                <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <section aria-label="Demo">
        <ExamplesPreviewBlock
          label={config.label}
          description={config.description}
          preset={selected}
          code={config.code}
        />
      </section>
    </div>
  );
}

function ExamplesCode({ code }: { code: string }) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeReady = mounted && resolvedTheme !== undefined;
  const theme = resolvedTheme === "dark" ? themes.vsDark : themes.github;

  return (
    <div
      data-slot="code"
      data-mobile-code-visible={expanded}
      className="relative overflow-hidden border-x border-b border-border rounded-b-lg"
    >
      <div className="relative">
        <div className="relative">
          <div
            className={cn(
              "group relative",
              !expanded && "max-h-44 overflow-hidden"
            )}
          >
            <CopyButton
              text={code}
              className={cn(
                "absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100",
                "hover:bg-background/95 hover:text-foreground dark:hover:bg-background/90",
                "border border-transparent hover:border-border",
                expanded && "opacity-100"
              )}
            />
            {themeReady ? (
              <Highlight theme={theme} code={code.trim()} language="tsx">
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={cn(
                      "overflow-x-auto overflow-y-auto px-4 py-3.5 text-sm max-h-96 scrollbar-hide",
                      className
                    )}
                    style={{ ...style, margin: 0 }}
                  >
                    {tokens.map((line, lineIndex) => (
                      <div key={lineIndex} {...getLineProps({ line })}>
                        {line.map((token, tokenIndex) => (
                          <span key={tokenIndex} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            ) : (
              <pre
                className="overflow-x-auto overflow-y-auto px-4 py-3.5 text-sm max-h-96 scrollbar-hide bg-muted text-foreground"
                aria-hidden
                style={{ margin: 0 }}
              >
                {code.trim().split("\n").map((line, i) => (
                  <div key={i}>{line || " "}</div>
                ))}
              </pre>
            )}
          </div>
          {!expanded && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 pt-12">
              <div
                className="absolute inset-0 z-1 bg-muted/80 mask-[linear-gradient(to_top,black_0%,black_20%,transparent_70%)]"
                aria-hidden
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpanded(true)}
                className="relative z-10"
              >
                View Code
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Examples };
export default Examples;
