// ============================================================
// ── CORE — Funções base, navegação e utilitários ──────────────────────────
// ============================================================
// ── VARIÁVEIS ──
const API = 'https://confirmacaoderota.willlog99.workers.dev';
const _diaSemana = new Date().getDay();
let autoRefreshInterval = null;
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
  if (typeof atualizarBreadcrumb === 'function') atualizarBreadcrumb(id);
  if (id === 'painel') {
    if (typeof carregarPainel === 'function') carregarPainel();
    iniciarAutoRefresh();
    iniciarMiniMapa();
  }
  if (id === 'confirmacoes' && typeof carregarConfirmacoes === 'function') carregarConfirmacoes();
  if (id === 'motoristas' && typeof carregarMotoristasList === 'function') carregarMotoristasList();
  if (id === 'rotas-view' && typeof carregarRotasView === 'function') carregarRotasView();
  if (id === 'checklist-view' && typeof carregarChecklists === 'function') carregarChecklists();
  if (id === 'checklists-incompletos' && typeof carregarChecklistsIncompletos === 'function') carregarChecklistsIncompletos();
  if (id === 'gerenciar-motoboys' && typeof carregarMotoboysGerenciar === 'function') carregarMotoboysGerenciar();
  if (id === 'ponto-rh' && typeof iniciarPontoRH === 'function') iniciarPontoRH();
  if (id === 'estoque-view' && typeof iniciarEstoqueView === 'function') iniciarEstoqueView();
  if (id === 'patrimonios' && typeof iniciarPatrimonios === 'function') iniciarPatrimonios();
  if (id === 'importacao' && typeof iniciarImportacao === 'function') iniciarImportacao();
  if (id === 'presencas' && typeof carregarPresencas === 'function') carregarPresencas();
  if (id === 'mapa-rastreamento') {
    setTimeout(() => {
      if (typeof iniciarLeafletMap === 'function') iniciarLeafletMap();
      if (typeof carregarMapa === 'function') carregarMapa();
      if (typeof iniciarAutoRefreshMapa === 'function') iniciarAutoRefreshMapa();
      carregarKMDia();
    }, 100);
  }
  if (id === 'geofence-config' && typeof carregarGeofenceConfig === 'function') carregarGeofenceConfig();
  if (id === 'gestor' && typeof renderItensAuditoria === 'function') renderItensAuditoria();
  if (id === 'quilometragem' && typeof carregarKmCompleto === 'function') carregarKmCompleto();
}
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = (type==='loading'?'<span class="spinner"></span>':'')+text;
  el.className = 'msg'+(type?' '+type:'');
}
function toast(msg) {
  const el = document.getElementById('toast');
  if(!el) { console.log(msg); return; }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}
function formatarTelefone(t) {
  const s = String(t||'').replace(/\D/g,'');
  return s.length === 11 ? '(' + s.slice(0,2) + ') ' + s.slice(2,7) + '-' + s.slice(7) : t;
}
// ── GEOFENCE CONFIG ──────────────────────────────────────────
let _gfPassagens = 1;

function gfSelecionarPassagem(n, btn) {
  _gfPassagens = n;
  [1,2,3].forEach(i => {
    const b = document.getElementById('gf-btn-' + i);
    if (b) {
      b.style.background = i === n ? '#0F4C7A' : '#fff';
      b.style.color = i === n ? '#fff' : '#5A7A8F';
      b.style.borderColor = i === n ? '#0F4C7A' : '#D6E5EE';
    }
  });
}

async function carregarGeofenceConfig() {
  const lista = document.getElementById('gf-lista');
  const sel = document.getElementById('gf-rota-sel');
  if (!lista) return;

  // Reset passagens para 1
  gfSelecionarPassagem(1, document.getElementById('gf-btn-1'));

  try {
    const [rRes, gRes] = await Promise.all([
      fetch(API + '/rotas-disponiveis?todos_dias=1'),
      fetch(API + '/geofence-config')
    ]);
    const dRotas = await rRes.json();
    const dGeo = await gRes.json();
    const rotas = (dRotas.rotas || []).map(r => r.rota).sort();
    const configs = dGeo.configs || [];

    if (sel) {
      sel.innerHTML = '<option value="">Selecione...</option>';
      rotas.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
    }

    if (!configs.length) {
      lista.innerHTML = '<div class="empty" style="font-size:12px">Nenhuma configuração — todas as rotas usam 1ª passagem</div>';
      return;
    }

    // Agrupa por rota
    const porRota = {};
    configs.forEach(c => { if (!porRota[c.rota]) porRota[c.rota] = []; porRota[c.rota].push(c); });

    const labelDia = d => ({ seg:'Segunda', ter:'Terça', qua:'Quarta', qui:'Quinta', sex:'Sexta', sab:'Sábado', dom:'Domingo' })[d] || d;
    const corPass = p => p === 3 ? { bg:'#FEF2F2', cor:'#991B1B' } : p === 2 ? { bg:'#FEF9EC', cor:'#92400E' } : { bg:'#EFF6FF', cor:'#1D4ED8' };

    lista.innerHTML = Object.entries(porRota).map(([rota, dias]) => `
      <div style="border-bottom:1px solid #F0F4F8">
        <div style="padding:8px 14px;font-size:12px;font-weight:700;color:#0F4C7A;background:#F8FBFD">${rota}</div>
        ${dias.map(c => {
          const cp = corPass(c.passagens);
          return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px 8px 24px">
            <div style="flex:1;font-size:12px;color:#5A7A8F">${labelDia(c.dia_semana)}</div>
            <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${cp.bg};color:${cp.cor}">${c.passagens}ª passagem</span>
            <button onclick="removerGeofence('${rota.replace(/'/g,"\\'")}','${c.dia_semana}')" style="background:none;border:none;color:#EF4444;font-size:13px;cursor:pointer;flex-shrink:0">✕</button>
          </div>`;
        }).join('')}
      </div>`).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

async function salvarGeofence() {
  const rota = document.getElementById('gf-rota-sel')?.value;
  const dia_semana = document.getElementById('gf-dia-sel')?.value;
  if (!rota) { toast('Selecione uma rota'); return; }
  if (!dia_semana) { toast('Selecione o dia'); return; }
  try {
    await fetch(API + '/geofence-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rota, dia_semana, passagens: _gfPassagens })
    });
    toast('✓ ' + rota + ' · ' + dia_semana + ' — ' + _gfPassagens + 'ª passagem salva');
    carregarGeofenceConfig();
  } catch(e) { toast('Erro ao salvar'); }
}

async function removerGeofence(rota, dia_semana) {
  const label = dia_semana ? rota + ' · ' + dia_semana : rota;
  if (!confirm('Remover configuração de ' + label + '?')) return;
  try {
    await fetch(API + '/geofence-config', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rota, dia_semana })
    });
    toast('✓ Configuração removida');
    carregarGeofenceConfig();
  } catch(e) { toast('Erro ao remover'); }
}

// ── NOTIFICAÇÕES MOTOBOY ─────────────────────────────────────
function abrirNotificacoes() {
  const win = document.getElementById('notif-window');
  if (win) { win.style.display = win.style.display === 'none' ? 'flex' : 'none'; if (win.style.display === 'flex') carregarNotificacoes(); return; }

  const el = document.createElement('div');
  el.id = 'notif-window';
  el.style.cssText = 'position:fixed;bottom:20px;right:60px;width:380px;max-width:calc(100vw - 80px);background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.2);z-index:9998;display:flex;flex-direction:column;max-height:560px';
  el.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #EBF1F5;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <div style="font-size:14px;font-weight:700;color:#0F4C7A">📢 Notificações aos Motoboys</div>
      <button onclick="document.getElementById('notif-window').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94A8B8">✕</button>
    </div>

    <!-- Formulário -->
    <div style="padding:14px 16px;border-bottom:1px solid #EBF1F5;flex-shrink:0">
      <input id="notif-titulo" type="text" placeholder="Título (opcional)" style="width:100%;height:36px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 10px;font-size:12px;outline:none;color:#0F4C7A;margin-bottom:8px"/>
      <textarea id="notif-msg" placeholder="Mensagem para os motoboys..." style="width:100%;height:70px;border-radius:8px;border:1.5px solid #D6E5EE;padding:8px 10px;font-size:12px;outline:none;color:#0F4C7A;resize:none;margin-bottom:8px;font-family:inherit"></textarea>
      <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center">
        <input id="notif-img" type="text" placeholder="URL da imagem (opcional)" style="flex:1;height:32px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 8px;font-size:11px;outline:none;color:#0F4C7A"/>
      </div>
      <div style="display:flex;gap:6px">
        <select id="notif-dest" style="flex:1;height:34px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 8px;font-size:12px;color:#0F4C7A;outline:none">
          <option value="todos">📢 Todos os motoboys</option>
        </select>
        <button onclick="enviarNotificacao()" style="padding:0 14px;height:34px;border-radius:8px;border:none;background:#0F4C7A;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Enviar</button>
      </div>
    </div>

    <!-- Lista enviadas -->
    <div style="flex:1;overflow-y:auto">
      <div id="notif-lista" style="padding:8px"></div>
    </div>`;
  document.body.appendChild(el);

  // Popula select de destinatários
  fetch(API + '/motoboys?todos=1&agrupado=1').then(r => r.json()).then(d => {
    const sel = document.getElementById('notif-dest');
    if (!sel) return;
    const nomes = [...new Set((d.motoboys||[]).map(m => m.nome))].sort();
    nomes.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = '👤 ' + n; sel.appendChild(o); });
  }).catch(() => {});

  carregarNotificacoes();
}

