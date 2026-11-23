// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { TodoTask } from './todo-api';
import { filterTodoTasks } from './todo-task-filter-model';
import { todoTaskFilterPreferences } from './todo-task-filter-preferences';

function task(id: string, dueAt: string | null): TodoTask {
  return {
    completedAt: null,
    createdAt: '2026-11-01T08:00:00.000Z',
    createdByColor: 'blue',
    createdByName: 'Ada',
    createdByUserId: 'user-1',
    description: null,
    dueAt,
    id,
    noteDocument: null,
    notes: null,
    recurrence: null,
    reminders: [],
    scope: 'personal',
    section: 'standard',
    title: id,
    updatedAt: '2026-11-01T08:00:00.000Z'
  };
}

beforeEach(() => window.localStorage.clear());

describe('task list filters', () => {
  const tasks = [
    task('without-date', null),
    task('november', '2026-11-23T18:30:00.000Z'),
    task('december', '2026-12-01T08:00:00.000Z')
  ];

  it('shows tasks with a deadline, without a deadline, or due in the current local month', () => {
    expect(filterTodoTasks(tasks, 'dated').map(({ id }) => id)).toEqual(['november', 'december']);
    expect(filterTodoTasks(tasks, 'undated').map(({ id }) => id)).toEqual(['without-date']);
    expect(filterTodoTasks(tasks, 'month', new Date(2026, 10, 18)).map(({ id }) => id)).toEqual(['november']);
  });

  it('remembers a separate filter for each list', () => {
    todoTaskFilterPreferences.save('personal', 'undated');
    todoTaskFilterPreferences.save('family', 'month');

    expect(todoTaskFilterPreferences.load('personal')).toBe('undated');
    expect(todoTaskFilterPreferences.load('family')).toBe('month');
  });
});
