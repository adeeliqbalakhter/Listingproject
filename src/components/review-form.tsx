"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ReviewFormProps {
  agencyId: string;
}

export function ReviewForm({ agencyId }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formLoadedAt] = useState(() => Date.now());

  const displayRating = hoveredRating || overallRating;
  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (overallRating === 0) { setError("Please select a rating."); return; }
    if (title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
    if (content.trim().length < 20) { setError("Review must be at least 20 characters."); return; }
    if (reviewerName.trim().length < 2) { setError("Please enter your name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewerEmail)) { setError("Please enter a valid email."); return; }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          overallRating,
          title: title.trim(),
          content: content.trim(),
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail.trim(),
          website,
          formLoadedAt,
        }),
      });

      if (res.status === 409) { setError("A review from this email already exists for this agency."); return; }
      if (res.status === 429) { setError("Too many reviews submitted. Please try again later."); return; }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="mt-3 text-lg font-semibold text-emerald-800">Thank you for your review!</h3>
        <p className="mt-1 text-sm text-emerald-700">
          Your review has been submitted and is pending approval. It will appear on this page once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-8">
      <h3 className="text-lg font-bold text-navy">Write a Review</h3>
      <p className="mt-1 text-sm text-gray-500">Share your experience working with this agency.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Honeypot - hidden from real users */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
            value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button"
                  onClick={() => setOverallRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none cursor-pointer hover:scale-110 transition-transform">
                  <Star className={`w-7 h-7 ${star <= displayRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} transition-colors`} />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <span className="text-sm font-medium text-gray-600">{ratingLabels[displayRating]}</span>
            )}
          </div>
        </div>

        {/* Name & Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reviewer-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input id="reviewer-name" type="text" value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="John Doe" maxLength={50}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="reviewer-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Email <span className="text-red-500">*</span>
            </label>
            <input id="reviewer-email" type="email" value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              placeholder="john@example.com" maxLength={255}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder-gray-400" />
            <p className="mt-1 text-xs text-gray-400">Not displayed publicly</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Review Title <span className="text-red-500">*</span>
          </label>
          <input id="review-title" type="text" value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience..." maxLength={255}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder-gray-400" />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea id="review-content" value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell others about your experience working with this agency..."
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder-gray-400 resize-none" />
          <p className="mt-1 text-xs text-gray-400">Minimum 20 characters ({content.length}/20)</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>) : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
