import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listCodesByUser, rpcGenerateCode } from "@/lib/repositories/codes";
import { trackEvent } from "@/lib/repositories/promotions";
import { discountLabel, endsLabel, formatDateTime, type PromoType } from "@/lib/format";
import { promoIdSchema } from "@/lib/validation/promotions";
import { requireRole } from "./session";

const ERRORS: Record<string, string> = {
  no_autenticado: "Entra en tu cuenta para obtener el código.",
  demasiados_intentos: "Demasiados intentos seguidos. Espera un minuto.",
  promo_no_vigente: "Esta promoción ya no está vigente.",
  limite_alcanzado: "Se agotaron los canjes de esta promoción.",
  ya_canjeado: "Ya canjeaste esta promoción.",
};

export type GenerateCodeResult =
  | { ok: true; code: string; expiresAt: string }
  | { ok: false; message: string };

export async function generateCode(rawPromotionId: string): Promise<GenerateCodeResult> {
  const parsed = promoIdSchema.safeParse(rawPromotionId);
  if (!parsed.success) return { ok: false, message: "Promoción no válida." };

  await requireRole("consumer");
  const db = await createClient();
  const { data, error } = await rpcGenerateCode(db, parsed.data);
  if (error || !data) {
    const key = Object.keys(ERRORS).find((k) => error?.message?.includes(k));
    return { ok: false, message: key ? ERRORS[key] : "No se pudo generar el código. Inténtalo de nuevo." };
  }
  await trackEvent(db, parsed.data, "click");
  return { ok: true, code: data.code, expiresAt: data.expires_at };
}

export type MyCode = Awaited<ReturnType<typeof getMyCodes>>["active"][number];

export async function getMyCodes() {
  const user = await requireRole("consumer");
  const db = await createClient();
  const rows = await listCodesByUser(db, user.id);
  const now = new Date();

  const codes = rows
    .filter((r) => r.promotions)
    .map((r) => {
      const promo = r.promotions!;
      const expired = r.status === "expired" || (r.status === "active" && new Date(r.expires_at) <= now);
      const status: "active" | "redeemed" | "expired" = r.status === "redeemed" ? "redeemed" : expired ? "expired" : "active";
      return {
        id: r.id,
        code: r.code,
        status,
        promotionId: promo.id,
        title: promo.title,
        conditions: promo.conditions,
        discount: discountLabel(promo.type as PromoType, promo.value),
        chain: promo.chains,
        ends: endsLabel(r.expires_at, now),
        redeemedLabel: r.redeemed_at
          ? `Canjeado el ${formatDateTime(r.redeemed_at)}${r.stores?.name ? ` en ${r.stores.name}` : ""}`
          : null,
      };
    });

  return {
    active: codes.filter((c) => c.status === "active"),
    past: codes.filter((c) => c.status !== "active"),
  };
}
