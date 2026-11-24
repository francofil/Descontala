import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { DiscountTag } from "@/components/promo/discount-tag";
import { Funnel } from "@/components/merchant/funnel";
import { Skeleton } from "@/components/ui/skeleton";
import { getPromotionFunnel } from "@/lib/services/metrics";
import { promoIdSchema } from "@/lib/validation/promotions";

export const metadata: Metadata = { title: "Resultados de la promoción" };

export default function PromoResultsPage({ params }: PageProps<"/panel/promos/[id]">) {
  return (
    <section className="grid grid-cols-1 gap-6">
      <Link href="/panel/promos" className="-ml-2 inline-flex w-fit items-center gap-1.5 px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Promociones
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Results params={params} />
      </Suspense>
    </section>
  );
}

async function Results({ params }: Pick<PageProps<"/panel/promos/[id]">, "params">) {
  const { id } = await params;
  if (!promoIdSchema.safeParse(id).success) notFound();
  const p = await getPromotionFunnel(id);
  if (!p) notFound();

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-3">
          <DiscountTag discount={p.discount} className="justify-self-start" />
          <h1 className="text-3xl font-bold">{p.title}</h1>
          <p className="text-muted-foreground">
            {p.stateLabel}. {p.when}. {p.period}. {p.storesLabel}.
          </p>
        </div>
        {p.state !== "ended" ? (
          <Link href={`/panel/promos/${p.id}/editar`} className="inline-flex items-center gap-1.5 rounded-full border bg-hoja px-4 py-2 text-sm font-medium">
            <Pencil className="size-4" aria-hidden /> Editar
          </Link>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border bg-hoja p-5">
          <h2 className="mb-4 text-lg font-semibold">Del escaparate a la caja</h2>
          <Funnel steps={p.steps} />
        </section>
        <aside className="grid content-start gap-3">
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm opacity-75">Clientes nuevos</p>
            <p className="font-display text-5xl font-extrabold tabular">{p.steps[4].value}</p>
            <p className="mt-1 text-sm opacity-75">{p.newShare} % de los canjes. Su primera compra con descuento en tu cadena fue esta promo.</p>
          </div>
          <div className="rounded-2xl border bg-hoja p-5">
            <p className="text-sm text-muted-foreground">Coste estimado</p>
            <p className="font-display text-4xl font-extrabold tabular">{p.cost}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.fee} por canje{p.costPerNew ? `. ${p.costPerNew} por cliente nuevo` : ""}. Solo pagas lo que se canjea.
            </p>
          </div>
          <div className="rounded-2xl border bg-hoja p-5 text-sm">
            <p><span className="font-semibold tabular">{p.redemptionRate} %</span> de los códigos generados acabaron en caja.</p>
            {p.maxRedemptions ? <p className="mt-1 text-muted-foreground">Límite: {p.maxRedemptions} canjes.</p> : null}
            {p.conditions ? <p className="mt-1 text-muted-foreground">Condiciones: {p.conditions}</p> : null}
          </div>
        </aside>
      </div>
    </>
  );
}
