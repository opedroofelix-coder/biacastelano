const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch,devices}=require('./lib'); const {installMock}=require('./mock');
const R=[]; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
const URL='http://127.0.0.1:8080/crm/';
(async()=>{
 const b=await launch();
 for(const mode of ['desk','mob']){
  const ctx=await b.newContext(mode==='desk'?{viewport:{width:1440,height:900}}:{...devices['iPhone 13']}); const st=await installMock(ctx); const p=await ctx.newPage(); const L=[]; watch(p,L); p.on('dialog',d=>d.accept());
  await p.goto(URL); await p.waitForTimeout(1500);
  await p.screenshot({path:OUT+`crm-${mode}-login.png`});
  if(mode==='desk'){
   await p.click('#loginBtn'); await p.waitForTimeout(300); ok('CRM login vazio bloqueado', (st.loginAttempts||0)===0);
   await p.fill('#email','bia@teste.com'); await p.fill('#password','x'); await p.click('#loginBtn'); await p.waitForTimeout(1000);
   R.push('INFO CRM login senha errada: "'+await p.textContent('#loginMsg')+'"');
   // double click login
   await p.fill('#password','senha123'); const a0=st.loginAttempts; await p.dblclick('#loginBtn'); await p.waitForTimeout(1800);
   ok('duplo clique em Entrar faz 1 requisição', st.loginAttempts-a0===1, 'tentativas='+(st.loginAttempts-a0));
  } else { await p.fill('#email','bia@teste.com'); await p.fill('#password','senha123'); await p.click('#loginBtn'); await p.waitForTimeout(2000); }
  ok(mode+': app visível após login', await p.isVisible('#app'));
  for(const v of ['painel','agenda','clientes','financeiro','caixa','entregas']){
    if(mode==='desk') await p.click(`#nav button[data-view="${v}"]`); else await p.click(`#nav button[data-view="${v}"]`).catch(async e=>{ R.push('STEP-ERR nav '+v+' '+e.message.split('\n')[0]); });
    await p.waitForTimeout(900);
    const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    ok(`${mode}: ${v} sem rolagem horizontal da página`, o.sw<=o.cw, JSON.stringify(o));
    await p.screenshot({path:OUT+`crm-${mode}-${v}.png`, fullPage: mode==='desk'});
  }
  console.log(mode,'LOGS\n'+[...new Set(L)].join('\n'));
  await ctx.close();
 }
 console.log(R.join('\n')); await b.close();
})();
