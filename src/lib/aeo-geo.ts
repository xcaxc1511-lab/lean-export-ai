/**
 * AEO / GEO scoring for news posts (pure — runs live in the editor).
 *
 *   AEO (Answer Engine Optimization): how easily Google featured snippets,
 *   AI Overviews and voice assistants can lift a direct answer from the post.
 *   GEO (Generative Engine Optimization): how likely ChatGPT, Perplexity,
 *   Gemini… are to trust and cite the post as a source.
 *
 * Each check earns its full weight when it passes, half when it is close,
 * nothing when it fails; group scores are normalised to 0–100.
 * Thresholds count space-separated words, so Vietnamese (one syllable per
 * "word") gets proportionally higher limits.
 */

import { bodyToMarkdown } from "@/lib/blocks";

export type ScoreLang = "vi" | "en";
export type CheckStatus = "pass" | "warn" | "fail";

export interface ScoreCheck {
  id: string;
  label: string;
  weight: number;
  status: CheckStatus;
  /** What was measured, e.g. "52 từ". */
  detail: string;
  /** How to improve; shown when the check isn't passing. */
  tip: string;
}

export interface GroupScore {
  score: number;
  checks: ScoreCheck[];
}

export interface PostScore {
  overall: number;
  aeo: GroupScore;
  geo: GroupScore;
}

export interface ScoreInput {
  lang: ScoreLang;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  /** Body of the other language — GEO rewards complete bilingual posts. */
  otherBody: string;
}

/* ------------------------------------------------------------- parsing */

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

const BULLET = /^\s*[-*]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

