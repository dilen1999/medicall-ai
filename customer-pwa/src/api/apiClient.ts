import axios, { isAxiosError } from "axios";
import { apiConfig } from "./apiConfig";
import { toApiError } from "./apiError";
import { clearAuthSession, readAuthToken, UNAUTHORIZED_EVENT } from "@/utils/authStorage";

export const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeoutMs,
});

apiClient.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(toApiError(error));
  },
);
