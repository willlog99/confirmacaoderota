// ============================================================
// ── MATERIAIS — Escritório, limpeza, alimentação ───────────────────────────
// ============================================================

// ── VARIÁVEIS ──
let materiais = [];
let filtroMatAtual = 'todos';
let matMovId = null;
let matMovTipo = 'entrada';
let qtdMov = 1;


const CAT_ICONS = { escritorio:'📎', limpeza:'🧹', alimentacao:'🍱' };


const CAT_NOMES = { escritorio:'Escritório', limpeza:'Limpeza', alimentacao:'Alimentação' };

// ── FUNÇÕES ──

async function carregarMateriais() {
  try {
    const r = await fetch(API + '/materiais');
    const d = await r.json();
    materiais = d.materiais || [];
  } catch(e) {
    materiais = JSON.parse(localStorage.getItem('loglife_materiais') || '[]');
  }
  renderMateriais();
}


async function salvarMateriaisLocal() {
  localStorage.setItem('loglife_materiais', JSON.stringify(materiais));
}


function renderMateriais() {
  const el = document.getElementById('lista-materiais');
  if (!el) return;
  const busca = (document.getElementById('busca-mat') || {}).value || '';
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const em7 = new Date(hoje); em7.setDate(hoje.getDate() + 7);

  const filtrados = materiais.filter(m => {
    if (filtroMatAtual !== 'todos' && m.categoria !== filtroMatAtual) return false;
    if (busca && !m.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  let nVenc = 0, nBaixo = 0;
  materiais.forEach(m => {
    if (m.validade) {
      const v = new Date(m.validade); v.setHours(0,0,0,0);
      if (v <= em7) nVenc++;
    }
    if (m.qtd <= m.minimo) nBaixo++;
  });

  const elT = document.getElementById('mat-total'); if (elT) elT.textContent = materiais.length;
  const elV = document.getElementById('mat-venc');  if (elV) elV.textContent = nVenc;
  const elB = document.getElementById('mat-baixo'); if (elB) elB.textContent = nBaixo;

  // Alertas
  const alertasEl = document.getElementById('alertas-materiais');
  if (alertasEl) {
    let html = '';
    materiais.forEach(m => {
      if (m.validade) {
        const v = new Date(m.validade); v.setHours(0,0,0,0);
        const dias = Math.ceil((v - hoje) / 86400000);
        if (dias <= 0) html += `<div style="display:flex;gap:8px;padding:7px 12px;border-radius:8px;background:#FCEBEB;border:1px solid #F09595;margin-bottom:5px;font-size:12px;color:#DC2626">🚫 <b>${m.nome}</b> — vencido!</div>`;
        else if (dias <= 7) html += `<div style="display:flex;gap:8px;padding:7px 12px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px;font-size:12px;color:#92400E">⚠️ <b>${m.nome}</b> — vence em ${dias} dia${dias>1?'s':''}</div>`;
      }
      if (m.qtd <= m.minimo) html += `<div style="display:flex;gap:8px;padding:7px 12px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px;font-size:12px;color:#92400E">📦 <b>${m.nome}</b> — estoque baixo (${m.qtd} un)</div>`;
    });
    alertasEl.innerHTML = html ? `<div style="margin-bottom:1rem">${html}</div>` : '';
  }

  if (!filtrados.length) { el.innerHTML = '<div class="empty">Nenhum item encontrado</div>'; return; }

  el.innerHTML = filtrados.map(m => {
    const icon = CAT_ICONS[m.categoria] || '📦';
    const hoje2 = new Date(); hoje2.setHours(0,0,0,0);
    let validadeHtml = '';
    if (m.validade) {
      const v = new Date(m.validade); v.setHours(0,0,0,0);
      const dias = Math.ceil((v - hoje2) / 86400000);
      const cor = dias <= 0 ? '#DC2626' : dias <= 7 ? '#92400E' : '#0F9B78';
      const bg  = dias <= 0 ? '#FCEBEB' : dias <= 7 ? '#FEF9EC' : '#E8F8F0';
      const txt = dias <= 0 ? 'Vencido' : dias <= 7 ? `Vence em ${dias}d` : `Val: ${new Date(m.validade).toLocaleDateString('pt-BR')}`;
      validadeHtml = `<span style="font-size:10px;padding:2px 7px;border-radius:20px;font-weight:700;background:${bg};color:${cor}">${txt}</span>`;
    }
    const qtdCor = m.qtd <= 0 ? '#DC2626' : m.qtd <= m.minimo ? '#92400E' : '#0F4C7A';
    return `<div style="background:#F8FBFD;border-radius:10px;border:1.5px solid #EBF1F5;padding:10px 12px;margin-bottom:6px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:700;color:#0F4C7A">${icon} ${m.nome}</span>
        <span style="font-size:11px;color:#5A7A8F">${CAT_NOMES[m.categoria]||''}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:20px;font-weight:800;color:${qtdCor}">${m.qtd}</span>
          <span style="font-size:11px;color:#94A8B8">un · mín: ${m.minimo}</span>
          ${validadeHtml}
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="abrirMovMat(${m.id})" style="padding:4px 10px;border-radius:6px;border:none;background:#E8F8F0;color:#0F9B78;font-size:11px;font-weight:700;cursor:pointer">± Mov</button>
          <button onclick="editarMat(${m.id})" style="padding:4px 8px;border-radius:6px;border:1px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:11px;font-weight:700;cursor:pointer">✏️</button>
          <button onclick="excluirMat(${m.id})" style="padding:4px 8px;border-radius:6px;border:1px solid #F09595;background:#FCEBEB;color:#DC2626;font-size:11px;font-weight:700;cursor:pointer">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}


function filtrarMat(cat, btn) {
  filtroMatAtual = cat;
  document.querySelectorAll('.mat-filtro').forEach(b => {
    b.style.borderColor = '#D6E5EE'; b.style.background = '#fff'; b.style.color = '#5A7A8F';
  });
  btn.style.borderColor = '#8B5CF6'; btn.style.background = '#F3F0FF'; btn.style.color = '#5B21B6';
  renderMateriais();
}


function abrirModalCadMat() {
  document.getElementById('modal-mat-titulo').textContent = '➕ Cadastrar Item';
  document.getElementById('mat-nome').value = '';
  document.getElementById('mat-cat').value = 'escritorio';
  document.getElementById('mat-qtd').value = '1';
  document.getElementById('mat-min').value = '2';
  document.getElementById('mat-validade').value = '';
  document.getElementById('mat-edit-id').value = '';
  document.getElementById('msg-cad-mat').textContent = '';
  document.getElementById('modal-cad-mat').style.display = 'block';
}


function editarMat(id) {
  const m = materiais.find(x => x.id === id);
  if (!m) return;
  document.getElementById('modal-mat-titulo').textContent = '✏️ Editar Item';
  document.getElementById('mat-nome').value = m.nome;
  document.getElementById('mat-cat').value = m.categoria;
  document.getElementById('mat-qtd').value = m.qtd;
  document.getElementById('mat-min').value = m.minimo;
  document.getElementById('mat-validade').value = m.validade || '';
  document.getElementById('mat-edit-id').value = id;
  document.getElementById('msg-cad-mat').textContent = '';
  document.getElementById('modal-cad-mat').style.display = 'block';
}


function fecharModalMat() {
  document.getElementById('modal-cad-mat').style.display = 'none';
}


async function salvarMaterial() {
  const nome = document.getElementById('mat-nome').value.trim();
  const cat  = document.getElementById('mat-cat').value;
  const qtd  = parseInt(document.getElementById('mat-qtd').value) || 0;
  const min  = parseInt(document.getElementById('mat-min').value) || 0;
  const val  = document.getElementById('mat-validade').value;
  const editId = document.getElementById('mat-edit-id').value;
  const msg  = document.getElementById('msg-cad-mat');
  if (!nome) { msg.textContent = '⚠️ Informe o nome'; msg.style.color = '#DC2626'; return; }

  if (editId) {
    const m = materiais.find(x => x.id === Number(editId));
    if (m) { m.nome = nome; m.categoria = cat; m.qtd = qtd; m.minimo = min; m.validade = val || null; }
  } else {
    materiais.push({ id: Date.now(), nome, categoria: cat, qtd, minimo: min, validade: val || null });
  }

  salvarMateriaisLocal();
  try {
    await fetch(API + '/materiais', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ materiais }) });
  } catch(e) {}

  renderMateriais();
  fecharModalMat();
  toast('✓ Item salvo!');
}


async function excluirMat(id) {
  if (!confirm('Excluir este item?')) return;
  materiais = materiais.filter(m => m.id !== id);
  salvarMateriaisLocal();
  try { await fetch(API + '/materiais', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ materiais }) }); } catch(e) {}
  renderMateriais();
  toast('✓ Item removido');
}


function abrirMovMat(id) {
  const m = materiais.find(x => x.id === id);
  if (!m) return;
  matMovId = id; matMovTipo = 'contagem'; qtdMov = m.qtd;
  document.getElementById('mov-mat-nome-titulo').textContent = m.nome;
  document.getElementById('mov-mat-estoque-atual').textContent = 'Estoque anterior: ' + m.qtd + ' unidades · ' + (CAT_ICONS[m.categoria]||'') + ' ' + (CAT_NOMES[m.categoria]||'');
  document.getElementById('qtd-mov-val').value = m.qtd;
  document.querySelectorAll('.mov-tipo-btn').forEach((b,i) => {
    b.style.borderColor = i===0?'#1E9FD9':'#D6E5EE';
    b.style.background  = i===0?'#E8F4FB':'#fff';
    b.style.color       = i===0?'#0F4C7A':'#5A7A8F';
  });
  atualizarPreviewMov();
  document.getElementById('modal-mov-mat').style.display = 'block';
}


function selecionarMovTipo(tipo, btn) {
  matMovTipo = tipo;
  document.querySelectorAll('.mov-tipo-btn').forEach(b => {
    b.style.borderColor = '#D6E5EE'; b.style.background = '#fff'; b.style.color = '#5A7A8F';
  });
  if (tipo === 'contagem') {
    btn.style.borderColor = '#1E9FD9'; btn.style.background = '#E8F4FB'; btn.style.color = '#0F4C7A';
    const m = materiais.find(x => x.id === matMovId);
    if (m) document.getElementById('qtd-mov-val').value = m.qtd;
  } else {
    btn.style.borderColor = '#0F9B78'; btn.style.background = '#E8F8F0'; btn.style.color = '#0F9B78';
    document.getElementById('qtd-mov-val').value = 0;
  }
  atualizarPreviewMov();
}


function ajustarQtdMov(d) {
  const el = document.getElementById('qtd-mov-val');
  const val = Math.max(0, (parseInt(el.value) || 0) + d);
  el.value = val;
  atualizarPreviewMov();
}


function atualizarPreviewMov() {
  const m = materiais.find(x => x.id === matMovId);
  if (!m) return;
  const contado = parseInt(document.getElementById('qtd-mov-val').value) || 0;
  const prev = document.getElementById('preview-mov-mat');

  if (matMovTipo === 'contagem') {
    const consumido = m.qtd - contado;
    const cor = consumido > 0 ? '#DC2626' : consumido < 0 ? '#0F9B78' : '#5A7A8F';
    prev.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
        <div>
          <div style="font-size:10px;color:#94A8B8;font-weight:700">ANTERIOR</div>
          <div style="font-size:20px;font-weight:800;color:#5A7A8F">${m.qtd}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#94A8B8;font-weight:700">CONTADO</div>
          <div style="font-size:20px;font-weight:800;color:#0F4C7A">${contado}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#94A8B8;font-weight:700">CONSUMIDO</div>
          <div style="font-size:20px;font-weight:800;color:${cor}">${consumido > 0 ? '-'+consumido : consumido < 0 ? '+'+Math.abs(consumido) : '0'}</div>
        </div>
      </div>`;
  } else {
    const novo = m.qtd + contado;
    prev.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:10px;color:#94A8B8;font-weight:700;margin-bottom:4px">NOVO ESTOQUE</div>
        <div style="font-size:26px;font-weight:800;color:#0F9B78">${m.qtd} + ${contado} = ${novo}</div>
      </div>`;
  }
}


async function confirmarMovMat() {
  const m = materiais.find(x => x.id === matMovId);
  if (!m) return;
  const contado = parseInt(document.getElementById('qtd-mov-val').value) || 0;
  const anterior = m.qtd;

  if (matMovTipo === 'contagem') {
    m.qtd = contado;
  } else {
    m.qtd = m.qtd + contado;
  }

  m.ultimaContagem = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  salvarMateriaisLocal();
  try { await fetch(API + '/materiais', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ materiais }) }); } catch(e) {}
  renderMateriais();
  document.getElementById('modal-mov-mat').style.display = 'none';
  const msg = matMovTipo === 'contagem'
    ? `✓ Contagem salva! ${anterior} → ${m.qtd} (${anterior - m.qtd > 0 ? '-'+(anterior-m.qtd)+' consumidos' : 'sem consumo'})`
    : `✓ Entrada de ${contado} unidades adicionada!`;
  toast(msg);
}
