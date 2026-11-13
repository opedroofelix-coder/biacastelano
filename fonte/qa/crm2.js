const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch,devices}=require('./lib'); const {installMock}=require('./mock');
const R=[]; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
const URL='http://127.0.0.1:8080/crm/';
const toast=p=>p.evaluate(()=>document.getElementById('toast').textContent);
async function setup(b,opts={},co={viewport:{width:1440,height:900}}){ const ctx=await b.newContext(co); const st=await installMock(ctx,opts); const p=await ctx.newPage(); const L=[]; watch(p,L); p.on('dialog',d=>{st.lastDialog=d.message(); d.accept();});
 await p.goto(URL); await p.fill('#email','bia@teste.com'); await p.fill('#password','senha123'); await p.click('#loginBtn'); await p.waitForTimeout(2000); return {ctx,st,p,L}; }
const fechar=async p=>{ await p.keyboard.press('Escape'); await p.waitForTimeout(150); if(await p.isVisible('#formConfYes')) await p.click('#formConfYes'); await p.waitForTimeout(150); };
async function newForm(p,kind){ await p.click('#newBtn'); await p.waitForTimeout(150); await p.click(`#newMenu [data-new="${kind}"]`); await p.waitForTimeout(250); }
(async()=>{
 const b=await launch(); let {ctx,st,p,L}=await setup(b);
 // ---- cliente vazio
 await newForm(p,'client'); const n0=st.db.crm_clients.length; await p.click('#formSave'); await p.waitForTimeout(500);
 ok('cliente sem nome é recusado com mensagem', st.db.crm_clients.length===n0 && /Preencha/.test(await toast(p)), await toast(p));
 // somente espaços
 await p.fill('#f_couple','    '); await p.click('#formSave'); await p.waitForTimeout(400);
 ok('nome só com espaços é recusado', st.db.crm_clients.length===n0);
 // valor em formato BR
 await p.fill('#f_couple','Teste Valor BR'); await p.locator('#f_value').pressSequentially('1.500,50'); 
 const raw=await p.inputValue('#f_value'); await p.click('#formSave'); await p.waitForTimeout(1200);
 const cBR=st.db.crm_clients.find(c=>c.couple==='Teste Valor BR');
 ok('valor "1.500,50" é salvo corretamente ou recusado', cBR? +cBR.value===1500.5 : true, `campo ficou "${raw}"; salvo value=${cBR&&cBR.value}; toast="${await toast(p)}"`);
 // valor negativo e enorme, email/whats inválido, data distante
 await newForm(p,'client'); await p.fill('#f_couple','Teste Limites'); await p.fill('#f_value','-5000'); await p.fill('#f_email','nao-email'); await p.fill('#f_whatsapp','abc');
 await p.fill('#f_event_date','1900-01-01'); await p.click('#formSave'); await p.waitForTimeout(1200);
 const cL=st.db.crm_clients.find(c=>c.couple==='Teste Limites');
 ok('valor negativo / e-mail / WhatsApp / data 1900 inválidos são recusados', !cL, cL?`salvou value=${cL.value} email=${cL.email} whatsapp=${cL.whatsapp} event_date=${cL.event_date}`:''); if(await p.evaluate(()=>document.getElementById('formOv').classList.contains('on'))){ R.push('INFO recusado: "'+await toast(p)+'"'); await fechar(p); }
 await newForm(p,'client'); await p.fill('#f_couple','Teste Enorme'); await p.fill('#f_value','99999999999'); await p.click('#formSave'); await p.waitForTimeout(1200);
 R.push('INFO valor 99.999.999.999 -> toast "'+await toast(p)+'" ; form aberto='+await p.evaluate(()=>document.getElementById('formOv').classList.contains('on')));
 await fechar(p);
 // nome muito longo / HTML
 await newForm(p,'client'); await p.fill('#f_couple','<img src=x onerror="window.__xss=1">'+'A'.repeat(300)); await p.click('#formSave'); await p.waitForTimeout(1500);
 await p.click('#nav button[data-view="clientes"]'); await p.waitForTimeout(800);
 ok('nome com HTML não executa script', !(await p.evaluate(()=>window.__xss)));
 const ov=await p.evaluate(()=>{ const d=[...document.querySelectorAll('.deal')].find(x=>x.textContent.includes('AAAA')); if(!d) return 'nao achou'; return {w:d.scrollWidth,cw:d.clientWidth}; });
 ok('nome muito longo não estoura o card do funil', ov.w<=ov.cw+1, JSON.stringify(ov));
 await p.screenshot({path:OUT+'crm-longname.png'});
 // ---- duplo clique salvar
 await newForm(p,'client'); await p.fill('#f_couple','Duplo Clique'); await p.dblclick('#formSave'); await p.waitForTimeout(1500);
 ok('duplo clique em Salvar cria 1 cliente', st.db.crm_clients.filter(c=>c.couple==='Duplo Clique').length===1, 'criados='+st.db.crm_clients.filter(c=>c.couple==='Duplo Clique').length);
 // Enter duas vezes
 await newForm(p,'task'); await p.fill('#f_title','Tarefa Enter'); await p.press('#f_title','Enter'); await p.press('#f_title','Enter').catch(()=>{}); await p.waitForTimeout(1500);
 ok('Enter duplo no formulário cria 1 tarefa', st.db.crm_tasks.filter(t=>t.title==='Tarefa Enter').length===1, 'criadas='+st.db.crm_tasks.filter(t=>t.title==='Tarefa Enter').length);
 // ---- compromisso sem data
 await newForm(p,'event'); await p.fill('#f_title','Sem data'); await p.fill('#f_date',''); await p.click('#formSave'); await p.waitForTimeout(500);
 ok('compromisso sem data é recusado', !st.db.crm_events.some(e=>e.title==='Sem data'), await toast(p)); await fechar(p);
 // ---- parcela
 await newForm(p,'payment'); await p.click('#formSave'); await p.waitForTimeout(400); ok('parcela sem valor recusada', /Preencha/.test(await toast(p)), await toast(p));
 await p.fill('#f_amount','0'); await p.click('#formSave'); await p.waitForTimeout(1200);
 R.push('INFO parcela valor 0 sem cliente -> salvou? '+st.db.crm_payments.some(x=>+x.amount===0)+' toast="'+await toast(p)+'"'); if(await p.evaluate(()=>document.getElementById('formOv').classList.contains('on'))){ R.push('INFO recusado: "'+await toast(p)+'"'); await fechar(p); }
 await newForm(p,'payment'); await p.fill('#f_amount','-300'); await p.fill('#f_paid_at','2030-01-01'); await p.click('#formSave'); await p.waitForTimeout(1200);
 const neg=st.db.crm_payments.find(x=>+x.amount===-300); ok('parcela negativa / paga no futuro recusada', !neg, neg?`salvou amount=${neg.amount} paid_at=${neg.paid_at}`:''); if(await p.evaluate(()=>document.getElementById('formOv').classList.contains('on'))){ R.push('INFO recusado: "'+await toast(p)+'"'); await fechar(p); }
 // ---- entrega progresso fora do limite
 await newForm(p,'delivery'); await p.fill('#f_item','Entrega 150'); await p.fill('#f_progress','150'); await p.click('#formSave'); await p.waitForTimeout(1200);
 R.push('INFO entrega progresso 150 -> salvo '+JSON.stringify((st.db.crm_deliveries.find(x=>x.item==='Entrega 150')||{}).progress));
 // ---- marcar pago duplo clique
 await p.click('#nav button[data-view="financeiro"]'); await p.waitForTimeout(800); await p.click('#eyeBtn');
 const mv0=st.db.cx_movimentos.length, w0=st.writes.filter(w=>w[1]==='crm_payments').length;
 await p.dblclick('[data-pay] >> nth=0'); await p.waitForTimeout(2500);
 const mv1=st.db.cx_movimentos.length, w1=st.writes.filter(w=>w[1]==='crm_payments').length;
 ok('duplo clique em "marcar pago" gera 1 lançamento no Caixa', mv1-mv0===1 && w1-w0===1, `updates em crm_payments=${w1-w0}; lançamentos no caixa=${mv1-mv0}; ${JSON.stringify(st.db.cx_movimentos.map(m=>[m.d,m.e,m.payment_id&&m.payment_id.slice(0,6)]))}`);
 await p.screenshot({path:OUT+'crm-fin-after-pay.png',fullPage:true});
 // ---- modal: fechar com dados digitados (proteção da main: confirmação embutida; clique fora não fecha)
 await newForm(p,'client'); await p.fill('#f_couple','Rascunho perdido'); await p.mouse.click(5,5); await p.waitForTimeout(300);
 const aberto1=await p.evaluate(()=>document.getElementById('formOv').classList.contains('on'));
 await p.keyboard.press('Escape'); await p.waitForTimeout(200); const conf=await p.isVisible('#formConf');
 ok('fechar formulário com dados digitados pede confirmação', aberto1 && conf, `clique fora manteve aberto=${aberto1}; Esc mostrou confirmação=${conf}`);
 await p.click('#formConfYes'); await p.waitForTimeout(200);
 await newForm(p,'client'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
 ok('fechar formulário sem digitar nada não pergunta', !(await p.evaluate(()=>document.getElementById('formOv').classList.contains('on'))));
 // ---- drawer: abrir cliente, mudar etapa, checklist, excluir
 await p.click('#nav button[data-view="clientes"]'); await p.waitForTimeout(600);
 await p.click('.deal:has-text("Ana & Léo")'); await p.waitForTimeout(600);
 ok('ficha do cliente abre', await p.evaluate(()=>document.getElementById('drawer').classList.contains('on')));
 await p.fill('#drCheckInp',''); await p.click('#drCheckAdd button'); await p.waitForTimeout(500);
 const ck=(st.db.crm_clients.find(c=>c.couple==='Ana & Léo').checklist||[]); ok('item vazio no checklist recusado', !ck.some(x=>!x.t||!String(x.t).trim()), JSON.stringify(ck));
 await p.screenshot({path:OUT+'crm-drawer.png'});
 await p.click('#drDelete'); await p.waitForTimeout(1500);
 ok('excluir cliente pede confirmação e remove', st.lastDialog && !st.db.crm_clients.some(c=>c.couple==='Ana & Léo'), st.lastDialog);
 // ---- busca
 await p.fill('#q','zzz-inexistente'); await p.waitForTimeout(600); const deals=await p.$$eval('.deal',x=>x.length); 
 R.push('INFO busca sem resultado: cards='+deals+' ; texto vazio exibido? '+await p.evaluate(()=>/nenhum|não encontr/i.test(document.getElementById('board').innerText)));
 await p.fill('#q','helena'); await p.waitForTimeout(500); R.push('INFO busca "helena" (minúscula) -> '+JSON.stringify(await p.$$eval('.deal .cp',x=>x.map(e=>e.textContent))));
 await p.fill('#q','theo'); await p.waitForTimeout(500); R.push('INFO busca "theo" (sem acento) -> '+JSON.stringify(await p.$$eval('.deal .cp',x=>x.map(e=>e.textContent))));
 await p.fill('#q','');
 // ---- falha de rede ao salvar
 st.opts.failWriteTables=['crm_clients']; await newForm(p,'client'); await p.fill('#f_couple','Falha Rede'); await p.click('#formSave'); await p.waitForTimeout(1200);
 ok('erro ao salvar mantém formulário aberto e avisa', await p.evaluate(()=>document.getElementById('formOv').classList.contains('on')) && /Erro/.test(await toast(p)), await toast(p));
 await fechar(p); await p.waitForTimeout(500);
 // drag & drop com falha
 await p.click('#nav button[data-view="clientes"]'); await p.waitForTimeout(500);
 await p.locator('.deal:has-text("Marina")').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
 await p.dragAndDrop('.deal:has-text("Marina")','.col[data-stage="contr"]',{targetPosition:{x:60,y:40}}); await p.waitForTimeout(1200);
 ok('arrastar com falha no banco desfaz e avisa', st.db.crm_clients.find(c=>c.couple==='Marina & Rafa').stage==='prop' && /Não foi possível/.test(await toast(p)), await toast(p));
 st.opts.failWriteTables=[];
 await p.dragAndDrop('.deal:has-text("Marina")','.col[data-stage="contr"]',{targetPosition:{x:60,y:40}}); await p.waitForTimeout(1200);
 ok('arrastar card muda etapa', st.db.crm_clients.find(c=>c.couple==='Marina & Rafa').stage==='contr', await toast(p));
 // ---- tabela inexistente
 console.log('LOGS\n'+[...new Set(L)].join('\n')); await ctx.close();
 ({ctx,st,p,L}=await setup(b,{failTables:['crm_clients']})); 
 R.push('INFO falha ao carregar crm_clients -> toast "'+await toast(p)+'"; painel diz: '+(await p.textContent('#pageSub')));
 await p.screenshot({path:OUT+'crm-loadfail.png'}); await ctx.close();
 // ---- mobile: formulário e ficha
 ({ctx,st,p,L}=await setup(b,{},{...devices['iPhone 13']}));
 await newForm(p,'client'); await p.screenshot({path:OUT+'crm-m-form.png'});
 const fb=await p.evaluate(()=>{ const r=document.getElementById('formSave').getBoundingClientRect(); return {bottom:Math.round(r.bottom),vh:innerHeight}; });
 R.push('INFO mobile: botão Salvar do formulário '+JSON.stringify(fb));
 await fechar(p); await p.click('#nav button[data-view="clientes"]'); await p.waitForTimeout(500);
 await p.tap('.deal >> nth=0'); await p.waitForTimeout(700); await p.screenshot({path:OUT+'crm-m-drawer.png'});
 // touch drag não existe: verificar se há alternativa (select de etapa na ficha)
 ok('mobile: mudar etapa sem arrastar (select na ficha)', await p.isVisible('#drStage'));
 await fechar(p);
 await p.click('#nav button[data-view="caixa"]'); await p.waitForTimeout(600); await p.click('text=Planilha >> nth=-1').catch(()=>{}); await p.waitForTimeout(600); await p.screenshot({path:OUT+'crm-m-caixa-planilha.png'});
 console.log('LOGSM\n'+[...new Set(L)].join('\n'));
 await ctx.close(); console.log(R.join('\n')); await b.close();
})();
