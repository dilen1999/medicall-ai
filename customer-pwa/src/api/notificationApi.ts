import type { AppNotification } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export const notificationApi = {
  async list(): Promise<AppNotification[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.notifications.list());
    }
    const { data } = await apiClient.get<AppNotification[]>("/notifications");
    return data;
  },

  async markRead(id: string): Promise<void> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.notifications.markRead(id));
    }
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.notifications.markAllRead());
    }
    await apiClient.post("/notifications/read-all");
  },

  async remove(id: string): Promise<void> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.notifications.remove(id));
    }
    await apiClient.delete(`/notifications/${id}`);
  },
};
