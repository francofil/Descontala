"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { DailyPoint } from "@/lib/services/metrics";
import { cn } from "@/lib/utils";

/**
 * Canjes por día, apilados en clientes nuevos (abajo, ámbar) y que repiten (arriba, azul).
 * Un solo eje, marcas finas con 2 px de separación, tooltip por barra y tabla para lectores de pantalla.
 */
export function DailyChart({ data }: { data: DailyPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.redemptions));
  const top = niceMax(max);
  const ticks = [0, top / 2, top];
  const H = 180;

  return (
    <figure className="grid gap-4">
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold">Canjes por día</span>
        <span className="flex items-center gap-4 text-sm text-muted-foreground">
          <Legend color="var(--serie-nuevos)" label="Clientes nuevos" />
          <Legend color="var(--serie-repiten)" label="Repiten" />
        </span>
      </figcaption>

      <div className="relative" style={{ height: H + 24 }} onMouseLeave={() => setHover(null)}>
        {/* Rejilla recesiva */}
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: 24 + (t / top) * H - 0.5 }}>
            <span className="w-6 text-right text-[11px] text-muted-foreground tabular">{t}</span>
            <span className={cn("h-px flex-1", t === 0 ? "bg-border" : "bg-border/60")} />
          </div>
        ))}

        <div className="absolute inset-y-0 right-0 left-8 flex items-end gap-[6px] pb-6 sm:gap-2">
          {data.map((d, i) => {
            const newH = (d.newCustomers / top) * H;
            const retH = (d.returning / top) * H;
            const active = hover === i;
            const showLabel = i === 0 || i === data.length - 1 || i % 3 === 0;
            return (
              <div
                key={d.day}
                className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.redemptions} canjes, ${d.newCustomers} clientes nuevos`}
              >
                <motion.div
                  className={cn("flex w-full max-w-7 flex-col justify-end gap-[2px] transition-opacity", hover !== null && !active && "opacity-45")}
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.025, ease: [0.16, 1, 0.3, 1] }}
                  style={{ originY: 1 }}
                >
                  {d.returning > 0 ? <span className="block rounded-t-[4px] bg-serie-repiten" style={{ height: retH }} /> : null}
                  {d.newCustomers > 0 ? (
                    <span className={cn("block bg-serie-nuevos", d.returning === 0 && "rounded-t-[4px]")} style={{ height: newH }} />
                  ) : null}
                  {d.redemptions === 0 ? <span className="block h-[2px] rounded-full bg-border" /> : null}
                </motion.div>
                <span className={cn("absolute -bottom-0 translate-y-full pt-1.5 text-[11px] whitespace-nowrap text-muted-foreground tabular", !showLabel && "hidden sm:block sm:opacity-0", active && "opacity-100! text-foreground")}>
                  {i === data.length - 1 ? "Hoy" : d.label}
                </span>

                {active ? (
                  <div
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute z-10 w-44 rounded-xl border bg-popover p-3 text-sm shadow-lg",
                      i > data.length - 4 ? "right-0" : i < 3 ? "left-0" : "left-1/2 -translate-x-1/2",
                    )}
                    style={{ bottom: Math.max(retH + newH, 8) + 32 }}
                  >
                    <p className="font-semibold capitalize">{d.weekday} {d.label}</p>
                    <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 tabular">
                      <dt className="flex items-center gap-1.5"><Swatch color="var(--serie-nuevos)" />Nuevos</dt><dd className="text-right font-medium">{d.newCustomers}</dd>
                      <dt className="flex items-center gap-1.5"><Swatch color="var(--serie-repiten)" />Repiten</dt><dd className="text-right font-medium">{d.returning}</dd>
                      <dt className="text-muted-foreground">Vistas</dt><dd className="text-right text-muted-foreground">{d.views}</dd>
                    </dl>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <table className="sr-only">
        <caption>Canjes por día en los últimos {data.length} días</caption>
        <thead><tr><th>Día</th><th>Canjes</th><th>Clientes nuevos</th><th>Vistas</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}><td>{d.label}</td><td>{d.redemptions}</td><td>{d.newCustomers}</td><td>{d.views}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function niceMax(n: number) {
  const steps = [2, 4, 6, 10, 20, 30, 40, 50, 100, 200, 500, 1000];
  return steps.find((s) => s >= n) ?? Math.ceil(n / 1000) * 1000;
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden className="inline-block size-2.5 rounded-[3px]" style={{ backgroundColor: color }} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Swatch color={color} />
      {label}
    </span>
  );
}
