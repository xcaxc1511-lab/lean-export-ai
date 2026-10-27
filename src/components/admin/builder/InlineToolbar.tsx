import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bold,
  Check,
  Italic,
  Link2,
  Link2Off,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";
import { safeUrl } from "@/lib/blocks";

type Pos = { top: number; left: number };

function richRoot(node: Node | null): HTMLElement | null {
  const el = node instanceof HTMLElement ? node : node?.parentElement;
  return el?.closest<HTMLElement>("[data-rich]") ?? null;
}

/**
 * Floating format bar shown above a text selection inside a RichText field
 * (Elementor / Google Docs style). Uses execCommand, whose input events the
 * RichText fields read back into structured runs.
 */
export function InlineToolbar() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [state, setState] = useState({ b: false, i: false, u: false, s: false, link: false });
  const [linkMode, setLinkMode] = useState(false);
  const [url, setUrl] = useState("");
  const saved = useRef<Range | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.execCommand("styleWithCSS", false, "false");
    const update = () => {
      if (barRef.current?.contains(document.activeElement)) return; // typing a URL
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount || !richRoot(sel.anchorNode)) {
        setPos(null);
        setLinkMode(false);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return setPos(null);
      setPos({ top: Math.max(8, rect.top - 48), left: rect.left + rect.width / 2 });
      const anchor =
        sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement;
      setState({
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
        s: document.queryCommandState("strikeThrough"),
        link: !!anchor?.closest("a"),
      });
    };
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  if (!pos) return null;

  const run = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Refresh the active states.
    document.dispatchEvent(new Event("selectionchange"));
  };

  const openLink = () => {
    const sel = window.getSelection();
    saved.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const anchor = (
      sel?.anchorNode instanceof HTMLElement ? sel.anchorNode : sel?.anchorNode?.parentElement
    )?.closest("a");
    setUrl(anchor?.getAttribute("href") ?? "https://");
    setLinkMode(true);
  };

  const applyLink = (e: FormEvent) => {
    e.preventDefault();
    const href = safeUrl(url);
    const range = saved.current;
    setLinkMode(false);
    if (!range) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    if (href) run("createLink", href);
  };

  const buttons = [
    { key: "b", icon: Bold, label: "In đậm (Ctrl+B)", onClick: () => run("bold"), active: state.b },
    {
      key: "i",
      icon: Italic,
      label: "In nghiêng (Ctrl+I)",
      onClick: () => run("italic"),
      active: state.i,
    },
    {
      key: "u",
      icon: Underline,
      label: "Gạch chân (Ctrl+U)",
      onClick: () => run("underline"),
      active: state.u,
    },
    {
      key: "s",
      icon: Strikethrough,
      label: "Gạch ngang",
      onClick: () => run("strikeThrough"),
      active: state.s,
    },
    { key: "link", icon: Link2, label: "Gắn link", onClick: openLink, active: state.link },
    ...(state.link
      ? [
          {
            key: "unlink",
            icon: Link2Off,
            label: "Bỏ link",
            onClick: () => run("unlink"),
            active: false,
          },
        ]
      : []),
    {
      key: "clear",
      icon: RemoveFormatting,
      label: "Xóa định dạng",
      onClick: () => {
        run("removeFormat");
        run("unlink");
      },
      active: false,
    },
  ];

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label="Định dạng chữ"
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[70] flex -translate-x-1/2 items-center gap-0.5 rounded-lg bg-admin-side p-1 text-white shadow-lg"
      onMouseDown={(e) => {
        // Keep the text selection while clicking buttons (not the URL box).
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
    >
      {linkMode ? (
        <form onSubmit={applyLink} className="flex items-center gap-1">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setLinkMode(false)}
            placeholder="https://… hoặc /trang"
            aria-label="Địa chỉ link"
            className="h-8 w-64 rounded-md bg-white/10 px-2 text-sm text-white outline-none placeholder:text-white/50"
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/15"
            aria-label="Gắn link"
          >
            <Check className="h-4 w-4" />
          </button>
        </form>
      ) : (
        buttons.map((btn) => (
          <button
            key={btn.key}
            type="button"
            title={btn.label}
            aria-label={btn.label}
            aria-pressed={btn.active}
            onClick={btn.onClick}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              btn.active ? "bg-white/20 text-ld-gold" : "hover:bg-white/15"
            }`}
          >
            <btn.icon className="h-4 w-4" />
          </button>
        ))
      )}
    </div>
  );
}
