// =============================================
// ABA ESTOQUE — JS COMPLETO
// =============================================

let entTamSel = 'P';
let entQtd = 5;
let filtroMatEstAtual = 'todos';
let camMBTamSel = '';

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
  if(!patrimonios.length && !Object.keys(patrimoniosSimples).length) await carregarPatrimonios();
  if(!materiais.length) await carregarMateriais();
  if(!Object.keys(estoqueUnif).length) await carregarUniformes();
  const sel = document.getElementById('est-sel-motoboy');
  if(sel && sel.options.length<=1){
    try{
      const r=await fetch(API+'/motoboys?todos=1&agrupado=1');
      const d=await r.json();
      const nomes=[...new Set((d.motoboys||[]).map(m=>m.nome))].sort();
      nomes.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);});
    }catch(e){}
  }
  renderEstoqueUnifEst(); renderEstoquePatEst(); renderEstoqueSimplesEst(); renderMateriaisEst(); renderResumoPorMotoboy();
}

function mudarTabEst(tab, btn) {
  ['geral','motoboy','materiais'].forEach(t=>{
    const el=document.getElementById('est-tab-'+t); if(el) el.style.display=t===tab?'block':'none';
    const b=document.getElementById('est-tab-btn-'+t);
    if(b){b.style.borderColor=t===tab?'#8B5CF6':'#D6E5EE';b.style.background=t===tab?'#F3F0FF':'#fff';b.style.color=t===tab?'#5B21B6':'#5A7A8F';}
  });
  if(tab==='materiais') renderMateriaisEst();
}

const TIPOS_UNIF_EST=[
  {id:'cmc',icon:'\ud83d\udc55',nome:'Camiseta Manga Curta'},
  {id:'cml',icon:'\ud83d\udc55',nome:'Camiseta Manga Longa'},
  {id:'colete',icon:'\ud83e\uddba',nome:'Colete'},
  {id:'jaqueta',icon:'\ud83e\udde5',nome:'Jaqueta'},
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
  document.getElementById('qtd-ent-val').textContent='5';
  document.querySelectorAll('#ent-unif-tamanhos > div').forEach((b,i)=>{
    b.style.borderColor=i===0?'#8B5CF6':'#D6E5EE'; b.style.background=i===0?'#F3F0FF':'#fff'; b.style.color=i===0?'#5B21B6':'#5A7A8F';
  });
  document.getElementById('modal-entrada-unif-est').style.display='block';
}

function selTamEnt(btn,tam) {
  entTamSel=tam;
  document.querySelectorAll('#ent-unif-tamanhos > div').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';b.style.color='#5A7A8F';});
  btn.style.borderColor='#8B5CF6'; btn.style.background='#F3F0FF'; btn.style.color='#5B21B6';
}

function ajQtdEnt(d){entQtd=Math.max(1,entQtd+d);document.getElementById('qtd-ent-val').textContent=entQtd;}

