"use client";

import { useState } from "react";
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
} from "lucide-react";

type LeadStatus = "new" | "viewed" | "responded" | "won" | "lost";

interface Lead {
  id: number;
  company: string;
  contact: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  status: LeadStatus;
  date: string;
  description: string;
}

const mockLeads: Lead[] = [
  {
    id: 1,
    company: "TechStart Inc.",
    contact: "John Peterson",
    email: "john@techstart.com",
    phone: "+1 (555) 234-5678",
    service: "SEO",
    budget: "$5,000 - $10,000",
    timeline: "1-3 months",
    status: "new",
    date: "2 hours ago",
    description:
      "We need a comprehensive SEO audit and strategy for our SaaS platform. We've been struggling with organic traffic and want to rank for key industry terms. Looking for an agency that can handle both technical SEO and content strategy.",
  },
  {
    id: 2,
    company: "Fashion Forward",
    contact: "Lisa Chen",
    email: "lisa@fashionforward.com",
    phone: "+1 (555) 345-6789",
    service: "Social Media Marketing",
    budget: "$2,000 - $5,000/mo",
    timeline: "Ongoing",
    status: "viewed",
    date: "5 hours ago",
    description:
      "Looking for social media management across Instagram, TikTok, and Pinterest. We're a fashion brand targeting 18-35 year olds and need creative content that drives engagement and sales.",
  },
  {
    id: 3,
    company: "GreenEnergy Co.",
    contact: "Mark Anderson",
    email: "mark@greenenergy.com",
    phone: "+1 (555) 456-7890",
    service: "PPC",
    budget: "$10,000 - $25,000/mo",
    timeline: "6+ months",
    status: "responded",
    date: "1 day ago",
    description:
      "We need Google Ads and LinkedIn Ads management for our B2B solar energy solutions. Currently spending $8k/mo but want to scale while maintaining ROAS above 4x.",
  },
  {
    id: 4,
    company: "Local Restaurant Group",
    contact: "Maria Santos",
    email: "maria@localrg.com",
    phone: "+1 (555) 567-8901",
    service: "Web Design",
    budget: "$3,000 - $5,000",
    timeline: "1-2 months",
    status: "won",
    date: "2 days ago",
    description:
      "Need a website redesign for our chain of 5 restaurants. Must include online ordering integration, menu management, and location pages with Google Maps.",
  },
  {
    id: 5,
    company: "HealthPlus Clinic",
    contact: "Dr. Sarah Williams",
    email: "sarah@healthplus.com",
    phone: "+1 (555) 678-9012",
    service: "Content Marketing",
    budget: "$3,000 - $5,000/mo",
    timeline: "Ongoing",
    status: "new",
    date: "3 days ago",
    description:
      "Looking for a healthcare content marketing agency to create educational blog posts, patient guides, and email newsletters. Must have experience with HIPAA compliance in marketing.",
  },
  {
    id: 6,
    company: "AutoDrive Motors",
    contact: "Tom Blake",
    email: "tom@autodrive.com",
    phone: "+1 (555) 789-0123",
    service: "Video Production",
    budget: "$15,000 - $25,000",
    timeline: "2-3 months",
    status: "lost",
    date: "5 days ago",
    description:
      "Need a series of promotional videos for our new electric vehicle lineup. 3-5 videos for social media, website, and YouTube advertising.",
  },
];

const stats = [
  { label: "Total Leads", value: "38", icon: Users, color: "text-brand", bg: "bg-blue-50" },
  { label: "New Leads", value: "5", icon: Sparkles, color: "text-green-600", bg: "bg-green-50" },
  { label: "Conversion Rate", value: "24%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Credits Remaining", value: "12", icon: Coins, color: "text-orange-500", bg: "bg-orange-50" },
];

const statusConfig: Record<LeadStatus, { label: string; classes: string }> = {
  new: { label: "New", classes: "bg-blue-50 text-brand" },
  viewed: { label: "Viewed", classes: "bg-yellow-50 text-yellow-700" },
  responded: { label: "Responded", classes: "bg-green-50 text-green-700" },
  won: { label: "Won", classes: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Lost", classes: "bg-red-50 text-red-600" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState(mockLeads);
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");

  const filteredLeads = leads.filter((l) => {
    if (filter === "all") return true;
    return l.status === filter;
  });

  const updateStatus = (id: number, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  };

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
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {lead.service}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {lead.budget}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {lead.timeline}
                        </span>
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
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {lead.description}
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
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {lead.email}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {lead.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-200 flex-wrap">
                    {lead.status === "new" && (
                      <button
                        onClick={() => updateStatus(lead.id, "viewed")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Mark as Viewed
                      </button>
                    )}
                    {(lead.status === "new" || lead.status === "viewed") && (
                      <button
                        onClick={() => updateStatus(lead.id, "responded")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Respond
                      </button>
                    )}
                    {lead.status !== "won" && lead.status !== "lost" && (
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
