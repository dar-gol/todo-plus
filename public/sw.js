self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const alarm = data.alarm === true;
  event.waitUntil(self.registration.showNotification(data.title || 'Todo Plus', {
    body: data.body || 'Masz nowe przypomnienie.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'todo-plus',
    silent: alarm ? false : undefined,
    renotify: alarm,
    requireInteraction: alarm,
    ...(alarm ? { vibrate: [200, 100, 200, 100, 400] } : {}),
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === url && 'focus' in client);
    return existing ? existing.focus() : self.clients.openWindow(url);
  }));
});
