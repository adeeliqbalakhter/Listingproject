"use client";

import { useState, useEffect } from "react";
import {
  Users, UserPlus, Mail, Shield, Trash2, Clock, CheckCircle,
  AlertCircle, Loader2, Crown, Pencil, UserCheck, Inbox
} from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  user_id: string;
  name: string | null;
  email: string;
  image: string | null;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  owner: { label: "Owner", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Crown },
  manager: { label: "Manager", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Shield },
  editor: { label: "Editor", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Pencil },
  member: { label: "Member", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: Users },
};

export default function TeamPage() {
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; email: string } | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "editor" | "manager">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/agencies/mine");
        if (!res.ok) { setError("Failed to load agency."); setLoading(false); return; }
        const json = await res.json();
        const agency = json.data?.agency;
        if (!agency) { setError("No agency found. Create one first."); setLoading(false); return; }
        setAgencyId(agency.id);
        if (agency.owner_name || agency.owner_email) {
          setOwnerInfo({ name: agency.owner_name || "Owner", email: agency.owner_email || "" });
        }
      } catch {
        setError("Failed to load agency.");
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!agencyId) return;
    fetchMembers();
  }, [agencyId]);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/team`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setMembers(json.data ?? []);
    } catch {
      setError("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!agencyId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInviteMsg({ type: "error", text: json.error || "Failed to invite." });
      } else {
        setInviteMsg({ type: "success", text: `Invitation sent to ${inviteEmail}` });
        setInviteEmail("");
        setInviteRole("member");
        setShowInviteForm(false);
        fetchMembers();
      }
    } catch {
      setInviteMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!agencyId || !confirm("Remove this team member?")) return;
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/team?memberId=${memberId}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch { /* silently fail */ } finally {
      setRemovingId(null);
    }
  }

  if (loading && !agencyId) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-64 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Inbox className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Team Members</h1>
          <p className="mt-1 text-gray-500">
            Manage your agency team. Invite members to collaborate.
          </p>
        </div>
        <button
          onClick={() => { setShowInviteForm(!showInviteForm); setInviteMsg(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-navy mb-4">Invite a Team Member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">The user must already have an AgencyHub account.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "member" | "editor" | "manager")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
                >
                  <option value="member">Member — View only</option>
                  <option value="editor">Editor — Can edit content</option>
                  <option value="manager">Manager — Full access</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {inviting ? "Sending..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => { setShowInviteForm(false); setInviteMsg(null); }}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invite Message */}
      {inviteMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm ${
          inviteMsg.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {inviteMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {inviteMsg.text}
        </div>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {/* Owner (always shown first) */}
        {ownerInfo && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {ownerInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{ownerInfo.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-amber-50 border-amber-200 text-amber-700">
                    <Crown className="w-3 h-3" /> Owner
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{ownerInfo.email}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle className="w-3.5 h-3.5" /> Active
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        )}

        {/* Team members */}
        {!loading && members.map((member) => {
          const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
          const RoleIcon = roleConf.icon;
          const isPending = member.status === "pending";

          return (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {member.image ? (
                  <img src={member.image} alt="" className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    isPending ? "bg-gray-400" : "bg-gradient-to-br from-brand to-brand-dark"
                  }`}>
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">
                      {member.name || member.email.split("@")[0]}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleConf.bg} ${roleConf.color}`}>
                      <RoleIcon className="w-3 h-3" /> {roleConf.label}
                    </span>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-yellow-50 border-yellow-200 text-yellow-700">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isPending
                      ? `Invited ${new Date(member.invited_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : member.accepted_at
                        ? `Joined ${new Date(member.accepted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                        : `Added ${new Date(member.invited_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    }
                  </p>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {!isPending && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <UserCheck className="w-3.5 h-3.5" /> Active
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={removingId === member.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove member"
                  >
                    {removingId === member.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!loading && members.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">No team members yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Invite colleagues to help manage your agency profile, respond to leads, and more.
            </p>
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Invite Your First Member
            </button>
          </div>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-navy text-sm mb-4">Role Permissions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { role: "Member", desc: "Can view agency profile, analytics, and leads. Read-only access.", color: "bg-gray-100" },
            { role: "Editor", desc: "Can edit agency profile, portfolio, and respond to reviews and leads.", color: "bg-blue-50" },
            { role: "Manager", desc: "Full access including team management, settings, and subscription.", color: "bg-purple-50" },
          ].map((r) => (
            <div key={r.role} className={`${r.color} rounded-lg p-4`}>
              <p className="font-medium text-gray-800 text-sm">{r.role}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
