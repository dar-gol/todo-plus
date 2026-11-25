// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  dueAtAlarmEnabled: false,
  id: 'task-1',
  noteDocument: null,
  notes: null,
  recurrence: null,
  reminders: [],
  alarmReminders: [],
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
    const { container } = render(<TodoTaskDetails task={task} pending={false} onClose={vi.fn()} onUpdate={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Zapisz zmiany' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj zadanie' }));

    const title = screen.getByRole('textbox', { name: 'Co jest do zrobienia?' });
    expect(screen.getByLabelText('Termin').getAttribute('type')).toBe('datetime-local');
    expect(title.getAttribute('autofocus')).toBeNull();
    expect(document.activeElement).not.toBe(title);
    const submit = screen.getByRole<HTMLButtonElement>('button', { name: 'Zapisz zmiany' });
    expect(submit.form).toBe(container.querySelector('form'));
    expect(container.querySelector('.task-form-scroll')?.contains(submit)).toBe(false);
  });

  it('shows the saved end and lets the user reset both optional fields', async () => {
    const onUpdate = vi.fn().mockResolvedValue(task);
    render(<TodoTaskDetails task={{ ...task, endAt: '2026-11-18T15:00:00Z', calendarColor: 'green' }} pending={false} onClose={vi.fn()} onUpdate={onUpdate} />);

    expect(screen.getByText('Start', { exact: true })).toBeTruthy();
    expect(screen.getByText('Koniec', { exact: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edytuj zadanie' }));
    expect(screen.getByLabelText('Koniec', { exact: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Usuń koniec' }));
    expect(screen.getByLabelText('Termin', { exact: true })).toBeTruthy();
    fireEvent.click(screen.getByText('Więcej').closest('summary')!);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Zielony' }).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Niebieski' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ endAt: null, calendarColor: null })));
    expect(screen.queryByText('Koniec', { exact: true })).toBeNull();
  });
});
