"use client";

import { useAtom } from "jotai";
import { Icon } from "@/components/ui/Icon";
import { THEMES, type ThemeId } from "@/lib/themes";
import { themeIdAtom } from "@/store/atoms";

export function ThemeSelector() {
  const [themeId, setThemeId] = useAtom(themeIdAtom);

  const handleSelect = (id: ThemeId) => {
    setThemeId(id);
  };

  return (
    <section
      className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant"
      data-testid="theme-selector"
    >
      <div className="flex items-center gap-2 mb-stack-md">
        <Icon name="palette" className="text-primary" />
        <h3 className="text-headline-md font-semibold">Theme Color</h3>
      </div>
      <p className="text-body-md text-on-surface-variant mb-stack-md">
        アプリのテーマカラーを選択してください。
      </p>
      <div className="flex flex-wrap gap-stack-md">
        {(Object.entries(THEMES) as [ThemeId, (typeof THEMES)[ThemeId]][]).map(([id, theme]) => (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            data-testid={`theme-swatch-${id}`}
            aria-label={`Select ${theme.label} theme`}
            aria-pressed={themeId === id}
            className={`theme-swatch ${themeId === id ? "active" : ""}`}
            style={{ backgroundColor: theme.colors.primary }}
            title={theme.label}
          />
        ))}
      </div>
      <p className="mt-stack-md text-label-md text-on-surface-variant" data-testid="selected-theme-label">
        選択中: {THEMES[themeId].label}
      </p>
    </section>
  );
}
