// QA da ligação com o Google Agenda pelo endereço secreto (função crm-agenda simulada)
const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch,devices}=require('./lib'); const {installMock}=require('./mock');
const R=[]; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
const URL='http://127.0.0.1:8080/crm/';
const dd=n=>{const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10);}; const D1=dd(2), D2=dd(3);
const EVS=[{id:'a',summary:'Reunião com noivos (Google)',location:'Café',start:{dateTime:`${D1}T18:00:00.000Z`},end:{dateTime:`${D1}T19:00:00.000Z`}},
           {id:'b',summary:'Feriado (Google)',start:{date:D2},end:{date:dd(4)}}];
(async()=>{
 const b=await launch();
 for(const mode of ['desk','mob']){
  const ctx=await b.newContext(mode==='desk'?{viewport:{width:1440,height:900}}:{...devices['iPhone 13']});
  const st=await installMock(ctx); const F=[];
  await ctx.route(/\/functions\/v1\/crm-agenda/, async route=>{ const rq=route.request();
    const H={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
    if(rq.method()==='OPTIONS') return route.fulfill({status:200,headers:H});
    const body=JSON.parse(rq.postData()||'{}'); F.push(body.acao);
    const J=(s,o)=>route.fulfill({status:s,contentType:'application/json',headers:H,body:JSON.stringify(o)});
    if(body.acao==='salvar'){ if(/ruim/.test(body.url)) return J(502,{erro:'O Google não encontrou essa agenda.'}); return J(200,{ok:true,eventos:EVS}); }
    if(body.acao==='remover') return J(200,{ok:true});
    return J(200,{ok:true,conectado:true,eventos:EVS}); });
  const p=await ctx.newPage(); const L=[]; watch(p,L); p.on('dialog',d=>d.accept());
  await p.goto(URL); await p.fill('#email','bia@teste.com'); await p.fill('#password','senha123'); await p.click('#loginBtn'); await p.waitForTimeout(1800);
  await p.click('#nav button[data-view="agenda"]'); await p.waitForTimeout(700);
  ok(mode+': estado inicial desconectado', (await p.textContent('#gState'))==='desconectado');
  ok(mode+': campo do endereço visível', await p.isVisible('#gIcs'));
  ok(mode+': sem script do Google Identity', await p.evaluate(()=>!document.querySelector('script[src*="gsi/client"]')));
  await p.click('#gHelp summary'); await p.waitForTimeout(200);
  await p.screenshot({path:OUT+`agenda-${mode}-desconectado.png`, fullPage:mode==='desk'});
  await p.fill('#gIcs','https://exemplo.com/x.ics'); await p.click('#gConnect'); await p.waitForTimeout(400);
  ok(mode+': endereço que não é do Google é recusado sem chamar a função', !F.includes('salvar'));
  await p.fill('#gIcs','https://calendar.google.com/calendar/ical/ruim%40gmail.com/private-abc/basic.ics'); await p.click('#gConnect'); await p.waitForTimeout(800);
  ok(mode+': erro do Google aparece e continua desconectado', (await p.textContent('#gState'))==='desconectado');
  await p.fill('#gIcs','https://calendar.google.com/calendar/ical/bia%40gmail.com/private-abc/basic.ics'); await p.click('#gConnect'); await p.waitForTimeout(1000);
  ok(mode+': conectado', (await p.textContent('#gState'))==='conectado', await p.textContent('#gMsg'));
  ok(mode+': formulário some quando conectado', !(await p.isVisible('#gIcs')));
  const cal=await p.textContent('#cal'); ok(mode+': evento do Google no calendário', /Reunião com noivos/.test(cal));
  await p.evaluate((D1)=>{ const c=[...document.querySelectorAll('#cal .cell')].find(x=>new Date(+x.dataset.day).toDateString()===new Date(D1+'T12:00').toDateString()); c.click(); },D1);
  await p.waitForTimeout(300); ok(mode+': dia mostra o evento', /Reunião com noivos/.test(await p.textContent('#dayList')));
  const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})); ok(mode+': sem rolagem horizontal', o.sw<=o.cw, JSON.stringify(o));
  await p.screenshot({path:OUT+`agenda-${mode}-conectado.png`, fullPage:mode==='desk'});
  await p.click('#gSync'); await p.waitForTimeout(700); ok(mode+': Atualizar chama eventos', F.filter(x=>x==='eventos').length>=1, F.join(','));
  await p.click('#nav button[data-view="painel"]'); await p.waitForTimeout(500);
  ok(mode+': painel mostra evento do Google', /Reunião com noivos|Feriado/.test(await p.textContent('#upcoming')));
  await p.click('#nav button[data-view="agenda"]'); await p.waitForTimeout(400);
  await p.click('#gOff'); await p.waitForTimeout(700);
  ok(mode+': desconectar', (await p.textContent('#gState'))==='desconectado' && !/Reunião com noivos/.test(await p.textContent('#cal')));
  console.log(mode,'LOGS\n'+[...new Set(L)].join('\n'));
  await ctx.close();
 }
 console.log(R.join('\n')); await b.close();
})();
