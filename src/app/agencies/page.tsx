import type { Metadata } from "next";
import Link from "next/link";
import {
  Star,
  MapPin,
  ExternalLink,
  Building2,
  Tag,
  Clock,
  Users,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import {
  AgencySearchBar,
  AgencyFilterBar,
} from "@/components/agencies/AgencyFilters";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Top Marketing Agencies - Browse & Compare",
  description:
    "Explore top-rated marketing agencies worldwide. Filter by service, location, budget, and company size. Read verified reviews and get free quotes.",
  keywords: [
    "marketing agencies directory",
    "top marketing agencies",
    "find marketing agency",
    "agency reviews",
    "agency comparison",
  ],
  openGraph: {
    title: "Top Marketing Agencies - Browse & Compare | AgencyHub",
    description:
      "Explore top-rated marketing agencies worldwide. Filter by service, location, budget, and company size.",
    type: "website",
  },
  alternates: { canonical: "/agencies" },
};

interface Agency {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  company_size: string | null;
  hourly_rate: string | null;
  min_project_size: number | null;
  is_verified: boolean;
  is_featured: boolean;
  services: string[];
  industries: string[];
  location: string;
}

const LOGO_COLORS = [
  "bg-blue-600", "bg-amber-500", "bg-purple-600", "bg-emerald-600", "bg-rose-600",
  "bg-cyan-600", "bg-indigo-600", "bg-green-600", "bg-orange-600", "bg-teal-600",
];
const SERVICE_BAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500",
  "bg-cyan-500", "bg-rose-500", "bg-indigo-500", "bg-teal-500",
];

function getLogoColor(index: number): string {
  return LOGO_COLORS[index % LOGO_COLORS.length];
}
function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

