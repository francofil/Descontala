"use server";

import { revalidatePath } from "next/cache";
import { generateCode, type GenerateCodeResult } from "@/lib/services/codes";
import { setSaved } from "@/lib/services/saved";

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
