import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAgencyAccess } from "@/lib/auth/guards";
import { z } from "zod";
import { createAuditLog, getClientIp } from "@/lib/services/audit";
import { success, created, error, serverError } from "@/lib/api/response";
import { checkTeamLimit } from "@/lib/subscriptions/gates";
import { sendEmail } from "@/lib/services/email";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["member", "editor", "manager"]).default("member"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT atm.id, atm.role, atm.status, atm.invited_at, atm.accepted_at,
             u.id as user_id, u.name, u.email, u.image
      FROM agency_team_members atm
      JOIN users u ON u.id = atm.user_id
      WHERE atm.agency_id = ${id}
      ORDER BY atm.created_at ASC
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
    const { user } = authResult;

    const teamCheck = await checkTeamLimit(id);
    if (!teamCheck.allowed) {
      return Response.json({ error: "Team member limit reached for your plan", limit: teamCheck.limit }, { status: 403 });
    }

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const { email, role } = parsed.data;

    // Find user by email
    const userRows = await db.execute(
      sql`SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL`
    );
    const targetUser = (userRows as unknown as Array<Record<string, unknown>>)[0];
    if (!targetUser) return error("No user found with this email", 404);

    // Check if already a member
    const existing = await db.execute(sql`
      SELECT id FROM agency_team_members WHERE agency_id = ${id} AND user_id = ${targetUser.id}
    `);
    if ((existing as unknown as Array<unknown>).length > 0) {
      return error("User is already a team member", 409);
    }

    const rows = await db.execute(sql`
      INSERT INTO agency_team_members (agency_id, user_id, role, invited_by, status)
      VALUES (${id}, ${targetUser.id}, ${role}, ${user.id}, 'pending')
      RETURNING *
    `);

    // Role change deferred until invite is accepted
    // await db.execute(sql`
    //   UPDATE users SET role = 'agency_team_member' WHERE id = ${targetUser.id} AND role = 'user'
    // `);

    await createAuditLog({
      userId: user.id,
      action: "team_member_invited",
      entityType: "agency_team_member",
      entityId: id,
      newValues: { email, role },
      ipAddress: getClientIp(request),
    });

    // Send invitation email
    try {
      const agencyRows = await db.execute(sql`SELECT name FROM agencies WHERE id = ${id} LIMIT 1`);
      const agencyName = ((agencyRows as unknown as Array<Record<string, unknown>>)[0]?.name as string) || "an agency";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const dashboardUrl = `${baseUrl}/dashboard/team`;
      const inviterRows = await db.execute(sql`SELECT name FROM users WHERE id = ${user.id} LIMIT 1`);
      const inviterName = ((inviterRows as unknown as Array<Record<string, unknown>>)[0]?.name as string) || "A team admin";
      await sendEmail({
        to: email,
        subject: `You've been invited to join ${agencyName} on AgencyHub`,
        html: `
          <h2>Team Invitation</h2>
          <p>Hi,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${agencyName}</strong> as a <strong>${role}</strong> on AgencyHub.</p>
          <p><a href="${dashboardUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Invitation</a></p>
          <p>Or copy and paste: ${dashboardUrl}</p>
          <p>If you don't have an account yet, please sign up first with this email address.</p>
        `,
        text: `You've been invited to join ${agencyName} as a ${role}. View: ${dashboardUrl}`,
      });
    } catch (emailErr) {
      console.error("[TEAM] Failed to send invite email:", emailErr);
    }

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
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const memberId = searchParams.get("memberId");
    if (!memberId) return error("memberId query parameter required", 400);
    const neonSql = getNeonSql();

    // Get the user_id before deleting so we can revert their role
    const memberRows = await db.execute(sql`
      SELECT user_id FROM agency_team_members WHERE id = ${memberId} AND agency_id = ${id}
    `);
    const member = (memberRows as unknown as Array<Record<string, unknown>>)[0];
    const userId = member?.user_id as string | undefined;

    await db.execute(sql`
      DELETE FROM agency_team_members WHERE id = ${memberId} AND agency_id = ${id}
    `);

    // Revert the user's role back to 'user'
    if (userId) {
      await neonSql`
        UPDATE users SET role = 'user' WHERE id = ${userId}
      `;
    }

    await createAuditLog({
      userId: user.id,
      action: "team_member_removed",
      entityType: "agency_team_member",
      entityId: memberId,
      ipAddress: getClientIp(request),
    });

    return success({ message: "Team member removed" });
  } catch (err) {
    return serverError(err);
  }
}
