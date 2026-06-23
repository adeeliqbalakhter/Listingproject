import { Star, Sparkles } from "lucide-react";

export interface TopMention {
  label: string;
  count: number;
}

export interface ReviewHighlight {
  title: string;
  body: string;
}

export interface ReviewInsightsData {
  topMentions: TopMention[];
  highlights: ReviewHighlight[];
  rating: number;
  reviewCount: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(rating) ? "fill-red-500 text-red-500" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

export function ReviewInsights({
  data,
  agencyName,
}: {
  data: ReviewInsightsData;
  agencyName: string;
}) {
  if (data.reviewCount === 0 || data.topMentions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-navy">{agencyName} Review Insights</h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <Sparkles className="w-3 h-3" /> Auto-generated
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Mentions */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-navy">Top Mentions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.topMentions.map((m) => (
                <span
                  key={m.label}
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-navy text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {m.label}
                  <span className="text-gray-400">({m.count})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Overall rating box */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Overall Review Rating</p>
              <p className="mt-1 text-3xl font-bold text-navy">{data.rating.toFixed(1)}</p>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <Stars rating={data.rating} />
                <span className="text-xs text-gray-400">({data.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Highlights */}
        {data.highlights.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-navy">Review Highlights</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.highlights.map((h) => (
                <div key={h.title} className="rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold text-navy text-sm border-b border-gray-100 pb-2">
                    {h.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
