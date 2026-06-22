import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { success, error, serverError } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: slugOrId } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const rows = isUuid
      ? await db.execute(sql`
          SELECT id, name, slug, website, claim_status
          FROM agencies
          WHERE (slug = ${slugOrId} OR id = ${slugOrId}) AND deleted_at IS NULL
          LIMIT 1
        `)
      : await db.execute(sql`
          SELECT id, name, slug, website, claim_status
          FROM agencies
          WHERE slug = ${slugOrId} AND deleted_at IS NULL
          LIMIT 1
        `);
    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!agency) return error("Agency not found", 404);

    return success(agency);
  } catch (err) {
    return serverError(err);
  }
}
