import { AppShell } from "@/components/layout/AppShell";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { Icon } from "@/components/ui/Icon";

export default function SettingsPage() {
  return (
    <AppShell mobileTitle="Settings">
      <header className="mb-stack-lg flex items-center gap-2">
        <Icon name="settings" className="text-primary md:hidden" />
        <h2 className="text-headline-md font-bold text-primary">Settings</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <ThemeSelector />

        <section className="md:col-span-2 relative h-48 rounded-2xl overflow-hidden bg-primary-container">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-on-primary-container text-headline-md font-semibold opacity-80">
              FocusFlow
            </p>
          </div>
        </section>

        <section className="md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md">
          <p className="text-label-sm text-on-surface-variant mb-1">FocusFlow v0.1.0</p>
          <p className="text-[10px] text-outline leading-tight">
            Automation sample app. State is managed in-memory with Jotai.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
