import Link from "next/link";
import { BellRing } from "lucide-react";
import type { PreShopping } from "@/lib/services/alerts";
import { DiscountTag } from "@/components/promo/discount-tag";
import { cn } from "@/lib/utils";

/** El aviso: el bloque más destacado del inicio cuando toca hacer la compra. */
export function PreShoppingBlock({ block }: { block: PreShopping }) {
  return (
    <section aria-labelledby="pre-shopping" className="-mx-1 rounded-3xl bg-albero/25 p-4 dark:bg-albero/15">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-albero text-albero-ink">
          <BellRing className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 id="pre-shopping" className="text-xl font-bold">{block.title}</h2>
          <p className="text-sm text-muted-foreground">{block.subtitle}</p>
        </div>
      </div>
      {block.promos.length ? (
        <ul className="mt-4 grid gap-2">
          {block.promos.map((p) => (
            <li key={p.id}>
              <Link href={`/promo/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-hoja p-2.5 pr-3.5 transition-transform active:scale-[0.985]">
                <DiscountTag discount={p.discount} size="sm" className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{p.chain.name}, {p.distance}</span>
                </span>
                <span className={cn("shrink-0 text-xs", p.ends.urgent ? "font-semibold text-almagra" : "text-muted-foreground")}>
                  {p.ends.urgent ? p.ends.text.replace(/ a las.*/, "") : p.ends.text.replace("Válida hasta el ", "Hasta el ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
