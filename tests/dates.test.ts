import { describe, expect, it } from "vitest";
import { addDays, endOfMadridDay, madridDate, madridToIso, nextSunday, startOfMadridDay } from "@/lib/dates";

describe("fechas en hora de Madrid", () => {
  it("invierno (UTC+1)", () => {
    expect(madridToIso("2026-11-24", "00:00")).toBe("2026-11-23T23:00:00.000Z");
    expect(endOfMadridDay("2026-11-29")).toBe("2026-11-29T22:59:59.000Z");
  });
  it("verano (UTC+2)", () => {
    expect(startOfMadridDay("2026-07-15")).toBe("2026-07-14T22:00:00.000Z");
  });
  it("día del cambio de hora de octubre", () => {
    expect(endOfMadridDay("2026-10-25")).toBe("2026-10-25T22:59:59.000Z");
  });
  it("la fecha de Madrid no es la UTC a última hora", () => {
    expect(madridDate(new Date("2026-11-24T23:30:00Z"))).toBe("2026-11-25");
  });
  it("sumar días y próximo domingo", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(nextSunday("2026-11-24")).toBe("2026-11-29");
    expect(nextSunday("2026-11-29")).toBe("2026-11-29");
  });
});
