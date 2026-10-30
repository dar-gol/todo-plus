// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TodoReminderEditor } from './todo-reminder-editor';

afterEach(cleanup);

describe('TodoReminderEditor', () => {
  it('adds and removes several reminder fields', () => {
    render(<TodoReminderEditor />);

    fireEvent.click(screen.getByRole('button', { name: 'Dodaj przypomnienie' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj przypomnienie' }));

    expect(screen.getAllByLabelText(/Przypomnienie \d/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Usuń przypomnienie 1' }));
    expect(screen.getAllByLabelText(/Przypomnienie \d/)).toHaveLength(1);
  });

  it('shows existing pending reminders in local date-time fields', () => {
    render(<TodoReminderEditor reminders={['2026-11-05T17:30:00.000Z']} />);
    expect(screen.getByLabelText('Przypomnienie 1').getAttribute('type')).toBe('datetime-local');
  });
});
