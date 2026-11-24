"use server";

import { revalidatePath } from "next/cache";
import { generateCode, type GenerateCodeResult } from "@/lib/services/codes";
import { setSaved } from "@/lib/services/saved";
import { saveAlerts } from "@/lib/services/alerts";
import { alertSchema } from "@/lib/validation/alerts";

export async function generateCodeAction(promotionId: string): Promise<GenerateCodeResult> {
  const result = await generateCode(promotionId);
  if (result.ok) revalidatePath("/codigos");
  return result;
}

export async function setSavedAction(promotionId: string, save: boolean): Promise<{ ok: boolean }> {
  try {
    await setSaved(promotionId, save);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function saveAlertsAction(input: unknown): Promise<{ ok: boolean; message?: string }> {
  const parsed = alertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  try {
    await saveAlerts(parsed.data);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "No se pudieron guardar los avisos." };
  }
}
