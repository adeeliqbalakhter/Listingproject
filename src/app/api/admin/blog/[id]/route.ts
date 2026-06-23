import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT bp.*, u.name AS author_name, bc.name AS category_name
      FROM blog_posts bp
      LEFT JOIN users u ON u.id = bp.author_id
      LEFT JOIN blog_categories bc ON bc.id = bp.category_id
      WHERE bp.id = ${id}
    `);

    const post = (rows as any[])[0];
    if (!post) return error("Post not found", 404);

    let tags: any[] = [];
    try {
      const tagRows = await db.execute(sql`
        SELECT bt.id, bt.name, bt.slug
        FROM blog_post_tags bpt
        JOIN blog_tags bt ON bt.id = bpt.tag_id
        WHERE bpt.post_id = ${id}
      `);
      tags = (tagRows as any[]).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug }));
    } catch { /* table may not exist */ }

    return success({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      featuredImage: post.featured_image,
      categoryId: post.category_id,
      categoryName: post.category_name,
      authorName: post.author_name,
      metaTitle: post.meta_title,
      metaDescription: post.meta_description,
      readingTime: post.reading_time,
      viewCount: Number(post.view_count) || 0,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      tags,
    });
  } catch (err) {
    return serverError(err);
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function estimateReadingTime(content: string): number {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const { title, content, excerpt, categoryId, status, featuredImage, metaTitle, metaDescription, tagIds } = body;

    const existing = await db.execute(sql`SELECT id, status, published_at FROM blog_posts WHERE id = ${id}`);
    if ((existing as any[]).length === 0) return error("Post not found", 404);

    const oldPost = (existing as any[])[0];
    const slug = title ? slugify(title) : undefined;
    const readingTime = content ? estimateReadingTime(content) : undefined;
    const publishedAt = status === "published" && !oldPost.published_at ? new Date() : undefined;

    const sets: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { sets.push("title"); values.push(title); }
    if (slug !== undefined) { sets.push("slug"); values.push(slug); }
    if (content !== undefined) { sets.push("content"); values.push(content); }
    if (excerpt !== undefined) { sets.push("excerpt"); values.push(excerpt); }
    if (categoryId !== undefined) { sets.push("category_id"); values.push(categoryId || null); }
    if (status !== undefined) { sets.push("status"); values.push(status); }
    if (featuredImage !== undefined) { sets.push("featured_image"); values.push(featuredImage || null); }
    if (metaTitle !== undefined) { sets.push("meta_title"); values.push(metaTitle || null); }
    if (metaDescription !== undefined) { sets.push("meta_description"); values.push(metaDescription || null); }
    if (readingTime !== undefined) { sets.push("reading_time"); values.push(readingTime); }
    if (publishedAt !== undefined) { sets.push("published_at"); values.push(publishedAt); }

    if (sets.length > 0) {
      const setClauses = sets.map((col, i) => sql`${sql.raw(col)} = ${values[i]}`);
      setClauses.push(sql`updated_at = NOW()`);
      const setClause = sql.join(setClauses, sql`, `);
      await db.execute(sql`UPDATE blog_posts SET ${setClause} WHERE id = ${id}`);
    }

    if (tagIds !== undefined) {
      await db.execute(sql`DELETE FROM blog_post_tags WHERE post_id = ${id}`).catch(() => {});
      for (const tagId of tagIds) {
        await db.execute(sql`
          INSERT INTO blog_post_tags (post_id, tag_id) VALUES (${id}, ${tagId})
          ON CONFLICT DO NOTHING
        `).catch(() => {});
      }
    }

    return success({ updated: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    await db.execute(sql`DELETE FROM blog_post_tags WHERE post_id = ${id}`).catch(() => {});
    await db.execute(sql`DELETE FROM blog_posts WHERE id = ${id}`);

    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
