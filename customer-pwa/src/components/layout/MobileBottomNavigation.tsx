import { NavLink } from "react-router-dom";
import { Headset, Home, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/utils/cn";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/products", label: "Search", icon: Search },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/support", label: "Support", icon: Headset },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-700 dark:bg-slate-900 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs",
                  isActive ? "text-primary" : "text-ink-muted",
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
