const fmt = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

/** Draft / published / scheduled (a scheduled post counts as published once its time has passed). */
export function PostStatusBadge({
  status,
  publishedAt,
}: {
  status: string;
  publishedAt?: string | null | undefined;
}) {
  // A scheduled post without a known time (e.g. a saved version) is shown as scheduled.
  const scheduledFuture =
    status === "scheduled" && (!publishedAt || publishedAt > new Date().toISOString());
  const live = status === "published" || (status === "scheduled" && !scheduledFuture);
  const [label, tone] = scheduledFuture
    ? [
        publishedAt ? `Lên lịch ${fmt(publishedAt)}` : "Hẹn giờ",
        "bg-[#fffaeb] text-[#b54708] ring-[#fedf89]",
      ]
    : live
      ? ["Đã đăng", "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]"]
      : ["Nháp", "bg-[#f9fafb] text-[#475467] ring-[#eaecf0]"];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
}
