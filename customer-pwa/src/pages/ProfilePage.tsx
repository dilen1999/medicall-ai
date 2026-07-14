import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, MapPin, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorState } from "@/components/common/ErrorState";
import { AppButton } from "@/components/common/AppButton";
import { useProfile } from "@/features/profile/useProfile";
import { useAddresses } from "@/features/profile/useAddresses";
import { useAuthStore } from "@/stores/authStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { data: addresses } = useAddresses();
  const logout = useAuthStore((state) => state.logout);

  if (isLoading) return <LoadingSpinner label="Loading profile" />;
  if (isError || !profile) return <ErrorState message="We couldn't load your profile." onRetry={() => refetch()} />;

  const defaultAddress = addresses?.find((a) => a.id === profile.defaultAddressId);

  function handleLogout() {
    logout();
    toast.success("You've been signed out.");
    navigate("/");
  }

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary-dark">
          <User className="h-8 w-8" />
        </span>
        <div>
          <p className="text-base font-semibold text-ink dark:text-slate-100">{profile.fullName}</p>
          <p className="text-sm text-ink-muted">{profile.email}</p>
          <p className="text-sm text-ink-muted">{profile.phoneNumber}</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-col divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        <ProfileLink to="/profile/edit" label="Edit profile" />
        <ProfileLink
          to="/profile/addresses"
          label="Manage addresses"
          hint={defaultAddress ? `${defaultAddress.label}, ${defaultAddress.city}` : undefined}
        />
        <ProfileLink to="/settings" label="Settings" icon={Settings} />
      </nav>

      {defaultAddress && (
        <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
          <MapPin className="h-4 w-4" />
          Default address: {defaultAddress.addressLine1}, {defaultAddress.city}
        </div>
      )}

      <AppButton variant="danger" className="mt-6" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Log out
      </AppButton>
    </div>
  );
}

function ProfileLink({
  to,
  label,
  hint,
  icon: Icon = ChevronRight,
}: {
  to: string;
  label: string;
  hint?: string;
  icon?: typeof ChevronRight;
}) {
  return (
    <Link to={to} className="flex items-center justify-between bg-white p-4 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
      <div>
        <p className="text-sm font-medium text-ink dark:text-slate-100">{label}</p>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
      <Icon className="h-4 w-4 text-ink-muted" />
    </Link>
  );
}
