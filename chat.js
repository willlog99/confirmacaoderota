/* ========================================================
 * LogLife — Chat admin ↔ motoboy
 * Depende de: API (declarada em core.js) com a base do Worker
 * Endpoints usados:
 *   GET  /chat/lista              → lista de conversas
 *   GET  /chat/mensagens?telefone=X → mensagens de um motoboy
 *   POST /chat/enviar             → envia texto
 *   POST /chat-audio-admin        → envia áudio (gravado pelo admin)
 *   POST /chat/marcar-lido        → marca mensagens como lidas
 *   GET  /chat/nao-lidas          → contador de não lidas (badge do FAB)
 * ======================================================== */

const Chat = (() => {
  let lista = [];
  let atual = null;          // { telefone, nome, rota }
  let cacheMsgs = [];        // msgs do atual
  let pollMsgs = null;
  let pollLista = null;
  let pollBadge = null;

  const elLista = () => document.getElementById('chat-lista');
  const elMsgs  = () => document.getElementById('chat-conv-msgs');
  const elInput = () => document.getElementById('chat-input-text');
  const elBadge = () => document.getElementById('chat-fab-badge');
  const elConvH = () => document.getElementById('chat-conv-header');
  const elConvInp = () => document.getElementById('chat-conv-input');

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function iniciais(nome) {
    return (nome || '?').trim().split(/\s+/).slice(0,2).map(p => p[0] || '').join('').toUpperCase();
  }

  function fmtHora(ts) {
    if (!ts) return '';
    const d = new Date(Number(ts));
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtData(ts) {
    if (!ts) return '';
    const d = new Date(Number(ts));
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) return fmtHora(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + fmtHora(ts);
  }

  async function carregarLista() {
    try {
      const r = await fetch(API + '/chat/lista', { cache: 'no-store' });
      const d = await r.json();
      lista = d.lista || [];
      renderLista();
    } catch (e) {
      console.error('carregarLista', e);
    }
  }

  function renderLista(filtro = '') {
    const el = elLista();
    if (!el) return;
    const f = (filtro || '').toLowerCase();
    const visivel = lista.filter(m => !f || (m.nome || '').toLowerCase().includes(f) || (m.telefone || '').includes(f));
    if (!visivel.length) {
      el.innerHTML = '<div style="padding:1rem;text-align:center;color:#94A8B8;font-size:13px">Nenhuma conversa</div>';
      return;
    }
    el.innerHTML = visivel.map(m => {
      const ativo = atual && atual.telefone === m.telefone;
      const bg = ativo ? '#E0F0FA' : '#fff';
      const border = ativo ? '#1E9FD9' : '#EBF1F5';
      const rota = m.rota ? ' • ' + escapeHtml(m.rota) : '';
      const preview = m.ultima_msg ? (m.ultima_msg.length > 40 ? m.ultima_msg.slice(0,40) + '…' : m.ultima_msg) : 'Sem mensagens';
      const badge = m.nao_lidas > 0
        ? '<span style="background:#DC2626;color:#fff;border-radius:99px;padding:1px 7px;font-size:10px;font-weight:700;margin-left:auto">' + m.nao_lidas + '</span>'
        : '';
      return '<div onclick="Chat.abrir(\'' + m.telefone.replace(/'/g,"\\'") + '\')" '
        + 'data-tel="' + escapeHtml(m.telefone) + '" '
        + 'style="padding:10px 14px;border-bottom:1px solid ' + border + ';background:' + bg + ';cursor:pointer;display:flex;gap:10px;align-items:center">'
        + '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5DCAA5,#0F9B78);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">' + iniciais(m.nome) + '</div>'
        + '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">'
        + '<div style="display:flex;align-items:center;gap:6px">'
        + '<span style="font-size:13px;font-weight:700;color:#0F2940;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(m.nome) + '</span>'
        + '</div>'
        + '<span style="font-size:11px;color:#5A7A8F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + preview + '</span>'
        + '<span style="font-size:10px;color:#94A8B8">' + fmtData(m.ultima_ts) + rota + '</span>'
        + '</div>'
        + badge
        + '</div>';
    }).join('');
  }

  async function abrir(telefone) {
    const m = lista.find(x => x.telefone === telefone);
    if (!m) return;
    atual = { telefone: m.telefone, nome: m.nome, rota: m.rota };

    // Atualiza cabeçalho
    const elH = elConvH();
    if (elH) elH.style.display = 'flex';
    const elInp = elConvInp();
    if (elInp) elInp.style.display = 'flex';
    document.getElementById('chat-conv-avatar').textContent = iniciais(m.nome);
    document.getElementById('chat-conv-nome').textContent = m.nome;
    document.getElementById('chat-conv-rota').textContent = m.rota || '(sem rota)';

    renderLista(document.getElementById('chat-busca').value || '');

    await carregarMensagens(true);
    marcarLido(telefone);

    if (pollMsgs) clearInterval(pollMsgs);
    pollMsgs = setInterval(() => carregarMensagens(false), 4000);
  }

  async function carregarMensagens(scrollFinal = true) {
    if (!atual) return;
    try {
      const r = await fetch(API + '/chat/mensagens?telefone=' + encodeURIComponent(atual.telefone), { cache: 'no-store' });
      const d = await r.json();
      cacheMsgs = d.mensagens || [];
      renderMensagens();
      if (scrollFinal) {
        const el = elMsgs();
        if (el) el.scrollTop = el.scrollHeight;
      }
    } catch (e) {
      console.error('carregarMensagens', e);
    }
  }

  function renderMensagens() {
    const el = elMsgs();
    if (!el) return;
    if (!cacheMsgs.length) {
      el.innerHTML = '<div style="margin:auto;text-align:center;color:#94A8B8;font-size:13px">Nenhuma mensagem ainda</div>';
      return;
    }
    el.innerHTML = cacheMsgs.map(m => {
      const isAdmin = m.remetente === 'admin';
      const align = isAdmin ? 'flex-end' : 'flex-start';
      const bg = isAdmin ? '#1E9FD9' : '#fff';
      const color = isAdmin ? '#fff' : '#0F2940';
      const lblRemetente = isAdmin ? '' : '<span style="font-size:10px;font-weight:700;color:#5A7A8F;margin-bottom:2px;display:block">' + escapeHtml(atual.nome) + '</span>';
      const conteudo = m.tipo === 'audio' && m.audio_url
        ? '<audio controls src="' + escapeHtml(m.audio_url) + '" style="max-width:230px;height:36px"></audio>'
        : '<span style="font-size:13px;line-height:1.4;word-wrap:break-word;white-space:pre-wrap">' + escapeHtml(m.mensagem) + '</span>';
      return '<div style="display:flex;justify-content:' + align + ';margin-bottom:6px">'
        + '<div style="max-width:75%;padding:8px 12px;border-radius:14px;background:' + bg + ';color:' + color + ';box-shadow:0 1px 2px rgba(0,0,0,.06)">'
        + lblRemetente
        + conteudo
        + '<div style="font-size:10px;color:' + (isAdmin ? 'rgba(255,255,255,.75)' : '#94A8B8') + ';margin-top:4px;text-align:right">' + fmtHora(m.timestamp) + '</div>'
        + '</div></div>';
    }).join('');
  }

  async function enviar() {
    if (!atual) return;
    const elIn = elInput();
    if (!elIn) return;
    const txt = elIn.value.trim();
    if (!txt) return;
    elIn.value = '';
    try {
      await fetch(API + '/chat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone_motoboy: atual.telefone,
          nome_motoboy: atual.nome,
          remetente: 'admin',
          mensagem: txt
        })
      });
      await carregarMensagens(true);
      await carregarLista();
    } catch (e) {
      console.error('enviar', e);
      elIn.value = txt; // devolve o texto se falhou
    }
  }

  async function marcarLido(telefone) {
    if (!telefone) return;
    try {
      await fetch(API + '/chat/marcar-lido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone_motoboy: telefone, remetente: 'motoboy' })
      });
      await atualizarBadge();
    } catch (e) {}
  }

  async function atualizarBadge() {
    try {
      const r = await fetch(API + '/chat/nao-lidas', { cache: 'no-store' });
      const d = await r.json();
      const total = d.total || 0;
      const el = elBadge();
      if (!el) return;
      if (total > 0) {
        el.style.display = 'flex';
        el.textContent = total > 99 ? '99+' : total;
      } else {
        el.style.display = 'none';
      }
    } catch (e) {}
  }

  function abrirJanela() {
    const win = document.getElementById('chat-window');
    if (!win) return;
    win.style.display = 'flex';
    carregarLista();
    atualizarBadge();
    if (pollLista) clearInterval(pollLista);
    pollLista = setInterval(carregarLista, 12000);
    if (pollBadge) clearInterval(pollBadge);
    pollBadge = setInterval(atualizarBadge, 20000);
    if (atual) {
      carregarMensagens(true);
      if (pollMsgs) clearInterval(pollMsgs);
      pollMsgs = setInterval(() => carregarMensagens(false), 4000);
    }
  }

  function fecharJanela() {
    const win = document.getElementById('chat-window');
    if (win) win.style.display = 'none';
    if (pollLista) clearInterval(pollLista);
    if (pollMsgs) clearInterval(pollMsgs);
    if (pollBadge) clearInterval(pollBadge);
    pollLista = pollMsgs = pollBadge = null;
  }

  // Gravação de áudio do admin (botão 🎤)
  let gravando = false;
  let recorder = null;
  let chunks = [];
  let gravInicio = 0;
  let gravTimer = null;

  async function iniciarGravacao(e) {
    e.preventDefault();
    if (!atual) {
      alert('Selecione um motoboy primeiro');
      return;
    }
    if (gravando) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipoMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      recorder = new MediaRecorder(stream, { mimeType: tipoMime });
      chunks = [];
      recorder.ondataavailable = ev => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: tipoMime });
        enviarAudio(blob);
      };
      recorder.start();
      gravando = true;
      gravInicio = Date.now();
      document.getElementById('gravacao-admin-indicator').style.display = 'flex';
      gravTimer = setInterval(() => {
        const s = Math.floor((Date.now() - gravInicio) / 1000);
        document.getElementById('gravacao-admin-timer').textContent = s + 's';
        if (s >= 50) pararGravacao({ preventDefault(){} }); // limite ~50s
      }, 250);
    } catch (err) {
      alert('Não consegui acessar o microfone. Verifique as permissões.');
      console.error(err);
    }
  }

  function pararGravacao(e) {
    e.preventDefault();
    if (!gravando) return;
    gravando = false;
    clearInterval(gravTimer);
    document.getElementById('gravacao-admin-indicator').style.display = 'none';
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function enviarAudio(blob) {
    if (!atual) return;
    if (blob.size < 1000) return; // áudio vazio
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result.split(',')[1];
      try {
        await fetch(API + '/chat-audio-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone_motoboy: atual.telefone,
            audio_base64: b64,
            duracao: Math.floor(blob.size / 16000) // aprox
          })
        });
        await carregarMensagens(true);
        await carregarLista();
      } catch (e) { console.error('enviarAudio', e); }
    };
    reader.readAsDataURL(blob);
  }

  // ============ Inicialização quando o painel carrega ============
  function init() {
    atualizarBadge();
    setInterval(atualizarBadge, 30000);

    // Buscar filtro
    const busca = document.getElementById('chat-busca');
    if (busca) busca.addEventListener('input', e => renderLista(e.target.value));

    // Áudio
    const btnMic = document.getElementById('btn-gravar-admin');
    if (btnMic) {
      btnMic.addEventListener('mousedown', iniciarGravacao);
      btnMic.addEventListener('mouseup', pararGravacao);
      btnMic.addEventListener('mouseleave', e => { if (gravando) pararGravacao(e); });
      btnMic.addEventListener('touchstart', iniciarGravacao);
      btnBtnTouchEnd(btnMic);
    }
  }

  function btnBtnTouchEnd(btn) {
    btn.addEventListener('touchend', pararGravacao);
  }

  // Expor API global
  window.abrirChat = abrirJanela;
  window.fecharChat = fecharJanela;
  window.filtrarMotoboys = () => renderLista((document.getElementById('chat-busca') || {}).value || '');
  window.enviarChat = enviar;
  window.iniciarGravacaoAdmin = iniciarGravacao;
  window.pararGravacaoAdmin = pararGravacao;
  window.Chat = Object.assign(Chat, {
    abrir,
    enviar,
    carregarLista,
    carregarMensagens,
    atualizarBadge,
    init
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
