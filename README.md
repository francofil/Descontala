# Descontala

Las ofertas de los supermercados de barrio de Sevilla, con **condiciones y fecha de fin siempre a la vista**. Los clientes reciben un aviso antes de su compra habitual y canjean un código en caja; el supermercado publica promos en minutos y ve **cuántos clientes nuevos le trae cada una**. Cobro por canje, no cuota fija.

MVP de la asignatura *Creación de empresa* (Universidad Loyola Andalucía).

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 · shadcn/ui · Motion · Supabase (Postgres, Auth, RLS) · Leaflet + OpenStreetMap · Zod · Vercel.

---

## Guion de demo (3 minutos)

Antes de presentar: `pnpm db:reset` en local (o `pnpm exec supabase db reset --remote` en la nube) para empezar con datos limpios. Ten dos pestañas: una en móvil (o con el inspector a 390 px) y otra de escritorio.

| Tiempo | Quién | Qué hacer | Qué decir |
|---|---|---|---|
| 0:00 | Cliente | Login → botón **Cliente** (Lucía). | «Lucía hace la compra los miércoles. Hoy es la víspera.» |
| 0:15 | Cliente | Señalar el bloque amarillo **«Antes de tu compra de mañana»**. | «Solo ve ofertas de lo que suele comprar, a menos de 5 km. Y cada una dice cuándo termina: en las entrevistas era el dolor nº 1.» |
| 0:35 | Cliente | Bajar a la lista, tocar **Mapa**, volver a **Lista**. Filtrar por *Despensa*. | «Todo el barrio de un vistazo.» |
| 0:50 | Cliente | Abrir **25 % en aceite de oliva virgen extra** → **Obtener código**. | «Un código de un solo uso, con QR, que caduca con la promo.» |
| 1:10 | Cliente | (Opcional) **Buscar** → «aceite». | «Si busca un producto, el precio ya incluye la oferta: la tienda con −25 % sale la más barata.» |
| 1:25 | Súper | En la otra pestaña, login → **Supermercado** (Despensa Giralda) → **Caja**. Escribir el código de Lucía. | «La cajera lo teclea o escanea el QR.» |
| 1:40 | Súper | Pantalla verde: **Código válido · Cliente nuevo para tu cadena**. Volver a teclearlo → **Ya se usó**. | «La validación es en servidor, dentro de una transacción: no hay doble canje posible.» |
| 2:00 | Súper | **Resultados**: la cifra de **Clientes nuevos** ha subido en 1; el gráfico de hoy tiene una barra ámbar más. | «Esto es lo que hoy no saben: si sus promos traen gente nueva. Y cuánto les cuesta cada cliente nuevo.» |
| 2:25 | Súper | **Promociones → Nueva**: elegir producto, tipo y «Hasta el domingo» → **Publicar**. | «Sin imprenta ni buzoneo. El aviso dice cuántos segundos ha tardado.» |
| 2:50 | — | Cierre. | «Pagan solo por canje: 0,35 € por cliente que entra por la puerta.» |

---

## Levantar en local

Requisitos: Node 20+, pnpm y **Docker Desktop abierto**.

```bash
pnpm install
pnpm db:start                 # Supabase local en Docker (la primera vez descarga imágenes)
pnpm db:reset                 # migraciones + seed de demo
cp .env.example .env.local    # rellénalo con: pnpm exec supabase status
pnpm dev                      # http://localhost:3000
```

Si tras muchos cambios algo se ve sin estilos o una ruta nueva da 404 en desarrollo: para `pnpm dev`, borra `.next` y vuelve a arrancar.

## Variables de entorno

| Variable | Para qué | ¿Pública? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave `sb_publishable_…`. Los datos los protege RLS | Sí |
| `SUPABASE_SECRET_KEY` | Clave `sb_secret_…`. Solo servidor: el admin la usa para crear usuarios merchant | **No** |
| `NEXT_PUBLIC_DEMO_MODE` | `false` oculta los botones de cuentas de demo en el login | Sí |

## Usuarios de demo

Contraseña de todos: **`Demo1234!`**

