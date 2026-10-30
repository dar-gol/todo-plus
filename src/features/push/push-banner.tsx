'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { pushNotifications } from './push-notifications';

export function PushBanner() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setPermission(pushNotifications.permission()));
  }, []);
  if (permission === 'granted') return null;

  async function enable() {
    setPending(true);
    setMessage(null);
    try {
      await pushNotifications.enable();
      setPermission('granted');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Nie udało się włączyć powiadomień.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="push-banner">
      <Bell aria-hidden="true" />
      <div><strong>Nie przegap ważnego zadania</strong><span>Włącz przypomnienia o terminach i zmianach rodzinnych.</span></div>
      {permission !== 'unsupported' && <button onClick={enable} disabled={pending}>{pending ? 'Włączam…' : 'Włącz'}</button>}
      {permission === 'unsupported' && <span className="small-muted">Brak obsługi w tej przeglądarce</span>}
      {message && <p className="banner-error" role="alert">{message}</p>}
    </div>
  );
}