async function enviarNotificacao() {
  const titulo = document.getElementById('notif-titulo')?.value?.trim();
  const mensagem = document.getElementById('notif-msg')?.value?.trim();
  const imagem_url = document.getElementById('notif-img')?.value?.trim();
  const destinatario = document.getElementById('notif-dest')?.value;
  if (!mensagem) { toast('Digite uma mensagem'); return; }
  try {
    await fetch(API + '/notificacao-motoboy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, mensagem, imagem_url, destinatario, enviada_por: 'admin' })
    });
    document.getElementById('notif-titulo').value = '';
    document.getElementById('notif-msg').value = '';
    document.getElementById('notif-img').value = '';
    toast('✓ Notificação enviada!');
    carregarNotificacoes();
  } catch(e) { toast('Erro ao enviar'); }
}

async function carregarNotificacoes() {
  const lista = document.getElementById('notif-lista');
  if (!lista) return;
  lista.innerHTML = '<div style="text-align:center;padding:1rem;color:#94A8B8;font-size:12px">Carregando...</div>';
  try {
    const [rNotif, rMb] = await Promise.all([
      fetch(API + '/notificacao-motoboy?admin=1'),
      fetch(API + '/motoboys?todos=1&agrupado=1')
    ]);
    const dNotif = await rNotif.json();
    const dMb = await rMb.json();
    const totalMotoboys = (dMb.motoboys || []).length;
    const notifs = dNotif.notificacoes || [];

    if (!notifs.length) {
      lista.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#94A8B8;font-size:12px">Nenhuma notificação enviada hoje</div>';
      return;
    }

    lista.innerHTML = notifs.map(n => {
      let lidas = [];
      try { lidas = JSON.parse(n.lida_por || '[]'); } catch(e) {}
      const qtdLidas = lidas.length;
      const total = n.destinatario === 'todos' ? totalMotoboys : 1;
      const hora = new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      const pct = total > 0 ? Math.round(qtdLidas/total*100) : 0;
      const corPct = pct === 100 ? '#0F9B78' : pct > 0 ? '#F59E0B' : '#94A8B8';

      return `<div style="background:#F8FBFD;border-radius:10px;padding:10px 12px;margin-bottom:8px;border:1px solid #EBF1F5">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
          <div style="flex:1;min-width:0">
            ${n.titulo ? `<div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:2px">${n.titulo}</div>` : ''}
            <div style="font-size:12px;color:#0F2940;line-height:1.4">${n.mensagem}</div>
            ${n.imagem_url ? `<img src="${n.imagem_url}" style="margin-top:6px;max-width:100%;border-radius:6px;max-height:120px;object-fit:cover"/>` : ''}
          </div>
          <button onclick="deletarNotificacao(${n.id})" style="background:none;border:none;color:#EF4444;font-size:13px;cursor:pointer;flex-shrink:0">✕</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:#94A8B8">${hora} · ${n.destinatario === 'todos' ? 'Todos' : n.destinatario}</span>
          <div style="flex:1;height:3px;background:#E2E8F0;border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${corPct};border-radius:99px;transition:width .4s"></div>
          </div>
          <span style="font-size:10px;font-weight:700;color:${corPct}">${qtdLidas}/${total} viram</span>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    lista.innerHTML = '<div style="text-align:center;padding:1rem;color:#EF4444;font-size:12px">Erro ao carregar</div>';
  }
}

async function deletarNotificacao(id) {
  if (!confirm('Remover esta notificação?')) return;
  try {
    await fetch(API + '/notificacao-motoboy', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast('✓ Removida');
    carregarNotificacoes();
  } catch(e) { toast('Erro ao remover'); }
}

// ── MANUTENÇÃO ────────────────────────────────────────────────
let _manutencaoAtiva = false;

async function verificarStatusManutencao() {
  try {
    const r = await fetch(API + '/manutencao');
    const d = await r.json();
    _manutencaoAtiva = d.ativo;
    const btn = document.getElementById('btn-manutencao-fab');
    if (btn) {
      btn.style.background = _manutencaoAtiva
        ? 'linear-gradient(135deg,#EF4444,#DC2626)'
        : 'linear-gradient(135deg,#F59E0B,#D97706)';
      btn.title = _manutencaoAtiva ? '🔧 Manutenção ATIVA — clique para desligar' : 'Ativar modo manutenção';
      btn.textContent = _manutencaoAtiva ? '🚨' : '🔧';
    }
  } catch(e) {}
}

async function toggleManutencao() {
  const novoStatus = !_manutencaoAtiva;
  if (novoStatus) {
    const msg = prompt('Mensagem para os motoboys (deixe em branco para padrão):', 'Sistema em manutenção. Voltamos em breve!');
    if (msg === null) return; // cancelou
    try {
      await fetch(API + '/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: true, mensagem: msg || 'Sistema em manutenção. Voltamos em breve!' })
      });
      _manutencaoAtiva = true;
      toast('🔧 Sistema em manutenção — app bloqueado para motoboys');
    } catch(e) { toast('Erro ao ativar manutenção'); }
  } else {
    if (!confirm('Desligar modo manutenção? Os motoboys poderão acessar o app novamente.')) return;
    try {
      await fetch(API + '/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false })
      });
      _manutencaoAtiva = false;
      toast('✓ Sistema online — motoboys podem acessar novamente');
    } catch(e) { toast('Erro ao desligar manutenção'); }
  }
  verificarStatusManutencao();
}

// Verifica status ao carregar
setTimeout(verificarStatusManutencao, 1000);

function iniciarAutoRefresh() {
  pararAutoRefresh();
  autoRefreshInterval = setInterval(() => {
    if (typeof carregarPainel === 'function') carregarPainel(true);
  }, 30000);
}
function pararAutoRefresh() {
  if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
  if (typeof pararAutoRefreshMapa === 'function') pararAutoRefreshMapa();
}
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
      if (typeof carregarPainel === 'function') carregarPainel();
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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom:19, subdomains:'abcd'
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
let _rotasListaAberta = true;
function toggleRotasLista() {
  const wrap = document.getElementById('painel-rotas-wrap');
  const btn = document.getElementById('rotas-toggle-btn');
  if (!wrap) return;
  _rotasListaAberta = !_rotasListaAberta;
  wrap.style.display = _rotasListaAberta ? 'block' : 'none';
  if (btn) {
    btn.textContent = _rotasListaAberta ? '▾' : '▸';
    btn.style.background = _rotasListaAberta ? '#F0F4F8' : '#E8F4FB';
    btn.style.color = _rotasListaAberta ? '#5A7A8F' : '#1E9FD9';
  }
}

function atualizarVersaoApp() {
  // Cria modal de publicação
  if (document.getElementById('modal-live-update')) {
    document.getElementById('modal-live-update').style.display = 'flex';
    return;
  }
  const modal = document.createElement('div');
  modal.id = 'modal-live-update';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,75,122,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:1.75rem;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <div style="font-size:16px;font-weight:700;color:#0F4C7A">📲 Publicar Atualização</div>
        <button onclick="document.getElementById('modal-live-update').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:#5A7A8F">✕</button>
      </div>
      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;display:block;margin-bottom:5px">Versão (ex: 1.0.1)</label>
        <input type="text" id="lu-versao" placeholder="1.0.1" style="width:100%;border-radius:10px;border:1.5px solid #D6E5EE;padding:10px 12px;font-size:14px;outline:none;color:#0F4C7A"/>
      </div>
      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;display:block;margin-bottom:5px">Bundle (.zip com arquivos www/)</label>
        <input type="file" id="lu-arquivo" accept=".zip" style="width:100%;border-radius:10px;border:1.5px solid #D6E5EE;padding:10px 12px;font-size:13px;outline:none;color:#0F4C7A"/>
      </div>
      <div style="background:#F7FBFD;border-radius:10px;padding:10px 12px;margin-bottom:1rem;font-size:12px;color:#5A7A8F;line-height:1.5">
        💡 Zipar apenas o conteúdo da pasta <strong>www/</strong> (sem a pasta raiz)<br>
        O app vai baixar e aplicar automaticamente ao abrir
      </div>
      <div id="lu-msg" style="display:none;margin-bottom:1rem"></div>
      <button onclick="publicarBundle()" style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px">🚀 Publicar agora</button>
      <button onclick="limparUpdate()" style="width:100%;padding:11px;border-radius:12px;border:1.5px solid #E2E8F0;background:#fff;color:#EF4444;font-size:13px;font-weight:600;cursor:pointer">🗑 Limpar update ativo (remove banner do app)</button>
    </div>
  `;
  document.body.appendChild(modal);
}

async function limparUpdate() {
  if (!confirm('Remover o update ativo? O banner vai sumir do app.')) return;
  try {
    const r = await fetch(API + '/limpar-update', { method: 'POST' });
    const d = await r.json();
    if (d.status === 'ok') {
      toast('✓ Update removido — banner não aparece mais');
      document.getElementById('modal-live-update').style.display = 'none';
    }
  } catch(e) { toast('Erro ao limpar update'); }
}

async function publicarBundle() {
  const versao  = document.getElementById('lu-versao')?.value?.trim();
  const arquivo = document.getElementById('lu-arquivo')?.files?.[0];
  const msg = document.getElementById('lu-msg');

  if (!versao) { if(msg){msg.style.display='block';msg.innerHTML='<div style="color:#EF4444;font-size:12px">⚠️ Informe a versão</div>'} return; }
  if (!arquivo) { if(msg){msg.style.display='block';msg.innerHTML='<div style="color:#EF4444;font-size:12px">⚠️ Selecione o arquivo .zip</div>'} return; }

  if(msg){msg.style.display='block';msg.innerHTML='<div style="color:#8B5CF6;font-size:12px">⏳ Enviando bundle...</div>'}

  const form = new FormData();
  form.append('bundle', arquivo);
  form.append('versao', versao);

  try {
    const r = await fetch(API + '/publicar-update', { method: 'POST', body: form });
    const d = await r.json();
    if (d.status === 'ok') {
      if(msg){msg.innerHTML='<div style="color:#0F9B78;font-size:12px">✅ Versão ' + d.versao + ' publicada! Os apps vão atualizar ao abrir.</div>'}
      toast('✓ Versão ' + d.versao + ' publicada com sucesso');
    } else {
      if(msg){msg.innerHTML='<div style="color:#EF4444;font-size:12px">❌ Erro: ' + (d.msg||'falha desconhecida') + '</div>'}
    }
  } catch(e) {
    if(msg){msg.innerHTML='<div style="color:#EF4444;font-size:12px">❌ Erro de conexão</div>'}
  }
}
// ── MAPA RASTREAMENTO ────────────────────────────────────────
let leafletMap = null;
let leafletMarkers = {};
let leafletTrajetos = {}; // polylines de trajeto por motoboy
let mapaRefreshInterval = null;
let mapaSyncTimer = null;
let mapaSyncSegundos = 120;
const CORES_MB = ['#0F9B78','#8B5CF6','#1E9FD9','#F59E0B','#DC2626','#0F4C7A','#EC4899','#14B8A6'];
// Dados da última busca — usados para atualizar tempos a cada segundo
let _ultimosLocsMapa = [];
let _ultimosOfflineMapa = [];
let _timerTempoLista = null;

function iniciarAutoRefreshMapa() {
  pararAutoRefreshMapa();
  mapaSyncSegundos = 10;
  mapaSyncTimer = setInterval(() => {
    mapaSyncSegundos--;
    const el = document.getElementById('mapa-sync-countdown');
    const bar = document.getElementById('mapa-sync-bar');
    if (el) el.textContent = '0:'+String(mapaSyncSegundos).padStart(2,'0');
    if (bar) bar.style.width = ((10-mapaSyncSegundos)/10*100)+'%';
    if (mapaSyncSegundos <= 0) { mapaSyncSegundos = 10; carregarMapa(); carregarKMDia(); }
  }, 1000);

  // Atualiza só os tempos da lista a cada segundo sem nova requisição
  _timerTempoLista = setInterval(() => {
    if (_ultimosLocsMapa.length > 0) {
      const agora = Date.now();
      const ONLINE_LIM = 5*60*1000;
      const IDLE_LIM = 10*60*1000;
      renderizarListaMapa(_ultimosLocsMapa, _ultimosOfflineMapa, agora, ONLINE_LIM, IDLE_LIM);
    }
  }, 1000);
}
function pararAutoRefreshMapa() {
  if (mapaRefreshInterval) { clearInterval(mapaRefreshInterval); mapaRefreshInterval = null; }
  if (mapaSyncTimer) { clearInterval(mapaSyncTimer); mapaSyncTimer = null; }
  if (_timerTempoLista) { clearInterval(_timerTempoLista); _timerTempoLista = null; }
}
function iniciarLeafletMap() {
  if (leafletMap) return;
  const el = document.getElementById('leaflet-map');
  if (!el) return;
  if (typeof L === 'undefined') { setTimeout(iniciarLeafletMap, 500); return; }
  leafletMap = L.map('leaflet-map', { zoomControl: true }).setView([-23.5505, -46.6330], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19, subdomains: 'abcd'
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
    // Quem passou de 10min sem enviar vai para offline
    const locsAtivos = locs.filter(l => agora-l.timestamp < IDLE_LIM);
    const comSinal = new Set(locsAtivos.map(l => l.nome));
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
          <div style="margin-top:8px;display:flex;gap:6px">
            <button onclick="verTrajeto('${l.nome.replace(/'/g,"\\'")}',this)" style="flex:1;padding:5px 8px;border-radius:7px;border:none;background:#0F4C7A;color:#fff;font-size:11px;font-weight:700;cursor:pointer">🗺️ Trajeto</button>
            <button onclick="limparTrajeto('${l.nome.replace(/'/g,"\\'")}',this)" style="flex:1;padding:5px 8px;border-radius:7px;border:1.5px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:11px;font-weight:600;cursor:pointer">✕ Limpar</button>
          </div>
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
    renderizarListaMapa(locsAtivos, offline, agora, ONLINE_LIM, IDLE_LIM);
    // Salva para atualização de tempo a cada segundo
    _ultimosLocsMapa = locsAtivos;
    _ultimosOfflineMapa = offline;
  } catch(e) {
    const el = document.getElementById('mapa-lista-motoboys');
    if(el) el.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}
async function verTrajeto(nome, btn) {
  if (!leafletMap) return;
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  try {
    const hoje = new Date();
    const diaSP = new Date(hoje.getTime() - 3*60*60*1000);
    const data = diaSP.toISOString().split('T')[0];

    const r = await fetch(API + '/localizacao?dia=' + data);
    const d = await r.json();
    const pontos = (d.historico || []).filter(p => p.nome === nome);

    if (pontos.length < 2) {
      toast('Menos de 2 pontos GPS hoje para ' + nome.split(' ')[0]);
      if (btn) { btn.textContent = '🗺️ Trajeto'; btn.disabled = false; }
      return;
    }

    // Remove trajeto anterior se existir
    limparTrajeto(nome);

    // Cor baseada no índice do motoboy
    const CORES_MB = ['#1E9FD9','#0F9B78','#F59E0B','#8B5CF6','#EF4444','#EC4899','#06B6D4','#84CC16'];
    const idx = Object.keys(leafletMarkers).indexOf(nome);
    const cor = CORES_MB[idx % CORES_MB.length] || '#1E9FD9';

    // Desenha a linha do trajeto
    const coords = pontos.map(p => [p.lat, p.lng]);
    const polyline = L.polyline(coords, {
      color: cor,
      weight: 3,
      opacity: 0.8,
      dashArray: null
    }).addTo(leafletMap);

    // Marca início e fim
    const inicio = pontos[0];
    const fim = pontos[pontos.length - 1];
    const marcadorInicio = L.circleMarker([inicio.lat, inicio.lng], {
      radius: 7, color: '#fff', fillColor: '#16A34A', fillOpacity: 1, weight: 2
    }).addTo(leafletMap).bindTooltip('🟢 Início ' + new Date(inicio.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}));

    const marcadorFim = L.circleMarker([fim.lat, fim.lng], {
      radius: 7, color: '#fff', fillColor: cor, fillOpacity: 1, weight: 2
    }).addTo(leafletMap).bindTooltip('📍 Último ponto ' + new Date(fim.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}));

    leafletTrajetos[nome] = { polyline, marcadorInicio, marcadorFim };

    // Zoom no trajeto
    leafletMap.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    toast('✓ Trajeto de ' + nome.split(' ')[0] + ' — ' + pontos.length + ' pontos');

  } catch(e) {
    toast('Erro ao carregar trajeto');
  }
  if (btn) { btn.textContent = '🗺️ Trajeto'; btn.disabled = false; }
}

function limparTrajeto(nome, btn) {
  if (leafletTrajetos[nome]) {
    const t = leafletTrajetos[nome];
    if (t.polyline) leafletMap.removeLayer(t.polyline);
    if (t.marcadorInicio) leafletMap.removeLayer(t.marcadorInicio);
    if (t.marcadorFim) leafletMap.removeLayer(t.marcadorFim);
    delete leafletTrajetos[nome];
  }
}

function limparTodosTrajetos() {
  Object.keys(leafletTrajetos).forEach(nome => limparTrajeto(nome));
}

function focarMotoboy(nome) {
  const marker = leafletMarkers[nome];
  if (marker && leafletMap) {
    leafletMap.setView(marker.getLatLng(), 16, { animate:true, duration:0.8 });
    marker.openPopup();
  }
}
function iconeFabricante(fab) {
  if (!fab) return '';
  const f = fab.toLowerCase();
  if (f.includes('samsung'))  return '🔵'; // Samsung
  if (f.includes('xiaomi') || f.includes('redmi') || f.includes('poco')) return '🟠'; // Xiaomi
  if (f.includes('huawei') || f.includes('honor')) return '🔴'; // Huawei
  if (f.includes('motorola') || f.includes('moto')) return '⚫'; // Motorola
  if (f.includes('oppo') || f.includes('realme') || f.includes('oneplus')) return '🟢'; // Oppo/OnePlus
  if (f.includes('vivo')) return '🟡'; // Vivo
  if (f.includes('lg')) return '🟣'; // LG
  if (f.includes('sony')) return '⬜'; // Sony
  return '📱'; // outros
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
    const fabIcon = iconeFabricante(l.fabricante || '');
    html += `<div onclick="focarMotoboy('${l.nome.replace(/'/g,"\\'")}') " style="padding:10px 14px;border-bottom:1px solid #F5F9FC;cursor:pointer;display:flex;align-items:center;gap:10px;transition:.15s" onmouseover="this.style.background='#E8F4FB'" onmouseout="this.style.background='#fff'">
      <div style="width:34px;height:34px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${iniciais}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:#0F2940">${l.nome} ${fabIcon}</div>
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
      html += `<div onclick="presencasToggle('${m.nome.replace(/'/g,"\\'")}') "
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
async function iniciarImportacao() {
  const sel = document.getElementById('chk-download-motoboy');
  if(sel && sel.options.length <= 1) {
    try {
      const r = await fetch(API+'/motoboys?todos=1&agrupado=1');
      const d = await r.json();
      const nomes = [...new Set((d.motoboys||[]).map(m=>m.nome))].sort();
      nomes.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
    } catch(e) {}
  }
  const dataEl = document.getElementById('chk-download-data');
  if(dataEl && !dataEl.value) dataEl.value = new Date().toISOString().split('T')[0];
}
// ── KM RODADO + HORÁRIOS ─────────────────────────────────────
async function carregarKMDia() {
  const el = document.getElementById('mapa-km-lista');
  if (!el) return;
  try {
    const rLoc = await fetch(API + '/localizacao');
    const dLoc = await rLoc.json();
    const locs = dLoc.localizacoes || [];
    if (!locs.length) {
      el.innerHTML = '<div style="font-size:11px;color:#94A8B8;text-align:center;padding:8px">Nenhum motoboy online</div>';
      return;
    }
    const hoje = new Date();
    const diaSP = new Date(hoje.getTime() - 3*60*60*1000);
    const data = diaSP.toISOString().split('T')[0];
    const promises = locs.map(async l => {
      try {
        const r = await fetch(`${API}/km-rodado?nome=${encodeURIComponent(l.nome)}&data=${data}`);
        const d = await r.json();
        return { nome: l.nome, km: d.km || 0, horario: d.horario };
      } catch(e) { return { nome: l.nome, km: 0 }; }
    });
    const resultados = await Promise.all(promises);
    resultados.sort((a,b) => b.km - a.km);
    el.innerHTML = resultados.map(r => {
      const iniciais = r.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
      const cor = r.km > 50 ? '#0F9B78' : r.km > 20 ? '#1E9FD9' : '#5A7A8F';
      const horario = r.horario ? `${r.horario.inicio}–${r.horario.fim}` : '—';
      return `<div style="display:flex;align-items:center;gap:7px;padding:5px 4px;border-radius:7px;margin-bottom:3px">
        <div style="width:24px;height:24px;border-radius:50%;background:#E8F4FB;color:#0F4C7A;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${iniciais}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;color:#0F2940;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.nome.split(' ')[0]}</div>
          <div style="font-size:9px;color:#94A8B8">${horario}</div>
        </div>
        <div style="font-size:13px;font-weight:800;color:${cor};flex-shrink:0">${r.km}km</div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="font-size:11px;color:#94A8B8;text-align:center;padding:8px">Erro ao carregar</div>';
  }
}

