import type { TodoScope } from './todo-api';
import type { TodoTaskFilter } from './todo-task-filter';
import { isTodoTaskFilter } from './todo-task-filter';

/** Persists the selected task filter separately for each Todo Plus list. */
export class TodoTaskFilterPreferences {
  load(scope: TodoScope): TodoTaskFilter {
    if (typeof window === 'undefined') return 'all';
    try {
      const stored = window.localStorage.getItem(this.storageKey(scope));
      return isTodoTaskFilter(stored) ? stored : 'all';
    } catch {
      return 'all';
    }
  }

  save(scope: TodoScope, filter: TodoTaskFilter): void {
    try {
      window.localStorage.setItem(this.storageKey(scope), filter);
    } catch {
      // The in-memory selection remains usable when browser storage is unavailable.
    }
  }

  private storageKey(scope: TodoScope): string {
    return `todo-plus:task-filter:${scope}:v1`;
  }
}

export const todoTaskFilterPreferences = new TodoTaskFilterPreferences();
