// ── CHAT WIDGET ──

  let chatMotoboyAtual = null;
  let chatLista = [];
  let chatRefreshInterval = null;
  let chatSomTotal = 0;
  let chatUltimaMsg = 0; // timestamp da última mensagem carregada
  
  // Som de notificação (Web Audio API - sem arquivo externo)
  function tocarSomChat() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 520;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }
  
  async function carregarChatLista() {
    try {
      const r = await fetch(API + '/chat/lista');
      const d = await r.json();
      const novaLista = d.lista || [];
      
      // Verificar se tem mensagem nova para tocar som
      const totalNaoLidas = novaLista.reduce((acc, m) => acc + (m.nao_lidas || 0), 0);
      if (totalNaoLidas > chatSomTotal && chatSomTotal >= 0) {
        tocarSomChat();
      }
      chatSomTotal = totalNaoLidas;
      
      chatLista = novaLista;
      renderChatLista();
      
      // Atualizar badge
      const badge = document.getElementById('chat-fab-badge');
      if (totalNaoLidas > 0) {
        badge.textContent = totalNaoLidas > 99 ? '99+' : totalNaoLidas;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    } catch(e) {}
  }
  
  function renderChatLista() {
    const filtro = (document.getElementById('chat-busca').value || '').toLowerCase();
    const lista = filtro ? chatLista.filter(m => 
      m.nome.toLowerCase().includes(filtro) || m.rota.toLowerCase().includes(filtro)
    ) : chatLista;
    
    if (!lista.length) {
      document.getElementById('chat-lista').innerHTML = '<div style="padding:1rem;text-align:center;color:#94A8B8;font-size:13px">Nenhum motoboy</div>';
      return;
    }
    
    document.getElementById('chat-lista').innerHTML = lista.map(m => {
      const iniciais = (m.nome || '').split(' ').slice(0,2).map(p => p[0] || '').join('').toUpperCase();
      const ativa = chatMotoboyAtual === m.telefone ? 'background:#E8F4FB;border-left:3px solid #1E9FD9' : '';
      const colors = ['linear-gradient(135deg,#5DCAA5,#0F9B78)','linear-gradient(135deg,#F2CC70,#92400E)','linear-gradient(135deg,#F09595,#991B1B)','linear-gradient(135deg,#BFE0F0,#0F7BB0)'];
      const cor = colors[m.telefone.length % colors.length];
      return `<div onclick="abrirConversa('${m.telefone}','${(m.nome||'').replace(/'/g,"\\'")}', '${(m.rota||'').replace(/'/g,"\\'")}')" style="padding:11px 14px;cursor:pointer;border-bottom:1px solid #EBF1F5;display:flex;align-items:center;gap:10px;${ativa}">
        <div style="width:38px;height:38px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">${iniciais || '?'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#0F4C7A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.nome || m.telefone}</div>
          <div style="font-size:11px;color:#5A7A8F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${m.ultima_msg || m.rota || '—'}</div>
        </div>
        ${m.nao_lidas > 0 ? `<div style="background:#DC2626;color:#fff;border-radius:50%;font-size:10px;font-weight:700;padding:2px 6px;min-width:18px;text-align:center">${m.nao_lidas}</div>` : ''}
      </div>`;
    }).join('');
  }
  
  function filtrarMotoboys() { renderChatLista(); }
  
  async function abrirConversa(tel, nome, rota) {
    chatMotoboyAtual = tel;
    document.getElementById('chat-conv-header').style.display = 'flex';
    document.getElementById('chat-conv-input').style.display = 'flex';
    document.getElementById('chat-conv-nome').textContent = nome || tel;
    document.getElementById('chat-conv-rota').textContent = rota || '—';
    const iniciais = (nome || '').split(' ').slice(0,2).map(p => p[0] || '').join('').toUpperCase();
    document.getElementById('chat-conv-avatar').textContent = iniciais || '?';
    
    // Marcar mensagens como lidas
    await fetch(API + '/chat/marcar-lido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone_motoboy: tel, remetente: 'motoboy' })
    });
    
    carregarMensagens();
    renderChatLista();
    atualizarBadge();
  }
  
  async function carregarMensagens() {
    if (!chatMotoboyAtual) return;
    try {
      const r = await fetch(API + '/chat/mensagens?telefone=' + encodeURIComponent(chatMotoboyAtual));
      const d = await r.json();
      const msgs = d.mensagens || [];
      
      if (!msgs.length) {
        document.getElementById('chat-conv-msgs').innerHTML = '<div style="margin:auto;text-align:center;color:#94A8B8;font-size:13px">Nenhuma mensagem ainda</div>';
        return;
      }
      
      document.getElementById('chat-conv-msgs').innerHTML = msgs.map(m => {
        const eu = m.remetente === 'admin';
        const hora = new Date(m.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
        return `<div style="margin-bottom:10px;display:flex;${eu ? 'justify-content:flex-end' : ''}">
          <div>
            <div style="max-width:300px;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.4;${eu ? 'background:linear-gradient(135deg,#1E9FD9,#0F7BB0);color:#fff;border-bottom-right-radius:4px' : 'background:#fff;color:#0F4C7A;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.06)'}">${m.mensagem.replace(/</g,'&lt;')}</div>
            <div style="font-size:10px;color:#94A8B8;margin-top:4px;${eu ? 'text-align:right' : ''}">${hora}</div>
          </div>
        </div>`;
      }).join('');
      
      const msgs_div = document.getElementById('chat-conv-msgs');
      msgs_div.scrollTop = msgs_div.scrollHeight;
    } catch(e) {}
  }
  
  async function enviarChat() {
    const input = document.getElementById('chat-input-text');
    const texto = input.value.trim();
    if (!texto || !chatMotoboyAtual) return;
    input.value = '';
    
    const motoboy = chatLista.find(m => m.telefone === chatMotoboyAtual);
    
    try {
      await fetch(API + '/chat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone_motoboy: chatMotoboyAtual,
          nome_motoboy: motoboy ? motoboy.nome : '',
          remetente: 'admin',
          mensagem: texto
        })
      });
      await carregarMensagens();
      await carregarChatLista();
    } catch(e) {
      input.value = texto;
    }
  }
  
  async function atualizarBadge() {
    try {
      const r = await fetch(API + '/chat/nao-lidas');
      const d = await r.json();
      const total = d.total || 0;
      const badge = document.getElementById('chat-fab-badge');
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'flex';
        
        // Toca som se aumentou
        if (total > chatSomTotal && chatSomTotal > 0) {
          try { chatSom.play().catch(() => {}); } catch(e) {}
        }
        chatSomTotal = total;
      } else {
        badge.style.display = 'none';
        chatSomTotal = 0;
      }
    } catch(e) {}
  }
  
  function abrirChat() {
    document.getElementById('chat-window').style.display = 'flex';
    carregarChatLista();
    if (!chatRefreshInterval) {
      chatRefreshInterval = setInterval(async () => {
        await carregarChatLista(); // já atualiza badge também
        if (chatMotoboyAtual) carregarMensagens();
      }, 5000); // 5s em vez de 3s
    }
  }
  
  function fecharChat() {
    document.getElementById('chat-window').style.display = 'none';
    chatMotoboyAtual = null;
    if (chatRefreshInterval) {
      clearInterval(chatRefreshInterval);
      chatRefreshInterval = null;
    }
  }
  
  // Forçar atualização em todos os apps
  async function confirmarRefresh() {
    if (!confirm('🔄 Forçar atualização em todos os apps abertos?\n\nOs motoboys que estiverem com o app aberto irão ver um aviso e o app vai recarregar.')) return;
    
    try {
      await fetch(API + '/refresh-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().getTime() })
      });
      alert('✅ Sinal enviado! Apps abertos irão atualizar em até 10 segundos.');
    } catch(e) {
      alert('❌ Erro ao enviar sinal. Tente novamente.');
    }
  }

  // Verificar badge a cada 10s (mesmo com chat fechado)
  setInterval(carregarChatLista, 10000);
  setTimeout(carregarChatLista, 2000);
  
  // Registrar Service Worker para PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Abrir aba gestor direto se vier do app — deve ficar no final
  if (window.location.hash === '#gestor') {
    const btnGestor = document.querySelector('[onclick="setView(\'gestor\',this)"]');
    setView('gestor', btnGestor);
    history.replaceState(null, '', window.location.pathname);
  }

  // =============================================
  // PONTO RH — COMPLETO
  // =============================================
  