"use client";

import { useState } from "react";
import {
  Star,
  MessageSquare,
  Clock,
  TrendingUp,
  Send,
  X,
  ChevronDown,
} from "lucide-react";

const mockReviews = [
  {
    id: 1,
    author: "Sarah Mitchell",
    company: "TechStart Inc.",
    avatar: "SM",
    rating: 5,
    text: "Excellent work on our SEO strategy. Organic traffic increased 300% in 6 months. The team was professional, communicative, and always available when we needed them.",
    date: "Dec 1, 2025",
    status: "pending" as const,
    response: null,
  },
  {
    id: 2,
    author: "James Thompson",
    company: "Fashion Forward",
    avatar: "JT",
    rating: 4,
    text: "Great communication and solid results on our PPC campaigns. Would have liked a bit more creativity in the ad copy, but overall very satisfied with the ROI.",
    date: "Nov 28, 2025",
    status: "responded" as const,
    response:
      "Thank you James! We appreciate the feedback and will focus on enhancing creative for your next campaign cycle.",
  },
  {
    id: 3,
    author: "Maria Garcia",
    company: "GreenEnergy Co.",
    avatar: "MG",
    rating: 5,
    text: "Transformed our social media presence completely. Engagement rates are up 250% and we've gained over 10,000 new followers in just 3 months.",
    date: "Nov 20, 2025",
    status: "responded" as const,
    response:
      "Thank you Maria! It's been a pleasure working with the GreenEnergy team. Looking forward to continuing the momentum!",
  },
  {
    id: 4,
    author: "David Chen",
    company: "FoodieApp",
    avatar: "DC",
    rating: 3,
    text: "The work was decent but there were some delays in delivery. The final results were acceptable but I expected a bit more given the budget.",
    date: "Nov 15, 2025",
    status: "pending" as const,
    response: null,
  },
  {
    id: 5,
    author: "Emma Wilson",
    company: "StyleHouse",
    avatar: "EW",
    rating: 5,
    text: "Outstanding branding work! They completely reimagined our brand identity and the results have been incredible. Highly recommend.",
    date: "Nov 10, 2025",
    status: "pending" as const,
    response: null,
  },
  {
    id: 6,
    author: "Robert Kim",
    company: "FinanceHub",
    avatar: "RK",
    rating: 4,
    text: "Very professional team with deep knowledge of content marketing in the finance space. Helped us establish thought leadership through high-quality blog posts.",
    date: "Nov 5, 2025",
    status: "responded" as const,
    response:
      "Thanks Robert! Finance content is one of our specialties and we enjoyed collaborating with your team.",
  },
];

const stats = [
  {
    label: "Total Reviews",
    value: "24",
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    label: "Average Rating",
    value: "4.6",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Pending Responses",
    value: "3",
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    label: "Response Rate",
    value: "87%",
    icon: MessageSquare,
    color: "text-brand",
    bg: "bg-blue-50",
  },
];

type FilterTab = "all" | "pending" | "responded";

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [reviews, setReviews] = useState(mockReviews);

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const handleSubmitResponse = (reviewId: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, status: "responded" as const, response: responseText }
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
      count: reviews.filter((r) => r.status === "pending").length,
    },
    {
      key: "responded",
      label: "Responded",
      count: reviews.filter((r) => r.status === "responded").length,
    },
  ];

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
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                  {review.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-navy">
                      {review.author}
                    </p>
                    <span className="text-xs text-gray-400">{review.company}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
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
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  review.status === "pending"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {review.status === "pending" ? "Needs Response" : "Responded"}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {review.text}
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
            {review.status === "pending" && respondingTo !== review.id && (
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
        ))}

        {filteredReviews.length === 0 && (
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
