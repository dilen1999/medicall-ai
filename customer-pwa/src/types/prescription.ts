export type PrescriptionStatus =
  | "uploaded"
  | "processing"
  | "requires_clearer_image"
  | "under_pharmacist_review"
  | "approved"
  | "partially_approved"
  | "rejected"
  | "expired";

export interface Prescription {
  id: string;
  fileName: string;
  fileType: "image/jpeg" | "image/png" | "application/pdf";
  note?: string;
  status: PrescriptionStatus;
  submittedAt: string;
  reviewedAt?: string;
  pharmacistNote?: string;
  linkedOrderId?: string;
}
