import { useState, type ReactNode } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, ExternalLink, Loader2, PenLine, Trash2 } from "lucide-react";
import { deletePost, getPostById, savePost, type Post, type PostInput } from "@/functions/posts";
import { AdminSubbar, AdminTopbar } from "@/components/admin/AdminShell";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/admin/news/$id")({
  component: PostEditorPage,
});

const newsTab = (
  <Link to="/admin/news" className="admin-tab" aria-current="page">
    Bài viết
  </Link>
);

function PostEditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const numericId = Number(id);
  const query = useQuery({
    queryKey: ["posts", numericId],
    queryFn: () => getPostById({ data: { id: numericId } }),
    enabled: !isNew && Number.isInteger(numericId),
  });

  if (!isNew && (query.isLoading || !query.data)) {
    return (
      <>
        <AdminTopbar title="Tin tức" tabs={newsTab} />
        <div className="flex flex-1 items-center justify-center gap-2 p-16 text-sm text-admin-dim">
          {query.isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
            </>
          ) : (
            <span>
              Không tìm thấy bài viết. Có thể bài đã bị xóa.{" "}
              <Link to="/admin/news" className="font-medium text-admin-blue hover:underline">
                Về danh sách bài viết
              </Link>
            </span>
          )}
        </div>
      </>
    );
  }
  return <PostEditor key={id} post={isNew ? null : query.data!} />;
}

type Lang = "vi" | "en";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="admin-label">
      {label}
      {children}
      {hint && <span className="admin-hint">{hint}</span>}
    </label>
  );
}

