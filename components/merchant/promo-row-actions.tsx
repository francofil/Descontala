"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePromotionAction, setStatusAction } from "@/app/(merchant)/panel/actions";
import type { PromoState } from "@/lib/services/merchant-promotions";

export function PromoRowActions({ id, state }: { id: string; state: PromoState }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const canPause = state === "live" || state === "upcoming";
  const canResume = state === "paused";

  const toggle = () =>
    start(async () => {
      const res = await setStatusAction(id, canPause ? "pausada" : "activa");
      if (!res.ok) toast.error("No se pudo cambiar el estado.");
      else toast.success(canPause ? "Promoción pausada" : "Promoción activada");
      router.refresh();
    });

  const remove = () => {
    if (!confirm("¿Borrar esta promoción? No se puede deshacer.")) return;
    start(async () => {
      const res = await deletePromotionAction(id);
      if (!res.ok) toast.error(res.message ?? "No se pudo borrar.");
      else toast.success("Promoción borrada");
      router.refresh();
    });
  };

  return (
    <details className="relative">
      <summary aria-label="Acciones" className="grid size-9 cursor-pointer list-none place-items-center rounded-full text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
        <MoreHorizontal className="size-5" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 grid w-44 gap-0.5 rounded-xl border bg-popover p-1 text-sm shadow-lg">
        {state !== "ended" ? (
          <Link href={`/panel/promos/${id}/editar`} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
            <Pencil className="size-4" /> Editar
          </Link>
        ) : null}
        {canPause || canResume ? (
          <button disabled={pending} onClick={toggle} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted">
            {canPause ? <Pause className="size-4" /> : <Play className="size-4" />}
            {canPause ? "Pausar" : "Activar"}
          </button>
        ) : null}
        <button disabled={pending} onClick={remove} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-almagra hover:bg-almagra/10">
          <Trash2 className="size-4" /> Borrar
        </button>
      </div>
    </details>
  );
}
