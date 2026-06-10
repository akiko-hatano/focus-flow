"use client";

import { useState, type FormEvent } from "react";
import { useSetAtom } from "jotai";
import { Icon } from "@/components/ui/Icon";
import { createTaskInputSchema } from "@/lib/schemas/task";
import { createTaskId } from "@/lib/task-utils";
import { tasksAtom } from "@/store/atoms";

export function AddTaskForm() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setTasks = useSetAtom(tasksAtom);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createTaskInputSchema.safeParse({ title });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "入力が無効です");
      return;
    }

    setError(null);
    setTasks((prev) => [
      { id: createTaskId(), title: result.data.title, completed: false },
      ...prev,
    ]);
    setTitle("");
  };

  return (
    <section className="mb-stack-lg">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-sm flex items-center gap-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all shadow-sm"
      >
        <Icon name="add_task" className="text-outline ml-2" />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a new task..."
          data-testid="task-input"
          className="bg-transparent border-none focus:ring-0 w-full text-body-md text-on-surface placeholder:text-outline-variant py-2 outline-none"
        />
        <button
          type="submit"
          data-testid="add-task-btn"
          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:opacity-90 active:scale-95 transition-all"
        >
          Add
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-error" data-testid="add-task-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
