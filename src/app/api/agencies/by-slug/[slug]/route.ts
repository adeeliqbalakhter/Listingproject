import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return Response.json({ error: "Slug is required" }, { status: 400 });
  }

  if (!hasDb()) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const db = getDb();
  const rows = await db.execute(
    sql`SELECT id, name, slug FROM agencies WHERE slug = ${slug} AND deleted_at IS NULL LIMIT 1`
  );
  const agency = (rows as unknown as Array<Record<string, unknown>>)[0];

  if (!agency) {
    return Response.json({ error: "Agency not found" }, { status: 404 });
  }

  return Response.json({ data: agency });
}
