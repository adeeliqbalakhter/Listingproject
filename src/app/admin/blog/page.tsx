"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  Archive,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  Save,
  ArrowLeft,
  ExternalLink,
  Calendar,
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: "draft" | "published" | "archived";
  featuredImage: string | null;
  authorName: string | null;
  categoryName: string | null;
  categoryId: string | null;
  viewCount: number;
  readingTime: number | null;
  publishedAt: string | null;
  createdAt: string;
}

interface Category { id: string; name: string; slug: string }
interface Tag { id: string; name: string; slug: string }

interface PostDetail extends BlogPost {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: Tag[];
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-600",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Clock,
  published: CheckCircle,
  archived: Archive,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<PostDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "",
    status: "draft" as "draft" | "published" | "archived",
    featuredImage: "",
    metaTitle: "",
    metaDescription: "",
  });

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(pagination.page) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/blog?${params}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const json = await res.json();
      setPosts(json.data.posts);
      setCategories(json.data.categories);
      setTags(json.data.tags);
      setPagination(json.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function openNewPost() {
    setEditingPost(null);
    setForm({ title: "", content: "", excerpt: "", categoryId: "", status: "draft", featuredImage: "", metaTitle: "", metaDescription: "" });
    setSaveMessage(null);
    setEditing(true);
  }

  async function openEditPost(id: string) {
    try {
      const res = await fetch(`/api/admin/blog/${id}`);
      if (!res.ok) throw new Error("Failed to load post");
      const json = await res.json();
      const p = json.data;
      setEditingPost(p);
      setForm({
        title: p.title || "",
        content: p.content || "",
        excerpt: p.excerpt || "",
        categoryId: p.categoryId || "",
        status: p.status || "draft",
        featuredImage: p.featuredImage || "",
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
      });
      setSaveMessage(null);
      setEditing(true);
    } catch {
      alert("Failed to load post for editing.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        excerpt: form.excerpt || null,
        categoryId: form.categoryId || null,
        status: form.status,
        featuredImage: form.featuredImage || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
      };

      let res: Response;
      if (editingPost) {
        res = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setSaveMessage({ type: "success", text: editingPost ? "Post updated." : "Post created." });
        setTimeout(() => {
          setEditing(false);
          fetchPosts();
        }, 800);
      } else {
        const json = await res.json().catch(() => ({}));
        setSaveMessage({ type: "error", text: json.error || "Failed to save." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPosts();
      } else {
        alert("Failed to delete post.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(null);
    }
  }

  async function quickStatusChange(id: string, newStatus: string) {
    try {
      await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPosts();
    } catch { /* ignore */ }
  }

  // ─── EDITOR VIEW ───
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(false)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Posts
          </button>
          <div className="flex items-center gap-3">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button onClick={handleSave} disabled={saving || !form.title || !form.content}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {saveMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {saveMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter post title..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief summary..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your blog post content here... (supports plain text)"
                  rows={16}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-y font-mono" />
                <p className="text-xs text-gray-400 mt-1">
                  {form.content.split(/\s+/).filter(Boolean).length} words &bull; ~{Math.max(1, Math.round(form.content.split(/\s+/).filter(Boolean).length / 200))} min read
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-navy">Settings</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Featured Image URL</label>
                <input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
                {form.featuredImage && (
                  <img src={form.featuredImage} alt="" className="mt-2 rounded-lg w-full h-32 object-cover border border-gray-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-navy">SEO</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meta Title</label>
                <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="SEO title (max 70 chars)"
                  maxLength={70}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
                <p className="text-xs text-gray-400 mt-0.5">{form.metaTitle.length}/70</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Meta Description</label>
                <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="SEO description (max 160 chars)"
                  maxLength={160}
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none" />
                <p className="text-xs text-gray-400 mt-0.5">{form.metaDescription.length}/160</p>
              </div>
            </div>
            {editingPost && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-navy mb-2">Info</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Views: {editingPost.viewCount.toLocaleString()}</p>
                  <p>Created: {new Date(editingPost.createdAt).toLocaleDateString()}</p>
                  {editingPost.publishedAt && <p>Published: {new Date(editingPost.publishedAt).toLocaleDateString()}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ───
  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchPosts} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Blog Management</h1>
          <p className="mt-1 text-gray-500">Create, edit, and manage blog posts.</p>
        </div>
        <button onClick={openNewPost}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {["all", "draft", "published", "archived"].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === s ? "bg-white text-navy shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No blog posts found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first post to get started.</p>
          <button onClick={openNewPost}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors">
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {posts.map((post) => {
            const StatusIcon = STATUS_ICONS[post.status] || Clock;
            return (
              <div key={post.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                {/* Thumbnail */}
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt="" className="w-20 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-300" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-navy text-sm truncate">{post.title}</h3>
                      {post.excerpt && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.excerpt}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLES[post.status]}`}>
                      <StatusIcon className="w-3 h-3" /> {post.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {post.authorName && <span>{post.authorName}</span>}
                    {post.categoryName && <span className="bg-gray-100 px-2 py-0.5 rounded">{post.categoryName}</span>}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.viewCount}</span>
                    {post.readingTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readingTime} min</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {post.status === "draft" && (
                    <button onClick={() => quickStatusChange(post.id, "published")}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Publish">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {post.status === "published" && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => openEditPost(post.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    {deleting === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {posts.length} of {pagination.total} posts
          </p>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setPagination(p => ({ ...p, page }))}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  pagination.page === page ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
