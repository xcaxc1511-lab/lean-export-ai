import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Copy,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import {
  safeUrl,
  youtubeId,
  type Block,
  type BlockOf,
  type Space,
  type TextColor,
} from "@/lib/blocks";
import { widgetOf } from "./catalog";

/* ------------------------------------------------------------ controls */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-admin-line px-4 py-4">
      <h4 className="mb-3 text-xs font-semibold text-admin-dim">{title}</h4>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="admin-label">
      {label}
      {children}
      {hint && <span className="admin-hint">{hint}</span>}
    </label>
  );
}

/** Segmented control (Elementor's "choose" control). */
function Choice<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="admin-label">
      {label}
      <div className="flex rounded-lg bg-admin-canvas p-1" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            title={o.title}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-xs font-medium transition-colors ${
              value === o.value
                ? "bg-white text-admin-ink shadow-sm"
                : "text-admin-muted hover:text-admin-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  label,
  count,
  min,
  max,
  onAdd,
  onRemove,
}: {
  label: string;
  count: number;
  min: number;
  max: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-admin-text">{label}</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          className="admin-icon-btn h-8 w-8"
          disabled={count <= min}
          onClick={onRemove}
          aria-label={`Bớt ${label.toLowerCase()}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{count}</span>
        <button
          type="button"
          className="admin-icon-btn h-8 w-8"
          disabled={count >= max}
          onClick={onAdd}
          aria-label={`Thêm ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

const ALIGN_OPTIONS = [
  { value: "left" as const, label: <AlignLeft className="h-4 w-4" />, title: "Căn trái" },
  { value: "center" as const, label: <AlignCenter className="h-4 w-4" />, title: "Căn giữa" },
  { value: "right" as const, label: <AlignRight className="h-4 w-4" />, title: "Căn phải" },
];

const SPACE_OPTIONS: { value: Space; label: string }[] = [
  { value: "none", label: "0" },
  { value: "sm", label: "Nhỏ" },
  { value: "md", label: "Vừa" },
  { value: "lg", label: "Lớn" },
];

const COLOR_OPTIONS: { value: TextColor; label: ReactNode; title: string }[] = [
  { value: "default", label: "Mặc định", title: "Màu chữ mặc định" },
  { value: "ink", label: <span className="h-4 w-4 rounded-full bg-ld-navy" />, title: "Navy" },
  {
    value: "gold",
    label: <span className="h-4 w-4 rounded-full bg-ld-gold-dark" />,
    title: "Vàng",
  },
  { value: "muted", label: <span className="h-4 w-4 rounded-full bg-gray-400" />, title: "Xám" },
];

/* ------------------------------------------------------------- panel */

export function BlockSettings({
  block: b,
  onChange,
  onDuplicate,
  onDelete,
  onClose,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const set = onChange as (patch: Partial<typeof b>) => void;
  const widget = widgetOf(b.type);
  const defaultSpace: Space = b.type === "heading" ? "sm" : "md";

  const content = (() => {
    switch (b.type) {
      case "heading":
        return (
          <>
            <Choice
              label="Cấp tiêu đề"
              value={b.level}
              options={[
                { value: 2, label: "H2 · Mục lớn" },
                { value: 3, label: "H3 · Mục nhỏ" },
              ]}
              onChange={(level) => set({ level })}
            />
            <p className="admin-hint">
              Mẹo AEO: đặt tiêu đề dạng câu hỏi khách hay hỏi, ví dụ “Giá Robusta hôm nay là bao
              nhiêu?”.
            </p>
          </>
        );
      case "paragraph":
        return (
          <p className="admin-hint">
            Gõ trực tiếp trên trang. Bôi đen chữ để in đậm, nghiêng, gạch chân hoặc gắn link. Enter
            tạo đoạn mới, Shift+Enter xuống dòng.
          </p>
        );
      case "list":
        return (
          <Choice
            label="Kiểu danh sách"
            value={b.ordered}
            options={[
              { value: false, label: "• Gạch đầu dòng" },
              { value: true, label: "1. Đánh số" },
            ]}
            onChange={(ordered) => set({ ordered })}
          />
        );
      case "image":
      case "media-text":
        return (
          <>
            <Field label="Link ảnh" hint="Dán link ảnh https://…">
              <input
                className="admin-input"
                value={b.url}
                placeholder="https://…"
                onChange={(e) => set({ url: e.target.value })}
              />
            </Field>
            {safeUrl(b.url) && (
              <img
                src={safeUrl(b.url)}
                alt=""
                className="aspect-video w-full rounded-lg border border-admin-line object-cover"
              />
            )}
            <Field
              label="Mô tả ảnh (alt)"
              hint="Mô tả nội dung ảnh cho Google và AI, ví dụ “Bao cà phê Robusta S18 tại kho Gia Lai”."
            >
              <input
                className="admin-input"
                value={b.alt}
                onChange={(e) => set({ alt: e.target.value })}
              />
            </Field>
            {b.type === "image" ? (
              <Choice
                label="Độ rộng"
                value={b.width ?? "full"}
                options={[
                  { value: "full", label: "100%" },
                  { value: "wide", label: "85%" },
                  { value: "medium", label: "66%" },
                  { value: "small", label: "50%" },
                ]}
                onChange={(width) => set({ width })}
              />
            ) : (
              <Choice
                label="Vị trí ảnh"
                value={b.side}
                options={[
                  { value: "left", label: "Ảnh bên trái" },
                  { value: "right", label: "Ảnh bên phải" },
                ]}
                onChange={(side) => set({ side })}
              />
            )}
          </>
        );
      case "quote":
        return (
          <Field label="Nguồn trích dẫn">
            <input
              className="admin-input"
              value={b.cite ?? ""}
              placeholder="VD: Ông Nguyễn Văn A, Giám đốc Lean Export"
              onChange={(e) => set({ cite: e.target.value })}
            />
          </Field>
        );
      case "button":
        return (
          <>
            <Field label="Chữ trên nút">
              <input
                className="admin-input"
                value={b.label}
                onChange={(e) => set({ label: e.target.value })}
              />
            </Field>
            <Field label="Link" hint="Trang trong web (VD: /get-free-quote) hoặc https://…">
              <input
                className="admin-input"
                value={b.url}
                onChange={(e) => set({ url: e.target.value })}
              />
            </Field>
            <Choice
              label="Kiểu nút"
              value={b.variant}
              options={[
                { value: "primary", label: "Vàng" },
                { value: "dark", label: "Navy" },
                { value: "outline", label: "Viền" },
              ]}
              onChange={(variant) => set({ variant })}
            />
          </>
        );
      case "video":
        return (
          <>
            <Field
              label="Link YouTube"
              hint={b.url && !youtubeId(b.url) ? "Link chưa đúng định dạng YouTube." : undefined}
            >
              <input
                className="admin-input"
                value={b.url}
                placeholder="https://www.youtube.com/watch?v=…"
                onChange={(e) => set({ url: e.target.value })}
              />
            </Field>
          </>
        );
      case "table": {
        const cols = b.rows[0]?.length ?? 0;
        return (
          <>
            <Stepper
              label="Số hàng"
              count={b.rows.length}
              min={1}
              max={30}
              onAdd={() =>
                set({ rows: [...b.rows, Array(cols).fill("")] } as Partial<BlockOf<"table">>)
              }
              onRemove={() => set({ rows: b.rows.slice(0, -1) } as Partial<BlockOf<"table">>)}
            />
            <Stepper
              label="Số cột"
              count={cols}
              min={1}
              max={6}
              onAdd={() =>
                set({ rows: b.rows.map((r) => [...r, ""]) } as Partial<BlockOf<"table">>)
              }
              onRemove={() =>
                set({ rows: b.rows.map((r) => r.slice(0, -1)) } as Partial<BlockOf<"table">>)
              }
            />
            <Choice
              label="Hàng đầu là tiêu đề cột"
              value={b.header}
              options={[
                { value: true, label: "Có" },
                { value: false, label: "Không" },
              ]}
              onChange={(header) => set({ header })}
            />
          </>
        );
      }
      case "callout":
        return (
          <Choice
            label="Kiểu hộp"
            value={b.tone}
            options={[
              { value: "tip", label: "💡 Mẹo" },
              { value: "info", label: "ℹ️ Thông tin" },
              { value: "warning", label: "⚠️ Lưu ý" },
            ]}
            onChange={(tone) => set({ tone })}
          />
        );
      case "stats":
        return (
          <>
            <Stepper
              label="Số ô"
              count={b.items.length}
              min={1}
              max={4}
              onAdd={() =>
                set({ items: [...b.items, { value: "", label: "" }] } as Partial<BlockOf<"stats">>)
              }
              onRemove={() => set({ items: b.items.slice(0, -1) } as Partial<BlockOf<"stats">>)}
            />
            <p className="admin-hint">
              Mẹo GEO: dùng số có đơn vị (USD/tấn, %, tấn/năm…). AI ưu tiên trích nguồn có số liệu
              cụ thể.
            </p>
          </>
        );
      case "faq":
        return (
          <>
            <Stepper
              label="Số câu hỏi"
              count={b.items.length}
              min={1}
              max={20}
              onAdd={() =>
                set({ items: [...b.items, { q: "", a: [] }] } as Partial<BlockOf<"faq">>)
              }
              onRemove={() => set({ items: b.items.slice(0, -1) } as Partial<BlockOf<"faq">>)}
            />
            <p className="admin-hint">
              Website tự tạo dữ liệu FAQ (schema) cho Google từ khối này. Nên có từ 3 câu hỏi.
            </p>
          </>
        );
      case "divider":
        return (
          <Choice
            label="Kiểu"
            value={b.style}
            options={[
              { value: "line", label: "Đường kẻ" },
              { value: "space", label: "Khoảng trống" },
            ]}
            onChange={(style) => set({ style })}
          />
        );
    }
  })();

  const hasColor = b.type === "heading" || b.type === "paragraph";
  const hasAlign =
    b.type !== "list" && b.type !== "table" && b.type !== "faq" && b.type !== "divider";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-admin-line px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          className="admin-icon-btn h-8 w-8 border-0"
          aria-label="Về danh sách khối"
          title="Về danh sách khối"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <widget.icon className="h-4 w-4 text-admin-blue" />
        <span className="font-semibold text-admin-ink">{widget.label}</span>
        <span className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="admin-icon-btn h-8 w-8"
            aria-label="Nhân bản khối"
            title="Nhân bản"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="admin-icon-btn h-8 w-8 text-[#b42318]"
            aria-label="Xóa khối"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section title="Nội dung">{content}</Section>
        <Section title="Kiểu dáng">
          {hasAlign && (
            <Choice
              label="Căn lề"
              value={b.align ?? "left"}
              options={ALIGN_OPTIONS}
              onChange={(align) => onChange({ align })}
            />
          )}
          {hasColor && (
            <Choice
              label="Màu chữ"
              value={(b as BlockOf<"heading">).color ?? "default"}
              options={COLOR_OPTIONS}
              onChange={(color) => set({ color } as Partial<BlockOf<"heading">>)}
            />
          )}
          {b.type === "paragraph" && (
            <Choice
              label="Cỡ chữ"
              value={b.size ?? "md"}
              options={[
                { value: "sm", label: "Nhỏ" },
                { value: "md", label: "Vừa" },
                { value: "lg", label: "Lớn" },
              ]}
              onChange={(size) => set({ size })}
            />
          )}
          <Choice
            label="Khoảng cách bên dưới"
            value={b.space ?? defaultSpace}
            options={SPACE_OPTIONS}
            onChange={(space) => onChange({ space })}
          />
        </Section>
      </div>
    </div>
  );
}
