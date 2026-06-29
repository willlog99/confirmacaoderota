// ============================================================
// ── MOTOBOYS — Operações, rotas, confirmações, disparador ──────────────────
// ============================================================

// ── VARIÁVEIS ──
let motoboysListaCompleta = [];
let filtroMotorostasDia = '';
let agendamentos = JSON.parse(localStorage.getItem('disp_agendamentos') || '[]');
let editandoAgendamento = null;
let diasSelecionados = new Set();
let destSelecionado = 'todos';


// diasLabels definido em DADOS abaixo


// destLabels definido em DADOS abaixo

// ── FUNÇÕES ──

async function carregarPainel(silent) {
  try {
    carregarHistoricoDisparos();

    if (!silent) {
      const el = document.getElementById('painel-rotas');
      if (el) el.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // Busca o dia atual — mais rápido que todos_dias=1
    let urlPainel = API + '/painel-dados';
    if (filtroDia === 'todos') {
      urlPainel += '?todos_dias=1';
    } else if (filtroDia) {
      urlPainel += '?dia_semana=' + filtroDia;
    }
    const res = await fetch(urlPainel, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();

    cachePainel = data;
    renderizarPainel(data);

  } catch(e) {
    const el = document.getElementById('painel-rotas');
    if (el) {
      if (e.name === 'AbortError') {
        el.innerHTML = '<div class="empty" style="color:#A32D2D">⏱ Timeout — tente novamente <button onclick="carregarPainel()" style="margin-left:8px;padding:4px 10px;border-radius:6px;border:1px solid #A32D2D;background:#fff;color:#A32D2D;cursor:pointer;font-size:12px">🔄 Recarregar</button></div>';
      } else if (!silent) {
        el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro: ' + e.message + ' <button onclick="carregarPainel()" style="margin-left:8px;padding:4px 10px;border-radius:6px;border:1px solid #A32D2D;background:#fff;color:#A32D2D;cursor:pointer;font-size:12px">🔄 Recarregar</button></div>';
      }
    }
  }
}


async function renderizarPainel(data) {
  try {
  const todasRotas = data.rotas || [];
  const clientesPorRota = data.clientes_por_rota || {};
  let confirmacoes = data.confirmacoes || [];

  // /painel-dados retorna confirmações sem filtro de data — descarta as de dias anteriores.
  // c.data vem no formato 'DD/MM/YYYY, HH:MM' (pt-BR); compara com a data atual de SP.
  const hojeBR = (typeof getDataLocalSP === 'function') ? getDataLocalSP() : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [aa, mm, dd] = hojeBR.split('-');
  const hojeBRFmt = `${dd}/${mm}/${aa}`;
  confirmacoes = confirmacoes.filter(c => !c.data || c.data.startsWith(hojeBRFmt));

  // Filtrar rotas pelo dia selecionado
  const rotas = filtroDia === 'todos'
    ? todasRotas
    : todasRotas.filter(r => r.dia_semana === filtroDia);

  rotasDisponiveis = rotas.map(r => r.rota);

    // KPIs
    let totalGeral = 0, feitasGeral = 0;
    rotas.forEach(r => {
      const cls = clientesPorRota[r.rota] || [];
      totalGeral += cls.length;
      feitasGeral += cls.filter(c => c.status === 'entregue').length;
    });

    document.getElementById('kpi-total').textContent = totalGeral;
    document.getElementById('kpi-feitas').textContent = feitasGeral;
    document.getElementById('kpi-pendentes').textContent = totalGeral - feitasGeral;
    document.getElementById('kpi-motoboys').textContent = rotas.filter(r => r.motoboy_aberto).length;
    document.getElementById('rotas-badge').textContent = rotas.length;

    const totalUnidades = 37;
    const conf = confirmacoes.length;
    document.getElementById('conf-prog-val').textContent = conf;
    document.getElementById('conf-prog-lbl').textContent = conf === 1 ? 'Biocondutor confirmado' : 'Biocondutores confirmados';
    document.getElementById('conf-bar-fill').style.width = Math.min(100, Math.round(conf/totalUnidades*100)) + '%';

    const confEl = document.getElementById('conf-list-live');
    if (!confirmacoes.length) {
      confEl.innerHTML = '<div class="empty">Aguardando confirmações...</div>';
    } else {
      // Se hoje é sexta, busca pré-confirmações de sábado
      let preConfMap = {};
      try {
        const rDia = await fetch(API + '/servidor-data');
        const dDia = await rDia.json();
        if (dDia.dia_semana === 5) {
          const rPre = await fetch(API + '/pre-confirmacao-sabado?data=' + dDia.data);
          const dPre = await rPre.json();
          (dPre.resultados || []).forEach(p => { preConfMap[p.biocondutor] = p.resposta; });
        }
      } catch(e) {}

      confEl.innerHTML = confirmacoes.slice(0, 15).map(c => {
        const hora = c.data ? c.data.split(' ').pop() : '';
        const rotasStr = c.rotas && c.rotas.length ? c.rotas.join(', ') : '';
        const preConf = preConfMap[c.biocondutor];
        const sabadoBadge = preConf
          ? (preConf === 'sim'
              ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#DCFCE7;color:#166534;margin-top:4px;display:inline-block">📅 Sábado: Sim</span>'
              : '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#FEF2F2;color:#991B1B;margin-top:4px;display:inline-block">📅 Sábado: Não</span>')
          : '';
        return `<div class="conf-row ${c.resposta}">
          <div class="conf-ico">${c.resposta === 'sim' ? '✓' : '✕'}</div>
          <div class="conf-info">
            <div class="conf-uni">${c.biocondutor}</div>
            ${rotasStr ? `<div style="font-size:11px;color:#5A7A8F;margin-top:2px">🛣️ ${rotasStr}</div>` : ''}
            ${c.obs ? `<div class="conf-obs">${c.obs}</div>` : ''}
            ${sabadoBadge}
          </div>
          <div class="conf-hora">${hora}</div>
        </div>`;
      }).join('');
    }

    // Renderizar rotas PRIMEIRO — sem esperar checklist
    const el = document.getElementById('painel-rotas');
    if (!rotas.length) { el.innerHTML = '<div class="empty">Nenhuma rota cadastrada</div>'; }
    else {
      const renderCard = (r, i) => {
        const cls = clientesPorRota[r.rota] || [];
        const total = cls.length;
        const feitas = cls.filter(c => c.status === 'entregue').length;
        const pct = total > 0 ? Math.round(feitas/total*100) : 0;
        const completa = feitas === total && total > 0;
        const emAndamento = r.ativa;
        const status = completa ? 'completa' : emAndamento ? 'em-andamento' : 'livre';
        const motoStr = r.motoboy_aberto || 'Sem motorista';
        const expandida = cardExpandido === r.rota ? 'expanded' : '';

        // Confirmação de presença
        const confirmou = confirmacoes.some(c => c.biocondutor === motoStr && c.resposta === 'sim');
        const confBadge = r.motoboy_aberto
          ? (confirmou
            ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#DCFCE7;color:#14532D;white-space:nowrap;flex-shrink:0">✓</span>`
            : `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#FEF2F2;color:#991B1B;white-space:nowrap;flex-shrink:0">✕</span>`)
          : '';

        const corBarra = completa ? '#0F9B78' : emAndamento ? '#1E9FD9' : '#D6E5EE';
        const corPct = completa ? '#0F9B78' : emAndamento ? '#0F4C7A' : '#94A8B8';

        const ent = cls.filter(c => c.status === 'entregue');
        const pend = cls.filter(c => c.status !== 'entregue');
        const renderPrev = (c, tipo) => {
          const ico = tipo === 'feito' ? '✓' : tipo === 'imp' ? '✕' : '⏳';
          const btnVoltar = (tipo === 'feito' || tipo === 'imp')
            ? `<button onclick="event.stopPropagation();voltarColetaPreview(${c.id},'${r.rota.replace(/'/g,"\\'")}')"
                style="background:#FEF9EC;color:#92400E;border:1.5px solid #F2CC70;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap">↩</button>`
            : '';
          return `<div class="preview-cli ${tipo}">
            <div class="preview-cli-ico">${ico}</div>
            <div class="preview-cli-nome">${c.nome}</div>
            <div class="preview-cli-hora">${c.horario}</div>
            ${btnVoltar}
          </div>`;
        };
        const prodList = ent.filter(c => c.produtividade !== 'improdutiva').map(c => renderPrev(c, 'feito')).join('');
        const impList  = ent.filter(c => c.produtividade === 'improdutiva').map(c => renderPrev(c, 'imp')).join('');
        const pendList = pend.map(c => renderPrev(c, 'pend')).join('');
        return `
          <div class="rota-card ${status}" data-rota="${r.rota.replace(/"/g,'&quot;')}" onclick="abrirModalRota('${r.rota.replace(/'/g,"\\'")}','${motoStr.replace(/'/g,"\\'")}',${feitas},${total})">
            <span style="font-size:15px;flex-shrink:0">${status === 'completa' ? '✅' : status === 'em-andamento' ? '🏍️' : '⏸️'}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:5px">
                ${confBadge}
                <div class="rota-nome" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.rota}</div>
              </div>
              <div class="rota-meta" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏍️ ${motoStr}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <div style="width:48px;height:3px;background:#E2E8F0;border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${corBarra};border-radius:99px"></div>
              </div>
              <div style="font-size:11px;font-weight:800;color:${corPct};min-width:28px;text-align:right">${total > 0 ? pct+'%' : '—'}</div>
            </div>
          </div>`;
      };

      if (filtroDia === 'todos') {
        // Agrupa por dia com separador
        const grupos = [
          { key: 'seg-sex', label: '📅 Segunda a Sexta' },
          { key: 'sabado',  label: '📅 Sábado' },
          { key: 'domingo', label: '📅 Domingo' }
        ];
        let html = '';
        grupos.forEach(g => {
          const rotasGrupo = rotas.filter(r => r.dia_semana === g.key);
          if (!rotasGrupo.length) return;
          html += `<div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;padding:10px 0 6px;border-top:1px solid #EBF1F5;margin-top:4px">${g.label} <span style="background:#E8F4FB;color:#1E9FD9;border-radius:20px;padding:1px 7px;font-size:10px">${rotasGrupo.length}</span></div>`;
          html += rotasGrupo.map((r, i) => renderCard(r, i)).join('');
        });
        el.innerHTML = html || '<div class="empty">Nenhuma rota cadastrada</div>';
      } else {
        el.innerHTML = rotas.map((r, i) => renderCard(r, i)).join('');
      }
    } // fim else rotas

    // Calcular atrasos — só rotas ativas com checklist feito
    const agora = new Date();
    const agoraSP = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
    const segsAgora = agoraSP.getUTCHours() * 3600 + agoraSP.getUTCMinutes() * 60 + agoraSP.getUTCSeconds();
    const todosAtrasos = [];
    rotas.forEach(r => {
      // Só dia filtrado
      if (filtroDia !== 'todos' && r.dia_semana !== filtroDia) return;
      // Só rotas ativas (em andamento)
      if (!r.ativa) return;
      // Só motoboys que fizeram checklist
      if (r.motoboy_aberto && window._checklistFeitos && !window._checklistFeitos.has(r.motoboy_aberto)) return;
      const cls = clientesPorRota[r.rota] || [];
      cls.forEach(c => {
        if (c.status === 'entregue') return; // já deu baixa — some
        const [h, m] = (c.horario || '00:00').split(':').map(Number);
        const segsMarcado = h * 3600 + m * 60;
        const segsAtrasado = segsAgora - segsMarcado;
        if (segsAtrasado > 1800) {
          todosAtrasos.push({ id: c.id, nome: c.nome, horario: c.horario, rota: r.rota, segsAtrasado });
        }
      });
    });
    
    document.getElementById('atrasos-badge').textContent = todosAtrasos.length;
    
    const atrasoEl = document.getElementById('painel-atrasos');
    if (!todosAtrasos.length) {
      atrasoEl.innerHTML = '<div class="empty">Nenhum cliente em atraso ✓</div>';
      if (window._timerAtrasos) { clearInterval(window._timerAtrasos); window._timerAtrasos = null; }
    } else {
      // Salva atrasos globalmente para o timer atualizar
      window._atrasosDados = todosAtrasos;

      function renderAtrasos() {
        const agora2 = new Date();
        const agoraSP2 = new Date(agora2.getTime() - 3 * 60 * 60 * 1000);
        const segsAgora2 = agoraSP2.getUTCHours() * 3600 + agoraSP2.getUTCMinutes() * 60 + agoraSP2.getUTCSeconds();

        atrasoEl.innerHTML = (window._atrasosDados || []).map(a => {
          const [h, m] = (a.horario || '00:00').split(':').map(Number);
          const segsMarcado = h * 3600 + m * 60;
          const segsAtrasado = Math.max(0, segsAgora2 - segsMarcado);
          const horas = Math.floor(segsAtrasado / 3600);
          const mins = Math.floor((segsAtrasado % 3600) / 60);
          const secs = segsAtrasado % 60;
          const tempoStr = horas > 0
            ? horas + 'h ' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0')
            : '0:' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
          const cor = segsAtrasado > 3600 ? '#DC2626' : '#92400E';
          const bg = segsAtrasado > 3600 ? '#FCEBEB' : '#FEF9EC';
          const brd = segsAtrasado > 3600 ? '#F09595' : '#F2CC70';
          return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:' + bg + ';border:1px solid ' + brd + ';margin-bottom:5px">'
            + '<span style="font-size:13px">⏰</span>'
            + '<div style="flex:1;min-width:0">'
            + '<span style="font-size:12px;font-weight:700;color:#0F4C7A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">' + a.nome + '</span>'
            + '<span style="font-size:11px;color:#5A7A8F">' + a.rota + ' · ' + a.horario + '</span>'
            + '</div>'
            + '<span style="font-size:13px;font-weight:800;color:' + cor + ';font-variant-numeric:tabular-nums;flex-shrink:0">' + tempoStr + '</span>'
            + '</div>';
        }).join('');
      }

      renderAtrasos();

      // Timer que atualiza a cada segundo
      if (window._timerAtrasos) clearInterval(window._timerAtrasos);
      window._timerAtrasos = setInterval(renderAtrasos, 1000);
    }

    // Checklist carrega DEPOIS das rotas — sem bloquear
    carregarChecklist(confirmacoes);

  } catch(e) {
    console.error('[renderizarPainel] Erro:', e);
    const el = document.getElementById('painel-rotas');
    if (el) el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro ao renderizar: ' + e.message + '</div>';
  }
} // fim renderizarPainel


function recalcularAtrasos(data) {
  const todasRotas = data.rotas || [];
  const clientesPorRota = data.clientes_por_rota || {};
  const rotas = filtroDia === 'todos' ? todasRotas : todasRotas.filter(r => r.dia_semana === filtroDia);

  const agora = new Date();
  const agoraSP = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const segsAgora = agoraSP.getUTCHours() * 3600 + agoraSP.getUTCMinutes() * 60 + agoraSP.getUTCSeconds();
  const todosAtrasos = [];

  rotas.forEach(r => {
    if (!r.ativa) return;
    if (r.motoboy_aberto && window._checklistFeitos && !window._checklistFeitos.has(r.motoboy_aberto)) return;
    const cls = clientesPorRota[r.rota] || [];
    cls.forEach(c => {
      if (c.status === 'entregue') return;
      const [h, m] = (c.horario || '00:00').split(':').map(Number);
      const segsMarcado = h * 3600 + m * 60;
      const segsAtrasado = segsAgora - segsMarcado;
      if (segsAtrasado > 1800) {
        todosAtrasos.push({ id: c.id, nome: c.nome, horario: c.horario, rota: r.rota, segsAtrasado });
      }
    });
  });

  document.getElementById('atrasos-badge').textContent = todosAtrasos.length;
  window._atrasosDados = todosAtrasos;

  const atrasoEl = document.getElementById('painel-atrasos');
  if (!atrasoEl) return;
  if (!todosAtrasos.length) {
    atrasoEl.innerHTML = '<div class="empty">Nenhum cliente em atraso ✓</div>';
    if (window._timerAtrasos) { clearInterval(window._timerAtrasos); window._timerAtrasos = null; }
  } else if (!window._timerAtrasos) {
    window._timerAtrasos = setInterval(() => {
      const el2 = document.getElementById('painel-atrasos');
      if (el2) el2.dispatchEvent(new Event('render-atrasos'));
    }, 1000);
  }
}


async function carregarChecklist(confirmacoes) {
  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const chkRes = await fetch(API + '/checklist?data=' + encodeURIComponent(hoje));
    const chkData = await chkRes.json();
    const checklists = chkData.checklists || [];
    const preencheram = new Set(checklists.map(c => c.biocondutor));

    // Salvar globalmente para o cálculo de atrasos usar
    window._checklistFeitos = preencheram;

    // Só recalcular atrasos sem re-renderizar o painel inteiro
    if (cachePainel) recalcularAtrasos(cachePainel);

    const confirmaramSim = (confirmacoes || []).filter(c => c.resposta === 'sim');
    document.getElementById('checklist-badge').textContent = preencheram.size;

    const chkEl = document.getElementById('painel-checklist');
    if (!confirmaramSim.length) {
      chkEl.innerHTML = '<div class="empty">Aguardando confirmações...</div>';
    } else {
      chkEl.innerHTML = confirmaramSim.map(c => {
        const preencheu = preencheram.has(c.biocondutor);
        return `<div class="conf-row" style="background:${preencheu ? '#F0FAF7' : '#FEF9EC'};border-color:${preencheu ? '#85DDBA' : '#F2CC70'}">
          <div class="conf-ico" style="background:${preencheu ? '#0F9B78' : '#F59E0B'};color:#fff">${preencheu ? '✓' : '⏳'}</div>
          <div class="conf-info">
            <div class="conf-uni">${c.biocondutor}</div>
            <div style="font-size:11px;color:#5A7A8F;margin-top:2px">${preencheu ? '✓ Checklist preenchido' : '⏳ Aguardando checklist'}</div>
          </div>
        </div>`;
      }).join('');
    }
  } catch(e) {
    document.getElementById('painel-checklist').innerHTML = '<div class="empty">Erro ao carregar</div>';
  }
}


async function abrirModalRota(rota, moto, feitas, total) {
  // Cria modal se não existir
  if (!document.getElementById('modal-rota')) {
    const m = document.createElement('div');
    m.id = 'modal-rota';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(15,40,64,.7);z-index:9999;display:none;align-items:flex-end;justify-content:center';
    m.onclick = e => { if (e.target === m) fecharModalRota(); };
    m.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:85vh;display:flex;flex-direction:column;animation:slideUp .3s cubic-bezier(.34,1.1,.64,1) both">
        <div style="padding:1rem 1.25rem .75rem;border-bottom:1px solid #EBF1F5;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div>
            <div id="mr-titulo" style="font-size:15px;font-weight:800;color:#0F4C7A"></div>
            <div id="mr-sub" style="font-size:12px;color:#5A7A8F;margin-top:2px"></div>
          </div>
          <button onclick="fecharModalRota()" style="background:none;border:none;color:#5A7A8F;font-size:22px;cursor:pointer">✕</button>
        </div>
        <div id="mr-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:.875rem 1.25rem;border-bottom:1px solid #EBF1F5;flex-shrink:0"></div>
        <div id="mr-lista" style="overflow-y:auto;flex:1;padding:.75rem 1.25rem"></div>
        <div style="padding:.875rem 1.25rem;border-top:1px solid #EBF1F5;flex-shrink:0">
          <button id="mr-btn-detalhe" style="width:100%;padding:11px;border-radius:10px;border:none;background:#0F4C7A;color:#fff;font-size:13px;font-weight:700;cursor:pointer">Ver detalhes completos →</button>
        </div>
      </div>`;
    document.body.appendChild(m);
  }

  const modal = document.getElementById('modal-rota');
  document.getElementById('mr-titulo').textContent = rota;
  document.getElementById('mr-sub').textContent = '🏍️ ' + moto;
  document.getElementById('mr-btn-detalhe').onclick = () => { fecharModalRota(); abrirDetalheRota(rota); };

  const pct = total > 0 ? Math.round(feitas/total*100) : 0;
  const corPct = pct === 100 ? '#0F9B78' : pct > 0 ? '#1E9FD9' : '#94A8B8';
  document.getElementById('mr-stats').innerHTML = `
    <div style="text-align:center;background:#F8FBFD;border-radius:8px;padding:8px">
      <div style="font-size:18px;font-weight:800;color:#0F4C7A">${total}</div>
      <div style="font-size:10px;color:#5A7A8F;margin-top:2px;text-transform:uppercase">Total</div>
    </div>
    <div style="text-align:center;background:#F8FBFD;border-radius:8px;padding:8px">
      <div style="font-size:18px;font-weight:800;color:#0F9B78">${feitas}</div>
      <div style="font-size:10px;color:#5A7A8F;margin-top:2px;text-transform:uppercase">Coletadas</div>
    </div>
    <div style="text-align:center;background:#F8FBFD;border-radius:8px;padding:8px">
      <div style="font-size:18px;font-weight:800;color:${corPct}">${total-feitas}</div>
      <div style="font-size:10px;color:#5A7A8F;margin-top:2px;text-transform:uppercase">Pendentes</div>
    </div>`;

  document.getElementById('mr-lista').innerHTML = '<div style="padding:1rem;text-align:center;color:#94A8B8"><span class="spinner"></span> Carregando...</div>';
  modal.style.display = 'flex';

  // Busca clientes
  try {
    const r = await fetch(API + '/rota?rota=' + encodeURIComponent(rota));
    const d = await r.json();
    const cls = d.clientes || [];
    const pend = cls.filter(c => c.status !== 'entregue');
    const ent  = cls.filter(c => c.status === 'entregue');
    const prod = ent.filter(c => c.produtividade === 'produtiva');
    const imp  = ent.filter(c => c.produtividade === 'improdutiva');

    const renderCli = (c, tipo) => {
      const corDot = tipo === 'prod' ? '#0F9B78' : tipo === 'imp' ? '#94A8B8' : '#F59E0B';
      const badge = tipo === 'prod' ? '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#DCFCE7;color:#166534">Produtiva</span>'
                  : tipo === 'imp'  ? '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#F1F5F9;color:#475569">Improdutiva</span>' : '';
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #F5F9FC">
        <span style="width:6px;height:6px;border-radius:50%;background:${corDot};flex-shrink:0"></span>
        <span style="flex:1;font-size:13px;color:#0F2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.nome}</span>
        <span style="font-size:11px;color:#94A8B8;flex-shrink:0">${c.horario || ''}</span>
        ${badge}
      </div>`;
    };

    let html = '';
    if (pend.length) html += `<div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">⏳ Pendentes (${pend.length})</div>${pend.map(c=>renderCli(c,'pend')).join('')}`;
    if (prod.length) html += `<div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px">✓ Coletadas (${prod.length})</div>${prod.map(c=>renderCli(c,'prod')).join('')}`;
    if (imp.length)  html += `<div style="font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px">✕ Improdutivas (${imp.length})</div>${imp.map(c=>renderCli(c,'imp')).join('')}`;

    document.getElementById('mr-lista').innerHTML = html || '<div style="padding:1rem;text-align:center;color:#94A8B8">Nenhum cliente</div>';
  } catch(e) {
    document.getElementById('mr-lista').innerHTML = '<div style="padding:1rem;text-align:center;color:#EF4444">Erro ao carregar</div>';
  }
}

