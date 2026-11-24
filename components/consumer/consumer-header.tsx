import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/services/session";

export function ConsumerHeader() {
  return (
    <header className="flex h-12 items-center justify-between">
      <Logo />
      <Suspense fallback={null}>
        <SessionArea />
      </Suspense>
    </header>
  );
}

async function SessionArea() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="rounded-full border bg-hoja px-3.5 py-1.5 text-sm font-medium">
        Entrar
      </Link>
    );
  }
  return <LogoutButton />;
}
