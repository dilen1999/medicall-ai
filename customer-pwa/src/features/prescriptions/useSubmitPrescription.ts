import { useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionApi, type PrescriptionUploadInput } from "@/api/prescriptionApi";
import { prescriptionsQueryKey } from "./usePrescriptions";

export function useSubmitPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PrescriptionUploadInput) => prescriptionApi.submit(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prescriptionsQueryKey }),
  });
}
