import { Eye, Users, Star, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your agency profile, reviews, leads, and analytics.",
};

const stats = [
  {
    label: "Profile Views",
    value: "1,247",
    change: "+12.5%",
    trend: "up" as const,
    icon: Eye,
  },
  {
    label: "Total Leads",
    value: "38",
    change: "+8.2%",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Average Rating",
    value: "4.8",
    change: "+0.2",
    trend: "up" as const,
    icon: Star,
  },
  {
    label: "Search Impressions",
    value: "3,842",
    change: "-2.1%",
    trend: "down" as const,
    icon: TrendingUp,
  },
];

const recentLeads = [
  {
    company: "TechStart Inc.",
    service: "SEO",
    budget: "$5,000 - $10,000",
    date: "2 hours ago",
    status: "new",
  },
  {
    company: "Fashion Forward",
    service: "Social Media",
    budget: "$2,000 - $5,000",
    date: "5 hours ago",
    status: "viewed",
  },
  {
    company: "GreenEnergy Co.",
    service: "PPC",
    budget: "$10,000 - $25,000",
    date: "1 day ago",
    status: "responded",
  },
  {
    company: "Local Restaurant",
    service: "Web Design",
    budget: "$3,000 - $5,000",
    date: "2 days ago",
    status: "won",
  },
];

const recentReviews = [
  {
    author: "Sarah M.",
    rating: 5,
    text: "Excellent work on our SEO strategy. Organic traffic increased 300% in 6 months.",
    date: "3 days ago",
  },
  {
    author: "James T.",
    rating: 4,
    text: "Great communication and solid results on our PPC campaigns.",
    date: "1 week ago",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome back! Here&apos;s an overview of your agency&apos;s performance.
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
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-navy">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Recent Leads</h2>
            <a
              href="/dashboard/leads"
              className="text-sm text-brand hover:text-brand-dark"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLeads.map((lead) => (
              <div key={lead.company} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-navy">{lead.company}</p>
                  <p className="text-xs text-gray-500">
                    {lead.service} · {lead.budget}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                      lead.status === "new"
                        ? "bg-blue-50 text-brand"
                        : lead.status === "viewed"
                        ? "bg-yellow-50 text-yellow-700"
                        : lead.status === "responded"
                        ? "bg-green-50 text-green-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {lead.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{lead.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">Recent Reviews</h2>
            <a
              href="/dashboard/reviews"
              className="text-sm text-brand hover:text-brand-dark"
            >
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {recentReviews.map((review) => (
              <div key={review.author} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {review.author[0]}
                    </div>
                    <span className="font-medium text-sm text-navy">
                      {review.author}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.text}</p>
                <p className="text-xs text-gray-400 mt-2">{review.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
