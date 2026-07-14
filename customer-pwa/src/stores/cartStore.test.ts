import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore, selectSubtotal } from "./cartStore";
import type { CartItem } from "@/types";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: overrides.id ?? "cart-item-1",
    productId: overrides.productId ?? "prod-01",
    name: overrides.name ?? "Hand Sanitiser Gel 500ml",
    image: overrides.image ?? "sanitiser",
    price: overrides.price ?? 650,
    quantity: overrides.quantity ?? 1,
    packSize: overrides.packSize ?? "500 ml",
    stockQuantity: overrides.stockQuantity ?? 10,
    prescriptionRequired: overrides.prescriptionRequired ?? false,
    pharmacyId: overrides.pharmacyId ?? "pharm-01",
    pharmacyName: overrides.pharmacyName ?? "MediCall Central Pharmacy",
    ...overrides,
  };
}

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("adds a product to the cart", () => {
    useCartStore.getState().addItem(makeItem());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe("prod-01");
  });

  it("increases quantity for an existing product instead of duplicating it", () => {
    useCartStore.getState().addItem(makeItem());
    useCartStore.getState().addItem(makeItem());
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("increments and decrements quantity within stock bounds", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1, stockQuantity: 2 }));
    const id = useCartStore.getState().items[0].id;

    useCartStore.getState().increment(id);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    useCartStore.getState().increment(id);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    useCartStore.getState().decrement(id);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("removes a product from the cart", () => {
    useCartStore.getState().addItem(makeItem());
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calculates the estimated subtotal", () => {
    useCartStore.getState().addItem(makeItem({ id: "a", productId: "prod-01", price: 650, quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ id: "b", productId: "prod-02", price: 450, quantity: 1 }));
    const subtotal = selectSubtotal(useCartStore.getState().items);
    expect(subtotal).toBe(650 * 2 + 450);
  });
});