function fecharModalRota() {
  const m = document.getElementById('modal-rota');
  if (m) m.style.display = 'none';
}

function toggleRotaPreview(card, rota) {
  // mantido por compatibilidade — não faz mais nada
}

let rotaDetalheAtual = null;


async function abrirDetalheRota(rota) {
  rotaDetalheAtual = rota;
  pararAutoRefresh();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-detalhe-rota').classList.add('active');
  document.getElementById('detalhe-titulo').textContent = rota;
  window.scrollTo(0,0);
  await carregarDetalheRota(rota);
}


async function carregarDetalheRota(rota) {
  const listaEl = document.getElementById('detalhe-lista');
  const kpisEl = document.getElementById('detalhe-kpis');
  listaEl.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';

  try {
    const r = await fetch(API + '/rota?rota=' + encodeURIComponent(rota) + '&todos_dias=1');
    const d = await r.json();
    const cls = d.clientes || [];
    const ent = cls.filter(c => c.status === 'entregue');
    const pend = cls.filter(c => c.status !== 'entregue');
    const prod = ent.filter(c => c.produtividade === 'produtiva').length;
    const imp = ent.filter(c => c.produtividade === 'improdutiva').length;

    kpisEl.innerHTML = `
      <span class="badge" style="background:#F0F4F8;color:#0F4C7A;font-size:13px;padding:6px 12px">${cls.length} total</span>
      <span class="badge" style="background:#E1F5EE;color:#085041;font-size:13px;padding:6px 12px">✓ ${prod} produtivas</span>
      ${imp ? `<span class="badge" style="background:#F0F4F8;color:#5A7A8F;font-size:13px;padding:6px 12px">✕ ${imp} improdutivas</span>` : ''}
      <span class="badge" style="background:#FEF9EC;color:#92400E;font-size:13px;padding:6px 12px">⏳ ${pend.length} pendentes</span>
    `;

    const renderC = c => {
      const feito = c.status === 'entregue';
      const bad = c.produtividade === 'improdutiva';
      const cls2 = feito ? (bad ? 'improdutivo' : 'feito') : '';
      const icls = feito ? (bad ? 'imp' : 'ok') : '';
      const icon = feito ? (bad ? '✕' : '✓') : '';
      const saida = c.horario_entrega ? c.horario_entrega.split(' ').pop() : '';
      return `<div class="cli-item ${cls2}" style="position:relative">
        <div class="cli-status ${icls}">${icon}</div>
        <div class="cli-info">
          <div class="cli-nome">${c.nome}</div>
          <div class="cli-meta">Nº ${c.numero_cliente}${saida ? ' · 🔵 '+saida : ''}${bad && c.motivo_improdutiva ? ' · '+c.motivo_improdutiva : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <div class="cli-hora">${c.horario}</div>
          ${feito ? `<button onclick="voltarColeta(${c.id})" style="background:#FEF9EC;color:#92400E;border:1.5px solid #F2CC70;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">↩ Voltar</button>` : ''}
        </div>
      </div>`;
    };

    listaEl.innerHTML = (pend.length ? `<div style="font-size:11px;font-weight:800;color:#92400E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">⏳ Pendentes (${pend.length})</div>${pend.map(renderC).join('')}` : '') +
      (ent.length ? `<div style="font-size:11px;font-weight:800;color:#1E9FD9;text-transform:uppercase;letter-spacing:.5px;margin:1rem 0 8px">✓ Registradas (${ent.length})</div>${ent.map(renderC).join('')}` : '') ||
      '<div class="empty">Nenhum cliente nesta rota</div>';

  } catch(e) {
    listaEl.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>';
  }
}


