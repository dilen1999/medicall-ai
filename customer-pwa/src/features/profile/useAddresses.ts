import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "@/api/addressApi";
import type { AddressInput } from "@/types";
import { useAuthStore } from "@/stores/authStore";

export const addressesQueryKey = ["addresses"] as const;

export function useAddresses() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: addressesQueryKey,
    queryFn: () => addressApi.list(),
    enabled: isAuthenticated,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => addressApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressesQueryKey }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AddressInput> }) => addressApi.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressesQueryKey }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressesQueryKey }),
  });
}
