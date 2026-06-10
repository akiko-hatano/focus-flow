import { z } from "zod";

export const themeIdSchema = z.enum(["indigo", "emerald", "rose", "violet", "amber"]);

export const appSettingsSchema = z.object({
  themeId: themeIdSchema,
});

export type AppSettings = z.infer<typeof appSettingsSchema>;
