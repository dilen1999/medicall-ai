import type { Address } from "./address";
import type { DeliveryMethod, PaymentMethod } from "./cart";

export type OrderStatus =
  | "order_received"
  | "prescription_reviewing"
  | "prescription_approved"
  | "payment_confirmed"
  | "preparing_order"
  | "ready_for_collection"
  | "driver_assigned"
  | "out_for_delivery"
  | "nearby"
  | "delivered"
  | "cancelled"
  | "delivery_failed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderTab = "active" | "upcoming" | "past" | "cancelled";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  completed: boolean;
}

export interface Order {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  pharmacyId: string;
  pharmacyName: string;
  deliveryAddress: Address;
  deliveryMethod: DeliveryMethod;
  deliveryTimeSlot: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tax: number;
  total: number;
  estimatedDelivery: string;
  promotionCode?: string;
  cancellable: boolean;
  timeline: OrderTimelineEntry[];
}
