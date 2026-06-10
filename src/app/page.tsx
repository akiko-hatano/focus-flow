import { AppShell } from "@/components/layout/AppShell";
import { TaskList } from "@/components/tasks/TaskList";

export default function HomePage() {
  return (
    <AppShell>
      <TaskList />
    </AppShell>
  );
}
