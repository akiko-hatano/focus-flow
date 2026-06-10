import { SideNav } from "@/components/layout/SideNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ThemeApplier } from "@/components/layout/ThemeApplier";

type AppShellProps = {
  children: React.ReactNode;
  mobileTitle?: string;
};

export function AppShell({ children, mobileTitle }: AppShellProps) {
  return (
    <>
      <ThemeApplier />
      <MobileHeader title={mobileTitle} />
      <SideNav />
      <main className="pt-20 md:pt-stack-lg pb-24 md:pb-stack-lg md:ml-64 min-h-screen px-margin-mobile md:px-gutter max-w-container-max mx-auto transition-all duration-300">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
