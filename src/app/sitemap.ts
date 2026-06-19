import type { MetadataRoute } from "next";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agencyhub.com";
  const now = new Date();

  const staticPages = [
    "",
    "/agencies",
    "/services",
    "/get-quotes",
    "/pricing",
    "/how-it-works",
    "/blog",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const servicePages = [
    "/seo-agencies",
    "/ppc-agencies",
    "/social-media-agencies",
    "/web-design-agencies",
    "/content-marketing-agencies",
    "/email-marketing-agencies",
    "/branding-agencies",
    "/digital-marketing-agencies",
  ];

  const staticEntries: MetadataRoute.Sitemap = [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...servicePages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];

  let agencyEntries: MetadataRoute.Sitemap = [];
  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    if (hasDb()) {
      const db = getDb();

      const rows = await db.execute(
        sql`SELECT slug, updated_at FROM agencies WHERE status = 'active' AND deleted_at IS NULL`
      );
      const agencies = rows as unknown as Array<{ slug: string; updated_at: string | null }>;

      agencyEntries = agencies.map((agency) => ({
        url: `${baseUrl}/agencies/${agency.slug}`,
        lastModified: agency.updated_at ? new Date(agency.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

      try {
        const blogRows = await db.execute(
          sql`SELECT slug, updated_at FROM blog_posts WHERE status = 'published'`
        );
        const posts = blogRows as unknown as Array<{ slug: string; updated_at: string | null }>;
        blogEntries = posts.map((post) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : now,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
      } catch {
        // blog_posts table may not exist
      }
    }
  } catch {
    // DB unavailable
  }

  return [...staticEntries, ...agencyEntries, ...blogEntries];
}
