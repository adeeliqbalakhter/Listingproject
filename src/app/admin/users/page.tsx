"use client";

import { useState } from "react";
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
} from "lucide-react";

type UserRole = "user" | "agency_owner" | "admin";
type UserStatus = "active" | "suspended";

interface PlatformUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  agencies: number;
  joined: string;
  avatar: string;
}

const allUsers: PlatformUser[] = [
  { id: 1, name: "Maria Chen", email: "maria@brightspark.com", role: "agency_owner", status: "active", agencies: 1, joined: "Jun 5, 2026", avatar: "MC" },
  { id: 2, name: "James Turner", email: "james@webwizards.com", role: "agency_owner", status: "active", agencies: 2, joined: "Jan 12, 2026", avatar: "JT" },
  { id: 3, name: "Sarah Wilson", email: "sarah.wilson@techcorp.com", role: "user", status: "active", agencies: 0, joined: "Jun 4, 2026", avatar: "SW" },
  { id: 4, name: "Lisa Park", email: "lisa@seomasters.com", role: "agency_owner", status: "active", agencies: 1, joined: "Mar 20, 2026", avatar: "LP" },
  { id: 5, name: "Tom Hardy", email: "tom@digitalfirst.com", role: "agency_owner", status: "active", agencies: 1, joined: "Apr 2, 2026", avatar: "TH" },
  { id: 6, name: "John Doe", email: "john@fakeagency.com", role: "agency_owner", status: "suspended", agencies: 1, joined: "Dec 1, 2025", avatar: "JD" },
  { id: 7, name: "Emily Watson", email: "emily.watson@gmail.com", role: "user", status: "active", agencies: 0, joined: "May 10, 2026", avatar: "EW" },
  { id: 8, name: "David Lee", email: "david@creativeedge.com", role: "agency_owner", status: "active", agencies: 1, joined: "Aug 10, 2025", avatar: "DL" },
  { id: 9, name: "Admin User", email: "admin@agencyhub.com", role: "admin", status: "active", agencies: 0, joined: "Jun 1, 2025", avatar: "AU" },
  { id: 10, name: "Rachel Green", email: "rachel@datadriven.com", role: "agency_owner", status: "active", agencies: 1, joined: "May 18, 2026", avatar: "RG" },
  { id: 11, name: "Mark Thompson", email: "mark.t@outlook.com", role: "user", status: "active", agencies: 0, joined: "Apr 22, 2026", avatar: "MT" },
  { id: 12, name: "Amy Zhang", email: "amy@quickrank.com", role: "agency_owner", status: "suspended", agencies: 1, joined: "Nov 22, 2025", avatar: "AZ" },
  { id: 13, name: "Chris Brown", email: "chris.brown@mail.com", role: "user", status: "active", agencies: 0, joined: "Jun 1, 2026", avatar: "CB" },
  { id: 14, name: "Super Admin", email: "superadmin@agencyhub.com", role: "admin", status: "active", agencies: 0, joined: "Jan 1, 2025", avatar: "SA" },
];

const roleTabs = [
  { label: "All", value: "all" },
  { label: "Users", value: "user" },
  { label: "Agency Owners", value: "agency_owner" },
  { label: "Admins", value: "admin" },
];

const ITEMS_PER_PAGE = 8;

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const filtered = allUsers.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const roleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      user: "bg-gray-100 text-gray-700",
      agency_owner: "bg-blue-50 text-brand",
      admin: "bg-purple-50 text-purple-700",
    };
    const labels: Record<UserRole, string> = {
      user: "User",
      agency_owner: "Agency Owner",
      admin: "Admin",
    };
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[role]}`}
      >
        {labels[role]}
      </span>
    );
  };

  const statusBadge = (status: UserStatus) => {
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
          status === "active"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        } capitalize`}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Users Management</h1>
        <p className="mt-1 text-gray-500">
          Manage platform users, roles, and permissions.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {roleTabs.map((tab) => {
              const count =
                tab.value === "all"
                  ? allUsers.length
                  : allUsers.filter((u) => u.role === tab.value).length;
              return (
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
                  <span className="ml-1.5 text-xs text-gray-400">{count}</span>
                </button>
              );
            })}
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  Agencies
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
              {paginated.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {user.avatar}
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
                    {statusBadge(user.status)}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {user.agencies > 0 ? (
                      <div className="flex items-center gap-1 text-navy">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {user.agencies}
                      </div>
                    ) : (
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden xl:table-cell">
                    {user.joined}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === user.id ? null : user.id
                          )
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                      {openDropdown === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <UserCog className="w-4 h-4" />
                            Edit Role
                          </button>
                          {user.role !== "admin" && (
                            <>
                              {user.status === "active" ? (
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">
                                  <Ban className="w-4 h-4" />
                                  Suspend
                                </button>
                              ) : (
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                                  <Shield className="w-4 h-4" />
                                  Reactivate
                                </button>
                              )}
                              <div className="border-t border-gray-100 my-1" />
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
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
              {paginated.length === 0 && (
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
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-navy">
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-navy">{filtered.length}</span>{" "}
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
      </div>
    </div>
  );
}
