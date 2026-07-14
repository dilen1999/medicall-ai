import type { Order, OrderItem } from "@/types";
import { buildOrderTimeline } from "@/utils/orderStatus";
import { mockAddresses } from "./mockAddresses";

function items(...entries: OrderItem[]): OrderItem[] {
  return entries;
}

function pricing(subtotal: number, deliveryFee: number, discount = 0) {
  const serviceFee = Math.round(subtotal * 0.02);
  const tax = Math.round(subtotal * 0.05);
  return {
    subtotal,
    deliveryFee,
    serviceFee,
    discount,
    tax,
    total: subtotal + deliveryFee + serviceFee + tax - discount,
  };
}

const home = mockAddresses[0];
const office = mockAddresses[1];

export const mockOrders: Order[] = [
  {
    id: "order-1001",
    reference: "MC-100234",
    createdAt: "2026-07-14T07:30:00.000Z",
    status: "out_for_delivery",
    items: items(
      { id: "oi-1", productId: "prod-03", name: "Hand Sanitiser Gel 500ml", image: "sanitiser", price: 650, quantity: 2, prescriptionRequired: false },
      { id: "oi-2", productId: "prod-01", name: "Adhesive Bandages (Assorted, 40 pcs)", image: "bandages", price: 450, quantity: 1, prescriptionRequired: false },
    ),
    pharmacyId: "pharm-01",
    pharmacyName: "MediCall Central Pharmacy",
    deliveryAddress: home,
    deliveryMethod: "express",
    deliveryTimeSlot: "Today, as soon as possible",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
    ...pricing(1750, 350),
    estimatedDelivery: "2026-07-14T09:15:00.000Z",
    cancellable: false,
    timeline: buildOrderTimeline("out_for_delivery", "2026-07-14T07:30:00.000Z", false),
  },
  {
    id: "order-1002",
    reference: "MC-100235",
    createdAt: "2026-07-14T06:10:00.000Z",
    status: "preparing_order",
    items: items(
      { id: "oi-3", productId: "prod-11", name: "Amoxicillin 500mg Capsules", image: "capsule", price: 1150, quantity: 1, prescriptionRequired: true },
    ),
    pharmacyId: "pharm-01",
    pharmacyName: "MediCall Central Pharmacy",
    deliveryAddress: home,
    deliveryMethod: "standard",
    deliveryTimeSlot: "Today, 2:00 PM - 5:00 PM",
    paymentMethod: "card",
    paymentStatus: "paid",
    ...pricing(1150, 250),
    estimatedDelivery: "2026-07-14T11:00:00.000Z",
    cancellable: true,
    timeline: buildOrderTimeline("preparing_order", "2026-07-14T06:10:00.000Z", true),
  },
  {
    id: "order-1003",
    reference: "MC-100210",
    createdAt: "2026-07-13T12:00:00.000Z",
    status: "payment_confirmed",
    items: items(
      { id: "oi-4", productId: "prod-17", name: "Multivitamin Effervescent Tablets", image: "vitamins", price: 1450, quantity: 1, prescriptionRequired: false },
      { id: "oi-5", productId: "prod-10", name: "Oral Rehydration Salts", image: "ors", price: 480, quantity: 2, prescriptionRequired: false },
    ),
    pharmacyId: "pharm-03",
    pharmacyName: "MediCall Express Pharmacy - Galle",
    deliveryAddress: office,
    deliveryMethod: "scheduled",
    deliveryTimeSlot: "Tomorrow, 9:00 AM - 11:00 AM",
    paymentMethod: "online_payment",
    paymentStatus: "paid",
    ...pricing(2410, 300),
    estimatedDelivery: "2026-07-15T05:30:00.000Z",
    cancellable: true,
    timeline: buildOrderTimeline("payment_confirmed", "2026-07-13T12:00:00.000Z", false),
  },
  {
    id: "order-1004",
    reference: "MC-099876",
    createdAt: "2026-07-08T10:00:00.000Z",
    status: "delivered",
    items: items(
      { id: "oi-6", productId: "prod-06", name: "First Aid Kit (Home Essentials)", image: "firstaidkit", price: 3200, quantity: 1, prescriptionRequired: false },
    ),
    pharmacyId: "pharm-01",
    pharmacyName: "MediCall Central Pharmacy",
    deliveryAddress: home,
    deliveryMethod: "standard",
    deliveryTimeSlot: "8 Jul, 3:00 PM - 6:00 PM",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "paid",
    ...pricing(3200, 350),
    estimatedDelivery: "2026-07-08T11:45:00.000Z",
    cancellable: false,
    timeline: buildOrderTimeline("delivered", "2026-07-08T10:00:00.000Z", false),
  },
  {
    id: "order-1005",
    reference: "MC-099541",
    createdAt: "2026-06-29T08:00:00.000Z",
    status: "delivered",
    items: items(
      { id: "oi-7", productId: "prod-14", name: "Paracetamol 500mg Tablets", image: "tablet", price: 280, quantity: 3, prescriptionRequired: false },
      { id: "oi-8", productId: "prod-09", name: "Cotton Pads (100 pcs)", image: "cottonpads", price: 320, quantity: 1, prescriptionRequired: false },
    ),
    pharmacyId: "pharm-02",
    pharmacyName: "MediCall Wellness Pharmacy - Kandy",
    deliveryAddress: home,
    deliveryMethod: "pharmacy_collection",
    deliveryTimeSlot: "29 Jun, Collected in person",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "paid",
    ...pricing(1160, 0),
    estimatedDelivery: "2026-06-29T09:30:00.000Z",
    cancellable: false,
    timeline: buildOrderTimeline("delivered", "2026-06-29T08:00:00.000Z", false),
  },
  {
    id: "order-1006",
    reference: "MC-099102",
    createdAt: "2026-06-20T14:00:00.000Z",
    status: "cancelled",
    items: items(
      { id: "oi-9", productId: "prod-16", name: "Digital Blood Pressure Monitor", image: "bpmonitor", price: 6800, quantity: 1, prescriptionRequired: false },
    ),
    pharmacyId: "pharm-02",
    pharmacyName: "MediCall Wellness Pharmacy - Kandy",
    deliveryAddress: home,
    deliveryMethod: "standard",
    deliveryTimeSlot: "20 Jun, 1:00 PM - 4:00 PM",
    paymentMethod: "card",
    paymentStatus: "refunded",
    ...pricing(6800, 350),
    estimatedDelivery: "2026-06-20T15:30:00.000Z",
    cancellable: false,
    timeline: buildOrderTimeline("cancelled", "2026-06-20T14:00:00.000Z", false),
  },
];
