import type { CSSProperties, HTMLAttributes, KeyboardEventHandler, MouseEventHandler, TouchEventHandler } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import type { TodoTask } from './todo-api';

export function TodoTaskItem({ task, pending, sortableAttributes, onDragKeyDown, onDragMouseDown, onDragTouchStart, dragging = false, itemRef, style, onToggle, onRemove, onOpen }: {
  task: TodoTask;
  pending: boolean;
  sortableAttributes?: HTMLAttributes<HTMLLIElement>;
  onDragKeyDown?: KeyboardEventHandler<HTMLLIElement>;
  onDragMouseDown?: MouseEventHandler<HTMLLIElement>;
  onDragTouchStart?: TouchEventHandler<HTMLLIElement>;
  dragging?: boolean;
  itemRef?: (node: HTMLLIElement | null) => void;
  style?: CSSProperties;
  onToggle: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const completed = Boolean(task.completedAt);
  return (
    <li
      {...sortableAttributes}
      ref={itemRef}
      style={style}
      className={`task-item ${sortableAttributes ? 'task-sortable' : ''} ${dragging ? 'task-dragging' : ''} ${completed ? 'task-completed' : ''}`}
      role={sortableAttributes ? 'group' : undefined}
      tabIndex={sortableAttributes ? 0 : undefined}
      aria-label={sortableAttributes ? `Zadanie ${task.title}. Przytrzymaj, aby zmienić priorytet.` : undefined}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget) onDragKeyDown?.(event);
      }}
      onMouseDown={onDragMouseDown}
      onTouchStart={onDragTouchStart}
    >
      <button className="task-check" onClick={onToggle} disabled={pending} aria-label={completed ? `Przywróć zadanie ${task.title}` : `Ukończ zadanie ${task.title}`}>
        <span aria-hidden="true">{completed ? '✓' : ''}</span>
      </button>
      <button className="task-copy task-open-button" onClick={onOpen} aria-label={`Pokaż zadanie ${task.title}`}>
        <strong>{task.title}</strong>
        {task.description && <p>{task.description}</p>}
        <div className="task-meta">
          {task.dueAt && <span><CalendarDays aria-hidden="true" />{new Intl.DateTimeFormat('pl', { day: 'numeric', month: 'short' }).format(new Date(task.dueAt))}</span>}
          {task.scope === 'family' && task.createdByName && <span>od {task.createdByName}</span>}
        </div>
      </button>
      <button className="icon-button" onClick={onRemove} disabled={pending} aria-label={`Usuń zadanie ${task.title}`}><Trash2 aria-hidden="true" /></button>
    </li>
  );
}
