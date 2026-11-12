import type { TodoDefaultView } from './todo-default-view';

const storageKey = 'todo-plus.default-view';

/** Owns the local preference for the first Todo Plus view shown after sign-in. */
export class TodoViewPreferences {
  load(): TodoDefaultView {
    if (typeof window === 'undefined') return 'list';
    try {
      return window.localStorage.getItem(storageKey) === 'calendar' ? 'calendar' : 'list';
    } catch {
      return 'list';
    }
  }

  save(view: TodoDefaultView): void {
    try {
      window.localStorage.setItem(storageKey, view);
    } catch {
      // A blocked storage preference should not prevent using either view.
    }
  }
}

export const todoViewPreferences = new TodoViewPreferences();
