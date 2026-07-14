import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface AppTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AppTextArea = forwardRef<HTMLTextAreaElement, AppTextAreaProps>(
  ({ label, error, hint, id, className, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-ink dark:text-slate-200">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
            error && "border-danger",
            className,
          )}
          {...props}
        />
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);

AppTextArea.displayName = "AppTextArea";