async function voltarColeta(id) {
  if (!confirm('Voltar esta coleta para pendente?')) return;
  try {
    await fetch(API + '/desticar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    toast('↩ Coleta voltou para pendente!');
    await carregarDetalheRota(rotaDetalheAtual);
  } catch(e) {
    toast('Erro ao voltar coleta');
  }
}


async function voltarColetaPreview(id, rota) {
  if (!confirm('Voltar esta coleta para pendente?')) return;
  try {
    await fetch(API + '/desticar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    toast('↩ Coleta voltou para pendente!');
    cardExpandido = null;
    await carregarPainel(false);
  } catch(e) {
    toast('Erro ao voltar coleta');
  }
}


async function carregarConfirmacoes() {
  const el = document.getElementById('lista-conf');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    // Filtra por hoje (SP) para não mostrar confirmações de dias anteriores.
    const hoje = (typeof getDataLocalSP === 'function') ? getDataLocalSP() : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const r = await fetch(API + '/historico-confirmacoes?data_inicio=' + hoje + '&data_fim=' + hoje);
    const d = await r.json();
    const conf = d.confirmacoes || [];
    if (!conf.length) { el.innerHTML = '<div class="empty">Nenhuma confirmação hoje</div>'; return; }
    el.innerHTML = conf.map(c => `
      <div class="conf-row ${c.resposta}">
        <div class="conf-ico">${c.resposta === 'sim' ? '✓' : '✕'}</div>
        <div class="conf-info">
          <div class="conf-uni">${c.biocondutor}</div>
          ${c.rotas && c.rotas.length ? `<div style="font-size:11px;color:#5A7A8F;margin-top:2px">🛣️ ${c.rotas.join(', ')}</div>` : ''}
          ${c.obs ? `<div class="conf-obs">${c.obs}</div>` : ''}
        </div>
        <div class="conf-hora">${c.data ? c.data.split(' ').pop() : ''}</div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>'; }
}


async function carregarMotoristasList() {
  const el = document.getElementById('lista-mb-view');
  if (!el) return;
  el.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const r = await fetch(API + '/motoboys?todos=1&agrupado=1', { signal: controller.signal });
    clearTimeout(timeoutId);
    const d = await r.json();
    motoboysListaCompleta = d.motoboys || [];
    if (!motoboysListaCompleta.length) { el.innerHTML = '<div class="empty">Nenhum motorista cadastrado</div>'; return; }
    renderizarMotoristasFiltrados();
  } catch(e) {
    const msg = e.name === 'AbortError' ? '⏱ Timeout — tente novamente' : '❌ ' + e.message;
    el.innerHTML = '<div class="empty" style="color:#A32D2D">' + msg + ' <button onclick="carregarMotoristasList()" style="margin-left:8px;padding:4px 10px;border-radius:6px;border:1px solid #A32D2D;background:#fff;color:#A32D2D;cursor:pointer;font-size:12px">🔄 Tentar novamente</button></div>';
  }
}


function renderizarMotoristasFiltrados() {
  const el = document.getElementById('lista-mb-view');
  if (!motoboysListaCompleta.length) return;
  
  const motoboysF = filtroMotorostasDia
    ? motoboysListaCompleta.filter(m => {
        // Filtrar motoristas que têm rota com esse dia_semana
        return m.rotas_info && m.rotas_info.some(r => r.dia_semana === filtroMotorostasDia);
      })
    : motoboysListaCompleta;
  
  if (!motoboysF.length) {
    el.innerHTML = '<div class="empty">Nenhum motorista encontrado para este filtro</div>';
    return;
  }
  
  el.innerHTML = motoboysF.map(m => `
    <div class="list-item">
      <div class="list-item-row">
        <div class="list-item-name">${m.nome}</div>
        <div class="list-item-meta">📱 ${m.telefone}</div>
      </div>
      ${m.rotas && m.rotas.length ? `<div style="font-size:12px;color:#5A7A8F;margin-top:6px">🛣️ ${m.rotas.join(', ')}</div>` : '<div style="font-size:12px;color:#94A8B8;margin-top:6px">Sem rotas</div>'}
    </div>`).join('');
}
let clienteParaMover = null;

let cardExpandido = null;
let rotasDisponiveis = [];

const agora = new Date();
const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
document.getElementById('topbar-data').textContent = `${dias[agora.getDay()]}, ${agora.getDate()} ${meses[agora.getMonth()]} ${agora.getFullYear()}`;

// Filtro de dia: determinar dia atual
const diaSemanaAtual = agora.getDay(); // 0=dom, 1=seg...6=sab
let filtroDia = diaSemanaAtual === 0 ? 'domingo' : diaSemanaAtual === 6 ? 'sabado' : 'seg-sex';


function filtrarMotoristasPlus(dia) {
  filtroMotorostasDia = dia;
  renderizarMotoristasFiltrados();
}


function renderizarFiltroDias() {
  const opcoes = [
    { key: 'seg-sex', label: 'Seg-Sex' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
    { key: 'todos', label: 'Todos' }
  ];
  document.getElementById('filtro-dias').innerHTML = opcoes.map(o => `
    <button onclick="trocarFiltroDia('${o.key}')" id="filtro-btn-${o.key}"
      style="padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .2s;
      ${filtroDia===o.key ? 'background:#1E9FD9;color:#fff;border-color:#1E9FD9' : 'background:#fff;color:#5A7A8F;border-color:#D6E5EE'}">
      ${o.label}
    </button>`).join('');
}

// Cache global de dados do painel
let cachePainel = null;


function trocarFiltroDia(dia) {
  filtroDia = dia;
  renderizarFiltroDias();
  // Sempre busca dados novos ao trocar de dia para garantir dados atualizados
  cachePainel = null;
  carregarPainel();
}

renderizarFiltroDias();


async function carregarRotasView() {
  const el = document.getElementById('lista-rotas-view');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    const r = await fetch(API + '/rotas-disponiveis?todos_dias=1');
    const d = await r.json();
    const rotas = d.rotas || [];
    if (!rotas.length) { el.innerHTML = '<div class="empty">Nenhuma rota cadastrada</div>'; return; }
    el.innerHTML = rotas.map(r => `
      <div class="list-item">
        <div class="list-item-row">
          <div class="list-item-name">${r.rota}</div>
          <span class="badge" style="${r.ativa ? 'background:#FEF3C7;color:#92400E' : 'background:#E1F5EE;color:#085041'}">${r.ativa ? '🔒 Em uso' : 'Livre'}</span>
        </div>
        ${r.motoboy_aberto ? `<div style="font-size:12px;color:#5A7A8F;margin-top:4px">🏍️ ${r.motoboy_aberto}</div>` : ''}
        <div class="list-item-actions">
          ${r.ativa ? `<button class="btn btn-warning" style="height:34px;font-size:12px" onclick="destravarRota('${r.rota.replace(/'/g,"\\'")}')">🔓 Destravar</button>` : ''}
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>'; }
}


async function destravarRota(rota) {
  if (!confirm('Destravar rota "' + rota + '"?')) return;
  await fetch(API + '/destravar-rota', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({rota}) });
  toast('Rota destravada');
  carregarRotasView();
}


async function carregarMotoboysGerenciar() {
  const el = document.getElementById('lista-mb-ger');
  if (!el) return;
  el.innerHTML = '<div class="empty"><span class="spinner"></span> Carregando...</div>';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const r = await fetch(API + '/motoboys?todos=1&agrupado=1', { signal: controller.signal });
    clearTimeout(timeoutId);
    const d = await r.json();
    if (!d.motoboys?.length) { el.innerHTML = '<div class="empty">Nenhum motorista cadastrado</div>'; return; }
    el.innerHTML = d.motoboys.map(m => {
      const tipo = m.tipo || 'motoboy';
      const tipoBadge = tipo === 'rastreador'
        ? '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE">📡 Rastreador</span>'
        : '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#F0FDF4;color:#16A34A;border:1px solid #86EFAC">🛵 Motoboy</span>';
      return `
      <div class="list-item">
        <div class="list-item-row">
          <div class="list-item-name">${m.nome}</div>
          ${tipoBadge}
        </div>
        <div style="font-size:12px;color:#5A7A8F;margin-top:3px">📱 ${m.telefone}</div>
        ${m.placa ? `<div style="font-size:12px;color:#5A7A8F;margin-top:3px">🏍️ Placa: <strong>${m.placa}</strong></div>` : ''}
        ${m.rotas && m.rotas.length ? `<div style="font-size:12px;color:#5A7A8F;margin-top:3px">🛣️ ${m.rotas.join(', ')}</div>` : '<div style="font-size:12px;color:#94A8B8;margin-top:3px">Sem rotas cadastradas</div>'}
        <div class="list-item-actions">
          <button class="btn" style="height:34px;font-size:12px;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE" onclick="editarTipoMotoboy('${m.telefone}','${m.nome}','${tipo}',${m.precisa_checklist !== false},${m.rastrear !== false})">✏️ Editar tipo</button>
          <button class="btn btn-danger" style="height:34px;font-size:12px" onclick="excluirMotoboy('${m.telefone}')">🗑 Excluir</button>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    const msg = e.name === 'AbortError' ? '⏱ Timeout' : '❌ ' + e.message;
    el.innerHTML = '<div class="empty" style="color:#A32D2D">' + msg + ' <button onclick="carregarMotoboysGerenciar()" style="margin-left:8px;padding:4px 10px;border-radius:6px;border:1px solid #A32D2D;background:#fff;color:#A32D2D;cursor:pointer;font-size:12px">🔄 Tentar novamente</button></div>';
  }
}

function editarTipoMotoboy(telefone, nome, tipoAtual, precisaChecklistAtual, rastrearAtual) {
  const anterior = document.getElementById('modal-editar-tipo');
  if (anterior) anterior.remove();

  const checklist = precisaChecklistAtual !== false;
  const rastrear = rastrearAtual !== false;

  const modal = document.createElement('div');
  modal.id = 'modal-editar-tipo';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:1.75rem;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.25)">
      <div style="font-size:16px;font-weight:700;color:#0F2940;margin-bottom:4px">Editar configuração</div>
      <div style="font-size:13px;color:#64748B;margin-bottom:1.25rem">${nome}</div>

      <div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Tipo</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1.25rem">
        <label style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;border:1.5px solid ${tipoAtual === 'motoboy' ? '#0F4C7A' : '#E2E8F0'};cursor:pointer;background:${tipoAtual === 'motoboy' ? '#EFF6FF' : '#fff'}">
          <input type="radio" name="tipo-edit" value="motoboy" ${tipoAtual === 'motoboy' ? 'checked' : ''} style="accent-color:#0F4C7A"/>
          <div><div style="font-size:14px;font-weight:700;color:#0F2940">🛵 Motoboy</div><div style="font-size:11px;color:#64748B">Trabalha com rota de coletas</div></div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;border:1.5px solid ${tipoAtual === 'rastreador' ? '#0F4C7A' : '#E2E8F0'};cursor:pointer;background:${tipoAtual === 'rastreador' ? '#EFF6FF' : '#fff'}">
          <input type="radio" name="tipo-edit" value="rastreador" ${tipoAtual === 'rastreador' ? 'checked' : ''} style="accent-color:#0F4C7A"/>
          <div><div style="font-size:14px;font-weight:700;color:#0F2940">📡 Rastreador</div><div style="font-size:11px;color:#64748B">Só GPS, sem rota de coletas</div></div>
        </label>
      </div>

      <div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Configurações</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1.25rem">
        <label style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1.5px solid #EBF1F5;cursor:pointer">
          <input type="checkbox" id="cb-rastrear" ${rastrear ? 'checked' : ''} style="width:18px;height:18px;accent-color:#0F4C7A;cursor:pointer"/>
          <div>
            <div style="font-size:14px;font-weight:700;color:#0F2940">📍 Rastrear GPS</div>
            <div style="font-size:11px;color:#64748B">CLT — desmarcar para MEI</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1.5px solid #EBF1F5;cursor:pointer">
          <input type="checkbox" id="cb-checklist" ${checklist ? 'checked' : ''} style="width:18px;height:18px;accent-color:#0F4C7A;cursor:pointer"/>
          <div>
            <div style="font-size:14px;font-weight:700;color:#0F2940">📋 Precisa de checklist</div>
            <div style="font-size:11px;color:#64748B">Obrigatório antes de iniciar a rota</div>
          </div>
        </label>
      </div>

      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('modal-editar-tipo').remove()" style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #E2E8F0;background:#fff;color:#64748B;font-weight:600;font-size:13px;cursor:pointer">Cancelar</button>
        <button onclick="salvarTipoMotoboy('${telefone}')" style="flex:1;padding:11px;border-radius:10px;border:none;background:#0F4C7A;color:#fff;font-weight:700;font-size:13px;cursor:pointer">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function salvarTipoMotoboy(telefone) {
  const tipo = document.querySelector('input[name="tipo-edit"]:checked')?.value;
  const precisa_checklist = document.getElementById('cb-checklist')?.checked !== false;
  const rastrear = document.getElementById('cb-rastrear')?.checked !== false;
  if (!tipo) return;
  try {
    await fetch(API + '/motoboys/tipo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, tipo, precisa_checklist, rastrear })
    });
    document.getElementById('modal-editar-tipo')?.remove();
    toast('✓ Configuração atualizada');
    carregarMotoboysGerenciar();
  } catch(e) { toast('Erro ao salvar'); }
}


async function adicionarMotoboy() {
  const nome = document.getElementById('mb-nome').value.trim().toUpperCase();
  const tel = document.getElementById('mb-tel').value.trim();
  const placa = (document.getElementById('mb-placa')?.value || '').trim().toUpperCase();
  const tipo = document.getElementById('mb-tipo')?.value || 'motoboy';
  if (!nome || !tel) { showMsg('msg-mb','Preencha nome e telefone','error'); return; }
  showMsg('msg-mb','Salvando...','loading');
  try {
    await fetch(API + '/motoboys', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nome, telefone:tel, rota:'', dia_semana:'', tipo, placa}) });

    // Criar checklist automático com todos os itens como Pendente
    if (!checklistsMotoboys[nome]) {
      checklistsMotoboys[nome] = {};
      LISTA_PADRAO_PAT.forEach(item => {
        checklistsMotoboys[nome][item.id] = { status: 'pendente' };
      });
      checklistsMotoboys[nome]['camisetas'] = [
        { tipo: 'cmc', tam: '', qtd: 1, status: 'pendente' }
      ];
      syncPatServer();
    }

    document.getElementById('mb-nome').value = '';
    document.getElementById('mb-tel').value = '';
    if (document.getElementById('mb-placa')) document.getElementById('mb-placa').value = '';
    showMsg('msg-mb','✅ Motorista adicionado! Checklist criado.','success');
    carregarMotoboysGerenciar();
  } catch(e) { showMsg('msg-mb','Erro: '+e.message,'error'); }
}


async function excluirMotoboy(telefone) {
  if (!confirm('Excluir este motorista e todas as suas rotas?')) return;
  await fetch(API + '/motoboys', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({telefone}) });
  toast('Motorista excluído');
  carregarMotoboysGerenciar();
}


function ccToggleContraPedido() {
  const marcado = document.getElementById('cc-contra-pedido').checked;
  const campoHorario = document.getElementById('cc-campo-horario');
  campoHorario.style.display = marcado ? 'none' : 'block';
}

async function criarCliente() {
  const codigo = document.getElementById('cc-codigo').value.trim();
  const nome = document.getElementById('cc-nome').value.trim();
  const contraPedido = document.getElementById('cc-contra-pedido').checked;
  const horario = contraPedido ? '' : document.getElementById('cc-horario').value;
  const coordTexto = document.getElementById('cc-coord').value.trim();
  const endereco = document.getElementById('cc-endereco').value.trim();

  if (!codigo || !nome) { showMsg('msg-cc','Preencha código e nome','error'); return; }
  if (!contraPedido && !horario) { showMsg('msg-cc','Informe o horário ou marque contra pedido','error'); return; }

  let lat = null, lng = null;
  if (coordTexto) {
    const coord = parseLatLng(coordTexto);
    if (!coord) { showMsg('msg-cc','Coordenadas inválidas. Use o formato: -23.5505,-46.6333','error'); return; }
    lat = coord.lat; lng = coord.lng;
  }

  showMsg('msg-cc','Salvando...','loading');
  try {
    await fetch(API + '/clientes-base', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        numero_cliente: codigo, nome,
        horario: horario || '00:00',
        contra_pedido: contraPedido ? 1 : 0,
        lat, lng,
        endereco: endereco || ''
      })
    });
    document.getElementById('cc-codigo').value = '';
    document.getElementById('cc-nome').value = '';
    document.getElementById('cc-horario').value = '';
    document.getElementById('cc-coord').value = '';
    document.getElementById('cc-endereco').value = '';
    document.getElementById('cc-contra-pedido').checked = false;
    document.getElementById('cc-campo-horario').style.display = 'block';
    showMsg('msg-cc','✅ Cliente criado na base!','success');
  } catch(e) { showMsg('msg-cc','Erro: '+e.message,'error'); }
}


let _mecEstadoAtual = null; // { tipo: 'alocado'|'base', dados: {...} }
let _mecMotoboySelecionado = null;
let _mecTodosMotoboys = [];

async function buscarCliente() {
  const q = document.getElementById('busca-input').value.trim();
  if (!q) return;
  const el = document.getElementById('busca-resultado');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    const r = await fetch(API + '/buscar-cliente-completo?q=' + encodeURIComponent(q));
    const d = await r.json();
    const alocados = d.alocados || [];
    const base = d.base || [];

    if (!alocados.length && !base.length) { el.innerHTML = '<div class="empty">Nenhum cliente encontrado</div>'; return; }

    let html = '';
    if (alocados.length) {
      html += `<div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">✅ Alocados em rotas (${alocados.length})</div>`;
      html += alocados.map(c => `
        <div class="list-item">
          <div class="list-item-row">
            <div class="list-item-name">${c.nome}</div>
            <div class="list-item-meta">Nº ${c.numero_cliente}</div>
          </div>
          <div style="font-size:12px;color:#5A7A8F;margin-top:4px">📍 ${c.rota||'Sem rota'} · ⏰ ${c.horario} ${c.nome_motoboy ? '· 🏍️ ' + c.nome_motoboy : ''}</div>
          <div class="list-item-actions">
            <button class="btn btn-secondary" style="height:34px;font-size:12px" onclick='abrirEditarAlocado(${JSON.stringify(c).replace(/'/g,"&apos;")})'>✏️ Editar</button>
            <button class="btn btn-secondary" style="height:34px;font-size:12px" onclick="abrirMover(${c.id})">↔ Mover rota</button>
          </div>
        </div>`).join('');
    }
    if (base.length) {
      html += `<div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">📦 Na base, sem rota (${base.length})</div>`;
      html += base.map(c => `
        <div class="list-item">
          <div class="list-item-row">
            <div class="list-item-name">${c.nome}</div>
            <div class="list-item-meta">Nº ${c.numero_cliente}</div>
          </div>
          <div style="font-size:12px;color:#94A8B8;margin-top:4px">⏰ ${c.horario || '—'} ${c.contra_pedido ? '· 📋 Contra pedido' : ''} ${c.endereco ? '· 📍 ' + c.endereco.substring(0,30) : ''}</div>
          <div class="list-item-actions">
            <button class="btn btn-primary" style="height:34px;font-size:12px" onclick='abrirEditarBase(${JSON.stringify(c).replace(/'/g,"&apos;")})'>✏️ Editar / Alocar</button>
          </div>
        </div>`).join('');
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>'; }
}

// ── MODAL EDITAR CLIENTE — comum ─────────────────────────────
function mecToggleContraPedido() {
  const marcado = document.getElementById('mec-contra-pedido').checked;
  document.getElementById('mec-campo-horario').style.display = marcado ? 'none' : 'block';
}

function mecToggleDia(dia, btn) {
  const ativo = btn.dataset.ativo === '1';
  if (ativo) { btn.style.background = '#fff'; btn.style.color = '#5A7A8F'; btn.style.borderColor = '#D6E5EE'; btn.dataset.ativo = '0'; }
  else { btn.style.background = '#0F4C7A'; btn.style.color = '#fff'; btn.style.borderColor = '#0F4C7A'; btn.dataset.ativo = '1'; }
}

function mecSelecionarTodosDias() {
  document.querySelectorAll('.mec-dia-btn').forEach(btn => {
    btn.style.background = '#0F4C7A'; btn.style.color = '#fff'; btn.style.borderColor = '#0F4C7A'; btn.dataset.ativo = '1';
  });
}

function mecMarcarDias(diasStr) {
  const dias = (diasStr || '').split(',').map(d => d.trim());
  document.querySelectorAll('.mec-dia-btn').forEach(btn => {
    const ativo = dias.includes(btn.dataset.dia);
    if (ativo) { btn.style.background = '#0F4C7A'; btn.style.color = '#fff'; btn.style.borderColor = '#0F4C7A'; btn.dataset.ativo = '1'; }
    else { btn.style.background = '#fff'; btn.style.color = '#5A7A8F'; btn.style.borderColor = '#D6E5EE'; btn.dataset.ativo = '0'; }
  });
}

function fecharModalEditarCliente() {
  document.getElementById('modal-editar-cliente').style.display = 'none';
  _mecEstadoAtual = null;
  _mecMotoboySelecionado = null;
}

function abrirEditarAlocado(c) {
  _mecEstadoAtual = { tipo: 'alocado', dados: c };
  document.getElementById('mec-titulo').textContent = c.nome;
  document.getElementById('mec-sub').textContent = 'Nº ' + c.numero_cliente;
  document.getElementById('mec-status-badge').innerHTML = `<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#DCFCE7;color:#166534">✅ Alocado em ${c.rota}${c.nome_motoboy ? ' · ' + c.nome_motoboy : ''}</span>`;

  const contraPedido = c.horario === '00:00' && !c.dias_ativos; // heurística simples, ajustável
  document.getElementById('mec-contra-pedido').checked = false;
  document.getElementById('mec-campo-horario').style.display = 'block';
  document.getElementById('mec-horario').value = c.horario || '';
  document.getElementById('mec-bloco-dias').style.display = 'block';
  mecMarcarDias(c.dias_ativos);
  document.getElementById('mec-coord').value = (c.lat && c.lng) ? (c.lat + ',' + c.lng) : '';
  document.getElementById('mec-endereco').value = c.endereco || '';
  document.getElementById('mec-bloco-mostrar-endereco').style.display = 'flex';
  document.getElementById('mec-mostrar-endereco').checked = !!c.mostrar_endereco;
  document.getElementById('mec-bloco-alocar').style.display = 'none';

  document.getElementById('modal-editar-cliente').style.display = 'flex';
}

function abrirEditarBase(c) {
  _mecEstadoAtual = { tipo: 'base', dados: c };
  document.getElementById('mec-titulo').textContent = c.nome;
  document.getElementById('mec-sub').textContent = 'Nº ' + c.numero_cliente;
  document.getElementById('mec-status-badge').innerHTML = `<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#F1F5F9;color:#475569">📦 Na base, sem rota</span>`;

  document.getElementById('mec-contra-pedido').checked = !!c.contra_pedido;
  document.getElementById('mec-campo-horario').style.display = c.contra_pedido ? 'none' : 'block';
  document.getElementById('mec-horario').value = c.horario || '';
  document.getElementById('mec-bloco-dias').style.display = 'none'; // dias só fazem sentido se alocar
  document.getElementById('mec-coord').value = (c.lat && c.lng) ? (c.lat + ',' + c.lng) : '';
  document.getElementById('mec-endereco').value = c.endereco || '';
  document.getElementById('mec-bloco-mostrar-endereco').style.display = 'none';
  document.getElementById('mec-bloco-alocar').style.display = 'block';
  document.getElementById('mec-rota').value = '';
  document.getElementById('mec-busca-motoboy').value = '';
  document.getElementById('mec-motoboy-results').style.display = 'none';
  document.getElementById('mec-motoboy-sel').style.display = 'none';
  _mecMotoboySelecionado = null;

  document.getElementById('modal-editar-cliente').style.display = 'flex';
}

async function mecBuscarMotoboy() {
  const q = document.getElementById('mec-busca-motoboy').value.trim();
  const el = document.getElementById('mec-motoboy-results');
  if (q.length < 2) { el.style.display = 'none'; return; }
  if (!_mecTodosMotoboys.length) {
    try {
      const r = await fetch(API + '/motoboys?todos=1');
      const d = await r.json();
      _mecTodosMotoboys = d.motoboys || [];
    } catch(e) { return; }
  }
  const ql = q.toLowerCase();
  const vistos = new Set();
  const encontrados = _mecTodosMotoboys.filter(m => {
    const match = m.nome.toLowerCase().includes(ql) || m.telefone.includes(q.replace(/\D/g,''));
    if (!match || vistos.has(m.telefone)) return false;
    vistos.add(m.telefone);
    return true;
  }).slice(0, 8);
  if (!encontrados.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = encontrados.map(m => `
    <div onclick='mecSelecionarMotoboy(${JSON.stringify(m).replace(/'/g,"&apos;")})' style="padding:8px 10px;border-bottom:1px solid #F0F4F8;cursor:pointer;font-size:12px" onmouseover="this.style.background='#F8FBFD'" onmouseout="this.style.background=''">
      <strong>${m.nome}</strong><br/><span style="color:#94A8B8;font-size:11px">${m.telefone}</span>
    </div>`).join('');
}

function mecSelecionarMotoboy(m) {
  _mecMotoboySelecionado = m;
  document.getElementById('mec-busca-motoboy').value = '';
  document.getElementById('mec-motoboy-results').style.display = 'none';
  const sel = document.getElementById('mec-motoboy-sel');
  sel.style.display = 'block';
  sel.innerHTML = `🏍️ ${m.nome} · ${m.telefone} <button onclick="_mecMotoboySelecionado=null;document.getElementById('mec-motoboy-sel').style.display='none'" style="background:none;border:none;color:#EF4444;font-size:11px;cursor:pointer;margin-left:8px">✕</button>`;
}

async function mecSalvar() {
  if (!_mecEstadoAtual) return;
  const contraPedido = document.getElementById('mec-contra-pedido').checked;
  const horario = contraPedido ? '' : document.getElementById('mec-horario').value;
  const coordTexto = document.getElementById('mec-coord').value.trim();
  const endereco = document.getElementById('mec-endereco').value.trim();

  let lat = null, lng = null;
  if (coordTexto) {
    const coord = parseLatLng(coordTexto);
    if (!coord) { toast('Coordenadas inválidas. Use o formato: -23.5505,-46.6333'); return; }
    lat = coord.lat; lng = coord.lng;
  }

  if (_mecEstadoAtual.tipo === 'alocado') {
    const diasSelecionados = [...document.querySelectorAll('.mec-dia-btn')].filter(b => b.dataset.ativo === '1').map(b => b.dataset.dia);
    const mostrarEndereco = document.getElementById('mec-mostrar-endereco').checked;
    try {
      await fetch(API + '/editar-cliente-alocado', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          id: _mecEstadoAtual.dados.id,
          horario: horario || '00:00',
          dias_ativos: diasSelecionados.join(','),
          contra_pedido: contraPedido ? 1 : 0,
          lat, lng,
          endereco: endereco || '',
          mostrar_endereco: mostrarEndereco ? 1 : 0
        })
      });
      toast('✓ Cliente atualizado');
      fecharModalEditarCliente();
      buscarCliente();
    } catch(e) { toast('Erro ao salvar'); }
    return;
  }

  // tipo === 'base'
  const rota = document.getElementById('mec-rota').value.trim();
  if (rota && _mecMotoboySelecionado) {
    // Vai alocar em uma rota
    const diasPadrao = 'seg,ter,qua,qui,sex';
    try {
      await fetch(API + '/alocar-cliente', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          id_base: _mecEstadoAtual.dados.id,
          rota,
          telefone_motoboy: _mecMotoboySelecionado.telefone,
          nome_motoboy: _mecMotoboySelecionado.nome,
          dia_semana: 'seg-sex',
          dias_ativos: diasPadrao,
          horario: horario || '00:00',
          contra_pedido: contraPedido ? 1 : 0,
          lat, lng,
          endereco: endereco || ''
        })
      });
      toast('✓ Cliente alocado em ' + rota);
      fecharModalEditarCliente();
      buscarCliente();
    } catch(e) { toast('Erro ao alocar'); }
  } else if (rota && !_mecMotoboySelecionado) {
    toast('Selecione o motoboy para alocar');
  } else {
    // Só editar dados na base, sem alocar
    try {
      await fetch(API + '/editar-cliente-base', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          id: _mecEstadoAtual.dados.id,
          horario: horario || '00:00',
          contra_pedido: contraPedido ? 1 : 0,
          lat, lng,
          endereco: endereco || ''
        })
      });
      toast('✓ Cliente atualizado na base');
      fecharModalEditarCliente();
      buscarCliente();
    } catch(e) { toast('Erro ao salvar'); }
  }
}


