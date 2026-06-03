// ============================================================
// ── CORE — Funções base, navegação e utilitários ──────────────────────────
// ============================================================

// ── VARIÁVEIS ──
const API = 'https://confirmacaoderota.willlog99.workers.dev';
const _diaSemana = new Date().getDay();

// ── FUNÇÕES ──

function abrirMenu() {
  document.getElementById('menu-overlay').classList.add('open');
}

function fecharMenu() {
  const el = document.getElementById('menu-overlay');
  if (el) el.classList.remove('open');
  // sidebar nova — nenhuma ação necessária
}

function fecharMenuOverlay(e) {
  if (e.target === document.getElementById('menu-overlay')) fecharMenu();
}

function fecharModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ── BREADCRUMB ──────────────────────────────────────────
const BREADCRUMBS = {
  'painel': 'OPS › <b>Painel</b>',
  'confirmacoes': 'OPS › <b>Confirmações</b>',
  'mapa-rastreamento': 'OPS › <b>Rastreamento</b>',
  'checklist-view': 'OPS › <b>Checklist</b>',
  'motoristas': 'OPS › <b>Motoristas</b>',
  'estoque-view': 'Gente e Gestão › <b>PMC Estoque</b>',
  'ponto-rh': 'Gente e Gestão › <b>Ponto RH</b>',
  'gestor': 'Qualidade › <b>Auditoria</b>',
  'presencas': 'Gente e Gestão › <b>Presenças</b>',
  'buscar': 'Gestão de Rota › <b>Buscar cliente</b>',
  'criar-cliente': 'Gestão de Rota › <b>Criar cliente</b>',
  'gerenciar-motoboys': 'Gestão de Rota › <b>Motoboys</b>',
  'ativar-cliente': 'Gestão de Rota › <b>Ativar/Desativar cliente</b>',
};

function setView(id, el) {
  pararAutoRefresh();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(m => m.classList.remove('active'));
  const viewEl = document.getElementById('view-' + id);
  if (viewEl) viewEl.classList.add('active');
  if (el) el.classList.add('active');
  window.scrollTo(0,0);

  // Atualizar breadcrumb
  atualizarBreadcrumb(id);

  if (id === 'painel') { carregarPainel(); iniciarAutoRefresh(); iniciarMiniMapa(); }
  if (id === 'confirmacoes') carregarConfirmacoes();
  if (id === 'motoristas') carregarMotoristasList();
  if (id === 'rotas-view') carregarRotasView();
  if (id === 'checklist-view') carregarChecklists();
  if (id === 'checklists-incompletos') carregarChecklistsIncompletos();
  if (id === 'gerenciar-motoboys') carregarMotoboysGerenciar();
  if (id === 'ponto-rh') iniciarPontoRH();
  if (id === 'estoque-view') iniciarEstoqueView();
  if (id === 'presencas') carregarPresencas();
  if (id === 'mapa-rastreamento') {
    setTimeout(() => { iniciarLeafletMap(); carregarMapa(); iniciarAutoRefreshMapa(); }, 100);
  }
  if (id === 'gestor') renderItensAuditoria();
}


function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = (type==='loading'?'<span class="spinner"></span>':'')+text;
  el.className = 'msg'+(type?' '+type:'');
}

// ===== DISPARADOR WHATSAPP =====


function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}


function formatarTelefone(t) {
  const s = String(t||'').replace(/\D/g,'');
  return s.length === 11 ? '(' + s.slice(0,2) + ') ' + s.slice(2,7) + '-' + s.slice(7) : t;
}


function iniciarAutoRefresh() {
  pararAutoRefresh();
  autoRefreshInterval = setInterval(() => carregarPainel(true), 30000);
}


