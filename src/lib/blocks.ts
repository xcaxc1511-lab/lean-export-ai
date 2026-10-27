/**
 * Block-based article format used by the visual (Elementor-style) post editor.
 *
 * A post body is stored as JSON — `{"format":"blocks","v":1,"blocks":[…]}` —
 * in the existing body_vi / body_en columns. Older posts written in Markdown
 * keep working: `parseBody` converts them to blocks on the fly.
 *
 * Inline text is structured (runs of text with marks), never raw HTML, and
 * every renderer escapes text and whitelists URLs, so editor content can't
 * inject markup into the public site.
 */

/* ------------------------------------------------------------------ types */

export interface Run {
  text: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
  s?: boolean;
  href?: string;
}
export type Rich = Run[];

export type Align = "left" | "center" | "right";
export type Space = "none" | "sm" | "md" | "lg";
export type TextColor = "default" | "ink" | "gold" | "muted";

interface Base {
  id: string;
  align?: Align;
  /** Space below the block. */
  space?: Space;
}

export type Block = Base &
  (
    | { type: "heading"; level: 2 | 3; text: Rich; color?: TextColor }
    | { type: "paragraph"; text: Rich; size?: "sm" | "md" | "lg"; color?: TextColor }
    | { type: "list"; ordered: boolean; items: Rich[] }
    | {
        type: "image";
        url: string;
        alt: string;
        caption?: string;
        width?: "full" | "wide" | "medium" | "small";
      }
    | {
        type: "media-text";
        url: string;
        alt: string;
        side: "left" | "right";
        title: Rich;
        text: Rich;
      }
    | { type: "quote"; text: Rich; cite?: string }
    | { type: "button"; label: string; url: string; variant: "primary" | "dark" | "outline" }
    | { type: "video"; url: string; caption?: string }
    | { type: "table"; rows: string[][]; header: boolean }
    | { type: "callout"; tone: "info" | "tip" | "warning"; title: string; text: Rich }
    | { type: "stats"; items: { value: string; label: string }[] }
    | { type: "faq"; title: string; items: { q: string; a: Rich }[] }
    | { type: "divider"; style: "line" | "space" }
  );

export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

export interface BlockDoc {
  format: "blocks";
  v: 1;
  blocks: Block[];
}

/* -------------------------------------------------------------- helpers */

export const newId = () => Math.random().toString(36).slice(2, 10);

export const rich = (text = ""): Rich => (text ? [{ text }] : []);

export const richText = (r: Rich | undefined) => (r ?? []).map((run) => run.text).join("");

export const isRichEmpty = (r: Rich | undefined) => !richText(r).trim();

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) and site-relative URLs survive; anything else becomes "". */
export const safeUrl = (url: string | undefined) => {
  const value = (url ?? "").trim();
  return /^(https?:\/\/|\/(?!\/))/i.test(value) ? value : "";
};

/** YouTube video id from any common YouTube URL. */
export function youtubeId(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i.exec(
      url,
    );
  return m ? m[1]! : null;
}

/* ------------------------------------------------------ default blocks */

export function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: [] };
    case "paragraph":
      return { id, type, text: [] };
    case "list":
      return { id, type, ordered: false, items: [[]] };
    case "image":
      return { id, type, url: "", alt: "", caption: "", width: "full" };
    case "media-text":
      return { id, type, url: "", alt: "", side: "left", title: [], text: [] };
    case "quote":
      return { id, type, text: [], cite: "" };
    case "button":
      return { id, type, label: "Yêu cầu báo giá", url: "/get-free-quote", variant: "primary" };
    case "video":
      return { id, type, url: "", caption: "" };
    case "table":
      return {
        id,
        type,
        header: true,
        rows: [
          ["", ""],
          ["", ""],
        ],
      };
    case "callout":
      return { id, type, tone: "tip", title: "", text: [] };
    case "stats":
      return {
        id,
        type,
        items: [
          { value: "", label: "" },
          { value: "", label: "" },
          { value: "", label: "" },
        ],
      };
    case "faq":
      return { id, type, title: "", items: [{ q: "", a: [] }] };
    case "divider":
      return { id, type, style: "line" };
  }
}

