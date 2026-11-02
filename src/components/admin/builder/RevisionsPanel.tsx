import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Loader2, RotateCcw } from "lucide-react";
import { getRevision, listRevisions, type PostInput } from "@/functions/posts";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Saved versions of a post; restoring loads one into the editor (applied on next save). */
export function RevisionsPanel({
  postId,
  onRestore,
}: {
  postId: number;
  onRestore: (data: PostInput & { slug: string }) => void;
}) {
  const query = useQuery({
    queryKey: ["revisions", postId],
    queryFn: () => listRevisions({ data: { postId } }),
  });
  const [loading, setLoading] = useState<number | null>(null);
  const [restored, setRestored] = useState<string | null>(null);
  const rows = query.data ?? [];

  const restore = async (id: number, at: string) => {
    if (
      !window.confirm(
        `Nạp phiên bản lúc ${fmt(at)} vào trình soạn thảo? Nội dung đang mở sẽ được thay thế.`,
      )
    )
      return;
    setLoading(id);
    try {
      const data = await getRevision({ data: { id } });
      if (data) {
        onRestore(data);
        setRestored(fmt(at));
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-4">
      <p className="mb-3 text-xs text-admin-dim">
        Mỗi lần lưu tạo một phiên bản (giữ 30 bản gần nhất). Khôi phục chỉ nạp vào trình soạn thảo;
        bấm Lưu để áp dụng.
      </p>
      {restored && (
        <p className="mb-3 rounded-lg bg-admin-blue-soft px-3 py-2 text-xs text-admin-blue">
          Đã nạp phiên bản {restored}. Kiểm tra rồi bấm Lưu nháp hoặc Cập nhật.
        </p>
      )}
      {query.isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-admin-dim">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-admin-dim">
          <History className="h-6 w-6" /> Chưa có phiên bản nào. Phiên bản được tạo khi bạn lưu bài.
        </div>
      ) : (
        <ol className="grid gap-2">
          {rows.map((r, i) => (
            <li key={r.id} className="rounded-lg border border-admin-line p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-admin-ink">{fmt(r.created_at)}</span>
                {i === 0 ? (
                  <span className="text-xs text-admin-dim">Bản mới nhất</span>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-admin-blue hover:underline disabled:opacity-50"
                    disabled={loading !== null}
                    onClick={() => void restore(r.id, r.created_at)}
                  >
                    {loading === r.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Khôi phục
                  </button>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-admin-muted">
                {r.title_vi || "(chưa có tiêu đề)"}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-admin-dim">
                <PostStatusBadge status={r.status} />
                {r.author_name && <span>{r.author_name}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
