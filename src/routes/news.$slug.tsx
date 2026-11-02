import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPostBySlug, isLive, parseTags } from "@/functions/posts";
import { businessConfig } from "@/config/business";
import { images } from "@/config/images";
import { buildArticleSchema, buildFaqSchema } from "@/config/seo";
import { extractFaq } from "@/lib/aeo-geo";
import { bodyToMarkdown, isBlockBody, parseBody, renderBlocks } from "@/lib/blocks";
import { pageHead } from "@/lib/seo-head";
import { renderMarkdown } from "@/lib/markdown";
import { useLang } from "@/lib/i18n";
import NotFound from "@/components/pages/NotFound";
import { formatPostDate } from "@/lib/date";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const post = await getPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData: post }) =>
    post
      ? pageHead(
          {
            // Dedicated SEO fields win; otherwise the title and excerpt.
            title: post.seo_title_en || `${post.title_en} | ${businessConfig.businessName}`,
            description: post.seo_desc_en || post.excerpt_en || post.title_en,
            path: `/news/${post.slug}`,
            ...((post.og_image || post.cover_url) && { ogImage: post.og_image || post.cover_url! }),
            noindex: !isLive(post),
          },
          [
            buildArticleSchema({
              slug: post.slug,
              title: post.title_en,
              description: post.seo_desc_en || post.excerpt_en || post.title_en,
              image: post.og_image || post.cover_url,
              inLanguage: [post.body_en && "en", post.body_vi && "vi"].filter((l): l is string =>
                Boolean(l),
              ),
              publishedAt: post.published_at,
              updatedAt: post.updated_at,
              author: post.author,
            }),
            // FAQ from the post's "FAQ / Câu hỏi thường gặp" section (English first).
            buildFaqSchema(
              extractFaq(bodyToMarkdown(post.body_en, "en")).length
                ? extractFaq(bodyToMarkdown(post.body_en, "en"))
                : extractFaq(bodyToMarkdown(post.body_vi, "vi")),
            ),
          ],
        )
      : { meta: [{ title: "Page Not Found" }, { name: "robots", content: "noindex, nofollow" }] },
  notFoundComponent: NotFound,
  component: ArticlePage,
});

const copy = {
  back: { en: "All news", vi: "Tất cả tin tức" },
  by: { en: "By", vi: "Tác giả:" },
  tags: { en: "Tags", vi: "Thẻ" },
  draft: { en: "Draft preview — not visible to visitors", vi: "Bản nháp — khách chưa xem được" },
  ctaTitle: { en: "Interested in Vietnamese coffee?", vi: "Bạn quan tâm cà phê Việt Nam?" },
  ctaBody: {
    en: "Ask for current offers, samples and shipping schedules.",
    vi: "Nhận chào giá mới nhất, mẫu thử và lịch tàu.",
  },
  ctaButton: { en: "Request a Quote", vi: "Yêu cầu báo giá" },
};

function ArticlePage() {
  const post = Route.useLoaderData();
  const { t, lang } = useLang();
  const body = t({ en: post.body_en ?? "", vi: post.body_vi ?? "" });

  return (
    <article className="flex min-h-screen flex-col">
      <header className="relative overflow-hidden bg-brand-ink pb-16 pt-20 text-white md:pb-20 md:pt-28">
        <img
          src={post.cover_url || images.greenBeans}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-brand-ink via-brand-ink/80 to-brand-ink/50" />
        <div className="container relative z-10 mx-auto max-w-4xl px-4">
          <Link
            to="/news"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> {t(copy.back)}
          </Link>
          {!isLive(post) && (
            <p className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              {t(copy.draft)}
            </p>
          )}
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            {post.category_slug && (
              <Link
                to="/news"
                search={{ category: post.category_slug }}
                className="hover:underline"
              >
                {t({ en: post.category_en ?? "", vi: post.category_vi ?? "" })}
              </Link>
            )}
            {post.category_slug && " · "}
            {formatPostDate(post.published_at ?? post.updated_at, lang)}
          </p>
          {post.author && (
            <p className="mb-4 text-sm text-gray-300">
              {t(copy.by)} <span className="font-semibold text-white">{post.author.name}</span>
              {post.author.title ? `, ${post.author.title}` : ""}
            </p>
          )}
          <h1 className="mb-5 text-3xl font-bold leading-tight md:text-5xl">
            {t({ en: post.title_en, vi: post.title_vi })}
          </h1>
          {(post.excerpt_en || post.excerpt_vi) && (
            <p className="max-w-3xl text-lg text-gray-300 md:text-xl">
              {t({ en: post.excerpt_en ?? "", vi: post.excerpt_vi ?? "" })}
            </p>
          )}
        </div>
      </header>

      <div className="bg-white py-14 md:py-20">
        <div
          className="container mx-auto max-w-3xl px-4 text-lg text-gray-700"
          dangerouslySetInnerHTML={{
            __html: isBlockBody(body) ? renderBlocks(parseBody(body)) : renderMarkdown(body),
          }}
        />
      </div>
      {parseTags(post.tags).length > 0 && (
        <div className="bg-white pb-14">
          <div className="container mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4">
            <span className="text-sm font-semibold text-gray-500">{t(copy.tags)}:</span>
            {parseTags(post.tags).map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto flex max-w-4xl flex-col items-start gap-6 rounded-2xl bg-brand-ink px-8 py-10 text-white md:flex-row md:items-center md:justify-between md:px-12">
          <div>
            <h2 className="mb-2 text-2xl font-bold">{t(copy.ctaTitle)}</h2>
            <p className="text-gray-300">{t(copy.ctaBody)}</p>
          </div>
          <Link to="/get-free-quote" className="btn btn-primary shrink-0">
            {t(copy.ctaButton)}
            <span className="btn-arrow">
              <ArrowRight />
            </span>
          </Link>
        </div>
      </section>
    </article>
  );
}
