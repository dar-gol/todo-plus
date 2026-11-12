'use client';

import { CalendarX2, Repeat2, Trash2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { TodoDeleteMode, TodoTask } from './todo-api';

/** Lets the user choose whether a recurring deletion affects one occurrence or its whole series. */
export function TodoRecurrenceDeleteDialog({ task, pending, error, onDelete, onClose }: {
  task: TodoTask;
  pending: boolean;
  error: Error | null;
  onDelete: (mode: TodoDeleteMode) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="task-dialog recurrence-delete-dialog" onCancel={onClose} onClose={onClose}>
      <div className="recurrence-delete-content">
        <div className="dialog-heading">
          <div><p className="eyebrow"><Repeat2 aria-hidden="true" />ZADANIE CYKLICZNE</p><h2>Co chcesz usunąć?</h2></div>
          <button type="button" className="icon-button" onClick={onClose} disabled={pending} aria-label="Zamknij"><X aria-hidden="true" /></button>
        </div>
        <p className="recurrence-delete-description">„{task.title}” powtarza się. Wybierz zakres usunięcia.</p>
        <div className="recurrence-delete-options">
          <button type="button" onClick={() => onDelete('occurrence')} disabled={pending}>
            <CalendarX2 aria-hidden="true" />
            <span><strong>Tylko ten termin</strong><small>Seria przejdzie do następnego terminu.</small></span>
          </button>
          <button type="button" className="danger" onClick={() => onDelete('series')} disabled={pending}>
            <Trash2 aria-hidden="true" />
            <span><strong>Całą serię</strong><small>Znikną także wszystkie kolejne terminy.</small></span>
          </button>
        </div>
        {error && <p className="error-message" role="alert">Nie udało się usunąć zadania. Spróbuj ponownie.</p>}
        <button type="button" className="secondary-button recurrence-delete-cancel" onClick={onClose} disabled={pending}>Anuluj</button>
      </div>
    </dialog>
  );
}
