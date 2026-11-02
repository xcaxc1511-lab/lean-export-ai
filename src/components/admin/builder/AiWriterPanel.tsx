import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Languages, ListTree, Loader2, Sparkles } from "lucide-react";
import { aiDraftOutline, aiTranslatePost } from "@/functions/ai-writer";
import { getAssistantStatus } from "@/functions/chat";

type Lang = "vi" | "en";

const ERROR_TEXT = {
  not_configured: "Trợ lý AI chưa bật (thiếu ANTHROPIC_API_KEY).",
  too_long: "Bài quá dài để dịch một lần. Hãy dịch từng phần hoặc rút gọn bài.",
  refused: "AI từ chối xử lý nội dung này. Thử diễn đạt lại.",
  mismatch: "Kết quả AI không khớp bố cục. Thử lại một lần nữa.",
  failed: "Chưa gọi được trợ lý AI. Kiểm tra kết nối rồi thử lại.",
} as const;
const errorText = (code: string) =>
  (ERROR_TEXT as Record<string, string>)[code] ?? ERROR_TEXT.failed;

const LANG_LABEL: Record<Lang, string> = { vi: "Tiếng Việt", en: "English" };

/** AI help inside the builder: translate to the other language, draft an outline. */
export function AiWriterPanel({
  lang,
  current,
  otherHasContent,
  hasBlocks,
  onTranslated,
  onOutline,
}: {
  lang: Lang;
  /** The open language's content. */
  current: { title: string; excerpt: string; seoTitle: string; seoDesc: string; body: string };
  otherHasContent: boolean;
  hasBlocks: boolean;
  onTranslated: (
    to: Lang,
    res: { title: string; excerpt: string; seoTitle: string; seoDesc: string; body: string },
  ) => void;
  onOutline: (res: { body: string; excerpt: string; seoTitle: string }, append: boolean) => void;
}) {
  const status = useQuery({ queryKey: ["assistant-status"], queryFn: () => getAssistantStatus() });
  const [busy, setBusy] = useState<"translate" | "outline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const other: Lang = lang === "vi" ? "en" : "vi";
  const off = status.data && !status.data.aiAvailable;

  const translate = async () => {
    if (!current.body && !current.title) return;
    if (
      otherHasContent &&
      !window.confirm(
        `Bản ${LANG_LABEL[other]} đã có nội dung. Thay bằng bản dịch từ ${LANG_LABEL[lang]}?`,
      )
    )
      return;
    setBusy("translate");
    setError(null);
    setDone(null);
    try {
      const res = await aiTranslatePost({ data: { from: lang, ...current } });
      if (!res.ok) return setError(errorText(res.error));
      onTranslated(other, res);
      setDone(
        `Đã dịch sang ${LANG_LABEL[other]}. Mở tab ${LANG_LABEL[other]} để xem và chỉnh sửa.`,
      );
    } catch {
      setError(ERROR_TEXT.failed);
    } finally {
      setBusy(null);
    }
  };

  const outline = async () => {
    if (current.title.trim().length < 5)
      return setError("Nhập tiêu đề bài viết trước (ít nhất 5 ký tự).");
    const append = hasBlocks;
    if (append && !window.confirm("Bài đã có nội dung. Thêm dàn bài gợi ý vào cuối bài?")) return;
    setBusy("outline");
    setError(null);
    setDone(null);
    try {
      const res = await aiDraftOutline({ data: { title: current.title, notes, lang } });
      if (!res.ok) return setError(errorText(res.error));
      onOutline(res, append);
      setDone("Đã thêm dàn bài. Chỗ nào AI ghi [Bổ sung số liệu: …] cần bạn điền thông tin thật.");
    } catch {
      setError(ERROR_TEXT.failed);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-3 rounded-lg border border-admin-line bg-admin-row/60 p-3">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-admin-text">
        <Sparkles className="h-3.5 w-3.5 text-admin-blue" /> Trợ lý AI viết bài
      </h4>
      {off ? (
        <p className="text-xs text-admin-dim">{ERROR_TEXT.not_configured}</p>
      ) : (
        <>
          <button
            type="button"
            className="admin-btn admin-btn-secondary justify-start"
            disabled={busy !== null}
            onClick={() => void translate()}
          >
            {busy === "translate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            Dịch sang {LANG_LABEL[other]}
          </button>
          <div className="grid gap-2">
            <textarea
              rows={2}
              className="admin-input text-sm"
              value={notes}
              maxLength={1500}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú cho AI (không bắt buộc): ý chính, thị trường, từ khóa…"
              aria-label="Ghi chú cho dàn bài"
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary justify-start"
              disabled={busy !== null}
              onClick={() => void outline()}
            >
              {busy === "outline" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ListTree className="h-4 w-4" />
              )}
              Gợi ý dàn bài chuẩn AEO/GEO
            </button>
          </div>
          {busy && <p className="text-xs text-admin-dim">AI đang viết, có thể mất 20–60 giây…</p>}
          {error && <p className="text-xs text-[#b42318]">{error}</p>}
          {done && <p className="text-xs text-[#067647]">{done}</p>}
          <p className="text-[11px] text-admin-dim">
            AI không tự bịa số liệu; luôn đọc lại trước khi đăng.
          </p>
        </>
      )}
    </div>
  );
}
