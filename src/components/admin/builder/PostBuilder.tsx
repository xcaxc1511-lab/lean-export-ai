import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "@/functions/categories";
import {
  ArrowDown,
  CalendarClock,
  ChevronDown,
  Images,
  RotateCcw,
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
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Settings2,
  X,
} from "lucide-react";
import {
  deletePost,
  isLive,
  parseTags,
  savePost,
  type Post,
  type PostInput,
  type PostStatus,
} from "@/functions/posts";
import { scorePostBothLangs, scoreTone } from "@/lib/aeo-geo";
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
import { MediaPickerDialog } from "@/components/admin/MediaLibrary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaPickerContext, type PickedImage } from "./media-picker";
import { RevisionsPanel } from "./RevisionsPanel";
import { AiWriterPanel } from "./AiWriterPanel";
import { ScheduleDialog } from "./ScheduleDialog";
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
  status: PostStatus;
  category_id: number | null;
  tags: string[];
  seo_title_vi: string;
  seo_title_en: string;
  seo_desc_vi: string;
  seo_desc_en: string;
  og_image: string;
}
type Device = "desktop" | "tablet" | "mobile";
type Panel = "blocks" | "post" | "score" | "history";

const draftKey = (id: number | undefined) => `lx_post_draft_${id ?? "new"}`;
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
    category_id: post?.category_id ?? null,
    tags: parseTags(post?.tags),
    seo_title_vi: post?.seo_title_vi ?? "",
    seo_title_en: post?.seo_title_en ?? "",
    seo_desc_vi: post?.seo_desc_vi ?? "",
    seo_desc_en: post?.seo_desc_en ?? "",
    og_image: post?.og_image ?? "",
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [tagDraft, setTagDraft] = useState("");
  /** Go-live time: first publish date, or the scheduled time. */
  const [publishedAt, setPublishedAt] = useState<string | null>(post?.published_at ?? null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickRef = useRef<((image: PickedImage) => void) | null>(null);
  const openPicker = useCallback((onPick: (image: PickedImage) => void) => {
    pickRef.current = onPick;
    setPickerOpen(true);
  }, []);
  /** Unsaved work found in this browser from an earlier session. */
  const [recovery, setRecovery] = useState<{
    at: number;
    meta: Meta;
    bodies: { body_vi: string; body_en: string };
  } | null>(null);
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
  // On phones/tablets the panel overlays the page, so start with it closed.
  const isNarrow = () => typeof window !== "undefined" && window.innerWidth < 1024;
  useEffect(() => {
    if (isNarrow()) setPanelOpen(false);
  }, []);
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

  const live = isLive({ status: meta.status, published_at: publishedAt });
  const scheduled = meta.status === "scheduled" && !live;

  const save = useMutation({
    mutationFn: ({ status, publishAt }: { status: PostStatus; publishAt?: string | undefined }) =>
      savePost({
        data: { ...meta, ...bodies, status, ...(publishAt ? { publish_at: publishAt } : {}) },
      }),
    onSuccess: async (res, { status }) => {
      const next = { ...meta, id: res.id, slug: res.slug, status };
      setMeta(next);
      setPublishedAt(res.publishedAt);
      savedSnapshot.current = JSON.stringify({ ...next, ...bodies });
      try {
        localStorage.removeItem(draftKey(meta.id));
        localStorage.removeItem(draftKey(undefined));
      } catch {
        /* ignore */
      }
      await qc.invalidateQueries({ queryKey: ["posts", "all"] });
      await qc.invalidateQueries({ queryKey: ["revisions", res.id] });
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
          published_at: res.publishedAt,
          created_at: now,
          updated_at: now,
          author_id: null,
          category_id: next.category_id,
          tags: next.tags.length ? JSON.stringify(next.tags) : null,
          seo_title_vi: next.seo_title_vi || null,
          seo_title_en: next.seo_title_en || null,
          seo_desc_vi: next.seo_desc_vi || null,
          seo_desc_en: next.seo_desc_en || null,
          og_image: next.og_image || null,
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

  // Autosave to this browser every couple of seconds while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(meta.id), JSON.stringify({ at: Date.now(), meta, bodies }));
      } catch {
        /* storage full or blocked: the warning on leave still protects the work */
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [dirty, meta, bodies]);

  // Offer to restore unsaved work left in this browser (newer than the saved post).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(post?.id));
      if (!raw) return;
      const draft = JSON.parse(raw) as NonNullable<typeof recovery>;
      const savedAt = post ? Date.parse(post.updated_at) : 0;
      const differs = JSON.stringify({ ...draft.meta, ...draft.bodies }) !== savedSnapshot.current;
      if (draft.at > savedAt && differs) setRecovery(draft);
      else localStorage.removeItem(draftKey(post?.id));
    } catch {
      /* ignore unreadable drafts */
    }
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Load a saved state (revision or browser draft) into the editor. */
  const loadState = (m: Meta, b: { body_vi: string; body_en: string }) => {
    setMeta((cur) => {
      const { id: _draftId, ...rest } = m;
      return { ...rest, ...(cur.id ? { id: cur.id } : {}), status: cur.status };
    });
    setHist((h) => ({
      past: [...h.past.slice(-99), h.present],
      present: { vi: parseBody(b.body_vi), en: parseBody(b.body_en) },
      future: [],
      key: null,
      at: Date.now(),
    }));
    setSelectedId(null);
  };

  const restoreRevision = (data: PostInput & { slug: string }) =>
    loadState(
      {
        ...meta,
        slug: data.slug,
        title_vi: data.title_vi,
        title_en: data.title_en,
        excerpt_vi: data.excerpt_vi ?? "",
        excerpt_en: data.excerpt_en ?? "",
        cover_url: data.cover_url ?? "",
        category_id: data.category_id ?? null,
        tags: data.tags ?? [],
        seo_title_vi: data.seo_title_vi ?? "",
        seo_title_en: data.seo_title_en ?? "",
        seo_desc_vi: data.seo_desc_vi ?? "",
        seo_desc_en: data.seo_desc_en ?? "",
        og_image: data.og_image ?? "",
      },
      { body_vi: data.body_vi ?? "", body_en: data.body_en ?? "" },
    );

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
    if (isNarrow()) setPanelOpen(false);
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
    save: () =>
      !missingTitle &&
      !save.isPending &&
      save.mutate(
        scheduled
          ? { status: "scheduled", publishAt: publishedAt ?? undefined }
          : { status: live ? "published" : "draft" },
      ),
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

  const dropLine = <div className="pointer-events-none my-1 h-1 rounded-full bg-admin-blue" />;

  return (
    <MediaPickerContext.Provider value={openPicker}>
      <div className="fixed inset-0 z-50 flex flex-col bg-admin-canvas text-admin-ink">
        <InlineToolbar />
        <MediaPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={(image) => pickRef.current?.(image)}
        />
        <ScheduleDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          current={scheduled ? publishedAt : null}
          onSchedule={(iso) => save.mutate({ status: "scheduled", publishAt: iso })}
        />

        {/* ------------------------------------------------ top bar */}
        <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-admin-line bg-white px-2 sm:gap-2 sm:px-3">
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
            <PostStatusBadge status={meta.status} publishedAt={publishedAt} />
          </div>

          <div className="mx-auto flex items-center gap-2">
            <div className="flex rounded-lg bg-admin-canvas p-1" role="group" aria-label="Ngôn ngữ">
              {(["vi", "en"] as Lang[]).map((l) => {
                const name = l === "vi" ? "Tiếng Việt" : "English";
                const score = scores[l].overall;
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={lang === l}
                    aria-label={`${name}, điểm AEO/GEO ${score}/100`}
                    title={`${name}: AEO/GEO ${score}/100`}
                    onClick={() => {
                      setLang(l);
                      setSelectedId(null);
                      setAnchorId(null);
                    }}
                    className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold md:px-3 md:font-medium ${
                      lang === l
                        ? "bg-white text-admin-ink shadow-sm"
                        : "text-admin-muted hover:text-admin-ink"
                    }`}
                  >
                    {/* Mobile: language code + score-coloured dot; wider: full name + score. */}
                    <span className="md:hidden">{l.toUpperCase()}</span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full md:hidden ${scoreTone(score).bar}`}
                    />
                    <span className="hidden md:inline">{name}</span>
                    <span className="hidden md:inline-flex">
                      <ScoreChip score={score} />
                    </span>
                  </button>
                );
              })}
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
            className="admin-btn admin-btn-secondary h-9 w-9 px-0 sm:w-auto sm:px-3"
            disabled={save.isPending || missingTitle}
            onClick={() => save.mutate({ status: "draft" })}
            aria-label={live ? "Gỡ về nháp" : scheduled ? "Hủy lịch, về nháp" : "Lưu nháp"}
            title={live ? "Gỡ về nháp" : scheduled ? "Hủy lịch, về nháp" : "Lưu nháp (Ctrl+S)"}
          >
            <Save className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">
              {live ? "Gỡ về nháp" : scheduled ? "Hủy lịch" : "Lưu nháp"}
            </span>
          </button>
          <div className="flex">
            <button
              type="button"
              className="admin-btn admin-btn-primary h-9 rounded-r-none px-3"
              disabled={save.isPending || missingTitle}
              onClick={() =>
                save.mutate(
                  scheduled
                    ? { status: "scheduled", publishAt: publishedAt ?? undefined }
                    : { status: "published" },
                )
              }
            >
              {save.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : live ? (
                "Cập nhật"
              ) : scheduled ? (
                "Lưu lịch"
              ) : (
                "Đăng bài"
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="admin-btn admin-btn-primary h-9 rounded-l-none border-l border-white/25 px-2"
                disabled={save.isPending || missingTitle}
                aria-label="Tùy chọn đăng bài"
              >
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[70] w-56">
                {!live && (
                  <DropdownMenuItem onSelect={() => save.mutate({ status: "published" })}>
                    Đăng ngay
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => setScheduleOpen(true)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {scheduled ? "Đổi giờ đăng…" : live ? "Gỡ và hẹn giờ đăng lại…" : "Hẹn giờ đăng…"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* ---------------------------------------------- left panel */}
          {panelOpen && !preview && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                aria-hidden="true"
                onClick={() => setPanelOpen(false)}
              />
              <aside className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75dvh] flex-col rounded-t-2xl bg-white shadow-2xl lg:static lg:z-auto lg:max-h-none lg:w-[320px] lg:rounded-none lg:border-r lg:border-admin-line lg:shadow-none">
                <div className="relative flex h-9 shrink-0 items-center justify-center lg:hidden">
                  <span className="h-1 w-10 rounded-full bg-admin-field" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    aria-label="Đóng bảng"
                    className="absolute right-2 top-1 rounded-md p-1.5 text-admin-muted hover:bg-admin-row"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex shrink-0 border-b border-admin-line" role="tablist">
                  {(
                    [
                      ["blocks", "Khối"],
                      ["post", "Bài viết"],
                      ["score", "AEO/GEO"],
                      ...(meta.id ? ([["history", "Lịch sử"]] as const) : []),
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
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-3">
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
                      <AiWriterPanel
                        lang={lang}
                        current={{
                          title,
                          excerpt,
                          seoTitle: lang === "vi" ? meta.seo_title_vi : meta.seo_title_en,
                          seoDesc: lang === "vi" ? meta.seo_desc_vi : meta.seo_desc_en,
                          body: serializeBody(blocks),
                        }}
                        otherHasContent={
                          hist.present[otherLang].length > 0 ||
                          !!(otherLang === "vi" ? meta.title_vi : meta.title_en).trim()
                        }
                        hasBlocks={blocks.length > 0}
                        onTranslated={(to, res) => {
                          setMeta((m) => ({
                            ...m,
                            [`title_${to}`]: res.title,
                            [`excerpt_${to}`]: res.excerpt,
                            [`seo_title_${to}`]: res.seoTitle,
                            [`seo_desc_${to}`]: res.seoDesc,
                          }));
                          setHist((h) => ({
                            past: [...h.past.slice(-99), h.present],
                            present: { ...h.present, [to]: parseBody(res.body) },
                            future: [],
                            key: null,
                            at: Date.now(),
                          }));
                        }}
                        onOutline={(res, append) => {
                          const drafted = parseBody(res.body);
                          commit((bs) => (append ? [...bs, ...drafted] : drafted));
                          setMeta((m) => ({
                            ...m,
                            ...(!excerpt.trim() ? { [`excerpt_${lang}`]: res.excerpt } : {}),
                            ...(!(lang === "vi" ? m.seo_title_vi : m.seo_title_en).trim()
                              ? { [`seo_title_${lang}`]: res.seoTitle }
                              : {}),
                          }));
                        }}
                      />
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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary flex-1"
                          onClick={() =>
                            openPicker(({ url }) => setMeta((m) => ({ ...m, cover_url: url })))
                          }
                        >
                          <Images className="h-4 w-4" /> Chọn từ thư viện
                        </button>
                        {meta.cover_url && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => setMeta((m) => ({ ...m, cover_url: "" }))}
                          >
                            Bỏ ảnh
                          </button>
                        )}
                      </div>
                      {safeUrl(meta.cover_url) && (
                        <img
                          src={safeUrl(meta.cover_url)}
                          alt=""
                          className="aspect-video w-full rounded-lg border border-admin-line object-cover"
                        />
                      )}
                      <div className="grid min-w-0 gap-3 border-t border-admin-line pt-5">
                        <h4 className="text-xs font-semibold text-admin-dim">Phân loại</h4>
                        <label className="admin-label">
                          Danh mục
                          <select
                            className="admin-input"
                            value={meta.category_id ?? ""}
                            onChange={(e) =>
                              setMeta((m) => ({
                                ...m,
                                category_id: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                          >
                            <option value="">Chưa phân loại</option>
                            {(categories.data ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name_vi} / {c.name_en}
                              </option>
                            ))}
                          </select>
                          <span className="admin-hint">
                            Thêm hoặc sửa danh mục ở trang Tin tức, nút "Danh mục".
                          </span>
                        </label>
                        <div className="admin-label">
                          Thẻ
                          <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-admin-field bg-white p-1.5">
                            {meta.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-md bg-admin-row px-2 py-0.5 text-xs font-medium text-admin-text"
                              >
                                {tag}
                                <button
                                  type="button"
                                  aria-label={`Bỏ thẻ ${tag}`}
                                  className="text-admin-dim hover:text-[#b42318]"
                                  onClick={() =>
                                    setMeta((m) => ({
                                      ...m,
                                      tags: m.tags.filter((t) => t !== tag),
                                    }))
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              value={tagDraft}
                              onChange={(e) => setTagDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" && e.key !== ",") return;
                                e.preventDefault();
                                const tag = tagDraft.trim().replace(/,$/, "");
                                if (tag && !meta.tags.includes(tag) && meta.tags.length < 12)
                                  setMeta((m) => ({ ...m, tags: [...m.tags, tag.slice(0, 40)] }));
                                setTagDraft("");
                              }}
                              placeholder={meta.tags.length ? "" : "Robusta, giá cà phê…"}
                              aria-label="Thêm thẻ"
                              className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none"
                            />
                          </div>
                          <span className="admin-hint">
                            Nhấn Enter hoặc dấu phẩy để thêm thẻ. Tối đa 12 thẻ.
                          </span>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-3 border-t border-admin-line pt-5">
                        <h4 className="text-xs font-semibold text-admin-dim">
                          SEO ({lang === "vi" ? "Tiếng Việt" : "English"})
                        </h4>
                        {(() => {
                          const seoTitle = lang === "vi" ? meta.seo_title_vi : meta.seo_title_en;
                          const seoDesc = lang === "vi" ? meta.seo_desc_vi : meta.seo_desc_en;
                          const shownTitle = seoTitle || title || "Tiêu đề bài viết";
                          const shownDesc =
                            seoDesc || excerpt || "Mô tả bài viết hiện trên Google.";
                          return (
                            <>
                              <label className="admin-label">
                                Tiêu đề SEO
                                <input
                                  className="admin-input"
                                  value={seoTitle}
                                  maxLength={120}
                                  placeholder={title || "Để trống để dùng tiêu đề bài viết"}
                                  onChange={(e) =>
                                    setMeta((m) => ({
                                      ...m,
                                      [`seo_title_${lang}`]: e.target.value,
                                    }))
                                  }
                                />
                                <span
                                  className={`admin-hint ${shownTitle.length > 60 ? "text-[#b54708]" : ""}`}
                                >
                                  {shownTitle.length}/60 ký tự. Để trống thì dùng tiêu đề bài viết.
                                </span>
                              </label>
                              <label className="admin-label">
                                Mô tả SEO
                                <textarea
                                  rows={3}
                                  className="admin-input"
                                  value={seoDesc}
                                  maxLength={320}
                                  placeholder={excerpt || "Để trống để dùng phần tóm tắt"}
                                  onChange={(e) =>
                                    setMeta((m) => ({ ...m, [`seo_desc_${lang}`]: e.target.value }))
                                  }
                                />
                                <span
                                  className={`admin-hint ${shownDesc.length > 160 || shownDesc.length < 110 ? "text-[#b54708]" : ""}`}
                                >
                                  {shownDesc.length} ký tự, nên 110–160. Để trống thì dùng phần tóm
                                  tắt.
                                </span>
                              </label>
                              <div
                                className="min-w-0 rounded-lg border border-admin-line p-3"
                                aria-label="Xem trước trên Google"
                              >
                                <p className="mb-1 text-[11px] text-admin-dim">
                                  Xem trước trên Google
                                </p>
                                <p className="truncate text-xs text-[#4d5156]">
                                  {typeof window !== "undefined" ? window.location.host : ""}/news/
                                  {meta.slug || "duong-dan-bai-viet"}
                                </p>
                                <p className="line-clamp-1 text-[17px] leading-snug text-[#1a0dab]">
                                  {shownTitle}
                                </p>
                                <p className="line-clamp-2 text-[13px] leading-snug text-[#4d5156]">
                                  {shownDesc}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                        <div className="admin-label">
                          Ảnh chia sẻ mạng xã hội
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary flex-1"
                              onClick={() =>
                                openPicker(({ url }) => setMeta((m) => ({ ...m, og_image: url })))
                              }
                            >
                              <Images className="h-4 w-4" />{" "}
                              {meta.og_image ? "Đổi ảnh" : "Chọn ảnh riêng"}
                            </button>
                            {meta.og_image && (
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setMeta((m) => ({ ...m, og_image: "" }))}
                              >
                                Dùng ảnh bìa
                              </button>
                            )}
                          </div>
                          {safeUrl(meta.og_image) && (
                            <img
                              src={safeUrl(meta.og_image)}
                              alt=""
                              className="aspect-[1.91/1] w-full rounded-lg border border-admin-line object-cover"
                            />
                          )}
                          <span className="admin-hint">
                            Hiện khi chia sẻ link lên Facebook, Zalo, LinkedIn. Mặc định dùng ảnh
                            bìa; tỉ lệ đẹp nhất 1200×630.
                          </span>
                        </div>
                      </div>

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
                          Chép toàn bộ khối sang bản đang mở để dịch, giữ nguyên ảnh và cách trình
                          bày.
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

                  {panel === "history" && meta.id && (
                    <RevisionsPanel postId={meta.id} onRestore={restoreRevision} />
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
            </>
          )}

          {/* ----------------------------------------------------- canvas */}
          <main
            className="min-w-0 flex-1 overflow-y-auto overscroll-contain pb-20 md:px-8 md:py-6 lg:pb-6"
            onMouseDown={(e) => {
              if (!(e.target as HTMLElement).closest("[data-block-id]")) setSelectedId(null);
            }}
          >
            {recovery && (
              <div
                className={`mx-auto mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-sm text-[#b54708] ${DEVICE_WIDTH[device]}`}
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span className="flex-1">
                  Có bản đang soạn dở chưa lưu trên trình duyệt này (lúc{" "}
                  {new Date(recovery.at).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  ).
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary h-8 px-3"
                  onClick={() => {
                    loadState(recovery.meta, recovery.bodies);
                    setRecovery(null);
                  }}
                >
                  Khôi phục
                </button>
                <button
                  type="button"
                  className="text-sm font-medium hover:underline"
                  onClick={() => {
                    try {
                      localStorage.removeItem(draftKey(meta.id));
                    } catch {
                      /* ignore */
                    }
                    setRecovery(null);
                  }}
                >
                  Bỏ qua
                </button>
              </div>
            )}
            <div
              className={`@container mx-auto overflow-hidden bg-white md:rounded-lg md:shadow-[0_1px_3px_rgba(16,24,40,0.1)] transition-[max-width] duration-300 ${DEVICE_WIDTH[device]}`}
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
                      <h1 className="mb-5 text-3xl font-bold leading-tight @xl:text-5xl">
                        {title}
                      </h1>
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
                      onClick={() =>
                        openPicker(({ url }) => setMeta((m) => ({ ...m, cover_url: url })))
                      }
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
                  className="mx-auto max-w-3xl px-5 py-6 text-lg text-gray-700 @xl:px-6 @xl:py-12 [&>div:first-of-type>[data-block-id]]:mt-0"
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
                                ? "hidden lg:flex"
                                : "hidden lg:group-hover/block:flex lg:group-hover/block:bg-[#84adff]"
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
                            <div className="absolute -top-[34px] right-[-6px] z-10 hidden items-center gap-0.5 rounded-t-md bg-admin-blue p-0.5 text-white lg:flex">
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

          {!preview && !panelOpen && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-admin-line bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
              {selected ? (
                <div className="flex items-center gap-1">
                  <span className="mr-auto flex min-w-0 items-center gap-1.5 text-sm font-semibold text-admin-ink">
                    {(() => {
                      const Icon = widgetOf(selected.type).icon;
                      return <Icon className="h-4 w-4 shrink-0 text-admin-blue" />;
                    })()}
                    <span className="truncate">{widgetOf(selected.type).label}</span>
                  </span>
                  {(() => {
                    const i = blocks.findIndex((b) => b.id === selected.id);
                    return [
                      {
                        icon: ArrowUp,
                        label: "Lên trên",
                        onClick: () => moveBlock(selected.id, i - 1),
                        disabled: i === 0,
                      },
                      {
                        icon: ArrowDown,
                        label: "Xuống dưới",
                        onClick: () => moveBlock(selected.id, i + 2),
                        disabled: i === blocks.length - 1,
                      },
                      {
                        icon: Copy,
                        label: "Nhân bản",
                        onClick: () => duplicateBlock(selected.id),
                        disabled: false,
                      },
                      {
                        icon: Trash2,
                        label: "Xóa",
                        onClick: () => deleteBlock(selected.id),
                        disabled: false,
                      },
                    ].map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        aria-label={a.label}
                        title={a.label}
                        disabled={a.disabled}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={a.onClick}
                        className="flex h-10 w-9 items-center justify-center rounded-lg text-admin-text active:bg-admin-row disabled:opacity-35"
                      >
                        <a.icon className="h-[18px] w-[18px]" />
                      </button>
                    ));
                  })()}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setPanel("blocks");
                      setPanelOpen(true);
                    }}
                    className="admin-btn admin-btn-primary ml-1 h-10 px-3"
                  >
                    <Settings2 className="h-4 w-4" /> Tùy chỉnh
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPanel("blocks");
                      setPanelOpen(true);
                    }}
                    className="admin-btn admin-btn-primary h-10 flex-1"
                  >
                    <Plus className="h-4 w-4" /> Thêm khối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel("post");
                      setPanelOpen(true);
                    }}
                    className="admin-btn admin-btn-secondary h-10"
                  >
                    Bài viết
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel("score");
                      setPanelOpen(true);
                    }}
                    className="admin-btn admin-btn-secondary h-10 gap-1.5"
                  >
                    AEO <ScoreChip score={scores[lang].overall} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MediaPickerContext.Provider>
  );
}
