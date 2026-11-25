import type { AuthUserProfile } from '../auth/auth-user-profile';
import type { ShoppingListApi, ShoppingListItem } from '../shopping/shopping-list-api';
import type { TodoApi, TodoDeleteMode, TodoTask } from '../todos/todo-api';

export type OfflineMutation = {
  createdAt: string;
  error?: string;
  id: string;
  sequence?: number;
  state: 'failed' | 'pending';
  userId: string;
} & (
  | {
      input: Parameters<TodoApi['create']>[0];
      kind: 'todo-create';
      localTask: TodoTask;
    }
  | {
      input: Parameters<TodoApi['update']>[1];
      kind: 'todo-update';
      scope: TodoTask['scope'];
      taskId: string;
    }
  | {
      kind: 'todo-delete';
      mode: TodoDeleteMode;
      scope: TodoTask['scope'];
      taskId: string;
    }
  | {
      input: Parameters<TodoApi['reorder']>[0];
      kind: 'todo-reorder';
    }
  | {
      householdId: string;
      input: Parameters<ShoppingListApi['add']>[1];
      kind: 'shopping-add';
      localItem: ShoppingListItem;
    }
  | {
      householdId: string;
      input: Parameters<ShoppingListApi['update']>[2];
      itemId: string;
      kind: 'shopping-update';
    }
  | {
      householdId: string;
      input: Parameters<ShoppingListApi['remove']>[2];
      itemId: string;
      kind: 'shopping-delete';
    }
  | {
      calendarColor: AuthUserProfile['calendarColor'];
      kind: 'profile-color';
    }
);
