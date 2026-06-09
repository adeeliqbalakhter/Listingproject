"use client";

import { useState } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Flag,
  Search,
  Clock,
  MessageSquare,
} from "lucide-react";

type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

interface Review {
  id: number;
  reviewer: string;
  reviewerEmail: string;
  agency: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  status: ReviewStatus;
  flagReason?: string;
}

const allReviews: Review[] = [
  {
    id: 4821,
    reviewer: "Tom Henderson",
    reviewerEmail: "tom.h@gmail.com",
    agency: "DigitalFirst Co.",
    rating: 2,
    title: "Disappointing results",
    content: "Very disappointing experience with their SEO services. After 3 months, we saw almost no improvement in our rankings. Communication was poor and deliverables were often late. Would not recommend.",
    date: "Jun 5, 2026",
    status: "flagged",
    flagReason: "Potential competitor review",
  },
  {
    id: 4820,
    reviewer: "Lisa Kruger",
    reviewerEmail: "lisa.k@techcorp.com",
    agency: "SEO Masters Inc.",
    rating: 5,
    title: "Phenomenal results",
    content: "Absolutely phenomenal results! Our organic traffic increased by 280% in just 6 months. The team was responsive, professional, and truly understood our industry. Worth every penny.",
    date: "Jun 5, 2026",
    status: "pending",
  },
  {
    id: 4819,
    reviewer: "Mark Davis",
    reviewerEmail: "mark.d@startup.io",
    agency: "AdPro Agency",
    rating: 1,
    title: "Complete waste of money",
    content: "Complete waste of money. They promised top 3 rankings within 2 months but delivered nothing. Their so-called 'experts' used outdated techniques. Stay away from this agency.",
    date: "Jun 4, 2026",
    status: "pending",
  },
  {
    id: 4818,
    reviewer: "Sarah Mitchell",
    reviewerEmail: "sarah.m@boutique.com",
    agency: "WebWizards Agency",
    rating: 4,
    title: "Great social media management",
    content: "Great social media management service. They revamped our Instagram strategy and we gained 5,000 new followers in the first month. Only giving 4 stars because reporting could be more detailed.",
    date: "Jun 3, 2026",
    status: "approved",
  },
  {
    id: 4817,
    reviewer: "Alex Rivera",
    reviewerEmail: "alex.r@ecommerce.co",
    agency: "MediaHouse Pro",
    rating: 5,
    title: "Exceptional PPC management",
    content: "Exceptional PPC management. Our ROAS improved from 2x to 7x under their management. They proactively suggested optimizations and kept us informed every step of the way.",
    date: "Jun 2, 2026",
    status: "approved",
  },
  {
    id: 4816,
    reviewer: "Jennifer Cole",
    reviewerEmail: "jen@fakeemail.xyz",
    agency: "CreativeEdge Studio",
    rating: 5,
    title: "Best agency ever!!!",
    content: "Best agency ever!!! They are amazing amazing amazing. Everyone should use them. 5 stars. Best best best. I love their work so much. Hire them now!!!!",
    date: "Jun 1, 2026",
    status: "flagged",
    flagReason: "Suspected fake review (repetitive language)",
  },
  {
    id: 4815,
    reviewer: "Robert Kim",
    reviewerEmail: "robert.kim@corp.com",
    agency: "DataDriven Marketing",
    rating: 3,
    title: "Average experience",
    content: "Average experience. The initial audit was thorough, but implementation was slow. Results were okay but not outstanding for the price we paid.",
    date: "May 31, 2026",
    status: "approved",
  },
  {
    id: 4814,
    reviewer: "Nancy White",
    reviewerEmail: "nancy@business.com",
    agency: "BrightSpark Digital",
    rating: 4,
    title: "Solid content marketing",
    content: "Solid content marketing strategy. Blog traffic is up 150% and leads from content have doubled. The team is creative and responsive. Renewed for another 6 months.",
    date: "May 30, 2026",
    status: "approved",
  },
  {
    id: 4813,
    reviewer: "Spam Bot",
    reviewerEmail: "buy-followers@spam.net",
    agency: "WebWizards Agency",
    rating: 1,
    title: "Buy followers cheap",
    content: "Buy followers cheap at www.spam-link.com. Best prices for Instagram followers and YouTube subscribers. Visit now for 50% discount!!!!",
    date: "May 29, 2026",
    status: "rejected",
  },
  {
    id: 4812,
    reviewer: "Paul Anderson",
    reviewerEmail: "paul.a@startup.com",
    agency: "SEO Masters Inc.",
    rating: 4,
    title: "Good ROI on our investment",
    content: "Good ROI on our investment. Keyword rankings improved significantly and organic leads increased by 40%. Only minor complaint is the onboarding process was a bit slow.",
    date: "May 28, 2026",
    status: "approved",
  },
];

const statusTabs = [
  { label: "Pending", value: "pending", icon: Clock },
  { label: "Approved", value: "approved", icon: CheckCircle2 },
  { label: "Rejected", value: "rejected", icon: XCircle },
  { label: "Flagged", value: "flagged", icon: Flag },
];

export default function AdminReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionId, setRejectionId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const filtered = allReviews.filter((review) => {
    const matchesStatus = review.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      review.reviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status: ReviewStatus) =>
    allReviews.filter((r) => r.status === status).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Reviews Moderation</h1>
        <p className="mt-1 text-gray-500">
          Review, approve, reject, or flag user reviews.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {statusTabs.map((tab) => {
          const Icon = tab.icon;
          const count = getStatusCount(tab.value as ReviewStatus);
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as ReviewStatus)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === tab.value
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews by reviewer, agency, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
          />
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {filtered.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">
                        {review.reviewer
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-navy">
                        {review.reviewer}
                      </p>
                      <p className="text-xs text-gray-400">
                        {review.reviewerEmail}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-300">|</span>
                  <p className="text-sm text-gray-500">
                    on{" "}
                    <span className="font-medium text-navy">
                      {review.agency}
                    </span>
                  </p>
                  <span className="text-xs text-gray-300">|</span>
                  <p className="text-xs text-gray-400">{review.date}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-navy">
                    {review.rating}.0
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-navy text-sm mb-1">
                  {review.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {review.content}
                </p>

                {/* Flag reason */}
                {review.flagReason && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
                    <Flag className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                      <span className="font-medium">Flag reason:</span>{" "}
                      {review.flagReason}
                    </p>
                  </div>
                )}

                {/* Rejection reason input */}
                {rejectionId === review.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rejection reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2 mt-2">
                      <button className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md transition-colors">
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectionId(null);
                          setRejectionReason("");
                        }}
                        className="text-xs font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                {(review.status === "pending" || review.status === "flagged") && (
                  <>
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        setRejectionId(
                          rejectionId === review.id ? null : review.id
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    {review.status !== "flagged" && (
                      <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                        <Flag className="w-4 h-4" />
                        Flag
                      </button>
                    )}
                  </>
                )}
                {review.status === "approved" && (
                  <>
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                      <Flag className="w-4 h-4" />
                      Flag
                    </button>
                    <button
                      onClick={() =>
                        setRejectionId(
                          rejectionId === review.id ? null : review.id
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {review.status === "rejected" && (
                  <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Restore
                  </button>
                )}
              </div>
            </div>

            {/* Review ID */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-xs text-gray-400">
                Review #{review.id}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">
              No reviews found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
