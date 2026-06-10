import { z } from "zod";

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "タイトルを入力してください"),
  completed: z.boolean(),
});

export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください"),
});

export const updateTaskTitleSchema = z.object({
  title: z.string().trim().min(1, "タイトルを入力してください"),
});

export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
