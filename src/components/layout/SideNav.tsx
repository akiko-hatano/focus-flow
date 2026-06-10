"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAtomValue } from "jotai";
import { Icon } from "@/components/ui/Icon";
import { userProfileAtom } from "@/store/atoms";

const NAV_ITEMS = [
  { href: "/", label: "Tasks", icon: "check_circle" },
  { href: "/profile", label: "Profile", icon: "person" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const user = useAtomValue(userProfileAtom);
  const displayName = user.name.trim() || "Guest";

  return (
    <nav
      className="hidden md:flex flex-col h-screen p-stack-md fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant w-64 z-40"
      aria-label="Main navigation"
    >
      <div className="mb-stack-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <Icon name="check_circle" filled />
          </div>
          <div>
            <h2 className="text-headline-md font-bold text-primary">FocusFlow</h2>
            <p className="text-label-md text-on-surface-variant opacity-70">Productivity Hub</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 grow">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={`flex items-center gap-stack-md rounded-lg px-stack-md py-stack-sm transition-all duration-100 active:scale-95 ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <Icon name={item.icon} filled={isActive} />
              <span className="text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-stack-md border-t border-outline-variant">
        <div className="flex items-center gap-3 px-stack-md py-stack-sm">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container border border-outline-variant">
            <Icon name="person" className="text-sm" />
          </div>
          <div className="overflow-hidden">
            <p className="text-label-md text-on-surface truncate">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant truncate">Member</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