async function carregarKmCompleto() {
  const lista = document.getElementById('km-lista-completa');
  const elTotal = document.getElementById('km-total-dia');
  const elMedia = document.getElementById('km-media-dia');
  const elAtivos = document.getElementById('km-ativos-dia');
  const elLabel = document.getElementById('km-data-label');
  const filtroEl = document.getElementById('km-data-filtro');

  if (filtroEl && !filtroEl.value) {
    const hoje = new Date();
    const diaSP = new Date(hoje.getTime() - 3 * 60 * 60 * 1000);
    filtroEl.value = diaSP.toISOString().split('T')[0];
  }
  const data = (filtroEl && filtroEl.value) ? filtroEl.value : new Date().toISOString().split('T')[0];
  const partes = data.split('-');
  if (elLabel) elLabel.textContent = partes[2] + '/' + partes[1] + '/' + partes[0];
  if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8;font-size:13px">Carregando...</div>';

  try {
    const rMb = await fetch(API + '/motoboys?todos=1&agrupado=1');
    const dMb = await rMb.json();
    const nomes = Array.from(new Set((dMb.motoboys || []).map(function(m) { return m.nome; }))).sort();

    const promises = nomes.map(function(nome) {
      return fetch(API + '/km-rodado?nome=' + encodeURIComponent(nome) + '&data=' + data)
        .then(function(r) { return r.json(); })
        .then(function(d) { return { nome: nome, km: d.km || 0, horario: d.horario }; })
        .catch(function() { return { nome: nome, km: 0 }; });
    });

    const resultados = await Promise.all(promises);
    const comKm = resultados.filter(function(r) { return r.km > 0; });
    resultados.sort(function(a, b) { return b.km - a.km; });

    const totalKm = comKm.reduce(function(s, r) { return s + r.km; }, 0);
    const mediaKm = comKm.length > 0 ? (totalKm / comKm.length).toFixed(1) : 0;
    const maxKm = Math.max.apply(null, resultados.map(function(x) { return x.km; }).concat([1]));

    if (elTotal) elTotal.textContent = totalKm.toFixed(1) + 'km';
    if (elMedia) elMedia.textContent = mediaKm + 'km';
    if (elAtivos) elAtivos.textContent = comKm.length;

    if (!lista) return;
    if (!resultados.length) {
      lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8">Nenhum dado</div>';
      return;
    }

    var html = '';
    resultados.forEach(function(r) {
      var cor = r.km > 50 ? '#0F9B78' : r.km > 20 ? '#1E9FD9' : '#5A7A8F';
      var barPct = Math.min(100, (r.km / maxKm) * 100);
      var iniciais = r.nome.split(' ').map(function(p) { return p[0]; }).slice(0, 2).join('');
      var horario = r.horario ? (r.horario.inicio + ' – ' + r.horario.fim) : '—';
      var bgCor = r.km > 0 ? '#E8F4FB' : '#F3F4F6';
      var txtCor = r.km > 0 ? '#0F4C7A' : '#9CA3AF';
      var kmTxt = r.km > 0 ? r.km + 'km' : '—';
      html += '<div style="padding:12px 14px;border-bottom:1px solid #F5F9FC;display:flex;align-items:center;gap:12px">';
      html += '<div style="width:34px;height:34px;border-radius:50%;background:' + bgCor + ';color:' + txtCor + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">' + iniciais + '</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r.nome + '</div>';
      html += '<div style="font-size:10px;color:#94A8B8;margin-top:2px">⏰ ' + horario + '</div>';
      html += '<div style="margin-top:5px;height:4px;background:#F0F4F8;border-radius:4px;overflow:hidden"><div style="height:100%;width:' + barPct + '%;background:' + cor + ';border-radius:4px"></div></div>';
      html += '</div>';
      html += '<div style="font-size:16px;font-weight:800;color:' + cor + ';flex-shrink:0;min-width:52px;text-align:right">' + kmTxt + '</div>';
      html += '</div>';
    });
    lista.innerHTML = html;

  } catch(e) {
    if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#EF4444">Erro ao carregar</div>';
  }
}
// ── QUILOMETRAGEM ─────────────────────────────────────────────
let _kmDadosAtual = []; // Cache para exportação
let _kmAbaAtual = 'dia';

