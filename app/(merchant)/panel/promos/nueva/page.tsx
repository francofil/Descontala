import type { Metadata } from "next";
import { Suspense } from "react";
import { PromoForm } from "@/components/merchant/promo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getPromotionFormData } from "@/lib/services/merchant-promotions";

export const metadata: Metadata = { title: "Nueva promoción" };

export default function NewPromoPage() {
  return (
    <section className="grid grid-cols-1 gap-6">
      <h1 className="text-3xl font-bold">Nueva promoción</h1>
      <Suspense fallback={<Skeleton className="h-[600px] rounded-2xl" />}>
        <Form />
      </Suspense>
    </section>
  );
}

async function Form() {
  const data = await getPromotionFormData();
  if (!data) return null;
  return <PromoForm productGroups={data.productGroups} stores={data.stores} today={data.today} initial={null} />;
}
