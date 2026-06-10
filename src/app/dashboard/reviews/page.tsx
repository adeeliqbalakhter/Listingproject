"use client";

import { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  Clock,
  TrendingUp,
  Send,
  X,
  Loader2,
  Inbox,
} from "lucide-react";

interface Review {
  id: string;
  user_name: string | null;
  user_image: string | null;
  overall_rating: number;
  title: string | null;
  content: string;
  company_name: string | null;
  created_at: string;
  status: string;
  response?: string | null;
}

type FilterTab = "all" | "pending" | "responded";

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

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // First get user's agency
        const agencyRes = await fetch("/api/agencies?limit=1");
        if (!agencyRes.ok) {
          setLoading(false);
          return;
        }
        const agencyJson = await agencyRes.json();
        const agencies = agencyJson.data ?? [];
        if (agencies.length === 0) {
          setLoading(false);
          return;
        }

        const myAgencyId = agencies[0].id;
        setAgencyId(myAgencyId);

        // Fetch reviews for this agency
        const reviewsRes = await fetch(`/api/reviews?agencyId=${myAgencyId}&limit=50`);
        if (reviewsRes.ok) {
          const reviewsJson = await reviewsRes.json();
          setReviews(reviewsJson.data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Derive status: if review has a response, treat as "responded", otherwise "pending"
  const getReviewStatus = (r: Review): "pending" | "responded" => {
    return r.response ? "responded" : "pending";
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "all") return true;
    return getReviewStatus(r) === activeTab;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalReviews).toFixed(1)
    : "0";
  const pendingCount = reviews.filter((r) => getReviewStatus(r) === "pending").length;
  const respondedCount = reviews.filter((r) => getReviewStatus(r) === "responded").length;
  const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

  const stats = [
    {
      label: "Total Reviews",
      value: String(totalReviews),
      icon: Star,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Average Rating",
      value: avgRating,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending Responses",
      value: String(pendingCount),
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      icon: MessageSquare,
      color: "text-brand",
      bg: "bg-blue-50",
    },
  ];

  const handleSubmitResponse = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, response: responseText }
          : r
      )
    );
    setRespondingTo(null);
    setResponseText("");
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: reviews.length },
    {
      key: "pending",
      label: "Pending",
      count: pendingCount,
    },
    {
      key: "responded",
      label: "Responded",
      count: respondedCount,
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
        <h1 className="text-2xl font-bold text-navy">Reviews</h1>
        <p className="mt-1 text-gray-500">
          Manage and respond to client reviews.
        </p>
      </div>

      {/* Stats */}
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
                  className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-navy shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? "bg-brand/10 text-brand"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const reviewStatus = getReviewStatus(review);
          const initials = (review.user_name || "?")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-navy">
                        {review.user_name || "Anonymous"}
                      </p>
                      {review.company_name && (
                        <span className="text-xs text-gray-400">{review.company_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (review.overall_rating || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {review.created_at ? formatDate(review.created_at) : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    reviewStatus === "pending"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {reviewStatus === "pending" ? "Needs Response" : "Responded"}
                </span>
              </div>

              {review.title && (
                <p className="text-sm font-medium text-navy mt-3">{review.title}</p>
              )}
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {review.content}
              </p>

              {/* Existing Response */}
              {review.response && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border-l-4 border-brand">
                  <p className="text-xs font-medium text-navy mb-1">
                    Your Response
                  </p>
                  <p className="text-sm text-gray-600">{review.response}</p>
                </div>
              )}

              {/* Respond Button / Inline Form */}
              {reviewStatus === "pending" && respondingTo !== review.id && (
                <button
                  onClick={() => setRespondingTo(review.id)}
                  className="mt-4 flex items-center gap-1.5 text-sm text-brand font-medium hover:text-brand-dark transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Respond
                </button>
              )}

              {respondingTo === review.id && (
                <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-navy">
                      Write your response
                    </p>
                    <button
                      onClick={() => {
                        setRespondingTo(null);
                        setResponseText("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Thank the reviewer and address their feedback..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleSubmitResponse(review.id)}
                      disabled={!responseText.trim()}
                      className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {reviews.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-navy mb-1">No reviews yet</p>
            <p className="text-gray-500 text-sm">
              Reviews from your clients will appear here once they are approved.
            </p>
          </div>
        )}

        {reviews.length > 0 && filteredReviews.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No reviews found for this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
