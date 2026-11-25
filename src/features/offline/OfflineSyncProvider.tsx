'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { connectionStateEventName } from '../../lib/api/connection-events';
import { authSession } from '../../lib/auth/auth-session';
import type { OfflineMutation } from './OfflineMutation';
import type { OfflineSyncState } from './OfflineSyncState';
import { offlineRepository, offlineSyncService } from './offline-runtime';

const OfflineSyncContext = createContext<{
  enqueue: (mutation: OfflineMutation) => Promise<void>;
  error: string | null;
  online: boolean;
  pendingCount: number;
  retry: () => Promise<void>;
  state: OfflineSyncState;
} | null>(null);

/** Owns reconnect detection, durable queue replay, and user-facing sync state. */
export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  const [pendingCount, setPendingCount] = useState(0);
  const [state, setState] = useState<OfflineSyncState>('idle');
  const [error, setError] = useState<string | null>(null);
  const syncing = useRef(false);
  const retryTimer = useRef<number | null>(null);

  const refreshCount = useCallback(async () => {
    const userId = authSession.cachedUser?.id;
    const count = userId ? await offlineRepository.countMutations(userId) : 0;
    setPendingCount(count);
    return count;
  }, []);

  const flush = useCallback(async () => {
    const userId = authSession.cachedUser?.id;
    if (!userId || syncing.current || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    const count = await offlineRepository.countMutations(userId);
    setPendingCount(count);
    if (count === 0) {
      setError(null);
      setState(online ? 'idle' : 'offline');
      return;
    }

    syncing.current = true;
    setState('syncing');
    setError(null);
    try {
      const result = await offlineSyncService.sync(userId, queryClient);
      setPendingCount(result.pendingCount);
      setError(result.error);
      if (result.error) {
        setState(result.transientFailure ? 'offline' : 'error');
        if (result.transientFailure) {
          if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
          retryTimer.current = window.setTimeout(() => window.dispatchEvent(new Event('online')), 10_000);
        }
      } else {
        setOnline(true);
        setState(result.pendingCount > 0 ? 'pending' : 'idle');
        void queryClient.invalidateQueries({ queryKey: ['todos'] });
        void queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się odczytać zapisanych zmian.');
      setState('error');
    } finally {
      syncing.current = false;
    }
  }, [online, queryClient]);

  const enqueue = useCallback(async (mutation: OfflineMutation) => {
    await offlineRepository.enqueue(mutation);
    setPendingCount((count) => count + 1);
    setState('pending');
    setError(null);
    window.setTimeout(() => void flush(), 0);
  }, [flush]);

  const retry = useCallback(async () => {
    const userId = authSession.cachedUser?.id;
    if (!userId) return;
    await offlineRepository.retryFailed(userId);
    setState('pending');
    setError(null);
    await flush();
  }, [flush]);

  useEffect(() => {
    const markOnline = () => {
      setOnline(true);
      void flush();
    };
    const markOffline = () => {
      setOnline(false);
      setState('offline');
    };
    const handleApiConnection = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === true) markOnline();
      else markOffline();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void flush();
    };

    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    window.addEventListener('focus', markOnline);
    window.addEventListener(connectionStateEventName, handleApiConnection);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const initialSync = window.setTimeout(() => void refreshCount().then(() => flush()), 0);

    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
      window.removeEventListener('focus', markOnline);
      window.removeEventListener(connectionStateEventName, handleApiConnection);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearTimeout(initialSync);
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
    };
  }, [flush, refreshCount]);

  const value = useMemo(
    () => ({ enqueue, error, online, pendingCount, retry, state }),
    [enqueue, error, online, pendingCount, retry, state]
  );

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

/** Exposes the single queue and connection owner to offline-capable features. */
export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider.');
  return context;
}
