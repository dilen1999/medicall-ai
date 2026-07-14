import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  promotionCode?: string;
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  increment: (cartItemId: string) => void;
  decrement: (cartItemId: string) => void;
  clear: () => void;
  setPromotionCode: (code: string | undefined) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promotionCode: undefined,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const nextQuantity = Math.min(existing.quantity + item.quantity, existing.stockQuantity);
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, quantity: nextQuantity } : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (cartItemId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== cartItemId) })),

      setQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === cartItemId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stockQuantity)) }
              : i,
          ),
        })),

      increment: (cartItemId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity: Math.min(i.quantity + 1, i.stockQuantity) } : i,
          ),
        })),

      decrement: (cartItemId) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === cartItemId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity >= 1),
        })),

      clear: () => set({ items: [], promotionCode: undefined }),

      setPromotionCode: (code) => set({ promotionCode: code }),
    }),
    {
      name: "medicall.cart",
      partialize: (state) => ({ items: state.items, promotionCode: state.promotionCode }),
    },
  ),
);

export function selectSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function selectItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectHasUnapprovedPrescriptionItem(items: CartItem[]): boolean {
  return items.some((item) => item.prescriptionRequired && !item.prescriptionId);
}
