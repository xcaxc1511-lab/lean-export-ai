import { useState, type ReactNode } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { deletePost, getPostById, savePost, type Post, type PostInput } from "@/functions/posts";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/admin/news/$id")({
  component: PostEditorPage,
});

function PostEditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const numericId = Number(id);
  const query = useQuery({
    queryKey: ["posts", numericId],
    queryFn: () => getPostById({ data: { id: numericId } }),
    enabled: !isNew && Number.isInteger(numericId),
  });

  if (!isNew && query.isLoading) {
    return (
      <div className="flex items-center gap-2 p-12 text-admin-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
      </div>
    );
  }
  if (!isNew && !query.data) {
    return (
      <p className="p-12 text-center text-admin-muted">
        Không tìm thấy bài viết. Có thể bài đã bị xóa.
      </p>
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

const inputClass = "admin-input";

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

  return (
    <div>
      <Link
        to="/admin/news"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-admin-muted hover:text-admin-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Tất cả bài viết
      </Link>
      <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[2rem] font-bold leading-tight text-admin-ink">
          {form.id ? "Sửa bài viết" : "Viết bài mới"}
        </h1>
        <PostStatusBadge published={form.status === "published"} />
        {form.id && form.slug && (
          <a
            href={`${import.meta.env.BASE_URL}news/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-admin-muted hover:text-admin-ink"
          >
            Xem trên website <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* Content */}
        <div className="admin-panel p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-admin-line pb-5">
            <div
              role="group"
              aria-label="Ngôn ngữ"
              className="flex gap-1 rounded-full bg-admin-row p-1 ring-1 ring-inset ring-admin-line"
            >
              {(["vi", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={tab === l}
                  onClick={() => setTab(l)}
                  className="admin-segment"
                >
                  {l === "vi" ? "Tiếng Việt" : "English"}
                  {!form[`title_${l}`]?.trim() && (
                    <span className="ml-1.5 text-red-500" title="Chưa có tiêu đề">
                      •
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={preview}
              onClick={() => setPreview((p) => !p)}
              className="ml-auto text-sm font-medium text-admin-muted underline-offset-4 hover:text-admin-ink hover:underline"
            >
              {preview ? "Quay lại soạn thảo" : "Xem trước"}
            </button>
          </div>

          {preview ? (
            <article className="text-admin-muted">
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
                  className={`${inputClass} text-base`}
                  maxLength={200}
                />
              </Field>
              <Field
                label={`Tóm tắt (${tab.toUpperCase()})`}
                hint="Hiện trên thẻ bài viết và chia sẻ mạng xã hội."
              >
                <textarea
                  rows={2}
                  value={form[excerptKey] ?? ""}
                  onChange={(e) => set(excerptKey, e.target.value)}
                  className={inputClass}
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
                  className={`${inputClass} font-mono text-sm leading-relaxed`}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Settings */}
        <aside className="admin-panel grid h-fit gap-5 p-6 lg:sticky lg:top-10">
          <Field label="Ảnh bìa (URL)" hint="Link ảnh https://… (khuyến nghị 1600×900).">
            <input
              value={form.cover_url ?? ""}
              onChange={(e) => set("cover_url", e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>
          {form.cover_url && /^(https?:\/\/|\/)/.test(form.cover_url) && (
            <img
              src={form.cover_url}
              alt=""
              className="aspect-video w-full rounded-xl object-cover"
            />
          )}
          <Field label="Đường dẫn (slug)" hint="Để trống sẽ tự tạo từ tiêu đề tiếng Anh.">
            <input
              value={form.slug ?? ""}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="vietnam-coffee-harvest-2026"
              className={inputClass}
            />
          </Field>

          {save.isError && (
            <p role="alert" className="text-sm text-red-600">
              Chưa lưu được. Kiểm tra đã nhập tiêu đề cả hai ngôn ngữ và link ảnh hợp lệ.
            </p>
          )}
          {save.isSuccess && <p className="text-sm text-green-700">Đã lưu.</p>}

          <div className="grid gap-3">
            <button
              type="button"
              className="btn btn-primary btn-sm w-full"
              disabled={save.isPending || missingTitle}
              onClick={() => save.mutate("published")}
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : form.status === "published" ? (
                "Cập nhật bài đã đăng"
              ) : (
                "Đăng bài"
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm w-full"
              disabled={save.isPending || missingTitle}
              onClick={() => save.mutate("draft")}
            >
              {form.status === "published" ? "Gỡ xuống thành nháp" : "Lưu nháp"}
            </button>
            {missingTitle && (
              <p className="text-xs text-admin-dim">Cần tiêu đề cả tiếng Việt và tiếng Anh.</p>
            )}
          </div>

          {form.id && (
            <button
              type="button"
              className="flex items-center gap-1.5 justify-self-start text-sm text-red-600 hover:underline"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("Xóa vĩnh viễn bài viết này?")) remove.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" /> Xóa bài
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
