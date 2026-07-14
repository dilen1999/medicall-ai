import { Link } from "react-router-dom";
import { Bell, HeartPulse, MapPin, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useAddresses } from "@/features/profile/useAddresses";
import { useUnreadNotificationCount } from "@/features/notifications/useNotifications";

export function MobileTopHeader() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeAddressId = useUiStore((state) => state.activeAddressId);
  const { data: addresses } = useAddresses();
  const unreadCount = useUnreadNotificationCount();

  const activeAddress = addresses?.find((a) => a.id === activeAddressId) ?? addresses?.find((a) => a.isDefault);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 md:hidden">
      <Link to="/" className="flex items-center gap-1.5 font-semibold text-primary-dark">
        <HeartPulse className="h-5 w-5" aria-hidden="true" />
      </Link>
      <Link
        to="/profile/addresses"
        className="flex min-w-0 flex-1 items-center gap-1 text-xs text-ink-muted"
        aria-label="Change delivery location"
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">{activeAddress ? `${activeAddress.label}, ${activeAddress.city}` : "Set delivery location"}</span>
      </Link>
      <Link to="/notifications" aria-label="Notifications" className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <Bell className="h-5 w-5 text-ink-muted" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
      <Link to={isAuthenticated ? "/profile" : "/login"} aria-label="Profile" className="rounded-full">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary-dark">
          <User className="h-4 w-4" />
        </span>
      </Link>
    </header>
  );
}
