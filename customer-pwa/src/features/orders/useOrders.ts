import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi, type CreateOrderInput } from "@/api/orderApi";
import { useAuthStore } from "@/stores/authStore";

export const ordersQueryKey = ["orders"] as const;
export const orderQueryKey = (id: string) => ["orders", id] as const;
export const trackingQueryKey = (id: string) => ["orders", id, "tracking"] as const;

export function useOrders() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => orderApi.list(),
    enabled: isAuthenticated,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderQueryKey(id ?? ""),
    queryFn: () => orderApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useOrderTracking(id: string | undefined) {
  return useQuery({
    queryKey: trackingQueryKey(id ?? ""),
    queryFn: () => orderApi.tracking(id as string),
    enabled: Boolean(id),
    refetchInterval: 4000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => orderApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderApi.cancel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      queryClient.invalidateQueries({ queryKey: orderQueryKey(id) });
    },
  });
}

export function useReorder() {
  return useMutation({
    mutationFn: (id: string) => orderApi.reorder(id),
  });
}
