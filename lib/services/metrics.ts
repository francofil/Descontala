import "server-only";
import { createClient } from "@/lib/supabase/server";
import { findFee, findPromotionStats, rpcChainDailyStats } from "@/lib/repositories/metrics";
import { findChainPromotion, listChainPromotions, listPromotionStats } from "@/lib/repositories/merchant";
import { listChainStores } from "@/lib/repositories/promotions";
import { discountLabel, endsLabel, formatDayMonth, formatPrice, startsLabel, type PromoType } from "@/lib/format";
import { STATE_LABEL, type PromoState } from "./merchant-promotions";
import { requireMerchant } from "./session";

export const DASHBOARD_DAYS = 14;

const dayLabel = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat("es-ES", { weekday: "short", timeZone: "UTC" });

export type DailyPoint = { day: string; label: string; weekday: string; redemptions: number; newCustomers: number; returning: number; views: number };

export async function getDashboard() {
  const user = await requireMerchant();
  const db = await createClient();
  const [daily, fee, stats, promos] = await Promise.all([
    rpcChainDailyStats(db, user.chainId, DASHBOARD_DAYS),
    findFee(db, user.chainId),
    listPromotionStats(db, user.chainId),
    listChainPromotions(db, user.chainId),
  ]);

  const series: DailyPoint[] = daily.map((d) => {
    const redemptions = Number(d.redemptions);
    const newCustomers = Number(d.new_customers);
    const date = new Date(`${d.day}T12:00:00Z`);
    return {
      day: d.day,
      label: dayLabel.format(date),
      weekday: weekdayShort.format(date),
      redemptions,
      newCustomers,
      returning: redemptions - newCustomers,
      views: Number(d.views),
    };
  });

  const sum = (k: keyof DailyPoint) => series.reduce((a, p) => a + (p[k] as number), 0);
  const redemptions = sum("redemptions");
  const newCustomers = sum("newCustomers");
  const views = sum("views");
  const codes = daily.reduce((a, d) => a + Number(d.codes), 0);
  const cost = redemptions * fee;

  const titles = new Map(promos.map((p) => [p.id, p.title]));
  const topPromos = stats
    .filter((s) => Number(s.new_customers) > 0)
    .sort((a, b) => Number(b.new_customers) - Number(a.new_customers))
    .slice(0, 4)
    .map((s) => ({
      id: s.promotion_id!,
      title: titles.get(s.promotion_id!) ?? "Promoción",
      newCustomers: Number(s.new_customers),
      redemptions: Number(s.redemptions),
    }));

  return {
    chainName: user.chainName,
    series,
    totals: {
      redemptions,
      newCustomers,
      newShare: redemptions ? Math.round((newCustomers / redemptions) * 100) : 0,
      views,
      codes,
      cost: formatPrice(cost),
      fee: formatPrice(fee),
      costPerNew: newCustomers ? formatPrice(cost / newCustomers) : null,
    },
    topPromos,
  };
}

export async function getPromotionFunnel(id: string) {
  const user = await requireMerchant();
  const db = await createClient();
  const [promo, stats, fee, stores] = await Promise.all([
    findChainPromotion(db, user.chainId, id),
    findPromotionStats(db, id),
    findFee(db, user.chainId),
    listChainStores(db, user.chainId),
  ]);
  if (!promo) return null;

  const now = new Date();
  const state: PromoState =
    promo.status === "borrador" ? "draft" : promo.status === "pausada" ? "paused"
    : new Date(promo.ends_at) <= now ? "ended" : new Date(promo.starts_at) > now ? "upcoming" : "live";

  const n = (v: unknown) => Number(v ?? 0);
  const steps = [
    { key: "views", label: "Vistas", value: n(stats?.views) },
    { key: "saves", label: "Guardados", value: n(stats?.saves) },
    { key: "codes", label: "Códigos generados", value: n(stats?.codes) },
    { key: "redemptions", label: "Canjes en caja", value: n(stats?.redemptions) },
    { key: "new", label: "Clientes nuevos", value: n(stats?.new_customers) },
  ];
  const redemptions = n(stats?.redemptions);
  const newCustomers = n(stats?.new_customers);
  const cost = redemptions * fee;

  return {
    id: promo.id,
    title: promo.title,
    conditions: promo.conditions,
    discount: discountLabel(promo.type as PromoType, promo.value),
    state,
    stateLabel: STATE_LABEL[state],
    when:
      state === "upcoming" ? startsLabel(promo.starts_at, now)
      : state === "ended" ? `Terminó el ${formatDayMonth(promo.ends_at)}`
      : endsLabel(promo.ends_at, now).text,
    period: `Del ${formatDayMonth(promo.starts_at)} al ${formatDayMonth(promo.ends_at)}`,
    storesLabel: promo.promotion_stores.length >= stores.length ? "Todas las tiendas" : `${promo.promotion_stores.length} de ${stores.length} tiendas`,
    maxRedemptions: promo.max_redemptions,
    steps,
    cost: formatPrice(cost),
    fee: formatPrice(fee),
    costPerNew: newCustomers ? formatPrice(cost / newCustomers) : null,
    newShare: redemptions ? Math.round((newCustomers / redemptions) * 100) : 0,
    redemptionRate: n(stats?.codes) ? Math.round((redemptions / n(stats?.codes)) * 100) : 0,
  };
}
