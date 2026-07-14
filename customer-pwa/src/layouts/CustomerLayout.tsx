import { Outlet } from "react-router-dom";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { MobileTopHeader } from "@/components/layout/MobileTopHeader";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";

export function CustomerLayout() {
  return (
    <div className="flex min-h-full flex-col bg-surface dark:bg-slate-950">
      <MobileTopHeader />
      <DesktopHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-10">
        <Outlet />
      </main>
      <MobileBottomNavigation />
    </div>
  );
}
