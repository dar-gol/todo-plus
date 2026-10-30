import { Bell, CalendarDays, ChevronLeft, ChevronRight, Clock3, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TodoTask } from './todo-api';
import {
  todoCalendarDateKey,
  todoCalendarEventCount,
  todoCalendarMonthDays,
  todoCalendarTasksForDay
} from './todo-calendar-model';

const weekdayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

export function TodoCalendar({ tasks, loading, error, onRetry, onTaskOpen }: {
  tasks: TodoTask[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onTaskOpen: (task: TodoTask) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [selectedDateKey, setSelectedDateKey] = useState(() => todoCalendarDateKey(today));
  const days = todoCalendarMonthDays(visibleMonth);
  const selectedTasks = todoCalendarTasksForDay(tasks, selectedDateKey);

  function moveMonth(offset: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1, 12);
    setVisibleMonth(nextMonth);
    setSelectedDateKey(todoCalendarDateKey(nextMonth));
  }

  if (loading) return <div className="state-card"><RefreshCw className="spin" aria-hidden="true" />Wczytuję kalendarz…</div>;
  if (error) return <div className="state-card error-state"><p>{error.message}</p><button onClick={onRetry}>Spróbuj ponownie</button></div>;

  return (
    <section className="todo-calendar" aria-labelledby="calendar-title">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">WSZYSTKIE LISTY</p>
          <h1 id="calendar-title">Kalendarz</h1>
        </div>
        <div className="calendar-navigation" aria-label="Zmień miesiąc">
          <button className="icon-button" onClick={() => moveMonth(-1)} aria-label="Poprzedni miesiąc"><ChevronLeft aria-hidden="true" /></button>
          <strong aria-live="polite">{new Intl.DateTimeFormat('pl', { month: 'long', year: 'numeric' }).format(visibleMonth)}</strong>
          <button className="icon-button" onClick={() => moveMonth(1)} aria-label="Następny miesiąc"><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>

      <div className="calendar-card">
        <div className="calendar-weekdays" aria-hidden="true">
          {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const dateKey = todoCalendarDateKey(day);
            const eventCount = todoCalendarEventCount(tasks, dateKey);
            const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
            const selected = dateKey === selectedDateKey;
            const isToday = dateKey === todoCalendarDateKey(today);
            const dateLabel = new Intl.DateTimeFormat('pl', { day: 'numeric', month: 'long', year: 'numeric' }).format(day);
            return (
              <button
                key={dateKey}
                className={`calendar-day${outsideMonth ? ' outside-month' : ''}${selected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                onClick={() => setSelectedDateKey(dateKey)}
                aria-label={`${dateLabel}${eventCount ? `, ${eventCount} ${eventCount === 1 ? 'zadanie' : 'zadania'}` : ', bez zadań'}`}
                aria-pressed={selected}
              >
                <span>{day.getDate()}</span>
                {eventCount > 0 && <small aria-hidden="true">{eventCount}</small>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="calendar-agenda">
        <div className="calendar-agenda-heading">
          <CalendarDays aria-hidden="true" />
          <div><span>Plan na dzień</span><strong>{formatAgendaDate(selectedDateKey)}</strong></div>
        </div>
        {selectedTasks.length === 0 ? (
          <p className="calendar-empty">Nie ma tu terminów ani przypomnień.</p>
        ) : (
          <ul className="calendar-agenda-list">
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <button onClick={() => onTaskOpen(task)} aria-label={`Pokaż zadanie ${task.title}`}>
                  <div className="calendar-task-title">
                    <strong>{task.title}</strong>
                    <span className={`scope-pill ${task.scope}`}>{task.scope === 'personal' ? 'Moja lista' : 'Rodzina'}</span>
                  </div>
                  <div className="calendar-task-moments">
                    {task.dueAt && todoCalendarDateKey(task.dueAt) === selectedDateKey && <span><Clock3 aria-hidden="true" />Termin {formatTime(task.dueAt)}</span>}
                    {task.reminders.filter((reminder) => todoCalendarDateKey(reminder) === selectedDateKey).map((reminder) => <span key={reminder}><Bell aria-hidden="true" />Przypomnienie {formatTime(reminder)}</span>)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function formatAgendaDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('pl', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day, 12));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pl', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
