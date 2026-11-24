"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Step = { key: string; label: string; value: number };

/** Embudo: cada barra es proporcional a las vistas; entre pasos, el % que avanza. */
export function Funnel({ steps }: { steps: Step[] }) {
  const reduce = useReducedMotion();
  const base = Math.max(1, steps[0]?.value ?? 1);
  const fmt = new Intl.NumberFormat("es-ES");

  return (
    <ol className="grid gap-1">
      {steps.map((s, i) => {
        const prev = steps[i - 1]?.value;
        const rate = i > 0 && prev ? Math.round((s.value / prev) * 100) : null;
        const pct = Math.max((s.value / base) * 100, s.value > 0 ? 1.5 : 0);
        const last = i === steps.length - 1;
        return (
          <li key={s.key} className="grid gap-1">
            {rate !== null ? (
              <p className="pl-1 text-xs text-muted-foreground tabular">↓ {rate} % {i === steps.length - 1 ? "eran nuevos" : "siguen"}</p>
            ) : null}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="grid gap-1">
                <span className={cn("text-sm", last ? "font-semibold" : "text-muted-foreground")}>{s.label}</span>
                <div className="h-3 w-full rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full rounded-full", last ? "bg-serie-nuevos" : "bg-foreground/80")}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: reduce ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
              <span className={cn("w-16 text-right font-display font-bold tabular", last ? "text-3xl" : "text-2xl")}>{fmt.format(s.value)}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
