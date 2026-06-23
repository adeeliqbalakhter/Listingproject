"use client";

import { useState, useEffect } from "react";
import {
  Eye, Search, MousePointerClick, Phone, Mail, Users, TrendingUp,
  TrendingDown, Target, Trophy, BarChart3, Star, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, Inbox, Loader2, Download,
  PieChart as PieChartIcon
} from "lucide-react";

interface ReportData {
  period: number;
  agency: {
    profileViews: number;
    totalReviews: number;
    totalLeads: number;
    averageRating: number | null;
    isVerified: boolean;
    isFeatured: boolean;
    status: string;
    createdAt: string;
  };
  periodStats: {
    views: number;
    impressions: number;
    websiteClicks: number;
    phoneClicks: number;
    emailClicks: number;
    leadRequests: number;
    ctr: number;
    conversionRate: number;
  };
  leads: {
    total: number;
    sent: number;
    viewed: number;
    responded: number;
    won: number;
    lost: number;
    claimed: number;
    responseRate: number;
    winRate: number;
  };
  dailyStats: Array<{
    date: string;
    profile_views: number;
    search_impressions: number;
    website_clicks: number;
    phone_clicks: number;
    email_clicks: number;
    lead_requests: number;
  }>;
  leadTimeline: Array<{ week: string; count: number }>;
  reviewBreakdown: Array<{ rating: number; count: number }>;
}

const RANGES = [
  { key: "1", label: "Today" },
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "365", label: "1 year" },
  { key: "custom", label: "Custom" },
] as const;

function fmt(n: number): string { return n.toLocaleString(); }

