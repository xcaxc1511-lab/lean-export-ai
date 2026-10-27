import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ImageOff, Loader2, Newspaper, Pencil, Plus } from "lucide-react";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { listAllPosts } from "@/functions/posts";

export const Route = createFileRoute("/admin/news/")({
  component: NewsAdminPage,
});

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { dateStyle: "medium" }) : "—";

function NewsAdminPage() {
  const query = useQuery({ queryKey: ["posts", "all"], queryFn: () => listAllPosts() });
  const posts = query.data ?? [];
  const published = posts.filter((p) => p.status === "published").length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[2rem] font-bold leading-tight text-admin-ink">Tin tức</h1>
          <p className="mt-1 text-admin-muted">
            {posts.length > 0
              ? `${published} bài đã đăng, ${posts.length - published} bài nháp. Bài nháp chỉ admin xem được.`
              : "Bài viết song ngữ hiển thị tại trang Tin tức của website."}
          </p>
        </div>
        <Link
          to="/admin/news/$id"
          params={{ id: "new" }}
          className="btn btn-primary btn-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Viết bài mới
        </Link>
      </div>

      <div className="admin-panel overflow-hidden">
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-admin-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Newspaper className="mb-2 h-8 w-8 text-admin-dim" />
            <p className="font-bold text-admin-ink">Chưa có bài viết nào</p>
            <p className="mb-3 max-w-sm text-sm text-admin-muted">
              Viết tin về mùa vụ, giá cà phê hay chuyến hàng mới để khách quốc tế theo dõi.
            </p>
            <Link to="/admin/news/$id" params={{ id: "new" }} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" /> Viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-admin-line">
            {posts.map((post) => (
              <li
                key={post.id}
                className="group relative flex items-center gap-5 px-5 py-4 hover:bg-admin-row sm:px-6"
              >
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-admin-row">
                  {post.cover_url ? (
                    <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-admin-dim" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/admin/news/$id"
                    params={{ id: String(post.id) }}
                    className="block truncate font-bold text-admin-ink after:absolute after:inset-0"
                  >
                    {post.title_vi}
                  </Link>
                  <p className="truncate text-sm text-admin-muted">{post.title_en}</p>
                </div>
                <span className="hidden sm:inline">
                  <PostStatusBadge published={post.status === "published"} />
                </span>
                <span className="hidden w-28 text-right text-sm tabular-nums text-admin-muted md:inline">
                  {fmtDate(post.published_at ?? post.updated_at)}
                </span>
                <a
                  href={`${import.meta.env.BASE_URL}news/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Xem bài trên website"
                  title="Xem bài trên website"
                  className="relative rounded-full p-2 text-admin-muted hover:bg-white hover:text-admin-ink"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Pencil
                  className="h-4 w-4 text-admin-dim group-hover:text-admin-ink"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
