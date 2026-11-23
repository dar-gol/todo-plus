// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TodoTask } from './todo-api';
import { TodoTaskDetails } from './todo-task-details';

const task: TodoTask = {
  completedAt: null,
  createdAt: '2026-11-12T10:00:00.000Z',
  createdByName: 'Ada',
  createdByColor: 'blue',
  createdByUserId: 'user-1',
  description: null,
  dueAt: '2026-11-16T08:00:00.000Z',
  id: 'task-1',
  noteDocument: null,
  notes: null,
  recurrence: null,
  reminders: [],
  section: 'standard',
  scope: 'personal',
  title: 'Umówić wizytę',
  updatedAt: '2026-11-12T10:00:00.000Z'
};

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
});

afterEach(cleanup);

describe('TodoTaskDetails editing', () => {
  it('does not focus a text field immediately after entering edit mode', () => {
    render(<TodoTaskDetails task={task} pending={false} onClose={vi.fn()} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj zadanie' }));

    const title = screen.getByRole('textbox', { name: 'Co jest do zrobienia?' });
    expect(screen.getByLabelText('Termin').getAttribute('type')).toBe('datetime-local');
    expect(title.getAttribute('autofocus')).toBeNull();
    expect(document.activeElement).not.toBe(title);
  });
});
