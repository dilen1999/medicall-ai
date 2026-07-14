import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppInput } from "@/components/common/AppInput";
import { AppTextArea } from "@/components/common/AppTextArea";
import { AppButton } from "@/components/common/AppButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { addressSchema, type AddressFormValues } from "@/features/profile/schemas";
import { useAddresses, useCreateAddress, useUpdateAddress } from "@/features/profile/useAddresses";

export function AddressFormPage() {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(addressId);
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const existing = addresses?.find((a) => a.id === addressId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      recipientName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      deliveryInstructions: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        label: existing.label,
        recipientName: existing.recipientName,
        phoneNumber: existing.phoneNumber,
        addressLine1: existing.addressLine1,
        addressLine2: existing.addressLine2 ?? "",
        city: existing.city,
        postalCode: existing.postalCode,
        deliveryInstructions: existing.deliveryInstructions ?? "",
        isDefault: existing.isDefault,
      });
    }
  }, [existing, reset]);

  if (isEditing && isLoading) return <LoadingSpinner label="Loading address" />;

  async function onSubmit(values: AddressFormValues) {
    if (isEditing && addressId) {
      await updateAddress.mutateAsync({
        id: addressId,
        patch: { ...values, latitude: existing?.latitude ?? null, longitude: existing?.longitude ?? null },
      });
      toast.success("Address updated.");
    } else {
      await createAddress.mutateAsync({ ...values, latitude: null, longitude: null });
      toast.success("Address added.");
    }
    navigate("/profile/addresses");
  }

  return (
    <div>
      <PageHeader title={isEditing ? "Edit Address" : "Add Address"} showBack />

      <div className="mb-4 flex h-32 items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 text-ink-muted dark:border-slate-600">
        <MapPin className="h-5 w-5" />
        <span className="text-sm">Map location picker coming soon</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AppInput label="Label" placeholder="e.g. Home, Office" error={errors.label?.message} {...register("label")} />
        <AppInput label="Recipient name" error={errors.recipientName?.message} {...register("recipientName")} />
        <AppInput label="Phone number" type="tel" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
        <AppInput label="Address line 1" error={errors.addressLine1?.message} {...register("addressLine1")} />
        <AppInput label="Address line 2 (optional)" {...register("addressLine2")} />
        <div className="grid grid-cols-2 gap-3">
          <AppInput label="City" error={errors.city?.message} {...register("city")} />
          <AppInput label="Postal code" error={errors.postalCode?.message} {...register("postalCode")} />
        </div>
        <AppTextArea label="Delivery instructions (optional)" {...register("deliveryInstructions")} />
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register("isDefault")} />
          Set as default address
        </label>
        <AppButton type="submit" isLoading={isSubmitting} fullWidth>
          Save address
        </AppButton>
      </form>
    </div>
  );
}
