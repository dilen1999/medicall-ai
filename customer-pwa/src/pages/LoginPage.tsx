import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useAuthStore } from "@/stores/authStore";
import { AppInput } from "@/components/common/AppInput";
import { AppButton } from "@/components/common/AppButton";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const redirectPath = useAuthStore((state) => state.redirectPath);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.identifier, values.password);
      toast.success("Welcome back!");
      navigate(redirectPath ?? "/dashboard", { replace: true });
    } catch (error) {
      setFormError((error as { message?: string }).message ?? "Unable to sign in.");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-ink dark:text-slate-100">Sign in</h1>
      <p className="mb-6 text-sm text-ink-muted">Sign in to order healthcare products and track deliveries.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <AppInput
          label="Email or phone number"
          type="text"
          autoComplete="username"
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <AppInput
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register("rememberMe")} />
          Remember me
        </label>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}

        <AppButton type="submit" isLoading={isSubmitting} fullWidth>
          Sign in
        </AppButton>
      </form>

      <div className="mt-4 rounded-xl bg-primary-light/60 p-3 text-xs text-primary-dark dark:bg-teal-950 dark:text-teal-200">
        Demo account: <strong>customer@medicall.com</strong> / <strong>Password123!</strong>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
