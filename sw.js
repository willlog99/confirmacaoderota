const CACHE_NAME = 'loglife-v2';
const ASSETS = [
  '/confirmacaoderota/index.html',
  '/confirmacaoderota/confirmar.html',
  '/confirmacaoderota/rota.html',
  '/confirmacaoderota/painel.html',
  '/confirmacaoderota/rotas.html',
  '/confirmacaoderota/criar-rota.html',
  '/confirmacaoderota/exportar.html',
  '/confirmacaoderota/importar.html',
  '/confirmacaoderota/atualizar-massa.html',
  '/confirmacaoderota/base.html',
  '/confirmacaoderota/historico.html',
  '/confirmacaoderota/manifest.json',
  '/confirmacaoderota/manifest-admin.json',
  '/confirmacaoderota/20050686-7618-4EE2-86F2-0E0E1EE012BE.png',
  '/confirmacaoderota/761B1410-BF55-4955-AD0E-BA388B9E6625.png',
  '/confirmacaoderota/HERMES PARDINI.png'
];

// Instala e faz cache dos arquivos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first, fallback para cache
self.addEventListener('fetch', e => {
  // Não intercepta chamadas para o worker (API)
  if (e.request.url.includes('workers.dev')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza cache com versão nova
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
