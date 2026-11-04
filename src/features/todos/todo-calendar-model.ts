import type { TodoTask } from './todo-api';

export function todoCalendarDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todoCalendarMonthDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function todoCalendarTasksForDay(tasks: TodoTask[], dateKey: string): TodoTask[] {
  return tasks
    .filter((task) => !task.completedAt && todoTaskOccursOnDay(task, dateKey))
    .sort((left, right) => firstOccurrenceOnDay(left, dateKey) - firstOccurrenceOnDay(right, dateKey));
}

export function todoCalendarDueCount(tasks: TodoTask[], dateKey: string): number {
  return activeTasks(tasks).filter((task) => task.dueAt && todoCalendarDateKey(task.dueAt) === dateKey).length;
}

export function todoCalendarReminderCount(tasks: TodoTask[], dateKey: string): number {
  return activeTasks(tasks).reduce((count, task) => (
    count + task.reminders.filter((reminder) => todoCalendarDateKey(reminder) === dateKey).length
  ), 0);
}

function todoTaskOccursOnDay(task: TodoTask, dateKey: string): boolean {
  return Boolean(
    (task.dueAt && todoCalendarDateKey(task.dueAt) === dateKey)
    || task.reminders.some((reminder) => todoCalendarDateKey(reminder) === dateKey)
  );
}

function firstOccurrenceOnDay(task: TodoTask, dateKey: string): number {
  const moments = [task.dueAt, ...task.reminders]
    .filter((value): value is string => Boolean(value) && todoCalendarDateKey(value as string) === dateKey)
    .map((value) => new Date(value).getTime());

  return Math.min(...moments);
}

function activeTasks(tasks: TodoTask[]): TodoTask[] {
  return tasks.filter((task) => !task.completedAt);
}
