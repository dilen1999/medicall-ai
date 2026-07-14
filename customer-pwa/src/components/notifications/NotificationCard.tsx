import { Link } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
import type { AppNotification } from "@/types";
import { formatRelativeTime } from "@/utils/date";
import { cn } from "@/utils/cn";

interface NotificationCardProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationCard({ notification, onRead, onDelete }: NotificationCardProps) {
  const body = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-1 h-2 w-2 shrink-0 rounded-full",
          notification.read ? "bg-transparent" : "bg-primary",
        )}
        aria-hidden="true"
      />
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink dark:text-slate-100">{notification.title}</p>
        <p className="text-sm text-ink-muted">{notification.message}</p>
        <p className="mt-1 text-xs text-ink-muted">{formatRelativeTime(notification.createdAt)}</p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onDelete(notification.id);
        }}
        aria-label="Delete notification"
        className="rounded-full p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const className = cn(
    "block rounded-2xl border p-4 shadow-card dark:bg-slate-900",
    notification.read ? "border-slate-200 dark:border-slate-700" : "border-primary/30 bg-primary-light/20",
  );

  if (notification.linkTo) {
    return (
      <Link to={notification.linkTo} onClick={() => onRead(notification.id)} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <div
      className={className}
      onClick={() => onRead(notification.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onRead(notification.id);
      }}
      role="button"
      tabIndex={0}
    >
      {body}
    </div>
  );
}
