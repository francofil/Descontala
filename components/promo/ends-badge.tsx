import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EndsLabel } from "@/lib/format";

export function EndsBadge({ ends, className }: { ends: EndsLabel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        ends.urgent ? "font-semibold text-almagra" : "text-muted-foreground",
        className,
      )}
    >
      <Clock className="size-3.5" aria-hidden />
      {ends.text}
    </span>
  );
}
