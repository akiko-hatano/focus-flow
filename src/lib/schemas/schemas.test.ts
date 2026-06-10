import { describe, expect, it } from "vitest";
import { createTaskInputSchema, taskSchema } from "@/lib/schemas/task";
import { userProfileSchema } from "@/lib/schemas/user";
import { appSettingsSchema } from "@/lib/schemas/settings";

describe("taskSchema", () => {
  it("accepts valid task", () => {
    const result = taskSchema.safeParse({
      id: "1",
      title: "Buy milk",
      completed: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createTaskInputSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });
});

describe("userProfileSchema", () => {
  it("accepts valid profile", () => {
    const result = userProfileSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = userProfileSchema.safeParse({
      name: "Alex",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("appSettingsSchema", () => {
  it("accepts valid theme id", () => {
    const result = appSettingsSchema.safeParse({ themeId: "emerald" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown theme id", () => {
    const result = appSettingsSchema.safeParse({ themeId: "cyan" });
    expect(result.success).toBe(false);
  });
});
