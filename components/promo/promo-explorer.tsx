"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { List, Map as MapIcon } from "lucide-react";
import type { PromoCardData } from "@/lib/services/promotions";
import { PROMO_TYPE_LABELS, type PromoType } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PromoCard } from "./promo-card";
import { Skeleton } from "@/components/ui/skeleton";

const PromoMap = dynamic(() => import("@/components/map/promo-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
});

type Category = { id: string; slug: string; name: string; emoji: string };
type View = "lista" | "mapa";

export function PromoExplorer({
  promos,
  categories,
  center,
}: {
  promos: PromoCardData[];
  categories: Category[];
  center: { lat: number; lng: number };
}) {
  const [view, setView] = useState<View>("lista");
  const [category, setCategory] = useState<string | null>(null);
  const [type, setType] = useState<PromoType | null>(null);

  const availableCats = useMemo(
    () => categories.filter((c) => promos.some((p) => p.category?.slug === c.slug)),
    [categories, promos],
  );
  const availableTypes = useMemo(
    () => (Object.keys(PROMO_TYPE_LABELS) as PromoType[]).filter((t) => promos.some((p) => p.type === t)),
    [promos],
  );
  const filtered = useMemo(
    () => promos.filter((p) => (!category || p.category?.slug === category) && (!type || p.type === type)),
    [promos, category, type],
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular" aria-live="polite">
          {filtered.length === 1 ? "1 oferta vigente" : `${filtered.length} ofertas vigentes`}
        </p>
        <Segmented value={view} onChange={setView} />
      </div>

      <div className="-mx-5 grid gap-2">
        <ChipRow>
          <Chip active={!category} onClick={() => setCategory(null)}>Todo</Chip>
          {availableCats.map((c) => (
            <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(category === c.slug ? null : c.slug)}>
              <span aria-hidden>{c.emoji}</span> {c.name}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow>
          {availableTypes.map((t) => (
            <Chip key={t} small active={type === t} onClick={() => setType(type === t ? null : t)}>
              {PROMO_TYPE_LABELS[t]}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === "lista" ? (
          <motion.div
            key="lista"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {filtered.length === 0 ? (
              <Empty onReset={() => { setCategory(null); setType(null); }} hasFilters={!!(category || type)} />
            ) : (
              <motion.ul layout className="grid gap-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((p) => (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    >
                      <PromoCard promo={p} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="mapa"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18 }}
            className="h-[calc(100dvh-27rem)] min-h-72 overflow-hidden rounded-2xl border"
          >
            <PromoMap promos={filtered} center={center} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Segmented({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const options: { v: View; label: string; icon: typeof List }[] = [
    { v: "lista", label: "Lista", icon: List },
    { v: "mapa", label: "Mapa", icon: MapIcon },
  ];
  return (
    <div role="tablist" aria-label="Vista" className="inline-flex rounded-full bg-muted p-1">
      {options.map(({ v, label, icon: Icon }) => (
        <button
          key={v}
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === v ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {value === v ? (
            <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
          ) : null}
          <Icon className="relative size-4" aria-hidden />
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>;
}

function Chip({ active, small, onClick, children }: { active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border font-medium whitespace-nowrap transition-[background-color,color,transform] active:scale-95",
        small ? "px-3 py-1 text-xs" : "px-3.5 py-2 text-sm",
        active ? "border-transparent bg-primary text-primary-foreground" : "bg-hoja text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Empty({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{hasFilters ? "Ninguna oferta con esos filtros." : "No hay ofertas vigentes cerca."}</p>
      {hasFilters ? (
        <button onClick={onReset} className="text-sm font-medium underline underline-offset-4">
          Quitar filtros
        </button>
      ) : (
        <p className="text-sm text-muted-foreground">Vuelve mañana: los súper publican ofertas cada semana.</p>
      )}
    </div>
  );
}
