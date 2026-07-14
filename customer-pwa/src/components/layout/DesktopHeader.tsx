import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, HeartPulse, Search, ShoppingCart, User } from "lucide-react";
import { useCartStore, selectItemCount } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useUnreadNotificationCount } from "@/features/notifications/useNotifications";
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/dashboard", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/orders", label: "Orders" },
  { to: "/support", label: "Support" },
];

export function DesktopHeader() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const itemCount = useCartStore((state) => selectItemCount(state.items));
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const unreadCount = useUnreadNotificationCount();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary-dark">
          <HeartPulse className="h-6 w-6" aria-hidden="true" />
          MediCall Care
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary-light text-primary-dark" : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form
          role="search"
          className="ml-auto flex h-10 max-w-sm flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/products?search=${encodeURIComponent(search)}`);
          }}
        >
          <Search className="h-4 w-4 text-ink-muted" aria-hidden="true" />
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <input
            id="header-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            className="h-full w-full border-0 bg-transparent text-sm outline-none dark:text-slate-100"
          />
        </form>

        <Link to="/notifications" aria-label="Notifications" className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5 text-ink-muted" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ShoppingCart className="h-5 w-5 text-ink-muted" />
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </Link>

        <Link
          to={isAuthenticated ? "/profile" : "/login"}
          className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm dark:border-slate-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary-dark">
            <User className="h-4 w-4" />
          </span>
          {isAuthenticated ? user?.fullName.split(" ")[0] : "Sign in"}
        </Link>
      </div>
    </header>
  );
}
