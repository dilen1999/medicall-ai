import { useState } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { AppButton } from "@/components/common/AppButton";

export function InstallAppPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || isInstalled || dismissed) return null;

  return (
    <div
      role="complementary"
      aria-label="Install MediCall Care"
      className="fixed inset-x-4 bottom-20 z-30 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900 md:inset-x-auto md:bottom-4 md:right-4 md:w-96"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-dark">
        <Download className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink dark:text-slate-100">Install MediCall Care</p>
        <p className="text-xs text-ink-muted">Add the app to your home screen for faster access.</p>
      </div>
      <AppButton size="sm" onClick={promptInstall}>
        Install
      </AppButton>
      <button
        type="button"
        aria-label="Dismiss install prompt"
        onClick={() => setDismissed(true)}
        className="rounded-full p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
