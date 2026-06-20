import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { paginated, error, success, serverError } from "@/lib/api/response";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/services/email";
import { randomBytes } from "crypto";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const query = searchParams.get("query") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const conditions = [sql`u.deleted_at IS NULL`];
    if (query) {
      const pattern = `%${query}%`;
      conditions.push(sql`(u.name ILIKE ${pattern} OR u.email ILIKE ${pattern})`);
    }
    if (role) conditions.push(sql`u.role = ${role}`);
    if (status === "active") conditions.push(sql`u.is_active = true`);
    if (status === "inactive") conditions.push(sql`u.is_active = false`);

    const whereClause = sql.join(conditions, sql` AND `);

    const countQuery = sql`SELECT count(*) as count FROM users u WHERE ${whereClause}`;
    const dataQuery = sql`SELECT u.id, u.name, u.email, u.role, u.is_active, u.email_verified, u.last_login_at, u.login_count, u.created_at FROM users u WHERE ${whereClause} ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const countResult = await db.execute(countQuery);
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    const rows = await db.execute(dataQuery);

    return paginated(rows as unknown as Array<Record<string, unknown>>, { page, limit, total });
  } catch (err) {
    console.error("[ADMIN-USERS] Error:", err);
    return serverError(err);
  }
}

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(["user", "agency_owner", "admin", "super_admin"]),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const { name, email, role } = parsed.data;

    const existing = await db.execute(sql`SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL`);
    if ((existing as unknown as Array<unknown>).length > 0) {
      return error("A user with this email already exists", 409);
    }

    const inviteToken = randomBytes(32).toString("hex");
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const tempPassword = randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(tempPassword);

    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token TEXT`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ`);
    } catch { /* columns may already exist */ }

    const rows = await db.execute(sql`
      INSERT INTO users (name, email, password_hash, role, is_active, invite_token, invite_token_expires_at)
      VALUES (${name}, ${email}, ${passwordHash}, ${role}, true, ${inviteToken}, ${inviteExpiry.toISOString()})
      RETURNING id, name, email, role, is_active, created_at
    `);
    const newUser = (rows as unknown as Array<Record<string, unknown>>)[0];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://listingproject.vercel.app";
    const inviteUrl = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

    const roleLabel: Record<string, string> = {
      user: "User",
      agency_owner: "Agency Owner",
      admin: "Admin",
      super_admin: "Super Admin",
    };

    try {
      await sendEmail({
        to: email,
        subject: `You've been invited to AgencyHub as ${roleLabel[role] || role}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">AgencyHub</h1>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e3a5f;">Hi ${name},</p>
              <p style="color: #4b5563;">You've been invited to join <strong>AgencyHub</strong> as <strong>${roleLabel[role] || role}</strong>.</p>
              <p style="color: #4b5563;">Click the button below to set up your password and activate your account:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation & Set Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${inviteUrl}</p>
              <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px;">
                <p style="color: #9ca3af; font-size: 12px;">This invitation link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </div>
        `,
        text: `Hi ${name}, you've been invited to AgencyHub as ${roleLabel[role] || role}. Set up your account: ${inviteUrl} (expires in 7 days)`,
      });
    } catch (err) {
      console.error("[ADMIN-CREATE-USER] Email send error:", err);
    }

    return success({ user: newUser, inviteUrl, message: "User created and invitation email sent" }, 201);
  } catch (err) {
    console.error("[ADMIN-CREATE-USER] Error:", err);
    return serverError(err);
  }
}
