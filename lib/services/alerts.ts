import "server-only";
import { createClient } from "@/lib/supabase/server";
import { findAlertPreferences, listProductsBasic, upsertAlertPreferences } from "@/lib/repositories/alerts";
import { listCategories } from "@/lib/repositories/promotions";
import { madridDate } from "@/lib/dates";
import type { AlertInput } from "@/lib/validation/alerts";
import type { PromoCardData } from "./promotions";
import { getCurrentUser, requireRole } from "./session";

export const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export async function getAlertSettings() {
  const user = await requireRole("consumer");
  const db = await createClient();
  const [prefs, categories, products] = await Promise.all([
    findAlertPreferences(db, user.id),
    listCategories(db),
    listProductsBasic(db),
  ]);
  return {
    categories,
    products,
    initial: prefs
      ? { shoppingDay: prefs.shopping_day, radiusKm: Number(prefs.radius_km), categoryIds: prefs.category_ids, productIds: prefs.product_ids }
      : null,
  };
}

export async function saveAlerts(input: AlertInput) {
  const user = await requireRole("consumer");
  const db = await createClient();
  await upsertAlertPreferences(db, user.id, {
    shopping_day: input.shoppingDay,
    radius_km: input.radiusKm,
    category_ids: input.categoryIds,
    product_ids: input.productIds,
  });
}

/** Día de la semana (0=domingo) en Madrid. */
function madridDow(offsetDays = 0) {
  const d = new Date(`${madridDate()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.getUTCDay();
}

export type PreShopping = { title: string; subtitle: string; promos: PromoCardData[] };

/**
 * Bloque "Antes de tu compra": aparece el día anterior y el mismo día de compra,
 * con las promos cercanas que encajan con las categorías o productos elegidos.
 */
export async function getPreShoppingBlock(promos: PromoCardData[]): Promise<PreShopping | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "consumer") return null;
  const db = await createClient();
  const prefs = await findAlertPreferences(db, user.id);
  if (!prefs) return null;

  const isToday = madridDow(0) === prefs.shopping_day;
  const isTomorrow = madridDow(1) === prefs.shopping_day;
  if (!isToday && !isTomorrow) return null;

  const cats = new Set(prefs.category_ids);
  const prods = new Set(prefs.product_ids);
  const anyPref = cats.size > 0 || prods.size > 0;
  const matches = promos
    .filter((p) => p.distanceKm <= Number(prefs.radius_km))
    .filter((p) => !anyPref || (p.categoryId && cats.has(p.categoryId)) || (p.productId && prods.has(p.productId)))
    .sort((a, b) => Number(b.ends.urgent) - Number(a.ends.urgent) || a.distanceKm - b.distanceKm)
    .slice(0, 6);

  return {
    title: isToday ? "Hoy es tu día de compra" : "Antes de tu compra de mañana",
    subtitle: matches.length
      ? `${matches.length} ${matches.length === 1 ? "oferta encaja" : "ofertas encajan"} con lo que sueles comprar, a menos de ${String(prefs.radius_km).replace(".", ",")} km.`
      : "Esta vez no hay ofertas de lo que sueles comprar cerca. Mira el resto abajo.",
    promos: matches,
  };
}
