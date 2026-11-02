import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { getDb } from "@/server/db";
import { PUBLISHED_SQL, slugify } from "./posts";

export interface Category {
  id: number;
  slug: string;
  name_vi: string;
  name_en: string;
  sort: number;
  /** Published posts in this category. */
  posts: number;
}

/** Public: categories with their published-post counts. */
export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  return db.all<Category>(
    `SELECT c.id, c.slug, c.name_vi, c.name_en, c.sort,
            (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND ${PUBLISHED_SQL.replace(/\bstatus\b/g, "p.status").replace(/\bpublished_at\b/g, "p.published_at")}) AS posts
     FROM categories c ORDER BY c.sort, c.name_vi`,
  );
});

export const saveCategory = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        id: z.number().int().positive().optional(),
        name_vi: z.string().trim().min(1).max(80),
        name_en: z.string().trim().min(1).max(80),
        slug: z.string().trim().max(60).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin("posts");
    const db = await getDb();
    const base = slugify(data.slug || data.name_en) || `category-${Date.now()}`;
    let slug = base;
    for (let n = 2; ; n++) {
      const taken = await db.first<{ id: number }>("SELECT id FROM categories WHERE slug = ?", [
        slug,
      ]);
      if (!taken || taken.id === data.id) break;
      slug = `${base}-${n}`;
    }
    if (data.id) {
      await db.run("UPDATE categories SET name_vi = ?, name_en = ?, slug = ? WHERE id = ?", [
        data.name_vi,
        data.name_en,
        slug,
        data.id,
      ]);
      await audit(user, "category.update", data.name_vi);
      return { id: data.id, slug };
    }
    const max = await db.first<{ n: number | null }>("SELECT MAX(sort) AS n FROM categories");
    const { lastId } = await db.run(
      "INSERT INTO categories (slug, name_vi, name_en, sort, created_at) VALUES (?, ?, ?, ?, ?)",
      [slug, data.name_vi, data.name_en, (max?.n ?? 0) + 1, new Date().toISOString()],
    );
    await audit(user, "category.create", data.name_vi);
    return { id: lastId, slug };
  });

/** Delete a category; its posts become uncategorised. */
export const deleteCategory = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }) => {
    const user = await requireAdmin("posts");
    const db = await getDb();
    const row = await db.first<{ name_vi: string }>("SELECT name_vi FROM categories WHERE id = ?", [
      data.id,
    ]);
    await db.run("UPDATE posts SET category_id = NULL WHERE category_id = ?", [data.id]);
    await db.run("DELETE FROM categories WHERE id = ?", [data.id]);
    await audit(user, "category.delete", row?.name_vi ?? `#${data.id}`);
    return { ok: true as const };
  });
