"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const NAV_ITEMS = [
  { href: "/", label: "Tasks", icon: "list_alt" },
  { href: "/profile", label: "User", icon: "account_circle" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-margin-mobile bg-surface border-t border-outline-variant"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            className={`flex flex-col items-center justify-center transition-transform active:scale-90 ${
              isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <Icon name={item.icon} filled={isActive} />
            <span className="text-label-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
