import { NextRequest } from "next/server";
import { searchParamsSchema } from "@/lib/validations";

// ─── Mock Data ───────────────────────────────────────────────────
// TODO: Replace with Drizzle full-text search queries

const mockAgencies = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "PixelCraft Studios",
    slug: "pixelcraft-studios",
    tagline: "Crafting digital experiences that matter",
    description:
      "Full-service digital agency specialising in web development, UX design, and brand strategy.",
    logo: null,
    website: "https://pixelcraft.example.com",
    companySize: "11-50" as const,
    hourlyRate: "$100-$150",
    minProjectSize: 10000,
    isVerified: true,
    isFeatured: true,
    isPremium: false,
    averageRating: 4.7,
    totalReviews: 23,
    country: { name: "United States", slug: "united-states" },
    city: { name: "San Francisco", slug: "san-francisco" },
    services: [
      { id: "s1", name: "Web Development", slug: "web-development" },
      { id: "s2", name: "UX Design", slug: "ux-design" },
    ],
    industries: [
      { id: "i1", name: "Technology", slug: "technology" },
      { id: "i2", name: "E-commerce", slug: "e-commerce" },
    ],
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "GrowthLab Marketing",
    slug: "growthlab-marketing",
    tagline: "Data-driven growth for ambitious brands",
    description:
      "Performance marketing agency helping startups and scale-ups achieve sustainable growth.",
    logo: null,
    website: "https://growthlab.example.com",
    companySize: "1-10" as const,
    hourlyRate: "$75-$120",
    minProjectSize: 5000,
    isVerified: false,
    isFeatured: false,
    isPremium: true,
    averageRating: 4.2,
    totalReviews: 11,
    country: { name: "United Kingdom", slug: "united-kingdom" },
    city: { name: "London", slug: "london" },
    services: [
      { id: "s3", name: "SEO", slug: "seo" },
      { id: "s4", name: "PPC", slug: "ppc" },
    ],
    industries: [{ id: "i3", name: "SaaS", slug: "saas" }],
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "BrandForge Agency",
    slug: "brandforge-agency",
    tagline: "Forge your brand identity",
    description:
      "Creative branding and design agency specializing in visual identity, packaging, and marketing collateral.",
    logo: null,
    website: "https://brandforge.example.com",
    companySize: "11-50" as const,
    hourlyRate: "$80-$130",
    minProjectSize: 8000,
    isVerified: true,
    isFeatured: false,
    isPremium: false,
    averageRating: 4.5,
    totalReviews: 17,
    country: { name: "United States", slug: "united-states" },
    city: { name: "New York", slug: "new-york" },
    services: [
      { id: "s5", name: "Branding", slug: "branding" },
      { id: "s2", name: "UX Design", slug: "ux-design" },
    ],
    industries: [
      { id: "i4", name: "Healthcare", slug: "healthcare" },
      { id: "i2", name: "E-commerce", slug: "e-commerce" },
    ],
  },
];

