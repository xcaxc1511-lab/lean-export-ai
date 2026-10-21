import { createFileRoute } from "@tanstack/react-router";
import { isAdmin } from "@/server/auth";
import { enquiriesCsv } from "@/server/enquiries-csv";

/** Admin-only CSV export of enquiries; honours the same filters as the dashboard. */
export const Route = createFileRoute("/api/admin/enquiries.csv")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
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