/** Deep copy with fresh ids (for "duplicate" and copying a language layout). */
export function cloneBlock<T extends Block>(block: T): T {
  return { ...(JSON.parse(JSON.stringify(block)) as T), id: newId() };
}

/* -------------------------------------------- stored body ⇄ block list */

export function serializeBody(blocks: Block[]): string {
  if (blocks.length === 0) return "";
  const doc: BlockDoc = { format: "blocks", v: 1, blocks };
  return JSON.stringify(doc);
}

export function isBlockBody(body: string | null | undefined): boolean {
  return !!body && body.trimStart().startsWith('{"format":"blocks"');
}

export function parseBody(body: string | null | undefined): Block[] {
  if (!body?.trim()) return [];
  if (isBlockBody(body)) {
    try {
      const doc = JSON.parse(body) as BlockDoc;
      if (Array.isArray(doc.blocks)) return doc.blocks.filter((b) => b && typeof b === "object");
    } catch {
      /* fall through to Markdown */
    }
  }
  return markdownToBlocks(body);
}

/* ---------------------------------------------- Markdown → blocks (legacy) */

/** Inline Markdown (**b**, *i*, [label](url)) → runs. */
export function markdownInline(source: string): Rich {
  const runs: Rich = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of source.matchAll(pattern)) {
    const index = m.index ?? 0;
    if (index > last) runs.push({ text: source.slice(last, index) });
    if (m[1] !== undefined) runs.push({ text: m[1], b: true });
    else if (m[2] !== undefined) runs.push({ text: m[2], i: true });
    else runs.push({ text: m[3]!, href: m[4]! });
    last = index + m[0].length;
  }
  if (last < source.length) runs.push({ text: source.slice(last) });
  return runs;
}

const BULLET = /^\s*[-*]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const FAQ_HEADING =
  /faq|câu hỏi thường gặp|hỏi đáp|hỏi\s*&\s*đáp|frequently asked|common questions/i;

