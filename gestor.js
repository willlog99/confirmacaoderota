// ============================================================
// ── GESTOR — Auditoria operacional ─────────────────────────────────────────
// ============================================================

// ── VARIÁVEIS ──
let respostasAuditoria = {};


const ITENS_AUDITORIA = [
  { id: 'limpeza', label: 'Limpeza geral do veículo (interna e externa)', todos: true },
  { id: 'bau_limpo', label: 'Baú limpo, íntegro e sem odores', todos: true },
  { id: 'bau_cadeado', label: 'Baú com cadeado', todos: true },
  { id: 'bau_vedacao', label: 'Vedação e piso do baú', todos: true },
  { id: 'uniforme', label: 'Uniforme completo e crachá', todos: true },
  { id: 'epi', label: 'Kit EPI (quando aplicável)', todos: true },
  { id: 'extintor', label: 'Extintor, triângulo e estepe', todos: false, somente: 'carro' },
  { id: 'volumes', label: 'Conferência dos volumes na coleta/entrega', todos: true },
  { id: 'acondicionamento', label: 'Acondicionamento correto da carga', todos: true },
  { id: 'comunicacao', label: 'Comunicação com a base', todos: true },
  { id: 'sistema', label: 'Utilização correta do sistema', todos: true },
  { id: 'documentacao', label: 'Documentação do veículo e motorista', todos: true }
];

// ── FUNÇÕES ──

function mudarSubGestor(sub, btn) {
  ['nova','auditorias','checklists','gestores'].forEach(s => {
    const el = document.getElementById('gestor-sub-' + s);
    if (el) el.style.display = s === sub ? 'block' : 'none';
    const b = document.getElementById('gestor-sub-btn-' + s);
    if (b) {
      b.style.borderColor = s === sub ? '#8B5CF6' : '#D6E5EE';
      b.style.background  = s === sub ? '#F3F0FF' : '#fff';
      b.style.color       = s === sub ? '#5B21B6' : '#5A7A8F';
    }
  });
  if (sub === 'auditorias')  carregarAuditorias();
  if (sub === 'checklists')  carregarChecklistsGestor('hoje');
  if (sub === 'gestores')    carregarGestores();
}

// =============================================
// MATERIAIS — ESTOQUE GERAL
// =============================================
let materiais = [];
let filtroMatAtual = 'todos';
let matMovId = null;
let matMovTipo = 'entrada';
let qtdMov = 1;
// CAT_ICONS e CAT_NOMES definidos em materiais.js


function renderItensAuditoria() {
  const tipoEl = document.getElementById('aud-tipo');
  const listaEl = document.getElementById('itens-auditoria-lista');
  if (!tipoEl || !listaEl) return;
  const tipo = tipoEl.value || 'moto';
  const itensFiltrados = ITENS_AUDITORIA.filter(i => i.todos || i.somente === tipo);
  listaEl.innerHTML = itensFiltrados.map(item => {
    const r = respostasAuditoria[item.id] || '';
    const isExtintor = item.id === 'extintor';
    const itemBg = isExtintor ? 'background:#F0F8FF;border-color:#E8F4FB' : '';
    const confAtivo   = r==='conf';
    const ressAtivo   = r==='ressalva';
    const nconfAtivo  = r==='nconf';
    return `<div style="border-radius:10px;background:#F8FBFD;border:1.5px solid #EBF1F5;padding:10px 12px;margin-bottom:6px;${itemBg}">
      <div style="font-size:13px;color:${isExtintor?'#0F4C7A':'#0F4C7A'};font-weight:600;margin-bottom:8px">
        ${item.label}${isExtintor ? ' <span style="font-size:10px;color:#1E9FD9;font-weight:700;background:#DBEAFE;padding:1px 6px;border-radius:20px">só carro</span>' : ''}
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="marcarAuditoria('${item.id}','conf')"
          style="flex:1;padding:7px 4px;border-radius:8px;border:1.5px solid ${confAtivo?'#0F9B78':'#D6E5EE'};background:${confAtivo?'#0F9B78':'#fff'};font-size:12px;font-weight:700;cursor:pointer;color:${confAtivo?'#fff':'#5A7A8F'};transition:.15s">
          ✓ Conforme
        </button>
        <button onclick="marcarAuditoria('${item.id}','ressalva')"
          style="flex:1;padding:7px 4px;border-radius:8px;border:1.5px solid ${ressAtivo?'#F59E0B':'#D6E5EE'};background:${ressAtivo?'#F59E0B':'#fff'};font-size:12px;font-weight:700;cursor:pointer;color:${ressAtivo?'#fff':'#5A7A8F'};transition:.15s">
          ~ Ressalva
        </button>
        <button onclick="marcarAuditoria('${item.id}','nconf')"
          style="flex:1;padding:7px 4px;border-radius:8px;border:1.5px solid ${nconfAtivo?'#DC2626':'#D6E5EE'};background:${nconfAtivo?'#DC2626':'#fff'};font-size:12px;font-weight:700;cursor:pointer;color:${nconfAtivo?'#fff':'#5A7A8F'};transition:.15s">
          ✗ Não conf.
        </button>
      </div>
    </div>`;
  }).join('');
  calcularResultadoAuditoria(itensFiltrados);
}


