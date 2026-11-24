import type { Metadata } from "next";

export const metadata: Metadata = { title: "Avisos" };

// La configuración de avisos llega en la Fase 4.
export default function AlertsPage() {
  return (
    <section className="grid gap-3 pt-4">
      <h1 className="text-[2rem] leading-tight font-bold">Avisos antes de tu compra</h1>
      <p className="text-muted-foreground">Elige tu día de compra y lo que sueles comprar. Disponible en la próxima fase.</p>
    </section>
  );
}
