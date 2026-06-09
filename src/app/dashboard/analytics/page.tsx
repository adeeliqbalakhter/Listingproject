"use client";

import { useState } from "react";
import {
  Eye,
  Search,
  MousePointerClick,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  PieChart,
  ExternalLink,
} from "lucide-react";

const dateRanges = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
] as const;

const statCards = [
  {
    label: "Profile Views",
    value: "1,247",
    change: "+12.5%",
    trend: "up" as const,
    icon: Eye,
    color: "text-brand",
    bg: "bg-blue-50",
  },
  {
    label: "Search Impressions",
    value: "3,842",
    change: "+8.3%",
    trend: "up" as const,
    icon: Search,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Website Clicks",
    value: "284",
    change: "-2.1%",
    trend: "down" as const,
    icon: MousePointerClick,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Lead Requests",
    value: "38",
    change: "+15.7%",
    trend: "up" as const,
    icon: Users,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

const topPages = [
  { page: "/agencies/demo-agency", views: 847, clicks: 124, ctr: "14.6%" },
  { page: "/agencies/demo-agency/reviews", views: 312, clicks: 67, ctr: "21.5%" },
  { page: "/agencies/demo-agency/portfolio", views: 189, clicks: 43, ctr: "22.8%" },
  { page: "/agencies/demo-agency/services", views: 156, clicks: 31, ctr: "19.9%" },
  { page: "/agencies/demo-agency/contact", views: 98, clicks: 19, ctr: "19.4%" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
          <p className="mt-1 text-gray-500">
            Track your agency&apos;s performance and visibility.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {dateRanges.map((dr) => (
            <button
              key={dr.key}
              onClick={() => setRange(dr.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                range === dr.key
                  ? "bg-white text-navy shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
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
                  className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${stat.color}`} />
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
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholders */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Views Over Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Views Over Time</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Profile views in the last {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-300" />
          </div>
          <div className="h-64 bg-gradient-to-b from-blue-50/50 to-transparent rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">
                Views Over Time Chart
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Integrate your preferred charting library
              </p>
            </div>
          </div>
        </div>

        {/* Top Search Terms */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Top Search Terms</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Keywords driving impressions
              </p>
            </div>
            <Search className="w-5 h-5 text-gray-300" />
          </div>
          <div className="h-56 bg-gradient-to-b from-purple-50/50 to-transparent rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">
                Top Search Terms Chart
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Horizontal bar chart placeholder
              </p>
            </div>
          </div>
          {/* Mock data below chart */}
          <div className="mt-4 space-y-2">
            {[
              { term: "SEO agency New York", impressions: 842 },
              { term: "digital marketing agency", impressions: 631 },
              { term: "PPC management services", impressions: 428 },
              { term: "content marketing agency", impressions: 315 },
              { term: "social media agency NYC", impressions: 219 },
            ].map((item) => (
              <div key={item.term} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate mr-4">{item.term}</span>
                <span className="text-navy font-medium whitespace-nowrap">
                  {item.impressions.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Lead Sources</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Where your leads come from
              </p>
            </div>
            <PieChart className="w-5 h-5 text-gray-300" />
          </div>
          <div className="h-56 bg-gradient-to-b from-green-50/50 to-transparent rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">
                Lead Sources Chart
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Pie/donut chart placeholder
              </p>
            </div>
          </div>
          {/* Mock data below chart */}
          <div className="mt-4 space-y-2">
            {[
              { source: "Organic Search", leads: 15, pct: "39%" },
              { source: "Directory Listing", leads: 10, pct: "26%" },
              { source: "Referral", leads: 7, pct: "18%" },
              { source: "Direct", leads: 4, pct: "11%" },
              { source: "Social Media", leads: 2, pct: "5%" },
            ].map((item) => (
              <div key={item.source} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.source}</span>
                <div className="flex items-center gap-3">
                  <span className="text-navy font-medium">{item.leads}</span>
                  <span className="text-xs text-gray-400 w-8 text-right">{item.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Pages Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-navy">Top Performing Pages</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Pages with the most views and engagement
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Page
                </th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">
                  Views
                </th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">
                  Clicks
                </th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((page) => (
                <tr
                  key={page.page}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-brand font-medium flex items-center gap-1">
                      {page.page}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </span>
                  </td>
                  <td className="text-right px-6 py-3.5 text-sm text-navy font-medium">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="text-right px-6 py-3.5 text-sm text-gray-600">
                    {page.clicks}
                  </td>
                  <td className="text-right px-6 py-3.5 text-sm text-gray-600">
                    {page.ctr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
