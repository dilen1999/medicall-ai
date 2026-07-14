export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "SERVER_ERROR"
  | "UNKNOWN";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
}

export type PreferredContactMethod = "phone" | "email" | "app_notification";

export type SortDirection = "asc" | "desc";
