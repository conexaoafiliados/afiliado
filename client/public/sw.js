const CACHE_NAME = 'creator-growth-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalar service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Ativar service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs (deixar passar normalmente)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Não cachear respostas não-200
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clonar a resposta
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Retornar do cache se offline
        return caches.match(event.request)
          .then(response => {
            return response || new Response('Offline - página não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Sincronização em background (quando voltar online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar dados
      Promise.resolve()
    );
  }
});

// Notificações push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Creator Growth Platform';
  const options = {
    body: data.body || 'Nova notificação',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%237c3aed" width="192" height="192" rx="45"/><text x="50%" y="50%" font-size="32" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">CGP</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%237c3aed" width="192" height="192"/></svg>',
    tag: data.tag || 'notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Verificar se já existe uma janela aberta
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abrir uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
