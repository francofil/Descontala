import { describe, expect, it } from "vitest";
import { discountLabel, effectiveUnitPrice, endsLabel, formatCode, formatDistance } from "@/lib/format";

// Fecha fija: martes 24 nov 2026, 10:00 en Madrid (09:00 UTC).
const NOW = new Date("2026-11-24T09:00:00Z");

describe("endsLabel", () => {
  it("destaca las que terminan hoy", () => {
    const l = endsLabel("2026-11-24T22:59:00Z", NOW);
    expect(l.urgent).toBe(true);
    expect(l.text).toBe("Termina hoy a las 23:59");
  });
  it("destaca las que terminan mañana (hora de Madrid, no UTC)", () => {
    expect(endsLabel("2026-11-25T22:30:00Z", NOW)).toEqual({ text: "Termina mañana", urgent: true });
  });
  it("usa el día de la semana si es esta semana", () => {
    expect(endsLabel("2026-11-28T20:00:00Z", NOW).text).toBe("Válida hasta el sábado");
  });
  it("usa la fecha si es más lejos", () => {
    expect(endsLabel("2026-12-10T20:00:00Z", NOW).text).toBe("Válida hasta el 10 dic");
  });
  it("marca las terminadas", () => {
    expect(endsLabel("2026-11-23T20:00:00Z", NOW)).toEqual({ text: "Terminada", urgent: false });
  });
});

describe("discountLabel", () => {
  it("formatea cada tipo en español", () => {
    expect(discountLabel("porcentaje", 25).big).toBe("−25 %");
    expect(discountLabel("2x1", null).big).toBe("2x1");
    expect(discountLabel("segunda_unidad", 50).caption).toBe("en la 2.ª unidad");
    expect(discountLabel("precio_fijo", 1.49).big).toBe("1,49\u00a0€"); // espacio duro, como Intl
  });
});

describe("effectiveUnitPrice", () => {
  it("aplica el porcentaje", () => expect(effectiveUnitPrice(8, "porcentaje", 25).price).toBe(6));
  it("2x1 sale a mitad por unidad", () => expect(effectiveUnitPrice(4.5, "2x1", null)).toEqual({ price: 2.25, note: "c/u llevando 2" }));
  it("3x2 sale a dos tercios", () => expect(effectiveUnitPrice(3, "3x2", null).price).toBe(2));
  it("2.ª unidad al 50 % es un 25 % de media", () => expect(effectiveUnitPrice(4, "segunda_unidad", 50).price).toBe(3));
  it("precio fijo nunca sube el precio", () => expect(effectiveUnitPrice(1.2, "precio_fijo", 1.49).price).toBe(1.2));
});

describe("otros formatos", () => {
  it("código legible", () => expect(formatCode("ABCD2345")).toBe("ABCD-2345"));
  it("distancias", () => {
    expect(formatDistance(0.33)).toBe("350 m");
    expect(formatDistance(1.24)).toBe("1,2 km");
  });
});
