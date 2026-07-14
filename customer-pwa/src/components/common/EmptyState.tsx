import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <div className="text-slate-400">{icon ?? <PackageSearch className="h-10 w-10" aria-hidden="true" />}</div>
      <h3 className="text-base font-semibold text-ink dark:text-slate-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
