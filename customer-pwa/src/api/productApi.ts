import type { Category, PaginatedResponse, Product, ProductFilters } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export const productApi = {
  async list(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.products.list(filters));
    }
    const { data } = await apiClient.get<PaginatedResponse<Product>>("/products", { params: filters });
    return data;
  },

  async get(id: string): Promise<Product> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.products.get(id));
    }
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  async categories(): Promise<Category[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.products.categories());
    }
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },
};
