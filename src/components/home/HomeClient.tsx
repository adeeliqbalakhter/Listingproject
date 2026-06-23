"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Search, ArrowRight, Star, Users, TrendingUp, Shield, Globe, Award,
  Zap, CheckCircle, Target, Palette, Mail, Code, BarChart3, Megaphone,
  MapPin, Building2, ChevronRight, Sparkles, Clock, Play
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
    logo: string | null; averageRating: number | null; totalReviews: number;
    isVerified: boolean; isFeatured: boolean; companySize: string | null;
    minProjectSize: number | null; location: string | null; services: string[];
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
      <section className="relative overflow-hidden bg-navy min-h-[600px] lg:min-h-[680px]">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-28 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300 font-medium">
                  {stats.agencies > 0 ? `${stats.agencies.toLocaleString()} agencies and growing` : "Trusted by businesses worldwide"}
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Find & Hire the
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-brand-light to-blue-300 bg-clip-text text-transparent"> Best Agencies </span>
                </span>
                <br className="hidden sm:block" />
                for Your Business
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p className="mt-6 text-lg md:text-xl text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
                Compare top-rated marketing, design, and development agencies.
                Read verified reviews and get free proposals — all in one place.
              </p>
            </AnimatedSection>

            {/* Search Bar */}
            <AnimatedSection delay={300}>
              <div className="mt-10 max-w-2xl mx-auto">
                <form action="/agencies" method="get" className="relative">
                  <div className="flex bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden ring-1 ring-white/20">
                    <div className="flex-1 flex items-center px-5">
                      <Search className="w-5 h-5 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        name="q"
                        placeholder="Search by service, industry, or location..."
                        className="w-full px-3 py-4 md:py-5 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-brand hover:bg-brand-dark text-white px-6 md:px-8 font-semibold transition-colors text-sm md:text-base"
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
                      className="text-sm text-gray-400/80 hover:text-white px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Trust Bar */}
            <AnimatedSection delay={450}>
              <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-10">
                {[
                  { icon: Shield, text: "Verified Reviews" },
                  { icon: CheckCircle, text: "Free to Use" },
                  { icon: Globe, text: "Global Coverage" },
                  { icon: Zap, text: "Fast Matching" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-gray-400/80">
                    <item.icon className="w-4 h-4 text-brand-light" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" className="w-full text-white">
            <path d="M0 56h1440V28C1440 28 1320 0 1080 0S720 28 720 28 540 56 360 56 0 28 0 28v28z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-white relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: stats.agencies, suffix: "+", label: "Agencies Listed", icon: Building2 },
                { value: stats.countries || 150, suffix: "+", label: "Countries Covered", icon: Globe },
                { value: stats.reviews, suffix: "+", label: "Verified Reviews", icon: Star },
                { value: stats.agencies > 0 ? Math.floor(stats.agencies * 2.5) : 0, suffix: "+", label: "Businesses Matched", icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-brand" />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-navy">
                    {stat.value > 0 ? <CountUp end={stat.value} suffix={stat.suffix} /> : `0${stat.suffix}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TOP AGENCIES ─── */}
      {agencies.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Top Rated</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-navy">Featured Agencies</h2>
                  <p className="mt-2 text-gray-500 max-w-lg">
                    Handpicked agencies with outstanding track records and verified client reviews.
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {agencies.map((agency, i) => (
                <AnimatedSection key={agency.id} delay={i * 80}>
                  <Link
                    href={`/agencies/${agency.slug}`}
                    className="group block bg-white rounded-2xl border border-gray-200 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 overflow-hidden h-full"
                  >
                    {/* Card Header */}
                    <div className="relative h-20 bg-gradient-to-r from-navy to-navy-light">
                      {agency.isFeatured && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-yellow-400/90 text-navy text-[10px] font-bold uppercase rounded-md tracking-wider">
                          Featured
                        </div>
                      )}
                    </div>
                    <div className="px-5 pb-5">
                      {/* Logo */}
                      <div className="-mt-8 mb-3">
                        {agency.logo ? (
                          <img
                            src={agency.logo}
                            alt={agency.name}
                            className="w-16 h-16 rounded-xl border-4 border-white shadow-md object-cover bg-white"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
                            <span className="text-white text-lg font-bold">
                              {agency.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-navy group-hover:text-brand transition-colors line-clamp-1">
                          {agency.name}
                        </h3>
                        {agency.isVerified && (
                          <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-1" />
                        )}
                      </div>

                      {agency.tagline && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{agency.tagline}</p>
                      )}

                      {/* Rating */}
                      <div className="mt-3 flex items-center gap-2">
                        <StarRating rating={agency.averageRating ?? 0} />
                        <span className="text-sm font-semibold text-navy">
                          {agency.averageRating?.toFixed(1) ?? "—"}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({agency.totalReviews} review{agency.totalReviews !== 1 ? "s" : ""})
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {agency.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {agency.location}
                          </span>
                        )}
                        {agency.companySize && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {agency.companySize}
                          </span>
                        )}
                      </div>

                      {/* Services Tags */}
                      {agency.services.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {agency.services.slice(0, 3).map((s) => (
                            <span key={s} className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-md">
                              {s}
                            </span>
                          ))}
                          {agency.services.length > 3 && (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-400 rounded-md">
                              +{agency.services.length - 3}
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
              <h2 className="text-3xl md:text-4xl font-bold text-navy">Browse by Service</h2>
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
                    className="group flex flex-col items-center p-6 md:p-8 bg-white rounded-2xl border border-gray-200 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 transition-all duration-300"
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
              <h2 className="text-3xl md:text-4xl font-bold text-navy">How It Works</h2>
              <p className="mt-3 text-gray-500 max-w-lg mx-auto">
                Find your ideal agency partner in three easy steps.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand/20 via-brand/40 to-brand/20" />

            {[
              {
                step: "01",
                icon: Search,
                title: "Tell Us What You Need",
                desc: "Share your project requirements, budget, and timeline. Our smart matching algorithm finds agencies that fit perfectly.",
                color: "from-blue-500 to-brand",
              },
              {
                step: "02",
                icon: BarChart3,
                title: "Compare Top Agencies",
                desc: "Browse detailed profiles with verified reviews, portfolios, pricing, and case studies. Make data-driven decisions.",
                color: "from-brand to-brand-dark",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Get Free Proposals",
                desc: "Receive tailored proposals from qualified agencies. Compare approaches, timelines, and pricing — all for free.",
                color: "from-brand-dark to-navy",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 150}>
                <div className="relative text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mt-2 mb-4">
                    <span className="text-xs font-bold text-brand tracking-widest">STEP {item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-navy">{item.title}</h3>
                  <p className="mt-3 text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={300}>
            <div className="mt-14 text-center">
              <Link
                href="/get-quotes"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-brand to-brand-dark text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-xl hover:shadow-brand/25 transition-all text-base"
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
                  <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-2">Social Proof</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-navy">What Clients Say</h2>
                  <p className="mt-2 text-gray-500">Real reviews from verified clients.</p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review, i) => (
                <AnimatedSection key={review.id} delay={i * 80}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full flex flex-col">
                    <StarRating rating={review.rating} />
                    {review.title && (
                      <h4 className="mt-3 font-semibold text-navy line-clamp-1">{review.title}</h4>
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
                        <img src={review.agencyLogo} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
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
                <h2 className="text-3xl md:text-4xl font-bold text-navy leading-tight">
                  The Smarter Way to Find & Hire Agencies
                </h2>
                <p className="mt-4 text-gray-500 leading-relaxed">
                  Stop wasting time on endless Google searches. AgencyHub brings everything you
                  need to find, compare, and hire the right agency — all in one place.
                </p>

                <div className="mt-8 space-y-5">
                  {[
                    {
                      icon: Shield,
                      title: "Verified Reviews Only",
                      desc: "Every review is authenticated. No fake ratings, no paid placements in organic listings.",
                    },
                    {
                      icon: Globe,
                      title: "Global Agency Network",
                      desc: `Agencies from ${stats.countries > 0 ? stats.countries + "+" : "150+"} countries. Find local experts or top talent anywhere.`,
                    },
                    {
                      icon: Zap,
                      title: "Smart Matching Engine",
                      desc: "Our algorithm matches you with agencies based on your budget, industry, and specific requirements.",
                    },
                    {
                      icon: CheckCircle,
                      title: "100% Free for Businesses",
                      desc: "Browse profiles, read reviews, compare agencies, and get quotes — completely free.",
                    },
                  ].map((f) => (
                    <div key={f.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <f.icon className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy">{f.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-10 border border-gray-200">
                  <div className="space-y-4">
                    {/* Mock dashboard preview */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy">Agency Comparison</p>
                          <p className="text-xs text-gray-400">Side-by-side analysis</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: "Rating", v1: "4.9", v2: "4.7", v3: "4.5" },
                          { name: "Reviews", v1: "142", v2: "89", v3: "234" },
                          { name: "Starting", v1: "$5K", v2: "$3K", v3: "$10K" },
                        ].map((row) => (
                          <div key={row.name} className="grid grid-cols-4 gap-2 text-xs">
                            <span className="text-gray-400">{row.name}</span>
                            <span className="text-center font-medium text-navy">{row.v1}</span>
                            <span className="text-center font-medium text-navy">{row.v2}</span>
                            <span className="text-center font-medium text-navy">{row.v3}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">Matched</p>
                        <p className="text-2xl font-bold text-navy">24</p>
                        <p className="text-xs text-green-500 font-medium mt-1">agencies found</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">Avg Rating</p>
                        <p className="text-2xl font-bold text-navy">4.8</p>
                        <div className="mt-1"><StarRating rating={5} /></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand/5 rounded-full blur-2xl" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── AGENCY CTA ─── */}
      <section className="relative py-16 md:py-24 bg-navy overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-6">
              <Building2 className="w-4 h-4 text-brand-light" />
              <span className="text-sm text-gray-300 font-medium">For Agencies</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Grow Your Agency with AgencyHub
            </h2>
            <p className="mt-5 text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
              Get discovered by companies actively looking for your services. Showcase your work,
              collect verified reviews, and receive qualified leads.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-navy px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-base"
              >
                List Your Agency — It&apos;s Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors text-base"
              >
                View Pricing Plans
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md mx-auto">
              {[
                { label: "Free Listing", icon: CheckCircle },
                { label: "Lead Generation", icon: Target },
                { label: "Analytics", icon: BarChart3 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-2">
                    <item.icon className="w-5 h-5 text-brand-light" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
