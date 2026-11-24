"use client";

import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatCode } from "@/lib/format";

export type CodeSheetData = {
  code: string;
  title: string;
  chainName: string;
  expiresText: string;
  conditions?: string | null;
};

/** El código para enseñar en caja: QR y código grande sobre fondo blanco (escaneable también en modo oscuro). */
export function CodeSheet({ data, open, onOpenChange }: { data: CodeSheetData | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const chars = data ? formatCode(data.code).split("") : [];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl border-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
        {data ? (
          <div className="grid justify-items-center gap-5 pt-2 text-center">
            <div className="grid gap-1">
              <SheetTitle className="font-display text-xl font-bold">{data.title}</SheetTitle>
              <SheetDescription>Enséñalo en caja en {data.chainName}</SheetDescription>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-3xl bg-white p-5 shadow-[0_1px_0_rgb(0_0_0/0.04)] ring-1 ring-black/5"
            >
              <QRCodeSVG value={data.code} size={196} level="M" marginSize={0} fgColor="#17201b" bgColor="#ffffff" />
            </motion.div>

            <p className="flex font-display text-4xl font-extrabold tracking-wider tabular" aria-label={`Código ${data.code.split("").join(" ")}`}>
              {chars.map((c, i) => (
                <motion.span
                  key={`${c}-${i}`}
                  aria-hidden
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.12 + i * 0.035, type: "spring", stiffness: 400, damping: 26 }}
                  className={c === "-" ? "px-1 text-muted-foreground" : undefined}
                >
                  {c}
                </motion.span>
              ))}
            </p>

            <div className="grid gap-1 text-sm">
              <p className="font-medium">Un solo uso. {data.expiresText}.</p>
              {data.conditions ? <p className="text-muted-foreground">{data.conditions}</p> : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
