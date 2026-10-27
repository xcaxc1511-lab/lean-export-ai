import { useState } from "react";
import { ImagePlus, Plus, X, Youtube } from "lucide-react";
import {
  BUTTON_CLASS,
  CALLOUT_TONE,
  COLOR_CLASS,
  HEADING_CLASS,
  IMAGE_WIDTH,
  PARAGRAPH_SIZE,
  safeUrl,
  youtubeId,
  type Block,
  type BlockOf,
  type Rich,
} from "@/lib/blocks";
import { PlainText, RichText } from "./editable";

export interface BlockActions {
  /** Replace this block with a patched copy. */
  update: (patch: Partial<Block>) => void;
  /** Enter in a paragraph: keep `before` here, new paragraph with `after` below. */
  split: (before: Rich, after: Rich) => void;
  /** Backspace in an empty paragraph/heading: delete and focus the previous block. */
  removeEmpty: () => void;
}

export interface FocusRequest {
  at: "start" | "end";
  /** Sub-field index, e.g. a list item. */
  index?: number;
}

interface Props {
  block: Block;
  actions: BlockActions;
  focus: FocusRequest | null;
  onFocused: () => void;
}

/** Inline "paste a link" placeholder for empty media blocks. */
function UrlPlaceholder({
  icon: Icon,
  label,
  hint,
  onSubmit,
}: {
  icon: typeof ImagePlus;
  label: string;
  hint: string;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-admin-field bg-admin-row px-6 py-8 text-center">
      <Icon className="h-8 w-8 text-[#98a2b3]" />
      <p className="text-sm font-medium text-admin-text">{label}</p>
      <form
        className="flex w-full max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onSubmit(url.trim());
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="admin-input flex-1"
          onMouseDown={(e) => e.stopPropagation()}
        />
        <button type="submit" className="admin-btn admin-btn-primary">
          Chèn
        </button>
      </form>
      <p className="text-xs text-admin-dim">{hint}</p>
    </div>
  );
}

function ImagePreview({ url, alt }: { url: string; alt: string }) {
  return safeUrl(url) ? (
    <img
      src={safeUrl(url)}
      alt={alt}
      className="w-full rounded-xl object-cover"
      draggable={false}
    />
  ) : null;
}

