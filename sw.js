/* ═══════════════════════════════════════════════
   JOmaxPath Service Worker — Notificacions v1
═══════════════════════════════════════════════ */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/* ── Push des de servidor (futur) ── */
self.addEventListener('push', e => {
  const data = e.data?.json?.() ?? { title: 'JOmaxPath', body: '' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: data.tag || 'jomaxpath',
      data: data.url || '/',
    })
  );
});

/* ── Clic a la notificació: obre/enfoca la pestanya ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const target = clients.find(c => c.url.includes(self.location.origin));
      return target ? target.focus() : self.clients.openWindow('/');
    })
  );
});

/* ── Missatge de la pàgina → mostra notificació ── */
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, icon } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.png',
      badge: '/favicon.png',
      tag: tag || 'jomaxpath',
      requireInteraction: false,
    });
  }

  /* ── Recordatoris: la pàgina envia la llista, el SW comprova ── */
  if (e.data?.type === 'CHECK_REMINDERS') {
    const reminders = e.data.reminders || [];
    const now = Date.now();
    reminders.forEach(r => {
      if (r.reminder_at && new Date(r.reminder_at).getTime() <= now) {
        self.registration.showNotification('⏰ Recordatori: ' + r.name, {
          body: r.desc || 'Tens una tasca pendent',
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: 'reminder-' + r.id,
          requireInteraction: true,
        });
      }
    });
  }
});
