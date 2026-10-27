import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getPostById } from "@/functions/posts";
import { PostBuilder } from "@/components/admin/builder/PostBuilder";

export const Route = createFileRoute("/admin/news/$id")({
  component: PostEditorPage,
});

function PostEditorPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const numericId = Number(id);
  const query = useQuery({
    queryKey: ["posts", numericId],
    queryFn: () => getPostById({ data: { id: numericId } }),
    enabled: !isNew && Number.isInteger(numericId),
  });

  if (!isNew && (query.isLoading || !query.data)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center gap-2 bg-admin-canvas text-sm text-admin-dim">
        {query.isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Đang mở trình dựng bài…
          </>
        ) : (
          <span>
            Không tìm thấy bài viết. Có thể bài đã bị xóa.{" "}
            <Link to="/admin/news" className="font-medium text-admin-blue hover:underline">
              Về danh sách bài viết
            </Link>
          </span>
        )}
      </div>
    );
  }
  return <PostBuilder key={id} post={isNew ? null : query.data!} />;
}
