import { isAxiosError } from "axios";
import type { ApiError, ApiErrorCode } from "@/types";

export class MockApiError extends Error {
  code: ApiErrorCode;
  fieldErrors?: Record<string, string>;

  constructor(code: ApiErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function codeFromStatus(status: number | undefined): ApiErrorCode {
  if (!status) return "NETWORK_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

export async function withMockErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return Promise.reject(toApiError(error));
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof MockApiError) {
    return { code: error.code, message: error.message, fieldErrors: error.fieldErrors };
  }

  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return { code: "TIMEOUT", message: "The request took too long. Please try again." };
    }
    if (!error.response) {
      return {
        code: "NETWORK_ERROR",
        message: "You appear to be offline. Please check your connection and try again.",
      };
    }
    const status = error.response.status;
    const body = error.response.data as { message?: string; errors?: Record<string, string> } | undefined;
    return {
      code: codeFromStatus(status),
      message: body?.message ?? "Something went wrong. Please try again.",
      status,
      fieldErrors: body?.errors,
    };
  }

  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message };
  }

  return { code: "UNKNOWN", message: "An unexpected error occurred." };
}
