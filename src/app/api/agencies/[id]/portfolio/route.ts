import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAgencyAccess } from "@/lib/auth/guards";
import { z } from "zod";
import { success, created, error, serverError } from "@/lib/api/response";
import { checkPortfolioLimit } from "@/lib/subscriptions/gates";

const portfolioSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().optional(),
  projectUrl: z.string().max(500).optional(),
  clientName: z.string().max(255).optional(),
  clientLogo: z.string().optional(),
  projectSchedule: z.string().max(255).optional(),
  projectSize: z.string().max(100).optional(),
  challenge: z.string().max(5000).optional(),
  approach: z.string().max(5000).optional(),
  results: z.string().max(5000).optional(),
  servicesProvided: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
}).passthrough();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT * FROM agency_portfolio WHERE agency_id = ${id} AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC
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
      INSERT INTO agency_portfolio (
        agency_id, title, description, image_url, project_url, client_name, client_logo,
        project_schedule, project_size, challenge, approach, results, services_provided, sort_order
      ) VALUES (
        ${id}, ${data.title}, ${data.description ?? null}, ${data.imageUrl ?? null},
        ${data.projectUrl ?? null}, ${data.clientName ?? null}, ${data.clientLogo ?? null},
        ${data.projectSchedule ?? null}, ${data.projectSize ?? null},
        ${data.challenge ?? null}, ${data.approach ?? null}, ${data.results ?? null},
        ${data.servicesProvided ?? null}, ${data.sortOrder ?? 0}
      ) RETURNING *
    `);

    return created((rows as unknown as Array<Record<string, unknown>>)[0]);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const itemId = body.itemId;
    if (!itemId) return error("itemId required", 400);

    const parsed = portfolioSchema.partial().safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const data = parsed.data;
    await db.execute(sql`
      UPDATE agency_portfolio SET
        title = COALESCE(${data.title ?? null}, title),
        description = COALESCE(${data.description ?? null}, description),
        image_url = COALESCE(${data.imageUrl ?? null}, image_url),
        project_url = COALESCE(${data.projectUrl ?? null}, project_url),
        client_name = COALESCE(${data.clientName ?? null}, client_name),
        client_logo = COALESCE(${data.clientLogo ?? null}, client_logo),
        project_schedule = COALESCE(${data.projectSchedule ?? null}, project_schedule),
        project_size = COALESCE(${data.projectSize ?? null}, project_size),
        challenge = COALESCE(${data.challenge ?? null}, challenge),
        approach = COALESCE(${data.approach ?? null}, approach),
        results = COALESCE(${data.results ?? null}, results),
        services_provided = COALESCE(${data.servicesProvided ?? null}, services_provided),
        sort_order = COALESCE(${data.sortOrder ?? null}, sort_order)
      WHERE id = ${itemId} AND agency_id = ${id}
    `);

    const updated = await db.execute(sql`SELECT * FROM agency_portfolio WHERE id = ${itemId}`);
    return success((updated as unknown as Array<Record<string, unknown>>)[0]);
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

    await db.execute(sql`UPDATE agency_portfolio SET deleted_at = NOW() WHERE id = ${itemId} AND agency_id = ${id}`);
    return success({ message: "Portfolio item deleted" });
  } catch (err) {
    return serverError(err);
  }
}
