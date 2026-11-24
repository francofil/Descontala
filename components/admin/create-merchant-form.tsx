"use client";

import { useActionState, useState } from "react";
import { createMerchantAction } from "@/app/(admin)/admin/actions";
import { initialFormState } from "@/lib/validation/form";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormMessage } from "@/components/forms/form-message";

export function CreateMerchantForm({ chains }: { chains: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createMerchantAction, initialFormState);
  const [mode, setMode] = useState<"existing" | "new">(state.values?.newChainName ? "new" : "existing");
  const v = state.ok ? undefined : state.values;

  return (
    <form action={action} className="grid gap-4" noValidate key={state.ok ? state.message : "form"}>
      <Field label="Nombre de la persona o del súper" name="displayName" defaultValue={v?.displayName} errors={state.fieldErrors?.displayName} />
      <Field label="Email" name="email" type="email" autoComplete="off" defaultValue={v?.email} errors={state.fieldErrors?.email} />
      <Field label="Contraseña inicial" name="password" type="text" autoComplete="new-password" hint="Mínimo 8 caracteres. Compártela por un canal seguro." errors={state.fieldErrors?.password} />

      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium">Cadena</legend>
        <div className="inline-flex w-fit rounded-full bg-muted p-1 text-sm">
          {(["existing", "new"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-full px-3.5 py-1.5 font-medium ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {m === "existing" ? "Existente" : "Nueva"}
            </button>
          ))}
        </div>
        {mode === "existing" ? (
          <select name="chainId" defaultValue={v?.chainId ?? ""} className="h-12 rounded-xl border bg-hoja px-3 text-base">
            <option value="">Elige una cadena</option>
            {chains.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <input name="newChainName" defaultValue={v?.newChainName} placeholder="Nombre de la nueva cadena" className="h-12 rounded-xl border bg-hoja px-3.5 text-base" />
        )}
        {state.fieldErrors?.chainId || state.fieldErrors?.newChainName ? (
          <p className="text-sm text-almagra">{(state.fieldErrors.chainId ?? state.fieldErrors.newChainName)?.[0]}</p>
        ) : null}
      </fieldset>

      <FormMessage message={state.fieldErrors ? undefined : state.message} tone={state.ok ? "info" : "error"} />
      <SubmitButton pending={pending}>Crear cuenta de supermercado</SubmitButton>
    </form>
  );
}
