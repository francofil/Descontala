import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PromoForm } from "@/components/merchant/promo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getPromotionFormData } from "@/lib/services/merchant-promotions";
import { promoIdSchema } from "@/lib/validation/promotions";

export const metadata: Metadata = { title: "Editar promoción" };

export default function EditPromoPage({ params }: PageProps<"/panel/promos/[id]/editar">) {
  return (
    <section className="grid grid-cols-1 gap-6">
      <h1 className="text-3xl font-bold">Editar promoción</h1>
      <Suspense fallback={<Skeleton className="h-[600px] rounded-2xl" />}>
        <Form params={params} />
      </Suspense>
    </section>
  );
}

async function Form({ params }: Pick<PageProps<"/panel/promos/[id]/editar">, "params">) {
  const { id } = await params;
  if (!promoIdSchema.safeParse(id).success) notFound();
  const data = await getPromotionFormData(id);
  if (!data?.initial) notFound();
  return <PromoForm productGroups={data.productGroups} stores={data.stores} today={data.today} initial={data.initial} />;
}
