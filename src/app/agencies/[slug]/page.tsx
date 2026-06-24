import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  MapPin,
  Globe,
  ExternalLink,
  BadgeCheck,
  Users,
  Calendar,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Link2,
  AtSign,
  Share2,
  ChevronRight,
  Building2,
  Wrench,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ReviewForm } from "@/components/review-form";
import { PortfolioSection } from "@/components/portfolio-section";
import { PricingSnapshot } from "@/components/agencies/PricingSnapshot";
import { ReviewInsights } from "@/components/agencies/ReviewInsights";
import { ReviewsBrowser } from "@/components/agencies/ReviewsBrowser";
import { LocationMap } from "@/components/agencies/LocationMap";
import { PackagesSection } from "@/components/agencies/PackagesSection";
import { Languages as LanguagesIcon, Globe2 } from "lucide-react";
import { TrackProfileView, TrackClick } from "@/components/analytics/TrackEvent";

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function fetchAgencyBySlug(slug: string) {
  if (!hasDb()) return null;
  const db = getDb();
  const rows = await db.execute(
    sql`SELECT * FROM agencies WHERE slug = ${slug} LIMIT 1`
  );
  return (rows as any[])[0] ?? null;
}

async function fetchServices(agencyId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT s.name, s.slug FROM services s JOIN agency_services as2 ON s.id = as2.service_id WHERE as2.agency_id = ${agencyId}`
    );
    return rows as unknown as { name: string; slug: string }[];
  } catch {
    return [];
  }
}

async function fetchIndustries(agencyId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT i.name, i.slug FROM industries i JOIN agency_industries ai ON i.id = ai.industry_id WHERE ai.agency_id = ${agencyId}`
    );
    return rows as unknown as { name: string; slug: string }[];
  } catch {
    return [];
  }
}

async function fetchReviews(agencyId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT r.*, u.name as user_name, u.image as user_image
          FROM reviews r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.agency_id = ${agencyId} AND r.status = 'approved' AND r.deleted_at IS NULL
          ORDER BY r.created_at DESC LIMIT 50`
    );
    const reviewRows = rows as any[];
    if (reviewRows.length === 0) return [];

    try {
      const reviewIds = reviewRows.map((r: any) => r.id as string);
      const idList = sql.join(reviewIds.map((id: string) => sql`${id}`), sql`, `);
      const responses = await db.execute(sql`
        SELECT rr.*, a.name as agency_name
        FROM review_responses rr
        LEFT JOIN agencies a ON a.user_id = rr.user_id
        WHERE rr.review_id IN (${idList})
        ORDER BY rr.created_at ASC
      `);
      const respArr = responses as any[];
      const byReview = new Map<string, any[]>();
      for (const resp of respArr) {
        if (!byReview.has(resp.review_id)) byReview.set(resp.review_id, []);
        byReview.get(resp.review_id)!.push(resp);
      }
      return reviewRows.map((r: any) => ({ ...r, review_responses: byReview.get(r.id) || [] }));
    } catch {
      return reviewRows.map((r: any) => ({ ...r, review_responses: [] }));
    }
  } catch {
    return [];
  }
}

async function fetchCountryName(countryId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT name FROM countries WHERE id = ${countryId} LIMIT 1`
    );
    return ((rows as any[])[0]?.name as string) ?? null;
  } catch {
    return null;
  }
}

async function fetchCountryCode(countryId: string): Promise<string | null> {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT code FROM countries WHERE id = ${countryId} LIMIT 1`
    );
    return ((rows as any[])[0]?.code as string) ?? null;
  } catch {
    return null;
  }
}

async function fetchCityName(cityId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT name FROM cities WHERE id = ${cityId} LIMIT 1`
    );
    return ((rows as any[])[0]?.name as string) ?? null;
  } catch {
    return null;
  }
}

async function fetchPortfolio(agencyId: string) {
  try {
    const db = getDb();
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
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS client_logo TEXT`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS project_schedule VARCHAR(255)`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS project_size VARCHAR(100)`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS challenge TEXT`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS approach TEXT`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS results TEXT`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS services_provided TEXT`);
    await db.execute(sql`ALTER TABLE agency_portfolio ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);

    const rows = await db.execute(
      sql`SELECT * FROM agency_portfolio WHERE agency_id = ${agencyId} AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC`
    );
    return rows as any[];
  } catch (err) {
    console.error("[AGENCY-PROFILE] fetchPortfolio error:", err);
    return [];
  }
}

async function resolveIndustryFocus(items: IndustryFocusItem[]): Promise<IndustryFocusItem[]> {
  if (items.length === 0) return [];
  try {
    const db = getDb();
    const ids = items.map((i) => i.industryId);
    const idList = sql.join(ids.map((id) => sql`${id}`), sql`, `);
    const rows = await db.execute(sql`SELECT id, name FROM industries WHERE id IN (${idList})`);
    const nameMap = new Map<string, string>();
    for (const r of rows as any[]) nameMap.set(r.id, r.name);
    return items
      .map((i) => ({ ...i, industryName: nameMap.get(i.industryId) || undefined }))
      .filter((i) => i.industryName);
  } catch {
    return [];
  }
}

async function resolveServiceFocus(items: ServiceFocusItem[]): Promise<ServiceFocusItem[]> {
  if (items.length === 0) return [];
  try {
    const db = getDb();
    const ids = items.map((i) => i.serviceId);
    const idList = sql.join(ids.map((id) => sql`${id}`), sql`, `);
    const rows = await db.execute(sql`SELECT id, name FROM services WHERE id IN (${idList})`);
    const nameMap = new Map<string, string>();
    for (const r of rows as any[]) nameMap.set(r.id, r.name);
    return items
      .map((i) => ({ ...i, serviceName: nameMap.get(i.serviceId) || undefined }))
      .filter((i) => i.serviceName);
  } catch {
    return [];
  }
}

