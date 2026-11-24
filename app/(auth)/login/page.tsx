import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const showDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-4xl font-bold">Entra y descuéntala.</h1>
        <p className="text-muted-foreground">Las ofertas de los súper de tu barrio, con la fecha de fin a la vista.</p>
      </div>
      <Suspense fallback={<LoginForm showDemo={showDemo} />}>
        <LoginFormWithNext searchParams={searchParams} />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-foreground underline underline-offset-4">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}

async function LoginFormWithNext({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} showDemo={showDemo} />;
}
