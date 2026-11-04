// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ChristianHoliday } from './christian-holiday';
import type { NameDay } from './name-day';
import type { TodoTask } from './todo-api';
import type { PublicHoliday } from './public-holiday';
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
    section: 'standard',
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

  it('presents due dates and reminders as separate day counters', () => {
    const task = taskForToday('task-with-reminders', 'personal');
    task.reminders = [
      new Date(new Date(task.dueAt!).getTime() - 60 * 60 * 1000).toISOString(),
      new Date(new Date(task.dueAt!).getTime() - 30 * 60 * 1000).toISOString()
    ];
    const { container } = render(<TodoCalendar tasks={[task]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: /terminy: 1, przypomnienia: 2/ })).toBeTruthy();
    expect(container.querySelector('.calendar-due-count')?.textContent).toBe('1');
    expect(container.querySelector('.calendar-reminder-count')?.textContent).toBe('2');
  });

  it('shows a public holiday separately from tasks and includes it in the day label', () => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const holiday: PublicHoliday = { countryCode: 'PL', date, name: 'Święto testowe' };

    render(<TodoCalendar tasks={[]} holidays={[holiday]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={vi.fn()} />);

    expect(screen.getByText('Święto ustawowe')).toBeTruthy();
    expect(screen.getByText('Święto testowe')).toBeTruthy();
    expect(screen.getByRole('button', { name: /święto ustawowe: Święto testowe/ })).toBeTruthy();
  });

  it('shows Christian celebrations and name days in the selected day information', () => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const christianHoliday: ChristianHoliday = { date, name: 'Niedziela Palmowa' };
    const nameDay: NameDay = { date, names: ['Amelia', 'Jan'] };

    const { container } = render(
      <TodoCalendar
        tasks={[]}
        christianHolidays={[christianHoliday]}
        nameDays={[nameDay]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        onTaskOpen={vi.fn()}
      />
    );

    expect(screen.getByText('Święto chrześcijańskie')).toBeTruthy();
    expect(screen.getByText('Niedziela Palmowa')).toBeTruthy();
    expect(screen.getByText('Imieniny: Amelia, Jan')).toBeTruthy();
    expect(screen.getByRole('button', { name: /święto chrześcijańskie: Niedziela Palmowa, imieniny: Amelia, Jan/ })).toBeTruthy();
    expect(container.querySelectorAll('.calendar-holiday-marker')).toHaveLength(1);
    expect(container.querySelector('.calendar-christian-marker')).toBeNull();
  });

  it('shows two name days first and expands the remaining names on request', () => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const nameDay: NameDay = { date, names: ['Amelia', 'Jan', 'Karol', 'Maria'] };

    render(
      <TodoCalendar
        tasks={[]}
        nameDays={[nameDay]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        onTaskOpen={vi.fn()}
      />
    );

    expect(screen.getByText('Imieniny: Amelia, Jan')).toBeTruthy();
    expect(screen.queryByText(/Karol/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż więcej' }));

    expect(screen.getByText('Imieniny: Amelia, Jan, Karol, Maria')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pokaż mniej' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('shows a duplicated Christian celebration only as a public holiday', () => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const holiday: PublicHoliday = { countryCode: 'PL', date, name: 'Wszystkich Świętych' };
    const christianHoliday: ChristianHoliday = { date, name: 'Wszystkich Świętych' };

    const { container } = render(
      <TodoCalendar
        tasks={[]}
        holidays={[holiday]}
        christianHolidays={[christianHoliday]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        onTaskOpen={vi.fn()}
      />
    );

    expect(screen.getByText('Święto ustawowe')).toBeTruthy();
    expect(screen.queryByText('Święto chrześcijańskie')).toBeNull();
    expect(screen.getAllByText('Wszystkich Świętych')).toHaveLength(1);
    expect(container.querySelectorAll('.calendar-holiday-marker')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /święto ustawowe: Wszystkich Świętych/ }).getAttribute('aria-label'))
      .not.toContain('święto chrześcijańskie');
  });
});
