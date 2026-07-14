import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schemas";
import { authApi } from "@/api/authApi";
import { AppInput } from "@/components/common/AppInput";
import { AppButton } from "@/components/common/AppButton";

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    const result = await authApi.forgotPassword(values.email);
    setMessage(result.message);
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-ink dark:text-slate-100">Forgot password</h1>
      <p className="mb-6 text-sm text-ink-muted">Enter your email and we'll send you a reset link.</p>

      {message ? (
        <p role="status" className="rounded-xl bg-primary-light/60 p-3 text-sm text-primary-dark dark:bg-teal-950 dark:text-teal-200">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <AppInput
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <AppButton type="submit" isLoading={isSubmitting} fullWidth>
            Send reset link
          </AppButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