function marcarAuditoria(id, valor) {
  respostasAuditoria[id] = valor;
  renderItensAuditoria();
}


function calcularResultadoAuditoria(itensFiltrados) {
  const tipo = document.getElementById('aud-tipo')?.value || 'moto';
  const itens = itensFiltrados || ITENS_AUDITORIA.filter(i => i.todos || i.somente === tipo);
  const vals = itens.map(i => respostasAuditoria[i.id] || '');
  const conf    = vals.filter(v => v === 'conf').length;
  const nconf   = vals.filter(v => v === 'nconf').length;
  const ressalva= vals.filter(v => v === 'ressalva').length;
  const avaliados = conf + nconf + ressalva;
  const pts = conf * 100 + ressalva * 50;
  const maxPts = avaliados * 100;
  const pct = maxPts > 0 ? Math.round(pts / maxPts * 100) : 0;

  const box = document.getElementById('aud-resultado-box');
  const txt = document.getElementById('aud-resultado-txt');
  const meta = document.getElementById('aud-resultado-meta');
  const count = document.getElementById('aud-resultado-count');

  if(count) count.textContent = avaliados + '/' + itens.length;
  if(meta) meta.textContent = conf + ' conformes · ' + nconf + ' não conformes · ' + ressalva + ' ressalvas';

  if(avaliados === 0) {
    if(box){box.style.background='linear-gradient(135deg,#F3F0FF,#E8F4FB)';box.style.borderColor='#8B5CF6';}
    if(txt){txt.textContent='Preencha os itens abaixo';txt.style.color='#5B21B6';}
  } else if(nconf > 0) {
    if(box){box.style.background='linear-gradient(135deg,#FCEBEB,#FEF9EC)';box.style.borderColor='#F09595';}
    if(txt){txt.textContent=`⚠️ Score: ${pct}% — Não conforme`;txt.style.color='#DC2626';}
  } else if(ressalva > 0) {
    if(box){box.style.background='linear-gradient(135deg,#FEF9EC,#FFFBEB)';box.style.borderColor='#F2CC70';}
    if(txt){txt.textContent=`~ Score: ${pct}% — Com ressalvas`;txt.style.color='#92400E';}
  } else if(conf === itens.length) {
    if(box){box.style.background='linear-gradient(135deg,#E8F8F0,#F0FAF7)';box.style.borderColor='#5DCAA5';}
    if(txt){txt.textContent=`✓ Score: 100% — Conforme`;txt.style.color='#0F9B78';}
  } else {
    if(box){box.style.background='linear-gradient(135deg,#E8F4FB,#F0F8FF)';box.style.borderColor='#1E9FD9';}
    if(txt){txt.textContent=`Score: ${pct}% — Em andamento`;txt.style.color='#0F4C7A';}
  }
}


