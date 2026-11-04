import { describe, expect, it } from 'vitest';
import type { TodoTask } from './todo-api';
import {
  todoCalendarDueCount,
  todoCalendarMonthDays,
  todoCalendarReminderCount,
  todoCalendarTasksForDay
} from './todo-calendar-model';

const baseTask: TodoTask = {
  completedAt: null,
  createdAt: '2026-10-01T08:00:00.000Z',
  createdByName: 'Ada',
  createdByUserId: 'user-1',
  description: null,
  dueAt: null,
  id: 'task-1',
  noteDocument: null,
  notes: null,
  reminders: [],
  section: 'standard',
  scope: 'personal',
  title: 'Zadanie',
  updatedAt: '2026-10-01T08:00:00.000Z'
};

describe('Todo calendar model', () => {
  it('builds a six-week month grid starting on Monday', () => {
    const days = todoCalendarMonthDays(new Date(2026, 10, 1, 12));

    expect(days).toHaveLength(42);
    expect(days[0].getDay()).toBe(1);
    expect(days.some((day) => day.getMonth() === 10 && day.getDate() === 30)).toBe(true);
  });

  it('combines personal and family tasks occurring through due dates or reminders', () => {
    const tasks = [
      { ...baseTask, id: 'personal', dueAt: '2026-11-05T08:00:00.000Z' },
      { ...baseTask, id: 'family', scope: 'family' as const, reminders: ['2026-11-05T07:00:00.000Z'] },
      { ...baseTask, id: 'other-day', dueAt: '2026-11-06T08:00:00.000Z' }
    ];

    expect(todoCalendarTasksForDay(tasks, '2026-11-05').map((task) => task.id)).toEqual(['family', 'personal']);
  });

  it('does not show completed tasks in the calendar', () => {
    const completed = { ...baseTask, completedAt: '2026-11-04T12:00:00.000Z', dueAt: '2026-11-05T08:00:00.000Z' };

    expect(todoCalendarTasksForDay([completed], '2026-11-05')).toEqual([]);
  });

  it('counts due dates and every reminder separately', () => {
    const tasks = [
      { ...baseTask, id: 'due-and-reminders', dueAt: '2026-11-05T08:00:00.000Z', reminders: ['2026-11-05T07:00:00.000Z', '2026-11-05T07:30:00.000Z'] },
      { ...baseTask, id: 'reminder-only', reminders: ['2026-11-05T12:00:00.000Z'] },
      { ...baseTask, id: 'completed', completedAt: '2026-11-04T12:00:00.000Z', dueAt: '2026-11-05T09:00:00.000Z', reminders: ['2026-11-05T08:00:00.000Z'] }
    ];

    expect(todoCalendarDueCount(tasks, '2026-11-05')).toBe(1);
    expect(todoCalendarReminderCount(tasks, '2026-11-05')).toBe(3);
  });
});
