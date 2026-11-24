import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_RADIUS_KM } from "@/lib/location";
import { rpcSearchProductPrices } from "@/lib/repositories/products";
import { discountLabel, effectiveUnitPrice, endsLabel, formatDistance, formatPrice, unitLabel } from "@/lib/format";
import { searchQuerySchema } from "@/lib/validation/promotions";
import { getUserLocation } from "./location";

export type ProductResult = {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  minPrice: number;
  offers: {
    storeId: string;
    storeName: string;
    neighborhood: string | null;
    chainName: string;
    chainColor: string;
    price: string;
    /** Precio sin oferta, tachado cuando hay oferta. */
    regularPrice: string | null;
    priceNote: string | null;
    priceValue: number;
    unit: string;
    distance: string;
    cheapest: boolean;
    promo: { id: string; title: string; badge: string; ends: string; urgent: boolean } | null;
  }[];
};

export async function searchProducts(rawQuery: string): Promise<ProductResult[]> {
  const parsed = searchQuerySchema.safeParse(rawQuery);
  if (!parsed.success) return [];
  const [db, location] = await Promise.all([createClient(), getUserLocation()]);
  const rows = await rpcSearchProductPrices(db, parsed.data, location.lat, location.lng, DEFAULT_RADIUS_KM);
  const now = new Date();

  const byProduct = new Map<string, ProductResult>();
  for (const r of rows) {
    let product = byProduct.get(r.product_id);
    if (!product) {
      product = { id: r.product_id, name: r.product_name, brand: r.brand, unit: r.unit, minPrice: Infinity, offers: [] };
      byProduct.set(r.product_id, product);
    }
    const regular = Number(r.price);
    const effective = r.promotion_type ? effectiveUnitPrice(regular, r.promotion_type, r.promotion_value) : null;
    const price = effective ? Math.round(effective.price * 100) / 100 : regular;
    product.minPrice = Math.min(product.minPrice, price);
    const ends = r.promotion_ends_at ? endsLabel(r.promotion_ends_at, now) : null;
    product.offers.push({
      storeId: r.store_id,
      storeName: r.store_name,
      neighborhood: r.store_neighborhood,
      chainName: r.chain_name,
      chainColor: r.chain_color,
      price: formatPrice(price),
      regularPrice: effective && price < regular ? formatPrice(regular) : null,
      priceNote: effective?.note ?? null,
      priceValue: price,
      unit: unitLabel(r.unit),
      distance: formatDistance(r.distance_km),
      cheapest: false,
      promo:
        r.promotion_id && r.promotion_type && ends
          ? {
              id: r.promotion_id,
              title: r.promotion_title!,
              badge: discountLabel(r.promotion_type, r.promotion_value).big,
              ends: ends.text,
              urgent: ends.urgent,
            }
          : null,
    });
  }

  const results = [...byProduct.values()];
  for (const p of results) {
    p.offers.sort((a, b) => a.priceValue - b.priceValue);
    p.offers.forEach((o) => (o.cheapest = o.priceValue === p.minPrice));
  }
  return results;
}
