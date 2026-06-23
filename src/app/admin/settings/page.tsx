"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Database,
  Globe,
  Building2,
  Users,
  Star,
  FileText,
  Layers,
  MapPin,
  Tag,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Shield,
  Trash2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

interface PlatformData {
  totalUsers: number;
  totalAgencies: number;
  totalReviews: number;
  totalLeads: number;
  totalServices: number;
  totalIndustries: number;
  totalCountries: number;
  totalCities: number;
}

interface SettingsData {
  platform: PlatformData;
  dbConnected: boolean;
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function runSetup(force: boolean) {
    setSetupLoading(true);
    setSetupMessage(null);
    try {
      const res = await fetch(`/api/setup${force ? "?force=true" : ""}`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSetupMessage({ type: "success", text: json.message || "Setup completed successfully." });
        fetchSettings();
      } else {
        setSetupMessage({ type: "error", text: json.error || "Setup failed." });
      }
    } catch {
      setSetupMessage({ type: "error", text: "Network error running setup." });
    } finally {
      setSetupLoading(false);
    }
  }

  async function runSeed() {
    setSeedLoading(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/setup/seed", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSeedMessage({ type: "success", text: json.message || "Seed completed successfully." });
        fetchSettings();
      } else {
        setSeedMessage({ type: "error", text: json.error || "Seed failed." });
      }
    } catch {
      setSeedMessage({ type: "error", text: "Seed endpoint not available." });
    } finally {
      setSeedLoading(false);
    }
  }

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
        <button onClick={fetchSettings} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;
  const p = data.platform;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Platform Settings</h1>
          <p className="mt-1 text-gray-500">System configuration and database management.</p>
        </div>
        <button onClick={fetchSettings} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Database Status */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Database Status</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.dbConnected ? "bg-emerald-50" : "bg-red-50"}`}>
              <Database className={`w-5 h-5 ${data.dbConnected ? "text-emerald-600" : "text-red-600"}`} />
            </div>
            <div>
              <p className="font-medium text-navy">PostgreSQL</p>
              <div className="flex items-center gap-1.5">
                {data.dbConnected ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm text-emerald-600">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-sm text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Users", value: p.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Agencies", value: p.totalAgencies, icon: Building2, color: "text-emerald-600 bg-emerald-50" },
              { label: "Reviews", value: p.totalReviews, icon: Star, color: "text-amber-600 bg-amber-50" },
              { label: "Leads", value: p.totalLeads, icon: FileText, color: "text-purple-600 bg-purple-50" },
              { label: "Services", value: p.totalServices, icon: Tag, color: "text-cyan-600 bg-cyan-50" },
              { label: "Industries", value: p.totalIndustries, icon: Layers, color: "text-indigo-600 bg-indigo-50" },
              { label: "Countries", value: p.totalCountries, icon: Globe, color: "text-teal-600 bg-teal-50" },
              { label: "Cities", value: p.totalCities, icon: MapPin, color: "text-orange-600 bg-orange-50" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-navy">{item.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Database Setup */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Database Setup</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Run database setup to create tables, seed services, industries, countries, and cities.
            Use &quot;Force Re-setup&quot; to drop and recreate all reference data.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => runSetup(false)}
              disabled={setupLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Run Setup
            </button>
            <button
              onClick={() => runSetup(true)}
              disabled={setupLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Force Re-setup
            </button>
            <button
              onClick={runSeed}
              disabled={seedLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {seedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Seed Data
            </button>
          </div>
          {setupMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              setupMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {setupMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {setupMessage.text}
            </div>
          )}
          {seedMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              seedMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {seedMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {seedMessage.text}
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Manage Users", description: "View, edit roles, suspend or activate user accounts.", href: "/admin/users", icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Manage Agencies", description: "Approve, verify, feature, or suspend agencies.", href: "/admin/agencies", icon: Building2, color: "text-emerald-600 bg-emerald-50" },
            { label: "Moderate Reviews", description: "Approve, reject, or flag submitted reviews.", href: "/admin/reviews", icon: Star, color: "text-amber-600 bg-amber-50" },
            { label: "Manage Leads", description: "View and manage lead assignments across agencies.", href: "/admin/leads", icon: FileText, color: "text-purple-600 bg-purple-50" },
            { label: "Credit Management", description: "View agency credits and issue top-ups.", href: "/admin/credits", icon: Shield, color: "text-cyan-600 bg-cyan-50" },
            { label: "Platform Reports", description: "View comprehensive platform analytics and metrics.", href: "/admin/reports", icon: Settings, color: "text-indigo-600 bg-indigo-50" },
          ].map((link) => (
            <a key={link.href} href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-medium text-navy text-sm">{link.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{link.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Environment Info */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Environment</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Environment</span>
              <span className="font-medium text-navy">{process.env.NODE_ENV || "development"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Database</span>
              <span className="font-medium text-navy">{data.dbConnected ? "PostgreSQL (Neon)" : "Not connected"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Framework</span>
              <span className="font-medium text-navy">Next.js (App Router)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Platform</span>
              <span className="font-medium text-navy">AgencyHub</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
