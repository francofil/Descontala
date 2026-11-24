import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");
const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional().transform((v) => (v ? v : undefined));
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(String(v).replace(",", "."))),
  z.number({ error: "Escribe un número" }).optional(),
);

export const PROMO_TYPES = ["porcentaje", "2x1", "3x2", "segunda_unidad", "precio_fijo"] as const;

export const promoFormSchema = z
  .object({
    id: z.guid().optional().or(z.literal("").transform(() => undefined)),
    productId: z.guid().optional().or(z.literal("").transform(() => undefined)),
    title: optionalText(90),
    type: z.enum(PROMO_TYPES, { error: "Elige un tipo de oferta" }),
    value: optionalNumber,
    conditions: optionalText(300),
    startDate: day,
    endDate: day,
    storeIds: z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.guid()).min(1, "Elige al menos una tienda")),
    maxRedemptions: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : Number(v)),
      z.number().int("Número entero").min(1, "Mínimo 1").max(100_000).optional(),
    ),
    status: z.enum(["activa", "borrador"]).default("activa"),
  })
  .superRefine((d, ctx) => {
    if (!d.productId && (!d.title || d.title.length < 3)) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Elige un producto o escribe un título" });
    }
    const needs = d.type === "porcentaje" || d.type === "segunda_unidad" || d.type === "precio_fijo";
    if (needs && d.value === undefined) {
      ctx.addIssue({ code: "custom", path: ["value"], message: d.type === "precio_fijo" ? "Escribe el precio de oferta" : "Escribe el porcentaje" });
    }
    if (d.type === "porcentaje" && d.value !== undefined && (d.value < 1 || d.value > 90)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Entre 1 y 90 %" });
    }
    if (d.type === "segunda_unidad" && d.value !== undefined && (d.value < 1 || d.value > 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Entre 1 y 100 %" });
    }
    if (d.type === "precio_fijo" && d.value !== undefined && (d.value <= 0 || d.value > 10_000)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Precio no válido" });
    }
    if (d.endDate < d.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Debe ser igual o posterior al inicio" });
    }
  })
  .transform((d) => ({ ...d, value: needsValue(d.type) ? d.value! : null }));

function needsValue(type: (typeof PROMO_TYPES)[number]) {
  return type === "porcentaje" || type === "segunda_unidad" || type === "precio_fijo";
}

export type PromoFormInput = z.output<typeof promoFormSchema>;

export const redeemSchema = z.object({
  code: z
    .string()
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .pipe(z.string().length(8, "El código tiene 8 caracteres")),
  storeId: z.guid("Tienda no válida"),
});

export const promoStatusSchema = z.object({
  id: z.guid(),
  status: z.enum(["activa", "pausada"]),
});
