import type { TodoTask } from './todo-api';

const millisecondsPerDay = 86_400_000;

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
  for (const task of todoCalendarTasksForDay(tasks, dateKey)) {
    if (!tasksByCreator.has(task.createdByUserId)) {
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

/** Returns the latest occurrence whose start-to-end range intersects the requested local day. */
export function todoCalendarRangeForDay(task: TodoTask, dateKey: string): { startAt: string; endAt: string } | null {
  if (!task.dueAt || !task.endAt || dateKey < todoCalendarDateKey(task.dueAt)) return null;

  let startAt = task.dueAt;
  let endAt = task.endAt;
  if (task.recurrence) {
    const anchor = new Date(task.dueAt);
    const occurrenceDay = latestRecurrenceDay(anchor, task.recurrence, dateFromKey(dateKey));
    startAt = occurrenceDateTime(task.dueAt, todoCalendarDateKey(occurrenceDay));
    const duration = new Date(task.endAt).getTime() - anchor.getTime();
    endAt = new Date(new Date(startAt).getTime() + duration).toISOString();
  }

  return dateKey <= todoCalendarDateKey(endAt) ? { startAt, endAt } : null;
}

function todoTaskOccursOnDay(task: TodoTask, dateKey: string): boolean {
  return Boolean(todoCalendarDueTimeForDay(task, dateKey)
    || todoCalendarRangeForDay(task, dateKey)
    || todoCalendarReminderTimesForDay(task, dateKey).length);
}

function firstOccurrenceOnDay(task: TodoTask, dateKey: string): number {
  const startAt = todoCalendarDueTimeForDay(task, dateKey) ?? todoCalendarRangeForDay(task, dateKey)?.startAt;
  const moments = [startAt, ...todoCalendarReminderTimesForDay(task, dateKey)]
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
  if (recurrence === 'weekly') return Math.round((candidate.getTime() - anchorDay.getTime()) / millisecondsPerDay) % 7 === 0;
  if (recurrence === 'monthly') {
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    return candidate.getDate() === Math.min(anchor.getDate(), lastDay);
  }

  if (candidate.getMonth() !== anchor.getMonth()) return false;
  const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
  return candidate.getDate() === Math.min(anchor.getDate(), lastDay);
}

function latestRecurrenceDay(anchor: Date, recurrence: NonNullable<TodoTask['recurrence']>, day: Date): Date {
  if (recurrence === 'daily') return day;
  if (recurrence === 'weekly') {
    const daysSinceOccurrence = (day.getDay() - anchor.getDay() + 7) % 7;
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() - daysSinceOccurrence, 12);
  }

  const month = recurrence === 'yearly' ? anchor.getMonth() : day.getMonth();
  const occurrence = clampedDay(day.getFullYear(), month, anchor.getDate());
  if (occurrence <= day) return occurrence;
  return clampedDay(day.getFullYear(), month - (recurrence === 'yearly' ? 12 : 1), anchor.getDate());
}

function clampedDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay), 12);
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
