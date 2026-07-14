import type { Pharmacy } from "@/types";

export const mockPharmacies: Pharmacy[] = [
  {
    id: "pharm-01",
    name: "MediCall Central Pharmacy",
    city: "Colombo",
    openingHours: "7:00 AM - 10:00 PM",
    phoneNumber: "+94112345678",
    isOpenNow: true,
  },
  {
    id: "pharm-02",
    name: "MediCall Wellness Pharmacy - Kandy",
    city: "Kandy",
    openingHours: "8:00 AM - 9:00 PM",
    phoneNumber: "+94812345678",
    isOpenNow: true,
  },
  {
    id: "pharm-03",
    name: "MediCall Express Pharmacy - Galle",
    city: "Galle",
    openingHours: "24 hours",
    phoneNumber: "+94912345678",
    isOpenNow: true,
  },
];