export function markdownToBlocks(source: string): Block[] {
  const out: Block[] = [];
  const chunks = source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((c) => c.trim());
  let faq: BlockOf<"faq"> | null = null;
  let faqLevel = 0;

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const heading = /^(#{2,3})\s+(.*)$/.exec(chunk);
    if (heading && lines.length === 1) {
      const level = heading[1] === "##" ? 2 : 3;
      const text = heading[2]!.trim();
      if (FAQ_HEADING.test(text)) {
        faq = { id: newId(), type: "faq", title: text, items: [] };
        faqLevel = level;
        out.push(faq);
        continue;
      }
      if (faq && /\?\s*$/.test(text)) {
        faq.items.push({ q: text, a: [] });
        continue;
      }
      if (faq && level <= faqLevel) faq = null;
      out.push({ id: newId(), type: "heading", level, text: markdownInline(text) });
      continue;
    }
    if (faq && faq.items.length) {
      const item = faq.items[faq.items.length - 1]!;
      const text = lines.map((l) => l.replace(BULLET, "").replace(NUMBERED, "")).join(" ");
      item.a = [...item.a, ...(item.a.length ? [{ text: " " }] : []), ...markdownInline(text)];
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(chunk.trim());
    if (image) {
      out.push({ id: newId(), type: "image", url: image[2]!, alt: image[1]!, width: "full" });
      continue;
    }
    if (lines.every((l) => BULLET.test(l)) || lines.every((l) => NUMBERED.test(l))) {
      const ordered = NUMBERED.test(lines[0]!);
      out.push({
        id: newId(),
        type: "list",
        ordered,
        items: lines.map((l) => markdownInline(l.replace(ordered ? NUMBERED : BULLET, ""))),
      });
      continue;
    }
    out.push({ id: newId(), type: "paragraph", text: markdownInline(lines.join("\n")) });
  }
  return out;
}

/* ------------------------------------------- blocks → Markdown (scoring) */

function richToMarkdown(r: Rich | undefined): string {
  return (r ?? [])
    .map((run) => {
      let t = run.text;
      if (!t) return "";
      if (run.b) t = `**${t}**`;
      if (run.i) t = `*${t}*`;
      const href = safeUrl(run.href);
      if (href) t = `[${t}](${href})`;
      return t;
    })
    .join("")
    .replace(/\n+/g, " ");
}

const FAQ_TITLE = { vi: "Câu hỏi thường gặp", en: "Frequently asked questions" };

/**
 * Flatten blocks to the Markdown subset the AEO/GEO scorer and FAQ schema
 * understand, so both work the same for block and legacy posts.
 */
export function blocksToMarkdown(blocks: Block[], lang: "vi" | "en"): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        if (!isRichEmpty(b.text))
          parts.push(`${b.level === 2 ? "##" : "###"} ${richToMarkdown(b.text)}`);
        break;
      case "paragraph":
        if (!isRichEmpty(b.text)) parts.push(richToMarkdown(b.text));
        break;
      case "quote":
        if (!isRichEmpty(b.text))
          parts.push(`${richToMarkdown(b.text)}${b.cite ? ` (${b.cite})` : ""}`);
        break;
      case "callout":
        if (!isRichEmpty(b.text) || b.title)
          parts.push([b.title, richToMarkdown(b.text)].filter(Boolean).join(". "));
        break;
      case "list": {
        const items = b.items.filter((i) => !isRichEmpty(i));
        if (items.length)
          parts.push(
            items.map((i, n) => `${b.ordered ? `${n + 1}.` : "-"} ${richToMarkdown(i)}`).join("\n"),
          );
        break;
      }
      case "image":
        if (safeUrl(b.url)) parts.push(`![${b.alt}](${safeUrl(b.url)})`);
        break;
      case "media-text":
        if (!isRichEmpty(b.title)) parts.push(`### ${richToMarkdown(b.title)}`);
        if (safeUrl(b.url)) parts.push(`![${b.alt}](${safeUrl(b.url)})`);
        if (!isRichEmpty(b.text)) parts.push(richToMarkdown(b.text));
        break;
      case "button":
        if (b.label && safeUrl(b.url)) parts.push(`[${b.label}](${safeUrl(b.url)})`);
        break;
      case "table": {
        const rows = b.rows.filter((r) => r.some((c) => c.trim()));
        if (rows.length) parts.push(rows.map((r) => r.join(", ")).join(". ") + ".");
        break;
      }
      case "stats": {
        const items = b.items.filter((s) => s.value.trim());
        if (items.length) parts.push(items.map((s) => `- ${s.value} ${s.label}`.trim()).join("\n"));
        break;
      }
      case "faq": {
        const items = b.items.filter((i) => i.q.trim());
        if (!items.length) break;
        parts.push(`## ${b.title.trim() || FAQ_TITLE[lang]}`);
        for (const item of items) {
          const q = item.q.trim();
          parts.push(`### ${/\?\s*$/.test(q) ? q : `${q}?`}`);
          if (!isRichEmpty(item.a)) parts.push(richToMarkdown(item.a));
        }
        break;
      }
      case "video":
      case "divider":
        break;
    }
  }
  return parts.join("\n\n");
}

/** Any stored body (blocks JSON or legacy Markdown) as scorer-ready Markdown. */
export function bodyToMarkdown(body: string | null | undefined, lang: "vi" | "en"): string {
  if (!body) return "";
  return isBlockBody(body) ? blocksToMarkdown(parseBody(body), lang) : body;
}

/* ----------------------------------------------------- HTML rendering */

export function richToHtml(r: Rich | undefined): string {
  return (r ?? [])
    .map((run) => {
      let html = escapeHtml(run.text).replace(/\n/g, "<br />");
      if (!html) return "";
      if (run.b) html = `<strong>${html}</strong>`;
      if (run.i) html = `<em>${html}</em>`;
      if (run.u) html = `<u>${html}</u>`;
      if (run.s) html = `<s>${html}</s>`;
      const href = safeUrl(run.href);
      if (href) {
        const external = href.startsWith("http");
        html = `<a href="${escapeHtml(href)}"${
          external ? ' target="_blank" rel="noopener noreferrer"' : ""
        } class="font-semibold text-gray-900 underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">${html}</a>`;
      }
      return html;
    })
    .join("");
}

