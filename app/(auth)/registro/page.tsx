import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-4xl font-bold">Crea tu cuenta.</h1>
        <p className="text-muted-foreground">Gratis. Guarda ofertas, recibe avisos antes de tu compra y canjea en caja.</p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  );
}
