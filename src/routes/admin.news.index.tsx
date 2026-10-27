import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ImageOff, Loader2, Newspaper, Pencil, Plus, Search } from "lucide-react";
import { AdminSubbar, AdminTopbar } from "@/components/admin/AdminShell";
import { ScoreChip } from "@/components/admin/AeoGeoPanel";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { scorePostBothLangs } from "@/lib/aeo-geo";
import { listAllPosts } from "@/functions/posts";

export const Route = createFileRoute("/admin/news/")({
  component: NewsAdminPage,
});

type Filter = "all" | "published" | "draft";

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

function NewsAdminPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [term, setTerm] = useState("");
  const query = useQuery({ queryKey: ["posts", "all"], queryFn: () => listAllPosts() });
  const posts = query.data ?? [];
  const published = posts.filter((p) => p.status === "published").length;

  const needle = term.trim().toLowerCase();
  const visible = posts.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (!needle || `${p.title_vi} ${p.title_en} ${p.slug}`.toLowerCase().includes(needle)),
  );

  const tabs: [Filter, string, number][] = [
    ["all", "Tất cả", posts.length],
    ["published", "Đã đăng", published],
    ["draft", "Nháp", posts.length - published],
  ];

  const newPostButton = (
    <Link to="/admin/news/$id" params={{ id: "new" }} className="admin-btn admin-btn-primary">
      <Plus className="h-4 w-4" /> Viết bài mới
    </Link>
  );

  return (
    <>
      <AdminTopbar
        title="Tin tức"
        tabs={
          <span className="admin-tab" aria-current="page">
            Bài viết
          </span>
        }
      />
      <AdminSubbar
        tabs={tabs.map(([f, label, n]) => (
          <button
            key={f}
            type="button"
            className="admin-subtab"
            aria-current={filter === f ? "page" : undefined}
            onClick={() => setFilter(f)}
          >
            {label}
            <span className="rounded-full bg-admin-canvas px-1.5 text-xs font-medium tabular-nums text-admin-muted">
              {n}
            </span>
          </button>
        ))}
        actions={newPostButton}
      />

      <div className="flex-1 p-4 lg:p-6">
        <div className="admin-card">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <span className="rounded-full bg-admin-blue-soft px-4 py-2 text-sm font-medium text-admin-blue">
              {visible.length} bài viết
            </span>
            <label className="relative ml-auto w-full sm:w-80">
              <span className="sr-only">Tìm bài viết</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-dim" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Tìm theo tiêu đề"
                className="admin-input pl-9"
              />
            </label>
          </div>

          <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-admin-line">
            {query.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-16 text-sm text-admin-dim">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-admin-canvas">
                  <Newspaper className="h-6 w-6 text-admin-dim" />
                </span>
                {posts.length === 0 ? (
                  <>
                    <p className="font-semibold text-admin-ink">Chưa có bài viết nào</p>
                    <p className="mb-3 max-w-sm text-sm text-admin-dim">
                      Viết tin về mùa vụ, giá cà phê hay chuyến hàng mới để khách quốc tế theo dõi.
                    </p>
                    {newPostButton}
                  </>
                ) : (
                  <p className="font-semibold text-admin-ink">Không có bài viết nào khớp bộ lọc</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table w-full min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Tiêu đề tiếng Anh</th>
                      <th>Trạng thái</th>
                      <th title="Điểm AEO/GEO trung bình của từng bản ngôn ngữ">Điểm AEO/GEO</th>
                      <th>Ngày</th>
                      <th className="w-24">
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((post) => {
                      const scores = scorePostBothLangs(post);
                      const edit = () =>
                        void navigate({ to: "/admin/news/$id", params: { id: String(post.id) } });
                      return (
                        <tr key={post.id} onClick={edit} className="cursor-pointer">
                          <td className="py-2">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-admin-canvas">
                                {post.cover_url ? (
                                  <img
                                    src={post.cover_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageOff className="h-4 w-4 text-admin-dim" />
                                )}
                              </span>
                              <Link
                                to="/admin/news/$id"
                                params={{ id: String(post.id) }}
                                className="max-w-[280px] truncate font-medium text-admin-ink"
                              >
                                {post.title_vi}
                              </Link>
                            </div>
                          </td>
                          <td className="max-w-[280px] truncate">{post.title_en}</td>
                          <td>
                            <PostStatusBadge published={post.status === "published"} />
                          </td>
                          <td>
                            <span className="flex items-center gap-1.5">
                              <ScoreChip score={scores.vi.overall} prefix="VI" />
                              <ScoreChip score={scores.en.overall} prefix="EN" />
                            </span>
                          </td>
                          <td className="whitespace-nowrap tabular-nums">
                            {fmtDate(post.published_at ?? post.updated_at)}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Link
                                to="/admin/news/$id"
                                params={{ id: String(post.id) }}
                                aria-label="Sửa bài"
                                title="Sửa bài"
                                className="rounded-md p-2 text-admin-dim hover:bg-admin-canvas hover:text-admin-ink"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <a
                                href={`${import.meta.env.BASE_URL}news/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Xem trên website"
                                title="Xem trên website"
                                className="rounded-md p-2 text-admin-dim hover:bg-admin-canvas hover:text-admin-ink"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