| Email | Rol | Notas |
|---|---|---|
| `usuario@demo.com` | Cliente (Lucía) | Su día de compra es siempre *mañana*, así que ve el aviso |
| `cadena1@demo.com` | Supermercado · Despensa Giralda | La cadena del guion |
| `cadena2@demo.com` | Supermercado · Súper Alameda | |
| `cadena3@demo.com` | Supermercado · El Cesto de Triana | |
| `admin@demo.com` | Admin | Ve cadenas y da de alta supermercados |

Las cadenas son ficticias; las tiendas están en barrios reales (Triana, Nervión, Sevilla Este, Macarena, Los Remedios…). El seed genera fechas relativas a hoy: varias promos vigentes, alguna que termina hoy o mañana, otras programadas y 14 días de histórico para los gráficos.

---

## Desplegar gratis (Supabase + Vercel)

### 1. Supabase (base de datos y auth)

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan Free, región Europa). Guarda la contraseña de la base de datos.
2. Enlázalo y sube migraciones y seed:
   ```bash
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <REF_DEL_PROYECTO>
   pnpm exec supabase db push --include-seed
   ```
3. En el panel de Supabase:
   - **Authentication → Sign In / Providers → Email**: desactiva *Confirm email* (así el registro de la demo entra directo).
   - **Project Settings → API Keys**: copia la *publishable key* y la *secret key*.

### 2. Vercel (la web)

1. Sube el repositorio a GitHub e impórtalo en [vercel.com](https://vercel.com) (plan Hobby). Detecta Next.js solo.
2. En **Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`.
3. **Deploy**.
4. Vuelve a Supabase → **Authentication → URL Configuration** y pon la URL de Vercel como *Site URL*.

Para dejar la demo limpia en la nube antes de presentar: `pnpm exec supabase db reset --remote` (borra y recrea todo con el seed).

> El proyecto Free de Supabase se pausa tras una semana sin uso: ábrelo desde el panel el día antes de la presentación.

---

## Tests

```bash
pnpm test:db   # pgTAP (40): canje — doble canje, caducado, otra cadena, límite, tienda —, clientes nuevos y RLS por rol
pnpm test      # Vitest (21): formato, precio con oferta, fechas de Madrid y canje concurrente real contra Supabase local
pnpm lint && pnpm build
```

## Seguridad

- **RLS en todas las tablas**: el cliente solo ve sus códigos, guardados y avisos; el supermercado solo gestiona y mide su cadena; el admin, todo. Un usuario no puede cambiarse el rol (permisos por columna).
- **Códigos**: 8 caracteres de un alfabeto sin ambigüedades (sin 0/O/1/I), 40 bits de azar criptográfico (`gen_random_bytes`), un solo uso, caducan con la promo y como máximo uno activo por usuario y promo (índice único parcial).
- **Canje solo en servidor**: la función SQL `redeem_code` bloquea las filas (`FOR UPDATE`) y comprueba vigencia, cadena, tienda y `max_redemptions` en una única transacción. El test de integración lanza dos cajas a la vez: solo una canjea.
- **Rate limiting** en BD para generar códigos (10/min), canjear (30/min) y eventos.
- La clave secreta solo existe en el servidor (`lib/supabase/admin.ts`, `server-only`) y solo se usa tras comprobar que quien llama es admin.
- Validación con Zod en todas las server actions y en `/api/redeem`. Cabeceras de seguridad básicas en `next.config.ts`.

## Estructura

```
app/                  UI y rutas: (auth), (consumer), (merchant)/panel, (admin)/admin, api/redeem
components/           brand, promo, consumer, merchant, map, admin, ui (shadcn)
lib/services/         lógica de negocio (sesión, promos, códigos, canje, métricas, avisos, admin)
lib/repositories/     acceso a datos (Supabase)
lib/validation/       schemas Zod
lib/supabase/         clientes (navegador, servidor, admin), proxy y tipos generados (pnpm db:types)
supabase/migrations/  schema, RLS, funciones SQL y consultas
supabase/seed.sql     datos de demo
supabase/tests/       pgTAP
tests/                Vitest (unitarios e integración)
```

## Fuera de alcance

Scraping o integración con grandes cadenas, pagos reales y facturación, app nativa y notificaciones push (los avisos se ven dentro de la app). El coste mostrado al supermercado es una estimación: canjes × tarifa configurable (`merchant_settings`).
