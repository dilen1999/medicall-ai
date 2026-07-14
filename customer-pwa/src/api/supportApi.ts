import type { ChatMessage, PreferredContactMethod, SupportCase, SupportIssueCategory, SupportMessage } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export interface CreateSupportCaseInput {
  relatedOrderId?: string;
  category: SupportIssueCategory;
  description: string;
  preferredContactMethod: PreferredContactMethod;
  preferredCallbackTime?: string;
}

export const supportApi = {
  async listCases(): Promise<SupportCase[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.support.listCases());
    }
    const { data } = await apiClient.get<SupportCase[]>("/support/cases");
    return data;
  },

  async getCase(id: string): Promise<SupportCase> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.support.getCase(id));
    }
    const { data } = await apiClient.get<SupportCase>(`/support/cases/${id}`);
    return data;
  },

  async createCase(input: CreateSupportCaseInput): Promise<SupportCase> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.support.createCase(input));
    }
    const { data } = await apiClient.post<SupportCase>("/support/cases", input);
    return data;
  },

  async postMessage(caseId: string, message: string): Promise<SupportMessage> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.support.postMessage(caseId, message));
    }
    const { data } = await apiClient.post<SupportMessage>(`/support/cases/${caseId}/messages`, { message });
    return data;
  },

  async requestPharmacistCallback(input: {
    relatedOrderId?: string;
    preferredCallbackTime?: string;
    description: string;
  }): Promise<SupportCase> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.support.requestPharmacistCallback(input));
    }
    const { data } = await apiClient.post<SupportCase>("/support/pharmacist-callback", input);
    return data;
  },

  async sendChatMessage(message: string): Promise<ChatMessage> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.support.sendChatMessage(message));
    }
    const { data } = await apiClient.post<ChatMessage>("/support/ai-chat", { message });
    return data;
  },
};
