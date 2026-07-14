import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportApi, type CreateSupportCaseInput } from "@/api/supportApi";
import { useAuthStore } from "@/stores/authStore";

export const supportCasesQueryKey = ["support-cases"] as const;
export const supportCaseQueryKey = (id: string) => ["support-cases", id] as const;

export function useSupportCases() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: supportCasesQueryKey,
    queryFn: () => supportApi.listCases(),
    enabled: isAuthenticated,
  });
}

export function useSupportCase(id: string | undefined) {
  return useQuery({
    queryKey: supportCaseQueryKey(id ?? ""),
    queryFn: () => supportApi.getCase(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSupportCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupportCaseInput) => supportApi.createCase(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportCasesQueryKey }),
  });
}

export function usePostSupportMessage(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => supportApi.postMessage(caseId, message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportCaseQueryKey(caseId) }),
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (message: string) => supportApi.sendChatMessage(message),
  });
}
