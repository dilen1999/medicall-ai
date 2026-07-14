import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export function LoadingSpinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center justify-center gap-2 py-8", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
