export type NotificationType =
  | "prescription_submitted"
  | "prescription_approved"
  | "prescription_rejected"
  | "clearer_prescription_requested"
  | "order_confirmed"
  | "order_preparing"
  | "driver_assigned"
  | "driver_nearby"
  | "order_delivered"
  | "support_case_updated"
  | "pharmacist_callback_scheduled"
  | "promotion";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  linkTo?: string;
}
