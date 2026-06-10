"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { applyTheme } from "@/lib/themes";
import { themeIdAtom } from "@/store/atoms";

export function ThemeApplier() {
  const themeId = useAtomValue(themeIdAtom);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  return null;
}
