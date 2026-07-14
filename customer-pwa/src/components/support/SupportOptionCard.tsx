import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface SupportOptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function SupportOptionCard({ icon, title, description, onClick, href, className }: SupportOptionCardProps) {
  const content = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary-dark dark:bg-teal-900/40 dark:text-teal-300">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink dark:text-slate-100">{title}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
    </>
  );

  const sharedClass = cn(
    "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition-transform hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900",
    className,
  );

  if (href) {
    return (
      <a href={href} className={sharedClass}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClass}>
      {content}
    </button>
  );
}
