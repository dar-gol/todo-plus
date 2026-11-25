import type { QueryClient } from '@tanstack/react-query';
import { authApi } from '../auth/auth-api';
import { shoppingListApi } from '../shopping/shopping-list-api';
import { todoApi } from '../todos/todo-api';
import { ApiRequestError } from '../../lib/api/api-request-error';
import { authSession } from '../../lib/auth/auth-session';
import type { OfflineMutation } from './OfflineMutation';
import type { OfflineRepository } from './OfflineRepository';
import type { OfflineSyncResult } from './OfflineSyncResult';
import { replaceShoppingItem, replaceTodoTask } from './offline-query-updates';

/** Replays device-local changes in order and keeps ambiguous failures safe to retry. */
export class OfflineSyncService {
  constructor(private readonly repository: OfflineRepository) {}

  async sync(userId: string, queryClient: QueryClient): Promise<OfflineSyncResult> {
    while (true) {
      const mutations = await this.repository.listMutations(userId);
      const mutation = mutations[0];
      if (!mutation) break;
      if (mutation.state === 'failed') {
        return {
          error: mutation.error ?? 'Jedna ze zmian wymaga ponowienia.',
          pendingCount: mutations.length,
          transientFailure: false
        };
      }

      try {
        await this.execute(mutation, queryClient);
        if (mutation.sequence !== undefined) await this.repository.removeMutation(mutation.sequence);
      } catch (error) {
        let failure = error;
        try {
          if (await this.resolveShoppingConflict(mutation, error, queryClient)) {
            if (mutation.sequence !== undefined) await this.repository.removeMutation(mutation.sequence);
            continue;
          }
        } catch (rebaseError) {
          failure = rebaseError;
        }

        const message = this.errorMessage(failure);
        if (this.isTransient(failure)) {
          return {
            error: message,
            pendingCount: await this.repository.countMutations(userId),
            transientFailure: true
          };
        }
        await this.repository.markFailed(mutation, message);
        return {
          error: message,
          pendingCount: await this.repository.countMutations(userId),
          transientFailure: false
        };
      }
    }

    return {
      error: null,
      pendingCount: await this.repository.countMutations(userId),
      transientFailure: false
    };
  }

  private async execute(mutation: OfflineMutation, queryClient: QueryClient): Promise<void> {
    if (mutation.kind === 'todo-create') {
      const task = await todoApi.create(mutation.input);
      await this.repository.replaceTodoTaskId(mutation.userId, mutation.localTask.id, task.id);
      replaceTodoTask(queryClient, mutation.localTask.id, task);
      return;
    }
    if (mutation.kind === 'todo-update') {
      const task = await todoApi.update(mutation.taskId, mutation.input);
      replaceTodoTask(queryClient, mutation.taskId, task);
      return;
    }
    if (mutation.kind === 'todo-delete') {
      await todoApi.remove(mutation.taskId, mutation.mode, mutation.id);
      return;
    }
    if (mutation.kind === 'todo-reorder') {
      const tasks = await todoApi.reorder(mutation.input);
      queryClient.setQueryData(['todos', mutation.input.scope], tasks);
      return;
    }
    if (mutation.kind === 'shopping-add') {
      const item = await shoppingListApi.add(mutation.householdId, mutation.input);
      await this.repository.replaceShoppingItemId(mutation.userId, mutation.localItem.id, item.id);
      replaceShoppingItem(queryClient, mutation.householdId, mutation.localItem.id, item);
      return;
    }
    if (mutation.kind === 'shopping-update') {
      const item = await shoppingListApi.update(mutation.householdId, mutation.itemId, mutation.input);
      replaceShoppingItem(queryClient, mutation.householdId, mutation.itemId, item);
      return;
    }
    if (mutation.kind === 'shopping-delete') {
      await shoppingListApi.remove(mutation.householdId, mutation.itemId, mutation.input);
      return;
    }
    const profile = await authApi.updateCalendarColor(mutation.calendarColor);
    authSession.saveUser(profile);
  }

  private async resolveShoppingConflict(
    mutation: OfflineMutation,
    error: unknown,
    queryClient: QueryClient
  ): Promise<boolean> {
    if (!(error instanceof ApiRequestError) || error.status !== 409) return false;
    if (mutation.kind !== 'shopping-update' && mutation.kind !== 'shopping-delete') return false;

    const items = await shoppingListApi.list(mutation.householdId);
    const current = items.find(({ id }) => id === mutation.itemId);
    if (!current && mutation.kind === 'shopping-delete') return true;
    if (!current) return false;

    const rebased = {
      ...mutation,
      input: { ...mutation.input, version: current.version }
    };
    await this.repository.saveMutation(rebased);
    if (rebased.kind === 'shopping-update') {
      const item = await shoppingListApi.update(rebased.householdId, rebased.itemId, rebased.input);
      replaceShoppingItem(queryClient, rebased.householdId, rebased.itemId, item);
    } else {
      await shoppingListApi.remove(rebased.householdId, rebased.itemId, rebased.input);
    }
    return true;
  }

  private isTransient(error: unknown): boolean {
    return error instanceof TypeError
      || error instanceof ApiRequestError && (
        error.status === 408 || error.status === 429 || error.status >= 500
      );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof ApiRequestError && error.status === 401) {
      return 'Zaloguj się ponownie, aby wysłać zapisane zmiany.';
    }
    if (this.isTransient(error)) {
      return 'Zmiany są bezpieczne w telefonie i czekają na połączenie.';
    }
    return error instanceof Error
      ? error.message
      : 'Nie udało się zsynchronizować zapisanych zmian.';
  }
}
