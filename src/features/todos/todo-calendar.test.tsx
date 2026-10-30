// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TodoTask } from './todo-api';
import { TodoCalendar } from './todo-calendar';

afterEach(cleanup);

function taskForToday(id: string, scope: TodoTask['scope']): TodoTask {
  const now = new Date();
  const dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9).toISOString();
  return {
    completedAt: null,
    createdAt: dueAt,
    createdByName: 'Ada',
    createdByUserId: 'user-1',
    description: null,
    dueAt,
    id,
    noteDocument: null,
    notes: null,
    reminders: [],
    scope,
    title: scope === 'personal' ? 'Prywatne zadanie' : 'Rodzinne zadanie',
    updatedAt: dueAt
  };
}

describe('TodoCalendar', () => {
  it('shows authorized personal and family tasks in one daily agenda', () => {
    render(<TodoCalendar
      tasks={[taskForToday('personal', 'personal'), taskForToday('family', 'family')]}
      loading={false}
      error={null}
      onRetry={vi.fn()}
      onTaskOpen={vi.fn()}
    />);

    expect(screen.getByText('Prywatne zadanie')).toBeTruthy();
    expect(screen.getByText('Rodzinne zadanie')).toBeTruthy();
    expect(screen.getByText('Moja lista')).toBeTruthy();
    expect(screen.getByText('Rodzina')).toBeTruthy();
  });

  it('opens the selected task from the agenda', () => {
    const onTaskOpen = vi.fn();
    const task = taskForToday('family', 'family');
    render(<TodoCalendar tasks={[task]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={onTaskOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż zadanie Rodzinne zadanie' }));

    expect(onTaskOpen).toHaveBeenCalledWith(task);
  });

  it('offers accessible month navigation', () => {
    render(<TodoCalendar tasks={[]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Poprzedni miesiąc' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Następny miesiąc' })).toBeTruthy();
  });
});