function kmMudarAba(aba, el) {
  _kmAbaAtual = aba;
  document.querySelectorAll('[id^="km-tab-btn-"]').forEach(b => {
    b.style.color = '#6B7280';
    b.style.borderBottomColor = 'transparent';
  });
  el.style.color = '#0F9B78';
  el.style.borderBottomColor = '#0F9B78';

  // Mostra filtro certo
  ['dia','periodo','motoboy','rota'].forEach(a => {
    const el2 = document.getElementById('km-filtro-' + a);
    if (el2) el2.style.display = a === aba ? 'flex' : 'none';
  });

  // Popula selects se necessário
  if (aba === 'motoboy') kmPopularSelectMotoboy();
  if (aba === 'rota') kmPopularSelectRota();

  // Título da tabela
  const titulos = { dia: 'KM por motoboy', periodo: 'KM por motoboy no período', motoboy: 'Histórico do motoboy', rota: 'KM por rota' };
  const t = document.getElementById('km-tabela-titulo');
  if (t) t.textContent = titulos[aba] || 'KM';

  // Limpa resultados
  const lista = document.getElementById('km-lista-completa');
  if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8;font-size:13px">Selecione os filtros e clique em Buscar</div>';
  kmZerarKPIs();
}

function kmZerarKPIs() {
  ['km-total-dia','km-media-dia','km-ativos-dia','km-maior-dia'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });
}

