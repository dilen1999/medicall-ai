import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/api/profileApi";
import type { CustomerProfile } from "@/types";
import { useAuthStore } from "@/stores/authStore";

export const profileQueryKey = ["profile"] as const;

export function useProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => profileApi.get(),
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: (patch: Partial<CustomerProfile>) => profileApi.update(patch),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      setUser(profile);
    },
  });
}
