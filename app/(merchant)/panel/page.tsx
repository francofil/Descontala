import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Resultados" };

// El dashboard con KPIs y gráfico llega en la Fase 4.
export default function PanelPage() {
  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-bold">Resultados</h1>
      <p className="text-muted-foreground">Canjes, clientes nuevos y coste estimado llegan en la siguiente fase.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/panel/promos/nueva" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Publicar una promoción</Link>
        <Link href="/panel/caja" className="rounded-full border bg-hoja px-4 py-2.5 text-sm font-semibold">Abrir la caja</Link>
      </div>
    </section>
  );
}
