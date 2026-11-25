'use client';

import { Check, ChevronDown } from 'lucide-react';
import type { TodoTask } from './todo-api';
import { todoCreatorColorOptions } from './todo-creator-color-options';
import { TodoNoteEditor } from './todo-note-editor';

/** Keeps task-specific appearance and long-form fields in a compact disclosure. */
export function TodoMoreFields({
  calendarColor,
  creatorColor = 'blue',
  description = '',
  noteDocument = null,
  legacyNotes = null,
  editorKey
}: {
  calendarColor?: TodoTask['calendarColor'];
  creatorColor?: TodoTask['createdByColor'];
  description?: string | null;
  noteDocument?: unknown | null;
  legacyNotes?: string | null;
  editorKey?: number;
}) {
  const selectedColor = calendarColor ?? creatorColor;

  return (
    <details className="task-more-fields">
      <summary>
        <span><strong>Więcej</strong><small>Kolor, opis i notatka</small></span>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="task-more-content">
        <fieldset className="task-color-picker">
          <legend>Kolor paska w kalendarzu</legend>
          <div className="calendar-color-palette">
            {todoCreatorColorOptions.map(({ value, label, css }) => (
              <label className="task-color-choice" key={value} title={label}>
                <input
                  type="radio"
                  name="calendarColor"
                  value={value === creatorColor ? '' : value}
                  defaultChecked={selectedColor === value}
                  aria-label={label}
                />
                <span className="calendar-color-swatch" style={{ backgroundColor: css }} aria-hidden="true">
                  <Check />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Opis <span className="optional">widoczny na liście</span>
          <textarea name="description" maxLength={500} rows={3} defaultValue={description ?? ''} placeholder="Krótko opowiedz, o co chodzi" />
        </label>
        <label>
          Notatka <span className="optional">tylko w podglądzie</span>
          <TodoNoteEditor key={editorKey} document={noteDocument} legacyText={legacyNotes} />
        </label>
      </div>
    </details>
  );
}
