import { useState } from "react";
import { Bell, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAlertsStore } from "../stores/alertsStore";
import { navigate } from "../platform/router";
import type { AppNotification } from "../domain/alertTypes";

const ICON: Record<AppNotification["type"], typeof FileText> = {
  "draft-saved": FileText, "simulation-completed": CheckCircle2, "simulation-failures": AlertTriangle, "data-error": AlertTriangle,
};

export default function NotificationsPanel({ variant = "inline", runIdFilter, onClose }: { variant?: "inline" | "popover"; runIdFilter?: string; onClose?: () => void }) {
  const { notifications, markRead, markAllRead } = useAlertsStore();
  const [tab, setTab] = useState<"this" | "all">(runIdFilter ? "this" : "all");

  const scoped = runIdFilter ? notifications.filter((n) => n.runId === runIdFilter) : notifications;
  const list = tab === "this" && runIdFilter ? scoped : notifications;

  const open = (n: AppNotification) => { markRead(n.id); if (n.runId) navigate(`/app/alerts/run/${n.runId}`); onClose?.(); };

  const containerClass = variant === "inline"
    ? "w-[360px] max-[1099px]:hidden shrink-0 h-full border-l border-border bg-surface overflow-y-auto"
    : "absolute top-full mt-1.5 right-0 w-[360px] max-h-[70vh] overflow-y-auto bg-surface border border-border rounded-xl shadow-2xl z-40";

  return (
    <div className={containerClass}>
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">{runIdFilter ? "Activity & notifications" : "Notifications"}</div>
        <button onClick={markAllRead} className="text-[11px] text-action hover:underline">Mark all as read</button>
      </div>
      {runIdFilter && (
        <div className="flex items-center gap-4 px-4 pt-2 border-b border-border">
          <TabBtn active={tab === "this"} onClick={() => setTab("this")}>This exercise</TabBtn>
          <TabBtn active={tab === "all"} onClick={() => setTab("all")}>Workspace</TabBtn>
        </div>
      )}
      <div className="p-3 space-y-1">
        {list.length === 0 && <div className="text-xs text-faint px-2 py-6 text-center">No notifications yet.</div>}
        {list.map((n) => {
          const Icon = ICON[n.type];
          return (
            <button key={n.id} onClick={() => open(n)} className={`w-full flex items-start gap-2.5 text-left rounded-lg px-2.5 py-2.5 hover:bg-hover ${!n.readAt ? "bg-action/[0.06]" : ""}`}>
              <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${n.type === "simulation-completed" ? "bg-success/15 text-success" : n.type === "simulation-failures" ? "bg-priority/15 text-priority" : "bg-field text-muted"}`}><Icon size={13} /></span>
              <span className="flex-1 min-w-0">
                <span className="text-xs text-ink block leading-snug">{n.text}</span>
                <span className="text-[10px] text-faint">{new Date(n.createdAt).toLocaleTimeString()}</span>
              </span>
              {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-action shrink-0 mt-1.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`relative pb-2 text-xs font-medium ${active ? "text-ink" : "text-faint hover:text-muted"}`}>
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-action rounded-full" />}
    </button>
  );
}

export function NotificationsBellButton() {
  const [open, setOpen] = useState(false);
  const unread = useAlertsStore((s) => s.notifications.filter((n) => !n.readAt).length);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} title="Notifications" className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-hover">
        <Bell size={16} />
        {unread > 0 && <span className="absolute top-1 right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
      </button>
      {open && <NotificationsPanel variant="popover" onClose={() => setOpen(false)} />}
    </div>
  );
}
