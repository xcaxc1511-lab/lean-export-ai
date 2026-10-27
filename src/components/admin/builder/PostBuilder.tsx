import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Eye,
  ExternalLink,
  GripVertical,
  Loader2,
  Monitor,
  PanelLeft,
  PenLine,
  Plus,
  Redo2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
} from "lucide-react";
import { deletePost, savePost, type Post } from "@/functions/posts";
import { scorePostBothLangs } from "@/lib/aeo-geo";
import {
  blockWrapClass,
  cloneBlock,
  createBlock,
  parseBody,
  renderBlocks,
  safeUrl,
  serializeBody,
  type Block,
  type BlockType,
  type Rich,
} from "@/lib/blocks";
import { AeoGeoPanel, ScoreChip } from "@/components/admin/AeoGeoPanel";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { BlockSettings } from "./BlockSettings";
import { BlockView, type FocusRequest } from "./BlockView";
import { DND_MOVE, DND_NEW, WIDGET_GROUPS, WIDGETS, widgetOf } from "./catalog";
import { PlainText } from "./editable";
import { InlineToolbar } from "./InlineToolbar";

type Lang = "vi" | "en";
type Docs = Record<Lang, Block[]>;
interface Meta {
  id?: number;
  slug: string;
  title_vi: string;
  title_en: string;
  excerpt_vi: string;
  excerpt_en: string;
  cover_url: string;
  status: "draft" | "published";
}
type Device = "desktop" | "tablet" | "mobile";
type Panel = "blocks" | "post" | "score";
type Drag = { kind: "new"; type: BlockType } | { kind: "move"; id: string };

interface History {
  past: Docs[];
  present: Docs;
  future: Docs[];
  /** Consecutive edits with the same key (typing in one block) merge into one undo step. */
  key: string | null;
  at: number;
}

