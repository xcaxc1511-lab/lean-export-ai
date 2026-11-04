import { images } from "./images";

export const integrationsConfig = {
  /** Approved 1920×1080 still for the homepage video poster/fallback. */
  heroPosterUrl: images.heroPlantation,
  /** Supplied GHL review widget iframe URL; never fabricate reviews. */
  reviewWidgetUrl: "",
  /**
   * LeadConnector (GHL) Voice AI widget ID for Lean Export, from GHL: Settings →
   * Chat Widget → the Voice AI widget → its embed code (data-widget-id). Opens from
   * the floating voice button and the hero button. Empty = voice buttons hidden.
   */
  voiceWidgetId: "6ac5b89fc4072640328658c0", // shared with the 3P Logistics site, by the owner's choice
  /** LeadConnector quote form embed ID (used on the quote page). */
  quoteFormId: "YOUR_QUOTE_FORM_ID",
  /** LeadConnector contact form embed ID (used on the contact page). */
  contactFormId: "YOUR_CONTACT_FORM_ID",
  /** Optional YouTube video ID for the homepage "A closer look" section. */
  youtubeVideoId: "YOUR_YOUTUBE_VIDEO_ID",
  /** Actual business Google Maps embed URL. Use the business location, never a fabricated office in each service area. */
  googleMapsEmbedUrl: "YOUR_GOOGLE_MAPS_EMBED_URL",
  /** Optional 20–30 second, 1920×1080 looping background video URL. Leave as placeholder to use a static hero. */
  heroVideoUrl: "YOUR_HERO_VIDEO_URL",
};
