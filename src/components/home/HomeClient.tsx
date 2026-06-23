"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search, ArrowRight, Star, Users, TrendingUp, Shield, Globe, Award,
  Zap, CheckCircle, Target, Palette, Mail, Code, BarChart3, Megaphone,
  MapPin, Building2, ChevronRight, Sparkles
} from "lucide-react";
import { AnimatedSection, CountUp, StarRating } from "./Animations";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  seo: TrendingUp,
  "ppc-and-paid-advertising": Target,
  "social-media-marketing": Megaphone,
  "web-design": Palette,
  "content-marketing": Award,
  branding: Sparkles,
  "email-marketing": Mail,
  "web-development": Code,
  "digital-strategy": BarChart3,
  "mobile-app-development": Globe,
  default: Zap,
};

interface HomepageData {
  stats: { agencies: number; reviews: number; countries: number };
  agencies: Array<{
    id: string; name: string; slug: string; tagline: string | null;
    logo: string | null; coverImage: string | null; averageRating: number | null;
    totalReviews: number; isVerified: boolean; isFeatured: boolean;
    companySize: string | null; minProjectSize: number | null;
    location: string | null; services: string[];
  }>;
  reviews: Array<{
    id: string; rating: number; title: string | null; content: string;
    companyName: string | null; agencyName: string; agencySlug: string;
    agencyLogo: string | null; createdAt: string;
  }>;
  services: Array<{ id: string; name: string; slug: string; agencyCount: number }>;
}

const fallbackServices = [
  { id: "1", name: "SEO", slug: "seo", agencyCount: 0 },
  { id: "2", name: "PPC / Paid Advertising", slug: "ppc-and-paid-advertising", agencyCount: 0 },
  { id: "3", name: "Social Media Marketing", slug: "social-media-marketing", agencyCount: 0 },
  { id: "4", name: "Web Design", slug: "web-design", agencyCount: 0 },
  { id: "5", name: "Content Marketing", slug: "content-marketing", agencyCount: 0 },
  { id: "6", name: "Branding", slug: "branding", agencyCount: 0 },
  { id: "7", name: "Email Marketing", slug: "email-marketing", agencyCount: 0 },
  { id: "8", name: "Web Development", slug: "web-development", agencyCount: 0 },
];

