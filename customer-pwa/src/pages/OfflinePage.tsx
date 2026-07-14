import { Link } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";

export function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <WifiOff className="h-14 w-14 text-ink-muted" aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-ink dark:text-slate-100">You're offline</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        We can't reach MediCall Care right now. You can still browse previously loaded products and view cached
        order summaries. Checkout, prescriptions and payments need an internet connection.
      </p>
      <Link to="/products">
        <AppButton>Browse cached products</AppButton>
      </Link>
    </div>
  );
}
