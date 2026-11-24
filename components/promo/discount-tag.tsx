import { cn } from "@/lib/utils";
import type { Discount } from "@/lib/format";

/** La etiqueta de oferta: la pieza de marca. Albero, muesca de etiqueta y cifra grande. */
export function DiscountTag({
  discount,
  size = "md",
  className,
}: {
  discount: Discount;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tag-notch inline-flex flex-col justify-center bg-albero font-display leading-none text-albero-ink tabular",
        size === "sm" && "h-7 pr-4 pl-2 text-sm font-bold",
        size === "md" && "h-12 pr-5 pl-3 text-2xl font-extrabold",
        size === "lg" && "h-24 pr-9 pl-5 text-5xl font-extrabold",
        className,
      )}
    >
      {discount.big}
      {size === "lg" ? <span className="mt-1.5 font-sans text-sm font-semibold">{discount.caption}</span> : null}
    </span>
  );
}
