import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/services/session";

// Fase 1: inicio provisional. En la Fase 2 aquí van las promos cercanas.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pt-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Suspense fallback={<Skeleton className="h-8 w-20" />}>
          <SessionArea />
        </Suspense>
      </header>
      <section className="mt-12 grid gap-2">
        <h1 className="text-3xl font-bold">Ofertas cerca de ti</h1>
        <p className="text-muted-foreground">Fase 1 lista: sesión y roles funcionando. Las promos llegan en la Fase 2.</p>
      </section>
    </main>
  );
}

async function SessionArea() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium underline underline-offset-4">
        Entrar
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Hola, {user.displayName}</span>
      <LogoutButton />
    </div>
  );
}
