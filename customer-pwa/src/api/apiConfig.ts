import { env } from "@/utils/env";

export const apiConfig = {
  baseURL: env.apiBaseUrl,
  timeoutMs: 15000,
  useMocks: env.enableMocks,
  mockLatencyMs: 450,
};
