import { integrationsConfig } from "@/config/integrations";

/** Window event that opens the chat widget (e.g. from the Voice AI fallback). */
export const OPEN_CHAT_EVENT = "lx:open-chat";

export const openChat = () => window.dispatchEvent(new Event(OPEN_CHAT_EVENT));

/** Window event that opens the Voice AI popup (floating button, hero button). */
export const OPEN_VOICE_EVENT = "lx:open-voice";

export const openVoice = () => window.dispatchEvent(new Event(OPEN_VOICE_EVENT));

/** Whether a GHL Voice AI widget is configured; the voice buttons hide otherwise. */
export const voiceEnabled = () => Boolean(integrationsConfig.voiceWidgetId);
