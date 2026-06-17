"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Building2,
  MessageSquare,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  ExternalLink,
  Plus,
  DollarSign,
  Calendar,
  Star,
  Pencil,
  Save,
  X,
} from "lucide-react";

interface Agency {
  assignmentId: string;
  agencyId: string;
  agencyName: string;
  agencyLogo: string | null;
  agencySlug: string | null;
  assignmentStatus: string;
  respondedAt: string | null;
}

interface Project {
  id: string;
  company_name: string;
  project_description: string;
  budget: string | null;
  timeline: string | null;
  status: string;
  created_at: string;
  agencies: Agency[];
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Matching Agencies", color: "bg-blue-50 text-brand" },
  sent: { label: "Sent to Agencies", color: "bg-indigo-50 text-indigo-700" },
  viewed: { label: "In Progress", color: "bg-yellow-50 text-yellow-700" },
  responded: { label: "Proposals Received", color: "bg-green-50 text-green-700" },
  won: { label: "Completed", color: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

const assignmentLabels: Record<string, { label: string; color: string }> = {
  sent: { label: "Pending", color: "text-gray-500" },
  claimed: { label: "Interested", color: "text-brand" },
  responded: { label: "Proposal Sent", color: "text-green-600" },
  won: { label: "Selected", color: "text-emerald-600" },
  lost: { label: "Not Selected", color: "text-gray-400" },
};

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", budget: "", timeline: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/client/projects");
        if (res.ok) {
          const json = await res.json();
          setProjects(json.data ?? []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function startEditing(project: Project) {
    setEditingId(project.id);
    setEditForm({
      description: project.project_description,
      budget: project.budget || "",
      timeline: project.timeline || "",
    });
  }

  async function saveEdit(projectId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDescription: editForm.description,
          budget: editForm.budget || undefined,
          timeline: editForm.timeline || undefined,
        }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? { ...p, project_description: editForm.description, budget: editForm.budget, timeline: editForm.timeline }
              : p
          )
        );
        setEditingId(null);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const respondedCount = projects.filter((p) =>
    p.agencies.some((a) => a.assignmentStatus === "responded" || a.assignmentStatus === "won")
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">My Projects</h1>
          <p className="mt-1 text-gray-500">Track your briefs and agency proposals.</p>
        </div>
        <Link
          href="/get-quotes"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <FolderOpen className="w-5 h-5 text-brand" />
          </div>
          <p className="text-2xl font-bold text-navy">{projects.length}</p>
          <p className="text-sm text-gray-500">Total Projects</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-navy">
            {projects.reduce((sum, p) => sum + p.agencies.filter((a) => a.assignmentStatus !== "sent").length, 0)}
          </p>
          <p className="text-sm text-gray-500">Interested Agencies</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-navy">{respondedCount}</p>
          <p className="text-sm text-gray-500">With Proposals</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
            <Star className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-navy">
            {projects.filter((p) => p.agencies.some((a) => a.assignmentStatus === "won")).length}
          </p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-navy mb-1">No projects yet</h3>
          <p className="text-sm text-gray-500 mb-6">Submit your first brief and get matched with top agencies.</p>
          <Link
            href="/get-quotes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-dark"
          >
            <Plus className="w-4 h-4" />
            Get Free Quotes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const isExpanded = expandedId === project.id;
            const status = statusLabels[project.status] || statusLabels.new;
            const activeAgencies = project.agencies.filter((a) => a.assignmentStatus !== "sent" && a.assignmentStatus !== "lost");
            const respondedAgencies = project.agencies.filter((a) => a.assignmentStatus === "responded" || a.assignmentStatus === "won");

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-navy">{project.company_name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{project.project_description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {project.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {project.budget}
                          </span>
                        )}
                        {project.timeline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {project.timeline}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(project.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {activeAgencies.length > 0 && (
                        <div className="flex -space-x-2">
                          {activeAgencies.slice(0, 3).map((a) => (
                            <div
                              key={a.assignmentId}
                              className="w-7 h-7 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center"
                              title={a.agencyName}
                            >
                              {a.agencyLogo ? (
                                <img src={a.agencyLogo} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-brand">
                                  {a.agencyName?.charAt(0) || "A"}
                                </span>
                              )}
                            </div>
                          ))}
                          {activeAgencies.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                              <span className="text-[9px] font-bold text-gray-500">+{activeAgencies.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {respondedAgencies.length > 0 && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          {respondedAgencies.length} proposal{respondedAgencies.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/50">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-navy">Project Brief</h4>
                        {editingId === project.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(project.id)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(project)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </div>
                      {editingId === project.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                            rows={4}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editForm.budget}
                              onChange={(e) => setEditForm((p) => ({ ...p, budget: e.target.value }))}
                              placeholder="Budget"
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                            />
                            <input
                              type="text"
                              value={editForm.timeline}
                              onChange={(e) => setEditForm((p) => ({ ...p, timeline: e.target.value }))}
                              placeholder="Timeline"
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 whitespace-pre-line">{project.project_description}</p>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-navy mb-3">
                      Matched Agencies ({project.agencies.length})
                    </h4>
                    {project.agencies.length === 0 ? (
                      <p className="text-sm text-gray-500">We&apos;re still finding the best agencies for your project.</p>
                    ) : (
                      <div className="space-y-3">
                        {project.agencies.map((agency) => {
                          const aStatus = assignmentLabels[agency.assignmentStatus] || assignmentLabels.sent;
                          const canChat = agency.assignmentStatus === "claimed" || agency.assignmentStatus === "responded" || agency.assignmentStatus === "won";
                          return (
                            <div key={agency.assignmentId} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                                  {agency.agencyLogo ? (
                                    <img src={agency.agencyLogo} alt="" className="w-9 h-9 rounded-full object-cover" />
                                  ) : (
                                    <Building2 className="w-4 h-4 text-brand" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-navy">{agency.agencyName}</p>
                                  <p className={`text-xs font-medium ${aStatus.color}`}>{aStatus.label}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {canChat && (
                                  <Link
                                    href={`/client/messages?assignmentId=${agency.assignmentId}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark transition-colors"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    Chat
                                  </Link>
                                )}
                                {agency.agencySlug && (
                                  <Link
                                    href={`/agencies/${agency.agencySlug}`}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Profile
                                  </Link>
                                )}
                                {agency.assignmentStatus === "sent" && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    Awaiting response
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
