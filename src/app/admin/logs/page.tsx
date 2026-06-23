"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ScrollText,
  Shield,
  Clock,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  User,
  ChevronDown,
  ChevronRight,
  Globe,
  Activity,
  LogIn,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string | null;
  created_at: string;
}

type Tab = "audit" | "activity";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  approve: "bg-emerald-100 text-emerald-700",
  reject: "bg-red-100 text-red-700",
  suspend: "bg-amber-100 text-amber-700",
  verify: "bg-cyan-100 text-cyan-700",
  feature: "bg-purple-100 text-purple-700",
  login: "bg-blue-100 text-blue-700",
  logout: "bg-gray-100 text-gray-600",
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600";
}

export default function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>("audit");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditPagination, setAuditPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [activityPagination, setActivityPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [entityFilter, setEntityFilter] = useState("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (tab === "audit") {
        const params = new URLSearchParams({ page: String(auditPagination.page), limit: "30" });
        if (entityFilter) params.set("entityType", entityFilter);
        const res = await fetch(`/api/admin/audit-logs?${params}`);
        if (!res.ok) throw new Error("Failed to load audit logs");
        const json = await res.json();
        setAuditLogs(json.data || []);
        setAuditPagination(json.pagination || { page: 1, total: 0, totalPages: 0 });
      } else {
        const params = new URLSearchParams({ page: String(activityPagination.page), limit: "30" });
        const res = await fetch(`/api/admin/activity-logs?${params}`);
        if (!res.ok) throw new Error("Failed to load activity logs");
        const json = await res.json();
        setActivityLogs(json.data || []);
        setActivityPagination(json.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [tab, auditPagination.page, activityPagination.page, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function formatDate(d: string) {
    const date = new Date(d);
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function formatJSON(val: any): string {
    if (!val) return "—";
    try {
      return typeof val === "string" ? val : JSON.stringify(val, null, 2);
    } catch { return String(val); }
  }

  const pagination = tab === "audit" ? auditPagination : activityPagination;
  const setPage = (page: number) => {
    if (tab === "audit") setAuditPagination(p => ({ ...p, page }));
    else setActivityPagination(p => ({ ...p, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Logs</h1>
          <p className="mt-1 text-gray-500">Audit trail and login activity across the platform.</p>
        </div>
        <button onClick={fetchLogs} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "audit" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          <Shield className="w-4 h-4" /> Audit Logs
        </button>
        <button onClick={() => setTab("activity")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "activity" ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          <LogIn className="w-4 h-4" /> Login Activity
        </button>
      </div>

      {/* Audit Log Filters */}
      {tab === "audit" && (
        <div className="flex gap-2">
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setAuditPagination(p => ({ ...p, page: 1 })); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="">All Entity Types</option>
            <option value="agency">Agency</option>
            <option value="user">User</option>
            <option value="review">Review</option>
            <option value="lead">Lead</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-gray-600">{error}</p>
          <button onClick={fetchLogs} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Audit Logs */}
      {!loading && !error && tab === "audit" && (
        <>
          {auditLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No audit logs found</p>
              <p className="text-sm text-gray-400 mt-1">Actions will be recorded here as they happen.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
              {auditLogs.map((log) => {
                const expanded = expandedLog === log.id;
                return (
                  <div key={log.id} className="hover:bg-gray-50 transition-colors">
                    <button onClick={() => setExpandedLog(expanded ? null : log.id)}
                      className="w-full flex items-start gap-3 p-4 text-left">
                      <div className="mt-0.5">
                        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-xs text-gray-400 font-mono">{log.entity_id.slice(0, 8)}...</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {log.user_name && (
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.user_name}</span>
                          )}
                          {log.ip_address && (
                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {log.ip_address}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(log.created_at)}</span>
                        </div>
                      </div>
                    </button>
                    {expanded && (log.old_values || log.new_values) && (
                      <div className="px-11 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {log.old_values && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Previous Values</p>
                              <pre className="text-xs bg-red-50 text-red-700 p-3 rounded-lg overflow-x-auto max-h-40">{formatJSON(log.old_values)}</pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">New Values</p>
                              <pre className="text-xs bg-emerald-50 text-emerald-700 p-3 rounded-lg overflow-x-auto max-h-40">{formatJSON(log.new_values)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Activity Logs */}
      {!loading && !error && tab === "activity" && (
        <>
          {activityLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <LogIn className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No login activity found</p>
              <p className="text-sm text-gray-400 mt-1">Login history will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-navy text-sm">{log.user_name || "Unknown"}</p>
                          <p className="text-xs text-gray-400">{log.user_email || "—"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {log.status || "unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{log.ip_address || "—"}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, pagination.page - 1))} disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))} disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
