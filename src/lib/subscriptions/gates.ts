import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface PlanLimits {
  tier: string;
  monthlyLeadCredits: number;
  maxPortfolioItems: number;
  maxTeamMembers: number;
  features: Record<string, boolean>;
}

export interface TierCapabilities {
  maxLocations: number;
  maxServiceTags: number;
  maxIndustryTags: number;
  maxPortfolioItems: number;
  maxTeamMembers: number;
  analyticsWindowDays: number;
  coverImage: boolean;
  packages: boolean;
  teamShowcase: boolean;
  verifiedBadge: boolean;
  featuredBadge: boolean;
  prioritySearch: boolean;
  leadNotifications: boolean;
  monthlyReport: boolean;
  apiAccess: boolean;
  brandedQuoteForm: boolean;
  socialLinks: boolean;
  searchBoost: number;
}

const TIER_CAPABILITIES: Record<string, TierCapabilities> = {
  free: {
    maxLocations: 1,
    maxServiceTags: 5,
    maxIndustryTags: 5,
    maxPortfolioItems: 5,
    maxTeamMembers: 1,
    analyticsWindowDays: 30,
    coverImage: false,
    packages: false,
    teamShowcase: false,
    verifiedBadge: false,
    featuredBadge: false,
    prioritySearch: false,
    leadNotifications: false,
    monthlyReport: false,
    apiAccess: false,
    brandedQuoteForm: false,
    socialLinks: false,
    searchBoost: 0,
  },
  premium: {
    maxLocations: -1,
    maxServiceTags: -1,
    maxIndustryTags: -1,
    maxPortfolioItems: -1,
    maxTeamMembers: 5,
    analyticsWindowDays: -1,
    coverImage: true,
    packages: true,
    teamShowcase: true,
    verifiedBadge: true,
    featuredBadge: false,
    prioritySearch: true,
    leadNotifications: true,
    monthlyReport: true,
    apiAccess: false,
    brandedQuoteForm: false,
    socialLinks: true,
    searchBoost: 1,
  },
  pro: {
    maxLocations: -1,
    maxServiceTags: -1,
    maxIndustryTags: -1,
    maxPortfolioItems: -1,
    maxTeamMembers: -1,
    analyticsWindowDays: -1,
    coverImage: true,
    packages: true,
    teamShowcase: true,
    verifiedBadge: true,
    featuredBadge: true,
    prioritySearch: true,
    leadNotifications: true,
    monthlyReport: true,
    apiAccess: true,
    brandedQuoteForm: true,
    socialLinks: true,
    searchBoost: 2,
  },
  enterprise: {
    maxLocations: -1,
    maxServiceTags: -1,
    maxIndustryTags: -1,
    maxPortfolioItems: -1,
    maxTeamMembers: -1,
    analyticsWindowDays: -1,
    coverImage: true,
    packages: true,
    teamShowcase: true,
    verifiedBadge: true,
    featuredBadge: true,
    prioritySearch: true,
    leadNotifications: true,
    monthlyReport: true,
    apiAccess: true,
    brandedQuoteForm: true,
    socialLinks: true,
    searchBoost: 3,
  },
};

export function getTierCapabilities(tier: string): TierCapabilities {
  return TIER_CAPABILITIES[tier] ?? TIER_CAPABILITIES.free;
}

export async function getAgencyTier(agencyId: string): Promise<string> {
  try {
    if (!hasDb()) return "free";
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT p.tier FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.agency_id = ${agencyId} AND s.status = 'active'
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    return (row?.tier as string) ?? "free";
  } catch {
    return "free";
  }
}

export async function getAgencyCapabilities(agencyId: string): Promise<TierCapabilities> {
  const tier = await getAgencyTier(agencyId);
  return getTierCapabilities(tier);
}

export function canUseTierFeature(
  capabilities: TierCapabilities,
  feature: keyof TierCapabilities
): boolean {
  const val = capabilities[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return false;
}

export function checkTierLimit(
  capabilities: TierCapabilities,
  resource: "maxLocations" | "maxServiceTags" | "maxIndustryTags" | "maxPortfolioItems" | "maxTeamMembers",
  currentCount: number
): { allowed: boolean; limit: number } {
  const limit = capabilities[resource];
  if (limit === -1) return { allowed: true, limit: -1 };
  return { allowed: currentCount < limit, limit };
}

const FREE_DEFAULTS: PlanLimits = {
  tier: "free",
  monthlyLeadCredits: 1,
  maxPortfolioItems: 5,
  maxTeamMembers: 1,
  features: { basicProfile: true, reviews: true, basicAnalytics: true },
};

export async function getAgencyPlanLimits(agencyId: string): Promise<PlanLimits> {
  try {
    if (!hasDb()) return FREE_DEFAULTS;
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT p.tier, p.monthly_lead_credits, p.max_portfolio_items, p.max_team_members, p.features
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.agency_id = ${agencyId} AND s.status = 'active'
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return FREE_DEFAULTS;
    return {
      tier: row.tier as string,
      monthlyLeadCredits: Number(row.monthly_lead_credits),
      maxPortfolioItems: Number(row.max_portfolio_items),
      maxTeamMembers: Number(row.max_team_members),
      features: (typeof row.features === 'string' ? JSON.parse(row.features) : row.features) as Record<string, boolean>,
    };
  } catch {
    return FREE_DEFAULTS;
  }
}

export async function checkPortfolioLimit(agencyId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getAgencyPlanLimits(agencyId);
  if (limits.maxPortfolioItems === -1) return { allowed: true, current: 0, limit: -1 };
  try {
    if (!hasDb()) return { allowed: true, current: 0, limit: limits.maxPortfolioItems };
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT count(*) as count FROM agency_portfolio WHERE agency_id = ${agencyId} AND deleted_at IS NULL
    `);
    const current = Number((rows as unknown as Array<{ count: string }>)[0]?.count ?? 0);
    return { allowed: current < limits.maxPortfolioItems, current, limit: limits.maxPortfolioItems };
  } catch {
    return { allowed: true, current: 0, limit: limits.maxPortfolioItems };
  }
}

export async function checkTeamLimit(agencyId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getAgencyPlanLimits(agencyId);
  if (limits.maxTeamMembers === -1) return { allowed: true, current: 0, limit: -1 };
  try {
    if (!hasDb()) return { allowed: true, current: 0, limit: limits.maxTeamMembers };
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT count(*) as count FROM agency_team_members WHERE agency_id = ${agencyId} AND status = 'active'
    `);
    const current = Number((rows as unknown as Array<{ count: string }>)[0]?.count ?? 0);
    return { allowed: current < limits.maxTeamMembers, current, limit: limits.maxTeamMembers };
  } catch {
    return { allowed: true, current: 0, limit: limits.maxTeamMembers };
  }
}

export async function hasFeature(agencyId: string, feature: string): Promise<boolean> {
  const limits = await getAgencyPlanLimits(agencyId);
  return limits.features[feature] === true;
}
