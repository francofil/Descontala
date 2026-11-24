"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Loader2 } from "lucide-react";
import { LOCATION_COOKIE } from "@/lib/location";

const ASKED_KEY = "dl_loc_asked";

function saveLocation(pos: GeolocationPosition) {
  const value = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
  document.cookie = `${LOCATION_COOKIE}=${value}; path=/; max-age=${60 * 60 * 12}; samesite=lax`;
}

/** Pide la ubicación una vez; si se deniega, seguimos con el centro de Sevilla. */
export function LocationSync({ precise }: { precise: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);

  const request = (onDone?: () => void) => {
    if (!("geolocation" in navigator)) return onDone?.();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLocation(pos);
        onDone?.();
        startTransition(() => router.refresh());
      },
      () => onDone?.(),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const locate = () => {
    setLocating(true);
    request(() => setLocating(false));
  };

  useEffect(() => {
    if (precise) return;
    try {
      if (sessionStorage.getItem(ASKED_KEY)) return;
      sessionStorage.setItem(ASKED_KEY, "1");
    } catch {}
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precise]);

  const busy = locating || pending;
  return (
    <button
      type="button"
      onClick={locate}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <LocateFixed className="size-3.5" aria-hidden />}
      {precise ? "Cerca de ti" : <>Centro de Sevilla. <span className="underline underline-offset-4">Usar mi ubicación</span></>}
    </button>
  );
}