function parseBlocks(source: string): Block[] {
  return source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((b) => b.trim())
    .map((block): Block => {
      const lines = block.split("\n");
      if (lines.every((l) => BULLET.test(l)))
        return { type: "list", ordered: false, items: lines.map((l) => l.replace(BULLET, "")) };
      if (lines.every((l) => NUMBERED.test(l)))
        return { type: "list", ordered: true, items: lines.map((l) => l.replace(NUMBERED, "")) };
      const heading = /^(#{2,3})\s+(.*)$/.exec(block);
      if (heading && lines.length === 1)
        return { type: "heading", level: heading[1] === "##" ? 2 : 3, text: heading[2]!.trim() };
      return { type: "paragraph", text: block };
    });
}

/** Markdown → plain text (images dropped, links keep their label). */
function plain(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const wordCount = (text: string) => (plain(text).match(/\S+/g) ?? []).length;

const sentences = (text: string) =>
  plain(text)
    .split(/(?<=[.!?…])\s+/)
    .filter((s) => /\p{L}/u.test(s));

const isQuestion = (text: string) => /\?\s*$/.test(plain(text));

const FAQ_HEADING =
  /faq|câu hỏi thường gặp|hỏi đáp|hỏi\s*&\s*đáp|frequently asked|common questions/i;

/** Question/answer pairs from the post's FAQ section (also used for FAQPage schema). */
export function extractFaq(body: string): { question: string; answer: string }[] {
  const blocks = parseBlocks(body);
  const start = blocks.findIndex((b) => b.type === "heading" && FAQ_HEADING.test(b.text));
  if (start < 0) return [];
  const sectionLevel = (blocks[start] as { level: 2 | 3 }).level;
  const faqs: { question: string; answer: string }[] = [];
  let current: { question: string; parts: string[] } | null = null;
  const flush = () => {
    if (current && current.parts.length)
      faqs.push({ question: current.question, answer: current.parts.join(" ") });
  };
  for (const block of blocks.slice(start + 1)) {
    if (block.type === "heading") {
      if (isQuestion(block.text)) {
        flush();
        current = { question: plain(block.text), parts: [] };
        continue;
      }
      if (block.level <= sectionLevel) break; // next section
      flush();
      current = null;
      continue;
    }
    if (!current) continue;
    current.parts.push(
      block.type === "list" ? block.items.map(plain).join("; ") : plain(block.text),
    );
  }
  flush();
  return faqs;
}

/* ------------------------------------------------------------ scoring */

/** Coffee-export entities answer engines use to place the post in context. */
const ENTITIES: RegExp[] = [
  /lean export/i,
  /việt nam|vietnam|viet nam/i,
  /robusta/i,
  /arabica/i,
  /excelsa|liberica/i,
  /gia lai|đắk lắk|dak lak|đắk nông|dak nong|lâm đồng|lam dong|tây nguyên|central highlands|sơn la|son la/i,
  /\bfob\b|\bcif\b|\bcfr\b|incoterm/i,
  /eudr|rainforest alliance|4c\b|utz|fairtrade|organic|hữu cơ/i,
  /\bhs code\b|mã hs|ico\b|vicofa/i,
  /screen\s?\d{2}|sàng\s?\d{2}|grade\s?[12]|loại\s?[12]|moisture|độ ẩm/i,
  /container|cont\b|20ft|40ft/i,
];

const STAT =
  /\d[\d.,]*\s*(?:%|phần trăm|percent|tấn|tons?|tonnes?|\bmt\b|kg|ha\b|hecta|usd|us\$|vnd|đồng|triệu|million|tỷ|billion|bao|bags?|containers?|cont\b|°c|năm|years?)|(?:usd|us\$|\$)\s?\d/gi;

const YEAR = /\b20[2-3]\d\b/;

function grade(value: number, pass: (v: number) => boolean, warn: (v: number) => boolean) {
  return pass(value) ? "pass" : warn(value) ? "warn" : "fail";
}

function groupScore(checks: ScoreCheck[]): GroupScore {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce(
    (sum, c) => sum + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0),
    0,
  );
  return { score: total ? Math.round((earned / total) * 100) : 0, checks };
}

export function scorePost(input: ScoreInput): PostScore {
  const vi = input.lang === "vi";
  const k = vi ? 1.4 : 1; // Vietnamese words are single syllables
  const n = (v: number) => Math.round(v * k);
  const words = "từ";

  const blocks = parseBlocks(input.body);
  const headings = blocks.filter(
    (b): b is Extract<Block, { type: "heading" }> => b.type === "heading",
  );
  const lists = blocks.filter((b): b is Extract<Block, { type: "list" }> => b.type === "list");
  const paragraphs = blocks.filter(
    (b): b is Extract<Block, { type: "paragraph" }> => b.type === "paragraph",
  );
  const bodyWords = wordCount(input.body);
  const bodyText = plain(input.body);

  /* ---------------- AEO ---------------- */
  const title = input.title.trim();
  const firstBlock = blocks[0];
  const leadWords = firstBlock?.type === "paragraph" ? wordCount(firstBlock.text) : 0;
  const questionHeadings = headings.filter((h) => isQuestion(h.text)).length;
  const faqCount = extractFaq(input.body).length;
  const listItems = lists.reduce((sum, l) => sum + l.items.length, 0);
  const excerptLen = input.excerpt.trim().length;
  const allSentences = paragraphs.flatMap((p) => sentences(p.text));
  const avgSentence = allSentences.length
    ? allSentences.reduce((sum, s) => sum + wordCount(s), 0) / allSentences.length
    : 0;
  const longParagraphs = paragraphs.filter((p) => wordCount(p.text) > n(120)).length;

  const aeo: ScoreCheck[] = [
    {
      id: "title",
      label: "Tiêu đề rõ, đúng độ dài",
      weight: 10,
      status: grade(
        title.length,
        (v) => v >= 30 && v <= 70,
        (v) => v >= 15 && v <= 90,
      ),
      detail: `${title.length} ký tự`,
      tip: "Giữ tiêu đề 30–70 ký tự, nêu thẳng chủ đề hoặc câu hỏi khách hay tìm, ví dụ: “Giá cà phê Robusta hôm nay là bao nhiêu?”.",
    },
    {
      id: "lead",
      label: "Trả lời ngay ở đoạn mở đầu",
      weight: 20,
      status:
        firstBlock?.type !== "paragraph"
          ? "fail"
          : grade(
              leadWords,
              (v) => v >= n(30) && v <= n(80),
              (v) => v >= n(15) && v <= n(130),
            ),
      detail: firstBlock?.type === "paragraph" ? `${leadWords} ${words}` : "Chưa có đoạn mở đầu",
      tip: `Mở bài bằng một khối Đoạn văn ${n(40)}–${n(60)} ${words} trả lời thẳng câu hỏi chính, đặt ngay đầu bài, trước khối Tiêu đề đầu tiên. Đây là đoạn AI hay trích nguyên văn.`,
    },
    {
      id: "question-headings",
      label: "Tiêu đề phụ dạng câu hỏi",
      weight: 15,
      status: grade(
        questionHeadings,
        (v) => v >= 2,
        (v) => v >= 1,
      ),
      detail: `${questionHeadings} tiêu đề có dấu “?”`,
      tip: "Đặt ít nhất 2 khối Tiêu đề dưới dạng câu hỏi khách thật sự hỏi, ví dụ: “Robusta Việt Nam xuất khẩu theo tiêu chuẩn nào?”.",
    },
    {
      id: "faq",
      label: "Mục Câu hỏi thường gặp (FAQ)",
      weight: 15,
      status: grade(
        faqCount,
        (v) => v >= 3,
        (v) => v >= 1,
      ),
      detail: `${faqCount} cặp hỏi–đáp`,
      tip: "Thêm khối Hỏi đáp (FAQ) với ít nhất 3 câu hỏi, mỗi câu kèm câu trả lời ngắn. Website tự tạo dữ liệu FAQ cho Google từ khối này.",
    },
    {
      id: "lists",
      label: "Danh sách hoặc các bước",
      weight: 10,
      status: grade(
        listItems,
        (v) => v >= 3,
        (v) => v >= 1,
      ),
      detail: `${lists.length} danh sách, ${listItems} mục`,
      tip: "Trình bày thông số, quy trình hay lợi ích bằng khối Danh sách (gạch đầu dòng hoặc đánh số) hay khối Số liệu nổi bật. AI rất hay trích nguyên danh sách.",
    },
    {
      id: "excerpt",
      label: "Tóm tắt (meta description)",
      weight: 15,
      status: grade(
        excerptLen,
        (v) => v >= 110 && v <= 170,
        (v) => v >= 50 && v <= 220,
      ),
      detail: excerptLen ? `${excerptLen} ký tự` : "Chưa có",
      tip: "Viết tóm tắt 110–170 ký tự, chứa từ khóa chính và câu trả lời ngắn gọn nhất.",
    },
    {
      id: "readability",
      label: "Câu ngắn, dễ trích dẫn",
      weight: 15,
      status: !allSentences.length
        ? "fail"
        : longParagraphs > 0
          ? "warn"
          : grade(
              avgSentence,
              (v) => v <= n(22),
              (v) => v <= n(30),
            ),
      detail: allSentences.length
        ? `TB ${Math.round(avgSentence)} ${words}/câu${longParagraphs ? `, ${longParagraphs} đoạn quá dài` : ""}`
        : "Chưa có nội dung",
      tip: `Giữ câu trung bình dưới ${n(22)} ${words} và mỗi đoạn dưới ${n(120)} ${words}. Mỗi đoạn nên nói một ý.`,
    },
  ];

  /* ---------------- GEO ---------------- */
  const stats = (bodyText.match(STAT) ?? []).length;
  // Links only — the lookbehind skips images ("![alt](…)").
  const sourceDomains = new Set(
    [...input.body.matchAll(/(?<!!)\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g)]
      .map((m) => {
        try {
          return new URL(m[1]!).hostname.replace(/^www\./, "");
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );
  const entityHits = ENTITIES.filter((re) => re.test(`${title} ${bodyText}`)).length;
  const h2Count = headings.filter((h) => h.level === 2).length;
  const hasYear = YEAR.test(`${title} ${bodyText}`);
  const images = [...input.body.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)];
  const missingAlt = images.filter((m) => !m[1]!.trim()).length;
  const hasCover = /^(https?:\/\/|\/)/.test(input.coverUrl.trim());
  const otherWords = wordCount(input.otherBody);

  const geo: ScoreCheck[] = [
    {
      id: "stats",
      label: "Số liệu cụ thể",
      weight: 20,
      status: grade(
        stats,
        (v) => v >= 4,
        (v) => v >= 1,
      ),
      detail: `${stats} số liệu có đơn vị`,
      tip: "Đưa số liệu có đơn vị: sản lượng (tấn), giá (USD/tấn), tỷ lệ (%), độ ẩm, cỡ sàng, số container… AI ưu tiên trích nguồn có con số rõ ràng.",
    },
    {
      id: "sources",
      label: "Trích nguồn uy tín",
      weight: 20,
      status: grade(
        sourceDomains.size,
        (v) => v >= 2,
        (v) => v >= 1,
      ),
      detail: `${sourceDomains.size} nguồn khác nhau`,
      tip: "Dẫn link tới ít nhất 2 nguồn uy tín, như ICO, USDA, Bộ NN&PTNT, VICOFA, Reuters: bôi đen tên nguồn trong đoạn văn rồi bấm nút Link.",
    },
    {
      id: "entities",
      label: "Thực thể & bối cảnh ngành",
      weight: 15,
      status: grade(
        entityHits,
        (v) => v >= 5,
        (v) => v >= 3,
      ),
      detail: `${entityHits}/${ENTITIES.length} nhóm thực thể`,
      tip: "Nêu rõ tên riêng và thuật ngữ ngành: Lean Export, Việt Nam, Robusta/Arabica, vùng trồng (Gia Lai, Đắk Lắk…), điều kiện FOB/CIF, chứng nhận (EUDR, 4C…), cỡ sàng, độ ẩm.",
    },
    {
      id: "structure",
      label: "Cấu trúc theo mục",
      weight: 10,
      status: grade(
        h2Count,
        (v) => v >= 3,
        (v) => v >= 1,
      ),
      detail: `${h2Count} tiêu đề mục (##)`,
      tip: "Chia bài thành ít nhất 3 mục bằng khối Tiêu đề cỡ H2, để AI tách từng phần ra trả lời.",
    },
    {
      id: "depth",
      label: "Độ sâu nội dung",
      weight: 15,
      status: grade(
        bodyWords,
        (v) => v >= n(700),
        (v) => v >= n(350),
      ),
      detail: `${bodyWords} ${words}`,
      tip: `Bài nên có từ ${n(700)} ${words} trở lên, đủ sâu để được xem là nguồn tham khảo.`,
    },
    {
      id: "freshness",
      label: "Thông tin cập nhật",
      weight: 10,
      status: hasYear ? "pass" : "fail",
      detail: hasYear ? "Có mốc thời gian" : "Chưa có năm/mùa vụ",
      tip: "Ghi rõ thời điểm của thông tin, ví dụ “niên vụ 2025/26” hay “tháng 10/2026”. AI ưu tiên nguồn mới.",
    },
    {
      id: "media",
      label: "Ảnh bìa & mô tả ảnh",
      weight: 5,
      status:
        hasCover && missingAlt === 0
          ? "pass"
          : hasCover || (images.length > 0 && missingAlt === 0)
            ? "warn"
            : "fail",
      detail: `${hasCover ? "Có" : "Chưa có"} ảnh bìa${images.length ? `, ${images.length - missingAlt}/${images.length} ảnh có mô tả` : ""}`,
      tip: "Thêm ảnh bìa (tab Bài viết) và điền “Mô tả ảnh” cho mọi khối Ảnh trong bài.",
    },
    {
      id: "bilingual",
      label: "Đủ hai ngôn ngữ",
      weight: 5,
      status: grade(
        otherWords,
        (v) => v >= (vi ? 300 : 400),
        (v) => v > 0,
      ),
      detail: otherWords
        ? `Bản ${vi ? "EN" : "VI"}: ${otherWords} từ`
        : `Chưa có bản ${vi ? "EN" : "VI"}`,
      tip: `Viết đầy đủ bản ${vi ? "tiếng Anh" : "tiếng Việt"} để bài được trích dẫn ở cả hai thị trường ngôn ngữ.`,
    },
  ];

  const aeoScore = groupScore(aeo);
  const geoScore = groupScore(geo);
  return {
    overall: Math.round((aeoScore.score + geoScore.score) / 2),
    aeo: aeoScore,
    geo: geoScore,
  };
}

/** Score both languages of a stored post (block or legacy Markdown body). */
export function scorePostBothLangs(post: {
  title_vi: string;
  title_en: string;
  excerpt_vi?: string | null | undefined;
  excerpt_en?: string | null | undefined;
  body_vi?: string | null | undefined;
  body_en?: string | null | undefined;
  cover_url?: string | null | undefined;
}): Record<ScoreLang, PostScore> {
  const base = { coverUrl: post.cover_url ?? "" };
  return {
    vi: scorePost({
      ...base,
      lang: "vi",
      title: post.title_vi ?? "",
      excerpt: post.excerpt_vi ?? "",
      body: bodyToMarkdown(post.body_vi, "vi"),
      otherBody: bodyToMarkdown(post.body_en, "en"),
    }),
    en: scorePost({
      ...base,
      lang: "en",
      title: post.title_en ?? "",
      excerpt: post.excerpt_en ?? "",
      body: bodyToMarkdown(post.body_en, "en"),
      otherBody: bodyToMarkdown(post.body_vi, "vi"),
    }),
  };
}

export const scoreTone = (score: number) =>
  score >= 80
    ? {
        label: "Tốt",
        text: "text-[#067647]",
        bg: "bg-[#ecfdf3]",
        bar: "bg-[#17b26a]",
        ring: "ring-[#abefc6]",
      }
    : score >= 50
      ? {
          label: "Khá",
          text: "text-[#b54708]",
          bg: "bg-[#fffaeb]",
          bar: "bg-[#f79009]",
          ring: "ring-[#fedf89]",
        }
      : {
          label: "Cần cải thiện",
          text: "text-[#b42318]",
          bg: "bg-[#fef3f2]",
          bar: "bg-[#f04438]",
          ring: "ring-[#fecdca]",
        };
