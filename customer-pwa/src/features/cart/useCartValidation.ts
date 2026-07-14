import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/api/cartApi";
import type { CartItem } from "@/types";

export function useCartValidation(items: CartItem[]) {
  return useQuery({
    queryKey: ["cart-validate", items],
    queryFn: () => cartApi.validate(items),
    enabled: items.length > 0,
  });
}
