import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  countPromotionCodes,
  deletePromotion,
  findChainPromotion,
  insertPromotion,
  listChainPromotions,
  listProductsWithCategory,
  listPromotionStats,
  replacePromotionStores,
  updatePromotion,
} from "@/lib/repositories/merchant";
import { listChainStores } from "@/lib/repositories/promotions";
import { discountLabel, endsLabel, formatDayMonth, startsLabel, type PromoType } from "@/lib/format";
import { endOfMadridDay, madridDate, startOfMadridDay } from "@/lib/dates";
import type { PromoFormInput } from "@/lib/validation/merchant";
import { requireMerchant } from "./session";

export type PromoState = "live" | "upcoming" | "ended" | "paused" | "draft";

export const STATE_LABEL: Record<PromoState, string> = {
  live: "Activa",
  upcoming: "Programada",
  ended: "Terminada",
  paused: "Pausada",
  draft: "Borrador",
};

function promoState(p: { status: string; starts_at: string; ends_at: string }, now: Date): PromoState {
  if (p.status === "borrador") return "draft";
  if (p.status === "pausada") return "paused";
  if (new Date(p.ends_at) <= now) return "ended";
  if (new Date(p.starts_at) > now) return "upcoming";
  return "live";
}

export async function listMyPromotions() {
  const user = await requireMerchant();
  const db = await createClient();
  const [promos, stats, stores] = await Promise.all([
    listChainPromotions(db, user.chainId),
    listPromotionStats(db, user.chainId),
    listChainStores(db, user.chainId),
  ]);
  const statsById = new Map(stats.map((s) => [s.promotion_id, s]));
  const now = new Date();
  const order: Record<PromoState, number> = { live: 0, upcoming: 1, draft: 2, paused: 3, ended: 4 };

  return promos
    .map((p) => {
      const s = statsById.get(p.id);
      const state = promoState(p, now);
      return {
        id: p.id,
        title: p.title,
        discount: discountLabel(p.type as PromoType, p.value),
        state,
        stateLabel: STATE_LABEL[state],
        when:
          state === "upcoming"
            ? startsLabel(p.starts_at, now)
            : state === "ended"
              ? `Terminó el ${formatDayMonth(p.ends_at)}`
              : endsLabel(p.ends_at, now),
        storesLabel: p.promotion_stores.length >= stores.length ? "Todas las tiendas" : `${p.promotion_stores.length} de ${stores.length} tiendas`,
        redemptions: Number(s?.redemptions ?? 0),
        newCustomers: Number(s?.new_customers ?? 0),
        views: Number(s?.views ?? 0),
      };
    })
    .sort((a, b) => order[a.state] - order[b.state]);
}

export async function getPromotionFormData(id?: string) {
  const user = await requireMerchant();
  const db = await createClient();
  const [products, stores, promo] = await Promise.all([
    listProductsWithCategory(db),
    listChainStores(db, user.chainId),
    id ? findChainPromotion(db, user.chainId, id) : Promise.resolve(null),
  ]);
  if (id && !promo) return null;

  const groups = new Map<string, { name: string; sort: number; products: { id: string; label: string }[] }>();
  for (const p of products) {
    const cat = p.categories;
    const key = cat?.id ?? "otros";
    const g = groups.get(key) ?? { name: cat?.name ?? "Otros", sort: cat?.sort ?? 99, products: [] };
    g.products.push({ id: p.id, label: p.brand ? `${p.name} (${p.brand})` : p.name });
    groups.set(key, g);
  }

  const today = madridDate();
  return {
    today,
    productGroups: [...groups.values()].sort((a, b) => a.sort - b.sort),
    stores: stores.sort((a, b) => a.name.localeCompare(b.name)),
    initial: promo
      ? {
          id: promo.id,
          productId: promo.product_id ?? "",
          title: promo.title,
          type: promo.type,
          value: promo.value === null ? "" : String(promo.value),
          conditions: promo.conditions ?? "",
          startDate: madridDate(new Date(promo.starts_at)),
          endDate: madridDate(new Date(promo.ends_at)),
          storeIds: promo.promotion_stores.map((s) => s.store_id),
          maxRedemptions: promo.max_redemptions ? String(promo.max_redemptions) : "",
          status: promo.status === "borrador" ? ("borrador" as const) : ("activa" as const),
        }
      : null,
  };
}

