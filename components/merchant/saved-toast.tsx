"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/** Muestra "Promoción publicada" tras guardar y limpia el parámetro de la URL. */
export function SavedToast({ show }: { show: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!show) return;
    let secs: string | null = null;
    try { secs = sessionStorage.getItem("dl_publish_secs"); sessionStorage.removeItem("dl_publish_secs"); } catch {}
    toast.success("Promoción guardada", secs ? { description: `Lista en ${secs} segundos.` } : undefined);
    router.replace(pathname, { scroll: false });
  }, [show, router, pathname]);
  return null;
}
