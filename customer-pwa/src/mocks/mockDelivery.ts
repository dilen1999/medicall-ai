import type { DeliveryTracking, Driver } from "@/types";

export const mockDriver: Driver = {
  id: "driver-01",
  name: "Kasun Silva",
  vehicleNumber: "WP CAB-4521",
  phoneNumber: "+94770001122",
  rating: 4.9,
};

export const mockDeliveryTracking: DeliveryTracking = {
  orderId: "order-1001",
  status: "out_for_delivery",
  estimatedArrival: "2026-07-14T09:15:00.000Z",
  driver: mockDriver,
  driverLocation: {
    latitude: 6.8951,
    longitude: 79.857,
    updatedAt: "2026-07-14T08:55:00.000Z",
  },
  lastUpdated: "2026-07-14T08:55:00.000Z",
  deliveryInstructions: "Ring the bell twice, gate code 1234.",
};
