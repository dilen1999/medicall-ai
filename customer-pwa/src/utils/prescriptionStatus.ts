import type { PrescriptionStatus } from "@/types";
import type { StatusTone } from "./orderStatus";

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  requires_clearer_image: "Requires Clearer Image",
  under_pharmacist_review: "Under Pharmacist Review",
  approved: "Approved",
  partially_approved: "Partially Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export function getPrescriptionStatusTone(status: PrescriptionStatus): StatusTone {
  if (status === "approved" || status === "partially_approved") return "success";
  if (status === "rejected" || status === "expired") return "danger";
  if (status === "requires_clearer_image") return "warning";
  return "info";
}
