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
}

function fecharMenuOverlay(e) {
  if (e.target === document.getElementById('menu-overlay')) fecharMenu();
}

function fecharModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

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
