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
} from "lucide-react";

type LeadStatus = "new" | "viewed" | "responded" | "won" | "lost";

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  project_description: string;
  budget: string;
  timeline: string;
  service_ids: string[] | null;
  status: LeadStatus;
  created_at: string;
}

const statusConfig: Record<LeadStatus, { label: string; classes: string }> = {
  new: { label: "New", classes: "bg-blue-50 text-brand" },
  viewed: { label: "Viewed", classes: "bg-yellow-50 text-yellow-700" },
  responded: { label: "Responded", classes: "bg-green-50 text-green-700" },
  won: { label: "Won", classes: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Lost", classes: "bg-red-50 text-red-600" },
};

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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/leads?limit=50");
        if (res.ok) {
          const json = await res.json();
          setLeads(json.data ?? []);
        }
      } catch {
        // silently fail
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

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const stats = [
    { label: "Total Leads", value: String(totalLeads), icon: Users, color: "text-brand", bg: "bg-blue-50" },
    { label: "New Leads", value: String(newLeads), icon: Sparkles, color: "text-green-600", bg: "bg-green-50" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Won Leads", value: String(wonLeads), icon: Coins, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  const updateStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
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
        {(["all", "new", "viewed", "responded", "won", "lost"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-brand text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {f === "all" ? "All" : statusConfig[f].label}
            </button>
          )
        )}
      </div>

      {/* Lead Cards */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => {
          const isExpanded = expandedLead === lead.id;
          const leadStatus = (lead.status || "new") as LeadStatus;
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
                          {lead.company_name || "Unknown Company"}
                        </p>
                        {statusConfig[leadStatus] && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[leadStatus].classes}`}
                          >
                            {statusConfig[leadStatus].label}
                          </span>
                        )}
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
                    <span className="text-xs text-gray-400">
                      {lead.created_at ? timeAgo(lead.created_at) : ""}
                    </span>
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
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {lead.project_description || "No description provided."}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-navy mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {lead.contact_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {lead.contact_email || "N/A"}
                        </p>
                        {lead.contact_phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {lead.contact_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-200 flex-wrap">
                    {leadStatus === "new" && (
                      <button
                        onClick={() => updateStatus(lead.id, "viewed")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Mark as Viewed
                      </button>
                    )}
                    {(leadStatus === "new" || leadStatus === "viewed") && (
                      <button
                        onClick={() => updateStatus(lead.id, "responded")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Respond
                      </button>
                    )}
                    {leadStatus !== "won" && leadStatus !== "lost" && (
                      <>
                        <button
                          onClick={() => updateStatus(lead.id, "won")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                        >
                          <Trophy className="w-4 h-4" />
                          Mark as Won
                        </button>
                        <button
                          onClick={() => updateStatus(lead.id, "lost")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Mark as Lost
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && leads.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-navy mb-1">No leads yet</p>
            <p className="text-gray-500 text-sm">
              Your leads will appear here when clients submit inquiries.
            </p>
          </div>
        )}

        {leads.length > 0 && filteredLeads.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No leads found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
