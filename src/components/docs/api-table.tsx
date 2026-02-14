import { cn } from "@/lib/utils";

interface ApiTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  className?: string;
}

export function ApiTable({ headers, rows, className }: ApiTableProps) {
  const headerList = headers ?? [];
  const rowList = rows ?? [];
  if (headerList.length === 0 && rowList.length === 0) return null;
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headerList.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-left font-medium text-foreground",
                  i === 0 && "w-[20%]"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowList.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {(Array.isArray(row) ? row : []).map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-4 py-2.5 text-muted-foreground",
                    j === 0 && "font-mono text-foreground"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
