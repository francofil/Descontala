"use client";

import { useActionState } from "react";
import { registerAction } from "../actions";
import { initialFormState } from "@/lib/validation/form";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormMessage } from "@/components/forms/form-message";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialFormState);
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field label="Nombre" name="displayName" autoComplete="given-name" required defaultValue={state.values?.displayName} key={`n-${state.values?.displayName}`} errors={state.fieldErrors?.displayName} />
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.values?.email} key={`e-${state.values?.email}`} errors={state.fieldErrors?.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" required hint="Mínimo 8 caracteres" errors={state.fieldErrors?.password} />
      <FormMessage message={state.fieldErrors ? undefined : state.message} />
      <SubmitButton pending={pending}>Crear cuenta</SubmitButton>
    </form>
  );
}
