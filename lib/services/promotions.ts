import "server-only";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_RADIUS_KM } from "@/lib/location";
import { distanceKm } from "@/lib/geo";
import {
  discountLabel,
  endsLabel,
  formatDistance,
  startsLabel,
  type Discount,
  type EndsLabel,
  type PromoType,
} from "@/lib/format";
import {
  findPromotionById,
  listCategories,
  listChainStores,
  rpcNearbyPromotions,
  trackEvent,
} from "@/lib/repositories/promotions";
import { findActiveCode } from "@/lib/repositories/codes";
import { isSaved } from "@/lib/repositories/saved";
import { getUserLocation } from "./location";
import { getCurrentUser } from "./session";
import { promoIdSchema } from "@/lib/validation/promotions";

export type PromoCardData = {
  id: string;
  title: string;
  conditions: string | null;
  type: PromoType;
  discount: Discount;
  ends: EndsLabel;
  endsAt: string;
  productName: string | null;
  productId: string | null;
  categoryId: string | null;
  chain: { id: string; name: string; color: string };
  category: { slug: string; name: string; emoji: string } | null;
  store: { id: string; name: string; neighborhood: string | null; lat: number; lng: number };
  storeCount: number;
  distanceKm: number;
  distance: string;
};

export async function getNearbyPromotions() {
  const [db, location] = await Promise.all([createClient(), getUserLocation()]);
  const [rows, categories] = await Promise.all([
    rpcNearbyPromotions(db, location.lat, location.lng, DEFAULT_RADIUS_KM),
    listCategories(db),
  ]);
  const now = new Date();

  const promos: PromoCardData[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    conditions: r.conditions,
    type: r.type,
    discount: discountLabel(r.type, r.value),
    ends: endsLabel(r.ends_at, now),
    endsAt: r.ends_at,
    productName: r.product_name,
    productId: r.product_id,
    categoryId: r.category_id,
    chain: { id: r.chain_id, name: r.chain_name, color: r.chain_color },
    category: r.category_slug ? { slug: r.category_slug, name: r.category_name, emoji: r.category_emoji } : null,
    store: { id: r.store_id, name: r.store_name, neighborhood: r.store_neighborhood, lat: r.store_lat, lng: r.store_lng },
    storeCount: Number(r.store_count),
    distanceKm: r.distance_km,
    distance: formatDistance(r.distance_km),
  }));

  return { promos, categories, location };
}

export type PromoDetail = NonNullable<Awaited<ReturnType<typeof getPromotionDetail>>>;

export async function getPromotionDetail(rawId: string) {
  const parsed = promoIdSchema.safeParse(rawId);
  if (!parsed.success) return null;

  const [db, location, user] = await Promise.all([createClient(), getUserLocation(), getCurrentUser()]);
  const promo = await findPromotionById(db, parsed.data);
  if (!promo || !promo.chains) return null;

  const linked = promo.promotion_stores.map((ps) => ps.stores).filter((s) => s !== null);
  const stores = (linked.length ? linked : await listChainStores(db, promo.chains.id))
    .map((s) => {
      const km = distanceKm(location, s);
      return { ...s, distanceKm: km, distance: formatDistance(km) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const now = new Date();
  const starts = new Date(promo.starts_at);
  const ends = new Date(promo.ends_at);
  const state: "live" | "upcoming" | "ended" | "inactive" =
    promo.status !== "activa" ? "inactive" : ends <= now ? "ended" : starts > now ? "upcoming" : "live";

  const [saved, code] = user
    ? await Promise.all([isSaved(db, user.id, promo.id), findActiveCode(db, user.id, promo.id)])
    : [false, null];

  return {
    id: promo.id,
    title: promo.title,
    description: promo.description,
    conditions: promo.conditions,
    type: promo.type,
    discount: discountLabel(promo.type, promo.value),
    ends: endsLabel(promo.ends_at, now),
    starts: state === "upcoming" ? startsLabel(promo.starts_at, now) : null,
    endsAt: promo.ends_at,
    state,
    maxRedemptions: promo.max_redemptions,
    chain: promo.chains,
    product: promo.products,
    category: promo.categories,
    stores,
    isLoggedIn: !!user,
    isConsumer: !user || user.role === "consumer",
    saved,
    code: code
      ? { code: code.code, status: code.status, expiresAt: code.expires_at, redeemedAt: code.redeemed_at }
      : null,
  };
}

/** Registra la vista sin retrasar la respuesta (el cliente se crea antes: after() no puede leer cookies). */
export async function recordPromotionView(promotionId: string) {
  const db = await createClient();
  after(() => trackEvent(db, promotionId, "view"));
}
