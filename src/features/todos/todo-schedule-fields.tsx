'use client';

import { CalendarClock } from 'lucide-react';
import { useId, useState } from 'react';
import type { TodoTask } from './todo-api';
import { TodoAlarmToggle } from './todo-alarm-toggle';
import { dueDateTimeInputValue } from './todo-date';
import { TodoDateTimeInput } from './todo-date-time-input';
import { TodoReminderEditor } from './todo-reminder-editor';

/** Keeps the task deadline, recurrence and additional reminders in one scheduling boundary. */
export function TodoScheduleFields({
  initialDueAt,
  initialDueAtAlarmEnabled = false,
  initialRecurrence,
  reminders = [],
  alarmReminders = []
}: {
  initialDueAt?: string | null;
  initialDueAtAlarmEnabled?: boolean;
  initialRecurrence?: TodoTask['recurrence'];
  reminders?: string[];
  alarmReminders?: string[];
}) {
  const dueAtId = useId();
  const [dueAt, setDueAt] = useState(() => dueDateTimeInputValue(initialDueAt));
  const [dueAtAlarmEnabled, setDueAtAlarmEnabled] = useState(initialDueAtAlarmEnabled);
  const [recurrence, setRecurrence] = useState<TodoTask['recurrence']>(initialRecurrence ?? null);

  function updateDueAt(value: string) {
    setDueAt(value);
    if (!value) {
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
        <label htmlFor={dueAtId}>Termin <span className="optional">powiadomimy o tej porze</span></label>
        <div className="due-date-time-row">
          <TodoDateTimeInput
            ariaLabel="Termin"
            id={dueAtId}
            name="dueAt"
            value={dueAt}
            onChange={(event) => updateDueAt(event.target.value)}
          />
          <TodoAlarmToggle
            label="Alarm w terminie"
            name="dueAtAlarmEnabled"
            checked={dueAtAlarmEnabled}
            disabled={!dueAt}
            onChange={() => setDueAtAlarmEnabled((current) => !current)}
          />
        </div>
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