function abrirMover(id) {
  clienteParaMover = id;
  const sel = document.getElementById('nova-rota-select');
  sel.innerHTML = '<option value="">Selecione a rota...</option>' + rotasDisponiveis.map(r => `<option value="${r}">${r}</option>`).join('');
  document.getElementById('modal-mover').style.display = 'flex';
}


async function confirmarMover() {
  const rota = document.getElementById('nova-rota-select').value;
  if (!rota || !clienteParaMover) return;
  await fetch(API + '/mover-cliente', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id:clienteParaMover, rota}) });
  document.getElementById('modal-mover').style.display = 'none';
  toast('✓ Movido para ' + rota);
  buscarCliente();
}


async function buscarParaAtivar() {
  const q = document.getElementById('ativar-input').value.trim();
  if (!q) return;
  const el = document.getElementById('ativar-resultado');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    const r = await fetch(API + '/clientes?todos=1&todos_dias=1');
    const d = await r.json();
    const ql = q.toLowerCase();
    const encontrados = (d.clientes||[]).filter(c => c.nome.toLowerCase().includes(ql) || String(c.numero_cliente).includes(q));
    if (!encontrados.length) { el.innerHTML = '<div class="empty">Nenhum cliente encontrado</div>'; return; }
    el.innerHTML = encontrados.slice(0,20).map(c => `
      <div class="list-item">
        <div class="list-item-row">
          <div class="list-item-name">${c.nome}</div>
          <div class="list-item-meta">Nº ${c.numero_cliente}</div>
          <span class="badge" style="${c.ativo ? 'background:#E1F5EE;color:#085041' : 'background:#FCEBEB;color:#791F1F'}">${c.ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
        <div style="font-size:12px;color:#5A7A8F;margin-top:4px">📍 ${c.rota||'Sem rota'} · ⏰ ${c.horario}</div>
        <div class="list-item-actions">
          ${c.ativo
            ? `<button class="btn btn-danger" style="height:34px;font-size:12px" onclick="toggleAtivar(${c.id},0)">⛔ Desativar</button>`
            : `<button class="btn btn-primary" style="height:34px;font-size:12px" onclick="toggleAtivar(${c.id},1)">✅ Ativar</button>`}
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>'; }
}


async function toggleAtivar(id, ativo) {
  if (ativo) {
    await fetch(API + '/reativar-cliente', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id}) });
  } else {
    await fetch(API + '/clientes', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id}) });
  }
  toast(ativo ? '✅ Cliente ativado' : '⛔ Cliente desativado');
  buscarParaAtivar();
}


async function resetConfirmacoes() {
  if (!confirm('Limpar todas as confirmações de hoje?')) return;
  await fetch(API + '/reset-confirmacoes', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
  showMsg('msg-reset-conf','✅ Confirmações limpas!','success');
}


async function fazerReset() {
  if (!confirm('Tem certeza? Reseta TODOS os clientes.')) return;
  showMsg('msg-reset','Resetando...','loading');
  try {
    const r = await fetch(API + '/reset', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
    const d = await r.json();
    showMsg('msg-reset','✅ Reset feito! '+d.total+' clientes resetados.','success');
  } catch(e) { showMsg('msg-reset','Erro: '+e.message,'error'); }
}




function abrirDisparador(id) {
  editandoAgendamento = id || null;
  diasSelecionados = new Set();
  destSelecionado = 'todos';

  // Resetar form
  document.getElementById('disp-nome').value = '';
  document.getElementById('disp-mensagem').value = '';
  document.getElementById('disp-horarios').innerHTML = '';
  addHorario();

  // Resetar dias
  document.querySelectorAll('.disp-dia-btn').forEach(b => {
    b.style.borderColor = '#D6E5EE';
    b.style.background = '#fff';
    b.style.color = '#5A7A8F';
  });

  // Resetar dest
  document.querySelectorAll('.disp-dest-btn').forEach(b => {
    b.style.borderColor = '#D6E5EE';
    b.style.background = '#fff';
    b.style.color = '#5A7A8F';
  });
  const btnTodos = document.querySelector('.disp-dest-btn');
  if (btnTodos) { btnTodos.style.borderColor = '#1E9FD9'; btnTodos.style.background = '#E8F4FB'; btnTodos.style.color = '#0F4C7A'; }

  // Se editando, preencher
  if (id !== null && id !== undefined) {
    const ag = agendamentos.find(a => a.id === id);
    if (ag) {
      document.getElementById('disp-nome').value = ag.nome;
      document.getElementById('disp-mensagem').value = ag.mensagem;
      document.getElementById('disp-horarios').innerHTML = '';
      ag.horarios.forEach(h => addHorario(h));
      diasSelecionados = new Set(ag.dias);
      destSelecionado = ag.destinatarios;
      document.querySelectorAll('.disp-dia-btn').forEach(b => {
        if (diasSelecionados.has(b.dataset.dia || b.textContent.toLowerCase().replace('á','a'))) {
          b.style.borderColor = '#1E9FD9'; b.style.background = '#E8F4FB'; b.style.color = '#0F4C7A';
        }
      });
      document.getElementById('disparador-titulo').textContent = '✎ Editar agendamento';
    }
  } else {
    document.getElementById('disparador-titulo').textContent = '📲 Novo agendamento';
  }

  document.getElementById('modal-disparador').style.display = 'block';
}


function fecharDisparador() {
  document.getElementById('modal-disparador').style.display = 'none';
}


function toggleDia(btn, dia) {
  if (diasSelecionados.has(dia)) {
    diasSelecionados.delete(dia);
    btn.style.borderColor = '#D6E5EE'; btn.style.background = '#fff'; btn.style.color = '#5A7A8F';
  } else {
    diasSelecionados.add(dia);
    btn.style.borderColor = '#1E9FD9'; btn.style.background = '#E8F4FB'; btn.style.color = '#0F4C7A';
  }
}


function toggleDest(btn, dest) {
  destSelecionado = dest;
  document.querySelectorAll('.disp-dest-btn').forEach(b => {
    b.style.borderColor = '#D6E5EE'; b.style.background = '#fff'; b.style.color = '#5A7A8F';
  });
  btn.style.borderColor = '#1E9FD9'; btn.style.background = '#E8F4FB'; btn.style.color = '#0F4C7A';
}


function addHorario(valor) {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:8px';
  div.innerHTML = '<input type="time" value="' + (valor || '07:00') + '" style="flex:1;height:40px;border-radius:8px;border:1.5px solid #D6E5EE;padding:0 12px;font-size:14px;outline:none;color:#0F4C7A"/>'
    + '<button onclick="this.parentElement.remove()" style="width:34px;height:34px;border-radius:8px;border:1.5px solid #F09595;background:#FCEBEB;color:#DC2626;font-size:16px;cursor:pointer;flex-shrink:0">✕</button>';
  document.getElementById('disp-horarios').appendChild(div);
}


function salvarAgendamento() {
  const nome = document.getElementById('disp-nome').value.trim();
  const mensagem = document.getElementById('disp-mensagem').value.trim();
  const horarios = Array.from(document.querySelectorAll('#disp-horarios input[type=time]')).map(i => i.value);

  if (!nome) { toast('⚠️ Digite um nome para o agendamento'); return; }
  if (!mensagem) { toast('⚠️ Digite uma mensagem'); return; }
  if (!diasSelecionados.size) { toast('⚠️ Selecione pelo menos um dia'); return; }
  if (!horarios.length) { toast('⚠️ Adicione pelo menos um horário'); return; }

  if (editandoAgendamento !== null) {
    const idx = agendamentos.findIndex(a => a.id === editandoAgendamento);
    if (idx > -1) agendamentos[idx] = { ...agendamentos[idx], nome, mensagem, dias: Array.from(diasSelecionados), horarios, destinatarios: destSelecionado };
  } else {
    agendamentos.push({ id: Date.now(), nome, mensagem, dias: Array.from(diasSelecionados), horarios, destinatarios: destSelecionado, ativo: true });
  }

  localStorage.setItem('disp_agendamentos', JSON.stringify(agendamentos));
  fecharDisparador();
  renderAgendamentos();
  toast('✓ Agendamento salvo!');
}


function dispararAgora() {
  toast('📲 Disparando mensagem... (integração Evolution API pendente)');
  fecharDisparador();
}


function toggleAgendamento(id) {
  const ag = agendamentos.find(a => a.id === id);
  if (ag) { ag.ativo = !ag.ativo; localStorage.setItem('disp_agendamentos', JSON.stringify(agendamentos)); renderAgendamentos(); }
}


function excluirAgendamento(id) {
  if (!confirm('Excluir este agendamento?')) return;
  agendamentos = agendamentos.filter(a => a.id !== id);
  localStorage.setItem('disp_agendamentos', JSON.stringify(agendamentos));
  renderAgendamentos();
  toast('✓ Agendamento excluído');
}

const diasLabels = { seg:'Seg', ter:'Ter', qua:'Qua', qui:'Qui', sex:'Sex', sab:'Sáb', dom:'Dom' };
const destLabels = { todos:'Todos', 'seg-sex':'Seg-Sex', sabado:'Sábado', domingo:'Domingo' };


function renderAgendamentos() {
  const el = document.getElementById('lista-agendamentos');
  if (!el) return; // elemento não existe nesta página
  if (!agendamentos.length) {
    el.innerHTML = '<div class="empty" style="font-size:12px">Nenhum agendamento criado.<br/>Clique em "+ Novo" para criar.</div>';
    return;
  }
  el.innerHTML = agendamentos.map(ag => {
    const diasStr = ag.dias.map(d => diasLabels[d] || d).join(', ');
    const horariosStr = ag.horarios.join(' · ');
    return '<div style="padding:10px 0;border-bottom:1px solid #F0F4F8">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'
      + '<span style="font-size:13px;font-weight:700;color:#0F4C7A">' + ag.nome + '</span>'
      + '<div style="display:flex;gap:5px;align-items:center">'
      + '<button onclick="toggleAgendamento(' + ag.id + ')" style="padding:3px 8px;border-radius:20px;border:none;background:' + (ag.ativo ? '#E8F8F0' : '#F5F5F5') + ';color:' + (ag.ativo ? '#0F9B78' : '#94A8B8') + ';font-size:10px;font-weight:700;cursor:pointer">' + (ag.ativo ? '● Ativo' : '○ Pausado') + '</button>'
      + '<button onclick="abrirDisparador(' + ag.id + ')" style="padding:3px 8px;border-radius:6px;border:1px solid #1E9FD9;background:#E8F4FB;color:#1E9FD9;font-size:10px;font-weight:700;cursor:pointer">✎</button>'
      + '<button onclick="excluirAgendamento(' + ag.id + ')" style="padding:3px 8px;border-radius:6px;border:1px solid #F09595;background:#FCEBEB;color:#DC2626;font-size:10px;font-weight:700;cursor:pointer">🗑</button>'
      + '</div></div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px">'
      + '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#EEF6FF;color:#1E9FD9;font-weight:600">' + diasStr + '</span>'
      + '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#F0FDF4;color:#0F9B78;font-weight:600">⏰ ' + horariosStr + '</span>'
      + '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#FEF9EC;color:#92400E;font-weight:600">👥 ' + (destLabels[ag.destinatarios] || ag.destinatarios) + '</span>'
      + '</div></div>';
  }).join('');
}

renderAgendamentos();
// ===== FIM DISPARADOR =====


function carregarHistoricoDisparos() {
  const el = document.getElementById('lista-hist-disparos');
  if (!el) return;
  const historico = JSON.parse(localStorage.getItem('loglife_hist') || '[]');
  if (!historico.length) {
    el.innerHTML = '<div class="empty" style="font-size:12px">Nenhum disparo realizado ainda</div>';
    return;
  }
  const grupoLabels = { clt:'👔 CLT', agr:'🤝 Agre.', todos:'👥 Todos' };
  el.innerHTML = historico.slice(0, 8).map(h => {
    const ok = h.status === 'enviado';
    return '<div style="display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid #F0F4F8">'
      + '<div style="width:20px;height:20px;border-radius:50%;background:' + (ok?'#E8F8F0':'#FCEBEB') + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:' + (ok?'#0F9B78':'#DC2626') + ';flex-shrink:0">' + (ok?'✓':'✗') + '</div>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:12px;font-weight:600;color:#0F4C7A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + h.mensagem.substring(0,40) + (h.mensagem.length>40?'...':'') + '</div>'
      + '<div style="font-size:10px;color:#5A7A8F">' + (grupoLabels[h.grupoNome]||h.grupoNome||'') + ' · ' + h.qtd + ' motoboys · ' + h.data + '</div>'
      + '</div>'
      + '<span style="font-size:10px;padding:2px 6px;border-radius:10px;font-weight:700;flex-shrink:0;background:' + (ok?'#E8F8F0':'#FCEBEB') + ';color:' + (ok?'#0F9B78':'#DC2626') + '">' + h.qtd + (ok?'✓':'✗') + '</span>'
      + '</div>';
  }).join('');
}


// ──────────────────────────────────────────────────────────────────
// CHECKLISTS — versão com aprovados/reprovados/pendentes/faltantes
// Usa /checklist/resumo-hoje que retorna TUDO em 1 request:
//   { data, dia_semana, rotas_ativas_hoje, enviados[], faltantes[], totais }
// ──────────────────────────────────────────────────────────────────

function badgeChecklist(status) {
  // status ∈ 'pendente' | 'aprovado' | 'reprovado' | null (sem aprovação ainda)
  if (!status) return `<span style="background:#FEF9EC;color:#92400E;padding:3px 8px;border-radius:7px;font-size:10px;font-weight:700;letter-spacing:.3px">⏳ PENDENTE</span>`;
  if (status === 'aprovado') return `<span style="background:#E1F5EE;color:#085041;padding:3px 8px;border-radius:7px;font-size:10px;font-weight:700;letter-spacing:.3px">✅ APROVADO</span>`;
  if (status === 'reprovado') return `<span style="background:#FCEBEB;color:#791F1F;padding:3px 8px;border-radius:7px;font-size:10px;font-weight:700;letter-spacing:.3px">❌ REPROVADO</span>`;
  return '';
}

async function carregarChecklists() {
  const el = document.getElementById('lista-checklists');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  document.getElementById('card-lista-checklists').style.display = 'block';
  document.getElementById('card-detalhe-checklist').style.display = 'none';
  try {
    const r = await fetch(API + '/checklist/resumo-hoje');
    const d = await r.json();

    const tot = d.totais || {};
    const faltantes = d.faltantes || [];
    const enviados = d.enviados || [];
    const rotasAtivas = d.rotas_ativas_hoje || [];

    // Cabeçalho com totais rápidos
    const header = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem;font-size:12px">
        <div style="flex:1;min-width:80px;padding:8px 10px;border-radius:9px;background:#E1F5EE;color:#085041;text-align:center"><div style="font-size:18px;font-weight:800">${tot.enviados||0}</div><div style="font-size:10px;font-weight:700;letter-spacing:.3px">ENVIADOS</div></div>
        <div style="flex:1;min-width:80px;padding:8px 10px;border-radius:9px;background:#FCEBEB;color:#791F1F;text-align:center"><div style="font-size:18px;font-weight:800">${tot.faltantes||0}</div><div style="font-size:10px;font-weight:700;letter-spacing:.3px">FALTANTES</div></div>
        <div style="flex:1;min-width:80px;padding:8px 10px;border-radius:9px;background:#FEF9EC;color:#92400E;text-align:center"><div style="font-size:18px;font-weight:800">${tot.pendentes_aprovacao||0}</div><div style="font-size:10px;font-weight:700;letter-spacing:.3px">PENDENTES</div></div>
        <div style="flex:1;min-width:80px;padding:8px 10px;border-radius:9px;background:#E8F4FB;color:#0F4C7A;text-align:center"><div style="font-size:18px;font-weight:800">${tot.reprovados||0}</div><div style="font-size:10px;font-weight:700;letter-spacing:.3px">REPROVADOS</div></div>
      </div>
    `;

    const semNada = !enviados.length && !faltantes.length;
    if (semNada) { el.innerHTML = header + '<div class="empty">Nenhuma rota ativa hoje</div>'; return; }

    let html = header;

    // ── SEÇÃO 1: FALTANTES (motoboys com rota ativa que NÃO enviaram) ──
    if (faltantes.length) {
      html += `<div style="font-size:11px;font-weight:800;color:#791F1F;text-transform:uppercase;letter-spacing:.4px;margin:8px 0 6px">⚠ Não enviaram checklist (${faltantes.length})</div>`;
      html += faltantes.map(f => `
        <div class="list-item" style="border-left:3px solid #DC2626">
          <div class="list-item-row">
            <div class="list-item-name">${escapeHtml(f.motoboy)}</div>
            <div style="font-size:10px;font-weight:700;color:#791F1F;background:#FCEBEB;padding:3px 8px;border-radius:7px">FALTANDO</div>
          </div>
          <div style="font-size:12px;color:#5A7A8F;margin-top:4px">🛣️ ${escapeHtml(f.rota)} · 📱 ${f.telefone || '—'}</div>
        </div>
      `).join('');
    }

    // ── SEÇÃO 2: ENVIADOS (com status) ──
    if (enviados.length) {
      html += `<div style="font-size:11px;font-weight:800;color:#0F4C7A;text-transform:uppercase;letter-spacing:.4px;margin:14px 0 6px">📋 Checklists enviados (${enviados.length})</div>`;
      // Agrupa por status (pendente primeiro, depois aprovado, depois reprovado)
      const ordem = ['pendente', 'aprovado', 'reprovado'];
      const grupos = { pendente: [], aprovado: [], reprovado: [] };
      enviados.forEach(e => { (grupos[e.status] || grupos.pendente).push(e); });

      ordem.forEach(st => {
        const lista = grupos[st];
        if (!lista.length) return;
        lista.forEach(c => {
          html += `
            <div class="list-item" style="cursor:pointer;border-left:3px solid ${st==='aprovado'?'#0F9B78':st==='reprovado'?'#DC2626':'#F59E0B'}" onclick="abrirDetalheChecklist(${c.id})">
              <div class="list-item-row">
                <div class="list-item-name">${escapeHtml(c.biocondutor)}</div>
                ${badgeChecklist(st)}
              </div>
              <div style="font-size:12px;color:#5A7A8F;margin-top:4px">🛣️ ${escapeHtml(c.rota || '—')} · 🚗 ${escapeHtml(c.placa || '—')} · 🕒 ${(c.data_checklist || '').split(' ').pop() || ''}</div>
              ${st==='reprovado' && c.motivo ? `<div style="font-size:11px;color:#791F1F;margin-top:4px;background:#FCEBEB;padding:4px 8px;border-radius:6px">💬 ${escapeHtml(c.motivo)}</div>` : ''}
            </div>`;
        });
      });
    }

    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro: ' + e.message + '</div>'; }
}


async function abrirDetalheChecklist(checklistId) {
  const el = document.getElementById('detalhe-checklist-conteudo');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  document.getElementById('card-lista-checklists').style.display = 'none';
  document.getElementById('card-detalhe-checklist').style.display = 'block';
  document.getElementById('detalhe-checklist-titulo').textContent = 'Carregando...';
  try {
    const r = await fetch(API + '/checklist/detalhe?id=' + checklistId);
    const d = await r.json();
    if (d.status === 'erro') { el.innerHTML = '<div class="empty" style="color:#A32D2D">' + (d.msg || 'Erro') + '</div>'; return; }
    const c = d.checklist || {};
    const apr = d.aprovacao || null;
    const tel = d.telefone || '';

    document.getElementById('detalhe-checklist-titulo').textContent = c.biocondutor || '—';

    const campos = [
      { label: 'Placa', valor: c.placa },
      { label: 'Conservação da Moto', valor: c.conservacao_moto },
      { label: 'Pneu Dianteiro', valor: c.pneu_dianteiro },
      { label: 'Pneu Traseiro', valor: c.pneu_traseiro },
      { label: 'Bolsa Térmica — Limpeza', valor: c.bolsa_limpeza },
      { label: 'Bolsa Térmica — Estado Geral', valor: c.bolsa_estado },
      { label: 'Bolsa Térmica — Identificação', valor: c.bolsa_identificacao },
      { label: 'Colete Refletivo', valor: c.colete },
      { label: 'Documento do Veículo', valor: c.documento },
      { label: 'Mata Cachorro', valor: c.mata_cachorro },
      { label: 'Caixa Refrigerada', valor: c.caixa_refrigerada },
      { label: 'Quantidade de Gelox', valor: c.qtd_gelox },
      { label: 'Quantidade de Gelo Seco', valor: c.qtd_gelo_seco },
      { label: 'Caixa Ambiente', valor: c.caixa_ambiente },
      { label: 'Caixa Térmica tem Identificação?', valor: c.caixa_identificacao },
      { label: 'Há amostras pendentes do dia anterior no cooler?', valor: c.amostras_pendentes },
      { label: 'Baú com cadeado?', valor: c.bau_cadeado },
    ];

    const cor = v => {
      if (!v) return '#94A8B8';
      if (['Conforme','Sim','Limpa','Dentro do padrão'].includes(v)) return '#085041';
      if (['Não Conforme','Não','Suja','Fora do padrão'].includes(v)) return '#791F1F';
      return '#0F4C7A';
    };
    const bg = v => {
      if (!v) return '#F7FBFD';
      if (['Conforme','Sim','Limpa','Dentro do padrão'].includes(v)) return '#E1F5EE';
      if (['Não Conforme','Não','Suja','Fora do padrão'].includes(v)) return '#FCEBEB';
      return '#E8F4FB';
    };

    // Bloco de status/aprovação
    let statusHTML = '';
    if (apr && apr.status === 'aprovado') {
      statusHTML = `<div style="background:#E1F5EE;border:1.5px solid #5DCAA5;border-radius:10px;padding:12px;margin-bottom:1rem;display:flex;align-items:center;gap:10px">
        <div style="font-size:24px">✅</div>
        <div style="flex:1"><div style="font-weight:800;color:#085041">Checklist aprovado</div><div style="font-size:11px;color:#085041;opacity:.8">por ${escapeHtml(apr.aprovado_por || 'admin')} · ${formatarTimestamp(apr.timestamp)}</div></div>
      </div>`;
    } else if (apr && apr.status === 'reprovado') {
      statusHTML = `<div style="background:#FCEBEB;border:1.5px solid #F09595;border-radius:10px;padding:12px;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="font-size:24px">❌</div><div style="font-weight:800;color:#791F1F">Checklist reprovado</div></div>
        <div style="font-size:13px;color:#791F1F;background:#fff;padding:8px 10px;border-radius:7px;border:1px solid #F09595"><b>Motivo:</b> ${escapeHtml(apr.motivo || '—')}</div>
        <div style="font-size:11px;color:#791F1F;margin-top:6px;opacity:.8">por ${escapeHtml(apr.aprovado_por || 'admin')} · ${formatarTimestamp(apr.timestamp)}</div>
      </div>`;
    } else {
      statusHTML = `<div style="background:#FEF9EC;border:1.5px solid #F5C57B;border-radius:10px;padding:12px;margin-bottom:1rem;display:flex;align-items:center;gap:10px">
        <div style="font-size:24px">⏳</div>
        <div><div style="font-weight:800;color:#92400E">Aguardando aprovação</div><div style="font-size:11px;color:#92400E;opacity:.8">Use os botões abaixo</div></div>
      </div>`;
    }

    // Botões de ação — sempre mostram (permite reavaliar)
    const acoesHTML = `
      <div style="display:flex;gap:8px;margin-top:1rem;margin-bottom:6px">
        <button onclick="aprovarChecklist(${c.id})" style="flex:1;background:#0F9B78;color:#fff;border:none;padding:12px;border-radius:9px;font-size:14px;font-weight:800;cursor:pointer">✅ Aprovar</button>
        <button onclick="abrirModalReprovar(${c.id},'${escapeAttr(c.biocondutor)}')" style="flex:1;background:#DC2626;color:#fff;border:none;padding:12px;border-radius:9px;font-size:14px;font-weight:800;cursor:pointer">❌ Reprovar</button>
      </div>
      <div id="acao-feedback" style="font-size:12px;text-align:center;color:#5A7A8F;min-height:18px"></div>
    `;

    el.innerHTML = `
      <div style="font-size:12px;color:#5A7A8F;margin-bottom:1rem">🛣️ ${escapeHtml(c.rota || '—')} · 📅 ${escapeHtml(c.data_checklist || '—')} · 📱 ${escapeHtml(tel || '—')}</div>
      ${statusHTML}
      ${campos.map(f => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #EBF1F5">
          <div style="font-size:13px;color:#5A7A8F;font-weight:500">${f.label}</div>
          <div style="font-size:13px;font-weight:700;padding:4px 10px;border-radius:7px;background:${bg(String(f.valor))};color:${cor(String(f.valor))}">${f.valor !== null && f.valor !== undefined && f.valor !== '' ? escapeHtml(f.valor) : '—'}</div>
        </div>`).join('')}
      ${acoesHTML}
    `;
  } catch(e) {
    el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro: ' + e.message + '</div>';
  }
}


async function aprovarChecklist(checklistId) {
  const fb = document.getElementById('acao-feedback');
  if (fb) { fb.textContent = 'Aprovando...'; fb.style.color = '#5A7A8F'; }
  try {
    const r = await fetch(API + '/checklist/aprovar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist_id: checklistId, status: 'aprovado', aprovado_por: getAdminNome() })
    });
    const d = await r.json();
    if (d.status !== 'ok') throw new Error(d.msg || 'Erro');
    if (fb) { fb.textContent = '✅ Aprovado!'; fb.style.color = '#085041'; }
    setTimeout(() => abrirDetalheChecklist(checklistId), 600);
    // Recarrega a lista em background para atualizar contadores
    setTimeout(() => carregarChecklists(), 1500);
  } catch(e) {
    if (fb) { fb.textContent = '❌ ' + e.message; fb.style.color = '#791F1F'; }
  }
}


function abrirModalReprovar(checklistId, motoboy) {
  const motoboyEsc = (motoboy || '').replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
  // Reusa o overlay/modal padrão se existir, senão cria inline
  let overlay = document.getElementById('modal-reprovar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-reprovar-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(15,75,122,0.55);z-index:300;align-items:flex-end;justify-content:center';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:1.5rem;width:100%;max-width:480px">
        <div style="font-size:11px;color:#94A8B8;margin-bottom:4px;font-weight:700;text-transform:uppercase">Reprovar checklist</div>
        <div style="font-size:16px;font-weight:700;color:#0F4C7A;margin-bottom:1rem" id="reprovar-nome">—</div>
        <div style="font-size:11px;font-weight:700;color:#5A7A8F;margin-bottom:4px;text-transform:uppercase">Motivo (mínimo 5 caracteres)</div>
        <textarea id="reprovar-motivo" placeholder="Ex: Pneu traseiro furado, não pode sair com a moto." style="width:100%;min-height:110px;border-radius:10px;border:1.5px solid #D6E5EE;font-size:14px;padding:10px 12px;color:#0F4C7A;background:#fff;outline:none;resize:vertical;font-family:inherit;margin-bottom:1rem"></textarea>
        <div class="msg" id="msg-reprovar" style="margin-bottom:8px"></div>
        <div style="display:flex;gap:8px">
          <button onclick="fecharModalReprovar()" style="flex:1;padding:12px;border-radius:10px;background:#fff;color:#5A7A8F;border:1.5px solid #D6E5EE;font-size:14px;font-weight:600;cursor:pointer">Cancelar</button>
          <button id="btn-confirmar-reprovar" style="flex:1;padding:12px;border-radius:10px;background:linear-gradient(135deg,#DC2626,#791F1F);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer">❌ Reprovar e notificar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  document.getElementById('reprovar-nome').textContent = motoboyEsc;
  const txt = document.getElementById('reprovar-motivo');
  txt.value = '';
  txt.focus();
  showMsgRep('msg-reprovar', '', '');
  const btn = document.getElementById('btn-confirmar-reprovar');
  btn.onclick = () => confirmarReprovar(checklistId);
}

function fecharModalReprovar() {
  const overlay = document.getElementById('modal-reprovar-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showMsgRep(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!text) { el.className = 'msg'; el.textContent = ''; return; }
  el.textContent = text;
  el.className = 'msg show ' + type;
}

async function confirmarReprovar(checklistId) {
  const motivo = (document.getElementById('reprovar-motivo').value || '').trim();
  if (motivo.length < 5) { showMsgRep('msg-reprovar', 'Motivo precisa de pelo menos 5 caracteres', 'error'); return; }
  const btn = document.getElementById('btn-confirmar-reprovar');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    const r = await fetch(API + '/checklist/aprovar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist_id: checklistId, status: 'reprovado', motivo, aprovado_por: getAdminNome() })
    });
    const d = await r.json();
    if (d.status !== 'ok') throw new Error(d.msg || 'Erro');
    const msg = d.notificacao_enviada ? '✅ Reprovado e notificação enviada!' : '✅ Reprovado (mas a notificação falhou — verifique o app)';
    showMsgRep('msg-reprovar', msg, 'success');
    setTimeout(() => { fecharModalReprovar(); abrirDetalheChecklist(checklistId); }, 1200);
    setTimeout(() => carregarChecklists(), 2200);
  } catch(e) {
    showMsgRep('msg-reprovar', '❌ ' + e.message, 'error');
    btn.disabled = false; btn.textContent = '❌ Reprovar e notificar';
  }
}


// Helpers usados pelas funções acima (reaproveitam padrões do projeto)
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
function formatarTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}
function getAdminNome() {
  // Tenta pegar nome do admin do localStorage ou retorna genérico
  try { return localStorage.getItem('admin_nome') || localStorage.getItem('painel_admin_nome') || 'admin'; } catch(e) { return 'admin'; }
}


function voltarListaChecklists() {
  document.getElementById('card-lista-checklists').style.display = 'block';
  document.getElementById('card-detalhe-checklist').style.display = 'none';
}

carregarPainel();
iniciarAutoRefresh();

// =============================================
// UNIFORMES E PATRIMÔNIOS
// =============================================

const TIPOS_UNIF = [
  { id: 'cmc',    icon: '👕', nome: 'Camiseta Manga Curta' },
  { id: 'cml',    icon: '👕', nome: 'Camiseta Manga Longa' },
  { id: 'colete', icon: '🦺', nome: 'Colete' },
  { id: 'jaqueta',icon: '🧥', nome: 'Jaqueta' },
];
const TAMANHOS = ['P','M','G','GG'];
const TIPOS_PAT = {
  bau:       { icon: '🛵', nome: 'Baú',               codigo: true  },
  cooler_g:  { icon: '❄️', nome: 'Cooler G',           codigo: true  },
  cooler_p:  { icon: '❄️', nome: 'Cooler P',           codigo: true  },
  cartao:    { icon: '⛽', nome: 'Cartão Combustível', codigo: true  },
  rastreador:{ icon: '📡', nome: 'Rastreador',         codigo: true  },
  cadeado:   { icon: '🔒', nome: 'Cadeado',            codigo: false },
  craca:     { icon: '🪪', nome: 'Crachá',             codigo: false },
  colete:    { icon: '🦺', nome: 'Colete',             codigo: false },
};

let filtroUnifAtual = 'todos';
let tamSelecionado = '';

// ─── UNIFORMES ───────────────────────────────────────


async function carregarChecklistsIncompletos() {
  const el = document.getElementById('lista-checklists-incompletos');
  if (!el) return;
  
  const incompletos = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('checklist_incompleto_')) {
      const biocondutor = key.replace('checklist_incompleto_', '');
      const estado = JSON.parse(localStorage.getItem(key));
      incompletos.push({ biocondutor, estado });
    }
  }
  
  if (!incompletos.length) {
    el.innerHTML = '<div class="empty">Nenhum checklist incompleto</div>';
    return;
  }
  
  el.innerHTML = incompletos.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#FEF9EC;border-radius:10px;border:1px solid #F2CC70;margin-bottom:6px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:#92400E">${c.biocondutor}</div>
        <div style="font-size:11px;color:#C79100">⏳ Aguardando conclusão</div>
      </div>
      <button onclick="voltarChecklist('${c.biocondutor.replace(/'/g,"\\'")}')" style="background:#F2CC70;color:#92400E;border:none;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">↩ Voltar</button>
    </div>`).join('');
}