function limparAuditoria() {
  respostasAuditoria = {};
  document.getElementById('aud-auditor').value = '';
  document.getElementById('aud-placa').value = '';
  document.getElementById('aud-obs').value = '';
  document.getElementById('aud-motorista').value = '';
  renderItensAuditoria();
}


async function salvarAuditoria() {
  const motorista = document.getElementById('aud-motorista').value;
  const auditor = document.getElementById('aud-auditor').value.trim();
  const placa = document.getElementById('aud-placa').value.trim();
  const tipo = document.getElementById('aud-tipo').value;
  const unidade = document.getElementById('aud-unidade').value;
  const obs = document.getElementById('aud-obs').value.trim();
  const msg = document.getElementById('msg-auditoria');

  if (!motorista) { msg.textContent = '⚠️ Selecione o motorista'; msg.style.color = '#DC2626'; return; }
  if (!auditor) { msg.textContent = '⚠️ Informe o nome do auditor'; msg.style.color = '#DC2626'; return; }

  const itensFiltrados = ITENS_AUDITORIA.filter(i => i.todos || i.somente === tipo);
  const naoRespondidos = itensFiltrados.filter(i => !respostasAuditoria[i.id]);
  if (naoRespondidos.length > 0) { msg.textContent = '⚠️ Responda todos os itens'; msg.style.color = '#DC2626'; return; }

  const vals = itensFiltrados.map(i => respostasAuditoria[i.id]);
  const n_conf = vals.filter(v => v === 'conf').length;
  const n_nconf = vals.filter(v => v === 'nconf').length;
  const n_res = vals.filter(v => v === 'ressalva').length;
  const score = Math.round((n_conf * 100 + n_res * 50) / (itensFiltrados.length * 100) * 100);
  const resultado = (n_nconf > 0 || n_res > 0) ? 'Não conforme' : 'Conforme';
  const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const payload = {
    motorista, auditor, placa, tipo, unidade, obs, resultado, score, dataHora,
    itens: itensFiltrados.map(i => ({ label: i.label, resposta: respostasAuditoria[i.id] }))
  };

  msg.textContent = '⏳ Gerando PDF...'; msg.style.color = '#1E9FD9';

  // Gerar PDF e baixar automaticamente
  const pdfBase64 = gerarPDFAuditoria(payload, true);

  msg.textContent = '⏳ Salvando e enviando e-mail...'; msg.style.color = '#1E9FD9';
  try {
    const r = await fetch(API + '/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, pdfBase64 })
    });
    const d = await r.json();
    if (d.status === 'ok') {
      msg.textContent = '✓ Auditoria salva, PDF baixado e e-mail enviado!'; msg.style.color = '#0F9B78';
      limparAuditoria();
    } else {
      msg.textContent = '✗ PDF gerado mas erro ao salvar: ' + (d.error || ''); msg.style.color = '#DC2626';
    }
  } catch(e) {
    msg.textContent = '✓ PDF baixado! (erro de conexão ao salvar)'; msg.style.color = '#F59E0B';
  }
}


