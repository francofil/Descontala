import { NextResponse, type NextRequest } from "next/server";
import { redeemSchema } from "@/lib/validation/merchant";
import { redeem } from "@/lib/services/redeem";
import { getCurrentUser } from "@/lib/services/session";

/**
 * POST /api/redeem { code, storeId }
 * La validación real (doble canje, caducidad, cadena, límite, rate limit) ocurre
 * en la función SQL redeem_code, dentro de una transacción con bloqueo de filas.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "merchant" && user.role !== "admin")) {
    return NextResponse.json({ tone: "error", title: "Sin permiso" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ tone: "error", title: "Petición no válida" }, { status: 400 });
  }
  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { tone: "error", title: "Código no válido", detail: parsed.error.issues[0]?.message },
      { status: 422 },
    );
  }

  try {
    const outcome = await redeem(parsed.data.code, parsed.data.storeId);
    return NextResponse.json(outcome, { status: 200 });
  } catch (e) {
    console.error("redeem", e);
    return NextResponse.json({ tone: "error", title: "Error al validar", detail: "Inténtalo de nuevo." }, { status: 500 });
  }
}
