"use client";

import { CopyButton } from "./copy-button";
import { Mermaid } from "./mermaid";
import { cn } from "@/lib/utils";

function getCodeText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map(getCodeText).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    const el = children as React.ReactElement<{ children?: React.ReactNode; className?: string }>;
    return getCodeText(el.props.children);
  }
  return "";
}

function getCodeClassName(children: React.ReactNode): string {
  if (children && typeof children === "object" && "props" in children) {
    const el = children as React.ReactElement<{ className?: string }>;
    return (el.props?.className as string) ?? "";
  }
  return "";
}

export function CodeBlock({
  children,
  className,
  style,
  ...props
}: React.ComponentProps<"pre">) {
  const codeText = getCodeText(children);
  const codeClassName = getCodeClassName(children);
  const isMermaid = codeClassName.includes("language-mermaid");
  const isLightTheme = props["data-theme"] === "github-light";

  if (isMermaid) {
    return <Mermaid chart={codeText} />;
  }

  return (
    <div className="group relative my-4">
      <CopyButton text={codeText} className="opacity-0 group-hover:opacity-100" />
      <pre
        className={cn(
          "overflow-x-auto rounded-lg border border-border px-4 py-3 text-sm cm-code-block",
          className
        )}
        style={isLightTheme ? undefined : style}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
