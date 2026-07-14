import { cn } from "@/utils/cn";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900", className)}
    >
      <div className="mb-3 h-28 w-full rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="mb-2 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