async function confirmarEntradaUnifEst() {
  const tipo=document.getElementById('ent-unif-tipo').value;
  if(!estoqueUnif[tipo]) estoqueUnif[tipo]={};
  estoqueUnif[tipo][entTamSel]=((estoqueUnif[tipo][entTamSel])||0)+entQtd;
  await salvarEstoqueUnif();
  renderEstoqueUnifEst(); renderUniformes();
  document.getElementById('modal-entrada-unif-est').style.display='none';
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
          <div style="font-size:11px;margin-top:2px;color:${p.motoboy?'#0F4C7A':'#0F9B78'};font-weight:600">${p.motoboy?'\ud83d\udc64 '+p.motoboy:'✓ Disponível'}</div></div>
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
  const el=document.getElementById('est-checklist-motoboy');
  document.getElementById('est-resumo-todos').innerHTML='';
  if(!motoboy){el.innerHTML='';renderResumoPorMotoboy();return;}
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
    <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#0F4C7A">\ud83d\udc55 ${c.tipo==='cmc'?'Camiseta MC':'Camiseta ML'} · ${c.tam}</div>
    <div style="font-size:11px;color:#5A7A8F">${c.qtd} un${c.data?' · '+c.data:''}</div></div>
    <button onclick="removerCamisetaMB('${motoboy}',${i});carregarChecklistEstMotoboy('${motoboy}')" style="padding:3px 7px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:10px;font-weight:700;cursor:pointer">✕</button>
  </div>`).join('');

  el.innerHTML=alertaHtml+`<div style="background:#fff;border-radius:12px;padding:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:1rem">
    <div style="font-size:14px;font-weight:700;color:#0F4C7A;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
      ${motoboy}
      <div style="display:flex;gap:6px">
        <button onclick="abrirModalAddCamisetaMB('${motoboy}')" style="padding:5px 10px;border-radius:6px;border:none;background:#E8F8F0;color:#0F9B78;font-size:11px;font-weight:700;cursor:pointer">\ud83d\udc55 Camiseta</button>
        <button onclick="abrirPatAdd('${motoboy}','')" style="padding:5px 10px;border-radius:6px;border:none;background:linear-gradient(135deg,#8B5CF6,#5B21B6);color:#fff;font-size:11px;font-weight:700;cursor:pointer">+ Item</button>
      </div>
    </div>
    ${cams}${itensHtml}
  </div>
  <button onclick="syncPatServer();toast('✓ Salvo!')" style="width:100%;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#0F9B78,#085041);color:#fff;font-weight:700;font-size:13px;cursor:pointer">\ud83d\udcbe Salvar</button>`;
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
  document.getElementById('pat-add-titulo').textContent='\ud83d\udc55 Camiseta — '+motoboy;
  document.getElementById('pat-add-bloco-codigo').style.display='none';
  document.getElementById('pat-add-data').value=new Date().toISOString().split('T')[0];
  document.getElementById('msg-pat-add').textContent='';
  camMBTamSel='';
  const bloco=document.getElementById('pat-add-bloco-simples');
  bloco.style.display='block';
  bloco.innerHTML=`<div style="margin-bottom:1rem">
    <label style="font-size:11px;font-weight:700;color:#0F4C7A;text-transform:uppercase;display:block;margin-bottom:5px">Tipo</label>
    <select id="cam-mb-tipo" style="width:100%;border-radius:10px;border:1.5px solid #D6E5EE;padding:10px 12px;font-size:14px;outline:none;color:#0F4C7A">
      <option value="cmc">\ud83d\udc55 Manga Curta</option><option value="cml">\ud83d\udc55 Manga Longa</option>
    </select></div>
    <div style="margin-bottom:1rem">
    <label style="font-size:11px;font-weight:700;color:#0F4C7A;text-transform:uppercase;display:block;margin-bottom:5px">Tamanho</label>
    <div style="display:flex;gap:8px" id="cam-mb-tamanhos">
      ${['P','M','G','GG'].map(tam=>{const qtd=(estoqueUnif['cmc']&&estoqueUnif['cmc'][tam])||0;
        return `<div onclick="selCamMBTam(this,'${tam}')" style="flex:1;padding:8px 4px;border-radius:8px;border:1.5px solid #D6E5EE;background:#fff;text-align:center;cursor:pointer;${qtd===0?'opacity:.4':''}">
          <div style="font-size:13px;font-weight:700;color:#5A7A8F">${tam}</div>
          <div style="font-size:11px;color:#94A8B8">${qtd} un</div></div>`;
      }).join('')}</div></div>
    <div><label style="font-size:11px;font-weight:700;color:#0F4C7A;text-transform:uppercase;display:block;margin-bottom:5px">Quantidade</label>
    <input type="number" id="cam-mb-qtd" value="1" min="1" style="width:100%;border-radius:10px;border:1.5px solid #D6E5EE;padding:10px 12px;font-size:14px;outline:none;color:#0F4C7A"/></div>`;
  const btnConf=document.querySelector('#modal-pat-add button[onclick="confirmarPatAdd()"]');
  if(btnConf){btnConf.setAttribute('onclick','confirmarAddCamisetaMB()');btnConf.textContent='✓ Adicionar Camiseta';}
  document.getElementById('modal-pat-add').style.display='block';
}

function selCamMBTam(el,tam){
  camMBTamSel=tam;
  document.querySelectorAll('#cam-mb-tamanhos > div').forEach(b=>{b.style.borderColor='#D6E5EE';b.style.background='#fff';});
  el.style.borderColor='#8B5CF6'; el.style.background='#F3F0FF';
}

async function confirmarAddCamisetaMB(){
  const tipo=document.getElementById('cam-mb-tipo').value;
  const qtd=parseInt(document.getElementById('cam-mb-qtd').value)||1;
  const data=document.getElementById('pat-add-data').value;
  const msg=document.getElementById('msg-pat-add');
  if(!camMBTamSel){msg.textContent='⚠️ Selecione o tamanho';msg.style.color='#DC2626';return;}
  const est=(estoqueUnif[tipo]&&estoqueUnif[tipo][camMBTamSel])||0;
  if(qtd>est){msg.textContent=`⚠️ Só há ${est} no estoque`;msg.style.color='#DC2626';return;}
  if(!estoqueUnif[tipo])estoqueUnif[tipo]={};
  estoqueUnif[tipo][camMBTamSel]=est-qtd;
  await salvarEstoqueUnif();
  const motoboy=patAddMotoboy;
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  if(!checklistsMotoboys[motoboy]['camisetas'])checklistsMotoboys[motoboy]['camisetas']=[];
  const dataFmt=data?new Date(data).toLocaleDateString('pt-BR'):new Date().toLocaleDateString('pt-BR');
  checklistsMotoboys[motoboy]['camisetas'].push({tipo,tam:camMBTamSel,qtd,data:dataFmt});
  const btnConf=document.querySelector('#modal-pat-add button[onclick="confirmarAddCamisetaMB()"]');
  if(btnConf){btnConf.setAttribute('onclick','confirmarPatAdd()');btnConf.textContent='✓ Adicionar e Vincular';}
  syncPatServer();
  document.getElementById('modal-pat-add').style.display='none';
  renderEstoqueUnifEst(); carregarChecklistEstMotoboy(motoboy);
  toast('✓ Camiseta adicionada!');
}

function renderResumoPorMotoboy(){
  const el=document.getElementById('est-resumo-todos'); if(!el) return;
  const mbs=Object.keys(checklistsMotoboys);
  if(!mbs.length){el.innerHTML='<div class="empty">Nenhum checklist cadastrado</div>';return;}
  el.innerHTML=`<div style="font-size:13px;font-weight:700;color:#0F4C7A;margin-bottom:.8rem">\ud83d\udccb Todos os Motoboys</div>`+
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
          <span style="flex:1;color:#0F4C7A;font-weight:600">\ud83d\udc55 ${c.tipo==='cmc'?'MC':'ML'} ${c.tam}</span><span style="color:#5A7A8F;font-size:11px">${c.qtd} un</span></div>`).join('')}
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
  const icons={escritorio:'\ud83d\udcce',limpeza:'\ud83e\uddf9',alimentacao:'\ud83c\udf71'};
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
        <span style="font-size:13px;font-weight:700;color:#0F4C7A">${icons[m.categoria]||'\ud83d\udce6'} ${m.nome}</span>
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
        if(dias<=0)h+=`<div style="padding:7px 12px;border-radius:8px;background:#FCEBEB;border:1px solid #F09595;margin-bottom:5px;font-size:12px;color:#DC2626">\ud83d\udeab <b>${m.nome}</b> — vencido!</div>`;
        else if(dias<=7)h+=`<div style="padding:7px 12px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px;font-size:12px;color:#92400E">⚠️ <b>${m.nome}</b> — vence em ${dias}d</div>`;}
      if(m.qtd<=m.minimo)h+=`<div style="padding:7px 12px;border-radius:8px;background:#FEF9EC;border:1px solid #F2CC70;margin-bottom:5px;font-size:12px;color:#92400E">\ud83d\udce6 <b>${m.nome}</b> — baixo (${m.qtd})</div>`;
    });
    ae.innerHTML=h?`<div style="margin-bottom:1rem">${h}</div>`:'';}
}


