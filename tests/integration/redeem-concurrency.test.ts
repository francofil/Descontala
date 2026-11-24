/**
 * Integración contra el Supabase local (pnpm db:start). Comprueba la condición de carrera
 * real: dos cajas validan el mismo código a la vez y solo una puede canjearlo.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
const isLocal = !!URL && /127\.0\.0\.1|localhost/.test(URL);

const PROMO = "e0000000-0000-0000-0000-000000000004"; // 3x2 naranjas, Despensa Giralda, todas sus tiendas
const STORE_TRIANA = "50000000-0000-0000-0000-000000000001";
const STORE_NERVION = "50000000-0000-0000-0000-000000000002";

const client = () => createClient(URL!, ANON!, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email: string, password: string) {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

describe.skipIf(!isLocal || !SECRET)("canje concurrente (Supabase local)", () => {
  const admin = isLocal && SECRET ? createClient(URL!, SECRET, { auth: { persistSession: false } }) : null;
  const email = `carrera-${Date.now()}@test.local`;
  const password = "Test1234!x";
  let userId = "";
  let consumer: SupabaseClient;
  let cashierA: SupabaseClient;
  let cashierB: SupabaseClient;

  beforeAll(async () => {
    const { data, error } = await admin!.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
    consumer = await signIn(email, password);
    // Dos sesiones independientes del mismo comercio = dos cajas.
    [cashierA, cashierB] = await Promise.all([signIn("cadena1@demo.com", "Demo1234!"), signIn("cadena1@demo.com", "Demo1234!")]);
  });

  afterAll(async () => {
    if (userId) await admin!.auth.admin.deleteUser(userId);
  });

  it("pedir el código dos veces a la vez devuelve el mismo", async () => {
    const [a, b] = await Promise.all([
      consumer.rpc("generate_code", { p_promotion_id: PROMO }),
      consumer.rpc("generate_code", { p_promotion_id: PROMO }),
    ]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    expect(a.data.code).toBe(b.data.code);
  });

  it("dos cajas validando a la vez: solo una canjea", async () => {
    const { data } = await consumer.rpc("generate_code", { p_promotion_id: PROMO });
    const code: string = data.code;

    const results = await Promise.all([
      cashierA.rpc("redeem_code", { p_code: code, p_store_id: STORE_TRIANA }),
      cashierB.rpc("redeem_code", { p_code: code, p_store_id: STORE_NERVION }),
    ]);
    const outcomes = results.map((r) => (r.data as { result: string }).result).sort();
    expect(outcomes).toEqual(["ok", "ya_usado"]);

    const { data: rows } = await admin!.from("redemption_codes").select("status").eq("code", code);
    expect(rows).toEqual([{ status: "redeemed" }]);
  });

  it("es cliente nuevo la primera vez en la cadena", async () => {
    const { data } = await admin!
      .from("redemption_facts")
      .select("is_new_customer")
      .eq("user_id", userId);
    expect(data).toEqual([{ is_new_customer: true }]);
  });
});
