import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { getDb } from "@/server/db";

export interface MediaItem {
  id: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  created_at: string;
  url: string;
}

const mediaUrl = (id: string, mime: string) =>
  `/media/${id}.${mime.split("/")[1]!.replace("jpeg", "jpg")}`;

export const listMedia = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ q: z.string().trim().max(200).optional().default("") }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin("media");
    const db = await getDb();
    const like = `%${data.q}%`;
    const rows = await db.all<Omit<MediaItem, "url">>(
      `SELECT id, filename, mime, size, width, height, alt, created_at FROM media
       ${data.q ? "WHERE filename LIKE ? OR alt LIKE ?" : ""}
       ORDER BY created_at DESC LIMIT 300`,
      data.q ? [like, like] : [],
    );
    const total = await db.first<{ n: number; bytes: number }>(
      "SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM media",
    );
    return {
      items: rows.map((r) => ({ ...r, url: mediaUrl(r.id, r.mime) })) as MediaItem[],
      count: total?.n ?? 0,
      bytes: total?.bytes ?? 0,
    };
  });

export const updateMediaAlt = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ id: z.string().regex(/^[a-f0-9]{20}$/), alt: z.string().trim().max(300) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin("media");
    const db = await getDb();
    await db.run("UPDATE media SET alt = ? WHERE id = ?", [data.alt || null, data.id]);
    return { ok: true as const };
  });

/** Delete an image. Refuses (with the post count) when posts still use it, unless forced. */
export const deleteMedia = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().regex(/^[a-f0-9]{20}$/),
        force: z.boolean().optional().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin("media");
    const db = await getDb();
    const like = `%/media/${data.id}%`;
    const used = await db.all<{ title_vi: string }>(
      "SELECT title_vi FROM posts WHERE body_vi LIKE ? OR body_en LIKE ? OR cover_url LIKE ? LIMIT 20",
      [like, like, like],
    );
    if (used.length && !data.force)
      return { ok: false as const, usedIn: used.map((p) => p.title_vi) };
    const row = await db.first<{ filename: string }>("SELECT filename FROM media WHERE id = ?", [
      data.id,
    ]);
    await db.run("DELETE FROM media WHERE id = ?", [data.id]);
    await audit(user, "media.delete", row?.filename ?? data.id);
    return { ok: true as const };
  });
