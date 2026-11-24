import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { DiscountTag } from "@/components/promo/discount-tag";
import { EndsBadge } from "@/components/promo/ends-badge";
import { ChainName } from "@/components/promo/chain-name";
import { PromoActions } from "@/components/promo/promo-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { getPromotionDetail, recordPromotionView } from "@/lib/services/promotions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Oferta" };

export default function PromoPage({ params }: PageProps<"/promo/[id]">) {
  return (
    <>
      <Link href="/" className="-ml-2 inline-flex h-12 items-center gap-1.5 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Ofertas
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </>
  );
}

async function Detail({ params }: Pick<PageProps<"/promo/[id]">, "params">) {
  const { id } = await params;
  const promo = await getPromotionDetail(id);
  if (!promo) notFound();

  if (promo.state === "live") await recordPromotionView(promo.id);

  const stateNote =
    promo.state === "upcoming" ? promo.starts : promo.state === "ended" ? "Esta oferta ya terminó." : promo.state === "inactive" ? "Esta oferta no está activa." : null;

  return (
    <article className="grid grid-cols-1 gap-6 pt-2 pb-24">
      <div className="grid gap-4">
        <DiscountTag discount={promo.discount} size="lg" className="justify-self-start" />
        <div className="grid gap-2">
          <h1 className="text-3xl leading-tight font-bold">{promo.title}</h1>
          <div className="grid gap-0.5">
            <ChainName name={promo.chain.name} color={promo.chain.color} className="text-base" />
            {promo.chain.highlights ? <p className="pl-[1.125rem] text-sm text-muted-foreground">{promo.chain.highlights}</p> : null}
          </div>
        </div>
        {stateNote ? (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm font-medium">{stateNote}</p>
        ) : (
          <EndsBadge ends={promo.ends} className="text-base" />
        )}
      </div>

      <section className="grid gap-2 rounded-2xl border bg-hoja p-4">
        <h2 className="font-sans text-sm font-semibold">Condiciones</h2>
        <ul className="grid gap-1.5 text-[15px]">
          <li>{promo.conditions ?? "Sin condiciones adicionales."}</li>
          <li>{promo.ends.text}.</li>
          {promo.maxRedemptions ? <li>Limitada a {promo.maxRedemptions} canjes en total.</li> : null}
          <li>Un código por persona. Se canjea en caja, una sola vez.</li>
        </ul>
      </section>

      {promo.description ? <p className="text-[15px] leading-relaxed text-muted-foreground">{promo.description}</p> : null}

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">
          {promo.stores.length === 1 ? "Disponible en 1 tienda" : `Disponible en ${promo.stores.length} tiendas`}
        </h2>
        <ul className="divide-y rounded-2xl border bg-hoja">
          {promo.stores.map((s, i) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-sm text-muted-foreground">{s.address}</p>
              </div>
              <span className={cn("inline-flex shrink-0 items-center gap-1 text-sm tabular", i === 0 ? "font-semibold" : "text-muted-foreground")}>
                <MapPin className="size-3.5" aria-hidden />
                {s.distance}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {promo.isConsumer ? (
        <PromoActions
          promotionId={promo.id}
          title={promo.title}
          chainName={promo.chain.name}
          conditions={promo.conditions}
          canRedeem={promo.state === "live"}
          isLoggedIn={promo.isLoggedIn}
          initialSaved={promo.saved}
          initialCode={promo.code}
        />
      ) : null}
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 pt-2">
      <Skeleton className="h-24 w-48" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
