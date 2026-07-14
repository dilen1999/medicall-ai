import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOffline = useOnlineStatus();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You're offline. You can browse previously loaded products, but checkout, prescriptions and payments need a
      connection.
    </div>
  );
}
