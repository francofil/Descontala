"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Camera, CameraOff, Check, Loader2, Sparkles, X } from "lucide-react";
import { selectStoreAction } from "@/app/(merchant)/panel/actions";
import { DiscountTag } from "@/components/promo/discount-tag";
import { Button } from "@/components/ui/button";
import type { RedeemOutcome } from "@/lib/services/redeem";
import { cn } from "@/lib/utils";

const QrScanner = dynamic(() => import("./qr-scanner"), {
  ssr: false,
  loading: () => <div className="grid aspect-square place-items-center rounded-[20px] bg-muted"><Loader2 className="size-6 animate-spin" /></div>,
});

type Store = { id: string; name: string };
type HistoryItem = { at: string; code: string; outcome: RedeemOutcome };

const clean = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
const pretty = (v: string) => (v.length > 4 ? `${v.slice(0, 4)}-${v.slice(4)}` : v);

export function Cashier({ stores, initialStoreId }: { stores: Store[]; initialStoreId: string | null }) {
  const [storeId, setStoreId] = useState(initialStoreId ?? stores[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<(RedeemOutcome & { code: string }) | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  useEffect(() => { if (!result) inputRef.current?.focus(); }, [result]);

  const validate = (raw: string) => {
    const value = clean(raw);
    if (value.length !== 8 || busy.current || !storeId) return;
    busy.current = true;
    setScanning(false);
    start(async () => {
      let outcome: RedeemOutcome;
      try {
        const res = await fetch("/api/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: value, storeId }),
        });
        outcome = await res.json();
      } catch {
        outcome = { tone: "error", title: "Sin conexión", detail: "Comprueba la red e inténtalo de nuevo." };
      }
      setResult({ ...outcome, code: value });
      setHistory((h) => [{ at: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), code: value, outcome }, ...h].slice(0, 6));
      setCode("");
      busy.current = false;
    });
  };

  const changeStore = (id: string) => {
    setStoreId(id);
    void selectStoreAction(id);
  };

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <label className="grid gap-1.5">
        <span className="text-sm text-muted-foreground">Estás cobrando en</span>
        <select value={storeId} onChange={(e) => changeStore(e.target.value)} className="h-12 rounded-xl border bg-hoja px-3 text-base font-medium">
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <form
        onSubmit={(e) => { e.preventDefault(); validate(code); }}
        className="grid gap-3"
      >
        <label htmlFor="code" className="text-base font-semibold">Código del cliente</label>
        <input
          ref={inputRef}
          id="code"
          value={pretty(code)}
          onChange={(e) => {
            const v = clean(e.target.value);
            setCode(v);
            if (v.length === 8) validate(v);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          placeholder="XXXX-XXXX"
          aria-describedby="code-hint"
          className="h-20 w-full rounded-2xl border-2 bg-hoja text-center font-display text-4xl font-extrabold tracking-[0.15em] uppercase tabular outline-none placeholder:text-muted-foreground/40 focus-visible:border-foreground"
        />
        <p id="code-hint" className="text-sm text-muted-foreground">Se valida solo al completar los 8 caracteres.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" disabled={code.length !== 8 || pending} className="h-12 rounded-xl text-base font-semibold">
            {pending ? <Loader2 className="size-5 animate-spin" /> : "Validar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setCameraError(null); setScanning((s) => !s); }} className="h-12 gap-2 rounded-xl text-base">
            {scanning ? <CameraOff className="size-5" /> : <Camera className="size-5" />}
            {scanning ? "Cerrar cámara" : "Escanear QR"}
          </Button>
        </div>
      </form>

      <AnimatePresence initial={false}>
        {scanning ? (
          <motion.div key="scanner" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <QrScanner onCode={validate} onError={(m) => { setCameraError(m); setScanning(false); }} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {cameraError ? <p className="rounded-xl bg-muted px-3.5 py-3 text-sm">{cameraError}</p> : null}

      {history.length ? (
        <section className="grid gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">En este turno</h2>
          <ul className="divide-y rounded-2xl border bg-hoja text-sm">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="font-display font-bold tracking-wider tabular">{pretty(h.code)}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{h.outcome.promotion ?? h.outcome.title}</span>
                <span className={cn("shrink-0 font-medium", h.outcome.tone === "ok" ? "text-[#2f7d55] dark:text-[#5fbf8a]" : "text-almagra")}>
                  {h.outcome.tone === "ok" ? "Canjeado" : h.outcome.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular">{h.at}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ResultOverlay result={result} onClose={() => setResult(null)} />
    </div>
  );
}

const TONE = {
  ok: { bg: "bg-[#1f6b47]", icon: Check },
  warn: { bg: "bg-[#8a5a00]", icon: AlertTriangle },
  error: { bg: "bg-[#9b2f1f]", icon: X },
} as const;

/** Resultado a pantalla completa: se entiende de un vistazo desde el otro lado del mostrador. */
function ResultOverlay({ result, onClose }: { result: (RedeemOutcome & { code: string }) | null; onClose: () => void }) {
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, onClose]);

  return (
    <AnimatePresence>
      {result ? (
        <motion.div
          key={result.code + result.title}
          role="alertdialog"
          aria-live="assertive"
          aria-label={result.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className={cn("fixed inset-0 z-50 grid place-items-center px-6 text-white", TONE[result.tone].bg)}
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="grid w-full max-w-md justify-items-center gap-5 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
              className="grid size-24 place-items-center rounded-full bg-white/15"
            >
              {(() => { const Icon = TONE[result.tone].icon; return <Icon className="size-12" strokeWidth={3} />; })()}
            </motion.span>
            <h2 className="text-5xl font-extrabold">{result.title}</h2>
            {result.discount ? <DiscountTag discount={{ big: result.discount, caption: "" }} /> : null}
            {result.promotion ? <p className="text-xl font-semibold">{result.promotion}</p> : null}
            {result.detail ? <p className="text-lg text-white/85">{result.detail}</p> : null}
            {result.isNewCustomer ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-[#1f6b47]"
              >
                <Sparkles className="size-4" /> Cliente nuevo para tu cadena
              </motion.p>
            ) : null}
            <button onClick={onClose} className="mt-4 h-14 w-full rounded-2xl bg-white text-lg font-bold text-[#17201b] active:scale-[0.98]">
              Siguiente cliente
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
