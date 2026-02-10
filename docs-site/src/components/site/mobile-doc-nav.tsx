"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { type NavSection } from "@/lib/docs-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MobileDocNavProps {
  sections: NavSection[];
}

export function MobileDocNav({ sections }: MobileDocNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <nav className="space-y-6 p-4">
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
                          onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
}
