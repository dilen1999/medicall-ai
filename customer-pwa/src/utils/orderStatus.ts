import type { Order, OrderStatus, OrderTab, OrderTimelineEntry } from "@/types";

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "order_received",
  "prescription_reviewing",
  "prescription_approved",
  "payment_confirmed",
  "preparing_order",
  "ready_for_collection",
  "driver_assigned",
  "out_for_delivery",
  "nearby",
  "delivered",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  order_received: "Order Received",
  prescription_reviewing: "Prescription Reviewing",
  prescription_approved: "Prescription Approved",
  payment_confirmed: "Payment Confirmed",
  preparing_order: "Preparing Order",
  ready_for_collection: "Ready for Collection",
  driver_assigned: "Driver Assigned",
  out_for_delivery: "Out for Delivery",
  nearby: "Nearby",
  delivered: "Delivered",
  cancelled: "Cancelled",
  delivery_failed: "Delivery Failed",
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "order_received",
  "prescription_reviewing",
  "prescription_approved",
  "payment_confirmed",
  "preparing_order",
  "ready_for_collection",
  "driver_assigned",
  "out_for_delivery",
  "nearby",
];

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === "delivered" || status === "cancelled" || status === "delivery_failed";
}

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export function getOrderTab(order: Order): OrderTab {
  if (order.status === "cancelled" || order.status === "delivery_failed") return "cancelled";
  if (order.status === "delivered") return "past";
  if (order.deliveryMethod === "scheduled" && (order.status === "order_received" || order.status === "payment_confirmed")) {
    return "upcoming";
  }
  return "active";
}

export function getOrderStatusTone(status: OrderStatus): StatusTone {
  if (status === "delivered") return "success";
  if (status === "cancelled" || status === "delivery_failed") return "danger";
  if (status === "order_received" || status === "prescription_reviewing") return "neutral";
  return "info";
}

export function buildOrderTimeline(
  currentStatus: OrderStatus,
  referenceTimestamp: string,
  requiresPrescriptionReview: boolean,
): OrderTimelineEntry[] {
  const steps = requiresPrescriptionReview
    ? ORDER_STATUS_SEQUENCE
    : ORDER_STATUS_SEQUENCE.filter(
        (step) => step !== "prescription_reviewing" && step !== "prescription_approved",
      );

  if (currentStatus === "cancelled" || currentStatus === "delivery_failed") {
    return [
      {
        status: "order_received",
        label: ORDER_STATUS_LABELS.order_received,
        timestamp: referenceTimestamp,
        completed: true,
      },
      {
        status: currentStatus,
        label: ORDER_STATUS_LABELS[currentStatus],
        timestamp: referenceTimestamp,
        completed: true,
      },
    ];
  }

  const currentIndex = steps.indexOf(currentStatus);
  const base = new Date(referenceTimestamp).getTime();

  return steps.map((step, index) => {
    const completed = index <= currentIndex;
    return {
      status: step,
      label: ORDER_STATUS_LABELS[step],
      timestamp: completed ? new Date(base + index * 20 * 60 * 1000).toISOString() : null,
      completed,
    };
  });
}
