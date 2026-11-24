"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { saveAlertsAction } from "@/app/(consumer)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; emoji: string };
type Product = { id: string; name: string; category_id: string };

// Lunes primero (como en España); valores = getDay() de JS.
const DAYS = [
  { v: 1, short: "L", long: "lunes" }, { v: 2, short: "M", long: "martes" }, { v: 3, short: "X", long: "miércoles" },
  { v: 4, short: "J", long: "jueves" }, { v: 5, short: "V", long: "viernes" }, { v: 6, short: "S", long: "sábado" },
  { v: 0, short: "D", long: "domingo" },
];

export function AlertsForm({
  categories,
  products,
  initial,
}: {
  categories: Category[];
  products: Product[];
  initial: { shoppingDay: number; radiusKm: number; categoryIds: string[]; productIds: string[] } | null;
}) {
  const [day, setDay] = useState<number | null>(initial?.shoppingDay ?? null);
  const [radius, setRadius] = useState(initial?.radiusKm ?? 3);
  const [cats, setCats] = useState<string[]>(initial?.categoryIds ?? []);
  const [prods, setProds] = useState<string[]>(initial?.productIds ?? []);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const suggestions = query.trim().length >= 2
    ? products.filter((p) => norm(p.name).includes(norm(query.trim())) && !prods.includes(p.id)).slice(0, 6)
    : [];

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const dirty = () => setSaved(false);
  const dayName = DAYS.find((d) => d.v === day)?.long;
  const prevDay = day === null ? null : DAYS.find((d) => d.v === (day + 6) % 7)?.long;

  const submit = () => {
    if (day === null) return void toast.error("Elige tu día de compra.");
    start(async () => {
      const res = await saveAlertsAction({ shoppingDay: day, radiusKm: radius, categoryIds: cats, productIds: prods });
      if (!res.ok) return void toast.error(res.message);
      setSaved(true);
      toast.success("Avisos guardados");
    });
  };

  return (
    <div className="grid gap-8">
      <fieldset className="grid gap-3">
        <legend className="mb-3 text-base font-semibold">¿Qué día sueles hacer la compra?</legend>
        <div role="radiogroup" className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d) => (
            <button
              key={d.v}
              type="button"
              role="radio"
              aria-checked={day === d.v}
              aria-label={d.long}
              onClick={() => { setDay(d.v); dirty(); }}
              className={cn(
                "aspect-square rounded-xl border font-display text-lg font-bold transition-[background-color,transform] active:scale-90",
                day === d.v ? "border-transparent bg-albero text-albero-ink" : "bg-hoja hover:bg-muted",
              )}
            >
              {d.short}
            </button>
          ))}
        </div>
        <AnimatePresence initial={false} mode="wait">
          {dayName ? (
            <motion.p key={dayName} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-muted-foreground">
              Te avisamos el {prevDay} y el mismo {dayName} con las ofertas que encajan.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-3 flex w-full items-baseline justify-between text-base font-semibold">
          <span>¿Hasta qué distancia?</span>
          <span className="font-display text-xl tabular">{String(radius).replace(".", ",")} km</span>
        </legend>
        <input
          type="range"
          min={0.5}
          max={15}
          step={0.5}
          value={radius}
          onChange={(e) => { setRadius(Number(e.target.value)); dirty(); }}
          aria-label="Radio en kilómetros"
          className="w-full accent-[var(--tinta)]"
        />
        <div className="flex justify-between text-xs text-muted-foreground"><span>Mi barrio</span><span>Toda Sevilla</span></div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-base font-semibold">¿Qué sueles comprar?</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = cats.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => { setCats((l) => toggle(l, c.id)); dirty(); }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-[background-color,transform] active:scale-95",
                  on ? "border-transparent bg-primary text-primary-foreground" : "bg-hoja hover:bg-muted",
                )}
              >
                {on ? <Check className="size-3.5" aria-hidden /> : <span aria-hidden>{c.emoji}</span>}
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2">
          <label htmlFor="product-search" className="text-sm text-muted-foreground">Y productos concretos (opcional)</label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              id="product-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Aceite, café, huevos…"
              autoComplete="off"
              className="h-12 w-full rounded-xl border bg-hoja pr-3 pl-10 text-base"
            />
          </div>
          {suggestions.length ? (
            <ul className="divide-y rounded-xl border bg-popover text-sm">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => { setProds((l) => [...l, p.id]); setQuery(""); dirty(); }} className="w-full px-3.5 py-2.5 text-left hover:bg-muted">
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {prods.length ? (
            <div className="flex flex-wrap gap-2">
              {prods.map((id) => (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-albero/25 py-1.5 pr-1.5 pl-3 text-sm font-medium">
                  {productMap.get(id)?.name ?? "Producto"}
                  <button type="button" aria-label="Quitar" onClick={() => { setProds((l) => l.filter((x) => x !== id)); dirty(); }} className="grid size-6 place-items-center rounded-full hover:bg-black/10">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </fieldset>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20">
        <Button onClick={submit} disabled={pending} className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-[0_8px_30px_rgb(0_0_0/0.1)]">
          {pending ? <Loader2 className="size-5 animate-spin" /> : saved ? <><Check className="size-5" /> Guardado</> : "Guardar avisos"}
        </Button>
      </div>
    </div>
  );
}
