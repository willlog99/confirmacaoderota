const CACHE_NAME = 'loglife-v3';
const ASSETS = [
  '/confirmacaoderota/index.html',
  '/confirmacaoderota/confirmar.html',
  '/confirmacaoderota/rota.html',
  '/confirmacaoderota/manifest.json',
  '/confirmacaoderota/icon-192.png',
  '/confirmacaoderota/icon-512.png'
];

// Instala e faz cache só do essencial
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Estratégia: Network first, fallback para cache
self.addEventListener('fetch', e => {
  if (e.request.url.includes('workers.dev')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Escuta mensagem de refresh do admin
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'FORCE_REFRESH') {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'RELOAD' });
      });
    });
  }
});
