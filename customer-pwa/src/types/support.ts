import type { PreferredContactMethod } from "./common";

export type SupportIssueCategory =
  | "missing_item"
  | "wrong_item"
  | "damaged_packaging"
  | "late_delivery"
  | "payment_issue"
  | "prescription_issue"
  | "refund_request"
  | "replacement_request"
  | "medical_question"
  | "other";

export type SupportCaseStatus = "open" | "in_progress" | "awaiting_customer" | "resolved" | "closed";

export interface SupportMessage {
  id: string;
  caseId: string;
  sender: "customer" | "agent" | "system";
  message: string;
  createdAt: string;
}

export interface SupportCase {
  id: string;
  reference: string;
  relatedOrderId?: string;
  category: SupportIssueCategory;
  description: string;
  status: SupportCaseStatus;
  preferredContactMethod: PreferredContactMethod;
  preferredCallbackTime?: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "assistant";
  message: string;
  createdAt: string;
  isEscalation?: boolean;
}
