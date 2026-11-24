"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { savePromotionAction } from "@/app/(merchant)/panel/actions";
import { initialFormState } from "@/lib/validation/form";
import { discountLabel, endsLabel, type PromoType } from "@/lib/format";
import { addDays, endOfMadridDay, nextSunday } from "@/lib/dates";
import { DiscountTag } from "@/components/promo/discount-tag";
import { EndsBadge } from "@/components/promo/ends-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductGroup = { name: string; products: { id: string; label: string }[] };
type Store = { id: string; name: string; neighborhood: string | null };
type Initial = {
  id: string; productId: string; title: string; type: PromoType; value: string; conditions: string;
  startDate: string; endDate: string; storeIds: string[]; maxRedemptions: string; status: "activa" | "borrador";
};

const TYPES: { value: PromoType; label: string; hint: string }[] = [
  { value: "porcentaje", label: "−%", hint: "Descuento" },
  { value: "2x1", label: "2x1", hint: "Lleva 2, paga 1" },
  { value: "3x2", label: "3x2", hint: "Lleva 3, paga 2" },
  { value: "segunda_unidad", label: "2.ª ud.", hint: "% en la 2.ª" },
  { value: "precio_fijo", label: "Precio", hint: "Precio oferta" },
];

const CONDITION_SNIPPETS = ["Máximo 2 por cliente.", "Hasta agotar existencias.", "No acumulable a otras ofertas."];

