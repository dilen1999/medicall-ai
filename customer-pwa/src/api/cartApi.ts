import type { CartItem, CheckoutPreview, DeliveryMethod } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export const cartApi = {
  async validate(items: CartItem[]): Promise<{ valid: boolean; errors: string[] }> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.cart.validate(items));
    }
    const { data } = await apiClient.post<{ valid: boolean; errors: string[] }>("/cart/validate", { items });
    return data;
  },

  async checkoutPreview(
    items: CartItem[],
    deliveryMethod: DeliveryMethod,
    promotionCode?: string,
  ): Promise<CheckoutPreview> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.cart.checkoutPreview(items, deliveryMethod, promotionCode));
    }
    const { data } = await apiClient.post<CheckoutPreview>("/cart/apply-promotion", {
      items,
      deliveryMethod,
      promotionCode,
    });
    return data;
  },
};
