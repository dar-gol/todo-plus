'use client';

import { BellRing, CalendarDays, Clock3, Eye, Pencil, Repeat2, StickyNote, UserRound, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { dateTimeAtIso, formatTodoDate } from './todo-date';
import { TodoMoreFields } from './todo-more-fields';
import { parseTodoNoteDocumentField } from './todo-note-document';
import { TodoNotePreview } from './todo-note-preview';
import { TodoScheduleFields } from './todo-schedule-fields';
import type { TodoTask } from './todo-api';
import { todoRecurrenceLabel } from './todo-recurrence-label';

export function TodoTaskDetails({ task, pending, onClose, onUpdate }: {
  task: TodoTask;
  pending: boolean;
  onClose: () => void;
  onUpdate: (input: { title: string; description: string | null; notes: string | null; noteDocument: Record<string, unknown> | null; dueAt: string | null; recurrence: TodoTask['recurrence']; reminders: string[] }) => Promise<TodoTask>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [currentTask, setCurrentTask] = useState(task);
  const [error, setError] = useState<string | null>(null);
  const [checklistPending, setChecklistPending] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const reminders = currentTask.reminders ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const dueAtValue = String(data.get('dueAt') ?? '');
    const recurrence = String(data.get('recurrence') ?? '') as '' | NonNullable<TodoTask['recurrence']>;
    if (recurrence && !dueAtValue) {
      setError('Wybierz termin, aby zadanie mogło się powtarzać.');
      return;
    }
    setError(null);
    try {
      const updated = await onUpdate({
        title: String(data.get('title')).trim(),
        description: String(data.get('description') ?? '').trim() || null,
        notes: String(data.get('notes') ?? '').trim() || null,
        noteDocument: parseTodoNoteDocumentField(data.get('noteDocument')),
        dueAt: dueAtValue ? dateTimeAtIso(dueAtValue) : null,
        recurrence: recurrence || null,
        reminders: data.getAll('reminders').map((value) => dateTimeAtIso(String(value)))
      });
      setCurrentTask(updated);
      setMode('preview');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się zapisać zmian.');
    }
  }

  async function toggleChecklistItem(noteDocument: Record<string, unknown>) {
    const previousTask = currentTask;
    setError(null);
    setChecklistPending(true);
    setCurrentTask({ ...currentTask, noteDocument });
    try {
      const updated = await onUpdate({
        title: currentTask.title,
        description: currentTask.description ?? null,
        notes: currentTask.notes ?? null,
        noteDocument,
        dueAt: currentTask.dueAt ?? null,
        recurrence: currentTask.recurrence ?? null,
        reminders
      });
      setCurrentTask(updated);
    } catch (caught) {
      setCurrentTask(previousTask);
      setError(caught instanceof Error ? caught.message : 'Nie udało się zmienić elementu listy.');
    } finally {
      setChecklistPending(false);
    }
  }

  return (
    <dialog ref={dialog} className="task-dialog task-details-dialog" onCancel={onClose} onClose={onClose}>
      <div className="dialog-heading details-heading">
        <div><p className="eyebrow">{currentTask.scope === 'family' ? 'RODZINNE ZADANIE' : 'TWOJE ZADANIE'}</p><h2>{currentTask.title}</h2></div>
        <div className="details-actions">
          <button
            type="button"
            className="icon-button details-mode-button"
            onClick={() => setMode((current) => current === 'preview' ? 'edit' : 'preview')}
            aria-label={mode === 'preview' ? 'Edytuj zadanie' : 'Wróć do podglądu'}
            title={mode === 'preview' ? 'Edytuj zadanie' : 'Wróć do podglądu'}
          >
            {mode === 'preview' ? <Pencil aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Zamknij podgląd"><X aria-hidden="true" /></button>
        </div>
      </div>

      {mode === 'preview' ? (
        <div className="task-preview">
          {currentTask.description ? <p className="task-description">{currentTask.description}</p> : <p className="task-description muted-copy">Bez dodatkowego opisu.</p>}
          {(currentTask.dueAt || reminders.length > 0) && <dl className="task-facts">
            {currentTask.dueAt && <div><dt><CalendarDays aria-hidden="true" />Termin</dt><dd>{formatTodoDate(currentTask.dueAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd></div>}
            {currentTask.recurrence && <div><dt><Repeat2 aria-hidden="true" />Powtarzanie</dt><dd>{todoRecurrenceLabel(currentTask.recurrence)}</dd></div>}
            {reminders.length > 0 && <div><dt><BellRing aria-hidden="true" />Przypomnienia</dt><dd><ul className="reminder-summary">{reminders.map((reminder) => <li key={reminder}>{formatTodoDate(reminder, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>)}</ul></dd></div>}
          </dl>}
          {(currentTask.noteDocument || currentTask.notes) && <section className="task-notes"><h3><StickyNote aria-hidden="true" />Notatka</h3><TodoNotePreview document={currentTask.noteDocument} legacyText={currentTask.notes} pending={pending || checklistPending} onTaskItemToggle={(document) => void toggleChecklistItem(document)} /></section>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="task-audit">
            {currentTask.createdByName && <span><UserRound aria-hidden="true" />Dodał(a) {currentTask.createdByName}</span>}
            <time dateTime={currentTask.createdAt}><Clock3 aria-hidden="true" />Utworzono {formatTodoDate(currentTask.createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        </div>
      ) : (
        <form className="task-edit-form" onSubmit={submit}>
          <label>Co jest do zrobienia?<input name="title" required maxLength={200} defaultValue={currentTask.title} /></label>
          <TodoScheduleFields initialDueAt={currentTask.dueAt} initialRecurrence={currentTask.recurrence} reminders={reminders} />
          <TodoMoreFields description={currentTask.description} noteDocument={currentTask.noteDocument} legacyNotes={currentTask.notes} />
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending}>{pending ? 'Zapisuję…' : 'Zapisz zmiany'}</button>
        </form>
      )}
    </dialog>
  );
}
