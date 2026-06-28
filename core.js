// ============================================================
// ── CORE — Funções base, navegação e utilitários ──────────────────────────
// ============================================================
// ── VARIÁVEIS ──
const API = 'https://confirmacaoderota.willlog99.workers.dev';
const _diaSemana = new Date().getDay();
let autoRefreshInterval = null;

function getDataLocalSP() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

// ── FUNÇÕES DE VALIDAÇÃO DE DATA ──────────────────────────
function validarData(dataString) {
    if (!dataString) return false;
    const data = new Date(dataString);
    return !isNaN(data.getTime());
}

function dataEstaOk(inputElement) {
    if (!inputElement) return false;
    const valor = inputElement.value;
    if (!validarData(valor)) return false;

    const dataSelecionada = new Date(valor);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return dataSelecionada <= hoje;
}

// ── FUNÇÕES GERAIS ──
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
function toggleMobileMenu() {
  document.querySelector('.app-sidebar')?.classList.toggle('mobile-open');
  document.getElementById('mobile-overlay')?.classList.toggle('show');
}

const VIEWS_SO_DESKTOP = ['mapa-rastreamento', 'replay-rota', 'ponto-rh'];

function mostrarBloqueioMobile(id) {
  const nomes = { 'mapa-rastreamento': 'Mapa de Rastreamento', 'replay-rota': 'Replay da Rota', 'ponto-rh': 'Ponto RH' };
  const nome = nomes[id] || 'Esta função';
  const popup = document.createElement('div');
  popup.style.cssText = 'position:fixed;inset:0;background:rgba(11,33,56,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.25rem';
  popup.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:1.75rem 1.5rem;max-width:320px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="font-size:40px;margin-bottom:12px">🖥️</div>
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:15px;color:#0F4C7A;margin-bottom:8px">${nome}</div>
      <div style="font-size:13px;color:#647689;line-height:1.5;margin-bottom:18px">Esta função está disponível apenas no computador. Acesse pelo navegador desktop para usá-la.</div>
      <button onclick="this.closest('div[style*=fixed]').remove()" style="width:100%;padding:11px;border-radius:11px;border:none;background:#0F4C7A;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Entendi</button>
    </div>`;
  document.body.appendChild(popup);
}

function setView(id, el) {
  if (VIEWS_SO_DESKTOP.includes(id) && window.innerWidth < 900) {
    mostrarBloqueioMobile(id);
    return;
  }
  if (window.innerWidth < 900) {
    document.querySelector('.app-sidebar')?.classList.remove('mobile-open');
    document.getElementById('mobile-overlay')?.classList.remove('show');
  }
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
    carregarResumoDia();
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
  if (id === 'painel') { carregarResumoDia(); }
  if (id === 'painel-usuarios') carregarUsuariosPainel();
  if (id === 'ocorrencias') {
    const input = document.getElementById('oc-filtro-data');
    if (input && !input.value) input.value = new Date().toISOString().split('T')[0];
    carregarOcorrencias();
  }
  if (id === 'dispositivos') carregarDispositivos();
   if (id === 'geofence-config' && typeof carregarGeofenceConfig === 'function') {
    carregarGeofenceConfig();
    carregarHorariosTrabalho();
    if (typeof carregarPontosRota === 'function') carregarPontosRota();
    const ppData = document.getElementById('pp-data');
    if (ppData && !ppData.value) {
      const agora = new Date();
      const diaSP = new Date(agora.getTime() - 3*60*60*1000);
      ppData.value = diaSP.toISOString().split('T')[0];
    }
  }
  if (id === 'gestor' && typeof renderItensAuditoria === 'function') renderItensAuditoria();
  if (id === 'relatorios') {
    relMudarTipo('km');
    setTimeout(carregarRelKm, 100);
  }
  if (id === 'replay-rota') {
    popularSelectMotoboysReplay();
    const dataInp = document.getElementById('replay-data');
    if (dataInp && !dataInp.value) dataInp.value = new Date().toISOString().split('T')[0];
  }
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

// ── HORÁRIOS DE TRABALHO ─────────────────────────────────────
async function carregarHorariosTrabalho() {
  const lista = document.getElementById('ht-lista');
  const sel   = document.getElementById('ht-motoboy-sel');
  if (!lista) return;
  try {
    const [rMb, rHt] = await Promise.all([
      fetch(API + '/motoboys?todos=1&agrupado=1'),
      fetch(API + '/horario-trabalho')
    ]);
    const dMb = await rMb.json();
    const dHt = await rHt.json();
    const motoboys = (dMb.motoboys || []).sort((a,b) => a.nome.localeCompare(b.nome));
    const horarios = dHt.horarios || [];

    if (sel) {
      sel.innerHTML = '<option value="">Selecione...</option>';
      motoboys.forEach(m => {
        const o = document.createElement('option');
        o.value = m.telefone; o.textContent = m.nome;
        sel.appendChild(o);
      });
    }

    if (!horarios.length) {
      lista.innerHTML = '<div class="empty" style="font-size:12px">Nenhum horário cadastrado</div>';
      return;
    }

    const porNome = {};
    horarios.forEach(h => {
      const key = h.nome || h.telefone;
      if (!porNome[key]) porNome[key] = { telefone: h.telefone, nome: h.nome, dias: [] };
      porNome[key].dias.push(h);
    });

    lista.innerHTML = Object.values(porNome).map(p => {
      const grupos = {};
      p.dias.forEach(d => {
        const key = d.inicio + '-' + d.fim;
        if (!grupos[key]) grupos[key] = { inicio: d.inicio, fim: d.fim, dias: [] };
        grupos[key].dias.push(d.dia_semana);
      });
      const abr = d => ({ seg:'Seg', ter:'Ter', qua:'Qua', qui:'Qui', sex:'Sex', sab:'Sáb', dom:'Dom' })[d] || d;
      const linhas = Object.values(grupos).map(g => {
        const diasStr = g.dias.map(abr).join(' · ');
        const btns = g.dias.map(d => `<button onclick="removerHorarioTrabalho('${p.telefone}','${d}')" style="background:none;border:none;color:#D1D5DB;font-size:11px;cursor:pointer;padding:0">✕</button>`).join('');
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 14px 3px 24px">
          <span style="font-size:11px;color:#5A7A8F;flex:1">${diasStr}</span>
          <span style="font-size:11px;font-weight:700;color:#0F4C7A">${g.inicio}–${g.fim}</span>
          ${btns}
        </div>`;
      }).join('');
      return `<div style="border-bottom:1px solid #F0F4F8;padding:6px 0">
        <div style="padding:2px 14px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:12px;font-weight:700;color:#0F4C7A">👤 ${p.nome || p.telefone}</span>
          <button onclick="removerHorarioTrabalho('${p.telefone}',null)" style="background:none;border:none;color:#EF4444;font-size:10px;cursor:pointer">✕ todos</button>
        </div>
        ${linhas}
      </div>`;
    }).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

