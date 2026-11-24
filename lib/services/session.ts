import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findProfileById } from "@/lib/repositories/profiles";
import { homeForRole, type Role } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
  displayName: string;
  chainId: string | null;
  chainName: string | null;
};

/** Usuario actual (o null). Memoizado por petición. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // La validación del JWT usa la hora actual: siempre en tiempo de petición.
  await connection();
  const db = await createClient();
  const { data } = await db.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const profile = await findProfileById(db, claims.sub);
  if (!profile) return null;

  return {
    id: profile.id,
    email: (claims.email as string | undefined) ?? null,
    role: profile.role,
    displayName: profile.display_name ?? "Tú",
    chainId: profile.chain_id,
    chainName: profile.chains?.name ?? null,
  };
});

/** Exige sesión con uno de los roles dados; si no, redirige. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

/** Para merchants: devuelve el usuario con su cadena garantizada. */
export async function requireMerchant() {
  const user = await requireRole("merchant");
  if (!user.chainId) redirect("/login");
  return user as CurrentUser & { chainId: string };
}