function voltarChecklist(biocondutor) {
  if (!confirm('Voltar checklist incompleto de ' + biocondutor + '?')) return;
  localStorage.removeItem('checklist_incompleto_' + biocondutor);
  toast('↩ Checklist voltado para pendente!');
  carregarChecklistsIncompletos();
}

// ── IMPORTAÇÃO DE CLIENTES COM COORDENADAS ───────────────────
let _impCoordDados = [];

function processarPlanilhaCoordenadas(file) {
  if (!file) return;
  showMsg('msg-imp-coord', '<span class="spinner"></span> Lendo planilha...', 'loading');

  const lerArquivo = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Detecta se a primeira linha é cabeçalho (texto) ou já é dado
        let startRow = 0;
        const primeira = rows[0] || [];
        const pareceCabecalho = primeira.some(c => typeof c === 'string' && /c[oó]digo|nome|endere[cç]o|latitude|longitude|coordenada/i.test(c));
        if (pareceCabecalho) startRow = 1;

        _impCoordDados = [];
        for (let i = startRow; i < rows.length; i++) {
          const r = rows[i];
          if (!r || !r.length) continue;
          const codigo = String(r[0] || '').trim();
          const nome = String(r[1] || '').trim();
          const endereco = String(r[2] || '').trim();
          const coordTexto = String(r[3] || '').trim();
          const coord = parseLatLng(coordTexto);
          if (!codigo || !nome) continue;
          _impCoordDados.push({ codigo, nome, endereco, lat: coord ? coord.lat : null, lng: coord ? coord.lng : null });
        }

        if (!_impCoordDados.length) { showMsg('msg-imp-coord', 'Nenhum dado válido encontrado na planilha', 'error'); return; }

        document.getElementById('imp-coord-resumo').textContent = _impCoordDados.length + ' clientes encontrados — todos serão importados com horário 00:00';
        document.getElementById('imp-coord-tabela').innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:#F8FBFD"><th style="padding:6px 8px;text-align:left;border-bottom:1px solid #EBF1F5">Código</th><th style="padding:6px 8px;text-align:left;border-bottom:1px solid #EBF1F5">Nome</th><th style="padding:6px 8px;text-align:left;border-bottom:1px solid #EBF1F5">Coordenada</th></tr></thead>
          <tbody>${_impCoordDados.slice(0,50).map(c => `<tr><td style="padding:5px 8px;border-bottom:1px solid #F5F9FC">${c.codigo}</td><td style="padding:5px 8px;border-bottom:1px solid #F5F9FC">${c.nome}</td><td style="padding:5px 8px;border-bottom:1px solid #F5F9FC;color:${c.lat&&c.lng?'#0F9B78':'#D6A14B'}">${c.lat&&c.lng?c.lat.toFixed(4)+', '+c.lng.toFixed(4):'sem coordenada'}</td></tr>`).join('')}</tbody>
        </table>${_impCoordDados.length > 50 ? `<div style="padding:6px;text-align:center;font-size:11px;color:#94A8B8">+ ${_impCoordDados.length - 50} outros...</div>` : ''}`;
        document.getElementById('imp-coord-preview').style.display = 'block';
        document.getElementById('imp-coord-btn-confirmar').style.display = 'block';
        showMsg('msg-imp-coord', '', '');
      } catch(err) {
        showMsg('msg-imp-coord', 'Erro ao ler planilha: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (typeof XLSX !== 'undefined') { lerArquivo(); } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = lerArquivo;
    document.head.appendChild(script);
  }
}

async function confirmarImportacaoCoordenadas() {
  if (!_impCoordDados.length) return;
  const btn = document.getElementById('imp-coord-btn-confirmar');
  btn.disabled = true;
  showMsg('msg-imp-coord', '<span class="spinner"></span> Importando ' + _impCoordDados.length + ' clientes...', 'loading');
  try {
    const r = await fetch(API + '/importar-clientes-coordenadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientes: _impCoordDados })
    });
    const d = await r.json();
    showMsg('msg-imp-coord', `✅ ${d.inseridos} importados, ${d.duplicados || 0} já existiam`, 'success');
    document.getElementById('imp-coord-preview').style.display = 'none';
    btn.style.display = 'none';
    document.getElementById('imp-coord-file').value = '';
    _impCoordDados = [];
  } catch(e) {
    showMsg('msg-imp-coord', 'Erro ao importar: ' + e.message, 'error');
  }
  btn.disabled = false;
}

// ── PARSE DE COORDENADAS (formato único "lat,lng") ───────────
function parseLatLng(texto) {
  if (!texto || typeof texto !== 'string') return null;
  const partes = texto.trim().split(',');
  if (partes.length !== 2) return null;
  const lat = parseFloat(partes[0].trim());
  const lng = parseFloat(partes[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

