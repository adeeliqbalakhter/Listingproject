"use client";

import { useState, useMemo } from "react";
import { Tag, Clock, CreditCard, Wallet, Info } from "lucide-react";

export interface PricingServiceData {
  name: string;
  count: number;
  /** index 0-3 of the most common cost bucket for this service */
  topBucket: number;
  /** per-bucket counts for this service */
  buckets: number[];
}

export interface PricingSnapshotData {
  minProjectSize: number | null;
  hourlyRate: string | null;
  costRating: number | null;
  totalCostReviews: number;
  /** counts for the 4 display buckets across all reviews */
  buckets: number[];
  services: PricingServiceData[];
  summary: string;
}

const BUCKET_LABELS = [
  "< $49,999",
  "$50,000 – $199,999",
  "$200,000 – $999,999",
  "> $1,000,000",
];

const BUCKET_COLORS = ["bg-emerald-400", "bg-emerald-600", "bg-emerald-700", "bg-emerald-900"];

function StatCard({
  icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className={`h-1.5 ${accent}`} />
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {icon}
          <span>{label}</span>
          {hint}
        </div>
        <p className="mt-1.5 text-lg font-bold text-navy">{value}</p>
      </div>
    </div>
  );
}

export function PricingSnapshot({ data, agencyName }: { data: PricingSnapshotData; agencyName: string }) {
  const [activeService, setActiveService] = useState<string>("All");

  const activeBuckets = useMemo(() => {
    if (activeService === "All") return data.buckets;
    const svc = data.services.find((s) => s.name === activeService);
    return svc ? svc.buckets : data.buckets;
  }, [activeService, data]);

  const activeTotal = activeBuckets.reduce((a, b) => a + b, 0);
  const topBucketIdx =
    activeTotal > 0
      ? activeBuckets.indexOf(Math.max(...activeBuckets))
      : -1;

  const minProjectDisplay =
    data.minProjectSize != null ? `$${Number(data.minProjectSize).toLocaleString()}+` : "—";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-navy">Pricing Snapshot</h2>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: stat cards + summary */}
        <div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Tag className="w-3.5 h-3.5" />}
              accent="bg-emerald-400"
              label="Min. project size"
              value={minProjectDisplay}
            />
            <StatCard
              icon={<Clock className="w-3.5 h-3.5" />}
              accent="bg-blue-500"
              label="Avg. hourly rate"
              value={data.hourlyRate || "—"}
            />
            <StatCard
              icon={<CreditCard className="w-3.5 h-3.5" />}
              accent="bg-amber-400"
              label="Rating for cost"
              value={data.costRating != null ? `${data.costRating.toFixed(1)} /5` : "—"}
            />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-navy">What Clients Have Said</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{data.summary}</p>
            <p className="mt-3 text-xs text-gray-400">
              This summary is based on {data.totalCostReviews > 0 ? `${data.totalCostReviews} verified ` : ""}
              reviews of {agencyName}.
            </p>
          </div>
        </div>

        {/* Right: most common project size + per-service */}
        <div>
          <h3 className="font-semibold text-navy">Most Common Project Size</h3>
          {activeTotal > 0 && topBucketIdx >= 0 ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm">
                  <span className="font-bold text-navy text-base">{BUCKET_LABELS[topBucketIdx]}</span>{" "}
                  <span className="text-gray-500">based on {activeTotal} review{activeTotal === 1 ? "" : "s"}</span>
                </p>
              </div>

              {/* Distribution bar */}
              <div className="mt-4 flex rounded-md overflow-hidden border border-gray-100 text-[11px] font-medium">
                {activeBuckets.map((count, i) => {
                  const pct = activeTotal > 0 ? (count / activeTotal) * 100 : 0;
                  const isTop = i === topBucketIdx;
                  return (
                    <div
                      key={i}
                      className={`py-2 text-center transition-all ${
                        isTop ? `${BUCKET_COLORS[i]} text-white` : "bg-gray-50 text-gray-400"
                      }`}
                      style={{ flexBasis: `${Math.max(pct, isTop ? 30 : 14)}%` }}
                      title={`${BUCKET_LABELS[i]}: ${count} review${count === 1 ? "" : "s"}`}
                    >
                      {isTop ? BUCKET_LABELS[i] : BUCKET_LABELS[i].replace(/ /g, "")}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-400 italic">
              Not enough pricing data from reviews yet.
            </p>
          )}

          {/* Service selector */}
          {data.services.length > 0 && (
            <div className="mt-6">
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                Select a service to see pricing information
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveService("All")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    activeService === "All"
                      ? "border-brand text-brand bg-brand/5"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  All
                </button>
                {data.services.map((svc) => (
                  <button
                    key={svc.name}
                    onClick={() => setActiveService(svc.name)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      activeService === svc.name
                        ? "border-brand text-brand bg-brand/5"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {svc.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
