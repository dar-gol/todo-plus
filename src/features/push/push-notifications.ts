import type { components } from '@/lib/api/generated';
import { apiClient } from '@/lib/api/api-client';

type PushKeyResponse = components['schemas']['PushPublicKeyResponseDto'];

/** Converts explicit user consent into a persisted Web Push subscription. */
export class PushNotifications {
  supported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  permission(): NotificationPermission | 'unsupported' {
    return this.supported() ? Notification.permission : 'unsupported';
  }

  async enable(): Promise<void> {
    if (!this.supported()) throw new Error('Ta przeglądarka nie obsługuje powiadomień push.');
    const key = await apiClient.request<PushKeyResponse>('/push/public-key');
    if (!key.enabled || !key.publicKey) throw new Error('Powiadomienia nie są jeszcze skonfigurowane na serwerze.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Zezwól na powiadomienia w ustawieniach przeglądarki.');
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.decodeKey(key.publicKey)
    });
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Nie udało się zapisać tego urządzenia.');
    await apiClient.request('/push/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth })
    });
  }

  private decodeKey(value: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const binary = window.atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
}

export const pushNotifications = new PushNotifications();
