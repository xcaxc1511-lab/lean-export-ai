import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/components/pages/NotFound";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

/**
 * Static copy of the not-found page. The GitHub Pages build prerenders it to
 * /404.html, which Pages serves for any unknown URL.
 */
export const Route = createFileRoute("/404")({
  head: () => pageHead({ ...seoConfig.notFound, noindex: true }),
  component: NotFound,
});
