import type { CustomerProfile } from "@/types";

export const mockProfile: CustomerProfile = {
  id: "cust-01",
  fullName: "Alex Fernando",
  email: "customer@medicall.com",
  phoneNumber: "+94771234567",
  preferredLanguage: "en",
  createdAt: "2025-11-02T09:00:00.000Z",
  defaultAddressId: "addr-01",
  notificationSettings: {
    orderUpdates: true,
    promotions: true,
    prescriptionUpdates: true,
    supportUpdates: true,
  },
  theme: "system",
};
