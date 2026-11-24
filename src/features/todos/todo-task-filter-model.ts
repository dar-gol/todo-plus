import type { TodoTask } from './todo-api';
import type { TodoTaskFilter } from './todo-task-filter';

/** Selects tasks for the compact list filter using the device's local calendar month. */
export function filterTodoTasks(tasks: TodoTask[], filter: TodoTaskFilter, now = new Date()): TodoTask[] {
  if (filter === 'archive') return tasks.filter((task) => Boolean(task.completedAt));

  const active = tasks.filter((task) => !task.completedAt);
  if (filter === 'all') return active;
  if (filter === 'dated') return active.filter((task) => Boolean(task.dueAt));
  if (filter === 'undated') return active.filter((task) => !task.dueAt);
  return active.filter((task) => {
    if (!task.dueAt) return false;
    const dueAt = new Date(task.dueAt);
    return dueAt.getFullYear() === now.getFullYear() && dueAt.getMonth() === now.getMonth();
  });
}
