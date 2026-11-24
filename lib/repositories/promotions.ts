import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function rpcNearbyPromotions(db: DbClient, lat: number, lng: number, radiusKm: number) {
  const { data, error } = await db.rpc("nearby_promotions", { p_lat: lat, p_lng: lng, p_radius_km: radiusKm });
  if (error) throw error;
  return data;
}

export async function findPromotionById(db: DbClient, id: string) {
  const { data, error } = await db
    .from("promotions")
    .select(
      `id, title, description, type, value, conditions, starts_at, ends_at, status, max_redemptions,
       chains(id, name, color, highlights),
       products(id, name, brand, unit),
       categories(slug, name, emoji),
       promotion_stores(stores(id, name, address, neighborhood, lat, lng))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listChainStores(db: DbClient, chainId: string) {
  const { data, error } = await db
    .from("stores")
    .select("id, name, address, neighborhood, lat, lng")
    .eq("chain_id", chainId);
  if (error) throw error;
  return data;
}

export async function listCategories(db: DbClient) {
  const { data, error } = await db.from("categories").select("id, slug, name, emoji").order("sort");
  if (error) throw error;
  return data;
}

export async function trackEvent(db: DbClient, promotionId: string, type: "view" | "save" | "click") {
  const { error } = await db.rpc("track_event", { p_promotion_id: promotionId, p_type: type });
  if (error) console.error("track_event", error.message);
}
