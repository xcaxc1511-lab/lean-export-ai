import { createFileRoute } from "@tanstack/react-router";
import { currentUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { canAccess } from "@/lib/roles";
import { enquiriesCsv } from "@/server/enquiries-csv";

/** Admin-only CSV export of enquiries; honours the same filters as the dashboard. */
export const Route = createFileRoute("/api/admin/enquiries.csv")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await currentUser();
        if (!user) return new Response("Unauthorized", { status: 401 });
        if (!canAccess(user.role, "enquiries")) return new Response("Forbidden", { status: 403 });
        await audit(user, "enquiry.export", null, "Xuất CSV");
        const params = Object.fromEntries(new URL(request.url).searchParams);
        const csv = await enquiriesCsv(params);
        const date = new Date().toISOString().slice(0, 10);
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="enquiries-${date}.csv"`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
