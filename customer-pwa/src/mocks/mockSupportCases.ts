import type { SupportCase } from "@/types";

export const mockSupportCases: SupportCase[] = [
  {
    id: "case-01",
    reference: "SC-3021",
    relatedOrderId: "order-1004",
    category: "missing_item",
    description: "One item (First Aid Kit) was missing from my delivery.",
    status: "in_progress",
    preferredContactMethod: "app_notification",
    createdAt: "2026-07-11T12:00:00.000Z",
    updatedAt: "2026-07-11T13:10:00.000Z",
    messages: [
      { id: "msg-01", caseId: "case-01", sender: "customer", message: "One item was missing from my order.", createdAt: "2026-07-11T12:00:00.000Z" },
      { id: "msg-02", caseId: "case-01", sender: "agent", message: "Sorry about that! We are checking with the pharmacy and will update you shortly.", createdAt: "2026-07-11T13:10:00.000Z" },
    ],
  },
  {
    id: "case-02",
    reference: "SC-2988",
    relatedOrderId: "order-1005",
    category: "refund_request",
    description: "Requesting a refund for a duplicate charge.",
    status: "resolved",
    preferredContactMethod: "email",
    createdAt: "2026-06-30T09:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    messages: [
      { id: "msg-03", caseId: "case-02", sender: "customer", message: "I was charged twice for this order.", createdAt: "2026-06-30T09:00:00.000Z" },
      { id: "msg-04", caseId: "case-02", sender: "agent", message: "We've confirmed the duplicate charge and issued a refund.", createdAt: "2026-07-01T10:00:00.000Z" },
    ],
  },
  {
    id: "case-03",
    reference: "SC-3040",
    category: "medical_question",
    description: "I have a question about combining two medications.",
    status: "open",
    preferredContactMethod: "phone",
    preferredCallbackTime: "Weekdays after 5:00 PM",
    createdAt: "2026-07-12T09:30:00.000Z",
    updatedAt: "2026-07-12T09:30:00.000Z",
    messages: [
      {
        id: "msg-05",
        caseId: "case-03",
        sender: "system",
        message:
          "This is a medical question. A pharmacist callback has been scheduled - our AI assistant cannot provide medical advice.",
        createdAt: "2026-07-12T09:30:00.000Z",
      },
    ],
  },
];
