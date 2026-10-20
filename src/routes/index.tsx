import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/pages/Index";
import { seoConfig, buildLocalBusinessSchema, buildWebSiteSchema } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({ ...seoConfig.homepage, path: "/" }, [
      buildLocalBusinessSchema(),
      buildWebSiteSchema(),
    ]),
  component: Page,
});
