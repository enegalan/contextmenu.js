"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard errors (e.g. secure context required)
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn(
        "absolute right-2 top-2 h-8 w-8 transition-opacity duration-150",
        className
      )}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
