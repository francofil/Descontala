import { cn } from "@/lib/utils";

export function ChainName({ name, color, detail, className }: { name: string; color: string; detail?: string | null; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2 text-sm", className)}>
      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate font-medium">{name}</span>
      {detail ? <span className="truncate text-muted-foreground">{detail}</span> : null}
    </span>
  );
}
