export type ThemeId = "indigo" | "emerald" | "rose" | "violet" | "amber";

export type ThemeColors = {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  surfaceTint: string;
};

export const THEMES: Record<ThemeId, { label: string; colors: ThemeColors }> = {
  indigo: {
    label: "Indigo",
    colors: {
      primary: "#3525cd",
      primaryContainer: "#4f46e5",
      onPrimary: "#ffffff",
      onPrimaryContainer: "#dad7ff",
      surfaceTint: "#4d44e3",
    },
  },
  emerald: {
    label: "Emerald",
    colors: {
      primary: "#047857",
      primaryContainer: "#059669",
      onPrimary: "#ffffff",
      onPrimaryContainer: "#d1fae5",
      surfaceTint: "#10b981",
    },
  },
  rose: {
    label: "Rose",
    colors: {
      primary: "#be123c",
      primaryContainer: "#e11d48",
      onPrimary: "#ffffff",
      onPrimaryContainer: "#ffe4e6",
      surfaceTint: "#f43f5e",
    },
  },
  violet: {
    label: "Violet",
    colors: {
      primary: "#6d28d9",
      primaryContainer: "#7c3aed",
      onPrimary: "#ffffff",
      onPrimaryContainer: "#ede9fe",
      surfaceTint: "#8b5cf6",
    },
  },
  amber: {
    label: "Amber",
    colors: {
      primary: "#b45309",
      primaryContainer: "#d97706",
      onPrimary: "#ffffff",
      onPrimaryContainer: "#fef3c7",
      surfaceTint: "#f59e0b",
    },
  },
};

export const DEFAULT_THEME_ID: ThemeId = "indigo";

export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES[themeId];
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-primary-container", theme.colors.primaryContainer);
  root.style.setProperty("--color-on-primary", theme.colors.onPrimary);
  root.style.setProperty("--color-on-primary-container", theme.colors.onPrimaryContainer);
  root.style.setProperty("--color-surface-tint", theme.colors.surfaceTint);
}
