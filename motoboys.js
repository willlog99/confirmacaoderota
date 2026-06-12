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
  const confirmacoes = data.confirmacoes || [];

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
      confEl.innerHTML = confirmacoes.slice(0, 15).map(c => {
        const hora = c.data ? c.data.split(' ').pop() : '';
        const rotasStr = c.rotas && c.rotas.length ? c.rotas.join(', ') : '';
        return `<div class="conf-row ${c.resposta}">
          <div class="conf-ico">${c.resposta === 'sim' ? '✓' : '✕'}</div>
          <div class="conf-info">
            <div class="conf-uni">${c.biocondutor}</div>
            ${rotasStr ? `<div style="font-size:11px;color:#5A7A8F;margin-top:2px">🛣️ ${rotasStr}</div>` : ''}
            ${c.obs ? `<div class="conf-obs">${c.obs}</div>` : ''}
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
          <div class="rota-card ${status} ${expandida}" data-rota="${r.rota.replace(/"/g,'&quot;')}" onclick="toggleRotaPreview(this, '${r.rota.replace(/'/g,"\\'")}')">
            <div style="display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px">
              <div style="min-width:0">
                <div style="display:flex;align-items:center;gap:5px">
                  ${confBadge}
                  <div class="rota-nome" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.rota}</div>
                </div>
                <div class="rota-meta" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🏍️ ${motoStr}</div>
              </div>
              <div style="font-size:11px;font-weight:700;color:#5A7A8F;white-space:nowrap;flex-shrink:0">${feitas}/${total}</div>
              <div style="display:flex;align-items:center;gap:5px;min-width:70px;flex-shrink:0">
                <div style="flex:1;height:3px;background:#E2E8F0;border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${corBarra};border-radius:99px"></div>
                </div>
                <div style="font-size:11px;font-weight:800;color:${corPct};min-width:26px;text-align:right">${total > 0 ? pct+'%' : '—'}</div>
              </div>
            </div>
            <div class="rota-popover" onclick="event.stopPropagation()">
              <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #EBF1F5">${r.rota} · ${motoStr}</div>
              ${pendList ? `<div class="preview-sec">⏳ Pendentes (${pend.length})</div>${pendList}` : ''}
              ${prodList ? `<div class="preview-sec" style="margin-top:6px">✓ Coletadas (${ent.filter(c=>c.produtividade!=='improdutiva').length})</div>${prodList}` : ''}
              ${impList  ? `<div class="preview-sec" style="margin-top:6px">✕ Improdutivas</div>${impList}` : ''}
              <button onclick="event.stopPropagation();abrirDetalheRota('${r.rota.replace(/'/g,"\\'")}')}" style="margin-top:8px;background:#1E9FD9;color:#fff;border:none;padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;width:100%">Ver detalhes completos →</button>
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


function toggleRotaPreview(card, rota) {
  if (cardExpandido === rota) {
    cardExpandido = null;
    card.classList.remove('expanded');
  } else {
    document.querySelectorAll('.rota-card.expanded').forEach(c => c.classList.remove('expanded'));
    cardExpandido = rota;
    card.classList.add('expanded');
  }
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
    const r = await fetch(API + '/');
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
          <button class="btn" style="height:34px;font-size:12px;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE" onclick="editarTipoMotoboy('${m.telefone}','${m.nome}','${tipo}',${m.precisa_checklist !== false})">✏️ Editar tipo</button>
          <button class="btn btn-danger" style="height:34px;font-size:12px" onclick="excluirMotoboy('${m.telefone}')">🗑 Excluir</button>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    const msg = e.name === 'AbortError' ? '⏱ Timeout' : '❌ ' + e.message;
    el.innerHTML = '<div class="empty" style="color:#A32D2D">' + msg + ' <button onclick="carregarMotoboysGerenciar()" style="margin-left:8px;padding:4px 10px;border-radius:6px;border:1px solid #A32D2D;background:#fff;color:#A32D2D;cursor:pointer;font-size:12px">🔄 Tentar novamente</button></div>';
  }
}

function editarTipoMotoboy(telefone, nome, tipoAtual, precisaChecklistAtual) {
  const anterior = document.getElementById('modal-editar-tipo');
  if (anterior) anterior.remove();

  const checklist = precisaChecklistAtual !== false;

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

      <div style="font-size:11px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Checklist</div>
      <label style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1.5px solid #EBF1F5;cursor:pointer;margin-bottom:1.25rem">
        <input type="checkbox" id="cb-checklist" ${checklist ? 'checked' : ''} style="width:18px;height:18px;accent-color:#0F4C7A;cursor:pointer"/>
        <div>
          <div style="font-size:14px;font-weight:700;color:#0F2940">Precisa preencher checklist</div>
          <div style="font-size:11px;color:#64748B">Obrigatório antes de iniciar a rota</div>
        </div>
      </label>

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
  if (!tipo) return;
  try {
    await fetch(API + '/motoboys/tipo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, tipo, precisa_checklist })
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


async function criarCliente() {
  const codigo = document.getElementById('cc-codigo').value.trim();
  const nome = document.getElementById('cc-nome').value.trim();
  const horario = document.getElementById('cc-horario').value;
  if (!codigo || !nome) { showMsg('msg-cc','Preencha código e nome','error'); return; }
  showMsg('msg-cc','Salvando...','loading');
  try {
    await fetch(API + '/clientes-base', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({numero_cliente:codigo, nome, horario:horario||'00:00'}) });
    document.getElementById('cc-codigo').value = '';
    document.getElementById('cc-nome').value = '';
    document.getElementById('cc-horario').value = '';
    showMsg('msg-cc','✅ Cliente criado na base!','success');
  } catch(e) { showMsg('msg-cc','Erro: '+e.message,'error'); }
}


async function buscarCliente() {
  const q = document.getElementById('busca-input').value.trim();
  if (!q) return;
  const el = document.getElementById('busca-resultado');
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
        </div>
        <div style="font-size:12px;color:#5A7A8F;margin-top:4px">📍 ${c.rota||'Sem rota'} · ⏰ ${c.horario}</div>
        <div class="list-item-actions">
          <button class="btn btn-secondary" style="height:34px;font-size:12px" onclick="abrirMover(${c.id})">↔ Mover</button>
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>'; }
}


function abrirMover(id) {
  clienteParaMover = id;
  const sel = document.getElementById('nova-rota-select');
  sel.innerHTML = '<option value="">Selecione a rota...</option>' + rotasDisponiveis.map(r => `<option value="${r}">${r}</option>`).join('');
  document.getElementById('modal-mover').classList.remove('hidden');
}


async function confirmarMover() {
  const rota = document.getElementById('nova-rota-select').value;
  if (!rota || !clienteParaMover) return;
  await fetch(API + '/mover-cliente', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id:clienteParaMover, rota}) });
  document.getElementById('modal-mover').classList.add('hidden');
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


async function carregarChecklists() {
  const el = document.getElementById('lista-checklists');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  document.getElementById('card-lista-checklists').style.display = 'block';
  document.getElementById('card-detalhe-checklist').style.display = 'none';
  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const r = await fetch(API + '/checklist?data=' + encodeURIComponent(hoje));
    const d = await r.json();
    const lista = d.checklists || [];
    if (!lista.length) { el.innerHTML = '<div class="empty">Nenhum checklist hoje</div>'; return; }
    el.innerHTML = lista.map(c => `
      <div class="list-item" style="cursor:pointer" onclick="abrirDetalheChecklist(${JSON.stringify(c).replace(/"/g,'&quot;')})">
        <div class="list-item-row">
          <div class="list-item-name">${c.biocondutor}</div>
          <div class="list-item-meta">${c.data_checklist ? c.data_checklist.split(' ').pop() : ''}</div>
        </div>
        <div style="font-size:12px;color:#5A7A8F;margin-top:4px">🛣️ ${c.rota || '—'} · 🚗 ${c.placa || '—'}</div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="empty" style="color:#A32D2D">Erro</div>'; }
}


function abrirDetalheChecklist(c) {
  document.getElementById('card-lista-checklists').style.display = 'none';
  document.getElementById('card-detalhe-checklist').style.display = 'block';
  document.getElementById('detalhe-checklist-titulo').textContent = c.biocondutor;

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

  document.getElementById('detalhe-checklist-conteudo').innerHTML = `
    <div style="font-size:12px;color:#5A7A8F;margin-bottom:1rem">🛣️ ${c.rota || '—'} · 📅 ${c.data_checklist || '—'}</div>
    ${campos.map(f => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #EBF1F5">
        <div style="font-size:13px;color:#5A7A8F;font-weight:500">${f.label}</div>
        <div style="font-size:13px;font-weight:700;padding:4px 10px;border-radius:7px;background:${bg(String(f.valor))};color:${cor(String(f.valor))}">${f.valor !== null && f.valor !== undefined && f.valor !== '' ? f.valor : '—'}</div>
      </div>`).join('')}
  `;
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
