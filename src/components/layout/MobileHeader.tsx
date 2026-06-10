"use client";

import { Icon } from "@/components/ui/Icon";

type MobileHeaderProps = {
  title?: string;
};

export function MobileHeader({ title = "FocusFlow" }: MobileHeaderProps) {
  return (
    <header className="bg-surface md:hidden border-b border-outline-variant fixed top-0 left-0 w-full z-40 flex justify-between items-center h-16 px-margin-mobile">
      <h1 className="text-headline-md font-bold text-primary">{title}</h1>
      <div className="flex items-center gap-4">
        <button type="button" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Search">
          <Icon name="search" />
        </button>
        <button type="button" className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Notifications">
          <Icon name="notifications" />
        </button>
      </div>
    </header>
  );
}
