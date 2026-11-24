"use server";

import { revalidatePath } from "next/cache";
import { createMerchantSchema } from "@/lib/validation/admin";
import { formToObject, zodErrorState, type FormState } from "@/lib/validation/form";
import { createMerchant } from "@/lib/services/admin";

export async function createMerchantAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = formToObject(formData);
  const values = { email: String(raw.email ?? ""), displayName: String(raw.displayName ?? ""), newChainName: String(raw.newChainName ?? ""), chainId: String(raw.chainId ?? "") };
  const parsed = createMerchantSchema.safeParse(raw);
  if (!parsed.success) return { ...zodErrorState(parsed.error), values };
  const result = await createMerchant(parsed.data);
  if (!result.ok) return { ok: false, message: result.message, values };
  revalidatePath("/admin");
  return { ok: true, message: `Cuenta creada: ${result.email}. Ya puede entrar en su panel.` };
}
