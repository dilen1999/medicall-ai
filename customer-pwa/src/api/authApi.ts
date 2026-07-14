import type { User } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export interface AuthResult {
  user: User;
  token: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export const authApi = {
  async login(identifier: string, password: string): Promise<AuthResult> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.auth.login(identifier, password));
    }
    const { data } = await apiClient.post<AuthResult>("/auth/login", { identifier, password });
    return data;
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.auth.register(input));
    }
    const { data } = await apiClient.post<AuthResult>("/auth/register", input);
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.auth.forgotPassword(email));
    }
    const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
    return data;
  },

  async logout(): Promise<void> {
    if (apiConfig.useMocks) return;
    await apiClient.post("/auth/logout");
  },
};