function pararAutoRefresh() {
  if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
  if (typeof pararAutoRefreshMapa === 'function') pararAutoRefreshMapa();



function atualizarBreadcrumb(id) {
  const bc = document.getElementById('tb-breadcrumb');
  if (bc && BREADCRUMBS[id]) bc.innerHTML = BREADCRUMBS[id];
}

function atualizarTopbarData() {
  const el = document.getElementById('topbar-data');
  if (!el) return;
  const d = new Date();
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  el.textContent = dias[d.getDay()] + ', ' + d.toLocaleDateString('pt-BR');
}

// ── REVERTER COLETA ──────────────────────────────────────
let reverterClienteData = null;

async function buscarClienteReverter() {
  const num = document.getElementById('reverter-num-cliente').value.trim();
  const msg = document.getElementById('reverter-msg');
  const resultado = document.getElementById('reverter-resultado');
  const btn = document.getElementById('reverter-btn');
  msg.className = 'msg'; msg.textContent = '';
  if (!num) return;
  msg.className = 'msg loading'; msg.textContent = 'Buscando...';
  try {
    const r = await fetch(API + '/buscar-cliente?num=' + encodeURIComponent(num));
    const d = await r.json();
    if (d.status === 'ok' && d.cliente) {
      reverterClienteData = d.cliente;
      document.getElementById('reverter-rc-nome').textContent = d.cliente.nome || '—';
      document.getElementById('reverter-rc-coletor').textContent = (d.cliente.biocondutor || '—') + (d.cliente.rota ? ' · ' + d.cliente.rota : '');
      document.getElementById('reverter-rc-horario').textContent = d.cliente.hora_confirmacao || '—';
      const stEl = document.getElementById('reverter-rc-status');
      const prod = d.cliente.resposta === 'produtivo';
      stEl.textContent = prod ? 'Produtivo' : 'Improdutivo';
      stEl.className = 'rc-badge ' + (prod ? 'rc-prod' : 'rc-improd');
      resultado.classList.add('show');
      btn.style.display = 'flex';
      msg.className = 'msg'; msg.textContent = '';
    } else {
      resultado.classList.remove('show');
      btn.style.display = 'none';
      msg.className = 'msg error'; msg.textContent = '⚠️ Cliente não encontrado';
    }
  } catch(e) { msg.className = 'msg error'; msg.textContent = 'Erro de conexão'; }
}

async function confirmarReverterColeta() {
  if (!reverterClienteData) return;
  const msg = document.getElementById('reverter-msg');
  const btn = document.getElementById('reverter-btn');
  btn.disabled = true;
  msg.className = 'msg loading'; msg.textContent = 'Revertendo...';
  try {
    const r = await fetch(API + '/reverter-coleta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_cliente: reverterClienteData.num_cliente || reverterClienteData.id })
    });
    const d = await r.json();
    if (d.status === 'ok') {
      msg.className = 'msg success'; msg.textContent = '✓ Coleta revertida para Pendente!';
      document.getElementById('reverter-resultado').classList.remove('show');
      btn.style.display = 'none';
      document.getElementById('reverter-num-cliente').value = '';
      reverterClienteData = null;
      setTimeout(() => { msg.className = 'msg'; msg.textContent = ''; }, 3000);
      carregarPainel();
    } else {
      msg.className = 'msg error'; msg.textContent = 'Erro ao reverter';
      btn.disabled = false;
    }
  } catch(e) { msg.className = 'msg error'; msg.textContent = 'Erro de conexão'; btn.disabled = false; }
}

// ── MINI MAPA NO PAINEL ──────────────────────────────────
let miniMapaInst = null;
let miniMapaMarkers = {};
const MINI_CORES = ['#0F9B78','#8B5CF6','#1E9FD9','#F59E0B','#DC2626','#0F4C7A'];

function iniciarMiniMapa() {
  const el = document.getElementById('mini-mapa-painel');
  if (!el) return;
  if (typeof L === 'undefined') { setTimeout(iniciarMiniMapa, 500); return; }
  if (!miniMapaInst) {
    miniMapaInst = L.map('mini-mapa-painel', { zoomControl:false, dragging:false, scrollWheelZoom:false })
      .setView([-23.5505, -46.6330], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom:19
    }).addTo(miniMapaInst);
  }
  carregarMiniMapa();
}

