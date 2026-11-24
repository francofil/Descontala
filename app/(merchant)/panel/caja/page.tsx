import type { Metadata } from "next";
import { Suspense } from "react";
import { Cashier } from "@/components/merchant/cashier";
import { Skeleton } from "@/components/ui/skeleton";
import { getCashierContext } from "@/lib/services/redeem";

export const metadata: Metadata = { title: "Caja" };

export default function CajaPage() {
  return (
    <section className="grid grid-cols-1 gap-6">
      <h1 className="mx-auto w-full max-w-md text-3xl font-bold">Caja</h1>
      <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-md rounded-2xl" />}>
        <CashierLoader />
      </Suspense>
    </section>
  );
}

async function CashierLoader() {
  const { stores, currentStoreId } = await getCashierContext();
  return <Cashier stores={stores.map((s) => ({ id: s.id, name: s.name }))} initialStoreId={currentStoreId} />;
}
