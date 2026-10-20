import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/pages/ContactPage";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/contact")({
  head: () => pageHead({ ...seoConfig.contact, path: "/contact" }),
  component: Page,
});
