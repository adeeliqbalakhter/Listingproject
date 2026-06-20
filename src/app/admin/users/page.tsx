"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MoreHorizontal,
  UserCog,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Shield,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Mail,
  User,
  Copy,
  CheckCircle,
} from "lucide-react";

type UserRole = "user" | "agency_owner" | "admin" | "super_admin";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  login_count: number;
  last_login_at: string | null;
  created_at: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  role: UserRole;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleTabs = [
  { label: "All", value: "" },
  { label: "Users", value: "user" },
  { label: "Agency Owners", value: "agency_owner" },
  { label: "Admins", value: "admin" },
  { label: "Super Admins", value: "super_admin" },
];

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({ name: "", email: "", role: "admin" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<{ inviteUrl: string; email: string } | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<PlatformUser | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<UserRole>("user");
  const [editingRole, setEditingRole] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = () => setOpenDropdown(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openDropdown]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      if (roleFilter) params.set("role", roleFilter);
      if (debouncedQuery) params.set("query", debouncedQuery);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load users (${res.status})`);
      }
      const json = await res.json();
      setUsers(json.data ?? []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, debouncedQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const roleBadge = (role: UserRole) => {
    const styles: Record<string, string> = {
      user: "bg-gray-100 text-gray-700",
      agency_owner: "bg-blue-50 text-brand",
      admin: "bg-purple-50 text-purple-700",
      super_admin: "bg-red-50 text-red-700",
    };
    const labels: Record<string, string> = {
      user: "User",
      agency_owner: "Agency Owner",
      admin: "Admin",
      super_admin: "Super Admin",
    };
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[role] ?? "bg-gray-100 text-gray-700"}`}
      >
        {labels[role] ?? role}
      </span>
    );
  };

  const statusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        } capitalize`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const handleSuspendToggle = async (userId: string, activate: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: activate ? "active" : "suspended" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOpenDropdown(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      setOpenDropdown(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const getAvatar = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create user");
      setCreateSuccess({ inviteUrl: json.data.inviteUrl, email: createForm.email });
      setCreateForm({ name: "", email: "", role: "admin" });
      fetchUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({ name: "", email: "", role: "admin" });
    setCreateError(null);
    setCreateSuccess(null);
  };

  const openEditRole = (user: PlatformUser) => {
    setEditRoleUser(user);
    setEditRoleValue(user.role);
    setOpenDropdown(null);
  };

  const handleEditRole = async () => {
    if (!editRoleUser) return;
    setEditingRole(true);
    try {
      const res = await fetch(`/api/users/${editRoleUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRoleValue }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update role");
      setEditRoleUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setEditingRole(false);
    }
  };

  const isAdminRole = (role: string) => role === "admin" || role === "super_admin";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Users Management</h1>
          <p className="mt-1 text-gray-500">
            Manage platform users, roles, and permissions.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setRoleFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  roleFilter === tab.value
                    ? "bg-white text-navy shadow-sm"
                    : "text-gray-500 hover:text-navy"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      User
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">
                      Email
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">
                      Logins
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden xl:table-cell">
                      Joined
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {getAvatar(user.name || "?")}
                            </span>
                          </div>
                          <p className="font-medium text-navy">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                        {user.email}
                      </td>
                      <td className="px-5 py-3.5">{roleBadge(user.role)}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {statusBadge(user.is_active)}
                      </td>
                      <td className="px-5 py-3.5 text-navy hidden lg:table-cell">
                        {user.login_count ?? 0}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 hidden xl:table-cell">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(
                                openDropdown === user.id ? null : user.id
                              );
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button>
                          {openDropdown === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button onClick={() => openEditRole(user)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <UserCog className="w-4 h-4" />
                                Edit Role
                              </button>
                              {user.is_active ? (
                                <button onClick={() => handleSuspendToggle(user.id, false)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">
                                  <Ban className="w-4 h-4" />
                                  Suspend
                                </button>
                              ) : (
                                <button onClick={() => handleSuspendToggle(user.id, true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                                  <Shield className="w-4 h-4" />
                                  Reactivate
                                </button>
                              )}
                              {isAdminRole(user.role) && (
                                <>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button onClick={() => handleDelete(user.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-navy">
                  {total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-navy">
                  {Math.min(currentPage * ITEMS_PER_PAGE, total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-navy">{total}</span>{" "}
                users
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === i + 1
                        ? "bg-brand text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closeCreateModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-navy">Create New User</h2>
                <button onClick={closeCreateModal} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {createSuccess ? (
                <div className="p-6">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-navy text-lg">User Created!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      An invitation email has been sent to <strong>{createSuccess.email}</strong>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Invitation Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createSuccess.inviteUrl}
                        className="flex-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 text-gray-600 truncate"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createSuccess.inviteUrl);
                        }}
                        className="flex-shrink-0 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">This link expires in 7 days. You can share it manually if the email doesn&apos;t arrive.</p>
                  </div>

                  <button
                    onClick={closeCreateModal}
                    className="w-full py-2.5 bg-brand text-white rounded-lg font-medium text-sm hover:bg-brand/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                  {createError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{createError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                    >
                      <option value="user">User</option>
                      <option value="agency_owner">Agency Owner</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {createForm.role === "super_admin" && "Full platform access including user management"}
                      {createForm.role === "admin" && "Access to admin panel and moderation tools"}
                      {createForm.role === "agency_owner" && "Can create and manage an agency profile"}
                      {createForm.role === "user" && "Standard user account"}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      An invitation email will be sent with a link to set their password. The link expires in 7 days.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !createForm.name || !createForm.email}
                      className="flex-1 py-2.5 bg-brand text-white rounded-lg font-medium text-sm hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Create & Send Invite
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit Role Modal */}
      {editRoleUser && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setEditRoleUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-navy">Edit User Role</h2>
                <button onClick={() => setEditRoleUser(null)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{getAvatar(editRoleUser.name || "?")}</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy text-sm">{editRoleUser.name}</p>
                    <p className="text-xs text-gray-500">{editRoleUser.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select
                    value={editRoleValue}
                    onChange={(e) => setEditRoleValue(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                  >
                    <option value="user">User</option>
                    <option value="agency_owner">Agency Owner</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {editRoleValue !== editRoleUser.role && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      Role will be changed from <strong>{({ user: "User", agency_owner: "Agency Owner", admin: "Admin", super_admin: "Super Admin" } as Record<string,string>)[editRoleUser.role]}</strong> to <strong>{({ user: "User", agency_owner: "Agency Owner", admin: "Admin", super_admin: "Super Admin" } as Record<string,string>)[editRoleValue]}</strong>
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditRoleUser(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditRole}
                    disabled={editingRole || editRoleValue === editRoleUser.role}
                    className="flex-1 py-2.5 bg-brand text-white rounded-lg font-medium text-sm hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editingRole ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Role"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
