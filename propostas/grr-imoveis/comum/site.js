/* GRR Imóveis — tema Noir: utilitários, cabeçalho, rodapé e cards compartilhados */
(function(){
const GRR={
  fone:'(11) 4162-2417', fone2:'(11) 4162-3096', wpp:'551141622417', email:'grrimoveis@gmail.com',
  end:'Av. Zélia, 462 — 1º andar', bairro:'Parque dos Camargos', cidade:'Barueri – SP', cep:'06436-000', creci:'26984-J',
  horario:'Seg. a sex. 9h–18h · Sáb. 9h–13h',
  maps:'https://maps.google.com/?q=Av.+Z%C3%A9lia,+462,+Parque+dos+Camargos,+Barueri+SP',
  boleto:'https://www.grrimoveis.com.br/segunda-via-de-boleto',
  fichas:'https://www.grrimoveis.com.br/fichas-cadastrais'
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const FB="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3" fill="#1c1b1a"/></svg>');
const img=(src,alt,extra='')=>`<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra} onerror="this.onerror=null;this.src='${FB}'">`;
const wa=msg=>`https://wa.me/${GRR.wpp}?text=${encodeURIComponent(msg)}`;
const L=window.IMOVEIS||[];
const byId=id=>L.find(x=>x.id===String(id));
const url=x=>`imovel.html#${encodeURIComponent(x.id)}`;
/* rotas por # (funcionam abrindo o arquivo direto, em qualquer servidor e em prévias) */
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cat=(o={})=>{const f=o.fin==='l'?'aluguel':'venda';const t=slug(o.tipo),c=slug(o.cidade);return 'imoveis.html#'+f+((t||c)?`--${t}--${c}`:'')};
const parseCat=h=>{const [f,t,c]=decodeURIComponent((h||'').replace(/^#/,'')).split('--');
  return {fin:f==='aluguel'?'l':'v',tipo:(L.map(x=>x.t).find(x=>slug(x)===t))||'',cidade:(L.map(x=>x.c).find(x=>slug(x)===c))||''}};
/* envia a mensagem pronta: tenta abrir o WhatsApp e sempre deixa um link visível */
function send(text,form,viaMail){
  const href=viaMail?`mailto:${GRR.email}?subject=${encodeURIComponent('Contato pelo site')}&body=${encodeURIComponent(text)}`:wa(text);
  let box=form.querySelector('.sent');
  if(!box){box=document.createElement('div');box.className='sent';form.appendChild(box)}
  box.innerHTML=`<p>Mensagem pronta para enviar:</p><pre></pre><a class="btn fill" target="_blank" rel="noopener">${viaMail?'Abrir no e-mail':'Abrir no WhatsApp'} ↗</a>`;
  box.querySelector('pre').textContent=text;box.querySelector('a').href=href;
  try{if(!viaMail)window.open(href,'_blank','noopener');else location.href=href}catch(_){}
}
const titulo=x=>`${x.t} · ${x.b}`;
const specLine=x=>[x.dorm&&`${x.dorm} dorm.`,x.ban&&`${x.ban} banh.`,x.vag&&`${x.vag} vaga${x.vag>1?'s':''}`,x.area&&`${x.area} m²`].filter(Boolean).join(' · ');
const preco=(x,fin)=>fin==='l'?(x.l?`R$ ${x.l}/mês`:''):(x.v?`R$ ${x.v}`:(x.l?`R$ ${x.l}/mês`:''));

function poster(x,i,fin){
  const both=x.v&&x.l;
  return `<a class="poster" href="${url(x)}">
    <div class="ph">${img(x.img,`${x.t} em ${x.b}, ${x.c}`)}<span class="num">Nº ${pad(i+1)}</span>${both?'<span class="badge">Venda ou locação</span>':''}
    <div class="cap"><small>${esc(x.t)}</small><h3>${esc(x.b)}</h3><div class="loc">${esc(x.c)} — SP</div>
    <div class="price">${esc(preco(x,fin))}</div>${specLine(x)?`<div class="spec">${esc(specLine(x))}</div>`:''}</div></div></a>`;
}
function row(x,i){
  return `<a class="row" href="${url(x)}" data-img="${esc(x.img)}">
    <span class="i">${pad(i+1)}</span><span class="t">${esc(titulo(x))}</span><span class="l">${esc(x.c)} — SP${specLine(x)?' · '+esc(specLine(x)):''}</span><span class="p">R$ ${esc(x.l)}/mês</span><span class="a">→</span></a>`;
}
function peek(container){
  const pk=document.createElement('div');pk.className='peek';pk.innerHTML='<img alt="">';document.body.appendChild(pk);
  const pi=pk.firstChild;
  container.addEventListener('mousemove',e=>{const r=e.target.closest('.row');if(!r){pk.classList.remove('on');return}
    if(pi.dataset.s!==r.dataset.img){pi.src=r.dataset.img;pi.dataset.s=r.dataset.img}
    pk.style.left=Math.min(e.clientX+180,innerWidth-160)+'px';pk.style.top=e.clientY+'px';pk.classList.add('on')});
  container.addEventListener('mouseleave',()=>pk.classList.remove('on'));
}

const WA_SVG='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>';

function chrome(){
  const page=document.body.dataset.page||'';
  const link=(href,txt,key)=>`<a href="${href}"${key===page?' class="on" aria-current="page"':''}>${txt}</a>`;
  const hd=document.createElement('header');hd.className='hd';hd.id='hd';
  hd.innerHTML=`<a href="index.html" class="logo">GRR Imóveis<small>CRECI ${GRR.creci}</small></a>
    <nav class="nav" id="nav">${link('index.html','Home','home')}${link('quem-somos.html','Quem somos','quem')}${link('imoveis.html','Imóveis','imoveis')}${link('contato.html','Contato','contato')}<a href="${GRR.boleto}" target="_blank" rel="noopener">2ª via boleto</a></nav>
    <a class="cta-wpp" href="${wa('Olá! Vim pelo site da GRR Imóveis e gostaria de atendimento.')}" target="_blank" rel="noopener">WhatsApp</a>
    <button class="burger" id="burger" aria-label="Abrir menu" aria-expanded="false"><span></span><span></span></button>`;
  document.body.prepend(hd);
  const g=document.createElement('div');g.className='grain';g.setAttribute('aria-hidden','true');document.body.prepend(g);

  const ft=document.createElement('footer');ft.className='ft';
  ft.innerHTML=`<div class="ft-grid">
    <div><a href="index.html" class="logo">GRR Imóveis</a><p>Sua conquista, nosso compromisso.<br>Compra, venda e locação em Barueri e região.</p></div>
    <div><h5>Institucional</h5><ul><li><a href="quem-somos.html">Quem somos</a></li><li><a href="imoveis.html">Imóveis</a></li><li><a href="contato.html">Contato</a></li><li><a href="${GRR.boleto}" target="_blank" rel="noopener">2ª via de boleto</a></li></ul></div>
    <div><h5>Serviços</h5><ul><li><a href="contato.html#cadastrar">Cadastre seu imóvel</a></li><li><a href="contato.html#encomendar">Encomende seu imóvel</a></li><li><a href="contato.html#financiamento">Financiamentos</a></li><li><a href="${GRR.fichas}" target="_blank" rel="noopener">Fichas cadastrais</a></li></ul></div>
    <div><h5>Onde estamos</h5><p>${GRR.end}<br>${GRR.bairro}, ${GRR.cidade}<br>CEP ${GRR.cep}<br><a href="tel:+551141622417">${GRR.fone}</a> · <a href="tel:+551141623096">${GRR.fone2}</a><br><a href="mailto:${GRR.email}">${GRR.email}</a></p></div>
  </div>
  <div class="ft-bot"><span>© ${new Date().getFullYear()} GRR Imóveis · CRECI ${GRR.creci}</span><span>${GRR.horario}</span></div>`;
  document.body.appendChild(ft);

  const fab=document.createElement('a');fab.className='fab';fab.href=wa('Olá! Vim pelo site da GRR Imóveis e gostaria de atendimento.');fab.target='_blank';fab.rel='noopener';fab.setAttribute('aria-label','Falar no WhatsApp');fab.innerHTML=WA_SVG;
  document.body.appendChild(fab);

  const solid=()=>hd.classList.toggle('solid',scrollY>60||document.body.dataset.solid==='1');
  addEventListener('scroll',solid,{passive:true});solid();
  const bg=$('#burger');
  bg.onclick=()=>{const o=document.body.classList.toggle('menu-open');bg.setAttribute('aria-expanded',o)};
  $$('#nav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));
}

function reveal(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
  $$('.rv:not(.in)').forEach(el=>io.observe(el));
}

window.GRR=Object.assign(GRR,{slug,cat,parseCat,send,$,$$,esc,pad,img,wa,L,byId,url,titulo,specLine,preco,poster,row,peek,reveal,FB});
chrome();
addEventListener('DOMContentLoaded',()=>{reveal();setTimeout(()=>$$('.phero').forEach(p=>p.classList.add('open')),700)});
})();
