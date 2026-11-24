import "server-only";
import { cookies } from "next/headers";
import { LOCATION_COOKIE, SEVILLA_CENTRO } from "@/lib/location";
import { locationSchema } from "@/lib/validation/promotions";

export type UserLocation = { lat: number; lng: number; precise: boolean };

export async function getUserLocation(): Promise<UserLocation> {
  const raw = (await cookies()).get(LOCATION_COOKIE)?.value;
  if (raw) {
    const [lat, lng] = raw.split(",").map(Number);
    const parsed = locationSchema.safeParse({ lat, lng });
    if (parsed.success) return { ...parsed.data, precise: true };
  }
  return { ...SEVILLA_CENTRO, precise: false };
}
