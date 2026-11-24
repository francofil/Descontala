"use server";

import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { formToObject, zodErrorState, type FormState } from "@/lib/validation/form";
import { signIn, signOut, signUp } from "@/lib/services/auth";

const keep = (formData: FormData, ...keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "").slice(0, 254)]));

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "email");
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodErrorState(parsed.error, values);
  const result = await signIn(parsed.data);
  if (!result.ok) return { ok: false, message: result.message, values };
  redirect(result.redirectTo);
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = keep(formData, "displayName", "email");
  const parsed = registerSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodErrorState(parsed.error, values);
  const result = await signUp(parsed.data);
  if (!result.ok) return { ok: false, message: result.message, values };
  redirect(result.redirectTo);
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
