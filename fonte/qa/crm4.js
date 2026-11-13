const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch}=require('./lib'); const {installMock}=require('./mock');
const R=[]; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
(async()=>{ const b=await launch(); const ctx=await b.newContext({viewport:{width:1440,height:900}}); const st=await installMock(ctx); const p=await ctx.newPage(); const L=[]; watch(p,L); p.on('dialog',d=>d.accept());
 await p.goto('http://127.0.0.1:8080/crm/'); await p.fill('#email','bia@teste.com'); await p.fill('#password','senha123'); await p.click('#loginBtn'); await p.waitForTimeout(2000);
 await p.click('#nav button[data-view="caixa"]'); await p.waitForTimeout(500); await p.click('#eyeBtn');
 await p.click('#view-caixa >> text=Planilha'); await p.waitForTimeout(600);
 const m0=st.db.cx_meses.length; await p.dblclick('#cx-novoMes'); await p.waitForTimeout(2000);
 R.push('INFO duplo clique em "novo mês" criou '+(st.db.cx_meses.length-m0)+' meses: '+JSON.stringify(st.db.cx_meses.map(m=>m.mes)));
 const cases=['1.500','1.500,50','1500,50','abc','0','-200'];
 for(const t of cases){ await p.click('#cx-addLinha'); await p.waitForTimeout(400);
   const row=p.locator('#cx-movBody tr').first(); await row.locator('[data-k="d"]').fill('Teste '+t); await row.locator('[data-k="d"]').press('Tab');
   await p.waitForTimeout(300); const r2=p.locator('#cx-movBody tr', {has: p.locator(`[data-k="d"][value="Teste ${t}"]`)}).first();
   const e=p.locator('#cx-movBody tr').filter({has:p.locator('[data-k="d"]')}).first();
   await e.locator('[data-k="e"]').fill(t); await e.locator('[data-k="e"]').press('Tab'); await p.waitForTimeout(1200);
   const mv=st.db.cx_movimentos.find(m=>m.d==='Teste '+t);
   R.push(`INFO Caixa entrada digitada "${t}" -> salva ${mv?JSON.stringify(mv.e):'(linha não encontrada)'}`); }
 await p.screenshot({path:OUT+'crm-caixa-sheet.png'});
 console.log([...new Set(L)].join('\n')); console.log(R.join('\n')); await b.close(); })();
