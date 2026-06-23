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
  RotateCcw,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  XCircle,
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Server,
} from "lucide-react";
import { useAuth } from "@/components/providers/SessionProvider";

interface TableCheck { table: string; ok: boolean; count: number }
interface ApiCheck { path: string; status: number; ok: boolean; ms: number }

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
  health: {
    database: { connected: boolean; latencyMs: number; tables: TableCheck[] };
    apis: ApiCheck[];
  };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  async function handleChangePassword() {
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }),
      });
      const json = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: json.data?.message || "Password changed successfully." });
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        setPasswordMessage({ type: "error", text: json.error || "Failed to change password." });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setChangingPassword(false);
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
  const h = data.health;
  const tablesOk = h.database.tables.filter(t => t.ok).length;
  const tablesTotal = h.database.tables.length;
  const apisOk = h.apis.filter(a => a.ok).length;
  const apisTotal = h.apis.length;
  const allHealthy = h.database.connected && tablesOk === tablesTotal && apisOk === apisTotal;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Platform Settings</h1>
          <p className="mt-1 text-gray-500">System configuration, security, and health monitoring.</p>
        </div>
        <button onClick={fetchSettings} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* ═══ CHANGE PASSWORD ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand" /> Change Password
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-6 mb-4">
            <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user?.name?.substring(0, 2).toUpperCase() || "AD"}</span>
            </div>
            <div>
              <p className="font-medium text-navy">{user?.name || "Admin"}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                <Shield className="w-3 h-3" /> {user?.role === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none pr-10" />
                <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input type="password" value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
              {passwords.confirm && passwords.new !== passwords.confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>
          </div>
          {passwordMessage && (
            <div className={`flex items-center gap-2 mt-4 text-sm ${passwordMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {passwordMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {passwordMessage.text}
            </div>
          )}
          <div className="flex justify-end mt-5">
            <button onClick={handleChangePassword}
              disabled={changingPassword || !passwords.current || !passwords.new || passwords.new !== passwords.confirm || passwords.new.length < 6}
              className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50">
              {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ PROJECT HEALTH ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" /> Project Health
        </h2>

        {/* Overall Status */}
        <div className={`rounded-xl border p-5 mb-4 flex items-center gap-4 ${allHealthy ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${allHealthy ? "bg-emerald-100" : "bg-amber-100"}`}>
            {allHealthy ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
          </div>
          <div>
            <p className={`font-semibold ${allHealthy ? "text-emerald-800" : "text-amber-800"}`}>
              {allHealthy ? "All Systems Operational" : "Some Issues Detected"}
            </p>
            <p className={`text-sm ${allHealthy ? "text-emerald-600" : "text-amber-600"}`}>
              DB: {h.database.connected ? "Connected" : "Down"} ({h.database.latencyMs}ms) &bull; Tables: {tablesOk}/{tablesTotal} &bull; APIs: {apisOk}/{apisTotal}
            </p>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy flex items-center gap-2">
              <Database className="w-4 h-4 text-brand" /> Database Health
            </h3>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{h.database.latencyMs}ms latency</span>
              {h.database.connected ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <Wifi className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                  <WifiOff className="w-3 h-3" /> Disconnected
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {h.database.tables.map((t) => (
              <div key={t.table} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${t.ok ? "bg-gray-50" : "bg-red-50"}`}>
                {t.ok ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className={`font-medium truncate ${t.ok ? "text-navy" : "text-red-700"}`}>{t.table}</p>
                  <p className="text-gray-400">{t.ok ? `${t.count.toLocaleString()} rows` : "Missing"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand" /> API Endpoints Health
          </h3>
          <div className="space-y-2">
            {h.apis.map((api) => (
              <div key={api.path} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  {api.ok ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <code className="text-sm text-navy">{api.path}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    api.status >= 200 && api.status < 300 ? "bg-emerald-50 text-emerald-700"
                    : api.status >= 300 && api.status < 400 ? "bg-blue-50 text-blue-700"
                    : api.status >= 400 && api.status < 500 ? "bg-amber-50 text-amber-700"
                    : api.status >= 500 ? "bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {api.status || "TIMEOUT"}
                  </span>
                  <span className={`text-xs ${api.ms > 2000 ? "text-red-500" : api.ms > 500 ? "text-amber-500" : "text-gray-400"}`}>
                    {api.ms}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DATABASE STATUS ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Data Overview</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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

      {/* ═══ DATABASE SETUP ═══ */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4">Database Setup</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Run database setup to create tables, seed services, industries, countries, and cities.
            Use &quot;Force Re-setup&quot; to drop and recreate all reference data.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => runSetup(false)} disabled={setupLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Run Setup
            </button>
            <button onClick={() => runSetup(true)} disabled={setupLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors">
              {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Force Re-setup
            </button>
            <button onClick={runSeed} disabled={seedLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {seedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Seed Data
            </button>
          </div>
          {setupMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${setupMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {setupMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {setupMessage.text}
            </div>
          )}
          {seedMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${seedMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {seedMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {seedMessage.text}
            </div>
          )}
        </div>
      </section>

      {/* ═══ QUICK LINKS ═══ */}
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

      {/* ═══ ENVIRONMENT ═══ */}
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
