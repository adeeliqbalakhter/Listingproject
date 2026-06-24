"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Loader2, X, CheckCircle, XCircle } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: string;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  applicable_tiers: string[];
  is_active: boolean;
  created_by_name: string | null;
  created_at: string;
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newValidUntil, setNewValidUntil] = useState("");
  const [newTiers, setNewTiers] = useState<string[]>(["premium", "pro"]);

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/promo-codes");
      const json = await res.json();
      if (json.data) setCodes(json.data);
    } catch {
      setMessage({ type: "error", text: "Failed to load promo codes" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleCreate = async () => {
    if (!newCode.trim() || !newDiscountValue) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          description: newDescription || undefined,
          discountType: newDiscountType,
          discountValue: Number(newDiscountValue),
          maxUses: newMaxUses ? parseInt(newMaxUses) : undefined,
          validUntil: newValidUntil || undefined,
          applicableTiers: newTiers,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Failed to create" });
      } else {
        setMessage({ type: "success", text: `Promo code ${newCode.toUpperCase()} created` });
        setShowCreate(false);
        setNewCode("");
        setNewDescription("");
        setNewDiscountValue("");
        setNewMaxUses("");
        setNewValidUntil("");
        fetchCodes();
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCodeId: id, isActive: !currentActive }),
      });
      if (res.ok) fetchCodes();
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Promo Codes</h1>
          <p className="text-gray-500 mt-1">Create and manage discount codes for agency subscriptions</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancel" : "Create Code"}
        </button>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-navy mb-4">New Promo Code</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Discount Type</label>
              <select
                value={newDiscountType}
                onChange={(e) => setNewDiscountType(e.target.value as "percentage" | "fixed")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Discount Value {newDiscountType === "percentage" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                min="0"
                max={newDiscountType === "percentage" ? "100" : undefined}
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Max Uses (empty = unlimited)</label>
              <input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Valid Until (empty = no expiry)</label>
              <input
                type="date"
                value={newValidUntil}
                onChange={(e) => setNewValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">Applicable Tiers</label>
              <div className="flex gap-3">
                {["premium", "pro", "enterprise"].map((tier) => (
                  <label key={tier} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newTiers.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) setNewTiers([...newTiers, tier]);
                        else setNewTiers(newTiers.filter(t => t !== tier));
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="capitalize">{tier}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={creating || !newCode.trim() || !newDiscountValue}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Promo Code
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy">No promo codes yet</h3>
          <p className="text-gray-500 mt-1">Create your first discount code to offer agencies special pricing</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tiers</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-navy">{code.code}</span>
                    {code.description && <p className="text-xs text-gray-500 mt-0.5">{code.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {code.discount_type === "percentage"
                      ? `${Number(code.discount_value)}%`
                      : `$${Number(code.discount_value)}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : " / unlimited"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {(Array.isArray(code.applicable_tiers) ? code.applicable_tiers : []).map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : "No expiry"}
                  </td>
                  <td className="px-6 py-4">
                    {code.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleActive(code.id, code.is_active)}
                      className={`text-xs font-medium px-3 py-1 rounded-lg ${code.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                    >
                      {code.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
