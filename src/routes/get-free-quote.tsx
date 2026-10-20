import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/pages/GetFreeQuotePage";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/get-free-quote")({
  head: () => pageHead({ ...seoConfig.quote, path: "/get-free-quote" }),
  component: Page,
});