export default function HomeClient() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then((d) => { if (d.stats) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats ?? { agencies: 0, reviews: 0, countries: 0 };
  const agencies = data?.agencies ?? [];
  const reviews = data?.reviews ?? [];
  const services = data?.services?.length ? data.services : fallbackServices;

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden min-h-[580px] lg:min-h-[640px]"
        style={{ background: "linear-gradient(135deg, #0f1b33 0%, #1B2A4A 40%, #243656 70%, #1a2d4d 100%)" }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-20 md:pb-32 lg:pt-24 lg:pb-36">
          <div className="text-center max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/70 font-medium">
                  {stats.agencies > 0 ? `${stats.agencies.toLocaleString()} agencies and growing` : "Trusted by businesses worldwide"}
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
                Find & Hire the{" "}
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 50%, #60a5fa 100%)" }}>
                  Best Agencies
                </span>
                <br />
                for Your Business
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Compare top-rated marketing, design, and development agencies.
                Read verified reviews and get free proposals — all in one place.
              </p>
            </AnimatedSection>

            {/* Search Bar */}
            <AnimatedSection delay={300}>
              <div className="mt-10 max-w-2xl mx-auto">
                <form action="/agencies" method="get">
                  <div className="flex bg-white rounded-2xl overflow-hidden"
                    style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)" }}>
                    <div className="flex-1 flex items-center px-5">
                      <Search className="w-5 h-5 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        name="q"
                        placeholder="Search by service, industry, or location..."
                        className="w-full px-3 py-4 md:py-5 text-gray-800 placeholder-gray-400 focus:outline-none text-base bg-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 md:px-8 font-semibold text-white text-sm md:text-base shrink-0"
                      style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                    >
                      Search
                    </button>
                  </div>
                </form>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {["SEO", "PPC", "Social Media", "Web Design", "Branding"].map((s) => (
                    <Link
                      key={s}
                      href={`/${s.toLowerCase().replace(/ /g, "-")}-agencies`}
                      className="text-sm text-white/50 hover:text-white px-3.5 py-1.5 rounded-full transition-all"
                      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Trust Indicators */}
            <AnimatedSection delay={450}>
              <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
                {[
                  { icon: Shield, text: "Verified Reviews" },
                  { icon: CheckCircle, text: "Free to Use" },
                  { icon: Globe, text: "Global Coverage" },
                  { icon: Zap, text: "Fast Matching" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-blue-400/80" />
                    <span className="text-sm font-medium text-white/50">{item.text}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-white relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: stats.agencies, suffix: "+", label: "Agencies Listed", icon: Building2, color: "#2563eb" },
                { value: stats.countries || 150, suffix: "+", label: "Countries Covered", icon: Globe, color: "#059669" },
                { value: stats.reviews, suffix: "+", label: "Verified Reviews", icon: Star, color: "#d97706" },
                { value: stats.agencies > 0 ? Math.floor(stats.agencies * 2.5) : 0, suffix: "+", label: "Businesses Matched", icon: Users, color: "#7c3aed" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2.5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `${stat.color}10` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {stat.value > 0 ? <CountUp end={stat.value} suffix={stat.suffix} /> : `0${stat.suffix}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED AGENCIES (only if there are featured ones) ─── */}
      {agencies.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Featured</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Top Rated Agencies</h2>
                  <p className="mt-2 text-gray-500 max-w-lg">
                    Handpicked agencies with proven track records and verified client reviews.
                  </p>
                </div>
                <Link
                  href="/agencies"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark transition-colors shrink-0"
                >
                  View All Agencies <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencies.map((agency, i) => (
                <AnimatedSection key={agency.id} delay={i * 80}>
                  <Link
                    href={`/agencies/${agency.slug}`}
                    className="group block bg-white rounded-2xl border border-gray-200 hover:border-brand/40 transition-all duration-300 overflow-hidden h-full"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(37,99,235,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                  >
                    {/* Cover Image / Banner */}
                    <div className="relative h-28 overflow-hidden">
                      {agency.coverImage ? (
                        <img
                          src={agency.coverImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full"
                          style={{ background: `linear-gradient(135deg, #1B2A4A 0%, #2D3F63 50%, #1a3a5c 100%)` }} />
                      )}
                      {agency.isFeatured && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                          style={{ background: "rgba(234,179,8,0.9)", color: "#1a1a1a" }}>
                          <Star className="w-3 h-3" fill="currentColor" />
                          Featured
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-5">
                      {/* Logo overlapping cover */}
                      <div className="-mt-9 mb-3 relative z-10">
                        {agency.logo ? (
                          <img
                            src={agency.logo}
                            alt={agency.name}
                            className="w-[72px] h-[72px] rounded-2xl border-[3px] border-white object-cover bg-white"
                            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                          />
                        ) : (
                          <div className="w-[72px] h-[72px] rounded-2xl border-[3px] border-white flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <span className="text-white text-xl font-bold">
                              {agency.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Agency Name + Verified */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-brand transition-colors line-clamp-1 text-lg">
                          {agency.name}
                        </h3>
                        {agency.isVerified && (
                          <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                        )}
                      </div>

                      {agency.tagline && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2 leading-relaxed">{agency.tagline}</p>
                      )}

                      {/* Rating */}
                      {(agency.averageRating !== null && agency.averageRating > 0) ? (
                        <div className="mt-3 flex items-center gap-2">
                          <StarRating rating={agency.averageRating} />
                          <span className="text-sm font-bold text-gray-900">
                            {agency.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({agency.totalReviews} review{agency.totalReviews !== 1 ? "s" : ""})
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          <StarRating rating={0} />
                          <span className="text-xs text-gray-400">No reviews yet</span>
                        </div>
                      )}

                      {/* Location & Size */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {agency.location && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {agency.location}
                          </span>
                        )}
                        {agency.companySize && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5 text-gray-400" /> {agency.companySize}
                          </span>
                        )}
                      </div>

                      {/* Services */}
                      {agency.services.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {agency.services.slice(0, 3).map((s) => (
                            <span key={s} className="px-2.5 py-1 text-[11px] font-medium bg-gray-50 text-gray-600 rounded-lg border border-gray-100">
                              {s}
                            </span>
                          ))}
                          {agency.services.length > 3 && (
                            <span className="px-2.5 py-1 text-[11px] font-medium bg-gray-50 text-gray-400 rounded-lg border border-gray-100">
                              +{agency.services.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SERVICES ─── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Explore</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Browse by Service</h2>
              <p className="mt-3 text-gray-500 max-w-lg mx-auto">
                Find specialized agencies for every marketing, design, and development need.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, i) => {
              const Icon = SERVICE_ICONS[service.slug] || SERVICE_ICONS.default;
              return (
                <AnimatedSection key={service.id} delay={i * 60}>
                  <Link
                    href={`/${service.slug}-agencies`}
                    className="group flex flex-col items-center p-6 md:p-8 bg-white rounded-2xl border border-gray-200 hover:border-brand/30 transition-all duration-300"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(37,99,235,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)"; }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-brand flex items-center justify-center transition-colors duration-300">
                      <Icon className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="mt-4 font-semibold text-gray-800 group-hover:text-brand transition-colors text-center text-sm md:text-base">
                      {service.name}
                    </h3>
                    {service.agencyCount > 0 && (
                      <p className="mt-1.5 text-xs text-gray-400">
                        {service.agencyCount} {service.agencyCount === 1 ? "agency" : "agencies"}
                      </p>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand mt-3 transition-colors" />
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay={200}>
            <div className="mt-10 text-center">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
              >
                View All Services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Simple Process</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-3 text-gray-500 max-w-lg mx-auto">
                Find your ideal agency partner in three easy steps.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-[52px] left-[22%] right-[22%] h-[2px]"
              style={{ background: "linear-gradient(90deg, transparent, #dbeafe, #93c5fd, #dbeafe, transparent)" }} />

            {[
              {
                step: "01",
                icon: Search,
                title: "Tell Us What You Need",
                desc: "Share your project requirements, budget, and timeline. Our smart matching finds agencies that fit perfectly.",
                gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
              },
              {
                step: "02",
                icon: BarChart3,
                title: "Compare Top Agencies",
                desc: "Browse detailed profiles with verified reviews, portfolios, and pricing. Make data-driven decisions.",
                gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Get Free Proposals",
                desc: "Receive tailored proposals from qualified agencies. Compare approaches, timelines, and pricing — free.",
                gradient: "linear-gradient(135deg, #1d4ed8, #1e3a5f)",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 150}>
                <div className="relative text-center">
                  <div className="w-[72px] h-[72px] mx-auto rounded-2xl flex items-center justify-center relative z-10"
                    style={{ background: item.gradient, boxShadow: "0 8px 24px rgba(37,99,235,0.2)" }}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mt-3 mb-4">
                    <span className="text-xs font-bold text-brand tracking-widest uppercase">Step {item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={300}>
            <div className="mt-14 text-center">
              <Link
                href="/get-quotes"
                className="inline-flex items-center gap-2.5 text-white px-8 py-3.5 rounded-xl font-semibold transition-all text-base"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}
              >
                Get Free Quotes <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      {reviews.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Testimonials</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Clients Say</h2>
                  <p className="mt-2 text-gray-500">Real reviews from verified clients.</p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review, i) => (
                <AnimatedSection key={review.id} delay={i * 80}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full flex flex-col"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <StarRating rating={review.rating} />
                    {review.title && (
                      <h4 className="mt-3 font-semibold text-gray-900 line-clamp-1">{review.title}</h4>
                    )}
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-4 flex-1">
                      &ldquo;{review.content}&rdquo;
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {review.companyName || "Anonymous"}
                        </p>
                        <Link
                          href={`/agencies/${review.agencySlug}`}
                          className="text-xs text-brand hover:text-brand-dark transition-colors"
                        >
                          Review for {review.agencyName}
                        </Link>
                      </div>
                      {review.agencyLogo ? (
                        <img src={review.agencyLogo} alt="" className="w-9 h-9 rounded-xl object-cover bg-gray-100 border border-gray-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-100">
                          <Building2 className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── WHY AGENCYHUB ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection>
              <div>
                <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Why AgencyHub</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  The Smarter Way to<br />Find & Hire Agencies
                </h2>
                <p className="mt-4 text-gray-500 leading-relaxed">
                  Stop wasting time on endless Google searches. AgencyHub brings everything you
                  need to find, compare, and hire the right agency — all in one place.
                </p>

                <div className="mt-8 space-y-5">
                  {[
                    {
                      icon: Shield, color: "#2563eb",
                      title: "Verified Reviews Only",
                      desc: "Every review is authenticated. No fake ratings, no paid placements in organic listings.",
                    },
                    {
                      icon: Globe, color: "#059669",
                      title: "Global Agency Network",
                      desc: `Agencies from ${stats.countries > 0 ? stats.countries + "+" : "150+"} countries. Find local experts or top talent worldwide.`,
                    },
                    {
                      icon: Zap, color: "#d97706",
                      title: "Smart Matching Engine",
                      desc: "Our algorithm matches you with agencies based on your budget, industry, and requirements.",
                    },
                    {
                      icon: CheckCircle, color: "#7c3aed",
                      title: "100% Free for Businesses",
                      desc: "Browse profiles, read reviews, compare agencies, and get quotes — completely free.",
                    },
                  ].map((f) => (
                    <div key={f.title} className="flex gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${f.color}10` }}>
                        <f.icon className="w-5 h-5" style={{ color: f.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{f.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-10 border border-gray-200">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-5 border border-gray-100"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#2563eb10" }}>
                          <TrendingUp className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Agency Comparison</p>
                          <p className="text-xs text-gray-400">Side-by-side analysis</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-4 gap-2 text-xs pb-2 border-b border-gray-100">
                          <span className="text-gray-400 font-medium">Metric</span>
                          <span className="text-center text-gray-400 font-medium">Agency A</span>
                          <span className="text-center text-gray-400 font-medium">Agency B</span>
                          <span className="text-center text-gray-400 font-medium">Agency C</span>
                        </div>
                        {[
                          { name: "Rating", v1: "4.9 ★", v2: "4.7 ★", v3: "4.5 ★" },
                          { name: "Reviews", v1: "142", v2: "89", v3: "234" },
                          { name: "Starting", v1: "$5K", v2: "$3K", v3: "$10K" },
                        ].map((row) => (
                          <div key={row.name} className="grid grid-cols-4 gap-2 text-xs py-1">
                            <span className="text-gray-500 font-medium">{row.name}</span>
                            <span className="text-center font-semibold text-gray-800">{row.v1}</span>
                            <span className="text-center font-semibold text-gray-800">{row.v2}</span>
                            <span className="text-center font-semibold text-gray-800">{row.v3}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-100"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <p className="text-xs text-gray-400 mb-1">Matched</p>
                        <p className="text-2xl font-extrabold text-gray-900">24</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">agencies found</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        <p className="text-xs text-gray-400 mb-1">Avg Rating</p>
                        <p className="text-2xl font-extrabold text-gray-900">4.8</p>
                        <div className="mt-1"><StarRating rating={5} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── AGENCY CTA ─── */}
      <section className="relative py-16 md:py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f1b33 0%, #1B2A4A 40%, #243656 70%, #1a2d4d 100%)" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70 font-medium">For Agencies</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Grow Your Agency<br />with AgencyHub
            </h2>
            <p className="mt-5 text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
              Get discovered by companies actively looking for your services. Showcase your work,
              collect verified reviews, and receive qualified leads.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-base"
              >
                List Your Agency — It&apos;s Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-white transition-colors text-base"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                View Pricing Plans
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm mx-auto">
              {[
                { label: "Free Listing", icon: CheckCircle },
                { label: "Lead Gen", icon: Target },
                { label: "Analytics", icon: BarChart3 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
                    <item.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-xs text-white/40 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
