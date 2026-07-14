import { z } from "zod";

export const profileEditSchema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phoneNumber: z.string().min(7, "Enter a valid phone number."),
  preferredLanguage: z.enum(["en", "si", "ta"]),
});
export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

export const addressSchema = z.object({
  label: z.string().min(1, "Enter a label, e.g. Home or Office."),
  recipientName: z.string().min(2, "Enter the recipient's name."),
  phoneNumber: z.string().min(7, "Enter a valid phone number."),
  addressLine1: z.string().min(3, "Enter the address."),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Enter a city."),
  postalCode: z.string().min(3, "Enter a postal code."),
  deliveryInstructions: z.string().optional(),
  isDefault: z.boolean(),
});
export type AddressFormValues = z.infer<typeof addressSchema>;
