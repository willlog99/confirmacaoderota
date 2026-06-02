const CACHE_NAME = 'loglife-v4';
const ASSETS = [
  '/confirmacaoderota/index.html',
  '/confirmacaoderota/confirmar.html',
  '/confirmacaoderota/rota.html',
  '/confirmacaoderota/manifest.json',
  '/confirmacaoderota/icon-192.png',
  '/confirmacaoderota/icon-512.png'
];

const API = 'https://confirmacaoderota.willlog99.workers.dev';

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── FETCH — Network first, fallback cache ─────────────────────
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

// ── PERIODIC BACKGROUND SYNC — Envia localização a cada 2 min ─
self.addEventListener('periodicsync', e => {
  if (e.tag === 'enviar-localizacao') {
    e.waitUntil(enviarLocalizacaoBackground());
  }
});

async function enviarLocalizacaoBackground() {
  try {
    // Pegar nome salvo no cache do SW
    const cache = await caches.open(CACHE_NAME);
    const nomeResp = await cache.match('__nome_motoboy__');
    if (!nomeResp) return; // Motoboy não confirmou presença ainda
    const nome = await nomeResp.text();
    if (!nome) return;

    // Pegar posição GPS
    const pos = await getPosicao();
    if (!pos) return;

    // Enviar para o worker
    await fetch(API + '/localizacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        precisao: pos.coords.accuracy,
        timestamp: Date.now()
      })
    });
  } catch(e) {
    console.warn('[SW] Erro ao enviar localização:', e);
  }
}

function getPosicao() {
  return new Promise((resolve) => {
    if (!('geolocation' in self.navigator || 'geolocation' in globalThis)) {
      resolve(null); return;
    }
    const geo = self.navigator?.geolocation || globalThis.navigator?.geolocation;
    if (!geo) { resolve(null); return; }
    geo.getCurrentPosition(
      pos => resolve(pos),
      ()  => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ── MESSAGES ─────────────────────────────────────────────────
self.addEventListener('message', e => {
  // Salvar nome do motoboy para uso no background sync
  if (e.data?.type === 'SALVAR_NOME') {
    caches.open(CACHE_NAME).then(cache => {
      cache.put('__nome_motoboy__', new Response(e.data.nome));
    });
  }

  // Limpar nome ao sair
  if (e.data?.type === 'LIMPAR_NOME') {
    caches.open(CACHE_NAME).then(cache => {
      cache.delete('__nome_motoboy__');
    });
  }

  // Force refresh do admin
  if (e.data?.type === 'FORCE_REFRESH') {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'RELOAD' }));
    });
  }
});
