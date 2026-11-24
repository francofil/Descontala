import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function rpcGenerateCode(db: DbClient, promotionId: string) {
  return db.rpc("generate_code", { p_promotion_id: promotionId });
}

export async function findActiveCode(db: DbClient, userId: string, promotionId: string) {
  const { data, error } = await db
    .from("redemption_codes")
    .select("code, status, expires_at, redeemed_at")
    .eq("user_id", userId)
    .eq("promotion_id", promotionId)
    .in("status", ["active", "redeemed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listCodesByUser(db: DbClient, userId: string) {
  const { data, error } = await db
    .from("redemption_codes")
    .select(
      `id, code, status, created_at, expires_at, redeemed_at,
       promotions(id, title, type, value, conditions, chains(name, color)),
       stores:redeemed_store_id(name)`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}
