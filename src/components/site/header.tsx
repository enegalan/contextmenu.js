"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { DocSearchModal, useDocSearchKeyboardEvents } from "@docsearch/react";
import "@docsearch/css";
import { ThemeToggle } from "./theme-toggle";
import { MobileDocNav } from "./mobile-doc-nav";
import { docsNavSections, examplesNavItems } from "@/lib/docs-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Docs", href: "/docs/introduction" },
  { label: "Examples", href: "/examples/basic-menu" },
  { label: "Playground", href: "/playground" },
];

const GITHUB_URL = "https://github.com/enegalan/contextmenu.js";

const examplesSection = { title: "Examples", items: examplesNavItems };
const allDocSections = [...docsNavSections, examplesSection];

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "";
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY ?? "";
const algoliaIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "";
const hasAlgoliaCredentials =
  !!algoliaAppId && !!algoliaApiKey && !!algoliaIndexName;

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialScrollY, setInitialScrollY] = useState(0);
  const showDocNav =
    pathname.startsWith("/docs") || pathname.startsWith("/examples");

  useDocSearchKeyboardEvents({
    isOpen: searchOpen,
    onOpen: () => {
      if (hasAlgoliaCredentials) {
        setInitialScrollY(typeof window !== "undefined" ? window.scrollY : 0);
        setSearchOpen(true);
      }
    },
    onClose: () => setSearchOpen(false),
    isAskAiActive: false,
    onAskAiToggle: () => {},
  });

  const openSearch = () => {
    if (hasAlgoliaCredentials) {
      setInitialScrollY(typeof window !== "undefined" ? window.scrollY : 0);
      setSearchOpen(true);
    }
  };

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
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
          {hasAlgoliaCredentials && (
            <Button
              variant="ghost"
              size="icon"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              className="transition-all duration-150 border border-transparent hover:backdrop-blur-sm hover:scale-105"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
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
      {hasAlgoliaCredentials &&
        searchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <DocSearchModal
            appId={algoliaAppId}
            apiKey={algoliaApiKey}
            indexName={algoliaIndexName}
            onClose={() => setSearchOpen(false)}
            initialScrollY={initialScrollY}
            onAskAiToggle={() => {}}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            placeholder="Search docs..."
          />,
          document.body
        )}
    </header>
  );
}
