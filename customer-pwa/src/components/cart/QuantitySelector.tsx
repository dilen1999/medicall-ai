import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label?: string;
}

export function QuantitySelector({ quantity, max, onIncrement, onDecrement, label }: QuantitySelectorProps) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-300 px-1 py-1 dark:border-slate-600">
      <button
        type="button"
        onClick={onDecrement}
        disabled={quantity <= 1}
        aria-label={`Decrease quantity${label ? ` of ${label}` : ""}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-slate-100 disabled:opacity-40 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span aria-live="polite" className="w-6 text-center text-sm font-medium text-ink dark:text-slate-100">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= max}
        aria-label={`Increase quantity${label ? ` of ${label}` : ""}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-slate-100 disabled:opacity-40 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
