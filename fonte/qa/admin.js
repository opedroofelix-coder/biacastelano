const OUT=require('path').join(__dirname,'saida')+'/'; require('fs').mkdirSync(OUT,{recursive:true});
const {launch,watch,devices}=require('./lib'); const {installMock}=require('./mock');
const R=[]; const ok=(n,c,d)=>{R.push((c?'PASS ':'FAIL ')+n+(d?' :: '+d:''));};
const URL='http://127.0.0.1:8080/admin/';
async function setup(b,opts={},ctxo={viewport:{width:1366,height:850}}){ const ctx=await b.newContext(ctxo); const st=await installMock(ctx,opts); const p=await ctx.newPage(); const L=[]; watch(p,L); p.on('dialog',d=>{ st.lastDialog=d.message(); d.accept(); }); return {ctx,st,p,L}; }
async function login(p,e='bia@teste.com',pw='senha123'){ await p.fill('#email',e); await p.fill('#password',pw); await p.click('#loginBtn'); }
const toast=p=>p.evaluate(()=>document.getElementById('toast').textContent);
(async()=>{
 const b=await launch();
 let {ctx,st,p,L}=await setup(b);
 await p.goto(URL); await p.waitForTimeout(1500);
 ok('tela de login aparece sem sessão', await p.isVisible('#loginForm'));
 // vazio
 await p.click('#loginBtn'); await p.waitForTimeout(300);
 const v1=await p.evaluate(()=>document.getElementById('email').validationMessage);
 ok('login vazio bloqueado (validação nativa)', !!v1 && (st.loginAttempts||0)===0, v1);
 // email inválido
 await p.fill('#email','bia'); await p.fill('#password','x'); await p.click('#loginBtn'); await p.waitForTimeout(300);
 ok('e-mail inválido bloqueado', (st.loginAttempts||0)===0, await p.evaluate(()=>document.getElementById('email').validationMessage));
 // senha errada
 await login(p,'bia@teste.com','errada'); await p.waitForTimeout(1200);
 const m1=await p.textContent('#loginMsg'); ok('senha errada mostra mensagem', /Não foi possível/.test(m1), m1);
 R.push('INFO mensagem de erro de login: "'+m1+'" (em inglês vindo do Supabase?)');
 // espaços no email
 await login(p,'  bia@teste.com  ','senha123'); await p.waitForTimeout(1500);
 ok('login com espaços ao redor do e-mail funciona', await p.isVisible('#app'));
 await p.reload(); await p.waitForTimeout(1500);
 ok('sessão persiste após recarregar', await p.isVisible('#app'));
 // aba textos carregada
 const vals=await p.evaluate(()=>({wa:document.getElementById('whatsapp').value,ig:document.getElementById('instagram').value, p:[...document.querySelectorAll('#proposito textarea')].map(t=>t.value)}));
 ok('textos carregados do banco', vals.wa==='5511945198244', JSON.stringify(vals));
 // invalid data in contact
 await p.fill('#whatsapp','abc'); await p.fill('#email_contact','nao-e-email'); await p.fill('#instagram','javascript:alert(1)');
 await p.click('#saveTextos'); await p.waitForTimeout(800);
 const s1=st.db.site_settings[0]; ok('WhatsApp/e-mail inválidos são recusados', s1.whatsapp!=='abc' && s1.email!=='nao-e-email', `salvou whatsapp="${s1.whatsapp}" email="${s1.email}" instagram="${s1.instagram}" toast="${await toast(p)}"`);
 // restore
 await p.fill('#whatsapp','5511945198244'); await p.fill('#email_contact','bia@x.com'); await p.fill('#instagram','bia.castelano'); await p.click('#saveTextos'); await p.waitForTimeout(600);
 // double click save texts
 const nw=st.writes.length; await p.dblclick('#saveTextos'); await p.waitForTimeout(800);
 ok('duplo clique em salvar textos grava 1 vez', st.writes.length-nw===1, 'gravações='+(st.writes.length-nw));
 // stats: remove all & add many
 // portfolio
 await p.click('#tabs .tab[data-tab="portfolio"]'); await p.waitForTimeout(800);
 await p.click('#newAlbum'); await p.waitForTimeout(300); const na=st.db.albums.length;
 await p.click('#saveAlbum'); await p.waitForTimeout(800);
 ok('álbum vazio (sem título/fotos) é recusado', st.db.albums.length===na, `álbuns ${na}->${st.db.albums.length}; toast="${await toast(p)}"; título salvo="${(st.db.albums[st.db.albums.length-1]||{}).title}"`);
 // double click save on new album
 await p.click('#newAlbum'); await p.fill('#al-title','Duplo'); await p.setInputFiles('#al-addphotos',require('path').join(__dirname,'..','..','fallback','p2.webp')); await p.waitForTimeout(2000); const nb=st.db.albums.length; await p.dblclick('#saveAlbum'); await p.waitForTimeout(1000);
 ok('duplo clique em "Salvar álbum" cria 1 álbum', st.db.albums.length-nb===1, 'criados='+(st.db.albums.length-nb));
 // sort limits
 await p.click('#newAlbum'); await p.fill('#al-title','Limite'); await p.setInputFiles('#al-addphotos',require('path').join(__dirname,'..','..','fallback','p2.webp')); await p.waitForTimeout(2000); await p.fill('#al-sort','99999999999'); await p.click('#saveAlbum'); await p.waitForTimeout(800);
 R.push('INFO ordem=99999999999 -> toast "'+await toast(p)+'" sort salvo='+JSON.stringify((st.db.albums.find(a=>a.title==='Limite')||{}).sort));
 // upload photo
 await p.click('.list-item .ed >> nth=0'); await p.waitForTimeout(400);
 await p.setInputFiles('#al-addphotos',require('path').join(__dirname,'..','..','fallback','p2.webp')); await p.waitForTimeout(2500);
 const ups=st.uploads.length; ok('envio de foto sobe foto + miniatura', ups>=2, st.uploads.join(' , '));
 // upload non-image
 await p.setInputFiles('#al-addphotos',{name:'fake.txt',mimeType:'text/plain',buffer:Buffer.from('hello')}); await p.waitForTimeout(1500);
 const nphotos=await p.$$eval('#al-photos > *',x=>x.length);
 ok('arquivo que não é imagem é recusado no álbum', st.uploads.length===ups, `uploads ${ups}->${st.uploads.length}; fotos no editor=${nphotos}; ultimo=${st.uploads.slice(-1)}; toast="${await toast(p)}"`);
 await p.click('#cancelAlbum');
 // unsaved changes warning
 await p.click('.list-item .ed >> nth=0'); await p.fill('#al-title','Mudança não salva'); 
 let warned=false; p.once('dialog',()=>{warned=true;});
 await p.click('.list-item .ed >> nth=1'); await p.waitForTimeout(300);
 ok('aviso ao trocar de álbum com alterações não salvas', warned || (await p.inputValue('#al-title'))==='Mudança não salva', 'título agora="'+await p.inputValue('#al-title')+'" (alteração descartada sem aviso)');
 await p.click('#cancelAlbum');
 // delete
 const da=st.db.albums.length; await p.click('.list-item .del >> nth=0'); await p.waitForTimeout(800);
 ok('excluir álbum pede confirmação e exclui', st.lastDialog && st.db.albums.length===da-1, st.lastDialog);
 // depoimentos vazio
 await p.click('#tabs .tab[data-tab="depoimentos"]'); await p.waitForTimeout(400);
 const nt=st.db.testimonials.length; await p.click('#newTest'); await p.click('#saveTest'); await p.waitForTimeout(800);
 ok('depoimento vazio é recusado', st.db.testimonials.length===nt, `depoimentos ${nt}->${st.db.testimonials.length}`);
 // filmes link inválido
 await p.click('#tabs .tab[data-tab="filmes"]'); await p.waitForTimeout(400);
 const nf=st.db.films.length; await p.click('#newFilm'); await p.fill('#fi-title','Filme X'); await p.fill('#fi-youtube','nao é um link'); await p.click('#saveFilm'); await p.waitForTimeout(800);
 ok('link de YouTube inválido é recusado', st.db.films.length===nf, `filmes ${nf}->${st.db.films.length}; youtube_url salvo="${(st.db.films.slice(-1)[0]||{}).youtube_url}"`);
 // XSS-ish title render
 await p.click('#newFilm'); await p.fill('#fi-title','<img src=x onerror=window.__x=1>'); await p.fill('#fi-youtube','https://youtu.be/dQw4w9WgXcQ'); await p.click('#saveFilm'); await p.waitForTimeout(800);
 ok('título com HTML é escapado na lista', !(await p.evaluate(()=>window.__x)));
 // logout
 await p.click('#logoutBtn'); await p.waitForTimeout(800); ok('sair volta para o login', await p.isVisible('#loginForm'));
 console.log('LOGS1\n'+[...new Set(L)].join('\n')); await ctx.close();

 // ---- falha ao carregar textos -> salvar apaga dados?
 ({ctx,st,p,L}=await setup(b,{failTables:['site_settings']}));
 await p.goto(URL); await login(p); await p.waitForTimeout(1500);
 const t0=await toast(p); st.opts.failTables=[]; // banco volta
 const before=JSON.stringify(st.db.site_settings[0]);
 const travado=await p.isDisabled('#saveTextos'); await p.click('#saveTextos',{force:true}).catch(()=>{}); await p.waitForTimeout(800);
 R.push('INFO salvar bloqueado após falha de carregamento: '+travado+'; aviso: '+(await p.textContent('#panel-textos .load-err').catch(()=>'(sem aviso)')));
 const after=st.db.site_settings[0];
 ok('se o carregamento falha, salvar NÃO apaga os textos do site', after.whatsapp==='5511945198244' && (after.proposito||[]).length>0, `toast ao carregar="${t0}"; depois de salvar: whatsapp="${after.whatsapp}" proposito=${JSON.stringify(after.proposito)} stats=${JSON.stringify(after.stats)}`);
 await ctx.close();
 // ---- falha ao carregar álbuns
 ({ctx,st,p,L}=await setup(b,{failTables:['albums']}));
 await p.goto(URL); await login(p); await p.waitForTimeout(1500); await p.click('#tabs .tab[data-tab="portfolio"]'); await p.waitForTimeout(800);
 const lt=await p.textContent('#albumList'); ok('falha ao carregar álbuns é avisada (não "nenhum álbum")', !/Nenhum álbum/.test(lt), 'lista mostra: "'+lt.trim()+'"; toast="'+await toast(p)+'"');
 await ctx.close();
 // ---- mobile
 ({ctx,st,p,L}=await setup(b,{},{...devices['iPhone 13']}));
 await p.goto(URL); await p.waitForTimeout(800); await p.screenshot({path:OUT+'adm-m-login.png'});
 await login(p); await p.waitForTimeout(1500);
 for(const tab of ['textos','portfolio','depoimentos','filmes']){ await p.click(`#tabs .tab[data-tab="${tab}"]`); await p.waitForTimeout(500);
   const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})); ok('admin mobile sem rolagem horizontal ('+tab+')', o.sw<=o.cw, JSON.stringify(o)); }
 await p.click('#tabs .tab[data-tab="textos"]'); await p.screenshot({path:OUT+'adm-m-textos.png',fullPage:false});
 await p.click('#tabs .tab[data-tab="portfolio"]'); await p.click('#newAlbum'); await p.waitForTimeout(500); await p.screenshot({path:OUT+'adm-m-album.png'});
 console.log('LOGSM\n'+[...new Set(L)].join('\n'));
 await ctx.close();
 console.log(R.join('\n')); await b.close();
})();
