import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";
import { z } from "zod";

const scrapeSchema = z.object({
  url: z.string().url().refine((u) => u.includes("linkedin.com"), { message: "Must be a LinkedIn URL" }),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const parsed = scrapeSchema.safeParse(body);
    if (!parsed.success) return error("Invalid LinkedIn URL", 400);

    const linkedinUrl = parsed.data.url;
    const data: Record<string, string | null> = {
      name: null,
      description: null,
      website: null,
      industry: null,
      companySize: null,
      foundedYear: null,
      headquarters: null,
      linkedinUrl,
    };

    try {
      const res = await fetch(linkedinUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const html = await res.text();

        const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
                        html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/);
        if (ogTitle?.[1]) data.name = ogTitle[1].replace(/ \| LinkedIn$/, "").replace(/:.*$/, "").trim();

        const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
                       html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/);
        if (ogDesc?.[1]) data.description = ogDesc[1].trim();

        const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ||
                         html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/);
        if (!data.description && metaDesc?.[1]) data.description = metaDesc[1].trim();

        if (data.description) {
          const sizeMatch = data.description.match(/(\d[\d,]+-[\d,]+)\s*employees/i) ||
                           data.description.match(/(\d[\d,]+\+?)\s*employees/i);
          if (sizeMatch) data.companySize = sizeMatch[1] + " employees";

          const industryMatch = data.description.match(/(?:^|\.\s*)([^.]*?(?:Marketing|Technology|Software|Advertising|Digital|Media|Consulting|Design|Agency)[^.]*)/i);
          if (industryMatch) data.industry = industryMatch[1].trim().slice(0, 100);
        }
      }
    } catch {
      // LinkedIn blocked the request — return empty data for manual entry
    }

    return success({
      scraped: data,
      message: data.name
        ? "Some data was extracted. Please review and complete the form."
        : "Could not extract data from LinkedIn. Please fill in the details manually.",
    });
  } catch (err) {
    return serverError(err);
  }
}
