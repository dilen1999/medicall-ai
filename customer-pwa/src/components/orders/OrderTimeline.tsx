import { Check } from "lucide-react";
import type { OrderTimelineEntry } from "@/types";
import { formatDateTime } from "@/utils/date";
import { cn } from "@/utils/cn";

export function OrderTimeline({ entries }: { entries: OrderTimelineEntry[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {entries.map((entry, index) => (
        <li key={entry.status} className="relative flex gap-3 pb-6 last:pb-0">
          {index < entries.length - 1 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-[11px] top-6 h-full w-0.5",
                entry.completed ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
              )}
            />
          )}
          <span
            className={cn(
              "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              entry.completed ? "bg-primary text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-700",
            )}
          >
            {entry.completed && <Check className="h-3.5 w-3.5" />}
          </span>
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                entry.completed ? "text-ink dark:text-slate-100" : "text-ink-muted",
              )}
            >
              {entry.label}
            </p>
            {entry.timestamp && (
              <p className="text-xs text-ink-muted">{formatDateTime(entry.timestamp)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
