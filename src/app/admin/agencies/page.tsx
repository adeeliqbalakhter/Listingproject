"use client";

import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  Star,
  Trash2,
  Award,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Loader2,
} from "lucide-react";

type AgencyStatus = "active" | "pending" | "suspended" | "draft";

interface Agency {
  id: string;
  name: string;
  user_id: string;
  status: AgencyStatus;
  average_rating: number | null;
  total_reviews: number | null;
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
}

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

const ITEMS_PER_PAGE = 8;

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgencies() {
      try {
        const res = await fetch("/api/agencies?limit=100");
        if (res.ok) {
          const json = await res.json();
          const data = (json.data ?? []) as Array<Record<string, unknown>>;
          setAgencies(
            data.map((a) => ({
              id: a.id as string,
              name: (a.name as string) || "",
              user_id: (a.user_id as string) || "",
              status: (a.status as AgencyStatus) || "draft",
              average_rating: a.average_rating ? Number(a.average_rating) : null,
              total_reviews: a.total_reviews ? Number(a.total_reviews) : null,
              is_featured: Boolean(a.is_featured),
              is_verified: Boolean(a.is_verified),
              created_at: (a.created_at as string) || "",
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchAgencies();
  }, []);

  const handleStatusChange = async (agencyId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/agencies/${agencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAgencies((prev) =>
          prev.map((a) =>
            a.id === agencyId ? { ...a, status: newStatus as AgencyStatus } : a
          )
        );
      }
    } catch {
      // silently fail
    }
    setOpenDropdown(null);
  };

  const filtered = agencies.filter((agency) => {
    const matchesStatus =
      statusFilter === "all" || agency.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      agency.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700",
      pending: "bg-amber-50 text-amber-700",
      suspended: "bg-red-50 text-red-700",
      draft: "bg-gray-50 text-gray-600",
    };
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${styles[status] || styles.draft}`}
      >
        {status}
      </span>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Agencies Management</h1>
        <p className="mt-1 text-gray-500">
          Review, approve, and manage all agencies on the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {statusTabs.map((tab) => {
              const count =
                tab.value === "all"
                  ? agencies.length
                  : agencies.filter((a) => a.status === tab.value).length;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === tab.value
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

          {/* Search */}
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search agencies..."
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
                  Agency
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">
                  Rating
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">
                  Reviews
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden xl:table-cell">
                  Created
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">
                          {agency.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-navy">{agency.name}</p>
                          {agency.is_verified && (
                            <Shield className="w-3.5 h-3.5 text-brand" />
                          )}
                          {agency.is_featured && (
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{statusBadge(agency.status)}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {agency.average_rating && agency.average_rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-navy">{agency.average_rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-navy hidden lg:table-cell">
                    {agency.total_reviews ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden xl:table-cell">
                    {agency.created_at ? formatDate(agency.created_at) : "N/A"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === agency.id ? null : agency.id
                          )
                        }
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                      {openDropdown === agency.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {agency.status === "pending" && (
                            <button
                              onClick={() => handleStatusChange(agency.id, "active")}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                          )}
                          {agency.status === "active" && (
                            <button
                              onClick={() => handleStatusChange(agency.id, "suspended")}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Suspend
                            </button>
                          )}
                          {agency.status === "suspended" && (
                            <button
                              onClick={() => handleStatusChange(agency.id, "active")}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Reactivate
                            </button>
                          )}
                          {!agency.is_featured && agency.status === "active" && (
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">
                              <Award className="w-4 h-4" />
                              Feature
                            </button>
                          )}
                          {!agency.is_verified && agency.status === "active" && (
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand hover:bg-blue-50">
                              <Shield className="w-4 h-4" />
                              Verify
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1" />
                          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No agencies found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
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
              agencies
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
        )}
      </div>
    </div>
  );
}
