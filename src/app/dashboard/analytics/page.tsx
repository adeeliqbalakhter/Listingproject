"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Search,
  MousePointerClick,
  Users,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Inbox,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AnalyticsSkeleton } from "@/components/ui/skeleton";

interface DailyStats {
  date: string;
  profile_views: number;
  search_impressions: number;
  website_clicks: number;
  phone_clicks: number;
  email_clicks: number;
  lead_requests: number;
}

interface LeadByStatus {
  status: string;
  count: number;
}

interface ReviewStats {
  total: number;
  avg_rating: number | null;
  approved: number;
  pending: number;
}

interface AnalyticsData {
  overview: {
    profile_views: number | null;
    total_reviews: number | null;
    total_leads: number | null;
    average_rating: number | null;
  };
  dailyStats: DailyStats[];
  leadsByStatus: LeadByStatus[];
  reviewStats: ReviewStats;
}

const dateRanges = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
] as const;

const LEAD_COLORS: Record<string, string> = {
  new: "#2563EB",
  sent: "#6366F1",
  claimed: "#8B5CF6",
  viewed: "#F59E0B",
  responded: "#10B981",
  won: "#059669",
  lost: "#6B7280",
};

function sumDaily(stats: DailyStats[], key: keyof Omit<DailyStats, "date">): number {
  return stats.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch("/api/agencies/mine");
        if (!res.ok) {
          setError("Failed to load agency data.");
          setLoading(false);
          return;
        }
        const json = await res.json();
        const agencyData = json.data?.agency;
        if (!agencyData) {
          setError("No agency found. Create an agency to view analytics.");
          setLoading(false);
          return;
        }
        setAgencyId(agencyData.id);
      } catch {
        setError("Failed to load agency data.");
        setLoading(false);
      }
    }
    fetchAgency();
  }, []);

  useEffect(() => {
    if (!agencyId) return;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const days = dateRanges.find((d) => d.key === range)?.days ?? 30;
        const res = await fetch(`/api/agencies/${agencyId}/analytics?days=${days}`);
        if (!res.ok) {
          setError("Failed to load analytics.");
          setLoading(false);
          return;
        }
        const json = await res.json();
        setAnalytics(json.data ?? null);
      } catch {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [agencyId, range]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Inbox className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  const daily = analytics?.dailyStats ?? [];
  const overview = analytics?.overview;
  const leadsByStatus = analytics?.leadsByStatus ?? [];
  const reviewStats = analytics?.reviewStats;

  const totalViews = sumDaily(daily, "profile_views");
  const totalImpressions = sumDaily(daily, "search_impressions");
  const totalWebsiteClicks = sumDaily(daily, "website_clicks");
  const totalLeadRequests = sumDaily(daily, "lead_requests");

  const statCards = [
    { label: "Profile Views", value: formatNumber(totalViews), icon: Eye, color: "text-brand", bg: "bg-blue-50" },
    { label: "Search Impressions", value: formatNumber(totalImpressions), icon: Search, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Website Clicks", value: formatNumber(totalWebsiteClicks), icon: MousePointerClick, color: "text-green-600", bg: "bg-green-50" },
    { label: "Lead Requests", value: formatNumber(totalLeadRequests), icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  const chartData = daily.map((d) => ({
    date: formatDateShort(d.date),
    views: Number(d.profile_views) || 0,
    impressions: Number(d.search_impressions) || 0,
    clicks: Number(d.website_clicks) || 0,
  }));

  const pieData = leadsByStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: Number(item.count) || 0,
    color: LEAD_COLORS[item.status] || "#9CA3AF",
  }));

  const totalLeadCount = leadsByStatus.reduce((sum, l) => sum + (Number(l.count) || 0), 0);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
          <p className="mt-1 text-gray-500">
            Track your agency&apos;s performance and visibility.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {dateRanges.map((dr) => (
            <button
              key={dr.key}
              onClick={() => setRange(dr.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                range === dr.key
                  ? "bg-white text-navy shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Sections */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Views Over Time - Area Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Views Over Time</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Profile views &amp; website clicks in the last {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-300" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "13px" }}
                  labelStyle={{ fontWeight: 600, color: "#1B2A4A" }}
                />
                <Area type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} fill="url(#viewsGradient)" name="Profile Views" />
                <Area type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} fill="url(#clicksGradient)" name="Website Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 bg-gradient-to-b from-blue-50/50 to-transparent rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No data yet</p>
                <p className="text-xs text-gray-300 mt-1">Views will appear here as your profile gets traffic</p>
              </div>
            </div>
          )}
        </div>

        {/* Daily Impressions - Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Daily Impressions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Search impressions by day</p>
            </div>
            <Search className="w-5 h-5 text-gray-300" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(chartData.length / 7) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "13px" }}
                  labelStyle={{ fontWeight: 600, color: "#1B2A4A" }}
                />
                <Bar dataKey="impressions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Impressions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 bg-gradient-to-b from-purple-50/50 to-transparent rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No data yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Lead Status Breakdown - Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Lead Status Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">Distribution of leads by status</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-gray-300" />
          </div>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "13px" }}
                    formatter={(value) => {
                      const v = Number(value) || 0;
                      return [`${v} (${totalLeadCount > 0 ? Math.round((v / totalLeadCount) * 100) : 0}%)`, ""];
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-gray-500 mt-2">
                <span className="font-semibold text-navy">{totalLeadCount}</span> total leads
              </p>
            </div>
          ) : (
            <div className="h-56 bg-gradient-to-b from-green-50/50 to-transparent rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <PieChartIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No leads yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Stats & Overview Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-navy">Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Aggregate agency stats</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Metric</th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="px-6 py-3.5 text-sm text-gray-600">All-time Profile Views</td>
                <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                  {formatNumber(Number(overview?.profile_views) || 0)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-6 py-3.5 text-sm text-gray-600">Total Leads</td>
                <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                  {formatNumber(Number(overview?.total_leads) || 0)}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-6 py-3.5 text-sm text-gray-600">Average Rating</td>
                <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                  {overview?.average_rating != null ? Number(overview.average_rating).toFixed(1) : "N/A"}
                </td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="px-6 py-3.5 text-sm text-gray-600">Total Reviews</td>
                <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                  {formatNumber(Number(overview?.total_reviews) || 0)}
                </td>
              </tr>
              {reviewStats && (
                <>
                  <tr className="border-b border-gray-50">
                    <td className="px-6 py-3.5 text-sm text-gray-600">Approved Reviews</td>
                    <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                      {formatNumber(Number(reviewStats.approved) || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-3.5 text-sm text-gray-600">Pending Reviews</td>
                    <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                      {formatNumber(Number(reviewStats.pending) || 0)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
