// ============================================================
// ── PONTO RH — Sistema de ponto, banco de horas, home office, férias ───────
// ============================================================

// ── VARIÁVEIS ──
  let pontoDadosPonto=[], pontoDadosFerias=[], pontoDadosBanco=[], pontoDadosEndereco=[];
  let pontoSaldosReais={}, pontoTemExtrato=false;
  let pontoDiasExist=[], pontoMes=new Date().getMonth(), pontoAno=new Date().getFullYear();
  let pontoNomesHome=[], pontoNomesBanco=[];
  let pontoHomeData=[], pontoBancoData=[];
  let pontoDesligados=[];
  let pontoProcessado=false;

// ── FUNÇÕES ──

  function iniciarPontoRH(){pontoCarregarHistorico();pontoCarregarDesligados();}


  function mudarTabPonto(tab,btn){
    ['upload','panorama','home','banco','ferias','historico','config'].forEach(t=>{
      const el=document.getElementById('ponto-tab-'+t);if(el)el.style.display=t===tab?'block':'none';
      const b=document.getElementById('ponto-tab-btn-'+t);
      if(b){b.style.color=t===tab?'#1D4ED8':'#6B7280';b.style.borderBottomColor=t===tab?'#1D4ED8':'transparent';}
    });
    if(tab==='historico')pontoCarregarHistorico();
    if(tab==='config')pontoCarregarDesligados();
  }


  function pontoLerPrincipal(file){
    if(!file)return;
    pontoArquivoPrincipal=file;
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});
        pontoDadosPonto=pontoSheetJson(wb,'BASE INFRACTAL');
        pontoDadosFerias=pontoSheetJson(wb,'FERIAS');
        pontoDadosBanco=pontoSheetJson(wb,'BANCO DE HORAS');
        pontoDadosEndereco=pontoSheetJson(wb,'ENDEREÇO');
        const datas=pontoDadosPonto.map(x=>new Date(x['DATA'])).filter(d=>!isNaN(d));
        if(datas.length){pontoMes=datas[0].getMonth();pontoAno=datas[0].getFullYear();}
        pontoDiasExist=[...new Set(datas.map(d=>d.getDate()))].sort((a,b)=>a-b);
        const el=document.getElementById('ponto-status-main');
        el.style.display='block';
        el.innerHTML=`<span style="color:#0F9B78;font-weight:700">✅ ${file.name} — ${pontoDadosPonto.length} registros, ${pontoDiasExist.length} dias</span>`;
        document.getElementById('ponto-zone-main').style.borderColor='#16A34A';
        document.getElementById('ponto-btn-processar').style.display='block';
      }catch(err){toast('Erro ao ler planilha','error');console.error(err);}
    };
    reader.readAsArrayBuffer(file);
  }


  function pontoLerExtrato(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,raw:false});
        const temp={};
        raw.slice(1).forEach(r=>{const nome=(r[3]||'').trim();if(nome&&r[7])temp[nome.toUpperCase()]={saldo:pontoParseSaldo(r[7]),saldoStr:r[7]};});
        pontoSaldosReais=temp;pontoTemExtrato=true;
        const el=document.getElementById('ponto-status-extrato');
        el.style.display='block';
        el.innerHTML=`<span style="color:#0F9B78;font-weight:700">✅ ${file.name} — ${Object.keys(pontoSaldosReais).length} saldos reais</span>`;
        document.getElementById('ponto-zone-extrato').style.borderColor='#16A34A';
      }catch(err){toast('Erro ao ler extrato','error');}
    };
    reader.readAsArrayBuffer(file);
  }


  function pontoSheetJson(wb,nome){return wb.Sheets[nome]?XLSX.utils.sheet_to_json(wb.Sheets[nome]):[];}


  function pontoProcessar(){
    if(!pontoDadosPonto.length){toast('Carregue a planilha primeiro','error');return;}
    pontoNomesHome=[...new Set(pontoDadosPonto.map(x=>x['NOME CORRIGIDO']).filter(Boolean))].sort();
    pontoNomesBanco=[...new Set(pontoDadosBanco.map(x=>x['NOME CORRIGIDO']).filter(Boolean))].sort();
    pontocalcHome();pontocalcBanco();
    const desl=pontoDesligados.map(d=>pontoNorm(d.nome));
    pontoBancoData.forEach(x=>{if(desl.includes(pontoNorm(x.nome)))x.desligado=true;});
    pontoHomeData.forEach(x=>{if(desl.includes(pontoNorm(x.nome)))x.desligado=true;});
    pontoRenderPanorama();pontoRenderHome();pontoRenderBanco();pontoRenderFerias();
    ['panorama','home','banco','ferias'].forEach(t=>{const b=document.getElementById('ponto-tab-btn-'+t);if(b)b.style.display='block';});
    const ab=document.getElementById('ponto-action-bar');if(ab)ab.style.display='flex';
    const pp=document.getElementById('pill-ponto-periodo');const pr=document.getElementById('pill-ponto-records');
    if(pp){pp.textContent='📅 '+String(pontoMes+1).padStart(2,'0')+'/'+pontoAno;pp.style.display='inline-block';}
    if(pr){pr.textContent=pontoDadosPonto.length+' registros';pr.style.display='inline-block';}
    if(pontoTemExtrato){const b=document.getElementById('ponto-badge-saldo-real');if(b){b.style.display='inline-block';b.textContent='✅ saldo real';}}
    pontoProcessado=true;toast('✓ Dados processados!');
    // Salvar planilha no R2 automaticamente
    pontoSalvarXlsxR2();
    mudarTabPonto('panorama',document.getElementById('ponto-tab-btn-panorama'));
  }

  // Salva o arquivo xlsx no R2 com chave ponto-ANO-MES.xlsx


  async function pontoSalvarXlsxR2(){
    if(!pontoArquivoPrincipal) return;
    try {
      const formData = new FormData();
      formData.append('file', pontoArquivoPrincipal);
      formData.append('mes', pontoMes+1);
      formData.append('ano', pontoAno);
      await fetch(API+'/ponto-upload', { method:'POST', body: formData });
      console.log('Planilha salva no R2');
    } catch(e){ console.warn('Erro ao salvar no R2:', e); }
  }


  function pontocalcHome(){
    pontoHomeData=pontoNomesHome.map(nome=>{
      let total=0,dias={};
      const refEnd=pontoDadosEndereco.find(e=>pontoNorm(e['NOME CORRIGIDO'])===pontoNorm(nome));
      const cepCad=refEnd?pontolimpaCEP(refEnd['ENDEREÇO']):null;
      pontoDiasExist.forEach(d=>{
        const regs=pontoDadosPonto.filter(x=>pontoNorm(x['NOME CORRIGIDO'])===pontoNorm(nome)&&new Date(x['DATA']).getDate()===d).sort((a,b)=>new Date(a['HORA'])-new Date(b['HORA']));
        if(regs.length){
          const entH=cepCad&&pontolimpaCEP(regs[0]['CEP'])===cepCad;
          const saiH=regs.length>1&&cepCad&&pontolimpaCEP(regs[regs.length-1]['CEP'])===cepCad;
          if(entH||saiH)total++;
          dias[d]={entH,saiH,horas:regs.map(x=>pontoExtrairHora(x['HORA'])),semCEP:!cepCad,temReg:true};
        }else dias[d]={temReg:false};
      });
      return{nome,total,dias};
    }).sort((a,b)=>b.total-a.total);
  }


  function pontocalcBanco(){
    const saldoPlanilha={};
    pontoDadosBanco.forEach(r=>{
      const n=pontoNorm(r['NOME CORRIGIDO']);const data=new Date(r['DATA']);
      if(!r['SALDO'])return;
      if(!saldoPlanilha[n]||data>saldoPlanilha[n].data)
        saldoPlanilha[n]={saldoStr:String(r['SALDO']).trim(),saldo:pontoParseSaldo(String(r['SALDO']).trim()),data};
    });
    pontoBancoData=pontoNomesBanco.map(nome=>{
      let totalMes=0,dias={};
      pontoDiasExist.forEach(d=>{
        const r=pontoDadosBanco.find(x=>pontoNorm(x['NOME CORRIGIDO'])===pontoNorm(nome)&&new Date(x['DATA']).getDate()===d);
        const s=r?(pontofmtH(r['CRÉDITO'])-pontofmtH(r['DÉBITO'])):0;
        totalMes+=s;dias[d]=s;
      });
      const nUp=nome.toUpperCase();
      const ext=pontoSaldosReais[nUp]||null;
      const plan=saldoPlanilha[pontoNorm(nome)]||null;
      const fonte=ext||plan;
      return{nome,totalMes,totalReal:fonte?fonte.saldo:totalMes,saldoRealStr:fonte?fonte.saldoStr:null,dias};
    }).sort((a,b)=>b.totalReal-a.totalReal);
  }


  function tblStyle(extra){return `border-collapse:collapse;width:100%;font-size:11px${extra?';'+extra:''}`;}


  function thStyle(sticky){return `padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:left;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB${sticky?';position:sticky;left:0;z-index:5':''}`;}


  function tdStyle(extra){return `padding:8px 10px;border-bottom:1px solid #F3F4F6${extra?';'+extra:''}`;}


  function pontoRenderPanorama(){
    const hoje=new Date();hoje.setHours(0,0,0,0);
    let h=`<table style="${tblStyle()}"><thead><tr>
      <th style="${thStyle(true)};min-width:160px;border-right:1px solid #E5E7EB">COLABORADOR</th>`;
    pontoDiasExist.forEach(d=>h+=`<th style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB;white-space:nowrap">${d}/${pontoMes+1}</th>`);
    h+=`</tr></thead><tbody>`;
    pontoHomeData.forEach(item=>{
      const iD=item.desligado;
      h+=`<tr data-nome="${item.nome.toUpperCase()}" style="${iD?'opacity:.4':''}">
        <td style="${tdStyle('font-weight:600;position:sticky;left:0;background:#fff;z-index:4;border-right:1px solid #E5E7EB')}${iD?';text-decoration:line-through;color:#9CA3AF':''}">${item.nome}</td>`;
      pontoDiasExist.forEach(d=>{
        const dF=new Date(pontoAno,pontoMes,d);
        const emF=pontoEmFerias(item.nome,dF);
        let txt='–';
        if(item.dias[d]?.temReg)txt=item.dias[d].horas.filter(Boolean).join('<br>');
        else if(emF)txt=`<span style="background:#DCFCE7;color:#166534;font-size:9px;padding:1px 4px;border-radius:3px;font-weight:700">FÉRIAS</span>`;
        else if(dF<=hoje&&!iD)txt=`<span style="color:#DC2626;font-weight:700;font-size:10px">FALTA</span>`;
        h+=`<td style="padding:6px;border-bottom:1px solid #F3F4F6;text-align:center">${txt}</td>`;
      });
      h+=`</tr>`;
    });
    h+=`</tbody></table>`;
    document.getElementById('ponto-tbl-panorama').innerHTML=h;
  }


  function pontoRenderHome(){
    let h=`<table style="${tblStyle()}"><thead><tr>
      <th style="${thStyle(true)};min-width:160px;border-right:1px solid #E5E7EB">COLABORADOR</th>`;
    pontoDiasExist.forEach(d=>h+=`<th style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">Dia ${d}</th>`);
    h+=`<th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#1D4ED8;font-weight:700;background:#EFF6FF">TOTAL</th></tr></thead><tbody>`;
    pontoHomeData.forEach(item=>{
      const iD=item.desligado;
      h+=`<tr data-nome="${item.nome.toUpperCase()}" style="${iD?'opacity:.4':''}">
        <td style="${tdStyle('font-weight:600;position:sticky;left:0;background:#fff;z-index:4;border-right:1px solid #E5E7EB')}${iD?';text-decoration:line-through;color:#9CA3AF':''}">${item.nome}</td>`;
      pontoDiasExist.forEach(d=>{
        const di=item.dias[d];let txt='–';
        if(di?.temReg){
          if(di.semCEP)txt=`<span style="color:#D97706;font-weight:700;font-size:9px">VERIFICAR</span>`;
          else{let b='';
            if(di.entH)b+=`<span style="background:#1D4ED8;color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:2px;display:inline-block;margin-bottom:1px">HO ENT</span><br>`;
            if(di.saiH)b+=`<span style="background:#DC2626;color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:2px;display:inline-block">HO SAÍ</span>`;
            txt=b||`<span style="color:#6B7280;font-size:10px">EXTERNO</span>`;}
        }
        h+=`<td style="padding:6px;border-bottom:1px solid #F3F4F6;text-align:center">${txt}</td>`;
      });
      h+=`<td style="${tdStyle('text-align:center;font-weight:700;background:#EFF6FF;color:#1D4ED8')}">${iD?'–':item.total}</td></tr>`;
    });
    h+=`</tbody></table>`;
    document.getElementById('ponto-tbl-home').innerHTML=h;
  }


  function pontoRenderBanco(){
    const lista=[...pontoBancoData].sort((a,b)=>b.totalReal-a.totalReal);
    let h=`<table style="${tblStyle()}"><thead><tr>
      <th style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB;width:30px">#</th>
      <th style="${thStyle(true)};min-width:160px;border-right:1px solid #E5E7EB">COLABORADOR</th>`;
    pontoDiasExist.forEach(d=>h+=`<th style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">Dia ${d}</th>`);
    h+=`<th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;font-weight:700;background:#F0FDF4;border-left:2px solid #16A34A;color:#166534">SALDO ATUAL</th></tr></thead><tbody>`;
    lista.forEach((item,i)=>{
      if(item.desligado){
        h+=`<tr style="opacity:.4"><td style="padding:8px 6px;border-bottom:1px solid #F3F4F6;text-align:center;color:#9CA3AF;font-size:10px">${i+1}</td>
          <td style="${tdStyle('font-weight:600;position:sticky;left:0;background:#fff;z-index:4;border-right:1px solid #E5E7EB;text-decoration:line-through;color:#9CA3AF')}">${item.nome}</td>`;
        pontoDiasExist.forEach(()=>h+=`<td style="border-bottom:1px solid #F3F4F6;text-align:center;color:#9CA3AF">–</td>`);
        h+=`<td style="${tdStyle('text-align:center;background:#F9FAFB;border-left:2px solid #E5E7EB')}"><span style="font-size:10px;padding:2px 6px;border-radius:20px;background:#F3F4F6;color:#9CA3AF;font-weight:700">DESLIGADO</span></td></tr>`;
        return;
      }
      const bg=item.totalReal<0?'background:#FFF8F8':'';
      h+=`<tr data-nome="${item.nome.toUpperCase()}" style="${bg}">
        <td style="padding:8px 6px;border-bottom:1px solid #F3F4F6;text-align:center;color:#9CA3AF;font-size:10px;font-family:monospace">${i+1}</td>
        <td style="${tdStyle('font-weight:600;position:sticky;left:0;z-index:4;border-right:1px solid #E5E7EB')};background:${item.totalReal<0?'#FFF8F8':'#fff'}">${item.nome}</td>`;
      pontoDiasExist.forEach(d=>{
        const s=item.dias[d]||0;
        const cor=s<0?'color:#DC2626;font-weight:700':s>0?'color:#16A34A;font-weight:700':'color:#9CA3AF';
        h+=`<td style="padding:6px;border-bottom:1px solid #F3F4F6;text-align:center;font-family:monospace;${cor}">${s!==0?pontoHhMM(s):'–'}</td>`;
      });
      const sc=item.totalReal<0?'color:#DC2626':'color:#16A34A';
      h+=`<td style="${tdStyle('text-align:center;font-family:monospace;font-size:13px;font-weight:700;background:#F0FDF4;border-left:2px solid #16A34A')};${sc}">${item.saldoRealStr||pontoHhMM(item.totalReal)}</td></tr>`;
    });
    h+=`</tbody></table>`;
    document.getElementById('ponto-tbl-banco').innerHTML=h;
  }


  function pontoRenderFerias(){
    const hoje=new Date();hoje.setHours(0,0,0,0);
    const amanha=new Date(hoje);amanha.setDate(hoje.getDate()+1);
    let h=`<table style="${tblStyle()}"><thead><tr>
      <th style="${thStyle(false)}">COLABORADOR</th>
      <th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">INÍCIO</th>
      <th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">RETORNO</th>
      <th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">STATUS</th>
      <th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">AÇÃO</th>
    </tr></thead><tbody>`;
    pontoDadosFerias.forEach(f=>{
      const nome=(f['COLABORADOR']||'').trim();
      const dI=f['Início das Férias']?pontoD0(new Date(f['Início das Férias'])):null;
      const dFim=f['Fim das Férias']?pontoD0(new Date(f['Fim das Férias'])):null;
      if(!dI||!dFim)return;
      const dR=pontoD0(new Date(dFim));dR.setDate(dR.getDate()+1);
      if(dR<hoje)return;
      let status='',btn='';
      if(hoje>=dI&&hoje<=dFim)status=`<span style="background:#DCFCE7;color:#166534;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:700">Em férias</span>`;
      else if(dI>hoje)status=`<span style="background:#F3F4F6;color:#6B7280;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:700">Agendada</span>`;
      if(dI.getTime()===amanha.getTime())btn=`<button onclick="pontoCopiarZap('${nome}','SAIDA')" style="padding:3px 8px;border-radius:5px;border:none;background:#25D366;color:#fff;font-size:10px;font-weight:700;cursor:pointer">WhatsApp</button>`;
      else if(dR.getTime()===amanha.getTime())btn=`<button onclick="pontoCopiarZap('${nome}','VOLTA')" style="padding:3px 8px;border-radius:5px;border:none;background:#25D366;color:#fff;font-size:10px;font-weight:700;cursor:pointer">WhatsApp</button>`;
      h+=`<tr data-nome="${nome.toUpperCase()}">
        <td style="${tdStyle('font-weight:600')}">${nome}</td>
        <td style="${tdStyle('text-align:center;font-family:monospace;font-size:11px')}">${dI.toLocaleDateString('pt-BR')}</td>
        <td style="${tdStyle('text-align:center;font-family:monospace;font-size:11px')}">${dR.toLocaleDateString('pt-BR')}</td>
        <td style="${tdStyle('text-align:center')}">${status}</td>
        <td style="${tdStyle('text-align:center')}">${btn}</td></tr>`;
    });
    h+=`</tbody></table>`;
    document.getElementById('ponto-tbl-ferias').innerHTML=h;
  }


  function pontoRenderAvisosModal(){
    const hoje=new Date();hoje.setHours(0,0,0,0);
    const amanha=new Date(hoje);amanha.setDate(hoje.getDate()+1);
    const em30=new Date(hoje);em30.setDate(hoje.getDate()+30);
    let amanhaH='',hojeH='',proximasH='',criticoH='';
    pontoDadosFerias.forEach(f=>{
      const nome=(f['COLABORADOR']||'').trim();
      const dI=f['Início das Férias']?pontoD0(new Date(f['Início das Férias'])):null;
      const dFim=f['Fim das Férias']?pontoD0(new Date(f['Fim das Férias'])):null;
      if(!dI||!dFim)return;
      const dR=pontoD0(new Date(dFim));dR.setDate(dR.getDate()+1);
      if(dR<hoje)return;
      if(dI.getTime()===amanha.getTime())
        amanhaH+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:#FEF9EC;border-left:3px solid #F59E0B;margin-bottom:5px">
          <span style="font-size:12px;font-weight:600;color:#92400E">🛫 ${nome} — sai amanhã</span>
          <button onclick="pontoCopiarZap('${nome}','SAIDA')" style="padding:3px 8px;border-radius:5px;border:none;background:#25D366;color:#fff;font-size:10px;font-weight:700;cursor:pointer">Copiar Zap</button></div>`;
      if(dR.getTime()===amanha.getTime())
        amanhaH+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:#E8F8F0;border-left:3px solid #0F9B78;margin-bottom:5px">
          <span style="font-size:12px;font-weight:600;color:#0F9B78">🛬 ${nome} — retorna amanhã</span>
          <button onclick="pontoCopiarZap('${nome}','VOLTA')" style="padding:3px 8px;border-radius:5px;border:none;background:#25D366;color:#fff;font-size:10px;font-weight:700;cursor:pointer">Copiar Zap</button></div>`;
      if(hoje>=dI&&hoje<=dFim)hojeH+=`<div style="font-size:12px;padding:6px 0;color:#0F4C7A;border-bottom:1px solid #F0F4F8">🌴 <strong>${nome}</strong> — retorno ${dR.toLocaleDateString('pt-BR')}</div>`;
      if(dI>hoje&&dI<=em30)proximasH+=`<div style="font-size:12px;padding:6px 0;color:#0F4C7A;border-bottom:1px solid #F0F4F8">📅 <strong>${nome}</strong> — inicia ${dI.toLocaleDateString('pt-BR')}</div>`;
    });
    pontoBancoData.filter(x=>!x.desligado).forEach(x=>{
      if(x.totalReal<=-8){
        const lbl=x.saldoRealStr||pontoHhMM(x.totalReal);
        criticoH+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;background:#FCEBEB;border-left:3px solid #DC2626;margin-bottom:5px">
          <span style="font-size:12px;font-weight:700;color:#DC2626">🔴 ${x.nome}</span>
          <span style="font-size:13px;font-weight:800;color:#DC2626;font-family:monospace">${lbl}</span></div>`;
      }
    });
    const c=`<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">📢 Amanhã</div>
      ${amanhaH||'<div style="font-size:12px;color:#9CA3AF;margin-bottom:1rem">Nenhum</div>'}
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px">🌴 Em férias hoje</div>
      ${hojeH||'<div style="font-size:12px;color:#9CA3AF;margin-bottom:1rem">Ninguém</div>'}
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px">📅 Próximas (30 dias)</div>
      ${proximasH||'<div style="font-size:12px;color:#9CA3AF;margin-bottom:1rem">Nenhuma</div>'}
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px">⚠️ Banco crítico (&gt;8h débito)</div>
      ${criticoH||'<div style="font-size:12px;color:#9CA3AF">Nenhum</div>'}`;
    pontoAbrirModalSimples('🔔 Avisos e WhatsApp',c);
  }


  function pontoAbrirModalSimples(titulo,conteudo){
    let m=document.getElementById('ponto-modal-avisos');
    if(!m){m=document.createElement('div');m.id='ponto-modal-avisos';
      m.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;padding:1rem;overflow-y:auto;display:none';
      m.innerHTML=`<div style="background:#fff;border-radius:16px;padding:1.5rem;max-width:500px;margin:0 auto">
        <div style="font-size:16px;font-weight:700;color:#0F4C7A;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
          <span id="ponto-modal-titulo"></span>
          <button onclick="document.getElementById('ponto-modal-avisos').style.display='none'" style="background:none;border:none;font-size:22px;cursor:pointer;color:#5A7A8F">✕</button>
        </div><div id="ponto-modal-body"></div></div>`;
      document.body.appendChild(m);}
    document.getElementById('ponto-modal-titulo').textContent=titulo;
    document.getElementById('ponto-modal-body').innerHTML=conteudo;
    m.style.display='block';
  }


  function pontoExportarExcel(){
    if(!pontoProcessado){toast('Processe os dados primeiro','error');return;}
    const wb=XLSX.utils.book_new();
    [{id:'ponto-tbl-panorama',nome:'Panorama'},{id:'ponto-tbl-home',nome:'Home Office'},{id:'ponto-tbl-banco',nome:'Banco de Horas'},{id:'ponto-tbl-ferias',nome:'Ferias'}].forEach(t=>{
      const el=document.querySelector('#'+t.id+' table')||document.getElementById(t.id);
      if(el?.rows?.length>0){const ws=XLSX.utils.table_to_sheet(el);XLSX.utils.book_append_sheet(wb,ws,t.nome);}
    });
    XLSX.writeFile(wb,'PONTO_LOGLIFE_'+new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')+'.xlsx');
    toast('✓ Excel exportado!');
  }


  function pontoGerarPDF(){
    if(!pontoBancoData.length){toast('Processe os dados primeiro','error');return;}
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=doc.internal.pageSize.getWidth();
    const mesNome=new Date(pontoAno,pontoMes,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    doc.setFillColor(30,58,138);doc.rect(0,0,W,22,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(15);doc.setFont('helvetica','bold');
    doc.text('LOGLIFE · Banco de Horas — '+mesNome.charAt(0).toUpperCase()+mesNome.slice(1),12,13);
    doc.setFontSize(8);doc.setFont('helvetica','normal');
    doc.text('Gerado em: '+new Date().toLocaleString('pt-BR'),W-12,17,{align:'right'});
    const ativos=pontoBancoData.filter(x=>!x.desligado);
    doc.autoTable({startY:28,head:[['#','Colaborador','Saldo','Status']],
      body:ativos.map((x,i)=>[i+1,x.nome,x.saldoRealStr||pontoHhMM(x.totalReal),x.totalReal>0?'POSITIVO':x.totalReal<=-8?'CRÍTICO':'NEGATIVO']),
      theme:'grid',styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[30,58,138],textColor:255,fontStyle:'bold'},
      didParseCell(d){if(d.section!=='body')return;const r=ativos[d.row.index];if(!r)return;
        if(d.column.index===2){d.cell.styles.textColor=r.totalReal>=0?[22,163,74]:[220,38,38];d.cell.styles.fontStyle='bold';}
        if(d.column.index===3){if(r.totalReal>0){d.cell.styles.textColor=[22,163,74];d.cell.styles.fillColor=[240,253,244];}
          else{d.cell.styles.textColor=[220,38,38];d.cell.styles.fillColor=[254,242,242];}}},
      margin:{left:12,right:12}});
    const nomeMes=new Date(pontoAno,pontoMes,1).toLocaleDateString('pt-BR',{month:'long'});
    doc.save('BancoHoras_LogLife_'+nomeMes+'_'+pontoAno+'.pdf');
    toast('✓ PDF gerado!');
  }


  async function pontoPrintZap(){
    if(!pontoProcessado){toast('Processe os dados primeiro','error');return;}
    const nome=prompt('Nome do colaborador:');if(!nome)return;
    const abas=['ponto-tbl-panorama','ponto-tbl-banco','ponto-tbl-home'];
    let cont=null,linha=null;
    for(const id of abas){const c=document.getElementById(id);const l=c?.querySelector(`tr[data-nome="${nome.toUpperCase()}"]`);if(l){cont=c;linha=l;break;}}
    if(!linha){toast('Colaborador não encontrado','error');return;}
    const tmp=document.createElement('div');tmp.style.cssText='position:absolute;top:-9999px;background:white;font-family:system-ui;font-size:11px';
    const tbl=document.createElement('table');tbl.style.borderCollapse='collapse';
    const thead=cont.querySelector('thead').cloneNode(true);const tr=linha.cloneNode(true);
    thead.querySelectorAll('th').forEach(t=>t.style.position='static');
    tr.querySelectorAll('td').forEach(t=>t.style.position='static');
    tbl.appendChild(thead);tbl.appendChild(tr);tmp.appendChild(tbl);document.body.appendChild(tmp);
    try{
      const canvas=await html2canvas(tbl,{backgroundColor:'#fff',scale:2});
      canvas.toBlob(async blob=>{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);toast('✓ Print copiado! Cole no WhatsApp.');});
    }catch(e){toast('Erro ao copiar print','error');}
    finally{document.body.removeChild(tmp);}
  }


  function pontoCopiarZap(nome,tipo){
    const msg=tipo==='SAIDA'?`Olá ${nome}! Desejamos um excelente descanso. Amanhã começam suas férias! 🌴`:`Olá ${nome}! Seu retorno às atividades é amanhã. Esperamos que tenha descansado bem! 🤝`;
    navigator.clipboard.writeText(msg).then(()=>toast('✓ Mensagem copiada!'));
  }


  function pontoResetar(){
    pontoDadosPonto=[];pontoDadosFerias=[];pontoDadosBanco=[];pontoDadosEndereco=[];
    pontoSaldosReais={};pontoTemExtrato=false;pontoDiasExist=[];pontoHomeData=[];pontoBancoData=[];pontoProcessado=false;
    ['ponto-file-main','ponto-file-extrato'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    ['ponto-status-main','ponto-status-extrato'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
    document.getElementById('ponto-zone-main').style.borderColor='';
    document.getElementById('ponto-zone-extrato').style.borderColor='';
    document.getElementById('ponto-btn-processar').style.display='none';
    const ab=document.getElementById('ponto-action-bar');if(ab)ab.style.display='none';
    ['panorama','home','banco','ferias'].forEach(t=>{const b=document.getElementById('ponto-tab-btn-'+t);if(b)b.style.display='none';});
    mudarTabPonto('upload',document.getElementById('ponto-tab-btn-upload'));
  }


  async function pontoSalvarResumo(){
    if(!pontoProcessado){toast('Processe os dados primeiro','error');return;}
    const mes=pontoMes+1,ano=pontoAno;
    const ativos=pontoBancoData.filter(x=>!x.desligado);
    const pos=ativos.filter(x=>x.totalReal>0).length,neg=ativos.filter(x=>x.totalReal<0).length;
    const ho=pontoHomeData.filter(x=>!x.desligado);
    const mediaHO=ho.length?(ho.reduce((a,x)=>a+x.total,0)/ho.length):0;
    const pior=ativos.reduce((p,c)=>c.totalReal<p.totalReal?c:p,ativos[0]||{});
    try{
      await fetch(API+'/ponto-resumo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mes,ano,total_colabs:ativos.length,banco_positivos:pos,banco_negativos:neg,media_ho:mediaHO.toFixed(1),maior_debito_nome:pior.nome||'',maior_debito_horas:pior.totalReal||0})});
      await fetch(API+'/ponto-colaboradores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mes,ano,colaboradores:ativos.map(x=>({nome:x.nome,saldo_banco:x.totalReal,saldo_str:x.saldoRealStr||pontoHhMM(x.totalReal),dias_ho:(ho.find(h=>pontoNorm(h.nome)===pontoNorm(x.nome))||{}).total||0,status_banco:x.totalReal>0?'positivo':x.totalReal<=-8?'critico':'negativo'}))})});
      const ferias=pontoDadosFerias.map(f=>({nome:(f['COLABORADOR']||'').trim(),inicio:f['Início das Férias']?new Date(f['Início das Férias']).toLocaleDateString('pt-BR'):'',fim:f['Fim das Férias']?new Date(f['Fim das Férias']).toLocaleDateString('pt-BR'):'',status:'agendada'})).filter(f=>f.nome);
      if(ferias.length)await fetch(API+'/ponto-ferias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mes,ano,ferias})});
      toast('✓ Resumo salvo!');pontoCarregarHistorico();
    }catch(e){toast('Erro ao salvar','error');console.error(e);}
  }


  async function pontoCarregarHistorico(){
    const el=document.getElementById('ponto-hist-lista');if(!el)return;
    try{
      const r=await fetch(API+'/ponto-resumo');const d=await r.json();const meses=d.resumos||[];
      if(!meses.length){el.innerHTML='<div class="empty">Nenhum mês salvo ainda.<br>Processe uma planilha para criar o histórico.</div>';return;}
      const mn=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      el.innerHTML=meses.map(m=>`<div style="background:#F8FBFD;border-radius:10px;border:1.5px solid #EBF1F5;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="pontoCarregarMes(${m.mes},${m.ano})">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:700;color:#0F4C7A">${mn[m.mes-1]} ${m.ano}</span>
          <div style="display:flex;gap:4px;align-items:center">
            <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#E8F8F0;color:#0F9B78">+${m.banco_positivos}</span>
            <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#FCEBEB;color:#DC2626">−${m.banco_negativos}</span>
            <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#EFF6FF;color:#1D4ED8">📂 Completo</span>
            <span style="color:#94A8B8;font-size:16px">›</span>
          </div>
        </div>
        <div style="font-size:11px;color:#5A7A8F">${m.total_colabs} colaboradores · HO média: ${m.media_ho}d · Maior débito: ${m.maior_debito_nome||'–'}</div>
      </div>`).join('');
    }catch(e){el.innerHTML='<div class="empty">Processe uma planilha para criar o histórico</div>';}
  }


  async function pontoCarregarMes(mes,ano){
    const el=document.getElementById('ponto-hist-lista');if(!el)return;
    el.innerHTML=`<div class="empty"><span class="spinner"></span> Carregando ${mes}/${ano}...</div>`;
    try{
      // Baixar xlsx do R2
      const r=await fetch(`${API}/ponto-upload?mes=${mes}&ano=${ano}`);
      if(!r.ok) throw new Error('não encontrado');
      const blob=await r.blob();
      const file=new File([blob],`ponto-${ano}-${String(mes).padStart(2,'0')}.xlsx`);
      const reader=new FileReader();
      reader.onload=async e=>{
        try{
          const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:true});
          pontoDadosPonto=pontoSheetJson(wb,'BASE INFRACTAL');
          pontoDadosFerias=pontoSheetJson(wb,'FERIAS');
          pontoDadosBanco=pontoSheetJson(wb,'BANCO DE HORAS');
          pontoDadosEndereco=pontoSheetJson(wb,'ENDEREÇO');
          const datas=pontoDadosPonto.map(x=>new Date(x['DATA'])).filter(d=>!isNaN(d));
          pontoMes=mes-1;pontoAno=ano;
          pontoDiasExist=[...new Set(datas.map(d=>d.getDate()))].sort((a,b)=>a-b);
          pontoNomesHome=[...new Set(pontoDadosPonto.map(x=>x['NOME CORRIGIDO']).filter(Boolean))].sort();
          pontoNomesBanco=[...new Set(pontoDadosBanco.map(x=>x['NOME CORRIGIDO']).filter(Boolean))].sort();
          pontocalcHome();pontocalcBanco();
          const desl=pontoDesligados.map(d=>pontoNorm(d.nome));
          pontoBancoData.forEach(x=>{if(desl.includes(pontoNorm(x.nome)))x.desligado=true;});
          pontoHomeData.forEach(x=>{if(desl.includes(pontoNorm(x.nome)))x.desligado=true;});
          pontoRenderPanorama();pontoRenderHome();pontoRenderBanco();pontoRenderFerias();
          ['panorama','home','banco','ferias'].forEach(t=>{const b=document.getElementById('ponto-tab-btn-'+t);if(b)b.style.display='block';});
          const ab=document.getElementById('ponto-action-bar');if(ab)ab.style.display='flex';
          pontoProcessado=true;
          const pp=document.getElementById('pill-ponto-periodo');
          if(pp){pp.textContent='📅 '+String(mes).padStart(2,'0')+'/'+ano;pp.style.display='inline-block';}
          const mn2=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
          toast(`✓ ${mn2[mes-1]} ${ano} carregado!`);
          mudarTabPonto('panorama',document.getElementById('ponto-tab-btn-panorama'));
        }catch(err){el.innerHTML='<div class="empty">Erro ao processar planilha</div>';console.error(err);}
      };
      reader.readAsArrayBuffer(file);
    }catch(e){
      // Fallback: mostrar só resumo do D1
      try{
        const r2=await fetch(`${API}/ponto-colaboradores?mes=${mes}&ano=${ano}`);
        const d=await r2.json();const colabs=d.colaboradores||[];
        const mn=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-size:14px;font-weight:700;color:#0F4C7A">${mn[mes-1]} ${ano}</span>
          <div style="display:flex;gap:6px">
            <span style="font-size:10px;color:#92400E;background:#FEF9EC;padding:2px 7px;border-radius:20px;font-weight:700">⚠️ Planilha não disponível</span>
            <button onclick="pontoCarregarHistorico()" style="padding:5px 10px;border-radius:6px;border:1.5px solid #D6E5EE;background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#5A7A8F">← Voltar</button>
          </div>
        </div>
        <div style="font-size:12px;color:#5A7A8F;margin-bottom:1rem">Exibindo resumo salvo. Para dados completos, carregue a planilha de ${mn[mes-1]}.</div>
        <table style="${tblStyle()}"><thead><tr>
          <th style="${thStyle(false)}">COLABORADOR</th>
          <th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">SALDO BANCO</th>
          <th style="padding:8px 10px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:10px;color:#6B7280;font-weight:700;background:#F9FAFB">DIAS HO</th>
        </tr></thead><tbody>`+
        colabs.map(x=>{const cor=x.saldo_banco>=0?'#16A34A':x.saldo_banco<=-8?'#DC2626':'#D97706';
          return `<tr><td style="${tdStyle('font-weight:600')}">${x.nome}</td>
            <td style="${tdStyle('text-align:center;font-family:monospace;font-weight:700')};color:${cor}">${x.saldo_str}</td>
            <td style="${tdStyle('text-align:center;font-weight:700;color:#1D4ED8')}">${x.dias_ho}d</td></tr>`;
        }).join('')+`</tbody></table>`;
      }catch(e2){el.innerHTML='<div class="empty">Erro ao carregar mês</div>';}
    }
  }


  async function pontoCarregarDesligados(){
    const el=document.getElementById('ponto-desl-lista');if(!el)return;
    try{const r=await fetch(API+'/ponto-desligados');const d=await r.json();pontoDesligados=d.desligados||[];}
    catch(e){pontoDesligados=JSON.parse(localStorage.getItem('ponto_desligados')||'[]');}
    pontoRenderDesligados();
  }


  function pontoRenderDesligados(){
    const el=document.getElementById('ponto-desl-lista');if(!el)return;
    if(!pontoDesligados.length){el.innerHTML='<div class="empty">Nenhum colaborador desligado</div>';return;}
    el.innerHTML=pontoDesligados.map(d=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:#FCEBEB;border:1px solid #F09595;margin-bottom:5px">
      <div style="width:22px;height:22px;border-radius:50%;background:#DC2626;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">✕</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700;color:#DC2626">${d.nome}</div>
      <div style="font-size:10px;color:#94A8B8">Desligado em ${d.data||'–'}</div></div>
      <button onclick="pontoRemoverDesligado('${d.nome}')" style="padding:3px 8px;border-radius:6px;border:1px solid #D6E5EE;background:#fff;color:#5A7A8F;font-size:10px;font-weight:700;cursor:pointer">↩ Reativar</button>
    </div>`).join('');
  }


  async function pontoAdicionarDesligado(){
    const input=document.getElementById('ponto-desl-nome');
    const nome=input.value.trim().toUpperCase();
    if(!nome){toast('⚠️ Digite o nome','error');return;}
    if(pontoDesligados.find(d=>pontoNorm(d.nome)===pontoNorm(nome))){toast('Já está na lista','error');return;}
    pontoDesligados.push({nome,data:new Date().toLocaleDateString('pt-BR')});
    localStorage.setItem('ponto_desligados',JSON.stringify(pontoDesligados));
    try{await fetch(API+'/ponto-desligados',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({desligados:pontoDesligados})});}catch(e){}
    input.value='';pontoRenderDesligados();toast('✓ '+nome+' marcado como desligado');
  }


  async function pontoRemoverDesligado(nome){
    pontoDesligados=pontoDesligados.filter(d=>pontoNorm(d.nome)!==pontoNorm(nome));
    localStorage.setItem('ponto_desligados',JSON.stringify(pontoDesligados));
    try{await fetch(API+'/ponto-desligados',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({desligados:pontoDesligados})});}catch(e){}
    pontoRenderDesligados();toast('✓ '+nome+' reativado');
  }


  function pontoNorm(t){return String(t||'').trim().toUpperCase().replace(/\s+/g,' ');}


  function pontolimpaCEP(c){return String(c||'').replace(/\D/g,'');}


  function pontoD0(d){d.setHours(0,0,0,0);return d;}


  function pontoExtrairHora(c){if(!c)return null;if(c instanceof Date)return c.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});return String(c).substring(0,5);}


  function pontofmtH(v){if(!v)return 0;if(typeof v==='number')return v*24;const p=String(v).split(':');return p.length>=2?parseInt(p[0])+parseInt(p[1])/60:0;}


  function pontoParseSaldo(s){if(!s)return 0;s=String(s).trim();const neg=s.startsWith('-');s=s.replace(/^-/,'');const[h,m]=s.split(':').map(Number);return(neg?-1:1)*((h||0)+(m||0)/60);}


  function pontoEmFerias(nome,data){return pontoDadosFerias.some(f=>{const n=(f['COLABORADOR']||'').trim();const dI=f['Início das Férias']?pontoD0(new Date(f['Início das Férias'])):null;const dF=f['Fim das Férias']?pontoD0(new Date(f['Fim das Férias'])):null;return pontoNorm(n)===pontoNorm(nome)&&dI&&dF&&data>=dI&&data<=dF;});}


  function pontoHhMM(n){if(n===0)return '0h00';const s=n<0?'-':'+';n=Math.abs(n);const h=Math.floor(n),m=Math.round((n-h)*60);return s+h+'h'+String(m===60?0:m).padStart(2,'0');}