export function PromoForm({
  productGroups,
  stores,
  today,
  initial,
}: {
  productGroups: ProductGroup[];
  stores: Store[];
  today: string;
  initial: Initial | null;
}) {
  const [state, action, pending] = useActionState(savePromotionAction, initialFormState);
  const startedAt = useRef<number>(0);
  useEffect(() => { startedAt.current = performance.now(); }, []);

  const v = state.values;
  const [productId, setProductId] = useState(v?.productId ?? initial?.productId ?? "");
  const [type, setType] = useState<PromoType>((v?.type as PromoType) ?? initial?.type ?? "porcentaje");
  const [value, setValue] = useState(v?.value ?? initial?.value ?? "");
  const [title, setTitle] = useState(v?.title ?? initial?.title ?? "");
  const [conditions, setConditions] = useState(v?.conditions ?? initial?.conditions ?? "");
  const [startDate, setStartDate] = useState(v?.startDate ?? initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(v?.endDate ?? initial?.endDate ?? addDays(today, 7));
  const [storeIds, setStoreIds] = useState<string[]>(
    v?.storeIds ? v.storeIds.split(",").filter(Boolean) : initial?.storeIds ?? stores.map((s) => s.id),
  );
  const [maxRedemptions, setMaxRedemptions] = useState(v?.maxRedemptions ?? initial?.maxRedemptions ?? "");

  const productLabel = productGroups.flatMap((g) => g.products).find((p) => p.id === productId)?.label;
  const productName = productLabel ? productLabel.replace(/ \(.+\)$/, "") : null;

  const needsValue = type === "porcentaje" || type === "segunda_unidad" || type === "precio_fijo";
  // Con el campo vacío, la vista previa usa el mismo ejemplo que el placeholder.
  const example = type === "precio_fijo" ? 1.49 : type === "segunda_unidad" ? 50 : 20;
  const numericValue = value.trim() ? Number(value.replace(",", ".")) : example;
  const discount = discountLabel(type, needsValue && Number.isFinite(numericValue) ? numericValue : null);
  const previewTitle = title || (productName ? suggestTitle(type, discount.big, productName) : "Título de la promoción");
  const preview = endsLabel(endOfMadridDay(endDate));
  const err = (k: string) => state.fieldErrors?.[k]?.[0];

  const quickEnds = [
    { label: "3 días", day: addDays(today, 2) },
    { label: "Hasta el domingo", day: nextSunday(today) },
    { label: "1 semana", day: addDays(today, 6) },
    { label: "2 semanas", day: addDays(today, 13) },
  ];

  return (
    <form
      action={action}
      onSubmit={() => {
        try { sessionStorage.setItem("dl_publish_secs", String(Math.round((performance.now() - startedAt.current) / 1000))); } catch {}
      }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
      noValidate
    >
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-7">
        <Block label="Producto" hint="Opcional. Si lo eliges, el título se escribe solo.">
          <select
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="h-12 w-full rounded-xl border bg-hoja px-3 text-base"
          >
            <option value="">Sin producto concreto</option>
            {productGroups.map((g) => (
              <optgroup key={g.name} label={g.name}>
                {g.products.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </optgroup>
            ))}
          </select>
        </Block>

        <Block label="Tipo de oferta" error={err("type")}>
          <input type="hidden" name="type" value={type} />
          <div role="radiogroup" className="grid grid-cols-5 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "grid gap-0.5 rounded-xl border px-1 py-3 text-center transition-[background-color,transform] active:scale-95",
                  type === t.value ? "border-transparent bg-primary text-primary-foreground" : "bg-hoja hover:bg-muted",
                )}
              >
                <span className="font-display text-lg font-bold">{t.label}</span>
                <span className={cn("hidden text-[11px] sm:block", type === t.value ? "opacity-80" : "text-muted-foreground")}>{t.hint}</span>
              </button>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {needsValue ? (
              <motion.div
                key="value"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="relative mt-3 max-w-48">
                  <input
                    name="value"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "precio_fijo" ? "1,49" : type === "segunda_unidad" ? "50" : "20"}
                    aria-label={type === "precio_fijo" ? "Precio de oferta" : "Porcentaje"}
                    aria-invalid={!!err("value")}
                    className="h-12 w-full rounded-xl border bg-hoja pr-10 pl-3.5 text-lg font-semibold tabular aria-invalid:border-almagra"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground">
                    {type === "precio_fijo" ? "€" : "%"}
                  </span>
                </div>
                {err("value") ? <p className="mt-1.5 text-sm text-almagra">{err("value")}</p> : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Block>

        <Block label="Título" hint={productName ? `Si lo dejas vacío: «${previewTitle}»` : "Lo que verá el cliente en la tarjeta."} error={err("title")}>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={90}
            placeholder={productName ? previewTitle : "Ej.: 20 % en toda la fruta"}
            className="h-12 w-full rounded-xl border bg-hoja px-3.5 text-base"
          />
        </Block>

        <Block label="Condiciones" hint="Visibles siempre en la oferta." error={err("conditions")}>
          <textarea
            name="conditions"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Máximo 2 unidades por cliente."
            className="w-full resize-none rounded-xl border bg-hoja px-3.5 py-3 text-base"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {CONDITION_SNIPPETS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setConditions((c) => (c.includes(s) ? c : `${c ? `${c.trim()} ` : ""}${s}`))}
                className="rounded-full border bg-hoja px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                + {s}
              </button>
            ))}
          </div>
        </Block>

        <Block label="Fechas" error={err("endDate") ?? err("startDate")}>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Empieza</span>
              <input type="date" name="startDate" value={startDate} min={initial ? undefined : today} onChange={(e) => setStartDate(e.target.value)} className="h-12 rounded-xl border bg-hoja px-3 text-base" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Termina (incluido)</span>
              <input type="date" name="endDate" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="h-12 rounded-xl border bg-hoja px-3 text-base" />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickEnds.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => { setEndDate(q.day); if (startDate > q.day) setStartDate(today); }}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", endDate === q.day ? "border-transparent bg-primary text-primary-foreground" : "bg-hoja hover:bg-muted")}
              >
                {q.label}
              </button>
            ))}
          </div>
        </Block>

        <Block label="Tiendas" error={err("storeIds")}>
          <div className="grid gap-2 sm:grid-cols-2">
            {stores.map((s) => {
              const checked = storeIds.includes(s.id);
              return (
                <label key={s.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors", checked ? "border-foreground/30 bg-hoja" : "bg-transparent")}>
                  <input
                    type="checkbox"
                    name="storeIds"
                    value={s.id}
                    checked={checked}
                    onChange={(e) => setStoreIds((ids) => (e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id)))}
                    className="size-4 accent-[var(--tinta)]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    {s.neighborhood ? <span className="block text-xs text-muted-foreground">{s.neighborhood}</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </Block>

        <details className="group rounded-xl border bg-hoja px-4 py-3" open={!!maxRedemptions}>
          <summary className="cursor-pointer list-none text-sm font-medium">Límite de canjes <span className="text-muted-foreground">(opcional)</span></summary>
          <input
            name="maxRedemptions"
            inputMode="numeric"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value.replace(/\D/g, ""))}
            placeholder="Sin límite"
            className="mt-3 h-11 w-40 rounded-lg border bg-background px-3 text-base tabular"
          />
          {err("maxRedemptions") ? <p className="mt-1.5 text-sm text-almagra">{err("maxRedemptions")}</p> : null}
        </details>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-6">
        <p className="text-sm font-medium text-muted-foreground">Así la verán tus clientes</p>
        <div className="rounded-2xl border bg-hoja p-4">
          <DiscountTag discount={discount} />
          <p className="mt-3 text-lg leading-snug font-semibold">{previewTitle}</p>
          {conditions ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{conditions}</p> : null}
          <EndsBadge ends={preview} className="mt-3" />
        </div>

        {state.message && !state.ok ? (
          <p role="alert" className="rounded-xl bg-almagra/10 px-3.5 py-3 text-sm text-almagra">{state.message}</p>
        ) : null}

        <div className="grid gap-2">
          <Button type="submit" name="status" value="activa" disabled={pending} className="h-12 rounded-xl text-base font-semibold">
            {pending ? <Loader2 className="size-5 animate-spin" /> : initial?.status === "activa" ? "Guardar cambios" : "Publicar"}
          </Button>
          <Button type="submit" name="status" value="borrador" variant="outline" disabled={pending} className="h-11 rounded-xl">
            Guardar como borrador
          </Button>
          <Link href="/panel/promos" className="py-2 text-center text-sm text-muted-foreground hover:text-foreground">Cancelar</Link>
        </div>
      </aside>
    </form>
  );
}

function suggestTitle(type: PromoType, big: string, product: string) {
  const name = product.charAt(0).toLowerCase() + product.slice(1);
  if (type === "porcentaje") return `${big.replace("−", "")} en ${name}`;
  if (type === "segunda_unidad") return `2.ª unidad al ${big.replace("−", "")} en ${name}`;
  if (type === "precio_fijo") return `${product} a ${big}`;
  return `${big} en ${name}`;
}

function Block({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-base font-semibold">{label}</legend>
      {children}
      {error ? <p className="text-sm text-almagra">{error}</p> : hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}
