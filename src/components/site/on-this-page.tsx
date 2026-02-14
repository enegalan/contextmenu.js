"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocHeading } from "@/lib/mdx";

const HEADER_TOP_PX = 56;

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
              key={`${h.id}-${index}`}
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

function useSidebarPlaceholderRect() {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{
    left: number;
    width: number;
    inView: boolean;
  } | null>(null);

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;

    function update() {
      if (!placeholderRef.current) return;
      const r = placeholderRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const inView = r.top < vh && r.bottom > HEADER_TOP_PX;
      setRect({
        left: r.left,
        width: r.width,
        inView,
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { placeholderRef, rect };
}

export function OnThisPage({ headings, className }: OnThisPageProps) {
  const activeId = useActiveHeading(headings);
  const { placeholderRef, rect } = useSidebarPlaceholderRect();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId || !sidebarRef.current) return;
    const link = sidebarRef.current.querySelector<HTMLAnchorElement>(
      `a[href="#${activeId}"]`
    );
    link?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [activeId]);

  if (headings.length === 0) return null;

  const navContent = (
    <div className="pl-4">
      <nav className="w-fit space-y-1 border-l border-border pl-4 pr-2">
        {headings.map((h, index) => {
          const isActive = activeId === h.id;
          return (
            <a
              key={`${h.id}-${index}`}
              href={`#${h.id}`}
              className={cn(
                "relative block py-1.5 text-sm transition-colors duration-150",
                h.level === 2 &&
                  "font-medium text-foreground hover:text-primary",
                h.level === 3 &&
                  "pl-3 text-muted-foreground hover:text-foreground",
                isActive && "text-primary",
                isActive && h.level === 2 && "pl-3",
                isActive &&
                  "after:absolute after:-left-4 after:top-1/2 after:h-5 after:w-1 after:-translate-y-1/2 after:rounded-none after:bg-primary after:content-['']"
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
    </div>
  );

  return (
    <>
      <div
        ref={placeholderRef}
        aria-hidden
        className={cn(
          "hidden w-52 shrink-0 py-6 pl-6 lg:block",
          className
        )}
      />
      {rect != null && rect.inView && (
        <div
          ref={sidebarRef}
          className="fixed top-14 z-40 hidden h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] flex-col overflow-hidden py-6 pl-6 lg:flex"
          style={{
            left: rect.left,
            width: rect.width,
          }}
        >
          <aside
            className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3"
            aria-label="On this page"
          >
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
            <ScrollArea className="min-h-0 flex-1 overflow-hidden">
              {navContent}
            </ScrollArea>
          </aside>
        </div>
      )}
    </>
  );
}
