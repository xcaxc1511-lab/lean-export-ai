import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb } from "@/server/db";
import { isAdmin, requireAdmin } from "@/server/auth";

export interface Post {
  id: number;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  body_en: string | null;
  body_vi: string | null;
  cover_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PostSummary = Omit<Post, "body_en" | "body_vi">;

const SUMMARY_COLS =
  "id, slug, title_en, title_vi, excerpt_en, excerpt_vi, cover_url, status, published_at, created_at, updated_at";

/** URL-safe slug, stripping Vietnamese diacritics ("Cà phê" → "ca-phe"). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Public: published posts, newest first. */
export const listPublishedPosts = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).optional().default(24) }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    return db.all<PostSummary>(
      `SELECT ${SUMMARY_COLS} FROM posts WHERE status = 'published'
       ORDER BY published_at DESC LIMIT ?`,
      [data.limit],
    );
  });

/** Public: one published post by slug (admins can also preview drafts). */
export const getPostBySlug = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const db = await getDb();
    const post = await db.first<Post>("SELECT * FROM posts WHERE slug = ?", [data.slug]);
    if (!post) return null;
    if (post.status !== "published" && !(await isAdmin())) return null;
    return post;
  });

/** Admin: all posts. */
export const listAllPosts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  // Full rows: the admin list scores each post's AEO/GEO from its body.
  return db.all<Post>("SELECT * FROM posts ORDER BY updated_at DESC");
});

/** Admin: one post for editing. */
export const getPostById = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    return db.first<Post>("SELECT * FROM posts WHERE id = ?", [data.id]);
  });

const postInput = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().trim().max(80).optional().default(""),
  title_en: z.string().trim().min(1).max(200),
  title_vi: z.string().trim().min(1).max(200),
  excerpt_en: z.string().trim().max(500).optional().default(""),
  excerpt_vi: z.string().trim().max(500).optional().default(""),
  body_en: z.string().max(50_000).optional().default(""),
  body_vi: z.string().max(50_000).optional().default(""),
  cover_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "Invalid image URL")
    .optional()
    .default(""),
  status: z.enum(["draft", "published"]),
});

export type PostInput = z.input<typeof postInput>;

/** Admin: create or update a post. Returns the saved id and slug. */
export const savePost = createServerFn({ method: "POST" })
  .validator((data: unknown) => postInput.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const now = new Date().toISOString();

    // Unique slug: from the given slug or the English title, suffixed if taken.
    const base = slugify(data.slug || data.title_en) || `post-${Date.now()}`;
    let slug = base;
    for (let n = 2; ; n++) {
      const taken = await db.first<{ id: number }>("SELECT id FROM posts WHERE slug = ?", [slug]);
      if (!taken || taken.id === data.id) break;
      slug = `${base}-${n}`;
    }

    const existing = data.id
      ? await db.first<Post>("SELECT * FROM posts WHERE id = ?", [data.id])
      : null;
    if (data.id && !existing) throw new Error("NOT_FOUND");

    // First publish stamps the date; later edits keep it.
    const publishedAt =
      data.status === "published"
        ? (existing?.published_at ?? now)
        : (existing?.published_at ?? null);

    const values = [
      slug,
      data.title_en,
      data.title_vi,
      data.excerpt_en || null,
      data.excerpt_vi || null,
      data.body_en || null,
      data.body_vi || null,
      data.cover_url || null,
      data.status,
      publishedAt,
      now,
    ];

    if (existing) {
      await db.run(
        `UPDATE posts SET slug = ?, title_en = ?, title_vi = ?, excerpt_en = ?, excerpt_vi = ?,
           body_en = ?, body_vi = ?, cover_url = ?, status = ?, published_at = ?, updated_at = ?
         WHERE id = ?`,
        [...values, existing.id],
      );
      return { id: existing.id, slug };
    }
    const { lastId } = await db.run(
      `INSERT INTO posts (slug, title_en, title_vi, excerpt_en, excerpt_vi, body_en, body_vi,
         cover_url, status, published_at, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, now],
    );
    return { id: lastId, slug };
  });

/** Admin: delete a post. */
export const deletePost = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    await db.run("DELETE FROM posts WHERE id = ?", [data.id]);
    return { ok: true as const };
  });
