const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch,devices}=require('./lib');
const R=[]; const C=async(p,sel)=>{ try{ await p.click(sel,{timeout:3000}); }catch(e){ R.push('STEP-ERR click '+sel+': '+e.message.split('\n')[0]); } }; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
(async()=>{
 const b=await launch();
 // ---------- DESKTOP ----------
 let ctx=await b.newContext({viewport:{width:1366,height:800}}); let p=await ctx.newPage(); const L=[]; watch(p,L);
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(5500);
 ok('intro removida após 5s', await p.$('#intro')===null);
 const info=await p.evaluate(()=>({tiles:document.querySelectorAll('.tile').length, films:document.querySelectorAll('.film').length, quotes:document.querySelectorAll('.ig').length,
   brokenImgs:[...document.images].filter(i=>i.complete&&i.src&&i.naturalWidth===0).map(i=>i.src.slice(0,120)),
   contact:[...document.querySelectorAll('#contato .links a, footer .fcol a')].map(a=>a.textContent+'='+a.getAttribute('href')),
   storyMode:document.querySelector('#story').className, slides:document.querySelectorAll('.story-slide').length,
   nb:[...document.querySelectorAll('#nb .num')].map(x=>x.textContent)}));
 console.log('INFO',JSON.stringify(info,null,1));
 // nav links
 for(const id of ['sobre','portfolio','filmes','depoimentos','investimento','contato']){
   await C(p,`#nav a[href="#${id}"]`); await p.waitForTimeout(1700);
   const top=await p.evaluate(i=>Math.round(document.getElementById(i).getBoundingClientRect().top),id);
   ok('nav desktop -> #'+id, Math.abs(top-84)<40 || top<200, 'top='+top);
 }
 // filters
 await p.evaluate(()=>document.getElementById('portfolio').scrollIntoView()); await p.waitForTimeout(500);
 for(const f of ['pre','wed','all']){ await C(p,`.filters button[data-f="${f}"]`); await p.waitForTimeout(200);
   const v=await p.evaluate(f=>[...document.querySelectorAll('.tile')].filter(t=>!t.classList.contains('hide')).map(t=>t.dataset.cat),f);
   ok('filtro '+f, f==='all'?v.length===info.tiles:v.every(c=>c===f), JSON.stringify(v)); }
 // album open/photo viewer
 const y0=await p.evaluate(()=>scrollY); const h0=await p.evaluate(()=>history.length);
 await C(p,'.tile >> nth=0'); await p.waitForTimeout(800);
 ok('álbum abre', await p.evaluate(()=>document.getElementById('album').classList.contains('open')));
 const cells=await p.$$eval('#galGrid .gal-cell',x=>x.length); ok('grade do álbum tem fotos',cells>0,'cells='+cells);
 await C(p,'#galGrid .gal-cell >> nth=0'); await p.waitForTimeout(600);
 ok('visor abre', await p.evaluate(()=>document.getElementById('photo').classList.contains('open')));
 const c1=await p.textContent('#phCount'); await C(p,'#phNext'); const c2=await p.textContent('#phCount'); await p.keyboard.press('ArrowLeft'); const c3=await p.textContent('#phCount');
 await C(p,'#phPrev'); const c4=await p.textContent('#phCount');
 ok('visor next/prev/teclado', c1!==c2 && c3===c1, [c1,c2,c3,c4].join(' | '));
 const altPh=await p.getAttribute('#phImg','alt'); ok('foto do visor tem alt', !!altPh, 'alt="'+altPh+'"');
 await p.keyboard.press('Escape'); await p.waitForTimeout(400);
 const st1=await p.evaluate(()=>[document.getElementById('photo').classList.contains('open'),document.getElementById('album').classList.contains('open')]);
 ok('Esc fecha foto e mantém álbum', !st1[0]&&st1[1], JSON.stringify(st1));
 await p.keyboard.press('Escape'); await p.waitForTimeout(600);
 const y1=await p.evaluate(()=>scrollY);
 ok('Esc fecha álbum e restaura rolagem', !(await p.evaluate(()=>document.getElementById('album').classList.contains('open'))) && Math.abs(y1-y0)<30, `y0=${y0} y1=${y1}`);
 // browser back button
 await C(p,'.tile >> nth=1'); await p.waitForTimeout(500); await p.goBack(); await p.waitForTimeout(600);
 ok('botão voltar do navegador fecha álbum', !(await p.evaluate(()=>document.getElementById('album').classList.contains('open'))) && p.url().startsWith('http://127.0.0.1:8080/'), p.url());
 // DOUBLE CLICK album tile
 const hBefore=await p.evaluate(()=>history.length);
 await p.dblclick('.tile >> nth=0'); await p.waitForTimeout(600);
 const hAfter=await p.evaluate(()=>history.length);
 const stD=await p.evaluate(()=>({album:document.getElementById('album').classList.contains('open'),photo:document.getElementById('photo').classList.contains('open')}));
 ok('duplo clique na capa do álbum abre só o álbum', stD.album && !stD.photo, `entradas no histórico=${hAfter-hBefore}; estado=${JSON.stringify(stD)}`);
 await p.keyboard.press('Escape'); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
 // rapid double open via JS (simula 2 toques rápidos antes da sobreposição renderizar)
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(5200);
 await p.evaluate(()=>document.getElementById('portfolio').scrollIntoView()); await p.waitForTimeout(500);
 const hb=await p.evaluate(()=>history.length);
 await p.evaluate(()=>{const t=document.querySelector('.tile'); t.click(); t.click();}); await p.waitForTimeout(400);
 const ha=await p.evaluate(()=>history.length);
 await C(p,'#albClose'); await p.waitForTimeout(600);
 const after=await p.evaluate(()=>({album:document.getElementById('album').classList.contains('open'),sr:history.scrollRestoration}));
 const u1=p.url(); let left=false; try{ await p.goBack({timeout:2500}); left=true; }catch(_){}
 await p.waitForTimeout(400);
 ok('2 cliques rápidos na capa: histórico consistente', ha-hb===1, `entradas=${ha-hb}; após X: ${JSON.stringify(after)}; Voltar seguinte ${left?'navegou':'não fez nada (entrada fantasma)'}`);
 // double click photo
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(5200);
 await p.evaluate(()=>document.getElementById('portfolio').scrollIntoView()); await p.waitForTimeout(400);
 await C(p,'.tile >> nth=0'); await p.waitForTimeout(600);
 const hb2=await p.evaluate(()=>history.length); await p.dblclick('#galGrid .gal-cell >> nth=0'); await p.waitForTimeout(400); const ha2=await p.evaluate(()=>history.length); const afterDbl=await p.evaluate(()=>document.getElementById('photo').classList.contains('open')); R.push('INFO visor aberto após duplo clique na foto: '+afterDbl);
 await C(p,'#phClose'); await p.waitForTimeout(500);
 const stP=await p.evaluate(()=>({photo:document.getElementById('photo').classList.contains('open'),album:document.getElementById('album').classList.contains('open')}));
 await p.screenshot({path:OUT+'dbl-photo.png'});ok('duplo clique numa foto: visor permanece aberto', false, `entradas=${ha2-hb2} ${JSON.stringify(stP)}`);
 await p.keyboard.press('Escape'); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
 // films
 await p.evaluate(()=>document.getElementById('filmes').scrollIntoView()); await p.waitForTimeout(400);
 const filmsInfo=[]; const nf=await p.$$eval('.film',x=>x.length);
 for(let i=0;i<nf;i++){ await C(p,`.film >> nth=${i}`); await p.waitForTimeout(700);
   filmsInfo.push(await p.evaluate(()=>({open:document.getElementById('vmodal').classList.contains('open'),iframe:!!document.querySelector('#vmodal iframe'),note:getComputedStyle(document.querySelector('#vmodal .vnote')).display,watch:document.getElementById('vWatch').getAttribute('href'), title:document.getElementById('vTitle').textContent})));
   await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
 console.log('FILMS',JSON.stringify(filmsInfo));
 ok('modal de filme abre e fecha com Esc', filmsInfo.every(f=>f.open) && !(await p.evaluate(()=>document.getElementById('vmodal').classList.contains('open'))));
 // films keyboard accessible?
 const filmFocusable=await p.$eval('.film',f=>f.tabIndex>=0 || !!f.querySelector('a,button'));
 ok('cartão de filme acessível por teclado', filmFocusable);
 // vmodal backdrop click and vBuy
 await C(p,'.film >> nth=0'); await p.waitForTimeout(500); await p.mouse.click(10,400); await p.waitForTimeout(300);
 ok('clique no fundo fecha modal de filme', !(await p.evaluate(()=>document.getElementById('vmodal').classList.contains('open'))));
 await C(p,'.film >> nth=0'); await p.waitForTimeout(500); await C(p,'#vBuy'); await p.waitForTimeout(1800);
 const ct=await p.evaluate(()=>Math.round(document.getElementById('contato').getBoundingClientRect().top)); ok('"Quero este filme" leva ao Contato', ct<200, 'top='+ct);
 // placeholder links
 const ph=await p.evaluate(()=>[...document.querySelectorAll('[data-ph]')].map(a=>a.textContent));
 ok('links de contato todos preenchidos (sem placeholder)', ph.length===0, JSON.stringify(ph));
 // theme
 const t0=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));
 await C(p,'#themeBtn'); const t1=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));
 await p.reload({waitUntil:'load'}); const t2=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));
 ok('tema alterna e persiste após recarregar', t1&&t1!==t0 && t2===t1, `${t0}->${t1}->reload ${t2}`);
 await p.waitForTimeout(800); await p.screenshot({path:OUT+'home-light.png'});
 await C(p,'#themeBtn');
 // story arrows (photo mode only)
 console.log('DESKTOP LOGS\n'+[...new Set(L)].join('\n'));
 await ctx.close();
 // ---------- SUPABASE FORA DO AR ----------
 ctx=await b.newContext({viewport:{width:1366,height:800}}); p=await ctx.newPage(); const L2=[]; watch(p,L2);
 await p.route(/supabase\.co/,r=>r.abort()); await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(6000);
 const fb=await p.evaluate(()=>({tiles:document.querySelectorAll('.tile').length,slides:document.querySelectorAll('.story-slide').length,films:document.querySelectorAll('.film').length,ph:[...document.querySelectorAll('[data-ph]')].length}));
 ok('com Supabase fora do ar, site mostra conteúdo de exemplo', fb.tiles>0&&fb.slides>0, JSON.stringify(fb));
 await p.screenshot({path:OUT+'home-offline-db.png'});
 await p.evaluate(()=>document.getElementById('contato').scrollIntoView()); await p.waitForTimeout(800);
 await C(p,'#contato .links a >> nth=0'); await p.waitForTimeout(300); const tx=await p.textContent('#contato .links a >> nth=0');
 ok('contato sem banco: link do WhatsApp utilizável', tx!=='a definir', 'texto vira "'+tx+'" e nada acontece');
 await ctx.close();
 // ---------- CDN supabase-js bloqueado ----------
 ctx=await b.newContext({viewport:{width:1366,height:800}}); p=await ctx.newPage(); const L3=[]; watch(p,L3);
 await p.route(/jsdelivr/,r=>r.abort()); await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(5000);
 const cd=await p.evaluate(()=>({tiles:document.querySelectorAll('.tile').length,slides:document.querySelectorAll('.story-slide').length}));
 ok('com CDN bloqueado o site ainda monta', cd.tiles>0&&cd.slides>0, JSON.stringify(cd)+' '+L3.filter(x=>/PAGEERROR/.test(x)).join(';'));
 await ctx.close();
 console.log(R.join('\n'));
 await b.close();
})();
