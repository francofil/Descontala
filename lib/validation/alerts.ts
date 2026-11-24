import { z } from "zod";

const ids = z.preprocess((v) => (v === undefined || v === "" ? [] : Array.isArray(v) ? v : [v]), z.array(z.guid()).max(50));

export const alertSchema = z.object({
  shoppingDay: z.coerce.number().int().min(0).max(6, "Elige un día"),
  radiusKm: z.coerce.number().min(0.5).max(15),
  categoryIds: ids,
  productIds: ids,
});

export type AlertInput = z.output<typeof alertSchema>;
