import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { SearchInput } from "@/components/consumer/search-input";
import { DiscountTag } from "@/components/promo/discount-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { searchProducts, type ProductResult } from "@/lib/services/search";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buscar producto" };

const VISIBLE = 5;
const SUGGESTIONS = ["Aceite de oliva", "Huevos", "Leche", "Pollo", "Café", "Cerveza"];

export default function SearchPage({ searchParams }: PageProps<"/buscar">) {
  return (
    <section className="grid grid-cols-1 gap-5 pt-4">
      <h1 className="text-[2rem] leading-tight font-bold">¿Dónde está más barato?</h1>
      <Suspense fallback={<SearchInput initial="" />}>
        <InputWithQuery searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function readQuery(searchParams: PageProps<"/buscar">["searchParams"]) {
  const { q } = await searchParams;
  return typeof q === "string" ? q : "";
}

async function InputWithQuery({ searchParams }: Pick<PageProps<"/buscar">, "searchParams">) {
  return <SearchInput initial={await readQuery(searchParams)} />;
}

async function Results({ searchParams }: Pick<PageProps<"/buscar">, "searchParams">) {
  const q = await readQuery(searchParams);

  if (q.trim().length < 2) {
    return (
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Link key={s} href={`/buscar?q=${encodeURIComponent(s)}`} replace className="rounded-full border bg-hoja px-3.5 py-2 text-sm font-medium active:scale-95">
            {s}
          </Link>
        ))}
      </div>
    );
  }

  const products = await searchProducts(q);
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed px-6 py-10 text-center">
        <p className="font-medium">No encontramos «{q}» en los súper cercanos.</p>
        <p className="mt-1 text-sm text-muted-foreground">Prueba con otra palabra, por ejemplo «arroz» o «yogur».</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {products.map((p) => (
        <section key={p.id} className="grid grid-cols-1 gap-3">
          <div>
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="text-sm text-muted-foreground">
              {p.brand ?? "Granel"}. {p.offers.length} {p.offers.length === 1 ? "tienda" : "tiendas"} cerca, ordenadas por precio con oferta.
            </p>
          </div>
          <ol className="divide-y rounded-2xl border bg-hoja">
            {p.offers.slice(0, VISIBLE).map((o) => <OfferRow key={o.storeId} o={o} />)}
          </ol>
          {p.offers.length > VISIBLE ? (
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground underline underline-offset-4 group-open:mb-3">
                Ver las otras {p.offers.length - VISIBLE} tiendas
              </summary>
              <ol className="divide-y rounded-2xl border bg-hoja">
                {p.offers.slice(VISIBLE).map((o) => <OfferRow key={o.storeId} o={o} />)}
              </ol>
            </details>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function OfferRow({ o }: { o: ProductResult["offers"][number] }) {
  return (
    <li className={cn("grid grid-cols-1 gap-2 px-4 py-3", o.cheapest && "bg-albero/10")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate font-medium">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: o.chainColor }} />
            <span className="truncate">{o.storeName}</span>
          </p>
          <p className="text-sm text-muted-foreground tabular">{o.distance}</p>
        </div>
        <div className="shrink-0 text-right">
          {o.regularPrice ? <p className="text-xs text-muted-foreground line-through tabular">{o.regularPrice}</p> : null}
          <p className="font-display text-xl font-bold tabular">
            {o.price}
            <span className="text-sm font-medium text-muted-foreground">{o.unit}</span>
          </p>
          {o.priceNote ? <p className="text-xs text-muted-foreground">{o.priceNote}</p> : null}
          {o.cheapest ? <p className="text-xs font-semibold">Más barato</p> : null}
        </div>
      </div>
      {o.promo ? (
        <Link href={`/promo/${o.promo.id}`} className="flex items-center gap-2.5 rounded-xl border bg-background px-2.5 py-2 text-sm">
          <DiscountTag discount={{ big: o.promo.badge, caption: "" }} size="sm" />
          <span className={cn("min-w-0 flex-1 truncate", o.promo.urgent ? "font-semibold text-almagra" : "text-muted-foreground")}>{o.promo.ends}</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ) : null}
    </li>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
