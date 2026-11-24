"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/** Error inesperado: explica qué pasó y ofrece reintentar, sin detalles técnicos. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid w-full max-w-md flex-1 content-center justify-items-start gap-4 px-5 py-16">
      <Logo />
      <h1 className="mt-6 text-3xl font-bold">No se pudo cargar esta pantalla.</h1>
      <p className="text-muted-foreground">Puede ser la conexión o un fallo momentáneo del servidor. Vuelve a intentarlo en unos segundos.</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={reset} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Reintentar
        </button>
        <Link href="/" className="rounded-full border bg-hoja px-4 py-2.5 text-sm font-semibold">
          Ir al inicio
        </Link>
      </div>
      {error.digest ? <p className="text-xs text-muted-foreground">Referencia: {error.digest}</p> : null}
    </main>
  );
}
