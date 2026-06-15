"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ReviewFormProps {
  agencyId: string;
}

export function ReviewForm({ agencyId }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const displayRating = hoveredRating || overallRating;

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAuthError(false);

    if (overallRating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (content.trim().length < 20) {
      setError("Review content must be at least 20 characters.");
      return;
    }

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
        }),
      });

      if (res.status === 401) {
        setAuthError(true);
        return;
      }

      if (res.status === 403) {
        const data = await res.json();
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email address before leaving a review.");
        } else {
          setError("You do not have permission to leave a review.");
        }
        return;
      }

      if (res.status === 409) {
        setError("You have already reviewed this agency.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setOverallRating(0);
      setTitle("");
      setContent("");
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
        <h3 className="mt-3 text-lg font-semibold text-emerald-800">
          Thank you for your review!
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          Your review has been submitted and is pending approval. It will appear
          on this page once an admin approves it.
        </p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-blue-500 mx-auto" />
        <h3 className="mt-3 text-lg font-semibold text-navy">
          Please sign in to leave a review
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          You need to be logged in to submit a review for this agency.
        </p>
        <Link
          href="/auth/signin"
          className="mt-4 inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-100 pt-8">
      <h3 className="text-lg font-bold text-navy">Write a Review</h3>
      <p className="mt-1 text-sm text-gray-500">
        Share your experience working with this agency.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= displayRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <span className="text-sm font-medium text-gray-600">
                {ratingLabels[displayRating]}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="review-title"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Review Title <span className="text-red-500">*</span>
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience..."
            maxLength={255}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder-gray-400"
          />
          <p className="mt-1 text-xs text-gray-400">
            Minimum 5 characters
          </p>
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="review-content"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tell others about your experience working with this agency. What went well? What could be improved?"
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white placeholder-gray-400 resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            Minimum 20 characters ({content.length}/20)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
}
