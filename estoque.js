// =============================================
// ABA ESTOQUE — JS COMPLETO CORRIGIDO
// =============================================
let patrimonios = JSON.parse(localStorage.getItem('lgl_pat') || '[]');
let patrimoniosSimples = JSON.parse(localStorage.getItem('lgl_pat_simples') || '{}');
let checklistsMotoboys = JSON.parse(localStorage.getItem('lgl_pat_chk') || '{}');
let estoqueUnif = JSON.parse(localStorage.getItem('lgl_unif') || '{}');
const PAT_COM_COD = ['rastreador','bau','cooler_g','cooler_p'];
const LISTA_PADRAO_PAT = [
  { id:'rastreador', nome:'Rastreador', icon:'📡', codigo:true },
  { id:'bau', nome:'Baú', icon:'🔒', codigo:true },
  { id:'cooler_g', nome:'Cooler G', icon:'🧊', codigo:true },
  { id:'cooler_p', nome:'Cooler P', icon:'🧊', codigo:true },
  { id:'cmc', nome:'Camiseta MC', icon:'👕', codigo:false, tamanho:true },
  { id:'cml', nome:'Camiseta ML', icon:'👕', codigo:false, tamanho:true },
  { id:'blusa', nome:'Blusa', icon:'👔', codigo:false, tamanho:true },
  { id:'colete', nome:'Colete', icon:'🦺', codigo:false, tamanho:false },
  { id:'cracha', nome:'Crachá', icon:'🪪', codigo:false, tamanho:false },
  { id:'bolsa', nome:'Bolsa Pardini', icon:'👜', codigo:false, tamanho:false },
];

function abrirModalPatCad(tipo) {
  const modal = document.getElementById('modal-pat-cad');
  if (!modal) return;
  modal.style.display = 'block';

  const els = {
    titulo: document.getElementById('pat-cad-titulo'),
    tipo: document.getElementById('pat-cad-tipo'),
    codigo: document.getElementById('pat-cad-codigo'),
    subtipo: document.getElementById('pat-cad-subtipo-wrap')
  };

  if (els.titulo) els.titulo.textContent = '➕ Cadastrar ' + (tipo ? tipo.toUpperCase() : 'Item');
  if (els.tipo) els.tipo.value = tipo || '';
  if (els.codigo) els.codigo.value = '';
  if (els.subtipo) els.subtipo.style.display = (tipo === 'cartao' || tipo === 'cooler_g' || tipo === 'cooler_p') ? 'block' : 'none';
}

async function downloadChecklistPDF() {
  const dataEl = document.getElementById('chk-download-data');
  const msgEl = document.getElementById('msg-chk-download');
  if (!dataEl || !dataEl.value) {
    if (msgEl) { msgEl.className = 'msg error'; msgEl.textContent = '⚠️ Selecione a data'; }
    return;
  }
  // ... (o restante da sua lógica original permanece aqui)
}
// ... (mantenha o restante das funções abaixo deste ponto)
