import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError, created } from "@/lib/api/response";

async function safeQuery<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    const conditions = [sql`1=1`];
    if (status && status !== "all") {
      conditions.push(sql`bp.status = ${status}`);
    }
    if (search) {
      conditions.push(sql`(bp.title ILIKE ${"%" + search + "%"} OR bp.excerpt ILIKE ${"%" + search + "%"})`);
    }
    const whereClause = sql.join(conditions, sql` AND `);

    const [countResult, posts, categories, tags] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS count FROM blog_posts bp WHERE ${whereClause}`),
      db.execute(sql`
        SELECT bp.*, u.name AS author_name, bc.name AS category_name
        FROM blog_posts bp
        LEFT JOIN users u ON u.id = bp.author_id
        LEFT JOIN blog_categories bc ON bc.id = bp.category_id
        WHERE ${whereClause}
        ORDER BY bp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
      safeQuery(db.execute(sql`SELECT id, name, slug FROM blog_categories ORDER BY sort_order ASC, name ASC`), [] as any[]),
      safeQuery(db.execute(sql`SELECT id, name, slug FROM blog_tags ORDER BY name ASC`), [] as any[]),
    ]);

    const total = Number((countResult as any[])[0]?.count) || 0;

    return success({
      posts: (posts as any[]).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        status: p.status,
        featuredImage: p.featured_image,
        authorName: p.author_name,
        categoryName: p.category_name,
        categoryId: p.category_id,
        viewCount: Number(p.view_count) || 0,
        readingTime: p.reading_time,
        publishedAt: p.published_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      categories: (categories as any[]).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
      tags: (tags as any[]).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return serverError(err);
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const { title, content, excerpt, categoryId, status, featuredImage, metaTitle, metaDescription, tagIds } = body;

    if (!title || !content) return error("Title and content are required");

    const slug = slugify(title);
    const readingTime = estimateReadingTime(content);
    const publishedAt = status === "published" ? new Date() : null;
    const userId = authResult.user.id;

    const result = await db.execute(sql`
      INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, featured_image, status, meta_title, meta_description, reading_time, published_at)
      VALUES (${userId}, ${categoryId || null}, ${title}, ${slug}, ${excerpt || null}, ${content}, ${featuredImage || null}, ${status || "draft"}, ${metaTitle || null}, ${metaDescription || null}, ${readingTime}, ${publishedAt})
      RETURNING id, slug
    `);

    const post = (result as any[])[0];

    if (tagIds && tagIds.length > 0 && post?.id) {
      for (const tagId of tagIds) {
        await db.execute(sql`
          INSERT INTO blog_post_tags (post_id, tag_id) VALUES (${post.id}, ${tagId})
          ON CONFLICT DO NOTHING
        `).catch(() => {});
      }
    }

    return created({ id: post?.id, slug: post?.slug });
  } catch (err) {
    return serverError(err);
  }
}
