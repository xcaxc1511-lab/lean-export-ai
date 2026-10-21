/**
 * Tiny, safe Markdown subset for news posts:
 *   ## Heading / ### Subheading, paragraphs (blank line), - bullet lists,
 *   **bold**, *italic*, [link](https://…), ![alt](https://…image).
 * Everything is HTML-escaped first; only whitelisted tags are produced and
 * URLs must be http(s) or site-relative, so editor input can't inject markup.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const safeUrl = (url: string) => (/^(https?:\/\/|\/)/i.test(url) ? url : "#");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, alt: string, url: string) =>
        `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" class="my-6 w-full rounded-xl" />`,
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, url: string) => {
      const href = safeUrl(url);
      const external = href.startsWith("http");
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""} class="font-semibold text-gray-900 underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

export function renderMarkdown(source: string): string {
  const blocks = source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        const items = lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`);
        return `<ul class="my-5 list-disc space-y-2 pl-6">${items.join("")}</ul>`;
      }
      const heading = /^(#{2,3})\s+(.*)$/.exec(block);
      if (heading && lines.length === 1) {
        return heading[1] === "##"
          ? `<h2 class="mb-4 mt-10 text-2xl font-bold text-gray-900 md:text-3xl">${inline(heading[2]!)}</h2>`
          : `<h3 class="mb-3 mt-8 text-xl font-bold text-gray-900">${inline(heading[2]!)}</h3>`;
      }
      return `<p class="my-5 leading-relaxed">${lines.map(inline).join("<br />")}</p>`;
    })
    .join("\n");
}
