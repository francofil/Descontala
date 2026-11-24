"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayoutDashboard, ScanLine, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/panel", label: "Resultados", icon: LayoutDashboard, match: (p: string) => p === "/panel" },
  { href: "/panel/promos", label: "Promociones", icon: Tag, match: (p: string) => p.startsWith("/panel/promos") },
  { href: "/panel/caja", label: "Caja", icon: ScanLine, match: (p: string) => p.startsWith("/panel/caja") },
];

export function MerchantNav() {
  return <MerchantNavView pathname={usePathname()} />;
}

/** Pestañas arriba en escritorio y barra inferior en móvil. */
export function MerchantNavView({ pathname }: { pathname: string }) {
  return (
    <>
      <nav aria-label="Panel" className="hidden md:block">
        <ul className="flex gap-1 rounded-full bg-muted p-1">
          {ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {active ? <motion.span layoutId="merchant-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
                  <Icon className="relative size-4" aria-hidden />
                  <span className="relative">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav aria-label="Panel" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-3 px-2">
          {ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}
                >
                  {active ? <motion.span layoutId="merchant-pill" className="absolute top-1.5 h-8 w-14 rounded-full bg-albero/90" transition={{ type: "spring", stiffness: 500, damping: 38 }} /> : null}
                  <Icon className={cn("relative size-5", active && "text-albero-ink")} aria-hidden />
                  <span className="relative mt-0.5">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
