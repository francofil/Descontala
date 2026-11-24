"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pending,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn("h-12 w-full rounded-xl text-base font-semibold", className)}
      {...props}
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-label="Cargando" /> : children}
    </Button>
  );
}
