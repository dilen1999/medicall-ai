import { z } from "zod";

export const supportIssueCategories = [
  { value: "missing_item", label: "Missing item" },
  { value: "wrong_item", label: "Wrong item" },
  { value: "damaged_packaging", label: "Damaged packaging" },
  { value: "late_delivery", label: "Late delivery" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "prescription_issue", label: "Prescription issue" },
  { value: "refund_request", label: "Refund request" },
  { value: "replacement_request", label: "Replacement request" },
  { value: "medical_question", label: "Medical question" },
  { value: "other", label: "Other" },
] as const;

export const supportCaseSchema = z
  .object({
    relatedOrderId: z.string().optional(),
    category: z.enum([
      "missing_item",
      "wrong_item",
      "damaged_packaging",
      "late_delivery",
      "payment_issue",
      "prescription_issue",
      "refund_request",
      "replacement_request",
      "medical_question",
      "other",
    ]),
    description: z.string().min(10, "Please describe the issue in at least 10 characters."),
    preferredContactMethod: z.enum(["phone", "email", "app_notification"]),
    preferredCallbackTime: z.string().optional(),
  })
  .refine((data) => data.category !== "medical_question" || Boolean(data.preferredCallbackTime), {
    message: "Please provide a preferred callback time for medical questions.",
    path: ["preferredCallbackTime"],
  });

export type SupportCaseFormValues = z.infer<typeof supportCaseSchema>;
