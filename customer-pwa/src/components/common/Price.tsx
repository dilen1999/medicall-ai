import { formatCurrency } from "@/utils/money";
import { cn } from "@/utils/cn";

interface PriceProps {
  amount: number;
  className?: string;
  originalAmount?: number;
}

export function Price({ amount, className, originalAmount }: PriceProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-ink dark:text-slate-100">{formatCurrency(amount)}</span>
      {originalAmount && originalAmount > amount && (
        <span className="text-xs text-ink-muted line-through">{formatCurrency(originalAmount)}</span>
      )}
    </span>
  );
}
