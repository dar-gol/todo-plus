import type { TodoTask } from './todo-api';
import type { TodoTaskFilter } from './todo-task-filter';

/** Selects tasks for the compact list filter using the device's local calendar month. */
export function filterTodoTasks(tasks: TodoTask[], filter: TodoTaskFilter, now = new Date()): TodoTask[] {
  if (filter === 'all') return tasks;
  if (filter === 'dated') return tasks.filter((task) => Boolean(task.dueAt));
  if (filter === 'undated') return tasks.filter((task) => !task.dueAt);
  return tasks.filter((task) => {
    if (!task.dueAt) return false;
    const dueAt = new Date(task.dueAt);
    return dueAt.getFullYear() === now.getFullYear() && dueAt.getMonth() === now.getMonth();
  });
}
