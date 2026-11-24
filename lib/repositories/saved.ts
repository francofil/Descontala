import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function isSaved(db: DbClient, userId: string, promotionId: string) {
  const { count, error } = await db
    .from("saved_promotions")
    .select("promotion_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("promotion_id", promotionId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listSavedIds(db: DbClient, userId: string) {
  const { data, error } = await db.from("saved_promotions").select("promotion_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((r) => r.promotion_id));
}

export async function insertSaved(db: DbClient, userId: string, promotionId: string) {
  const { error } = await db.from("saved_promotions").upsert({ user_id: userId, promotion_id: promotionId });
  if (error) throw error;
}

export async function deleteSaved(db: DbClient, userId: string, promotionId: string) {
  const { error } = await db.from("saved_promotions").delete().eq("user_id", userId).eq("promotion_id", promotionId);
  if (error) throw error;
}
