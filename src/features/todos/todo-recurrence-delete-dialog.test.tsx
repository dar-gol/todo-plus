// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TodoTask } from './todo-api';
import { TodoRecurrenceDeleteDialog } from './todo-recurrence-delete-dialog';

const recurringTask: TodoTask = {
  completedAt: null,
  createdAt: '2026-11-12T09:00:00.000Z',
  createdByName: 'Ada',
  createdByColor: 'blue',
  createdByUserId: 'user-1',
  description: null,
  dueAt: '2026-11-12T09:00:00.000Z',
  dueAtAlarmEnabled: false,
  id: 'task-1',
  noteDocument: null,
  notes: null,
  recurrence: 'weekly',
  reminders: [],
  alarmReminders: [],
  section: 'standard',
  scope: 'personal',
  title: 'Podlać kwiaty',
  updatedAt: '2026-11-12T09:00:00.000Z'
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', ''); };
});

afterEach(cleanup);

describe('TodoRecurrenceDeleteDialog', () => {
  it('lets the user remove only the selected occurrence', () => {
    const onDelete = vi.fn();
    render(<TodoRecurrenceDeleteDialog task={recurringTask} pending={false} error={null} onDelete={onDelete} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Tylko ten termin/ }));

    expect(onDelete).toHaveBeenCalledWith('occurrence');
  });

  it('requires an explicit choice before deleting the whole series', () => {
    const onDelete = vi.fn();
    render(<TodoRecurrenceDeleteDialog task={recurringTask} pending={false} error={null} onDelete={onDelete} onClose={vi.fn()} />);

    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Całą serię/ }));

    expect(onDelete).toHaveBeenCalledWith('series');
  });
});