// ── PENDÊNCIAS ─────────────────────────────────────────
let pendEntregaMotoboy='', pendEntregaTipo='', pendEntregaIdx=-1, pendCodigoSel=null;
let historicoItens=[], filtroHistoricoAtual='todos';

function fecharModalCamiseta(){
  document.getElementById('modal-camiseta-mb').style.display='none';
  camisetasParaAdicionar=[];
}

function atualizarTamanhosCam(){
  const tipo=document.getElementById('cam-novo-tipo').value;
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
  const tipo=document.getElementById('cam-novo-tipo').value;
  const qtd=parseInt(document.getElementById('cam-novo-qtd').value)||1;
  const msg=document.getElementById('msg-cam-mb');
  if(!camMBTamSel){msg.textContent='⚠️ Selecione o tamanho';msg.style.color='#DC2626';return;}
  const estDisp=(estoqueUnif[tipo]&&estoqueUnif[tipo][camMBTamSel])||0;
  if(qtd>estDisp){msg.textContent=`⚠️ Só há ${estDisp} no estoque (${camMBTamSel})`;msg.style.color='#DC2626';return;}
  msg.textContent='';
  camisetasParaAdicionar.push({tipo,tam:camMBTamSel,qtd,status:'entregue'});
  document.getElementById('cam-novo-qtd').value='1';
  renderListaCamisetasModal();
  atualizarTamanhosCam();
}

