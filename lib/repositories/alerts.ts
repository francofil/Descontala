import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function findAlertPreferences(db: DbClient, userId: string) {
  const { data, error } = await db
    .from("alert_preferences")
    .select("shopping_day, radius_km, category_ids, product_ids")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertAlertPreferences(
  db: DbClient,
  userId: string,
  prefs: { shopping_day: number; radius_km: number; category_ids: string[]; product_ids: string[] },
) {
  const { error } = await db.from("alert_preferences").upsert({ user_id: userId, ...prefs });
  if (error) throw error;
}

export async function listProductsBasic(db: DbClient) {
  const { data, error } = await db.from("products").select("id, name, category_id").order("name");
  if (error) throw error;
  return data;
}
