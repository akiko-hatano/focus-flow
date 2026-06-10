import { z } from "zod";

export const userProfileSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください"),
  email: z.string().trim().email("有効なメールアドレスを入力してください"),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "",
  email: "",
};