async function carregarMiniMapa() {
  try {
    const r = await fetch(API + '/localizacao');
    const d = await r.json();
    const locs = d.localizacoes || [];
    const agora = Date.now();
    const ONLINE_LIM = 5*60*1000;
    const IDLE_LIM = 10*60*1000;
    const online = locs.filter(l => agora-l.timestamp < ONLINE_LIM).length;
    const idle   = locs.filter(l => agora-l.timestamp >= ONLINE_LIM && agora-l.timestamp < IDLE_LIM).length;
    const elOn = document.getElementById('mini-mapa-online');
    const elIdle = document.getElementById('mini-mapa-idle');
    const elOff = document.getElementById('mini-mapa-off');
    if(elOn) elOn.textContent = online;
    if(elIdle) elIdle.textContent = idle;
    try {
      const r2 = await fetch(API + '/motoboys?todos=1&agrupado=1');
      const d2 = await r2.json();
      const total = new Set((d2.motoboys||[]).map(m=>m.nome)).size;
      if(elOff) elOff.textContent = Math.max(0, total - locs.length);
    } catch(e) { if(elOff) elOff.textContent = '—'; }
    if (!miniMapaInst) return;
    locs.forEach((l, i) => {
      const cor = MINI_CORES[i % MINI_CORES.length];
      const status = agora-l.timestamp < ONLINE_LIM ? 'online' : 'parado';
      const iniciais = l.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
      const icon = L.divIcon({
        className:'',
        html:`<div style="background:${cor};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:20px;height:20px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;opacity:${status==='online'?1:.65}"><span style="transform:rotate(45deg);font-size:7px;font-weight:700">${iniciais}</span></div>`,
        iconSize:[20,20],iconAnchor:[10,20],popupAnchor:[0,-20]
      });
      if (miniMapaMarkers[l.nome]) {
        miniMapaMarkers[l.nome].setLatLng([l.lat,l.lng]);
        miniMapaMarkers[l.nome].setIcon(icon);
      } else {
        miniMapaMarkers[l.nome] = L.marker([l.lat,l.lng],{icon}).addTo(miniMapaInst)
          .bindPopup(`<div style="font-size:11px;font-weight:700;color:#0F4C7A">${l.nome}</div>`,{maxWidth:120});
      }
    });
    if (locs.length > 0) {
      const bounds = L.latLngBounds(locs.map(l=>[l.lat,l.lng]));
      miniMapaInst.fitBounds(bounds, {padding:[20,20],maxZoom:14});
    }
  } catch(e) {}
}

}
function atualizarVersaoApp() {
  const novaVersao = prompt('Digite a nova versão do app:\n(Ex: 1.0.1)\n\nAo salvar, todos os apps verão o banner de atualização.');
  if (!novaVersao) return;
  fetch(API + '/app-versao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versao: novaVersao.trim() })
  }).then(r => r.json()).then(d => {
    if (d.status === 'ok') toast('✓ Versão ' + d.versao + ' publicada');
    else toast('Erro ao publicar versão');
  }).catch(() => toast('Erro de conexão'));
}

// ── MAPA RASTREAMENTO ────────────────────────────────────────
let leafletMap = null;
let leafletMarkers = {};
let mapaRefreshInterval = null;
let mapaSyncTimer = null;
let mapaSyncSegundos = 120;
const CORES_MB = ['#0F9B78','#8B5CF6','#1E9FD9','#F59E0B','#DC2626','#0F4C7A','#EC4899','#14B8A6'];

