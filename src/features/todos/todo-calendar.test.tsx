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
    createdByColor: 'purple',
    createdByUserId: 'user-1',
    description: null,
    dueAt,
    dueAtAlarmEnabled: false,
    id,
    noteDocument: null,
    notes: null,
    reminders: [],
    alarmReminders: [],
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

  it('presents one separate colored strip per task below the day number', () => {
    const firstTask = taskForToday('first-task', 'personal');
    firstTask.reminders = [
      new Date(new Date(firstTask.dueAt!).getTime() - 60 * 60 * 1000).toISOString(),
      new Date(new Date(firstTask.dueAt!).getTime() - 30 * 60 * 1000).toISOString()
    ];
    const secondTask = taskForToday('second-task', 'family');
    secondTask.calendarColor = 'green';
    const thirdTask = taskForToday('third-task', 'family');
    thirdTask.createdByColor = 'orange';
    const { container } = render(<TodoCalendar tasks={[firstTask, secondTask, thirdTask]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: /terminy: 3, przypomnienia: 2/ })).toBeTruthy();
    const markers = container.querySelectorAll('.calendar-day-markers .task');
    expect(markers).toHaveLength(3);
    expect((markers[0] as HTMLElement).style.backgroundColor).toBe('rgb(88, 29, 152)');
    expect((markers[1] as HTMLElement).style.backgroundColor).toBe('rgb(48, 143, 97)');
    expect((markers[2] as HTMLElement).style.backgroundColor).toBe('rgb(153, 53, 11)');
    expect(container.querySelector('.calendar-day-markers .reminder')).toBeNull();
    expect(container.querySelector('.calendar-due-count')).toBeNull();
    expect(container.querySelector('.calendar-reminder-count')).toBeNull();
  });

  it('limits the day indicator to four strips including a holiday', () => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const holiday: PublicHoliday = { countryCode: 'PL', date, name: 'Święto testowe' };
    const tasks = Array.from({ length: 5 }, (_, index) => taskForToday(`task-${index}`, 'family'));

    const { container } = render(<TodoCalendar tasks={tasks} holidays={[holiday]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={vi.fn()} />);

    const markers = container.querySelectorAll('.calendar-day-markers i');
    expect(markers).toHaveLength(4);
    expect(container.querySelectorAll('.calendar-day-markers .task')).toHaveLength(3);
    expect(container.querySelectorAll('.calendar-day-markers .holiday')).toHaveLength(1);
  });

  it('shows the chosen color on each day of the range and lists both times in the daily agenda', () => {
    const now = new Date();
    const middleDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 18);
    const task = { ...taskForToday('multi-day', 'personal'), calendarColor: 'green' as const, endAt: end.toISOString() };
    const { container } = render(<TodoCalendar tasks={[task]} loading={false} error={null} onRetry={vi.fn()} onTaskOpen={vi.fn()} />);

    const markers = container.querySelectorAll<HTMLElement>('.calendar-day-markers .task');
    expect([...markers].map((marker) => marker.style.backgroundColor)).toEqual(Array(3).fill('rgb(48, 143, 97)'));

    const dateLabel = new Intl.DateTimeFormat('pl', { day: 'numeric', month: 'long', year: 'numeric' }).format(middleDay);
    fireEvent.click(screen.getByRole('button', { name: (name) => name.startsWith(dateLabel + ',') }));
    expect(screen.getByText(/^Start .*09:00$/)).toBeTruthy();
    expect(screen.getByText(/^Koniec .*18:00$/)).toBeTruthy();
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
    expect(container.querySelectorAll('.calendar-day-markers .holiday')).toHaveLength(1);
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
    expect(container.querySelectorAll('.calendar-day-markers .holiday')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /święto ustawowe: Wszystkich Świętych/ }).getAttribute('aria-label'))
      .not.toContain('święto chrześcijańskie');
  });

  it('adds a task with the currently selected calendar date', () => {
    const onAddTask = vi.fn();
    render(<TodoCalendar tasks={[]} loading={false} error={null} onRetry={vi.fn()} onAddTask={onAddTask} onTaskOpen={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    expect(onAddTask).toHaveBeenCalledWith(today);
  });

  it('changes month after a horizontal touch swipe', () => {
    const onVisibleYearChange = vi.fn();
    const { container } = render(<TodoCalendar tasks={[]} loading={false} error={null} onRetry={vi.fn()} onVisibleYearChange={onVisibleYearChange} onTaskOpen={vi.fn()} />);
    const card = container.querySelector('.calendar-card')!;
    const currentMonth = new Intl.DateTimeFormat('pl', { month: 'long', year: 'numeric' }).format(new Date());

    fireEvent.touchStart(card, { changedTouches: [{ clientX: 220, clientY: 100 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 80, clientY: 108 }] });

    expect(screen.queryByText(currentMonth)).toBeNull();
  });
});
