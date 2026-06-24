import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const { code, planTier } = body as { code?: string; planTier?: string };

    if (!code?.trim()) return error("Promo code is required", 400);

    const normalizedCode = code.trim().toUpperCase();

    const rows = await db.execute(sql`
      SELECT * FROM promo_codes
      WHERE code = ${normalizedCode}
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
    `);

    const promo = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!promo) return error("Invalid or expired promo code", 404);

    if (planTier) {
      const tiers = promo.applicable_tiers as string[];
      if (Array.isArray(tiers) && !tiers.includes(planTier)) {
        return error("This promo code is not applicable to the selected plan", 400);
      }
    }

    return success({
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: Number(promo.discount_value),
      description: promo.description,
      applicableTiers: promo.applicable_tiers,
    });
  } catch (err) {
    return serverError(err);
  }
}