/* Class maps shared by the public renderer and the editor canvas. */
export const ALIGN_CLASS: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};
export const SPACE_CLASS: Record<Space, string> = {
  none: "mb-0",
  sm: "mb-3",
  md: "mb-6",
  lg: "mb-12",
};
export const COLOR_CLASS: Record<TextColor, string> = {
  default: "",
  ink: "text-ld-navy",
  gold: "text-ld-gold-dark",
  muted: "text-gray-500",
};
export const HEADING_CLASS = {
  2: "text-2xl font-bold leading-snug text-gray-900 md:text-3xl",
  3: "text-xl font-bold leading-snug text-gray-900",
} as const;
export const PARAGRAPH_SIZE = { sm: "text-base", md: "text-lg", lg: "text-xl" } as const;
export const IMAGE_WIDTH = {
  full: "w-full",
  wide: "mx-auto w-full md:w-[85%]",
  medium: "mx-auto w-full md:w-2/3",
  small: "mx-auto w-full md:w-1/2",
} as const;
export const CALLOUT_TONE = {
  info: { box: "border-[#b2ccff] bg-[#eff4ff]", title: "text-[#004eeb]", icon: "ℹ️" },
  tip: { box: "border-ld-gold bg-ld-gold-soft", title: "text-ld-ink", icon: "💡" },
  warning: { box: "border-[#fecdca] bg-[#fef3f2]", title: "text-[#b42318]", icon: "⚠️" },
} as const;
export const BUTTON_CLASS = {
  primary: "btn btn-primary",
  dark: "btn btn-dark",
  outline: "btn btn-outline-dark",
} as const;

const STATS_COLS = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
} as const;

export function blockWrapClass(b: Block): string {
  const defaultSpace: Space = b.type === "heading" ? "sm" : "md";
  const top = b.type === "heading" && b.level === 2 ? "mt-10" : b.type === "heading" ? "mt-8" : "";
  return [top, SPACE_CLASS[b.space ?? defaultSpace], b.align ? ALIGN_CLASS[b.align] : ""]
    .filter(Boolean)
    .join(" ");
}