async function fetchSimilarAgencies(agencyId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT a.slug, a.name, a.tagline, a.logo, a.average_rating, a.total_reviews,
                 co.name AS country_name, ci.name AS city_name
          FROM agencies a
          LEFT JOIN countries co ON a.country_id = co.id
          LEFT JOIN cities ci ON a.city_id = ci.id
          WHERE a.status = 'active' AND a.deleted_at IS NULL AND a.id != ${agencyId}
          ORDER BY a.average_rating DESC NULLS LAST
          LIMIT 3`
    );
    const result = [];
    for (const row of rows as any[]) {
      try {
        const svcRows = await db.execute(
          sql`SELECT s.name FROM services s JOIN agency_services asvc ON s.id = asvc.service_id WHERE asvc.agency_id = ${row.id} LIMIT 3`
        );
        result.push({
          slug: row.slug,
          name: row.name,
          tagline: row.tagline,
          logo: row.logo,
          averageRating: row.average_rating ? Number(row.average_rating) : null,
          totalReviews: row.total_reviews ?? 0,
          location: [row.city_name, row.country_name].filter(Boolean).join(", "),
          services: (svcRows as any[]).map((s: any) => s.name),
        });
      } catch {
        result.push({
          slug: row.slug, name: row.name, tagline: row.tagline, logo: row.logo,
          averageRating: null, totalReviews: 0, location: "", services: [],
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}

// Map a stored project_budget string to one of 4 display buckets:
// 0: < $49,999 | 1: $50k-$199,999 | 2: $200k-$999,999 | 3: > $1,000,000
function budgetToBucket(raw: unknown): number {
  const s = String(raw || "").toLowerCase();
  if (!s) return -1;
  if (s.includes("1,000,000") || s.includes("1 million") || s.includes("1m")) return 3;
  if (s.includes("200,000")) return 2;
  if (s.includes("50,000")) return 1;
  if (s.includes("less than $10,000") || s.includes("10,000") || s.includes("under")) return 0;
  return -1;
}

async function fetchPricingData(agencyId: string, agencyName: string, minProjectSize: number | null, hourlyRate: string | null) {
  const BUCKET_LABELS = ["< $49,999", "$50,000–$199,999", "$200,000–$999,999", "> $1,000,000"];
  const empty = {
    minProjectSize,
    hourlyRate,
    costRating: null as number | null,
    totalCostReviews: 0,
    buckets: [0, 0, 0, 0],
    services: [] as Array<{ name: string; count: number; topBucket: number; buckets: number[] }>,
    summary: `${agencyName} has not collected enough pricing feedback from reviews yet. As clients share project details, a pricing snapshot will appear here.`,
  };
  try {
    const db = getDb();
    const rows = (await db.execute(
      sql`SELECT budget_rating, project_budget, service_provided
          FROM reviews
          WHERE agency_id = ${agencyId} AND status = 'approved' AND deleted_at IS NULL`
    )) as unknown as Array<Record<string, unknown>>;

    if (rows.length === 0) return empty;

    // Cost rating = avg budget_rating across reviews that have it
    const costRatings = rows.map((r) => (r.budget_rating != null ? Number(r.budget_rating) : null)).filter((n): n is number => n != null && !Number.isNaN(n));
    const costRating = costRatings.length > 0 ? costRatings.reduce((a, b) => a + b, 0) / costRatings.length : null;

    // Overall buckets
    const buckets = [0, 0, 0, 0];
    const serviceMap = new Map<string, number[]>();
    let totalCostReviews = 0;

    for (const r of rows) {
      const b = budgetToBucket(r.project_budget);
      if (b < 0) continue;
      buckets[b]++;
      totalCostReviews++;
      const svc = String(r.service_provided || "").trim();
      if (svc) {
        if (!serviceMap.has(svc)) serviceMap.set(svc, [0, 0, 0, 0]);
        serviceMap.get(svc)![b]++;
      }
    }

    const services = Array.from(serviceMap.entries())
      .map(([name, svcBuckets]) => {
        const count = svcBuckets.reduce((a, b) => a + b, 0);
        const topBucket = svcBuckets.indexOf(Math.max(...svcBuckets));
        return { name, count, topBucket, buckets: svcBuckets };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Heuristic "What Clients Have Said" summary
    let summary: string;
    if (totalCostReviews === 0) {
      summary = empty.summary;
    } else {
      const topIdx = buckets.indexOf(Math.max(...buckets));
      const costPhrase =
        costRating == null
          ? "value for money"
          : costRating >= 4.5
            ? "excellent value for cost"
            : costRating >= 4
              ? "good value for cost"
              : costRating >= 3
                ? "fair pricing"
                : "competitive pricing";
      summary = `${agencyName} offers ${costPhrase}, with most projects falling in the ${BUCKET_LABELS[topIdx]} range based on client reviews.${
        costRating != null ? ` Clients rated cost satisfaction ${costRating.toFixed(1)} out of 5.` : ""
      } Project budgets span a range of sizes, reflecting their ability to handle both smaller engagements and larger initiatives.`;
    }

    return { minProjectSize, hourlyRate, costRating, totalCostReviews, buckets, services, summary };
  } catch {
    return empty;
  }
}

// Theme dictionary for Review Insights (keyword frequency over review text).
const INSIGHT_THEMES: Array<{
  label: string;
  keywords: string[];
  highlightTitle: string;
  highlightBody: (name: string) => string;
}> = [
  { label: "Timely", keywords: ["on time", "timely", "deadline", "punctual", "prompt", "quick turnaround", "fast deliver", "on schedule"],
    highlightTitle: "Timely Delivery", highlightBody: (n) => `Clients frequently note that ${n} delivers work on time and meets agreed deadlines, keeping projects on schedule.` },
  { label: "High-Quality Work", keywords: ["high quality", "high-quality", "quality work", "excellent work", "great work", "top-notch", "top notch", "bug-free", "well-built", "quality of"],
    highlightTitle: "High-Quality Work", highlightBody: (n) => `Reviews consistently highlight ${n}'s high-quality output, attention to detail, and strong standards across deliverables.` },
  { label: "Flexible", keywords: ["flexible", "flexibility", "adaptable", "accommodating", "adapt to"],
    highlightTitle: "Flexibility & Adaptability", highlightBody: (n) => `Clients describe ${n} as flexible and adaptable, adjusting smoothly to evolving requirements and changing scopes.` },
  { label: "Great Project Management", keywords: ["project management", "well managed", "well-managed", "organized", "on budget", "managed the project"],
    highlightTitle: "Effective Project Management", highlightBody: (n) => `Reviewers commend ${n} for organized, well-structured project management that keeps work on track and on budget.` },
  { label: "Professional", keywords: ["professional", "professionalism", "expertise", "knowledgeable", "expert"],
    highlightTitle: "Professionalism & Expertise", highlightBody: (n) => `Clients consistently commend ${n} for their professionalism and expertise, describing the team as knowledgeable and dedicated.` },
  { label: "Reasonable Pricing", keywords: ["reasonable pric", "affordable", "good value", "competitive pric", "fair price", "cost-effective", "value for money", "great value"],
    highlightTitle: "Reasonable Pricing", highlightBody: (n) => `Several clients mention that ${n} offers reasonable pricing and strong value for the cost of their engagements.` },
  { label: "Communicative", keywords: ["communicat", "responsive", "transparent", "kept us informed", "easy to reach"],
    highlightTitle: "Strong Communication", highlightBody: (n) => `Reviews praise ${n} for clear, responsive communication and transparency throughout the collaboration.` },
  { label: "Exceptional Performance", keywords: ["exceptional", "outstanding", "impressive", "exceeded", "went above", "beyond expectations"],
    highlightTitle: "Exceptional Performance", highlightBody: (n) => `Clients describe ${n}'s performance as exceptional, often noting that the team exceeded expectations.` },
  { label: "Innovative", keywords: ["innovat", "creative", "cutting-edge", "cutting edge", "fresh ideas"],
    highlightTitle: "Innovative Approach", highlightBody: (n) => `Reviewers value ${n}'s innovative, creative thinking and willingness to bring fresh ideas to the table.` },
  { label: "Reliable", keywords: ["reliable", "dependable", "trustworthy", "we trust", "can rely"],
    highlightTitle: "Reliable Partner", highlightBody: (n) => `Clients consider ${n} a reliable, dependable partner they can trust with important work.` },
  { label: "Collaborative", keywords: ["collaborat", "partnership", "team player", "worked closely", "felt like part"],
    highlightTitle: "Collaborative Partnership", highlightBody: (n) => `Reviews describe a collaborative partnership with ${n}, with the team working closely alongside the client.` },
];

