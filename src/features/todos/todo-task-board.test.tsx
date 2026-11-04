// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TodoTask } from './todo-api';
import { TodoTaskBoard } from './todo-task-board';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function task(id: string, title: string, section: TodoTask['section']): TodoTask {
  return {
    completedAt: null,
    createdAt: '2026-11-03T09:00:00.000Z',
    createdByName: 'Ada',
    createdByUserId: 'user-1',
    description: null,
    dueAt: null,
    id,
    noteDocument: null,
    notes: null,
    reminders: [],
    scope: 'personal',
    section,
    title,
    updatedAt: '2026-11-03T09:00:00.000Z'
  };
}

describe('TodoTaskBoard', () => {
  it('shows priority, regular, and deferred tasks in distinct ordered sections', () => {
    render(
      <TodoTaskBoard
        tasks={[
          task('pinned', 'Zapłacić rachunek', 'pinned'),
          task('standard', 'Kupić pieczywo', 'standard'),
          task('later', 'Przejrzeć szafkę', 'later')
        ]}
        scope="personal"
        pending={false}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
        onReorder={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Najważniejsze' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Do zrobienia' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Na później' })).toBeTruthy();
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

    expect(screen.queryByRole('heading', { name: 'Najważniejsze' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Do zrobienia' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Na później' })).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: 'Rozwiń zadania na później' }));
    await waitFor(() => expect(screen.getByText('Przejrzeć szafkę')).toBeTruthy());
    expect(window.localStorage.getItem('todo-plus:later-collapsed:personal:v1')).toBe('false');
  });
});