async function kmPopularSelectMotoboy() {
  const sel = document.getElementById('km-sel-motoboy');
  if (!sel || sel.options.length > 1) return;
  try {
    const r = await fetch(API + '/motoboys?todos=1&agrupado=1');
    const d = await r.json();
    const nomes = [...new Set((d.motoboys||[]).map(m => m.nome))].sort();
    nomes.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  } catch(e) {}
}

async function kmPopularSelectRota() {
  const sel = document.getElementById('km-sel-rota');
  if (!sel || sel.options.length > 1) return;
  try {
    const r = await fetch(API + '/rotas-disponiveis?todos_dias=1');
    const d = await r.json();
    (d.rotas||[]).forEach(r => { const o = document.createElement('option'); o.value = r.rota; o.textContent = r.rota; sel.appendChild(o); });
  } catch(e) {}
}

function kmDataAtual() {
  const hoje = new Date();
  const diaSP = new Date(hoje.getTime() - 3*60*60*1000);
  return diaSP.toISOString().split('T')[0];
}

function kmFormatarData(data) {
  const p = data.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

function kmAtualizarKPIs(resultados) {
  const comKm = resultados.filter(r => r.km > 0);
  const totalKm = comKm.reduce((s,r) => s + r.km, 0);
  const mediaKm = comKm.length > 0 ? (totalKm / comKm.length).toFixed(1) : 0;
  const maiorKm = comKm.length > 0 ? Math.max(...comKm.map(r => r.km)) : 0;
  const elTotal = document.getElementById('km-total-dia');
  const elMedia = document.getElementById('km-media-dia');
  const elAtivos = document.getElementById('km-ativos-dia');
  const elMaior = document.getElementById('km-maior-dia');
  if (elTotal) elTotal.textContent = totalKm.toFixed(1) + 'km';
  if (elMedia) elMedia.textContent = mediaKm + 'km';
  if (elAtivos) elAtivos.textContent = comKm.length;
  if (elMaior) elMaior.textContent = maiorKm + 'km';
}

function kmRenderizarLinha(r, maxKm) {
  const cor = r.km > 50 ? '#0F9B78' : r.km > 20 ? '#1E9FD9' : r.km > 0 ? '#5A7A8F' : '#D1D5DB';
  const barPct = maxKm > 0 ? Math.min(100, (r.km / maxKm) * 100) : 0;
  const iniciais = (r.nome || '').split(' ').map(p => p[0]).slice(0,2).join('');
  const bgCor = r.km > 0 ? '#E8F4FB' : '#F3F4F6';
  const txtCor = r.km > 0 ? '#0F4C7A' : '#9CA3AF';
  const kmTxt = r.km > 0 ? r.km + 'km' : '—';
  const inicio = r.horario ? r.horario.inicio : (r.inicio || '—');
  const fim = r.horario ? r.horario.fim : (r.fim || '—');
  const pontos = r.pontos || '—';

  return '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 80px;padding:11px 14px;border-bottom:1px solid #F5F9FC;align-items:center">' +
    '<div style="display:flex;align-items:center;gap:10px">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:' + bgCor + ';color:' + txtCor + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">' + iniciais + '</div>' +
      '<div style="min-width:0">' +
        '<div style="font-size:13px;font-weight:600;color:' + (r.km > 0 ? '#0F2940' : '#9CA3AF') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (r.nome || r.rota || '—') + '</div>' +
        '<div style="margin-top:3px;height:3px;background:#F0F4F8;border-radius:3px;overflow:hidden;max-width:120px">' +
          '<div style="height:100%;width:' + barPct + '%;background:' + cor + ';border-radius:3px"></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:12px;color:#5A7A8F;text-align:center">' + inicio + '</div>' +
    '<div style="font-size:12px;color:#5A7A8F;text-align:center">' + fim + '</div>' +
    '<div style="font-size:12px;color:#94A8B8;text-align:center">' + pontos + '</div>' +
    '<div style="font-size:15px;font-weight:800;color:' + cor + ';text-align:right">' + kmTxt + '</div>' +
  '</div>';
}

async function carregarKmCompleto() {
  const lista = document.getElementById('km-lista-completa');
  const filtroEl = document.getElementById('km-data-filtro');
  if (filtroEl && !filtroEl.value) filtroEl.value = kmDataAtual();
  const data = (filtroEl && filtroEl.value) ? filtroEl.value : kmDataAtual();
  const elLabel = document.getElementById('km-data-label');
  if (elLabel) elLabel.textContent = kmFormatarData(data);
  if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8;font-size:13px">Carregando...</div>';
  kmZerarKPIs();

  try {
    const rMb = await fetch(API + '/motoboys?todos=1&agrupado=1');
    const dMb = await rMb.json();
    const nomes = [...new Set((dMb.motoboys||[]).map(m => m.nome))].sort();
    const promises = nomes.map(nome =>
      fetch(API + '/km-rodado?nome=' + encodeURIComponent(nome) + '&data=' + data)
        .then(r => r.json())
        .then(d => ({ nome, km: d.km || 0, horario: d.horario, pontos: d.pontos || 0 }))
        .catch(() => ({ nome, km: 0, pontos: 0 }))
    );
    const resultados = await Promise.all(promises);
    resultados.sort((a,b) => b.km - a.km);
    _kmDadosAtual = resultados.map(r => ({ ...r, data }));
    kmAtualizarKPIs(resultados);
    const maxKm = Math.max(...resultados.map(r => r.km), 1);
    if (!lista) return;
    if (!resultados.length) { lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8">Nenhum dado</div>'; return; }
    lista.innerHTML = resultados.map(r => kmRenderizarLinha(r, maxKm)).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#EF4444">Erro ao carregar</div>';
  }
}

async function carregarKmPeriodo() {
  const inicio = document.getElementById('km-data-inicio')?.value;
  const fim = document.getElementById('km-data-fim')?.value;
  if (!inicio || !fim) { alert('Selecione data início e fim'); return; }
  const lista = document.getElementById('km-lista-completa');
  const elLabel = document.getElementById('km-data-label');
  if (elLabel) elLabel.textContent = kmFormatarData(inicio) + ' a ' + kmFormatarData(fim);
  if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8;font-size:13px">Carregando...</div>';
  kmZerarKPIs();

  try {
    const rMb = await fetch(API + '/motoboys?todos=1&agrupado=1');
    const dMb = await rMb.json();
    const nomes = [...new Set((dMb.motoboys||[]).map(m => m.nome))].sort();

    // Gerar lista de datas no período
    const datas = [];
    let cur = new Date(inicio + 'T00:00:00');
    const fim2 = new Date(fim + 'T00:00:00');
    while (cur <= fim2) {
      datas.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // Buscar KM por motoboy somando todos os dias
    const promises = nomes.map(async nome => {
      let kmTotal = 0, pontosTotal = 0, horario = null;
      for (const data of datas) {
        try {
          const r = await fetch(API + '/km-rodado?nome=' + encodeURIComponent(nome) + '&data=' + data);
          const d = await r.json();
          kmTotal += d.km || 0;
          pontosTotal += d.pontos || 0;
          if (!horario && d.horario) horario = d.horario;
        } catch(e) {}
      }
      return { nome, km: Math.round(kmTotal * 10) / 10, pontos: pontosTotal, horario, dias: datas.length };
    });

    const resultados = await Promise.all(promises);
    resultados.sort((a,b) => b.km - a.km);
    _kmDadosAtual = resultados.map(r => ({ ...r, periodo: kmFormatarData(inicio) + ' a ' + kmFormatarData(fim) }));
    kmAtualizarKPIs(resultados);
    const maxKm = Math.max(...resultados.map(r => r.km), 1);
    if (!lista) return;
    lista.innerHTML = resultados.map(r => kmRenderizarLinha(r, maxKm)).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#EF4444">Erro ao carregar</div>';
  }
}

async function carregarKmMotoboy() {
  const nome = document.getElementById('km-sel-motoboy')?.value;
  const inicio = document.getElementById('km-motoboy-inicio')?.value;
  const fim = document.getElementById('km-motoboy-fim')?.value;
  if (!nome) { alert('Selecione um motoboy'); return; }
  if (!inicio || !fim) { alert('Selecione o período'); return; }
  const lista = document.getElementById('km-lista-completa');
  const elLabel = document.getElementById('km-data-label');
  if (elLabel) elLabel.textContent = nome + ' · ' + kmFormatarData(inicio) + ' a ' + kmFormatarData(fim);
  if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8;font-size:13px">Carregando...</div>';
  kmZerarKPIs();

  try {
    const datas = [];
    let cur = new Date(inicio + 'T00:00:00');
    const fim2 = new Date(fim + 'T00:00:00');
    while (cur <= fim2) { datas.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1); }

    const promises = datas.map(async data => {
      try {
        const r = await fetch(API + '/km-rodado?nome=' + encodeURIComponent(nome) + '&data=' + data);
        const d = await r.json();
        return { nome, data, km: d.km || 0, pontos: d.pontos || 0, horario: d.horario };
      } catch(e) { return { nome, data, km: 0, pontos: 0 }; }
    });

    const resultados = await Promise.all(promises);
    _kmDadosAtual = resultados;
    kmAtualizarKPIs(resultados);
    const maxKm = Math.max(...resultados.map(r => r.km), 1);
    if (!lista) return;

    // Renderiza com data em vez de nome
    lista.innerHTML = resultados.map(r => {
      const r2 = { ...r, nome: kmFormatarData(r.data) };
      return kmRenderizarLinha(r2, maxKm);
    }).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#EF4444">Erro ao carregar</div>';
  }
}

async function carregarKmRota() {
  const rota = document.getElementById('km-sel-rota')?.value;
  const data = document.getElementById('km-rota-data')?.value || kmDataAtual();
  if (!rota) { alert('Selecione uma rota'); return; }
  const lista = document.getElementById('km-lista-completa');
  const elLabel = document.getElementById('km-data-label');
  if (elLabel) elLabel.textContent = rota + ' · ' + kmFormatarData(data);
  if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8;font-size:13px">Carregando...</div>';
  kmZerarKPIs();

  try {
    // Buscar motoboys que trabalharam nessa rota
    const rMb = await fetch(API + '/motoboys?todos=1');
    const dMb = await rMb.json();
    const motoboysDaRota = [...new Set((dMb.motoboys||[]).filter(m => m.rota === rota).map(m => m.nome))];

    const promises = motoboysDaRota.map(nome =>
      fetch(API + '/km-rodado?nome=' + encodeURIComponent(nome) + '&data=' + data)
        .then(r => r.json())
        .then(d => ({ nome, rota, km: d.km || 0, pontos: d.pontos || 0, horario: d.horario }))
        .catch(() => ({ nome, rota, km: 0, pontos: 0 }))
    );

    const resultados = await Promise.all(promises);
    resultados.sort((a,b) => b.km - a.km);
    _kmDadosAtual = resultados.map(r => ({ ...r, data }));
    kmAtualizarKPIs(resultados);
    const maxKm = Math.max(...resultados.map(r => r.km), 1);
    if (!lista) return;
    if (!resultados.length) { lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#94A8B8">Nenhum motoboy encontrado para esta rota</div>'; return; }
    lista.innerHTML = resultados.map(r => kmRenderizarLinha(r, maxKm)).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div style="padding:2rem;text-align:center;color:#EF4444">Erro ao carregar</div>';
  }
}

function kmExportarExcel() {
  if (!_kmDadosAtual.length) { alert('Nenhum dado para exportar. Faça uma busca primeiro.'); return; }
  const label = document.getElementById('km-data-label')?.textContent || 'relatorio-km';

  let csv = 'Motoboy;Data/Período;Início;Fim;Pontos GPS;KM Rodado\n';
  _kmDadosAtual.forEach(r => {
    const inicio = r.horario ? r.horario.inicio : (r.inicio || '—');
    const fim = r.horario ? r.horario.fim : (r.fim || '—');
    csv += (r.nome||'—') + ';' + (r.data ? kmFormatarData(r.data) : r.periodo||'—') + ';' + inicio + ';' + fim + ';' + (r.pontos||0) + ';' + (r.km||0) + '\n';
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'km-loglife-' + label.replace(/[^a-zA-Z0-9]/g,'-') + '.csv';
  a.click();
}

function kmExportarPDF() {
  if (!_kmDadosAtual.length) { alert('Nenhum dado para exportar. Faça uma busca primeiro.'); return; }
  const label = document.getElementById('km-data-label')?.textContent || '';
  const total = document.getElementById('km-total-dia')?.textContent || '—';
  const media = document.getElementById('km-media-dia')?.textContent || '—';
  const ativos = document.getElementById('km-ativos-dia')?.textContent || '—';

  const linhas = _kmDadosAtual.map(r => {
    const inicio = r.horario ? r.horario.inicio : '—';
    const fim = r.horario ? r.horario.fim : '—';
    const data = r.data ? kmFormatarData(r.data) : (r.periodo || '—');
    return '<tr><td>' + (r.nome||'—') + '</td><td>' + data + '</td><td>' + inicio + '</td><td>' + fim + '</td><td>' + (r.pontos||0) + '</td><td><strong>' + (r.km||0) + ' km</strong></td></tr>';
  }).join('');

  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório KM Loglife</title>' +
    '<style>body{font-family:Arial,sans-serif;padding:20px;color:#222}h1{color:#0F9B78;font-size:18px}' +
    '.kpis{display:flex;gap:16px;margin-bottom:20px}.kpi{background:#F0FDF4;border-radius:8px;padding:12px 20px;text-align:center}' +
    '.kpi-val{font-size:22px;font-weight:800;color:#0F9B78}.kpi-lbl{font-size:11px;color:#5A7A8F;text-transform:uppercase}' +
    'table{width:100%;border-collapse:collapse;font-size:13px}th{background:#0F9B78;color:#fff;padding:8px 12px;text-align:left}' +
    'td{padding:7px 12px;border-bottom:1px solid #E5E7EB}tr:nth-child(even){background:#F9FAFB}' +
    '.footer{margin-top:20px;font-size:11px;color:#9CA3AF}</style></head><body>' +
    '<h1>📏 Relatório de Quilometragem — Loglife</h1>' +
    '<p style="color:#5A7A8F;font-size:13px;margin-bottom:16px">' + label + '</p>' +
    '<div class="kpis">' +
      '<div class="kpi"><div class="kpi-val">' + total + '</div><div class="kpi-lbl">KM Total</div></div>' +
      '<div class="kpi"><div class="kpi-val">' + media + '</div><div class="kpi-lbl">Média</div></div>' +
      '<div class="kpi"><div class="kpi-val">' + ativos + '</div><div class="kpi-lbl">Motoboys</div></div>' +
    '</div>' +
    '<table><thead><tr><th>Motoboy</th><th>Data</th><th>Início</th><th>Fim</th><th>Pontos GPS</th><th>KM Rodado</th></tr></thead>' +
    '<tbody>' + linhas + '</tbody></table>' +
    '<div class="footer">Gerado em ' + new Date().toLocaleString('pt-BR') + ' · Loglife Sistema de Gestão</div>' +
    '</body></html>';

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'km-loglife-' + label.replace(/[^a-zA-Z0-9]/g,'-') + '.html';
  a.click();
}

async function limparGPSOffline() {
  if (!confirm('Remover do mapa todos os motoboys sem GPS há mais de 24h?')) return;
  try {
    const r = await fetch(API + '/limpar-localizacoes', { method: 'POST' });
    const d = await r.json();
    toast('✓ ' + (d.deletados || 0) + ' registro(s) removido(s)');
    if (typeof carregarMapa === 'function') carregarMapa();
  } catch(e) { toast('Erro ao limpar'); }
}

async function configurarHorarios() {
  const modal = document.getElementById('modal-horarios');
  const lista = document.getElementById('horarios-lista');
  if (!modal || !lista) return;
  modal.style.display = 'flex';
  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const [rMb, rHor] = await Promise.all([
      fetch(API + '/motoboys?todos=1&agrupado=1'),
      fetch(API + '/horarios-motoboy')
    ]);
    const dMb  = await rMb.json();
    const dHor = await rHor.json();
    const horariosCache = {};
    (dHor.horarios || []).forEach(h => { horariosCache[h.nome] = h; });
    const nomes = [...new Set((dMb.motoboys || []).map(m => m.nome))].sort();
    lista.innerHTML = nomes.map(nome => {
      const h = horariosCache[nome] || { hora_inicio: '06:00', hora_fim: '14:00' };
      const id = nome.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
      return `<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1.5px solid #EBF1F5;margin-bottom:6px;background:#F8FBFD">
        <div style="flex:1;font-size:13px;font-weight:600;color:#0F4C7A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nome}</div>
        <input type="time" id="hi_${id}" value="${h.hora_inicio}" style="height:32px;border-radius:6px;border:1.5px solid #D6E5EE;padding:0 6px;font-size:12px;color:#0F4C7A;width:80px;outline:none"/>
        <span style="font-size:11px;color:#94A8B8">até</span>
        <input type="time" id="hf_${id}" value="${h.hora_fim}" style="height:32px;border-radius:6px;border:1.5px solid #D6E5EE;padding:0 6px;font-size:12px;color:#0F4C7A;width:80px;outline:none"/>
        <button onclick="salvarHorario('${nome.replace(/'/g,"\\'")}','${id}')" style="height:32px;padding:0 10px;border-radius:6px;border:none;background:#0F9B78;color:#fff;font-size:11px;font-weight:700;cursor:pointer">✓</button>
      </div>`;
    }).join('');
  } catch(e) {
    lista.innerHTML = '<div class="empty">Erro ao carregar motoboys</div>';
  }
}
async function salvarHorario(nome, id) {
  const hi = document.getElementById('hi_' + id)?.value;
  const hf = document.getElementById('hf_' + id)?.value;
  if (!hi || !hf) return;
  try {
    const r = await fetch(API + '/horarios-motoboy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, hora_inicio: hi, hora_fim: hf })
    });
    const d = await r.json();
    if (d.status === 'ok') toast('✓ Horário salvo para ' + nome.split(' ')[0]);
    else toast('Erro ao salvar');
  } catch(e) { toast('Erro de conexão'); }
}

// ── CHAT DO PAINEL ────────────────────────────────────────────
let chatMotoboyAtual = null;
let chatMotoboys = [];
let chatPollingTimer = null;
let chatUltimoTs = 0;

function abrirChat() {
  const win = document.getElementById('chat-window');
  if (!win) return;
  win.style.display = 'flex';
  carregarChatLista();
  // Polling de novas mensagens a cada 5s
  if (!chatPollingTimer) {
    chatPollingTimer = setInterval(() => {
      if (chatMotoboyAtual) carregarMensagens(chatMotoboyAtual, true);
      atualizarBadgeChat();
    }, 5000);
  }
}

function fecharChat() {
  const win = document.getElementById('chat-window');
  if (win) win.style.display = 'none';
  if (chatPollingTimer) { clearInterval(chatPollingTimer); chatPollingTimer = null; }
}

async function carregarChatLista() {
  const lista = document.getElementById('chat-lista');
  if (!lista) return;
  try {
    const r = await fetch(API + '/chat/lista');
    const d = await r.json();
    chatMotoboys = d.lista || [];
    renderizarChatLista(chatMotoboys);
  } catch(e) {
    lista.innerHTML = '<div style="padding:1rem;color:#EF4444;font-size:12px">Erro ao carregar</div>';
  }
}

function renderizarChatLista(lista) {
  const el = document.getElementById('chat-lista');
  if (!el) return;
  if (!lista.length) {
    el.innerHTML = '<div style="padding:1rem;text-align:center;color:#94A8B8;font-size:12px">Nenhum motoboy</div>';
    return;
  }
  el.innerHTML = lista.map(m => {
    const iniciais = (m.nome || '').split(' ').map(p => p[0]).slice(0,2).join('');
    const temNaoLidas = m.nao_lidas > 0;
    const ativo = chatMotoboyAtual === m.telefone;
    const ultimaMsg = m.ultima_msg ? (m.ultima_msg.length > 28 ? m.ultima_msg.slice(0,28) + '…' : m.ultima_msg) : 'Sem mensagens';
    const tsLabel = m.ultima_ts ? new Date(m.ultima_ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '';
    return `<div onclick="abrirConversa('${m.telefone}','${(m.nome||'').replace(/'/g,"\\'")}')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid #EBF1F5;display:flex;align-items:center;gap:10px;background:${ativo ? '#E8F4FB' : 'transparent'};transition:.15s">
      <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1E9FD9,#0F7BB0);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">${iniciais}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:${temNaoLidas ? '700' : '600'};color:#0F4C7A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.nome || m.telefone}</div>
        <div style="font-size:11px;color:${temNaoLidas ? '#1E9FD9' : '#94A8B8'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px">${ultimaMsg}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
        ${tsLabel ? `<div style="font-size:10px;color:#94A8B8">${tsLabel}</div>` : ''}
        ${temNaoLidas ? `<div style="background:#DC2626;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">${m.nao_lidas}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function filtrarMotoboys() {
  const busca = (document.getElementById('chat-busca')?.value || '').toLowerCase();
  const filtrados = chatMotoboys.filter(m => (m.nome || '').toLowerCase().includes(busca) || (m.telefone || '').includes(busca));
  renderizarChatLista(filtrados);
}

async function abrirConversa(tel, nome) {
  chatMotoboyAtual = tel;
  chatUltimoTs = 0;

  // Header da conversa
  const header = document.getElementById('chat-conv-header');
  const avatarEl = document.getElementById('chat-conv-avatar');
  const nomeEl = document.getElementById('chat-conv-nome');
  const rotaEl = document.getElementById('chat-conv-rota');
  const inputEl = document.getElementById('chat-conv-input');

  if (header) header.style.display = 'flex';
  if (inputEl) inputEl.style.display = 'flex';
  if (nomeEl) nomeEl.textContent = nome;

  const mb = chatMotoboys.find(m => m.telefone === tel);
  if (rotaEl) rotaEl.textContent = mb?.rota || '';
  if (avatarEl) avatarEl.textContent = nome.split(' ').map(p => p[0]).slice(0,2).join('');

  // Foca no input
  setTimeout(() => document.getElementById('chat-input-text')?.focus(), 100);

  // Atualiza lista (para remover badge)
  renderizarChatLista(chatMotoboys);

  await carregarMensagens(tel, false);

  // Marca como lido
  fetch(API + '/chat/marcar-lido', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefone_motoboy: tel, remetente: 'motoboy' })
  });
}

async function carregarMensagens(tel, silent) {
  const msgs = document.getElementById('chat-conv-msgs');
  if (!msgs) return;
  if (!silent) msgs.innerHTML = '<div style="margin:auto;text-align:center;color:#94A8B8;font-size:13px">Carregando...</div>';

  try {
    const r = await fetch(API + '/chat/mensagens?telefone=' + encodeURIComponent(tel));
    const d = await r.json();
    const lista = d.mensagens || [];

    // Se silent e não há novas mensagens, não re-renderiza
    if (silent && lista.length > 0 && lista[lista.length-1].timestamp === chatUltimoTs) return;
    if (lista.length > 0) chatUltimoTs = lista[lista.length-1].timestamp;

    if (!lista.length) {
      msgs.innerHTML = '<div style="margin:auto;text-align:center;color:#94A8B8;font-size:13px">Nenhuma mensagem ainda</div>';
      return;
    }

    msgs.innerHTML = lista.map(m => {
      const isAdmin = m.remetente === 'admin';
      const hora = new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      return `<div style="display:flex;justify-content:${isAdmin ? 'flex-end' : 'flex-start'};margin-bottom:8px">
        <div style="max-width:75%;padding:9px 12px;border-radius:${isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};background:${isAdmin ? 'linear-gradient(135deg,#1E9FD9,#0F7BB0)' : '#fff'};color:${isAdmin ? '#fff' : '#0F2940'};font-size:13px;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,.08)">
          <div>${m.mensagem}</div>
          <div style="font-size:10px;opacity:.6;margin-top:3px;text-align:right">${hora}</div>
        </div>
      </div>`;
    }).join('');

    // Scroll para o fim
    msgs.scrollTop = msgs.scrollHeight;
  } catch(e) {}
}

async function enviarChat() {
  if (!chatMotoboyAtual) return;
  const input = document.getElementById('chat-input-text');
  const msg = input?.value?.trim();
  if (!msg) return;
  input.value = '';
  input.disabled = true;

  try {
    const mb = chatMotoboys.find(m => m.telefone === chatMotoboyAtual);
    await fetch(API + '/chat/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone_motoboy: chatMotoboyAtual,
        nome_motoboy: mb?.nome || '',
        remetente: 'admin',
        mensagem: msg
      })
    });
    await carregarMensagens(chatMotoboyAtual, false);
    await carregarChatLista();
  } catch(e) {}
  input.disabled = false;
  input.focus();
}

async function atualizarBadgeChat() {
  try {
    const r = await fetch(API + '/chat/nao-lidas');
    const d = await r.json();
    const badge = document.getElementById('chat-fab-badge');
    if (badge) {
      if (d.total > 0) {
        badge.style.display = 'flex';
        badge.textContent = d.total;
      } else {
        badge.style.display = 'none';
      }
    }
  } catch(e) {}
}

// Verifica badge a cada 15s
setInterval(atualizarBadgeChat, 15000);
setTimeout(atualizarBadgeChat, 2000);
// ── FIM CHAT DO PAINEL ────────────────────────────────────────
