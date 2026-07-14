import type { CustomerProfile } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export const profileApi = {
  async get(): Promise<CustomerProfile> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.profile.get());
    }
    const { data } = await apiClient.get<CustomerProfile>("/customers/me");
    return data;
  },

  async update(patch: Partial<CustomerProfile>): Promise<CustomerProfile> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.profile.update(patch));
    }
    const { data } = await apiClient.patch<CustomerProfile>("/customers/me", patch);
    return data;
  },
};
