import type { OrderStatus } from "./order";

export interface Driver {
  id: string;
  name: string;
  vehicleNumber: string;
  phoneNumber: string;
  avatarUrl?: string;
  rating: number;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface DeliveryTracking {
  orderId: string;
  status: OrderStatus;
  estimatedArrival: string;
  driver: Driver | null;
  driverLocation: DriverLocation | null;
  lastUpdated: string;
  deliveryInstructions?: string;
}
