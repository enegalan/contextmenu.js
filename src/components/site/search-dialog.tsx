"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SearchEntry } from "@/lib/search-index";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [index, setIndex] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/search-index")
      .then((res) => res.json())
      .then((data: SearchEntry[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, []);

  const fuse = new Fuse(index, { keys: ["title"], threshold: 0.3 });
  const results = query.trim()
    ? fuse.search(query).map((r) => r.item)
    : index;
  const slice = results.slice(0, 8);

  const handleSelect = useCallback(
    (entry: SearchEntry) => {
      router.push(entry.href);
      onClose();
      setQuery("");
      setSelected(0);
    },
    [router, onClose]
  );

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s < slice.length - 1 ? s + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s > 0 ? s - 1 : slice.length - 1));
        return;
      }
      if (e.key === "Enter" && slice[selected]) {
        e.preventDefault();
        handleSelect(slice[selected]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selected, slice, handleSelect, onClose]);

  if (!open || typeof document === "undefined") return null;

  const overlay = (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-black/50 pt-[15vh] px-4 backdrop-blur-sm"
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs..."
            className="min-h-9 flex-1 border-0 bg-transparent shadow-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent dark:placeholder:text-zinc-500"
            autoFocus
          />
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-2">
          {slice.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No results
            </li>
          ) : (
            slice.map((entry, i) => (
              <li key={entry.href}>
                <button
                  type="button"
                  onClick={() => handleSelect(entry)}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                    i === selected
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="truncate">{entry.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {entry.section}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
