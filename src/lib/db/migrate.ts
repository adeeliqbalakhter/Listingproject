import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  if (!hasDb()) throw new Error("DATABASE_URL is not set");
  const db = getDb();

  // ─── Extend user_role enum ───
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'agency_owner', 'agency_team_member', 'client', 'admin', 'super_admin');
      ELSE
        BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agency_team_member'; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client'; EXCEPTION WHEN duplicate_object THEN NULL; END;
      END IF;
    END $$;
  `);

  // ─── Ensure users table has needed columns ───
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // ─── Refresh tokens ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      device_info JSONB,
      ip_address VARCHAR(45),
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)`);

  // ─── OTP tokens ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(6) NOT NULL,
      type VARCHAR(30) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_otp_tokens_user_type ON otp_tokens(user_id, type)`);

  // ─── Email verification tokens ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Password reset tokens ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Login history ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS login_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      device_type VARCHAR(30),
      location TEXT,
      status VARCHAR(20) NOT NULL,
      failure_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id)`);

  // ─── Device sessions ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS device_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_fingerprint TEXT NOT NULL,
      device_name TEXT,
      device_type VARCHAR(30),
      ip_address VARCHAR(45),
      last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
      is_current BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions(user_id)`);

  // ─── Permissions ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      resource VARCHAR(50) NOT NULL,
      action VARCHAR(30) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Role permissions ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role VARCHAR(30) NOT NULL,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role, permission_id)
    )
  `);

  // ─── User profiles ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      phone VARCHAR(50),
      company_name VARCHAR(255),
      job_title VARCHAR(255),
      website VARCHAR(500),
      avatar_url TEXT,
      timezone VARCHAR(100),
      language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Agency team members ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agency_team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'member',
      permissions JSONB DEFAULT '[]',
      invited_by UUID REFERENCES users(id),
      invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
      accepted_at TIMESTAMP,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(agency_id, user_id)
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_agency_team_agency ON agency_team_members(agency_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_agency_team_user ON agency_team_members(user_id)`);

  // ─── Notifications ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`);

  // ─── Notification preferences ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      email_new_lead BOOLEAN DEFAULT true,
      email_new_review BOOLEAN DEFAULT true,
      email_lead_response BOOLEAN DEFAULT true,
      email_team_invite BOOLEAN DEFAULT true,
      email_agency_approved BOOLEAN DEFAULT true,
      email_weekly_digest BOOLEAN DEFAULT true,
      in_app_new_lead BOOLEAN DEFAULT true,
      in_app_new_review BOOLEAN DEFAULT true,
      in_app_lead_response BOOLEAN DEFAULT true,
      in_app_team_invite BOOLEAN DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Files / uploads (DB-based storage) ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size INTEGER NOT NULL,
      data TEXT NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id)`);

  // ─── Lead activity logs ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lead_activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      action VARCHAR(50) NOT NULL,
      details JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity_logs(lead_id)`);

  // ─── Review reports ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS review_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      reporter_id UUID NOT NULL REFERENCES users(id),
      reason VARCHAR(100) NOT NULL,
      details TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      resolved_by UUID REFERENCES users(id),
      resolved_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Agency portfolio ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agency_portfolio (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image_url TEXT,
      project_url TEXT,
      client_name VARCHAR(255),
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_portfolio_agency ON agency_portfolio(agency_id)`);

  // ─── SEO metadata ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seo_metadata (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_path VARCHAR(500) NOT NULL UNIQUE,
      title VARCHAR(70),
      description VARCHAR(160),
      og_image TEXT,
      canonical_url TEXT,
      robots VARCHAR(100),
      structured_data JSONB,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Audit logs (was missing!) ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID,
      old_values JSONB,
      new_values JSONB,
      ip_address VARCHAR(45),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);

  // ─── Search logs (was missing!) ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS search_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query TEXT,
      filters JSONB,
      results_count INTEGER,
      user_id UUID,
      ip_address VARCHAR(45),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Ensure review_responses table exists (defined in Drizzle, may not be in DB) ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS review_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Ensure review_votes table exists ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS review_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      is_helpful BOOLEAN NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Ensure lead_assignments table exists ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lead_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'sent' NOT NULL,
      credits_used INTEGER DEFAULT 1,
      viewed_at TIMESTAMP,
      responded_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Ensure messages table exists ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_assignment_id UUID NOT NULL REFERENCES lead_assignments(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // ─── Unique constraint for analytics upsert ───
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agency_analytics_daily (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      profile_views INTEGER DEFAULT 0,
      search_impressions INTEGER DEFAULT 0,
      website_clicks INTEGER DEFAULT 0,
      phone_clicks INTEGER DEFAULT 0,
      email_clicks INTEGER DEFAULT 0,
      lead_requests INTEGER DEFAULT 0,
      UNIQUE(agency_id, date)
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_analytics_agency_date ON agency_analytics_daily(agency_id, date)`);
  // If table already existed without the constraint, add it
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE agency_analytics_daily ADD CONSTRAINT uq_analytics_agency_date UNIQUE (agency_id, date);
    EXCEPTION WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
    END $$;
  `);

  // ─── Seed RBAC permissions ───
  await seedPermissions(db);

  return { success: true, message: "All migrations and seeds completed" };
}

async function seedPermissions(db: ReturnType<typeof getDb>) {
  const perms = [
    { name: "users.read", resource: "users", action: "read" },
    { name: "users.create", resource: "users", action: "create" },
    { name: "users.update", resource: "users", action: "update" },
    { name: "users.delete", resource: "users", action: "delete" },
    { name: "users.manage", resource: "users", action: "manage" },
    { name: "agencies.read", resource: "agencies", action: "read" },
    { name: "agencies.create", resource: "agencies", action: "create" },
    { name: "agencies.update", resource: "agencies", action: "update" },
    { name: "agencies.delete", resource: "agencies", action: "delete" },
    { name: "agencies.manage", resource: "agencies", action: "manage" },
    { name: "agencies.approve", resource: "agencies", action: "approve" },
    { name: "reviews.read", resource: "reviews", action: "read" },
    { name: "reviews.create", resource: "reviews", action: "create" },
    { name: "reviews.update", resource: "reviews", action: "update" },
    { name: "reviews.delete", resource: "reviews", action: "delete" },
    { name: "reviews.moderate", resource: "reviews", action: "moderate" },
    { name: "leads.read", resource: "leads", action: "read" },
    { name: "leads.create", resource: "leads", action: "create" },
    { name: "leads.update", resource: "leads", action: "update" },
    { name: "leads.manage", resource: "leads", action: "manage" },
    { name: "admin.read", resource: "admin", action: "read" },
    { name: "admin.manage", resource: "admin", action: "manage" },
    { name: "analytics.read", resource: "analytics", action: "read" },
    { name: "files.create", resource: "files", action: "create" },
    { name: "files.read", resource: "files", action: "read" },
    { name: "files.delete", resource: "files", action: "delete" },
    { name: "files.manage", resource: "files", action: "manage" },
    { name: "notifications.read", resource: "notifications", action: "read" },
    { name: "notifications.manage", resource: "notifications", action: "manage" },
    { name: "team_members.manage", resource: "team_members", action: "manage" },
    { name: "billing.manage", resource: "billing", action: "manage" },
    { name: "content.manage", resource: "content", action: "manage" },
    { name: "seo.manage", resource: "seo", action: "manage" },
  ];

  for (const p of perms) {
    await db.execute(sql`
      INSERT INTO permissions (name, resource, action, description)
      VALUES (${p.name}, ${p.resource}, ${p.action}, ${p.name})
      ON CONFLICT (name) DO NOTHING
    `);
  }

  const rolePermMap: Record<string, string[]> = {
    super_admin: perms.map((p) => p.name),
    admin: [
      "users.read", "users.update", "agencies.read", "agencies.update", "agencies.approve",
      "reviews.read", "reviews.moderate", "leads.read", "admin.read",
      "analytics.read", "files.manage", "notifications.manage", "content.manage", "seo.manage",
    ],
    agency_owner: [
      "agencies.create", "agencies.read", "agencies.update", "agencies.delete",
      "reviews.read", "leads.read", "leads.update", "team_members.manage",
      "analytics.read", "billing.manage", "notifications.read", "files.create", "files.read", "files.delete",
    ],
    agency_team_member: [
      "agencies.read", "agencies.update", "leads.read", "leads.update",
      "reviews.read", "analytics.read", "notifications.read", "files.create", "files.read",
    ],
    client: [
      "agencies.read", "reviews.create", "reviews.read", "reviews.update", "reviews.delete",
      "leads.create", "leads.read", "notifications.read", "files.create", "files.read",
    ],
    user: ["agencies.read", "reviews.read", "notifications.read"],
  };

  for (const [role, permNames] of Object.entries(rolePermMap)) {
    for (const permName of permNames) {
      await db.execute(sql`
        INSERT INTO role_permissions (role, permission_id)
        SELECT ${role}, id FROM permissions WHERE name = ${permName}
        ON CONFLICT DO NOTHING
      `);
    }
  }
}
