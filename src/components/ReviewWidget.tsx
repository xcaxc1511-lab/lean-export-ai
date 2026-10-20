import { integrationsConfig } from "@/config/integrations";

/** Direct iframe src works on the first response and each route mount. */
export function ReviewWidget() {
  const url = integrationsConfig.reviewWidgetUrl;
  return url && !url.startsWith("YOUR_") ? (
    <iframe
      src={url}
      title="Customer reviews"
      loading="eager"
      className="w-full min-h-[400px] border-0"
    />
  ) : (
    <div className="text-gray-400 font-medium text-lg tracking-widest uppercase border border-gray-600 border-dashed p-8 rounded w-full flex items-center justify-center">
      GHL Review Widget Placeholder
    </div>
  );
}
