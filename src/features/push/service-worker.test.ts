import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');

function worker(scope: string) {
  const handlers = new Map<string, (event: Record<string, unknown>) => void>();
  const offlineShell = { offline: true };
  const cache = { put: vi.fn().mockResolvedValue(undefined), add: vi.fn().mockResolvedValue(undefined) };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    match: vi.fn().mockResolvedValue(offlineShell)
  };
  const fetch = vi.fn().mockResolvedValue({ ok: true, clone: () => ({}), text: async () => '' });
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const self = {
    location: { origin: 'https://example.test' },
    registration: { scope: `https://example.test${scope}`, showNotification },
    addEventListener: (type: string, handler: (event: Record<string, unknown>) => void) => handlers.set(type, handler),
    skipWaiting: vi.fn(),
    clients: { matchAll: vi.fn().mockResolvedValue([]), openWindow }
  };
  runInNewContext(source, { self, URL, caches, fetch, Response });

  async function dispatch(type: string, data: Record<string, unknown> = {}) {
    let pending: Promise<unknown> | undefined;
    handlers.get(type)!({
      ...data,
      waitUntil: (promise: Promise<unknown>) => { pending = promise; },
      respondWith: (promise: Promise<unknown>) => { pending = promise; }
    });
    return pending;
  }
  return { dispatch, cache, caches, fetch, offlineShell, showNotification, openWindow };
}

describe.each(['/', '/todo-plus/'])('Todo Plus service worker at %s', (scope) => {
  it('requests the stronger notification presentation and preserves the task link', async () => {
    const app = worker(scope);
    await app.dispatch('push', { data: { json: () => ({ alarm: true, url: '/?task=task-1' }) } });

    expect(app.showNotification).toHaveBeenCalledWith('Todo Plus', expect.objectContaining({
      silent: false,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 400],
      icon: `${scope}icon.svg`,
      data: { url: `https://example.test${scope}?task=task-1` }
    }));
  });

  it('keeps ordinary notifications separate from alarm presentation', async () => {
    const app = worker(scope);
    await app.dispatch('push', { data: { json: () => ({ title: 'Reminder' }) } });
    const options = app.showNotification.mock.calls[0][1];
    expect(options.renotify).toBe(false);
    expect(options.requireInteraction).toBe(false);
    expect(options).not.toHaveProperty('vibrate');
  });

  it('caches the shell inside its own application scope', async () => {
    const app = worker(scope);
    await app.dispatch('install');
    expect(app.fetch).toHaveBeenCalledWith(scope, { cache: 'no-store' });
    expect(app.cache.put).toHaveBeenCalledWith(scope, expect.anything());
    expect(app.cache.add).toHaveBeenCalledWith(`${scope}icon.svg`);
  });

  it('serves its own cached shell when offline', async () => {
    const app = worker(scope);
    app.fetch.mockRejectedValue(new Error('Offline'));
    const response = await app.dispatch('fetch', {
      request: { method: 'GET', mode: 'navigate', url: `https://example.test${scope}?list=personal` }
    });
    expect(app.caches.match).toHaveBeenCalledWith(scope);
    expect(response).toBe(app.offlineShell);
  });

  it('opens a task inside its own scope without adding the prefix twice', async () => {
    const app = worker(scope);
    await app.dispatch('notificationclick', {
      notification: { close: vi.fn(), data: { url: `${scope}?task=task-1` } }
    });
    expect(app.openWindow).toHaveBeenCalledWith(`https://example.test${scope}?task=task-1`);
  });
});
