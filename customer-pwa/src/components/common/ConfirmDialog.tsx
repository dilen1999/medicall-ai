import { AppModal } from "./AppModal";
import { AppButton } from "./AppButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-ink-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <AppButton variant="outline" onClick={onCancel}>
          {cancelLabel}
        </AppButton>
        <AppButton variant={isDestructive ? "danger" : "primary"} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </AppButton>
      </div>
    </AppModal>
  );
}
