import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function listChainsWithCounts(db: DbClient) {
  const { data, error } = await db
    .from("chains")
    .select("id, name, color, highlights, stores(count), promotions(count)")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listAllPromotionStats(db: DbClient) {
  const { data, error } = await db.from("promotion_stats").select("chain_id, redemptions, new_customers");
  if (error) throw error;
  return data;
}

export async function listMerchantProfiles(db: DbClient) {
  const { data, error } = await db.from("profiles").select("id, display_name, chain_id").eq("role", "merchant");
  if (error) throw error;
  return data;
}
