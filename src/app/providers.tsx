'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { OfflineSyncProvider } from '@/features/offline/OfflineSyncProvider';
import { offlineQueryPersistence } from '@/features/offline/offline-runtime';
import { authSession } from '@/lib/auth/auth-session';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry: 1 },
      // App mutations write to IndexedDB. The sync provider handles network retries.
      mutations: { networkMode: 'always' }
    }
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
    }
    let active = true;
    const stopPersistence = offlineQueryPersistence.observe(queryClient);
    const userId = authSession.cachedUser?.id;
    const hydration = userId ? offlineQueryPersistence.hydrate(queryClient, userId) : Promise.resolve();
    void hydration.finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      stopPersistence();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {ready ? (
        <OfflineSyncProvider>{children}</OfflineSyncProvider>
      ) : (
        <main className="loading-screen"><CheckCircle2 aria-hidden="true" /><span>Otwieram zapisane dane…</span></main>
      )}
    </QueryClientProvider>
  );
}
