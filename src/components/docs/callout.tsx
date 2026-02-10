import { cn } from "@/lib/utils";
import { AlertCircle, Info, Lightbulb, AlertTriangle } from "lucide-react";

const variants = {
  note: {
    icon: Info,
    className: "border-border bg-muted/50 text-foreground",
  },
  tip: {
    icon: Lightbulb,
    className: "border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-200",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  danger: {
    icon: AlertCircle,
    className: "border-red-500/50 bg-red-500/10 text-red-800 dark:text-red-200",
  },
};

export function Callout({
  type = "note",
  title,
  children,
  className,
}: {
  type?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const config = variants[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-4 flex gap-3 rounded-lg border px-4 py-3",
        config.className,
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm [&>p]:m-0">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
