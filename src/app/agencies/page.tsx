import type { Metadata } from "next";
import Link from "next/link";
import { Star, MapPin, ExternalLink, Building2 } from "lucide-react";
import {
  AgencySearchBar,
  AgencySidebar,
} from "@/components/agencies/AgencyFilters";

export const metadata: Metadata = {
  title: "Top Marketing Agencies - Browse & Compare",
  description:
    "Explore top-rated marketing agencies worldwide. Filter by service, location, budget, and company size. Read verified reviews and get free quotes.",
  keywords: [
    "marketing agencies directory",
    "top marketing agencies",
    "find marketing agency",
    "SEO agencies",
    "PPC agencies",
    "digital marketing agencies",
    "agency reviews",
    "agency comparison",
  ],
  openGraph: {
    title: "Top Marketing Agencies - Browse & Compare | AgencyHub",
    description:
      "Explore top-rated marketing agencies worldwide. Filter by service, location, budget, and company size.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Marketing Agencies - Browse & Compare | AgencyHub",
    description:
      "Explore top-rated marketing agencies worldwide. Filter by service, location, budget, and company size.",
  },
};

interface Agency {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  location: string;
  services: string[];
  size: string;
  budget: string;
  logoColor: string;
  logoInitials: string;
}

const MOCK_AGENCIES: Agency[] = [
  {
    id: "1",
    name: "NovaSpark Digital",
    slug: "novaspark-digital",
    tagline:
      "Data-driven SEO and content strategies that generate measurable ROI for growth-stage companies.",
    rating: 4.9,
    reviewCount: 127,
    location: "New York, USA",
    services: ["SEO", "Content Marketing", "PPC"],
    size: "51-200 employees",
    budget: "$10,000 - $25,000",
    logoColor: "bg-blue-600",
    logoInitials: "NS",
  },
  {
    id: "2",
    name: "BrightWave Agency",
    slug: "brightwave-agency",
    tagline:
      "Award-winning social media marketing that builds communities and drives engagement at scale.",
    rating: 4.8,
    reviewCount: 94,
    location: "London, UK",
    services: ["Social Media Marketing", "Branding", "Content Marketing"],
    size: "11-50 employees",
    budget: "$5,000 - $10,000",
    logoColor: "bg-amber-500",
    logoInitials: "BW",
  },
  {
    id: "3",
    name: "Pixel & Code Studio",
    slug: "pixel-and-code-studio",
    tagline:
      "Crafting stunning, conversion-focused web experiences for ambitious brands worldwide.",
    rating: 4.9,
    reviewCount: 211,
    location: "San Francisco, USA",
    services: ["Web Design", "UX/UI Design", "Branding"],
    size: "51-200 employees",
    budget: "$25,000 - $50,000",
    logoColor: "bg-purple-600",
    logoInitials: "PC",
  },
  {
    id: "4",
    name: "Meridian Growth",
    slug: "meridian-growth",
    tagline:
      "Performance marketing specialists delivering exceptional ROAS through paid search and programmatic.",
    rating: 4.7,
    reviewCount: 68,
    location: "Toronto, Canada",
    services: ["PPC", "SEO", "Email Marketing"],
    size: "11-50 employees",
    budget: "$10,000 - $25,000",
    logoColor: "bg-emerald-600",
    logoInitials: "MG",
  },
  {
    id: "5",
    name: "Vanguard Creative",
    slug: "vanguard-creative",
    tagline:
      "Full-service branding and design agency helping startups establish unforgettable brand identities.",
    rating: 4.8,
    reviewCount: 152,
    location: "Berlin, Germany",
    services: ["Branding", "Web Design", "Video Production"],
    size: "51-200 employees",
    budget: "$25,000 - $50,000",
    logoColor: "bg-rose-600",
    logoInitials: "VC",
  },
  {
    id: "6",
    name: "Apex Media Group",
    slug: "apex-media-group",
    tagline:
      "Enterprise-level digital marketing solutions with dedicated teams and transparent reporting.",
    rating: 4.6,
    reviewCount: 83,
    location: "Sydney, Australia",
    services: ["PPC", "Social Media Marketing", "SEO"],
    size: "201-500 employees",
    budget: "$50,000 - $100,000",
    logoColor: "bg-cyan-600",
    logoInitials: "AM",
  },
  {
    id: "7",
    name: "Catalyst Communications",
    slug: "catalyst-communications",
    tagline:
      "Strategic PR and communications that position brands as industry thought leaders.",
    rating: 4.7,
    reviewCount: 56,
    location: "Dubai, UAE",
    services: ["PR & Communications", "Content Marketing", "Social Media Marketing"],
    size: "11-50 employees",
    budget: "$10,000 - $25,000",
    logoColor: "bg-indigo-600",
    logoInitials: "CC",
  },
  {
    id: "8",
    name: "Greenline Digital",
    slug: "greenline-digital",
    tagline:
      "Sustainable marketing solutions for eco-conscious brands. B Corp certified agency.",
    rating: 4.9,
    reviewCount: 41,
    location: "Amsterdam, Netherlands",
    services: ["Content Marketing", "SEO", "Email Marketing"],
    size: "1-10 employees",
    budget: "$5,000 - $10,000",
    logoColor: "bg-green-600",
    logoInitials: "GL",
  },
  {
    id: "9",
    name: "Stratosphere Agency",
    slug: "stratosphere-agency",
    tagline:
      "Video-first creative agency producing scroll-stopping content for DTC and SaaS brands.",
    rating: 4.8,
    reviewCount: 109,
    location: "Singapore",
    services: ["Video Production", "Social Media Marketing", "Branding"],
    size: "51-200 employees",
    budget: "$25,000 - $50,000",
    logoColor: "bg-orange-600",
    logoInitials: "SA",
  },
  {
    id: "10",
    name: "Horizon Partners",
    slug: "horizon-partners",
    tagline:
      "End-to-end email marketing automation that nurtures leads and maximizes customer lifetime value.",
    rating: 4.5,
    reviewCount: 37,
    location: "Remote",
    services: ["Email Marketing", "PPC", "Content Marketing"],
    size: "1-10 employees",
    budget: "Under $5,000",
    logoColor: "bg-teal-600",
    logoInitials: "HP",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;
        return (
          <Star
            key={star}
            className={`w-4 h-4 ${
              filled
                ? "text-amber-400 fill-amber-400"
                : halfFilled
                  ? "text-amber-400 fill-amber-400/50"
                  : "text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}

function AgencyCard({ agency }: { agency: Agency }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:border-brand/40 hover:shadow-md transition-all group">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
        {/* Logo placeholder */}
        <div
          className={`${agency.logoColor} w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0`}
        >
          <span className="text-white font-bold text-xl sm:text-2xl">
            {agency.logoInitials}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-navy group-hover:text-brand transition-colors truncate">
                {agency.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <StarRating rating={agency.rating} />
                <span className="text-sm font-medium text-navy">
                  {agency.rating}
                </span>
                <span className="text-sm text-gray-500">
                  ({agency.reviewCount} reviews)
                </span>
              </div>
            </div>

            <Link
              href={`/agencies/${agency.slug}`}
              className="inline-flex items-center gap-1.5 bg-brand text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors shrink-0 self-start"
            >
              View Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="mt-2 text-gray-600 text-sm leading-relaxed line-clamp-2">
            {agency.tagline}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {agency.location}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {agency.size}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {agency.services.map((service) => (
              <span
                key={service}
                className="inline-block bg-blue-50 text-brand text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function filterAgencies(
  agencies: Agency[],
  filters: {
    q: string;
    service: string;
    location: string;
    size: string;
    budget: string;
  }
): Agency[] {
  return agencies.filter((agency) => {
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const matchesName = agency.name.toLowerCase().includes(query);
      const matchesTagline = agency.tagline.toLowerCase().includes(query);
      const matchesService = agency.services.some((s) =>
        s.toLowerCase().includes(query)
      );
      const matchesLocation = agency.location.toLowerCase().includes(query);
      if (!matchesName && !matchesTagline && !matchesService && !matchesLocation) {
        return false;
      }
    }
    if (filters.service && !agency.services.includes(filters.service)) {
      return false;
    }
    if (filters.location && agency.location !== filters.location) {
      return false;
    }
    if (filters.size && agency.size !== filters.size) {
      return false;
    }
    if (filters.budget && agency.budget !== filters.budget) {
      return false;
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

  const q = typeof params.q === "string" ? params.q : "";
  const service = typeof params.service === "string" ? params.service : "";
  const location = typeof params.location === "string" ? params.location : "";
  const size = typeof params.size === "string" ? params.size : "";
  const budget = typeof params.budget === "string" ? params.budget : "";

  const filteredAgencies = filterAgencies(MOCK_AGENCIES, {
    q,
    service,
    location,
    size,
    budget,
  });

  const activeFilterCount = [service, location, size, budget].filter(Boolean).length;

  return (
    <>
      {/* Page header */}
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Find the Best Marketing Agencies
          </h1>
          <p className="mt-3 text-gray-300 text-lg max-w-2xl">
            Browse {MOCK_AGENCIES.length}+ vetted agencies. Filter by service,
            location, and budget to find your perfect match.
          </p>
          <div className="mt-8 max-w-2xl">
            <AgencySearchBar initialQuery={q} />
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar filters */}
            <AgencySidebar
              initialFilters={{ service, location, size, budget }}
            />

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-navy">
                    {filteredAgencies.length}
                  </span>{" "}
                  {filteredAgencies.length === 1 ? "agency" : "agencies"} found
                  {q && (
                    <>
                      {" "}
                      for{" "}
                      <span className="font-medium text-navy">
                        &ldquo;{q}&rdquo;
                      </span>
                    </>
                  )}
                  {activeFilterCount > 0 && (
                    <span className="text-gray-400">
                      {" "}
                      &middot; {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} active
                    </span>
                  )}
                </p>
              </div>

              {/* Agency list */}
              {filteredAgencies.length > 0 ? (
                <div className="space-y-4">
                  {filteredAgencies.map((agency) => (
                    <AgencyCard key={agency.id} agency={agency} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy">
                    No agencies found
                  </h3>
                  <p className="mt-2 text-gray-500 max-w-md mx-auto">
                    Try adjusting your search or filters to find what you&apos;re
                    looking for. You can also browse all agencies by clearing your
                    filters.
                  </p>
                  <Link
                    href="/agencies"
                    className="inline-flex items-center gap-2 mt-6 bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
                  >
                    View All Agencies
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
