import { Bell, CalendarDays, CalendarHeart, ChevronLeft, ChevronRight, Church, Clock3, Plus, RefreshCw, Repeat2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { ChristianHoliday } from './christian-holiday';
import type { NameDay } from './name-day';
import type { PublicHoliday } from './public-holiday';
import type { TodoTask } from './todo-api';
import {
  todoCalendarDateKey,
  todoCalendarCreatorsForDay,
  todoCalendarDueTimeForDay,
  todoCalendarDueCount,
  todoCalendarMonthDays,
  todoCalendarRangeForDay,
  todoCalendarReminderCount,
  todoCalendarReminderTimesForDay,
  todoCalendarTasksForDay
} from './todo-calendar-model';
import { todoRecurrenceLabel } from './todo-recurrence-label';
import { todoCreatorColorCss } from './todo-creator-color-options';

const weekdayLabels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];
const maximumCalendarDayMarkers = 4;

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
  onAddTask,
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
  onAddTask?: (dateKey: string) => void;
  onTaskOpen: (task: TodoTask) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12));
  const [selectedDateKey, setSelectedDateKey] = useState(() => todoCalendarDateKey(today));
  const [showAllNameDays, setShowAllNameDays] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
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

  function finishSwipe(x: number, y: number) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const horizontalDistance = x - start.x;
    const verticalDistance = y - start.y;
    if (Math.abs(horizontalDistance) < 50 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;
    moveMonth(horizontalDistance < 0 ? 1 : -1);
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

      <div
        className="calendar-card"
        onTouchStart={(event) => {
          const touch = event.changedTouches[0];
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0];
          if (touch) finishSwipe(touch.clientX, touch.clientY);
        }}
      >
        <div className="calendar-weekdays" aria-hidden="true">
          {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="calendar-grid">
          {days.map((day) => {
            const dateKey = todoCalendarDateKey(day);
            const dueCount = todoCalendarDueCount(tasks, dateKey);
            const reminderCount = todoCalendarReminderCount(tasks, dateKey);
            const dayTasks = todoCalendarTasksForDay(tasks, dateKey);
            const taskCreators = todoCalendarCreatorsForDay(tasks, dateKey);
            const holiday = holidays.find((item) => item.date === dateKey);
            const christianCelebrations = christianHolidays
              .filter((item) => item.date === dateKey)
              .filter((item) => !isPublicHolidayDuplicate(holiday?.name, item.name));
            const hasHolidayMarker = Boolean(holiday || christianCelebrations.length > 0);
            const visibleTaskMarkers = dayTasks.slice(0, maximumCalendarDayMarkers - Number(hasHolidayMarker));
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
                aria-label={calendarDayLabel(dateLabel, dueCount, reminderCount, dayTasks.length, taskCreators.map((task) => task.createdByName?.trim() || 'osobę bez nazwy'), holiday?.name, christianCelebrations, nameDay?.names)}
                aria-pressed={selected}
              >
                <span>{day.getDate()}</span>
                {(dayTasks.length > 0 || hasHolidayMarker) && (
                  <span className="calendar-day-markers" aria-hidden="true">
                    {visibleTaskMarkers.map((task) => (
                      <i
                        key={task.id}
                        className="task"
                        style={{ backgroundColor: todoCreatorColorCss(task.calendarColor ?? task.createdByColor) }}
                      />
                    ))}
                    {hasHolidayMarker && <i className="holiday" />}
                  </span>
                )}
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
          <button className="calendar-add-button" onClick={() => onAddTask?.(selectedDateKey)}><Plus aria-hidden="true" /><span>Dodaj</span></button>
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
                    <TodoAgendaSchedule task={task} dateKey={selectedDateKey} />
                    {todoCalendarReminderTimesForDay(task, selectedDateKey).map((reminder) => <span key={reminder}><Bell aria-hidden="true" />Przypomnienie {formatTime(reminder)}</span>)}
                    {task.recurrence && <span><Repeat2 aria-hidden="true" />{todoRecurrenceLabel(task.recurrence)}</span>}
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

function TodoAgendaSchedule({ task, dateKey }: { task: TodoTask; dateKey: string }) {
  const range = todoCalendarRangeForDay(task, dateKey);
  if (range) {
    return (
      <>
        <span><Clock3 aria-hidden="true" />Start {formatAgendaMoment(range.startAt, dateKey)}</span>
        <span><Clock3 aria-hidden="true" />Koniec {formatAgendaMoment(range.endAt, dateKey)}</span>
      </>
    );
  }
  const dueAt = todoCalendarDueTimeForDay(task, dateKey);
  return dueAt && <span><Clock3 aria-hidden="true" />Termin {formatTime(dueAt)}</span>;
}

function formatAgendaMoment(value: string, dateKey: string): string {
  if (todoCalendarDateKey(value) === dateKey) return formatTime(value);
  return new Intl.DateTimeFormat('pl', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
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
  taskCount: number,
  creatorNames: string[],
  holidayName: string | undefined,
  christianHolidays: ChristianHoliday[],
  names: string[] | undefined
): string {
  const moments = taskCount === 0
    ? 'bez terminów i przypomnień'
    : `terminy: ${dueCount}, przypomnienia: ${reminderCount}`;
  const details = [
    taskCount > 0 ? `zadania: ${taskCount}` : null,
    creatorNames.length ? `zadania dodane przez: ${creatorNames.join(', ')}` : null,
    holidayName ? `święto ustawowe: ${holidayName}` : null,
    ...christianHolidays.map((holiday) => `święto chrześcijańskie: ${holiday.name}`),
    names?.length ? `imieniny: ${names.join(', ')}` : null
  ].filter(Boolean);
  return [dateLabel, moments, ...details].join(', ');
}
