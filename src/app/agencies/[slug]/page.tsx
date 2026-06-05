import type { Metadata } from "next";
import Link from "next/link";
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
  TrendingUp,
  PenTool,
  Search,
  BarChart3,
  Share2,
  Code,
  Palette,
  Video,
  Target,
  Link2,
  AtSign,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const agency = {
  slug: "sparkline-digital",
  name: "Sparkline Digital",
  tagline: "Data-Driven Growth for Ambitious Brands",
  logo: "https://ui-avatars.com/api/?name=Sparkline+Digital&size=128&background=2563EB&color=fff&bold=true&format=svg",
  verified: true,
  rating: 4.8,
  reviewCount: 142,
  location: "San Francisco, CA",
  country: "United States",
  website: "https://sparklinedigital.com",
  founded: 2016,
  companySize: "50-100",
  hourlyRate: "$150 - $250",
  minProjectSize: "$25,000+",
  about: `Sparkline Digital is an award-winning, full-service digital marketing agency headquartered in San Francisco. Since 2016 we have partnered with over 300 brands — from high-growth startups to Fortune 500 enterprises — delivering measurable results through data-driven strategies.

Our multidisciplinary team of strategists, creatives, engineers, and analysts works as a seamless extension of your marketing department. We combine deep industry expertise with cutting-edge technology to craft campaigns that move the needle on the metrics that matter most: revenue, market share, and customer lifetime value.

We are proud to have been recognised by Clutch, Inc. 5000, and Adweek as a top-performing agency three years running. Our client retention rate exceeds 92 %, a testament to the lasting partnerships we build.`,
  services: [
    { name: "Search Engine Optimization", icon: "Search" },
    { name: "Pay-Per-Click Advertising", icon: "Target" },
    { name: "Social Media Marketing", icon: "Share2" },
    { name: "Content Marketing", icon: "PenTool" },
    { name: "Web Design & Development", icon: "Code" },
    { name: "Brand Strategy", icon: "Palette" },
    { name: "Video Production", icon: "Video" },
    { name: "Conversion Rate Optimization", icon: "TrendingUp" },
    { name: "Email Marketing", icon: "Mail" },
    { name: "Analytics & Reporting", icon: "BarChart3" },
  ],
  portfolio: [
    {
      title: "GreenLeaf Organics — E-Commerce Rebrand",
      description:
        "Complete rebrand and Shopify migration resulting in a 180 % increase in online revenue within six months.",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    },
    {
      title: "FinTrust — Lead Generation Campaign",
      description:
        "Multi-channel PPC and SEO strategy that reduced cost-per-lead by 42 % while tripling qualified leads.",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    },
    {
      title: "UrbanFit — Social Media Launch",
      description:
        "Launched across TikTok, Instagram, and YouTube, growing the brand from 0 to 250K followers in 90 days.",
      image:
        "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&h=400&fit=crop",
    },
    {
      title: "MediCare Plus — Healthcare SEO",
      description:
        "Achieved page-one rankings for 120+ high-intent medical keywords, driving a 215 % lift in organic traffic.",
      image:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
    },
    {
      title: "CloudStack — SaaS Content Engine",
      description:
        "Built a content marketing machine that generates 40K+ monthly organic visitors and 500+ MQLs per month.",
      image:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop",
    },
    {
      title: "Luxe Travel — Video Campaign",
      description:
        "Produced a cinematic video series that earned 8M+ views and lifted brand awareness by 60 % in key markets.",
      image:
        "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?w=600&h=400&fit=crop",
    },
  ],
  reviews: [
    {
      author: "Sarah Mitchell",
      company: "GreenLeaf Organics",
      rating: 5,
      date: "2025-11-12",
      title: "Exceptional results and communication",
      body: "Sparkline completely transformed our digital presence. Their data-driven approach gave us clarity on what was working and what wasn't. Revenue doubled within the first year of working together.",
    },
    {
      author: "James Park",
      company: "FinTrust Capital",
      rating: 5,
      date: "2025-09-03",
      title: "Strategic partner, not just a vendor",
      body: "What sets Sparkline apart is their strategic depth. They didn't just run ads — they helped us rethink our entire funnel. Our CAC dropped 40 % and pipeline grew 3x.",
    },
    {
      author: "Emily Rodriguez",
      company: "UrbanFit",
      rating: 4,
      date: "2025-07-21",
      title: "Creative team with strong analytics chops",
      body: "The social media content they produced was top-tier. Engagement numbers exceeded every benchmark we had. Onboarding could have been a bit smoother, but the results speak for themselves.",
    },
    {
      author: "David Chen",
      company: "CloudStack",
      rating: 5,
      date: "2025-05-15",
      title: "Content marketing experts",
      body: "Sparkline helped us build a content engine that now runs like clockwork. Organic leads are up 400 % and our brand authority in the SaaS space has never been stronger.",
    },
    {
      author: "Lisa Nguyen",
      company: "MediCare Plus",
      rating: 5,
      date: "2025-03-08",
      title: "Healthcare SEO done right",
      body: "Finding an agency that understands both healthcare compliance and SEO is rare. Sparkline nailed it. We rank on page one for virtually every target keyword now.",
    },
  ],
  team: [
    { name: "Olivia Hart", role: "CEO & Founder" },
    { name: "Marcus Lee", role: "VP of Strategy" },
    { name: "Priya Sharma", role: "Head of SEO" },
    { name: "Daniel Kim", role: "Creative Director" },
    { name: "Rachel Adams", role: "Director of Paid Media" },
    { name: "Tom Brennan", role: "Head of Analytics" },
  ],
  social: {
    linkedin: "https://linkedin.com/company/sparklinedigital",
    twitter: "https://twitter.com/sparklinedigital",
    facebook: "https://facebook.com/sparklinedigital",
    instagram: "https://instagram.com/sparklinedigital",
  },
  ratingBreakdown: { 5: 108, 4: 24, 3: 7, 2: 2, 1: 1 },
};

