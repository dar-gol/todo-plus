import { Bell, CalendarDays, CalendarHeart, ChevronLeft, ChevronRight, Church, Clock3, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChristianHoliday } from './christian-holiday';
import type { NameDay } from './name-day';
import type { PublicHoliday } from './public-holiday';
import type { TodoTask } from './todo-api';
import {
  todoCalendarDateKey,
  todoCalendarDueCount,
  todoCalendarMonthDays,
  todoCalendarReminderCount,
  todoCalendarTasksForDay
} from './todo-calendar-model';

const weekdayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

export function TodoCalendar({
  tasks,
  holidays = [],
  christianHolidays = [],
  nameDays = [],
  observancesLoading = false,
  observancesError = null,
  loading,
  error,
  onRetry,
  onObservancesRetry,
  onVisibleYearChange,
  onTaskOpen
}: {
  tasks: TodoTask[];
  holidays?: PublicHoliday[];
  christianHolidays?: ChristianHoliday[];
  nameDays?: NameDay[];
  observancesLoading?: boolean;
  observancesError?: Error | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onObservancesRetry?: () => void;
  onVisibleYearChange?: (year: number) => void;
  onTaskOpen: (task: TodoTask) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [selectedDateKey, setSelectedDateKey] = useState(() => todoCalendarDateKey(today));
  const [showAllNameDays, setShowAllNameDays] = useState(false);
  const days = todoCalendarMonthDays(visibleMonth);
  const selectedTasks = todoCalendarTasksForDay(tasks, selectedDateKey);
  const selectedHoliday = holidays.find((holiday) => holiday.date === selectedDateKey);
  const selectedChristianHolidays = christianHolidays
    .filter((holiday) => holiday.date === selectedDateKey)
    .filter((holiday) => !isPublicHolidayDuplicate(selectedHoliday?.name, holiday.name));
  const selectedNameDay = nameDays.find((nameDay) => nameDay.date === selectedDateKey);
  const selectedNames = selectedNameDay?.names ?? [];
  const visibleSelectedNames = showAllNameDays ? selectedNames : selectedNames.slice(0, 2);

  function moveMonth(offset: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1, 12);
    setVisibleMonth(nextMonth);
    setSelectedDateKey(todoCalendarDateKey(nextMonth));
    setShowAllNameDays(false);
    onVisibleYearChange?.(nextMonth.getFullYear());
  }

  function selectDate(dateKey: string) {
    setSelectedDateKey(dateKey);
    setShowAllNameDays(false);
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
            const dueCount = todoCalendarDueCount(tasks, dateKey);
            const reminderCount = todoCalendarReminderCount(tasks, dateKey);
            const holiday = holidays.find((item) => item.date === dateKey);
            const christianCelebrations = christianHolidays
              .filter((item) => item.date === dateKey)
              .filter((item) => !isPublicHolidayDuplicate(holiday?.name, item.name));
            const nameDay = nameDays.find((item) => item.date === dateKey);
            const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
            const selected = dateKey === selectedDateKey;
            const isToday = dateKey === todoCalendarDateKey(today);
            const dateLabel = new Intl.DateTimeFormat('pl', { day: 'numeric', month: 'long', year: 'numeric' }).format(day);
            return (
              <button
                key={dateKey}
                className={`calendar-day${outsideMonth ? ' outside-month' : ''}${selected ? ' selected' : ''}${isToday ? ' today' : ''}${holiday || christianCelebrations.length ? ' holiday' : ''}`}
                onClick={() => selectDate(dateKey)}
                aria-label={calendarDayLabel(dateLabel, dueCount, reminderCount, holiday?.name, christianCelebrations, nameDay?.names)}
                aria-pressed={selected}
              >
                <span>{day.getDate()}</span>
                {(holiday || christianCelebrations.length > 0) && <i className="calendar-holiday-marker" aria-hidden="true" />}
                {dueCount > 0 && <small className="calendar-due-count" title={`${dueCount} ${dueCount === 1 ? 'termin' : 'terminy'}`} aria-hidden="true">{dueCount}</small>}
                {reminderCount > 0 && <small className="calendar-reminder-count" title={`${reminderCount} ${reminderCount === 1 ? 'przypomnienie' : 'przypomnienia'}`} aria-hidden="true">{reminderCount}</small>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="calendar-agenda">
        <div className="calendar-agenda-heading">
          <CalendarDays aria-hidden="true" />
          <div>
            <span className="calendar-agenda-kicker">Plan na dzień</span>
            <strong>{formatAgendaDate(selectedDateKey)}</strong>
            {selectedNames.length > 0 && (
              <div className="calendar-name-days">
                <span>Imieniny: {visibleSelectedNames.join(', ')}</span>
                {selectedNames.length > 2 && (
                  <button
                    type="button"
                    aria-expanded={showAllNameDays}
                    onClick={() => setShowAllNameDays((visible) => !visible)}
                  >
                    {showAllNameDays ? 'Pokaż mniej' : 'Pokaż więcej'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {observancesLoading && <p className="calendar-holidays-status">Wczytuję święta i imieniny…</p>}
        {observancesError && (
          <p className="calendar-holidays-status error">
            Nie udało się wczytać części informacji kalendarza.
            {onObservancesRetry && <button onClick={onObservancesRetry}>Spróbuj ponownie</button>}
          </p>
        )}
        {selectedHoliday && (
          <div className="calendar-holiday-card">
            <CalendarHeart aria-hidden="true" />
            <div><span>Święto ustawowe</span><strong>{selectedHoliday.name}</strong></div>
          </div>
        )}
        {selectedChristianHolidays.map((holiday) => (
          <div className="calendar-christian-card" key={`${holiday.date}-${holiday.name}`}>
            <Church aria-hidden="true" />
            <div><span>Święto chrześcijańskie</span><strong>{holiday.name}</strong></div>
          </div>
        ))}
        {selectedTasks.length === 0 && (
          <p className="calendar-empty">Nie ma tu terminów ani przypomnień.</p>
        )}
        {selectedTasks.length > 0 && (
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

const publicHolidayAliases: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['święto trzech króli', 'objawienie pańskie']),
  new Set(['wielkanoc', 'niedziela zmartwychwstania pańskiego']),
  new Set(['zielone świątki', 'zesłanie ducha świętego']),
  new Set(['boże ciało', 'najświętszego ciała i krwi chrystusa']),
  new Set(['boże narodzenie', 'narodzenie pańskie'])
];

function isPublicHolidayDuplicate(publicHolidayName: string | undefined, christianHolidayName: string): boolean {
  if (!publicHolidayName) return false;

  const publicName = normalizeHolidayName(publicHolidayName);
  const christianName = normalizeHolidayName(christianHolidayName);
  if (publicName === christianName) return true;

  return publicHolidayAliases.some((aliases) => aliases.has(publicName) && aliases.has(christianName));
}

function normalizeHolidayName(name: string): string {
  return name.trim().toLocaleLowerCase('pl');
}

function formatAgendaDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('pl', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day, 12));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pl', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function calendarDayLabel(
  dateLabel: string,
  dueCount: number,
  reminderCount: number,
  holidayName: string | undefined,
  christianHolidays: ChristianHoliday[],
  names: string[] | undefined
): string {
  const moments = dueCount === 0 && reminderCount === 0
    ? 'bez terminów i przypomnień'
    : `terminy: ${dueCount}, przypomnienia: ${reminderCount}`;
  const details = [
    holidayName ? `święto ustawowe: ${holidayName}` : null,
    ...christianHolidays.map((holiday) => `święto chrześcijańskie: ${holiday.name}`),
    names?.length ? `imieniny: ${names.join(', ')}` : null
  ].filter(Boolean);
  return [dateLabel, moments, ...details].join(', ');
}
