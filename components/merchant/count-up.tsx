"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/** Cuenta desde 0 hasta el valor al entrar en pantalla. El texto final está en el HTML desde el inicio. */
export function CountUp({ value, format = "int" }: { value: number; format?: "int" | "eur" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const fmt = (n: number) =>
    format === "eur"
      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
      : new Intl.NumberFormat("es-ES").format(Math.round(n));

  useEffect(() => {
    if (!inView || reduce || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { node.textContent = fmt(v); },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return <span ref={ref}>{fmt(value)}</span>;
}
