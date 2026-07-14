import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface Option {
  label: string;
  value: string;
}

interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ label, error, options, placeholder, id, className, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-ink dark:text-slate-200">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-ink",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
            error && "border-danger",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

AppSelect.displayName = "AppSelect";
