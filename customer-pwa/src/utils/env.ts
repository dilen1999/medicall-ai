interface AppEnv {
  appName: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
  enableMocks: boolean;
  defaultLanguage: string;
  supportPhone: string;
  supportEmail: string;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true";
}

export const env: AppEnv = {
  appName: import.meta.env.VITE_APP_NAME ?? "MediCall Care",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000",
  enableMocks: readBoolean(import.meta.env.VITE_ENABLE_MOCKS, true),
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? "en",
  supportPhone: import.meta.env.VITE_SUPPORT_PHONE ?? "+94000000000",
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? "support@medicall.local",
};
