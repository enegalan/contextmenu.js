"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavSection } from "@/lib/docs-nav";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const SIDEBAR_STORAGE_KEY = "doc-sidebar-sections";

function getStoredCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}

function setStoredCollapsed(value: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

interface DocSidebarProps {
  sections: NavSection[];
  className?: string;
}

export function DocSidebar({ sections, className }: DocSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(getStoredCollapsed());
  }, []);

  const toggleSection = useCallback((title: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      setStoredCollapsed(next);
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 min-h-0 shrink-0 border-r border-border/40 py-6 pl-4 pr-2 md:block",
        className
      )}
    >
      <ScrollArea className="h-full min-h-0">
        <nav className="space-y-6">
          {sections.map((section) => {
            const isCollapsed = collapsed[section.title];
            return (
              <div key={section.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "mb-2 flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    "hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                  )}
                  aria-expanded={!isCollapsed}
                >
                  {section.title}
                </button>
                {!isCollapsed && (
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "block rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
                              isActive
                                ? "bg-accent font-medium text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
