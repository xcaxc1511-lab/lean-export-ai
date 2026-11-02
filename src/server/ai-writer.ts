import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { businessConfig } from "@/config/business";
import { servicesConfig } from "@/config/services";
import { createBlock, markdownInline, newId, safeUrl, type Block, type Rich } from "@/lib/blocks";
import { getEnv } from "./env";

/**
 * AI writing help for the post builder (Claude): translate a post's blocks
 * VI → EN (or back) keeping the layout, and draft an AEO/GEO-friendly outline.
 */

const MODEL = "claude-opus-5-5";
/** Keep one request well inside a single response. */
const MAX_SOURCE_CHARS = 30_000;

export class WriterError extends Error {}

function client() {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) throw new WriterError("not_configured");
  return new Anthropic({ apiKey, maxRetries: 1, timeout: 120_000 });
}

/** Rich text ⇄ a tiny markup the model keeps intact: **bold**, *italic*, [label](url). */
function richToMarkup(r: Rich): string {
  return r
    .map((run) => {
      let t = run.text;
      if (!t.trim()) return t;
      if (run.b) t = `**${t}**`;
      if (run.i) t = `*${t}*`;
      const href = safeUrl(run.href);
      if (href) t = `[${t}](${href})`;
      return t;
    })
    .join("");
}
const markupToRich = (text: string): Rich =>
  text
    .split("\n")
    .flatMap((line, i) => (i ? [{ text: "\n" }, ...markdownInline(line)] : markdownInline(line)));

/**
 * Visit every translatable string of a block list in a fixed order. `map`
 * returns the replacement; called with the identity it just collects.
 */
function mapTexts(blocks: Block[], map: (text: string) => string): Block[] {
  const rich = (r: Rich) => (r.length ? markupToRich(map(richToMarkup(r))) : r);
  const plain = (v: string | undefined) => (v && v.trim() ? map(v) : (v ?? ""));
  return blocks.map((b): Block => {
    const id = newId();
    switch (b.type) {
      case "heading":
      case "paragraph":
      case "quote":
        return b.type === "quote"
          ? { ...b, id, text: rich(b.text), cite: plain(b.cite) }
          : { ...b, id, text: rich(b.text) };
      case "list":
        return { ...b, id, items: b.items.map(rich) };
      case "image":
        return { ...b, id, alt: plain(b.alt), caption: plain(b.caption) };
      case "media-text":
        return { ...b, id, alt: plain(b.alt), title: rich(b.title), text: rich(b.text) };
      case "button":
        return { ...b, id, label: plain(b.label) };
      case "video":
        return { ...b, id, caption: plain(b.caption) };
      case "table":
        return { ...b, id, rows: b.rows.map((row) => row.map((c) => plain(c))) };
      case "callout":
        return { ...b, id, title: plain(b.title), text: rich(b.text) };
      case "stats":
        return {
          ...b,
          id,
          items: b.items.map((s) => ({ value: plain(s.value), label: plain(s.label) })),
        };
      case "faq":
        return {
          ...b,
          id,
          title: plain(b.title),
          items: b.items.map((it) => ({ q: plain(it.q), a: rich(it.a) })),
        };
      case "divider":
        return { ...b, id };
    }
  });
}

const LANG_NAME = { vi: "Vietnamese", en: "English" } as const;

export interface TranslateInput {
  from: "vi" | "en";
  to: "vi" | "en";
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDesc: string;
  blocks: Block[];
}

