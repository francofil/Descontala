"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Bookmark, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { generateCodeAction, setSavedAction } from "@/app/(consumer)/actions";
import { Button } from "@/components/ui/button";
import { endsLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CodeSheet, type CodeSheetData } from "./code-sheet";

type Props = {
  promotionId: string;
  title: string;
  chainName: string;
  conditions: string | null;
  canRedeem: boolean;
  isLoggedIn: boolean;
  initialSaved: boolean;
  initialCode: { code: string; status: string; expiresAt: string } | null;
};

export function PromoActions(props: Props) {
  const [saved, setSaved] = useState(props.initialSaved);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [code, setCode] = useState(props.initialCode?.status === "active" ? props.initialCode : null);
  const [open, setOpen] = useState(false);
  const [pendingCode, startCode] = useTransition();
  const [, startSave] = useTransition();

  const used = props.initialCode?.status === "redeemed";
  const loginHref = `/login?next=${encodeURIComponent(`/promo/${props.promotionId}`)}`;

  const toggleSave = () => {
    const next = !saved;
    startSave(async () => {
      setOptimisticSaved(next);
      const res = await setSavedAction(props.promotionId, next);
      if (res.ok) {
        setSaved(next);
        if (next) toast.success("Guardada en tus ofertas");
      } else {
        toast.error("No se pudo guardar. Inténtalo de nuevo.");
      }
    });
  };

  const getCode = () => {
    if (code) return setOpen(true);
    startCode(async () => {
      const res = await generateCodeAction(props.promotionId);
      if (!res.ok) return void toast.error(res.message);
      setCode({ code: res.code, status: "active", expiresAt: res.expiresAt });
      setOpen(true);
    });
  };

  const sheetData: CodeSheetData | null = code
    ? {
        code: code.code,
        title: props.title,
        chainName: props.chainName,
        conditions: props.conditions,
        expiresText: endsLabel(code.expiresAt).text.replace("Válida hasta", "Caduca"),
      }
    : null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-5 pb-3">
        <div className="mx-auto flex max-w-md gap-2 rounded-2xl border bg-background/90 p-2 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-lg">
          {props.isLoggedIn ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={toggleSave}
                aria-pressed={optimisticSaved}
                aria-label={optimisticSaved ? "Quitar de guardadas" : "Guardar"}
                className="h-12 w-12 shrink-0 rounded-xl"
              >
                <motion.span
                  key={String(optimisticSaved)}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                >
                  <Bookmark className={cn("size-5", optimisticSaved && "fill-albero text-albero-ink dark:text-albero")} />
                </motion.span>
              </Button>
              {used ? (
                <Button disabled className="h-12 flex-1 rounded-xl text-base font-semibold">Ya la canjeaste</Button>
              ) : (
                <Button
                  type="button"
                  onClick={getCode}
                  disabled={!props.canRedeem || pendingCode}
                  className="h-12 flex-1 gap-2 rounded-xl text-base font-semibold"
                >
                  {pendingCode ? <Loader2 className="size-5 animate-spin" /> : <QrCode className="size-5" />}
                  {!props.canRedeem ? "No disponible" : code ? "Ver mi código" : "Obtener código"}
                </Button>
              )}
            </>
          ) : (
            <Button render={<Link href={loginHref} />} nativeButton={false} className="h-12 flex-1 gap-2 rounded-xl text-base font-semibold">
              <QrCode className="size-5" />
              Entra para obtener el código
            </Button>
          )}
        </div>
      </div>
      <CodeSheet data={sheetData} open={open} onOpenChange={setOpen} />
    </>
  );
}
