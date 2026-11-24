import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rpcRedeemCode, type RedeemRpcResult } from "@/lib/repositories/merchant";
import { listChainStores } from "@/lib/repositories/promotions";
import { discountLabel, formatDateTime, type PromoType } from "@/lib/format";
import { requireMerchant } from "./session";

export const STORE_COOKIE = "dl_store";

export type RedeemOutcome = {
  tone: "ok" | "warn" | "error";
  title: string;
  detail?: string;
  promotion?: string;
  discount?: string;
  isNewCustomer?: boolean;
};

const MESSAGES: Record<RedeemRpcResult["result"], Omit<RedeemOutcome, "promotion">> = {
  ok: { tone: "ok", title: "Código válido" },
  ya_usado: { tone: "error", title: "Ya se usó" },
  caducado: { tone: "error", title: "Caducado" },
  otra_cadena: { tone: "error", title: "No es de esta cadena", detail: "Este código es de otro supermercado." },
  no_existe: { tone: "error", title: "No existe", detail: "Revisa que el código esté bien escrito." },
  limite_alcanzado: { tone: "warn", title: "Promo agotada", detail: "Se alcanzó el máximo de canjes de esta promoción." },
  promo_no_vigente: { tone: "warn", title: "Promo no vigente", detail: "La promoción está pausada o aún no ha empezado." },
  tienda_no_incluida: { tone: "warn", title: "No válida en esta tienda", detail: "La promoción no incluye esta tienda." },
  tienda_invalida: { tone: "error", title: "Tienda no válida", detail: "Elige una tienda de tu cadena." },
  no_autorizado: { tone: "error", title: "Sin permiso", detail: "Entra con una cuenta de supermercado." },
  demasiados_intentos: { tone: "warn", title: "Demasiados intentos", detail: "Espera un minuto y vuelve a probar." },
};

export async function redeem(code: string, storeId: string): Promise<RedeemOutcome> {
  await requireMerchant();
  const db = await createClient();
  const r = await rpcRedeemCode(db, code, storeId);
  const base = MESSAGES[r.result] ?? { tone: "error" as const, title: "Error al validar" };
  const outcome: RedeemOutcome = { ...base, promotion: r.promotion_title };

  if (r.result === "ok" && r.promotion_type) {
    outcome.discount = discountLabel(r.promotion_type as PromoType, r.promotion_value ?? null).big;
    outcome.detail = r.conditions ?? "Aplica el descuento en el ticket.";
    outcome.isNewCustomer = !!r.is_new_customer;
  }
  if (r.result === "ya_usado" && r.redeemed_at) outcome.detail = `Canjeado el ${formatDateTime(r.redeemed_at)}.`;
  if (r.result === "caducado" && r.expires_at) outcome.detail = `Caducó el ${formatDateTime(r.expires_at)}.`;
  return outcome;
}

/** Tiendas de la cadena y la seleccionada para la caja (cookie). */
export async function getCashierContext() {
  const user = await requireMerchant();
  const db = await createClient();
  const stores = (await listChainStores(db, user.chainId)).sort((a, b) => a.name.localeCompare(b.name));
  const saved = (await cookies()).get(STORE_COOKIE)?.value;
  const current = stores.find((s) => s.id === saved) ?? stores[0] ?? null;
  return { chainName: user.chainName, stores, currentStoreId: current?.id ?? null };
}