const TEXT_BLOCKS: BlockType[] = ["heading", "paragraph", "list", "quote", "callout", "media-text"];

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "max-w-[1000px]",
  tablet: "max-w-[768px]",
  mobile: "max-w-[390px]",
};

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function PostBuilder({ post }: { post: Post | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [meta, setMeta] = useState<Meta>({
    ...(post?.id ? { id: post.id } : {}),
    slug: post?.slug ?? "",
    title_vi: post?.title_vi ?? "",
    title_en: post?.title_en ?? "",
    excerpt_vi: post?.excerpt_vi ?? "",
    excerpt_en: post?.excerpt_en ?? "",
    cover_url: post?.cover_url ?? "",
    status: post?.status ?? "draft",
  });
  const [hist, setHist] = useState<History>(() => ({
    past: [],
    present: { vi: parseBody(post?.body_vi), en: parseBody(post?.body_en) },
    future: [],
    key: null,
    at: 0,
  }));
  const [lang, setLang] = useState<Lang>("vi");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Last block the user worked on — new widgets are inserted after it. */
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("blocks");
  const [panelOpen, setPanelOpen] = useState(true);
  const [device, setDevice] = useState<Device>("desktop");
  const [preview, setPreview] = useState(false);
  const [focusReq, setFocusReq] = useState<(FocusRequest & { id: string }) | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const blocks = hist.present[lang];
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  /* ------------------------------------------------------ persistence */

  const bodies = useMemo(
    () => ({ body_vi: serializeBody(hist.present.vi), body_en: serializeBody(hist.present.en) }),
    [hist.present],
  );
  const snapshot = JSON.stringify({ ...meta, ...bodies });
  const savedSnapshot = useRef(snapshot);
  const dirty = snapshot !== savedSnapshot.current;
  const missingTitle = !meta.title_vi.trim() || !meta.title_en.trim();
  const scores = useMemo(() => scorePostBothLangs({ ...meta, ...bodies }), [meta, bodies]);

  const save = useMutation({
    mutationFn: (status: "draft" | "published") =>
      savePost({ data: { ...meta, ...bodies, status } }),
    onSuccess: async (res, status) => {
      const next = { ...meta, id: res.id, slug: res.slug, status };
      setMeta(next);
      savedSnapshot.current = JSON.stringify({ ...next, ...bodies });
      await qc.invalidateQueries({ queryKey: ["posts", "all"] });
      if (!post) {
        // Seed the cache so the editor reopens instantly under its new URL.
        const now = new Date().toISOString();
        qc.setQueryData<Post>(["posts", res.id], {
          id: res.id,
          slug: res.slug,
          title_vi: next.title_vi,
          title_en: next.title_en,
          excerpt_vi: next.excerpt_vi || null,
          excerpt_en: next.excerpt_en || null,
          body_vi: bodies.body_vi || null,
          body_en: bodies.body_en || null,
          cover_url: next.cover_url || null,
          status,
          published_at: status === "published" ? now : null,
          created_at: now,
          updated_at: now,
        });
        await navigate({ to: "/admin/news/$id", params: { id: String(res.id) }, replace: true });
      }
    },
  });
  const remove = useMutation({
    mutationFn: () => deletePost({ data: { id: meta.id! } }),
    onSuccess: async () => {
      savedSnapshot.current = snapshot;
      await qc.invalidateQueries({ queryKey: ["posts"] });
      await navigate({ to: "/admin/news" });
    },
  });

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /* ---------------------------------------------------- block editing */

  const commit = useCallback(
    (fn: (blocks: Block[]) => Block[], key?: string) =>
      setHist((h) => {
        const present = { ...h.present, [lang]: fn(h.present[lang]) };
        const now = Date.now();
        if (key && h.key === key && now - h.at < 1500) return { ...h, present, at: now };
        return {
          past: [...h.past.slice(-99), h.present],
          present,
          future: [],
          key: key ?? null,
          at: now,
        };
      }),
    [lang],
  );

  const undo = () =>
    setHist((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1]!,
            future: [h.present, ...h.future],
            key: null,
            at: 0,
          }
        : h,
    );
  const redo = () =>
    setHist((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0]!,
            future: h.future.slice(1),
            key: null,
            at: 0,
          }
        : h,
    );

  const updateBlock = (id: string, patch: Partial<Block>) =>
    commit((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)), `edit:${id}`);

  const insertBlock = (type: BlockType, at?: number) => {
    const block = createBlock(type);
    commit((bs) => {
      const anchorIndex = bs.findIndex((b) => b.id === anchorId);
      const index = at ?? (anchorIndex >= 0 ? anchorIndex + 1 : bs.length);
      const next = [...bs];
      next.splice(index, 0, block);
      return next;
    });
    setSelectedId(block.id);
    setAnchorId(block.id);
    if (TEXT_BLOCKS.includes(type)) setFocusReq({ id: block.id, at: "end" });
    requestAnimationFrame(() =>
      document
        .querySelector(`[data-block-id="${block.id}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  };

  const moveBlock = (id: string, to: number) =>
    commit((bs) => {
      const from = bs.findIndex((b) => b.id === id);
      if (from < 0) return bs;
      const next = [...bs];
      const [block] = next.splice(from, 1);
      next.splice(from < to ? to - 1 : to, 0, block!);
      return next;
    });

  const duplicateBlock = (id: string) => {
    const source = blocks.find((b) => b.id === id);
    if (!source) return;
    const copy = cloneBlock(source);
    commit((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const next = [...bs];
      next.splice(i + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
  };

  const deleteBlock = (id: string, focusPrevious = false) => {
    const i = blocks.findIndex((b) => b.id === id);
    const prev = blocks[i - 1];
    commit((bs) => bs.filter((b) => b.id !== id));
    setSelectedId(focusPrevious && prev ? prev.id : null);
    if (focusPrevious && prev && TEXT_BLOCKS.includes(prev.type))
      setFocusReq({
        id: prev.id,
        at: "end",
        index: prev.type === "list" ? prev.items.length - 1 : 0,
      });
  };

  const splitBlock = (id: string, before: Rich, after: Rich) => {
    const next = createBlock("paragraph");
    if (next.type === "paragraph") next.text = after;
    commit((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const out = bs.map((b) =>
        b.id === id && (b.type === "paragraph" || b.type === "heading")
          ? { ...b, text: before }
          : b,
      );
      out.splice(i + 1, 0, next);
      return out;
    });
    setSelectedId(next.id);
    setFocusReq({ id: next.id, at: "start" });
  };

  const clearFocus = useCallback(() => setFocusReq(null), []);

  /* --------------------------------------------------------- shortcuts */

  const handlers = useRef({ undo, redo, save: () => {}, del: () => {}, esc: () => {} });
  handlers.current = {
    undo,
    redo,
    save: () => !missingTitle && !save.isPending && save.mutate(meta.status),
    del: () => selectedId && deleteBlock(selectedId),
    esc: () => setSelectedId(null),
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) handlers.current.redo();
        else handlers.current.undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        handlers.current.redo();
      } else if (mod && key === "s") {
        e.preventDefault();
        handlers.current.save();
      } else if ((key === "delete" || key === "backspace") && !isEditable(e.target)) {
        e.preventDefault();
        handlers.current.del();
      } else if (key === "escape" && !isEditable(e.target)) {
        handlers.current.esc();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------------------------------ drag & drop */

  const startNewDrag = (e: DragEvent, type: BlockType) => {
    e.dataTransfer.setData(DND_NEW, type);
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.effectAllowed = "copy";
    setDrag({ kind: "new", type });
  };
  const startMoveDrag = (e: DragEvent, id: string) => {
    e.dataTransfer.setData(DND_MOVE, id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    const el = document.querySelector(`[data-block-id="${id}"]`);
    if (el) e.dataTransfer.setDragImage(el, 20, 20);
    setDrag({ kind: "move", id });
  };
  const endDrag = () => {
    setDrag(null);
    setDropIndex(null);
  };
  const overBlock = (e: DragEvent, index: number) => {
    if (!drag) return;
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setDropIndex(e.clientY < r.top + r.height / 2 ? index : index + 1);
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    const index = dropIndex ?? blocks.length;
    if (drag?.kind === "new") insertBlock(drag.type, index);
    else if (drag?.kind === "move") moveBlock(drag.id, index);
    endDrag();
  };

  /* ------------------------------------------------------------ render */

  const selectBlock = (id: string) => {
    if (id !== selectedId) setSelectedId(id);
    setAnchorId(id);
    setPanel("blocks");
  };
  const title = lang === "vi" ? meta.title_vi : meta.title_en;
  const excerpt = lang === "vi" ? meta.excerpt_vi : meta.excerpt_en;
  const setTitle = (v: string) => setMeta((m) => ({ ...m, [`title_${lang}`]: v }));
  const setExcerpt = (v: string) => setMeta((m) => ({ ...m, [`excerpt_${lang}`]: v }));
  const otherLang: Lang = lang === "vi" ? "en" : "vi";
  const isPublished = meta.status === "published";

  const dropLine = <div className="pointer-events-none my-1 h-1 rounded-full bg-admin-blue" />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-admin-canvas text-admin-ink">
      <InlineToolbar />

      {/* ------------------------------------------------ top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-admin-line bg-white px-3">
        <Link
          to="/admin/news"
          onClick={(e) => {
            if (dirty && !window.confirm("Bài viết có thay đổi chưa lưu. Rời trang?"))
              e.preventDefault();
            else savedSnapshot.current = snapshot;
          }}
          className="admin-icon-btn h-9 w-9"
          aria-label="Về danh sách bài viết"
          title="Về danh sách bài viết"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-pressed={panelOpen}
          className={`admin-icon-btn h-9 w-9 ${panelOpen ? "bg-admin-blue-soft text-admin-blue" : ""}`}
          aria-label="Bật/tắt bảng khối"
          title="Bật/tắt bảng khối"
          disabled={preview}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="hidden min-w-0 items-center gap-2 xl:flex">
          <span className="truncate text-sm font-semibold">
            {meta.id ? "Sửa bài viết" : "Viết bài mới"}
          </span>
          <PostStatusBadge published={isPublished} />
        </div>

        <div className="mx-auto flex items-center gap-2">
          <div className="flex rounded-lg bg-admin-canvas p-1" role="group" aria-label="Ngôn ngữ">
            {(["vi", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => {
                  setLang(l);
                  setSelectedId(null);
                  setAnchorId(null);
                }}
                className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${
                  lang === l
                    ? "bg-white text-admin-ink shadow-sm"
                    : "text-admin-muted hover:text-admin-ink"
                }`}
              >
                {l === "vi" ? "Tiếng Việt" : "English"}
                <ScoreChip score={scores[l].overall} />
              </button>
            ))}
          </div>
          <div
            className="hidden rounded-lg bg-admin-canvas p-1 md:flex"
            role="group"
            aria-label="Xem theo thiết bị"
          >
            {(
              [
                ["desktop", Monitor, "Máy tính"],
                ["tablet", Tablet, "Máy tính bảng"],
                ["mobile", Smartphone, "Điện thoại"],
              ] as const
            ).map(([d, Icon, label]) => (
              <button
                key={d}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={`flex h-8 w-9 items-center justify-center rounded-md ${
                  device === d
                    ? "bg-white text-admin-ink shadow-sm"
                    : "text-admin-muted hover:text-admin-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              className="admin-icon-btn h-9 w-9 border-0"
              onClick={undo}
              disabled={!hist.past.length}
              aria-label="Hoàn tác (Ctrl+Z)"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="admin-icon-btn h-9 w-9 border-0"
              onClick={redo}
              disabled={!hist.future.length}
              aria-label="Làm lại (Ctrl+Y)"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <span className="hidden text-xs text-admin-dim lg:inline" role="status">
          {save.isPending
            ? "Đang lưu…"
            : save.isError
              ? "Lưu thất bại, thử lại"
              : missingTitle
                ? "Cần tiêu đề cả 2 ngôn ngữ để lưu"
                : dirty
                  ? "Có thay đổi chưa lưu"
                  : meta.id
                    ? "Đã lưu"
                    : ""}
        </span>
        <button
          type="button"
          className="admin-btn admin-btn-secondary h-9 px-3"
          aria-pressed={preview}
          onClick={() => {
            setPreview((p) => !p);
            setSelectedId(null);
          }}
        >
          {preview ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="hidden sm:inline">{preview ? "Chỉnh sửa" : "Xem trước"}</span>
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary h-9 px-3"
          disabled={save.isPending || missingTitle}
          onClick={() => save.mutate("draft")}
          title="Ctrl+S"
        >
          {isPublished ? "Gỡ về nháp" : "Lưu nháp"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-primary h-9 px-3"
          disabled={save.isPending || missingTitle}
          onClick={() => save.mutate("published")}
        >
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPublished ? (
            "Cập nhật"
          ) : (
            "Đăng bài"
          )}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ---------------------------------------------- left panel */}
        {panelOpen && !preview && (
          <aside className="absolute inset-y-14 left-0 z-20 flex w-[320px] flex-col border-r border-admin-line bg-white shadow-xl lg:static lg:shadow-none">
            <div className="flex shrink-0 border-b border-admin-line" role="tablist">
              {(
                [
                  ["blocks", "Khối"],
                  ["post", "Bài viết"],
                  ["score", "AEO/GEO"],
                ] as const
              ).map(([p, label]) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={panel === p}
                  aria-current={panel === p ? "page" : undefined}
                  onClick={() => {
                    setPanel(p);
                    if (p === "blocks") setSelectedId(null);
                  }}
                  className="admin-subtab h-12 flex-1 justify-center px-2"
                >
                  {label}
                  {p === "score" && <ScoreChip score={scores[lang].overall} />}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {panel === "blocks" &&
                (selected ? (
                  <BlockSettings
                    key={selected.id}
                    block={selected}
                    onChange={(patch) => updateBlock(selected.id, patch)}
                    onDuplicate={() => duplicateBlock(selected.id)}
                    onDelete={() => deleteBlock(selected.id)}
                    onClose={() => setSelectedId(null)}
                  />
                ) : (
                  <div className="p-4">
                    <p className="mb-4 text-xs text-admin-dim">
                      Kéo khối thả vào trang, hoặc bấm để thêm ngay sau khối bạn vừa chọn.
                    </p>
                    {WIDGET_GROUPS.map((g) => (
                      <div key={g.id} className="mb-5">
                        <h4 className="mb-2 text-xs font-semibold text-admin-dim">
                          {g.label}
                          {g.hint && <span className="block font-normal">{g.hint}</span>}
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {WIDGETS.filter((w) => w.group === g.id).map((w) => (
                            <button
                              key={w.type}
                              type="button"
                              draggable
                              onDragStart={(e) => startNewDrag(e, w.type)}
                              onDragEnd={endDrag}
                              onClick={() => insertBlock(w.type)}
                              className="flex aspect-square cursor-grab flex-col items-center justify-center gap-2 rounded-lg border border-admin-line bg-white p-2 text-center text-xs font-medium text-admin-text transition-colors hover:border-[#84adff] hover:bg-admin-blue-soft hover:text-admin-blue active:cursor-grabbing"
                            >
                              <w.icon className="h-5 w-5" />
                              {w.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {panel === "post" && (
                <div className="grid gap-5 p-4">
                  <label className="admin-label">
                    Tiêu đề ({lang.toUpperCase()}) *
                    <textarea
                      rows={2}
                      className="admin-input"
                      value={title}
                      maxLength={200}
                      onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
                    />
                    <span className="admin-hint">
                      {title.length}/70 ký tự khuyến nghị. Cũng sửa được ngay trên trang.
                    </span>
                  </label>
                  <label className="admin-label">
                    Tóm tắt ({lang.toUpperCase()})
                    <textarea
                      rows={3}
                      className="admin-input"
                      value={excerpt}
                      maxLength={500}
                      onChange={(e) => setExcerpt(e.target.value)}
                    />
                    <span className="admin-hint">
                      {excerpt.length} ký tự, nên 110–170. Hiện dưới tiêu đề và khi chia sẻ.
                    </span>
                  </label>
                  <label className="admin-label">
                    Ảnh bìa (URL)
                    <input
                      className="admin-input"
                      value={meta.cover_url}
                      placeholder="https://…"
                      onChange={(e) => setMeta((m) => ({ ...m, cover_url: e.target.value }))}
                    />
                    <span className="admin-hint">
                      Khuyến nghị 1600×900. Dùng chung cho 2 ngôn ngữ.
                    </span>
                  </label>
                  {safeUrl(meta.cover_url) && (
                    <img
                      src={safeUrl(meta.cover_url)}
                      alt=""
                      className="aspect-video w-full rounded-lg border border-admin-line object-cover"
                    />
                  )}
                  <label className="admin-label">
                    Đường dẫn (slug)
                    <input
                      className="admin-input"
                      value={meta.slug}
                      placeholder="vietnam-coffee-harvest-2026"
                      onChange={(e) => setMeta((m) => ({ ...m, slug: e.target.value }))}
                    />
                    <span className="admin-hint">Để trống sẽ tự tạo từ tiêu đề tiếng Anh.</span>
                  </label>
                  {meta.id && meta.slug && (
                    <a
                      href={`${import.meta.env.BASE_URL}news/${meta.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-admin-blue hover:underline"
                    >
                      Xem trên website <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <div className="grid gap-2 border-t border-admin-line pt-5">
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      disabled={!hist.present[otherLang].length}
                      onClick={() => {
                        if (
                          blocks.length &&
                          !window.confirm(
                            `Thay toàn bộ nội dung bản ${lang === "vi" ? "Tiếng Việt" : "English"} bằng bố cục của bản ${otherLang === "vi" ? "Tiếng Việt" : "English"}?`,
                          )
                        )
                          return;
                        commit(() => hist.present[otherLang].map(cloneBlock));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Chép bố cục từ bản {otherLang === "vi" ? "Tiếng Việt" : "English"}
                    </button>
                    <span className="admin-hint">
                      Chép toàn bộ khối sang bản đang mở để dịch, giữ nguyên ảnh và cách trình bày.
                    </span>
                  </div>
                  {meta.id && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm("Xóa vĩnh viễn bài viết này?")) remove.mutate();
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Xóa bài viết
                    </button>
                  )}
                </div>
              )}

              {panel === "score" && (
                <div className="p-4">
                  <AeoGeoPanel
                    result={scores[lang]}
                    langLabel={lang === "vi" ? "tiếng Việt" : "tiếng Anh"}
                  />
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ----------------------------------------------------- canvas */}
        <main
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6 md:px-8"
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).closest("[data-block-id]")) setSelectedId(null);
          }}
        >
          <div
            className={`@container mx-auto overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_rgba(16,24,40,0.1)] transition-[max-width] duration-300 ${DEVICE_WIDTH[device]}`}
          >
            {/* Article header, as on the public page */}
            <header className="relative overflow-hidden bg-brand-ink px-6 pb-12 pt-14 text-white @xl:px-12 @xl:pb-16 @xl:pt-20">
              {safeUrl(meta.cover_url) && (
                <img
                  src={safeUrl(meta.cover_url)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-brand-ink via-brand-ink/80 to-brand-ink/50" />
              <div className="relative mx-auto max-w-3xl">
                {preview ? (
                  <>
                    <h1 className="mb-5 text-3xl font-bold leading-tight @xl:text-5xl">{title}</h1>
                    {excerpt && <p className="text-lg text-gray-300 @xl:text-xl">{excerpt}</p>}
                  </>
                ) : (
                  <>
                    <PlainText
                      as="h1"
                      value={title}
                      onChange={setTitle}
                      placeholder={lang === "vi" ? "Tiêu đề bài viết" : "Article title"}
                      className="mb-5 block text-3xl font-bold leading-tight @xl:text-5xl"
                    />
                    <PlainText
                      as="p"
                      value={excerpt}
                      onChange={setExcerpt}
                      placeholder={
                        lang === "vi"
                          ? "Tóm tắt ngắn (110–170 ký tự)"
                          : "Short summary (110–170 characters)"
                      }
                      className="block text-lg text-gray-300 @xl:text-xl"
                      multiline
                    />
                  </>
                )}
                {!safeUrl(meta.cover_url) && !preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPanelOpen(true);
                      setPanel("post");
                    }}
                    className="mt-6 rounded-full border border-white/30 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                  >
                    + Thêm ảnh bìa
                  </button>
                )}
              </div>
            </header>

            {/* Article body */}
            {preview ? (
              <div
                className="mx-auto max-w-3xl px-6 py-14 text-lg text-gray-700"
                dangerouslySetInnerHTML={{ __html: renderBlocks(blocks) }}
              />
            ) : (
              <div
                className="mx-auto max-w-3xl px-6 py-12 text-lg text-gray-700"
                onDragOver={(e) => {
                  if (!drag) return;
                  e.preventDefault();
                  if (e.target === e.currentTarget) setDropIndex(blocks.length);
                }}
                onDrop={drop}
              >
                {blocks.length === 0 && (
                  <div
                    className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-14 text-center ${
                      drag ? "border-admin-blue bg-admin-blue-soft" : "border-admin-field"
                    }`}
                    onDragOver={(e) => {
                      if (!drag) return;
                      e.preventDefault();
                      setDropIndex(0);
                    }}
                  >
                    <p className="text-base text-admin-muted">
                      Kéo khối từ bảng bên trái thả vào đây, hoặc bắt đầu với:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(["paragraph", "heading", "image", "faq"] as BlockType[]).map((t) => {
                        const w = widgetOf(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => insertBlock(t)}
                            className="admin-btn admin-btn-secondary h-9"
                          >
                            <w.icon className="h-4 w-4" /> {w.label}
                          </button>
                        );
                      })}
                    </div>
                    {hist.present[otherLang].length > 0 && (
                      <button
                        type="button"
                        onClick={() => commit(() => hist.present[otherLang].map(cloneBlock))}
                        className="text-sm font-medium text-admin-blue hover:underline"
                      >
                        Hoặc chép bố cục từ bản {otherLang === "vi" ? "Tiếng Việt" : "English"} để
                        dịch
                      </button>
                    )}
                  </div>
                )}

                {blocks.map((b, i) => {
                  const isSelected = b.id === selectedId;
                  const moving = drag?.kind === "move" && drag.id === b.id;
                  return (
                    <div key={b.id}>
                      {dropIndex === i && drag && dropLine}
                      <div
                        data-block-id={b.id}
                        onMouseDown={() => selectBlock(b.id)}
                        onFocusCapture={() => selectBlock(b.id)}
                        onDragOver={(e) => overBlock(e, i)}
                        className={`group/block relative rounded-sm outline-offset-[6px] ${blockWrapClass(b)} ${
                          isSelected
                            ? "outline-2 outline-admin-blue outline-solid"
                            : "hover:outline-1 hover:outline-dashed hover:outline-[#84adff]"
                        } ${moving ? "opacity-40" : ""}`}
                      >
                        <div
                          className={`absolute -top-[34px] left-[-6px] z-10 items-center gap-1 rounded-t-md bg-admin-blue px-1.5 py-1 text-xs font-medium text-white ${
                            isSelected
                              ? "flex"
                              : "hidden group-hover/block:flex group-hover/block:bg-[#84adff]"
                          }`}
                        >
                          <span
                            draggable
                            onDragStart={(e) => startMoveDrag(e, b.id)}
                            onDragEnd={endDrag}
                            className="cursor-grab rounded p-0.5 hover:bg-white/20 active:cursor-grabbing"
                            title="Kéo để di chuyển"
                            aria-label="Kéo để di chuyển"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </span>
                          {widgetOf(b.type).label}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-[34px] right-[-6px] z-10 flex items-center gap-0.5 rounded-t-md bg-admin-blue p-0.5 text-white">
                            {[
                              {
                                icon: ArrowUp,
                                label: "Lên trên",
                                onClick: () => moveBlock(b.id, i - 1),
                                disabled: i === 0,
                              },
                              {
                                icon: ArrowDown,
                                label: "Xuống dưới",
                                onClick: () => moveBlock(b.id, i + 2),
                                disabled: i === blocks.length - 1,
                              },
                              {
                                icon: Copy,
                                label: "Nhân bản",
                                onClick: () => duplicateBlock(b.id),
                                disabled: false,
                              },
                              {
                                icon: Trash2,
                                label: "Xóa",
                                onClick: () => deleteBlock(b.id),
                                disabled: false,
                              },
                            ].map((a) => (
                              <button
                                key={a.label}
                                type="button"
                                title={a.label}
                                aria-label={a.label}
                                disabled={a.disabled}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={a.onClick}
                                className="rounded p-1 hover:bg-white/20 disabled:opacity-40"
                              >
                                <a.icon className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          </div>
                        )}
                        <BlockView
                          block={b}
                          focus={focusReq?.id === b.id ? focusReq : null}
                          onFocused={clearFocus}
                          actions={{
                            update: (patch) => updateBlock(b.id, patch),
                            split: (before, after) => splitBlock(b.id, before, after),
                            removeEmpty: () => deleteBlock(b.id, true),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {dropIndex === blocks.length && drag && blocks.length > 0 && dropLine}

                {blocks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      setAnchorId(null);
                      setPanel("blocks");
                      setPanelOpen(true);
                    }}
                    onDragOver={(e) => {
                      if (!drag) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setDropIndex(blocks.length);
                    }}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 text-sm font-medium transition-colors ${
                      drag
                        ? "border-admin-blue bg-admin-blue-soft text-admin-blue"
                        : "border-admin-field text-admin-dim hover:border-[#84adff] hover:text-admin-blue"
                    }`}
                  >
                    <Plus className="h-4 w-4" /> Thêm khối (kéo thả vào đây hoặc chọn ở bảng bên
                    trái)
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
