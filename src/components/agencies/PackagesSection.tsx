"use client";

import { useState, useRef, useEffect } from "react";
import { Star, Clock, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrors server-side PackageData)
// ---------------------------------------------------------------------------

interface PackageFeature {
  name: string;
  type: string;
  value: string;
}

interface PackageTier {
  label: string;
  price: string;
  frequency: string;
  audience: string;
  features: PackageFeature[];
}

interface PackageData {
  serviceLine: string;
  focusArea: string;
  name: string;
  description: string;
  tiers: PackageTier[];
}

interface PackagesSectionProps {
  packages: PackageData[];
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  averageRating: number;
  totalReviews: number;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function Stars({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < Math.round(rating)
              ? "fill-warning text-warning"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-emerald-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DashIcon() {
  return <span className="text-gray-300 font-medium">&#8212;</span>;
}

// ---------------------------------------------------------------------------
// Quote Modal
// ---------------------------------------------------------------------------

function QuoteModal({
  open,
  onClose,
  agencyId,
  agencyName,
  averageRating,
  totalReviews,
}: {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  agencyName: string;
  averageRating: number;
  totalReviews: number;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    subject: "Packages",
    message: "",
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    sendCopy: false,
    addToShortlist: false,
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          isDirect: true,
          agencyIds: [agencyId],
          subject: form.subject,
          message: form.message,
          fullName: form.fullName,
          companyName: form.companyName,
          email: form.email,
          phone: form.phone,
          sendCopy: form.sendCopy,
          addToShortlist: form.addToShortlist,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-navy">{agencyName}</h3>
              {totalReviews > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Stars rating={averageRating} size="w-3.5 h-3.5" />
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckIcon />
            </div>
            <h4 className="text-lg font-bold text-navy">Message Sent!</h4>
            <p className="text-sm text-gray-600 mt-2">
              Your request has been sent to {agencyName}. They will get back to you soon.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {error}
              </p>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              >
                <option value="Packages">Packages</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Request for Proposal">Request for Proposal</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                rows={4}
                placeholder="Describe your project or requirements..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none resize-none"
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                required
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendCopy}
                  onChange={(e) => update("sendCopy", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-gray-700">
                  Send a copy to my email
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.addToShortlist}
                  onChange={(e) => update("addToShortlist", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-gray-700">
                  Add to my Shortlist
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key Features View (tier cards)
// ---------------------------------------------------------------------------

function KeyFeaturesView({
  tiers,
  onRequestQuote,
}: {
  tiers: PackageTier[];
  onRequestQuote: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {tiers
        .filter((t) => t.label || t.price)
        .map((tier, ti) => {
          const isHighlighted = ti === 1;
          // Find a "delivery time" feature
          const deliveryFeature = tier.features.find(
            (f) =>
              f.name.toLowerCase().includes("delivery") ||
              f.name.toLowerCase().includes("turnaround") ||
              f.name.toLowerCase().includes("timeline")
          );
          const otherFeatures = tier.features.filter((f) => f !== deliveryFeature);

          return (
            <div
              key={ti}
              className={`rounded-xl border p-6 flex flex-col ${
                isHighlighted
                  ? "border-brand border-2 shadow-md relative"
                  : "border-gray-200"
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </div>
              )}

              {/* Tier label */}
              <p className="text-base font-bold text-navy">{tier.label}</p>

              {/* Audience */}
              {tier.audience && (
                <p className="text-sm text-gray-500 mt-1">{tier.audience}</p>
              )}

              {/* Price */}
              {tier.price && (
                <p className="mt-4 text-3xl font-bold text-navy">
                  {tier.price}
                  {tier.frequency && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {tier.frequency}
                    </span>
                  )}
                </p>
              )}

              {/* Features */}
              {otherFeatures.length > 0 && (
                <ul className="mt-5 space-y-2.5 flex-1">
                  {otherFeatures.map((feat, fi) => (
                    <li
                      key={fi}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="mt-0.5">
                        <CheckIcon />
                      </span>
                      <span>
                        {feat.name}
                        {feat.value && feat.type !== "checkmark"
                          ? `: ${feat.value}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Delivery time */}
              {deliveryFeature && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {deliveryFeature.name}
                    {deliveryFeature.value ? `: ${deliveryFeature.value}` : ""}
                  </span>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={onRequestQuote}
                className={`mt-5 w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  isHighlighted
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "bg-white border-2 border-brand text-brand hover:bg-brand hover:text-white"
                }`}
              >
                Request a Quote
              </button>
            </div>
          );
        })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare All Features View (table)
// ---------------------------------------------------------------------------

function CompareAllFeaturesView({
  tiers,
  onRequestQuote,
}: {
  tiers: PackageTier[];
  onRequestQuote: () => void;
}) {
  const activeTiers = tiers.filter((t) => t.label || t.price);
  if (activeTiers.length === 0) return null;

  // Collect all unique feature names across tiers (preserving order)
  const featureNames: string[] = [];
  const seen = new Set<string>();
  for (const tier of activeTiers) {
    for (const feat of tier.features) {
      if (!seen.has(feat.name)) {
        seen.add(feat.name);
        featureNames.push(feat.name);
      }
    }
  }

  // Build lookup: tier index -> feature name -> feature
  const tierFeatureMap: Map<string, PackageFeature>[] = activeTiers.map((tier) => {
    const map = new Map<string, PackageFeature>();
    for (const f of tier.features) {
      map.set(f.name, f);
    }
    return map;
  });

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        {/* Header: tier labels + prices */}
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-3 font-semibold text-gray-500 w-1/4">
              Feature
            </th>
            {activeTiers.map((tier, ti) => (
              <th
                key={ti}
                className={`text-center py-3 px-3 ${
                  ti === 1 ? "bg-brand/5" : ""
                }`}
              >
                <p className="font-bold text-navy">{tier.label}</p>
                {tier.price && (
                  <p className="text-lg font-bold text-navy mt-0.5">
                    {tier.price}
                    {tier.frequency && (
                      <span className="text-xs font-normal text-gray-500 ml-0.5">
                        {tier.frequency}
                      </span>
                    )}
                  </p>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {featureNames.map((fname, ri) => (
            <tr
              key={ri}
              className={`border-b border-gray-100 ${
                ri % 2 === 0 ? "bg-gray-50/50" : ""
              }`}
            >
              <td className="py-3 px-3 font-medium text-gray-700">{fname}</td>
              {activeTiers.map((_, ti) => {
                const feat = tierFeatureMap[ti].get(fname);
                return (
                  <td
                    key={ti}
                    className={`text-center py-3 px-3 ${
                      ti === 1 ? "bg-brand/5" : ""
                    }`}
                  >
                    {feat ? (
                      feat.type === "checkmark" ? (
                        <span className="inline-flex justify-center">
                          <CheckIcon />
                        </span>
                      ) : (
                        <span className="text-gray-700">
                          {feat.value || feat.name}
                        </span>
                      )
                    ) : (
                      <DashIcon />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {/* Footer: CTA buttons */}
        <tfoot>
          <tr>
            <td className="py-4 px-3" />
            {activeTiers.map((_, ti) => (
              <td key={ti} className={`text-center py-4 px-3 ${ti === 1 ? "bg-brand/5" : ""}`}>
                <button
                  onClick={onRequestQuote}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    ti === 1
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "bg-white border-2 border-brand text-brand hover:bg-brand hover:text-white"
                  }`}
                >
                  Request a Quote
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function PackagesSection({
  packages,
  agencyId,
  agencyName,
  agencySlug,
  averageRating,
  totalReviews,
}: PackagesSectionProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [view, setView] = useState<"features" | "compare">("features");
  const [quoteOpen, setQuoteOpen] = useState(false);

  if (packages.length === 0) return null;

  const current = packages[selectedIdx] || packages[0];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        {/* Title */}
        <h2 className="text-xl font-bold text-navy">Packages</h2>

        {/* Package selector */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <label
            htmlFor="pkg-select"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Packages we offer:
          </label>
          <select
            id="pkg-select"
            value={selectedIdx}
            onChange={(e) => {
              setSelectedIdx(Number(e.target.value));
              setView("features");
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-navy focus:ring-2 focus:ring-brand focus:border-brand outline-none sm:min-w-[240px]"
          >
            {packages.map((pkg, i) => (
              <option key={i} value={i}>
                {pkg.serviceLine || pkg.name || `Package ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Package header */}
        <div className="mt-5">
          <h3 className="text-lg font-bold text-navy">{current.name}</h3>
          {current.description && (
            <p className="text-sm text-gray-600 mt-1 leading-relaxed max-w-2xl">
              {current.description}
            </p>
          )}
        </div>

        {/* View toggle tabs */}
        {current.tiers.length > 0 && (
          <>
            <div className="mt-6 flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setView("features")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === "features"
                    ? "bg-white text-navy shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Key features
              </button>
              <button
                onClick={() => setView("compare")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === "compare"
                    ? "bg-white text-navy shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Compare all features
              </button>
            </div>

            {/* Content */}
            <div className="mt-6">
              {view === "features" ? (
                <KeyFeaturesView
                  tiers={current.tiers}
                  onRequestQuote={() => setQuoteOpen(true)}
                />
              ) : (
                <CompareAllFeaturesView
                  tiers={current.tiers}
                  onRequestQuote={() => setQuoteOpen(true)}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Quote Modal */}
      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        agencyId={agencyId}
        agencyName={agencyName}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />
    </>
  );
}
