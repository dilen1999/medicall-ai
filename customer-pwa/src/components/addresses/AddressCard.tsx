import { MapPin, Pencil, Trash2 } from "lucide-react";
import type { Address } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AppButton } from "@/components/common/AppButton";

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  onSetDefault?: (address: Address) => void;
  onSelect?: (address: Address) => void;
  isSelected?: boolean;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault, onSelect, isSelected }: AddressCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-card dark:bg-slate-900 ${
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-ink dark:text-slate-100">
              {address.label} {address.isDefault && <StatusBadge label="Default" tone="info" />}
            </p>
            <p className="text-sm text-ink-muted">{address.recipientName}</p>
            <p className="text-sm text-ink-muted">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city} {address.postalCode}
            </p>
            <p className="text-sm text-ink-muted">{address.phoneNumber}</p>
            {address.deliveryInstructions && (
              <p className="mt-1 text-xs text-ink-muted italic">"{address.deliveryInstructions}"</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {onSelect && (
          <AppButton size="sm" variant={isSelected ? "primary" : "outline"} onClick={() => onSelect(address)}>
            {isSelected ? "Selected" : "Deliver Here"}
          </AppButton>
        )}
        {onSetDefault && !address.isDefault && (
          <AppButton size="sm" variant="ghost" onClick={() => onSetDefault(address)}>
            Set as default
          </AppButton>
        )}
        {onEdit && (
          <AppButton size="sm" variant="ghost" onClick={() => onEdit(address)} aria-label="Edit address">
            <Pencil className="h-4 w-4" /> Edit
          </AppButton>
        )}
        {onDelete && (
          <AppButton size="sm" variant="ghost" onClick={() => onDelete(address)} aria-label="Delete address">
            <Trash2 className="h-4 w-4" /> Delete
          </AppButton>
        )}
      </div>
    </div>
  );
}
