'use client';

import { AlertCircle, Cloud, CloudOff, LoaderCircle } from 'lucide-react';
import { useOfflineSync } from './OfflineSyncProvider';

/** Shows calm, actionable feedback without blocking local work. */
export function OfflineSyncIndicator() {
  const { error, online, pendingCount, retry, state } = useOfflineSync();
  if (state === 'idle' && pendingCount === 0 && online) return null;

  const icon = state === 'syncing'
    ? <LoaderCircle className="spin" aria-hidden="true" />
    : state === 'error'
      ? <AlertCircle aria-hidden="true" />
      : online
        ? <Cloud aria-hidden="true" />
        : <CloudOff aria-hidden="true" />;
  const message = state === 'syncing'
    ? `Synchronizuję ${pendingCount} ${pendingCount === 1 ? 'zmianę' : 'zmian'}…`
    : state === 'error'
      ? error ?? 'Jedna ze zmian wymaga ponowienia.'
      : pendingCount > 0
        ? `Bezpiecznie zapisano w telefonie — ${pendingCount} ${pendingCount === 1 ? 'zmiana czeka' : 'zmiany czekają'} na połączenie.`
        : 'Pracujesz bez internetu. Ostatnie dane są dostępne w telefonie.';

  return (
    <div className={`offline-sync-indicator ${state === 'error' ? 'error' : ''}`} role={state === 'error' ? 'alert' : 'status'}>
      {icon}
      <span>{message}</span>
      {(state === 'error' || pendingCount > 0 && online && state !== 'syncing') ? (
        <button type="button" onClick={() => void retry()}>Spróbuj teraz</button>
      ) : null}
    </div>
  );
}
