"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Star,
  DollarSign,
  Clock,
  CheckCircle2,
  UserPlus,
  Shield,
  BarChart3,
  Loader2,
  Inbox,
} from "lucide-react";

interface PendingAgency {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface PendingReview {
  id: string;
  user_name: string | null;
  agency_name: string | null;
  overall_rating: number;
  content: string;
}

interface Stats {
  totalAgencies: number;
  totalUsers: number;
  totalReviews: number;
  totalLeads: number;
}

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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalAgencies: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalLeads: 0,
  });
  const [pendingAgencies, setPendingAgencies] = useState<PendingAgency[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch agencies to count and get pending ones
        const [agenciesRes] = await Promise.all([
          fetch("/api/agencies?limit=100"),
        ]);

        if (agenciesRes.ok) {
          const agenciesJson = await agenciesRes.json();
          const allAgencies = agenciesJson.data ?? [];
          const pending = allAgencies.filter(
            (a: Record<string, unknown>) => a.status === "pending"
          );
          setPendingAgencies(
            pending.slice(0, 5).map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: (a.name as string) || "Unnamed Agency",
              user_id: (a.user_id as string) || "",
              created_at: (a.created_at as string) || "",
            }))
          );
          setStats((prev) => ({
            ...prev,
            totalAgencies: agenciesJson.pagination?.total ?? allAgencies.length,
          }));
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      label: "Total Agencies",
      value: String(stats.totalAgencies),
      icon: Building2,
      color: "bg-blue-50 text-brand",
    },
    {
      label: "Total Users",
      value: String(stats.totalUsers || "--"),
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Reviews",
      value: String(stats.totalReviews || "--"),
      icon: Star,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Total Leads",
      value: String(stats.totalLeads || "--"),
      icon: DollarSign,
      color: "bg-purple-50 text-purple-600",
    },
  ];

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
        <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Platform overview and management center.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-navy mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/agencies"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Review Pending Agencies
          </a>
          <a
            href="/admin/reviews"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-navy text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Star className="w-4 h-4" />
            Moderate Reviews
          </a>
          <a
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-navy text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Manage Users
          </a>
          <a
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-navy text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Platform Settings
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Pending Agencies */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Pending Agencies</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingAgencies.length}
            </span>
          </div>
          {pendingAgencies.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingAgencies.map((agency) => (
                <div key={agency.id} className="px-5 py-3.5">
                  <p className="font-medium text-sm text-navy">{agency.name}</p>
                  <p className="text-xs text-gray-500">
                    {agency.created_at ? timeAgo(agency.created_at) : ""}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors">
                      Approve
                    </button>
                    <button className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No pending agencies</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-gray-100">
            <a
              href="/admin/agencies"
              className="text-sm text-brand hover:text-brand-dark font-medium"
            >
              View all agencies &rarr;
            </a>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Reviews to Moderate</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingReviews.length}
            </span>
          </div>
          {pendingReviews.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingReviews.map((review) => (
                <div key={review.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm text-navy">
                      {review.user_name || "Anonymous"}
                    </p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.overall_rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.agency_name && (
                    <p className="text-xs text-gray-500">on {review.agency_name}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No pending reviews</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-gray-100">
            <a
              href="/admin/reviews"
              className="text-sm text-brand hover:text-brand-dark font-medium"
            >
              View all reviews &rarr;
            </a>
          </div>
        </div>

        {/* Reported Content - Empty State */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Reported Content</h2>
            <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
              0
            </span>
          </div>
          <div className="px-5 py-8 text-center">
            <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No reported content</p>
          </div>
        </div>
      </div>

      {/* Recent Activity - Empty State */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Recent Activity</h2>
        </div>
        <div className="px-5 py-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Activity log will appear here as actions occur on the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
