import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type DragEvent,
  type ElementType,
  type KeyboardEvent,
} from "react";
import { escapeHtml, safeUrl, type Rich, type Run } from "@/lib/blocks";

/* ------------------------------------------------- DOM ⇄ runs conversion */

type Marks = Omit<Run, "text">;

const sameMarks = (a: Marks, b: Marks) =>
  !!a.b === !!b.b && !!a.i === !!b.i && !!a.u === !!b.u && !!a.s === !!b.s && a.href === b.href;

/** Read a contentEditable subtree back into runs (only the marks we support). */
function domToRuns(root: Node): Rich {
  const runs: Rich = [];
  const push = (text: string, marks: Marks) => {
    if (!text) return;
    const last = runs[runs.length - 1];
    if (last && sameMarks(last, marks)) last.text += text;
    else runs.push({ text, ...marks });
  };
  const walk = (node: Node, marks: Marks) => {
    if (node.nodeType === Node.TEXT_NODE) {
      push((node.textContent ?? "").replace(/\u00a0/g, " "), marks);
      return;
    }
    if (!(node instanceof HTMLElement)) {
      node.childNodes.forEach((c) => walk(c, marks));
      return;
    }
    const tag = node.tagName;
    if (tag === "BR") {
      push("\n", marks);
      return;
    }
    const next: Marks = { ...marks };
    const weight = node.style.fontWeight;
    if (tag === "B" || tag === "STRONG" || weight === "bold" || Number(weight) >= 600)
      next.b = true;
    if (tag === "I" || tag === "EM" || node.style.fontStyle === "italic") next.i = true;
    if (tag === "U" || node.style.textDecorationLine?.includes("underline")) next.u = true;
    if (tag === "S" || tag === "STRIKE" || tag === "DEL") next.s = true;
    if (tag === "A") {
      const href = safeUrl(node.getAttribute("href") ?? "");
      if (href) next.href = href;
    }
    const isBlock = tag === "DIV" || tag === "P";
    if (isBlock && runs.length && !runs[runs.length - 1]!.text.endsWith("\n")) push("\n", marks);
    node.childNodes.forEach((c) => walk(c, next));
  };
  root.childNodes.forEach((c) => walk(c, {}));
  // Browsers leave a trailing <br> behind; drop trailing newlines.
  while (runs.length) {
    const last = runs[runs.length - 1]!;
    last.text = last.text.replace(/\n+$/, "");
    if (last.text) break;
    runs.pop();
  }
  // Drop empty marks so equal content compares equal.
  return runs.map((r) =>
    Object.fromEntries(Object.entries(r).filter(([, v]) => v !== false && v !== undefined)),
  ) as Rich;
}

function runsToEditorHtml(runs: Rich): string {
  return runs
    .map((run) => {
      let html = escapeHtml(run.text).replace(/\n/g, "<br>");
      if (run.b) html = `<b>${html}</b>`;
      if (run.i) html = `<i>${html}</i>`;
      if (run.u) html = `<u>${html}</u>`;
      if (run.s) html = `<s>${html}</s>`;
      const href = safeUrl(run.href);
      if (href) html = `<a href="${escapeHtml(href)}">${html}</a>`;
      return html;
    })
    .join("");
}

function placeCaret(el: HTMLElement, at: "start" | "end") {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(at === "start");
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function caretAtStart(el: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.setEnd(sel.focusNode!, sel.focusOffset);
  return range.toString().length === 0;
}

/* -------------------------------------------------------------- RichText */

export interface RichTextProps {
  value: Rich;
  onChange: (value: Rich) => void;
  as?: ElementType;
  className?: string;
  placeholder?: string;
  /** Enter splits here: returns text before/after the caret (e.g. new paragraph). */
  onSplit?: (before: Rich, after: Rich) => void;
  /** Backspace in an empty field (e.g. remove the block). */
  onBackspaceEmpty?: () => void;
  /** Disallow line breaks entirely (headings, list items). */
  singleLine?: boolean;
  autoFocus?: "start" | "end" | false;
  onAutoFocused?: () => void;
}

/** Inline-formatted text edited in place (bold/italic/underline/strike/link). */
export function RichText({
  value,
  onChange,
  as: Tag = "div",
  className = "",
  placeholder,
  onSplit,
  onBackspaceEmpty,
  singleLine,
  autoFocus,
  onAutoFocused,
}: RichTextProps) {
  const ref = useRef<HTMLElement>(null);
  const last = useRef<string>("");

  // Sync external changes (undo, settings panel) without moving the caret on typing.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const json = JSON.stringify(value);
    if (json === last.current) return;
    last.current = json;
    el.innerHTML = runsToEditorHtml(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && ref.current) {
      placeCaret(ref.current, autoFocus);
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    if (!el.textContent) el.innerHTML = ""; // keep :empty placeholder working
    const runs = domToRuns(el);
    last.current = JSON.stringify(runs);
    onChange(runs);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = ref.current!;
    if (e.key === "Enter") {
      if (e.shiftKey && !singleLine) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
        return;
      }
      e.preventDefault();
      if (!onSplit) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const tail = document.createRange();
      tail.setStart(range.endContainer, range.endOffset);
      tail.setEnd(el, el.childNodes.length);
      const holder = document.createElement("div");
      holder.appendChild(tail.extractContents());
      const before = domToRuns(el);
      const after = domToRuns(holder);
      last.current = JSON.stringify(before);
      onSplit(before, after);
      return;
    }
    if (e.key === "Backspace" && onBackspaceEmpty && !el.textContent && caretAtStart(el)) {
      e.preventDefault();
      onBackspaceEmpty();
    }
  };

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-rich=""
      data-placeholder={placeholder}
      className={`builder-editable ${className}`}
      onInput={emit}
      onKeyDown={onKeyDown}
      onPaste={(e: ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand(
          "insertText",
          false,
          singleLine ? text.replace(/\s*\n\s*/g, " ") : text,
        );
      }}
      onDrop={(e: DragEvent) => e.preventDefault()}
    />
  );
}

/* ------------------------------------------------------------- PlainText */

/** Unformatted text edited in place (captions, labels, table cells, questions). */
export function PlainText({
  value,
  onChange,
  as: Tag = "span",
  className = "",
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (value: string) => void;
  as?: ElementType;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const last = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === last.current) return;
    last.current = value;
    el.textContent = value;
  }, [value]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`builder-editable ${className}`}
      onInput={() => {
        const el = ref.current!;
        const text = (el.innerText ?? "").replace(/\u00a0/g, " ").replace(/\n+$/, "");
        if (!text) el.innerHTML = "";
        last.current = text;
        onChange(text);
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) e.preventDefault();
      }}
      onPaste={(e: ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand(
          "insertText",
          false,
          multiline ? text : text.replace(/\s*\n\s*/g, " "),
        );
      }}
      onDrop={(e: DragEvent) => e.preventDefault()}
    />
  );
}
