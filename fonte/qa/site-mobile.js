const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch,devices}=require('./lib');
const R=[]; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
const C=async(p,sel)=>{ try{ await p.click(sel,{timeout:3000}); return true; }catch(e){ R.push('STEP-ERR click '+sel+': '+e.message.split('\n')[0]); return false; } };
(async()=>{
 const b=await launch();
 for(const w of [320,360,414]){
   const ctx=await b.newContext({viewport:{width:w,height:740},isMobile:true,hasTouch:true,deviceScaleFactor:1}); const p=await ctx.newPage();
   await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(5500);
   const ov=await p.evaluate(()=>{ const W=document.documentElement.clientWidth; const out=[]; document.querySelectorAll('body *').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width>0&&r.right>W+1){ const cs=getComputedStyle(e); let a=e.parentElement, clipped=false; while(a&&a!==document.body){ const s=getComputedStyle(a); if(/(hidden|auto|scroll|clip)/.test(s.overflowX)){clipped=true;break;} a=a.parentElement;} if(!clipped && cs.position!=='fixed') out.push((e.id||e.className||e.tagName).toString().slice(0,40)+':'+Math.round(r.right)); } }); return {sw:document.documentElement.scrollWidth,W,out:out.slice(0,8)}; });
   ok(`sem rolagem horizontal em ${w}px`, ov.sw<=ov.W, JSON.stringify(ov));
   // tap targets < 40px
   const small=await p.evaluate(()=>[...document.querySelectorAll('a,button,[role=button]')].filter(e=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&(r.height<32||r.width<32);}).map(e=>(e.id||e.textContent.trim().slice(0,18)||e.getAttribute('aria-label')||e.className)+` ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
   if(w===360) R.push('INFO alvos de toque <32px em 360px: '+JSON.stringify(small));
   await ctx.close();
 }
 const ctx=await b.newContext({...devices['iPhone 13']}); const p=await ctx.newPage(); const L=[]; watch(p,L);
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'load'}); await p.waitForTimeout(5500);
 // menu
 await C(p,'#menuBtn'); await p.waitForTimeout(500);
 const mo=await p.evaluate(()=>({open:document.getElementById('nav').classList.contains('open'),txt:document.getElementById('menuBtn').textContent, aria:document.getElementById('menuBtn').getAttribute('aria-expanded')}));
 ok('menu mobile abre', mo.open, JSON.stringify(mo));
 await p.screenshot({path:OUT+'m-menu.png'});
 await C(p,'#nav a[href="#portfolio"]'); await p.waitForTimeout(1800);
 const mt=await p.evaluate(()=>({open:document.getElementById('nav').classList.contains('open'),top:Math.round(document.getElementById('portfolio').getBoundingClientRect().top)}));
 ok('link do menu fecha menu e rola até a seção', !mt.open && mt.top<220, JSON.stringify(mt));
 await C(p,'#menuBtn'); await p.waitForTimeout(300); await C(p,'#menuBtn'); await p.waitForTimeout(300);
 ok('menu abre/fecha no botão', !(await p.evaluate(()=>document.getElementById('nav').classList.contains('open'))));
 // album on mobile, swipe
 await p.evaluate(()=>document.getElementById('portfolio').scrollIntoView()); await p.waitForTimeout(600);
 await p.tap('.tile >> nth=0'); await p.waitForTimeout(800);
 await p.screenshot({path:OUT+'m-album.png'});
 await p.tap('#galGrid .gal-cell >> nth=0'); await p.waitForTimeout(800);
 const c1=await p.textContent('#phCount');
 await p.evaluate(()=>{ const el=document.getElementById('photo'); const mk=(t,x)=>{ const tc=new Touch({identifier:1,target:el,clientX:x,clientY:400}); el.dispatchEvent(new TouchEvent(t,{touches:t==='touchend'?[]:[tc],changedTouches:[tc],bubbles:true})); }; mk('touchstart',300); mk('touchend',100); });
 await p.waitForTimeout(300); const c2=await p.textContent('#phCount');
 ok('swipe no visor avança foto', c1!==c2, c1+' -> '+c2);
 await p.screenshot({path:OUT+'m-photo.png'});
 await p.goBack(); await p.waitForTimeout(500);
 const s1=await p.evaluate(()=>[document.getElementById('photo').classList.contains('open'),document.getElementById('album').classList.contains('open')]);
 await p.goBack(); await p.waitForTimeout(600);
 const s2=await p.evaluate(()=>[document.getElementById('photo').classList.contains('open'),document.getElementById('album').classList.contains('open')]);
 ok('Voltar do aparelho: fecha foto, depois álbum', !s1[0]&&s1[1]&&!s2[0]&&!s2[1], JSON.stringify([s1,s2]));
 // testimonials carousel
 await p.evaluate(()=>document.getElementById('depoimentos').scrollIntoView()); await p.waitForTimeout(800);
 const dots=await p.$$eval('#quotesDots button',x=>x.length); 
 if(dots>2){ await p.tap('#quotesDots button >> nth=2'); await p.waitForTimeout(900); }
 const on=await p.$$eval('#quotesDots button',x=>x.findIndex(b=>b.classList.contains('on')));
 ok('bolinhas dos depoimentos navegam', dots>0 && on===2, `dots=${dots} ativo=${on}`);
 await p.screenshot({path:OUT+'m-quotes.png'});
 // invest + contact screenshots
 await p.evaluate(()=>document.getElementById('investimento').scrollIntoView()); await p.waitForTimeout(800); await p.screenshot({path:OUT+'m-invest.png'});
 await p.evaluate(()=>document.getElementById('contato').scrollIntoView()); await p.waitForTimeout(800); await p.screenshot({path:OUT+'m-contato.png'});
 await p.evaluate(()=>document.getElementById('numeros').scrollIntoView()); await p.waitForTimeout(2600); await p.screenshot({path:OUT+'m-numeros.png'});
 R.push('INFO números: '+JSON.stringify(await p.$$eval('#nb .num',x=>x.map(e=>e.textContent))));
 // film modal mobile
 await p.evaluate(()=>document.getElementById('filmes').scrollIntoView()); await p.waitForTimeout(600);
 await p.tap('.film >> nth=1'); await p.waitForTimeout(800); await p.screenshot({path:OUT+'m-film-nolink.png'});
 const wt=await p.evaluate(()=>({watchVisible:getComputedStyle(document.getElementById('vWatch')).display, watchHref:document.getElementById('vWatch').getAttribute('href'), note:document.querySelector('#vmodal .vnote').textContent.trim()}));
 R.push('INFO filme sem link: '+JSON.stringify(wt));
 if(wt.watchVisible!=='none'){ await p.tap('#vWatch'); await p.waitForTimeout(300); R.push('INFO texto botão Assistir após toque: '+await p.textContent('#vWatch')); }
 await p.tap('#vmodal .lb-close'); await p.waitForTimeout(400);
 // tap film with link -> after close is film stopped
 await p.tap('.film >> nth=0'); await p.waitForTimeout(1200); await p.screenshot({path:OUT+'m-film.png'}); await p.tap('#vmodal .lb-close'); await p.waitForTimeout(300);
 ok('fechar modal remove o iframe (para o vídeo)', !(await p.$('#vmodal iframe')));
 // body overflow after menu open + link
 console.log('LOGS\n'+[...new Set(L)].filter(x=>!/youtube|ytimg|ggpht|googleapis|web-share|adapters|allowfullscreen|403/.test(x)).join('\n'));
 console.log(R.join('\n'));
 await b.close();
})();
