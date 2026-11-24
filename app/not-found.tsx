import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="mx-auto grid w-full max-w-md flex-1 content-center justify-items-start gap-4 px-5 py-16">
      <Logo />
      <h1 className="mt-6 text-3xl font-bold">Esta página no existe.</h1>
      <p className="text-muted-foreground">Puede que la oferta haya terminado o que el enlace esté mal.</p>
      <Link href="/" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
        Ver ofertas
      </Link>
    </main>
  );
}
