import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    if (!hasDb()) {
      return Response.json({ error: "No database" }, { status: 503 });
    }

    const db = getDb();

    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );

    const tableNames = (tables as unknown as Array<{ table_name: string }>).map((t) => t.table_name);

    const schema: Record<string, string[]> = {};
    for (const t of tableNames) {
      const cols = await db.execute(
        sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = ${t} ORDER BY ordinal_position`
      );
      schema[t] = (cols as unknown as Array<{ column_name: string; data_type: string; is_nullable: string }>).map(
        (c) => `${c.column_name} (${c.data_type}${c.is_nullable === "YES" ? ", nullable" : ""})`
      );
    }

    return Response.json({ tables: tableNames, schema });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return Response.json({ error: msg }, { status: 500 });
  }
}
