import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError, paginated } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "admin", "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const countResult = await db.execute(sql`SELECT count(*) as count FROM promo_codes`);
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    const rows = await db.execute(sql`
      SELECT pc.*, u.name as created_by_name, u.email as created_by_email
      FROM promo_codes pc
      LEFT JOIN users u ON pc.created_by = u.id
      ORDER BY pc.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return paginated(rows as unknown as Array<Record<string, unknown>>, { page, limit, total });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, applicableTiers } = body as {
      code?: string;
      description?: string;
      discountType?: string;
      discountValue?: number;
      maxUses?: number;
      validFrom?: string;
      validUntil?: string;
      applicableTiers?: string[];
    };

    if (!code?.trim()) return error("Promo code is required", 400);
    if (!discountType || !["percentage", "fixed"].includes(discountType)) {
      return error("Discount type must be 'percentage' or 'fixed'", 400);
    }
    if (!discountValue || discountValue <= 0) return error("Discount value must be positive", 400);
    if (discountType === "percentage" && discountValue > 100) {
      return error("Percentage discount cannot exceed 100%", 400);
    }

    const normalizedCode = code.trim().toUpperCase();

    const existing = await db.execute(sql`SELECT id FROM promo_codes WHERE code = ${normalizedCode}`);
    if ((existing as unknown as Array<Record<string, unknown>>).length > 0) {
      return error("Promo code already exists", 409);
    }

    const rows = await db.execute(sql`
      INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_from, valid_until, applicable_tiers, created_by)
      VALUES (
        ${normalizedCode},
        ${description ?? null},
        ${discountType},
        ${discountValue},
        ${maxUses ?? null},
        ${validFrom ? validFrom : sql`NOW()`},
        ${validUntil ?? null},
        ${JSON.stringify(applicableTiers ?? ["premium", "pro"])}::jsonb,
        ${authResult.user.id}
      )
      RETURNING *
    `);

    return success((rows as unknown as Array<Record<string, unknown>>)[0]);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const neonSql = getNeonSql();

    const body = await request.json();
    const { promoCodeId, isActive, maxUses, validUntil } = body as {
      promoCodeId?: string;
      isActive?: boolean;
      maxUses?: number;
      validUntil?: string;
    };

    if (!promoCodeId) return error("promoCodeId is required", 400);

    const updated = await neonSql`
      UPDATE promo_codes SET
        is_active = COALESCE(${isActive ?? null}::bool, is_active),
        max_uses = COALESCE(${maxUses ?? null}::int, max_uses),
        valid_until = COALESCE(${validUntil ?? null}::timestamptz, valid_until)
      WHERE id = ${promoCodeId}
      RETURNING *
    `;

    if (!updated[0]) return error("Promo code not found", 404);

    return success(updated[0]);
  } catch (err) {
    return serverError(err);
  }
}
