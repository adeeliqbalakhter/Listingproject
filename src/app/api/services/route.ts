import { hasDb, getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    if (!hasDb()) {
      return Response.json({ data: [] });
    }

    const db = getDb();
    const list = await db.select().from(services).orderBy(asc(services.name));
    return Response.json({ data: list });
  } catch (error: unknown) {
    console.error("GET /api/services error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Internal server error", details: msg }, { status: 500 });
  }
}
