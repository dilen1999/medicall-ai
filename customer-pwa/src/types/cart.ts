export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  packSize: string;
  stockQuantity: number;
  prescriptionRequired: boolean;
  prescriptionId?: string;
  pharmacyId: string;
  pharmacyName: string;
}

export interface Cart {
  items: CartItem[];
  promotionCode?: string;
}

export type DeliveryMethod = "standard" | "express" | "scheduled" | "pharmacy_collection";

export type PaymentMethod = "cash_on_delivery" | "card" | "online_payment";

export interface CheckoutPreview {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tax: number;
  total: number;
  promotionApplied?: string;
  promotionError?: string;
  estimatedDeliveryWindow?: string;
}
