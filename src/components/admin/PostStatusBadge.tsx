export function PostStatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        published
          ? "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]"
          : "bg-[#f9fafb] text-[#475467] ring-[#eaecf0]"
      }`}
    >
      {published ? "Đã đăng" : "Nháp"}
    </span>
  );
}
