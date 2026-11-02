import { createFileRoute } from "@tanstack/react-router";
import { buildSitemapXml } from "@/config/seo";
import { getDb } from "@/server/db";
import { ensureSettings } from "@/server/settings";
import { PUBLISHED_SQL } from "@/functions/posts";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        await ensureSettings();
        const db = await getDb();
        // Every published article, so search engines find posts without crawling /news.
        const posts = await db.all<{ slug: string; updated_at: string }>(
          `SELECT slug, updated_at FROM posts WHERE ${PUBLISHED_SQL} ORDER BY published_at DESC`,
        );
        const xml = buildSitemapXml(
          posts.map((p) => ({ path: `/news/${p.slug}`, lastmod: p.updated_at.slice(0, 10) })),
        );
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
