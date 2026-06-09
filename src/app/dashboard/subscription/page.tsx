"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Star,
  ArrowRight,
  Download,
  Calendar,
  Users,
  FolderOpen,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic features",
    features: [
      "Basic agency profile",
      "5 lead credits/month",
      "3 portfolio items",
      "Standard support",
    ],
    icon: Star,
    current: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Grow your agency with advanced tools",
    features: [
      "Enhanced profile with SEO",
      "25 lead credits/month",
      "Unlimited portfolio items",
      "Review management",
      "Analytics dashboard",
      "Priority support",
    ],
    icon: Zap,
    popular: true,
    current: false,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/month",
    description: "Everything you need to dominate",
    features: [
      "Premium profile placement",
      "Unlimited lead credits",
      "Unlimited portfolio items",
      "Advanced analytics",
      "Custom branding",
      "Dedicated account manager",
      "API access",
    ],
    icon: Crown,
    current: false,
  },
];

const billingHistory = [
  { id: "INV-001", date: "Dec 1, 2025", amount: "$0.00", status: "Paid", plan: "Free" },
  { id: "INV-002", date: "Nov 1, 2025", amount: "$0.00", status: "Paid", plan: "Free" },
  { id: "INV-003", date: "Oct 1, 2025", amount: "$0.00", status: "Paid", plan: "Free" },
  { id: "INV-004", date: "Sep 1, 2025", amount: "$0.00", status: "Paid", plan: "Free" },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState("Free");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Subscription</h1>
        <p className="mt-1 text-gray-500">
          Manage your plan, billing, and usage.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-brand" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-xl font-bold text-navy">Free Plan</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Renews on Jan 1, 2026
            </p>
          </div>
        </div>

        {/* Current Plan Features */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-sm font-medium text-navy mb-3">Plan Features</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {plans[0].features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium text-navy">Lead Credits</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-navy">3</span>
            <span className="text-sm text-gray-500 mb-0.5">/ 5 used</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: "60%" }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-navy">Portfolio Items</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-navy">2</span>
            <span className="text-sm text-gray-500 mb-0.5">/ 3 used</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: "66%" }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-navy">Reviews</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-navy">24</span>
            <span className="text-sm text-gray-500 mb-0.5">total</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Unlimited on all plans</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-navy">Next Invoice</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-navy">$0</span>
            <span className="text-sm text-gray-500 mb-0.5">.00</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Due Jan 1, 2026</p>
        </div>
      </div>

      {/* Upgrade Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-navy mb-5">Upgrade Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`bg-white rounded-xl border-2 p-6 relative transition-colors ${
                  plan.current
                    ? "border-brand bg-blue-50/30"
                    : plan.popular
                    ? "border-brand/50"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                {plan.current && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-navy text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.current
                        ? "bg-brand/10"
                        : plan.popular
                        ? "bg-blue-50"
                        : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        plan.current || plan.popular
                          ? "text-brand"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{plan.name}</h3>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold text-navy">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5">
                    Upgrade to {plan.name}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-navy">Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Invoice
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">
                  Plan
                </th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">
                  Amount
                </th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-navy">
                    {inv.id}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">
                    {inv.date}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-600">
                    {inv.plan}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-navy font-medium text-right">
                    {inv.amount}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button className="text-gray-400 hover:text-brand transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
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