export async function translatePost(input: TranslateInput) {
  const strings: string[] = [input.title, input.excerpt, input.seoTitle, input.seoDesc];
  mapTexts(input.blocks, (t) => {
    strings.push(t);
    return t;
  });
  const total = strings.reduce((n, t) => n + t.length, 0);
  if (total > MAX_SOURCE_CHARS) throw new WriterError("too_long");

  const Translation = z.object({ translations: z.array(z.string()) });
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16_000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Translation) },
    system: `You translate website content for ${businessConfig.businessName}, a Vietnamese coffee exporter, from ${LANG_NAME[input.from]} to ${LANG_NAME[input.to]} for international coffee buyers.
Rules:
- Return exactly one translation per input string, in the same order (same array length). Empty strings stay empty.
- Keep the inline markup exactly: **bold**, *italic*, [label](url) — translate the label, never change the url.
- Keep numbers, units, prices, grades (S16, S18), Incoterms (FOB, CIF), certifications, place and brand names unchanged.
- Natural, professional B2B tone; keep headings that are questions as questions.`,
    messages: [{ role: "user", content: JSON.stringify({ strings }) }],
  });
  if (response.stop_reason === "refusal") throw new WriterError("refused");
  const out = response.parsed_output?.translations;
  if (!out || out.length !== strings.length) throw new WriterError("mismatch");

  let i = 4;
  const blocks = mapTexts(input.blocks, () => out[i++] ?? "");
  return {
    title: out[0] ?? "",
    excerpt: out[1] ?? "",
    seoTitle: out[2] ?? "",
    seoDesc: out[3] ?? "",
    blocks,
  };
}

/* ------------------------------------------------------------ outline */

const Outline = z.object({
  lead: z
    .string()
    .describe("40-60 word paragraph that directly answers the article's main question"),
  sections: z
    .array(
      z.object({
        heading: z.string().describe("Section heading phrased as a question buyers ask"),
        paragraphs: z.array(z.string()),
        bullets: z.array(z.string()),
      }),
    )
    .describe("3-5 sections"),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).describe("3-5 short FAQs"),
  excerpt: z.string().describe("110-160 character summary"),
  seoTitle: z.string().describe("Search title, at most 60 characters"),
});

export async function draftOutline(input: { title: string; notes: string; lang: "vi" | "en" }) {
  const products = servicesConfig
    .map(
      (s) =>
        `- ${s.name.en}: ${s.shortDescription.en} Specs: ${s.features.map((f) => f.en).join("; ")}`,
    )
    .join("\n");
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 16_000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Outline) },
    system: `You draft blog articles for ${businessConfig.businessName}, a Vietnamese coffee exporter based in ${businessConfig.localized.address.en}, read by importers and roasters.
Write in ${LANG_NAME[input.lang]}. Structure for answer engines (AEO/GEO): a direct answer first, question-style section headings, short paragraphs, lists for specs or steps, and a FAQ.
Facts about the company may only come from this list:
${products}
Never invent statistics, prices, dates, certifications or quotes. Where the article needs a figure or a fact you do not have, write a bracketed note for the editor instead, e.g. [${input.lang === "vi" ? "Bổ sung số liệu" : "Add figure"}: …].`,
    messages: [
      {
        role: "user",
        content: `Article title: ${input.title}\n${input.notes ? `Editor notes: ${input.notes}` : ""}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new WriterError("refused");
  const o = response.parsed_output;
  if (!o) throw new WriterError("mismatch");

  const blocks: Block[] = [];
  const para = (text: string) => {
    const b = createBlock("paragraph");
    if (b.type === "paragraph") b.text = markupToRich(text);
    blocks.push(b);
  };
  para(o.lead);
  for (const section of o.sections) {
    const h = createBlock("heading");
    if (h.type === "heading") h.text = markupToRich(section.heading);
    blocks.push(h);
    section.paragraphs.forEach(para);
    if (section.bullets.length) {
      const l = createBlock("list");
      if (l.type === "list") l.items = section.bullets.map(markupToRich);
      blocks.push(l);
    }
  }
  if (o.faq.length) {
    const f = createBlock("faq");
    if (f.type === "faq") {
      f.title = input.lang === "vi" ? "Câu hỏi thường gặp" : "Frequently asked questions";
      f.items = o.faq.map((it) => ({ q: it.q, a: markupToRich(it.a) }));
    }
    blocks.push(f);
  }
  return { blocks, excerpt: o.excerpt, seoTitle: o.seoTitle };
}
