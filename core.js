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

    // Popula select de motoboys
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

    const labelDia = d => ({ seg:'Segunda', ter:'Terça', qua:'Quarta', qui:'Quinta', sex:'Sexta', sab:'Sábado', dom:'Domingo' })[d] || d;

    // Agrupa por nome
    const porNome = {};
    horarios.forEach(h => {
      const key = h.nome || h.telefone;
      if (!porNome[key]) porNome[key] = { telefone: h.telefone, nome: h.nome, dias: [] };
      porNome[key].dias.push(h);
    });

    lista.innerHTML = Object.values(porNome).map(p => {
      // Agrupa dias com mesmo horário
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

    // Gera lista de datas no período
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
            // Estimativa de tempo baseada nos pontos (intervalo médio de 30s entre pontos)
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

  // Usa a função centralizada que garante a data correta de SP
  const hoje = getDataLocalSP(); 
  
  // Para exibir no layout, formatamos apenas a visualização
  const hojeStr = new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});

  const dataEl = document.getElementById('resumo-dia-data');
  if (dataEl) dataEl.textContent = hojeStr;

  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';

  try {
    // Agora 'hoje' contém a string '2026-06-27' (exemplo) sempre correta
    const [rMb, rConf, rGeo, rKm] = await Promise.all([
      fetch(API + '/motoboys?todos=1&agrupado=1'),
      fetch(API + '/historico-confirmacoes?data_inicio=' + hoje + '&data_fim=' + hoje),
      fetch(API + '/geofence-evento?data=' + hoje),
      fetch(API + '/localizacao?dia=' + hoje)
    ]);
    // ... restante do seu código segue igual

    const dMb   = await rMb.json();
    const dConf = await rConf.json();
    const dGeo  = await rGeo.json();
    const dKm   = await rKm.json();

    const motoboys     = (dMb.motoboys || []).filter(m => m.rastrear !== 0 && m.rastrear !== false);
    const confirmacoes = dConf.confirmacoes || [];
    const eventos      = dGeo.eventos || [];
    const historico    = dKm.historico || [];

    // Só mostra quem confirmou presença hoje
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
  // Esconde tela de login
  const screen = document.getElementById('painel-login-screen');
  if (screen) screen.style.display = 'none';
  // Atualiza footer
  const iniciais = _painelUsuario.nome.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  const sfAv = document.getElementById('sf-av-iniciais');
  const sfNome = document.getElementById('sf-nome-usuario');
  const sfRole = document.getElementById('sf-role-usuario');
  if (sfAv) sfAv.textContent = iniciais;
  if (sfNome) sfNome.textContent = _painelUsuario.nome;
  if (sfRole) sfRole.textContent = _painelUsuario.master ? '⭐ Master' : 'Gestor';
  // Aplica permissões no menu
  aplicarPermissoesMenu();
  // Carrega resumo do dia imediatamente
  setTimeout(carregarResumoDia, 500);
}

function temPermissao(modulo) {
  if (!_painelUsuario) return false;
  if (_painelUsuario.master) return true;
  return _painelUsuario.permissoes.includes('all') || _painelUsuario.permissoes.includes(modulo);
}

function aplicarPermissoesMenu() {
  const mapa = {
    'confirmacoes':      'confirmacoes',
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

  // Esconde botões sem permissão
  document.querySelectorAll('.nav-item[onclick*="setView"]').forEach(btn => {
    const match = btn.getAttribute('onclick').match(/setView\('([^']+)'/);
    if (!match) return;
    const view = match[1];
    const modulo = mapa[view];
    // Se não está no mapa, é o painel principal — sempre visível
    if (modulo === undefined) return;
    if (modulo && !temPermissao(modulo)) btn.style.display = 'none';
  });

  // Esconde usuários se não master
  const navUsuarios = document.getElementById('nav-btn-usuarios');
  if (navUsuarios && !_painelUsuario?.master) navUsuarios.style.display = 'none';

  // Botões que requerem permissão específica (não usam setView)
  const btnsMaster = ['nav-btn-apk', 'nav-btn-gps-offline', 'nav-btn-treinamentos'];
  btnsMaster.forEach(id => {
    const el = document.getElementById(id);
    if (el && !_painelUsuario?.master) el.style.display = 'none';
  });

  const btnCriarRota = document.getElementById('nav-btn-criar-rota');
  if (btnCriarRota && !temPermissao('criar_rota')) btnCriarRota.style.display = 'none';
  const btnAlterarRota = document.getElementById('nav-btn-alterar-rota');
  if (btnAlterarRota && !temPermissao('alterar_rota')) btnAlterarRota.style.display = 'none';

  // Esconde group labels se todos os itens do grupo estiverem escondidos
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
  // Mostra tela de login
  const screen = document.getElementById('painel-login-screen');
  if (screen) { screen.style.display = 'flex'; }
  const input = document.getElementById('login-tel');
  if (input) { input.value = ''; }
  // Restaura menu
  document.querySelectorAll('.nav-item').forEach(b => b.style.display = '');
}

// Verifica sessão ao carregar
(function() {
  const saved = sessionStorage.getItem('painel_usuario');
  if (saved) {
    try {
      _painelUsuario = JSON.parse(saved);
      // Aplica após DOM carregar
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
let _adminRecorder = null;
let _adminChunks = [];
let _adminTimer = null;
let _adminSeg = 0;

async function iniciarGravacaoAdmin(e) {
  e.preventDefault();
  if (_adminRecorder?.state === 'recording') return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _adminRecorder = new MediaRecorder(stream);
    _adminChunks = [];
    _adminRecorder.ondataavailable = ev => { if (ev.data.size > 0) _adminChunks.push(ev.data); };
    _adminRecorder.start();
    const btn = document.getElementById('btn-gravar-admin');
    const ind = document.getElementById('gravacao-admin-indicator');
    if (btn) { btn.style.background = '#FEF2F2'; btn.style.color = '#EF4444'; btn.textContent = '⏹'; }
    if (ind) ind.style.display = 'flex';
    _adminSeg = 0;
    _adminTimer = setInterval(() => {
      _adminSeg++;
      const el = document.getElementById('gravacao-admin-timer');
      if (el) el.textContent = _adminSeg + 's';
      if (_adminSeg >= 60) pararGravacaoAdmin(e);
    }, 1000);
  } catch(err) { alert('Não foi possível acessar o microfone.'); }
}

async function pararGravacaoAdmin(e) {
  e.preventDefault();
  if (!_adminRecorder || _adminRecorder.state !== 'recording') return;
  clearInterval(_adminTimer);
  const btn = document.getElementById('btn-gravar-admin');
  const ind = document.getElementById('gravacao-admin-indicator');
  if (btn) { btn.style.background = '#EFF6FF'; btn.style.color = '#0F4C7A'; btn.textContent = '🎤'; }
  if (ind) ind.style.display = 'none';
  _adminRecorder.stop();
  _adminRecorder.stream.getTracks().forEach(t => t.stop());
  _adminRecorder.onstop = async () => {
    if (_adminSeg < 1) return;
    const blob = new Blob(_adminChunks, { type: 'audio/webm' });
    await enviarAudioAdmin(blob, _adminSeg);
  };
}

async function enviarAudioAdmin(blob, duracao) {
  if (!chatMotoboyAtual) return;
  try {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      await fetch(API + '/chat-audio-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone_motoboy: chatMotoboyAtual, audio_base64: base64, duracao })
      });
      carregarMensagens(chatMotoboyAtual, false);
    };
  } catch(e) { toast('Erro ao enviar áudio'); }
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
  // Gera código automaticamente baseado na label
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

function ocMudarAba(aba, btn) {
  document.getElementById('oc-conteudo-lista').style.display = aba === 'lista' ? 'block' : 'none';
  document.getElementById('oc-conteudo-motivos').style.display = aba === 'motivos' ? 'block' : 'none';
  document.getElementById('oc-aba-lista').style.background = aba === 'lista' ? '#0F4C7A' : 'none';
  document.getElementById('oc-aba-lista').style.color = aba === 'lista' ? '#fff' : '#5A7A8F';
  document.getElementById('oc-aba-motivos').style.background = aba === 'motivos' ? '#0F4C7A' : 'none';
  document.getElementById('oc-aba-motivos').style.color = aba === 'motivos' ? '#fff' : '#5A7A8F';
  if (aba === 'motivos') carregarMotivos();
  if (aba === 'lista') carregarOcorrencias();
}
let _ocorrenciaAtual = null;
let _statusOcAtual = 'aberta';

async function abrirCriarOcorrencia() {
  const form = document.getElementById('form-criar-oc');
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'none') return;

  // Popula select de motoboys
  const selMoto = document.getElementById('oc-criar-motoboy');
  if (selMoto && selMoto.options.length <= 1) {
    try {
      const r = await fetch(API + '/motoboys?todos=1&agrupado=1');
      const d = await r.json();
      (d.motoboys || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.nome; opt.textContent = m.nome;
        selMoto.appendChild(opt);
      });
    } catch(e) {}
  }

  // Popula select de motivos
  const selMot = document.getElementById('oc-criar-motivo-sel');
  if (selMot && selMot.options.length <= 1) {
    try {
      const r = await fetch(API + '/motivos-ausencia');
      const d = await r.json();
      (d.motivos || []).filter(m => m.ativo !== 0).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.label; opt.textContent = m.emoji + ' ' + m.label;
        selMot.appendChild(opt);
      });
    } catch(e) {}
  }
}

async function criarOcorrenciaGestor() {
  const motoboy = document.getElementById('oc-criar-motoboy')?.value;
  const tipo = document.getElementById('oc-criar-tipo')?.value || 'gestor';
  const rota = document.getElementById('oc-criar-rota')?.value.trim();
  const motivoSel = document.getElementById('oc-criar-motivo-sel')?.value;
  const desc = document.getElementById('oc-criar-desc')?.value.trim();

  if (!motoboy) { toast('Selecione o motoboy'); return; }
  if (!desc && !motivoSel) { toast('Informe o motivo ou descrição'); return; }

  try {
    await fetch(API + '/ocorrencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo,
        motivo_label: motivoSel || '',
        motoboy_nome: motoboy,
        rota: rota || '',
        motivo: desc || motivoSel || ''
      })
    });
    document.getElementById('form-criar-oc').style.display = 'none';
    document.getElementById('oc-criar-motoboy').value = '';
    document.getElementById('oc-criar-rota').value = '';
    document.getElementById('oc-criar-desc').value = '';
    document.getElementById('oc-criar-motivo-sel').value = '';
    toast('✓ Ocorrência registrada');
    carregarOcorrencias();
  } catch(e) { toast('Erro ao registrar'); }
}

