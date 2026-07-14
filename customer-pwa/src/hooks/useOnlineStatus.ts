import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";

export function useOnlineStatus(): boolean {
  const isOffline = useUiStore((state) => state.isOffline);
  const setOffline = useUiStore((state) => state.setOffline);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [setOffline]);

  return isOffline;
}
