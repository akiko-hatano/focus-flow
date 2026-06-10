import { atom } from "jotai";
import { DEFAULT_THEME_ID } from "@/lib/themes";
import { DEFAULT_USER_PROFILE } from "@/lib/schemas/user";
import type { Task } from "@/lib/schemas/task";
import type { UserProfile } from "@/lib/schemas/user";
import type { ThemeId } from "@/lib/themes";

export const tasksAtom = atom<Task[]>([]);

export const userProfileAtom = atom<UserProfile>(DEFAULT_USER_PROFILE);

export const themeIdAtom = atom<ThemeId>(DEFAULT_THEME_ID);
