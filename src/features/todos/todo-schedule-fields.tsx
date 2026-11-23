'use client';

import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import type { TodoTask } from './todo-api';
import { dueDateTimeInputValue } from './todo-date';
import { TodoReminderEditor } from './todo-reminder-editor';

/** Keeps the task deadline, recurrence and additional reminders in one scheduling boundary. */
export function TodoScheduleFields({
  initialDueAt,
  initialRecurrence,
  reminders = []
}: {
  initialDueAt?: string | null;
  initialRecurrence?: TodoTask['recurrence'];
  reminders?: string[];
}) {
  const [dueAt, setDueAt] = useState(() => dueDateTimeInputValue(initialDueAt));
  const [recurrence, setRecurrence] = useState<TodoTask['recurrence']>(initialRecurrence ?? null);

  function updateDueAt(value: string) {
    setDueAt(value);
    if (!value) setRecurrence(null);
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
      <label className="due-date-time-field">
        Termin <span className="optional">powiadomimy o tej porze</span>
        <input
          aria-label="Termin"
          name="dueAt"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => updateDueAt(event.target.value)}
        />
      </label>
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
        <TodoReminderEditor reminders={reminders} />
      </section>
    </>
  );
}
