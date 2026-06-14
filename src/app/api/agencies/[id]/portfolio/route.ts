import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAgencyAccess } from "@/lib/auth/guards";
import { z } from "zod";
import { success, created, error, serverError } from "@/lib/api/response";
import { checkPortfolioLimit } from "@/lib/subscriptions/gates";

const portfolioSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().optional(),
  projectUrl: z.string().max(500).optional(),
  clientName: z.string().max(255).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT * FROM agency_portfolio WHERE agency_id = ${id} ORDER BY sort_order ASC, created_at DESC
    `);

    return success(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

    const portfolioCheck = await checkPortfolioLimit(id);
    if (!portfolioCheck.allowed) {
      return Response.json({ error: "Portfolio item limit reached for your plan", limit: portfolioCheck.limit }, { status: 403 });
    }

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = portfolioSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const data = parsed.data;
    const rows = await db.execute(sql`
      INSERT INTO agency_portfolio (agency_id, title, description, image_url, project_url, client_name, sort_order)
      VALUES (${id}, ${data.title}, ${data.description ?? null}, ${data.imageUrl ?? null},
              ${data.projectUrl ?? null}, ${data.clientName ?? null}, ${data.sortOrder ?? 0})
      RETURNING *
    `);

    return created((rows as unknown as Array<Record<string, unknown>>)[0]);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const itemId = searchParams.get("itemId");
    if (!itemId) return error("itemId query parameter required", 400);

    await db.execute(sql`DELETE FROM agency_portfolio WHERE id = ${itemId} AND agency_id = ${id}`);
    return success({ message: "Portfolio item deleted" });
  } catch (err) {
    return serverError(err);
  }
}
