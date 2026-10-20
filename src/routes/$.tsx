import { createFileRoute, notFound } from "@tanstack/react-router";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";
import NotFound from "@/components/pages/NotFound";

export const Route = createFileRoute("/$")({
  loader: () => {
    throw notFound();
  },
  head: () => pageHead({ ...seoConfig.notFound, noindex: true }),
  notFoundComponent: NotFound,
});
