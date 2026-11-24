import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertsForm } from "@/components/consumer/alerts-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getAlertSettings } from "@/lib/services/alerts";

export const metadata: Metadata = { title: "Avisos" };

export default function AlertsPage() {
  return (
    <section className="grid grid-cols-1 gap-6 pt-4">
      <div className="grid gap-2">
        <h1 className="text-[2rem] leading-tight font-bold">Avisos antes de tu compra</h1>
        <p className="text-muted-foreground">Dinos cuándo y qué compras. El día antes te enseñamos solo las ofertas que te interesan.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Settings />
      </Suspense>
    </section>
  );
}

async function Settings() {
  const { categories, products, initial } = await getAlertSettings();
  return <AlertsForm categories={categories} products={products} initial={initial} />;
}
