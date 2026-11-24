import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { CountUp } from "@/components/merchant/count-up";
import { DailyChart } from "@/components/merchant/daily-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_DAYS, getDashboard } from "@/lib/services/metrics";

export const metadata: Metadata = { title: "Resultados" };

export default function PanelPage() {
  return (
    <section className="grid grid-cols-1 gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Resultados</h1>
          <p className="text-muted-foreground">Últimos {DASHBOARD_DAYS} días</p>
        </div>
        <Link href="/panel/promos/nueva" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground active:scale-95">
          Publicar promoción
        </Link>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </section>
  );
}

async function Dashboard() {
  const { series, totals, topPromos } = await getDashboard();
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground sm:col-span-1">
          <p className="text-sm opacity-75">Clientes nuevos</p>
          <p className="mt-1 font-display text-5xl font-extrabold tabular"><CountUp value={totals.newCustomers} /></p>
          <p className="mt-2 text-sm opacity-75">
            {totals.newShare} % de los canjes fueron su primera compra con descuento en tu cadena.
          </p>
        </div>
        <Tile label="Canjes en caja" value={<CountUp value={totals.redemptions} />} note={`${totals.codes} códigos generados y ${new Intl.NumberFormat("es-ES").format(totals.views)} vistas.`} />
        <Tile
          label="Coste estimado"
          value={totals.cost}
          note={totals.costPerNew ? `${totals.fee} por canje. ${totals.costPerNew} por cliente nuevo.` : `${totals.fee} por canje.`}
        />
      </div>

      <div className="rounded-2xl border bg-hoja p-5">
        <DailyChart data={series} />
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Las promos que más clientes nuevos traen</h2>
        {topPromos.length ? (
          <ol className="divide-y rounded-2xl border bg-hoja">
            {topPromos.map((p, i) => (
              <li key={p.id}>
                <Link href={`/panel/promos/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50">
                  <span className="w-5 font-display text-lg font-bold text-muted-foreground tabular">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                  <span className="shrink-0 text-right text-sm tabular">
                    <span className="font-semibold text-bien">{p.newCustomers} nuevos</span>
                    <span className="text-muted-foreground"> de {p.redemptions}</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-muted-foreground">Cuando tus clientes canjeen códigos, aquí verás qué promociones atraen gente nueva.</p>
        )}
      </section>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: React.ReactNode; note: string }) {
  return (
    <div className="rounded-2xl border bg-hoja p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-5xl font-extrabold tabular">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
