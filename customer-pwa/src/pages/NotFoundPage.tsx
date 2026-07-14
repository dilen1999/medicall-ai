import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <SearchX className="h-14 w-14 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-ink dark:text-slate-100">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        We couldn't find the page you were looking for. It may have been moved or no longer exists.
      </p>
      <Link to="/">
        <AppButton>Back to home</AppButton>
      </Link>
    </div>
  );
}
