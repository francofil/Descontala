// Fechas de calendario en hora de Madrid (las promos terminan "el día X" a las 23:59 de Sevilla).
const TZ = "Europe/Madrid";
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" de hoy (o de la fecha dada) en Madrid. */
export const madridDate = (d: Date = new Date()) => isoDay.format(d);

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Minutos de diferencia entre Madrid y UTC en un instante dado. */
function madridOffsetMinutes(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Convierte "YYYY-MM-DD" + "HH:mm" en hora de Madrid a un ISO UTC. */
export function madridToIso(day: string, time: string) {
  const guess = new Date(`${day}T${time}:00Z`);
  const offset = madridOffsetMinutes(guess);
  return new Date(guess.getTime() - offset * 60000).toISOString();
}

export const startOfMadridDay = (day: string) => madridToIso(day, "00:00");
export const endOfMadridDay = (day: string) => new Date(new Date(madridToIso(day, "23:59")).getTime() + 59_000).toISOString();

/** Próximo domingo (o hoy si es domingo). */
export function nextSunday(today: string) {
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
  return addDays(today, (7 - dow) % 7);
}
