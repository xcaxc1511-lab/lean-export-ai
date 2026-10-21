import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Newspaper } from "lucide-react";
import { HeroMedia } from "@/components/HeroMedia";
import { listPublishedPosts } from "@/functions/posts";
import { images } from "@/config/images";
import { businessConfig } from "@/config/business";
import { pageHead } from "@/lib/seo-head";
import { useLang } from "@/lib/i18n";
import { formatPostDate } from "@/lib/date";

export const Route = createFileRoute("/news/")({
  loader: () => listPublishedPosts({ data: {} }).catch(() => []),
  head: () =>
    pageHead({
      title: `News | ${businessConfig.businessName}`,
      description: `Harvest updates, market notes and company news from ${businessConfig.businessName}, a Vietnamese coffee exporter.`,
      path: "/news",
    }),
  component: NewsPage,
});

const copy = {
  kicker: { en: "News", vi: "Tin tức" },
  title: { en: "News & Market Updates", vi: "Tin tức & cập nhật thị trường" },
  intro: {
    en: "Harvest reports, market notes and what's happening at our farms and factory.",
    vi: "Báo cáo mùa vụ, nhận định thị trường và hoạt động tại vườn, nhà máy của chúng tôi.",
  },
  empty: {
    en: "No articles yet — check back soon.",
    vi: "Chưa có bài viết — hãy quay lại sau nhé.",
  },
  read: { en: "Read article", vi: "Đọc bài" },
};

function NewsPage() {
  const posts = Route.useLoaderData();
  const { t, lang } = useLang();

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-brand-ink py-24 text-white md:py-28">
        <HeroMedia imageUrl={images.beansInSack} />
        <div className="absolute inset-0 z-10 bg-linear-to-r from-brand-ink via-brand-ink/85 to-brand-ink/50" />
        <div className="container relative z-20 mx-auto px-4">
          <p className="mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
            <span className="h-0.5 w-8 rounded-full bg-primary" />
            {t(copy.kicker)}
          </p>
          <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            {t(copy.title)}
          </h1>
          <p className="max-w-2xl text-lg text-gray-300 md:text-xl">{t(copy.intro)}</p>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center text-gray-500">
              <Newspaper className="h-12 w-12 text-gray-300" />
              <p className="text-lg">{t(copy.empty)}</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to="/news/$slug"
                  params={{ slug: post.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-brand-ink/5"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-200">
                    <img
                      src={post.cover_url || images.greenBeans}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {formatPostDate(post.published_at, lang)}
                    </p>
                    <h2 className="mb-3 text-xl font-bold leading-snug text-gray-900">
                      {t({ en: post.title_en, vi: post.title_vi })}
                    </h2>
                    <p className="mb-6 line-clamp-3 text-gray-600">
                      {t({ en: post.excerpt_en ?? "", vi: post.excerpt_vi ?? "" })}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900 group-hover:text-primary">
                      {t(copy.read)} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
