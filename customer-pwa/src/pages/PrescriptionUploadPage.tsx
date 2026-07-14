import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/common/AppButton";
import { AppTextArea } from "@/components/common/AppTextArea";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { PrescriptionBadge } from "@/components/prescription/PrescriptionBadge";
import { useAuthStore } from "@/stores/authStore";
import { useSubmitPrescription } from "@/features/prescriptions/useSubmitPrescription";
import { usePrescriptions } from "@/features/prescriptions/usePrescriptions";
import { formatDateTime } from "@/utils/date";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function PrescriptionUploadPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const submitPrescription = useSubmitPrescription();
  const { data: prescriptions, isLoading: historyLoading } = usePrescriptions();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function validateAndSetFile(candidate: File) {
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setFileError("Only JPEG, PNG or PDF files are accepted.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFileError("File size must be under 5 MB.");
      return;
    }
    setFileError(null);
    setFile(candidate);
    setPreviewUrl(candidate.type === "application/pdf" ? null : URL.createObjectURL(candidate));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }

  function removeFile() {
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!isAuthenticated) {
      useAuthStore.getState().setRedirectPath("/prescriptions/upload");
      navigate("/login");
      return;
    }
    if (!file) {
      setFileError("Please add a prescription file before submitting.");
      return;
    }
    try {
      await submitPrescription.mutateAsync({ file, note: note.trim() || undefined });
      toast.success("Your prescription has been submitted for pharmacist review.");
      removeFile();
      setNote("");
    } catch {
      toast.error("We couldn't submit your prescription. Please try again.");
    }
  }

  return (
    <div>
      <PageHeader title="Upload Prescription" showBack />
      <p className="mb-4 text-sm text-ink-muted">
        Upload a clear photo or PDF of your prescription. A pharmacist will review it before your medicines are
        dispensed.
      </p>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragOver ? "border-primary bg-primary-light/40" : "border-slate-300 dark:border-slate-600"
          }`}
        >
          <UploadCloud className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-ink dark:text-slate-100">Drag and drop your file here</p>
          <p className="text-xs text-ink-muted">JPEG, PNG or PDF, up to 5 MB</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <AppButton variant="outline" onClick={() => inputRef.current?.click()}>
              Choose File
            </AppButton>
            <AppButton variant="outline" onClick={() => cameraInputRef.current?.click()}>
              Use Camera
            </AppButton>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img src={previewUrl} alt="Prescription preview" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <FileText className="h-8 w-8 text-ink-muted" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink dark:text-slate-100">{file.name}</p>
              <p className="text-xs text-ink-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              aria-label="Remove file"
              className="rounded-full p-2 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <AppButton size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" /> Replace File
            </AppButton>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />
        </div>
      )}

      {fileError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {fileError}
        </p>
      )}

      <div className="mt-4">
        <AppTextArea
          label="Note for the pharmacist (optional)"
          placeholder="e.g. Prescribed after clinic visit on 10 July"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <AppButton className="mt-4" fullWidth isLoading={submitPrescription.isPending} onClick={handleSubmit}>
        Submit for Pharmacist Review
      </AppButton>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-ink dark:text-slate-100">Prescription history</h2>
        {!isAuthenticated ? (
          <EmptyState title="Sign in to view your history" description="Log in to see your submitted prescriptions." />
        ) : historyLoading ? (
          <LoadingSpinner label="Loading history" />
        ) : !prescriptions || prescriptions.length === 0 ? (
          <EmptyState title="No prescriptions yet" description="Your uploaded prescriptions will appear here." />
        ) : (
          <ul className="flex flex-col gap-3">
            {prescriptions.map((prescription) => (
              <li key={prescription.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink dark:text-slate-100">{prescription.fileName}</p>
                  <PrescriptionBadge status={prescription.status} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">Submitted {formatDateTime(prescription.submittedAt)}</p>
                {prescription.pharmacistNote && (
                  <p className="mt-1 text-xs text-ink-muted">Pharmacist note: {prescription.pharmacistNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
