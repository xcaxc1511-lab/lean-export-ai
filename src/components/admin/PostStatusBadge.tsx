export function PostStatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${
        published
          ? "bg-brand-ink text-white"
          : "bg-admin-row text-admin-muted ring-1 ring-inset ring-admin-line"
      }`}
    >
      {published ? "Đã đăng" : "Nháp"}
    </span>
  );
}
