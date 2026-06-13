"use client";

import { useState } from "react";
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
} from "lucide-react";

type AgencyStatus = "active" | "pending" | "suspended";

interface Agency {
  id: number;
  name: string;
  owner: string;
  ownerEmail: string;
  status: AgencyStatus;
  rating: number;
  reviews: number;
  featured: boolean;
  verified: boolean;
  created: string;
}

const allAgencies: Agency[] = [
  { id: 1, name: "BrightSpark Digital", owner: "Maria Chen", ownerEmail: "maria@brightspark.com", status: "pending", rating: 0, reviews: 0, featured: false, verified: false, created: "Jun 5, 2026" },
  { id: 2, name: "WebWizards Agency", owner: "James Turner", ownerEmail: "james@webwizards.com", status: "active", rating: 4.8, reviews: 124, featured: true, verified: true, created: "Jan 12, 2026" },
  { id: 3, name: "PixelPerfect Studios", owner: "Jake Wilson", ownerEmail: "jake@pixelperfect.com", status: "pending", rating: 0, reviews: 0, featured: false, verified: false, created: "Jun 4, 2026" },
  { id: 4, name: "SEO Masters Inc.", owner: "Lisa Park", ownerEmail: "lisa@seomasters.com", status: "active", rating: 4.6, reviews: 89, featured: false, verified: true, created: "Mar 20, 2026" },
  { id: 5, name: "GrowthLab Marketing", owner: "Aisha Patel", ownerEmail: "aisha@growthlab.com", status: "pending", rating: 0, reviews: 0, featured: false, verified: false, created: "Jun 3, 2026" },
  { id: 6, name: "AdPro Agency", owner: "Mike Ross", ownerEmail: "mike@adpro.com", status: "active", rating: 4.2, reviews: 56, featured: false, verified: true, created: "Feb 8, 2026" },
  { id: 7, name: "FakeAgency LLC", owner: "John Doe", ownerEmail: "john@fakeagency.com", status: "suspended", rating: 1.2, reviews: 3, featured: false, verified: false, created: "Dec 1, 2025" },
  { id: 8, name: "MediaHouse Pro", owner: "Sarah Kim", ownerEmail: "sarah@mediahouse.com", status: "active", rating: 4.9, reviews: 201, featured: true, verified: true, created: "Oct 15, 2025" },
  { id: 9, name: "DigitalFirst Co.", owner: "Tom Hardy", ownerEmail: "tom@digitalfirst.com", status: "active", rating: 4.4, reviews: 67, featured: false, verified: true, created: "Apr 2, 2026" },
  { id: 10, name: "QuickRank SEO", owner: "Amy Zhang", ownerEmail: "amy@quickrank.com", status: "suspended", rating: 2.1, reviews: 15, featured: false, verified: false, created: "Nov 22, 2025" },
  { id: 11, name: "CreativeEdge Studio", owner: "David Lee", ownerEmail: "david@creativeedge.com", status: "active", rating: 4.7, reviews: 143, featured: true, verified: true, created: "Aug 10, 2025" },
  { id: 12, name: "DataDriven Marketing", owner: "Rachel Green", ownerEmail: "rachel@datadriven.com", status: "active", rating: 4.5, reviews: 92, featured: false, verified: true, created: "May 18, 2026" },
];

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

const ITEMS_PER_PAGE = 8;

export default function AdminAgenciesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const filtered = allAgencies.filter((agency) => {
    const matchesStatus =
      statusFilter === "all" || agency.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusBadge = (status: AgencyStatus) => {
    const styles: Record<AgencyStatus, string> = {
      active: "bg-emerald-50 text-emerald-700",
      pending: "bg-amber-50 text-amber-700",
      suspended: "bg-red-50 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

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
                  ? allAgencies.length
                  : allAgencies.filter((a) => a.status === tab.value).length;
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
                <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">
                  Owner
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
                          {agency.verified && (
                            <Shield className="w-3.5 h-3.5 text-brand" />
                          )}
                          {agency.featured && (
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-navy">{agency.owner}</p>
                    <p className="text-xs text-gray-400">{agency.ownerEmail}</p>
                  </td>
                  <td className="px-5 py-3.5">{statusBadge(agency.status)}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {agency.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-navy">{agency.rating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-navy hidden lg:table-cell">
                    {agency.reviews}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 hidden xl:table-cell">
                    {agency.created}
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
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                          )}
                          {agency.status === "active" && (
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">
                              <XCircle className="w-4 h-4" />
                              Suspend
                            </button>
                          )}
                          {agency.status === "suspended" && (
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                              <CheckCircle2 className="w-4 h-4" />
                              Reactivate
                            </button>
                          )}
                          {!agency.featured && agency.status === "active" && (
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50">
                              <Award className="w-4 h-4" />
                              Feature
                            </button>
                          )}
                          {!agency.verified && agency.status === "active" && (
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
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    No agencies found matching your criteria.
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
      </div>
    </div>
  );
}
