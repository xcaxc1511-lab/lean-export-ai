import { useEffect } from "react";

/**
 * Reusable embedded lead form (inline iframe widget).
 *
 * The iframe is rendered immediately on mount with a direct `src`, so the
 * form is visible on first load AND after client-side route changes — it does
 * not depend on any vendor re-initialization API. The embed script is loaded
 * once for enhancement (resizing, etc.) but is not required for the form to
 * render. Forms are never lazy-loaded: reliability over a tiny perf gain.
 */
const SCRIPT_SRC = "https://link.msgsndr.com/js/form_embed.js";
const SCRIPT_ID = "leadconnector-form-embed";

declare global {
  interface Window {
    __leadconnectorFormLoaded?: boolean;
  }
}

/** Load the embed script exactly once. No-op if already loaded or loading. */
function ensureScript(): void {
  if (typeof window === "undefined") return;
  if (window.__leadconnectorFormLoaded) return;
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  script.onload = () => {
    window.__leadconnectorFormLoaded = true;
  };
  // If the script fails to load, the iframe still renders from its src —
  // no false "loaded" state is recorded, so a later mount can retry.
  script.onerror = () => script.remove();
  document.body.appendChild(script);
}

interface LeadFormProps {
  /** LeadConnector form embed ID. */
  formId: string;
  /** Accessible title for the iframe. */
  title: string;
  /** Optional label shown in the data-form-name attribute. */
  formName?: string;
  /** Min height for the form container while it loads. */
  minHeight?: number;
}

export function LeadForm({ formId, title, formName = "Form", minHeight = 781 }: LeadFormProps) {
  useEffect(() => {
    ensureScript();
  }, [formId]);

  return (
    <div className="bg-white p-2 rounded-sm h-full" style={{ minHeight }}>
      <iframe
        key={formId}
        loading="eager"
        src={`https://api.leadconnectorhq.com/widget/form/${formId}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "10px",
          minHeight,
        }}
        id={`inline-${formId}`}
        data-layout="{'id':'INLINE'}"
        data-trigger-type="alwaysShow"
        data-trigger-value=""
        data-activation-type="alwaysActivated"
        data-activation-value=""
        data-deactivation-type="neverDeactivate"
        data-deactivation-value=""
        data-form-name={formName}
        data-height={String(minHeight)}
        data-layout-iframe-id={`inline-${formId}`}
        data-form-id={formId}
        title={title}
      />
    </div>
  );
}

/** True when a real (non-placeholder) form ID is configured. */
export function hasFormId(value: string | undefined): boolean {
  return Boolean(
    value && value.trim() !== "" && !value.startsWith("YOUR_") && !value.includes("_FORM_ID"),
  );
}
