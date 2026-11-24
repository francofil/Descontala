import "server-only";
import { createClient } from "@/lib/supabase/server";
import { deleteSaved, insertSaved } from "@/lib/repositories/saved";
import { trackEvent } from "@/lib/repositories/promotions";
import { promoIdSchema } from "@/lib/validation/promotions";
import { requireRole } from "./session";

export async function setSaved(rawPromotionId: string, save: boolean) {
  const promotionId = promoIdSchema.parse(rawPromotionId);
  const user = await requireRole("consumer");
  const db = await createClient();
  if (save) {
    await insertSaved(db, user.id, promotionId);
    await trackEvent(db, promotionId, "save");
  } else {
    await deleteSaved(db, user.id, promotionId);
  }
}
