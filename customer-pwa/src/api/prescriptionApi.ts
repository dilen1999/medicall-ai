import type { Prescription } from "@/types";
import { apiClient } from "./apiClient";
import { apiConfig } from "./apiConfig";
import { withMockErrors } from "./apiError";
import { mockApi } from "@/mocks/mockApi";

export interface PrescriptionUploadInput {
  file: File;
  note?: string;
}

export const prescriptionApi = {
  async list(): Promise<Prescription[]> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.prescriptions.list());
    }
    const { data } = await apiClient.get<Prescription[]>("/prescriptions");
    return data;
  },

  async get(id: string): Promise<Prescription> {
    if (apiConfig.useMocks) {
      return withMockErrors(() => mockApi.prescriptions.get(id));
    }
    const { data } = await apiClient.get<Prescription>(`/prescriptions/${id}`);
    return data;
  },

  async submit(input: PrescriptionUploadInput): Promise<Prescription> {
    if (apiConfig.useMocks) {
      return withMockErrors(() =>
        mockApi.prescriptions.submit({
          fileName: input.file.name,
          fileType: input.file.type as Prescription["fileType"],
          note: input.note,
        }),
      );
    }
    const form = new FormData();
    form.append("file", input.file);
    if (input.note) form.append("note", input.note);
    const { data } = await apiClient.post<Prescription>("/prescriptions", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
