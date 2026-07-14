import { create } from "zustand";
import { persist } from "zustand/middleware";
import { env } from "@/utils/env";
import type { PreferredLanguage } from "@/types";

interface LanguageState {
  language: PreferredLanguage;
  setLanguage: (language: PreferredLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: (env.defaultLanguage as PreferredLanguage) ?? "en",
      setLanguage: (language) => set({ language }),
    }),
    { name: "medicall.language" },
  ),
);
