import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireMerchant } from "@/lib/services/session";

export const metadata: Metadata = { title: "Panel" };

// Fase 1: panel provisional. Dashboard real en la Fase 4.
export default function PanelPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pt-8">
      <header className="flex items-center justify-between">
        <Logo href="/panel" />
        <LogoutButton />
      </header>
      <Suspense fallback={<Skeleton className="mt-12 h-10 w-64" />}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await requireMerchant();
  return (
    <section className="mt-12 grid gap-2">
      <h1 className="text-3xl font-bold">{user.chainName}</h1>
      <p className="text-muted-foreground">Panel del supermercado. Promos, caja y resultados llegan en las Fases 3 y 4.</p>
    </section>
  );
}