async function fetchReviewInsights(agencyId: string, agencyName: string) {
  const empty = { topMentions: [], highlights: [], rating: 0, reviewCount: 0 };
  try {
    const db = getDb();
    const rows = (await db.execute(
      sql`SELECT objective, enjoyed, improvements, content, title, overall_rating
          FROM reviews
          WHERE agency_id = ${agencyId} AND status = 'approved' AND deleted_at IS NULL`
    )) as unknown as Array<Record<string, unknown>>;

    if (rows.length === 0) return empty;

    const counts = new Map<string, number>();
    for (const r of rows) {
      const text = [r.objective, r.enjoyed, r.improvements, r.content, r.title]
        .map((v) => String(v || ""))
        .join(" ")
        .toLowerCase();
      if (!text.trim()) continue;
      for (const theme of INSIGHT_THEMES) {
        if (theme.keywords.some((kw) => text.includes(kw))) {
          counts.set(theme.label, (counts.get(theme.label) || 0) + 1);
        }
      }
    }

    const topMentions = Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const highlights = topMentions
      .slice(0, 4)
      .map((m) => {
        const theme = INSIGHT_THEMES.find((t) => t.label === m.label)!;
        return { title: theme.highlightTitle, body: theme.highlightBody(agencyName) };
      });

    const ratings = rows.map((r) => Number(r.overall_rating)).filter((n) => !Number.isNaN(n));
    const rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return { topMentions, highlights, rating, reviewCount: rows.length };
  } catch {
    return empty;
  }
}

