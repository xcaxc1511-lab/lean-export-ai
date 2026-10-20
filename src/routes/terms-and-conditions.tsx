import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/pages/TermsAndConditionsPage";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => pageHead({ ...seoConfig.terms, path: "/terms-and-conditions" }),
  component: Page,
});
