export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, "id">;
