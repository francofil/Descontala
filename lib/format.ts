// Formato de cifras, descuentos y fechas (es-ES, hora de Madrid). Funciones puras.

export type PromoType = "porcentaje" | "2x1" | "3x2" | "segunda_unidad" | "precio_fijo";

const TZ = "Europe/Madrid";
const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const dayMonth = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, day: "numeric", month: "short" });
const weekday = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, weekday: "long" });
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const time = new Intl.DateTimeFormat("es-ES", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

export const formatPrice = (value: number) => eur.format(value);

export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${num.format(km)} km`;
}

export type Discount = { big: string; caption: string };

export function discountLabel(type: PromoType, value: number | null): Discount {
  switch (type) {
    case "porcentaje":
      return { big: `−${num.format(value ?? 0)} %`, caption: "de descuento" };
    case "segunda_unidad":
      return { big: `−${num.format(value ?? 0)} %`, caption: "en la 2.ª unidad" };
    case "precio_fijo":
      return { big: formatPrice(value ?? 0), caption: "precio de oferta" };
    case "2x1":
      return { big: "2x1", caption: "llevas 2, pagas 1" };
    case "3x2":
      return { big: "3x2", caption: "llevas 3, pagas 2" };
  }
}

export const PROMO_TYPE_LABELS: Record<PromoType, string> = {
  porcentaje: "Porcentaje",
  "2x1": "2x1",
  "3x2": "3x2",
  segunda_unidad: "2.ª unidad",
  precio_fijo: "Precio fijo",
};

/** Días naturales (Madrid) entre hoy y la fecha dada. */
export function daysFromToday(date: Date, now: Date = new Date()) {
  const a = Date.parse(isoDay.format(now));
  const b = Date.parse(isoDay.format(date));
  return Math.round((b - a) / 86_400_000);
}

export type EndsLabel = { text: string; urgent: boolean };

/** "Termina hoy" / "Termina mañana" destacados; si no, "Válida hasta el 30 nov". */
export function endsLabel(endsAt: string | Date, now: Date = new Date()): EndsLabel {
  const end = new Date(endsAt);
  if (end <= now) return { text: "Terminada", urgent: false };
  const d = daysFromToday(end, now);
  if (d <= 0) return { text: `Termina hoy a las ${time.format(end)}`, urgent: true };
  if (d === 1) return { text: "Termina mañana", urgent: true };
  if (d < 7) return { text: `Válida hasta el ${weekday.format(end)}`, urgent: false };
  return { text: `Válida hasta el ${dayMonth.format(end)}`, urgent: false };
}

export function startsLabel(startsAt: string | Date, now: Date = new Date()) {
  const d = daysFromToday(new Date(startsAt), now);
  if (d === 1) return "Empieza mañana";
  return `Empieza el ${dayMonth.format(new Date(startsAt))}`;
}

export const formatDayMonth = (d: string | Date) => dayMonth.format(new Date(d));
export const formatDateTime = (d: string | Date) =>
  `${dayMonth.format(new Date(d))}, ${time.format(new Date(d))}`;

/** Código en formato legible: ABCD-EFGH. */
export const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

export const unitLabel = (unit: string) => (unit === "kg" ? "/kg" : unit === "l" ? "/l" : "");

/**
 * Precio efectivo por unidad con la oferta aplicada.
 * En 2x1/3x2/2.ª unidad es el precio medio por unidad comprando el lote mínimo.
 */
export function effectiveUnitPrice(price: number, type: PromoType, value: number | null) {
  switch (type) {
    case "porcentaje":
      return { price: price * (1 - (value ?? 0) / 100), note: null };
    case "precio_fijo":
      return { price: Math.min(price, value ?? price), note: null };
    case "2x1":
      return { price: price / 2, note: "c/u llevando 2" };
    case "3x2":
      return { price: (price * 2) / 3, note: "c/u llevando 3" };
    case "segunda_unidad":
      return { price: price * (1 - (value ?? 0) / 200), note: "c/u llevando 2" };
  }
}