function gerarPDFAuditoria(payload, baixar = false) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const M = 15; const CW = W - M * 2;
  const AZUL   = [15, 76, 122];
  const AZUL_M = [30, 159, 217];
  const VERDE  = [8, 80, 65];
  const VERDE_B= [225, 245, 238];
  const VERM   = [153, 27, 27];
  const VERM_B = [252, 235, 235];
  const ROXO   = [91, 33, 182];
  const ROXO_B = [243, 240, 255];
  const AZUL_B = [232, 244, 251];
  const CINZA  = [247, 251, 253];
  const CINZA_T= [90, 122, 143];
  const CINZA_L= [235, 241, 245];
  const CINZA_9= [148, 168, 184];

  try {
    doc.addImage('https://raw.githubusercontent.com/willlog99/confirmacaoderota/main/20050686-7618-4EE2-86F2-0E0E1EE012BE.png', 'PNG', M, 12, 15, 10);
  } catch(e) {}

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...AZUL);
  doc.text('Relatorio de Auditoria Operacional', W - M, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CINZA_T);
  doc.text('Loglife Logistica', W - M, 22, { align: 'right' });
  doc.setDrawColor(...AZUL_M);
  doc.setLineWidth(0.8);
  doc.line(M, 27, W - M, 27);

  let y = 31;
  const cw4 = CW / 4;
  const cells = [
    ['MOTORISTA', payload.motorista || ''],
    ['AUDITOR', payload.auditor || ''],
    ['UNIDADE', payload.unidade || ''],
    ['DATA / HORA', payload.dataHora || ''],
    ['TIPO DE VEICULO', payload.tipo || ''],
    ['PLACA', payload.placa || '—'],
    ['RESULTADO', (payload.resultado || '').toUpperCase()],
    ['SCORE', (payload.score || 0) + '%'],
  ];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const idx = row * 4 + col;
      const x = M + col * cw4;
      doc.setFillColor(...CINZA);
      doc.rect(x, y, cw4, 15, 'F');
      doc.setDrawColor(...CINZA_L);
      doc.setLineWidth(0.2);
      doc.rect(x, y, cw4, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...CINZA_9);
      doc.text(cells[idx][0], x + 3, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...AZUL);
      const vLines = doc.splitTextToSize(String(cells[idx][1]), cw4 - 5);
      doc.text(vLines[0] || '', x + 3, y + 10);
      if (vLines[1]) doc.text(vLines[1], x + 3, y + 13.5);
    }
    y += 15;
  }
  y += 4;

  const n_conf  = payload.itens.filter(i => i.resposta === 'conf').length;
  const n_nconf = payload.itens.filter(i => i.resposta === 'nconf').length;
  const n_res   = payload.itens.filter(i => i.resposta === 'ressalva').length;
  const bw = CW / 4;
  [[VERDE_B, VERDE, '● ' + n_conf + ' Conformes'],
   [VERM_B,  VERM,  '✗ ' + n_nconf + ' Nao conformes'],
   [ROXO_B,  ROXO,  '! ' + n_res + ' Ressalvas'],
   [payload.score >= 70 ? VERDE_B : VERM_B, payload.score >= 70 ? VERDE : VERM, 'SCORE: ' + payload.score + '%']
  ].forEach(([bg, tc, txt], i) => {
    doc.setFillColor(...bg);
    doc.rect(M + i * bw, y, bw - 1, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...tc);
    doc.text(txt, M + i * bw + 3, y + 5.5);
  });
  y += 12;

  doc.setFillColor(...AZUL_B);
  doc.rect(M, y, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...AZUL_M);
  doc.text('ITENS DE AUDITORIA', M + 3, y + 5);
  y += 10;

  payload.itens.forEach((item, idx) => {
    if (y > 255) { doc.addPage(); y = 20; }
    const labelLines = doc.splitTextToSize(item.label, CW - 36);
    const h = Math.max(8, labelLines.length * 4.5 + 4);
    if (idx % 2 === 0) { doc.setFillColor(...CINZA); doc.rect(M, y, CW, h, 'F'); }
    doc.setDrawColor(...CINZA_L);
    doc.setLineWidth(0.15);
    doc.rect(M, y, CW, h);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(68, 68, 68);
    doc.text(labelLines, M + 3, y + 5);
    const resp = item.resposta;
    const [bg, tc, txt] = resp === 'conf' ? [VERDE_B, VERDE, 'Conforme'] :
                           resp === 'nconf' ? [VERM_B, VERM, 'Nao conforme'] :
                           [ROXO_B, ROXO, 'Ressalva'];
    const bx = W - M - 30;
    doc.setFillColor(...bg);
    doc.roundedRect(bx, y + h/2 - 3, 28, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...tc);
    doc.text(txt, bx + 14, y + h/2 + 1.5, { align: 'center' });
    y += h;
  });
  y += 5;

  if (payload.obs) {
    if (y > 248) { doc.addPage(); y = 20; }
    doc.setFillColor(...AZUL_B);
    doc.rect(M, y, CW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...AZUL_M);
    doc.text('OBSERVACOES', M + 3, y + 5);
    y += 9;
    const obsLines = doc.splitTextToSize(payload.obs, CW - 6);
    const obsH = obsLines.length * 5 + 6;
    doc.setFillColor(...CINZA);
    doc.rect(M, y, CW, obsH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...AZUL);
    doc.text(obsLines, M + 3, y + 5);
  }

  const pH = doc.internal.pageSize.height;
  doc.setDrawColor(...CINZA_L);
  doc.line(M, pH - 20, W - M, pH - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...CINZA_9);
  doc.text('Loglife Logistica — Relatorio de Auditoria Operacional', M, pH - 15);
  doc.text('Gerado em ' + (payload.dataHora || '') + ' — Documento gerado automaticamente', M, pH - 11);
  doc.setDrawColor(...AZUL);
  doc.line(W - M - 52, pH - 12, W - M, pH - 12);
  doc.setFontSize(7.5);
  doc.setTextColor(...CINZA_T);
  doc.text('Assinatura do Auditor', W - M - 26, pH - 9, { align: 'center' });

  if (baixar) {
    const nomeArq = 'Auditoria_' + (payload.motorista||'').replace(/ /g,'_') + '_' + (payload.dataHora||'').split(',')[0].replace(/\//g,'-') + '.pdf';
    doc.save(nomeArq);
  }
  return doc.output('datauristring').split(',')[1];
}


