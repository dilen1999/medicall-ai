import { useQuery } from "@tanstack/react-query";
import { prescriptionApi } from "@/api/prescriptionApi";
import { useAuthStore } from "@/stores/authStore";

export const prescriptionsQueryKey = ["prescriptions"] as const;

export function usePrescriptions() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: prescriptionsQueryKey,
    queryFn: () => prescriptionApi.list(),
    enabled: isAuthenticated,
  });
}

export function useApprovedPrescriptionId(): string | undefined {
  const { data } = usePrescriptions();
  return data?.find((p) => p.status === "approved" || p.status === "partially_approved")?.id;
}
