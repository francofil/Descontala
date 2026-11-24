import Link from "next/link";
import { cn } from "@/lib/utils";

/** Marca: la etiqueta de oferta en albero + el nombre. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight", className)}>
      <span aria-hidden className="tag-notch grid h-7 w-9 place-items-center bg-albero pr-1.5 text-sm font-extrabold text-albero-ink">
        %
      </span>
      Descontala
    </Link>
  );
}
