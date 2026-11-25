'use client';

import { CalendarDays, Check, ListTodo, Palette, Settings, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { AuthUserProfile } from '@/features/auth/auth-user-profile';
import { todoCreatorColorOptions } from './todo-creator-color-options';
import type { TodoDefaultView } from './todo-default-view';
import { TodoShortcutSettings } from './todo-shortcut-settings';

export function TodoSettingsDialog({ open, defaultView, currentUser, colorPending, colorError, onChange, onCreatorColorChange, onClose }: {
  open: boolean;
  defaultView: TodoDefaultView;
  currentUser: AuthUserProfile;
  colorPending: boolean;
  colorError: Error | null;
  onChange: (view: TodoDefaultView) => void;
  onCreatorColorChange: (color: AuthUserProfile['calendarColor']) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  return (
    <dialog ref={dialog} className="task-dialog settings-dialog" onCancel={onClose} onClose={onClose}>
      <div className="settings-dialog-content">
        <div className="dialog-heading">
          <div><p className="eyebrow"><Settings aria-hidden="true" />USTAWIENIA</p><h2>Todo Plus</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Zamknij ustawienia"><X aria-hidden="true" /></button>
        </div>
        <p className="settings-description">Wybierz, co ma się otwierać po wejściu do Todo Plus.</p>
        <h3 className="settings-section-title">Widok startowy</h3>
        <div className="default-view-options" role="radiogroup" aria-label="Domyślny widok">
          <button type="button" role="radio" aria-checked={defaultView === 'list'} className={defaultView === 'list' ? 'selected' : ''} onClick={() => onChange('list')}>
            <ListTodo aria-hidden="true" /><span><strong>Lista zadań</strong><small>Moja lista lub zadania rodziny</small></span>
          </button>
          <button type="button" role="radio" aria-checked={defaultView === 'calendar'} className={defaultView === 'calendar' ? 'selected' : ''} onClick={() => onChange('calendar')}>
            <CalendarDays aria-hidden="true" /><span><strong>Kalendarz</strong><small>Dzisiejszy dzień i jego zadania</small></span>
          </button>
        </div>
        <section className="creator-color-settings" aria-labelledby="creator-colors-title">
          <div className="creator-color-heading"><Palette aria-hidden="true" /><div><h3 id="creator-colors-title">Twój kolor</h3><p>Ten kolor oznacza Twoje zadania na wszystkich urządzeniach.</p></div></div>
          <div className="creator-color-row">
            <strong>{currentUser.name?.trim() || currentUser.email}</strong>
            <div className="calendar-color-palette" role="radiogroup" aria-label="Twój kolor zadań">
              {todoCreatorColorOptions.map((option) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={currentUser.calendarColor === option.value}
                  aria-label={option.label}
                  title={option.label}
                  className={`calendar-color-swatch${currentUser.calendarColor === option.value ? ' selected' : ''}`}
                  style={{ backgroundColor: option.css }}
                  onClick={() => onCreatorColorChange(option.value)}
                  disabled={colorPending}
                  key={option.value}
                >
                  <Check aria-hidden="true" />
                </button>
              ))}
            </div>
            {colorError && <p className="error-message" role="alert">Nie udało się zapisać koloru. Spróbuj ponownie.</p>}
          </div>
          </section>
        <TodoShortcutSettings />
      </div>
    </dialog>
  );
}
