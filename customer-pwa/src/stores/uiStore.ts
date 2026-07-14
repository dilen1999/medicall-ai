import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  activeAddressId: string | null;
  isOffline: boolean;
  setActiveAddressId: (id: string | null) => void;
  setOffline: (isOffline: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeAddressId: null,
      isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
      setActiveAddressId: (id) => set({ activeAddressId: id }),
      setOffline: (isOffline) => set({ isOffline }),
    }),
    {
      name: "medicall.ui",
      partialize: (state) => ({ activeAddressId: state.activeAddressId }),
    },
  ),
);
