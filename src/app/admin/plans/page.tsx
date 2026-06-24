"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Save, Loader2, Users, Briefcase, Crown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  tier: string;
  monthly_price: string;
  yearly_price: string;
  monthly_lead_credits: number;
  max_portfolio_items: number;
  max_team_members: number;
  features: Record<string, boolean>;
  description: string | null;
  is_active: boolean;
  active_subscribers: number;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Partial<Plan>>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (json.data) {
        setPlans(json.data);
        const edits: Record<string, Partial<Plan>> = {};
        for (const p of json.data) {
          edits[p.id] = {
            monthly_price: p.monthly_price,
            yearly_price: p.yearly_price,
            monthly_lead_credits: p.monthly_lead_credits,
            max_portfolio_items: p.max_portfolio_items,
            max_team_members: p.max_team_members,
            description: p.description,
          };
        }
        setEditValues(edits);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load plans" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSave = async (planId: string) => {
    const vals = editValues[planId];
    if (!vals) return;

    setSaving(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          monthlyPrice: Number(vals.monthly_price),
          yearlyPrice: Number(vals.yearly_price),
          monthlyLeadCredits: vals.monthly_lead_credits,
          maxPortfolioItems: vals.max_portfolio_items,
          maxTeamMembers: vals.max_team_members,
          description: vals.description,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Failed to save" });
      } else {
        setMessage({ type: "success", text: `${plans.find(p => p.id === planId)?.name} plan updated` });
        fetchPlans();
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(null);
    }
  };

  const updateField = (planId: string, field: string, value: string | number) => {
    setEditValues(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const tierColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    premium: "bg-blue-100 text-blue-700",
    pro: "bg-purple-100 text-purple-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Plan Management</h1>
          <p className="text-gray-500 mt-1">Update pricing, limits, and features for each subscription tier</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {plans.map((plan) => {
          const vals = editValues[plan.id] ?? {};
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-navy">{plan.name}</h2>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tierColors[plan.tier] ?? "bg-gray-100 text-gray-700"}`}>
                    {plan.tier}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    {plan.active_subscribers} active
                  </div>
                  <button
                    onClick={() => handleSave(plan.id)}
                    disabled={saving === plan.id}
                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
                  >
                    {saving === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={vals.description ?? ""}
                    onChange={(e) => updateField(plan.id, "description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    placeholder="Plan description..."
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5 inline mr-1" />Monthly Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={vals.monthly_price ?? ""}
                      onChange={(e) => updateField(plan.id, "monthly_price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5 inline mr-1" />Yearly Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={vals.yearly_price ?? ""}
                      onChange={(e) => updateField(plan.id, "yearly_price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <Briefcase className="w-3.5 h-3.5 inline mr-1" />Monthly Credits
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={vals.monthly_lead_credits ?? ""}
                      onChange={(e) => updateField(plan.id, "monthly_lead_credits", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">-1 = unlimited</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      <Users className="w-3.5 h-3.5 inline mr-1" />Max Team Members
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={vals.max_team_members ?? ""}
                      onChange={(e) => updateField(plan.id, "max_team_members", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">-1 = unlimited</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Max Portfolio Items</label>
                    <input
                      type="number"
                      min="-1"
                      value={vals.max_portfolio_items ?? ""}
                      onChange={(e) => updateField(plan.id, "max_portfolio_items", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">-1 = unlimited</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
