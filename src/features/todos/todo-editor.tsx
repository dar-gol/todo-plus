'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { TodoScope } from './todo-api';
import { dateAtNine, dateTimeAtIso } from './todo-date';
import { parseTodoNoteDocumentField } from './todo-note-document';
import { TodoNoteEditor } from './todo-note-editor';
import { TodoReminderEditor } from './todo-reminder-editor';

export function TodoEditor({ open, scope, pending, onClose, onCreate }: {
  open: boolean;
  scope: TodoScope;
  pending: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; reminders: string[] }) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteEditorKey, setNoteEditorKey] = useState(0);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    try {
      const date = String(data.get('date') ?? '');
      const dueAt = date ? dateAtNine(date) : null;
      const reminders = data.getAll('reminders').map((value) => dateTimeAtIso(String(value)));
      await onCreate({
        title: String(data.get('title')),
        description: String(data.get('description') ?? '').trim() || null,
        notes: String(data.get('notes') ?? '').trim() || null,
        noteDocument: parseTodoNoteDocumentField(data.get('noteDocument')),
        dueAt,
        reminders: reminders.length > 0 ? reminders : dueAt ? [dueAt] : []
      });
      form.reset();
      setNoteEditorKey((current) => current + 1);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się dodać zadania.');
    }
  }

  return (
    <dialog ref={dialog} className="task-dialog" onCancel={onClose} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <div><p className="eyebrow">{scope === 'family' ? 'RODZINA' : 'MOJA LISTA'}</p><h2>Nowe zadanie</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Zamknij"><X aria-hidden="true" /></button>
        </div>
        <label>Co jest do zrobienia?<input name="title" required autoFocus maxLength={200} placeholder="Np. umówić wizytę" /></label>
        <label>Opis <span className="optional">widoczny na liście</span><textarea name="description" maxLength={500} rows={2} placeholder="Krótko opowiedz, o co chodzi" /></label>
        <label>Termin <span className="optional">opcjonalnie</span><input name="date" type="date" /></label>
        <TodoReminderEditor key={noteEditorKey} />
        <label>Notatka <span className="optional">tylko w podglądzie</span><TodoNoteEditor key={noteEditorKey} /></label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button" disabled={pending}>{pending ? 'Dodaję…' : 'Dodaj zadanie'}</button>
      </form>
    </dialog>
  );
}
