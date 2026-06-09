"use client";

import {
  Building2,
  Users,
  Star,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Plus,
  UserPlus,
  Shield,
  BarChart3,
} from "lucide-react";

const stats = [
  {
    label: "Total Agencies",
    value: "1,284",
    change: "+24 this month",
    icon: Building2,
    color: "bg-blue-50 text-brand",
  },
  {
    label: "Total Users",
    value: "8,432",
    change: "+186 this month",
    icon: Users,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Total Reviews",
    value: "12,847",
    change: "+342 this month",
    icon: Star,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Revenue",
    value: "$48,250",
    change: "+12.3% vs last month",
    icon: DollarSign,
    color: "bg-purple-50 text-purple-600",
  },
];

const recentActivity = [
  {
    action: "New agency registered",
    detail: "BrightSpark Digital submitted for approval",
    time: "2 minutes ago",
    icon: Building2,
    iconColor: "text-brand",
  },
  {
    action: "Review flagged",
    detail: "Review #4821 flagged by automated filter",
    time: "15 minutes ago",
    icon: Flag,
    iconColor: "text-red-500",
  },
  {
    action: "User suspended",
    detail: "john.doe@example.com suspended for policy violation",
    time: "32 minutes ago",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  {
    action: "Agency verified",
    detail: "MediaHouse Pro verified by admin",
    time: "1 hour ago",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  {
    action: "New user registered",
    detail: "sarah.wilson@techcorp.com joined as agency owner",
    time: "1 hour ago",
    icon: UserPlus,
    iconColor: "text-brand",
  },
  {
    action: "Review approved",
    detail: "Review #4819 approved after moderation",
    time: "2 hours ago",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  {
    action: "Agency suspended",
    detail: "FakeAgency LLC suspended for fraudulent listings",
    time: "3 hours ago",
    icon: Shield,
    iconColor: "text-red-500",
  },
  {
    action: "Subscription upgraded",
    detail: "WebCraft Agency upgraded to Pro plan",
    time: "4 hours ago",
    icon: ArrowUpRight,
    iconColor: "text-purple-500",
  },
  {
    action: "Report resolved",
    detail: "Report #312 marked as resolved",
    time: "5 hours ago",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  {
    action: "New agency registered",
    detail: "PixelPerfect Studios submitted for approval",
    time: "6 hours ago",
    icon: Building2,
    iconColor: "text-brand",
  },
];

const pendingAgencies = [
  { name: "BrightSpark Digital", owner: "Maria Chen", submitted: "2 hours ago" },
  { name: "PixelPerfect Studios", owner: "Jake Wilson", submitted: "6 hours ago" },
  { name: "GrowthLab Marketing", owner: "Aisha Patel", submitted: "1 day ago" },
];

const pendingReviews = [
  { reviewer: "Tom H.", agency: "WebWizards", rating: 2, snippet: "Very disappointing experience with their..." },
  { reviewer: "Lisa K.", agency: "SEO Masters", rating: 5, snippet: "Absolutely phenomenal results! Our traffic..." },
  { reviewer: "Mark D.", agency: "AdPro Agency", rating: 1, snippet: "Complete waste of money. They promised..." },
];

const reportedContent = [
  { type: "Review", target: "Review #4821 on DigitalFirst", reason: "Spam / fake review", reports: 3 },
  { type: "Agency", target: "QuickRank SEO", reason: "Misleading claims", reports: 5 },
];

export default function AdminDashboardPage() {
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
        {stats.map((stat) => {
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
              <p className="text-xs text-emerald-600 mt-1">{stat.change}</p>
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
          <div className="divide-y divide-gray-100">
            {pendingAgencies.map((agency) => (
              <div key={agency.name} className="px-5 py-3.5">
                <p className="font-medium text-sm text-navy">{agency.name}</p>
                <p className="text-xs text-gray-500">
                  by {agency.owner} &middot; {agency.submitted}
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
          <div className="divide-y divide-gray-100">
            {pendingReviews.map((review) => (
              <div key={review.reviewer} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-navy">
                    {review.reviewer}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">on {review.agency}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {review.snippet}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <a
              href="/admin/reviews"
              className="text-sm text-brand hover:text-brand-dark font-medium"
            >
              View all reviews &rarr;
            </a>
          </div>
        </div>

        {/* Reported Content */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Reported Content</h2>
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {reportedContent.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {reportedContent.map((item) => (
              <div key={item.target} className="px-5 py-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                  <span className="text-xs text-red-500">{item.reports} reports</span>
                </div>
                <p className="font-medium text-sm text-navy">{item.target}</p>
                <p className="text-xs text-gray-500">{item.reason}</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition-colors">
                    Take Action
                  </button>
                  <button className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="px-5 py-3.5 flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-navy">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
