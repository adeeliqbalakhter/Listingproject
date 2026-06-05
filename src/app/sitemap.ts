import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agencyhub.com";

  const staticPages = [
    "",
    "/agencies",
    "/get-quotes",
    "/pricing",
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

  return [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...servicePages.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
