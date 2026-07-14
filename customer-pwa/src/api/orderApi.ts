import type { Address, CartItem, DeliveryMethod, DeliveryTracking, Order, PaymentMethod } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";
import { generateId } from "@/utils/id";

export interface CreateOrderInput {
  items: CartItem[];
  address: Address;
  deliveryMethod: DeliveryMethod;
  deliveryTimeSlot: string;
  paymentMethod: PaymentMethod;
  promotionCode?: string;
}

// The real backend's storefront order endpoints live under /storefront/orders
// rather than /orders - that path is reserved for the pre-existing,
// unauthenticated n8n/Twilio voice-call-confirmation flow (see
// backend/app/api/order_routes.py) and is intentionally left untouched.
const STOREFRONT_ORDERS_PATH = "/storefront/orders";

function toCartItemInput(item: CartItem) {
  return { productId: item.productId, quantity: item.quantity, prescriptionId: item.prescriptionId };
}

interface ReorderItemDto {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  packSize: string;
  stockQuantity: number;
  prescriptionRequired: boolean;
  pharmacyId: string;
  pharmacyName: string;
}

export const orderApi = {
  async list(): Promise<Order[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.orders.list());
    }
    const { data } = await apiClient.get<Order[]>(STOREFRONT_ORDERS_PATH);
    return data;
  },

  async get(id: string): Promise<Order> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.orders.get(id));
    }
    const { data } = await apiClient.get<Order>(`${STOREFRONT_ORDERS_PATH}/${id}`);
    return data;
  },

  async create(input: CreateOrderInput): Promise<Order> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.orders.create(input));
    }
    const { data } = await apiClient.post<Order>(STOREFRONT_ORDERS_PATH, {
      items: input.items.map(toCartItemInput),
      addressId: input.address.id,
      deliveryMethod: input.deliveryMethod,
      deliveryTimeSlot: input.deliveryTimeSlot,
      paymentMethod: input.paymentMethod,
      promotionCode: input.promotionCode,
    });
    return data;
  },

  async cancel(id: string): Promise<Order> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.orders.cancel(id));
    }
    const { data } = await apiClient.post<Order>(`${STOREFRONT_ORDERS_PATH}/${id}/cancel`);
    return data;
  },

  async reorder(id: string): Promise<CartItem[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.orders.reorder(id));
    }
    const { data } = await apiClient.post<ReorderItemDto[]>(`${STOREFRONT_ORDERS_PATH}/${id}/reorder`);
    return data.map((item) => ({
      id: generateId("cart-item"),
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      packSize: item.packSize,
      stockQuantity: item.stockQuantity,
      prescriptionRequired: item.prescriptionRequired,
      pharmacyId: item.pharmacyId,
      pharmacyName: item.pharmacyName,
    }));
  },

  async tracking(id: string): Promise<DeliveryTracking> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.delivery.tracking(id));
    }
    const { data } = await apiClient.get<DeliveryTracking>(`${STOREFRONT_ORDERS_PATH}/${id}/tracking`);
    return data;
  },
};
