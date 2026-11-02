import Anthropic from "@anthropic-ai/sdk";
import { areasConfig } from "@/config/areas";
import { businessConfig } from "@/config/business";
import { servicesConfig } from "@/config/services";
import type { L } from "@/lib/i18n";
import { getEnv } from "./env";

/**
 * The website's AI sales assistant (chat widget + Voice AI), backed by Claude.
 * Knowledge comes only from the site's own config, so the assistant never
 * states prices, stock or claims the business hasn't published.
 */

const MODEL = "claude-opus-5-5";

export type AssistantRole = "visitor" | "ai" | "agent";
export interface AssistantTurn {
  role: AssistantRole;
  content: string;
}

const both = (l: L) => `${l.en} / ${l.vi}`;

/** Stable knowledge block (kept byte-identical between requests so it can be cached). */
function knowledge(): string {
  const b = businessConfig;
  const products = servicesConfig
    .map((s) =>
      [
        `### ${both(s.name)} (page: /services/${s.slug})`,
        both(s.shortDescription),
        `Specs: ${s.features.map(both).join("; ")}`,
        `Process: ${s.processSteps.map((p) => `${p.title.en}: ${p.description.en}`).join(" | ")}`,
        ...s.faqs.map((f) => `Q: ${f.question.en}\nA: ${f.answer.en}`),
      ].join("\n"),
    )
    .join("\n\n");
  const markets = areasConfig.map(
    (a) => `${both(a.name)} (${a.region.en}, page: /areas/${a.slug})`,
  );
  const hours = b.businessHours.map((h) => `${h.days.en}: ${h.hours.en}`).join("; ");
  return [
    `## Company`,
    `${b.businessName} — ${both(b.localized.tagline)}.`,
    `Category: ${both(b.localized.category)}. Based in ${b.localized.address.en}. Founded ${b.establishedYear}.`,
    `Office hours (Vietnam time): ${hours}.`,
    `Contact: phone ${b.phone}, email ${b.email}, WhatsApp +${b.whatsapp}, Zalo ${b.zalo}.`,
    `Quote form: /get-free-quote. Contact page: /contact. News: /news.`,
    ``,
    `## Products`,
    products,
    ``,
    `## Export markets served`,
    markets.join("\n"),
  ].join("\n");
}

const RULES = `You are the virtual sales assistant on the website of Lean Export AI, a Vietnamese coffee exporter. You talk with importers, roasters and distributors.

How to answer:
- Reply in the visitor's language (Vietnamese or English; follow the language of their last message).
- Use only the company facts in <knowledge>. Never invent prices, stock levels, certifications, lead times, delivery dates or discounts. When asked for prices or anything not covered, say the sales team will confirm, and offer to take their contact details or point them to the quote form (/get-free-quote).
- Be warm, concise and practical, like an experienced export sales rep. Ask one short follow-up question when it helps (product, grade, volume, destination port, Incoterm).
- If the visitor wants a quote, samples or a call, ask for their name and email or phone so the team can follow up.
- Stay on Lean Export, coffee and export topics; politely decline unrelated requests.`;

const CHAT_STYLE = `Format: plain text for a small chat window. Short paragraphs, at most a few sentences. A short "-" list is fine when listing options. No headings, tables or Markdown emphasis.`;

const VOICE_STYLE = `Format: this is a live voice call — your reply is read aloud by text-to-speech. Answer in one to three short spoken sentences. No lists, symbols, URLs, emoji or Markdown. Say numbers the way a person would say them.`;

/** Rebuilt per request so edited contact details show up; identical text keeps the prompt cache warm. */
function systemPrompt(): string {
  return `${RULES}\n\n<knowledge>\n${knowledge()}\n</knowledge>`;
}

export function assistantConfigured(): boolean {
  return Boolean(getEnv("ANTHROPIC_API_KEY"));
}

/**
 * Ask Claude for the next reply. Returns null when the assistant is not
 * configured or the call fails — callers fall back to a human hand-off.
 */
export async function askAssistant(
  history: AssistantTurn[],
  opts: { channel: "chat" | "voice" },
): Promise<string | null> {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) return null;

  // Staff replies are shown to the model as the assistant's own earlier turns.
  const messages: Anthropic.Beta.BetaMessageParam[] = history
    .filter((t) => t.content.trim())
    .map((t) => ({
      role: t.role === "visitor" ? ("user" as const) : ("assistant" as const),
      content: t.content,
    }));
  while (messages.length && messages[0]!.role !== "user") messages.shift();
  if (!messages.length) return null;

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // Chat replies are short and latency matters; low effort keeps them quick.
      output_config: { effort: "low" },
      system: [
        { type: "text", text: systemPrompt(), cache_control: { type: "ephemeral" } },
        { type: "text", text: opts.channel === "voice" ? VOICE_STYLE : CHAT_STYLE },
      ],
      messages,
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    return text || null;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.warn("[assistant] rate limited");
    } else if (error instanceof Anthropic.AuthenticationError) {
      console.error("[assistant] ANTHROPIC_API_KEY is invalid");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[assistant] API error ${error.status}: ${error.message}`);
    } else {
      console.error("[assistant] request failed", error);
    }
    return null;
  }
}