function renderListaCamisetasModal(){
  const el=document.getElementById('cam-mb-lista');
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
  if(!camisetasParaAdicionar.length){msg.textContent='⚠️ Adicione pelo menos uma camiseta';msg.style.color='#DC2626';return;}
  const motoboy=patAddMotoboy;
  const data=document.getElementById('cam-mb-data').value;
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
  const nomes={cmc:'Camiseta MC',cml:'Camiseta ML',colete:'Colete',jaqueta:'Jaqueta'};
  const nova=prompt(`Quantidade de ${nomes[tipoId]||tipoId} tamanho ${tam}:\n(Atual: ${qtdAtual})`);
  if(nova===null)return;
  const novaQtd=parseInt(nova);
  if(isNaN(novaQtd)||novaQtd<0){toast('⚠️ Quantidade inválida');return;}
  if(!estoqueUnif[tipoId])estoqueUnif[tipoId]={};
  estoqueUnif[tipoId][tam]=novaQtd;
  salvarEstoqueUnif();
  renderEstoqueUnifEst();
  renderUniformes();
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
  document.getElementById('pend-modal-titulo').textContent='✓ Entregar '+(tipoInfo?.nome||'Camiseta');
  document.getElementById('pend-modal-info').textContent='Para: '+motoboy;
  document.getElementById('pend-data-entrega').value=new Date().toISOString().split('T')[0];
  document.getElementById('msg-pend-modal').textContent='';
  document.getElementById('pend-modal-pat').style.display=temCod?'block':'none';
  document.getElementById('pend-modal-qtd').style.display=!temCod?'block':'none';
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
    document.getElementById('pend-modal-disponiveis').innerHTML=html;
    document.getElementById('pend-manual-wrap').style.display='none';
    document.getElementById('pend-codigo-manual').value='';
  }
  document.getElementById('modal-entregar-pend').style.display='block';
}

function selecionarPendPat(codigo,el){
  pendCodigoSel=codigo;
  document.querySelectorAll('#pend-modal-disponiveis .radio-pend').forEach(r=>{r.style.background='';r.style.borderColor='#D6E5EE';});
  document.querySelectorAll('#pend-modal-disponiveis > div').forEach(d=>{d.style.borderColor='#D6E5EE';d.style.background='#fff';});
  el.style.borderColor='#8B5CF6';el.style.background='#F3F0FF';
  el.querySelector('.radio-pend').style.background='#8B5CF6';
  document.getElementById('pend-manual-wrap').style.display='none';
}

function togglePendManual(){
  pendCodigoSel='manual';
  document.querySelectorAll('#pend-modal-disponiveis .radio-pend').forEach(r=>{r.style.background='';r.style.borderColor='#D6E5EE';});
  document.querySelectorAll('#pend-modal-disponiveis > div').forEach(d=>{d.style.borderColor='#D6E5EE';d.style.background='#F8FBFD';});
  const t=document.getElementById('pend-manual-toggle');if(t){t.style.borderColor='#8B5CF6';t.style.background='#F3F0FF';}
  const r=document.getElementById('pend-radio-manual');if(r){r.style.background='#8B5CF6';r.style.borderColor='#8B5CF6';}
  document.getElementById('pend-manual-wrap').style.display='block';
}

