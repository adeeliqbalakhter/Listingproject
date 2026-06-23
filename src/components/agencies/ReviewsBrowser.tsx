"use client";

import { useState, useMemo } from "react";
import { Star, ThumbsUp, CheckCircle2, MessageSquare, Filter, X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RawReview {
  id: string;
  user_name?: string | null;
  reviewer_name?: string | null;
  reviewer_job_title?: string | null;
  company_name?: string | null;
  company_size?: string | null;
  reviewer_company_industry?: string | null;
  service_provided?: string | null;
  project_budget?: string | null;
  created_at?: string | null;
  objective?: string | null;
  enjoyed?: string | null;
  improvements?: string | null;
  title?: string | null;
  content?: string | null;
  pros?: string | null;
  cons?: string | null;
  would_recommend?: boolean | null;
  overall_rating?: any;
  budget_rating?: any;
  quality_rating?: any;
  schedule_rating?: any;
  collaboration_rating?: any;
  is_verified?: boolean | null;
  review_responses?: Array<{ content?: string | null; agency_name?: string | null }>;
}

function Stars({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

function CategoryRating({ label, rating }: { label: string; rating: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{label}</span>
      <Stars rating={rating} size="w-3 h-3" />
    </div>
  );
}

// Normalize a project_budget string into a coarse cost bucket label for filtering.
function costBucketLabel(raw?: string | null): string | null {
  const s = String(raw || "").toLowerCase();
  if (!s) return null;
  if (s.includes("1,000,000") || s.includes("1 million")) return "> $1,000,000";
  if (s.includes("200,000")) return "$200,000 – $999,999";
  if (s.includes("50,000")) return "$50,000 – $199,999";
  if (s.includes("10,000") || s.includes("less than") || s.includes("under")) return "< $49,999";
  return null;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rating" },
  { value: "lowest", label: "Lowest rating" },
] as const;

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-sm border rounded-lg px-3 py-2 bg-white transition-colors ${
        value ? "border-brand text-brand font-medium" : "border-gray-200 text-gray-600"
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function ReviewsBrowser({
  reviews,
  agencyName,
}: {
  reviews: RawReview[];
  agencyName: string;
}) {
  const [service, setService] = useState("");
  const [cost, setCost] = useState("");
  const [industry, setIndustry] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<string>("relevance");

  // Derive filter options from the data
  const serviceOptions = useMemo(
    () => Array.from(new Set(reviews.map((r) => (r.service_provided || "").trim()).filter(Boolean))).sort(),
    [reviews]
  );
  const costOptions = useMemo(
    () => Array.from(new Set(reviews.map((r) => costBucketLabel(r.project_budget)).filter((v): v is string => !!v))).sort(),
    [reviews]
  );
  const industryOptions = useMemo(
    () => Array.from(new Set(reviews.map((r) => (r.reviewer_company_industry || "").trim()).filter(Boolean))).sort(),
    [reviews]
  );

  const filtered = useMemo(() => {
    let list = reviews.filter((r) => {
      if (service && (r.service_provided || "").trim() !== service) return false;
      if (cost && costBucketLabel(r.project_budget) !== cost) return false;
      if (industry && (r.reviewer_company_industry || "").trim() !== industry) return false;
      if (verifiedOnly && !r.is_verified) return false;
      return true;
    });

    const num = (v: any) => Number(v) || 0;
    if (sort === "newest") list = [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (sort === "oldest") list = [...list].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    else if (sort === "highest") list = [...list].sort((a, b) => num(b.overall_rating) - num(a.overall_rating));
    else if (sort === "lowest") list = [...list].sort((a, b) => num(a.overall_rating) - num(b.overall_rating));

    return list;
  }, [reviews, service, cost, industry, verifiedOnly, sort]);

  const hasFilters = service || cost || industry || verifiedOnly;

  function clearFilters() {
    setService("");
    setCost("");
    setIndustry("");
    setVerifiedOnly(false);
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter
          </span>
          <FilterSelect label="Services Provided" value={service} options={serviceOptions} onChange={setService} />
          <FilterSelect label="Project Cost" value={cost} options={costOptions} onChange={setCost} />
          <FilterSelect label="Industry" value={industry} options={industryOptions} onChange={setIndustry} />
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none ml-1">
            <button
              type="button"
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${verifiedOnly ? "bg-emerald-500" : "bg-gray-200"}`}
              aria-pressed={verifiedOnly}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${verifiedOnly ? "translate-x-4" : ""}`}
              />
            </button>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </label>
          {hasFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Showing {filtered.length} of {reviews.length} review{reviews.length === 1 ? "" : "s"}
      </p>

      {/* Review list */}
      {filtered.length > 0 ? (
        <div className="mt-4 divide-y divide-gray-100">
          {filtered.map((review) => {
            const name = review.user_name || review.reviewer_name || "Anonymous";
            const initials = name
              .split(" ")
              .map((w) => w.charAt(0))
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <div key={review.id} className="flex flex-col md:flex-row gap-6 py-6 first:pt-2 last:pb-0">
                {/* Left: reviewer */}
                <div className="md:w-48 shrink-0">
                  <div className="flex items-center gap-3 md:flex-col md:items-start">
                    <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold text-lg">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{name}</p>
                      {review.reviewer_job_title && <p className="text-xs text-brand">{review.reviewer_job_title}</p>}
                      {review.company_name && <p className="text-xs text-gray-500">{review.company_name}</p>}
                    </div>
                  </div>
                  {review.service_provided && (
                    <div className="mt-3 text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">Service</p>
                      <p>{review.service_provided}</p>
                    </div>
                  )}
                  {review.project_budget && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">Project cost</p>
                      <p>{review.project_budget}</p>
                    </div>
                  )}
                  {review.reviewer_company_industry && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">Industry</p>
                      <p>{review.reviewer_company_industry}</p>
                    </div>
                  )}
                  {review.created_at && (
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Center: content */}
                <div className="flex-1 min-w-0">
                  {review.objective ? (
                    <>
                      <div className="mb-4">
                        <p className="font-semibold text-gray-800 text-sm">What was the objective behind your collaboration?</p>
                        <p className="mt-1 text-sm text-gray-600">{review.objective}</p>
                      </div>
                      {review.enjoyed && (
                        <div className="mb-4">
                          <p className="font-semibold text-gray-800 text-sm">What did you enjoy the most during your collaboration?</p>
                          <p className="mt-1 text-sm text-gray-600">{review.enjoyed}</p>
                        </div>
                      )}
                      {review.improvements && (
                        <div className="mb-4">
                          <p className="font-semibold text-gray-800 text-sm">Are there any areas for improvements?</p>
                          <p className="mt-1 text-sm text-gray-600">{review.improvements}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mb-4">
                      <p className="font-semibold text-gray-900">{review.title || "Review"}</p>
                      {review.content && <p className="mt-1 text-sm text-gray-600">{review.content}</p>}
                    </div>
                  )}
                  {review.would_recommend && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                      <ThumbsUp className="w-3 h-3" />
                      {name.split(" ")[0]} recommends this agency
                    </div>
                  )}
                  {review.review_responses && review.review_responses.length > 0 && (
                    <div className="mt-4 bg-blue-50/60 rounded-lg p-4 border-l-4 border-brand">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-xs font-semibold text-navy">{review.review_responses[0].agency_name || agencyName}</p>
                        <span className="text-xs text-gray-400">responded</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.review_responses[0].content}</p>
                    </div>
                  )}
                </div>

                {/* Right: ratings */}
                <div className="md:w-40 shrink-0">
                  <div className="text-center mb-3">
                    <span className="text-2xl font-bold text-brand">{Number(review.overall_rating).toFixed(1)}</span>
                    <span className="text-sm text-gray-400">/5</span>
                  </div>
                  <Stars rating={Number(review.overall_rating)} />
                  {(review.budget_rating || review.quality_rating || review.schedule_rating || review.collaboration_rating) && (
                    <div className="mt-3 space-y-1.5">
                      {review.budget_rating && <CategoryRating label="Budget" rating={Number(review.budget_rating)} />}
                      {review.quality_rating && <CategoryRating label="Quality" rating={Number(review.quality_rating)} />}
                      {review.schedule_rating && <CategoryRating label="Schedule" rating={Number(review.schedule_rating)} />}
                      {review.collaboration_rating && <CategoryRating label="Collaboration" rating={Number(review.collaboration_rating)} />}
                    </div>
                  )}
                  {review.is_verified && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified review
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 text-center py-10 text-sm text-gray-400">
          No reviews match the selected filters.
        </div>
      )}
    </div>
  );
}
