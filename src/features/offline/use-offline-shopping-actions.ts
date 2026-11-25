'use client';

import { useQueryClient } from '@tanstack/react-query';
import { authSession } from '../../lib/auth/auth-session';
import type { ShoppingListApi, ShoppingListItem } from '../shopping/shopping-list-api';
import type { OfflineMutation } from './OfflineMutation';
import { applyOfflineMutation } from './offline-query-updates';
import { useOfflineSync } from './OfflineSyncProvider';

/** Applies shopping changes locally and reuses the API's idempotent replay contract. */
export function useOfflineShoppingActions(householdId: string) {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineSync();
  const userId = authSession.cachedUser?.id;

  async function add(input: Parameters<ShoppingListApi['add']>[1]): Promise<ShoppingListItem> {
    const ownerId = requireUserId();
    const mutationId = input.mutationId || crypto.randomUUID();
    const now = new Date().toISOString();
    const localItem: ShoppingListItem = {
      checkedAt: null,
      completedAt: null,
      createdAt: now,
      deletedAt: null,
      id: `local:${mutationId}`,
      label: input.label.trim(),
      productId: input.productId ?? null,
      quantity: input.quantity,
      unit: input.unit,
      updatedAt: now,
      version: 1
    };
    const mutation: OfflineMutation = {
      createdAt: now,
      householdId,
      id: mutationId,
      input: { ...input, mutationId },
      kind: 'shopping-add',
      localItem,
      state: 'pending',
      userId: ownerId
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
    return localItem;
  }

  async function update(
    item: ShoppingListItem,
    input: Parameters<ShoppingListApi['update']>[2]
  ): Promise<ShoppingListItem> {
    const mutationId = input.mutationId || crypto.randomUUID();
    const mutation: OfflineMutation = {
      createdAt: new Date().toISOString(),
      householdId,
      id: mutationId,
      input: { ...input, mutationId },
      itemId: item.id,
      kind: 'shopping-update',
      state: 'pending',
      userId: requireUserId()
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
    return queryClient.getQueryData<ShoppingListItem[]>(['shopping-list', householdId])
      ?.find(({ id }) => id === item.id) ?? item;
  }

  async function remove(
    item: ShoppingListItem,
    input: Parameters<ShoppingListApi['remove']>[2]
  ): Promise<ShoppingListItem> {
    const mutationId = input.mutationId || crypto.randomUUID();
    const mutation: OfflineMutation = {
      createdAt: new Date().toISOString(),
      householdId,
      id: mutationId,
      input: { ...input, mutationId },
      itemId: item.id,
      kind: 'shopping-delete',
      state: 'pending',
      userId: requireUserId()
    };
    await enqueue(mutation);
    applyOfflineMutation(queryClient, mutation);
    return { ...item, deletedAt: new Date().toISOString(), version: item.version + 1 };
  }

  function requireUserId(): string {
    if (!userId) throw new Error('Zaloguj się ponownie, aby zapisać zmianę.');
    return userId;
  }

  return { add, remove, update };
}
