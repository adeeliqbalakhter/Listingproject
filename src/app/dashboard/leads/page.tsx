"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Sparkles,
  TrendingUp,
  Coins,
  Eye,
  Send,
  Trophy,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  FileText,
  Loader2,
  Inbox,
  MessageSquare,
} from "lucide-react";

type LeadStatus = "new" | "sent" | "viewed" | "responded" | "won" | "lost";

interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  budget: string;
  timeline: string;
  status: LeadStatus;
  date: string;
  description: string;
}

interface ApiLead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  project_description: string;
  budget: string | null;
  timeline: string | null;
  status: string;
  created_at: string;
}

const VALID_STATUSES: LeadStatus[] = ["new", "sent", "viewed", "responded", "won", "lost"];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mapApiLead(l: ApiLead): Lead {
  return {
    id: l.id,
    company: l.company_name || "Unknown",
    contact: l.contact_name || "Unknown",
    email: l.contact_email || "",
    phone: l.contact_phone || "",
    budget: l.budget || "",
    timeline: l.timeline || "",
    status: (VALID_STATUSES.includes(l.status as LeadStatus)
      ? l.status
      : "new") as LeadStatus,
    date: l.created_at ? timeAgo(l.created_at) : "",
    description: l.project_description || "",
  };
}

const statusConfig: Record<LeadStatus, { label: string; classes: string }> = {
  new: { label: "New", classes: "bg-blue-50 text-brand" },
  sent: { label: "Sent", classes: "bg-indigo-50 text-indigo-700" },
  viewed: { label: "Viewed", classes: "bg-yellow-50 text-yellow-700" },
  responded: { label: "Responded", classes: "bg-green-50 text-green-700" },
  won: { label: "Won", classes: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Lost", classes: "bg-red-50 text-red-600" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
  });

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/leads?limit=50");
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || `Failed to fetch leads (${res.status})`);
        }
        const json = await res.json();
        const apiLeads: ApiLead[] = json.data ?? [];
        setLeads(apiLeads.map(mapApiLead));
        if (json.pagination) {
          setPagination({
            total: json.pagination.total ?? 0,
            totalPages: json.pagination.totalPages ?? 0,
            page: json.pagination.page ?? 1,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((l) => {
    if (filter === "all") return true;
    return l.status === filter;
  });

  const updateStatus = async (id: string, status: LeadStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status } : l))
        );
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  const statusCounts = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const stats = [
    { label: "Total Leads", value: String(pagination.total || leads.length), icon: Users, color: "text-brand", bg: "bg-blue-50" },
    { label: "New Leads", value: String(statusCounts["new"] || 0), icon: Sparkles, color: "text-green-600", bg: "bg-green-50" },
    { label: "Responded", value: String(statusCounts["responded"] || 0), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Won", value: String(statusCounts["won"] || 0), icon: Coins, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  if (loading) {
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
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Leads</h1>
        <p className="mt-1 text-gray-500">
          Track and manage incoming project inquiries.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
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

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(["all", ...VALID_STATUSES] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-brand text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {f === "all" ? "All" : statusConfig[f as LeadStatus].label}
          </button>
        ))}
      </div>

      {/* Lead Cards */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => {
          const isExpanded = expandedLead === lead.id;
          const isUpdating = updatingId === lead.id;
          return (
            <div
              key={lead.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Lead Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() =>
                  setExpandedLead(isExpanded ? null : lead.id)
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-navy">
                          {lead.company}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[lead.status].classes}`}
                        >
                          {statusConfig[lead.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        {lead.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {lead.budget}
                          </span>
                        )}
                        {lead.timeline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {lead.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">{lead.date}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/50">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-navy mb-2">
                        Project Description
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {lead.description || "No description provided."}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-navy mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {lead.contact}
                        </p>
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-brand flex items-center gap-2 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="w-4 h-4 text-gray-400" />
                            {lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm text-brand flex items-center gap-2 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4 text-gray-400" />
                            {lead.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-200 flex-wrap">
                    {lead.status === "new" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, "viewed"); }}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Mark as Viewed
                      </button>
                    )}
                    {(lead.status === "new" || lead.status === "viewed") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, "responded"); }}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Mark as Responded
                      </button>
                    )}
                    <a
                      href={`/dashboard/messages?leadId=${lead.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Messages
                    </a>
                    {lead.status !== "won" && lead.status !== "lost" && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, "won"); }}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                          Won
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, "lost"); }}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Lost
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredLeads.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No leads found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
