import Dexie from 'dexie';
import type { OfflineDatabase } from './OfflineDatabase';
import type { OfflineMutation } from './OfflineMutation';
import type { OfflineQuerySnapshot } from './OfflineQuerySnapshot';

/** Owns durable local snapshots and the ordered offline mutation queue. */
export class OfflineRepository {
  constructor(private readonly database: OfflineDatabase) {}

  async saveSnapshot(
    userId: string,
    queryKey: readonly unknown[],
    data: unknown,
    updatedAt: number
  ): Promise<void> {
    await this.database.snapshots.put({
      data,
      key: this.snapshotKey(userId, queryKey),
      queryKey,
      updatedAt,
      userId
    });
  }

  listSnapshots(userId: string): Promise<OfflineQuerySnapshot[]> {
    return this.database.snapshots.where('userId').equals(userId).toArray();
  }

  async enqueue(mutation: OfflineMutation): Promise<void> {
    await this.database.mutations.add(mutation);
  }

  listMutations(userId: string): Promise<OfflineMutation[]> {
    return this.database.mutations
      .where('[userId+sequence]')
      .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
      .toArray();
  }

  countMutations(userId: string): Promise<number> {
    return this.database.mutations.where('userId').equals(userId).count();
  }

  async removeMutation(sequence: number): Promise<void> {
    await this.database.mutations.delete(sequence);
  }

  async saveMutation(mutation: OfflineMutation): Promise<void> {
    await this.database.mutations.put(mutation);
  }

  async markFailed(mutation: OfflineMutation, error: string): Promise<void> {
    await this.saveMutation({ ...mutation, error, state: 'failed' });
  }

  async retryFailed(userId: string): Promise<void> {
    const mutations = await this.listMutations(userId);
    await this.database.transaction('rw', this.database.mutations, async () => {
      for (const mutation of mutations) {
        if (mutation.state === 'failed') {
          await this.database.mutations.put({ ...mutation, error: undefined, state: 'pending' });
        }
      }
    });
  }

  async replaceTodoTaskId(userId: string, localId: string, serverId: string): Promise<void> {
    await this.rewriteMutations(userId, (mutation) => {
      if ((mutation.kind === 'todo-update' || mutation.kind === 'todo-delete') && mutation.taskId === localId) {
        return { ...mutation, taskId: serverId };
      }
      if (mutation.kind === 'todo-reorder') {
        const replace = (id: string) => id === localId ? serverId : id;
        return {
          ...mutation,
          input: {
            ...mutation.input,
            laterTaskIds: mutation.input.laterTaskIds.map(replace),
            pinnedTaskIds: mutation.input.pinnedTaskIds.map(replace),
            standardTaskIds: mutation.input.standardTaskIds.map(replace)
          }
        };
      }
      return mutation;
    });
  }

  async replaceShoppingItemId(userId: string, localId: string, serverId: string): Promise<void> {
    await this.rewriteMutations(userId, (mutation) => {
      if ((mutation.kind === 'shopping-update' || mutation.kind === 'shopping-delete') && mutation.itemId === localId) {
        return { ...mutation, itemId: serverId };
      }
      return mutation;
    });
  }

  async clearUser(userId: string): Promise<void> {
    await this.database.transaction('rw', this.database.mutations, this.database.snapshots, async () => {
      await this.database.mutations.where('userId').equals(userId).delete();
      await this.database.snapshots.where('userId').equals(userId).delete();
    });
  }

  private snapshotKey(userId: string, queryKey: readonly unknown[]): string {
    return `${userId}:${JSON.stringify(queryKey)}`;
  }

  private async rewriteMutations(
    userId: string,
    rewrite: (mutation: OfflineMutation) => OfflineMutation
  ): Promise<void> {
    const mutations = await this.listMutations(userId);
    await this.database.transaction('rw', this.database.mutations, async () => {
      for (const mutation of mutations) {
        const nextMutation = rewrite(mutation);
        if (nextMutation !== mutation) await this.database.mutations.put(nextMutation);
      }
    });
  }
}
