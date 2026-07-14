import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppSelect } from "@/components/common/AppSelect";
import { AppTextArea } from "@/components/common/AppTextArea";
import { AppInput } from "@/components/common/AppInput";
import { AppButton } from "@/components/common/AppButton";
import { supportCaseSchema, supportIssueCategories, type SupportCaseFormValues } from "@/features/support/schemas";
import { useCreateSupportCase } from "@/features/support/useSupport";
import { useOrders } from "@/features/orders/useOrders";

const contactMethods = [
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
  { label: "App notification", value: "app_notification" },
];

export function SupportCaseNewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: orders } = useOrders();
  const createCase = useCreateSupportCase();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupportCaseFormValues>({
    resolver: zodResolver(supportCaseSchema),
    defaultValues: {
      relatedOrderId: searchParams.get("orderId") ?? "",
      category: "other",
      description: "",
      preferredContactMethod: "app_notification",
      preferredCallbackTime: "",
    },
  });

  const category = watch("category");
  const isMedical = category === "medical_question";

  async function onSubmit(values: SupportCaseFormValues) {
    try {
      const created = await createCase.mutateAsync({
        relatedOrderId: values.relatedOrderId || undefined,
        category: values.category,
        description: values.description,
        preferredContactMethod: values.preferredContactMethod,
        preferredCallbackTime: values.preferredCallbackTime || undefined,
      });
      toast.success(
        isMedical
          ? "A pharmacist callback has been scheduled."
          : `Support case ${created.reference} created.`,
      );
      navigate(`/support/cases/${created.id}`);
    } catch {
      toast.error("We couldn't submit your request. Please try again.");
    }
  }

  return (
    <div>
      <PageHeader title="New Support Case" showBack />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AppSelect
          label="Related order (optional)"
          placeholder="Select an order"
          options={orders?.map((o) => ({ label: `${o.reference} - ${o.pharmacyName}`, value: o.id })) ?? []}
          {...register("relatedOrderId")}
        />

        <AppSelect
          label="Issue category"
          options={supportIssueCategories.map((c) => ({ label: c.label, value: c.value }))}
          error={errors.category?.message}
          {...register("category")}
        />

        {isMedical && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              I'm not able to provide medical advice. I can help arrange support from a qualified pharmacist -
              please share a preferred callback time below.
            </p>
          </div>
        )}

        <AppTextArea
          label="Description"
          placeholder="Tell us what happened"
          error={errors.description?.message}
          {...register("description")}
        />

        <AppSelect
          label="Preferred contact method"
          options={contactMethods}
          error={errors.preferredContactMethod?.message}
          {...register("preferredContactMethod")}
        />

        <AppInput
          label={isMedical ? "Preferred callback time" : "Preferred callback time (optional)"}
          placeholder="e.g. Weekdays after 5:00 PM"
          error={errors.preferredCallbackTime?.message}
          {...register("preferredCallbackTime")}
        />

        <AppInput label="Evidence (optional)" type="file" accept="image/*,application/pdf" />

        <AppButton type="submit" isLoading={isSubmitting} fullWidth>
          {isMedical ? "Request Pharmacist Callback" : "Submit Support Case"}
        </AppButton>
      </form>
    </div>
  );
}
