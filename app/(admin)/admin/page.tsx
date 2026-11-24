import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { CreateMerchantForm } from "@/components/admin/create-merchant-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview } from "@/lib/services/admin";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-16">
      <header className="flex h-14 items-center justify-between">
        <Logo href="/admin" />
        <LogoutButton />
      </header>
      <h1 className="mt-6 text-3xl font-bold">Administración</h1>
      <Suspense fallback={<Skeleton className="mt-6 h-96 rounded-2xl" />}>
        <Overview />
      </Suspense>
    </main>
  );
}

async function Overview() {
  const chains = await getAdminOverview();
  const fmt = new Intl.NumberFormat("es-ES");
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Cadenas ({chains.length})</h2>
        <ul className="grid gap-3">
          {chains.map((c) => (
            <li key={c.id} className="rounded-2xl border bg-hoja p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </p>
                  {c.highlights ? <p className="text-sm text-muted-foreground">{c.highlights}</p> : null}
                </div>
                <p className="shrink-0 text-right text-sm tabular">
                  <span className="font-display text-xl font-bold">{fmt.format(c.newCustomers)}</span>
                  <span className="block text-xs text-muted-foreground">clientes nuevos</span>
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground tabular">
                {c.stores} tiendas, {c.promotions} promociones, {fmt.format(c.redemptions)} canjes.
              </p>
              {c.merchants.length ? (
                <p className="mt-1 truncate text-sm">
                  Acceso: {c.merchants.map((m) => m.email).join(", ")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-almagra">Sin usuario de supermercado.</p>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-4 rounded-2xl border bg-hoja p-5 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold">Dar de alta un supermercado</h2>
        <CreateMerchantForm chains={chains.map((c) => ({ id: c.id, name: c.name }))} />
      </section>
    </div>
  );
}