/** Título automático a partir del producto cuando el comercio no escribe uno. */
function autoTitle(type: PromoType, value: number | null, productName: string) {
  const d = discountLabel(type, value);
  const name = productName.charAt(0).toLowerCase() + productName.slice(1);
  switch (type) {
    case "porcentaje": return `${d.big.replace("−", "")} en ${name}`;
    case "segunda_unidad": return `2.ª unidad al ${d.big.replace("−", "")} en ${name}`;
    case "precio_fijo": return `${productName} a ${d.big}`;
    default: return `${d.big} en ${name}`;
  }
}

export type SaveResult = { ok: true; id: string } | { ok: false; message: string };

export async function savePromotion(input: PromoFormInput): Promise<SaveResult> {
  const user = await requireMerchant();
  const db = await createClient();

  // Las tiendas deben ser de la cadena (RLS también lo exige).
  const stores = await listChainStores(db, user.chainId);
  const allowed = new Set(stores.map((s) => s.id));
  if (!input.storeIds.every((id) => allowed.has(id))) return { ok: false, message: "Alguna tienda no es de tu cadena." };

  let title = input.title;
  if (!title && input.productId) {
    const { data } = await db.from("products").select("name").eq("id", input.productId).single();
    title = autoTitle(input.type, input.value, data?.name ?? "producto");
  }

  const today = madridDate();
  // Si empieza hoy, empieza ya; si no, a las 00:00 de ese día.
  const startsAt = input.startDate <= today ? new Date().toISOString() : startOfMadridDay(input.startDate);
  const endsAt = endOfMadridDay(input.endDate);
  if (new Date(endsAt) <= new Date()) return { ok: false, message: "La fecha de fin ya pasó." };

  const row = {
    chain_id: user.chainId,
    product_id: input.productId ?? null,
    title: title!.slice(0, 90),
    type: input.type,
    value: input.value,
    conditions: input.conditions ?? null,
    ends_at: endsAt,
    max_redemptions: input.maxRedemptions ?? null,
    status: input.status,
  };

  try {
    let id = input.id;
    if (id) {
      const existing = await findChainPromotion(db, user.chainId, id);
      if (!existing) return { ok: false, message: "La promoción no existe." };
      // No movemos el inicio de una promo ya empezada.
      const keepStart = new Date(existing.starts_at) <= new Date() && input.startDate <= today;
      await updatePromotion(db, user.chainId, id, { ...row, starts_at: keepStart ? existing.starts_at : startsAt });
    } else {
      id = await insertPromotion(db, { ...row, starts_at: startsAt, created_by: user.id });
    }
    await replacePromotionStores(db, id, input.storeIds);
    return { ok: true, id };
  } catch (e) {
    console.error("savePromotion", e);
    return { ok: false, message: "No se pudo guardar. Revisa los datos e inténtalo de nuevo." };
  }
}

export async function setPromotionStatus(id: string, status: "activa" | "pausada") {
  const user = await requireMerchant();
  const db = await createClient();
  return (await updatePromotion(db, user.chainId, id, { status })) > 0;
}

export async function removePromotion(id: string): Promise<{ ok: boolean; message?: string }> {
  const user = await requireMerchant();
  const db = await createClient();
  if ((await countPromotionCodes(db, id)) > 0) {
    return { ok: false, message: "Tiene códigos generados: páusala en lugar de borrarla para no perder las métricas." };
  }
  await deletePromotion(db, user.chainId, id);
  return { ok: true };
}