async function salvarHorarioTrabalho() {
  const telefone = document.getElementById('ht-motoboy-sel')?.value;
  const nome     = document.getElementById('ht-motoboy-sel')?.options[document.getElementById('ht-motoboy-sel')?.selectedIndex]?.text;
  const dia_semana = document.getElementById('ht-dia-sel')?.value;
  const inicio   = document.getElementById('ht-inicio')?.value;
  const fim      = document.getElementById('ht-fim')?.value;
  if (!telefone) { toast('Selecione um motoboy'); return; }
  if (!inicio || !fim) { toast('Informe início e fim'); return; }
  if (inicio >= fim) { toast('Fim deve ser depois do início'); return; }
  try {
    await fetch(API + '/horario-trabalho', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, nome, dia_semana, inicio, fim })
    });
    toast('✓ Horário salvo');
    carregarHorariosTrabalho();
  } catch(e) { toast('Erro ao salvar'); }
}

async function removerHorarioTrabalho(telefone, dia_semana) {
  const msg = dia_semana ? 'Remover este horário?' : 'Remover todos os horários deste motoboy?';
  if (!confirm(msg)) return;
  try {
    await fetch(API + '/horario-trabalho', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, dia_semana })
    });
    toast('✓ Removido');
    carregarHorariosTrabalho();
  } catch(e) { toast('Erro ao remover'); }
}
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

// ── MÉTRICAS KM ──────────────────────────────────────────────
async function carregarMetricas() {
  const periodoSel = document.getElementById('km-metricas-periodo')?.value || 'mes';
  const inicioInp  = document.getElementById('km-metricas-inicio')?.value;
  const fimInp     = document.getElementById('km-metricas-fim')?.value;

  const hoje = new Date();
  let dataInicio, dataFim = hoje.toISOString().split('T')[0];

  if (inicioInp && fimInp) {
    dataInicio = inicioInp; dataFim = fimInp;
  } else if (periodoSel === 'hoje') {
    dataInicio = dataFim;
  } else if (periodoSel === 'semana') {
    const d = new Date(hoje); d.setDate(d.getDate() - 7);
    dataInicio = d.toISOString().split('T')[0];
  } else {
    const d = new Date(hoje); d.setDate(d.getDate() - 30);
    dataInicio = d.toISOString().split('T')[0];
  }

  const label = dataInicio === dataFim ? dataInicio : dataInicio + ' → ' + dataFim;
  const el = document.getElementById('km-metricas-label');
  if (el) el.textContent = label;

  const tbody = document.getElementById('km-metricas-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem;text-align:center;color:#94A8B8"><span class="spinner"></span> Carregando...</td></tr>';

  try {
    const rMb = await fetch(API + '/motoboys?todos=1&agrupado=1');
    const dMb = await rMb.json();
    const rastreadores = (dMb.motoboys || []).filter(m => m.rastrear !== false && m.rastrear !== 0);

    if (!rastreadores.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem;text-align:center;color:#94A8B8">Nenhum rastreador cadastrado</td></tr>';
      return;
    }

    const datas = [];
    const cur = new Date(dataInicio);
    const fim = new Date(dataFim);
    while (cur <= fim) { datas.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate()+1); }

    const metricas = await Promise.all(rastreadores.map(async m => {
      let kmTotal = 0, diasComDados = 0, tempoTotalMin = 0;
      for (const data of datas) {
        try {
          const r = await fetch(API + '/km-rodado?nome=' + encodeURIComponent(m.nome) + '&data=' + data);
          const d = await r.json();
          if (d.km > 0) { kmTotal += d.km; diasComDados++; }
          if (d.pontos > 1) {
            tempoTotalMin += (d.pontos * 30) / 60;
          }
        } catch(e) {}
      }
      const dias = diasComDados || 1;
      return {
        nome: m.nome,
        kmTotal: Math.round(kmTotal * 10) / 10,
        kmd: Math.round((kmTotal / dias) * 10) / 10,
        kmm: Math.round((kmTotal / dias) * 22 * 10) / 10,
        tmd: tempoTotalMin / dias,
        dias: diasComDados
      };
    }));

    const formatMin = min => {
      if (!min) return '—';
      const h = Math.floor(min / 60);
      const m2 = Math.round(min % 60);
      return h + 'h' + String(m2).padStart(2,'0') + 'm';
    };

    if (tbody) tbody.innerHTML = metricas.map(m => `
      <tr style="border-bottom:1px solid #F0F4F8">
        <td style="padding:10px 12px;font-weight:600;color:#0F2940">${m.nome}</td>
        <td style="padding:10px 8px;text-align:center;font-weight:700;color:#0F9B78">${m.kmd} km</td>
        <td style="padding:10px 8px;text-align:center;font-weight:700;color:#1E9FD9">${m.kmm} km</td>
        <td style="padding:10px 8px;text-align:center;font-weight:700;color:#7C3AED">${formatMin(m.tmd)}</td>
        <td style="padding:10px 8px;text-align:center;color:#5A7A8F">${m.kmTotal} km</td>
        <td style="padding:10px 8px;text-align:center;color:#5A7A8F">${m.dias}</td>
      </tr>`).join('');
  } catch(e) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem;text-align:center;color:#EF4444">Erro ao carregar métricas</td></tr>';
  }
}

