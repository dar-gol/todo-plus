import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TodoTask } from './todo-api';

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');
}

/** Searches both lists, including archived tasks, and opens the existing task preview. */
export function TodoTaskSearchDialog({ tasks, loading, hasError, onRetry, onClose, onOpen }: {
  tasks: TodoTask[];
  loading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onClose: () => void;
  onOpen: (task: TodoTask) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const terms = normalizeSearchText(query).trim().split(/\s+/).filter(Boolean);
  const results = terms.length === 0 ? [] : tasks.filter((task) => {
    const text = normalizeSearchText([task.title, task.description].join(' '));
    return terms.every((term) => text.includes(term));
  });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    searchInput.current?.focus();
  }, []);

  return (
    <dialog ref={dialog} className="task-search-dialog" aria-labelledby="task-search-title" onClose={onClose}>
      <div className="task-search-content">
        <div className="dialog-heading">
          <h2 id="task-search-title">Szukaj zadań</h2>
          <button type="button" className="icon-button" aria-label="Zamknij wyszukiwanie" onClick={() => dialog.current?.close()}>
            <X aria-hidden="true" />
          </button>
        </div>
        <label className="task-search-field">
          <Search aria-hidden="true" />
          <input ref={searchInput} type="search" aria-label="Wpisz nazwę lub opis zadania" placeholder="Wpisz nazwę lub opis zadania" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="task-search-results">
          {hasError && <p className="task-search-error" role="alert">Nie udało się wczytać wszystkich zadań. <button type="button" className="text-button" onClick={onRetry}>Spróbuj ponownie</button></p>}
          <p className="task-search-status" role="status">
            {loading ? 'Wczytuję zadania…' : terms.length > 0 && results.length === 0 ? 'Brak pasujących zadań.' : ''}
          </p>
          {results.length > 0 && <ul className="task-search-list">
            {results.map((task) => <li key={task.id}>
              <button type="button" onClick={() => { dialog.current?.close(); onOpen(task); }}>
                <strong>{task.title}</strong>
                <span>{task.scope === 'personal' ? 'Moja lista' : 'Rodzina'}{task.completedAt && ' · Archiwum'}</span>
              </button>
            </li>)}
          </ul>}
        </div>
      </div>
    </dialog>
  );
}
