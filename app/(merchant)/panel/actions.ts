"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { promoFormSchema, promoStatusSchema } from "@/lib/validation/merchant";
import { formToObject, zodErrorState, type FormState } from "@/lib/validation/form";
import { removePromotion, savePromotion, setPromotionStatus } from "@/lib/services/merchant-promotions";
import { STORE_COOKIE } from "@/lib/services/redeem";
import { requireMerchant } from "@/lib/services/session";

export async function savePromotionAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = formToObject(formData);
  const parsed = promoFormSchema.safeParse(raw);
  if (!parsed.success) return { ...zodErrorState(parsed.error), values: snapshot(raw) };
  const result = await savePromotion(parsed.data);
  if (!result.ok) return { ok: false, message: result.message, values: snapshot(raw) };
  revalidatePath("/panel/promos");
  revalidatePath("/");
  redirect(`/panel/promos?guardada=${result.id}`);
}

function snapshot(raw: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v.join(",") : String(v ?? "");
  return out;
}

export async function setStatusAction(id: string, status: "activa" | "pausada") {
  const parsed = promoStatusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false };
  const ok = await setPromotionStatus(parsed.data.id, parsed.data.status);
  revalidatePath("/panel/promos");
  revalidatePath("/");
  return { ok };
}

export async function deletePromotionAction(id: string) {
  const parsed = z.guid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Promoción no válida." };
  const result = await removePromotion(parsed.data);
  if (result.ok) revalidatePath("/panel/promos");
  return result;
}

export async function selectStoreAction(storeId: string) {
  const parsed = z.guid().safeParse(storeId);
  if (!parsed.success) return;
  await requireMerchant();
  (await cookies()).set(STORE_COOKIE, parsed.data, { path: "/panel", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
}
