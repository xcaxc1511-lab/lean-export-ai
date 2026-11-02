import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/server/db";

/** Public: serve an uploaded image. URLs are /media/<id>.<ext>; files never change. */
export const Route = createFileRoute("/media/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.file.split(".")[0] ?? "";
        if (!/^[a-f0-9]{20}$/.test(id)) return new Response("Not found", { status: 404 });
        const db = await getDb();
        const row = await db.first<{ mime: string; data: ArrayBuffer | Uint8Array | number[] }>(
          "SELECT mime, data FROM media WHERE id = ?",
          [id],
        );
        if (!row) return new Response("Not found", { status: 404 });
        // D1 returns BLOBs as number[]; local SQLite as Uint8Array.
        const body = row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data);
        return new Response(body as Uint8Array<ArrayBuffer>, {
          headers: {
            "Content-Type": row.mime,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
