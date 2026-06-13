import { NextRequest } from "next/server";
import { runMigrations } from "@/lib/db/migrate";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    // Allow CI/CD bypass via MIGRATION_SECRET
    const authHeader = request.headers.get("authorization");
    const migrationSecret = process.env.MIGRATION_SECRET;
    const hasSecretBypass = migrationSecret && authHeader === `Bearer ${migrationSecret}`;

    if (!hasSecretBypass) {
      // Default path: require super_admin role
      const authResult = await requireRole(request, "super_admin");
      if ("error" in authResult) return authResult.error;
    }

    const result = await runMigrations();
    return success(result);
  } catch (err) {
    return serverError(err);
  }
}
