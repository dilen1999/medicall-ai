import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, showBack, action }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-full p-2 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-ink dark:text-slate-100">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
