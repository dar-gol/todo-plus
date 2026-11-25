'use client';

import { BellPlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { dateTimeInputValue } from './todo-date';
import { TodoDateTimeInput } from './todo-date-time-input';

const maxReminders = 10;

export function TodoReminderEditor({ reminders = [] }: { reminders?: string[] }) {
  const [values, setValues] = useState(() => reminders.map(dateTimeInputValue));

  function addReminder() {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setValues((current) => [...current, dateTimeInputValue(nextHour.toISOString())]);
  }

  function updateReminder(index: number, value: string) {
    setValues((current) => current.map((item, itemIndex) => (
      itemIndex === index ? value : item
    )));
  }

  function removeReminder(index: number) {
    setValues((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <fieldset className="reminder-editor">
      <legend><BellPlus aria-hidden="true" />Dodatkowe przypomnienia <span className="optional">data i godzina</span></legend>
      {values.length === 0 ? <p>Dodaj przypomnienie, jeśli chcesz dostać powiadomienie przed terminem.</p> : <div className="reminder-rows">
        {values.map((reminder, index) => (
          <div className="reminder-row" key={index}>
            <TodoDateTimeInput
              ariaLabel={`Przypomnienie ${index + 1}`}
              name="reminders"
              value={reminder}
              required
              onChange={(event) => updateReminder(index, event.target.value)}
            />
            <div className="reminder-actions">
              <button type="button" className="icon-button" onClick={() => removeReminder(index)} aria-label={`Usuń przypomnienie ${index + 1}`}><Trash2 aria-hidden="true" /></button>
            </div>
          </div>
        ))}
      </div>}
      <button type="button" className="reminder-add-button" onClick={addReminder} disabled={values.length >= maxReminders}><Plus aria-hidden="true" />Dodaj przypomnienie</button>
    </fieldset>
  );
}