async function reenviarAuditoria(id, btn) {
  const txt = btn.textContent;
  btn.textContent = '⏳';
  btn.disabled = true;
  try {
    const r = await fetch(API + '/auditorias?id=' + id);
    const d = await r.json();
    const a = (d.auditorias || []).find(x => x.id === id);
    if (!a) { toast('⚠️ Auditoria não encontrada'); return; }
    const n_conf = a.itens.filter(i => i.resposta === 'conf').length;
    const n_res  = a.itens.filter(i => i.resposta === 'ressalva').length;
    const score  = Math.round((n_conf * 100 + n_res * 50) / (a.itens.length * 100) * 100);
    const pdfBase64 = gerarPDFAuditoria({ ...a, score }, false);
    const re = await fetch(API + '/auditoria-reenviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, score, pdfBase64 })
    });
    const rd = await re.json();
    if (rd.status === 'ok') { toast('✓ E-mail reenviado!'); btn.textContent = '✓'; }
    else { toast('✗ Erro ao reenviar'); btn.textContent = txt; }
  } catch(e) {
    toast('✗ Erro de conexão');
    btn.textContent = txt;
  }
  btn.disabled = false;
}


async function baixarPDFAuditoria(id) {
  try {
    const r = await fetch(API + '/auditorias?id=' + id);
    const d = await r.json();
    const a = (d.auditorias || []).find(x => x.id === id) || d.auditoria;
    if (!a) { toast('⚠️ Auditoria não encontrada'); return; }
    const n_conf = a.itens.filter(i => i.resposta === 'conf').length;
    const n_res  = a.itens.filter(i => i.resposta === 'ressalva').length;
    const score  = Math.round((n_conf * 100 + n_res * 50) / (a.itens.length * 100) * 100);
    gerarPDFAuditoria({ ...a, score }, true);
  } catch(e) { toast('✗ Erro ao gerar PDF'); }
}


