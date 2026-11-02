import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { WriterError, draftOutline, translatePost } from "@/server/ai-writer";
import { serializeBody, parseBody } from "@/lib/blocks";

type WriterFailure = "not_configured" | "too_long" | "refused" | "mismatch" | "failed";

function failure(error: unknown): { ok: false; error: WriterFailure } {
  if (error instanceof WriterError) return { ok: false, error: error.message as WriterFailure };
  console.error("[ai-writer]", error);
  return { ok: false, error: "failed" };
}

/** Translate the open language's title, summary, SEO fields and blocks into the other language. */
export const aiTranslatePost = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        from: z.enum(["vi", "en"]),
        title: z.string().max(200),
        excerpt: z.string().max(500),
        seoTitle: z.string().max(120),
        seoDesc: z.string().max(320),
        body: z.string().max(400_000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin("posts");
    try {
      const to = data.from === "vi" ? "en" : "vi";
      const res = await translatePost({ ...data, to, blocks: parseBody(data.body) });
      await audit(
        user,
        "post.ai",
        data.title,
        `Dịch ${data.from.toUpperCase()} → ${to.toUpperCase()}`,
      );
      return {
        ok: true as const,
        title: res.title,
        excerpt: res.excerpt,
        seoTitle: res.seoTitle,
        seoDesc: res.seoDesc,
        body: serializeBody(res.blocks),
      };
    } catch (error) {
      return failure(error);
    }
  });

/** Draft an AEO/GEO-structured outline (lead, question headings, lists, FAQ) from a title. */
export const aiDraftOutline = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        title: z.string().trim().min(5).max(200),
        notes: z.string().trim().max(1500).optional().default(""),
        lang: z.enum(["vi", "en"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireAdmin("posts");
    try {
      const res = await draftOutline(data);
      await audit(user, "post.ai", data.title, "Gợi ý dàn bài");
      return {
        ok: true as const,
        body: serializeBody(res.blocks),
        excerpt: res.excerpt,
        seoTitle: res.seoTitle,
      };
    } catch (error) {
      return failure(error);
    }
  });
