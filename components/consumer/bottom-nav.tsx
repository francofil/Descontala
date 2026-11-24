"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Bell, Search, Tag, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Ofertas", icon: Tag, match: (p: string) => p === "/" || p.startsWith("/promo") },
  { href: "/buscar", label: "Buscar", icon: Search, match: (p: string) => p.startsWith("/buscar") },
  { href: "/codigos", label: "Códigos", icon: Ticket, match: (p: string) => p.startsWith("/codigos") },
  { href: "/avisos", label: "Avisos", icon: Bell, match: (p: string) => p.startsWith("/avisos") },
];

export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

/** Versión sin hook para el fallback de Suspense (prerender). */
export function BottomNavView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute top-1.5 h-8 w-14 rounded-full bg-albero/90"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                ) : null}
                <Icon className={cn("relative size-5", active && "text-albero-ink")} aria-hidden />
                <span className="relative mt-0.5">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
