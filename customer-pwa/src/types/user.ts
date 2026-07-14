export type PreferredLanguage = "en" | "si" | "ta";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  preferredLanguage: PreferredLanguage;
  createdAt: string;
}

export interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  prescriptionUpdates: boolean;
  supportUpdates: boolean;
}

export interface CustomerProfile extends User {
  avatarUrl?: string;
  defaultAddressId?: string;
  notificationSettings: NotificationSettings;
  theme: "light" | "dark" | "system";
}
