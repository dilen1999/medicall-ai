import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/api/notificationApi";
import { useAuthStore } from "@/stores/authStore";

export const notificationsQueryKey = ["notifications"] as const;

export function useNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => notificationApi.list(),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 30_000 : false,
  });
}

export function useUnreadNotificationCount(): number {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}
