import type { z } from "zod";

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Valores a repoblar tras un error (React vacía el form al enviar). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false };

/** Convierte FormData en objeto plano para validar con Zod. */
export function formToObject(formData: FormData) {
  const obj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    const prev = obj[key];
    if (prev === undefined) obj[key] = value;
    else obj[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return obj;
}

export function zodErrorState(error: z.ZodError, values?: Record<string, string>): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Revisa los campos marcados.", fieldErrors, values };
}
