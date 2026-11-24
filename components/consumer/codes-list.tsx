"use client";

import { useState } from "react";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { CodeSheet, type CodeSheetData } from "@/components/promo/code-sheet";
import { DiscountTag } from "@/components/promo/discount-tag";
import { EndsBadge } from "@/components/promo/ends-badge";
import { ChainName } from "@/components/promo/chain-name";
import { formatCode } from "@/lib/format";
import type { MyCode } from "@/lib/services/codes";

export function ActiveCodes({ codes }: { codes: MyCode[] }) {
  const [selected, setSelected] = useState<CodeSheetData | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <ul className="grid gap-3">
        {codes.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                setSelected({ code: c.code, title: c.title, chainName: c.chain?.name ?? "", conditions: c.conditions, expiresText: c.ends.text.replace("Válida hasta", "Caduca") });
                setOpen(true);
              }}
              className="grid w-full gap-3 rounded-2xl border bg-hoja p-4 text-left transition-transform active:scale-[0.985]"
            >
              <div className="flex items-start justify-between gap-3">
                <DiscountTag discount={c.discount} size="sm" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                  <QrCode className="size-4" aria-hidden />
                  Mostrar
                </span>
              </div>
              <div>
                <p className="font-semibold">{c.title}</p>
                {c.chain ? <ChainName name={c.chain.name} color={c.chain.color} /> : null}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-lg font-bold tracking-wider tabular">{formatCode(c.code)}</span>
                <EndsBadge ends={c.ends} />
              </div>
            </button>
          </li>
        ))}
      </ul>
      <CodeSheet data={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PastCodes({ codes }: { codes: MyCode[] }) {
  return (
    <ul className="divide-y rounded-2xl border bg-hoja">
      {codes.map((c) => (
        <li key={c.id}>
          <Link href={`/promo/${c.promotionId}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{c.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {c.status === "redeemed" ? c.redeemedLabel : "Caducó sin usar"}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {c.status === "redeemed" ? "Usado" : "Caducado"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
