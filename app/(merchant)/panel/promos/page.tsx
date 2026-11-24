import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { DiscountTag } from "@/components/promo/discount-tag";
import { PromoRowActions } from "@/components/merchant/promo-row-actions";
import { SavedToast } from "@/components/merchant/saved-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyPromotions, type PromoState } from "@/lib/services/merchant-promotions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Promociones" };

const STATE_STYLE: Record<PromoState, string> = {
  live: "bg-[#2f7d55]/12 text-[#2f7d55] dark:text-[#5fbf8a]",
  upcoming: "bg-muted text-foreground",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-albero/20 text-albero-ink dark:text-albero",
  ended: "bg-muted text-muted-foreground",
};

export default function PromosPage({ searchParams }: PageProps<"/panel/promos">) {
  return (
    <section className="grid grid-cols-1 gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Promociones</h1>
        <Link href="/panel/promos/nueva" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground active:scale-95">
          <Plus className="size-4" aria-hidden />
          Nueva
        </Link>
      </div>
      <Suspense fallback={<div className="grid gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>}>
        <List searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function List({ searchParams }: Pick<PageProps<"/panel/promos">, "searchParams">) {
  const [{ guardada }, promos] = await Promise.all([searchParams, listMyPromotions()]);

  if (promos.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed p-8">
        <p className="text-lg font-semibold">Aún no has publicado ninguna promoción.</p>
        <p className="text-muted-foreground">Sin imprenta ni buzoneo: en dos minutos la ven los vecinos de tus tiendas.</p>
        <Link href="/panel/promos/nueva" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Publicar la primera</Link>
      </div>
    );
  }

  return (
    <>
      <SavedToast show={typeof guardada === "string"} />
      <ul className="grid gap-3">
        {promos.map((p) => (
          <li key={p.id} className={cn("flex items-center gap-4 rounded-2xl border bg-hoja p-4", p.state === "ended" && "opacity-70")}>
            <DiscountTag discount={p.discount} size="sm" className="hidden shrink-0 sm:inline-flex" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATE_STYLE[p.state])}>{p.stateLabel}</span>
                <span className={cn("text-sm", typeof p.when !== "string" && p.when.urgent ? "font-semibold text-almagra" : "text-muted-foreground")}>
                  {typeof p.when === "string" ? p.when : p.when.text}
                </span>
              </div>
              <p className="mt-1 truncate font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.storesLabel}</p>
            </div>
            <dl className="hidden shrink-0 grid-cols-3 gap-5 text-right md:grid">
              <Stat label="Vistas" value={p.views} />
              <Stat label="Canjes" value={p.redemptions} />
              <Stat label="Clientes nuevos" value={p.newCustomers} strong />
            </dl>
            <div className="shrink-0 text-right md:hidden">
              <p className="font-display text-xl font-bold tabular">{p.redemptions}</p>
              <p className="text-xs text-muted-foreground">canjes</p>
            </div>
            <PromoRowActions id={p.id} state={p.state} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <dd className={cn("font-display text-xl font-bold tabular", strong && "text-[#2f7d55] dark:text-[#5fbf8a]")}>{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}
