'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { TodoScope } from './todo-api';
import { dateTimeAtIso } from './todo-date';
import { TodoMoreFields } from './todo-more-fields';
import { parseTodoNoteDocumentField } from './todo-note-document';
import { TodoScheduleFields } from './todo-schedule-fields';

export function TodoEditor({ open, scope, allowScopeSelection = false, initialDate = '', pending, onClose, onCreate }: {
  open: boolean;
  scope: TodoScope;
  allowScopeSelection?: boolean;
  initialDate?: string;
  pending: boolean;
  onClose: () => void;
  onCreate: (input: { scope: TodoScope; title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; dueAtAlarmEnabled: boolean; recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly' | null; reminders: string[]; alarmReminders: string[] }) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteEditorKey, setNoteEditorKey] = useState(0);
  const [selectedScope, setSelectedScope] = useState(scope);

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
      const dueAtValue = String(data.get('dueAt') ?? '');
      const recurrence = String(data.get('recurrence') ?? '') as '' | 'daily' | 'weekly' | 'monthly' | 'yearly';
      if (recurrence && !dueAtValue) {
        setError('Wybierz termin, aby zadanie mogło się powtarzać.');
        return;
      }
      const dueAt = dueAtValue ? dateTimeAtIso(dueAtValue) : null;
      const reminders = data.getAll('reminders').map((value) => dateTimeAtIso(String(value)));
      const alarmReminders = data.getAll('alarmReminders').map((value) => dateTimeAtIso(String(value)));
      await onCreate({
        scope: selectedScope,
        title: String(data.get('title')),
        description: String(data.get('description') ?? '').trim() || null,
        notes: String(data.get('notes') ?? '').trim() || null,
        noteDocument: parseTodoNoteDocumentField(data.get('noteDocument')),
        dueAt,
        dueAtAlarmEnabled: data.get('dueAtAlarmEnabled') === 'on',
        recurrence: recurrence || null,
        reminders,
        alarmReminders
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
          <div><p className="eyebrow">{selectedScope === 'family' ? 'RODZINA' : 'MOJA LISTA'}</p><h2>Nowe zadanie</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Zamknij"><X aria-hidden="true" /></button>
        </div>
        {allowScopeSelection && (
          <fieldset className="task-scope-picker">
            <legend>Dodaj do</legend>
            <label><input type="radio" name="scope" value="family" checked={selectedScope === 'family'} onChange={() => setSelectedScope('family')} /><span>Rodzina</span></label>
            <label><input type="radio" name="scope" value="personal" checked={selectedScope === 'personal'} onChange={() => setSelectedScope('personal')} /><span>Moja lista</span></label>
          </fieldset>
        )}
        <label>Co jest do zrobienia?<input name="title" required autoFocus maxLength={200} placeholder="Np. umówić wizytę" /></label>
        <TodoScheduleFields key={`schedule-${noteEditorKey}-${initialDate}`} initialDueAt={initialDate} />
        <TodoMoreFields editorKey={noteEditorKey} />
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button" disabled={pending}>{pending ? 'Dodaję…' : 'Dodaj zadanie'}</button>
      </form>
    </dialog>
  );
}