function renderBlock(b: Block): string {
  switch (b.type) {
    case "heading": {
      if (isRichEmpty(b.text)) return "";
      const tag = b.level === 2 ? "h2" : "h3";
      return `<${tag} class="${HEADING_CLASS[b.level]} ${COLOR_CLASS[b.color ?? "default"]}">${richToHtml(b.text)}</${tag}>`;
    }
    case "paragraph":
      if (isRichEmpty(b.text)) return "";
      return `<p class="leading-relaxed ${PARAGRAPH_SIZE[b.size ?? "md"]} ${COLOR_CLASS[b.color ?? "default"]}">${richToHtml(b.text)}</p>`;
    case "list": {
      const items = b.items.filter((i) => !isRichEmpty(i));
      if (!items.length) return "";
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag} class="${b.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 text-left">${items
        .map((i) => `<li>${richToHtml(i)}</li>`)
        .join("")}</${tag}>`;
    }
    case "image": {
      const src = safeUrl(b.url);
      if (!src) return "";
      return `<figure class="${IMAGE_WIDTH[b.width ?? "full"]}"><img src="${escapeHtml(src)}" alt="${escapeHtml(b.alt)}" loading="lazy" class="w-full rounded-xl" />${
        b.caption
          ? `<figcaption class="mt-2 text-center text-sm text-gray-500">${escapeHtml(b.caption)}</figcaption>`
          : ""
      }</figure>`;
    }
    case "media-text": {
      const src = safeUrl(b.url);
      const image = src
        ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(b.alt)}" loading="lazy" class="w-full rounded-xl object-cover" />`
        : "";
      const text = `<div class="text-left">${
        isRichEmpty(b.title)
          ? ""
          : `<h3 class="${HEADING_CLASS[3]} mb-3">${richToHtml(b.title)}</h3>`
      }${isRichEmpty(b.text) ? "" : `<p class="leading-relaxed">${richToHtml(b.text)}</p>`}</div>`;
      return `<div class="grid items-center gap-6 md:grid-cols-2">${
        b.side === "right" ? text + image : image + text
      }</div>`;
    }
    case "quote":
      if (isRichEmpty(b.text)) return "";
      return `<blockquote class="border-l-4 border-primary pl-5 text-xl italic leading-relaxed text-gray-900"><p>${richToHtml(b.text)}</p>${
        b.cite
          ? `<cite class="mt-3 block text-base not-italic font-semibold text-gray-500">— ${escapeHtml(b.cite)}</cite>`
          : ""
      }</blockquote>`;
    case "button": {
      const href = safeUrl(b.url);
      if (!href || !b.label) return "";
      const external = href.startsWith("http");
      return `<a href="${escapeHtml(href)}" class="${BUTTON_CLASS[b.variant]}"${
        external ? ' target="_blank" rel="noopener noreferrer"' : ""
      }>${escapeHtml(b.label)}</a>`;
    }
    case "video": {
      const id = youtubeId(b.url);
      if (!id) return "";
      return `<figure><div class="aspect-video overflow-hidden rounded-xl bg-black"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${escapeHtml(b.caption || "YouTube video")}" class="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>${
        b.caption
          ? `<figcaption class="mt-2 text-center text-sm text-gray-500">${escapeHtml(b.caption)}</figcaption>`
          : ""
      }</figure>`;
    }
    case "table": {
      const rows = b.rows.filter((r) => r.some((c) => c.trim()));
      if (!rows.length) return "";
      const [head, ...rest] = b.header ? rows : [null, ...rows];
      const cell = (tag: "th" | "td", c: string) =>
        `<${tag} class="border border-gray-200 px-4 py-2.5 text-left${tag === "th" ? " bg-gray-50 font-semibold text-gray-900" : ""}">${escapeHtml(c)}</${tag}>`;
      return `<div class="overflow-x-auto"><table class="w-full border-collapse text-base">${
        head ? `<thead><tr>${head.map((c) => cell("th", c)).join("")}</tr></thead>` : ""
      }<tbody>${rest
        .map((r) => `<tr>${(r ?? []).map((c) => cell("td", c)).join("")}</tr>`)
        .join("")}</tbody></table></div>`;
    }
    case "callout": {
      if (isRichEmpty(b.text) && !b.title) return "";
      const tone = CALLOUT_TONE[b.tone];
      return `<aside class="rounded-xl border-l-4 ${tone.box} p-5 text-left">${
        b.title
          ? `<p class="mb-1 font-bold ${tone.title}">${tone.icon} ${escapeHtml(b.title)}</p>`
          : ""
      }<p class="leading-relaxed">${richToHtml(b.text)}</p></aside>`;
    }
    case "stats": {
      const items = b.items.filter((s) => s.value.trim());
      if (!items.length) return "";
      return `<div class="grid gap-4 ${STATS_COLS[Math.min(items.length, 4) as 1 | 2 | 3 | 4]}">${items
        .map(
          (s) =>
            `<div class="rounded-xl bg-ld-navy p-5 text-center text-white"><p class="text-3xl font-bold text-ld-gold">${escapeHtml(s.value)}</p><p class="mt-1 text-sm text-gray-300">${escapeHtml(s.label)}</p></div>`,
        )
        .join("")}</div>`;
    }
    case "faq": {
      const items = b.items.filter((i) => i.q.trim());
      if (!items.length) return "";
      return `<section class="text-left">${
        b.title ? `<h2 class="${HEADING_CLASS[2]} mb-5">${escapeHtml(b.title)}</h2>` : ""
      }<div class="divide-y divide-gray-200 rounded-xl border border-gray-200">${items
        .map(
          (i) =>
            `<details class="group px-5 py-4"><summary class="cursor-pointer list-none font-semibold text-gray-900">${escapeHtml(i.q)}</summary><p class="mt-3 leading-relaxed">${richToHtml(i.a)}</p></details>`,
        )
        .join("")}</div></section>`;
    }
    case "divider":
      return b.style === "line" ? `<hr class="border-gray-200" />` : `<div class="h-8"></div>`;
  }
}

/** Public HTML for a block list (all text escaped, URLs whitelisted). */
export function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      const inner = renderBlock(b);
      return inner ? `<div class="${blockWrapClass(b)}">${inner}</div>` : "";
    })
    .join("\n");
}
