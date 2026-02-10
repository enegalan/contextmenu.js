"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavSection } from "@/lib/docs-nav";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocSidebarProps {
  sections: NavSection[];
  className?: string;
}

export function DocSidebar({ sections, className }: DocSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border/40 py-6 pl-4 pr-2 md:block",
        className
      )}
    >
      <ScrollArea className="h-full">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
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
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
