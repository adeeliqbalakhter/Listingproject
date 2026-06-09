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
  } catch (error) {
    console.error("GET /api/services error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
