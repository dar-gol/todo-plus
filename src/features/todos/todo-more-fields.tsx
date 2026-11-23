'use client';

import { ChevronDown } from 'lucide-react';
import { TodoNoteEditor } from './todo-note-editor';

/** Hides optional long-form fields without reducing their editing width. */
export function TodoMoreFields({
  description = '',
  noteDocument = null,
  legacyNotes = null,
  editorKey
}: {
  description?: string | null;
  noteDocument?: unknown | null;
  legacyNotes?: string | null;
  editorKey?: number;
}) {
  return (
    <details className="task-more-fields">
      <summary>
        <span><strong>Więcej</strong><small>Opis i notatka</small></span>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="task-more-content">
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
