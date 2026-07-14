import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/common/AppButton";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { useNotifications, notificationsQueryKey } from "@/features/notifications/useNotifications";
import { notificationApi } from "@/api/notificationApi";
import type { NotificationType } from "@/types";

const typeOptions: { label: string; value: NotificationType | "" }[] = [
  { label: "All types", value: "" },
  { label: "Orders", value: "order_confirmed" },
  { label: "Prescriptions", value: "prescription_submitted" },
  { label: "Delivery", value: "driver_nearby" },
  { label: "Support", value: "support_case_updated" },
  { label: "Promotions", value: "promotion" },
];

export function NotificationsPage() {
  const { data: notifications, isLoading, isError, refetch } = useNotifications();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");

  const filtered = useMemo(() => {
    if (!notifications) return [];
    if (!typeFilter) return notifications;
    return notifications.filter((n) => n.type === typeFilter);
  }, [notifications, typeFilter]);

  async function handleRead(id: string) {
    await notificationApi.markRead(id);
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
  }

  async function handleDelete(id: string) {
    await notificationApi.remove(id);
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        action={
          <AppButton size="sm" variant="outline" onClick={handleMarkAllRead}>
            Mark all read
          </AppButton>
        }
      />

      <AppSelect
        label="Filter by type"
        options={typeOptions}
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value as NotificationType | "")}
        className="mb-4 max-w-xs"
      />

      {isLoading ? (
        <LoadingSpinner label="Loading notifications" />
      ) : isError ? (
        <ErrorState message="We couldn't load your notifications." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
