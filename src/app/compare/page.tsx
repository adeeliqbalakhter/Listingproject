"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Star,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  X,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Trophy,
  TrendingUp,
  Briefcase,
} from "lucide-react";

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string;
  rating: number;
  reviews: number;
  location: string;
  size: string;
  hourlyRate: string;
  minProject: number | null;
  founded: string;
  services: string[];
  industries: string[];
  verified: boolean;
  featured: boolean;
}

function mapApiAgency(raw: Record<string, unknown>): Agency {
  const cityName = raw.city
    ? (raw.city as { name?: string }).name
    : null;
  const countryName = raw.country
    ? (raw.country as { name?: string }).name
    : null;
  const locationParts = [cityName, countryName].filter(Boolean);

  const services = Array.isArray(raw.services)
    ? (raw.services as { name?: string }[]).map((s) => s.name ?? "")
    : [];
  const industries = Array.isArray(raw.industries)
    ? (raw.industries as { name?: string }[]).map((i) => i.name ?? "")
    : [];

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    logo: String(raw.logo ?? ""),
    rating: Number(raw.averageRating ?? raw.average_rating ?? 0),
    reviews: Number(raw.totalReviews ?? raw.total_reviews ?? 0),
    location: locationParts.length > 0 ? locationParts.join(", ") : "-",
    size: String(raw.companySize ?? raw.company_size ?? "-"),
    hourlyRate: String(raw.hourlyRate ?? raw.hourly_rate ?? "-"),
    minProject:
      raw.minProjectSize != null
        ? Number(raw.minProjectSize)
        : raw.min_project_size != null
          ? Number(raw.min_project_size)
          : null,
    founded: String(raw.foundedYear ?? raw.founded_year ?? "-"),
    services,
    industries,
    verified: Boolean(raw.isVerified ?? raw.is_verified ?? false),
    featured: Boolean(raw.isFeatured ?? raw.is_featured ?? false),
  };
}

const comparisonFields = [
  { key: "rating", label: "Rating", icon: Star },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "location", label: "Location", icon: MapPin },
  { key: "size", label: "Company Size", icon: Building2 },
  { key: "hourlyRate", label: "Hourly Rate", icon: DollarSign },
  { key: "minProject", label: "Min Project Size", icon: DollarSign },
  { key: "founded", label: "Founded", icon: Calendar },
] as const;

function generateSummary(agencies: Agency[]) {
  if (agencies.length < 2) return null;

  const bestRating = [...agencies].sort((a, b) => b.rating - a.rating)[0];
  const mostReviews = [...agencies].sort((a, b) => b.reviews - a.reviews)[0];
  const lowestBudget = [...agencies]
    .filter((a) => a.minProject !== null && a.minProject > 0)
    .sort((a, b) => (a.minProject ?? 0) - (b.minProject ?? 0))[0];

  const allServices = new Map<string, string[]>();
  for (const a of agencies) {
    for (const s of a.services) {
      if (!allServices.has(s)) allServices.set(s, []);
      allServices.get(s)!.push(a.name);
    }
  }
  const sharedServices = [...allServices.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([svc]) => svc);

  const allIndustries = new Map<string, string[]>();
  for (const a of agencies) {
    for (const ind of a.industries) {
      if (!allIndustries.has(ind)) allIndustries.set(ind, []);
      allIndustries.get(ind)!.push(a.name);
    }
  }
  const sharedIndustries = [...allIndustries.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([ind]) => ind);

  const uniqueServicesPerAgency = agencies.map((a) => {
    const unique = a.services.filter(
      (s) => !allServices.has(s) || allServices.get(s)!.length === 1
    );
    return { name: a.name, unique };
  });

  const insights: { icon: typeof Trophy; title: string; text: string }[] = [];

  if (bestRating && bestRating.rating > 0) {
    const tied = agencies.filter((a) => a.rating === bestRating.rating);
    if (tied.length === 1) {
      insights.push({
        icon: Trophy,
        title: "Highest Rated",
        text: `${bestRating.name} leads with a ${bestRating.rating.toFixed(1)} rating${bestRating.reviews > 0 ? ` across ${bestRating.reviews} review${bestRating.reviews > 1 ? "s" : ""}` : ""}.`,
      });
    } else {
      insights.push({
        icon: Trophy,
        title: "Top Rated",
        text: `${tied.map((a) => a.name).join(" and ")} are tied at ${bestRating.rating.toFixed(1)} rating.`,
      });
    }
  }

  if (mostReviews && mostReviews.reviews > 0 && mostReviews.id !== bestRating?.id) {
    insights.push({
      icon: TrendingUp,
      title: "Most Reviewed",
      text: `${mostReviews.name} has the most social proof with ${mostReviews.reviews} review${mostReviews.reviews > 1 ? "s" : ""}.`,
    });
  }

  if (lowestBudget && lowestBudget.minProject !== null) {
    insights.push({
      icon: DollarSign,
      title: "Budget-Friendly",
      text: `${lowestBudget.name} has the lowest entry point at $${lowestBudget.minProject.toLocaleString()} minimum project size.`,
    });
  }

  if (sharedServices.length > 0) {
    insights.push({
      icon: Briefcase,
      title: "Common Services",
      text: `All compared agencies offer: ${sharedServices.slice(0, 5).join(", ")}${sharedServices.length > 5 ? ` and ${sharedServices.length - 5} more` : ""}.`,
    });
  }

  for (const entry of uniqueServicesPerAgency) {
    if (entry.unique.length > 0) {
      insights.push({
        icon: Sparkles,
        title: `Unique to ${entry.name}`,
        text: `Only ${entry.name} offers: ${entry.unique.slice(0, 4).join(", ")}${entry.unique.length > 4 ? ` +${entry.unique.length - 4} more` : ""}.`,
      });
    }
  }

  if (sharedIndustries.length > 0) {
    insights.push({
      icon: Building2,
      title: "Shared Industry Focus",
      text: `They overlap in: ${sharedIndustries.slice(0, 5).join(", ")}${sharedIndustries.length > 5 ? ` and ${sharedIndustries.length - 5} more` : ""}.`,
    });
  }

  let recommendation = "";
  if (bestRating && bestRating.rating > 0) {
    if (lowestBudget && lowestBudget.id !== bestRating.id) {
      recommendation = `If quality is your priority, ${bestRating.name} has the strongest rating. For tighter budgets, ${lowestBudget.name} offers a lower entry point.`;
    } else {
      recommendation = `${bestRating.name} stands out with the best rating${lowestBudget ? " and the most accessible pricing" : ""} among the compared agencies.`;
    }
  }

  return { insights, recommendation };
}