async function gerarPdfDia() {
  const data = document.getElementById('oc-filtro-data')?.value || new Date().toISOString().split('T')[0];
  try {
    const r = await fetch(API + '/ocorrencia?data=' + data);
    const d = await r.json();
    const ocs = d.ocorrencias || [];
    if (!ocs.length) { toast('Nenhuma ocorrência nesta data'); return; }

    const dataFmt = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
    const tipoLabel = t => t === 'nao_comparecimento' ? 'Não comparecimento' : t === 'atraso' ? 'Atraso' : t === 'gestor' ? 'Registrada pelo gestor' : t;
    const statusLabel = s => s === 'resolvida' ? '✅ Resolvida' : s === 'em_andamento' ? '🔵 Em andamento' : '🟡 Aberta';

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
      <title>Ocorrências ${dataFmt}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; padding: 32px; color: #0F2940; font-size: 13px; }
        .header { border-bottom: 3px solid #00AEEF; padding-bottom: 14px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:flex-end; }
        .logo { font-size: 20px; font-weight: 800; color: #0F4C7A; }
        .logo span { color: #00AEEF; }
        h1 { font-size: 16px; font-weight: 800; color: #0F4C7A; margin-bottom: 4px; }
        .sub { font-size: 12px; color: #5A7A8F; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #0F4C7A; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
        td { padding: 8px 10px; border-bottom: 1px solid #EBF1F5; vertical-align: top; }
        tr:nth-child(even) td { background: #F8FBFD; }
        .footer { margin-top: 20px; border-top: 1px solid #EBF1F5; padding-top: 10px; font-size: 10px; color: #94A8B8; }
        @media print { body { padding: 16px; } }
      </style>
    </head><body>
      <div class="header">
        <div class="logo">LOG<span>LIFE</span> <span style="font-size:12px;font-weight:400;color:#5A7A8F">Logística</span></div>
        <div style="font-size:11px;color:#5A7A8F">Total: ${ocs.length} ocorrência(s)</div>
      </div>
      <h1>Relatório de Ocorrências</h1>
      <div class="sub">Data: ${dataFmt} · Gerado em: ${new Date().toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo'})}</div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Tipo</th>
            <th>Rota</th>
            <th>Motivo</th>
            <th>Obs. Gestor</th>
            <th>Status</th>
            <th>Horário</th>
          </tr>
        </thead>
        <tbody>
          ${ocs.map(o => `<tr>
            <td><strong>${o.codigo || '—'}</strong></td>
            <td>${tipoLabel(o.tipo)}${o.motivo_label ? '<br><span style="font-size:10px;color:#5A7A8F">' + o.motivo_label + '</span>' : ''}</td>
            <td>${o.rota || '—'}</td>
            <td style="font-size:11px">${o.motivo || '—'}</td>
            <td style="font-size:11px">${o.obs_gestor || '—'}</td>
            <td>${statusLabel(o.status)}</td>
            <td>${new Date(o.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">Loglife Logística · Documento gerado automaticamente</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  } catch(e) { toast('Erro ao gerar PDF'); }
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
  const data = document.getElementById('rel-km-data')?.value;
  if (!data) { toast('Selecione a data'); return; }
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
    // TMD — tempo total de movimentação (do primeiro ao último ponto GPS do dia)
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
      // Base: mostra só a 1ª e a última passagem do dia (ida e volta), não todas
      // as idas/vindas. Polaris continua mostrando todas as passagens configuradas.
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

function exportarRelKmExcel() {
  if (!_relKmDados.length) { toast('Nenhum dado para exportar'); return; }
  const linhas = [['Motoboy','In\u00edcio','Base','Polaris','KM','TMD (min)','Vel. M\u00e9dia (km/h)']];
  _relKmDados.forEach(r => linhas.push([r.nome, r.inicio, r.base, r.polaris, r.km, r.tmdMin, r.velMedia]));
  relExportarXLSX(linhas, 'quilometragem', 'Quilometragem');
}

function exportarRelKmPDF() {
  if (!_relKmDados.length) { toast('Nenhum dado para exportar'); return; }
  const fmtMin = m => { if (!m) return '\u2014'; const h=Math.floor(m/60), r=m%60; return h>0 ? h+'h'+String(r).padStart(2,'0')+'m' : r+'min'; };
  const linhas = _relKmDados.map(r => '<tr><td>' + r.nome + '</td><td>' + r.inicio + '</td><td>' + r.base + '</td><td>' + r.polaris + '</td><td><strong>' + r.km + ' km</strong></td><td>' + fmtMin(r.tmdMin) + '</td><td>' + (r.velMedia>0?r.velMedia+' km/h':'\u2014') + '</td></tr>').join('');
  relAbrirPDF('Relat\u00f3rio de Quilometragem', '<table><thead><tr><th>Motoboy</th><th>In\u00edcio</th><th>Base</th><th>Polaris</th><th>KM</th><th>TMD</th><th>Vel. M\u00e9dia</th></tr></thead><tbody>' + linhas + '</tbody></table>');
}

// ── RELATÓRIO: INCONSISTÊNCIAS ───────────────────────────────
let _relIncDados = [];

async function carregarRelInconsistencias() {
  const lista = document.getElementById('rel-inc-lista');
  const i1 = document.getElementById('rel-inc-inicio')?.value;
  const i2 = document.getElementById('rel-inc-fim')?.value;
  if (!i1 || !i2) { toast('Selecione o per\u00edodo'); return; }
  lista.innerHTML = '<div class="rel-empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const r = await fetch(API + '/relatorio-inconsistencias?data_inicio=' + i1 + '&data_fim=' + i2);
    const d = await r.json();
    _relIncDados = d.inconsistencias || [];
    const totalImprod = d.total_improdutivas || 0;
    const taxa = totalImprod > 0 ? Math.round(_relIncDados.length / totalImprod * 1000) / 10 : 0;

    document.getElementById('rel-inc-kpi-total').textContent = _relIncDados.length;
    document.getElementById('rel-inc-kpi-improd').textContent = totalImprod;
    document.getElementById('rel-inc-kpi-taxa').textContent = taxa + '%';

    if (!_relIncDados.length) { lista.innerHTML = '<div class="rel-empty">Nenhuma inconsist\u00eancia encontrada</div>'; return; }

    lista.innerHTML = '<table class="rel-table"><thead><tr>' +
      '<th>Motoboy</th><th>Cliente</th><th>Hor\u00e1rio</th><th>Motivo</th><th>Dist\u00e2ncia</th>' +
      '</tr></thead><tbody>' +
      _relIncDados.map(i => '<tr>' +
        '<td class="rel-nome">' + i.motoboy_nome + '</td>' +
        '<td><div class="rel-nome">' + i.cliente_nome + '</div><div class="rel-sub">' + (i.rota||'') + '</div></td>' +
        '<td class="rel-hora">' + new Date(i.timestamp).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) + '</td>' +
        '<td>' + (i.motivo||'\u2014') + '</td>' +
        '<td><span class="rel-badge rel-b-err">' + (i.distancia_m >= 1000 ? (i.distancia_m/1000).toFixed(1)+'km' : i.distancia_m+'m') + '</span></td>' +
        '</tr>').join('') +
      '</tbody></table>';
  } catch(e) { lista.innerHTML = '<div class="rel-empty">Erro ao carregar dados</div>'; }
}

function exportarRelIncExcel() {
  if (!_relIncDados.length) { toast('Nenhum dado para exportar'); return; }
  const linhas = [['Motoboy','Cliente','Rota','Hor\u00e1rio','Motivo','Dist\u00e2ncia (m)','Endere\u00e7o cadastrado']];
  _relIncDados.forEach(i => linhas.push([i.motoboy_nome, i.cliente_nome, i.rota||'', new Date(i.timestamp).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}), i.motivo||'', i.distancia_m, i.endereco_cadastrado||'']));
  relExportarXLSX(linhas, 'inconsistencias', 'Inconsistencias');
}

function exportarRelIncPDF() {
  if (!_relIncDados.length) { toast('Nenhum dado para exportar'); return; }
  const linhas = _relIncDados.map(i => '<tr><td>' + i.motoboy_nome + '</td><td>' + i.cliente_nome + '</td><td>' + (i.rota||'\u2014') + '</td><td>' + new Date(i.timestamp).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) + '</td><td>' + (i.motivo||'\u2014') + '</td><td><strong>' + i.distancia_m + 'm</strong></td></tr>').join('');
  relAbrirPDF('Relat\u00f3rio de Inconsist\u00eancias', '<table><thead><tr><th>Motoboy</th><th>Cliente</th><th>Rota</th><th>Hor\u00e1rio</th><th>Motivo</th><th>Dist\u00e2ncia</th></tr></thead><tbody>' + linhas + '</tbody></table>');
}

// ── RELATÓRIO: HORÁRIOS DE COLETA ────────────────────────────
let _relHorDados = [];

async function carregarRelHorarios() {
  const lista = document.getElementById('rel-hor-lista');
  const data = document.getElementById('rel-hor-data')?.value;
  const rota = document.getElementById('rel-hor-rota')?.value.trim();
  if (!data) { toast('Selecione a data'); return; }
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

function exportarRelHorExcel() {
  if (!_relHorDados.length) { toast('Nenhum dado para exportar'); return; }
  const linhas = [['Cliente','Rota','Chegada GPS','Finalização','Distância chegada (m)','Distância finalização (m)','Coordenada OK','Produtividade','Motivo Improdutiva']];
  _relHorDados.forEach(c => linhas.push([
    c.nome_cliente, c.rota||'',
    c.horario_chegada_gps ? new Date(c.horario_chegada_gps).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}) : '',
    c.timestamp ? new Date(c.timestamp).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}) : '',
    c.distancia_chegada_m ?? '', c.distancia_finalizacao_m ?? '',
    (c.coordenada_ok === null || c.coordenada_ok === undefined) ? '' : (c.coordenada_ok ? 'Sim' : 'Não'),
    c.produtividade||'', c.motivo_improdutiva||''
  ]));
  relExportarXLSX(linhas, 'horarios-coleta', 'Horarios');
}

function exportarRelHorPDF() {
  if (!_relHorDados.length) { toast('Nenhum dado para exportar'); return; }
  const linhas = _relHorDados.map(c => '<tr><td>' + c.nome_cliente + '</td><td>' + (c.rota||'\u2014') + '</td><td>' + (c.horario_chegada||'\u2014') + '</td><td>' + (c.produtividade === 'produtiva' ? '\u2713 Produtiva' : '\u2717 Improdutiva') + '</td></tr>').join('');
  relAbrirPDF('Relat\u00f3rio de Hor\u00e1rios de Coleta', '<table><thead><tr><th>Cliente</th><th>Rota</th><th>Chegada</th><th>Status</th></tr></thead><tbody>' + linhas + '</tbody></table>');
}

// ── RELATÓRIO: CHECKLIST ─────────────────────────────────────
let _relChkDados = [];

async function carregarRelChecklist() {
  const lista = document.getElementById('rel-chk-lista');
  const data = document.getElementById('rel-chk-data')?.value;
  if (!data) { toast('Selecione a data'); return; }
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

function exportarRelChecklistPDF() {
  if (!_relChkDados.length) { toast('Nenhum dado para exportar'); return; }
  const linhas = _relChkDados.map(c => '<tr><td>' + (c.biocondutor||'\u2014') + '</td><td>' + (c.rota||'\u2014') + '</td><td>' + (c.placa||'\u2014') + '</td><td>' + (c.data_checklist||'\u2014') + '</td></tr>').join('');
  relAbrirPDF('Relat\u00f3rio de Checklist', '<table><thead><tr><th>Motoboy</th><th>Rota</th><th>Placa</th><th>Preenchido em</th></tr></thead><tbody>' + linhas + '</tbody></table>');
}

// ── UTILITÁRIOS DE EXPORTAÇÃO ─────────────────────────────────
function relExportarXLSX(linhas, nomeArquivo, nomeAba) {
  const gerar = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(linhas);
    XLSX.utils.book_append_sheet(wb, ws, nomeAba || 'Dados');
    XLSX.writeFile(wb, nomeArquivo + '-' + new Date().toISOString().split('T')[0] + '.xlsx');
  };
  if (typeof XLSX !== 'undefined') { gerar(); } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = gerar;
    document.head.appendChild(script);
  }
}

function relAbrirPDF(titulo, tabelaHtml) {
  const win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>' + titulo + '</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#0F2940;font-size:12px}' +
    '.header{border-bottom:3px solid #00AEEF;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}' +
    '.logo{font-size:20px;font-weight:800;color:#0F4C7A}.logo span{color:#00AEEF}' +
    'h1{font-size:16px;font-weight:800;color:#0F4C7A;margin-bottom:16px}' +
    'table{width:100%;border-collapse:collapse}th{background:#0F4C7A;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase}' +
    'td{padding:7px 10px;border-bottom:1px solid #EBF1F5;font-size:11px}tr:nth-child(even) td{background:#F8FBFD}' +
    '.footer{margin-top:20px;border-top:1px solid #EBF1F5;padding-top:10px;font-size:10px;color:#94A8B8}' +
    '@media print{body{padding:16px}}</style></head><body>' +
    '<div class="header"><div class="logo">LOG<span>LIFE</span></div><div style="font-size:11px;color:#5A7A8F">' + new Date().toLocaleDateString('pt-BR') + '</div></div>' +
    '<h1>' + titulo + '</h1>' + tabelaHtml +
    '<div class="footer">Loglife Log\u00edstica \u00b7 Documento gerado automaticamente</div></body></html>');
  win.document.close();
  setTimeout(() => win.print(), 500);
}

async function carregarOcorrencias() {
  const lista = document.getElementById('oc-lista');
  if (!lista) return;
  lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';

  const data = document.getElementById('oc-filtro-data')?.value || new Date().toISOString().split('T')[0];
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
      aberta:       '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#FEF9EC;color:#92400E">🟡 Aberta</span>',
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

async function abrirModalOcorrencia(id) {
  try {
    const agora = new Date();
    const diaSP = new Date(agora.getTime() - 3*60*60*1000);
    const data = diaSP.toISOString().split('T')[0];
    const r = await fetch(API + '/ocorrencia?data=' + data);
    const d = await r.json();
    const oc = (d.ocorrencias || []).find(o => o.id === id);
    if (!oc) return;
    _ocorrenciaAtual = oc;
    _statusOcAtual = oc.status || 'aberta';

    document.getElementById('moc-codigo').textContent = oc.codigo || 'OC-???';
    const tipoLabel = oc.tipo === 'nao_comparecimento' ? '🔴 Não comparecimento' : '⏰ Atraso';
    document.getElementById('moc-tipo').textContent = tipoLabel + (oc.motivo_label ? ' · ' + oc.motivo_label : '');
    document.getElementById('moc-obs').value = oc.obs_gestor || '';

    const hora = new Date(oc.timestamp).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    document.getElementById('moc-info').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#F8FBFD;border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;margin-bottom:3px">Coletor</div>
            <div style="font-size:13px;font-weight:700;color:#0F2940">${oc.motoboy_nome}</div>
          </div>
          <div style="background:#F8FBFD;border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;margin-bottom:3px">Rota</div>
            <div style="font-size:13px;font-weight:700;color:#0F2940">${oc.rota || '—'}</div>
          </div>
          <div style="background:#F8FBFD;border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;margin-bottom:3px">Horário</div>
            <div style="font-size:13px;font-weight:700;color:#0F2940">${hora}</div>
          </div>
          <div style="background:#F8FBFD;border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;margin-bottom:3px">Código tipo</div>
            <div style="font-size:13px;font-weight:700;color:#0F2940">${oc.codigo_tipo || '—'}</div>
          </div>
        </div>
        ${oc.motivo ? `<div style="background:#FEF9EC;border-radius:8px;padding:10px 12px;border-left:3px solid #F59E0B">
          <div style="font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;margin-bottom:3px">Motivo informado</div>
          <div style="font-size:13px;color:#0F2940">${oc.motivo}</div>
        </div>` : ''}
        ${oc.minutos_atraso ? `<div style="background:#EFF6FF;border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;margin-bottom:3px">Previsão de atraso</div>
          <div style="font-size:13px;font-weight:700;color:#0F2940">${oc.minutos_atraso} minutos${oc.cliente_nome ? ' em ' + oc.cliente_nome : ''}</div>
        </div>` : ''}
      </div>`;

    // Marca status atual
    document.querySelectorAll('.oc-status-btn').forEach(b => { b.style.opacity = '0.5'; });
    const statusMap = { aberta: 0, em_andamento: 1, resolvida: 2 };
    const btns = document.querySelectorAll('.oc-status-btn');
    if (btns[statusMap[_statusOcAtual]]) { btns[statusMap[_statusOcAtual]].style.opacity = '1'; }

    document.getElementById('modal-ocorrencia').style.display = 'flex';
    // Marca como lida
    await fetch(API + '/ocorrencia', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
  } catch(e) { console.error(e); }
}

function fecharModalOcorrencia() {
  document.getElementById('modal-ocorrencia').style.display = 'none';
  _ocorrenciaAtual = null;
}

function setStatusOc(status, btn) {
  _statusOcAtual = status;
  document.querySelectorAll('.oc-status-btn').forEach(b => { b.style.opacity = '0.5'; });
  btn.style.opacity = '1';
}

async function salvarOcorrencia() {
  if (!_ocorrenciaAtual) return;
  const obs = document.getElementById('moc-obs').value.trim();
  try {
    await fetch(API + '/ocorrencia', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: _ocorrenciaAtual.id, obs_gestor: obs, status: _statusOcAtual })
    });
    toast('✓ Ocorrência salva');
    fecharModalOcorrencia();
    carregarOcorrencias();
  } catch(e) { toast('Erro ao salvar'); }
}

function gerarPdfOcorrencia() {
  if (!_ocorrenciaAtual) return;
  const oc = _ocorrenciaAtual;
  const obs = document.getElementById('moc-obs').value.trim();
  const hora = new Date(oc.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const tipoLabel = oc.tipo === 'nao_comparecimento' ? 'Não comparecimento' : 'Atraso';

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
    <title>Ocorrência ${oc.codigo}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; padding: 40px; color: #0F2940; }
      .header { border-bottom: 3px solid #00AEEF; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
      .logo { font-size: 22px; font-weight: 800; color: #0F4C7A; }
      .logo span { color: #00AEEF; }
      .codigo { font-size: 14px; font-weight: 700; color: #5A7A8F; }
      h1 { font-size: 18px; font-weight: 800; color: #0F4C7A; margin-bottom: 6px; }
      .subtitulo { font-size: 13px; color: #5A7A8F; margin-bottom: 24px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
      .campo { background: #F8FBFD; border-radius: 6px; padding: 10px 12px; border-left: 3px solid #00AEEF; }
      .campo-label { font-size: 10px; font-weight: 700; color: #5A7A8F; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
      .campo-valor { font-size: 14px; font-weight: 700; color: #0F2940; }
      .secao { margin-bottom: 20px; }
      .secao-titulo { font-size: 12px; font-weight: 700; color: #5A7A8F; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; border-bottom: 1px solid #EBF1F5; padding-bottom: 4px; }
      .obs-box { background: #F8FBFD; border-radius: 6px; padding: 12px; min-height: 60px; font-size: 13px; color: #0F2940; border: 1px solid #EBF1F5; }
      .footer { margin-top: 40px; border-top: 1px solid #EBF1F5; padding-top: 12px; font-size: 11px; color: #94A8B8; }
      @media print { body { padding: 20px; } }
    </style>
  </head><body>
    <div class="header">
      <div class="logo">LOG<span>LIFE</span> <span style="font-size:13px;font-weight:400;color:#5A7A8F">Logística</span></div>
      <div class="codigo">Registro de Ocorrência</div>
    </div>
    <h1>${oc.codigo || 'OC-???'}</h1>
    <div class="subtitulo">${hora} · ${tipoLabel}${oc.motivo_label ? ' — ' + oc.motivo_label : ''}</div>
    <div class="secao">
      <div class="secao-titulo">Informações da ocorrência</div>
      <div class="grid">
        <div class="campo"><div class="campo-label">Rota</div><div class="campo-valor">${oc.rota || '—'}</div></div>
        <div class="campo"><div class="campo-label">Código do tipo</div><div class="campo-valor">${oc.codigo_tipo || '—'}</div></div>
        <div class="campo"><div class="campo-label">Tipo</div><div class="campo-valor">${tipoLabel}</div></div>
        <div class="campo"><div class="campo-label">Data e hora</div><div class="campo-valor">${hora}</div></div>
        ${oc.minutos_atraso ? `<div class="campo" style="grid-column:1/-1"><div class="campo-label">Previsão de atraso</div><div class="campo-valor">${oc.minutos_atraso} minutos${oc.cliente_nome ? ' em ' + oc.cliente_nome : ''}</div></div>` : ''}
      </div>
    </div>
    ${oc.motivo ? `<div class="secao">
      <div class="secao-titulo">Motivo informado</div>
      <div class="obs-box">${oc.motivo}</div>
    </div>` : ''}
    <div class="secao">
      <div class="secao-titulo">Ação tomada pelo gestor</div>
      <div class="obs-box">${obs || 'Nenhuma observação registrada.'}</div>
    </div>
    <div class="secao">
      <div class="secao-titulo">Status</div>
      <div style="font-size:14px;font-weight:700;color:#0F2940">${_statusOcAtual === 'resolvida' ? '✅ Resolvida' : _statusOcAtual === 'em_andamento' ? '🔵 Em andamento' : '🟡 Aberta'}</div>
    </div>
    <div class="footer">Loglife Logística · Documento gerado automaticamente · ${new Date().toLocaleString('pt-BR', {timeZone:'America/Sao_Paulo'})}</div>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
let _ocorrenciasVistas = new Set();

async function verificarOcorrencias() {
  try {
    const r = await fetch(API + '/ocorrencia?nao_lidas=1');
    const d = await r.json();
    const ocorrencias = d.ocorrencias || [];
    for (const oc of ocorrencias) {
      if (_ocorrenciasVistas.has(oc.id)) continue;
      _ocorrenciasVistas.add(oc.id);
      mostrarPopupOcorrencia(oc);
    }
  } catch(e) {}
}

function mostrarPopupOcorrencia(oc) {
  const popId = 'popup-oc-' + oc.id;
  if (document.getElementById(popId)) return;
  const popup = document.createElement('div');
  popup.id = popId;
  popup.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:99999;width:320px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.2);border-left:4px solid #F59E0B;overflow:hidden;animation:slideInRight .3s cubic-bezier(.34,1.1,.64,1) both';
  const tipoLabel = oc.tipo === 'nao_comparecimento' ? '🔴 Não comparecimento' : oc.tipo === 'atraso' ? '⏰ Atraso' : oc.tipo === 'geral' ? '🚨 Ocorrência' : '📋 Ocorrência';
  const tipoIcone = oc.tipo === 'nao_comparecimento' ? '🔴' : oc.tipo === 'atraso' ? '⏰' : '🚨';
  popup.innerHTML = `
    <div style="padding:12px 14px 10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px">${tipoIcone}</span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:800;color:${oc.tipo === 'nao_comparecimento' ? '#991B1B' : '#92400E'}">${tipoLabel}${oc.motivo_label ? ' — ' + oc.motivo_label : ''}</div>
          <div style="font-size:11px;color:#5A7A8F">${oc.rota || ''} · ${new Date(oc.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        <button onclick="fecharOcorrencia(${oc.id},'${popId}')" style="background:none;border:none;color:#94A8B8;font-size:18px;cursor:pointer">✕</button>
      </div>
      <div style="font-size:13px;color:#0F2940;margin-bottom:4px">
        <strong>${oc.motoboy_nome}</strong>
        ${oc.tipo === 'nao_comparecimento' ? ' não irá comparecer hoje' : oc.tipo === 'atraso' ? ` vai atrasar <strong style="color:#F59E0B">${oc.minutos_atraso} min</strong> em <strong>${oc.cliente_nome}</strong>` : ' registrou uma ocorrência'}
      </div>
      ${oc.motivo ? `<div style="font-size:11px;color:#5A7A8F;font-style:italic">↳ ${oc.motivo}</div>` : ''}
      <button onclick="fecharOcorrencia(${oc.id},'${popId}')" style="width:100%;margin-top:10px;padding:8px;border-radius:8px;border:none;background:#FEF9EC;color:#92400E;font-size:12px;font-weight:700;cursor:pointer">✓ Entendido</button>
    </div>`;
  document.body.appendChild(popup);
  // Remove automaticamente após 60s se não interagir
  setTimeout(() => { if (document.getElementById(popId)) fecharOcorrencia(oc.id, popId); }, 60000);
}

async function fecharOcorrencia(id, popId) {
  document.getElementById(popId)?.remove();
  try { await fetch(API + '/ocorrencia', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) }); } catch(e) {}
}

// Inicia polling de ocorrências no painel — a cada 15s
setInterval(verificarOcorrencias, 15000);
setTimeout(verificarOcorrencias, 3000);
let _dispositivosTodos = [];

async function carregarDispositivos() {
  const lista = document.getElementById('disp-lista');
  const resumo = document.getElementById('disp-resumo');
  if (lista) lista.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const r = await fetch(API + '/status-dispositivos');
    const d = await r.json();
    _dispositivosTodos = d.dispositivos || [];
    renderizarDispositivos(_dispositivosTodos);
  } catch(e) {
    if (lista) lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

function renderizarDispositivos(lista) {
  const el = document.getElementById('disp-lista');
  const resumo = document.getElementById('disp-resumo');
  if (!el) return;

  const contadores = { ok: 0, sem_app: 0, sem_gps: 0, offline: 0, problema: 0 };
  lista.forEach(d => {
    if (d.status === 'ok') contadores.ok++;
    else if (d.status === 'sem_app') contadores.sem_app++;
    else if (d.status === 'offline') contadores.offline++;
    else contadores.problema++;
  });

  if (resumo) resumo.innerHTML = `
    <div style="background:#DCFCE7;border-radius:10px;padding:10px;text-align:center;border:1px solid #86EFAC">
      <div style="font-size:20px;font-weight:800;color:#166534">${contadores.ok}</div>
      <div style="font-size:10px;font-weight:700;color:#166534">✅ OK</div>
    </div>
    <div style="background:#F1F5F9;border-radius:10px;padding:10px;text-align:center;border:1px solid #CBD5E1">
      <div style="font-size:20px;font-weight:800;color:#475569">${contadores.sem_app}</div>
      <div style="font-size:10px;font-weight:700;color:#475569">📵 Sem app</div>
    </div>
    <div style="background:#FEF9EC;border-radius:10px;padding:10px;text-align:center;border:1px solid #FDE68A">
      <div style="font-size:20px;font-weight:800;color:#92400E">${contadores.problema}</div>
      <div style="font-size:10px;font-weight:700;color:#92400E">⚠️ Problema</div>
    </div>
    <div style="background:#FEE2E2;border-radius:10px;padding:10px;text-align:center;border:1px solid #FECACA">
      <div style="font-size:20px;font-weight:800;color:#991B1B">${contadores.offline}</div>
      <div style="font-size:10px;font-weight:700;color:#991B1B">🔴 Offline</div>
    </div>
    <div style="background:#F8FBFD;border-radius:10px;padding:10px;text-align:center;border:1px solid #EBF1F5">
      <div style="font-size:20px;font-weight:800;color:#0F4C7A">${lista.length}</div>
      <div style="font-size:10px;font-weight:700;color:#5A7A8F">Total</div>
    </div>`;

  if (!lista.length) { el.innerHTML = '<div class="empty">Nenhum dispositivo encontrado</div>'; return; }

  const statusInfo = {
    ok:         { badge: '✅ OK',                    bg: '#DCFCE7', cor: '#166534' },
    sem_app:    { badge: '📵 Sem app',               bg: '#F1F5F9', cor: '#475569' },
    sem_gps_bg: { badge: '🟡 GPS só durante uso',   bg: '#FEF9EC', cor: '#92400E' },
    sem_notif:  { badge: '🔕 Notificação desligada', bg: '#FEF2F2', cor: '#991B1B' },
    offline:    { badge: '🔴 Offline',               bg: '#FEE2E2', cor: '#991B1B' },
  };

  const formatTempo = min => {
    if (min === null) return '—';
    if (min < 60) return min + 'min atrás';
    return Math.floor(min/60) + 'h' + String(min%60).padStart(2,'0') + 'min atrás';
  };

  el.innerHTML = lista.map(d => {
    const s = statusInfo[d.status] || statusInfo.sem_app;
    const tipo = d.tipo === 'rastreador' ? '📡 Rastreador' : d.rastrear ? '🛵 CLT' : '🛵 MEI';
    return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #F0F4F8">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:#0F2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.nome}</div>
        <div style="font-size:11px;color:#94A8B8;margin-top:1px">${tipo} ${d.fabricante ? '· ' + d.fabricante : ''} ${d.ultimo_gps ? '· ' + formatTempo(d.minutos_offline) : ''}</div>
      </div>
      <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:${s.bg};color:${s.cor};white-space:nowrap">${s.badge}</span>
      ${d.tem_app ? `<button onclick="event.stopPropagation();encerrarSessaoMotoboy('${d.telefone.replace(/'/g,"\\'")}','${d.nome.replace(/'/g,"\\'")}')" title="Encerrar sess\u00e3o e GPS" style="background:#FEF2F2;border:1.5px solid #FECACA;color:#991B1B;border-radius:8px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">🚫 Encerrar</button>` : ''}
    </div>`;
  }).join('');
}

async function encerrarSessaoMotoboy(telefone, nome) {
  if (!confirm('Encerrar a sessão de ' + nome + '? O sistema removerá o acesso do painel.')) return;

  try {
    const r = await fetch(API + '/logout-remoto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, nome })
    });
    const d = await r.json();

    // Feedback visual para você
    if (d.status === 'ok') {
        toast('✓ Sessão de ' + nome + ' encerrada com sucesso.');
    } else {
        // Mesmo sem o token (erro), forçamos a limpeza do painel,
        // pois o objetivo administrativo é remover o usuário da tela.
        toast('Sessão limpa do painel (sem token no app).');
    }

    // A chave da correção: forçar a atualização da tela após o comando,
    // independentemente do sucesso do envio do push FCM.
    if (typeof carregarDispositivos === 'function') {
        carregarDispositivos();
    }

  } catch(e) {
    toast('Erro de conexão ao encerrar: ' + e.message);
  }
}

function filtrarDispositivos(filtro, btn) {
  document.querySelectorAll('[id^="disp-f-"]').forEach(b => {
    b.style.background = '#fff'; b.style.color = '#5A7A8F'; b.style.border = '1.5px solid #D6E5EE';
  });
  if (btn) { btn.style.background = '#0F4C7A'; btn.style.color = '#fff'; btn.style.border = 'none'; }
  let filtrado = _dispositivosTodos;
  if (filtro === 'ok') filtrado = _dispositivosTodos.filter(d => d.status === 'ok');
  else if (filtro === 'sem_app') filtrado = _dispositivosTodos.filter(d => d.status === 'sem_app');
  else if (filtro === 'offline') filtrado = _dispositivosTodos.filter(d => d.status === 'offline');
  else if (filtro === 'problema') filtrado = _dispositivosTodos.filter(d => d.status !== 'ok' && d.status !== 'sem_app');
  renderizarDispositivos(filtrado);
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

    lista.innerHTML = Object.entries(porRota).map(([rota, dias]) => {
      // Agrupa dias com mesma config
      const grupos = {};
      dias.forEach(c => {
        const key = c.passagens + '|' + (c.horario_limite || '');
        if (!grupos[key]) grupos[key] = { passagens: c.passagens, horario_limite: c.horario_limite, dias: [] };
        grupos[key].dias.push(c.dia_semana);
      });
      const abr = d => ({ seg:'Seg', ter:'Ter', qua:'Qua', qui:'Qui', sex:'Sex', sab:'Sáb', dom:'Dom' })[d] || d;
      const corP = p => p === 3 ? '#991B1B' : p === 2 ? '#92400E' : '#1D4ED8';
      const linhas = Object.values(grupos).map(g => {
        const diasStr = g.dias.map(abr).join(' · ');
        const btns = g.dias.map(d => `<button onclick="removerGeofence('${rota.replace(/'/g,"\\'")}','${d}')" style="background:none;border:none;color:#D1D5DB;font-size:11px;cursor:pointer;padding:0" title="Remover ${abr(d)}">✕</button>`).join('');
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 14px 3px 24px">
          <span style="font-size:11px;color:#5A7A8F;flex:1">${diasStr}</span>
          <span style="font-size:10px;font-weight:700;color:${corP(g.passagens)}">${g.passagens}ª pass.</span>
          ${g.horario_limite ? `<span style="font-size:10px;color:#92400E">⏰ ${g.horario_limite}</span>` : ''}
          ${btns}
        </div>`;
      }).join('');
      return `<div style="border-bottom:1px solid #F0F4F8;padding:6px 0">
        <div style="padding:2px 14px;font-size:12px;font-weight:700;color:#0F4C7A">${rota}</div>
        ${linhas}
      </div>`;
    }).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

function gfToggleDia(dia, btn) {
  const ativo = btn.style.background === 'rgb(15, 76, 122)' || btn.dataset.ativo === '1';
  if (ativo) {
    btn.style.background = '#fff'; btn.style.color = '#5A7A8F'; btn.style.borderColor = '#D6E5EE';
    btn.dataset.ativo = '0';
  } else {
    btn.style.background = '#0F4C7A'; btn.style.color = '#fff'; btn.style.borderColor = '#0F4C7A';
    btn.dataset.ativo = '1';
  }
}

function gfSelecionarTodosDias() {
  document.querySelectorAll('.gf-dia-btn').forEach(btn => {
    btn.style.background = '#0F4C7A'; btn.style.color = '#fff'; btn.style.borderColor = '#0F4C7A';
    btn.dataset.ativo = '1';
  });
}

async function salvarGeofence() {
  const rota = document.getElementById('gf-rota-sel')?.value;
  const horario_limite = document.getElementById('gf-horario-limite')?.value || null;
  if (!rota) { toast('Selecione uma rota'); return; }

  // Pega dias selecionados
  const diasSelecionados = [...document.querySelectorAll('.gf-dia-btn')].filter(b => b.dataset.ativo === '1').map(b => b.dataset.dia);
  if (!diasSelecionados.length) { toast('Selecione pelo menos um dia'); return; }

  try {
    // Salva um registro por dia selecionado
    await Promise.all(diasSelecionados.map(dia =>
      fetch(API + '/geofence-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rota, dia_semana: dia, passagens: _gfPassagens, horario_limite: horario_limite || null })
      })
    ));
    toast('✓ ' + rota + ' · ' + diasSelecionados.length + ' dia(s) salvo(s)');
    // Limpa seleção
    document.querySelectorAll('.gf-dia-btn').forEach(b => {
      b.style.background = '#fff'; b.style.color = '#5A7A8F'; b.style.borderColor = '#D6E5EE';
      b.dataset.ativo = '0';
    });
    document.getElementById('gf-horario-limite').value = '';
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
  el.style.cssText = 'position:fixed;bottom:20px;right:60px;width:420px;max-width:calc(100vw - 80px);background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.2);z-index:9998;display:flex;flex-direction:column;max-height:620px';
  el.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #EBF1F5;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <div style="font-size:14px;font-weight:700;color:#0F4C7A">📢 Notificações aos Motoboys</div>
      <button onclick="document.getElementById('notif-window').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:#94A8B8">✕</button>
    </div>

    <!-- Abas -->
    <div style="display:flex;border-bottom:1px solid #EBF1F5;flex-shrink:0">
      <button onclick="notifAba('enviar')" id="notif-aba-enviar" style="flex:1;padding:10px;border:none;background:#EFF6FF;color:#0F4C7A;font-size:12px;font-weight:700;cursor:pointer;border-bottom:2px solid #0F4C7A">📤 Enviar agora</button>
      <button onclick="notifAba('agendadas')" id="notif-aba-agendadas" style="flex:1;padding:10px;border:none;background:#fff;color:#94A8B8;font-size:12px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent">⏰ Agendadas</button>
    </div>

    <!-- Painel Enviar -->
    <div id="notif-panel-enviar" style="flex-shrink:0">
      <div style="padding:14px 16px;border-bottom:1px solid #EBF1F5">
        <input id="notif-titulo" type="text" placeholder="Título (opcional)" style="width:100%;height:36px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 10px;font-size:12px;outline:none;color:#0F4C7A;margin-bottom:8px;box-sizing:border-box"/>
        <textarea id="notif-msg" placeholder="Mensagem para os motoboys..." style="width:100%;height:70px;border-radius:8px;border:1.5px solid #D6E5EE;padding:8px 10px;font-size:12px;outline:none;color:#0F4C7A;resize:none;margin-bottom:8px;font-family:inherit;box-sizing:border-box"></textarea>
        <div style="margin-bottom:8px">
          <input type="file" id="notif-img-file" accept="image/*" style="display:none" onchange="previewNotifImagem(this)"/>
          <div id="notif-img-preview" style="display:none;margin-bottom:6px;position:relative">
            <img id="notif-img-thumb" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;border:1.5px solid #EBF1F5"/>
            <button onclick="removerNotifImagem()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:12px">✕</button>
          </div>
          <button onclick="document.getElementById('notif-img-file').click()" style="width:100%;height:32px;border-radius:8px;border:1.5px dashed #D6E5EE;background:#F8FBFD;color:#5A7A8F;font-size:12px;cursor:pointer">📎 Anexar imagem</button>
        </div>
        <div style="display:flex;gap:6px">
          <select id="notif-dest" style="flex:1;height:34px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 8px;font-size:12px;color:#0F4C7A;outline:none">
            <option value="todos">📢 Todos os motoboys</option>
          </select>
          <button onclick="enviarNotificacao()" style="padding:0 14px;height:34px;border-radius:8px;border:none;background:#0F4C7A;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Enviar</button>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;max-height:200px">
        <div id="notif-lista" style="padding:8px"></div>
      </div>
    </div>

    <!-- Painel Agendadas -->
    <div id="notif-panel-agendadas" style="display:none;flex-direction:column;flex:1;overflow:hidden">
      <div style="padding:14px 16px;border-bottom:1px solid #EBF1F5;flex-shrink:0">
        <input id="ag-titulo" type="text" placeholder="Título (opcional)" style="width:100%;height:34px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 10px;font-size:12px;outline:none;color:#0F4C7A;margin-bottom:8px;box-sizing:border-box"/>
        <textarea id="ag-msg" placeholder="Mensagem automática..." style="width:100%;height:60px;border-radius:8px;border:1.5px solid #D6E5EE;padding:8px 10px;font-size:12px;outline:none;color:#0F4C7A;resize:none;margin-bottom:8px;font-family:inherit;box-sizing:border-box"></textarea>

        <!-- Upload imagem agendada -->
        <div style="margin-bottom:8px">
          <input type="file" id="ag-img-file" accept="image/*" style="display:none" onchange="previewAgImagem(this)"/>
          <div id="ag-img-preview" style="display:none;margin-bottom:6px;position:relative">
            <img id="ag-img-thumb" style="width:100%;max-height:100px;object-fit:cover;border-radius:8px;border:1.5px solid #EBF1F5"/>
            <button onclick="removerAgImagem()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:12px">✕</button>
          </div>
          <button onclick="document.getElementById('ag-img-file').click()" style="width:100%;height:30px;border-radius:8px;border:1.5px dashed #D6E5EE;background:#F8FBFD;color:#5A7A8F;font-size:11px;cursor:pointer">📎 Anexar imagem</button>
        </div>

        <!-- Tipo de recorrência -->
        <div style="font-size:10px;font-weight:700;color:#5A7A8F;margin-bottom:4px">Recorrência</div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <button onclick="agTipoRecorrencia('semanal',this)" id="ag-rec-semanal" style="flex:1;padding:7px;border-radius:8px;border:1.5px solid #0F4C7A;background:#0F4C7A;color:#fff;font-size:11px;font-weight:700;cursor:pointer">📅 Por dias</button>
          <button onclick="agTipoRecorrencia('intervalo',this)" id="ag-rec-intervalo" style="flex:1;padding:7px;border-radius:8px;border:1.5px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:11px;font-weight:700;cursor:pointer">🔁 Intervalo</button>
        </div>

        <!-- Painel semanal -->
        <div id="ag-painel-semanal">
          <div style="font-size:10px;font-weight:700;color:#5A7A8F;margin-bottom:4px">Dias da semana</div>
          <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">
            ${['seg','ter','qua','qui','sex','sab','dom'].map(d => `
            <button onclick="agToggleDia('${d}',this)" id="ag-dia-${d}" style="padding:4px 8px;border-radius:6px;border:1.5px solid #0F4C7A;background:#0F4C7A;color:#fff;font-size:10px;font-weight:700;cursor:pointer">${d.charAt(0).toUpperCase()+d.slice(1)}</button>`).join('')}
          </div>
        </div>

        <!-- Painel intervalo -->
        <div id="ag-painel-intervalo" style="display:none">
          <div style="font-size:10px;font-weight:700;color:#5A7A8F;margin-bottom:4px">A cada quantos dias?</div>
          <input id="ag-intervalo" type="number" min="1" max="365" value="15" style="width:100%;height:34px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 10px;font-size:12px;outline:none;color:#0F4C7A;margin-bottom:8px;box-sizing:border-box"/>
        </div>

        <!-- Horários múltiplos -->
        <div style="font-size:10px;font-weight:700;color:#5A7A8F;margin-bottom:4px">Horários de disparo</div>
        <div id="ag-horarios-lista" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px"></div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <input id="ag-horario-input" type="time" style="flex:1;height:32px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 8px;font-size:12px;color:#0F4C7A;outline:none"/>
          <button onclick="agAdicionarHorario()" style="padding:0 12px;height:32px;border-radius:8px;border:none;background:#0F9B78;color:#fff;font-size:12px;font-weight:700;cursor:pointer">+ Adicionar</button>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:10px">
          <div style="flex:1">
            <div style="font-size:10px;font-weight:700;color:#5A7A8F;margin-bottom:3px">Destinatário</div>
            <select id="ag-dest" style="width:100%;height:34px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 6px;font-size:11px;color:#0F4C7A;outline:none">
              <option value="todos">📢 Todos</option>
            </select>
          </div>
        </div>

        <button onclick="salvarMensagemAgendada()" style="width:100%;padding:10px;border-radius:8px;border:none;background:#0F4C7A;color:#fff;font-size:12px;font-weight:700;cursor:pointer">⏰ Agendar mensagem</button>
      </div>
      <div style="flex:1;overflow-y:auto">
        <div id="ag-lista" style="padding:8px"><div style="text-align:center;padding:1rem;color:#94A8B8;font-size:12px">Carregando...</div></div>
      </div>
    </div>`;
  document.body.appendChild(el);

  // Popula selects de destinatários
  fetch(API + '/motoboys?todos=1&agrupado=1').then(r => r.json()).then(d => {
    const nomes = [...new Set((d.motoboys||[]).map(m => m.nome))].sort();
    ['notif-dest','ag-dest'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = `
        <option value="todos">📢 Todos os motoboys</option>
        <option value="grupo_clt">🔵 Grupo CLT</option>
        <option value="grupo_mei">🟡 Grupo MEI</option>`;
      nomes.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = '👤 ' + n; sel.appendChild(o); });
    });
  }).catch(() => {});

  carregarNotificacoes();
  carregarMensagensAgendadas();
}

function notifAba(aba) {
  const enviar = document.getElementById('notif-panel-enviar');
  const agendadas = document.getElementById('notif-panel-agendadas');
  const btnEnviar = document.getElementById('notif-aba-enviar');
  const btnAg = document.getElementById('notif-aba-agendadas');
  if (aba === 'enviar') {
    enviar.style.display = 'block';
    agendadas.style.display = 'none';
    btnEnviar.style.background = '#EFF6FF'; btnEnviar.style.color = '#0F4C7A'; btnEnviar.style.borderBottomColor = '#0F4C7A';
    btnAg.style.background = '#fff'; btnAg.style.color = '#94A8B8'; btnAg.style.borderBottomColor = 'transparent';
  } else {
    enviar.style.display = 'none';
    agendadas.style.display = 'flex';
    btnAg.style.background = '#EFF6FF'; btnAg.style.color = '#0F4C7A'; btnAg.style.borderBottomColor = '#0F4C7A';
    btnEnviar.style.background = '#fff'; btnEnviar.style.color = '#94A8B8'; btnEnviar.style.borderBottomColor = 'transparent';
    carregarMensagensAgendadas();
  }
}

// Dias selecionados para agendamento
let _agDias = new Set(['seg','ter','qua','qui','sex','sab','dom']);
let _agHorarios = new Set();
let _agTipoRecorrencia = 'semanal';

function agTipoRecorrencia(tipo, btn) {
  _agTipoRecorrencia = tipo;
  const btnSemanal = document.getElementById('ag-rec-semanal');
  const btnIntervalo = document.getElementById('ag-rec-intervalo');
  const painelSemanal = document.getElementById('ag-painel-semanal');
  const painelIntervalo = document.getElementById('ag-painel-intervalo');
  if (tipo === 'semanal') {
    btnSemanal.style.background='#0F4C7A'; btnSemanal.style.color='#fff'; btnSemanal.style.borderColor='#0F4C7A';
    btnIntervalo.style.background='#fff'; btnIntervalo.style.color='#5A7A8F'; btnIntervalo.style.borderColor='#D6E5EE';
    painelSemanal.style.display='block'; painelIntervalo.style.display='none';
  } else {
    btnIntervalo.style.background='#0F4C7A'; btnIntervalo.style.color='#fff'; btnIntervalo.style.borderColor='#0F4C7A';
    btnSemanal.style.background='#fff'; btnSemanal.style.color='#5A7A8F'; btnSemanal.style.borderColor='#D6E5EE';
    painelIntervalo.style.display='block'; painelSemanal.style.display='none';
  }
}

function agAdicionarHorario() {
  const input = document.getElementById('ag-horario-input');
  const horario = input?.value;
  if (!horario) { toast('Selecione um horário'); return; }
  if (_agHorarios.has(horario)) { toast('Horário já adicionado'); return; }
  _agHorarios.add(horario);
  renderizarHorarios();
  input.value = '';
}

function agRemoverHorario(h) {
  _agHorarios.delete(h);
  renderizarHorarios();
}

function renderizarHorarios() {
  const lista = document.getElementById('ag-horarios-lista');
  if (!lista) return;
  const sorted = Array.from(_agHorarios).sort();
  lista.innerHTML = sorted.map(h => `
    <div style="display:flex;align-items:center;gap:4px;background:#EFF6FF;border-radius:6px;padding:4px 8px">
      <span style="font-size:12px;font-weight:700;color:#0F4C7A">⏰ ${h}</span>
      <button onclick="agRemoverHorario('${h}')" style="background:none;border:none;color:#EF4444;font-size:12px;cursor:pointer;padding:0;line-height:1">✕</button>
    </div>`).join('');
}

function previewAgImagem(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const thumb = document.getElementById('ag-img-thumb');
    const preview = document.getElementById('ag-img-preview');
    if (thumb) thumb.src = e.target.result;
    if (preview) preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
function removerAgImagem() {
  const input = document.getElementById('ag-img-file');
  const preview = document.getElementById('ag-img-preview');
  if (input) input.value = '';
  if (preview) preview.style.display = 'none';
}

async function salvarMensagemAgendada() {
  const titulo = document.getElementById('ag-titulo')?.value?.trim();
  const mensagem = document.getElementById('ag-msg')?.value?.trim();
  const destinatario = document.getElementById('ag-dest')?.value;
  const imgFile = document.getElementById('ag-img-file')?.files?.[0];
  const intervalo_dias = parseInt(document.getElementById('ag-intervalo')?.value || '1');

  if (!mensagem) { toast('Digite uma mensagem'); return; }
  if (_agHorarios.size === 0) { toast('Adicione pelo menos um horário'); return; }
  if (_agTipoRecorrencia === 'semanal' && _agDias.size === 0) { toast('Selecione pelo menos um dia'); return; }

  let imagem_url = '';
  if (imgFile) {
    try {
      const form = new FormData(); form.append('imagem', imgFile);
      const r = await fetch(API + '/upload-imagem', { method: 'POST', body: form });
      const d = await r.json();
      if (d.url) imagem_url = d.url;
    } catch(e) { toast('Erro ao enviar imagem'); return; }
  }

  try {
    await fetch(API + '/mensagem-agendada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo, mensagem, imagem_url, destinatario,
        horarios: Array.from(_agHorarios).sort(),
        horario: Array.from(_agHorarios).sort()[0],
        dias_semana: _agTipoRecorrencia === 'semanal' ? Array.from(_agDias).join(',') : 'todos',
        tipo_recorrencia: _agTipoRecorrencia,
        intervalo_dias
      })
    });
    document.getElementById('ag-titulo').value = '';
    document.getElementById('ag-msg').value = '';
    _agHorarios.clear();
    renderizarHorarios();
    removerAgImagem();
    toast('✓ Mensagem agendada!');
    carregarMensagensAgendadas();
  } catch(e) { toast('Erro ao agendar'); }
}

async function carregarMensagensAgendadas() {
  const lista = document.getElementById('ag-lista');
  if (!lista) return;
  try {
    const [rMsg, rMb] = await Promise.all([
      fetch(API + '/mensagem-agendada'),
      fetch(API + '/motoboys?todos=1&agrupado=1')
    ]);
    const dMsg = await rMsg.json();
    const dMb  = await rMb.json();
    const msgs = dMsg.mensagens || [];
    const totalMotoboys = (dMb.motoboys || []).length;

    if (!msgs.length) { lista.innerHTML = '<div style="text-align:center;padding:1rem;color:#94A8B8;font-size:12px">Nenhuma mensagem agendada</div>'; return; }

    const labelDias = ds => {
      if (!ds || ds === 'seg,ter,qua,qui,sex,sab,dom') return 'Todos os dias';
      return ds.split(',').map(d => d.charAt(0).toUpperCase()+d.slice(1)).join(', ');
    };

    // Busca leituras de todas as mensagens disparadas hoje
    const leituras = {};
    await Promise.all(msgs.filter(m => m.ultima_execucao).map(async m => {
      try {
        const r = await fetch(API + '/mensagem-agendada-leitura?id=' + m.id);
        const d = await r.json();
        leituras[m.id] = d.leituras || [];
      } catch(e) { leituras[m.id] = []; }
    }));

    lista.innerHTML = msgs.map(m => {
      const lidas = leituras[m.id] || [];
      const qtdLidas = lidas.length;
      const total = m.destinatario === 'todos' ? totalMotoboys : 1;
      const pct = total > 0 ? Math.round(qtdLidas/total*100) : 0;
      const corPct = pct === 100 ? '#0F9B78' : pct > 0 ? '#F59E0B' : '#94A8B8';
      const foiDisparada = !!m.ultima_execucao;

      return `
      <div style="background:#F8FBFD;border-radius:10px;padding:10px 12px;margin-bottom:8px;border:1px solid #EBF1F5">
        <div style="display:flex;align-items:flex-start;gap:8px">
          <div style="flex:1;min-width:0">
            ${m.titulo ? `<div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:2px">${m.titulo}</div>` : ''}
            <div style="font-size:12px;color:#0F2940;line-height:1.4;margin-bottom:4px">${m.mensagem}</div>
            ${m.imagem_url ? `<img src="${m.imagem_url}" style="max-width:100%;border-radius:6px;max-height:80px;object-fit:cover;margin-bottom:4px"/>` : ''}
            <div style="font-size:10px;color:#94A8B8">
              ⏰ ${(m.horarios || m.horario || '').split(',').join(' · ')} · 
              ${m.tipo_recorrencia === 'intervalo' ? `A cada ${m.intervalo_dias} dia(s)` : labelDias(m.dias_semana)} · 
              ${labelDest(m.destinatario)}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
            <button onclick="toggleMensagemAgendada(${m.id},${m.ativa})" style="background:none;border:1.5px solid #D6E5EE;border-radius:6px;padding:3px 7px;font-size:11px;cursor:pointer;color:${m.ativa?'#0F9B78':'#94A8B8'}">${m.ativa?'✓ Ativa':'Pausada'}</button>
            <button onclick="deletarMensagemAgendada(${m.id})" style="background:none;border:none;color:#EF4444;font-size:13px;cursor:pointer">✕</button>
          </div>
        </div>
        ${foiDisparada ? `
        <div style="margin-top:8px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div style="flex:1;height:3px;background:#E2E8F0;border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${corPct};border-radius:99px;transition:width .4s"></div>
            </div>
            <span style="font-size:10px;font-weight:700;color:${corPct};white-space:nowrap">${qtdLidas}/${total} leram</span>
          </div>
          ${lidas.length ? `<div style="font-size:10px;color:#94A8B8">✓ ${lidas.map(l => l.nome || l.telefone).join(', ')}</div>` : ''}
        </div>` : `<div style="margin-top:6px;font-size:10px;color:#94A8B8">Ainda não disparada hoje</div>`}
      </div>`;
    }).join('');
  } catch(e) { lista.innerHTML = '<div style="text-align:center;padding:1rem;color:#EF4444;font-size:12px">Erro ao carregar</div>'; }
}

async function toggleMensagemAgendada(id, ativa) {
  try {
    await fetch(API + '/mensagem-agendada', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, ativa: !ativa }) });
    carregarMensagensAgendadas();
  } catch(e) { toast('Erro'); }
}

async function deletarMensagemAgendada(id) {
  if (!confirm('Remover esta mensagem agendada?')) return;
  try {
    await fetch(API + '/mensagem-agendada', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    toast('✓ Removida');
    carregarMensagensAgendadas();
  } catch(e) { toast('Erro'); }
}

function previewNotifImagem(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const thumb = document.getElementById('notif-img-thumb');
    const preview = document.getElementById('notif-img-preview');
    if (thumb) thumb.src = e.target.result;
    if (preview) preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removerNotifImagem() {
  const input = document.getElementById('notif-img-file');
  const preview = document.getElementById('notif-img-preview');
  if (input) input.value = '';
  if (preview) preview.style.display = 'none';
}

async function enviarNotificacao() {
  const titulo = document.getElementById('notif-titulo')?.value?.trim();
  const mensagem = document.getElementById('notif-msg')?.value?.trim();
  const destinatario = document.getElementById('notif-dest')?.value;
  const imgFile = document.getElementById('notif-img-file')?.files?.[0];
  if (!mensagem) { toast('Digite uma mensagem'); return; }

  let imagem_url = '';

  // Upload da imagem se houver
  if (imgFile) {
    try {
      const form = new FormData();
      form.append('imagem', imgFile);
      const r = await fetch(API + '/upload-imagem', { method: 'POST', body: form });
      const d = await r.json();
      if (d.url) imagem_url = d.url;
    } catch(e) { toast('Erro ao enviar imagem'); return; }
  }

  try {
    // Salva no D1 (para polling no app)
    await fetch(API + '/notificacao-motoboy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, mensagem, imagem_url, destinatario, enviada_por: 'admin' })
    });
    // Dispara via FCM (notificação nativa mesmo com app fechado)
    const fcmRes = await fetch(API + '/disparar-fcm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, mensagem, imagem_url, destinatario })
    });
    const fcmData = await fcmRes.json();
    document.getElementById('notif-titulo').value = '';
    document.getElementById('notif-msg').value = '';
    removerNotifImagem();
    toast('✓ Notificação enviada! FCM: ' + (fcmData.enviados || 0) + ' dispositivos');
    carregarNotificacoes();
  } catch(e) { toast('Erro ao enviar'); }
}

// ── LABEL DESTINATÁRIO (global) ──────────────────────────────
const labelDest = d => d === 'todos' ? 'Todos' : d === 'grupo_clt' ? '🔵 CLT' : d === 'grupo_mei' ? '🟡 MEI' : d;

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
          <span style="font-size:10px;color:#94A8B8">${hora} · ${labelDest(n.destinatario)}</span>
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
    const testersStr = prompt('Telefone(s) que continuam com acesso (testers) — separados por vírgula:', '');
    const testers = testersStr ? testersStr.split(',').map(t => t.replace(/\D/g,'').trim()).filter(t => t) : [];
    try {
      await fetch(API + '/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: true, mensagem: msg || 'Sistema em manutenção. Voltamos em breve!', testers })
      });
      _manutencaoAtiva = true;
      toast('🔧 Manutenção ativada' + (testers.length ? ` · ${testers.length} tester(s) liberado(s)` : ''));
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

// ── POPOVER DE ROTA (position:fixed para não ser cortado pelo overflow) ───
let _popoverTimer = null;
document.addEventListener('mouseover', e => {
  const card = e.target.closest('.rota-card');
  if (!card) return;
  const popover = card.querySelector('.rota-popover');
  if (!popover) return;
  clearTimeout(_popoverTimer);
  // Posiciona o popover fixo em relação ao card
  const rect = card.getBoundingClientRect();
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft  = rect.left;
  if (spaceRight >= 296) {
    popover.style.left = (rect.right + 8) + 'px';
    popover.style.right = 'auto';
  } else {
    popover.style.right = (window.innerWidth - rect.left + 8) + 'px';
    popover.style.left = 'auto';
  }
  const topPos = Math.min(rect.top, window.innerHeight - 420);
  popover.style.top  = Math.max(8, topPos) + 'px';
  popover.style.display = 'block';
});

document.addEventListener('mouseout', e => {
  const card = e.target.closest('.rota-card');
  if (!card) return;
  const popover = card.querySelector('.rota-popover');
  if (!popover) return;
  // Pequeno delay para não fechar ao mover para o popover
  _popoverTimer = setTimeout(() => { popover.style.display = 'none'; }, 120);
});

document.addEventListener('mouseover', e => {
  if (e.target.closest('.rota-popover')) clearTimeout(_popoverTimer);
});
document.addEventListener('mouseout', e => {
  const pop = e.target.closest('.rota-popover');
  if (!pop) return;
  _popoverTimer = setTimeout(() => { pop.style.display = 'none'; }, 120);
});

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

async function atualizarVersaoApp() {
  // Busca versão atual para incrementar automaticamente
  let versaoAtual = '1.0.0';
  try {
    const r = await fetch(API + '/app-versao');
    const d = await r.json();
    if (d.versao) versaoAtual = d.versao;
  } catch(e) {}

  // Auto-incrementa patch version (ex: 1.0.3 → 1.0.4)
  const partes = versaoAtual.split('.').map(Number);
  partes[2] = (partes[2] || 0) + 1;
  const proxVersao = partes.join('.');

  if (document.getElementById('modal-live-update')) {
    document.getElementById('lu-versao-display').textContent = proxVersao;
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
      <div style="background:#EFF6FF;border-radius:10px;padding:10px 14px;margin-bottom:1rem;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">🔢</span>
        <div>
          <div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase">Nova versão (automática)</div>
          <div style="font-size:18px;font-weight:800;color:#0F4C7A" id="lu-versao-display">${proxVersao}</div>
        </div>
      </div>
      <input type="hidden" id="lu-versao" value="${proxVersao}"/>
      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;display:block;margin-bottom:5px">Bundle (.zip com arquivos www/)</label>
        <input type="file" id="lu-arquivo" accept=".zip" style="width:100%;border-radius:10px;border:1.5px solid #D6E5EE;padding:10px 12px;font-size:13px;outline:none;color:#0F4C7A"/>
      </div>
      <div style="background:#F7FBFD;border-radius:10px;padding:10px 12px;margin-bottom:1rem;font-size:12px;color:#5A7A8F;line-height:1.5">
        💡 Zipar apenas o conteúdo da pasta <strong>www/</strong> (sem a pasta raiz)<br>
        O app vai baixar e aplicar automaticamente ao abrir. Quem já atualizou não vê mais o banner.
      </div>
      <div id="lu-msg" style="display:none;margin-bottom:1rem"></div>
      <button onclick="publicarBundle()" style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px">🚀 Publicar versão ${proxVersao}</button>
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
  } catch(e) { console.error('carregarMapa erro:', e); }
}

async function renderizarListaMapa(locs, offline, agora, ONLINE_LIM, IDLE_LIM) {
  const el = document.getElementById('mapa-lista-motoboys');
  if (!el) return;

  // Busca KM e geofence do dia
  const hoje = new Date();
  const diaSP = new Date(hoje.getTime() - 3*60*60*1000);
  const dataHoje = diaSP.toISOString().split('T')[0];
  let kmPontos = {}, geofenceEvts = {};
  try {
    const [rH, rG] = await Promise.all([
      fetch(API + '/localizacao?dia=' + dataHoje),
      fetch(API + '/geofence-evento?data=' + dataHoje).catch(() => ({json:()=>({eventos:[]})}))
    ]);
    const dH = await rH.json(); const dG = await rG.json();
    (dH.historico || []).forEach(p => { if (!kmPontos[p.nome]) kmPontos[p.nome]=[]; kmPontos[p.nome].push(p); });
    (dG.eventos || []).forEach(e => { if (!geofenceEvts[e.nome]) geofenceEvts[e.nome]=[]; geofenceEvts[e.nome].push(e); });
  } catch(e) {}

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

   function horaEvt(evts, tipo) {
    if (!evts) return null;
    const evs = evts.filter(e => e.tipo && e.tipo.includes(tipo)).sort((a,b) => a.timestamp - b.timestamp);
    if (!evs.length) return null;
    // Mesma regra: Base só 1ª e última, Polaris mostra todas as passagens.
    const paraExibir = (tipo === 'base' && evs.length > 1) ? [evs[0], evs[evs.length - 1]] : evs;
    return paraExibir.map(ev => {
      const sp = new Date(ev.timestamp - 3*60*60*1000);
      return String(sp.getUTCHours()).padStart(2,'0')+':'+String(sp.getUTCMinutes()).padStart(2,'0');
    }).join(', ');
  }

  let html = '';
  locs.forEach((l, i) => {
    const cor = CORES_MB[i % CORES_MB.length];
    const diff = agora - l.timestamp;
    const isOnline = diff < ONLINE_LIM;
    const min = Math.floor(diff/60000);
    const seg = Math.floor((diff%60000)/1000);
    const tempo = min > 0 ? min+'min atrás' : seg+'s atrás';
    const iniciais = l.nome.split(' ').map(p=>p[0]).slice(0,2).join('');
    const stBg  = isOnline ? '#DCFCE7' : '#FEF9EC';
    const stCor = isOnline ? '#16A34A' : '#92400E';
    const stTxt = isOnline ? '● online' : '⚠ parado';
    const fab = (l.fabricante || '').toLowerCase();
    const fabLabel = fab.includes('samsung')?'Samsung':fab.includes('motorola')?'Motorola':fab.includes('xiaomi')?'Xiaomi':fab?fab.charAt(0).toUpperCase()+fab.slice(1):'';
    const km = calcKm(kmPontos[l.nome]);
    const base = horaEvt(geofenceEvts[l.nome], 'base');
    const polaris = horaEvt(geofenceEvts[l.nome], 'final');
    const gpsOk = l.gps_background !== false && l.gps_background !== 0;
    const sinalFraco = l.precisao && l.precisao > 50;

    html += `<div onclick="focarMotoboy('${l.nome.replace(/'/g,"\\'")}') " style="padding:10px 14px;border-bottom:1px solid #F5F9FC;cursor:pointer;transition:.15s" onmouseover="this.style.background='#E8F4FB'" onmouseout="this.style.background='#fff'">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:32px;height:32px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${iniciais}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#0F2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.nome}</div>
          <div style="font-size:10px;color:#94A8B8;margin-top:1px">${tempo}${fabLabel?' · '+fabLabel:''}</div>
        </div>
        ${sinalFraco ? '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#FEF2F2;color:#991B1B;white-space:nowrap;flex-shrink:0" title="Precis\u00e3o GPS: '+Math.round(l.precisao)+'m">\ud83d\udcf5 Sinal fraco</span>' : `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${stBg};color:${stCor};white-space:nowrap;flex-shrink:0">${stTxt}</span>`}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
        <div style="background:#F0F6FB;border-radius:6px;padding:4px 6px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:#0F9B78">${km>0?km+'km':'—'}</div>
          <div style="font-size:9px;color:#5A7A8F">KM hoje</div>
        </div>
        <div style="background:#F0F6FB;border-radius:6px;padding:4px 6px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:#1E9FD9">${base||'—'}</div>
          <div style="font-size:9px;color:#5A7A8F">Base</div>
        </div>
        <div style="background:#F0F6FB;border-radius:6px;padding:4px 6px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:#7C3AED">${polaris||'—'}</div>
          <div style="font-size:9px;color:#5A7A8F">Polaris</div>
        </div>
        <div style="background:#F0F6FB;border-radius:6px;padding:4px 6px;text-align:center">
          <div style="font-size:11px;font-weight:800;color:${gpsOk?'#0F9B78':'#EF4444'}">${gpsOk?'✓ bg':'✗ bg'}</div>
          <div style="font-size:9px;color:#5A7A8F">GPS</div>
        </div>
      </div>
    </div>`;
  });

  // Renderiza offline separado
  let htmlOffline = '';
  offline.forEach(nome => {
    const iniciais = nome.split(' ').map(p=>p[0]).slice(0,2).join('');
    htmlOffline += `<div style="padding:10px 14px;border-bottom:1px solid #F5F9FC;display:flex;align-items:center;gap:10px;opacity:.5">
      <div style="width:32px;height:32px;border-radius:50%;background:#9CA3AF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${iniciais}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:600;color:#0F2940">${nome}</div><div style="font-size:11px;color:#5A7A8F;margin-top:1px">Sem sinal de GPS</div></div>
      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#F3F4F6;color:#6B7280">○ offline</span>
    </div>`;
  });

  // Atualiza seções separadas
  const elOnline = document.getElementById('mapa-lista-online');
  const elOffline = document.getElementById('mapa-lista-offline');
  const countOnline = document.getElementById('mapa-count-online');
  const countOffline = document.getElementById('mapa-count-offline');

  if (elOnline) elOnline.innerHTML = html || '<div class="empty" style="padding:8px;font-size:12px">Nenhum online</div>';
  if (elOffline) elOffline.innerHTML = htmlOffline || '<div class="empty" style="padding:8px;font-size:12px">Nenhum offline</div>';
  if (countOnline) countOnline.textContent = locs.length;
  if (countOffline) countOffline.textContent = offline.length;

  // Fallback — se não tem as seções separadas, usa o container antigo
  if (!elOnline) {
    el.innerHTML = (html + htmlOffline) || '<div class="empty">Nenhum motoboy com GPS ativo</div>';
  }
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
  ['dia','periodo','motoboy','rota','metricas'].forEach(a => {
    const el2 = document.getElementById('km-filtro-' + a);
    if (el2) el2.style.display = a === aba ? 'flex' : 'none';
  });

  // Mostra conteúdo certo
  const lista = document.getElementById('km-lista-completa');
  const metricas = document.getElementById('km-metricas-conteudo');
  if (aba === 'metricas') {
    if (lista) lista.style.display = 'none';
    if (metricas) metricas.style.display = 'block';
  } else {
    if (lista) lista.style.display = 'block';
    if (metricas) metricas.style.display = 'none';
  }

  // Popula selects se necessário
  if (aba === 'motoboy') kmPopularSelectMotoboy();
  if (aba === 'rota') kmPopularSelectRota();

  // Título da tabela
  const titulos = { dia: 'KM por motoboy', periodo: 'KM por motoboy no período', motoboy: 'Histórico do motoboy', rota: 'KM por rota', metricas: 'Métricas' };
  const t = document.getElementById('km-tabela-titulo');
  if (t) t.textContent = titulos[aba] || 'KM';
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

async function kmExportarExcel() {
  if (!_kmDadosAtual.length) { alert('Nenhum dado para exportar. Faça uma busca primeiro.'); return; }
  const label = document.getElementById('km-data-label')?.textContent || 'relatorio-km';

  // Busca dados enriquecidos (geofence + confirmação)
  const dados = await enriquecerDadosKm(_kmDadosAtual);

  // Monta array para SheetJS
  const linhas = [
    ['Motoboy','Data','Início','Base Loglife','Polaris','KM Rodado','Vel. Média (km/h)','TMD','Pontos GPS']
  ];
  dados.forEach(r => {
    linhas.push([
      r.nome || '—',
      r.data ? kmFormatarData(r.data) : (r.periodo || '—'),
      r.inicio || '—',
      r.base || '—',
      r.polaris || '—',
      r.km || 0,
      r.vel_media || '—',
      r.tmd || '—',
      r.pontos || 0
    ]);
  });

  // Gera XLSX via SheetJS
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  script.onload = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(linhas);
    ws['!cols'] = [20,12,8,10,10,12,16,8,10].map(w => ({wch:w}));
    XLSX.utils.book_append_sheet(wb, ws, 'Quilometragem');
    XLSX.writeFile(wb, 'km-loglife-' + label.replace(/[^a-zA-Z0-9]/g,'-') + '.xlsx');
  };
  if (typeof XLSX !== 'undefined') {
    script.onload();
  } else {
    document.head.appendChild(script);
  }
}

function kmExportarPDF() {
  if (!_kmDadosAtual.length) { alert('Nenhum dado para exportar. Faça uma busca primeiro.'); return; }
  const label = document.getElementById('km-data-label')?.textContent || '';
  const total = document.getElementById('km-total-dia')?.textContent || '—';
  const media = document.getElementById('km-media-dia')?.textContent || '—';
  const ativos = document.getElementById('km-ativos-dia')?.textContent || '—';

  enriquecerDadosKm(_kmDadosAtual).then(dados => {
    const linhas = dados.map(r => {
      const data = r.data ? kmFormatarData(r.data) : (r.periodo || '—');
      return `<tr>
        <td>${r.nome||'—'}</td>
        <td>${data}</td>
        <td>${r.inicio||'—'}</td>
        <td>${r.base||'—'}</td>
        <td>${r.polaris||'—'}</td>
        <td><strong>${r.km||0} km</strong></td>
        <td>${r.vel_media||'—'}</td>
        <td>${r.tmd||'—'}</td>
        <td>${r.pontos||0}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>Relatório KM Loglife</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;padding:32px;color:#0F2940;font-size:12px}
        .header{border-bottom:3px solid #00AEEF;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}
        .logo{font-size:20px;font-weight:800;color:#0F4C7A}.logo span{color:#00AEEF}
        h1{font-size:16px;font-weight:800;color:#0F4C7A;margin-bottom:4px}
        .sub{font-size:12px;color:#5A7A8F;margin-bottom:16px}
        .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .kpi{background:#F0FDF4;border-radius:8px;padding:10px;text-align:center;border:1px solid #86EFAC}
        .kpi-val{font-size:20px;font-weight:800;color:#0F9B78}.kpi-lbl{font-size:10px;color:#5A7A8F;text-transform:uppercase}
        table{width:100%;border-collapse:collapse}
        th{background:#0F4C7A;color:#fff;padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
        td{padding:6px 8px;border-bottom:1px solid #EBF1F5;font-size:11px}
        tr:nth-child(even) td{background:#F8FBFD}
        .footer{margin-top:20px;border-top:1px solid #EBF1F5;padding-top:10px;font-size:10px;color:#94A8B8}
        @media print{body{padding:16px}}
      </style>
    </head><body>
      <div class="header">
        <div class="logo">LOG<span>LIFE</span> <span style="font-size:12px;font-weight:400;color:#5A7A8F">Logística</span></div>
        <div style="font-size:11px;color:#5A7A8F">${dados.length} motoboy(s)</div>
      </div>
      <h1>📏 Relatório de Quilometragem</h1>
      <div class="sub">${label} · Gerado em ${new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</div>
      <div class="kpis">
        <div class="kpi"><div class="kpi-val">${total}</div><div class="kpi-lbl">KM Total</div></div>
        <div class="kpi"><div class="kpi-val">${media}</div><div class="kpi-lbl">Média</div></div>
        <div class="kpi"><div class="kpi-val">${ativos}</div><div class="kpi-lbl">Motoboys</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Motoboy</th><th>Data</th><th>Início</th><th>Base</th><th>Polaris</th>
          <th>KM</th><th>Vel. Média</th><th>TMD</th><th>Pontos</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table>
      <div class="footer">Loglife Logística · Documento gerado automaticamente</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  });
}

async function enriquecerDadosKm(dados) {
  const agora = new Date();
  const diaSP = new Date(agora.getTime() - 3*60*60*1000);
  const hoje = diaSP.toISOString().split('T')[0];

  return await Promise.all(dados.map(async r => {
    const data = r.data || hoje;
    let inicio = '—', base = '—', polaris = '—', vel_media = '—', tmd = '—';
    try {
      // Busca eventos de geofence
      const rG = await fetch(API + '/geofence-evento?data=' + data + '&nome=' + encodeURIComponent(r.nome));
      const dG = await rG.json();
      const eventos = dG.eventos || [];
      const evBase = eventos.find(e => e.tipo && e.tipo.includes('base'));
      const evsPolaris = eventos.filter(e => e.tipo && e.tipo.includes('final')).sort((a,b) => a.timestamp - b.timestamp);
      if (evBase) base = formatarHoraTs(evBase.timestamp);
      if (evsPolaris.length) polaris = evsPolaris.map(e => formatarHoraTs(e.timestamp)).join(', ');

      // Busca confirmação de presença (início)
      const rC = await fetch(API + '/historico-confirmacoes?data_inicio=' + data + '&data_fim=' + data);
      const dC = await rC.json();
      const conf = (dC.confirmacoes || []).find(c => c.nome === r.nome && c.resposta === 'sim');
      if (conf) inicio = formatarHoraTs(conf.timestamp);

      // Velocidade média e TMD
      if (evBase && conf && r.km > 0) {
        const minutos = (evBase.timestamp - conf.timestamp) / 60000;
        if (minutos > 0) {
          vel_media = Math.round(r.km / (minutos / 60) * 10) / 10 + ' km/h';
          const h = Math.floor(minutos / 60);
          const m = Math.round(minutos % 60);
          tmd = h + 'h' + String(m).padStart(2,'0') + 'm';
        }
      }
    } catch(e) {}

    return { ...r, inicio, base, polaris, vel_media, tmd };
  }));
}

function formatarHoraTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const sp = new Date(d.getTime() - 3*60*60*1000);
  return String(sp.getUTCHours()).padStart(2,'0') + ':' + String(sp.getUTCMinutes()).padStart(2,'0');
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

function mostrarNotifChatPainel(m) {
  // Som
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 660; g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch(e) {}

  const popId = 'pop-chat-painel-' + m.id;
  if (document.getElementById(popId)) return;
  const isAudio = m.tipo === 'audio' && m.audio_url;
  const pop = document.createElement('div');
  pop.id = popId;
  pop.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:99999;width:300px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.2);border-left:4px solid #1E9FD9;overflow:hidden;animation:slideInRight .3s cubic-bezier(.34,1.1,.64,1) both';
  pop.innerHTML = `
    <div style="padding:12px 14px 10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px">${isAudio ? '🎤' : '💬'}</span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:800;color:#0F4C7A">Nova mensagem</div>
          <div style="font-size:11px;color:#5A7A8F">${m.nome_motoboy || 'Motoboy'} · ${new Date(m.timestamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        <button onclick="document.getElementById('${popId}').remove()" style="background:none;border:none;color:#94A8B8;font-size:18px;cursor:pointer">✕</button>
      </div>
      ${isAudio
        ? `<audio src="${m.audio_url}" controls style="width:100%;margin-bottom:8px"></audio>`
        : `<div style="font-size:13px;color:#0F2940;margin-bottom:8px;line-height:1.4">${m.mensagem}</div>`}
      <button onclick="document.getElementById('${popId}').remove();abrirConversa('${(m.telefone_motoboy||'').replace(/'/g,"\\'")}')" style="width:100%;padding:8px;border-radius:8px;border:none;background:#EFF6FF;color:#0F4C7A;font-size:12px;font-weight:700;cursor:pointer">💬 Responder</button>
    </div>`;
  document.body.appendChild(pop);
  setTimeout(() => document.getElementById(popId)?.remove(), 30000);
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

    // Detecta mensagens novas do motoboy (quando chat não está aberto ou é de outro motoboy)
    if (chatUltimoTs > 0) {
      const novas = lista.filter(m => m.remetente === 'motoboy' && m.timestamp > chatUltimoTs);
      for (const m of novas) mostrarNotifChatPainel(m);
    }

    if (lista.length > 0) chatUltimoTs = lista[lista.length-1].timestamp;

    if (!lista.length) {
      msgs.innerHTML = '<div style="margin:auto;text-align:center;color:#94A8B8;font-size:13px">Nenhuma mensagem ainda</div>';
      return;
    }

    msgs.innerHTML = lista.map(m => {
      const isAdmin = m.remetente === 'admin';
      const hora = new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
      const conteudo = (m.tipo === 'audio' && m.audio_url)
        ? `<div style="display:flex;align-items:center;gap:8px">
            <button onclick="this.nextElementSibling.paused?this.nextElementSibling.play()&&(this.textContent='⏸'):this.nextElementSibling.pause()&&(this.textContent='▶')" style="width:32px;height:32px;border-radius:50%;border:none;background:${isAdmin?'rgba(255,255,255,.3)':'#EFF6FF'};color:${isAdmin?'#fff':'#0F4C7A'};font-size:14px;cursor:pointer;flex-shrink:0">▶</button>
            <audio src="${m.audio_url}" onended="this.previousElementSibling.textContent='▶'" style="display:none"></audio>
            <div style="flex:1">
              <div style="font-size:11px;opacity:.7">🎤 Áudio · ${m.duracao||0}s</div>
              <div style="background:${isAdmin?'rgba(255,255,255,.2)':'#D6E5EE'};border-radius:99px;height:3px;margin-top:4px;width:80px"></div>
            </div>
          </div>`
        : `<div>${m.mensagem}</div>`;
      return `<div style="display:flex;justify-content:${isAdmin ? 'flex-end' : 'flex-start'};margin-bottom:8px">
        <div style="max-width:75%;padding:9px 12px;border-radius:${isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};background:${isAdmin ? 'linear-gradient(135deg,#1E9FD9,#0F7BB0)' : '#fff'};color:${isAdmin ? '#fff' : '#0F2940'};font-size:13px;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,.08)">
          ${conteudo}
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

// ── REPLAY DA ROTA ────────────────────────────────────────────
let replayMapaInst = null;
let replayPolyline = null;
let replayMarkers = [];

async function popularSelectMotoboysReplay() {
  const sel = document.getElementById('replay-motoboy-select');
  if (!sel || sel.options.length > 1) return; // já populado
  try {
    const r = await fetch(API + '/motoboys?todos=1');
    const d = await r.json();
    const nomes = [...new Set((d.motoboys || []).map(m => m.nome))].sort();
    sel.innerHTML = '<option value="">Selecione o motoboy...</option>' + nomes.map(n => `<option value="${n}">${n}</option>`).join('');
  } catch(e) {}
}

function iniciarReplayMapa() {
  if (replayMapaInst) return;
  const el = document.getElementById('replay-mapa');
  if (!el || typeof L === 'undefined') { setTimeout(iniciarReplayMapa, 300); return; }
  replayMapaInst = L.map('replay-mapa', { zoomControl: true }).setView([-23.5505, -46.6333], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO', maxZoom: 19, subdomains: 'abcd'
  }).addTo(replayMapaInst);
}

async function carregarReplayRota() {
  const data = document.getElementById('replay-data')?.value;
  const nome = document.getElementById('replay-motoboy-select')?.value;
  const lista = document.getElementById('replay-lista');
  if (!data || !nome) { toast('Selecione a data e o motoboy'); return; }

  iniciarReplayMapa();
  lista.innerHTML = '<div class="rel-empty"><span class="spinner"></span> Carregando...</div>';

  try {
    const dataIso = data; // já vem como YYYY-MM-DD do input date
    const r = await fetch(API + '/replay-rota?data=' + dataIso + '&nome=' + encodeURIComponent(nome));
    const d = await r.json();
    const trajeto = d.trajeto || [];
    const clientes = d.clientes || [];

    // Se o Leaflet ainda não carregou, espera um pouco e tenta de novo (CDN pode estar lento)
    if (!replayMapaInst) {
      await new Promise(res => setTimeout(res, 600));
      iniciarReplayMapa();
    }

    // Limpa camadas anteriores
    if (replayMapaInst) {
      if (replayPolyline) { replayMapaInst.removeLayer(replayPolyline); replayPolyline = null; }
      replayMarkers.forEach(m => replayMapaInst.removeLayer(m));
      replayMarkers = [];
    }

    if (!trajeto.length && !clientes.length) {
      lista.innerHTML = '<div class="rel-empty">Nenhum dado encontrado para essa data/motoboy</div>';
      document.getElementById('replay-kpi-km').textContent = '—';
      document.getElementById('replay-kpi-chegadas').textContent = '—';
      document.getElementById('replay-kpi-periodo').textContent = '—';
      return;
    }

    // Desenha o trajeto (linha real, com curvas)
    let km = 0;
    if (trajeto.length > 1) {
      if (replayMapaInst && typeof L !== 'undefined') {
        const latlngs = trajeto.map(p => [p.lat, p.lng]);
        replayPolyline = L.polyline(latlngs, { color: '#1E9FD9', weight: 4, opacity: .85 }).addTo(replayMapaInst);
      }
      for (let i = 1; i < trajeto.length; i++) {
        const R = 6371, dLat = (trajeto[i].lat - trajeto[i-1].lat) * Math.PI/180, dLng = (trajeto[i].lng - trajeto[i-1].lng) * Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(trajeto[i-1].lat*Math.PI/180)*Math.cos(trajeto[i].lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (dist < 5) km += dist;
      }
    }

    // Desenha os pins dos clientes — usa a coordenada CADASTRADA do cliente
    // (cliente_lat/cliente_lng, vinda do JOIN com a tabela clientes no Worker),
    // não a coordenada de movimento do dia — assim o pin sempre aparece,
    // mesmo em dias em que o GPS não registrou a chegada daquele cliente.
    const bounds = [];
    clientes.forEach((c, i) => {
      const lat = c.cliente_lat ?? c.lat;
      const lng = c.cliente_lng ?? c.lng;
      if (!lat && !lng) return; // cliente sem coordenada cadastrada — pula
      const temChegada = !!c.horario_chegada_gps;
      bounds.push([lat, lng]);
      if (!replayMapaInst || typeof L === 'undefined') return;
      const cor = temChegada ? '#0F9B78' : '#F59E0B';
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${cor};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:30px;height:30px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center">
          <span style="transform:rotate(45deg);font-size:11px;font-weight:800">${i+1}</span>
        </div>`,
        iconSize: [30,30], iconAnchor: [15,30], popupAnchor: [0,-30]
      });
      const horaChegada = temChegada ? new Date(c.horario_chegada_gps).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}) : null;
      const marker = L.marker([lat, lng], { icon }).addTo(replayMapaInst).bindPopup(
        `<div style="font-family:-apple-system,sans-serif;min-width:180px">
          <div style="font-weight:700;color:#0F4C7A;margin-bottom:4px">${c.nome_cliente}</div>
          <div style="font-size:12px;color:#5A7A8F;margin-bottom:4px">${temChegada ? '🕐 Chegada: ' + horaChegada : '⚠️ Sem chegada GPS'}</div>
          <div style="font-size:11px;color:#94A8B8;font-family:monospace">${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}</div>
          ${c.cliente_endereco ? `<div style="font-size:11px;color:#94A8B8;margin-top:2px">${c.cliente_endereco}</div>` : ''}
        </div>`
      );
      replayMarkers.push(marker);
    });

    if (trajeto.length) trajeto.forEach(p => bounds.push([p.lat, p.lng]));
    if (bounds.length && replayMapaInst && typeof L !== 'undefined') replayMapaInst.fitBounds(L.latLngBounds(bounds), { padding: [30,30] });

    // KPIs
    document.getElementById('replay-kpi-km').textContent = (Math.round(km*10)/10) + ' km';
    const comChegada = clientes.filter(c => c.horario_chegada_gps).length;
    document.getElementById('replay-kpi-chegadas').textContent = comChegada + '/' + clientes.length;
    if (trajeto.length) {
      const ini = new Date(trajeto[0].timestamp).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
      const fim = new Date(trajeto[trajeto.length-1].timestamp).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
      document.getElementById('replay-kpi-periodo').textContent = ini + ' – ' + fim;
    } else {
      document.getElementById('replay-kpi-periodo').textContent = '—';
    }

    // Lista de clientes
    if (!clientes.length) {
      lista.innerHTML = '<div class="rel-empty">Nenhuma coleta registrada nessa data</div>';
      return;
    }
    function fmtHora(ts) {
      if (!ts) return null;
      return new Date(ts).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    }
    lista.innerHTML = clientes.map((c, i) => {
      const horaChegada = fmtHora(c.horario_chegada_gps);
      const horaFinal = fmtHora(c.timestamp);
      const diff = (c.horario_chegada_gps && c.timestamp) ? Math.round((c.timestamp - c.horario_chegada_gps) / 60000) : null;
      const ok = !!c.horario_chegada_gps;
      return `<div style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid #F5F9FC">
        <div style="width:26px;height:26px;border-radius:50%;background:#E8F4FB;color:#0F4C7A;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#0F2940">${c.nome_cliente}</div>
          <div style="font-size:11px;color:#94A8B8;margin-top:1px">Nº ${c.numero_cliente}</div>
        </div>
        <div style="display:flex;gap:14px;flex-shrink:0">
          <div style="text-align:center">
            <div style="font-size:8.5px;font-weight:700;color:#94A8B8;text-transform:uppercase">Chegada GPS</div>
            <div style="font-size:13px;font-weight:800;color:${ok?'#0F4C7A':'#94A8B8'};margin-top:1px">${horaChegada || 'sem GPS'}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:8.5px;font-weight:700;color:#94A8B8;text-transform:uppercase">Finalização</div>
            <div style="font-size:13px;font-weight:800;color:#0F4C7A;margin-top:1px">${horaFinal || '\u2014'}</div>
            ${diff !== null && diff > 0 ? `<div style="font-size:9.5px;font-weight:700;color:#94A8B8;margin-top:1px">+${diff}min</div>` : ''}
          </div>
        </div>
        <span style="font-size:9.5px;font-weight:700;padding:3px 9px;border-radius:99px;flex-shrink:0;background:${ok?'#E1F5EE':'#FCEBEB'};color:${ok?'#085041':'#991B1B'}">${ok?'✓ OK':'⚠ Sem chegada'}</span>
      </div>`;
    }).join('');
  } catch(e) {
    lista.innerHTML = '<div class="rel-empty">Erro ao carregar dados</div>';
  }
}

// ── AUDITORIA DE COORDENADAS — outliers por rota ─────────────
async function carregarRelCoordenadas() {
  const lista = document.getElementById('rel-coord-lista');
  if (!lista) return;
  lista.innerHTML = '<div class="rel-empty"><span class="spinner"></span> Analisando coordenadas...</div>';
  try {
    const r = await fetch(API + '/auditoria-coordenadas?limite_km=1.5');
    const d = await r.json();
    const suspeitos = d.suspeitos || [];
    document.getElementById('rel-coord-kpi-total').textContent = suspeitos.length;
    document.getElementById('rel-coord-kpi-analisados').textContent = d.total_analisados || 0;

    if (!suspeitos.length) {
      lista.innerHTML = '<div class="rel-empty">✓ Nenhuma coordenada suspeita encontrada</div>';
      return;
    }

    lista.innerHTML = `<table class="rel-table"><thead><tr>
      <th>Cliente</th><th>Rota</th><th>Distância do centro</th><th>Coordenada atual</th><th>Endereço</th><th></th>
    </tr></thead><tbody>` + suspeitos.map(s => `
      <tr>
        <td><div class="rel-nome">${s.nome}</div><div class="rel-sub">Nº ${s.numero_cliente}</div></td>
        <td>${s.rota}</td>
        <td><span class="rel-badge ${s.distancia_centro_km > 3 ? 'rel-b-err' : 'rel-b-warn'}">${s.distancia_centro_km} km</span></td>
        <td style="font-family:monospace;font-size:11px">${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}</td>
        <td style="font-size:11px;color:#94A8B8">${s.endereco || '—'}</td>
        <td><button class="rel-btn-outline" onclick='abrirCorrigirCoordenada(${s.id}, "${(s.numero_cliente||'').replace(/"/g,'')}", "${(s.nome||'').replace(/"/g,'')}", "${(s.rota||'').replace(/"/g,'')}", ${s.lat}, ${s.lng}, "${(s.endereco||'').replace(/"/g,'')}")'>✏️ Corrigir</button></td>
      </tr>
    `).join('') + '</tbody></table>';
  } catch(e) {
    lista.innerHTML = '<div class="rel-empty">Erro ao carregar auditoria</div>';
  }
}

// Abre o modal de editar cliente já preenchido, focando no campo de coordenada
function abrirCorrigirCoordenada(id, numero_cliente, nome, rota, lat, lng, endereco, mostrar_endereco, horario, dias_ativos, nome_motoboy) {
  const c = {
    id, numero_cliente, nome, rota, lat, lng, endereco,
    mostrar_endereco: mostrar_endereco || 0,
    horario: horario || '',
    dias_ativos: dias_ativos || '',
    nome_motoboy: nome_motoboy || ''
  };
  if (typeof abrirEditarAlocado === 'function') {
    abrirEditarAlocado(c);
    setTimeout(() => {
      const campoCoord = document.getElementById('mec-coord');
      if (campoCoord) { campoCoord.style.borderColor = '#DC2626'; campoCoord.focus(); }
    }, 200);
  } else {
    toast('Abra "Buscar cliente" e edite o cliente: ' + nome);
  }
}

// ── GEOCODIFICAÇÃO: busca lat/lng a partir do endereço, com confirmação ──
async function buscarCoordenadaPorEndereco() {
  const endereco = document.getElementById('cc-endereco')?.value?.trim();
  const status = document.getElementById('cc-geocode-status');
  if (!endereco) { toast('Digite o endereço primeiro'); return; }

  if (status) {
    status.style.display = 'block';
    status.style.color = '#5A7A8F';
    status.innerHTML = '<span class="spinner"></span> Buscando coordenada...';
  }

  try {
    const r = await fetch(API + '/geocodificar-endereco?endereco=' + encodeURIComponent(endereco));
    const d = await r.json();
    if (d.status !== 'ok') {
      if (status) {
        status.style.color = '#DC2626';
        status.textContent = '✗ ' + (d.msg || 'Endereço não encontrado — confira ou digite a coordenada manualmente');
      }
      return;
    }

    const precisaoLabel = {
      ROOFTOP: '✓ Exato (endereço específico)',
      RANGE_INTERPOLATED: '✓ Bem preciso (interpolado entre números)',
      GEOMETRIC_CENTER: '⚠️ Aproximado (centro de uma área/rua)',
      APPROXIMATE: '⚠️ Aproximado'
    }[d.precisao] || (d.confiavel ? '✓ Confiável' : '⚠️ Confira no mapa antes de usar');

    if (status) {
      status.style.display = 'none';
    }

    // Card de confirmação — exige clique explícito antes de preencher a coordenada
    const containerId = 'cc-geocode-confirm';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.getElementById('cc-endereco').closest('.field').after(container);
    }
    const corBorda = d.confiavel ? '#0F9B78' : '#F59E0B';
    const corFundo = d.confiavel ? '#F0FAF7' : '#FEF9EC';
    container.innerHTML = `
      <div style="background:${corFundo};border:1.5px solid ${corBorda};border-radius:10px;padding:12px;margin:8px 0">
        <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:4px">📍 ${d.endereco_formatado}</div>
        <div style="font-size:11px;color:#5A7A8F;margin-bottom:2px">Precisão: ${precisaoLabel}${d.match_parcial ? ' · ⚠️ correspondência parcial — confirme o número' : ''}</div>
        <div style="font-size:11px;color:#94A8B8;font-family:monospace;margin-bottom:10px">${d.lat.toFixed(7)}, ${d.lng.toFixed(7)} (fonte: ${d.fonte})</div>
        <div style="display:flex;gap:8px">
          <button onclick="confirmarCoordenadaGeocodificada(${d.lat}, ${d.lng})" style="flex:1;height:36px;border-radius:8px;border:none;background:#0F4C7A;color:#fff;font-size:12px;font-weight:700;cursor:pointer">✓ Usar esta coordenada</button>
          <button onclick="document.getElementById('cc-geocode-confirm').remove()" style="height:36px;padding:0 14px;border-radius:8px;border:1.5px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:12px;font-weight:600;cursor:pointer">Descartar</button>
        </div>
      </div>
    `;
  } catch (e) {
    if (status) {
      status.style.color = '#DC2626';
      status.textContent = '✗ Erro ao buscar coordenada';
    }
  }
}

function confirmarCoordenadaGeocodificada(lat, lng) {
  const campoCoord = document.getElementById('cc-coord');
  if (campoCoord) campoCoord.value = lat.toFixed(7) + ',' + lng.toFixed(7);
  const container = document.getElementById('cc-geocode-confirm');
  if (container) container.remove();
  toast('Coordenada aplicada ✓');
}
// ── PONTOS DA ROTA — checkpoints opcionais, vinculados à rota ───────────
// Registram apenas o horário em que o motoboy passou por ali (raio 200m,
// detectado pelo cron do worker — não depende do app/APK).

let _prEditId = null;

async function carregarPontosRota() {
  const lista = document.getElementById('pr-lista');
  const sel = document.getElementById('pr-rota-sel');
  const selPp = document.getElementById('pp-rota-sel');
  if (!lista) return;

  try {
    const [rRotas, rPontos] = await Promise.all([
      fetch(API + '/rotas-disponiveis?todos_dias=1'),
      fetch(API + '/pontos-rota')
    ]);
    const dRotas = await rRotas.json();
    const dPontos = await rPontos.json();
    const rotas = (dRotas.rotas || []).map(r => r.rota).sort();
    const pontos = dPontos.pontos || [];

    if (sel) {
      sel.innerHTML = '<option value="">Selecione...</option>';
      rotas.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
    }
    if (selPp) {
      selPp.innerHTML = '<option value="">Todas as rotas</option>';
      rotas.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; selPp.appendChild(o); });
    }

    if (!pontos.length) {
      lista.innerHTML = '<div class="empty" style="font-size:12px">Nenhum ponto cadastrado</div>';
      return;
    }

    const porRota = {};
    pontos.forEach(p => { if (!porRota[p.rota]) porRota[p.rota] = []; porRota[p.rota].push(p); });

    lista.innerHTML = Object.entries(porRota).map(([rota, pts]) => {
      const linhas = pts.map(p => `
        <div style="display:flex;align-items:center;gap:6px;padding:5px 14px 5px 24px">
          <span style="font-size:11px;color:#5A7A8F;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📌 ${p.nome}${p.endereco ? ' · ' + p.endereco : ''}</span>
          <button onclick="editarPontoRota(${p.id},'${(p.rota||'').replace(/'/g,"\\'")}','${(p.nome||'').replace(/'/g,"\\'")}',${p.lat},${p.lng},'${(p.endereco||'').replace(/'/g,"\\'")}')" style="background:none;border:none;color:#1D4ED8;font-size:11px;cursor:pointer;padding:0">✏️</button>
          <button onclick="removerPontoRota(${p.id})" style="background:none;border:none;color:#D1D5DB;font-size:11px;cursor:pointer;padding:0">✕</button>
        </div>`).join('');
      return `<div style="border-bottom:1px solid #F0F4F8;padding:6px 0">
        <div style="padding:2px 14px;font-size:12px;font-weight:700;color:#0F4C7A">${rota}</div>
        ${linhas}
      </div>`;
    }).join('');
  } catch(e) {
    if (lista) lista.innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}

async function buscarCoordenadaPontoRota() {
  const endereco = document.getElementById('pr-endereco')?.value?.trim();
  const status = document.getElementById('pr-geocode-status');
  if (!endereco) { toast('Digite o endereço primeiro'); return; }

  if (status) { status.style.display = 'block'; status.style.color = '#5A7A8F'; status.innerHTML = '<span class="spinner"></span> Buscando coordenada...'; }

  try {
    const r = await fetch(API + '/geocodificar-endereco?endereco=' + encodeURIComponent(endereco));
    const d = await r.json();
    if (d.status !== 'ok') {
      if (status) { status.style.color = '#DC2626'; status.textContent = '✗ ' + (d.msg || 'Endereço não encontrado — digite a coordenada manualmente'); }
      return;
    }

    const precisaoLabel = {
      ROOFTOP: '✓ Exato (endereço específico)',
      RANGE_INTERPOLATED: '✓ Bem preciso (interpolado entre números)',
      GEOMETRIC_CENTER: '⚠️ Aproximado (centro de uma área/rua)',
      APPROXIMATE: '⚠️ Aproximado'
    }[d.precisao] || (d.confiavel ? '✓ Confiável' : '⚠️ Confira antes de usar');

    if (status) status.style.display = 'none';

    const containerId = 'pr-geocode-confirm';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.getElementById('pr-endereco').closest('div').after(container);
    }
    const corBorda = d.confiavel ? '#0F9B78' : '#F59E0B';
    const corFundo = d.confiavel ? '#F0FAF7' : '#FEF9EC';
    container.innerHTML = `
      <div style="background:${corFundo};border:1.5px solid ${corBorda};border-radius:10px;padding:12px;margin:8px 0">
        <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:4px">📍 ${d.endereco_formatado}</div>
        <div style="font-size:11px;color:#5A7A8F;margin-bottom:2px">Precisão: ${precisaoLabel}</div>
        <div style="font-size:11px;color:#94A8B8;font-family:monospace;margin-bottom:10px">${d.lat.toFixed(7)}, ${d.lng.toFixed(7)} (fonte: ${d.fonte})</div>
        <div style="display:flex;gap:8px">
          <button onclick="confirmarCoordenadaPontoRota(${d.lat}, ${d.lng})" style="flex:1;height:36px;border-radius:8px;border:none;background:#0F4C7A;color:#fff;font-size:12px;font-weight:700;cursor:pointer">✓ Usar esta coordenada</button>
          <button onclick="document.getElementById('pr-geocode-confirm').remove()" style="height:36px;padding:0 14px;border-radius:8px;border:1.5px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:12px;font-weight:600;cursor:pointer">Descartar</button>
        </div>
      </div>`;
  } catch(e) {
    if (status) { status.style.color = '#DC2626'; status.textContent = '✗ Erro ao buscar coordenada'; }
  }
}

function confirmarCoordenadaPontoRota(lat, lng) {
  const campo = document.getElementById('pr-coord');
  if (campo) campo.value = lat.toFixed(7) + ',' + lng.toFixed(7);
  document.getElementById('pr-geocode-confirm')?.remove();
  toast('Coordenada aplicada ✓');
}

function editarPontoRota(id, rota, nome, lat, lng, endereco) {
  _prEditId = id;
  document.getElementById('pr-rota-sel').value = rota;
  document.getElementById('pr-nome').value = nome;
  document.getElementById('pr-endereco').value = endereco || '';
  document.getElementById('pr-coord').value = lat.toFixed(7) + ',' + lng.toFixed(7);
  const btn = document.getElementById('pr-btn-salvar');
  if (btn) btn.textContent = '✓ Salvar alterações';
  document.getElementById('pr-nome')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoPontoRota() {
  _prEditId = null;
  document.getElementById('pr-nome').value = '';
  document.getElementById('pr-endereco').value = '';
  document.getElementById('pr-coord').value = '';
  const btn = document.getElementById('pr-btn-salvar');
  if (btn) btn.textContent = '✓ Adicionar ponto';
}

async function salvarPontoRota() {
  const rota = document.getElementById('pr-rota-sel')?.value;
  const nome = document.getElementById('pr-nome')?.value?.trim();
  const coord = document.getElementById('pr-coord')?.value?.trim();
  const endereco = document.getElementById('pr-endereco')?.value?.trim();

  if (!rota) { toast('Selecione a rota'); return; }
  if (!nome) { toast('Informe o nome do ponto'); return; }
  if (!coord || !coord.includes(',')) { toast('Informe as coordenadas (busque pelo endereço ou digite manualmente)'); return; }

  const [latStr, lngStr] = coord.split(',').map(s => s.trim());
  const lat = parseFloat(latStr), lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) { toast('Coordenadas inválidas'); return; }

  try {
    if (_prEditId) {
      await fetch(API + '/pontos-rota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: _prEditId, nome, lat, lng, endereco })
      });
      toast('✓ Ponto atualizado');
    } else {
      await fetch(API + '/pontos-rota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rota, nome, lat, lng, endereco })
      });
      toast('✓ Ponto adicionado');
    }
    cancelarEdicaoPontoRota();
    document.getElementById('pr-geocode-confirm')?.remove();
    carregarPontosRota();
  } catch(e) { toast('Erro ao salvar'); }
}

async function removerPontoRota(id) {
  if (!confirm('Remover este ponto?')) return;
  try {
    await fetch(API + '/pontos-rota', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast('✓ Ponto removido');
    carregarPontosRota();
  } catch(e) { toast('Erro ao remover'); }
}

// ── PASSAGENS NOS PONTOS — lista cronológica ────────────────────────────
async function carregarPassagensPontos() {
  const lista = document.getElementById('pp-lista');
  const data = document.getElementById('pp-data')?.value;
  const rota = document.getElementById('pp-rota-sel')?.value;
  if (!lista) return;
  if (!data) { toast('Selecione a data'); return; }

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

async function reprocessarPassagensPontos() {
  const data = document.getElementById('pp-data')?.value;
  const rota = document.getElementById('pp-rota-sel')?.value;
  if (!data) { toast('Selecione a data'); return; }
  if (!confirm('Reprocessar passagens de ' + data + (rota ? ' para a rota ' + rota : ' para todas as rotas') + '? Isso busca no histórico de GPS se algum motoboy já passou pelos pontos cadastrados.')) return;

  toast('Reprocessando...');
  try {
    const body = { data };
    if (rota) body.rota = rota;
    const r = await fetch(API + '/passagens-reprocessar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    toast('✓ ' + (d.inseridos || 0) + ' passagem(ns) encontrada(s)');
    carregarPassagensPontos();
  } catch(e) { toast('Erro ao reprocessar'); }
}