async function fetchRatingBreakdown(agencyId: string) {
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT overall_rating, COUNT(*)::int as count FROM reviews WHERE agency_id = ${agencyId} AND status = 'approved' AND deleted_at IS NULL GROUP BY overall_rating`
    );
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const row of rows as any[]) {
      const rating = Math.round(Number(row.overall_rating));
      if (rating >= 1 && rating <= 5) {
        breakdown[rating] = Number(row.count);
      }
    }
    return breakdown;
  } catch {
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }
}

// ---------------------------------------------------------------------------
// Helper: parse social_links jsonb
// ---------------------------------------------------------------------------

function parseJsonValue(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function parseStringArray(raw: unknown): string[] {
  const val = parseJsonValue(raw);
  if (Array.isArray(val)) return val.map((v) => String(v)).filter(Boolean);
  return [];
}

const PHONE_CODES: Record<string, string> = {
  AF: "+93", AL: "+355", DZ: "+213", AR: "+54", AU: "+61", AT: "+43",
  BD: "+880", BE: "+32", BR: "+55", BG: "+359", KH: "+855", CA: "+1",
  CL: "+56", CN: "+86", CO: "+57", CR: "+506", HR: "+385", CZ: "+420",
  DK: "+45", DO: "+1", EC: "+593", EG: "+20", EE: "+372", ET: "+251",
  FI: "+358", FR: "+33", DE: "+49", GH: "+233", GR: "+30", GT: "+502",
  HK: "+852", HU: "+36", IS: "+354", IN: "+91", ID: "+62", IR: "+98",
  IQ: "+964", IE: "+353", IL: "+972", IT: "+39", JM: "+1", JP: "+81",
  JO: "+962", KZ: "+7", KE: "+254", KW: "+965", LV: "+371", LB: "+961",
  LT: "+370", LU: "+352", MY: "+60", MX: "+52", MA: "+212", MM: "+95",
  NP: "+977", NL: "+31", NZ: "+64", NG: "+234", NO: "+47", OM: "+968",
  PK: "+92", PA: "+507", PE: "+51", PH: "+63", PL: "+48", PT: "+351",
  QA: "+974", RO: "+40", RU: "+7", SA: "+966", RS: "+381", SG: "+65",
  SK: "+421", SI: "+386", ZA: "+27", KR: "+82", ES: "+34", LK: "+94",
  SE: "+46", CH: "+41", TW: "+886", TZ: "+255", TH: "+66", TN: "+216",
  TR: "+90", UA: "+380", AE: "+971", GB: "+44", US: "+1", UY: "+598",
  VE: "+58", VN: "+84",
};

interface ParsedLocation {
  label?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  countryCode?: string;
  cityId?: string;
  countryId?: string;
  latitude?: number | null;
  longitude?: number | null;
  isHeadquarters?: boolean;
}

function parseLocations(raw: unknown): ParsedLocation[] {
  const val = parseJsonValue(raw);
  if (!Array.isArray(val)) return [];
  return val
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const o = v as Record<string, unknown>;
      return {
        label: o.label ? String(o.label) : undefined,
        address: o.address ? String(o.address) : undefined,
        city: o.city ? String(o.city) : undefined,
        country: o.country ? String(o.country) : undefined,
        phone: o.phone ? String(o.phone) : undefined,
        cityId: o.cityId ? String(o.cityId) : undefined,
        countryId: o.countryId ? String(o.countryId) : undefined,
        latitude: o.latitude != null ? Number(o.latitude) : null,
        longitude: o.longitude != null ? Number(o.longitude) : null,
        isHeadquarters: Boolean(o.isHeadquarters),
      };
    });
}

interface ServiceFocusItem {
  serviceId: string;
  percentage: number;
  serviceName?: string;
}

interface IndustryFocusItem {
  industryId: string;
  percentage: number;
  industryName?: string;
}

interface TeamInfoData {
  story?: string;
  teamPhoto?: string;
  videoUrl?: string;
  setsApart?: string[];
  quickFacts?: string[];
  tools?: string[];
  faq?: Array<{ question: string; answer: string }>;
}

function parseIndustryFocus(raw: unknown): IndustryFocusItem[] {
  const val = parseJsonValue(raw);
  if (!Array.isArray(val)) return [];
  return val
    .filter((v) => v && typeof v === "object" && (v as Record<string, unknown>).industryId)
    .map((v) => {
      const o = v as Record<string, unknown>;
      return { industryId: String(o.industryId), percentage: Number(o.percentage || 0) };
    });
}

function parseServiceFocus(raw: unknown): ServiceFocusItem[] {
  const val = parseJsonValue(raw);
  if (!Array.isArray(val)) return [];
  return val
    .filter((v) => v && typeof v === "object" && (v as Record<string, unknown>).serviceId)
    .map((v) => {
      const o = v as Record<string, unknown>;
      return { serviceId: String(o.serviceId), percentage: Number(o.percentage || 0) };
    });
}

function parseTeamInfo(raw: unknown): TeamInfoData | null {
  const val = parseJsonValue(raw);
  if (!val || typeof val !== "object") return null;
  const o = val as Record<string, unknown>;
  const info: TeamInfoData = {};
  if (o.story) info.story = String(o.story);
  if (o.teamPhoto) info.teamPhoto = String(o.teamPhoto);
  if (o.videoUrl) info.videoUrl = String(o.videoUrl);
  if (Array.isArray(o.setsApart)) info.setsApart = o.setsApart.map(String).filter(Boolean);
  if (Array.isArray(o.quickFacts)) info.quickFacts = o.quickFacts.map(String).filter(Boolean);
  if (Array.isArray(o.tools)) info.tools = o.tools.map(String).filter(Boolean);
  if (Array.isArray(o.faq)) {
    info.faq = o.faq
      .filter((f: unknown) => f && typeof f === "object")
      .map((f: unknown) => {
        const faq = f as Record<string, unknown>;
        return { question: String(faq.question || ""), answer: String(faq.answer || "") };
      })
      .filter((f) => f.question && f.answer);
  }
  const hasContent = info.story || (info.setsApart && info.setsApart.length > 0) || (info.tools && info.tools.length > 0) || (info.faq && info.faq.length > 0) || info.teamPhoto || info.videoUrl;
  return hasContent ? info : null;
}

interface PackageTierData {
  label: string;
  price: string;
  frequency: string;
  audience: string;
  features: Array<{ name: string; type: string; value: string }>;
}

interface PackageData {
  serviceLine: string;
  focusArea: string;
  name: string;
  description: string;
  tiers: PackageTierData[];
}

function parsePackages(raw: unknown): PackageData[] {
  const val = parseJsonValue(raw);
  if (!Array.isArray(val)) return [];
  return val
    .filter((v) => v && typeof v === "object" && (v as Record<string, unknown>).name)
    .map((v) => {
      const o = v as Record<string, unknown>;
      const tiers = Array.isArray(o.tiers) ? (o.tiers as Array<Record<string, unknown>>).map((t) => ({
        label: String(t.label || ""),
        price: String(t.price || ""),
        frequency: String(t.frequency || ""),
        audience: String(t.audience || ""),
        features: Array.isArray(t.features) ? (t.features as Array<Record<string, unknown>>).map((f) => ({
          name: String(f.name || ""),
          type: String(f.type || "text"),
          value: String(f.value || ""),
        })) : [],
      })) : [];
      return {
        serviceLine: String(o.serviceLine || ""),
        focusArea: String(o.focusArea || ""),
        name: String(o.name || ""),
        description: String(o.description || ""),
        tiers,
      };
    });
}

function parseSocialLinks(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, string>;
  return {};
}

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const agency = await fetchAgencyBySlug(slug);
  if (!agency || agency.deleted_at) {
    return { title: "Agency Not Found" };
  }

  const cityName = agency.city_id ? await fetchCityName(agency.city_id) : null;
  const countryName = agency.country_id
    ? await fetchCountryName(agency.country_id)
    : null;
  const location = [cityName, countryName].filter(Boolean).join(", ");
  const services = await fetchServices(agency.id);
  const serviceNames = services
    .slice(0, 4)
    .map((s) => s.name)
    .join(", ");

  const title = agency.meta_title || `${agency.name} — ${agency.tagline || "Agency Profile"}`;
  const description =
    agency.meta_description ||
    `${agency.name} is a ${agency.average_rating ? Number(agency.average_rating).toFixed(1) + "-star rated" : ""} agency${location ? ` in ${location}` : ""}. ${serviceNames ? serviceNames + " and more." : ""} Read ${agency.total_reviews ?? 0} verified reviews.`;

  const meta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description: `Read ${agency.total_reviews ?? 0} verified reviews for ${agency.name}${location ? `, a top-rated agency in ${location}` : ""}.`,
      type: "website",
      images: agency.logo
        ? [{ url: agency.logo, width: 1200, height: 630, alt: `${agency.name} - Marketing Agency on AgencyHub` }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Read ${agency.total_reviews ?? 0} verified reviews for ${agency.name}.`,
    },
    alternates: {
      canonical: `/agencies/${agency.slug}`,
    },
  };

  if (agency.status !== "active") {
    meta.robots = { index: false, follow: false };
  }

  return meta;
}

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const { hasDb, getDb } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    if (!hasDb()) return [];
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT slug FROM agencies WHERE status = 'active' AND deleted_at IS NULL LIMIT 500`
    );
    return (rows as unknown as Array<{ slug: string }>).map((row) => ({
      slug: row.slug,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function Stars({
  rating,
  size = "w-4 h-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <span
      className="inline-flex gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

function RatingBar({
  label,
  count,
  total,
}: {
  label: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-7 text-right font-medium text-gray-700">{label}</span>
      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-warning rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-500">{count}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab IDs
// ---------------------------------------------------------------------------

const SOCIAL_ICON_PATHS: Record<string, string> = {
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z",
  youtube: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  pinterest: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z",
  github: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  dribbble: "M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.81zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.91 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z",
  behance: "M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z",
};

const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn", twitter: "X (Twitter)", facebook: "Facebook", instagram: "Instagram",
  youtube: "YouTube", tiktok: "TikTok", pinterest: "Pinterest", github: "GitHub",
  dribbble: "Dribbble", behance: "Behance",
};

const PIE_COLORS = [
  "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa",
  "#7dd3fc", "#155e75", "#0e7490", "#0891b2", "#06b6d4",
  "#059669", "#10b981", "#34d399", "#6ee7b7", "#a78bfa",
  "#8b5cf6", "#7c3aed", "#f59e0b", "#f97316", "#ef4444",
];

function ServiceFocusPie({ items }: { items: ServiceFocusItem[] }) {
  const valid = items.filter((i) => i.percentage > 0);
  if (valid.length === 0) return <div className="w-48 h-48 rounded-full bg-gray-100 mx-auto" />;

  let cumulative = 0;
  const slices: Array<{ startAngle: number; endAngle: number; color: string; pct: number }> = [];
  valid.forEach((item, i) => {
    const start = cumulative;
    cumulative += item.percentage;
    slices.push({ startAngle: start * 3.6, endAngle: cumulative * 3.6, color: PIE_COLORS[i % PIE_COLORS.length], pct: item.percentage });
  });

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const cx = 100, cy = 100, r = 90;

  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
      {slices.map((s, i) => {
        const largeArc = s.endAngle - s.startAngle > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos(toRad(s.startAngle));
        const y1 = cy + r * Math.sin(toRad(s.startAngle));
        const x2 = cx + r * Math.cos(toRad(s.endAngle));
        const y2 = cy + r * Math.sin(toRad(s.endAngle));
        const midAngle = toRad((s.startAngle + s.endAngle) / 2);
        const labelR = 55;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        return (
          <g key={i}>
            <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={s.color} stroke="white" strokeWidth="2" />
            {s.pct >= 8 && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">{s.pct}</text>}
          </g>
        );
      })}
    </svg>
  );
}

const INDUSTRY_COLORS = [
  "#059669", "#10b981", "#34d399", "#6ee7b7", "#a78bfa",
  "#8b5cf6", "#7c3aed", "#f59e0b", "#f97316", "#ef4444",
  "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa",
  "#155e75", "#0e7490", "#0891b2", "#06b6d4", "#7dd3fc",
];

function IndustryPie({ items }: { items: { name: string; pct: number }[] }) {
  const valid = items.filter((i) => i.pct > 0);
  if (valid.length === 0) return <div className="w-48 h-48 rounded-full bg-gray-100 mx-auto" />;

  let cumulative = 0;
  const slices: Array<{ startAngle: number; endAngle: number; color: string; pct: number }> = [];
  valid.forEach((item, i) => {
    const start = cumulative;
    cumulative += item.pct;
    slices.push({ startAngle: start * 3.6, endAngle: cumulative * 3.6, color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length], pct: item.pct });
  });

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const cx = 100, cy = 100, r = 90;

  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
      {slices.map((s, i) => {
        const largeArc = s.endAngle - s.startAngle > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos(toRad(s.startAngle));
        const y1 = cy + r * Math.sin(toRad(s.startAngle));
        const x2 = cx + r * Math.cos(toRad(s.endAngle));
        const y2 = cy + r * Math.sin(toRad(s.endAngle));
        const midAngle = toRad((s.startAngle + s.endAngle) / 2);
        const labelR = 55;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        return (
          <g key={i}>
            <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={s.color} stroke="white" strokeWidth="2" />
            {s.pct >= 8 && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">{Math.round(s.pct)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "pricing", label: "Pricing" },
  { id: "packages", label: "Packages" },
  { id: "portfolio", label: "Portfolio" },
  { id: "services", label: "Services" },
  { id: "industries", label: "Industries" },
  { id: "team", label: "Team" },
  { id: "reviews", label: "Reviews" },
] as const;

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AgencyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const agency = await fetchAgencyBySlug(slug);
  if (!agency || agency.deleted_at) {
    notFound();
  }

  // Show message pages for non-active statuses
  if (agency.status === "suspended" || agency.status === "rejected") {
    return (
      <section className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Agency Unavailable</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            This agency listing is currently unavailable. It may be under review. Please check back later.
          </p>
          <Link
            href="/agencies"
            className="inline-flex items-center gap-2 mt-8 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors"
          >
            Browse Agencies
          </Link>
        </div>
      </section>
    );
  }

  if (agency.status === "draft" || agency.status === "pending") {
    return (
      <section className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Not Yet Published</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            This agency profile is not yet published. It&apos;s currently under review.
          </p>
          <Link
            href="/agencies"
            className="inline-flex items-center gap-2 mt-8 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors"
          >
            Browse Agencies
          </Link>
        </div>
      </section>
    );
  }

  // Fetch related data in parallel
  const [services, industries, reviews, ratingBreakdown, similarAgencies, portfolio, pricingData, reviewInsights] =
    await Promise.all([
      fetchServices(agency.id),
      fetchIndustries(agency.id),
      fetchReviews(agency.id),
      fetchRatingBreakdown(agency.id),
      fetchSimilarAgencies(agency.id),
      fetchPortfolio(agency.id),
      fetchPricingData(
        agency.id,
        agency.name,
        agency.min_project_size != null ? Number(agency.min_project_size) : null,
        agency.hourly_rate || null
      ),
      fetchReviewInsights(agency.id, agency.name),
    ]);

  const cityName = agency.city_id ? await fetchCityName(agency.city_id) : null;
  const countryName = agency.country_id
    ? await fetchCountryName(agency.country_id)
    : null;
  const location = [cityName, countryName].filter(Boolean).join(", ");

  const languages = parseStringArray(agency.languages);
  const timezones = parseStringArray(agency.timezones);

  // Service focus (pie chart data)
  const serviceFocusRaw = parseServiceFocus(agency.service_focus);
  const serviceFocus = await resolveServiceFocus(serviceFocusRaw);

  // Industry focus (pie chart data)
  const industryFocusRaw = parseIndustryFocus(agency.industry_focus);
  const industryFocus = await resolveIndustryFocus(industryFocusRaw);

  // Team info
  const teamInfo = parseTeamInfo(agency.team_info);

  // Packages
  const packages = parsePackages(agency.packages);

  // Multi-location list with fallback to the agency's single registered address
  let locations = parseLocations(agency.locations);

  // Resolve cityId/countryId to names and country codes for locations
  for (const loc of locations) {
    if (loc.countryId) {
      if (!loc.country) {
        const name = await fetchCountryName(loc.countryId);
        if (name) loc.country = name;
      }
      const code = await fetchCountryCode(loc.countryId);
      if (code) loc.countryCode = code;
    }
    if (loc.cityId && !loc.city) {
      const name = await fetchCityName(loc.cityId);
      if (name) loc.city = name;
    }
  }

  if (locations.length === 0 && (agency.address || cityName || countryName || agency.latitude)) {
    locations = [
      {
        label: "Headquarters",
        address: agency.address || undefined,
        city: cityName || undefined,
        country: countryName || undefined,
        phone: agency.phone || undefined,
        latitude: agency.latitude != null ? Number(agency.latitude) : null,
        longitude: agency.longitude != null ? Number(agency.longitude) : null,
        isHeadquarters: true,
      },
    ];
  }

  // Prepend country code to phone numbers that don't already have one
  for (const loc of locations) {
    if (loc.phone && loc.countryCode) {
      const phoneCode = PHONE_CODES[loc.countryCode];
      if (phoneCode && !loc.phone.startsWith("+")) {
        loc.phone = `${phoneCode} ${loc.phone}`;
      }
    }
  }

  // Attach agency phone to HQ location if location doesn't have its own phone
  if (agency.phone) {
    const hq = locations.find((l) => l.isHeadquarters);
    if (hq && !hq.phone) hq.phone = agency.phone;
  }

  // Determine display location: prefer HQ office location, fall back to agency-level location
  const hqOffice = locations.find((l) => l.isHeadquarters) || locations[0];
  const displayLocation = hqOffice
    ? [hqOffice.city, hqOffice.country].filter(Boolean).join(", ")
    : location;

  const hqPhone = hqOffice?.phone || agency.phone || null;

  const socialLinks = parseSocialLinks(agency.social_links);
  const rating = agency.average_rating ? Number(agency.average_rating) : 0;
  const reviewCount = agency.total_reviews ?? 0;
  const isActive = agency.status === "active";

  const logoUrl =
    agency.logo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.name)}&size=128&background=2563EB&color=fff&bold=true&format=svg`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agencyhub.com";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Agencies", item: `${baseUrl}/agencies` },
      { "@type": "ListItem", position: 3, name: agency.name },
    ],
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: agency.name,
      description: agency.tagline || agency.description || "",
      url: agency.website || `${baseUrl}/agencies/${agency.slug}`,
      logo: agency.logo || undefined,
      image: agency.logo || agency.cover_image || undefined,
      telephone: hqPhone || undefined,
      email: agency.email || undefined,
      foundingDate: agency.founded_year ? String(agency.founded_year) : undefined,
      address: location
        ? {
            "@type": "PostalAddress",
            addressLocality: cityName || undefined,
            addressCountry: countryName || undefined,
          }
        : undefined,
      geo:
        agency.latitude && agency.longitude
          ? {
              "@type": "GeoCoordinates",
              latitude: Number(agency.latitude),
              longitude: Number(agency.longitude),
            }
          : undefined,
      aggregateRating:
        reviewCount > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: rating,
              reviewCount,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      priceRange: agency.hourly_rate || undefined,
      sameAs: Object.values(socialLinks).filter(Boolean),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: agency.name,
      url: agency.website || `${baseUrl}/agencies/${agency.slug}`,
      logo: agency.logo || undefined,
      foundingDate: agency.founded_year ? String(agency.founded_year) : undefined,
      sameAs: Object.values(socialLinks).filter(Boolean),
    },
  ];

  return (
    <>
      {/* JSON-LD structured data (only for active agencies) */}
      {isActive && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {isActive && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      {isActive && <TrackProfileView agencyId={agency.id as string} />}

      {/* Non-active warning banner */}
      {!isActive && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-yellow-800 font-medium text-center">
              This agency profile is not yet public.
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Logo */}
            <div className="shrink-0">
              <img
                src={logoUrl}
                alt={`${agency.name} logo`}
                width={96}
                height={96}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-white/20 shadow-lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white truncate">
                  {agency.name}
                </h1>
                {agency.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-brand/20 text-brand-light text-xs font-semibold px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-4 h-4" /> Verified
                  </span>
                )}
              </div>
              {agency.tagline && (
                <p className="mt-1 text-gray-300 text-lg">{agency.tagline}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300">
                {/* Rating */}
                {reviewCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Stars rating={rating} />
                    <span className="font-semibold text-white">
                      {rating.toFixed(1)}
                    </span>
                    <span>({reviewCount} reviews)</span>
                  </span>
                )}

                {/* Location */}
                {displayLocation && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {displayLocation}
                  </span>
                )}

                {/* Website */}
                {agency.website && (
                  <TrackClick
                    agencyId={agency.id as string}
                    event="website_click"
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" /> Website
                    <ExternalLink className="w-3 h-3" />
                  </TrackClick>
                )}
              </div>
            </div>

            {/* CTA (visible on md+) */}
            <div className="hidden md:flex shrink-0 flex-col gap-3">
              <Link
                href={`/get-quotes?agency=${agency.slug}`}
                className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors"
              >
                Get a Free Quote <ArrowRight className="w-4 h-4" />
              </Link>
              {agency.claim_status === "unclaimed" && (
                <Link
                  href={`/agencies/${agency.slug}/claim`}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors text-sm"
                >
                  <BadgeCheck className="w-4 h-4" /> Claim This Agency
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Quick Stats Bar */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {agency.founded_year && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Founded
                  </p>
                  <p className="font-semibold text-navy">
                    {agency.founded_year}
                  </p>
                </div>
              </div>
            )}
            {agency.company_size && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Company Size
                  </p>
                  <p className="font-semibold text-navy">
                    {agency.company_size}
                  </p>
                </div>
              </div>
            )}
            {agency.hourly_rate && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Hourly Rate
                  </p>
                  <p className="font-semibold text-navy">
                    {agency.hourly_rate}
                  </p>
                </div>
              </div>
            )}
            {agency.min_project_size != null && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Min Project Size
                  </p>
                  <p className="font-semibold text-navy">
                    ${Number(agency.min_project_size).toLocaleString()}+
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile CTA (sticky bottom bar) */}
      {/* ---------------------------------------------------------------- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
        {agency.claim_status === "unclaimed" ? (
          <Link
            href={`/agencies/${agency.slug}/claim`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-600 transition-colors"
          >
            <BadgeCheck className="w-4 h-4" /> Claim This Agency
          </Link>
        ) : (
          <Link
            href={`/get-quotes?agency=${agency.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-xl font-medium text-sm hover:bg-brand-dark transition-colors"
          >
            Get a Free Quote
          </Link>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Main content area */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-gray-50 pb-20 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            {/* ======================================================== */}
            {/* Primary column (2/3) */}
            {/* ======================================================== */}
            <div className="lg:col-span-2 space-y-10">
              {/* Tab navigation */}
              <nav className="flex overflow-x-auto gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                {tabs.map((tab) => (
                  <a
                    key={tab.id}
                    href={`#${tab.id}`}
                    className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:text-brand hover:bg-blue-50 transition-colors"
                  >
                    {tab.label}
                  </a>
                ))}
              </nav>

              {/* ---- Overview ---- */}
              <div id="overview" className="scroll-mt-24">
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-navy">
                    About {agency.name}
                  </h2>
                  {agency.description ? (
                    <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-line">
                      {agency.description}
                    </div>
                  ) : (
                    <p className="mt-4 text-gray-400 italic">
                      No description provided yet.
                    </p>
                  )}
                </div>
              </div>

              {/* ---- Languages & Timezones ---- */}
              {(languages.length > 0 || timezones.length > 0) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {languages.length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                          <LanguagesIcon className="w-5 h-5 text-brand" /> Languages
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {languages.map((lang) => (
                            <span
                              key={lang}
                              className="inline-flex items-center bg-blue-50 text-brand text-sm font-medium px-3 py-1.5 rounded-full"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {timezones.length > 0 && (
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                          <Globe2 className="w-5 h-5 text-brand" /> Timezones
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {timezones.map((tz) => (
                            <span
                              key={tz}
                              className="inline-flex items-center bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full"
                            >
                              {tz}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---- Pricing Snapshot ---- */}
              <div id="pricing" className="scroll-mt-24">
                <PricingSnapshot data={pricingData} agencyName={agency.name} />
              </div>

              {/* ---- Packages ---- */}
              {packages.length > 0 && (
                <div id="packages" className="scroll-mt-24">
                  <PackagesSection
                    packages={packages}
                    agencyId={agency.id as string}
                    agencyName={agency.name as string}
                    agencySlug={agency.slug as string}
                    averageRating={rating}
                    totalReviews={reviewCount}
                  />
                </div>
              )}

              {/* ---- Portfolio & Awards ---- */}
              {portfolio.length > 0 && (
                <div id="portfolio" className="scroll-mt-24">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-navy">Portfolio & Awards</h2>
                    <PortfolioSection items={portfolio} />
                  </div>
                </div>
              )}

              {/* ---- Service Lines (pie chart) ---- */}
              {serviceFocus.length > 0 && (
                <div id="services" className="scroll-mt-24">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-navy">Service Lines</h2>
                    <div className="mt-6 flex flex-col md:flex-row gap-8 items-start">
                      {/* Pie chart */}
                      <div className="shrink-0">
                        <ServiceFocusPie items={serviceFocus} />
                      </div>
                      {/* Legend + percentages */}
                      <div className="flex-1 space-y-3">
                        {serviceFocus.map((item, i) => (
                          <div key={item.serviceId} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="flex-1 text-sm font-medium text-gray-800">{item.serviceName}</span>
                            <span className="text-sm font-semibold text-navy">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Services (fallback if no focus data) ---- */}
              {serviceFocus.length === 0 && services.length > 0 && (
                <div id="services" className="scroll-mt-24">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-navy">Services</h2>
                    <div className="mt-6 grid sm:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <div
                          key={service.name}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-brand/30 hover:bg-blue-50/40 transition-colors"
                        >
                          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Briefcase className="w-4.5 h-4.5 text-brand" />
                          </div>
                          <span className="font-medium text-gray-800">
                            {service.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Industries (pie chart) ---- */}
              {(industryFocus.length > 0 || industries.length > 0) && (() => {
                const industryItems = industryFocus.length > 0
                  ? industryFocus.map((ifoc) => ({ name: ifoc.industryName || "Unknown", pct: ifoc.percentage }))
                  : (() => {
                      const pctEach = Math.floor(100 / industries.length);
                      const remainder = 100 - pctEach * industries.length;
                      return industries.map((ind, i) => ({ name: ind.name, pct: pctEach + (i < remainder ? 1 : 0) }));
                    })();
                return (
                  <div id="industries" className="scroll-mt-24">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                      <h2 className="text-xl font-bold text-navy">Industry Focus</h2>
                      <div className="mt-6 flex flex-col md:flex-row gap-8 items-start">
                        <div className="shrink-0">
                          <IndustryPie items={industryItems} />
                        </div>
                        <div className="flex-1 space-y-3">
                          {industryItems.map((item, i) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }} />
                              <span className="flex-1 text-sm font-medium text-gray-800">{item.name}</span>
                              <span className="text-sm font-semibold text-navy">{item.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ---- Location ---- */}
              {locations.length > 0 && (
                <div id="location" className="scroll-mt-24">
                  <LocationMap locations={locations} />
                </div>
              )}

              {/* ---- About The Team ---- */}
              {teamInfo && (
                <div id="team" className="scroll-mt-24">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-8">
                    <h2 className="text-xl font-bold text-navy">About The Team</h2>

                    {/* Our Story */}
                    {teamInfo.story && (
                      <div>
                        <h3 className="text-lg font-semibold text-navy mb-3">Our Story</h3>
                        <div className="text-gray-600 leading-relaxed whitespace-pre-line">{teamInfo.story}</div>
                      </div>
                    )}

                    {/* Team Photo */}
                    {teamInfo.teamPhoto && (
                      <div>
                        <img src={teamInfo.teamPhoto} alt="Team" className="w-full max-h-80 object-cover rounded-lg" />
                      </div>
                    )}

                    {/* Video */}
                    {teamInfo.videoUrl && (
                      <div>
                        <h3 className="text-lg font-semibold text-navy mb-3">Video</h3>
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <iframe
                            src={teamInfo.videoUrl.replace("watch?v=", "embed/")}
                            className="w-full h-full"
                            allowFullScreen
                            title="Team video"
                          />
                        </div>
                      </div>
                    )}

                    {/* What Sets Us Apart */}
                    {teamInfo.setsApart && teamInfo.setsApart.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-navy mb-3">
                          <Sparkles className="w-5 h-5 text-brand" /> What Sets Us Apart
                        </h3>
                        <ul className="space-y-2">
                          {teamInfo.setsApart.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700">
                              <span className="mt-1.5 w-2 h-2 bg-brand rounded-full shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick Facts */}
                    {teamInfo.quickFacts && teamInfo.quickFacts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-navy mb-3">Quick Facts</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {teamInfo.quickFacts.map((fact, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                              <span className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center text-brand text-xs font-bold shrink-0">{i + 1}</span>
                              {fact}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tools & Technology */}
                    {teamInfo.tools && teamInfo.tools.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-navy mb-3">
                          <Wrench className="w-5 h-5 text-brand" /> Tools & Technology
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {teamInfo.tools.map((tool) => (
                            <span key={tool} className="inline-flex items-center bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FAQ */}
                    {teamInfo.faq && teamInfo.faq.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-navy mb-3">
                          <HelpCircle className="w-5 h-5 text-brand" /> FAQ
                        </h3>
                        <div className="space-y-4">
                          {teamInfo.faq.map((item, i) => (
                            <div key={i} className="border border-gray-100 rounded-lg p-4">
                              <p className="font-semibold text-navy">{item.question}</p>
                              <p className="mt-2 text-gray-600 text-sm">{item.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---- Review Insights ---- */}
              {reviewInsights.reviewCount > 0 && (
                <ReviewInsights data={reviewInsights} agencyName={agency.name} />
              )}

              {/* ---- Reviews ---- */}
              <div id="reviews" className="scroll-mt-24">
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-navy">Reviews</h2>

                  {reviewCount > 0 ? (
                    <>
                      {/* Rating breakdown */}
                      <div className="mt-6 flex flex-col sm:flex-row gap-8">
                        <div className="text-center sm:text-left shrink-0">
                          <p className="text-5xl font-bold text-navy">
                            {rating.toFixed(1)}
                          </p>
                          <Stars rating={rating} size="w-5 h-5" />
                          <p className="mt-1 text-sm text-gray-500">
                            {reviewCount} reviews
                          </p>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[5, 4, 3, 2, 1].map((star) => (
                            <RatingBar
                              key={star}
                              label={star}
                              count={ratingBreakdown[star] ?? 0}
                              total={reviewCount}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Filterable review list */}
                      {reviews.length > 0 && (
                        <ReviewsBrowser reviews={reviews as never} agencyName={agency.name} />
                      )}
                    </>
                  ) : (
                    <p className="mt-4 text-gray-400 italic">
                      No reviews yet. Be the first to share your experience!
                    </p>
                  )}

                  {/* Write a Review */}
                  <ReviewForm agencyId={agency.id} agencyName={agency.name} />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* Sidebar (1/3) -- desktop only */}
            {/* ======================================================== */}
            <aside className="hidden lg:block space-y-6">
              {/* Contact CTA Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-bold text-navy">
                  Ready to get started?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Tell us about your project and get a custom proposal from{" "}
                  {agency.name}.
                </p>
                <Link
                  href={`/get-quotes?agency=${agency.slug}`}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors"
                >
                  Get a Free Quote <ArrowRight className="w-4 h-4" />
                </Link>
                {hqPhone && (
                  <a
                    href={`tel:${hqPhone}`}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {hqPhone}
                  </a>
                )}

                {/* Quick info */}
                <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                  {displayLocation && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-800">{displayLocation}</p>
                      </div>
                    </div>
                  )}
                  {agency.website && (
                    <div className="flex items-start gap-3 text-sm">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500">Website</p>
                        <TrackClick
                          agencyId={agency.id as string}
                          event="website_click"
                          href={agency.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand hover:underline"
                        >
                          {agency.website.replace(/^https?:\/\//, "")}
                        </TrackClick>
                      </div>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500">Email</p>
                        <TrackClick
                          agencyId={agency.id as string}
                          event="email_click"
                          href={`mailto:${agency.email}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {agency.email}
                        </TrackClick>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social links */}
                {Object.keys(socialLinks).length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                      Follow
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(socialLinks)
                        .filter(([, url]) => url)
                        .map(([platform, url]) => {
                          const iconPath = SOCIAL_ICON_PATHS[platform];
                          const label = SOCIAL_LABELS[platform] || platform;
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={label}
                              title={label}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-brand hover:border-brand/30 transition-colors"
                            >
                              {iconPath ? (
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d={iconPath} /></svg>
                              ) : (
                                <Globe className="w-4 h-4" />
                              )}
                            </a>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Similar Agencies */}
      {/* ---------------------------------------------------------------- */}
      {similarAgencies.length > 0 && (
        <section className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-navy">
              Similar Agencies
            </h2>
            <p className="mt-2 text-gray-600">
              Explore other top-rated agencies that match your needs.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarAgencies.map((a) => (
                <Link
                  key={a.slug}
                  href={`/agencies/${a.slug}`}
                  className="group bg-gray-50 rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-brand/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        a.logo ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&size=64&background=2563EB&color=fff&bold=true&format=svg`
                      }
                      alt={`${a.name} logo`}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy group-hover:text-brand transition-colors truncate">
                        {a.name}
                      </h3>
                      {a.tagline && (
                        <p className="text-sm text-gray-500 truncate">
                          {a.tagline}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
                    {a.averageRating != null && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                        <span className="font-medium text-gray-800">
                          {a.averageRating.toFixed(1)}
                        </span>
                        <span>({a.totalReviews})</span>
                      </span>
                    )}
                    {a.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {a.location}
                      </span>
                    )}
                  </div>
                  {a.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {a.services.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-blue-50 text-brand font-medium px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand group-hover:gap-2 transition-all">
                    View Profile <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
