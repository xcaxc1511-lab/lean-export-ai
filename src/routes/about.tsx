import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/pages/AboutPage";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/about")({
  head: () => pageHead({ ...seoConfig.about, path: "/about" }),
  component: Page,
});
