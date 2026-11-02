import { createFileRoute } from "@tanstack/react-router";
import { buildUrl } from "@/config/seo";
import { ensureSettings } from "@/server/settings";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        await ensureSettings();
        return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${buildUrl("/sitemap.xml")}\n`, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
