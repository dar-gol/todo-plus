// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TodoTask } from './todo-api';
import { TodoTaskBoard } from './todo-task-board';
import { planTodoTaskOrder } from './todo-task-order-model';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function task(id: string, title: string, section: TodoTask['section']): TodoTask {
  return {
    completedAt: null,
    createdAt: '2026-11-03T09:00:00.000Z',
    createdByName: 'Ada',
    createdByColor: 'blue',
    createdByUserId: 'user-1',
    description: null,
    dueAt: null,
    dueAtAlarmEnabled: false,
    id,
    noteDocument: null,
    notes: null,
    reminders: [],
    alarmReminders: [],
    scope: 'personal',
    section,
    title,
    updatedAt: '2026-11-03T09:00:00.000Z'
  };
}

describe('TodoTaskBoard', () => {
  it('shows priority, regular, and deferred tasks in distinct ordered sections', () => {
    const visible = [
      task('pinned', 'Zapłacić rachunek', 'pinned'),
      task('standard', 'Kupić pieczywo', 'standard'),
      task('later', 'Przejrzeć szafkę', 'later')
    ];
    render(
      <TodoTaskBoard
        tasks={[...visible, task('hidden', 'Ukryte przez filtr', 'later')]}
        visibleTasks={visible}
        scope="personal"
        pending={false}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    expect(screen.getByRole('region', { name: 'Najważniejsze' })).toBeTruthy();
    expect(screen.queryByText('Najważniejsze')).toBeNull();
    expect(screen.getByRole('region', { name: 'Do zrobienia' })).toBeTruthy();
    expect(screen.queryByText('Do zrobienia')).toBeNull();
    expect(screen.getByText('Na później').closest('summary')?.textContent).toBe('Na później 1');
    fireEvent.click(screen.getByText('Na później'));
    expect(screen.getByText('Przejrzeć szafkę')).toBeTruthy();
    expect(screen.queryByText('Ukryte przez filtr')).toBeNull();
    expect(screen.queryByText('Maksymalnie 3')).toBeNull();
    expect(screen.queryByText('Mogą poczekać')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Zmień priorytet zadania Zapłacić rachunek' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Zadanie Zapłacić rachunek. Przytrzymaj, aby zmienić priorytet.' })).toBeTruthy();
  });

  it('hides empty sections until a task is being moved', () => {
    render(
      <TodoTaskBoard
        tasks={[task('standard', 'Kupić pieczywo', 'standard')]}
        scope="personal"
        pending={false}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    expect(screen.queryByRole('region', { name: 'Najważniejsze' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Do zrobienia' })).toBeTruthy();
    expect(screen.queryByText('Na później')).toBeNull();
  });

  it('restores and updates the collapsed later section preference', async () => {
    window.localStorage.setItem('todo-plus:later-collapsed:personal:v1', 'true');
    render(
      <TodoTaskBoard
        tasks={[task('later', 'Przejrzeć szafkę', 'later')]}
        scope="personal"
        pending={false}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.queryByText('Przejrzeć szafkę')).toBeNull());
    fireEvent.click(screen.getByText('Na później'));
    await waitFor(() => expect(screen.getByText('Przejrzeć szafkę')).toBeTruthy());
    expect(window.localStorage.getItem('todo-plus:later-collapsed:personal:v1')).toBe('false');
  });
});

describe('filtered task ordering', () => {
  const pinned = task('p1', 'Ukryte ważne', 'pinned');
  const hidden = task('s0', 'Ukryte zwykłe', 'standard');
  const first = task('s1', 'Widoczne pierwsze', 'standard');
  const last = task('s2', 'Widoczne ostatnie', 'standard');
  const later = task('l1', 'Ukryte na później', 'later');
  const tasks = [pinned, first, hidden, last, later];

  it('keeps hidden slots while reordering visible tasks in the same section', () => {
    expect(planTodoTaskOrder(tasks, [first, last], first.id, last.id)).toEqual({
      pinnedTaskIds: ['p1'], standardTaskIds: ['s2', 's0', 's1'], laterTaskIds: ['l1']
    });
  });

  it('includes every hidden task when moving into a section empty under the filter', () => {
    expect(planTodoTaskOrder(tasks, [first, last], first.id, 'later')).toEqual({
      pinnedTaskIds: ['p1'], standardTaskIds: ['s0', 's2'], laterTaskIds: ['l1', 's1']
    });
  });

  it('counts filtered-out pinned tasks toward the limit', () => {
    const all = [...tasks, task('p2', 'Drugie', 'pinned'), task('p3', 'Trzecie', 'pinned')];
    expect(planTodoTaskOrder(all, [first, last], first.id, 'pinned')).toBeNull();
  });
});
