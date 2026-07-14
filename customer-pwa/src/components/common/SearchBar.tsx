import { Mic, Search } from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
  showVoiceIcon?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search products, brands or categories",
  onSubmit,
  className,
  showVoiceIcon = true,
}: SearchBarProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
      className={cn(
        "flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <Search className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
      <label htmlFor="global-search" className="sr-only">
        Search
      </label>
      <input
        id="global-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
      {showVoiceIcon && (
        <button
          type="button"
          aria-label="Voice search (coming soon)"
          title="Voice search (coming soon)"
          className="shrink-0 rounded-full p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Mic className="h-5 w-5" />
        </button>
      )}
    </form>
  );
}
