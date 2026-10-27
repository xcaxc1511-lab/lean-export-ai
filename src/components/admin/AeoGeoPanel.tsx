import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { scoreTone, type CheckStatus, type PostScore, type ScoreCheck } from "@/lib/aeo-geo";

const STATUS_ICON: Record<
  CheckStatus,
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  pass: { icon: CheckCircle2, className: "text-[#17b26a]", label: "Đạt" },
  warn: { icon: AlertCircle, className: "text-[#f79009]", label: "Gần đạt" },
  fail: { icon: XCircle, className: "text-[#f04438]", label: "Chưa đạt" },
};

/** Small coloured score chip, used in tabs and the post list. */
export function ScoreChip({ score, prefix }: { score: number; prefix?: string }) {
  const tone = scoreTone(score);
  return (
    <span
      title={`${prefix ? `${prefix}: ` : ""}${score}/100 (${tone.label})`}
      className={`inline-flex items-center gap-1 rounded-full px-1.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
    >
      {prefix && <span className="font-medium opacity-80">{prefix}</span>}
      {score}
    </span>
  );
}

function ScoreBar({ name, hint, score }: { name: string; hint: string; score: number }) {
  const tone = scoreTone(score);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-admin-ink" title={hint}>
          {name}
        </span>
        <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-admin-canvas">
        <div
          className={`h-full rounded-full transition-[width] ${tone.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: ScoreCheck }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, className, label } = STATUS_ICON[check.status];
  const expandable = check.status !== "pass";
  return (
    <li className="border-b border-admin-line last:border-0">
      <button
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2.5 py-2.5 text-left disabled:cursor-default"
      >
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} aria-label={label} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-admin-ink">{check.label}</span>
          <span className="block text-xs text-admin-dim">{check.detail}</span>
        </span>
        {expandable && (
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-admin-dim transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {expandable && open && (
        <p className="mb-3 ml-6.5 rounded-md bg-admin-row px-3 py-2 text-xs leading-relaxed text-admin-text">
          {check.tip}
        </p>
      )}
    </li>
  );
}

export function AeoGeoPanel({ result, langLabel }: { result: PostScore; langLabel: string }) {
  const [group, setGroup] = useState<"aeo" | "geo">("aeo");
  const tone = scoreTone(result.overall);
  const checks = result[group].checks;
  const todo = checks.filter((c) => c.status !== "pass").length;

  return (
    <section className="admin-card" aria-labelledby="aeo-geo-title">
      <div className="flex items-center justify-between gap-3 border-b border-admin-line px-5 py-4">
        <div>
          <h3 id="aeo-geo-title" className="text-base font-semibold text-admin-ink">
            Điểm AEO/GEO
          </h3>
          <p className="text-xs text-admin-dim">Bản {langLabel}, cập nhật khi bạn gõ</p>
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full ring-4 ring-inset ${tone.bg} ${tone.ring}`}
          title={tone.label}
        >
          <span className={`text-lg font-bold leading-none tabular-nums ${tone.text}`}>
            {result.overall}
          </span>
          <span className={`mt-0.5 text-[10px] font-medium ${tone.text}`}>/100</span>
        </div>
      </div>

      <div className="grid gap-4 px-5 pt-4">
        <ScoreBar
          name="AEO"
          hint="Answer Engine Optimization: khả năng được Google, AI Overviews và trợ lý giọng nói trích làm câu trả lời."
          score={result.aeo.score}
        />
        <ScoreBar
          name="GEO"
          hint="Generative Engine Optimization: khả năng được ChatGPT, Perplexity, Gemini trích dẫn làm nguồn."
          score={result.geo.score}
        />
      </div>

      <div className="mt-4 flex border-b border-admin-line px-3" role="tablist">
        {(["aeo", "geo"] as const).map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={group === g}
            aria-current={group === g ? "page" : undefined}
            onClick={() => setGroup(g)}
            className="admin-subtab h-10 px-3"
          >
            Tiêu chí {g.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="px-5 pb-2 pt-1">
        <p className="pt-2 text-xs text-admin-dim">
          {todo === 0
            ? "Tất cả tiêu chí đã đạt."
            : `${todo} tiêu chí cần cải thiện. Bấm vào từng mục để xem cách sửa.`}
        </p>
        <ul>
          {checks.map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </ul>
      </div>
    </section>
  );
}
