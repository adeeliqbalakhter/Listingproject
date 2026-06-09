import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    if (!hasDb()) {
      return Response.json({ data: [] });
    }

    const db = getDb();

    // Check if table exists first
    const tableCheck = await db.execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') as exists`
    );
    const tableExists = (tableCheck as unknown as Array<{ exists: boolean }>)[0]?.exists;

    if (!tableExists) {
      // Create the table
      await db.execute(sql`
        CREATE TABLE "services" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "name" varchar(255) NOT NULL,
          "slug" varchar(255) NOT NULL UNIQUE,
          "description" text,
          "icon" varchar(50),
          "parent_id" uuid,
          "agency_count" integer DEFAULT 0,
          "sort_order" integer DEFAULT 0
        )
      `);
      return Response.json({ data: [], message: "Services table was missing and has been created. Run /api/setup to seed data." });
    }

    // Use raw SQL to query
    const rows = await db.execute(
      sql`SELECT id, name, slug FROM services ORDER BY name ASC`
    );

    return Response.json({ data: rows });
  } catch (error: unknown) {
    console.error("GET /api/services error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    return Response.json(
      { error: "Internal server error", details: msg, stack: stack?.split("\n").slice(0, 5) },
      { status: 500 }
    );
  }
}
