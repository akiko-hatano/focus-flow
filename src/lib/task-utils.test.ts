import { describe, expect, it } from "vitest";
import { calculateProgress } from "@/lib/task-utils";
import type { Task } from "@/lib/schemas/task";

describe("calculateProgress", () => {
  it("returns 0 when there are no tasks", () => {
    expect(calculateProgress([])).toBe(0);
  });

  it("returns 0 when no tasks are completed", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", completed: false },
      { id: "2", title: "B", completed: false },
    ];
    expect(calculateProgress(tasks)).toBe(0);
  });

  it("returns 100 when all tasks are completed", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", completed: true },
      { id: "2", title: "B", completed: true },
    ];
    expect(calculateProgress(tasks)).toBe(100);
  });

  it("rounds completion percentage", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", completed: true },
      { id: "2", title: "B", completed: false },
      { id: "3", title: "C", completed: false },
    ];
    expect(calculateProgress(tasks)).toBe(33);
  });
});
