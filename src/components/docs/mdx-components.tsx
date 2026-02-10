import React from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";
import { ApiTable } from "./api-table";
import { Mermaid } from "./mermaid";
import { ExampleRunner } from "@/components/examples/example-runner";
import { slugFromHeadingText } from "@/lib/mdx";
import { cn } from "@/lib/utils";

function getHeadingText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .flatMap((c) => (typeof c === "string" ? c : ""))
    .join("")
    .replace(/\{#[^}]+\}$/, "")
    .trim();
}

export const mdxComponents = {
  pre: (props: React.ComponentProps<"pre">) => <CodeBlock {...props} />,
  Callout,
  ApiTable,
  Mermaid,
  ExampleRunner,
  h2: (props: React.ComponentProps<"h2">) => {
    const { className, children, ...rest } = props;
    const id = slugFromHeadingText(getHeadingText(children));
    return (
      <h2
        id={id}
        className={cn(
          "group mt-10 scroll-mt-20 border-b border-border/60 pb-2 font-semibold flex items-center gap-2",
          className
        )}
        {...rest}
      >
        {children}
        <Link
          href={`#${id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
          aria-label={`Link to ${getHeadingText(children)}`}
        >
          <Link2 className="size-4" />
        </Link>
      </h2>
    );
  },
  h3: (props: React.ComponentProps<"h3">) => {
    const { className, children, ...rest } = props;
    const id = slugFromHeadingText(getHeadingText(children));
    return (
      <h3
        id={id}
        className={cn(
          "group mt-6 scroll-mt-20 font-semibold flex items-center gap-2",
          className
        )}
        {...rest}
      >
        {children}
        <Link
          href={`#${id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
          aria-label={`Link to ${getHeadingText(children)}`}
        >
          <Link2 className="size-4" />
        </Link>
      </h3>
    );
  },
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="border-l-4 border-border pl-4 italic text-muted-foreground my-4"
      {...props}
    />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[400px] text-sm" {...props} />
    </div>
  ),
  thead: (props: React.ComponentProps<"thead">) => (
    <thead className="border-b border-border bg-muted/50" {...props} />
  ),
  tbody: (props: React.ComponentProps<"tbody">) => <tbody {...props} />,
  tr: (props: React.ComponentProps<"tr">) => (
    <tr className="border-b border-border/60 last:border-0" {...props} />
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th className="px-4 py-3 text-left font-medium text-foreground" {...props} />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td className="px-4 py-2.5 text-muted-foreground" {...props} />
  ),
};
