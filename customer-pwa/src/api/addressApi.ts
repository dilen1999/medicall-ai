import type { Address, AddressInput } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export const addressApi = {
  async list(): Promise<Address[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.addresses.list());
    }
    const { data } = await apiClient.get<Address[]>("/addresses");
    return data;
  },

  async create(input: AddressInput): Promise<Address> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.addresses.create(input));
    }
    const { data } = await apiClient.post<Address>("/addresses", input);
    return data;
  },

  async update(id: string, patch: Partial<AddressInput>): Promise<Address> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.addresses.update(id, patch));
    }
    const { data } = await apiClient.patch<Address>(`/addresses/${id}`, patch);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.addresses.remove(id));
    }
    await apiClient.delete(`/addresses/${id}`);
  },
};
