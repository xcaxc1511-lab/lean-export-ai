import { buildPageMeta, type SeoPageMeta } from "@/config/seo";

/** Native TanStack head data, generated on the server and on navigation. */
export function pageHead(meta: SeoPageMeta, schemas: (Record<string, unknown> | null)[] = []) {
  const page = buildPageMeta(meta);
  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      { name: "robots", content: page.robots },
      { property: "og:title", content: page.og.title },
      { property: "og:description", content: page.og.description },
      { property: "og:url", content: page.og.url },
      { property: "og:image", content: page.og.image },
      { property: "og:type", content: page.og.type },
      { name: "twitter:card", content: page.twitter.card },
      { name: "twitter:title", content: page.twitter.title },
      { name: "twitter:description", content: page.twitter.description },
      { name: "twitter:image", content: page.twitter.image },
    ],
    links: meta.noindex ? [] : [{ rel: "canonical", href: page.canonical }],
    scripts: schemas
      .filter((schema) => schema !== null)
      .map((schema) => ({
        type: "application/ld+json",
        children: JSON.stringify(schema).replace(/</g, "\\u003c"),
      })),
  };
}