async function confirmarEntregaPend(){
  const msg=document.getElementById('msg-pend-modal');
  const data=document.getElementById('pend-data-entrega').value;
  const dataFmt=data?new Date(data).toLocaleDateString('pt-BR'):new Date().toLocaleDateString('pt-BR');
  const motoboy=pendEntregaMotoboy,tipo=pendEntregaTipo;
  const tipoInfo=LISTA_PADRAO_PAT.find(t=>t.id===tipo);
  const temCod=tipoInfo?.codigo||false;
  if(!checklistsMotoboys[motoboy])checklistsMotoboys[motoboy]={};
  if(tipo==='camiseta'){
    const qtd=parseInt(document.getElementById('pend-qtd-val').value)||1;
    const lista=checklistsMotoboys[motoboy]['camisetas']||[];
    if(pendEntregaIdx>=0&&lista[pendEntregaIdx]){lista[pendEntregaIdx].status='entregue';lista[pendEntregaIdx].data=dataFmt;lista[pendEntregaIdx].qtd=qtd;}
    adicionarHistorico({tipo:'entrega',motoboy,item:'Camiseta',data:dataFmt});
  }else if(temCod){
    if(!pendCodigoSel){msg.textContent='⚠️ Selecione ou digite o código';msg.style.color='#DC2626';return;}
    let cod=pendCodigoSel;
    if(cod==='manual'){cod=(document.getElementById('pend-codigo-manual').value||'').trim().toUpperCase();
      if(!cod){msg.textContent='⚠️ Digite o código';msg.style.color='#DC2626';return;}
      if(!patrimonios.find(p=>p.codigo===cod))patrimonios.push({id:Date.now(),tipo,codigo:cod,subtipo:null,estado:'Novo',motoboy,dataEntrega:dataFmt});}
    const p=patrimonios.find(x=>x.codigo===cod);
    if(p){p.motoboy=motoboy;p.dataEntrega=dataFmt;}
    checklistsMotoboys[motoboy][tipo]={codigo:cod,data:dataFmt,status:'entregue'};
    adicionarHistorico({tipo:'entrega',motoboy,item:tipoInfo.nome+' '+cod,data:dataFmt});
  }else{
    const qtd=parseInt(document.getElementById('pend-qtd-val').value)||1;
    if(!patrimoniosSimples[tipo])patrimoniosSimples[tipo]={total:0,vinculados:0};
    patrimoniosSimples[tipo].vinculados=(patrimoniosSimples[tipo].vinculados||0)+qtd;
    checklistsMotoboys[motoboy][tipo]={qtd,data:dataFmt,status:'entregue'};
    adicionarHistorico({tipo:'entrega',motoboy,item:tipoInfo.nome+' ('+qtd+')',data:dataFmt});
  }
  syncPatServer();
  document.getElementById('modal-entregar-pend').style.display='none';
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

// ── PATRIMÔNIOS — funções de gestão ─────────────────────────

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
  renderEstoquePat && renderEstoquePat();
  renderEstoqueSimplesEst();
  toast('✓ Estoque atualizado');
}

