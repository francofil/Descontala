import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function rpcSearchProductPrices(db: DbClient, query: string, lat: number, lng: number, radiusKm: number) {
  const { data, error } = await db.rpc("search_product_prices", {
    p_query: query,
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });
  if (error) throw error;
  return data;
}