function iniciarAutoRefreshMapa() {
  pararAutoRefreshMapa();
  mapaSyncSegundos = 120;
  mapaSyncTimer = setInterval(() => {
    mapaSyncSegundos--;
    const el = document.getElementById('mapa-sync-countdown');
    const bar = document.getElementById('mapa-sync-bar');
    if (el) el.textContent = Math.floor(mapaSyncSegundos/60)+':'+String(mapaSyncSegundos%60).padStart(2,'0');
    if (bar) bar.style.width = ((120-mapaSyncSegundos)/120*100)+'%';
    if (mapaSyncSegundos <= 0) { mapaSyncSegundos = 120; carregarMapa(); }
  }, 1000);
}

function pararAutoRefreshMapa() {
  if (mapaRefreshInterval) { clearInterval(mapaRefreshInterval); mapaRefreshInterval = null; }
  if (mapaSyncTimer) { clearInterval(mapaSyncTimer); mapaSyncTimer = null; }
}

function iniciarLeafletMap() {
  if (leafletMap) return;
  const el = document.getElementById('leaflet-map');
  if (!el) return;
  if (typeof L === 'undefined') { setTimeout(iniciarLeafletMap, 500); return; }
  leafletMap = L.map('leaflet-map', { zoomControl: true }).setView([-23.5505, -46.6330], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(leafletMap);
}

function criarIconeLeaflet(cor, iniciais, status) {
  const online = status === 'online';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative">
      <div style="background:${cor};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:36px;height:36px;border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;opacity:${online?1:.7}">
        <span style="transform:rotate(45deg);font-size:11px;font-weight:700">${iniciais}</span>
      </div>
      ${online?`<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#16A34A;border:2px solid #fff;border-radius:50%"></div>`:''}
    </div>`,
    iconSize:[36,36], iconAnchor:[18,36], popupAnchor:[0,-36]
  });
}

async function buscarEndereco(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
      { headers: { 'User-Agent': 'Loglife/1.0' } });
    const d = await r.json();
    if (d.address) {
      const end = d.address;
      const partes = [end.road||end.pedestrian||end.path, end.house_number, end.suburb||end.neighbourhood||end.city_district, end.city||end.town].filter(Boolean);
      return partes.join(', ') || d.display_name?.split(',').slice(0,3).join(',') || '—';
    }
    return '—';
  } catch(e) { return '—'; }
}

async function carregarMapa() {
  try {
    iniciarLeafletMap();
    const [rLoc, rMb] = await Promise.all([
      fetch(API + '/localizacao'),
      fetch(API + '/motoboys?todos=1&agrupado=1')
    ]);
    const dLoc = await rLoc.json();
    const dMb  = await rMb.json();
    const locs = dLoc.localizacoes || [];
    const todosMotoboys = [...new Set((dMb.motoboys||[]).map(m => m.nome))].sort();
    const agora = Date.now();
    const ONLINE_LIM = 5*60*1000;
    const IDLE_LIM   = 10*60*1000;
    const online  = locs.filter(l => agora-l.timestamp < ONLINE_LIM);
    const idle    = locs.filter(l => agora-l.timestamp >= ONLINE_LIM && agora-l.timestamp < IDLE_LIM);
    const comSinal = new Set(locs.map(l => l.nome));
    const offline  = todosMotoboys.filter(n => !comSinal.has(n));
    const elOn = document.getElementById('mapa-count-online');
    const elId = document.getElementById('mapa-count-idle');
    const elOf = document.getElementById('mapa-count-off');
    if(elOn) elOn.textContent = online.length;
    if(elId) elId.textContent = idle.length;
    if(elOf) elOf.textContent = offline.length;
    const badge = document.getElementById('mapa-live-badge');
    if(badge) badge.style.display = locs.length > 0 ? 'flex' : 'none';
    if (leafletMap) {
      Object.keys(leafletMarkers).forEach(nome => {
        if (!comSinal.has(nome)) { leafletMap.removeLayer(leafletMarkers[nome]); delete leafletMarkers[nome]; }
      });
      locs.forEach((l, i) => {
        const cor = CORES_MB[i % CORES_MB.length];
        const status = agora-l.timestamp < ONLINE_LIM ? 'online' : 'parado';
        const iniciais = l.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
        const diff = agora-l.timestamp;
        const min = Math.floor(diff/60000);
        const seg = Math.floor((diff%60000)/1000);
        const tempo = min > 0 ? min+'min atrás' : seg+'s atrás';
        const stCor = status==='online'?'#16A34A':'#F59E0B';
        const stBg  = status==='online'?'#DCFCE7':'#FEF9EC';
        const stTxt = status==='online'?'● Online':'⚠ Parado';
        const popup = `<div style="font-family:-apple-system,sans-serif;min-width:180px">
          <div style="font-size:14px;font-weight:700;color:#0F4C7A;margin-bottom:6px">${l.nome}</div>
          <div style="font-size:11px;color:#5A7A8F;margin-bottom:2px" id="end-${l.nome.replace(/\s/g,'-')}">📍 Buscando endereço...</div>
          <div style="font-size:11px;color:#5A7A8F;margin-bottom:2px">🕐 ${tempo}</div>
          <div style="font-size:11px;color:#5A7A8F;margin-bottom:6px">🎯 Precisão: ${Math.round(l.precisao||0)}m</div>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${stBg};color:${stCor}">${stTxt}</span>
        </div>`;
        if (leafletMarkers[l.nome]) {
          leafletMarkers[l.nome].setLatLng([l.lat,l.lng]);
          leafletMarkers[l.nome].setIcon(criarIconeLeaflet(cor,iniciais,status));
          leafletMarkers[l.nome].setPopupContent(popup);
        } else {
          const marker = L.marker([l.lat,l.lng],{icon:criarIconeLeaflet(cor,iniciais,status)})
            .addTo(leafletMap).bindPopup(popup,{maxWidth:220});
          marker.on('popupopen', async () => {
            const endEl = document.getElementById('end-'+l.nome.replace(/\s/g,'-'));
            if (endEl && endEl.textContent.includes('Buscando')) {
              const endereco = await buscarEndereco(l.lat, l.lng);
              if (endEl) endEl.textContent = '📍 ' + endereco;
            }
          });
          leafletMarkers[l.nome] = marker;
        }
      });
      if (locs.length > 0) {
        const bounds = L.latLngBounds(locs.map(l=>[l.lat,l.lng]));
        leafletMap.fitBounds(bounds,{padding:[50,50],maxZoom:15});
      }
    }
    renderizarListaMapa(locs, offline, agora, ONLINE_LIM, IDLE_LIM);
  } catch(e) {
    const el = document.getElementById('mapa-lista-motoboys');
    if(el) el.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

function focarMotoboy(nome) {
  const marker = leafletMarkers[nome];
  if (marker && leafletMap) {
    leafletMap.setView(marker.getLatLng(), 16, { animate:true, duration:0.8 });
    marker.openPopup();
  }
}

function renderizarListaMapa(locs, offline, agora, ONLINE_LIM, IDLE_LIM) {
  const el = document.getElementById('mapa-lista-motoboys');
  if (!el) return;
  let html = '';
  locs.forEach((l, i) => {
    const cor = CORES_MB[i % CORES_MB.length];
    const diff = agora-l.timestamp;
    const isOnline = diff < ONLINE_LIM;
    const min = Math.floor(diff/60000);
    const seg = Math.floor((diff%60000)/1000);
    const tempo = min > 0 ? min+'min atrás' : seg+'s atrás';
    const iniciais = l.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
    const stBg  = isOnline?'#DCFCE7':'#FEF9EC';
    const stCor = isOnline?'#16A34A':'#92400E';
    const stTxt = isOnline?'● online':'⚠ parado';
    html += `<div onclick="focarMotoboy('${l.nome.replace(/'/g,"\'")}')" style="padding:10px 14px;border-bottom:1px solid #F5F9FC;cursor:pointer;display:flex;align-items:center;gap:10px;transition:.15s" onmouseover="this.style.background='#E8F4FB'" onmouseout="this.style.background='#fff'">
      <div style="width:34px;height:34px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${iniciais}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:#0F2940">${l.nome}</div>
        <div style="font-size:11px;color:#5A7A8F;margin-top:1px">${l.lat.toFixed(4)}°S · ${tempo}</div>
      </div>
      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${stBg};color:${stCor};white-space:nowrap">${stTxt}</span>
    </div>`;
  });
  offline.forEach(nome => {
    const iniciais = nome.split(' ').map(p=>p[0]).slice(0,2).join('');
    html += `<div style="padding:10px 14px;border-bottom:1px solid #F5F9FC;display:flex;align-items:center;gap:10px;opacity:.4">
      <div style="width:34px;height:34px;border-radius:50%;background:#9CA3AF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${iniciais}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:600;color:#0F2940">${nome}</div><div style="font-size:11px;color:#5A7A8F;margin-top:1px">Sem sinal de GPS</div></div>
      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#F3F4F6;color:#6B7280">○ offline</span>
    </div>`;
  });
  el.innerHTML = html || '<div class="empty">Nenhum motoboy com GPS ativo</div>';
}

// ── PRESENÇAS ─────────────────────────────────────────────────
let presencasLista = [];
let presencasMarcados = new Set();

async function carregarPresencas() {
  const el = document.getElementById('presencas-lista');
  if (!el) return;
  el.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  const dataEl = document.getElementById('presencas-data');
  if (dataEl) {
    const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const d = new Date();
    dataEl.textContent = dias[d.getDay()] + ', ' + d.toLocaleDateString('pt-BR');
  }
  try {
    const [rMb, rPres, rLoc] = await Promise.all([
      fetch(API + '/motoboys?todos=1&agrupado=1'),
      fetch(API + '/presencas'),
      fetch(API + '/localizacao')
    ]);
    const dMb   = await rMb.json();
    const dPres = await rPres.json();
    const dLoc  = await rLoc.json();
    const comGPS = new Set((dLoc.localizacoes||[]).map(l => l.nome));
    const mbs = dMb.motoboys || [];
    const vistos = new Set();
    presencasLista = [];
    mbs.forEach(m => {
      if (!vistos.has(m.nome)) {
        vistos.add(m.nome);
        const rotasDia = mbs.filter(x => x.nome===m.nome && x.rota).map(x => x.rota);
        presencasLista.push({ nome:m.nome, telefone:m.telefone||m.contato||'—', rotas:[...new Set(rotasDia)], gpsAutorizado:comGPS.has(m.nome) });
      }
    });
    presencasLista.sort((a,b) => { const aR=a.rotas.length>0, bR=b.rotas.length>0; if(aR&&!bR)return -1; if(!aR&&bR)return 1; return a.nome.localeCompare(b.nome); });
    const marcados = dPres.marcados || [];
    presencasMarcados = new Set(marcados);
    if (!marcados.length) presencasLista.forEach(m => { if(m.rotas.length>0) presencasMarcados.add(m.nome); });
    renderizarPresencas();
  } catch(e) { el.innerHTML = '<div class="empty">Erro ao carregar motoboys</div>'; }
}

function renderizarPresencas() {
  const busca = (document.getElementById('presencas-busca')?.value||'').toLowerCase();
  const el = document.getElementById('presencas-lista');
  if (!el) return;
  const CORES = ['#0F9B78','#8B5CF6','#1E9FD9','#F59E0B','#DC2626','#0F4C7A','#EC4899','#14B8A6'];
  const comRota = presencasLista.filter(m => m.rotas.length>0);
  const semRota = presencasLista.filter(m => m.rotas.length===0);
  const elT = document.getElementById('pres-total');   if(elT) elT.textContent = presencasLista.length;
  const elM = document.getElementById('pres-marcados'); if(elM) elM.textContent = presencasMarcados.size;
  const elS = document.getElementById('pres-semrota'); if(elS) elS.textContent = semRota.length;
  const elG = document.getElementById('pres-gps');     if(elG) elG.textContent = presencasLista.filter(m=>m.gpsAutorizado).length;
  const cbAll  = document.getElementById('pres-cb-all');
  const lblAll = document.getElementById('pres-label-all');
  const todosMarcados = presencasLista.length>0 && presencasLista.every(m=>presencasMarcados.has(m.nome));
  if(cbAll){ cbAll.style.background=todosMarcados?'#0F4C7A':'#fff'; cbAll.style.borderColor=todosMarcados?'#0F4C7A':'#D6E5EE'; cbAll.textContent=todosMarcados?'✓':''; }
  if(lblAll) lblAll.textContent = todosMarcados?'Desmarcar todos':'Marcar todos';
  function renderGrupo(lista, titulo) {
    if (!lista.length) return '';
    const filtrado = lista.filter(m => !busca||m.nome.toLowerCase().includes(busca));
    if (!filtrado.length) return '';
    let html = `<div style="font-size:10px;font-weight:700;color:#94A8B8;text-transform:uppercase;letter-spacing:.08em;padding:10px 4px 6px">${titulo}</div>`;
    filtrado.forEach(m => {
      const cor = CORES[presencasLista.indexOf(m)%CORES.length];
      const iniciais = m.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
      const marcado = presencasMarcados.has(m.nome);
      const rotaTxt = m.rotas.length>0?m.rotas.join(', '):'Sem rota';
      const rotaBg  = m.rotas.length>0?'#E8F4FB':'#F3F4F6';
      const rotaCor = m.rotas.length>0?'#0F4C7A':'#9CA3AF';
      const gpsBadge = m.gpsAutorizado
        ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#E8F8F0;color:#0F9B78">📍 GPS ✓</span>`
        : `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#F3F4F6;color:#9CA3AF">📍 Pendente</span>`;
      html += `<div onclick="presencasToggle('${m.nome.replace(/'/g,"\'")}') "
        style="display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:10px;border:1.5px solid ${marcado?'#5DCAA5':'#EBF1F5'};background:${marcado?'#F0FAF6':'#fff'};margin-bottom:6px;cursor:pointer;transition:.15s">
        <div style="width:20px;height:20px;border-radius:6px;border:1.5px solid ${marcado?'#0F9B78':'#D6E5EE'};background:${marcado?'#0F9B78':'#fff'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0">${marcado?'✓':''}</div>
        <div style="width:36px;height:36px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;border:2px solid ${marcado?'#0F9B78':'transparent'}">${iniciais}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#0F2940">${m.nome}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;flex-wrap:wrap">
            <span style="font-size:11px;color:#5A7A8F">📞 ${m.telefone}</span>
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${rotaBg};color:${rotaCor}">🛵 ${rotaTxt}</span>
            ${gpsBadge}
          </div>
        </div>
      </div>`;
    });
    return html;
  }
  el.innerHTML = renderGrupo(comRota,'Com rota hoje') + renderGrupo(semRota,'Sem rota hoje');
  if (!el.innerHTML.trim()) el.innerHTML = '<div class="empty">Nenhum motoboy encontrado</div>';
}

function presencasToggle(nome) {
  if (presencasMarcados.has(nome)) presencasMarcados.delete(nome);
  else presencasMarcados.add(nome);
  renderizarPresencas();
}

function presencasToggleTodos() {
  const todosMarcados = presencasLista.every(m => presencasMarcados.has(m.nome));
  if (todosMarcados) presencasMarcados.clear();
  else presencasLista.forEach(m => presencasMarcados.add(m.nome));
  renderizarPresencas();
}

function filtrarPresencas() { renderizarPresencas(); }

async function salvarPresencas() {
  try {
    const r = await fetch(API + '/presencas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marcados: [...presencasMarcados] })
    });
    const d = await r.json();
    if (d.status === 'ok') toast('✓ Configuração salva — ' + presencasMarcados.size + ' motoboys marcados');
    else toast('Erro ao salvar');
  } catch(e) { toast('Erro de conexão'); }
}