export default function ComparePage() {
  const [selected, setSelected] = useState<Agency[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [availableAgencies, setAvailableAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load agencies on mount
  useEffect(() => {
    async function fetchAgencies() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/search?limit=50");
        if (!res.ok) {
          const body = await res.text();
          console.error("Search API error:", res.status, body);
          setError(`Failed to load agencies (${res.status})`);
          setAvailableAgencies([]);
          return;
        }
        const json = await res.json();
        const agencies = (json.data ?? []).map((a: Record<string, unknown>) =>
          mapApiAgency(a)
        );
        setAvailableAgencies(agencies);
        if (agencies.length === 0) {
          setError("No active agencies found");
        }
      } catch (err) {
        console.error("Error loading agencies:", err);
        setError("Network error loading agencies");
        setAvailableAgencies([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAgencies();
  }, []);

  // Search agencies with debounce
  const searchAgencies = useCallback(async (term: string) => {
    const url = term.trim()
      ? `/api/search?query=${encodeURIComponent(term)}&limit=50`
      : "/api/search?limit=50";

    try {
      setSearching(true);
      setError(null);
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        console.error("Search API error:", res.status, body);
        setError(`Search failed (${res.status})`);
        return;
      }
      const json = await res.json();
      const agencies = (json.data ?? []).map((a: Record<string, unknown>) =>
        mapApiAgency(a)
      );
      setAvailableAgencies(agencies);
    } catch (err) {
      console.error("Error searching agencies:", err);
      setError("Network error");
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchAgencies(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchAgencies]);

  const filtered = availableAgencies.filter(
    (a) => !selected.find((s) => s.id === a.id)
  );

  const addAgency = (agency: Agency) => {
    if (selected.length < 4) {
      setSelected([...selected, agency]);
      setShowPicker(false);
      setSearchQuery("");
    }
  };

  const removeAgency = (id: string) => {
    setSelected(selected.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-navy py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">Compare Agencies</h1>
          <p className="mt-2 text-gray-300">
            Select up to 4 agencies to compare side by side
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Selection Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {selected.map((agency) => (
              <div
                key={agency.id}
                className="flex items-center gap-2 bg-blue-50 text-brand px-3 py-2 rounded-lg"
              >
                <span className="text-sm font-medium">{agency.name}</span>
                <button
                  onClick={() => removeAgency(agency.id)}
                  className="text-brand/60 hover:text-brand"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selected.length < 4 && (
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg hover:border-brand hover:text-brand transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Agency
                </button>
                {showPicker && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                    <div className="p-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search agencies..."
                          className="bg-transparent text-sm focus:outline-none w-full"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2">
                      {loading || searching ? (
                        <div className="flex items-center justify-center py-4 gap-2">
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          <p className="text-sm text-gray-400">Loading agencies...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-4 px-3">
                          <p className="text-sm text-red-500">{error}</p>
                          <button onClick={() => searchAgencies(searchQuery)} className="mt-2 text-xs text-brand hover:underline">
                            Try again
                          </button>
                        </div>
                      ) : filtered.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No agencies found
                        </p>
                      ) : (
                        filtered.map((agency) => {
                          const logoSrc = agency.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.name)}&size=40&background=2563EB&color=fff&bold=true&format=svg`;
                          return (
                            <button
                              key={agency.id}
                              onClick={() => addAgency(agency)}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                              <img src={logoSrc} alt="" className="w-8 h-8 rounded-lg border border-gray-100 shrink-0 object-cover" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-navy truncate">{agency.name}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {agency.location} · {agency.rating > 0 ? `${agency.rating.toFixed(1)} stars` : "No rating"}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        {selected.length >= 2 ? (
          <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 w-48">
                    Feature
                  </th>
                  {selected.map((agency) => {
                    const logoSrc = agency.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.name)}&size=64&background=2563EB&color=fff&bold=true&format=svg`;
                    return (
                      <th key={agency.id} className="px-6 py-4 text-center min-w-[200px]">
                        <div className="flex flex-col items-center gap-2">
                          <img src={logoSrc} alt={agency.name} className="w-12 h-12 rounded-xl border border-gray-100 object-cover" />
                          <Link
                            href={`/agencies/${agency.slug}`}
                            className="text-navy font-semibold hover:text-brand transition-colors"
                          >
                            {agency.name}
                          </Link>
                          {agency.verified && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <tr key={field.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Icon className="w-4 h-4 text-gray-400" />
                          {field.label}
                        </div>
                      </td>
                      {selected.map((agency) => {
                        const value = agency[field.key as keyof Agency];
                        const isEmpty =
                          value === null ||
                          value === undefined ||
                          value === "" ||
                          value === "-" ||
                          value === 0;
                        return (
                          <td
                            key={agency.id}
                            className="px-6 py-4 text-center text-sm text-navy"
                          >
                            {field.key === "rating" ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">
                                  {isEmpty ? "N/A" : value}
                                </span>
                              </div>
                            ) : field.key === "minProject" ? (
                              isEmpty
                                ? "N/A"
                                : `$${(value as number).toLocaleString()}`
                            ) : isEmpty ? (
                              <span className="text-gray-400">N/A</span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Services Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      Services
                    </div>
                  </td>
                  {selected.map((agency) => (
                    <td key={agency.id} className="px-6 py-4">
                      {agency.services.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {agency.services.map((s) => (
                            <span
                              key={s}
                              className="text-xs bg-blue-50 text-brand px-2 py-0.5 rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 text-center block">None listed</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Industries Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      Industries
                    </div>
                  </td>
                  {selected.map((agency) => (
                    <td key={agency.id} className="px-6 py-4">
                      {agency.industries.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {agency.industries.map((ind) => (
                            <span
                              key={ind}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 text-center block">None listed</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Feature Checks */}
                {["Verified", "Featured"].map((feat) => (
                  <tr key={feat} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{feat}</td>
                    {selected.map((agency) => {
                      const has =
                        feat === "Verified" ? agency.verified : agency.featured;
                      return (
                        <td key={agency.id} className="px-6 py-4 text-center">
                          {has ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* CTA */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Need help deciding? Get personalized recommendations.
                </p>
                <Link
                  href="/get-quotes"
                  className="bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
                >
                  Get Free Quotes
                </Link>
              </div>
            </div>
          </div>

          {/* Auto-generated Comparison Summary */}
          {(() => {
            const summary = generateSummary(selected);
            if (!summary || summary.insights.length === 0) return null;
            return (
              <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand" />
                    <h2 className="text-lg font-semibold text-navy">Comparison Summary</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Key insights to help you decide</p>
                </div>
                <div className="p-6 grid sm:grid-cols-2 gap-4">
                  {summary.insights.map((insight, idx) => {
                    const Icon = insight.icon;
                    return (
                      <div key={idx} className="flex gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy">{insight.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{insight.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {summary.recommendation && (
                  <div className="px-6 pb-6">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Trophy className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-navy">Our Recommendation</p>
                          <p className="text-sm text-gray-700 mt-0.5">{summary.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-navy">
              Select at least 2 agencies to compare
            </h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Use the &quot;Add Agency&quot; button above to select agencies, then
              compare their ratings, pricing, services, and more side by side.
            </p>
            <Link
              href="/agencies"
              className="mt-6 inline-block text-brand font-medium hover:text-brand-dark transition-colors"
            >
              Browse Agencies →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
