import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Pencil, Plus } from "lucide-react";
import { listAllPosts } from "@/functions/posts";

export const Route = createFileRoute("/admin/news/")({
  component: NewsAdminPage,
});

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { dateStyle: "medium" }) : "—";

function NewsAdminPage() {
  const query = useQuery({ queryKey: ["posts", "all"], queryFn: () => listAllPosts() });
  const posts = query.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tin tức</h1>
          <p className="text-sm text-gray-500">
            Bài viết song ngữ hiển thị tại trang /news. Bài nháp chỉ admin xem được.
          </p>
        </div>
        <Link
          to="/admin/news/$id"
          params={{ id: "new" }}
          className="btn btn-primary btn-sm self-start"
        >
          <Plus className="h-4 w-4" /> Viết bài mới
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Chưa có bài viết nào.{" "}
            <Link
              to="/admin/news/$id"
              params={{ id: "new" }}
              className="font-semibold text-gray-900 underline"
            >
              Viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {post.cover_url && (
                    <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{post.title_vi}</p>
                  <p className="truncate text-sm text-gray-500">{post.title_en}</p>
                </div>
                <span
                  className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${
                    post.status === "published"
                      ? "bg-green-100 text-green-900"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {post.status === "published" ? "Đã đăng" : "Nháp"}
                </span>
                <span className="hidden w-28 text-right text-sm text-gray-500 md:inline">
                  {fmtDate(post.published_at ?? post.updated_at)}
                </span>
                <a
                  href={`${import.meta.env.BASE_URL}news/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Xem bài"
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link
                  to="/admin/news/$id"
                  params={{ id: String(post.id) }}
                  aria-label="Sửa bài"
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
