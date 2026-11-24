import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function rpcChainDailyStats(db: DbClient, chainId: string, days: number) {
  const { data, error } = await db.rpc("chain_daily_stats", { p_chain_id: chainId, p_days: days });
  if (error) throw error;
  return data;
}

export async function findFee(db: DbClient, chainId: string) {
  const { data, error } = await db.from("merchant_settings").select("fee_per_redemption").eq("chain_id", chainId).maybeSingle();
  if (error) throw error;
  return Number(data?.fee_per_redemption ?? 0);
}

export async function findPromotionStats(db: DbClient, promotionId: string) {
  const { data, error } = await db.from("promotion_stats").select("*").eq("promotion_id", promotionId).maybeSingle();
  if (error) throw error;
  return data;
}
