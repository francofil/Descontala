import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllPromotionStats, listChainsWithCounts, listMerchantProfiles } from "@/lib/repositories/admin";
import type { CreateMerchantInput } from "@/lib/validation/admin";
import { requireRole } from "./session";

const CHAIN_COLORS = ["#15803d", "#b91c1c", "#b45309", "#1d4ed8", "#7e22ce", "#0f766e"];

export async function getAdminOverview() {
  await requireRole("admin");
  const db = await createClient();
  const admin = createAdminClient();
  const [chains, stats, merchants, users] = await Promise.all([
    listChainsWithCounts(db),
    listAllPromotionStats(db),
    listMerchantProfiles(db),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);
  const emails = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return chains.map((c) => {
    const s = stats.filter((x) => x.chain_id === c.id);
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      highlights: c.highlights,
      stores: c.stores[0]?.count ?? 0,
      promotions: c.promotions[0]?.count ?? 0,
      redemptions: s.reduce((a, x) => a + Number(x.redemptions ?? 0), 0),
      newCustomers: s.reduce((a, x) => a + Number(x.new_customers ?? 0), 0),
      merchants: merchants.filter((m) => m.chain_id === c.id).map((m) => ({ name: m.display_name, email: emails.get(m.id) ?? "" })),
    };
  });
}

export type CreateMerchantResult = { ok: true; email: string } | { ok: false; message: string };

/** Crea el usuario merchant (y la cadena si es nueva). Usa la clave secreta: solo tras comprobar que es admin. */
export async function createMerchant(input: CreateMerchantInput): Promise<CreateMerchantResult> {
  await requireRole("admin");
  const admin = createAdminClient();

  let chainId = input.chainId;
  let createdChain = false;
  if (!chainId && input.newChainName) {
    const { count } = await admin.from("chains").select("id", { count: "exact", head: true });
    const { data, error } = await admin
      .from("chains")
      .insert({ name: input.newChainName, color: CHAIN_COLORS[(count ?? 0) % CHAIN_COLORS.length] })
      .select("id")
      .single();
    if (error) return { ok: false, message: error.code === "23505" ? "Ya existe una cadena con ese nombre." : "No se pudo crear la cadena." };
    chainId = data.id;
    createdChain = true;
    await admin.from("merchant_settings").insert({ chain_id: chainId });
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });
  if (error || !created.user) {
    if (createdChain) await admin.from("chains").delete().eq("id", chainId!);
    const taken = /registered|exists/i.test(error?.message ?? "");
    return { ok: false, message: taken ? "Ya hay un usuario con ese email." : "No se pudo crear el usuario." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "merchant", chain_id: chainId!, display_name: input.displayName })
    .eq("id", created.user.id);
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (createdChain) await admin.from("chains").delete().eq("id", chainId!);
    return { ok: false, message: "No se pudo asignar la cadena al usuario." };
  }
  return { ok: true, email: input.email };
}
