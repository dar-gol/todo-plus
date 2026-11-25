'use client';

import { CalendarClock, Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { TodoTask } from './todo-api';
import { TodoAlarmToggle } from './todo-alarm-toggle';
import { dueDateTimeInputValue } from './todo-date';
import { TodoDateTimeInput } from './todo-date-time-input';
import { TodoReminderEditor } from './todo-reminder-editor';

/** Keeps the task's time range, recurrence and reminders in one form section. */
export function TodoScheduleFields({
  initialDueAt,
  initialEndAt,
  initialDueAtAlarmEnabled = false,
  initialRecurrence,
  reminders = [],
  alarmReminders = []
}: {
  initialDueAt?: string | null;
  initialEndAt?: string | null;
  initialDueAtAlarmEnabled?: boolean;
  initialRecurrence?: TodoTask['recurrence'];
  reminders?: string[];
  alarmReminders?: string[];
}) {
  const dueAtId = useId();
  const endAtId = useId();
  const [dueAt, setDueAt] = useState(() => dueDateTimeInputValue(initialDueAt));
  const [endAt, setEndAt] = useState(() => initialEndAt ? dueDateTimeInputValue(initialEndAt) : null);
  const [dueAtAlarmEnabled, setDueAtAlarmEnabled] = useState(initialDueAtAlarmEnabled);
  const [recurrence, setRecurrence] = useState<TodoTask['recurrence']>(initialRecurrence ?? null);
  const startLabel = endAt === null ? 'Termin' : 'Start';

  function updateDueAt(value: string) {
    setDueAt(value);
    if (!value) {
      setEndAt(null);
      setRecurrence(null);
      setDueAtAlarmEnabled(false);
    }
  }

  function updateRecurrence(value: string) {
    if (value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly') {
      setRecurrence(value);
      return;
    }
    setRecurrence(null);
  }

  return (
    <>
      <div className="due-date-time-field">
        <label htmlFor={dueAtId}>{startLabel} <span className="optional">powiadomimy o tej porze</span></label>
        <div className="due-date-time-row">
          <TodoDateTimeInput
            ariaLabel={startLabel}
            id={dueAtId}
            name="dueAt"
            value={dueAt}
            onChange={(event) => updateDueAt(event.target.value)}
          />
          <TodoAlarmToggle
            label={endAt === null ? 'Alarm w terminie' : 'Alarm na start'}
            name="dueAtAlarmEnabled"
            checked={dueAtAlarmEnabled}
            disabled={!dueAt}
            onChange={() => setDueAtAlarmEnabled((current) => !current)}
          />
        </div>
        {dueAt && (endAt === null ? (
          <button type="button" className="task-add-end-button" onClick={() => setEndAt('')}>
            <Plus aria-hidden="true" />Dodaj koniec terminu
          </button>
        ) : (
          <>
            <label htmlFor={endAtId}>Koniec <span className="optional">opcjonalnie</span></label>
            <div className="due-date-time-row">
              <TodoDateTimeInput
                ariaLabel="Koniec"
                id={endAtId}
                name="endAt"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
              />
              <button type="button" className="icon-button" onClick={() => setEndAt(null)} aria-label="Usuń koniec">
                <X aria-hidden="true" />
              </button>
            </div>
          </>
        ))}
      </div>
      <section className="task-planning" aria-label="Planowanie">
        <div className="task-planning-heading">
          <CalendarClock aria-hidden="true" />
          <h3>Planowanie</h3>
        </div>
        <label>
          Powtarzanie <span className="optional">{dueAt ? 'opcjonalnie' : 'najpierw wybierz termin'}</span>
          <select
            name="recurrence"
            value={recurrence ?? ''}
            disabled={!dueAt}
            onChange={(event) => updateRecurrence(event.target.value)}
          >
            <option value="">Nie powtarza się</option>
            <option value="daily">Codziennie</option>
            <option value="weekly">Co tydzień</option>
            <option value="monthly">Co miesiąc</option>
            <option value="yearly">Co rok</option>
          </select>
        </label>
        <TodoReminderEditor reminders={reminders} alarmReminders={alarmReminders} />
      </section>
    </>
  );
}
