import type { QueryClient } from '@tanstack/react-query';
import { authSession } from '../../lib/auth/auth-session';
import type { OfflineRepository } from './OfflineRepository';
import { applyOfflineMutation } from './offline-query-updates';

const persistedQueryFamilies = new Set([
  'christian-holidays',
  'household',
  'name-days',
  'public-holidays',
  'shopping-list',
  'todos'
]);

/** Hydrates and continuously persists the small set of offline-capable queries. */
export class OfflineQueryPersistence {
  constructor(private readonly repository: OfflineRepository) {}

  async hydrate(queryClient: QueryClient, userId: string): Promise<void> {
    const snapshots = await this.repository.listSnapshots(userId);
    for (const snapshot of snapshots) {
      queryClient.setQueryData(snapshot.queryKey, snapshot.data, { updatedAt: snapshot.updatedAt });
    }
    for (const mutation of await this.repository.listMutations(userId)) {
      applyOfflineMutation(queryClient, mutation);
    }
  }

  observe(queryClient: QueryClient): () => void {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.query.state.status !== 'success') return;
      const userId = authSession.cachedUser?.id;
      const queryKey = event.query.queryKey;
      if (!userId || !this.shouldPersist(queryKey)) return;
      void this.repository.saveSnapshot(
        userId,
        queryKey,
        event.query.state.data,
        event.query.state.dataUpdatedAt || Date.now()
      );
    });
  }

  private shouldPersist(queryKey: readonly unknown[]): boolean {
    return typeof queryKey[0] === 'string' && persistedQueryFamilies.has(queryKey[0]);
  }
}
