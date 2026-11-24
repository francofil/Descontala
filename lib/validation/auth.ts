import { z } from "zod";

const email = z.email("Escribe un email válido").trim().toLowerCase().max(254);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña").max(128),
  next: z
    .string()
    .regex(/^\/(?!\/)[\w\-/?=&%.]*$/, "Ruta no válida") // solo rutas internas
    .optional()
    .catch(undefined),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email,
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
