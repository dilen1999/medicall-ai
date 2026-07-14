import { AlertTriangle } from "lucide-react";
import { AppButton } from "./AppButton";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/20 bg-red-50 px-6 py-10 text-center dark:bg-red-950/20">
      <AlertTriangle className="h-9 w-9 text-danger" aria-hidden="true" />
      <h3 className="text-base font-semibold text-ink dark:text-slate-100">{title}</h3>
      <p className="max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <AppButton variant="outline" onClick={onRetry}>
          Try again
        </AppButton>
      )}
    </div>
  );
}