const similarAgencies = [
  {
    slug: "growth-forge",
    name: "GrowthForge",
    tagline: "Performance marketing that scales",
    rating: 4.7,
    reviewCount: 98,
    location: "New York, NY",
    services: ["SEO", "PPC", "Analytics"],
    logo: "https://ui-avatars.com/api/?name=GrowthForge&size=64&background=10B981&color=fff&bold=true&format=svg",
  },
  {
    slug: "pixel-pulse",
    name: "Pixel Pulse",
    tagline: "Creative campaigns, measurable impact",
    rating: 4.6,
    reviewCount: 76,
    location: "Austin, TX",
    services: ["Social Media", "Branding", "Video"],
    logo: "https://ui-avatars.com/api/?name=Pixel+Pulse&size=64&background=F59E0B&color=fff&bold=true&format=svg",
  },
  {
    slug: "apex-digital",
    name: "Apex Digital",
    tagline: "Full-funnel growth, zero guesswork",
    rating: 4.9,
    reviewCount: 64,
    location: "Chicago, IL",
    services: ["SEO", "Content", "Web Design"],
    logo: "https://ui-avatars.com/api/?name=Apex+Digital&size=64&background=8B5CF6&color=fff&bold=true&format=svg",
  },
];

// ---------------------------------------------------------------------------
// Icon map (server component safe)
// ---------------------------------------------------------------------------

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  Target,
  Share2,
  PenTool,
  Code,
  Palette,
  Video,
  TrendingUp,
  Mail,
  BarChart3,
};

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // In production this would fetch from a database using the slug
  void slug;

  return {
    title: `${agency.name} — ${agency.tagline}`,
    description: `${agency.name} is a ${agency.rating}-star rated marketing agency in ${agency.location}. ${agency.services.slice(0, 4).map((s) => s.name).join(", ")} and more. Read ${agency.reviewCount} verified reviews.`,
    openGraph: {
      title: `${agency.name} — ${agency.tagline}`,
      description: `Read ${agency.reviewCount} verified reviews for ${agency.name}, a top-rated agency in ${agency.location}.`,
      type: "website",
      images: [{ url: agency.logo, width: 128, height: 128, alt: agency.name }],
    },
    twitter: {
      card: "summary",
      title: `${agency.name} — ${agency.tagline}`,
      description: `Read ${agency.reviewCount} verified reviews for ${agency.name}.`,
    },
    alternates: {
      canonical: `/agencies/${agency.slug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function Stars({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
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

function RatingBar({ label, count, total }: { label: number; count: number; total: number }) {
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
// Tab IDs (used as hash anchors for a no-JS tabbed experience)
// ---------------------------------------------------------------------------

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "reviews", label: "Reviews" },
  { id: "team", label: "Team" },
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
  // In production, fetch agency data by slug from the database
  void slug;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: agency.name,
    description: agency.tagline,
    url: agency.website,
    logo: agency.logo,
    foundingDate: String(agency.founded),
    address: {
      "@type": "PostalAddress",
      addressLocality: agency.location.split(",")[0].trim(),
      addressRegion: agency.location.split(",")[1]?.trim(),
      addressCountry: agency.country,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: agency.rating,
      reviewCount: agency.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    sameAs: Object.values(agency.social),
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Logo */}
            <div className="shrink-0">
              <img
                src={agency.logo}
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
                {agency.verified && (
                  <span className="inline-flex items-center gap-1 bg-brand/20 text-brand-light text-xs font-semibold px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-4 h-4" /> Verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-300 text-lg">{agency.tagline}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-300">
                {/* Rating */}
                <span className="inline-flex items-center gap-1.5">
                  <Stars rating={agency.rating} />
                  <span className="font-semibold text-white">{agency.rating}</span>
                  <span>({agency.reviewCount} reviews)</span>
                </span>

                {/* Location */}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {agency.location}
                </span>

                {/* Website */}
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4" /> Website
                  <ExternalLink className="w-3 h-3" />
                </a>
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
              <a
                href={`tel:+14155550123`}
                className="inline-flex items-center justify-center gap-2 border border-gray-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-navy-light transition-colors text-sm"
              >
                <Phone className="w-4 h-4" /> (415) 555-0123
              </a>
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Founded</p>
                <p className="font-semibold text-navy">{agency.founded}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Company Size</p>
                <p className="font-semibold text-navy">{agency.companySize}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Hourly Rate</p>
                <p className="font-semibold text-navy">{agency.hourlyRate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Min Project Size</p>
                <p className="font-semibold text-navy">{agency.minProjectSize}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile CTA (sticky bottom bar) */}
      {/* ---------------------------------------------------------------- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
        <Link
          href={`/get-quotes?agency=${agency.slug}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-xl font-medium text-sm hover:bg-brand-dark transition-colors"
        >
          Get a Free Quote
        </Link>
        <a
          href={`tel:+14155550123`}
          className="inline-flex items-center justify-center gap-2 border border-gray-300 text-navy px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </a>
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
                  <h2 className="text-xl font-bold text-navy">About {agency.name}</h2>
                  <div className="mt-4 text-gray-600 leading-relaxed whitespace-pre-line">
                    {agency.about}
                  </div>
                </div>
              </div>

              {/* ---- Services ---- */}
              <div id="services" className="scroll-mt-24">
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-navy">Services</h2>
                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    {agency.services.map((service) => {
                      const Icon = iconMap[service.icon] ?? Briefcase;
                      return (
                        <div
                          key={service.name}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-brand/30 hover:bg-blue-50/40 transition-colors"
                        >
                          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-4.5 h-4.5 text-brand" />
                          </div>
                          <span className="font-medium text-gray-800">{service.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ---- Portfolio ---- */}
              <div id="portfolio" className="scroll-mt-24">
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-navy">Portfolio</h2>
                  <div className="mt-6 grid sm:grid-cols-2 gap-6">
                    {agency.portfolio.map((item) => (
                      <div
                        key={item.title}
                        className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-[3/2] overflow-hidden bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-navy">{item.title}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ---- Reviews ---- */}
              <div id="reviews" className="scroll-mt-24">
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-navy">Reviews</h2>

                  {/* Rating breakdown */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-8">
                    <div className="text-center sm:text-left shrink-0">
                      <p className="text-5xl font-bold text-navy">{agency.rating}</p>
                      <Stars rating={agency.rating} size="w-5 h-5" />
                      <p className="mt-1 text-sm text-gray-500">
                        {agency.reviewCount} reviews
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <RatingBar
                          key={star}
                          label={star}
                          count={agency.ratingBreakdown[star as keyof typeof agency.ratingBreakdown]}
                          total={agency.reviewCount}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Individual reviews */}
                  <div className="mt-8 divide-y divide-gray-100">
                    {agency.reviews.map((review) => (
                      <div key={review.author} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-semibold text-sm">
                                {review.author
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{review.author}</p>
                                <p className="text-xs text-gray-500">{review.company}</p>
                              </div>
                            </div>
                          </div>
                          <time className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(review.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                        <div className="mt-3">
                          <Stars rating={review.rating} />
                          <h4 className="mt-1 font-medium text-gray-900">{review.title}</h4>
                          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                            {review.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ---- Team ---- */}
              <div id="team" className="scroll-mt-24">
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-navy">Team</h2>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {agency.team.map((member) => (
                      <div
                        key={member.name}
                        className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-brand/30 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-navy">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <p className="mt-3 font-semibold text-gray-900 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* Sidebar (1/3) — desktop only */}
            {/* ======================================================== */}
            <aside className="hidden lg:block space-y-6">
              {/* Contact CTA Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-bold text-navy">Ready to get started?</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Tell us about your project and get a custom proposal from {agency.name}.
                </p>
                <Link
                  href={`/get-quotes?agency=${agency.slug}`}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors"
                >
                  Get a Free Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={`tel:+14155550123`}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-navy py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-4 h-4" /> (415) 555-0123
                </a>

                {/* Quick info */}
                <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-800">{agency.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500">Website</p>
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand hover:underline"
                      >
                        {agency.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500">Email</p>
                      <a
                        href="mailto:hello@sparklinedigital.com"
                        className="font-medium text-brand hover:underline"
                      >
                        hello@sparklinedigital.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social links */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Follow</p>
                  <div className="flex gap-2">
                    {[
                      { icon: Link2, href: agency.social.linkedin, label: "LinkedIn" },
                      { icon: AtSign, href: agency.social.twitter, label: "Twitter" },
                      { icon: Globe, href: agency.social.facebook, label: "Facebook" },
                      { icon: Share2, href: agency.social.instagram, label: "Instagram" },
                    ].map(({ icon: SocialIcon, href, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-brand hover:border-brand/30 transition-colors"
                      >
                        <SocialIcon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Similar Agencies */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-navy">Similar Agencies</h2>
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
                    src={a.logo}
                    alt={`${a.name} logo`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-navy group-hover:text-brand transition-colors truncate">
                      {a.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{a.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                    <span className="font-medium text-gray-800">{a.rating}</span>
                    <span>({a.reviewCount})</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {a.location}
                  </span>
                </div>
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
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand group-hover:gap-2 transition-all">
                  View Profile <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
