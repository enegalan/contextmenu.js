"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { MobileDocNav } from "./mobile-doc-nav";
import { docsNavSections, examplesNavItems } from "@/lib/docs-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Docs", href: "/docs/introduction" },
  { label: "Examples", href: "/examples/basic-menu" },
];

const GITHUB_URL = "https://github.com/egalan/contextmenu.js";

const examplesSection = { title: "Examples", items: examplesNavItems };
const allDocSections = [...docsNavSections, examplesSection];

export function Header() {
  const pathname = usePathname();
  const showDocNav =
    pathname.startsWith("/docs") || pathname.startsWith("/examples");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-200">
      <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          {showDocNav && <MobileDocNav sections={allDocSections} />}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground no-underline transition-opacity hover:opacity-80"
          >
            <span className="text-lg">contextmenu.js</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1">
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "transition-all duration-150 border border-transparent hover:backdrop-blur-sm",
                  pathname.startsWith(item.href.split("/")[1])
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="transition-all duration-150 border border-transparent hover:backdrop-blur-sm hover:scale-105"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
