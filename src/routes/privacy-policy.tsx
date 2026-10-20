import { createFileRoute } from "@tanstack/react-router";
import Page from "@/components/pages/PrivacyPolicyPage";
import { seoConfig } from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/privacy-policy")({
  head: () => pageHead({ ...seoConfig.privacy, path: "/privacy-policy" }),
  component: Page,
});
