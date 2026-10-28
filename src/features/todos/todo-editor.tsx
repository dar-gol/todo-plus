'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { TodoScope } from './todo-api';

export function TodoEditor({ open, scope, pending, onClose, onCreate }: {
  open: boolean;
  scope: TodoScope;
  pending: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; notes: string | null; dueAt: string | null }) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

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
      await onCreate({
        title: String(data.get('title')),
        notes: String(data.get('notes') ?? '').trim() || null,
        dueAt: date ? dateAtNine(date) : null
      });
      form.reset();
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
        <label>Termin <span className="optional">opcjonalnie</span><input name="date" type="date" /></label>
        <label>Notatka <span className="optional">opcjonalnie</span><textarea name="notes" maxLength={2000} rows={3} placeholder="Dodaj potrzebne szczegóły" /></label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button" disabled={pending}>{pending ? 'Dodaję…' : 'Dodaj zadanie'}</button>
      </form>
    </dialog>
  );
}

export function dateAtNine(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 9, 0, 0).toISOString();
}
