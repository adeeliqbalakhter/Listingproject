import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { runMigrations } from "@/lib/db/migrate";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

async function isFirstTimeSetup(): Promise<boolean> {
  if (!hasDb()) return true;
  try {
    const rows = await getDb().execute(sql`SELECT id FROM users LIMIT 1`);
    return (rows as unknown as Array<unknown>).length === 0;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const migrationSecret = process.env.MIGRATION_SECRET;
    const hasSecretBypass = migrationSecret && authHeader === `Bearer ${migrationSecret}`;
    const firstTime = await isFirstTimeSetup();

    if (!hasSecretBypass && !firstTime) {
      const authResult = await requireRole(request, "super_admin");
      if ("error" in authResult) return authResult.error;
    }

    const result = await runMigrations();
    return success(result);
  } catch (err) {
    return serverError(err);
  }
}
