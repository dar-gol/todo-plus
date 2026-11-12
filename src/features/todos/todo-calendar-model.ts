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
  return activeTasks(tasks).filter((task) => todoCalendarDueTimeForDay(task, dateKey)).length;
}

export function todoCalendarReminderCount(tasks: TodoTask[], dateKey: string): number {
  return activeTasks(tasks).reduce((count, task) => count + todoCalendarReminderTimesForDay(task, dateKey).length, 0);
}

export function todoCalendarCreatorsForDay(tasks: TodoTask[], dateKey: string): TodoTask[] {
  const tasksByCreator = new Map<string, TodoTask>();
  for (const task of activeTasks(tasks)) {
    if (todoCalendarDueTimeForDay(task, dateKey) && !tasksByCreator.has(task.createdByUserId)) {
      tasksByCreator.set(task.createdByUserId, task);
    }
  }
  return [...tasksByCreator.values()];
}

export function todoCalendarDueTimeForDay(task: TodoTask, dateKey: string): string | null {
  if (!task.dueAt) return null;
  if (todoCalendarDateKey(task.dueAt) === dateKey) return task.dueAt;
  if (!task.recurrence || !recurrenceOccursOnDate(task.dueAt, task.recurrence, dateKey)) return null;
  return occurrenceDateTime(task.dueAt, dateKey);
}

export function todoCalendarReminderTimesForDay(task: TodoTask, dateKey: string): string[] {
  return task.reminders.flatMap((reminder) => {
    if (todoCalendarDateKey(reminder) === dateKey) return [reminder];
    if (!task.recurrence || !recurrenceOccursOnDate(reminder, task.recurrence, dateKey)) return [];
    return [occurrenceDateTime(reminder, dateKey)];
  });
}

function todoTaskOccursOnDay(task: TodoTask, dateKey: string): boolean {
  return Boolean(todoCalendarDueTimeForDay(task, dateKey) || todoCalendarReminderTimesForDay(task, dateKey).length);
}

function firstOccurrenceOnDay(task: TodoTask, dateKey: string): number {
  const moments = [todoCalendarDueTimeForDay(task, dateKey), ...todoCalendarReminderTimesForDay(task, dateKey)]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());

  return Math.min(...moments);
}

function recurrenceOccursOnDate(anchorValue: string, recurrence: NonNullable<TodoTask['recurrence']>, dateKey: string): boolean {
  const anchor = new Date(anchorValue);
  const candidate = dateFromKey(dateKey);
  const anchorDay = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 12);
  if (candidate < anchorDay) return false;

  if (recurrence === 'daily') return true;
  if (recurrence === 'weekly') return Math.round((candidate.getTime() - anchorDay.getTime()) / 86_400_000) % 7 === 0;
  if (recurrence === 'monthly') {
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    return candidate.getDate() === Math.min(anchor.getDate(), lastDay);
  }

  if (candidate.getMonth() !== anchor.getMonth()) return false;
  const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
  return candidate.getDate() === Math.min(anchor.getDate(), lastDay);
}

function occurrenceDateTime(anchorValue: string, dateKey: string): string {
  const anchor = new Date(anchorValue);
  const occurrence = dateFromKey(dateKey);
  occurrence.setHours(anchor.getHours(), anchor.getMinutes(), anchor.getSeconds(), anchor.getMilliseconds());
  return occurrence.toISOString();
}

function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function activeTasks(tasks: TodoTask[]): TodoTask[] {
  return tasks.filter((task) => !task.completedAt);
}