async function carregarAuditorias() {
  const el = document.getElementById('lista-auditorias');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    const r = await fetch(API + '/auditorias');
    const d = await r.json();
    const lista = d.auditorias || [];
    if (!lista.length) { el.innerHTML = '<div class="empty">Nenhuma auditoria registrada</div>'; return; }
    el.innerHTML = lista.map(a => {
      const conf = a.resultado === 'Conforme';
      return `<div style="background:#F8FBFD;border-radius:12px;border:1.5px solid #EBF1F5;padding:12px;margin-bottom:8px;cursor:pointer"
        onclick="this.querySelector('.aud-detalhe').style.display=this.querySelector('.aud-detalhe').style.display==='none'?'block':'none'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div class="lista-nome">${a.motorista}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="badge ${conf?'badge-conf':'badge-nconf'}">${conf?'✓ Conforme':'⚠️ Não conforme'}</span>
            <button onclick="event.stopPropagation();baixarPDFAuditoria(${a.id})"
              style="padding:3px 8px;border-radius:6px;border:1px solid #8B5CF6;background:#F3F0FF;color:#5B21B6;font-size:11px;font-weight:700;cursor:pointer">📥 PDF</button>
            <button onclick="event.stopPropagation();reenviarAuditoria(${a.id},this)"
              style="padding:3px 8px;border-radius:6px;border:1px solid #1E9FD9;background:#E8F4FB;color:#0F4C7A;font-size:11px;font-weight:700;cursor:pointer">📧 Reenviar</button>
          </div>
        </div>
        <div style="font-size:11px;color:#5A7A8F">${a.unidade} · ${a.tipo} · ${a.placa||'—'} · ${a.dataHora} · Auditor: ${a.auditor}</div>
        <div class="aud-detalhe" style="display:none;margin-top:8px;border-top:1px solid #F0F4F8;padding-top:8px">
          ${(a.itens||[]).map(i => {
            const ico = i.resposta === 'conf' ? '✓' : i.resposta === 'nconf' ? '✗' : '!';
            const cor = i.resposta === 'conf' ? '#0F9B78' : i.resposta === 'nconf' ? '#DC2626' : '#8B5CF6';
            const bg = i.resposta === 'conf' ? '#E8F8F0' : i.resposta === 'nconf' ? '#FCEBEB' : '#F3F0FF';
            return `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:12px">
              <div style="width:20px;height:20px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${cor};flex-shrink:0">${ico}</div>
              <span style="color:#0F4C7A">${i.label}</span>
            </div>`;
          }).join('')}
          ${a.obs ? `<div style="font-size:12px;color:#5A7A8F;margin-top:6px;padding-top:6px;border-top:1px solid #F0F4F8">📝 ${a.obs}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div class="empty" style="color:#DC2626">Erro ao carregar</div>';
  }
}


async function carregarChecklistsGestor(filtro) {
  const el = document.getElementById('lista-checklists-gestor');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const r = await fetch(API + '/checklist?data=' + encodeURIComponent(hoje));
    const d = await r.json();
    const lista = d.checklists || [];
    if (!lista.length) { el.innerHTML = '<div class="empty">Nenhum checklist respondido</div>'; return; }
    el.innerHTML = lista.map(c => `
      <div style="background:#F8FBFD;border-radius:12px;border:1.5px solid #EBF1F5;padding:12px;margin-bottom:8px;cursor:pointer"
        onclick="this.querySelector('.chk-detalhe').style.display=this.querySelector('.chk-detalhe').style.display==='none'?'block':'none'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:700;color:#0F4C7A">${c.biocondutor}</span>
          <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#E8F8F0;color:#0F9B78">✓ Completo</span>
        </div>
        <div style="font-size:11px;color:#5A7A8F">${c.data || hoje}</div>
        <div class="chk-detalhe" style="display:none;margin-top:8px;border-top:1px solid #F0F4F8;padding-top:8px">
          ${Object.entries(c.respostas||{}).map(([k,v]) => {
            const ok = v === 'sim' || v === 'ok' || v === 'conforme';
            return `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:12px">
              <div style="width:20px;height:20px;border-radius:50%;background:${ok?'#E8F8F0':'#FCEBEB'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${ok?'#0F9B78':'#DC2626'};flex-shrink:0">${ok?'✓':'✗'}</div>
              <span style="color:#0F4C7A">${k}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<div class="empty" style="color:#DC2626">Erro ao carregar</div>';
  }
}


function filtrarChkGestor(filtro, btn) {
  document.querySelectorAll('#gestor-sub-checklists button').forEach(b => {
    b.style.borderColor = '#D6E5EE'; b.style.background = '#fff'; b.style.color = '#5A7A8F';
  });
  btn.style.borderColor = '#1E9FD9'; btn.style.background = '#E8F4FB'; btn.style.color = '#0F4C7A';
  carregarChecklistsGestor(filtro);
}

// =============================================
// PONTO RH — COMPLETO
// =============================================
let pontoDadosPonto=[], pontoDadosFerias=[], pontoDadosBanco=[], pontoDadosEndereco=[];
let pontoSaldosReais={}, pontoTemExtrato=false;
let pontoDiasExist=[], pontoMes=new Date().getMonth(), pontoAno=new Date().getFullYear();
let pontoNomesHome=[], pontoNomesBanco=[];
let pontoHomeData=[], pontoBancoData=[];
let pontoDesligados=[];
let pontoProcessado=false;


async function carregarGestores() {
  const el = document.getElementById('lista-gestores');
  el.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
  try {
    const r = await fetch(API + '/gestores');
    const d = await r.json();
    const lista = d.gestores || [];
    if (!lista.length) { el.innerHTML = '<div class="empty">Nenhum gestor cadastrado</div>'; return; }
    el.innerHTML = lista.map(g => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0F4F8">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8B5CF6,#5B21B6);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0">${g.nome[0]}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700;color:#0F4C7A">${g.nome}</div>
          <div style="font-size:11px;color:#5A7A8F">📱 ${formatarTelefone(g.telefone)}</div>
        </div>
        <button onclick="removerGestor('${g.telefone}','${g.nome.replace(/'/g,"\\'")}' )"
          style="width:28px;height:28px;border-radius:8px;border:1px solid #F09595;background:#FCEBEB;color:#DC2626;font-size:13px;cursor:pointer;flex-shrink:0">✕</button>
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<div class="empty" style="color:#DC2626">Erro ao carregar</div>';
  }
}


async function adicionarGestor() {
  const nome = document.getElementById('novo-gestor-nome').value.trim().toUpperCase();
  const tel = document.getElementById('novo-gestor-tel').value.replace(/\D/g,'');
  const msg = document.getElementById('msg-gestor');
  if (!nome) { msg.textContent = '⚠️ Informe o nome'; msg.style.color = '#DC2626'; return; }
  if (tel.length < 10) { msg.textContent = '⚠️ Telefone inválido'; msg.style.color = '#DC2626'; return; }
  msg.textContent = '⏳ Salvando...'; msg.style.color = '#1E9FD9';
  try {
    const r = await fetch(API + '/gestores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone: tel })
    });
    const d = await r.json();
    if (d.status === 'ok') {
      msg.textContent = '✓ Gestor adicionado!'; msg.style.color = '#0F9B78';
      document.getElementById('novo-gestor-nome').value = '';
      document.getElementById('novo-gestor-tel').value = '';
      carregarGestores();
    } else {
      msg.textContent = '✗ Erro ao salvar'; msg.style.color = '#DC2626';
    }
  } catch(e) {
    msg.textContent = '✗ Erro de conexão'; msg.style.color = '#DC2626';
  }
}


