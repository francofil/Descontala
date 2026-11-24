import { z } from "zod";

// guid(): acepta cualquier UUID con formato válido (los del seed no son v4).
export const promoIdSchema = z.guid("Promoción no válida");

export const locationSchema = z.object({
  lat: z.number().min(36).max(38.5),   // Andalucía occidental, de sobra para Sevilla
  lng: z.number().min(-7.5).max(-4.5),
});

export const searchQuerySchema = z.string().trim().min(2).max(60);
