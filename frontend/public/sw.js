// Service Worker for Web Push Notifications
// This file runs in the background and handles incoming push events

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Notificação', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logos/icon_logame.png',
    badge: data.badge || '/logos/icon_logame.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
    tag: data.data?.taskId || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'RunTask', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing window if possible
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new one
      return self.clients.openWindow(url);
    })
  );
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
