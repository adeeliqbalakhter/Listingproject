"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Search,
  Building2,
  Crown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  Zap,
  Users,
  Briefcase,
  Edit3,
  X,
  Save,
} from "lucide-react";

interface Subscription {
  id: string;
  agency_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  agency_name: string;
  plan_name: string;
  tier: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  monthly_price: string;
  yearly_price: string;
  monthly_lead_credits: number;
  max_portfolio_items: number;
  max_team_members: number;
  features: any;
  is_active: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  free: { bg: "bg-gray-100", text: "text-gray-700", icon: Users },
  premium: { bg: "bg-blue-100", text: "text-blue-700", icon: Zap },
  pro: { bg: "bg-purple-100", text: "text-purple-700", icon: Crown },
  enterprise: { bg: "bg-amber-100", text: "text-amber-700", icon: Briefcase },
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  canceled: "bg-red-100 text-red-700",
  past_due: "bg-amber-100 text-amber-700",
  trialing: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  // Change plan modal
  const [changingPlan, setChangingPlan] = useState<Subscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: String(pagination.page) });
      if (tierFilter) params.set("tier", tierFilter);
      if (search) params.set("agency", search);

      const [subsRes, plansRes] = await Promise.all([
        fetch(`/api/admin/subscriptions?${params}`),
        fetch("/api/plans"),
      ]);

      if (!subsRes.ok) {
        const body = await subsRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load subscriptions");
      }

      const subsJson = await subsRes.json();
      const plansJson = await plansRes.json();

      setSubscriptions(subsJson.data || []);
      setPagination(subsJson.pagination || { page: 1, total: 0, totalPages: 0 });
      setPlans(plansJson.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, tierFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openChangePlan(sub: Subscription) {
    setChangingPlan(sub);
    setSelectedPlanId(sub.plan_id);
    setSaveMessage(null);
  }

  async function handleChangePlan() {
    if (!changingPlan || !selectedPlanId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: changingPlan.agency_id, planId: selectedPlanId }),
      });
      if (res.ok) {
        setSaveMessage({ type: "success", text: "Plan updated and credits granted." });
        setTimeout(() => { setChangingPlan(null); fetchData(); }, 1000);
      } else {
        const json = await res.json().catch(() => ({}));
        setSaveMessage({ type: "error", text: json.error || "Failed to update plan." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  if (loading && subscriptions.length === 0) {
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
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Subscriptions & Plans</h1>
          <p className="mt-1 text-gray-500">Manage agency subscriptions and plan assignments.</p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Plan Overview Cards */}
      {plans.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const style = TIER_STYLES[plan.tier] || TIER_STYLES.free;
            const TierIcon = style.icon;
            const subCount = subscriptions.filter(s => s.plan_id === plan.id && s.status === "active").length;
            return (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg} ${style.text}`}>
                    <TierIcon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}>
                    {plan.tier}
                  </span>
                </div>
                <p className="text-lg font-bold text-navy">{plan.name}</p>
                <p className="text-sm text-gray-500">${plan.monthly_price}/mo &bull; ${plan.yearly_price}/yr</p>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>{plan.monthly_lead_credits} credits/mo</p>
                  <p>{plan.max_portfolio_items} portfolio items</p>
                  <p>{plan.max_team_members} team members</p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-semibold text-navy">{subCount} active</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            placeholder="Search by agency name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {["", "free", "premium", "pro", "enterprise"].map((t) => (
            <button key={t} onClick={() => { setTierFilter(t); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                tierFilter === t ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No subscriptions found</p>
          <p className="text-sm text-gray-400 mt-1">Subscriptions will appear here when agencies subscribe to plans.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Agency</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Billing</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Period End</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscriptions.map((sub) => {
                  const style = TIER_STYLES[sub.tier] || TIER_STYLES.free;
                  const TierIcon = style.icon;
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="font-medium text-navy truncate max-w-[180px]">{sub.agency_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <TierIcon className="w-3 h-3" /> {sub.plan_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sub.status] || "bg-gray-100 text-gray-600"}`}>
                          {sub.status === "active" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 capitalize">{sub.billing_cycle}</td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => openChangePlan(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <Edit3 className="w-3 h-3" /> Change Plan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {subscriptions.length} of {pagination.total} subscriptions
          </p>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setPagination(p => ({ ...p, page }))}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  pagination.page === page ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {changingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-navy">Change Plan</h3>
              <button onClick={() => setChangingPlan(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Changing plan for <span className="font-medium text-navy">{changingPlan.agency_name}</span>.
              Monthly credits will be granted immediately.
            </p>
            <div className="space-y-2 mb-5">
              {plans.map((plan) => {
                const style = TIER_STYLES[plan.tier] || TIER_STYLES.free;
                const TierIcon = style.icon;
                const selected = selectedPlanId === plan.id;
                return (
                  <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selected ? "border-brand bg-blue-50 ring-2 ring-brand/20" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.bg} ${style.text}`}>
                      <TierIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-navy">{plan.name}</p>
                      <p className="text-xs text-gray-500">${plan.monthly_price}/mo &bull; {plan.monthly_lead_credits} credits</p>
                    </div>
                    {selected && <CheckCircle className="w-5 h-5 text-brand" />}
                  </button>
                );
              })}
            </div>
            {saveMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
                saveMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {saveMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {saveMessage.text}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setChangingPlan(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleChangePlan} disabled={saving || selectedPlanId === changingPlan.plan_id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Update Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
