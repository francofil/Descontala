import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/services/session";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pt-8">
      <header className="flex items-center justify-between">
        <Logo href="/admin" />
        <LogoutButton />
      </header>
      <Suspense fallback={<Skeleton className="mt-12 h-10 w-64" />}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await requireRole("admin");
  return (
    <section className="mt-12 grid gap-2">
      <h1 className="text-3xl font-bold">Administración</h1>
      <p className="text-muted-foreground">Sesión de {user.displayName}. Gestión de cadenas y usuarios merchant en la Fase 5.</p>
    </section>
  );
}