function PostEditor({ post }: { post: Post | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Lang>("vi");
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<PostInput>({
    id: post?.id,
    slug: post?.slug ?? "",
    title_en: post?.title_en ?? "",
    title_vi: post?.title_vi ?? "",
    excerpt_en: post?.excerpt_en ?? "",
    excerpt_vi: post?.excerpt_vi ?? "",
    body_en: post?.body_en ?? "",
    body_vi: post?.body_vi ?? "",
    cover_url: post?.cover_url ?? "",
    status: post?.status ?? "draft",
  });
  const set = (key: keyof PostInput, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: (status: "draft" | "published") => savePost({ data: { ...form, status } }),
    onSuccess: async (res, status) => {
      setForm((f) => ({ ...f, id: res.id, slug: res.slug, status }));
      await qc.invalidateQueries({ queryKey: ["posts"] });
      if (!post)
        await navigate({ to: "/admin/news/$id", params: { id: String(res.id) }, replace: true });
    },
  });
  const remove = useMutation({
    mutationFn: () => deletePost({ data: { id: form.id! } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["posts"] });
      await navigate({ to: "/admin/news" });
    },
  });

  const titleKey = `title_${tab}` as const;
  const excerptKey = `excerpt_${tab}` as const;
  const bodyKey = `body_${tab}` as const;
  const missingTitle = !form.title_en?.trim() || !form.title_vi?.trim();
  const isPublished = form.status === "published";

  return (
    <>
      <AdminTopbar title="Tin tức" tabs={newsTab} />
      <AdminSubbar
        tabs={
          <>
            {(["vi", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className="admin-subtab"
                aria-current={tab === l ? "page" : undefined}
                onClick={() => setTab(l)}
              >
                {l === "vi" ? "Tiếng Việt" : "English"}
                {!form[`title_${l}`]?.trim() && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f04438]" title="Chưa có tiêu đề" />
                )}
              </button>
            ))}
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              aria-pressed={preview}
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {preview ? "Soạn thảo" : "Xem trước"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={save.isPending || missingTitle}
              onClick={() => save.mutate("draft")}
            >
              {isPublished ? "Gỡ xuống thành nháp" : "Lưu nháp"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={save.isPending || missingTitle}
              onClick={() => save.mutate("published")}
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPublished ? (
                "Cập nhật bài"
              ) : (
                "Đăng bài"
              )}
            </button>
          </>
        }
      />

      <div className="flex-1 p-4 lg:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link to="/admin/news" aria-label="Tất cả bài viết" className="admin-icon-btn h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-admin-ink">
            {form.id ? "Sửa bài viết" : "Viết bài mới"}
          </h2>
          <PostStatusBadge published={isPublished} />
          {form.id && form.slug && (
            <a
              href={`${import.meta.env.BASE_URL}news/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-admin-blue hover:underline"
            >
              Xem trên website <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <span className="ml-auto text-sm" role="status">
            {save.isError && (
              <span className="text-[#b42318]">
                Chưa lưu được. Kiểm tra tiêu đề cả hai ngôn ngữ và link ảnh.
              </span>
            )}
            {save.isSuccess && <span className="text-[#067647]">Đã lưu</span>}
            {missingTitle && !save.isError && (
              <span className="text-admin-dim">Cần tiêu đề cả tiếng Việt và tiếng Anh để lưu.</span>
            )}
          </span>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
          {/* Content */}
          <div className="admin-card p-6">
            {preview ? (
              <article className="text-admin-text">
                <h1 className="mb-4 text-3xl font-bold text-admin-ink">{form[titleKey]}</h1>
                <p className="mb-6 text-lg text-admin-dim">{form[excerptKey]}</p>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(form[bodyKey] ?? "") }} />
              </article>
            ) : (
              <div className="grid gap-5">
                <Field label={`Tiêu đề (${tab.toUpperCase()}) *`}>
                  <input
                    value={form[titleKey] ?? ""}
                    onChange={(e) => set(titleKey, e.target.value)}
                    className="admin-input"
                    maxLength={200}
                  />
                </Field>
                <Field
                  label={`Tóm tắt (${tab.toUpperCase()})`}
                  hint="Hiện trên thẻ bài viết và khi chia sẻ lên mạng xã hội."
                >
                  <textarea
                    rows={2}
                    value={form[excerptKey] ?? ""}
                    onChange={(e) => set(excerptKey, e.target.value)}
                    className="admin-input"
                    maxLength={500}
                  />
                </Field>
                <Field
                  label={`Nội dung (${tab.toUpperCase()})`}
                  hint="Cách một dòng trống để xuống đoạn · ## Tiêu đề · **đậm** · *nghiêng* · - danh sách · [chữ](https://link) · ![mô tả](https://ảnh.jpg)"
                >
                  <textarea
                    rows={18}
                    value={form[bodyKey] ?? ""}
                    onChange={(e) => set(bodyKey, e.target.value)}
                    className="admin-input font-mono leading-relaxed"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Settings */}
          <aside className="admin-card lg:sticky lg:top-6">
            <h3 className="border-b border-admin-line px-5 py-4 text-base font-semibold text-admin-ink">
              Cài đặt bài viết
            </h3>
            <div className="grid gap-5 p-5">
              <Field label="Ảnh bìa (URL)" hint="Link ảnh https://… (khuyến nghị 1600×900).">
                <input
                  value={form.cover_url ?? ""}
                  onChange={(e) => set("cover_url", e.target.value)}
                  placeholder="https://…"
                  className="admin-input"
                />
              </Field>
              {form.cover_url && /^(https?:\/\/|\/)/.test(form.cover_url) && (
                <img
                  src={form.cover_url}
                  alt=""
                  className="aspect-video w-full rounded-lg border border-admin-line object-cover"
                />
              )}
              <Field label="Đường dẫn (slug)" hint="Để trống sẽ tự tạo từ tiêu đề tiếng Anh.">
                <input
                  value={form.slug ?? ""}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="vietnam-coffee-harvest-2026"
                  className="admin-input"
                />
              </Field>
            </div>
            {form.id && (
              <div className="border-t border-admin-line px-5 py-4">
                <button
                  type="button"
                  className="admin-btn admin-btn-danger w-full"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm("Xóa vĩnh viễn bài viết này?")) remove.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Xóa bài
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