async function removerGestor(telefone, nome) {
  if (!confirm('Remover gestor ' + nome + '?')) return;
  try {
    await fetch(API + '/gestores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone })
    });
    carregarGestores();
  } catch(e) { alert('Erro ao remover'); }
}


async function carregarChecklistMotoboy(motoboy) {
  const el = document.getElementById('pat-checklist-motoboy');
  if(!motoboy){ el.innerHTML=''; return; }
  patAddMotoboy=motoboy;
  const chk=checklistsMotoboys[motoboy]||{};
  const faltando=LISTA_PADRAO_PAT.filter(t=>!chk[t.id]);
  const alertaHtml=faltando.length
    ?`<div style="background:#FEF9EC;border:1px solid #F2CC70;border-radius:10px;padding:10px 12px;margin-bottom:1rem;font-size:12px;color:#92400E">⚠️ Faltam <strong>${faltando.length} ${faltando.length===1?'item':'itens'}:</strong> ${faltando.map(f=>f.nome).join(', ')}</div>`
    :`<div style="background:#E8F8F0;border:1px solid #5DCAA5;border-radius:10px;padding:10px 12px;margin-bottom:1rem;font-size:12px;color:#0F9B78">✓ Todos os itens cadastrados!</div>`;
  const itensHtml=LISTA_PADRAO_PAT.map(tipo=>{
    const item=chk[tipo.id];
    if(item){
      const det=tipo.codigo?(item.codigo||''):(item.qtd?item.qtd+' un':'');
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid #5DCAA5;background:#F0FAF7;margin-bottom:6px">
        <div style="width:28px;height:28px;border-radius:50%;background:#0F9B78;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">✓</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">${tipo.icon} ${tipo.nome}</div>
        <div style="font-size:11px;color:#5A7A8F">${det}${item.data?' · Entregue '+item.data:''}</div></div>
        <button onclick="removerItemChecklist('${motoboy}','${tipo.id}')" style="padding:4px 8px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:11px;font-weight:700;cursor:pointer">✕</button>
      </div>`;
    }
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid #F2CC70;background:#FEF9EC;margin-bottom:6px">
      <div style="width:28px;height:28px;border-radius:50%;background:#F59E0B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">!</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#92400E">${tipo.icon} ${tipo.nome}</div>
      <div style="font-size:11px;color:#92400E">Não cadastrado</div></div>
      <div style="display:flex;gap:5px">
        <button onclick="abrirPatAdd('${motoboy}','${tipo.id}')" style="padding:4px 8px;border-radius:6px;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">+ Add</button>
        <button onclick="marcarNA('${motoboy}','${tipo.id}')" style="padding:4px 6px;border-radius:6px;background:#F0F4F8;color:#94A8B8;border:1px solid #D6E5EE;font-size:10px;font-weight:700;cursor:pointer">N/A</button>
      </div></div>`;
  }).join('');
  el.innerHTML=alertaHtml+`<div style="background:#fff;border-radius:12px;padding:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:1rem">
    <div style="font-size:14px;font-weight:700;color:#0F4C7A;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      Checklist — ${motoboy}
      <button onclick="abrirPatAdd('${motoboy}','')" style="padding:5px 10px;border-radius:6px;border:none;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;font-size:11px;font-weight:700;cursor:pointer">+ Item</button>
    </div>${itensHtml}</div>
  <button onclick="syncPatServer();toast('✓ Checklist salvo!')" style="width:100%;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#0F9B78,#085041);color:#fff;font-weight:700;font-size:13px;cursor:pointer">💾 Salvar Checklist</button>`;
}


function removerItemChecklist(motoboy,tipoId) {
  if(!confirm('Remover este item?')) return;
  if(checklistsMotoboys[motoboy]){
    const item=checklistsMotoboys[motoboy][tipoId];
    if(item&&item.codigo){ const p=patrimonios.find(x=>x.codigo===item.codigo); if(p){p.motoboy=null;p.dataEntrega=null;} }
    if(item&&item.qtd&&!LISTA_PADRAO_PAT.find(t=>t.id===tipoId)?.codigo){
      if(!patrimoniosSimples[tipoId]) patrimoniosSimples[tipoId]={total:0,vinculados:0};
      patrimoniosSimples[tipoId].vinculados=Math.max(0,(patrimoniosSimples[tipoId].vinculados||0)-(item.qtd||1));
    }
    delete checklistsMotoboys[motoboy][tipoId];
  }
  syncPatServer(); carregarChecklistMotoboy(motoboy);
}


function marcarNA(motoboy,tipoId) {
  if(!checklistsMotoboys[motoboy]) checklistsMotoboys[motoboy]={};
  checklistsMotoboys[motoboy][tipoId]={na:true};
  syncPatServer(); carregarChecklistMotoboy(motoboy);
}
