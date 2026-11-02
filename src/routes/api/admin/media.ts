import { createFileRoute } from "@tanstack/react-router";
import { currentUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { getDb } from "@/server/db";
import { canAccess } from "@/lib/roles";

/** Raster images only — SVG can carry scripts, so it is never accepted. */
const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png", "image/gif"]);
/** The browser resizes to ≤1920 px WebP first, so real uploads stay well below this. */
const MAX_BYTES = 1_800_000;

/**
 * Admin image upload. The body is the raw image; metadata comes in the query
 * string (?filename=&width=&height=&alt=). Stored in D1 and served from /media/<id>.
 */
export const Route = createFileRoute("/api/admin/media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await currentUser();
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
        if (!canAccess(user.role, "media"))
          return Response.json({ error: "forbidden" }, { status: 403 });

        const mime = (request.headers.get("content-type") ?? "")
          .split(";")[0]!
          .trim()
          .toLowerCase();
        if (!ALLOWED.has(mime)) return Response.json({ error: "type" }, { status: 415 });
        const data = new Uint8Array(await request.arrayBuffer());
        if (!data.byteLength) return Response.json({ error: "empty" }, { status: 400 });
        if (data.byteLength > MAX_BYTES)
          return Response.json({ error: "too_large" }, { status: 413 });

        const params = new URL(request.url).searchParams;
        const int = (v: string | null) => (v && /^\d{1,5}$/.test(v) ? Number(v) : null);
        const filename = (params.get("filename") ?? "image").slice(0, 160);
        const alt = (params.get("alt") ?? "").slice(0, 300);
        const id = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
        const ext = mime.split("/")[1]!.replace("jpeg", "jpg");

        const db = await getDb();
        await db.run(
          `INSERT INTO media (id, filename, mime, size, width, height, alt, data, uploaded_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            filename,
            mime,
            data.byteLength,
            int(params.get("width")),
            int(params.get("height")),
            alt || null,
            data,
            user.id,
            new Date().toISOString(),
          ],
        );
        await audit(user, "media.upload", filename, `${Math.round(data.byteLength / 1024)} KB`);
        return Response.json({ id, url: `/media/${id}.${ext}` });
      },
    },
  },
});
