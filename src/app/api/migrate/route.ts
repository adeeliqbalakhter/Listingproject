import { NextRequest } from "next/server";
import { runMigrations } from "@/lib/db/migrate";
import { success, error, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const migrationSecret = process.env.MIGRATION_SECRET;

    if (migrationSecret && authHeader !== `Bearer ${migrationSecret}`) {
      return error("Unauthorized", 401);
    }

    const result = await runMigrations();
    return success(result);
  } catch (err) {
    return serverError(err);
  }
}
