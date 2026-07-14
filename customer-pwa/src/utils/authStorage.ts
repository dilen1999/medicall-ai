import type { User } from "@/types";

// Production authentication should use secure HttpOnly cookies or an
// equivalent secure token strategy. sessionStorage is used here only to
// support the mock/demo authentication flow for this frontend-only build.
const TOKEN_KEY = "medicall.auth.token";
const USER_KEY = "medicall.auth.user";

export function readAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function writeAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function readAuthUser(): User | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function writeAuthUser(user: User): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export const UNAUTHORIZED_EVENT = "medicall:unauthorized";
