"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className="transition-all duration-200 ease-out border border-transparent hover:backdrop-blur-sm hover:scale-105"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-[transform,opacity] duration-200 ease-out dark:rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-[transform,opacity] duration-200 ease-out dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
