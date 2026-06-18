const CACHE = 'loglife-painel-v1';
const ASSETS = [
  '/confirmacaoderota/painel.html',
  '/confirmacaoderota/core.js',
  '/confirmacaoderota/motoboys.js',
  '/confirmacaoderota/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Sempre busca dados do Worker online — só usa cache para assets estáticos
  const url = new URL(e.request.url);
  if (url.hostname.includes('workers.dev') || url.hostname.includes('r2.dev')) {
    return; // Não cacheia dados da API
  }
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