// ─── GET /api/search ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const params = searchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!params.success) {
      return Response.json(
        { error: "Invalid query parameters", details: params.error.format() },
        { status: 400 }
      );
    }

    const {
      query,
      services,
      industries,
      country,
      city,
      minRating,
      companySize,
      minBudget,
      maxBudget,
      sortBy,
      page,
      limit,
    } = params.data;

    // TODO: Replace with Drizzle full-text search:
    // PostgreSQL full-text search using tsvector/tsquery:
    // const tsvectorCol = sql`
    //   to_tsvector('english',
    //     coalesce(${schema.agencies.name}, '') || ' ' ||
    //     coalesce(${schema.agencies.tagline}, '') || ' ' ||
    //     coalesce(${schema.agencies.description}, '')
    //   )
    // `;
    // const conditions = [
    //   isNull(schema.agencies.deletedAt),
    //   eq(schema.agencies.status, "active"),
    // ];
    // if (query) {
    //   conditions.push(
    //     sql`${tsvectorCol} @@ plainto_tsquery('english', ${query})`
    //   );
    // }
    // ... additional filters same as agencies route ...
    //
    // const results = await db.select({
    //   ...getTableColumns(schema.agencies),
    //   relevance: query
    //     ? sql`ts_rank(${tsvectorCol}, plainto_tsquery('english', ${query}))`
    //     : sql`1`,
    // })
    //   .from(schema.agencies)
    //   .where(and(...conditions))
    //   .orderBy(query ? desc(sql`relevance`) : desc(schema.agencies.averageRating))
    //   .limit(limit).offset((page - 1) * limit);

    let results = [...mockAgencies];

    // Full-text search simulation
    if (query) {
      const q = query.toLowerCase();
      results = results
        .map((agency) => {
          let relevance = 0;
          const nameMatch = agency.name.toLowerCase().includes(q);
          const taglineMatch = agency.tagline?.toLowerCase().includes(q);
          const descMatch = agency.description?.toLowerCase().includes(q);
          const serviceMatch = agency.services.some((s) =>
            s.name.toLowerCase().includes(q)
          );

          if (nameMatch) relevance += 10;
          if (taglineMatch) relevance += 5;
          if (descMatch) relevance += 3;
          if (serviceMatch) relevance += 7;

          return { ...agency, relevance };
        })
        .filter((a) => a.relevance > 0);

      // Default sort by relevance when searching
      if (!sortBy) {
        results.sort((a: any, b: any) => b.relevance - a.relevance);
      }
    }

    // Filters
    if (services && services.length > 0) {
      results = results.filter((a) =>
        a.services.some((s) => services.includes(s.slug))
      );
    }
    if (industries && industries.length > 0) {
      results = results.filter((a) =>
        a.industries.some((i) => industries.includes(i.slug))
      );
    }
    if (country) {
      results = results.filter((a) => a.country?.slug === country);
    }
    if (city) {
      results = results.filter((a) => a.city?.slug === city);
    }
    if (minRating) {
      results = results.filter((a) => a.averageRating >= minRating);
    }
    if (companySize) {
      results = results.filter((a) => a.companySize === companySize);
    }
    if (minBudget) {
      results = results.filter(
        (a) => a.minProjectSize !== null && a.minProjectSize >= minBudget
      );
    }
    if (maxBudget) {
      results = results.filter(
        (a) => a.minProjectSize !== null && a.minProjectSize <= maxBudget
      );
    }

    // Explicit sorting
    if (sortBy === "rating") {
      results.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === "reviews") {
      results.sort((a, b) => b.totalReviews - a.totalReviews);
    } else if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedData = results.slice(offset, offset + limit);

    // Facets for filter UI
    // TODO: Compute real facets from the DB:
    // const serviceFacets = await db.select({
    //   slug: schema.services.slug,
    //   name: schema.services.name,
    //   count: count(),
    // }).from(schema.agencyServices)
    //   .innerJoin(schema.services, eq(schema.agencyServices.serviceId, schema.services.id))
    //   .groupBy(schema.services.slug, schema.services.name);

    const facets = {
      services: [
        { slug: "web-development", name: "Web Development", count: 1 },
        { slug: "ux-design", name: "UX Design", count: 2 },
        { slug: "seo", name: "SEO", count: 1 },
        { slug: "ppc", name: "PPC", count: 1 },
        { slug: "branding", name: "Branding", count: 1 },
      ],
      industries: [
        { slug: "technology", name: "Technology", count: 1 },
        { slug: "e-commerce", name: "E-commerce", count: 2 },
        { slug: "saas", name: "SaaS", count: 1 },
        { slug: "healthcare", name: "Healthcare", count: 1 },
      ],
      countries: [
        { slug: "united-states", name: "United States", count: 2 },
        { slug: "united-kingdom", name: "United Kingdom", count: 1 },
      ],
    };

    return Response.json({
      data: paginatedData,
      pagination: { page, limit, total, totalPages },
      facets,
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
