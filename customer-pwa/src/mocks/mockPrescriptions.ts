import type { Prescription } from "@/types";

export const mockPrescriptions: Prescription[] = [
  {
    id: "presc-01",
    fileName: "prescription-amoxicillin.jpg",
    fileType: "image/jpeg",
    note: "Prescribed by Dr. Perera after clinic visit.",
    status: "approved",
    submittedAt: "2026-07-13T15:00:00.000Z",
    reviewedAt: "2026-07-14T05:45:00.000Z",
    pharmacistNote: "Approved. Matches Amoxicillin 500mg Capsules.",
    linkedOrderId: "order-1002",
  },
  {
    id: "presc-02",
    fileName: "prescription-metformin.pdf",
    fileType: "application/pdf",
    note: "",
    status: "under_pharmacist_review",
    submittedAt: "2026-07-14T09:05:00.000Z",
  },
  {
    id: "presc-03",
    fileName: "prescription-blurry.png",
    fileType: "image/png",
    note: "Photo taken in low light.",
    status: "requires_clearer_image",
    submittedAt: "2026-07-10T11:00:00.000Z",
    reviewedAt: "2026-07-10T14:20:00.000Z",
    pharmacistNote: "Image is too blurry to confirm dosage. Please re-upload.",
  },
];
