const shellCache = 'todo-plus-shell-v2';
const appBasePath = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const shellPath = `${appBasePath}/`;
const assetPath = (path) => `${appBasePath}${path}`;
const shellAssets = ['/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'].map(assetPath);

self.addEventListener('install', (event) => {
  event.waitUntil(cacheApplicationShell().catch(() => undefined));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('todo-plus-shell-') && key !== shellCache).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationResponse(event.request));
    return;
  }
  if (url.pathname.startsWith(assetPath('/_next/static/')) || shellAssets.includes(url.pathname)) {
    event.respondWith(staticResponse(event.request));
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const alarm = data.alarm === true;
  event.waitUntil(self.registration.showNotification(data.title || 'Todo Plus', {
    body: data.body || 'Masz nowe przypomnienie.',
    icon: assetPath('/icon.svg'),
    badge: assetPath('/icon.svg'),
    tag: data.tag || 'todo-plus',
    silent: alarm ? false : undefined,
    renotify: alarm,
    requireInteraction: alarm,
    ...(alarm ? { vibrate: [200, 100, 200, 100, 400] } : {}),
    data: { url: notificationDestination(data.url) }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = notificationDestination(event.notification.data?.url);
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === url && 'focus' in client);
    return existing ? existing.focus() : self.clients.openWindow(url);
  }));
});

async function cacheApplicationShell() {
  const cache = await caches.open(shellCache);
  const response = await fetch(shellPath, { cache: 'no-store' });
  if (!response.ok) return;
  await cache.put(shellPath, response.clone());
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/giu)]
    .map((match) => new URL(match[1], self.location.origin))
    .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(assetPath('/_next/static/')));
  await Promise.allSettled([
    ...shellAssets.map((path) => cache.add(path)),
    ...assets.map((url) => cache.add(url.toString()))
  ]);
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(shellCache);
      await cache.put(shellPath, response.clone());
    }
    return response;
  } catch {
    return await caches.match(shellPath) || Response.error();
  }
}

async function staticResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(shellCache);
    await cache.put(request, response.clone());
  }
  return response;
}

function notificationDestination(path) {
  const destination = new URL(path || shellPath, self.location.origin);
  if (destination.origin !== self.location.origin) return new URL(shellPath, self.location.origin).href;
  if (destination.pathname !== appBasePath && !destination.pathname.startsWith(shellPath)) {
    destination.pathname = `${appBasePath}${destination.pathname}`;
  }
  return destination.href;
}
