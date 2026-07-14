import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/api/cartApi";
import type { CartItem, DeliveryMethod } from "@/types";

export function useCheckoutPreview(items: CartItem[], deliveryMethod: DeliveryMethod, promotionCode?: string) {
  return useQuery({
    queryKey: ["checkout-preview", items, deliveryMethod, promotionCode],
    queryFn: () => cartApi.checkoutPreview(items, deliveryMethod, promotionCode),
    enabled: items.length > 0,
  });
}
