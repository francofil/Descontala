import "server-only";
import type { DbClient } from "@/lib/supabase/server";

export async function findProfileById(db: DbClient, id: string) {
  const { data, error } = await db
    .from("profiles")
    .select("id, role, display_name, chain_id, chains(name, color)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
