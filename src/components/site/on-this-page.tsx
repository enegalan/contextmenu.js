"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocHeading } from "@/lib/mdx";

interface OnThisPageProps {
  headings: DocHeading[];
  className?: string;
}

function useActiveHeading(headings: DocHeading[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const scrollOffset = 120;

    function updateActive() {
      let current: string | null = null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= scrollOffset) current = h.id;
      }
      if (current === null && headings.length > 0) {
        current = headings[0].id;
      }
      setActiveId((prev) => (current !== prev ? current : prev));
    }

    const raf = requestAnimationFrame(() => updateActive());
    const scrollContainer = document.querySelector("main");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updateActive, { passive: true });
    }
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scrollContainer?.removeEventListener("scroll", updateActive);
      window.removeEventListener("scroll", updateActive);
    };
  }, [headings]);

  return activeId;
}

export function OnThisPageMobile({ headings, className }: OnThisPageProps) {
  const activeId = useActiveHeading(headings);

  if (headings.length === 0) return null;

  return (
    <nav
      className={cn("px-4 py-3 lg:hidden", className)}
      aria-label="On this page"
    >
      <div className="flex flex-col text-sm">
        {headings.map((h, index) => {
          const isActive = activeId === h.id;
          const spacing =
            index === 0
              ? ""
              : h.level === 2
                ? " mt-3"
                : " mt-1 pl-3";
          return (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={cn(
                "text-muted-foreground hover:text-foreground py-0.5 transition-colors",
                spacing,
                isActive && "font-medium text-primary"
              )}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-chart-2">#</span> {h.text}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function OnThisPage({ headings, className }: OnThisPageProps) {
  const activeId = useActiveHeading(headings);

  if (headings.length === 0) return null;

  return (
    <aside
      className={cn(
        "sticky top-14 z-40 hidden w-52 shrink-0 self-start py-6 pl-6 lg:block",
        "max-h-[calc(100vh-3.5rem)] flex flex-col",
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <p className="mb-3 flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <svg
            className="size-4 shrink-0 text-muted-foreground"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M1.83301 7.99992H14.1663M1.83301 3.83325H14.1663M1.83301 12.1666H7.66634"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
            />
          </svg>
          On this page
        </p>
        <ScrollArea className="min-h-0 flex-1 overflow-hidden border-l border-border pl-4">
          <nav className="space-y-1 pr-2">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={cn(
                    "relative block rounded-md py-1.5 text-sm transition-colors duration-150",
                    h.level === 2 &&
                      "font-medium text-foreground hover:text-primary",
                    h.level === 3 &&
                      "pl-3 text-muted-foreground hover:text-foreground",
                    isActive && "text-primary",
                    isActive && h.level === 2 && "pl-3",
                    isActive &&
                      "after:absolute after:-left-4 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:bg-primary after:content-['']"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {h.text}
                </a>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}
