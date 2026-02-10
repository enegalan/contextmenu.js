"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart?.trim() || !containerRef.current) return;
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    const normalized = chart.trim().replace(/\\n/g, "\n");
    mermaid
      .render(id, normalized)
      .then(({ svg: result }) => setSvg(result))
      .catch((err) => setError(String(err)));
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
        Mermaid error: {error}
      </div>
    );
  }

  if (!svg) {
    return <div ref={containerRef} className="my-4 min-h-[120px] rounded-lg border border-border bg-muted/30" />;
  }

  return (
    <div
      className="flex justify-center overflow-x-auto rounded-lg bg-muted/20"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
