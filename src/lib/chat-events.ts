/** Window event that opens the chat widget (e.g. from the Voice AI fallback). */
export const OPEN_CHAT_EVENT = "lx:open-chat";

export const openChat = () => window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
