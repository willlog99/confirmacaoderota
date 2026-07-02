// =============================================
// ABA ESTOQUE — JS COMPLETO CORRIGIDO
// =============================================

// ── VARIÁVEIS GLOBAIS DE PATRIMÔNIO ──
let patrimonios = JSON.parse(localStorage.getItem('lgl_pat') || '[]');
let patrimoniosSimples = JSON.parse(localStorage.getItem('lgl_pat_simples') || '{}');
let checklistsMotoboys = JSON.parse(localStorage.getItem('lgl_pat_chk') || '{}');
let substPatId = null;
let substPatSelecionado = null;
let patAddMotoboy = null;
let patAddTipoAtual = null;
let patAddCodigoSelecionado = null;
let estadoPat = 'Novo';
let subtipoPat2 = 'Definitivo';
const PAT_COM_COD = ['rastreador','bau','cooler_g','cooler_p'];
const LISTA_PADRAO_PAT = [
  { id:'rastreador', nome:'Rastreador',       icon:'📡', codigo:true  },
  { id:'bau',        nome:'Baú',              icon:'🔒', codigo:true  },
  { id:'cooler_g',   nome:'Cooler G',         icon:'🧊', codigo:true  },
  { id:'cooler_p',   nome:'Cooler P',         icon:'🧊', codigo:true  },
  { id:'cmc',        nome:'Camiseta MC',      icon:'👕', codigo:false, tamanho:true  },
  { id:'cml',        nome:'Camiseta ML',      icon:'👕', codigo:false, tamanho:true  },
  { id:'blusa',      nome:'Blusa',            icon:'👔', codigo:false, tamanho:true  },
  { id:'colete',     nome:'Colete',           icon:'🦺', codigo:false, tamanho:false },
  { id:'cracha',     nome:'Crachá',           icon:'🪪', codigo:false, tamanho:false },
  { id:'bolsa',      nome:'Bolsa Pardini',    icon:'👜', codigo:false, tamanho:false },
];

let entTamSel = 'P';
let entQtd = 5;
let filtroMatEstAtual = 'todos';
let estoqueUnif = JSON.parse(localStorage.getItem('lgl_unif') || '{}');

function salvarEstoqueUnif() {
  localStorage.setItem('lgl_unif', JSON.stringify(estoqueUnif));
}

async function carregarUniformes() {
  try {
    const r = await fetch(API + '/uniformes');
    const d = await r.json();
    if (d.estoque) { estoqueUnif = d.estoque; salvarEstoqueUnif(); }
  } catch(e) {}
}

let camMBTamSel = '';
let camisetasParaAdicionar = [];
let pendEntregaMotoboy = '';
let pendEntregaTipo = '';
let pendEntregaIdx = -1;
let pendCodigoSel = null;
let filtroHistoricoAtual = 'todos';
let historicoItens = [];

