# Descontala

Las ofertas de los supermercados de barrio de Sevilla, con condiciones y fecha de fin siempre a la vista. MVP de la asignatura *Creación de empresa* (Universidad Loyola Andalucía).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · shadcn/ui · Motion · Supabase (Postgres, Auth y RLS) · Leaflet + OpenStreetMap · Zod · Vercel.

## Levantar en local

Requisitos: Node 20+, pnpm y Docker Desktop abierto.

```bash
pnpm install
pnpm db:start        # Supabase local en Docker (la primera vez descarga imágenes)
pnpm db:reset        # aplica migraciones + seed de demo
cp .env.example .env.local   # y rellena con: pnpm exec supabase status
pnpm dev             # http://localhost:3000
```

## Variables de entorno

| Variable | Dónde se usa | Pública |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública `sb_publishable_…` (RLS protege los datos) | Sí |
| `SUPABASE_SECRET_KEY` | Clave secreta `sb_secret_…`, solo servidor (crear usuarios merchant) | **No** |
| `NEXT_PUBLIC_DEMO_MODE` | `false` oculta los botones de cuentas de demo en el login | Sí |

## Usuarios de demo

Contraseña de todos: **`Demo1234!`**

| Email | Rol | Qué ve |
|---|---|---|
| `usuario@demo.com` | Cliente (Lucía) | Promos, búsqueda, códigos y avisos. Su día de compra es siempre *mañana*. |
| `cadena1@demo.com` | Supermercado · Despensa Giralda | Panel, promos y caja |
| `cadena2@demo.com` | Supermercado · Súper Alameda | Panel, promos y caja |
| `cadena3@demo.com` | Supermercado · El Cesto de Triana | Panel, promos y caja |
| `admin@demo.com` | Admin | Cadenas y alta de merchants |

## Tests

```bash
pnpm test:db   # pgTAP: canje (doble canje, caducado, otra cadena, límite), clientes nuevos y RLS
```

## Estructura

```
app/                 UI y rutas: (auth), (consumer), (merchant)/panel, (admin)/admin
lib/services/        lógica de negocio
lib/repositories/    acceso a datos (Supabase)
lib/validation/      schemas Zod
lib/supabase/        clientes (navegador, servidor, admin), proxy y tipos generados
supabase/migrations/ schema, RLS y funciones SQL (canje, códigos, métricas)
supabase/seed.sql    datos de demo con fechas relativas a hoy
supabase/tests/      tests pgTAP
```

> El guion de demo de 3 minutos y las instrucciones de despliegue llegan en la Fase 5.
