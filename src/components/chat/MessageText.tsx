import { Fragment } from "react";

/** Full URLs and site paths like /get-free-quote become links; everything else stays text. */
const LINK =
  /(https?:\/\/[^\s<>()]+[^\s<>().,!?;:]|(?<![\w/])\/(?:get-free-quote|contact|about|news|services|areas)(?:\/[a-z0-9-]+)?)/gi;

/** Chat message text with line breaks and safe links (rendered as React nodes, no HTML). */
export function MessageText({ text }: { text: string }) {
  const parts = text.split(LINK);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const external = part.startsWith("http");
        return (
          <a
            key={i}
            href={part}
            {...(external && { target: "_blank", rel: "noopener noreferrer" })}
            className="font-semibold underline decoration-ld-gold decoration-2 underline-offset-2"
          >
            {part}
          </a>
        );
      })}
    </span>
  );
}