export function BlockView({ block: b, actions, focus, onFocused }: Props) {
  const set = actions.update as (patch: Partial<typeof b>) => void;
  const focusAt = (index?: number) =>
    focus && (focus.index ?? 0) === (index ?? 0) ? focus.at : false;

  switch (b.type) {
    case "heading":
      return (
        <RichText
          as={b.level === 2 ? "h2" : "h3"}
          value={b.text}
          onChange={(text) => set({ text })}
          className={`${HEADING_CLASS[b.level]} ${COLOR_CLASS[b.color ?? "default"]}`}
          placeholder={b.level === 2 ? "Tiêu đề mục (H2)" : "Tiêu đề phụ (H3)"}
          singleLine
          onSplit={(before, after) => actions.split(before, after)}
          onBackspaceEmpty={actions.removeEmpty}
          autoFocus={focusAt()}
          onAutoFocused={onFocused}
        />
      );

    case "paragraph":
      return (
        <RichText
          as="p"
          value={b.text}
          onChange={(text) => set({ text })}
          className={`leading-relaxed ${PARAGRAPH_SIZE[b.size ?? "md"]} ${COLOR_CLASS[b.color ?? "default"]}`}
          placeholder="Gõ nội dung… (Enter: đoạn mới, Shift+Enter: xuống dòng)"
          onSplit={actions.split}
          onBackspaceEmpty={actions.removeEmpty}
          autoFocus={focusAt()}
          onAutoFocused={onFocused}
        />
      );

    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      const setItem = (i: number, value: Rich) =>
        set({ items: b.items.map((it, n) => (n === i ? value : it)) } as Partial<BlockOf<"list">>);
      return (
        <Tag className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 text-left`}>
          {b.items.map((item, i) => (
            <RichText
              key={i}
              as="li"
              value={item}
              onChange={(v) => setItem(i, v)}
              placeholder="Mục danh sách"
              singleLine
              onSplit={(before, after) => {
                const items = [...b.items];
                items.splice(i, 1, before, after);
                set({ items } as Partial<BlockOf<"list">>);
                // Focus the new item on the next render.
                setTimeout(() => {
                  const lis = document.querySelectorAll<HTMLElement>(
                    `[data-block-id="${b.id}"] li[data-rich]`,
                  );
                  const el = lis[i + 1];
                  if (el) {
                    el.focus();
                    const r = document.createRange();
                    r.selectNodeContents(el);
                    r.collapse(true);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(r);
                  }
                });
              }}
              onBackspaceEmpty={() => {
                if (b.items.length === 1) return actions.removeEmpty();
                set({ items: b.items.filter((_, n) => n !== i) } as Partial<BlockOf<"list">>);
              }}
              autoFocus={focusAt(i)}
              onAutoFocused={onFocused}
            />
          ))}
        </Tag>
      );
    }

    case "image":
      if (!safeUrl(b.url))
        return (
          <UrlPlaceholder
            icon={ImagePlus}
            label="Dán link ảnh để chèn"
            hint="Ảnh từ Unsplash, Google Drive (link công khai) hoặc website. Nhớ điền Mô tả ảnh ở bảng bên trái."
            onSubmit={(url) => set({ url })}
          />
        );
      return (
        <figure className={IMAGE_WIDTH[b.width ?? "full"]}>
          <ImagePreview url={b.url} alt={b.alt} />
          <PlainText
            as="figcaption"
            value={b.caption ?? ""}
            onChange={(caption) => set({ caption })}
            placeholder="Chú thích ảnh (không bắt buộc)"
            className="mt-2 block text-center text-sm text-gray-500"
          />
        </figure>
      );

    case "media-text": {
      const image = safeUrl(b.url) ? (
        <ImagePreview url={b.url} alt={b.alt} />
      ) : (
        <UrlPlaceholder
          icon={ImagePlus}
          label="Dán link ảnh"
          hint="Ảnh nằm cạnh đoạn chữ."
          onSubmit={(url) => set({ url })}
        />
      );
      const text = (
        <div className="text-left">
          <RichText
            as="h3"
            value={b.title}
            onChange={(title) => set({ title })}
            className={`${HEADING_CLASS[3]} mb-3`}
            placeholder="Tiêu đề"
            singleLine
            autoFocus={focusAt()}
            onAutoFocused={onFocused}
          />
          <RichText
            as="p"
            value={b.text}
            onChange={(text) => set({ text })}
            className="leading-relaxed"
            placeholder="Nội dung bên cạnh ảnh"
          />
        </div>
      );
      return (
        <div className="grid items-center gap-6 @xl:grid-cols-2">
          {b.side === "right" ? (
            <>
              {text}
              {image}
            </>
          ) : (
            <>
              {image}
              {text}
            </>
          )}
        </div>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-4 border-primary pl-5 text-left">
          <RichText
            as="p"
            value={b.text}
            onChange={(text) => set({ text })}
            className="text-xl italic leading-relaxed text-gray-900"
            placeholder="Câu trích dẫn"
            autoFocus={focusAt()}
            onAutoFocused={onFocused}
          />
          <PlainText
            as="cite"
            value={b.cite ?? ""}
            onChange={(cite) => set({ cite })}
            placeholder="— Người nói / nguồn"
            className="mt-3 block text-base font-semibold not-italic text-gray-500"
          />
        </blockquote>
      );

    case "button":
      return (
        <span className={`${BUTTON_CLASS[b.variant]} pointer-events-auto`}>
          <PlainText
            value={b.label}
            onChange={(label) => set({ label })}
            placeholder="Chữ trên nút"
          />
        </span>
      );

    case "video": {
      const id = youtubeId(b.url);
      if (!id)
        return (
          <UrlPlaceholder
            icon={Youtube}
            label="Dán link video YouTube"
            hint="Ví dụ: https://www.youtube.com/watch?v=… hoặc https://youtu.be/…"
            onSubmit={(url) => set({ url })}
          />
        );
      return (
        <figure>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover opacity-80"
              draggable={false}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-20 items-center justify-center rounded-2xl bg-[#ff0000] text-white">
                ▶
              </span>
            </span>
          </div>
          <PlainText
            as="figcaption"
            value={b.caption ?? ""}
            onChange={(caption) => set({ caption })}
            placeholder="Chú thích video (không bắt buộc)"
            className="mt-2 block text-center text-sm text-gray-500"
          />
        </figure>
      );
    }

    case "table": {
      const setCell = (r: number, c: number, v: string) =>
        set({
          rows: b.rows.map((row, ri) =>
            ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row,
          ),
        } as Partial<BlockOf<"table">>);
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => {
                    const head = b.header && r === 0;
                    return (
                      <td
                        key={c}
                        className={`border border-gray-200 px-4 py-2.5 text-left ${head ? "bg-gray-50 font-semibold text-gray-900" : ""}`}
                      >
                        <PlainText
                          value={cell}
                          onChange={(v) => setCell(r, c, v)}
                          placeholder={head ? "Tiêu đề cột" : "…"}
                          className="block min-w-[4rem]"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "callout": {
      const tone = CALLOUT_TONE[b.tone];
      return (
        <aside className={`rounded-xl border-l-4 ${tone.box} p-5 text-left`}>
          <p className={`mb-1 flex gap-1.5 font-bold ${tone.title}`}>
            <span aria-hidden="true">{tone.icon}</span>
            <PlainText
              value={b.title}
              onChange={(title) => set({ title })}
              placeholder="Tiêu đề hộp (VD: Lưu ý cho nhà nhập khẩu)"
              className="flex-1"
            />
          </p>
          <RichText
            as="p"
            value={b.text}
            onChange={(text) => set({ text })}
            className="leading-relaxed"
            placeholder="Nội dung nổi bật"
            autoFocus={focusAt()}
            onAutoFocused={onFocused}
          />
        </aside>
      );
    }

    case "stats":
      return (
        <div className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
          {b.items.map((s, i) => (
            <div key={i} className="rounded-xl bg-ld-navy p-5 text-center text-white">
              <PlainText
                as="p"
                value={s.value}
                onChange={(value) =>
                  set({
                    items: b.items.map((it, n) => (n === i ? { ...it, value } : it)),
                  } as Partial<BlockOf<"stats">>)
                }
                placeholder="4.500 USD"
                className="block text-3xl font-bold text-ld-gold"
              />
              <PlainText
                as="p"
                value={s.label}
                onChange={(label) =>
                  set({
                    items: b.items.map((it, n) => (n === i ? { ...it, label } : it)),
                  } as Partial<BlockOf<"stats">>)
                }
                placeholder="giá FOB / tấn"
                className="mt-1 block text-sm text-gray-300"
              />
            </div>
          ))}
        </div>
      );

    case "faq": {
      const setItem = (i: number, patch: Partial<BlockOf<"faq">["items"][number]>) =>
        set({
          items: b.items.map((it, n) => (n === i ? { ...it, ...patch } : it)),
        } as Partial<BlockOf<"faq">>);
      return (
        <section className="text-left">
          <PlainText
            as="h2"
            value={b.title}
            onChange={(title) => set({ title })}
            placeholder="Câu hỏi thường gặp"
            className={`${HEADING_CLASS[2]} mb-5 block`}
          />
          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
            {b.items.map((item, i) => (
              <div key={i} className="group/faq relative px-5 py-4">
                <PlainText
                  as="p"
                  value={item.q}
                  onChange={(q) => setItem(i, { q })}
                  placeholder="Câu hỏi khách hay hỏi?"
                  className="block pr-8 font-semibold text-gray-900"
                />
                <RichText
                  as="p"
                  value={item.a}
                  onChange={(a) => setItem(i, { a })}
                  placeholder="Câu trả lời ngắn gọn, đi thẳng vào ý"
                  className="mt-2 leading-relaxed"
                />
                {b.items.length > 1 && (
                  <button
                    type="button"
                    aria-label="Xóa câu hỏi"
                    title="Xóa câu hỏi"
                    onClick={() =>
                      set({ items: b.items.filter((_, n) => n !== i) } as Partial<BlockOf<"faq">>)
                    }
                    className="absolute right-3 top-3 hidden rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 group-hover/faq:block"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              set({ items: [...b.items, { q: "", a: [] }] } as Partial<BlockOf<"faq">>)
            }
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-admin-blue hover:underline"
          >
            <Plus className="h-4 w-4" /> Thêm câu hỏi
          </button>
        </section>
      );
    }

    case "divider":
      return b.style === "line" ? (
        <hr className="border-gray-200" />
      ) : (
        <div className="h-8 rounded bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,#f2f4f7_6px,#f2f4f7_12px)]" />
      );
  }
}
