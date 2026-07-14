import { create } from "zustand";
import type { User } from "@/types";
import type { RegisterInput } from "@/api/authApi";
import { authApi } from "@/api/authApi";
import {
  clearAuthSession,
  readAuthToken,
  readAuthUser,
  UNAUTHORIZED_EVENT,
  writeAuthToken,
  writeAuthUser,
} from "@/utils/authStorage";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  redirectPath: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setRedirectPath: (path: string | null) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: readAuthUser(),
  token: readAuthToken(),
  isAuthenticated: Boolean(readAuthToken()),
  redirectPath: null,

  login: async (identifier, password) => {
    const { user, token } = await authApi.login(identifier, password);
    writeAuthToken(token);
    writeAuthUser(user);
    set({ user, token, isAuthenticated: true });
  },

  register: async (input) => {
    const { user, token } = await authApi.register(input);
    writeAuthToken(token);
    writeAuthUser(user);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    clearAuthSession();
    void authApi.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setRedirectPath: (path) => set({ redirectPath: path }),

  setUser: (user) => {
    writeAuthUser(user);
    set({ user });
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener(UNAUTHORIZED_EVENT, () => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });
}
