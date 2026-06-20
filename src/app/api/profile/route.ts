import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { updateProfileSchema } from "@/lib/validations/auth";
import { createAuditLog, getClientIp } from "@/lib/services/audit";
import { success, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.role, u.image, u.email_verified, u.created_at,
             up.bio, up.phone, up.company_name, up.job_title, up.website, up.avatar_url, up.timezone, up.language
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = ${user.id}
    `);

    return success((rows as unknown as Array<Record<string, unknown>>)[0] || null);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const data = parsed.data;

    if (data.name) {
      await db.execute(sql`UPDATE users SET name = ${data.name}, updated_at = NOW() WHERE id = ${user.id}`);
    }

    // Upsert profile — only update fields explicitly provided in the request body
    // This allows clearing nullable fields by sending null
    type SqlChunk = ReturnType<typeof sql>;
    const insertCols: SqlChunk[] = [sql`user_id`];
    const insertVals: SqlChunk[] = [sql`${user.id}`];
    const updateClauses: SqlChunk[] = [];

    const profileFields: Array<{ key: string; column: string; value: unknown }> = [
      { key: "bio", column: "bio", value: data.bio },
      { key: "phone", column: "phone", value: data.phone },
      { key: "companyName", column: "company_name", value: data.companyName },
      { key: "jobTitle", column: "job_title", value: data.jobTitle },
      { key: "website", column: "website", value: data.website },
      { key: "avatarUrl", column: "avatar_url", value: data.avatarUrl },
      { key: "timezone", column: "timezone", value: data.timezone },
      { key: "language", column: "language", value: data.language },
    ];

    for (const field of profileFields) {
      insertCols.push(sql.raw(field.column));
      if (field.key in data) {
        insertVals.push(sql`${field.value ?? null}`);
        updateClauses.push(sql`${sql.raw(field.column)} = EXCLUDED.${sql.raw(field.column)}`);
      } else {
        insertVals.push(sql`NULL`);
      }
    }

    insertCols.push(sql`updated_at`);
    insertVals.push(sql`NOW()`);
    updateClauses.push(sql`updated_at = NOW()`);

    await db.execute(sql`
      INSERT INTO user_profiles (${sql.join(insertCols, sql`, `)})
      VALUES (${sql.join(insertVals, sql`, `)})
      ON CONFLICT (user_id) DO UPDATE SET
        ${sql.join(updateClauses, sql`, `)}
    `);

    await createAuditLog({
      userId: user.id,
      action: "profile_updated",
      entityType: "user_profile",
      entityId: user.id,
      newValues: data as Record<string, unknown>,
      ipAddress: getClientIp(request),
    });

    const rows = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.role, u.image,
             up.bio, up.phone, up.company_name, up.job_title, up.website, up.avatar_url, up.timezone, up.language
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = ${user.id}
    `);

    return success((rows as unknown as Array<Record<string, unknown>>)[0]);
  } catch (err) {
    return serverError(err);
  }
}
