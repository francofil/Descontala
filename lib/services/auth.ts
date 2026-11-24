import "server-only";
import { createClient } from "@/lib/supabase/server";
import { findProfileById } from "@/lib/repositories/profiles";
import { homeForRole } from "@/lib/roles";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

export type AuthResult = { ok: true; redirectTo: string } | { ok: false; message: string };

export async function signIn(input: LoginInput): Promise<AuthResult> {
  const db = await createClient();
  const { data, error } = await db.auth.signInWithPassword({ email: input.email, password: input.password });
  if (error || !data.user) {
    return { ok: false, message: "Email o contraseña incorrectos." };
  }
  const profile = await findProfileById(db, data.user.id);
  const role = profile?.role ?? "consumer";
  const home = homeForRole(role);
  // Solo respetamos "next" si pertenece a la zona del rol.
  const redirectTo = input.next && (role !== "consumer" ? input.next.startsWith(home) : !input.next.startsWith("/panel") && !input.next.startsWith("/admin"))
    ? input.next
    : home;
  return { ok: true, redirectTo };
}

export async function signUp(input: RegisterInput): Promise<AuthResult> {
  const db = await createClient();
  const { data, error } = await db.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { display_name: input.displayName } },
  });
  if (error) {
    const taken = error.code === "user_already_exists" || /registered/i.test(error.message);
    return { ok: false, message: taken ? "Ya hay una cuenta con ese email. Entra con tu contraseña." : "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }
  if (!data.session) {
    return { ok: false, message: "Te hemos enviado un email para confirmar la cuenta." };
  }
  return { ok: true, redirectTo: "/" };
}

export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
}
