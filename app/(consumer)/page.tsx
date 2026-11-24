import { Suspense } from "react";
import { ConsumerHeader } from "@/components/consumer/consumer-header";
import { LocationSync } from "@/components/consumer/location-sync";
import { PromoExplorer } from "@/components/promo/promo-explorer";
import { Skeleton } from "@/components/ui/skeleton";
import { getNearbyPromotions } from "@/lib/services/promotions";
import { getPreShoppingBlock } from "@/lib/services/alerts";
import { PreShoppingBlock } from "@/components/consumer/pre-shopping";

export default function HomePage() {
  return (
    <>
      <ConsumerHeader />
      <section className="mt-6 grid gap-5">
        <h1 className="text-[2rem] leading-tight font-bold">Ofertas cerca de ti</h1>
        <Suspense fallback={<ExplorerSkeleton />}>
          <Explorer />
        </Suspense>
      </section>
    </>
  );
}

async function Explorer() {
  const { promos, categories, location } = await getNearbyPromotions();
  const preShopping = await getPreShoppingBlock(promos);
  return (
    <>
      <div className="-mt-3">
        <LocationSync precise={location.precise} />
      </div>
      {preShopping ? <PreShoppingBlock block={preShopping} /> : null}
      <PromoExplorer promos={promos} categories={categories} center={location} />
    </>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />)}
      </div>
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
    </div>
  );
}
