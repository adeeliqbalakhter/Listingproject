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
} from "lucide-react";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ReviewForm } from "@/components/review-form";
import { PortfolioSection } from "@/components/portfolio-section";
import { PricingSnapshot } from "@/components/agencies/PricingSnapshot";
import { ReviewInsights } from "@/components/agencies/ReviewInsights";
import { ReviewsBrowser } from "@/components/agencies/ReviewsBrowser";
import { LocationMap } from "@/components/agencies/LocationMap";
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

interface ParsedLocation {
  label?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  teamSize?: string;
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
        teamSize: o.teamSize ? String(o.teamSize) : undefined,
        latitude: o.latitude != null ? Number(o.latitude) : null,
        longitude: o.longitude != null ? Number(o.longitude) : null,
        isHeadquarters: Boolean(o.isHeadquarters),
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

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "pricing", label: "Pricing" },
  { id: "portfolio", label: "Portfolio" },
  { id: "services", label: "Services" },
  { id: "industries", label: "Industries" },
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

  // Multi-location list with fallback to the agency's single registered address
  let locations = parseLocations(agency.locations);
  if (locations.length === 0 && (agency.address || cityName || countryName || agency.latitude)) {
    locations = [
      {
        label: "Headquarters",
        address: agency.address || undefined,
        city: cityName || undefined,
        country: countryName || undefined,
        phone: agency.phone || undefined,
        teamSize: agency.company_size || undefined,
        latitude: agency.latitude != null ? Number(agency.latitude) : null,
        longitude: agency.longitude != null ? Number(agency.longitude) : null,
        isHeadquarters: true,
      },
    ];
  }

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
      telephone: agency.phone || undefined,
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
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {location}
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
              {agency.phone && (
                <TrackClick
                  agencyId={agency.id as string}
                  event="phone_click"
                  href={`tel:${agency.phone}`}
                  className="inline-flex items-center justify-center gap-2 border border-gray-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-navy-light transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" /> {agency.phone}
                </TrackClick>
              )}
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
        {agency.phone && (
          <TrackClick
            agencyId={agency.id as string}
            event="phone_click"
            href={`tel:${agency.phone}`}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-navy px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </TrackClick>
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

              {/* ---- Portfolio & Awards ---- */}
              {portfolio.length > 0 && (
                <div id="portfolio" className="scroll-mt-24">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-navy">Portfolio & Awards</h2>
                    <PortfolioSection items={portfolio} />
                  </div>
                </div>
              )}

              {/* ---- Services ---- */}
              {services.length > 0 && (
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

              {/* ---- Industries ---- */}
              {industries.length > 0 && (
                <div id="industries" className="scroll-mt-24">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-navy">Industries</h2>
                    <div className="mt-6 grid sm:grid-cols-2 gap-4">
                      {industries.map((industry) => (
                        <div
                          key={industry.name}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-brand/30 hover:bg-blue-50/40 transition-colors"
                        >
                          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-4.5 h-4.5 text-brand" />
                          </div>
                          <span className="font-medium text-gray-800">
                            {industry.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Location ---- */}
              {locations.length > 0 && (
                <div id="location" className="scroll-mt-24">
                  <LocationMap locations={locations} />
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
                {agency.phone && (
                  <TrackClick
                    agencyId={agency.id as string}
                    event="phone_click"
                    href={`tel:${agency.phone}`}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-navy py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> {agency.phone}
                  </TrackClick>
                )}

                {/* Quick info */}
                <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                  {location && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-800">{location}</p>
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
                    <div className="flex gap-2">
                      {Object.entries(socialLinks)
                        .filter(([, url]) => url)
                        .map(([platform, url]) => {
                          let SocialIcon = Globe;
                          if (platform.toLowerCase().includes("linkedin"))
                            SocialIcon = Link2;
                          else if (platform.toLowerCase().includes("twitter"))
                            SocialIcon = AtSign;
                          else if (platform.toLowerCase().includes("facebook"))
                            SocialIcon = Globe;
                          else if (platform.toLowerCase().includes("instagram"))
                            SocialIcon = Share2;
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={platform}
                              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-brand hover:border-brand/30 transition-colors"
                            >
                              <SocialIcon className="w-4 h-4" />
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
