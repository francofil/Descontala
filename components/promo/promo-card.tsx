import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PromoCardData } from "@/lib/services/promotions";
import { DiscountTag } from "./discount-tag";
import { EndsBadge } from "./ends-badge";
import { ChainName } from "./chain-name";

export function PromoCard({ promo }: { promo: PromoCardData }) {
  return (
    <Link
      href={`/promo/${promo.id}`}
      className="group block rounded-2xl border bg-hoja p-4 transition-transform duration-150 active:scale-[0.985] focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <DiscountTag discount={promo.discount} />
        <span className="inline-flex items-center gap-1 pt-1 text-sm text-muted-foreground tabular">
          <MapPin className="size-3.5" aria-hidden />
          {promo.distance}
        </span>
      </div>
      <h3 className="mt-3 text-lg leading-snug font-semibold">{promo.title}</h3>
      <ChainName
        className="mt-1"
        name={promo.chain.name}
        color={promo.chain.color}
        detail={promo.storeCount > 1 ? `${promo.store.neighborhood} y ${promo.storeCount - 1} más` : promo.store.neighborhood}
      />
      {promo.conditions ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{promo.conditions}</p> : null}
      <EndsBadge ends={promo.ends} className="mt-3" />
    </Link>
  );
}
