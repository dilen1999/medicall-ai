import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/common/AppButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AddressCard } from "@/components/addresses/AddressCard";
import { useAddresses, useDeleteAddress, useUpdateAddress } from "@/features/profile/useAddresses";
import type { Address } from "@/types";

export function AddressListPage() {
  const navigate = useNavigate();
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const updateAddress = useUpdateAddress();
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

  if (isLoading) return <LoadingSpinner label="Loading addresses" />;
  if (isError) return <ErrorState message="We couldn't load your addresses." onRetry={() => refetch()} />;

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteAddress.mutateAsync(pendingDelete.id);
    toast.success("Address removed.");
    setPendingDelete(null);
  }

  async function handleSetDefault(address: Address) {
    await updateAddress.mutateAsync({ id: address.id, patch: { isDefault: true } });
    toast.success(`${address.label} set as default address.`);
  }

  return (
    <div>
      <PageHeader
        title="My Addresses"
        showBack
        action={
          <Link to="/profile/addresses/new">
            <AppButton size="sm">
              <Plus className="h-4 w-4" /> Add address
            </AppButton>
          </Link>
        }
      />

      {!addresses || addresses.length === 0 ? (
        <EmptyState title="No saved addresses" description="Add an address to speed up checkout." />
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => navigate(`/profile/addresses/${address.id}/edit`)}
              onDelete={() => setPendingDelete(address)}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this address?"
        message={`Are you sure you want to delete "${pendingDelete?.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteAddress.isPending}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
