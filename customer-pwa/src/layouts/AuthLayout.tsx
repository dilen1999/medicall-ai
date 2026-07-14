import { Link, Outlet } from "react-router-dom";
import { HeartPulse } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-surface px-4 py-10 dark:bg-slate-950">
      <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-semibold text-primary-dark">
        <HeartPulse className="h-6 w-6" aria-hidden="true" />
        MediCall Care
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <Outlet />
      </div>
    </div>
  );
}
