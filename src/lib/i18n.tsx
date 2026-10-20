import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "vi";

/** A bilingual string. Content configs store copy as `{ en, vi }` pairs. */
export type L = { en: string; vi: string };

export const LANGS: Lang[] = ["en", "vi"];
const STORAGE_KEY = "lang";

/** English value of a bilingual string — used for SEO meta and structured data. */
export function en(value: L | string): string {
  return typeof value === "string" ? value : value.en;
}

/** Fill `{name}` placeholders in a string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Resolve a bilingual string (plain strings pass through unchanged). */
  t: (value: L | string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // Server render and first client render are always English to avoid hydration
  // mismatches; a stored preference is applied right after mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "vi" || stored === "en") setLangState(stored);
    } catch {
      // Storage can be unavailable (private mode); English is the fallback.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply won't persist.
    }
  }, []);

  const t = useCallback(
    (value: L | string, vars?: Record<string, string | number>) => {
      const text = typeof value === "string" ? value : value[lang];
      return vars ? fill(text, vars) : text;
    },
    [lang],
  );

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
