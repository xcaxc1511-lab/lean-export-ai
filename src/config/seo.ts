import { businessConfig } from "./business";
import { servicesConfig } from "./services";
import { areasConfig, type AreaConfig } from "./areas";
import type { ServiceConfig } from "./services";
import { en, type L } from "@/lib/i18n";

/**
 * Centralized SEO configuration.
 *
 * The production domain is the single source of truth for all canonical / OG
 * URLs. Update `businessConfig.website` when cloning for a new client and the
 * canonical URLs, sitemap and robots.txt will follow automatically.
 */

export interface SeoPageMeta {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/services/roof-repair". Omit for homepage. */
  path?: string;
  /** When true, search engines are asked not to index the page. Default false. */
  noindex?: boolean;
  /** Optional override for the Open Graph / social preview image. */
  ogImage?: string;
}

const SITE_URL = (businessConfig.website || "").replace(/\/+$/, "");

/**
 * Default social preview image for the whole site.
 * Driven by config so no previous client's image can ship in the template.
 */
export const defaultOgImage = businessConfig.ogImageUrl || "/og-image.png";

export const seoConfig = {
  siteUrl: SITE_URL,
  defaultImage: defaultOgImage,
  homepage: {
    title: `${businessConfig.businessName} | Vietnamese Coffee Exporter — Robusta, Arabica & OEM`,
    description: `${businessConfig.businessName} exports traceable Vietnamese coffee — Robusta and Arabica green beans, roasted, instant and private label — from ${businessConfig.city}, ${businessConfig.state} to buyers worldwide.`,
  },
  about: {
    title: `About Us | ${businessConfig.businessName}`,
    description: `Learn about ${businessConfig.businessName}, a Vietnamese coffee exporter rooted in ${businessConfig.city}'s Central Highlands since ${businessConfig.establishedYear}.`,
  },
  contact: {
    title: `Contact Us | ${businessConfig.businessName}`,
    description: `Contact the ${businessConfig.businessName} export team for samples, specifications and shipping schedules.`,
  },
  quote: {
    title: `Request a Quote | ${businessConfig.businessName}`,
    description: `Request FOB or CIF pricing and samples of Vietnamese coffee from ${businessConfig.businessName}.`,
  },
  terms: {
    title: `Terms of Service | ${businessConfig.businessName}`,
    description: `Read the Terms of Service for ${businessConfig.businessName} SMS messaging services, including consent, opt-out instructions, data rates, and contact information.`,
  },
  privacy: {
    title: `Privacy Policy | ${businessConfig.businessName}`,
    description: `Read the Privacy Policy for ${businessConfig.businessName}, including how personal data may be collected, used, shared, retained, and protected.`,
  },
  notFound: {
    title: `Page Not Found | ${businessConfig.businessName}`,
    description: `The page you were looking for could not be found.`,
  },
};

/** Build an absolute URL from a path relative to the site root. */
export function buildUrl(path?: string): string {
  if (path && /^https?:\/\//i.test(path)) return path;
  if (!path || path === "/") return SITE_URL || "/";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return SITE_URL ? `${SITE_URL}${clean}` : clean;
}

/**
 * Build the full set of SEO meta for a page. Public pages default to
 * "index, follow" unless explicitly overridden with `noindex: true`.
 */
export function buildPageMeta(meta: SeoPageMeta) {
  const url = buildUrl(meta.path);
  const image = meta.ogImage
    ? meta.ogImage.startsWith("http")
      ? meta.ogImage
      : buildUrl(meta.ogImage)
    : buildUrl(defaultOgImage);
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow";
  return {
    title: meta.title,
    description: meta.description,
    canonical: url,
    robots,
    og: {
      title: meta.title,
      description: meta.description,
      url,
      image,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      image,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Structured data (JSON-LD)                                          */
/* ------------------------------------------------------------------ */

/**
 * LocalBusiness / Organization schema generated from config.
 * Does NOT fabricate reviews, ratings, prices or coordinates — those are only
 * emitted when real values are provided in businessConfig.
 */
export function buildLocalBusinessSchema() {
  if (!businessConfig.publishBusinessSchema) return null;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessConfig.businessName,
    url: SITE_URL,
    telephone: businessConfig.phone,
    email: businessConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: businessConfig.address,
      addressLocality: businessConfig.city,
      addressRegion: businessConfig.state,
      postalCode: businessConfig.zip,
      addressCountry: "VN",
    },
  };

  if (businessConfig.serviceRadius) {
    schema["areaServed"] =
      `${businessConfig.city}, ${businessConfig.state} and surrounding areas (within ${businessConfig.serviceRadius})`;
  }

  if (businessConfig.businessHours?.length) {
    schema["openingHoursSpecification"] = businessConfig.businessHours
      .filter((h) => en(h.hours).toLowerCase() !== "closed")
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: en(h.days),
        description: en(h.hours),
      }));
  }

  if (businessConfig.socialLinks) {
    const sameAs = [
      businessConfig.socialLinks.facebook,
      businessConfig.socialLinks.instagram,
      businessConfig.socialLinks.linkedin,
      businessConfig.socialLinks.twitter,
      businessConfig.googleBusinessProfileUrl,
    ].filter(Boolean);
    if (sameAs.length) schema["sameAs"] = sameAs;
  } else if (businessConfig.googleBusinessProfileUrl) {
    schema["sameAs"] = [businessConfig.googleBusinessProfileUrl];
  }

  return schema;
}

