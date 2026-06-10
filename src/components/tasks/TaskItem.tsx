"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";
import { Icon } from "@/components/ui/Icon";
import { updateTaskTitleSchema } from "@/lib/schemas/task";
import type { Task } from "@/lib/schemas/task";
import { tasksAtom } from "@/store/atoms";

type TaskItemProps = {
  task: Task;
};

export function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [error, setError] = useState<string | null>(null);
  const setTasks = useSetAtom(tasksAtom);

  const toggleCompleted = () => {
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleDelete = () => {
    setTasks((prev) => prev.filter((item) => item.id !== task.id));
  };

  const handleSaveEdit = () => {
    const result = updateTaskTitleSchema.safeParse({ title: editTitle });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "入力が無効です");
      return;
    }

    setError(null);
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id ? { ...item, title: result.data.title } : item,
      ),
    );
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setError(null);
    setIsEditing(false);
  };

  return (
    <div
      data-testid={`task-item-${task.id}`}
      className={`group flex items-center justify-between border border-outline-variant p-stack-md rounded-xl transition-colors ${
        task.completed
          ? "bg-surface-container"
          : "bg-surface-container-lowest hover:bg-surface-variant"
      }`}
    >
      <div className="flex items-center gap-4 grow min-w-0">
        <label className="relative flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={toggleCompleted}
            data-testid={`task-checkbox-${task.id}`}
            className="peer w-6 h-6 rounded-full border-2 border-outline-variant checked:bg-secondary-container checked:border-secondary-container focus:ring-0 transition-all appearance-none cursor-pointer"
            aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          />
          <Icon
            name="check"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-sm"
          />
        </label>

        {isEditing ? (
          <div className="flex flex-col gap-1 grow min-w-0">
            <input
              type="text"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              data-testid={`task-edit-input-${task.id}`}
              className="w-full px-2 py-1 bg-surface rounded border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-container outline-none text-body-md"
              autoFocus
            />
            {error && (
              <span className="text-xs text-error" role="alert">
                {error}
              </span>
            )}
          </div>
        ) : (
          <span
            className={`text-body-md select-none truncate ${
              task.completed
                ? "text-on-surface-variant opacity-50 line-through"
                : "text-on-surface"
            }`}
            data-testid={`task-title-${task.id}`}
          >
            {task.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSaveEdit}
              data-testid={`task-save-${task.id}`}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
              aria-label="Save edit"
            >
              <Icon name="check" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              data-testid={`task-cancel-${task.id}`}
              className="text-on-surface-variant hover:text-error transition-colors p-1"
              aria-label="Cancel edit"
            >
              <Icon name="close" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              data-testid={`task-edit-${task.id}`}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
              aria-label={`Edit "${task.title}"`}
            >
              <Icon name="edit" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              data-testid={`task-delete-${task.id}`}
              className="text-on-surface-variant hover:text-error transition-colors p-1"
              aria-label={`Delete "${task.title}"`}
            >
              <Icon name="delete" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