function renderEstoquePat() {
  const total = patrimonios.length;
  const disp  = patrimonios.filter(p => !p.motoboy).length;
  const vinc  = total - disp;
  const elT = document.getElementById('pat-total'); if (elT) elT.textContent = total;
  const elD = document.getElementById('pat-disp');  if (elD) elD.textContent = disp;
  const elU = document.getElementById('pat-uso');   if (elU) elU.textContent = vinc;
  const el = document.getElementById('pat-categorias-lista'); if (!el) return;
  el.innerHTML = LISTA_PADRAO_PAT.filter(t => t.codigo).map(tipo => {
    const itens = patrimonios.filter(p => p.tipo === tipo.id);
    const nD = itens.filter(p => !p.motoboy).length;
    const nV = itens.filter(p =>  p.motoboy).length;
    const bD = nD > 0 ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#E8F8F0;color:#0F9B78">${nD} disp.</span>` : '';
    const bV = nV > 0 ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#E8F4FB;color:#1E9FD9">${nV} vinc.</span>` : '';
    const iList = itens.map(p => {
      const ec = p.estado==='Novo'?'#0F9B78':p.estado==='Bom'?'#1E9FD9':'#DC2626';
      const eb = p.estado==='Novo'?'#E8F8F0':p.estado==='Bom'?'#E8F4FB':'#FCEBEB';
      return p.motoboy
        ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #F0F4F8">
            <div><span style="font-size:12px;font-weight:700;color:#8B5CF6;background:#F3F0FF;padding:2px 8px;border-radius:20px">${p.codigo}</span>
            <div style="font-size:12px;font-weight:700;color:#0F4C7A;margin-top:3px">👤 ${p.motoboy}</div>
            <div style="font-size:11px;color:#5A7A8F">Desde ${p.dataEntrega||'—'} · <span style="font-size:10px;padding:2px 6px;border-radius:20px;font-weight:700;background:${eb};color:${ec}">${p.estado}</span></div></div>
            <div style="display:flex;gap:5px">
              <button onclick="abrirModalSubst(${p.id})" style="padding:4px 8px;border-radius:6px;background:#FEF9EC;color:#92400E;border:1px solid #F2CC70;font-size:11px;font-weight:700;cursor:pointer">↔</button>
              <button onclick="devolverPat(${p.id})" style="padding:4px 8px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:11px;font-weight:700;cursor:pointer">↩</button>
            </div></div>`
        : `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #F0F4F8">
            <div><span style="font-size:12px;font-weight:700;color:#8B5CF6;background:#F3F0FF;padding:2px 8px;border-radius:20px">${p.codigo}</span>
            <div style="font-size:12px;font-weight:700;color:#0F9B78;margin-top:3px">✓ Disponível</div>
            <span style="font-size:10px;padding:2px 6px;border-radius:20px;font-weight:700;background:${eb};color:${ec}">${p.estado}</span></div>
            <div style="display:flex;gap:5px">
              <button onclick="vincularPatEstoque(${p.id})" style="padding:4px 8px;border-radius:6px;background:#E8F8F0;color:#0F9B78;border:none;font-size:11px;font-weight:700;cursor:pointer">📤</button>
              <button onclick="excluirPatEstoque(${p.id})" style="padding:4px 8px;border-radius:6px;background:#FCEBEB;color:#DC2626;border:1px solid #F09595;font-size:11px;font-weight:700;cursor:pointer">✕</button>
            </div></div>`;
    }).join('');
    return `<div style="background:#fff;border-radius:12px;border:1.5px solid #EBF1F5;margin-bottom:8px;overflow:hidden">
      <div onclick="toggleCat(this)" style="display:flex;align-items:center;justify-content:space-between;padding:12px;cursor:pointer">
        <span style="font-size:13px;font-weight:700;color:#0F4C7A">${tipo.icon} ${tipo.nome}</span>
        <div style="display:flex;gap:6px;align-items:center">${bD}${bV}<span class="cat-arrow" style="font-size:16px;color:#94A8B8">›</span></div>
      </div>
      <div style="display:none;border-top:1px solid #EBF1F5">
        ${iList || '<div style="padding:12px;text-align:center;font-size:13px;color:#94A8B8">Nenhum item</div>'}
        <div onclick="abrirModalPatCad('${tipo.id}')" style="display:flex;align-items:center;justify-content:center;padding:10px;cursor:pointer;color:#8B5CF6;font-size:12px;font-weight:700;background:#F8F6FF;border-top:1px solid #EBF1F5">➕ Cadastrar novo ${tipo.nome}</div>
      </div></div>`;
  }).join('');
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
  document.getElementById('pat-cad-tipo').value = tipo;
  document.getElementById('pat-cad-titulo').textContent = '➕ Cadastrar ' + (t ? t.icon + ' ' + t.nome : '');
  document.getElementById('pat-cad-codigo').value = '';
  document.getElementById('pat-cad-subtipo-wrap').style.display = tipo === 'cartao' ? 'block' : 'none';
  estadoPat = 'Novo'; subtipoPat2 = 'Definitivo';
  document.querySelectorAll('.estado-btn-pat').forEach((b, i) => {
    b.style.borderColor = i===0 ? '#0F9B78' : '#D6E5EE';
    b.style.background  = i===0 ? '#E8F8F0' : '#fff';
    b.style.color       = i===0 ? '#0F9B78' : '#5A7A8F';
  });
  document.getElementById('msg-pat-cad').textContent = '';
  document.getElementById('modal-pat-cad').style.display = 'block';
}

function selEstadoPat(btn, estado) {
  estadoPat = estado;
  const c = { Novo:'#0F9B78', Bom:'#1E9FD9', Danificado:'#DC2626' };
  const b = { Novo:'#E8F8F0', Bom:'#E8F4FB', Danificado:'#FCEBEB' };
  document.querySelectorAll('.estado-btn-pat').forEach(x => { x.style.borderColor='#D6E5EE'; x.style.background='#fff'; x.style.color='#5A7A8F'; });
  btn.style.borderColor = c[estado]; btn.style.background = b[estado]; btn.style.color = c[estado];
}

function selSubtipoPat(btn, sub) {
  subtipoPat2 = sub;
  document.querySelectorAll('.subtipo-btn-pat').forEach(b => { b.style.borderColor='#D6E5EE'; b.style.background='#fff'; b.style.color='#5A7A8F'; });
  btn.style.borderColor = '#8B5CF6'; btn.style.background = '#F3F0FF'; btn.style.color = '#5B21B6';
}

async function confirmarPatCad() {
  const tipo   = document.getElementById('pat-cad-tipo').value;
  const codigo = document.getElementById('pat-cad-codigo').value.trim().toUpperCase();
  const msg    = document.getElementById('msg-pat-cad');
  if (!codigo) { msg.textContent = '⚠️ Informe o código'; msg.style.color = '#DC2626'; return; }
  if (patrimonios.find(p => p.codigo === codigo)) { msg.textContent = '⚠️ Código já cadastrado'; msg.style.color = '#DC2626'; return; }
  patrimonios.push({ id: Date.now(), tipo, codigo, subtipo: tipo==='cartao'?subtipoPat2:null, estado: estadoPat, motoboy: null, dataEntrega: null });
  await syncPatServer();
  renderEstoquePat(); renderEstoquePatEst();
  document.getElementById('modal-pat-cad').style.display = 'none';
  toast('✓ ' + codigo + ' cadastrado!');
}

function abrirPatAdd(motoboy, tipoId) {
  patAddMotoboy = motoboy; patAddTipoAtual = tipoId; patAddCodigoSelecionado = null;
  document.getElementById('pat-add-titulo').textContent = '➕ Adicionar Item — ' + motoboy;
  document.getElementById('pat-add-tipo').value = tipoId;
  document.getElementById('pat-add-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('msg-pat-add').textContent = '';
  mudarTipoPatAdd(tipoId);
  document.getElementById('modal-pat-add').style.display = 'block';
}

function mudarTipoPatAdd(tipo) {
  patAddTipoAtual = tipo; patAddCodigoSelecionado = null;
  const temCod = PAT_COM_COD.includes(tipo);
  document.getElementById('pat-add-bloco-codigo').style.display = temCod ? 'block' : 'none';
  document.getElementById('pat-add-bloco-simples').style.display = !temCod ? 'block' : 'none';
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
    document.getElementById('pat-add-disponiveis').innerHTML = html;
    document.getElementById('pat-add-manual-wrap').style.display = 'none';
  }
}

function selecionarPatDisp(codigo, el) {
  patAddCodigoSelecionado = codigo;
  document.querySelectorAll('#pat-add-disponiveis .radio-disp').forEach(r => { r.style.background=''; r.style.borderColor='#D6E5EE'; });
  document.querySelectorAll('#pat-add-disponiveis > div').forEach(d => { d.style.borderColor='#D6E5EE'; d.style.background='#fff'; });
  el.style.borderColor = '#8B5CF6'; el.style.background = '#F3F0FF';
  el.querySelector('.radio-disp').style.background = '#8B5CF6';
  el.querySelector('.radio-disp').style.borderColor = '#8B5CF6';
  document.getElementById('pat-add-manual-wrap').style.display = 'none';
}

function toggleAddManual() {
  patAddCodigoSelecionado = 'manual';
  document.querySelectorAll('#pat-add-disponiveis .radio-disp').forEach(r => { r.style.background=''; r.style.borderColor='#D6E5EE'; });
  document.querySelectorAll('#pat-add-disponiveis > div').forEach(d => { d.style.borderColor='#D6E5EE'; d.style.background='#fff'; });
  const t = document.getElementById('pat-add-manual-toggle'); if (t) { t.style.borderColor='#8B5CF6'; t.style.background='#F3F0FF'; }
  const r = document.getElementById('radio-manual-pat'); if (r) { r.style.background='#8B5CF6'; r.style.borderColor='#8B5CF6'; }
  document.getElementById('pat-add-manual-wrap').style.display = 'block';
}

async function confirmarPatAdd() {
  const tipo   = document.getElementById('pat-add-tipo').value;
  const data   = document.getElementById('pat-add-data').value;
  const msg    = document.getElementById('msg-pat-add');
  const motoboy = patAddMotoboy;
  if (!tipo)    { msg.textContent='⚠️ Selecione o item'; msg.style.color='#DC2626'; return; }
  if (!motoboy) { msg.textContent='⚠️ Selecione o motoboy'; msg.style.color='#DC2626'; return; }
  if (!checklistsMotoboys[motoboy]) checklistsMotoboys[motoboy] = {};
  const dataFmt = data ? new Date(data).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  if (PAT_COM_COD.includes(tipo)) {
    if (!patAddCodigoSelecionado) { msg.textContent='⚠️ Selecione ou digite o código'; msg.style.color='#DC2626'; return; }
    let cod = patAddCodigoSelecionado;
    if (cod === 'manual') {
      cod = (document.getElementById('pat-add-codigo-manual').value||'').trim().toUpperCase();
      if (!cod) { msg.textContent='⚠️ Digite o código'; msg.style.color='#DC2626'; return; }
      if (!patrimonios.find(p => p.codigo===cod)) {
        const est = document.getElementById('pat-add-estado-manual').value;
        patrimonios.push({ id:Date.now(), tipo, codigo:cod, subtipo:null, estado:est, motoboy, dataEntrega:dataFmt });
      } else { const p=patrimonios.find(x=>x.codigo===cod); if(p){p.motoboy=motoboy;p.dataEntrega=dataFmt;} }
    } else { const p=patrimonios.find(x=>x.codigo===cod); if(p){p.motoboy=motoboy;p.dataEntrega=dataFmt;} }
    checklistsMotoboys[motoboy][tipo] = { codigo:cod, data:dataFmt };
  } else {
    const qtd = parseInt(document.getElementById('pat-add-qtd').value)||1;
    if (!patrimoniosSimples[tipo]) patrimoniosSimples[tipo]={total:0,vinculados:0};
    patrimoniosSimples[tipo].vinculados=(patrimoniosSimples[tipo].vinculados||0)+qtd;
    checklistsMotoboys[motoboy][tipo]={ qtd, data:dataFmt };
  }
  await syncPatServer();
  document.getElementById('modal-pat-add').style.display='none';
  carregarChecklistEstMotoboy(motoboy); renderEstoquePat();
  toast('✓ Item adicionado!');
}

function abrirModalSubst(id) {
  const p = patrimonios.find(x => x.id===id); if(!p) return;
  substPatId=id; substPatSelecionado=null;
  document.getElementById('subst-titulo').textContent='↔ Substituir '+p.codigo;
  document.getElementById('subst-info').innerHTML=`Substituindo <strong style="color:#8B5CF6">${p.codigo}</strong> de <strong style="color:#0F4C7A">${p.motoboy}</strong>`;
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
  document.getElementById('subst-disponiveis').innerHTML=html;
  document.getElementById('msg-subst').textContent='';
  document.getElementById('modal-pat-subst').style.display='block';
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
  const msg=document.getElementById('msg-subst');
  if(!substPatSelecionado){msg.textContent='⚠️ Selecione o substituto';msg.style.color='#DC2626';return;}
  const pAnt=patrimonios.find(x=>x.id===substPatId); if(!pAnt) return;
  const motivo=document.getElementById('subst-motivo').value;
  const motoboy=pAnt.motoboy, hoje=new Date().toLocaleDateString('pt-BR');
  let cod=substPatSelecionado;
  if(cod==='__manual__'){
    cod=(document.getElementById('subst-codigo-novo').value||'').trim().toUpperCase();
    if(!cod){msg.textContent='⚠️ Digite o código';msg.style.color='#DC2626';return;}
    if(!patrimonios.find(p=>p.codigo===cod)) patrimonios.push({id:Date.now(),tipo:pAnt.tipo,codigo:cod,subtipo:pAnt.subtipo,estado:'Novo',motoboy,dataEntrega:hoje});
  }
  pAnt.estado=motivo==='Perda'?'Perda':'Danificado'; pAnt.motoboy=null; pAnt.dataEntrega=null;
  const pN=patrimonios.find(x=>x.codigo===cod); if(pN){pN.motoboy=motoboy;pN.dataEntrega=hoje;}
  if(checklistsMotoboys[motoboy]) Object.keys(checklistsMotoboys[motoboy]).forEach(k=>{
    if(checklistsMotoboys[motoboy][k]?.codigo===pAnt.codigo){checklistsMotoboys[motoboy][k].codigo=cod;checklistsMotoboys[motoboy][k].data=hoje;}
  });
  await syncPatServer();
  document.getElementById('modal-pat-subst').style.display='none';
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
  const p=patrimonios.find(x=>x.id===id); if(!p) return;
  const nome=prompt('Vincular ao motoboy:\n(Digite o nome)');
  if(!nome) return;
  p.motoboy=nome.trim().toUpperCase(); p.dataEntrega=new Date().toLocaleDateString('pt-BR');
  await syncPatServer(); renderEstoquePat(); renderEstoquePatEst();
  toast('✓ Vinculado a '+p.motoboy);
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
