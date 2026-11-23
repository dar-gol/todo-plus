// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoEditor } from './todo-editor';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
});

afterEach(cleanup);

describe('TodoEditor deadline', () => {
  it('submits a timed deadline without copying it to custom reminders', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<TodoEditor open scope="personal" initialDate="2026-11-20" pending={false} onClose={vi.fn()} onCreate={onCreate} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Co jest do zrobienia?' }), { target: { value: 'Umówić wizytę' } });
    const deadline = screen.getByLabelText('Termin');
    expect(deadline.getAttribute('type')).toBe('datetime-local');
    expect((deadline as HTMLInputElement).value).toBe('2026-11-20T09:00');
    fireEvent.change(deadline, { target: { value: '2026-11-20T18:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj zadanie' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'personal',
      dueAt: new Date('2026-11-20T18:30').toISOString(),
      reminders: []
    })));
  });

  it('defaults calendar tasks to the family list and lets the user choose the personal list', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<TodoEditor open scope="family" allowScopeSelection initialDate="2026-11-20" pending={false} onClose={vi.fn()} onCreate={onCreate} />);

    expect((screen.getByRole('radio', { name: 'Rodzina' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: 'Co jest do zrobienia?' }), { target: { value: 'Rodzinne zadanie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj zadanie' }));
    await waitFor(() => expect(onCreate).toHaveBeenLastCalledWith(expect.objectContaining({ scope: 'family' })));

    onCreate.mockClear();
    rerender(<TodoEditor open scope="family" allowScopeSelection initialDate="2026-11-20" pending={false} onClose={vi.fn()} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Moja lista' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Co jest do zrobienia?' }), { target: { value: 'Prywatne zadanie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj zadanie' }));
    await waitFor(() => expect(onCreate).toHaveBeenLastCalledWith(expect.objectContaining({ scope: 'personal' })));
  });

  it('groups scheduling and keeps description and notes in a full-width disclosure', () => {
    const { container } = render(<TodoEditor open scope="personal" pending={false} onClose={vi.fn()} onCreate={vi.fn()} />);

    const recurrence = screen.getByRole('combobox', { name: /Powtarzanie/ });
    expect((recurrence as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByRole('region', { name: 'Planowanie' }).contains(recurrence)).toBe(true);
    expect(screen.getByText('Dodatkowe przypomnienia')).toBeTruthy();

    const disclosure = screen.getByText('Więcej').closest('details');
    expect(disclosure).not.toBeNull();
    expect(disclosure?.hasAttribute('open')).toBe(false);
    expect(disclosure?.querySelector('.task-more-content')).not.toBeNull();

    fireEvent.click(screen.getByText('Więcej').closest('summary')!);
    expect(disclosure?.hasAttribute('open')).toBe(true);

    fireEvent.change(screen.getByLabelText('Termin'), { target: { value: '2026-11-20T18:30' } });
    expect((recurrence as HTMLSelectElement).disabled).toBe(false);

    const formChildren = Array.from(container.querySelector('form')!.children);
    const deadline = screen.getByLabelText('Termin').closest('label')!;
    const planning = screen.getByRole('region', { name: 'Planowanie' });
    expect(formChildren.indexOf(deadline)).toBeLessThan(formChildren.indexOf(planning));
    expect(formChildren.indexOf(planning)).toBeLessThan(formChildren.indexOf(disclosure!));
  });
});
