import { AppShell } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Icon } from "@/components/ui/Icon";

export default function ProfilePage() {
  return (
    <AppShell mobileTitle="FocusFlow">
      <div className="mb-stack-lg flex flex-col gap-base">
        <h2 className="text-headline-lg-mobile md:text-headline-lg font-bold text-on-background">
          User Profile
        </h2>
        <div className="h-1 w-16 bg-primary rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md">
        <section className="md:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col items-center text-center shadow-sm">
          <div className="relative mb-stack-md">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-variant bg-surface-container flex items-center justify-center">
              <Icon name="person" className="text-5xl text-primary" />
            </div>
          </div>
          <div className="space-y-base">
            <h3 className="text-headline-md font-semibold text-on-surface">Your Profile</h3>
            <p className="text-body-md text-on-surface-variant">Update your account details</p>
          </div>
        </section>

        <section className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg shadow-sm">
          <ProfileForm />
        </section>
      </div>
    </AppShell>
  );
}
