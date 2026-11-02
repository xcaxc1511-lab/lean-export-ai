import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** "YYYY-MM-DDTHH:mm" in local time, for <input type="datetime-local">. */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Pick the go-live date and time for a post (browser's local time zone). */
export function ScheduleDialog({
  open,
  onOpenChange,
  current,
  onSchedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing schedule (ISO), if any. */
  current: string | null;
  onSchedule: (iso: string) => void;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!open) return;
    const future = current && current > new Date().toISOString() ? new Date(current) : null;
    const next = future ?? new Date(Date.now() + 60 * 60_000);
    if (!future) next.setMinutes(0, 0, 0);
    setValue(toLocalInput(next));
  }, [open, current]);

  const when = value ? new Date(value) : null;
  const valid = !!when && when.getTime() > Date.now() + 60_000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[80] max-w-sm bg-white">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-admin-ink">
          <CalendarClock className="h-5 w-5 text-admin-blue" /> Hẹn giờ đăng bài
        </DialogTitle>
        <DialogDescription className="text-sm text-admin-dim">
          Đến giờ đã chọn, bài tự hiện trên website, trang Tin tức và sitemap.
        </DialogDescription>
        <label className="admin-label">
          Ngày và giờ đăng
          <input
            type="datetime-local"
            className="admin-input"
            value={value}
            min={toLocalInput(new Date())}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className="admin-hint">
            Theo giờ trên máy bạn
            {when && valid
              ? `: ${when.toLocaleString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : "."}
          </span>
        </label>
        {!valid && value && (
          <p className="text-sm text-[#b42318]">Chọn một thời điểm trong tương lai.</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={!valid}
            onClick={() => {
              if (!when) return;
              onSchedule(when.toISOString());
              onOpenChange(false);
            }}
          >
            Hẹn giờ đăng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
