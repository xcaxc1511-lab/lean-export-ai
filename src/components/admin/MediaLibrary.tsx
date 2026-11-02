import { useEffect, useRef, useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ImageUp, Loader2, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { deleteMedia, listMedia, updateMediaAlt, type MediaItem } from "@/functions/media";
import { uploadErrorText, uploadImage } from "@/lib/image-upload";

const kb = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

/** Upload zone: click to choose or drop files; uploads one by one. */
function UploadZone({
  onUploaded,
}: {
  onUploaded: (items: { id: string; url: string }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const handle = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setError(null);
    const done: { id: string; url: string }[] = [];
    for (const [i, file] of list.entries()) {
      setBusy(`Đang tải ${i + 1}/${list.length}: ${file.name}`);
      try {
        done.push(await uploadImage(file));
      } catch (e) {
        setError(`${file.name}: ${uploadErrorText(e)}`);
      }
    }
    setBusy(null);
    if (done.length) onUploaded(done);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void handle(e.dataTransfer.files);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        disabled={busy !== null}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          over
            ? "border-admin-blue bg-admin-blue-soft"
            : "border-admin-field hover:border-[#84adff] hover:bg-admin-row"
        }`}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-admin-blue" />
        ) : (
          <ImageUp className="h-6 w-6 text-admin-dim" />
        )}
        <span className="text-sm font-medium text-admin-ink">
          {busy ?? "Kéo thả ảnh vào đây hoặc bấm để chọn"}
        </span>
        {!busy && (
          <span className="text-xs text-admin-dim">
            JPG, PNG, WebP, GIF. Ảnh tự thu nhỏ về tối đa 1920px và nén WebP trước khi tải lên.
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void handle(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-sm text-[#b42318]">{error}</p>}
    </div>
  );
}

function AltEditor({ item }: { item: MediaItem }) {
  const qc = useQueryClient();
  const [alt, setAlt] = useState(item.alt ?? "");
  useEffect(() => setAlt(item.alt ?? ""), [item.alt]);
  const save = useMutation({
    mutationFn: () => updateMediaAlt({ data: { id: item.id, alt } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });
  return (
    <input
      value={alt}
      onChange={(e) => setAlt(e.target.value)}
      onBlur={() => alt !== (item.alt ?? "") && save.mutate()}
      placeholder="Mô tả ảnh (alt)"
      aria-label={`Mô tả ảnh ${item.filename}`}
      className="admin-input h-8 px-2 text-xs"
    />
  );
}

/**
 * Image library. In "pick" mode clicking an image chooses it; in "manage" mode
 * each card offers alt text, copy link and delete.
 */
export function MediaLibrary({
  mode,
  onPick,
}: {
  mode: "pick" | "manage";
  onPick?: (item: { url: string; alt: string }) => void;
}) {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setQ(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  const query = useQuery({ queryKey: ["media", q], queryFn: () => listMedia({ data: { q } }) });
  const items = query.data?.items ?? [];

  const remove = useMutation({
    mutationFn: async (item: MediaItem) => {
      const res = await deleteMedia({ data: { id: item.id } });
      if (!res.ok) {
        const list = res.usedIn.slice(0, 5).join("\n• ");
        if (
          !window.confirm(
            `Ảnh đang được dùng trong:\n• ${list}\n\nXóa vẫn tiếp tục? Các bài này sẽ mất ảnh.`,
          )
        )
          return;
        await deleteMedia({ data: { id: item.id, force: true } });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });

  const absolute = (url: string) => `${window.location.origin}${url}`;

  return (
    <div className="grid gap-4">
      <UploadZone
        onUploaded={async (done) => {
          await qc.invalidateQueries({ queryKey: ["media"] });
          // Picking: a single fresh upload is chosen straight away.
          if (mode === "pick" && done.length === 1 && onPick)
            onPick({ url: done[0]!.url, alt: "" });
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-admin-muted">
          {query.data ? `${query.data.count} ảnh, ${kb(query.data.bytes)}` : "…"}
        </span>
        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Tìm ảnh</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-dim" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tìm theo tên, mô tả…"
            className="admin-input pl-9"
          />
        </label>
      </div>
      {query.isLoading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-admin-dim">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : items.length === 0 ? (
        <p className="p-8 text-center text-sm text-admin-dim">
          {q
            ? "Không có ảnh khớp từ khóa."
            : "Chưa có ảnh nào. Tải ảnh đầu tiên lên ở ô phía trên."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-lg border border-admin-line bg-white"
            >
              {mode === "pick" ? (
                <button
                  type="button"
                  onClick={() => onPick?.({ url: item.url, alt: item.alt ?? "" })}
                  className="group block w-full text-left"
                  title={`Chọn ${item.filename}`}
                >
                  <span className="block aspect-[4/3] bg-admin-row">
                    <img
                      src={item.url}
                      alt={item.alt ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:opacity-85"
                    />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs text-admin-text">
                    {item.filename}
                  </span>
                </button>
              ) : (
                <>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[4/3] bg-admin-row"
                  >
                    <img
                      src={item.url}
                      alt={item.alt ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </a>
                  <div className="grid gap-1.5 p-2">
                    <p
                      className="truncate text-xs font-medium text-admin-ink"
                      title={item.filename}
                    >
                      {item.filename}
                    </p>
                    <p className="text-[11px] text-admin-dim">
                      {item.width ? `${item.width}×${item.height}, ` : ""}
                      {kb(item.size)}
                    </p>
                    <AltEditor item={item} />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(absolute(item.url));
                          setCopied(item.id);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="admin-btn admin-btn-secondary h-8 flex-1 px-2 text-xs"
                      >
                        {copied === item.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied === item.id ? "Đã chép" : "Chép link"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.confirm(`Xóa ảnh ${item.filename}?`) && remove.mutate(item)
                        }
                        className="admin-icon-btn h-8 w-8 text-[#b42318]"
                        aria-label={`Xóa ${item.filename}`}
                        title="Xóa ảnh"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Modal image picker used by the post builder (cover, image blocks). */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (item: { url: string; alt: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[80] max-h-[90dvh] max-w-4xl overflow-y-auto bg-white">
        <DialogTitle className="text-lg font-semibold text-admin-ink">Thư viện ảnh</DialogTitle>
        <DialogDescription className="text-sm text-admin-dim">
          Chọn một ảnh, hoặc tải ảnh mới lên (ảnh vừa tải được chọn luôn).
        </DialogDescription>
        {open && (
          <MediaLibrary
            mode="pick"
            onPick={(item) => {
              onPick(item);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
