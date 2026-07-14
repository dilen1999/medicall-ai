import type { PrescriptionStatus } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PRESCRIPTION_STATUS_LABELS, getPrescriptionStatusTone } from "@/utils/prescriptionStatus";

export function PrescriptionBadge({ status }: { status: PrescriptionStatus }) {
  return <StatusBadge label={PRESCRIPTION_STATUS_LABELS[status]} tone={getPrescriptionStatusTone(status)} />;
}

export function PrescriptionRequiredBadge() {
  return <StatusBadge label="Prescription Required" tone="warning" />;
}