function pctChange(daily: ReportData["dailyStats"], key: string, days: number): number | null {
  if (daily.length < 2) return null;
  const mid = Math.floor(daily.length / 2);
  const first = daily.slice(0, mid).reduce((s, d) => s + (Number((d as any)[key]) || 0), 0);
  const second = daily.slice(mid).reduce((s, d) => s + (Number((d as any)[key]) || 0), 0);
  if (first === 0) return second > 0 ? 100 : 0;
  return Math.round(((second - first) / first) * 100);
}

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null) return null;
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function MiniBar({ data, maxVal }: { data: number[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-[2px] h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-brand/20 rounded-t-sm min-h-[2px]"
          style={{ height: `${maxVal > 0 ? Math.max(8, (v / maxVal) * 100) : 8}%` }}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-12 shrink-0">{rating} star</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  function handleRangeChange(key: string) {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setRange(key);
  }

  function applyCustomRange() {
    if (customFrom && customTo) {
      setRange(`custom:${customFrom}:${customTo}`);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/agencies/mine");
        if (!res.ok) { setError("Failed to load agency."); setLoading(false); return; }
        const json = await res.json();
        const agency = json.data?.agency;
        if (!agency) { setError("No agency found. Create one to view reports."); setLoading(false); return; }
        setAgencyId(agency.id);
      } catch {
        setError("Failed to load agency.");
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!agencyId) return;
    setLoading(true);
    setError(null);
    let url: string;
    if (range.startsWith("custom:")) {
      const [, from, to] = range.split(":");
      url = `/api/agencies/${agencyId}/reports?from=${from}&to=${to}`;
    } else {
      url = `/api/agencies/${agencyId}/reports?days=${range}`;
    }
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((json) => setData(json.data ?? null))
      .catch(() => setError("Failed to load report data."))
      .finally(() => setLoading(false));
  }, [agencyId, range]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Inbox className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { agency, periodStats: ps, leads, dailyStats, reviewBreakdown } = data;

  const viewsData = dailyStats.map((d) => Number(d.profile_views) || 0);
  const clicksData = dailyStats.map((d) => Number(d.website_clicks) || 0);
  const impressionsData = dailyStats.map((d) => Number(d.search_impressions) || 0);
  const leadsData = dailyStats.map((d) => Number(d.lead_requests) || 0);
  const maxViews = Math.max(...viewsData, 1);
  const maxClicks = Math.max(...clicksData, 1);
  const maxImpressions = Math.max(...impressionsData, 1);
  const maxLeads = Math.max(...leadsData, 1);

  const viewsChange = pctChange(dailyStats, "profile_views", Number(range));
  const clicksChange = pctChange(dailyStats, "website_clicks", Number(range));
  const impressionsChange = pctChange(dailyStats, "search_impressions", Number(range));
  const totalReviewCount = reviewBreakdown.reduce((s, r) => s + r.count, 0);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reports</h1>
          <p className="mt-1 text-gray-500">
            Comprehensive performance report for your agency.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {RANGES.map((r) => {
              const isActive = r.key === "custom" ? showCustom || range.startsWith("custom:") : range === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => handleRangeChange(r.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {showCustom && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700" />
              <button onClick={applyCustomRange} disabled={!customFrom || !customTo}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── VISIBILITY METRICS ─── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Visibility & Reach</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Profile Views", value: ps.views, icon: Eye, color: "#2563eb", bg: "#eff6ff", sparkline: viewsData, max: maxViews, change: viewsChange },
            { label: "Search Impressions", value: ps.impressions, icon: Search, color: "#7c3aed", bg: "#f5f3ff", sparkline: impressionsData, max: maxImpressions, change: impressionsChange },
            { label: "Website Clicks", value: ps.websiteClicks, icon: MousePointerClick, color: "#059669", bg: "#ecfdf5", sparkline: clicksData, max: maxClicks, change: clicksChange },
            { label: "Click-Through Rate", value: null, displayValue: `${ps.ctr}%`, icon: Target, color: "#d97706", bg: "#fffbeb", sparkline: null, max: 0, change: null },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                {stat.change !== null && <ChangeIndicator value={stat.change} />}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.displayValue ?? fmt(stat.value!)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              {stat.sparkline && stat.sparkline.length > 2 && (
                <div className="mt-3">
                  <MiniBar data={stat.sparkline.slice(-14)} maxVal={stat.max} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── ENGAGEMENT METRICS ─── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Engagement</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Phone Clicks", value: ps.phoneClicks, icon: Phone, color: "#2563eb" },
            { label: "Email Clicks", value: ps.emailClicks, icon: Mail, color: "#7c3aed" },
            { label: "Lead Requests", value: ps.leadRequests, icon: Users, color: "#059669" },
            { label: "Conversion Rate", value: null, displayValue: `${ps.conversionRate}%`, icon: TrendingUp, color: "#d97706", desc: "Visitors → Leads" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}10` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.displayValue ?? fmt(stat.value!)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              {stat.desc && <p className="text-[10px] text-gray-400 mt-0.5">{stat.desc}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ─── LEADS FUNNEL ─── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Lead Funnel</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Leads Received</p>
              <p className="text-3xl font-bold text-gray-900">{fmt(leads.total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900">{leads.responseRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-gray-900">{leads.winRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Leads Won</p>
              <p className="text-3xl font-bold text-green-600">{fmt(leads.won)}</p>
            </div>
          </div>

          {/* Funnel Visual */}
          {leads.total > 0 ? (
            <div className="space-y-2">
              {[
                { label: "Received", count: leads.total, color: "#2563eb" },
                { label: "Viewed", count: leads.viewed, color: "#6366f1" },
                { label: "Responded", count: leads.responded, color: "#8b5cf6" },
                { label: "Claimed", count: leads.claimed, color: "#f59e0b" },
                { label: "Won", count: leads.won, color: "#059669" },
                { label: "Lost", count: leads.lost, color: "#6b7280" },
              ].map((stage) => {
                const pct = leads.total > 0 ? (stage.count / leads.total) * 100 : 0;
                return (
                  <div key={stage.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0 text-right">{stage.label}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, background: stage.color }}
                      >
                        {pct > 10 && <span className="text-white text-[10px] font-bold">{stage.count}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-16 shrink-0">{stage.count} ({Math.round(pct)}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No leads received yet. They&apos;ll appear here as they come in.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── REVIEWS & OVERALL ─── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Review Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-navy">Review Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">{totalReviewCount} total reviews</p>
            </div>
            <Star className="w-5 h-5 text-gray-300" />
          </div>
          {agency.averageRating !== null && (
            <div className="flex items-center gap-4 mb-5">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{agency.averageRating.toFixed(1)}</p>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className={`w-4 h-4 ${i <= Math.round(agency.averageRating!) ? "text-yellow-400" : "text-gray-200"}`}
                      fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">avg. rating</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((r) => {
                  const found = reviewBreakdown.find((rb) => rb.rating === r);
                  return <RatingBar key={r} rating={r} count={found?.count ?? 0} total={totalReviewCount} />;
                })}
              </div>
            </div>
          )}
          {totalReviewCount === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Star className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No reviews yet.</p>
            </div>
          )}
        </div>

        {/* All-Time Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-navy">All-Time Summary</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Since {new Date(agency.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-4">
            {[
              { label: "Total Profile Views", value: fmt(agency.profileViews), icon: Eye, color: "#2563eb" },
              { label: "Total Leads", value: fmt(agency.totalLeads), icon: Users, color: "#059669" },
              { label: "Total Reviews", value: fmt(agency.totalReviews), icon: Star, color: "#d97706" },
              { label: "Average Rating", value: agency.averageRating?.toFixed(1) ?? "N/A", icon: Trophy, color: "#7c3aed" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}10` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
            <div className="pt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                {agency.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                    <Clock className="w-3 h-3" /> Unverified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {agency.isFeatured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Star className="w-3 h-3" /> Featured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                    Not Featured
                  </span>
                )}
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                agency.status === "active"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}>
                {agency.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
