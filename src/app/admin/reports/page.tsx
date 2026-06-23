"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Star,
  Search,
  Eye,
  MousePointerClick,
  Phone,
  Mail,
  Globe,
  CreditCard,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Crown,
  ShieldCheck,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface DailyPoint { date: string; count: number }
interface RoleCount { role: string; count: number }
interface StatusCount { status: string; count: number }
interface TierCount { tier: string; count: number }
interface QueryCount { query: string; count: number }
interface AgencyRank { id: string; name: string; slug: string; rating: number; reviews?: number; leads?: number }

interface ReportsData {
  period: number;
  platformGrowth: {
    totalUsers: number;
    totalAgencies: number;
    newUsersInPeriod: number;
    newAgenciesInPeriod: number;
    usersByRole: RoleCount[];
    agenciesByStatus: StatusCount[];
    dailySignups: DailyPoint[];
    dailyAgencyRegistrations: DailyPoint[];
  };
  agencyHealth: {
    totalActive: number;
    featured: number;
    verified: number;
    topByRating: AgencyRank[];
    topByLeads: AgencyRank[];
  };
  leadPipeline: {
    total: number;
    newInPeriod: number;
    byStatus: StatusCount[];
    avgPerAgency: number;
    unassigned: number;
    dailyLeads: DailyPoint[];
  };
  revenueCredits: {
    subscriptionsByTier: TierCount[];
    creditsDistributed: number;
    creditsUsed: number;
    creditTopupsInPeriod: { count: number; total: number };
    payments: { total: number; successful: number; failed: number; totalRevenue: number };
  };
  reviews: {
    total: number;
    newInPeriod: number;
    byStatus: StatusCount[];
    platformAvgRating: number;
    dailyReviews: DailyPoint[];
  };
  searchEngagement: {
    totalSearches: number;
    topQueries: QueryCount[];
    totalViews: number;
    totalImpressions: number;
    totalWebsiteClicks: number;
    totalPhoneClicks: number;
    totalEmailClicks: number;
    totalClicks: number;
    ctr: number;
    dailyEngagement: { date: string; views: number; impressions: number; websiteClicks: number; phoneClicks: number; emailClicks: number }[];
  };
  content: {
    totalPosts: number;
    published: number;
    totalViews: number;
  };
}

const PERIODS = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "1 Year", value: 365 },
];

const ROLE_LABELS: Record<string, string> = {
  user: "Users",
  client: "Clients",
  agency_owner: "Agency Owners",
  agency_team_member: "Team Members",
  admin: "Admins",
  super_admin: "Super Admins",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  draft: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-700",
  archived: "bg-slate-100 text-slate-600",
  new: "bg-blue-100 text-blue-700",
  sent: "bg-cyan-100 text-cyan-700",
  viewed: "bg-indigo-100 text-indigo-700",
  responded: "bg-purple-100 text-purple-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  flagged: "bg-orange-100 text-orange-700",
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  premium: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

function MiniChart({ data, color = "#3b82f6", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} className="flex items-center justify-center text-xs text-gray-400">No data</div>;
  const max = Math.max(...data, 1);
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 4)}`).join(" ");
  return (
    <svg width={w} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, chart }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string; chart?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {chart && <div className="flex-shrink-0">{chart}</div>}
      </div>
      <p className="text-2xl font-bold text-navy">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function BadgeList({ items, colorMap }: { items: { label: string; count: number }[]; colorMap: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${colorMap[item.label] || "bg-gray-100 text-gray-600"}`}>
          {item.label}
          <span className="font-bold">{item.count.toLocaleString()}</span>
        </span>
      ))}
    </div>
  );
}

function BarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`, backgroundColor: item.color }}
            >
              {item.value > 0 && <span className="text-xs font-medium text-white">{item.value.toLocaleString()}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardTable({ agencies, valueLabel, valueKey }: { agencies: AgencyRank[]; valueLabel: string; valueKey: "rating" | "leads" }) {
  if (agencies.length === 0) return <p className="text-sm text-gray-400 py-4">No data yet</p>;
  return (
    <div className="divide-y divide-gray-100">
      {agencies.slice(0, 5).map((a, i) => (
        <div key={a.id} className="flex items-center gap-3 py-2.5">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-500"
          }`}>{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy truncate">{a.name}</p>
          </div>
          <span className="text-sm font-semibold text-navy flex-shrink-0">
            {valueKey === "rating" ? `${a.rating.toFixed(1)} ★` : (a.leads ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/reports?days=${days}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load reports (${res.status})`);
      }
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchReports} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { platformGrowth: pg, agencyHealth: ah, leadPipeline: lp, revenueCredits: rc, reviews: rv, searchEngagement: se, content: ct } = data;

  const leadFunnelData = [
    { label: "New", value: lp.byStatus.find(s => s.status === "new")?.count ?? 0, color: "#3b82f6" },
    { label: "Sent", value: lp.byStatus.find(s => s.status === "sent")?.count ?? 0, color: "#06b6d4" },
    { label: "Viewed", value: lp.byStatus.find(s => s.status === "viewed")?.count ?? 0, color: "#8b5cf6" },
    { label: "Responded", value: lp.byStatus.find(s => s.status === "responded")?.count ?? 0, color: "#a855f7" },
    { label: "Won", value: lp.byStatus.find(s => s.status === "won")?.count ?? 0, color: "#10b981" },
    { label: "Lost", value: lp.byStatus.find(s => s.status === "lost")?.count ?? 0, color: "#ef4444" },
  ];
  const leadFunnelMax = Math.max(...leadFunnelData.map(d => d.value), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Platform Reports</h1>
          <p className="mt-1 text-gray-500">Comprehensive analytics across all platform metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  days === p.value ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={fetchReports} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ═══ 1. PLATFORM GROWTH ═══ */}
      <section>
        <SectionHeader title="Platform Growth" description="User signups, agency registrations, and role distribution." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Users" value={pg.totalUsers} sub={`+${pg.newUsersInPeriod} in period`} icon={Users} color="bg-blue-50 text-blue-600"
            chart={<MiniChart data={pg.dailySignups.map(d => d.count)} color="#3b82f6" />} />
          <StatCard label="Total Agencies" value={pg.totalAgencies} sub={`+${pg.newAgenciesInPeriod} in period`} icon={Building2} color="bg-emerald-50 text-emerald-600"
            chart={<MiniChart data={pg.dailyAgencyRegistrations.map(d => d.count)} color="#10b981" />} />
          <StatCard label="New Users" value={pg.newUsersInPeriod} sub={`Last ${data.period} days`} icon={TrendingUp} color="bg-purple-50 text-purple-600" />
          <StatCard label="New Agencies" value={pg.newAgenciesInPeriod} sub={`Last ${data.period} days`} icon={ArrowUpRight} color="bg-amber-50 text-amber-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">Users by Role</h3>
            <BadgeList items={pg.usersByRole.map(r => ({ label: r.role, count: r.count }))} colorMap={{
              user: "bg-blue-50 text-blue-700", client: "bg-cyan-50 text-cyan-700",
              agency_owner: "bg-emerald-50 text-emerald-700", agency_team_member: "bg-teal-50 text-teal-700",
              admin: "bg-purple-50 text-purple-700", super_admin: "bg-red-50 text-red-700",
            }} />
            <div className="mt-3 space-y-1.5">
              {pg.usersByRole.map(r => {
                const pct = pg.totalUsers > 0 ? (r.count / pg.totalUsers) * 100 : 0;
                return (
                  <div key={r.role} className="flex items-center gap-2 text-xs">
                    <span className="w-28 text-gray-500 truncate">{ROLE_LABELS[r.role] || r.role}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-600 font-medium w-10 text-right">{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">Agencies by Status</h3>
            <BadgeList items={pg.agenciesByStatus.map(r => ({ label: r.status, count: r.count }))} colorMap={STATUS_COLORS} />
            <div className="mt-3 space-y-1.5">
              {pg.agenciesByStatus.map(r => {
                const pct = pg.totalAgencies > 0 ? (r.count / pg.totalAgencies) * 100 : 0;
                return (
                  <div key={r.status} className="flex items-center gap-2 text-xs">
                    <span className="w-28 text-gray-500 capitalize">{r.status}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-600 font-medium w-10 text-right">{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. AGENCY HEALTH ═══ */}
      <section>
        <SectionHeader title="Agency Health" description="Active, featured, verified agencies and top performers." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatCard label="Active Agencies" value={ah.totalActive} icon={Building2} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Featured" value={ah.featured} icon={Sparkles} color="bg-amber-50 text-amber-600" />
          <StatCard label="Verified" value={ah.verified} icon={ShieldCheck} color="bg-blue-50 text-blue-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" /> Top Agencies by Rating
            </h3>
            <LeaderboardTable agencies={ah.topByRating} valueLabel="Rating" valueKey="rating" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Agencies by Leads
            </h3>
            <LeaderboardTable agencies={ah.topByLeads} valueLabel="Leads" valueKey="leads" />
          </div>
        </div>
      </section>

      {/* ═══ 3. LEAD PIPELINE ═══ */}
      <section>
        <SectionHeader title="Lead Pipeline" description="Lead volume, status funnel, and assignment distribution." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Leads" value={lp.total} icon={FileText} color="bg-blue-50 text-blue-600"
            chart={<MiniChart data={lp.dailyLeads.map(d => d.count)} color="#3b82f6" />} />
          <StatCard label="New in Period" value={lp.newInPeriod} sub={`Last ${data.period} days`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Avg per Agency" value={lp.avgPerAgency} icon={Building2} color="bg-purple-50 text-purple-600" />
          <StatCard label="Unassigned" value={lp.unassigned} icon={AlertTriangle} color={lp.unassigned > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Lead Status Funnel</h3>
          <BarChart data={leadFunnelData} maxValue={leadFunnelMax} />
        </div>
      </section>

      {/* ═══ 4. REVENUE & CREDITS ═══ */}
      <section>
        <SectionHeader title="Revenue & Credits" description="Subscriptions, credit usage, and payment metrics." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Revenue" value={`$${rc.payments.totalRevenue.toLocaleString()}`} icon={CreditCard} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Successful Payments" value={rc.payments.successful} sub={`${rc.payments.failed} failed`} icon={CreditCard} color="bg-blue-50 text-blue-600" />
          <StatCard label="Credits Distributed" value={rc.creditsDistributed} icon={TrendingUp} color="bg-purple-50 text-purple-600" />
          <StatCard label="Credits Used" value={rc.creditsUsed}
            sub={rc.creditsDistributed > 0 ? `${Math.round((rc.creditsUsed / rc.creditsDistributed) * 100)}% utilization` : undefined}
            icon={TrendingDown} color="bg-amber-50 text-amber-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">Active Subscriptions by Tier</h3>
            {rc.subscriptionsByTier.length > 0 ? (
              <div className="space-y-2">
                {rc.subscriptionsByTier.map(t => (
                  <div key={t.tier} className="flex items-center justify-between">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${TIER_COLORS[t.tier] || "bg-gray-100 text-gray-600"}`}>
                      {t.tier}
                    </span>
                    <span className="text-sm font-semibold text-navy">{t.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4">No active subscriptions</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">Credit Top-ups in Period</h3>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-navy">{rc.creditTopupsInPeriod.count}</p>
                <p className="text-xs text-gray-500">Top-ups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{rc.creditTopupsInPeriod.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Credits Added</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. REVIEWS & MODERATION ═══ */}
      <section>
        <SectionHeader title="Reviews & Moderation" description="Review volume, moderation queue, and average ratings." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Reviews" value={rv.total} icon={Star} color="bg-amber-50 text-amber-600"
            chart={<MiniChart data={rv.dailyReviews.map(d => d.count)} color="#f59e0b" />} />
          <StatCard label="New in Period" value={rv.newInPeriod} sub={`Last ${data.period} days`} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
          <StatCard label="Platform Avg Rating" value={rv.platformAvgRating > 0 ? `${rv.platformAvgRating.toFixed(1)} ★` : "N/A"} icon={Star} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Pending Moderation" value={rv.byStatus.find(s => s.status === "pending")?.count ?? 0}
            icon={AlertTriangle}
            color={(rv.byStatus.find(s => s.status === "pending")?.count ?? 0) > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-600"} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy mb-3">Reviews by Status</h3>
          <BadgeList items={rv.byStatus.map(r => ({ label: r.status, count: r.count }))} colorMap={STATUS_COLORS} />
        </div>
      </section>

      {/* ═══ 6. SEARCH & ENGAGEMENT ═══ */}
      <section>
        <SectionHeader title="Search & Engagement" description="Platform-wide search activity, profile views, and click metrics." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Searches" value={se.totalSearches} icon={Search} color="bg-blue-50 text-blue-600" />
          <StatCard label="Profile Views" value={se.totalViews} icon={Eye} color="bg-purple-50 text-purple-600"
            chart={<MiniChart data={se.dailyEngagement.map(d => d.views)} color="#8b5cf6" />} />
          <StatCard label="Search Impressions" value={se.totalImpressions} icon={Eye} color="bg-cyan-50 text-cyan-600"
            chart={<MiniChart data={se.dailyEngagement.map(d => d.impressions)} color="#06b6d4" />} />
          <StatCard label="Platform CTR" value={`${se.ctr}%`} sub="Views / Impressions" icon={MousePointerClick} color="bg-emerald-50 text-emerald-600" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatCard label="Website Clicks" value={se.totalWebsiteClicks} icon={Globe} color="bg-blue-50 text-blue-600" />
          <StatCard label="Phone Clicks" value={se.totalPhoneClicks} icon={Phone} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Email Clicks" value={se.totalEmailClicks} icon={Mail} color="bg-purple-50 text-purple-600" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy mb-3">Top Search Queries</h3>
          {se.topQueries.length > 0 ? (
            <div className="space-y-2">
              {se.topQueries.map((q, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-sm text-navy">{q.query}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{q.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">No searches recorded in this period</p>
          )}
        </div>
      </section>

      {/* ═══ 7. CONTENT ═══ */}
      <section>
        <SectionHeader title="Content" description="Blog posts and content engagement." />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Blog Posts" value={ct.totalPosts} icon={BookOpen} color="bg-blue-50 text-blue-600" />
          <StatCard label="Published" value={ct.published} icon={FileText} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Total Blog Views" value={ct.totalViews} icon={Eye} color="bg-purple-50 text-purple-600" />
        </div>
      </section>
    </div>
  );
}
