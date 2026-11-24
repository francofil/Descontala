import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActiveCodes, PastCodes } from "@/components/consumer/codes-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCodes } from "@/lib/services/codes";

export const metadata: Metadata = { title: "Mis códigos" };

export default function CodesPage() {
  return (
    <section className="grid grid-cols-1 gap-6 pt-4">
      <h1 className="text-[2rem] leading-tight font-bold">Mis códigos</h1>
      <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
        <Codes />
      </Suspense>
    </section>
  );
}

async function Codes() {
  const { active, past } = await getMyCodes();
  return (
    <>
      {active.length ? (
        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">Para usar</h2>
          <ActiveCodes codes={active} />
        </div>
      ) : (
        <div className="grid justify-items-start gap-3 rounded-2xl border border-dashed p-6">
          <p className="font-medium">No tienes códigos activos.</p>
          <p className="text-sm text-muted-foreground">Abre una oferta y pulsa «Obtener código». Lo enseñas en caja y listo.</p>
          <Link href="/" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Ver ofertas</Link>
        </div>
      )}
      {past.length ? (
        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">Usados y caducados</h2>
          <PastCodes codes={past} />
        </div>
      ) : null}
    </>
  );
}
