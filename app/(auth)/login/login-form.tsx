"use client";

import { useActionState, useRef } from "react";
import { loginAction } from "../actions";
import { initialFormState } from "@/lib/validation/form";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormMessage } from "@/components/forms/form-message";

const DEMO_ACCOUNTS = [
  { label: "Cliente", email: "usuario@demo.com" },
  { label: "Supermercado", email: "cadena1@demo.com" },
  { label: "Admin", email: "admin@demo.com" },
];

export function LoginForm({ next, showDemo }: { next?: string; showDemo: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  function fillDemo(email: string) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = email;
    (form.elements.namedItem("password") as HTMLInputElement).value = "Demo1234!";
    form.requestSubmit();
  }

  return (
    <div className="grid gap-6">
      <form ref={formRef} action={action} className="grid gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.values?.email} key={state.values?.email} errors={state.fieldErrors?.email} />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required errors={state.fieldErrors?.password} />
        <FormMessage message={state.fieldErrors ? undefined : state.message} />
        <SubmitButton pending={pending}>Entrar</SubmitButton>
      </form>

      {showDemo ? (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">Entrar con una cuenta de demo</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={pending}
                onClick={() => fillDemo(acc.email)}
                className="rounded-full border bg-hoja px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.97] disabled:opacity-50"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
