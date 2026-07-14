import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";

export function UpdateAvailablePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => {
      console.error("Service worker registration failed", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-30 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary-light p-4 shadow-card dark:border-teal-700 dark:bg-teal-950 md:inset-x-auto md:bottom-4 md:right-4 md:w-96"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary-dark">
        <RefreshCw className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary-dark">Update available</p>
        <p className="text-xs text-primary-dark/80">Reload to get the latest version of MediCall Care.</p>
      </div>
      <AppButton size="sm" onClick={() => updateServiceWorker(true)}>
        Reload
      </AppButton>
      <button
        type="button"
        aria-label="Dismiss update prompt"
        onClick={() => setNeedRefresh(false)}
        className="text-xs font-medium text-primary-dark underline"
      >
        Later
      </button>
    </div>
  );
}
