'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { TodoScope, TodoTask, todoApi } from './todo-api';
import { todoCalendarColorFromField } from './todo-creator-color-options';
import { TodoMoreFields } from './todo-more-fields';
import { parseTodoNoteDocumentField } from './todo-note-document';
import { TodoScheduleFields } from './todo-schedule-fields';
import { readTodoScheduleForm } from './todo-schedule-form';
import { TodoTaskFormFooter } from './todo-task-form-footer';

export function TodoEditor({ open, scope, creatorColor, allowScopeSelection = false, initialDate = '', pending, onClose, onCreate }: {
  open: boolean;
  scope: TodoScope;
  creatorColor?: TodoTask['createdByColor'];
  allowScopeSelection?: boolean;
  initialDate?: string;
  pending: boolean;
  onClose: () => void;
  onCreate: (input: Parameters<typeof todoApi.create>[0]) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const formId = useId();
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
      await onCreate({
        scope: selectedScope,
        title: String(data.get('title')),
        description: String(data.get('description') ?? '').trim() || null,
        notes: String(data.get('notes') ?? '').trim() || null,
        noteDocument: parseTodoNoteDocumentField(data.get('noteDocument')),
        calendarColor: todoCalendarColorFromField(data.get('calendarColor')),
        ...readTodoScheduleForm(data)
      });
      form.reset();
      setNoteEditorKey((current) => current + 1);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się dodać zadania.');
    }
  }

  return (
    <dialog ref={dialog} className="task-dialog task-form-dialog" onCancel={onClose} onClose={onClose}>
      <div className="task-form-scroll">
        <form id={formId} onSubmit={submit}>
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
          <TodoMoreFields creatorColor={creatorColor} editorKey={noteEditorKey} />
        </form>
      </div>
      <TodoTaskFormFooter formId={formId} pending={pending} error={error} label={pending ? 'Dodaję…' : 'Dodaj zadanie'} />
    </dialog>
  );
}
