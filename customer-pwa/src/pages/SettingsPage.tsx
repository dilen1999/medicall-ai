import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { AppSelect } from "@/components/common/AppSelect";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useThemeStore, type ThemePreference } from "@/stores/themeStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useProfile, useUpdateProfile } from "@/features/profile/useProfile";
import type { PreferredLanguage } from "@/types";

const themeOptions: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const languageOptions: { label: string; value: PreferredLanguage }[] = [
  { label: "English", value: "en" },
  { label: "Sinhala", value: "si" },
  { label: "Tamil", value: "ta" },
];

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  if (isLoading) return <LoadingSpinner label="Loading settings" />;

  async function toggleNotificationSetting(key: keyof NonNullable<typeof profile>["notificationSettings"]) {
    if (!profile) return;
    await updateProfile.mutateAsync({
      notificationSettings: { ...profile.notificationSettings, [key]: !profile.notificationSettings[key] },
    });
    toast.success("Notification settings updated.");
  }

  return (
    <div>
      <PageHeader title="Settings" showBack />

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-ink dark:text-slate-100">Appearance</h2>
        <AppSelect
          label="Theme"
          options={themeOptions}
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemePreference)}
          className="max-w-xs"
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-ink dark:text-slate-100">Language</h2>
        <AppSelect
          label="Preferred language"
          options={languageOptions}
          value={language}
          onChange={(e) => setLanguage(e.target.value as PreferredLanguage)}
          className="max-w-xs"
        />
      </section>

      {profile && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink dark:text-slate-100">Notifications</h2>
          <div className="flex flex-col divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            <ToggleRow
              label="Order updates"
              checked={profile.notificationSettings.orderUpdates}
              onChange={() => toggleNotificationSetting("orderUpdates")}
            />
            <ToggleRow
              label="Prescription updates"
              checked={profile.notificationSettings.prescriptionUpdates}
              onChange={() => toggleNotificationSetting("prescriptionUpdates")}
            />
            <ToggleRow
              label="Support updates"
              checked={profile.notificationSettings.supportUpdates}
              onChange={() => toggleNotificationSetting("supportUpdates")}
            />
            <ToggleRow
              label="Promotions"
              checked={profile.notificationSettings.promotions}
              onChange={() => toggleNotificationSetting("promotions")}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between bg-white p-4 dark:bg-slate-900">
      <span className="text-sm text-ink dark:text-slate-100">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-9 cursor-pointer" />
    </label>
  );
}