async function fetchAgencies(): Promise<Agency[]> {
  if (!hasDb()) return [];
  const db = getDb();
  try {
    const rows = await db.execute(
      sql`SELECT a.id, a.name, a.slug, a.tagline, a.description, a.website,
            a.average_rating, a.total_reviews, a.company_size, a.hourly_rate, a.min_project_size,
            a.is_verified, a.is_featured,
            COALESCE(
              (SELECT string_agg(s.name, '||') FROM agency_services asv
               JOIN services s ON s.id = asv.service_id WHERE asv.agency_id = a.id), ''
            ) as service_names,
            COALESCE(
              (SELECT string_agg(i.name, '||') FROM agency_industries ai
               JOIN industries i ON i.id = ai.industry_id WHERE ai.agency_id = a.id), ''
            ) as industry_names,
            COALESCE(c.name, '') as country_name,
            COALESCE(ci.name, '') as city_name
          FROM agencies a
          LEFT JOIN countries c ON a.country_id = c.id
          LEFT JOIN cities ci ON a.city_id = ci.id
          WHERE a.status = 'active' AND a.deleted_at IS NULL
          ORDER BY a.is_featured DESC, a.average_rating DESC NULLS LAST`
    );

    return (rows as unknown as Array<Record<string, unknown>>).map((row) => {
      const serviceNames = (row.service_names as string) || "";
      const industryNames = (row.industry_names as string) || "";
      const cityName = (row.city_name as string) || "";
      const countryName = (row.country_name as string) || "";
      const locationParts = [cityName, countryName].filter(Boolean);
      return {
        id: row.id as string,
        name: (row.name as string) || "",
        slug: (row.slug as string) || "",
        tagline: (row.tagline as string) || null,
        description: (row.description as string) || null,
        website: (row.website as string) || null,
        average_rating: row.average_rating ? Number(row.average_rating) : null,
        total_reviews: row.total_reviews ? Number(row.total_reviews) : null,
        company_size: (row.company_size as string) || null,
        hourly_rate: (row.hourly_rate as string) || null,
        min_project_size: row.min_project_size != null ? Number(row.min_project_size) : null,
        is_verified: Boolean(row.is_verified),
        is_featured: Boolean(row.is_featured),
        services: serviceNames ? serviceNames.split("||").filter(Boolean) : [],
        industries: industryNames ? industryNames.split("||").filter(Boolean) : [],
        location: locationParts.length > 0 ? locationParts.join(", ") : "Remote",
      };
    });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return [];
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <Star
            key={star}
            className={`w-4 h-4 ${
              filled ? "text-amber-400 fill-amber-400" : half ? "text-amber-400 fill-amber-400/50" : "text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}

function StatRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-gray-400">{icon}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}

function AgencyCard({ agency, index }: { agency: Agency; index: number }) {
  const logoColor = getLogoColor(index);
  const initials = getInitials(agency.name);
  const topServices = agency.services.slice(0, 8);
  const minProject = agency.min_project_size != null ? `$${agency.min_project_size.toLocaleString()}+` : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:border-brand/40 hover:shadow-md transition-all">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="shrink-0">
          <div className={`${logoColor} w-14 h-14 rounded-xl flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-navy">{agency.name}</h3>
                {agency.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-navy text-sm">
                  {agency.average_rating?.toFixed(1) ?? "New"}
                </span>
                <StarRating rating={agency.average_rating ?? 0} />
                <span className="text-sm text-gray-500">{agency.total_reviews ?? 0} reviews</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/agencies/${agency.slug}`}
                className="inline-flex items-center gap-1.5 border border-gray-200 text-navy px-4 py-2 rounded-lg text-sm font-medium hover:border-brand hover:text-brand transition-colors"
              >
                View Profile
              </Link>
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
                >
                  Visit Website <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Body grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Stats */}
            <div className="md:col-span-3 space-y-2">
              {minProject && <StatRow icon={<Tag className="w-4 h-4" />} value={minProject} />}
              {agency.hourly_rate && <StatRow icon={<Clock className="w-4 h-4" />} value={agency.hourly_rate} />}
              {agency.company_size && <StatRow icon={<Users className="w-4 h-4" />} value={agency.company_size} />}
              <StatRow icon={<MapPin className="w-4 h-4" />} value={agency.location} />
            </div>

            {/* Services breakdown */}
            <div className="md:col-span-4">
              {topServices.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Services Provided
                  </p>
                  <div className="flex h-2 rounded-full overflow-hidden mb-3">
                    {topServices.map((_, i) => (
                      <div
                        key={i}
                        className={`${SERVICE_BAR_COLORS[i % SERVICE_BAR_COLORS.length]} flex-1`}
                      />
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {topServices.slice(0, 3).map((svc, i) => (
                      <li key={svc} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className={`w-2 h-2 rounded-full ${SERVICE_BAR_COLORS[i % SERVICE_BAR_COLORS.length]}`} />
                        {svc}
                      </li>
                    ))}
                    {agency.services.length > 3 && (
                      <li className="text-sm text-brand font-medium">+{agency.services.length - 3} services</li>
                    )}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">No services listed</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-5">
              {(agency.description || agency.tagline) && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {agency.description || agency.tagline}
                </p>
              )}
              <Link
                href={`/agencies/${agency.slug}#reviews`}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:gap-2 transition-all"
              >
                See all {agency.total_reviews ?? 0} reviews <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filtering ──────────────────────────────────────────────────────
function hourlyToBucket(rate: string | null): string | null {
  if (!rate) return null;
  const nums = rate.replace(/,/g, "").match(/\d+/g)?.map(Number) ?? [];
  const low = nums[0];
  if (low == null) return null;
  if (low < 25) return "< $25 / hr";
  if (low < 50) return "$25 - $49 / hr";
  if (low < 100) return "$50 - $99 / hr";
  if (low < 150) return "$100 - $149 / hr";
  if (low < 200) return "$150 - $199 / hr";
  return "$200+ / hr";
}

function budgetThreshold(label: string): number {
  return Number(label.replace(/[^\d]/g, "")) || 0;
}

function ratingThreshold(label: string): number {
  return Number(label.match(/[\d.]+/)?.[0] ?? 0);
}

function filterAgencies(
  agencies: Agency[],
  f: { q: string; service: string; location: string; size: string; budget: string; hourly: string; industry: string; rating: string }
): Agency[] {
  return agencies.filter((a) => {
    if (f.q) {
      const q = f.q.toLowerCase();
      const hit =
        a.name.toLowerCase().includes(q) ||
        (a.tagline || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        a.services.some((s) => s.toLowerCase().includes(q)) ||
        a.industries.some((s) => s.toLowerCase().includes(q)) ||
        a.location.toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (f.service && !a.services.some((s) => s.toLowerCase() === f.service.toLowerCase())) return false;
    if (f.industry && !a.industries.some((s) => s.toLowerCase() === f.industry.toLowerCase())) return false;
    if (f.location && !a.location.toLowerCase().includes(f.location.toLowerCase())) return false;
    if (f.size && a.company_size !== f.size.replace(" employees", "")) return false;
    if (f.budget) {
      const min = a.min_project_size ?? 0;
      if (min < budgetThreshold(f.budget)) return false;
    }
    if (f.hourly && hourlyToBucket(a.hourly_rate) !== f.hourly) return false;
    if (f.rating) {
      if ((a.average_rating ?? 0) < ratingThreshold(f.rating)) return false;
    }
    return true;
  });
}

export default async function AgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const get = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");

  const q = get("q");
  const service = get("service");
  const location = get("location");
  const size = get("size");
  const budget = get("budget");
  const hourly = get("hourly");
  const industry = get("industry");
  const rating = get("rating");

  const allAgencies = await fetchAgencies();

  // Derive real filter options from data
  const serviceOptions = Array.from(new Set(allAgencies.flatMap((a) => a.services))).sort();
  const industryOptions = Array.from(new Set(allAgencies.flatMap((a) => a.industries))).sort();

  const filtered = filterAgencies(allAgencies, { q, service, location, size, budget, hourly, industry, rating });
  const activeFilterCount = [service, location, size, budget, hourly, industry, rating].filter(Boolean).length;

  const agenciesJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Marketing Agency Directory",
    description:
      "Explore top-rated marketing agencies worldwide. Filter by service, location, budget, and company size.",
    url: "https://www.agencyhub.com/agencies",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agenciesJsonLd) }} />

      {/* Header */}
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Top Companies & Agencies
          </h1>
          <p className="mt-3 text-gray-300 text-lg max-w-2xl">
            Browse {allAgencies.length > 0 ? allAgencies.length : "our"} vetted agencies. Filter by service,
            budget, hourly rate, industry, and reviews to find your perfect match.
          </p>
          <div className="mt-8 max-w-2xl">
            <AgencySearchBar initialQuery={q} />
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <AgencyFilterBar
            initialFilters={{ service, location, size, budget, hourly, industry, rating }}
            serviceOptions={serviceOptions}
            industryOptions={industryOptions}
          />
          <p className="text-sm text-gray-500 shrink-0">
            <span className="font-semibold text-navy">{filtered.length}</span> Companies
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy">
              List of the Best Agencies
            </h2>
            {(q || activeFilterCount > 0) && (
              <p className="text-sm text-gray-500">
                {q && <>for &ldquo;<span className="font-medium text-navy">{q}</span>&rdquo; </>}
                {activeFilterCount > 0 && <span className="text-gray-400">· {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}</span>}
              </p>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((agency, index) => (
                <AgencyCard key={agency.id} agency={agency} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy">No agencies found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                {allAgencies.length === 0
                  ? "No agencies have been listed yet. Check back soon!"
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              {allAgencies.length > 0 && (
                <Link
                  href="/agencies"
                  className="inline-flex items-center gap-2 mt-6 bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
                >
                  View All Agencies
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