async function carregarPatrimonios() {
  try {
    const r = await fetch(API + '/patrimonios');
    const d = await r.json();
    patrimonios = d.patrimonios || [];
    patrimoniosSimples = d.simples || {};
    checklistsMotoboys = d.checklists || {};
  } catch(e) {
    patrimonios = JSON.parse(localStorage.getItem('lgl_pat') || '[]');
    patrimoniosSimples = JSON.parse(localStorage.getItem('lgl_pat_simples') || '{}');
    checklistsMotoboys = JSON.parse(localStorage.getItem('lgl_pat_chk') || '{}');
  }
  const sel = document.getElementById('pat-sel-motoboy');
  if (sel && sel.options.length <= 1) {
    try {
      const r2 = await fetch(API + '/motoboys?todos=1&agrupado=1');
      const d2 = await r2.json();
      const nomes = [...new Set((d2.motoboys||[]).map(m => m.nome))].sort();
      nomes.forEach(n => { const o = document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
    } catch(e) {}
  }
  renderEstoquePat();
  renderResumoPat();
}

async function iniciarEstoqueView() {
  const tabEl = document.getElementById('est-tab-materiais');
  if (tabEl) tabEl.style.display = 'block';
  if (!materiais.length) await carregarMateriais();
  renderMateriaisEst();
}

function mudarTabEst(tab, btn) {
  ['materiais'].forEach(t => {
    const el = document.getElementById('est-tab-'+t);
    if(el) el.style.display = t===tab ? 'block' : 'none';
    const b = document.getElementById('est-tab-btn-'+t);
    if(b) { b.style.borderColor=t===tab?'#8B5CF6':'#D6E5EE'; b.style.background=t===tab?'#F3F0FF':'#fff'; b.style.color=t===tab?'#5B21B6':'#5A7A8F'; }
  });
  if(tab==='materiais') renderMateriaisEst();
}

const TIPOS_UNIF_EST = [
  {id:'cmc',  icon:'👕', nome:'Camiseta Manga Curta'},
  {id:'cml',  icon:'👕', nome:'Camiseta Manga Longa'},
  {id:'blusa',icon:'👔', nome:'Blusa'},
  {id:'colete',icon:'🦺',nome:'Colete'},
];

function renderEstoqueUnifEst() {
  const el=document.getElementById('est-uniformes-lista'); if(!el) return;
  el.innerHTML=TIPOS_UNIF_EST.map(tipo=>{
    const tamHtml=['P','M','G','GG'].map(tam=>{
      const qtd=(estoqueUnif[tipo.id]&&estoqueUnif[tipo.id][tam])||0;
      const bg=qtd===0?'#FCEBEB':qtd<=2?'#FEF9EC':'#F8FBFD';
      const tc=qtd===0?'#DC2626':qtd<=2?'#92400E':'#0F4C7A';
      return `<div style="text-align:center;border-radius:8px;padding:8px 4px;border:1.5px solid #EBF1F5;background:${bg}">
        <div style="font-size:10px;font-weight:700;color:#94A8B8">${tam}</div>
        <div style="font-size:18px;font-weight:800;color:${tc}">${qtd}</div></div>`;
    }).join('');
    return `<div style="margin-bottom:10px">
      <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:6px">${tipo.icon} ${tipo.nome}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${tamHtml}</div></div>`;
  }).join('');
}

function abrirModalEntradaUnifEst() {
  entTamSel='P'; entQtd=5;
  const valEl = document.getElementById('qtd-ent-val');
  if(valEl) valEl.textContent='5';
  document.querySelectorAll('#ent-unif-tamanhos > div').forEach((b,i)=>{
    b.style.borderColor=i===0?'#8B5CF6':'#D6E5EE'; b.style.background=i===0?'#F3F0FF':'#fff'; b.style.color=i===0?'#5B21B6':'#5A7A8F';
  });
  const m = document.getElementById('modal-entrada-unif-est');
  if(m) m.style.display='flex';
}

function selTamEnt(btn,tam) {
  entTamSel=tam;
  document.querySelectorAll('#ent-unif-tamanhos > div').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';b.style.color='#5A7A8F';});
  btn.style.borderColor='#8B5CF6'; btn.style.background='#F3F0FF'; btn.style.color='#5B21B6';
}

function ajQtdEnt(d){
  entQtd=Math.max(1,entQtd+d);
  const el=document.getElementById('qtd-ent-val');
  if(el) el.textContent=entQtd;
}

async function confirmarEntradaUnifEst() {
  const tipoEl = document.getElementById('ent-unif-tipo');
  if(!tipoEl) return;
  const tipo=tipoEl.value;
  if(!estoqueUnif[tipo]) estoqueUnif[tipo]={};
  estoqueUnif[tipo][entTamSel]=((estoqueUnif[tipo][entTamSel])||0)+entQtd;
  salvarEstoqueUnif();
  renderEstoqueUnifEst();
  renderUniformesPat();
  fecharModal('modal-entrada-unif-est');
  toast(`✓ ${entQtd}x ${entTamSel} adicionado!`);
}

function renderEstoquePatEst() {
  const el=document.getElementById('est-pat-categorias'); if(!el) return;
  el.innerHTML=LISTA_PADRAO_PAT.filter(t=>t.codigo).map(tipo=>{
    const itens=patrimonios.filter(p=>p.tipo===tipo.id);
    const nD=itens.filter(p=>!p.motoboy).length, nV=itens.filter(p=>p.motoboy).length;
    return `<div style="margin-bottom:10px">
      <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">
        <span>${tipo.icon} ${tipo.nome}</span>
        <div style="display:flex;gap:4px">
          ${nD>0?`<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#E8F8F0;color:#0F9B78">${nD} livre</span>`:''}
          ${nV>0?`<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#E8F4FB;color:#1E9FD9">${nV} uso</span>`:''}
        </div>
      </div>
      ${itens.map(p=>{
        const ec=p.estado==='Novo'?'#0F9B78':p.estado==='Bom'?'#1E9FD9':'#DC2626';
        const eb=p.estado==='Novo'?'#E8F8F0':p.estado==='Bom'?'#E8F4FB':'#FCEBEB';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:#F8FBFD;border:1px solid #EBF1F5;margin-bottom:4px">
          <div><span style="font-size:11px;font-weight:700;color:#8B5CF6;background:#F3F0FF;padding:2px 7px;border-radius:20px">${p.codigo}</span>
          <div style="font-size:11px;margin-top:2px;color:${p.motoboy?'#0F4C7A':'#0F9B78'};font-weight:600">${p.motoboy?'👤 '+p.motoboy:'✓ Disponível'}</div></div>
          <div style="display:flex;gap:4px;align-items:center">
            <span style="font-size:10px;padding:2px 6px;border-radius:20px;font-weight:700;background:${eb};color:${ec}">${p.estado}</span>
            ${!p.motoboy?`<button onclick="excluirPatEstoque(${p.id});renderEstoquePatEst()" style="padding:3px 7px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:10px;font-weight:700;cursor:pointer">✕</button>`:''}
          </div></div>`;
      }).join('')}
      <button onclick="abrirModalPatCad('${tipo.id}')" style="width:100%;padding:7px;border-radius:8px;border:1.5px dashed #D6E5EE;background:#F8F6FF;color:#8B5CF6;font-size:11px;font-weight:700;cursor:pointer;margin-top:4px">+ Cadastrar ${tipo.nome}</button>
    </div>`;
  }).join('');
}

function renderEstoqueSimplesEst() {
  const el=document.getElementById('est-simples-lista2'); if(!el) return;
  el.innerHTML=LISTA_PADRAO_PAT.filter(t=>!t.codigo).map(tipo=>{
    const d=patrimoniosSimples[tipo.id]||{total:0,vinculados:0};
    const dp=Math.max(0,(d.total||0)-(d.vinculados||0));
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0F4F8">
      <div><div style="font-size:13px;font-weight:700;color:#0F4C7A">${tipo.icon} ${tipo.nome}</div>
      <div style="font-size:11px;color:#5A7A8F">${d.vinculados||0} vinculados</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="ajustarSimples('${tipo.id}',-1);renderEstoqueSimplesEst()" style="width:28px;height:28px;border-radius:6px;border:1.5px solid #D6E5EE;background:#fff;font-size:16px;cursor:pointer;color:#0F4C7A;font-weight:700">−</button>
        <span style="font-size:20px;font-weight:800;color:#0F4C7A;min-width:32px;text-align:center">${dp}</span>
        <button onclick="ajustarSimples('${tipo.id}',1);renderEstoqueSimplesEst()" style="width:28px;height:28px;border-radius:6px;border:1.5px solid #D6E5EE;background:#fff;font-size:16px;cursor:pointer;color:#0F4C7A;font-weight:700">+</button>
      </div></div>`;
  }).join('');
}

async function carregarChecklistEstMotoboy(motoboy) {
  // Suporta tanto o container da aba Estoque quanto da aba Patrimônios
  let el = document.getElementById('est-checklist-motoboy');
  if (!el) el = document.getElementById('pat-checklist-motoboy');
  let resumoEl = document.getElementById('est-resumo-todos');

  if(!motoboy){ if(el) el.innerHTML=''; if(resumoEl) { resumoEl.innerHTML=''; renderResumoPorMotoboy(); } return; }
  patAddMotoboy=motoboy;
  const chk=checklistsMotoboys[motoboy]||{};
  const faltando=LISTA_PADRAO_PAT.filter(t=>!chk[t.id]);
  const alertaHtml=faltando.length
    ?`<div style="background:#FEF9EC;border:1px solid #F2CC70;border-radius:10px;padding:10px 12px;margin-bottom:1rem;font-size:12px;color:#92400E">⚠️ Faltam <strong>${faltando.length}</strong>: ${faltando.map(f=>f.nome).join(', ')}</div>`
    :`<div style="background:#E8F8F0;border:1px solid #5DCAA5;border-radius:10px;padding:10px 12px;margin-bottom:1rem;font-size:12px;color:#0F9B78">✓ Checklist completo!</div>`;

  const itensHtml=LISTA_PADRAO_PAT.map(tipo=>{
    const item=chk[tipo.id];
    if(item&&!item.na){
      const det=tipo.codigo?(item.codigo||''):(item.qtd?item.qtd+' un':'');
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1.5px solid #5DCAA5;background:#F0FAF7;margin-bottom:6px">
        <div style="width:24px;height:24px;border-radius:50%;background:#0F9B78;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">✓</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">${tipo.icon} ${tipo.nome}</div>
        <div style="font-size:11px;color:#5A7A8F">${det}${item.data?' · '+item.data:''}</div></div>
        <button onclick="removerItemChecklist('${motoboy}','${tipo.id}');carregarChecklistEstMotoboy('${motoboy}')" style="padding:3px 7px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:10px;font-weight:700;cursor:pointer">✕</button>
      </div>`;
    }
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1.5px solid #F2CC70;background:#FEF9EC;margin-bottom:6px">
      <div style="width:24px;height:24px;border-radius:50%;background:#F59E0B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">!</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#92400E">${tipo.icon} ${tipo.nome}</div>
      <div style="font-size:11px;color:#92400E">Não cadastrado</div></div>
      <div style="display:flex;gap:5px">
        <button onclick="abrirPatAdd('${motoboy}','${tipo.id}')" style="padding:4px 8px;border-radius:6px;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer">+ Add</button>
        <button onclick="marcarNA('${motoboy}','${tipo.id}');carregarChecklistEstMotoboy('${motoboy}')" style="padding:4px 6px;border-radius:6px;background:#F0F4F8;color:#94A8B8;border:1px solid #D6E5EE;font-size:10px;font-weight:700;cursor:pointer">N/A</button>
      </div></div>`;
  }).join('');

  const cams=(chk['camisetas']||[]).map((c,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1.5px solid #5DCAA5;background:#F0FAF7;margin-bottom:6px">
    <div style="width:24px;height:24px;border-radius:50%;background:#0F9B78;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">✓</div>
    <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">👕 ${c.tipo==='cmc'?'Camiseta MC':'Camiseta ML'} · ${c.tam}</div>
    <div style="font-size:11px;color:#5A7A8F">${c.qtd} un${c.data?' · '+c.data:''}</div></div>
    <button onclick="removerCamisetaMB('${motoboy}',${i});carregarChecklistEstMotoboy('${motoboy}')" style="padding:3px 7px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:10px;font-weight:700;cursor:pointer">✕</button>
  </div>`).join('');

  if(el) el.innerHTML=alertaHtml+`<div style="background:#fff;border-radius:12px;padding:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:1rem">
    <div style="font-size:14px;font-weight:700;color:#0F4C7A;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      ${motoboy}
      <div style="display:flex;gap:6px">
        <button onclick="abrirModalCamisetaMB('${motoboy}')" style="padding:5px 10px;border-radius:6px;border:none;background:#E8F8F0;color:#0F9B78;font-size:11px;font-weight:700;cursor:pointer">👕 Camiseta</button>
        <button onclick="abrirPatAdd('${motoboy}','')" style="padding:5px 10px;border-radius:6px;border:none;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;font-size:11px;font-weight:700;cursor:pointer">+ Item</button>
      </div>
    </div>
    ${cams}${itensHtml}
  </div>
  <button onclick="syncPatServer();toast('✓ Salvo!')" style="width:100%;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#0F9B78,#085041);color:#fff;font-weight:700;font-size:13px;cursor:pointer">💾 Salvar</button>`;
}

// Alias para compatibilidade com o painel.html
function carregarChecklistMotoboy(motoboy) {
  patAddMotoboy = motoboy;
  const el = document.getElementById('pat-checklist-motoboy');
  if (el && !document.getElementById('est-checklist-motoboy')) {
    el.innerHTML = '<div id="est-checklist-motoboy"></div><div id="est-resumo-todos" style="display:none"></div>';
  }
  carregarChecklistEstMotoboy(motoboy);
}

function abrirModalCamisetaMB(motoboy) {
  patAddMotoboy = motoboy;
  camisetasParaAdicionar = [];
  const dataEl = document.getElementById('cam-mb-data');
  if(dataEl) dataEl.value = getDataLocalSP();
  atualizarTamanhosCam();
  renderListaCamisetasModal();
  const m = document.getElementById('modal-camiseta-mb');
  if(m) m.style.display='flex';
}

function removerCamisetaMB(motoboy,idx){
  if(!confirm('Remover esta camiseta?')) return;
  const lista=(checklistsMotoboys[motoboy]||{})['camisetas']||[];
  const item=lista[idx];
  if(item){if(!estoqueUnif[item.tipo])estoqueUnif[item.tipo]={};estoqueUnif[item.tipo][item.tam]=((estoqueUnif[item.tipo][item.tam])||0)+(item.qtd||1);salvarEstoqueUnif();}
  lista.splice(idx,1);
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  checklistsMotoboys[motoboy]['camisetas']=lista;
  syncPatServer();renderEstoqueUnifEst();
}

function abrirModalAddCamisetaMB(motoboy){
  patAddMotoboy=motoboy;
  abrirModalCamisetaMB(motoboy);
}

function selCamMBTam(el,tam){
  camMBTamSel=tam;
  document.querySelectorAll('#cam-mb-tamanhos > div').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';});
  el.style.borderColor='#8B5CF6'; el.style.background='#F3F0FF';
}

async function confirmarAddCamisetaMB(){
  const tipo=document.getElementById('cam-mb-tipo')?.value;
  const qtd=parseInt(document.getElementById('cam-mb-qtd')?.value)||1;
  const data=document.getElementById('pat-add-data')?.value;
  const msg=document.getElementById('msg-pat-add');
  if(!camMBTamSel){if(msg){msg.textContent='⚠️ Selecione o tamanho';msg.style.color='#DC2626';}return;}
  const est=(estoqueUnif[tipo]&&estoqueUnif[tipo][camMBTamSel])||0;
  if(qtd>est){if(msg){msg.textContent=`⚠️ Só há ${est} no estoque`;msg.style.color='#DC2626';}return;}
  if(!estoqueUnif[tipo])estoqueUnif[tipo]={};
  estoqueUnif[tipo][camMBTamSel]=est-qtd;
  await salvarEstoqueUnif();
  const motoboy=patAddMotoboy;
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  if(!checklistsMotoboys[motoboy]['camisetas'])checklistsMotoboys[motoboy]['camisetas']=[];
  const dataFmt=data?new Date(data).toLocaleDateString('pt-BR'):new Date().toLocaleDateString('pt-BR');
  checklistsMotoboys[motoboy]['camisetas'].push({tipo,tam:camMBTamSel,qtd,data:dataFmt});
  syncPatServer();
  fecharModal('modal-pat-add');
  renderEstoqueUnifEst(); carregarChecklistEstMotoboy(motoboy);
  toast('✓ Camiseta adicionada!');
}

function renderResumoPorMotoboy(){
  const el=document.getElementById('est-resumo-todos'); if(!el) return;
  const mbs=Object.keys(checklistsMotoboys);
  if(!mbs.length){el.innerHTML='<div class="empty">Nenhum checklist cadastrado</div>';return;}
  el.innerHTML=`<div style="font-size:13px;font-weight:700;color:#0F4C7A;margin-bottom:.8rem">📋 Todos os Motoboys</div>`+
  mbs.map(mb=>{
    const chk=checklistsMotoboys[mb]||{};
    const flt=LISTA_PADRAO_PAT.filter(t=>!chk[t.id]);
    const cams=chk['camisetas']||[];
    const ok=flt.length===0;
    return `<div style="background:#F8FBFD;border-radius:12px;border:1.5px solid #EBF1F5;padding:12px;margin-bottom:8px;cursor:pointer" onclick="this.querySelector('.mb-det').style.display=this.querySelector('.mb-det').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;font-weight:700;color:#0F4C7A">${mb}</span>
        ${ok?'<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#E8F8F0;color:#0F9B78">✓ Completo</span>'
            :`<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#FEF9EC;color:#92400E">⚠️ ${flt.length} pendente${flt.length>1?'s':''}</span>`}
      </div>
      <div class="mb-det" style="display:none;margin-top:8px;border-top:1px solid #F0F4F8;padding-top:8px">
        ${cams.map(c=>`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px">
          <div style="width:16px;height:16px;border-radius:50%;background:#E8F8F0;color:#0F9B78;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">✓</div>
          <span style="flex:1;color:#0F4C7A;font-weight:600">👕 ${c.tipo==='cmc'?'MC':'ML'} ${c.tam}</span><span style="color:#5A7A8F;font-size:11px">${c.qtd} un</span></div>`).join('')}
        ${LISTA_PADRAO_PAT.map(t=>{const item=chk[t.id];
          if(!item)return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px">
            <div style="width:16px;height:16px;border-radius:50%;background:#FEF9EC;color:#92400E;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">!</div>
            <span style="flex:1;color:#92400E;font-weight:600">${t.icon} ${t.nome}</span><span style="color:#92400E;font-size:11px">pendente</span></div>`;
          const det=t.codigo?(item.codigo||''):(item.qtd?item.qtd+' un':'');
          return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px">
            <div style="width:16px;height:16px;border-radius:50%;background:#E8F8F0;color:#0F9B78;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">✓</div>
            <span style="flex:1;color:#0F4C7A;font-weight:600">${t.icon} ${t.nome}</span><span style="color:#8B5CF6;font-size:11px;font-weight:700">${det}</span></div>`;
        }).join('')}
      </div></div>`;
  }).join('');
}

function filtrarMatEst(cat,btn){
  filtroMatEstAtual=cat;
  document.querySelectorAll('.mat-filtro-est').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';b.style.color='#5A7A8F';});
  btn.style.borderColor='#8B5CF6'; btn.style.background='#F3F0FF'; btn.style.color='#5B21B6';
  renderMateriaisEst();
}

function renderMateriaisEst(){
  const busca=(document.getElementById('busca-mat-est')||{}).value||'';
  const hoje=new Date();hoje.setHours(0,0,0,0);
  const em7=new Date(hoje);em7.setDate(hoje.getDate()+7);
  const filtrados=materiais.filter(m=>{
    if(filtroMatEstAtual!=='todos'&&m.categoria!==filtroMatEstAtual)return false;
    if(busca&&!m.nome.toLowerCase().includes(busca.toLowerCase()))return false;
    return true;
  });
  let nV=0,nB=0;
  materiais.forEach(m=>{if(m.validade){const v=new Date(m.validade);v.setHours(0,0,0,0);if(v<=em7)nV++;}if(m.qtd<=m.minimo)nB++;});
  const elT=document.getElementById('mat-total-est');if(elT)elT.textContent=materiais.length;
  const elV=document.getElementById('mat-venc-est');if(elV)elV.textContent=nV;
  const elB=document.getElementById('mat-baixo-est');if(elB)elB.textContent=nB;
  const el=document.getElementById('lista-materiais-est');if(!el)return;
  if(!filtrados.length){el.innerHTML='<div class="empty">Nenhum item</div>';return;}
  const icons={escritorio:'📎',limpeza:'🧹',alimentacao:'🍱'};
  el.innerHTML=filtrados.map(m=>{
    const hoje2=new Date();hoje2.setHours(0,0,0,0);
    let vh='';
    if(m.validade){const v=new Date(m.validade);v.setHours(0,0,0,0);const dias=Math.ceil((v-hoje2)/86400000);
      const cor=dias<=0?'#DC2626':dias<=7?'#92400E':'#0F9B78';const bg=dias<=0?'#FCEBEB':dias<=7?'#FEF9EC':'#E8F8F0';
      const txt=dias<=0?'Vencido':dias<=7?`${dias}d`:`${new Date(m.validade).toLocaleDateString('pt-BR')}`;
      vh=`<span style="font-size:10px;padding:2px 6px;border-radius:20px;font-weight:700;background:${bg};color:${cor}">${txt}</span>`;}
    const qc=m.qtd<=0?'#DC2626':m.qtd<=m.minimo?'#92400E':'#0F4C7A';
    return `<div style="background:#F8FBFD;border-radius:10px;border:1.5px solid #EBF1F5;padding:10px 12px;margin-bottom:6px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:700;color:#0F4C7A">${icons[m.categoria]||'📦'} ${m.nome}</span>
        <span style="font-size:11px;color:#5A7A8F">${m.categoria}</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:20px;font-weight:800;color:${qc}">${m.qtd}</span>
          <span style="font-size:11px;color:#94A8B8">mín:${m.minimo}</span>${vh}</div>
        <div style="display:flex;gap:5px">
          <button onclick="abrirMovMat(${m.id})" style="padding:4px 8px;border-radius:6px;border:none;background:#E8F8F0;color:#0F9B78;font-size:10px;font-weight:700;cursor:pointer">± Mov</button>
          <button onclick="editarMat(${m.id})" style="padding:4px 6px;border-radius:6px;border:1px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:10px;font-weight:700;cursor:pointer">✏️</button>
          <button onclick="excluirMat(${m.id})" style="padding:4px 6px;border-radius:6px;border:1px solid #F09595;background:#FCEBEB;color:#DC2626;font-size:10px;font-weight:700;cursor:pointer">✕</button>
        </div></div></div>`;
  }).join('');
  const ae=document.getElementById('alertas-materiais-est');
  if(ae){let h='';
    materiais.forEach(m=>{
      if(m.validade){const v=new Date(m.validade);v.setHours(0,0,0,0);const dias=Math.ceil((v-hoje)/86400000);
        if(dias<=0)h+=`<div style="padding:7px 12px;border-radius:8px;background:#FCEBEB;border:1px solid #F09595;margin-bottom:5px;font-size:12px;color:#DC2626">🚫 <b>${m.nome}</b> — vencido!</div>`;
        else if(dias<=7)h+=`<div style="padding:7px 12px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px;font-size:12px;color:#92400E">⚠️ <b>${m.nome}</b> — vence em ${dias}d</div>`;}
      if(m.qtd<=m.minimo)h+=`<div style="padding:7px 12px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px;font-size:12px;color:#92400E">📦 <b>${m.nome}</b> — baixo (${m.qtd})</div>`;
    });
    ae.innerHTML=h?`<div style="margin-bottom:1rem">${h}</div>`:'';}
}

function fecharModalCamiseta(){
  fecharModal('modal-camiseta-mb');
  camisetasParaAdicionar=[];
}

function atualizarTamanhosCam(){
  const tipoEl=document.getElementById('cam-novo-tipo');
  const tipo=tipoEl?tipoEl.value:'cmc';
  ['P','M','G','GG'].forEach(tam=>{
    const qtd=(estoqueUnif[tipo]&&estoqueUnif[tipo][tam])||0;
    const el=document.getElementById('cam-est-'+tam);
    if(el)el.textContent=qtd+' un';
  });
}

function selNovoCamTam(btn,tam){
  camMBTamSel=tam;
  document.querySelectorAll('#cam-novo-tamanhos > div').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';b.style.color='#5A7A8F';});
  btn.style.borderColor='#8B5CF6';btn.style.background='#F3F0FF';btn.style.color='#5B21B6';
}

function adicionarCamisetaLista(){
  const tipoEl=document.getElementById('cam-novo-tipo');
  const qtdEl=document.getElementById('cam-novo-qtd');
  const msg=document.getElementById('msg-cam-mb');
  if(!tipoEl||!qtdEl)return;
  const tipo=tipoEl.value;
  const qtd=parseInt(qtdEl.value)||1;
  if(!camMBTamSel){if(msg){msg.textContent='⚠️ Selecione o tamanho';msg.style.color='#DC2626';}return;}
  const estDisp=(estoqueUnif[tipo]&&estoqueUnif[tipo][camMBTamSel])||0;
  if(qtd>estDisp){if(msg){msg.textContent=`⚠️ Só há ${estDisp} no estoque (${camMBTamSel})`;msg.style.color='#DC2626';}return;}
  if(msg) msg.textContent='';
  camisetasParaAdicionar.push({tipo,tam:camMBTamSel,qtd,status:'entregue'});
  qtdEl.value='1';
  renderListaCamisetasModal();
  atualizarTamanhosCam();
}

function renderListaCamisetasModal(){
  const el=document.getElementById('cam-mb-lista');
  if(!el) return;
  if(!camisetasParaAdicionar.length){el.innerHTML='<div style="font-size:12px;color:#94A8B8;text-align:center;padding:8px">Nenhuma camiseta adicionada ainda</div>';return;}
  el.innerHTML=camisetasParaAdicionar.map((c,i)=>{
    const nome=(c.tipo==='cmc'?'Camiseta MC':'Camiseta ML')+' · '+c.tam;
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:#E8F8F0;border:1px solid #5DCAA5;margin-bottom:5px">
      <div style="width:22px;height:22px;border-radius:50%;background:#0F9B78;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">✓</div>
      <div style="flex:1;font-size:13px;font-weight:600;color:#0F4C7A">👕 ${nome} · ${c.qtd} un</div>
      <button onclick="removerCamisetaLista(${i})" style="padding:3px 7px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:11px;font-weight:700;cursor:pointer">✕</button>
    </div>`;
  }).join('');
}

function removerCamisetaLista(idx){
  camisetasParaAdicionar.splice(idx,1);
  renderListaCamisetasModal();
}

async function confirmarCamisetasMB(){
  const msg=document.getElementById('msg-cam-mb');
  if(!camisetasParaAdicionar.length){if(msg){msg.textContent='⚠️ Adicione pelo menos uma camiseta';msg.style.color='#DC2626';}return;}
  const motoboy=patAddMotoboy;
  const dataEl=document.getElementById('cam-mb-data');
  const data=dataEl?dataEl.value:'';
  const dataFmt=data?new Date(data).toLocaleDateString('pt-BR'):new Date().toLocaleDateString('pt-BR');
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  if(!checklistsMotoboys[motoboy]['camisetas'])checklistsMotoboys[motoboy]['camisetas']=[];
  for(const c of camisetasParaAdicionar){
    if(!estoqueUnif[c.tipo])estoqueUnif[c.tipo]={};
    estoqueUnif[c.tipo][c.tam]=Math.max(0,((estoqueUnif[c.tipo][c.tam])||0)-c.qtd);
    checklistsMotoboys[motoboy]['camisetas'].push({...c,data:dataFmt});
    adicionarHistorico({tipo:'entrega',motoboy,item:(c.tipo==='cmc'?'Camiseta MC':'Camiseta ML')+' '+c.tam+' ('+c.qtd+'un)',data:dataFmt});
  }
  await salvarEstoqueUnif();
  syncPatServer();
  fecharModalCamiseta();
  renderEstoqueUnifEst();
  carregarChecklistEstMotoboy(motoboy);
  toast(`✓ ${camisetasParaAdicionar.length} camiseta(s) adicionada(s)!`);
  camisetasParaAdicionar=[];
}

function editarQtdUnif(tipoId,tam,qtdAtual){
  const nomes={cmc:'Camiseta MC',cml:'Camiseta ML',colete:'Colete',jaqueta:'Jaqueta',blusa:'Blusa'};
  const nova=prompt(`Quantidade de ${nomes[tipoId]||tipoId} tamanho ${tam}:\n(Atual: ${qtdAtual})`);
  if(nova===null)return;
  const novaQtd=parseInt(nova);
  if(isNaN(novaQtd)||novaQtd<0){toast('⚠️ Quantidade inválida');return;}
  if(!estoqueUnif[tipoId])estoqueUnif[tipoId]={};
  estoqueUnif[tipoId][tam]=novaQtd;
  salvarEstoqueUnif();
  renderEstoqueUnifEst();
  renderUniformesPat();
  toast('✓ Estoque atualizado: '+novaQtd+' unidades');
}

function ajustarSimplesEst(tipo,delta){
  if(!patrimoniosSimples[tipo])patrimoniosSimples[tipo]={total:0,vinculados:0};
  const atual=Math.max(0,(patrimoniosSimples[tipo].total||0)-(patrimoniosSimples[tipo].vinculados||0));
  const novo=atual+delta;
  if(novo<0)return;
  if(novo===0&&delta<0){if(!confirm('Zerar estoque disponível?'))return;}
  patrimoniosSimples[tipo].total=Math.max(0,(patrimoniosSimples[tipo].total||0)+delta);
  syncPatServer();renderEstoqueSimplesEst();
  toast('✓ Estoque atualizado');
}

function editarQtdSimples(tipo,qtdAtual){
  const tipoInfo=LISTA_PADRAO_PAT.find(t=>t.id===tipo);
  const nova=prompt(`Quantidade disponível de ${tipoInfo?.nome||tipo}:\n(Atual: ${qtdAtual})`);
  if(nova===null)return;
  const novaQtd=parseInt(nova);
  if(isNaN(novaQtd)||novaQtd<0){toast('⚠️ Quantidade inválida');return;}
  if(!patrimoniosSimples[tipo])patrimoniosSimples[tipo]={total:0,vinculados:0};
  patrimoniosSimples[tipo].total=novaQtd+(patrimoniosSimples[tipo].vinculados||0);
  syncPatServer();renderEstoqueSimplesEst();
  toast('✓ Estoque atualizado: '+novaQtd+' disponíveis');
}

function renderPendencias(){
  const el=document.getElementById('lista-pendencias');if(!el)return;
  const resumoEl=document.getElementById('pend-resumo');
  const pendencias=[];
  Object.keys(checklistsMotoboys).forEach(mb=>{
    const chk=checklistsMotoboys[mb]||{};
    LISTA_PADRAO_PAT.forEach(tipo=>{
      const item=chk[tipo.id];
      if(!item||item.status==='pendente')pendencias.push({motoboy:mb,tipo:tipo.id,icon:tipo.icon,nome:tipo.nome,temCod:tipo.codigo,idx:-1});
    });
    (chk['camisetas']||[]).forEach((c,i)=>{
      if(!c.status||c.status==='pendente'){
        const nome=(c.tipo==='cmc'?'Camiseta MC':'Camiseta ML')+(c.tam?' '+c.tam:'');
        pendencias.push({motoboy:mb,tipo:'camiseta',icon:'👕',nome,temCod:false,idx:i,camiseta:c});
      }
    });
  });
  if(resumoEl)resumoEl.innerHTML=pendencias.length?`⏳ <strong>${pendencias.length}</strong> item(ns) pendente(s)`:'✓ Nenhuma pendência!';
  if(!pendencias.length){el.innerHTML='<div class="empty" style="color:#0F9B78">✓ Tudo entregue!</div>';return;}
  const porMb={};
  pendencias.forEach(p=>{if(!porMb[p.motoboy])porMb[p.motoboy]=[];porMb[p.motoboy].push(p);});
  el.innerHTML=Object.keys(porMb).map(mb=>`
    <div style="background:#fff;border-radius:12px;border:1.5px solid #F2CC70;padding:12px;margin-bottom:8px;box-shadow:0 1px 6px rgba(0,0,0,0.05)">
      <div style="font-size:13px;font-weight:700;color:#0F4C7A;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
        ${mb}<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#FEF9EC;color:#92400E">⏳ ${porMb[mb].length}</span>
      </div>
      ${porMb[mb].map(p=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px">
          <div style="width:24px;height:24px;border-radius:50%;background:#F59E0B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">⏳</div>
          <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#92400E">${p.icon} ${p.nome}</div></div>
          <button onclick="abrirModalEntregarPend('${mb}','${p.tipo}',${p.idx})"
            style="padding:5px 10px;border-radius:6px;border:none;background:linear-gradient(135deg,#0F9B78,#085041);color:#fff;font-size:11px;font-weight:700;cursor:pointer">✓ Entregar</button>
        </div>`).join('')}
    </div>`).join('');
}

function abrirModalEntregarPend(motoboy,tipo,idx){
  pendEntregaMotoboy=motoboy;pendEntregaTipo=tipo;pendEntregaIdx=idx;pendCodigoSel=null;
  const tipoInfo=LISTA_PADRAO_PAT.find(t=>t.id===tipo);
  const temCod=tipoInfo?.codigo||false;
  const tituloEl=document.getElementById('pend-modal-titulo');
  const infoEl=document.getElementById('pend-modal-info');
  const dataEl=document.getElementById('pend-data-entrega');
  const msgEl=document.getElementById('msg-pend-modal');
  const patEl=document.getElementById('pend-modal-pat');
  const qtdEl=document.getElementById('pend-modal-qtd');
  if(tituloEl)tituloEl.textContent='✓ Entregar '+(tipoInfo?.nome||'Camiseta');
  if(infoEl)infoEl.textContent='Para: '+motoboy;
  if(dataEl)dataEl.value=getDataLocalSP();
  if(msgEl)msgEl.textContent='';
  if(patEl)patEl.style.display=temCod?'block':'none';
  if(qtdEl)qtdEl.style.display=!temCod?'block':'none';
  if(temCod){
    const disp=patrimonios.filter(p=>p.tipo===tipo&&!p.motoboy);
    const ec={Novo:'#0F9B78',Bom:'#1E9FD9',Danificado:'#DC2626'};
    let html=disp.map(p=>`<div onclick="selecionarPendPat('${p.codigo}',this)" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1.5px solid #D6E5EE;background:#fff;margin-bottom:6px;cursor:pointer">
      <div style="width:12px;height:12px;border-radius:50%;border:2px solid #D6E5EE;flex-shrink:0" class="radio-pend"></div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">${p.codigo}</div><div style="font-size:11px;color:${ec[p.estado]}">${p.estado}</div></div></div>`).join('');
    if(!disp.length)html=`<div style="padding:8px;font-size:12px;color:#94A8B8;text-align:center">Nenhum disponível no estoque</div>`+html;
    html+=`<div onclick="togglePendManual()" id="pend-manual-toggle" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1.5px dashed #D6E5EE;background:#F8FBFD;margin-bottom:6px;cursor:pointer">
      <div style="width:12px;height:12px;border-radius:50%;border:2px solid #D6E5EE;flex-shrink:0" id="pend-radio-manual"></div>
      <span style="font-size:13px;font-weight:600;color:#5A7A8F">✏️ Código manual</span></div>`;
    const dispEl=document.getElementById('pend-modal-disponiveis');
    if(dispEl)dispEl.innerHTML=html;
    const mw=document.getElementById('pend-manual-wrap');if(mw)mw.style.display='none';
    const cm=document.getElementById('pend-codigo-manual');if(cm)cm.value='';
  }
  const m=document.getElementById('modal-entregar-pend');
  if(m)m.style.display='flex';
}

function selecionarPendPat(codigo,el){
  pendCodigoSel=codigo;
  document.querySelectorAll('#pend-modal-disponiveis .radio-pend').forEach(r=>{r.style.background='';r.style.borderColor='#D6E5EE';});
  document.querySelectorAll('#pend-modal-disponiveis > div').forEach(d=>{d.style.borderColor='#D6E5EE';d.style.background='#fff';});
  el.style.borderColor='#8B5CF6';el.style.background='#F3F0FF';
  el.querySelector('.radio-pend').style.background='#8B5CF6';
  const mw=document.getElementById('pend-manual-wrap');if(mw)mw.style.display='none';
}

function togglePendManual(){
  pendCodigoSel='manual';
  document.querySelectorAll('#pend-modal-disponiveis .radio-pend').forEach(r=>{r.style.background='';r.style.borderColor='#D6E5EE';});
  document.querySelectorAll('#pend-modal-disponiveis > div').forEach(d=>{d.style.borderColor='#D6E5EE';d.style.background='#F8FBFD';});
  const t=document.getElementById('pend-manual-toggle');if(t){t.style.borderColor='#8B5CF6';t.style.background='#F3F0FF';}
  const r=document.getElementById('pend-radio-manual');if(r){r.style.background='#8B5CF6';r.style.borderColor='#8B5CF6';}
  const mw=document.getElementById('pend-manual-wrap');if(mw)mw.style.display='block';
}

async function confirmarEntregaPend(){
  const msgEl=document.getElementById('msg-pend-modal');
  const dataEl=document.getElementById('pend-data-entrega');
  const data=dataEl?dataEl.value:'';
  const dataFmt=data?new Date(data).toLocaleDateString('pt-BR'):new Date().toLocaleDateString('pt-BR');
  const motoboy=pendEntregaMotoboy,tipo=pendEntregaTipo;
  const tipoInfo=LISTA_PADRAO_PAT.find(t=>t.id===tipo);
  const temCod=tipoInfo?.codigo||false;
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  if(tipo==='camiseta'){
    const qtdEl=document.getElementById('pend-qtd-val');
    const qtd=parseInt(qtdEl?.value)||1;
    const lista=checklistsMotoboys[motoboy]['camisetas']||[];
    if(pendEntregaIdx>=0&&lista[pendEntregaIdx]){lista[pendEntregaIdx].status='entregue';lista[pendEntregaIdx].data=dataFmt;lista[pendEntregaIdx].qtd=qtd;}
    adicionarHistorico({tipo:'entrega',motoboy,item:'Camiseta',data:dataFmt});
  }else if(temCod){
    if(!pendCodigoSel){if(msgEl){msgEl.textContent='⚠️ Selecione ou digite o código';msgEl.style.color='#DC2626';}return;}
    let cod=pendCodigoSel;
    if(cod==='manual'){
      const cmEl=document.getElementById('pend-codigo-manual');
      cod=(cmEl?.value||'').trim().toUpperCase();
      if(!cod){if(msgEl){msgEl.textContent='⚠️ Digite o código';msgEl.style.color='#DC2626';}return;}
      if(!patrimonios.find(p=>p.codigo===cod))patrimonios.push({id:Date.now(),tipo,codigo:cod,subtipo:null,estado:'Novo',motoboy,dataEntrega:dataFmt});
    }
    const p=patrimonios.find(x=>x.codigo===cod);
    if(p){p.motoboy=motoboy;p.dataEntrega=dataFmt;}
    checklistsMotoboys[motoboy][tipo]={codigo:cod,data:dataFmt,status:'entregue'};
    adicionarHistorico({tipo:'entrega',motoboy,item:tipoInfo.nome+' '+cod,data:dataFmt});
  }else{
    const qtdEl=document.getElementById('pend-qtd-val');
    const qtd=parseInt(qtdEl?.value)||1;
    if(!patrimoniosSimples[tipo])patrimoniosSimples[tipo]={total:0,vinculados:0};
    patrimoniosSimples[tipo].vinculados=(patrimoniosSimples[tipo].vinculados||0)+qtd;
    checklistsMotoboys[motoboy][tipo]={qtd,data:dataFmt,status:'entregue'};
    adicionarHistorico({tipo:'entrega',motoboy,item:tipoInfo.nome+' ('+qtd+')',data:dataFmt});
  }
  syncPatServer();
  fecharModal('modal-entregar-pend');
  renderPendencias();renderEstoquePatEst();
  toast('✓ Entregue para '+motoboy+'!');
}

function adicionarHistorico(entry){
  carregarHistoricoLocal();
  historicoItens.unshift({...entry,id:Date.now()});
  localStorage.setItem('lgl_historico',JSON.stringify(historicoItens.slice(0,200)));
}

function carregarHistoricoLocal(){
  historicoItens=JSON.parse(localStorage.getItem('lgl_historico')||'[]');
}

function filtrarHistorico(tipo,btn){
  filtroHistoricoAtual=tipo;
  document.querySelectorAll('.hist-filtro').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';b.style.color='#5A7A8F';});
  btn.style.borderColor='#8B5CF6';btn.style.background='#F3F0FF';btn.style.color='#5B21B6';
  renderHistorico();
}

function renderHistorico(){
  const el=document.getElementById('lista-historico');if(!el)return;
  carregarHistoricoLocal();
  const todos=[...historicoItens];
  patrimonios.forEach(p=>{if(p.historico)todos.push(...p.historico);});
  todos.sort((a,b)=>b.id-a.id);
  const filtrados=filtroHistoricoAtual==='todos'?todos:todos.filter(h=>h.tipo===filtroHistoricoAtual);
  if(!filtrados.length){el.innerHTML='<div class="empty">Nenhum registro</div>';return;}
  const icones={entrega:'✓',troca:'↔',descarte:'🗑'};
  const cores={entrega:'#0F9B78',troca:'#F59E0B',descarte:'#DC2626'};
  const bgs={entrega:'#E8F8F0',troca:'#FEF9EC',descarte:'#FCEBEB'};
  const labels={entrega:'Entrega',troca:'Troca',descarte:'Descarte'};
  el.innerHTML=filtrados.map(h=>`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#F8FBFD;border:1.5px solid #EBF1F5;margin-bottom:6px">
      <div style="width:28px;height:28px;border-radius:50%;background:${bgs[h.tipo]||'#F3F0FF'};color:${cores[h.tipo]||'#8B5CF6'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">${icones[h.tipo]||'•'}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:#0F4C7A">${h.item}</div>
        <div style="font-size:11px;color:#5A7A8F">${h.motoboy} · ${h.data}</div>
        ${h.substituto?`<div style="font-size:11px;color:#8B5CF6;margin-top:2px">↔ Substituído por: <strong>${h.substituto}</strong></div>`:''}
        ${h.motivo?`<div style="font-size:11px;color:#92400E;margin-top:2px">Motivo: ${h.motivo}</div>`:''}
      </div>
      <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${bgs[h.tipo]||'#F3F0FF'};color:${cores[h.tipo]||'#8B5CF6'}">${labels[h.tipo]||h.tipo}</span>
    </div>`).join('');
}

function toggleCat(header) {
  const corpo = header.nextElementSibling;
  const arrow = header.querySelector('.cat-arrow');
  const show = corpo.style.display !== 'block';
  corpo.style.display = show ? 'block' : 'none';
  if (arrow) arrow.textContent = show ? '˅' : '›';
}

function toggleCatPat(header) { toggleCat(header); }

async function syncPatServer() {
  salvarPatLocal();
  try {
    await fetch(API + '/patrimonios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patrimonios, simples: patrimoniosSimples, checklists: checklistsMotoboys })
    });
  } catch(e) {}
}

function salvarPatLocal() {
  localStorage.setItem('lgl_pat', JSON.stringify(patrimonios));
  localStorage.setItem('lgl_pat_simples', JSON.stringify(patrimoniosSimples));
  localStorage.setItem('lgl_pat_chk', JSON.stringify(checklistsMotoboys));
}

function ajustarSimples(tipo, delta) {
  if (!patrimoniosSimples[tipo]) patrimoniosSimples[tipo] = { total: 0, vinculados: 0 };
  patrimoniosSimples[tipo].total = Math.max(0, (patrimoniosSimples[tipo].total || 0) + delta);
  syncPatServer();
  renderEstoquePat();
  renderEstoqueSimplesEst();
  toast('✓ Estoque atualizado');
}

function renderEstoquePat() {
  renderPatKPIs();
  renderPatTabela();
  const elS = document.getElementById('pat-simples-lista'); if (!elS) return;
  elS.innerHTML = LISTA_PADRAO_PAT.filter(t => !t.codigo).map(tipo => {
    const d = patrimoniosSimples[tipo.id] || { total: 0, vinculados: 0 };
    const dp = Math.max(0, (d.total || 0) - (d.vinculados || 0));
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0F4F8">
      <div><div style="font-size:13px;font-weight:700;color:#0F4C7A">${tipo.icon} ${tipo.nome}</div>
      <div style="font-size:11px;color:#5A7A8F">${d.vinculados||0} vinculados</div></div>
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="ajustarSimples('${tipo.id}',-1)" style="width:28px;height:28px;border-radius:6px;border:1.5px solid #D6E5EE;background:#fff;font-size:16px;cursor:pointer">−</button>
        <span style="font-size:20px;font-weight:800;color:#0F4C7A;min-width:32px;text-align:center">${dp}</span>
        <button onclick="ajustarSimples('${tipo.id}',1)" style="width:28px;height:28px;border-radius:6px;border:1.5px solid #D6E5EE;background:#fff;font-size:16px;cursor:pointer">+</button>
      </div></div>`;
  }).join('');
}

// ====== NOVO LAYOUT: KPIs compactos ======
function renderPatKPIs() {
  const total = patrimonios.length;
  const disp  = patrimonios.filter(p => !p.motoboy).length;
  const uso   = total - disp;
  const perd  = patrimonios.filter(p => p.estado==='Perdido' || p.estado==='Danificado').length;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('pat-kpi-total', total);
  set('pat-kpi-uso', uso);
  set('pat-kpi-disp', disp);
  set('pat-kpi-perd', perd);
}

// ====== NOVO LAYOUT: Tabela compacta com filtros ======
let patFiltroCache = { tipo: '', status: '', busca: '' };
function patIcone(tipo) {
  const map = { rastreador:'📡', bau:'📦', cooler_p:'🧊', cooler_m:'🧊', cooler_g:'🧊', cooler_gg:'🧊', capacete:'⛑️', colete:'🦺', camiseta:'👕', blusa:'🧥', cartao:'💳' };
  return map[tipo] || '🔹';
}
function patEstadoCfg(estado) {
  if (estado === 'Perdido') return { cor:'#DC2626', bg:'#FCEBEB' };
  if (estado === 'Danificado') return { cor:'#92400E', bg:'#FEF9EC' };
  if (estado === 'Em uso') return { cor:'#1E9FD9', bg:'#E8F4FB' };
  if (estado === 'Novo') return { cor:'#0F9B78', bg:'#E8F8F0' };
  return { cor:'#0F9B78', bg:'#E8F8F0' };
}
function renderPatTabela() {
  const el = document.getElementById('pat-tabela-container'); if (!el) return;
  const f = patFiltroCache;
  const norm = s => (s||'').toString().toLowerCase();
  const busca = norm(f.busca);
  const statusMap = { disponivel: p => !p.motoboy, em_uso: p => !!p.motoboy, danificado: p => p.estado==='Danificado', perdido: p => p.estado==='Perdido' };
  const lista = patrimonios.filter(p => {
    if (f.status && !(statusMap[f.status] && statusMap[f.status](p))) return false;
    if (busca) {
      const hay = norm(p.codigo) + ' ' + norm(p.motoboy) + ' ' + norm(p.dataEntrega);
      if (!hay.includes(busca)) return false;
    }
    return true;
  });
  // Cabeçalho das colunas
  const cabecalho = `<div style="display:grid;grid-template-columns:1.2fr 1.1fr 1.1fr .8fr 1.6fr;gap:8px;padding:9px 12px;background:#F8FBFD;border-bottom:1px solid #EBF1F5;font-size:10px;font-weight:700;color:#5A7A8F;text-transform:uppercase;letter-spacing:.04em">
    <div>Código</div><div>Tipo</div><div>Com quem</div><div>Estado</div><div style="text-align:right">Ações</div>
  </div>`;
  // Definição das sub-seções na ordem solicitada
  const subsecoes = [
    { id: 'rastreador', label: 'Rastreador', icon: '📡', filtro: p => p.tipo === 'rastreador', cadId: 'rastreador', cadLabel: 'Rastreador' },
    { id: 'cooler',     label: 'Cooler',     icon: '🧊', filtro: p => p.tipo === 'cooler_p' || p.tipo === 'cooler_g', cadId: '', cadLabel: 'Cooler' },
    { id: 'bau',        label: 'Baú',        icon: '🔒', filtro: p => p.tipo === 'bau', cadId: 'bau', cadLabel: 'Baú' }
  ];
  // Render de uma linha da tabela (sem o cabeçalho — ele é compartilhado pela sub-seção)
  const renderLinha = p => {
    const cfg = patEstadoCfg(p.motoboy ? 'Em uso' : p.estado);
    const displayEstado = p.motoboy ? 'Em uso' : p.estado;
    const acoes = p.motoboy
      ? `<button onclick="abrirModalTransferir(${p.id})" title="Transferir" style="padding:5px 8px;border-radius:7px;border:1.5px solid #D6E5EE;background:#fff;color:#1E9FD9;font-size:12px;font-weight:700;cursor:pointer">⤴</button>
         <button onclick="abrirModalSubstituir(${p.id})" title="Substituir" style="padding:5px 8px;border-radius:7px;border:1.5px solid #D6E5EE;background:#fff;color:#92400E;font-size:12px;font-weight:700;cursor:pointer">↔</button>
         <button onclick="abrirModalDevolver(${p.id})" title="Devolver" style="padding:5px 8px;border-radius:7px;border:1.5px solid #D6E5EE;background:#fff;color:#0F9B78;font-size:12px;font-weight:700;cursor:pointer">↩</button>`
      : `<button onclick="abrirModalVincular(${p.id})" title="Vincular ao motoboy" style="padding:5px 8px;border-radius:7px;border:none;background:linear-gradient(135deg,#1E9FD9,#0F4C7A);color:#fff;font-size:12px;font-weight:700;cursor:pointer">📤</button>
         <button onclick="abrirModalSubstituir(${p.id})" title="Substituir" style="padding:5px 8px;border-radius:7px;border:1.5px solid #D6E5EE;background:#fff;color:#92400E;font-size:12px;font-weight:700;cursor:pointer">↔</button>
         <button onclick="excluirPatEstoque(${p.id})" title="Excluir" style="padding:5px 8px;border-radius:7px;border:1.5px solid #F09595;background:#FCEBEB;color:#DC2626;font-size:12px;font-weight:700;cursor:pointer">✕</button>`;
    return `<div style="display:grid;grid-template-columns:1.2fr 1.1fr 1.1fr .8fr 1.6fr;gap:8px;padding:9px 12px;border-bottom:1px solid #F0F4F8;align-items:center">
      <div><span style="font-size:12px;font-weight:800;color:#8B5CF6;background:#F3F0FF;padding:3px 9px;border-radius:20px">${p.codigo}</span></div>
      <div style="font-size:12px;font-weight:600;color:#0F4C7A">${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}${p.subtipo?' · '+p.subtipo:''}</div>
      <div style="font-size:12px;color:${p.motoboy?'#0F4C7A':'#94A8B8'};font-weight:${p.motoboy?'700':'400'}">${p.motoboy? '👤 '+p.motoboy : '—'}</div>
      <div><span style="font-size:10px;font-weight:700;padding:3px 7px;border-radius:20px;background:${cfg.bg};color:${cfg.cor}">${displayEstado}</span></div>
      <div style="display:flex;gap:5px;justify-content:flex-end">${acoes}</div>
    </div>`;
  };
  // Monta cada sub-seção
  let html = '';
  for (const sub of subsecoes) {
    const itens = lista.filter(sub.filtro);
    const total = itens.length;
    const emUso = itens.filter(p => !!p.motoboy).length;
    const disponivel = total - emUso;
    const subHtml = itens.map(renderLinha).join('');
    // Botão + Cadastrar — Cooler usa string vazia (modal mostra os 2 tamanhos)
    const cadClick = `abrirModalPatCad('${sub.cadId}')`;
    const subInfo = sub.id === 'cooler'
      ? ` · <span style="color:#0F9B78">${disponivel} disp.</span> · <span style="color:#1E9FD9">${emUso} em uso</span>`
      : ` · <span style="color:#0F9B78">${disponivel} disp.</span> · <span style="color:#1E9FD9">${emUso} em uso</span>`;
    html += `<div style="margin-bottom:6px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#fff;border:1px solid #EBF1F5;border-radius:8px 8px 0 0;border-bottom:none">
        <div style="font-size:11px;font-weight:800;color:#0F4C7A;text-transform:uppercase;letter-spacing:.04em">
          ${sub.icon} ${sub.label} <span style="color:#94A8B8;font-weight:600">(${total})${subInfo}</span>
        </div>
        <button onclick="${cadClick}" style="padding:4px 9px;border-radius:7px;border:1.5px solid #8B5CF6;background:#F3F0FF;color:#5B21B6;font-size:10px;font-weight:700;cursor:pointer">+ ${sub.cadLabel}</button>
      </div>`;
    if (itens.length === 0) {
      html += `<div style="padding:14px 12px;background:#fff;border:1px solid #EBF1F5;border-top:none;border-radius:0 0 8px 8px;text-align:center;font-size:11px;color:#94A8B8">Nenhum ${sub.label.toLowerCase()} cadastrado</div>`;
    } else {
      html += `<div style="background:#fff;border:1px solid #EBF1F5;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">
        ${cabecalho}${subHtml}
      </div>`;
    }
    html += `</div>`;
  }
  el.innerHTML = html;
}

function tipoLabelPat(id) {
  const t = LISTA_PADRAO_PAT.find(x => x.id === id);
  return t ? t.nome : id;
}

function aplicarFiltroPat() {
  patFiltroCache = {
    status: document.getElementById('pat-filtro-status')?.value || '',
    busca: document.getElementById('pat-filtro-busca')?.value || ''
  };
  renderPatTabela();
}
function limparFiltroPat() {
  ['pat-filtro-status','pat-filtro-busca'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  aplicarFiltroPat();
}

// ====== CSV export ======
function exportarPatCSV() {
  const f = patFiltroCache;
  const norm = s => (s||'').toString().toLowerCase();
  const busca = norm(f.busca);
  const statusMap = { disponivel: p => !p.motoboy, em_uso: p => !!p.motoboy, danificado: p => p.estado==='Danificado', perdido: p => p.estado==='Perdido' };
  const dados = patrimonios.filter(p => {
    if (f.tipo && p.tipo !== f.tipo) return false;
    if (f.status && !(statusMap[f.status] && statusMap[f.status](p))) return false;
    if (busca) { const hay = norm(p.codigo) + ' ' + norm(p.motoboy); if (!hay.includes(busca)) return false; }
    return true;
  });
  const header = ['Codigo','Tipo','Subtipo','Estado','Motoboy','DataEntrega'];
  const csv = [header.join(';')].concat(dados.map(p => [
    p.codigo, p.tipo, p.subtipo||'', p.estado||'', p.motoboy||'', p.dataEntrega||''
  ].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(';'))).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'patrimonios_' + getDataLocalSP() + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('📥 CSV exportado: ' + dados.length + ' itens');
}

function renderResumoPat() {
  const el = document.getElementById('pat-resumo-lista'); if (!el) return;
  const mbs = Object.keys(checklistsMotoboys);
  if (!mbs.length) { el.innerHTML = '<div class="empty">Nenhum checklist cadastrado</div>'; return; }
  el.innerHTML = mbs.map(mb => {
    const chk = checklistsMotoboys[mb] || {};
    const flt = LISTA_PADRAO_PAT.filter(t => !chk[t.id] || chk[t.id].na);
    const ok = flt.length === 0;
    return `<div style="background:#F8FBFD;border-radius:12px;border:1.5px solid #EBF1F5;padding:12px;margin-bottom:8px;cursor:pointer"
      onclick="this.querySelector('.mb-det').style.display=this.querySelector('.mb-det').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;font-weight:700;color:#0F4C7A">${mb}</span>
        ${ok ? '<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#E8F8F0;color:#0F9B78">✓ Completo</span>'
             : `<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#FEF9EC;color:#92400E">⚠️ ${flt.length} pendente(s)</span>`}
      </div>
      <div class="mb-det" style="display:none;margin-top:8px;border-top:1px solid #F0F4F8;padding-top:8px">
        ${LISTA_PADRAO_PAT.map(t => {
          const item = chk[t.id];
          const det  = item ? (t.codigo ? (item.codigo||'') : (item.qtd ? item.qtd+'un' : '')) : '';
          const cor  = item ? '#0F9B78' : '#92400E';
          const bg2  = item ? '#E8F8F0' : '#FEF9EC';
          const ico  = item ? '✓' : '!';
          return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;border-bottom:1px solid #F8FBFD">
            <div style="width:18px;height:18px;border-radius:50%;background:${bg2};color:${cor};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;flex-shrink:0">${ico}</div>
            <span style="flex:1;color:${item?'#0F4C7A':'#92400E'};font-weight:600">${t.icon} ${t.nome}</span>
            <span style="color:#8B5CF6;font-size:11px;font-weight:700">${det}</span></div>`;
        }).join('')}
      </div></div>`;
  }).join('');
}

function abrirModalPatCad(tipo) {
  const t = LISTA_PADRAO_PAT.find(x => x.id === tipo);
  const tituloEl = document.getElementById('pat-cad-titulo');
  const tipoEl   = document.getElementById('pat-cad-tipo');
  const codigoEl = document.getElementById('pat-cad-codigo');
  const subEl    = document.getElementById('pat-cad-subtipo-wrap');
  const msgEl    = document.getElementById('msg-pat-cad');
  const modalEl  = document.getElementById('modal-pat-cad');
  if(!modalEl) return; // modal não existe no HTML ainda
  if(tituloEl) tituloEl.textContent = '➕ Cadastrar ' + (t ? t.icon + ' ' + t.nome : 'Item');
  if(tipoEl)   tipoEl.value = tipo || '';
  if(codigoEl) codigoEl.value = '';
  // Mostra/oculta bloco de subtipo do Cartão
  if (subEl) subEl.style.display = tipo === 'cartao' ? 'block' : 'none';
  estadoPat = 'Novo'; subtipoPat2 = 'Definitivo';
  document.querySelectorAll('.estado-btn-pat').forEach((b, i) => {
    b.style.borderColor = i===0 ? '#0F9B78' : '#D6E5EE';
    b.style.background  = i===0 ? '#E8F8F0' : '#fff';
    b.style.color       = i===0 ? '#0F9B78' : '#5A7A8F';
  });
  if(msgEl) msgEl.textContent = '';
  modalEl.style.display = 'flex';
}

function selEstadoPat(btn, estado) {
  estadoPat = estado;
  const c = { Novo:'#0F9B78', Bom:'#1E9FD9', Danificado:'#DC2626' };
  const b = { Novo:'#E8F8F0', Bom:'#E8F4FB', Danificado:'#FCEBEB' };
  document.querySelectorAll('.estado-btn-pat').forEach(x => { x.style.borderColor='#D6E5EE'; x.style.background='#fff'; x.style.color='#5A7A8F'; });
  btn.style.borderColor = c[estado]; btn.style.background = b[estado]; btn.style.color = c[estado];
}

function mudarTipoPatCad() {
  // Mostrar/ocultar bloco de subtipo do Cartão
  const tipo = document.getElementById('pat-cad-tipo')?.value;
  const subEl = document.getElementById('pat-cad-subtipo-wrap');
  if (subEl) subEl.style.display = tipo === 'cartao' ? 'block' : 'none';
}

function selSubtipoPat(btn, sub) {
  subtipoPat2 = sub;
  document.querySelectorAll('.subtipo-btn-pat').forEach(b => { b.style.borderColor='#D6E5EE'; b.style.background='#fff'; b.style.color='#5A7A8F'; });
  btn.style.borderColor = '#8B5CF6'; btn.style.background = '#F3F0FF'; btn.style.color = '#5B21B6';
}

async function confirmarPatCad() {
  const tipo   = document.getElementById('pat-cad-tipo')?.value;
  const codigo = document.getElementById('pat-cad-codigo')?.value.trim().toUpperCase();
  const msgEl  = document.getElementById('msg-pat-cad');
  if (!tipo) { if(msgEl){msgEl.textContent='⚠️ Selecione o tipo'; msgEl.style.color='#DC2626';} return; }
  if (!codigo) { if(msgEl){msgEl.textContent='⚠️ Informe o código'; msgEl.style.color='#DC2626';} return; }
  if (patrimonios.find(p => p.codigo === codigo)) { if(msgEl){msgEl.textContent='⚠️ Código já cadastrado localmente'; msgEl.style.color='#DC2626';} return; }

  const novo = { id: Date.now(), tipo, codigo, subtipo: tipo==='cartao'?subtipoPat2:null, estado: estadoPat, motoboy: null, dataEntrega: null };
  patrimonios.push(novo);
  // Envia DIRETO para o backend (syncPatServer antigo enviava formato errado)
  try {
    const r = await fetch(API + '/patrimonios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patrimonio: novo })
    });
    const j = await r.json().catch(() => ({ status:'erro' }));
    if (j.status !== 'ok' || j.erros?.length) {
      if(msgEl){msgEl.textContent = '⚠️ Backend recusou: ' + (j.erros?.[0]?.motivo || j.msg || 'erro'); msgEl.style.color='#DC2626';}
      patrimonios = patrimonios.filter(p => p.id !== novo.id);
      return;
    }
  } catch(e) {
    if(msgEl){msgEl.textContent='⚠️ Erro de conexão (salvo só local): '+e.message; msgEl.style.color='#B45309';}
    // Mantém no localStorage para sincronizar depois
  }
  salvarPatLocal();
  renderEstoquePat(); renderEstoquePatEst();
  fecharModal('modal-pat-cad');
  toast('✓ ' + codigo + ' cadastrado!');
}

// ── Cadastro em massa de patrimônios (textarea, 1 código por linha) ──
function abrirPatCadMassa() {
  document.getElementById('modal-pat-cad').style.display = 'none';
  // Pré-seleciona o mesmo tipo que estava no modal unitário (se houver)
  const tipoAnterior = document.getElementById('pat-cad-tipo')?.value;
  if (tipoAnterior) {
    const sel = document.getElementById('pat-cad-massa-tipo');
    if (sel) sel.value = tipoAnterior;
    mudarTipoPatCadMassa(tipoAnterior);
  }
  const msg = document.getElementById('msg-pat-cad-massa');
  if (msg) { msg.textContent = ''; }
  const resumo = document.getElementById('pat-cad-massa-resumo');
  if (resumo) { resumo.textContent = ''; }
  document.getElementById('modal-pat-cad-massa').style.display = 'flex';
  setTimeout(() => document.getElementById('pat-cad-massa-codigos')?.focus(), 100);
}

function mudarTipoPatCadMassa(tipo) {
  const wrap = document.getElementById('pat-cad-massa-subtipo-wrap');
  if (wrap) wrap.style.display = tipo === 'cartao' ? 'block' : 'none';
}

async function confirmarPatCadMassa() {
  const tipo   = document.getElementById('pat-cad-massa-tipo')?.value;
  const estado = document.getElementById('pat-cad-massa-estado')?.value || 'Novo';
  const subtipo = document.getElementById('pat-cad-massa-subtipo')?.value || null;
  const texto  = document.getElementById('pat-cad-massa-codigos')?.value || '';
  const msgEl  = document.getElementById('msg-pat-cad-massa');
  const resumoEl = document.getElementById('pat-cad-massa-resumo');

  if (!tipo) { if(msgEl){msgEl.textContent='⚠️ Selecione o tipo'; msgEl.style.color='#DC2626';} return; }
  // Quebra por linha, remove vazios, normaliza pra UPPERCASE, remove duplicatas da própria lista
  const codigos = [...new Set(texto.split('\n').map(s => s.trim().toUpperCase()).filter(Boolean))];
  if (!codigos.length) { if(msgEl){msgEl.textContent='⚠️ Informe ao menos 1 código'; msgEl.style.color='#DC2626';} return; }
  // Filtra códigos já existentes (local)
  const jaExiste = codigos.filter(c => patrimonios.find(p => p.codigo === c));
  const novos = codigos.filter(c => !patrimonios.find(p => p.codigo === c));
  if (!novos.length) {
    if(msgEl){msgEl.textContent=`⚠️ Todos os ${codigos.length} códigos já estão cadastrados`; msgEl.style.color='#DC2626';}
    return;
  }

  if(msgEl){msgEl.textContent = `Enviando ${novos.length} códigos...`; msgEl.style.color='#5A7A8F';}

  const lote = novos.map(codigo => ({
    id: Date.now() + Math.floor(Math.random() * 100000),
    tipo,
    codigo,
    subtipo: tipo === 'cartao' ? subtipo : null,
    estado,
    motoboy: null,
    dataEntrega: null
  }));

  // Adiciona localmente primeiro (otimista)
  lote.forEach(p => patrimonios.push(p));

  try {
    const r = await fetch(API + '/patrimonios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lote })
    });
    const j = await r.json().catch(() => ({ status:'erro' }));
    if (j.status !== 'ok') {
      if(msgEl){msgEl.textContent='⚠️ Erro do backend: '+(j.msg||'desconhecido'); msgEl.style.color='#DC2626';}
      // Reverte inserção local
      const idsLote = new Set(lote.map(p => p.id));
      patrimonios = patrimonios.filter(p => !idsLote.has(p.id));
      return;
    }
    // Se backend reportou alguns como duplicados/ignorados, remove do local
    if (j.ignorados > 0 && j.erros?.length) {
      const codigosIgnorados = new Set(j.erros.map(e => e.codigo));
      patrimonios = patrimonios.filter(p => !codigosIgnorados.has(p.codigo));
    }
    salvarPatLocal();
    renderEstoquePat(); renderEstoquePatEst();
    // Limpa textarea
    const ta = document.getElementById('pat-cad-massa-codigos');
    if (ta) ta.value = '';
    const duplicatasTxt = jaExiste.length ? ` · ${jaExiste.length} já existiam` : '';
    if(msgEl){msgEl.textContent = `✓ ${j.inseridos} cadastrados${duplicatasTxt}`; msgEl.style.color='#0F9B78';}
    if (resumoEl) resumoEl.textContent = `${j.inseridos} inseridos · ${j.ignorados || 0} ignorados${duplicatasTxt}`;
    toast(`✓ ${j.inseridos} patrimônios cadastrados em massa!`);
  } catch(e) {
    if(msgEl){msgEl.textContent='⚠️ Erro de conexão (salvos só local): '+e.message; msgEl.style.color='#B45309';}
    salvarPatLocal();
  }
}

function abrirPatAdd(motoboy, tipoId) {
  patAddMotoboy = motoboy; patAddTipoAtual = tipoId; patAddCodigoSelecionado = null;
  const tituloEl = document.getElementById('pat-add-titulo');
  const tipoEl   = document.getElementById('pat-add-tipo');
  const dataEl   = document.getElementById('pat-add-data');
  const msgEl    = document.getElementById('msg-pat-add');
  const modalEl  = document.getElementById('modal-pat-add');
  if(!modalEl) return;
  if(tituloEl) tituloEl.textContent = '➕ Adicionar Item — ' + motoboy;
  if(tipoEl)   tipoEl.value = tipoId;
  if(dataEl)   dataEl.value = getDataLocalSP();
  if(msgEl)    msgEl.textContent = '';
  mudarTipoPatAdd(tipoId);
  modalEl.style.display = 'flex';
}

function mudarTipoPatAdd(tipo) {
  patAddTipoAtual = tipo; patAddCodigoSelecionado = null;
  const temCod = PAT_COM_COD.includes(tipo);
  const blocoC = document.getElementById('pat-add-bloco-codigo');
  const blocoS = document.getElementById('pat-add-bloco-simples');
  if(blocoC) blocoC.style.display = temCod ? 'block' : 'none';
  if(blocoS) blocoS.style.display = !temCod ? 'block' : 'none';
  if (temCod) {
    const disp = patrimonios.filter(p => p.tipo === tipo && !p.motoboy);
    const ec = { Novo:'#0F9B78', Bom:'#1E9FD9', Danificado:'#DC2626' };
    let html = disp.map(p => `<div onclick="selecionarPatDisp('${p.codigo}',this)" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid #D6E5EE;background:#fff;margin-bottom:6px;cursor:pointer">
      <div style="width:12px;height:12px;border-radius:50%;border:2px solid #D6E5EE;flex-shrink:0" class="radio-disp"></div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">${p.codigo}</div><div style="font-size:11px;color:${ec[p.estado]||'#5A7A8F'}">${p.estado}</div></div></div>`).join('');
    if (!disp.length) html = `<div style="padding:8px;font-size:12px;color:#94A8B8;text-align:center">Nenhum disponível no estoque</div>` + html;
    html += `<div onclick="toggleAddManual()" id="pat-add-manual-toggle" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px dashed #D6E5EE;background:#F8FBFD;cursor:pointer">
      <div style="width:12px;height:12px;border-radius:50%;border:2px solid #D6E5EE;flex-shrink:0" id="radio-manual-pat"></div>
      <span style="font-size:13px;font-weight:600;color:#5A7A8F">✏️ Digitar código manualmente</span></div>`;
    const dispEl = document.getElementById('pat-add-disponiveis');
    if(dispEl) dispEl.innerHTML = html;
    const mw = document.getElementById('pat-add-manual-wrap');
    if(mw) mw.style.display = 'none';
  }
}

function selecionarPatDisp(codigo, el) {
  patAddCodigoSelecionado = codigo;
  document.querySelectorAll('#pat-add-disponiveis .radio-disp').forEach(r => { r.style.background=''; r.style.borderColor='#D6E5EE'; });
  document.querySelectorAll('#pat-add-disponiveis > div').forEach(d => { d.style.borderColor='#D6E5EE'; d.style.background='#fff'; });
  el.style.borderColor = '#8B5CF6'; el.style.background = '#F3F0FF';
  el.querySelector('.radio-disp').style.background = '#8B5CF6';
  el.querySelector('.radio-disp').style.borderColor = '#8B5CF6';
  const mw = document.getElementById('pat-add-manual-wrap');
  if(mw) mw.style.display = 'none';
}

function toggleAddManual() {
  patAddCodigoSelecionado = 'manual';
  document.querySelectorAll('#pat-add-disponiveis .radio-disp').forEach(r => { r.style.background=''; r.style.borderColor='#D6E5EE'; });
  document.querySelectorAll('#pat-add-disponiveis > div').forEach(d => { d.style.borderColor='#D6E5EE'; d.style.background='#fff'; });
  const t = document.getElementById('pat-add-manual-toggle'); if (t) { t.style.borderColor='#8B5CF6'; t.style.background='#F3F0FF'; }
  const r = document.getElementById('radio-manual-pat'); if (r) { r.style.background='#8B5CF6'; r.style.borderColor='#8B5CF6'; }
  const mw = document.getElementById('pat-add-manual-wrap');
  if(mw) mw.style.display = 'block';
}

async function confirmarPatAdd() {
  const tipo    = document.getElementById('pat-add-tipo')?.value;
  const dataEl  = document.getElementById('pat-add-data');
  const data    = dataEl ? dataEl.value : '';
  const msgEl   = document.getElementById('msg-pat-add');
  const motoboy = patAddMotoboy;
  if (!tipo)    { if(msgEl){msgEl.textContent='⚠️ Selecione o item'; msgEl.style.color='#DC2626';} return; }
  if (!motoboy) { if(msgEl){msgEl.textContent='⚠️ Selecione o motoboy'; msgEl.style.color='#DC2626';} return; }
  if (!checklistsMotoboys[motoboy]) checklistsMotoboys[motoboy] = {};
  const dataFmt = data ? new Date(data).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  if (PAT_COM_COD.includes(tipo)) {
    if (!patAddCodigoSelecionado) { if(msgEl){msgEl.textContent='⚠️ Selecione ou digite o código'; msgEl.style.color='#DC2626';} return; }
    let cod = patAddCodigoSelecionado;
    if (cod === 'manual') {
      const cmEl = document.getElementById('pat-add-codigo-manual');
      cod = (cmEl?.value||'').trim().toUpperCase();
      if (!cod) { if(msgEl){msgEl.textContent='⚠️ Digite o código'; msgEl.style.color='#DC2626';} return; }
      if (!patrimonios.find(p => p.codigo===cod)) {
        const estEl = document.getElementById('pat-add-estado-manual');
        const est = estEl ? estEl.value : 'Novo';
        patrimonios.push({ id:Date.now(), tipo, codigo:cod, subtipo:null, estado:est, motoboy, dataEntrega:dataFmt });
      } else { const p=patrimonios.find(x=>x.codigo===cod); if(p){p.motoboy=motoboy;p.dataEntrega=dataFmt;} }
    } else { const p=patrimonios.find(x=>x.codigo===cod); if(p){p.motoboy=motoboy;p.dataEntrega=dataFmt;} }
    checklistsMotoboys[motoboy][tipo] = { codigo:cod, data:dataFmt };
  } else {
    const qtdEl = document.getElementById('pat-add-qtd');
    const qtd = parseInt(qtdEl?.value)||1;
    if (!patrimoniosSimples[tipo]) patrimoniosSimples[tipo]={total:0,vinculados:0};
    patrimoniosSimples[tipo].vinculados=(patrimoniosSimples[tipo].vinculados||0)+qtd;
    checklistsMotoboys[motoboy][tipo]={ qtd, data:dataFmt };
  }
  await syncPatServer();
  fecharModal('modal-pat-add');
  carregarChecklistEstMotoboy(motoboy); renderEstoquePat();
  toast('✓ Item adicionado!');
}

function abrirModalSubst(id) {
  const p = patrimonios.find(x => x.id===id); if(!p) return;
  substPatId=id; substPatSelecionado=null;
  const tituloEl = document.getElementById('subst-titulo');
  const infoEl   = document.getElementById('subst-info');
  const dispEl   = document.getElementById('subst-disponiveis');
  const msgEl    = document.getElementById('msg-subst');
  const modalEl  = document.getElementById('modal-pat-subst');
  if(!modalEl) return;
  if(tituloEl) tituloEl.textContent='↔ Substituir '+p.codigo;
  if(infoEl)   infoEl.innerHTML=`Substituindo <strong style="color:#8B5CF6">${p.codigo}</strong> de <strong style="color:#0F4C7A">${p.motoboy}</strong>`;
  const disp = patrimonios.filter(x=>x.tipo===p.tipo&&!x.motoboy);
  const ec={Novo:'#0F9B78',Bom:'#1E9FD9',Danificado:'#DC2626'};
  let html=disp.map(d=>`<div onclick="selecionarSubst('${d.codigo}',this)" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid #D6E5EE;background:#fff;margin-bottom:6px;cursor:pointer">
    <div style="width:12px;height:12px;border-radius:50%;border:2px solid #D6E5EE;flex-shrink:0" class="radio-subst"></div>
    <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">${d.codigo}</div><div style="font-size:11px;color:${ec[d.estado]||'#5A7A8F'}">${d.estado}</div></div></div>`).join('');
  html+=`<div onclick="selecionarSubst('__manual__',this)" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px dashed #D6E5EE;background:#F8FBFD;cursor:pointer">
    <div style="width:12px;height:12px;border-radius:50%;border:2px solid #D6E5EE;flex-shrink:0" class="radio-subst"></div>
    <span style="font-size:13px;font-weight:600;color:#5A7A8F">✏️ Digitar código novo</span></div>
  <div id="subst-manual-wrap" style="display:none;margin-top:8px">
    <input type="text" id="subst-codigo-novo" placeholder="Ex: BAU-005" style="width:100%;border-radius:10px;border:1.5px solid #D6E5EE;padding:10px 12px;font-size:14px;outline:none;color:#0F4C7A"/></div>`;
  if(dispEl)  dispEl.innerHTML=html;
  if(msgEl)   msgEl.textContent='';
  modalEl.style.display='flex';
}

function selecionarSubst(codigo, el) {
  substPatSelecionado=codigo;
  document.querySelectorAll('#subst-disponiveis .radio-subst').forEach(r=>{r.style.background='';r.style.borderColor='#D6E5EE';});
  document.querySelectorAll('#subst-disponiveis > div').forEach(d=>{d.style.borderColor='#D6E5EE';d.style.background='#F8FBFD';});
  el.style.borderColor='#8B5CF6'; el.style.background='#F3F0FF';
  el.querySelector('.radio-subst').style.background='#8B5CF6'; el.querySelector('.radio-subst').style.borderColor='#8B5CF6';
  const mw=document.getElementById('subst-manual-wrap'); if(mw) mw.style.display=codigo==='__manual__'?'block':'none';
}

async function confirmarSubstituicao() {
  const msgEl=document.getElementById('msg-subst');
  if(!substPatSelecionado){if(msgEl){msgEl.textContent='⚠️ Selecione o substituto';msgEl.style.color='#DC2626';}return;}
  const pAnt=patrimonios.find(x=>x.id===substPatId); if(!pAnt) return;
  const motivoEl=document.getElementById('subst-motivo');
  const motivo=motivoEl?motivoEl.value:'Danificado';
  const motoboy=pAnt.motoboy, hoje=new Date().toLocaleDateString('pt-BR');
  let cod=substPatSelecionado;
  if(cod==='__manual__'){
    const cnEl=document.getElementById('subst-codigo-novo');
    cod=(cnEl?.value||'').trim().toUpperCase();
    if(!cod){if(msgEl){msgEl.textContent='⚠️ Digite o código';msgEl.style.color='#DC2626';}return;}
    if(!patrimonios.find(p=>p.codigo===cod)) patrimonios.push({id:Date.now(),tipo:pAnt.tipo,codigo:cod,subtipo:pAnt.subtipo,estado:'Novo',motoboy,dataEntrega:hoje});
  }
  pAnt.estado=motivo==='Perda'?'Perda':'Danificado'; pAnt.motoboy=null; pAnt.dataEntrega=null;
  const pN=patrimonios.find(x=>x.codigo===cod); if(pN){pN.motoboy=motoboy;pN.dataEntrega=hoje;}
  if(checklistsMotoboys[motoboy]) Object.keys(checklistsMotoboys[motoboy]).forEach(k=>{
    if(checklistsMotoboys[motoboy][k]?.codigo===pAnt.codigo){checklistsMotoboys[motoboy][k].codigo=cod;checklistsMotoboys[motoboy][k].data=hoje;}
  });
  await syncPatServer();
  fecharModal('modal-pat-subst');
  renderEstoquePat(); renderEstoquePatEst();
  adicionarHistorico({tipo:'troca',motoboy,item:pAnt.codigo,substituto:cod,motivo,data:hoje});
  toast(`✓ ${pAnt.codigo} substituído por ${cod}!`);
}

function excluirPatEstoque(id) {
  if(!confirm('Remover este item do cadastro?')) return;
  patrimonios=patrimonios.filter(x=>x.id!==id);
  syncPatServer(); renderEstoquePat(); renderEstoquePatEst();
  toast('✓ Item removido');
}

async function vincularPatEstoque(id) {
  // Redirecionado para o novo modal
  abrirModalVincular(id);
}

async function devolverPat(id) {
  if(!confirm('Confirmar devolução?')) return;
  const p=patrimonios.find(x=>x.id===id); if(!p) return;
  if(p.motoboy&&checklistsMotoboys[p.motoboy]){
    const chk=checklistsMotoboys[p.motoboy];
    Object.keys(chk).forEach(k=>{if(chk[k]&&chk[k].codigo===p.codigo)delete chk[k];});
  }
  p.motoboy=null; p.dataEntrega=null;
  await syncPatServer(); renderEstoquePat(); renderEstoquePatEst();
  toast('✓ Devolvido ao estoque');
}

function removerItemChecklist(motoboy, tipoId) {
  if(!confirm('Remover este item?')) return;
  if(checklistsMotoboys[motoboy]){
    const item=checklistsMotoboys[motoboy][tipoId];
    if(item&&item.codigo){const p=patrimonios.find(x=>x.codigo===item.codigo);if(p){p.motoboy=null;p.dataEntrega=null;}}
    delete checklistsMotoboys[motoboy][tipoId];
  }
  syncPatServer(); carregarChecklistEstMotoboy(motoboy);
}

function marcarNA(motoboy, tipoId) {
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  checklistsMotoboys[motoboy][tipoId]={na:true};
  syncPatServer(); carregarChecklistEstMotoboy(motoboy);
}

function mudarTabPat(tab, btn) {
  ['estoque','motoboy','relatorios'].forEach(t => {
    const el = document.getElementById('pat-tab-'+t);
    if(el) el.style.display = t===tab ? 'block' : 'none';
    const b = document.getElementById('pat-tab-btn-'+t);
    if(b) {
      b.style.background  = t===tab ? '#0F4C7A' : 'transparent';
      b.style.color       = t===tab ? '#fff'    : '#5A7A8F';
    }
  });
  if(tab==='motoboy') {
    const sel = document.getElementById('pat-sel-motoboy');
    if(sel && sel.options.length <= 1) {
      fetch(API + '/motoboys?todos=1&agrupado=1').then(r=>r.json()).then(d=>{
        const nomes = [...new Set((d.motoboys||[]).map(m=>m.nome))].sort();
        nomes.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
      }).catch(()=>{});
    }
  }
  if(tab==='relatorios') mudarRelPat('mov');
}

let relPatAtual = 'mov';
function mudarRelPat(rel, btn) {
  relPatAtual = rel;
  ['pormotoboy','mov','alertas'].forEach(r => {
    const b = document.getElementById('pat-rel-btn-'+r);
    if(b) {
      const active = r===rel;
      b.style.background = active ? '#F3F0FF' : '#fff';
      b.style.color      = active ? '#5B21B6' : '#5A7A8F';
      b.style.borderColor= active ? '#8B5CF6' : '#D6E5EE';
    }
  });
  const el = document.getElementById('pat-rel-conteudo'); if(!el) return;
  if(rel==='pormotoboy') renderRelPorMotoboy();
  if(rel==='mov')        renderRelMovimentacoes();
  if(rel==='alertas')    renderRelAlertas();
}

// ============================================================
// 4 RELATÓRIOS
// ============================================================
function renderRelOndeEsta() {
  const el = document.getElementById('pat-rel-conteudo'); if (!el) return;
  const grupos = {};
  patrimonios.forEach(p => {
    const chave = p.motoboy ? '👤 '+p.motoboy : '📦 Estoque';
    if(!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(p);
  });
  const ordem = Object.keys(grupos).sort((a,b) => {
    if(a==='📦 Estoque') return -1; if(b==='📦 Estoque') return 1;
    return a.localeCompare(b);
  });
  if(!ordem.length) { el.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#94A8B8">Nenhum item cadastrado.</div>'; return; }
  el.innerHTML = ordem.map(chave => {
    const itens = grupos[chave];
    const rows = itens.map(p => {
      const cfg = patEstadoCfg(p.motoboy?'Em uso':p.estado);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-top:1px solid #F0F4F8">
        <div style="flex:1">
          <span style="font-size:12px;font-weight:800;color:#8B5CF6;background:#F3F0FF;padding:2px 8px;border-radius:20px">${p.codigo}</span>
          <span style="font-size:11px;color:#5A7A8F;margin-left:6px">${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}${p.subtipo?' · '+p.subtipo:''}</span>
        </div>
        <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${cfg.bg};color:${cfg.cor}">${p.motoboy?'Em uso':p.estado}</span>
      </div>`;
    }).join('');
    return `<div style="background:#fff;border-radius:10px;border:1px solid #EBF1F5;margin-bottom:8px;overflow:hidden">
      <div style="padding:9px 12px;background:#F8FBFD;font-size:12px;font-weight:700;color:#0F4C7A">${chave} <span style="font-size:10px;color:#5A7A8F;font-weight:500">(${itens.length})</span></div>
      ${rows}
    </div>`;
  }).join('');
}

function renderRelPorMotoboy() {
  const el = document.getElementById('pat-rel-conteudo'); if (!el) return;
  const mbs = {};
  patrimonios.filter(p => p.motoboy).forEach(p => { if(!mbs[p.motoboy]) mbs[p.motoboy]=[]; mbs[p.motoboy].push(p); });
  const nomes = Object.keys(mbs).sort();
  if(!nomes.length) { el.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#94A8B8">Nenhum motoboy com item vinculado.</div>'; return; }
  el.innerHTML = nomes.map(mb => {
    const itens = mbs[mb];
    const rows = itens.map(p => {
      const cfg = patEstadoCfg(p.estado);
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-top:1px solid #F0F4F8">
        <div style="flex:1">
          <span style="font-size:12px;font-weight:800;color:#8B5CF6;background:#F3F0FF;padding:2px 8px;border-radius:20px">${p.codigo}</span>
          <span style="font-size:11px;color:#5A7A8F;margin-left:6px">${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${cfg.bg};color:${cfg.cor}">${p.estado}</div>
          <div style="font-size:10px;color:#94A8B8;margin-top:2px">desde ${p.dataEntrega||'—'}</div>
        </div>
      </div>`;
    }).join('');
    return `<div style="background:#fff;border-radius:10px;border:1px solid #EBF1F5;margin-bottom:8px;overflow:hidden">
      <div style="padding:9px 12px;background:#F3F0FF;font-size:13px;font-weight:800;color:#5B21B6">👤 ${mb} <span style="font-size:11px;color:#5A7A8F;font-weight:500">(${itens.length} item${itens.length>1?'s':''})</span></div>
      ${rows}
    </div>`;
  }).join('');
}

let cacheMovPat = null;
async function renderRelMovimentacoes() {
  const el = document.getElementById('pat-rel-conteudo'); if (!el) return;
  el.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:#94A8B8">Carregando movimentações...</div>';
  try {
    const r = await fetch(API + '/patrimonios/movimentacoes?limite=500');
    const d = await r.json();
    cacheMovPat = d.movimentacoes || [];
    if(!cacheMovPat.length) { el.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#94A8B8">Nenhuma movimentação registrada ainda.</div>'; return; }
    const tipoLabel = { vinculado:'📤 Vinculação', devolvido:'↩ Devolução', transferido:'⤴ Transferência', substituido:'↔ Substituição', descartado:'🗑 Descarte' };
    const tipoBg    = { vinculado:'#E8F4FB', devolvido:'#E8F8F0', transferido:'#FEF3C7', substituido:'#FCEBEB', descartado:'#F3F4F6' };
    const tipoCor   = { vinculado:'#1E9FD9', devolvido:'#0F9B78', transferido:'#92400E', substituido:'#DC2626', descartado:'#5A7A8F' };
    el.innerHTML = cacheMovPat.map(m => {
      const bg  = tipoBg[m.tipo]  || '#F3F4F6';
      const cor = tipoCor[m.tipo] || '#5A7A8F';
      const fluxo = m.tipo==='vinculado' ? `Estoque → <b>${m.motoboy_destino||'—'}</b>`
                  : m.tipo==='devolvido' ? `<b>${m.motoboy_origem||'—'}</b> → Estoque`
                  : m.tipo==='transferido' ? `<b>${m.motoboy_origem||'—'}</b> → <b>${m.motoboy_destino||'—'}</b>`
                  : m.tipo==='substituido' ? `<b>${m.item_codigo}</b> sai de <b>${m.motoboy_origem||'Estoque'}</b>, entra <b>${m.item_substituto||'—'}</b>`
                  : m.tipo;
      return `<div style="background:#fff;border-radius:10px;border:1px solid #EBF1F5;margin-bottom:6px;padding:10px 12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:12px;font-weight:800;color:#0F4C7A">${m.item_codigo||'—'} <span style="font-size:10px;color:#5A7A8F;font-weight:500">· ${patIcone(m.item_tipo)} ${tipoLabelPat(m.item_tipo||'')}</span></div>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${bg};color:${cor}">${tipoLabel[m.tipo]||m.tipo}</span>
        </div>
        <div style="font-size:12px;color:#5A7A8F">${fluxo}</div>
        <div style="font-size:10px;color:#94A8B8;margin-top:3px">${m.data||''} ${m.motivo?'· '+m.motivo:''} ${m.usuario?'· '+m.usuario:''}</div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#DC2626">❌ Erro ao carregar movimentações</div>';
  }
}

function renderRelAlertas() {
  const el = document.getElementById('pat-rel-conteudo'); if (!el) return;
  const perdidos  = patrimonios.filter(p => p.estado === 'Perdido');
  const danif     = patrimonios.filter(p => p.estado === 'Danificado');
  // Parados há mais de 90 dias
  const parseBR = s => { if(!s) return null; const p=s.split('/'); if(p.length!==3) return null; return new Date(p[2],p[1]-1,p[0]).getTime(); };
  const agora = Date.now();
  const limite = agora - 90*24*60*60*1000;
  const parados = patrimonios.filter(p => p.motoboy && p.dataEntrega && parseBR(p.dataEntrega) && parseBR(p.dataEntrega) < limite);
  const tot = perdidos.length + danif.length + parados.length;
  if(!tot) { el.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:#0F9B78">✓ Nenhum alerta no momento.</div>'; return; }
  const bloco = (titulo, icone, cor, bg, lista) => {
    if(!lista.length) return '';
    return `<div style="background:#fff;border-radius:10px;border:1px solid #EBF1F5;margin-bottom:8px;overflow:hidden">
      <div style="padding:9px 12px;background:${bg};font-size:13px;font-weight:800;color:${cor}">${icone} ${titulo} (${lista.length})</div>
      ${lista.map(p => {
        const cfg = patEstadoCfg(p.estado);
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-top:1px solid #F0F4F8">
          <div style="flex:1">
            <span style="font-size:12px;font-weight:800;color:#8B5CF6;background:#F3F0FF;padding:2px 8px;border-radius:20px">${p.codigo}</span>
            <span style="font-size:11px;color:#5A7A8F;margin-left:6px">${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}</span>
            ${p.motoboy?`<span style="font-size:11px;color:#0F4C7A;font-weight:700;margin-left:6px">👤 ${p.motoboy}</span>`:''}
            ${p.dataEntrega?`<span style="font-size:10px;color:#94A8B8;margin-left:6px">desde ${p.dataEntrega}</span>`:''}
          </div>
          <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${cfg.bg};color:${cfg.cor}">${p.estado}</span>
        </div>`;
      }).join('')}
    </div>`;
  };
  el.innerHTML =
    bloco('Itens perdidos', '❌', '#DC2626', '#FCEBEB', perdidos) +
    bloco('Itens danificados', '⚠️', '#92400E', '#FEF9EC', danif) +
    bloco('Vinculados há mais de 90 dias', '⏰', '#5A7A8F', '#F3F4F6', parados);
}

// ============================================================
// 4 MODAIS DE MOVIMENTAÇÃO
// ============================================================
let patMovAtual = null;

function carregarSelectMotoboys(idSelect, excluir) {
  const sel = document.getElementById(idSelect); if (!sel) return;
  sel.innerHTML = '<option value="">Selecione...</option>';
  fetch(API + '/motoboys?todos=1&agrupado=1').then(r=>r.json()).then(d=>{
    const nomes = [...new Set((d.motoboys||[]).map(m=>m.nome))].filter(n => n !== excluir);
    nomes.sort().forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
  }).catch(()=>{ toast('❌ Erro ao carregar motoboys'); });
}

function abrirModalVincular(id) {
  const p = patrimonios.find(x => x.id===id); if(!p) return;
  patMovAtual = { id, tipo:'vinculado', codigo:p.codigo, itemTipo:p.tipo, subtipo:p.subtipo, motoboyOrigem:null, itemSubstituto:null };
  const infoEl = document.getElementById('pat-vinc-codigo');
  if(infoEl) infoEl.innerHTML = `<b style="color:#5B21B6">${p.codigo}</b> · ${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}${p.subtipo?' · '+p.subtipo:''}`;
  carregarSelectMotoboys('pat-vinc-motoboy', null);
  const dataEl = document.getElementById('pat-vinc-data'); if(dataEl) dataEl.value = getDataLocalSP();
  const obsEl = document.getElementById('pat-vinc-obs'); if(obsEl) obsEl.value = '';
  document.getElementById('modal-pat-vincular').style.display = 'flex';
}

async function confirmarVincular() {
  const motoboy = document.getElementById('pat-vinc-motoboy')?.value;
  if(!motoboy) { toast('⚠️ Selecione um motoboy'); return; }
  if(!patMovAtual) return;
  const data = document.getElementById('pat-vinc-data')?.value;
  const obs  = document.getElementById('pat-vinc-obs')?.value?.trim();
  const dataBR = data ? data.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR');
  await registrarMovimentacao(patMovAtual.id, {
    tipo: 'vinculado',
    motoboy: motoboy.toUpperCase(),
    dataEntrega: dataBR,
    estado: 'Bom',
    movimento: {
      tipo: 'vinculado',
      item_codigo: patMovAtual.codigo,
      item_tipo: patMovAtual.itemTipo,
      item_subtipo: patMovAtual.subtipo,
      motoboy_origem: null,
      motoboy_destino: motoboy.toUpperCase(),
      item_substituto: null,
      motivo: obs || 'Vinculação inicial',
      usuario: 'admin'
    }
  });
  fecharModalPatMov();
  toast('✓ ' + patMovAtual.codigo + ' vinculado a ' + motoboy);
}

function abrirModalDevolver(id) {
  const p = patrimonios.find(x => x.id===id); if(!p) return;
  patMovAtual = { id, tipo:'devolvido', codigo:p.codigo, itemTipo:p.tipo, subtipo:p.subtipo, motoboyOrigem:p.motoboy };
  const infoEl = document.getElementById('pat-dev-codigo');
  if(infoEl) infoEl.innerHTML = `<b style="color:#92400E">${p.codigo}</b> · ${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)} <br><span style="font-size:11px">De: <b>${p.motoboy||'—'}</b> → Para: <b style="color:#0F9B78">Estoque</b></span>`;
  document.getElementById('pat-dev-motivo').value = '';
  document.getElementById('pat-dev-estado').value = 'bom';
  document.getElementById('pat-dev-obs').value = '';
  document.getElementById('modal-pat-devolver').style.display = 'flex';
}

async function confirmarDevolver() {
  if(!patMovAtual) return;
  if(!confirm('Confirmar devolução de ' + patMovAtual.codigo + ' ao estoque?')) return;
  const motivo = document.getElementById('pat-dev-motivo')?.value || 'Devolução normal';
  const estado = document.getElementById('pat-dev-estado')?.value || 'bom';
  const obs    = document.getElementById('pat-dev-obs')?.value?.trim();
  const estadoLabel = estado==='bom' ? 'Bom' : estado==='danificado' ? 'Danificado' : 'Perdido';
  await registrarMovimentacao(patMovAtual.id, {
    tipo: 'devolvido',
    motoboy: null,
    dataEntrega: null,
    estado: estadoLabel,
    movimento: {
      tipo: 'devolvido',
      item_codigo: patMovAtual.codigo,
      item_tipo: patMovAtual.itemTipo,
      item_subtipo: patMovAtual.subtipo,
      motoboy_origem: patMovAtual.motoboyOrigem,
      motoboy_destino: null,
      item_substituto: null,
      motivo: obs ? motivo + ' — ' + obs : motivo,
      usuario: 'admin'
    }
  });
  fecharModalPatMov();
  toast('↩ ' + patMovAtual.codigo + ' devolvido ao estoque');
}

function abrirModalTransferir(id) {
  const p = patrimonios.find(x => x.id===id); if(!p) return;
  patMovAtual = { id, tipo:'transferido', codigo:p.codigo, itemTipo:p.tipo, subtipo:p.subtipo, motoboyOrigem:p.motoboy };
  const infoEl = document.getElementById('pat-tr-codigo');
  if(infoEl) infoEl.innerHTML = `<b style="color:#1E9FD9">${p.codigo}</b> · ${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}<br><span style="font-size:11px">De: <b>${p.motoboy||'—'}</b> → Para: <b style="color:#1E9FD9">novo motoboy</b></span>`;
  carregarSelectMotoboys('pat-tr-destino', p.motoboy);
  const dataEl = document.getElementById('pat-tr-data'); if(dataEl) dataEl.value = getDataLocalSP();
  const obsEl = document.getElementById('pat-tr-obs'); if(obsEl) obsEl.value = '';
  document.getElementById('modal-pat-transferir').style.display = 'flex';
}

async function confirmarTransferir() {
  if(!patMovAtual) return;
  const destino = document.getElementById('pat-tr-destino')?.value;
  if(!destino) { toast('⚠️ Selecione o motoboy destino'); return; }
  if(destino.toUpperCase() === (patMovAtual.motoboyOrigem||'').toUpperCase()) { toast('⚠️ Destino igual à origem'); return; }
  const data = document.getElementById('pat-tr-data')?.value;
  const obs  = document.getElementById('pat-tr-obs')?.value?.trim();
  const dataBR = data ? data.split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR');
  await registrarMovimentacao(patMovAtual.id, {
    tipo: 'transferido',
    motoboy: destino.toUpperCase(),
    dataEntrega: dataBR,
    estado: 'Bom',
    movimento: {
      tipo: 'transferido',
      item_codigo: patMovAtual.codigo,
      item_tipo: patMovAtual.itemTipo,
      item_subtipo: patMovAtual.subtipo,
      motoboy_origem: patMovAtual.motoboyOrigem,
      motoboy_destino: destino.toUpperCase(),
      item_substituto: null,
      motivo: obs || 'Transferência',
      usuario: 'admin'
    }
  });
  fecharModalPatMov();
  toast('⤴ ' + patMovAtual.codigo + ' transferido para ' + destino);
}

function abrirModalSubstituir(id) {
  const p = patrimonios.find(x => x.id===id); if(!p) return;
  patMovAtual = { id, tipo:'substituido', codigo:p.codigo, itemTipo:p.tipo, subtipo:p.subtipo, motoboyOrigem:p.motoboy };
  const novos = patrimonios.filter(x => x.tipo===p.tipo && x.id!==p.id && !x.motoboy && x.estado!=='Perdido');
  const sel = document.getElementById('pat-sub-novo');
  if(sel) {
    sel.innerHTML = novos.length
      ? '<option value="">Selecione...</option>' + novos.map(n => `<option value="${n.id}">${n.codigo}${n.subtipo?' · '+n.subtipo:''} (${n.estado})</option>`).join('')
      : '<option value="">Nenhum item disponível do mesmo tipo</option>';
  }
  const infoEl = document.getElementById('pat-sub-origem');
  if(infoEl) infoEl.innerHTML = `<b style="color:#DC2626">${p.codigo}</b> · ${patIcone(p.tipo)} ${tipoLabelPat(p.tipo)}${p.subtipo?' · '+p.subtipo:''} <br><span style="font-size:11px">De: <b>${p.motoboy||'Estoque'}</b> · <span style="color:#DC2626">saí de circulação</span></span>`;
  document.getElementById('pat-sub-motivo').value = 'Danificado';
  document.getElementById('pat-sub-obs').value = '';
  document.getElementById('modal-pat-substituir').style.display = 'flex';
}

async function confirmarSubstituir() {
  if(!patMovAtual) return;
  const novoId = document.getElementById('pat-sub-novo')?.value;
  if(!novoId) { toast('⚠️ Selecione o item substituto'); return; }
  const novo = patrimonios.find(x => x.id==novoId); if(!novo) { toast('❌ Item substituto não encontrado'); return; }
  const motivo = document.getElementById('pat-sub-motivo')?.value || 'Substituição';
  const obs    = document.getElementById('pat-sub-obs')?.value?.trim();
  // 1) item velho sai de circulação
  const velho = patrimonios.find(x => x.id===patMovAtual.id);
  const velhoEstadoFinal = motivo==='Perda' ? 'Perdido' : motivo==='Manutenção' ? 'Danificado' : velho.estado;
  await registrarMovimentacao(patMovAtual.id, {
    tipo: 'substituido',
    motoboy: null,
    dataEntrega: null,
    estado: velhoEstadoFinal,
    movimento: {
      tipo: 'substituido',
      item_codigo: patMovAtual.codigo,
      item_tipo: patMovAtual.itemTipo,
      item_subtipo: patMovAtual.subtipo,
      motoboy_origem: patMovAtual.motoboyOrigem,
      motoboy_destino: null,
      item_substituto: novo.codigo,
      motivo: obs ? motivo + ' — ' + obs : motivo,
      usuario: 'admin'
    }
  });
  // 2) item novo entra no lugar (mesmo motoboy, data de hoje)
  if(patMovAtual.motoboyOrigem) {
    const dataBR = new Date().toLocaleDateString('pt-BR');
    await registrarMovimentacao(novo.id, {
      tipo: 'vinculado',
      motoboy: patMovAtual.motoboyOrigem,
      dataEntrega: dataBR,
      estado: 'Bom',
      movimento: {
        tipo: 'vinculado',
        item_codigo: novo.codigo,
        item_tipo: novo.tipo,
        item_subtipo: novo.subtipo,
        motoboy_origem: null,
        motoboy_destino: patMovAtual.motoboyOrigem,
        item_substituto: null,
        motivo: 'Substituição de ' + patMovAtual.codigo,
        usuario: 'admin'
      }
    });
  }
  fecharModalPatMov();
  toast('↔ ' + patMovAtual.codigo + ' substituído por ' + novo.codigo);
}

function fecharModalPatMov() {
  ['modal-pat-vincular','modal-pat-devolver','modal-pat-transferir','modal-pat-substituir'].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display = 'none';
  });
  patMovAtual = null;
}

// Helper unificado: PATCH + atualiza estado local
async function registrarMovimentacao(patId, payload) {
  const p = patrimonios.find(x => x.id===patId);
  if(!p) return;
  // 1) atualiza local
  p.motoboy = payload.motoboy || null;
  p.dataEntrega = payload.dataEntrega || null;
  p.estado = payload.estado || p.estado;
  // 2) PATCH no servidor (com movimento embutido)
  try {
    await fetch(API + '/patrimonios/' + patId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motoboy: payload.motoboy,
        dataEntrega: payload.dataEntrega,
        estado: payload.estado,
        movimento: payload.movimento
      })
    });
  } catch(e) {
    // servidor offline: já atualizou local, syncPatServer() cuida depois
  }
  await syncPatServer();
  renderEstoquePat();
  renderEstoquePatEst();
}

async function iniciarPatrimonios() {
  if(!patrimonios.length && !Object.keys(patrimoniosSimples).length) await carregarPatrimonios();
  if(!Object.keys(estoqueUnif).length) await carregarUniformes();

  const sel = document.getElementById('pat-sel-motoboy');
  if(sel && sel.options.length <= 1) {
    try {
      const r = await fetch(API+'/motoboys?todos=1&agrupado=1');
      const d = await r.json();
      const nomes = [...new Set((d.motoboys||[]).map(m=>m.nome))].sort();
      nomes.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
    } catch(e) {}
  }

  const selChk = document.getElementById('chk-download-motoboy');
  if(selChk && selChk.options.length <= 1) {
    try {
      const r = await fetch(API+'/motoboys?todos=1&agrupado=1');
      const d = await r.json();
      const nomes = [...new Set((d.motoboys||[]).map(m=>m.nome))].sort();
      nomes.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; selChk.appendChild(o); });
    } catch(e) {}
  }

  const dataEl = document.getElementById('chk-download-data');
  if(dataEl && !dataEl.value) dataEl.value = getDataLocalSP();
  renderEstoquePat();
  renderUniformesPat();
  renderEstoqueSimplesEst();
  renderResumoPat();
}

function renderUniformesPat() {
  const el = document.getElementById('pat-uniformes-lista');
  if(!el) return;
  const tipos = LISTA_PADRAO_PAT.filter(t => !t.codigo && t.tamanho);
  el.innerHTML = tipos.map(tipo => {
    const tamHtml = ['P','M','G','GG'].map(tam => {
      const qtd = (estoqueUnif[tipo.id] && estoqueUnif[tipo.id][tam]) || 0;
      const bg = qtd===0?'#FCEBEB':qtd<=2?'#FEF9EC':'#F8FBFD';
      const tc = qtd===0?'#DC2626':qtd<=2?'#92400E':'#0F4C7A';
      return `<div onclick="editarQtdUnif('${tipo.id}','${tam}',${qtd})"
        style="text-align:center;border-radius:8px;padding:8px 4px;border:1.5px solid #EBF1F5;background:${bg};cursor:pointer" title="Clique para editar">
        <div style="font-size:10px;font-weight:700;color:#94A8B8">${tam}</div>
        <div style="font-size:17px;font-weight:800;color:${tc}">${qtd}</div>
        <div style="font-size:8px;color:#94A8B8">✏️</div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:10px">
      <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-bottom:6px">${tipo.icon} ${tipo.nome}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${tamHtml}</div>
    </div>`;
  }).join('');
}

async function downloadChecklistPDF() {
  const dataEl = document.getElementById('chk-download-data');
  const mbEl   = document.getElementById('chk-download-motoboy');
  const msgEl  = document.getElementById('msg-chk-download');

  if(!dataEl || !dataEl.value) {
    if(msgEl){ msgEl.className='msg error'; msgEl.textContent='⚠️ Selecione a data'; }
    else toast('⚠️ Selecione a data');
    return;
  }

  const data    = dataEl.value;
  const motoboy = mbEl ? mbEl.value : '';
  const dataFmt = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');

  if(msgEl){ msgEl.className='msg loading'; msgEl.textContent='⏳ Buscando checklists...'; }

  try {
    const r = await fetch(API + '/checklist?data=' + encodeURIComponent(dataFmt));
    const d = await r.json();
    let lista = d.checklists || [];
    if(motoboy) lista = lista.filter(c => c.biocondutor === motoboy);
    if(!lista.length) {
      if(msgEl){ msgEl.className='msg error'; msgEl.textContent='⚠️ Nenhum checklist encontrado para essa data'; }
      else toast('⚠️ Nenhum checklist encontrado');
      return;
    }
    if(msgEl) msgEl.textContent = '⏳ Gerando PDF...';
    gerarPDFChecklists(lista, dataFmt, motoboy);
    if(msgEl){ msgEl.className='msg success'; msgEl.textContent='✓ PDF gerado!'; }
    toast('✓ PDF gerado!');
    setTimeout(() => { if(msgEl){ msgEl.className='msg'; msgEl.textContent=''; } }, 3000);
  } catch(e) {
    if(msgEl){ msgEl.className='msg error'; msgEl.textContent='Erro de conexão'; }
    else toast('Erro de conexão');
  }
}

function gerarPDFChecklists(lista, dataFmt, motoboy) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, M=15, CW=W-M*2;
  const AZ=[15,76,122], AZ2=[30,159,217], CZ=[90,122,143], CZ2=[235,241,245];

  const campos = [
    { label:'Placa',                                    key:'placa' },
    { label:'Conservação da Moto',                      key:'conservacao_moto' },
    { label:'Pneu Dianteiro',                           key:'pneu_dianteiro' },
    { label:'Pneu Traseiro',                            key:'pneu_traseiro' },
    { label:'Bolsa Térmica — Limpeza',                  key:'bolsa_limpeza' },
    { label:'Bolsa Térmica — Estado',                   key:'bolsa_estado' },
    { label:'Bolsa Térmica — Identificação',            key:'bolsa_identificacao' },
    { label:'Colete Refletivo',                         key:'colete' },
    { label:'Documento do Veículo',                     key:'documento' },
    { label:'Caixa Refrigerada',                        key:'caixa_refrigerada' },
    { label:'Qtd Gelox',                                key:'qtd_gelox' },
    { label:'Qtd Gelo Seco',                            key:'qtd_gelo_seco' },
    { label:'Caixa Ambiente',                           key:'caixa_ambiente' },
    { label:'Caixa com Identificação?',                 key:'caixa_identificacao' },
    { label:'Amostras pendentes do dia anterior?',      key:'amostras_pendentes' },
    { label:'Baú com cadeado?',                         key:'bau_cadeado' },
  ];

  const corVal = v => {
    if(!v || v === '—') return [148,168,184];
    if(['Conforme','Sim','Limpa','Dentro do padrão'].includes(v)) return [8,80,65];
    if(['Não Conforme','Não','Suja','Fora do padrão'].includes(v)) return [121,31,31];
    return [15,76,122];
  };
  const bgVal = v => {
    if(!v || v === '—') return [247,251,253];
    if(['Conforme','Sim','Limpa','Dentro do padrão'].includes(v)) return [225,245,238];
    if(['Não Conforme','Não','Suja','Fora do padrão'].includes(v)) return [252,235,235];
    return [232,244,251];
  };

  lista.forEach((c, idx) => {
    if(idx > 0) doc.addPage();
    try { doc.addImage('https://raw.githubusercontent.com/willlog99/confirmacaoderota/main/20050686-7618-4EE2-86F2-0E0E1EE012BE.png','PNG',M,10,14,9); } catch(e){}
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...AZ);
    doc.text('Checklist Operacional', W-M, 15, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...CZ);
    doc.text('Loglife · Hermes Pardini', W-M, 20, {align:'right'});
    doc.setDrawColor(...AZ2); doc.setLineWidth(0.8); doc.line(M, 24, W-M, 24);
    let y = 28;
    const info = [
      ['BIOCONDUTOR', c.biocondutor||'—'],
      ['DATA', c.data_checklist||dataFmt],
      ['ROTA', c.rota||'—'],
      ['PLACA', c.placa||'—'],
    ];
    const iw = CW/4;
    info.forEach(([lbl,val], i) => {
      const x = M + i*iw;
      doc.setFillColor(247,251,253); doc.rect(x,y,iw,14,'F');
      doc.setDrawColor(...CZ2); doc.setLineWidth(0.2); doc.rect(x,y,iw,14);
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(...CZ);
      doc.text(lbl, x+3, y+5);
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...AZ);
      doc.text(String(val).substring(0,22), x+3, y+11);
    });
    y += 18;
    doc.setFillColor(...AZ2); doc.rect(M,y,CW,7,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(255,255,255);
    doc.text('ITENS VERIFICADOS', M+3, y+5);
    y += 10;
    campos.forEach((campo, i) => {
      const val = c[campo.key] !== undefined && c[campo.key] !== null && c[campo.key] !== '' ? String(c[campo.key]) : '—';
      const lines = doc.splitTextToSize(campo.label, CW-40);
      const h = Math.max(8, lines.length*4.5+4);
      if(y > 255) { doc.addPage(); y = 20; }
      if(i%2===0) { doc.setFillColor(247,251,253); doc.rect(M,y,CW,h,'F'); }
      doc.setDrawColor(...CZ2); doc.setLineWidth(0.15); doc.rect(M,y,CW,h);
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(68,68,68);
      doc.text(lines, M+3, y+5);
      const bg = bgVal(val); const cor = corVal(val);
      doc.setFillColor(...bg); doc.roundedRect(W-M-32, y+h/2-3, 30, 6, 1,1,'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...cor);
      doc.text(val, W-M-17, y+h/2+1.5, {align:'center'});
      y += h;
    });
    const pH = doc.internal.pageSize.height;
    doc.setDrawColor(...CZ2); doc.line(M, pH-18, W-M, pH-18);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...CZ);
    doc.text('Loglife Logistica · Checklist Operacional · '+dataFmt, M, pH-13);
    doc.text(`${idx+1} / ${lista.length}`, W-M, pH-13, {align:'right'});
  });

  const titulo = motoboy ? `Checklist_${motoboy.replace(/ /g,'_')}_${dataFmt.replace(/\//g,'-')}.pdf`
                         : `Checklists_${dataFmt.replace(/\//g,'-')}.pdf`;
  doc.save(titulo);
}

async function atualizarMotoboysChecklist() {
  const dataEl = document.getElementById('chk-download-data');
  const sel    = document.getElementById('chk-download-motoboy');
  const info   = document.getElementById('chk-download-info');
  if(!dataEl || !dataEl.value || !sel) return;
  const dataFmt = new Date(dataEl.value + 'T12:00:00').toLocaleDateString('pt-BR');
  if(info) info.textContent = '⏳ Buscando...';
  try {
    const r = await fetch(API + '/checklist?data=' + encodeURIComponent(dataFmt));
    const d = await r.json();
    const lista = d.checklists || [];
    sel.innerHTML = '<option value="">Todos (' + lista.length + ')</option>';
    lista.forEach(c => {
      const o = document.createElement('option');
      o.value = c.biocondutor;
      o.textContent = c.biocondutor + ' · ' + c.rota;
      sel.appendChild(o);
    });
    if(info) info.textContent = lista.length
      ? '✓ ' + lista.length + ' checklist(s) encontrado(s)'
      : '⚠️ Nenhum checklist nesta data';
  } catch(e) {
    if(info) info.textContent = 'Erro ao buscar';
  }
}
