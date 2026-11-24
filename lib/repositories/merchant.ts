import "server-only";
import type { DbClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PromoInsert = Database["public"]["Tables"]["promotions"]["Insert"];

export async function listChainPromotions(db: DbClient, chainId: string) {
  const { data, error } = await db
    .from("promotions")
    .select("id, title, type, value, conditions, starts_at, ends_at, status, max_redemptions, promotion_stores(store_id)")
    .eq("chain_id", chainId)
    .order("ends_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listPromotionStats(db: DbClient, chainId: string) {
  const { data, error } = await db.from("promotion_stats").select("*").eq("chain_id", chainId);
  if (error) throw error;
  return data;
}

export async function findChainPromotion(db: DbClient, chainId: string, id: string) {
  const { data, error } = await db
    .from("promotions")
    .select("id, product_id, title, type, value, conditions, starts_at, ends_at, status, max_redemptions, promotion_stores(store_id)")
    .eq("chain_id", chainId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listProductsWithCategory(db: DbClient) {
  const { data, error } = await db
    .from("products")
    .select("id, name, brand, categories(id, name, sort)")
    .order("name");
  if (error) throw error;
  return data;
}

export async function insertPromotion(db: DbClient, row: PromoInsert) {
  const { data, error } = await db.from("promotions").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updatePromotion(db: DbClient, chainId: string, id: string, row: Partial<PromoInsert>) {
  const { error, count } = await db.from("promotions").update(row, { count: "exact" }).eq("id", id).eq("chain_id", chainId);
  if (error) throw error;
  return count ?? 0;
}

export async function replacePromotionStores(db: DbClient, promotionId: string, storeIds: string[]) {
  const del = await db.from("promotion_stores").delete().eq("promotion_id", promotionId);
  if (del.error) throw del.error;
  const ins = await db.from("promotion_stores").insert(storeIds.map((store_id) => ({ promotion_id: promotionId, store_id })));
  if (ins.error) throw ins.error;
}

export async function countPromotionCodes(db: DbClient, promotionId: string) {
  const { count, error } = await db
    .from("redemption_codes")
    .select("id", { count: "exact", head: true })
    .eq("promotion_id", promotionId);
  if (error) throw error;
  return count ?? 0;
}

export async function deletePromotion(db: DbClient, chainId: string, id: string) {
  const { error } = await db.from("promotions").delete().eq("id", id).eq("chain_id", chainId);
  if (error) throw error;
}

export async function rpcRedeemCode(db: DbClient, code: string, storeId: string) {
  const { data, error } = await db.rpc("redeem_code", { p_code: code, p_store_id: storeId });
  if (error) throw error;
  return data as RedeemRpcResult;
}

export type RedeemRpcResult = {
  result:
    | "ok" | "ya_usado" | "caducado" | "otra_cadena" | "no_existe" | "limite_alcanzado"
    | "promo_no_vigente" | "tienda_no_incluida" | "tienda_invalida" | "no_autorizado" | "demasiados_intentos";
  promotion_title?: string;
  promotion_type?: string;
  promotion_value?: number | null;
  conditions?: string | null;
  is_new_customer?: boolean;
  redeemed_at?: string;
  expires_at?: string;
};