// ── PWA — SERVICE WORKER ─────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/confirmacaoderota/sw.js')
      .then(r => console.log('[PWA] SW registrado:', r.scope))
      .catch(e => console.warn('[PWA] SW falhou:', e));
  });
}

// ── RESUMO DO DIA ─────────────────────────────────────────────
async function carregarResumoDia() {
  const lista = document.getElementById('resumo-dia-lista');
  if (!lista) return;

  const hoje = getDataLocalSP(); 
  const hojeStr = new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});

  const dataEl = document.getElementById('resumo-dia-data');
  if (dataEl) dataEl.textContent = hojeStr;

  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';

  try {
    const [rMb, rConf, rGeo, rKm] = await Promise.all([
      fetch(API + '/motoboys?todos=1&agrupado=1'),
      fetch(API + '/historico-confirmacoes?data_inicio=' + hoje + '&data_fim=' + hoje),
      fetch(API + '/geofence-evento?data=' + hoje),
      fetch(API + '/localizacao?dia=' + hoje)
    ]);

    const dMb   = await rMb.json();
    const dConf = await rConf.json();
    const dGeo  = await rGeo.json();
    const dKm   = await rKm.json();

    const motoboys     = (dMb.motoboys || []).filter(m => m.rastrear !== 0 && m.rastrear !== false);
    const confirmacoes = dConf.confirmacoes || [];
    const eventos      = dGeo.eventos || [];
    const historico    = dKm.historico || [];

    const confirmaramHoje = new Set(confirmacoes.filter(c => c.resposta === 'sim').map(c => c.biocondutor || c.nome));
    const motoboysFiltrados = motoboys.filter(m => confirmaramHoje.has(m.nome));

    const kmPorNome = {};
    historico.forEach(p => { if (!kmPorNome[p.nome]) kmPorNome[p.nome]=[]; kmPorNome[p.nome].push(p); });

    function calcKm(pts) {
      if (!pts || pts.length < 2) return 0;
      const s = [...pts].sort((a,b)=>a.timestamp-b.timestamp);
      let km = 0;
      for (let i = 1; i < s.length; i++) {
        const R=6371,dLat=(s[i].lat-s[i-1].lat)*Math.PI/180,dLng=(s[i].lng-s[i-1].lng)*Math.PI/180;
        const a=Math.sin(dLat/2)**2+Math.cos(s[i-1].lat*Math.PI/180)*Math.cos(s[i].lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const d=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
        if(d<5) km+=d;
      }
      return Math.round(km*10)/10;
    }

    function horaEvento(nome, tipo) {
      const ev = eventos.find(e => e.nome === nome && e.tipo && e.tipo.includes(tipo));
      if (!ev) return '—';
      const sp = new Date(ev.timestamp - 3*60*60*1000);
      return String(sp.getUTCHours()).padStart(2,'0')+':'+String(sp.getUTCMinutes()).padStart(2,'0');
    }

    function horaConf(nome) {
      const conf = confirmacoes.find(c => (c.nome === nome || c.biocondutor === nome) && c.resposta === 'sim');
      if (!conf) return '—';
      const sp = new Date(conf.timestamp - 3*60*60*1000);
      return String(sp.getUTCHours()).padStart(2,'0')+':'+String(sp.getUTCMinutes()).padStart(2,'0');
    }

    if (!motoboysFiltrados.length) { lista.innerHTML = '<div class="empty">Nenhuma rota ativa hoje</div>'; return; }

    lista.innerHTML = motoboysFiltrados.map(m => {
      const inicio  = horaConf(m.nome);
      const base    = horaEvento(m.nome, 'base');
      const polaris = horaEvento(m.nome, 'final');
      const km      = calcKm(kmPorNome[m.nome]);
      return `<div style="padding:8px 12px;border-bottom:1px solid #F0F4F8">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:12px;font-weight:700;color:#0F2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%">${m.nome}</div>
          <div style="font-size:11px;font-weight:800;color:#0F9B78">${km > 0 ? km + ' km' : '—'}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
          <div style="background:#EFF6FF;border-radius:6px;padding:3px 6px;text-align:center">
            <div style="font-size:10px;font-weight:700;color:#1D4ED8">${inicio}</div>
            <div style="font-size:9px;color:#5A7A8F">Início</div>
          </div>
          <div style="background:#F0FDF4;border-radius:6px;padding:3px 6px;text-align:center">
            <div style="font-size:10px;font-weight:700;color:#166534">${base}</div>
            <div style="font-size:9px;color:#5A7A8F">Base</div>
          </div>
          <div style="background:#FEF9EC;border-radius:6px;padding:3px 6px;text-align:center">
            <div style="font-size:10px;font-weight:700;color:#92400E">${polaris}</div>
            <div style="font-size:9px;color:#5A7A8F">Polaris</div>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch(e) { lista.innerHTML = '<div class="empty">Erro ao carregar</div>'; }
}

setInterval(carregarResumoDia, 5 * 60 * 1000);

// ── LOGIN PAINEL ─────────────────────────────────────────────
let _painelUsuario = null;

async function fazerLoginPainel() {
  const input = document.getElementById('login-tel');
  const erroEl = document.getElementById('login-erro');
  const btn = document.getElementById('btn-login-painel');
  const tel = (input?.value || '').replace(/\D/g,'');
  if (!tel || tel.length < 10) { if (erroEl) { erroEl.textContent = 'Digite um número válido'; erroEl.style.display='block'; } return; }
  if (erroEl) erroEl.style.display = 'none';
  if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }
  try {
    const r = await fetch(API + '/painel-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone: tel })
    });
    const d = await r.json();
    if (d.status !== 'ok') {
      if (erroEl) { erroEl.textContent = d.msg || 'Acesso não autorizado'; erroEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Entrar →'; }
      return;
    }
    _painelUsuario = { nome: d.nome, master: d.master, permissoes: d.permissoes || [] };
    sessionStorage.setItem('painel_usuario', JSON.stringify(_painelUsuario));
    aplicarLoginPainel();
  } catch(e) {
    if (erroEl) { erroEl.textContent = 'Erro de conexão'; erroEl.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar →'; }
  }
}

function aplicarLoginPainel() {
  if (!_painelUsuario) return;
  const screen = document.getElementById('painel-login-screen');
  if (screen) screen.style.display = 'none';
  const iniciais = _painelUsuario.nome.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  const sfAv = document.getElementById('sf-av-iniciais');
  const sfNome = document.getElementById('sf-nome-usuario');
  const sfRole = document.getElementById('sf-role-usuario');
  if (sfAv) sfAv.textContent = iniciais;
  if (sfNome) sfNome.textContent = _painelUsuario.nome;
  if (sfRole) sfRole.textContent = _painelUsuario.master ? '⭐ Master' : 'Gestor';
  aplicarPermissoesMenu();
  setTimeout(carregarResumoDia, 500);
}

function temPermissao(modulo) {
  if (!_painelUsuario) return false;
  if (_painelUsuario.master) return true;
  return _painelUsuario.permissoes.includes('all') || _painelUsuario.permissoes.includes(modulo);
}

function aplicarPermissoesMenu() {
  const mapa = {
    'confirmacoes':       'confirmacoes',
    'mapa-rastreamento': 'rastreamento',
    'checklist-view':    'checklist',
    'motoristas':        'motoristas',
    'buscar':            'buscar_cliente',
    'criar-cliente':     'criar_cliente',
    'ativar-cliente':    'ativar_cliente',
    'gestor':            'auditoria',
    'gerenciar-motoboys':'motoboys',
    'dispositivos':      'dispositivos',
    'ocorrencias':       'ocorrencias',
    'quilometragem':     'quilometragem',
    'geofence-config':   'geofence',
    'importacao':        'importacao',
    'estoque-view':      'estoque',
    'ponto-rh':          'rh',
    'patrimonios':       'patrimonios',
    'painel-usuarios':   null,
  };

  document.querySelectorAll('.nav-item[onclick*="setView"]').forEach(btn => {
    const match = btn.getAttribute('onclick').match(/setView\('([^']+)'/);
    if (!match) return;
    const view = match[1];
    const modulo = mapa[view];
    if (modulo === undefined) return;
    if (modulo && !temPermissao(modulo)) btn.style.display = 'none';
  });

  const navUsuarios = document.getElementById('nav-btn-usuarios');
  if (navUsuarios && !_painelUsuario?.master) navUsuarios.style.display = 'none';

  const btnsMaster = ['nav-btn-apk', 'nav-btn-gps-offline', 'nav-btn-treinamentos'];
  btnsMaster.forEach(id => {
    const el = document.getElementById(id);
    if (el && !_painelUsuario?.master) el.style.display = 'none';
  });

  const btnCriarRota = document.getElementById('nav-btn-criar-rota');
  if (btnCriarRota && !temPermissao('criar_rota')) btnCriarRota.style.display = 'none';
  const btnAlterarRota = document.getElementById('nav-btn-alterar-rota');
  if (btnAlterarRota && !temPermissao('alterar_rota')) btnAlterarRota.style.display = 'none';

  document.querySelectorAll('.nav-group-lbl').forEach(label => {
    let next = label.nextElementSibling;
    let temVisivel = false;
    while (next && !next.classList.contains('nav-group-lbl')) {
      if (next.classList.contains('nav-item') && next.style.display !== 'none') {
        temVisivel = true; break;
      }
      next = next.nextElementSibling;
    }
    label.style.display = temVisivel ? '' : 'none';
  });
}

function sairPainel() {
  if (!confirm('Deseja sair do painel?')) return;
  sessionStorage.removeItem('painel_usuario');
  _painelUsuario = null;
  const screen = document.getElementById('painel-login-screen');
  if (screen) { screen.style.display = 'flex'; }
  const input = document.getElementById('login-tel');
  if (input) { input.value = ''; }
  document.querySelectorAll('.nav-item').forEach(b => b.style.display = '');
}

(function() {
  const saved = sessionStorage.getItem('painel_usuario');
  if (saved) {
    try {
      _painelUsuario = JSON.parse(saved);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarLoginPainel);
      } else {
        setTimeout(aplicarLoginPainel, 100);
      }
    } catch(e) { sessionStorage.removeItem('painel_usuario'); }
  }
})();

// ── USUÁRIOS DO PAINEL ────────────────────────────────────────
async function carregarUsuariosPainel() {
  const lista = document.getElementById('pu-lista');
  if (!lista) return;
  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const r = await fetch(API + '/painel-usuarios');
    const d = await r.json();
    const usuarios = d.usuarios || [];
    if (!usuarios.length) { lista.innerHTML = '<div class="empty">Nenhum usuário cadastrado</div>'; return; }

    const MODULOS = {
      painel:'🏠',confirmacoes:'✓',rastreamento:'🗺️',checklist:'📋',motoristas:'👤',
      criar_rota:'➕',alterar_rota:'✏️',buscar_cliente:'🔎',criar_cliente:'👤',ativar_cliente:'🔁',
      motoboys:'🏍️',dispositivos:'📱',ocorrencias:'🚨',quilometragem:'📏',geofence:'📍',
      auditoria:'🎯',importacao:'📥',estoque:'📦',rh:'⏱️',chat:'💬',patrimonios:'🔒'
    };

    lista.innerHTML = usuarios.map(u => {
      let perms = [];
      try { perms = JSON.parse(u.permissoes || '[]'); } catch(e) {}
      const permBadges = u.master
        ? '<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:#FEF9EC;color:#92400E;font-weight:700">⭐ Master</span>'
        : perms.map(p => `<span style="font-size:10px;padding:2px 6px;border-radius:20px;background:#EFF6FF;color:#1D4ED8">${MODULOS[p]||p}</span>`).join('');
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F0F4F8">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#0F2940">${u.nome} ${u.master ? '⭐' : ''}</div>
            <div style="font-size:11px;color:#94A8B8;margin-top:1px">${u.telefone}</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">${permBadges}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#5A7A8F;cursor:pointer">
              <input type="checkbox" ${u.ativo?'checked':''} onchange="toggleUsuarioPainel(${u.id},this.checked)" style="accent-color:#0F4C7A" ${u.master?'disabled':''}/>
              Ativo
            </label>
            ${!u.master ? `<button onclick="editarPermissoes(${u.id},'${u.nome.replace(/'/g,"\\'")}',${JSON.stringify(perms).replace(/"/g,'&quot;')})" style="font-size:10px;padding:3px 8px;border-radius:6px;border:1.5px solid #D6E5EE;background:#fff;color:#0F4C7A;cursor:pointer">✏️ Permissões</button>
            <button onclick="excluirUsuarioPainel(${u.id})" style="font-size:10px;padding:3px 8px;border-radius:6px;border:none;background:none;color:#EF4444;cursor:pointer">✕</button>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch(e) { lista.innerHTML = '<div class="empty">Erro ao carregar</div>'; }
}

async function salvarUsuarioPainel() {
  const nome = document.getElementById('pu-nome')?.value.trim();
  const tel = (document.getElementById('pu-tel')?.value || '').replace(/\D/g,'');
  const perms = [...document.querySelectorAll('.pu-perm-cb:checked')].map(cb => cb.value);
  if (!nome || !tel) { toast('Preencha nome e telefone'); return; }
  try {
    await fetch(API + '/painel-usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone: tel, permissoes: perms })
    });
    document.getElementById('pu-nome').value = '';
    document.getElementById('pu-tel').value = '';
    document.querySelectorAll('.pu-perm-cb').forEach(cb => cb.checked = false);
    toast('✓ Usuário adicionado');
    carregarUsuariosPainel();
  } catch(e) { toast('Erro ao salvar'); }
}

async function toggleUsuarioPainel(id, ativo) {
  await fetch(API + '/painel-usuarios', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, ativo }) });
  toast(ativo ? '✓ Ativado' : '✓ Desativado');
}

async function excluirUsuarioPainel(id) {
  if (!confirm('Excluir este usuário?')) return;
  await fetch(API + '/painel-usuarios', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
  toast('✓ Usuário removido');
  carregarUsuariosPainel();
}

function editarPermissoes(id, nome, permsAtual) {
  const MODULOS = [
    ['painel','🏠 Painel'],['confirmacoes','✓ Confirmações'],['rastreamento','🗺️ Rastreamento'],
    ['checklist','📋 Checklist'],['motoristas','👤 Motoristas'],['criar_rota','➕ Criar rota'],
    ['alterar_rota','✏️ Alterar rota'],['buscar_cliente','🔎 Buscar cliente'],['criar_cliente','👤 Criar cliente'],
    ['ativar_cliente','🔁 Ativar/Desativar'],['motoboys','🏍️ Motoboys'],['dispositivos','📱 Dispositivos'],
    ['ocorrencias','🚨 Ocorrências'],['quilometragem','📏 Quilometragem'],['geofence','📍 Geofence'],
    ['auditoria','🎯 Auditoria'],['importacao','📥 Importação'],['estoque','📦 PMC Estoque'],
    ['rh','⏱️ Ponto RH'],['chat','💬 Chat'],['patrimonios','🔒 Patrimônios']
  ];
  const pop = document.createElement('div');
  pop.id = 'pop-perms';
  pop.style.cssText = 'position:fixed;inset:0;background:rgba(15,40,64,.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem';
  pop.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:1.25rem;width:100%;max-width:420px;max-height:90vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div style="font-size:14px;font-weight:800;color:#0F4C7A">Permissões — ${nome}</div>
        <button onclick="document.getElementById('pop-perms').remove()" style="background:none;border:none;font-size:20px;color:#5A7A8F;cursor:pointer">✕</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem">
        ${MODULOS.map(([id2, label]) => `
          <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:#0F2940;cursor:pointer;padding:6px 10px;border-radius:8px;border:1.5px solid #D6E5EE;background:#fff">
            <input type="checkbox" value="${id2}" class="perm-edit-cb" ${permsAtual.includes(id2)?'checked':''} style="accent-color:#0F4C7A"/>
            ${label}
          </label>`).join('')}
      </div>
      <button onclick="salvarPermissoes(${id})" style="width:100%;padding:10px;border-radius:8px;border:none;background:#0F4C7A;color:#fff;font-size:13px;font-weight:700;cursor:pointer">✓ Salvar permissões</button>
    </div>`;
  document.body.appendChild(pop);
}

async function salvarPermissoes(id) {
  const perms = [...document.querySelectorAll('.perm-edit-cb:checked')].map(cb => cb.value);
  await fetch(API + '/painel-usuarios', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, permissoes: perms }) });
  document.getElementById('pop-perms')?.remove();
  toast('✓ Permissões salvas');
  carregarUsuariosPainel();
}

// ── MOTIVOS DE AUSÊNCIA ──────────────────────────────────────
async function carregarMotivos() {
  const lista = document.getElementById('mot-lista');
  if (!lista) return;
  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const r = await fetch(API + '/motivos-ausencia');
    const d = await r.json();
    const motivos = d.motivos || [];
    if (!motivos.length) { lista.innerHTML = '<div class="empty">Nenhum motivo cadastrado</div>'; return; }
    lista.innerHTML = motivos.map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F0F4F8;${!m.ativo ? 'opacity:.5' : ''}">
        <span style="font-size:20px;flex-shrink:0">${m.emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#0F2940">${m.label}</div>
          <div style="font-size:11px;color:#94A8B8">${m.codigo}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#5A7A8F;cursor:pointer">
            <input type="checkbox" ${m.ativo ? 'checked' : ''} onchange="toggleMotivo(${m.id},this.checked)" style="accent-color:#0F4C7A"/>
            Ativo
          </label>
          <button onclick="excluirMotivo(${m.id})" style="background:none;border:none;color:#EF4444;font-size:13px;cursor:pointer">✕</button>
        </div>
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

async function salvarMotivo() {
  const emoji = document.getElementById('mot-emoji').value.trim() || '📋';
  const label = document.getElementById('mot-label').value.trim();
  if (!label) { toast('Informe a descrição do motivo'); return; }
  const codigo = 'OC-NP-' + Date.now();
  try {
    await fetch(API + '/motivos-ausencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, emoji, label })
    });
    document.getElementById('mot-emoji').value = '';
    document.getElementById('mot-label').value = '';
    toast('✓ Motivo adicionado');
    carregarMotivos();
  } catch(e) { toast('Erro ao salvar'); }
}

async function toggleMotivo(id, ativo) {
  try {
    await fetch(API + '/motivos-ausencia', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo })
    });
    toast(ativo ? '✓ Motivo ativado' : '✓ Motivo desativado');
  } catch(e) { toast('Erro'); }
}

async function excluirMotivo(id) {
  if (!confirm('Excluir este motivo?')) return;
  try {
    await fetch(API + '/motivos-ausencia', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    toast('✓ Motivo excluído');
    carregarMotivos();
  } catch(e) { toast('Erro'); }
}

// ── RELATÓRIOS — NAVEGAÇÃO ───────────────────────────────────
function relMudarTipo(tipo) {
  ['km','inconsistencias','horarios','checklist','coordenadas'].forEach(t => {
    const el = document.getElementById('rel-sub-' + t);
    const btn = document.getElementById('rel-nav-' + t);
    if (el) el.style.display = t === tipo ? 'block' : 'none';
    if (btn) btn.classList.toggle('rel-nav-ativo', t === tipo);
  });
  const hoje = new Date().toISOString().split('T')[0];
  if (tipo === 'km') {
    const d = document.getElementById('rel-km-data');
    if (d && !d.value) d.value = hoje;
  }
  if (tipo === 'inconsistencias') {
    const i1 = document.getElementById('rel-inc-inicio'), i2 = document.getElementById('rel-inc-fim');
    if (i1 && !i1.value) i1.value = hoje;
    if (i2 && !i2.value) i2.value = hoje;
  }
  if (tipo === 'horarios') {
    const h = document.getElementById('rel-hor-data');
    if (h && !h.value) h.value = hoje;
  }
  if (tipo === 'checklist') {
    const c = document.getElementById('rel-chk-data');
    if (c && !c.value) c.value = hoje;
  }
}

// ── RELATÓRIO: QUILOMETRAGEM ─────────────────────────────────
let _relKmDados = [];

async function carregarRelKm() {
  const lista = document.getElementById('rel-km-lista');
  const dataInp = document.getElementById('rel-km-data');
  
  // VALIDAÇÃO INTEGRADA
  if (!dataEstaOk(dataInp)) {
      toast('Data inválida ou futura!');
      return;
  }

  const data = dataInp.value;
  lista.innerHTML = '<div class="rel-empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const rMb = await fetch(API + '/motoboys?todos=1&agrupado=1');
    const dMb = await rMb.json();
    const motoboys = (dMb.motoboys || []).filter(m => m.rastrear !== 0 && m.rastrear !== false);

    const rKm = await fetch(API + '/localizacao?dia=' + data);
    const dKm = await rKm.json();
    const historico = dKm.historico || [];

    const rGeo = await fetch(API + '/geofence-evento?data=' + data);
    const dGeo = await rGeo.json();
    const eventos = dGeo.eventos || [];

    const kmPorNome = {};
    historico.forEach(p => { if (!kmPorNome[p.nome]) kmPorNome[p.nome]=[]; kmPorNome[p.nome].push(p); });

    function calcKm(pts) {
      if (!pts || pts.length < 2) return 0;
      const s = [...pts].sort((a,b)=>a.timestamp-b.timestamp);
      let km = 0;
      for (let i = 1; i < s.length; i++) {
        const R=6371,dLat=(s[i].lat-s[i-1].lat)*Math.PI/180,dLng=(s[i].lng-s[i-1].lng)*Math.PI/180;
        const a=Math.sin(dLat/2)**2+Math.cos(s[i-1].lat*Math.PI/180)*Math.cos(s[i].lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const d=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
        if(d<5) km+=d;
      }
      return Math.round(km*10)/10;
    }
    function calcTmdMin(pts) {
      if (!pts || pts.length < 2) return 0;
      const s = [...pts].sort((a,b)=>a.timestamp-b.timestamp);
      return Math.round((s[s.length-1].timestamp - s[0].timestamp) / 60000);
    }
    function formatMin(min) {
      if (!min || min <= 0) return '\u2014';
      const h = Math.floor(min / 60);
      const m = min % 60;
      return h > 0 ? h + 'h' + String(m).padStart(2,'0') + 'm' : m + 'min';
    }
     function horaEvt(nome, tipo) {
      const evs = eventos.filter(e => e.nome === nome && e.tipo && e.tipo.includes(tipo))
        .sort((a,b) => a.timestamp - b.timestamp);
      if (!evs.length) return '\u2014';
      const paraExibir = (tipo === 'base' && evs.length > 1) ? [evs[0], evs[evs.length - 1]] : evs;
      return paraExibir.map(ev => {
        const sp = new Date(ev.timestamp - 3*60*60*1000);
        return String(sp.getUTCHours()).padStart(2,'0')+':'+String(sp.getUTCMinutes()).padStart(2,'0');
      }).join(', ');
    }

    _relKmDados = motoboys.map(m => {
      const pts = kmPorNome[m.nome];
      const km = calcKm(pts);
      const tmdMin = calcTmdMin(pts);
      const velMedia = tmdMin > 0 ? Math.round((km / (tmdMin / 60)) * 10) / 10 : 0;
      const inicio = pts && pts.length ? (() => { const sp = new Date(Math.min(...pts.map(p=>p.timestamp)) - 3*60*60*1000); return String(sp.getUTCHours()).padStart(2,'0')+':'+String(sp.getUTCMinutes()).padStart(2,'0'); })() : '\u2014';
      const base = horaEvt(m.nome, 'base');
      const polaris = horaEvt(m.nome, 'final');
      return { nome: m.nome, inicio, base, polaris, km, tmdMin, velMedia, temPolaris: polaris !== '\u2014' };
    }).filter(r => r.km > 0 || r.inicio !== '\u2014');

    const total = _relKmDados.reduce((s,r) => s + r.km, 0);
    const media = _relKmDados.length ? total / _relKmDados.length : 0;
    const velMediaGeral = _relKmDados.length ? _relKmDados.reduce((s,r) => s + r.velMedia, 0) / _relKmDados.filter(r=>r.velMedia>0).length : 0;
    document.getElementById('rel-km-kpi-total').textContent = (Math.round(total*10)/10) + ' km';
    document.getElementById('rel-km-kpi-media').textContent = (Math.round(media*10)/10) + ' km';
    document.getElementById('rel-km-kpi-ativos').textContent = _relKmDados.length;
    document.getElementById('rel-km-kpi-vel').textContent = (velMediaGeral > 0 ? Math.round(velMediaGeral*10)/10 : 0) + ' km/h';

    if (!_relKmDados.length) { lista.innerHTML = '<div class="rel-empty">Nenhum dado encontrado nesta data</div>'; return; }

    lista.innerHTML = '<table class="rel-table"><thead><tr>' +
      '<th>Motoboy</th><th>In\u00edcio</th><th>Base</th><th>Polaris</th><th>KM</th><th>TMD</th><th>Vel. M\u00e9dia</th><th>Status</th>' +
      '</tr></thead><tbody>' +
      _relKmDados.map(r => '<tr>' +
        '<td class="rel-nome">' + r.nome + '</td>' +
        '<td class="rel-hora">' + r.inicio + '</td>' +
        '<td class="rel-hora">' + r.base + '</td>' +
        '<td class="rel-hora">' + r.polaris + '</td>' +
        '<td class="rel-km">' + r.km + ' km</td>' +
        '<td class="rel-hora">' + formatMin(r.tmdMin) + '</td>' +
        '<td class="rel-hora">' + (r.velMedia > 0 ? r.velMedia + ' km/h' : '\u2014') + '</td>' +
        '<td>' + (r.temPolaris ? '<span class="rel-badge rel-b-ok">\u2713 Completo</span>' : '<span class="rel-badge rel-b-warn">\u26a0 Sem Polaris</span>') + '</td>' +
        '</tr>').join('') +
      '</tbody></table>';
  } catch(e) { lista.innerHTML = '<div class="rel-empty">Erro ao carregar dados</div>'; }
}

// ── RELATÓRIO: HORÁRIOS DE COLETA (MODIFICADO COM VALIDAÇÃO) ────────────────
async function carregarRelHorarios() {
  const lista = document.getElementById('rel-hor-lista');
  const dataInp = document.getElementById('rel-hor-data');
  const rota = document.getElementById('rel-hor-rota')?.value.trim();
  
  if (!dataEstaOk(dataInp)) {
      toast('Data inválida ou futura!');
      return;
  }
  const data = dataInp.value;

  lista.innerHTML = '<div class="rel-empty"><span class="spinner"></span> Carregando...</div>';
  try {
    let urlReq = API + '/relatorio-horarios?data=' + data;
    if (rota) urlReq += '&rota=' + encodeURIComponent(rota);
    const r = await fetch(urlReq);
    const d = await r.json();
    _relHorDados = d.coletas || [];
    if (!_relHorDados.length) { lista.innerHTML = '<div class="rel-empty">Nenhuma coleta encontrada</div>'; return; }

    function fmtHora(ts) {
      if (!ts) return '\u2014';
      return new Date(ts).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    }
    function fmtDiffMin(tsChegada, tsFinal) {
      if (!tsChegada || !tsFinal) return '';
      const diff = Math.round((tsFinal - tsChegada) / 60000);
      if (diff <= 0) return '';
      return ' <span style="font-size:10px;color:#94A8B8">(+' + diff + 'min)</span>';
    }

    lista.innerHTML = '<table class="rel-table"><thead><tr>' +
      '<th>Cliente</th><th>Rota</th><th>Chegada GPS</th><th>Finalização</th><th>Coordenada</th><th>Status</th>' +
      '</tr></thead><tbody>' +
      _relHorDados.map(c => {
        const temChegadaGps = !!c.horario_chegada_gps;
        const coordBadge = (c.coordenada_ok === null || c.coordenada_ok === undefined)
          ? '<span class="rel-sub">\u2014</span>'
          : (c.coordenada_ok ? '<span class="rel-badge rel-b-ok">\u2713 OK</span>' : '<span class="rel-badge rel-b-err" title="Dist\u00e2ncia: ' + (c.distancia_finalizacao_m||'?') + 'm">\u26a0 N\u00e3o bate</span>');
        return '<tr>' +
          '<td class="rel-nome">' + c.nome_cliente + '</td>' +
          '<td class="rel-sub">' + (c.rota||'\u2014') + '</td>' +
          '<td class="rel-hora">' + (temChegadaGps ? fmtHora(c.horario_chegada_gps) : '<span class="rel-sub">sem GPS</span>') + '</td>' +
          '<td class="rel-hora">' + fmtHora(c.timestamp) + fmtDiffMin(c.horario_chegada_gps, c.timestamp) + '</td>' +
          '<td>' + coordBadge + '</td>' +
          '<td>' + (c.produtividade === 'produtiva' ? '<span class="rel-badge rel-b-ok">\u2713 Produtiva</span>' : '<span class="rel-badge rel-b-err">\u2717 Improdutiva</span>') + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table>';
  } catch(e) { lista.innerHTML = '<div class="rel-empty">Erro ao carregar dados</div>'; }
}

// ── RELATÓRIO: CHECKLIST (MODIFICADO COM VALIDAÇÃO) ──────────────────
async function carregarRelChecklist() {
  const lista = document.getElementById('rel-chk-lista');
  const dataInp = document.getElementById('rel-chk-data');
  
  if (!dataEstaOk(dataInp)) {
      toast('Data inválida ou futura!');
      return;
  }
  const data = dataInp.value;
  
  lista.innerHTML = '<div class="rel-empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const dataBR = data.split('-').reverse().join('/');
    const r = await fetch(API + '/checklist?data=' + encodeURIComponent(dataBR));
    const d = await r.json();
    _relChkDados = d.checklists || d.resultados || [];
    if (!_relChkDados.length) { lista.innerHTML = '<div class="rel-empty">Nenhum checklist encontrado nesta data</div>'; return; }

    lista.innerHTML = '<table class="rel-table"><thead><tr>' +
      '<th>Motoboy</th><th>Rota</th><th>Placa</th><th>Preenchido em</th>' +
      '</tr></thead><tbody>' +
      _relChkDados.map(c => '<tr>' +
        '<td class="rel-nome">' + (c.biocondutor||'\u2014') + '</td>' +
        '<td class="rel-sub">' + (c.rota||'\u2014') + '</td>' +
        '<td class="rel-sub">' + (c.placa||'\u2014') + '</td>' +
        '<td class="rel-hora">' + (c.data_checklist||'\u2014') + '</td>' +
        '</tr>').join('') +
      '</tbody></table>';
  } catch(e) { lista.innerHTML = '<div class="rel-empty">Erro ao carregar dados</div>'; }
}

// ── RELATÓRIO: OCORRÊNCIAS (MODIFICADO COM VALIDAÇÃO) ──────────────────
async function carregarOcorrencias() {
  const lista = document.getElementById('oc-lista');
  if (!lista) return;
  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';

  const dataInp = document.getElementById('oc-filtro-data');
  if (dataInp && dataInp.value && !dataEstaOk(dataInp)) {
      toast('Data de ocorrência inválida!');
      lista.innerHTML = '<div class="empty">Selecione uma data válida</div>';
      return;
  }
  
  const data = dataInp?.value || new Date().toISOString().split('T')[0];
  const tipo = document.getElementById('oc-filtro-tipo')?.value || '';
  const status = document.getElementById('oc-filtro-status')?.value || '';

  try {
    const r = await fetch(API + '/ocorrencia?data=' + data);
    const d = await r.json();
    let ocs = d.ocorrencias || [];
    if (tipo) ocs = ocs.filter(o => o.tipo === tipo);
    if (status) ocs = ocs.filter(o => o.status === status);

    if (!ocs.length) { lista.innerHTML = '<div class="empty">Nenhuma ocorrência encontrada</div>'; return; }

    const statusBadge = s => ({
      aberta:         '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#FEF9EC;color:#92400E">🟡 Aberta</span>',
      em_andamento: '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#EFF6FF;color:#1D4ED8">🔵 Em andamento</span>',
      resolvida:    '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#F0FDF4;color:#166534">✅ Resolvida</span>',
    })[s] || '';

    const tipoLabel = t => t === 'nao_comparecimento' ? '🔴 Não comparecimento' : t === 'atraso' ? '⏰ Atraso' : t;
    const hora = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

    lista.innerHTML = ocs.map(o => `
      <div onclick="abrirModalOcorrencia(${o.id})" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F0F4F8;cursor:pointer;transition:.15s" onmouseover="this.style.background='#F8FBFD'" onmouseout="this.style.background=''">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-size:11px;font-weight:800;color:#0F4C7A;background:#EFF6FF;padding:1px 7px;border-radius:20px">${o.codigo || '—'}</span>
            ${statusBadge(o.status)}
          </div>
          <div style="font-size:13px;font-weight:700;color:#0F2940">${o.motoboy_nome}</div>
          <div style="font-size:11px;color:#5A7A8F;margin-top:1px">${tipoLabel(o.tipo)}${o.motivo_label ? ' · ' + o.motivo_label : ''}${o.rota ? ' · ' + o.rota : ''}</div>
          ${o.motivo ? `<div style="font-size:11px;color:#94A8B8;font-style:italic;margin-top:1px">↳ ${o.motivo}</div>` : ''}
        </div>
        <div style="font-size:11px;color:#94A8B8;flex-shrink:0">${hora(o.timestamp)}</div>
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<div class="empty">Erro ao carregar ocorrências</div>';
  }
}

// ── PASSAGENS NOS PONTOS — lista cronológica (MODIFICADO COM VALIDAÇÃO) ────────────
async function carregarPassagensPontos() {
  const lista = document.getElementById('pp-lista');
  const dataInp = document.getElementById('pp-data');
  const rota = document.getElementById('pp-rota-sel')?.value;
  
  if (!lista) return;
  if (!dataEstaOk(dataInp)) { toast('Data inválida ou futura!'); return; }
  const data = dataInp.value;

  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    let urlReq = API + '/passagens-pontos?data=' + data;
    if (rota) urlReq += '&rota=' + encodeURIComponent(rota);
    const r = await fetch(urlReq);
    const d = await r.json();
    const passagens = d.passagens || [];

    if (!passagens.length) {
      lista.innerHTML = '<div class="empty">Nenhuma passagem registrada nesta data</div>';
      return;
    }

    const porMotoboy = {};
    passagens.forEach(p => {
      const key = p.nome_motoboy + '|' + p.rota;
      if (!porMotoboy[key]) porMotoboy[key] = { nome: p.nome_motoboy, rota: p.rota, passagens: [] };
      porMotoboy[key].passagens.push(p);
    });

    function fmtHora(ts) {
      const sp = new Date(ts - 3*60*60*1000);
      return String(sp.getUTCHours()).padStart(2,'0') + ':' + String(sp.getUTCMinutes()).padStart(2,'0');
    }

    lista.innerHTML = Object.values(porMotoboy).map(g => `
      <div style="border-bottom:1px solid #F0F4F8;padding:8px 0">
        <div style="padding:2px 14px;font-size:12px;font-weight:700;color:#0F4C7A">${g.nome} <span style="font-weight:400;color:#94A8B8">· ${g.rota}</span></div>
        ${g.passagens.sort((a,b)=>a.timestamp-b.timestamp).map(p => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 14px 4px 24px">
            <span style="font-size:12px;font-weight:700;color:#1D4ED8;min-width:42px">${fmtHora(p.timestamp)}</span>
            <span style="font-size:11px;color:#5A7A8F">📌 ${p.ponto_nome}</span>
            <span style="font-size:10px;color:#94A8B8;margin-left:auto">${p.distancia_m}m</span>
          </div>`).join('')}
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

// ... Restante das funções de chat, replay, etc. permanecem inalteradas ...