/** WebSite schema (sitelinks search box friendly). */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: businessConfig.businessName,
    url: SITE_URL,
  };
}

/** Service schema for an individual service page. */
export function buildServiceSchema(serviceSlug: string) {
  const service = servicesConfig.find((s) => s.slug === serviceSlug);
  if (!service || !businessConfig.publishBusinessSchema) return null;
  return {
    "@context": "https://schema.org",
    "@type": service.schemaServiceType || "Service",
    name: en(service.name),
    description: en(service.shortDescription),
    provider: {
      "@type": "LocalBusiness",
      name: businessConfig.businessName,
      url: SITE_URL,
      telephone: businessConfig.phone,
    },
    areaServed: areasConfig.map((area) => en(area.name)),
    url: buildUrl(`/services/${service.slug}`),
  };
}

/**
 * Resolve the SEO title for a service page.
 * Falls back to a config-driven title so cloning never leaves a stale
 * "Your Business Name" string in the page <title>.
 */
export function getServiceSeoTitle(service: ServiceConfig): string {
  if (service.seoTitle && !service.seoTitle.includes("Your Business Name")) {
    return service.seoTitle;
  }
  return `${en(service.name)} | ${businessConfig.businessName}`;
}

/**
 * Resolve the SEO description for a service page.
 * Falls back to a config-driven description when the placeholder text is
 * still present.
 */
export function getServiceSeoDescription(service: ServiceConfig): string {
  if (service.seoDescription && !service.seoDescription.includes("Your Business Name")) {
    return service.seoDescription;
  }
  return `${en(service.shortDescription)} Request a quote from ${businessConfig.businessName}.`;
}

/** Resolve the SEO title for an area page (config-driven fallback). */
export function getAreaSeoTitle(area: AreaConfig): string {
  if (area.seoTitle && !area.seoTitle.includes("Your Business Name")) {
    return area.seoTitle;
  }
  return `${businessConfig.primaryServiceCategory} to ${en(area.name)} | ${businessConfig.businessName}`;
}

/** Resolve the SEO description for an area page (config-driven fallback). */
export function getAreaSeoDescription(area: AreaConfig): string {
  if (area.seoDescription && !area.seoDescription.includes("Your Business Name")) {
    return area.seoDescription;
  }
  return `${en(area.heroDescription)} Contact ${businessConfig.businessName} for a quote.`;
}

/** FAQPage schema for any page that has FAQs. */
export function buildFaqSchema(faqs: { question: L | string; answer: L | string }[]) {
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: en(faq.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: en(faq.answer),
      },
    })),
  };
}

/** Article schema for a news post — helps answer engines attribute and date it. */
export function buildArticleSchema(post: {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  inLanguage: string[];
  publishedAt: string | null;
  updatedAt: string;
}) {
  const organization = {
    "@type": "Organization",
    name: businessConfig.businessName,
    url: SITE_URL || undefined,
    // Colour logo: the header one is white and invisible on light backgrounds.
    logo: buildUrl("/lean-export-logo.png"),
  };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.image ? [buildUrl(post.image)] : undefined,
    inLanguage: post.inLanguage,
    datePublished: post.publishedAt ?? post.updatedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: buildUrl(`/news/${post.slug}`),
    author: organization,
    publisher: organization,
  };
}

/** BreadcrumbList schema from an ordered list of label/path pairs. */
export function buildBreadcrumbSchema(crumbs: { name: string; path: string }[]) {
  if (!crumbs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: buildUrl(c.path),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Sitemap generation                                                 */
/* ------------------------------------------------------------------ */

export interface SitemapEntry {
  path: string;
  /** Optional last-modified ISO date. */
  lastmod?: string;
}

/**
 * Returns the list of public, indexable routes generated from config.
 * Intentionally noindexed pages are excluded.
 */
export function buildSitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { path: "/" },
    { path: "/about" },
    { path: "/contact" },
    { path: "/get-free-quote" },
    { path: "/news" },
  ];

  servicesConfig.forEach((service) => {
    entries.push({ path: `/services/${service.slug}` });
  });

  areasConfig.forEach((area) => {
    entries.push({ path: `/areas/${area.slug}` });
  });

  return entries;
}

export function buildSitemapXml(): string {
  const entries = buildSitemapEntries();
  const urls = entries
    .map((e) => {
      const loc = buildUrl(e.path).replace(/&/g, "&amp;");
      const lastmod = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}
