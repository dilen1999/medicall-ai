import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { AppButton } from "@/components/common/AppButton";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { profileEditSchema, type ProfileEditFormValues } from "@/features/profile/schemas";
import { useProfile, useUpdateProfile } from "@/features/profile/useProfile";

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Sinhala", value: "si" },
  { label: "Tamil", value: "ta" },
];

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { fullName: "", email: "", phoneNumber: "", preferredLanguage: "en" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        preferredLanguage: profile.preferredLanguage,
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileEditFormValues) {
    await updateProfile.mutateAsync(values);
    toast.success("Profile updated.");
    navigate("/profile");
  }

  if (isLoading) return <LoadingSpinner label="Loading profile" />;

  return (
    <div>
      <PageHeader title="Edit Profile" showBack />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AppInput label="Full name" error={errors.fullName?.message} {...register("fullName")} />
        <AppInput label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <AppInput label="Phone number" type="tel" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
        <AppSelect
          label="Preferred language"
          options={languageOptions}
          error={errors.preferredLanguage?.message}
          {...register("preferredLanguage")}
        />
        <AppButton type="submit" isLoading={isSubmitting} fullWidth>
          Save changes
        </AppButton>
      </form>
    </div>
  );
}
