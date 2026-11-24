import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";
import { homeForRole, type Role } from "@/lib/roles";

const MERCHANT_PREFIX = "/panel";
const ADMIN_PREFIX = "/admin";
const CONSUMER_PRIVATE = ["/codigos", "/avisos"];
const AUTH_PAGES = ["/login", "/registro"];

/** Refresca la sesión y hace las comprobaciones optimistas de acceso por rol. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims valida el JWT; no confiar en getSession() en servidor.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const path = request.nextUrl.pathname;

  const needsMerchant = path.startsWith(MERCHANT_PREFIX);
  const needsAdmin = path.startsWith(ADMIN_PREFIX);
  const needsLogin = needsMerchant || needsAdmin || CONSUMER_PRIVATE.some((p) => path.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));

  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = to === "/login" ? `?next=${encodeURIComponent(path)}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!userId) {
    return needsLogin ? redirectTo("/login") : response;
  }

  if (needsMerchant || needsAdmin || isAuthPage || path === "/") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
    const role = (profile?.role ?? "consumer") as Role;

    if (isAuthPage) return redirectTo(homeForRole(role));
    if (path === "/" && role !== "consumer") return redirectTo(homeForRole(role));
    if (needsAdmin && role !== "admin") return redirectTo(homeForRole(role));
    if (needsMerchant && role !== "merchant" && role !== "admin") return redirectTo(homeForRole(role));
  }

  return response;
}
