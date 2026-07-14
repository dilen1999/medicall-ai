import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { useAuthStore } from "@/stores/authStore";
import { AppInput } from "@/components/common/AppInput";
import { AppButton } from "@/components/common/AppButton";

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await registerUser(values);
      toast.success("Account created. Welcome to MediCall Care!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError((error as { message?: string }).message ?? "Unable to create your account.");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-ink dark:text-slate-100">Create your account</h1>
      <p className="mb-6 text-sm text-ink-muted">Order healthcare products safely and track every delivery.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AppInput label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <AppInput
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AppInput
          label="Phone number"
          type="tel"
          autoComplete="tel"
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
        <AppInput
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <AppInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" {...register("acceptTerms")} />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        {errors.acceptTerms && (
          <p role="alert" className="-mt-2 text-xs text-danger">
            {errors.acceptTerms.message}
          </p>
        )}

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}

        <AppButton type="submit" isLoading={isSubmitting} fullWidth>
          Create account
        </AppButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
