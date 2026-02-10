import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/30 to-background px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          contextmenu.js
        </h1>
        <p className="mt-4 text-lg text-muted-foreground md:text-xl">
          A smooth, customizable context-menu library. TypeScript-first, framework-agnostic,
          with keyboard and screen-reader support.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="transition-all duration-200 hover:scale-[1.02]">
            <Link href="/docs/introduction">View docs</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="transition-all duration-200 hover:scale-[1.02]">
            <Link href="/examples/basic-menu">Try examples</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
