import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/admin/AdminShell";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const Route = createFileRoute("/admin/media")({
  component: MediaPage,
});

function MediaPage() {
  return (
    <>
      <AdminTopbar title="Thư viện ảnh" />
      <div className="flex-1 p-4 lg:p-6">
        <div className="admin-card p-4 sm:p-6">
          <MediaLibrary mode="manage" />
        </div>
      </div>
    </>
  );
}
