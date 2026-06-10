"use client";

import { useAtomValue } from "jotai";
import { Icon } from "@/components/ui/Icon";
import { TaskItem } from "@/components/tasks/TaskItem";
import { calculateProgress } from "@/lib/task-utils";
import { tasksAtom } from "@/store/atoms";
import { ProgressBar } from "@/components/tasks/ProgressBar";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";

export function TaskList() {
  const tasks = useAtomValue(tasksAtom);
  const progress = calculateProgress(tasks);

  return (
    <>
      <header className="mb-stack-lg flex justify-between items-end">
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-bold text-on-background">
            Tasks
          </h1>
          <p className="text-body-md text-on-surface-variant">Stay focused, stay productive.</p>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-label-sm text-on-surface" data-testid="task-count">
              {tasks.length} Tasks Today
            </span>
          </div>
        </div>
      </header>

      <ProgressBar progress={progress} />
      <AddTaskForm />

      <section className="space-y-stack-sm min-h-[400px]" data-testid="task-list">
        {tasks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center pt-20 text-center"
            data-testid="empty-state"
          >
            <div className="w-32 h-32 mb-stack-md relative">
              <div className="absolute inset-0 bg-primary opacity-5 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-full h-full bg-surface-container rounded-full border border-outline-variant">
                <Icon name="inbox" className="text-primary text-5xl" />
              </div>
            </div>
            <h3 className="text-headline-md font-semibold text-on-background mb-2">
              Nothing to focus on?
            </h3>
            <p className="text-body-md text-on-surface-variant max-w-xs">
              Your task list is clear. Add a new goal to get started with your day.
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </section>
    </>
  );
}
