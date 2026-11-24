"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

/** Un input y resultados: la URL (?q=) es el estado, con debounce de 200 ms. */
export function SearchInput({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const push = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(() => router.replace(q.trim() ? `${pathname}?q=${encodeURIComponent(q.trim())}` : pathname, { scroll: false }));
    }, 200);
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoFocus
        autoComplete="off"
        placeholder="Leche, aceite, huevos…"
        aria-label="Buscar producto"
        value={value}
        onChange={(e) => { setValue(e.target.value); push(e.target.value); }}
        className="h-14 w-full rounded-2xl border bg-hoja pr-12 pl-12 text-lg outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute top-1/2 right-3 -translate-y-1/2">
        {pending ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Buscando" />
        ) : value ? (
          <button type="button" aria-label="Borrar" onClick={() => { setValue(""); push(""); }} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
