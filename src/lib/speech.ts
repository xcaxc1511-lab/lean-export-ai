/**
 * Browser speech helpers for the chat widget (dictation) and Voice AI.
 * Recognition uses the Web Speech API (Chrome, Edge, Safari); playback uses
 * speechSynthesis. Both are optional — callers check `speechSupported()`.
 */

export interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = () => recognitionCtor() !== null;
export const ttsSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export const speechLang = (lang: "vi" | "en") => (lang === "vi" ? "vi-VN" : "en-US");

export function createRecognition(lang: "vi" | "en"): Recognition | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = speechLang(lang);
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  return rec;
}

/** Best available voice for the language (prefers natural/online voices). */
function pickVoice(lang: "vi" | "en"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const code = speechLang(lang).toLowerCase();
  const prefix = lang;
  const matches = voices.filter(
    (v) => v.lang.toLowerCase() === code || v.lang.toLowerCase().startsWith(`${prefix}-`),
  );
  return (
    matches.find((v) => /natural|online|google|premium|enhanced/i.test(v.name)) ??
    matches[0] ??
    null
  );
}

/** Speak text; resolves when finished (or immediately if TTS is unavailable). */
export function speak(
  text: string,
  lang: "vi" | "en",
  onBoundary?: () => void,
): { done: Promise<void>; cancel: () => void } {
  if (!ttsSupported() || !text.trim()) return { done: Promise.resolve(), cancel: () => {} };
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = speechLang(lang);
  const voice = pickVoice(lang);
  if (voice) utter.voice = voice;
  utter.rate = 1.02;
  if (onBoundary) utter.onboundary = onBoundary;
  const done = new Promise<void>((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
  });
  synth.speak(utter);
  return { done, cancel: () => synth.cancel() };
}

/** Voices load asynchronously in Chrome; call once early so the first reply has a voice. */
export function warmUpVoices() {
  if (!ttsSupported()) return;
  window.speechSynthesis.getVoices();
}
