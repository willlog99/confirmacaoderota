// ============================================================
// ── CORE — Funções base, navegação e utilitários ──────────────────────────
// ============================================================

// ── VARIÁVEIS ──
  const API = 'https://confirmacaoderota.willlog99.workers.dev';
  let autoRefreshInterval = null;
  const _diaSemana = new Date().getDay();
  let filtroDia = _diaSemana === 0 ? 'domingo' : _diaSemana === 6 ? 'sabado' : 'seg-sex';
  let cachePainel = null;
  let rotasDisponiveis = [];
  let motoboysListaCompleta = []; // Guardar lista completa para filtro
  let cardExpandido = null;
  let clienteParaMover = null;

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

  function setView(id, el) {
    pararAutoRefresh();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if (el) el.classList.add('active');
    fecharMenu();
    window.scrollTo(0,0);
    if (id === 'painel') { carregarPainel(); iniciarAutoRefresh(); }
    if (id === 'confirmacoes') carregarConfirmacoes();
    if (id === 'motoristas') carregarMotoristasList();
    if (id === 'rotas-view') carregarRotasView();
    if (id === 'checklist-view') carregarChecklists();
    if (id === 'checklists-incompletos') carregarChecklistsIncompletos();
    if (id === 'gerenciar-motoboys') carregarMotoboysGerenciar();
    if (id === 'ponto-rh') iniciarPontoRH();
    if (id === 'estoque-view') iniciarEstoqueView();
    if (id === 'gestor') {
      renderItensAuditoria();
    }
  }


  function showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = (type==='loading'?'<span class="spinner"></span>':'')+text;
    el.className = 'msg'+(type?' '+type:'');
  }

  // ===== DISPARADOR WHATSAPP =====
  let agendamentos = JSON.parse(localStorage.getItem('disp_agendamentos') || '[]');
  let editandoAgendamento = null;
  let diasSelecionados = new Set();
  let destSelecionado = 'todos';


  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
  }


  function formatarTelefone(t) {
    const s = String(t||'').replace(/\D/g,'');
    return s.length === 11 ? '(' + s.slice(0,2) + ') ' + s.slice(2,7) + '-' + s.slice(7) : t;
  }


  function iniciarAutoRefresh() {
    pararAutoRefresh();
    autoRefreshInterval = setInterval(() => carregarPainel(true), 30000);
  }


  function pararAutoRefresh() {
    if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
  }
