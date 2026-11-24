import { z } from "zod";

export const createMerchantSchema = z
  .object({
    email: z.email("Escribe un email válido").trim().toLowerCase().max(254),
    password: z.string().min(8, "Mínimo 8 caracteres").max(128),
    displayName: z.string().trim().min(2, "Escribe un nombre").max(80),
    chainId: z.guid().optional().or(z.literal("").transform(() => undefined)),
    newChainName: z.string().trim().max(80).optional().transform((v) => (v ? v : undefined)),
  })
  .superRefine((d, ctx) => {
    if (!d.chainId && !d.newChainName) {
      ctx.addIssue({ code: "custom", path: ["chainId"], message: "Elige una cadena o escribe el nombre de una nueva" });
    }
    if (d.newChainName && d.newChainName.length < 2) {
      ctx.addIssue({ code: "custom", path: ["newChainName"], message: "Nombre demasiado corto" });
    }
  });

export type CreateMerchantInput = z.output<typeof createMerchantSchema>;
