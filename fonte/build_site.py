#!/usr/bin/env python3
import base64, os

BASE = open('site_full/index.html', encoding='utf-8').read()

# add ids so JS can overlay texts
BASE = BASE.replace('<div class="ess-body">', '<div class="ess-body" id="essBody">', 1)
BASE = BASE.replace('<div class="nb reveal">', '<div class="nb reveal" id="nb">', 1)

NEW_SCRIPT = r'''
(function(){
"use strict";
var SB_URL="https://ufacszuqskvgpmcjyaqi.supabase.co";
var SB_KEY="sb_publishable_q_gEEPycYqMWhJypZLZmZg_TCsP_wqA";

var IMG={p0:"__IMG_P0__",p1:"__IMG_P1__",p2:"__IMG_P2__",p3:"__IMG_P3__",p4:"__IMG_P4__",p5:"__IMG_P5__",p6:"__IMG_P6__"};
var FALLBACK={
  hero:IMG.p0, about:IMG.p1, contactBg:IMG.p2, portrait:IMG.p6, heroVideo:"",
  albums:[
    {title:"Ana & Léo",sub:"Pré-Wedding · Praia",cat:"pre",photos:[IMG.p0,IMG.p1]},
    {title:"Marina & Rafa",sub:"Pré-Wedding · Litoral",cat:"pre",photos:[IMG.p1,IMG.p0]},
    {title:"Júlia & Bento",sub:"Pré-Wedding · Fim de tarde",cat:"pre",photos:[IMG.p0,IMG.p1]},
    {title:"Helena & Théo",sub:"Wedding · Cerimônia",cat:"wed",photos:[IMG.p2,IMG.p3,IMG.p4,IMG.p5]},
    {title:"Sofia & Dan",sub:"Wedding · Ao ar livre",cat:"wed",photos:[IMG.p3,IMG.p5,IMG.p2,IMG.p4]},
    {title:"Lívia & Caio",sub:"Wedding · Fazenda",cat:"wed",photos:[IMG.p4,IMG.p2,IMG.p5,IMG.p3]}
  ],
  quotes:[
    {h:"@yas.meireles_",date:"18 de jul",txt:"Você com toda certeza foi minha melhor escolha, valeu a pena esperar por 1 ano hahaha. Tô completamente apaixonada pelo seu trabalho 🥹"},
    {h:"@helena.theo",date:"2 de ago",txt:"Bia, você capturou o nosso dia exatamente como ele foi. Choramos vendo as fotos, obrigada por tanto 🤍"},
    {h:"@so.dan",date:"27 de jul",txt:"Gente, que sensibilidade! A gente nem percebia que estava sendo fotografado e cada foto ficou perfeita."},
    {h:"@livia.caio",date:"11 de ago",txt:"O same-day edit passou na festa e todo mundo chorou 😭 melhor decisão do casamento!"},
    {h:"@marina.rafa",date:"5 de jun",txt:"Do pré-wedding ao altar você entendeu a gente demais. Olhar único, virei fã!"},
    {h:"@ana.leo",date:"19 de mai",txt:"As fotos na praia ficaram de tirar o fôlego 😍 recebi elogios de todo mundo, obrigada Bia!"},
    {h:"@ju.bento",date:"30 de abr",txt:"Profissional e humana do início ao fim. Superou tudo que a gente imaginava 🥹"},
    {h:"@cami.rui",date:"14 de mar",txt:"Reviver o nosso dia pelas suas fotos é mágico. Gratidão eterna por registrar tudo com tanto amor."},
    {h:"@manu.rod",date:"2 de fev",txt:"Entrega impecável e no prazo! O filme ficou de cinema, a gente assiste até hoje 🤍"}
  ],
  films:[
    {title:"Helena & Théo",sub:"Filme de casamento · trailer",thumb:IMG.p2,yt:""},
    {title:"Ana & Léo",sub:"Pré-wedding em filme",thumb:IMG.p0,yt:""},
    {title:"Helena & Théo",sub:"Same-day edit",thumb:IMG.p5,yt:""}
  ]
};

var $=function(s){return document.querySelector(s);};
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
var lenis=null;
var slides=[],sdots=[],N=0,curFeatCat="wed",currentFilter="all";

/* ---- miniaturas do portfólio ----
   fotos/<nome>  →  fotos/t800/<nome>, preservando o "#ar=" / "#fp=" do fim.
   Capas e grade usam a miniatura (leve); o visor usa a foto grande. */
function thumbU(u){ if(!u) return u;
  var i=u.indexOf("#"), b=i<0?u:u.slice(0,i), f=i<0?"":u.slice(i);
  if(b.indexOf("/fotos/")<0 || b.indexOf("/fotos/t800/")>=0) return u;
  var k=b.lastIndexOf("/"); if(k<0) return u;
  return b.slice(0,k+1)+"t800/"+b.slice(k+1)+f; }
/* endereço indo para dentro de um atributo HTML */
function attrU(u){ return (u||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;"); }
/* aponta uma <img> para a miniatura; se ela ainda não existir, cai na foto grande.
   O handler é ligado por JS, nunca por onerror no HTML: este script roda dentro de um
   IIFE, então um onerror inline não enxergaria a função. */
function imgThumb(im,u){ if(!im||!u) return;
  im.dataset.full=u;
  im.onerror=function(){ if(im.dataset.fb) return; im.dataset.fb="1"; im.src=im.dataset.full; };
  im.src=thumbU(u); }
function esc(s){return (s==null?"":(""+s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
/* enquadramento: lê "#fp=x,y" do endereço da foto e vira object-position */
function fpPos(u){ var m=/[#&]fp=([\d.]+),([\d.]+)/.exec(u||""); return m?(m[1]+"% "+m[2]+"%"):""; }
function fpSty(u){ var p=fpPos(u); return p?(' style="object-position:'+p+'"'):''; }

/* ---------------- intro / splash (logo animado) ---------------- */
var introDone=false, introSet=false;
var INTRO_WORD='<div class="im-txt"><span class="b-script" style="font-size:1.35em">Bia</span> Castelano</div><div class="il">Estúdio de Casamento</div>';
function dismissIntro(){ if(introDone)return; introDone=true; var intro=document.getElementById("intro"); if(!intro)return; intro.classList.add("out"); setTimeout(function(){ if(intro&&intro.parentNode) intro.remove(); },800); }
function showIntro(inner){ if(introSet||introDone)return; introSet=true; var el=document.getElementById("introLogo"); if(!el)return; el.innerHTML=inner; requestAnimationFrame(function(){ el.classList.add("in"); }); setTimeout(dismissIntro,1900); }

/* ---------------- builders ---------------- */
function firstWed(m){ for(var i=0;i<m.albums.length;i++){ if(m.albums[i].cat==="wed") return m.albums[i]; } return m.albums[0]||{photos:[]}; }

function buildPortfolio(m){
  var FEAT=firstWed(m); curFeatCat=FEAT.cat||"wed";
  var feat=$("#feat");
  var fu=(FEAT.photos&&FEAT.photos[0])||"";
  feat.innerHTML='<img decoding="async" fetchpriority="high" src="'+attrU(fu)+'" alt="'+esc(FEAT.title)+'"'+fpSty(fu)+'>'
    +'<div class="cap"><div class="fl">Casamento em destaque</div><div class="fn">'+esc(FEAT.title)+'</div>'
    +'<div class="fs">'+esc(FEAT.sub)+'</div><span class="fgo">Ver álbum →</span></div>';
  feat.onclick=function(){openAlbum(FEAT);};
  var grid=$("#grid"); grid.innerHTML="";
  m.albums.forEach(function(p){
    var f=document.createElement("figure"); f.className="tile"; f.dataset.cat=p.cat||"wed"; f.tabIndex=0; f.setAttribute("role","button");
    f.innerHTML='<span class="album-tag">Ver álbum · '+((p.photos||[]).length)+'</span>'
      +'<img loading="lazy" decoding="async" alt="'+esc(p.title)+'"'+fpSty(p.photos&&p.photos[0])+'>'
      +'<figcaption><span class="t">'+esc(p.title)+'</span><span class="s">'+esc(p.sub)+'</span></figcaption>';
    imgThumb(f.querySelector("img"), (p.photos&&p.photos[0])||"");
    f.onclick=function(){openAlbum(p);};
    f.addEventListener("keydown",function(e){if(e.key==="Enter")openAlbum(p);});
    grid.appendChild(f);
  });
  if(m.albums.length<=3){grid.style.gridTemplateColumns="repeat("+Math.max(2,m.albums.length)+",1fr)";grid.style.maxWidth="840px";grid.style.marginInline="auto";}
  else {grid.style.gridTemplateColumns="";grid.style.maxWidth="";grid.style.marginInline="";}
  applyFilter(currentFilter);
}
function applyFilter(f){
  currentFilter=f;
  document.querySelectorAll(".tile").forEach(function(t){t.classList.toggle("hide",f!=="all"&&t.dataset.cat!==f);});
  var feat=$("#feat"); if(feat) feat.style.display=(f==="all"||curFeatCat===f)?"":"none";
}
function buildFilms(m){
  var films=$("#films"); films.innerHTML="";
  m.films.forEach(function(v){
    var a=document.createElement("article"); a.className="film";
    a.innerHTML='<div class="film-thumb"><img src="'+(v.thumb||"")+'" alt="'+esc(v.title)+'"'+fpSty(v.thumb)+'>'
      +'<span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>'
      +'<h3>'+esc(v.title)+'</h3><p>'+esc(v.sub)+'</p>';
    a.onclick=function(){openVideo(v);};
    films.appendChild(a);
  });
}
function buildTestimonials(m){
  var wed=firstWed(m);
  var POOL=[m.hero,m.about].concat(wed?wed.photos:[]).filter(Boolean);
  if(!POOL.length) POOL=[m.hero||""];
  var HP="M12 21s-7-4.4-9.6-8.9C.8 9 2.3 5.4 5.9 5.4c2 0 3.3 1.2 4.1 2.4.8-1.2 2.1-2.4 4.1-2.4 3.6 0 5.1 3.6 3.5 6.7C19 16.6 12 21 12 21z";
  var HEARTS='<div class="ig-hearts"><svg viewBox="0 0 24 24" fill="#FF7A3D"><path d="'+HP+'"/></svg><svg viewBox="0 0 24 24" fill="#FF2E74"><path d="'+HP+'"/></svg></div>';
  var el=$("#quotes"); el.innerHTML="";
  m.quotes.forEach(function(q,i){
    var bg=q.couple||POOL[i%POOL.length], av=q.avatar||POOL[(i+2)%POOL.length], hav=m.portrait||bg;
    var c=document.createElement("article"); c.className="ig";
    c.innerHTML='<img class="bg" src="'+bg+'" alt=""'+fpSty(bg)+'>'
      +'<div class="ig-bar"></div>'
      +'<div class="ig-head"><img class="hav" src="'+hav+'" alt=""><span class="ht">Feedback</span><span class="hd">· '+esc(q.date)+'</span><span class="hx">✕</span></div>'
      +'<div class="ig-sticker"><div class="st-top"><img class="st-av" src="'+av+'" alt=""><span class="st-id"><b>'+esc(q.h)+'</b> comentou</span></div><p class="st-txt">'+esc(q.txt)+'</p></div>'
      +HEARTS;
    el.appendChild(c);
  });
}
function buildStory(m){
  var caps=[
    {hero:true,ov:"Minimalista · Atemporal · Elegante",tag:"fotografia e filme de casamento"},
    {lab:"O antes",ln:"Tudo começa muito antes do altar."},
    {lab:"First look",ln:"O instante em que o mundo inteiro para."},
    {lab:"A cerimônia",ln:"O sim, diante de quem mais importa."},
    {lab:"A festa",ln:"E então a alegria transborda."},
    {lab:"Para sempre",ln:"Fica a memória — para a vida inteira."}
  ];
  var storyEl=$("#story"), track=$("#storyTrack"), sprog=$("#storyProg");
  // ---- ABERTURA EM VÍDEO (autoplay, mudo, em loop) ----
  if(m.heroVideo){
    if(storyEl) storyEl.classList.add("mode-video");
    track.innerHTML=""; sprog.innerHTML="";
    var c0=caps[0]||{}, vid=ytId(m.heroVideo), media;
    if(vid){
      media='<div class="sv-embed"><iframe src="https://www.youtube.com/embed/'+vid+'?autoplay=1&mute=1&loop=1&playlist='+vid+'&controls=0&playsinline=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0" frameborder="0" allow="autoplay; encrypted-media" tabindex="-1" aria-hidden="true"></iframe></div>';
    } else {
      media='<video class="sv-vid" autoplay muted loop playsinline preload="auto"'+(m.hero?' poster="'+m.hero+'"':'')+'><source src="'+esc(m.heroVideo)+'"></video>';
    }
    var slv=document.createElement("div"); slv.className="story-slide story-video";
    slv.innerHTML=media+'<div class="story-cap"><div class="ov">'+esc(c0.ov)+'</div><div class="wm"><span class="wm-s">Bia</span><span class="wm-n">CASTELANO</span></div><div class="tag">'+esc(c0.tag)+'</div></div>';
    track.appendChild(slv);
    slides=[slv]; sdots=[]; N=1; track.scrollLeft=0;
    var vv=slv.querySelector("video"); if(vv){ vv.muted=true; try{ var pp=vv.play(); if(pp&&pp.catch) pp.catch(function(){}); }catch(e){} }
    return;
  }
  if(storyEl) storyEl.classList.remove("mode-video");
  // ---- ABERTURA EM FOTOS ----
  var imgs;
  if(m.heroGallery&&m.heroGallery.length){ imgs=m.heroGallery.slice(); }
  else { var wed=firstWed(m); var wp=(wed.photos&&wed.photos.length)?wed.photos:[m.hero];
    var wpi=function(i){return wp[i%wp.length]||m.hero;}; imgs=[m.hero,m.about,wpi(2),wpi(1),wpi(0),wpi(3)]; }
  var n=Math.max(1,imgs.length);
  track.innerHTML=""; sprog.innerHTML="";
  for(var i=0;i<n;i++){
    var c=caps[i]||{}, s={img:imgs[i]||imgs[imgs.length-1]||m.hero, hero:(i===0), ov:c.ov, tag:c.tag, lab:c.lab, ln:c.ln};
    var sl=document.createElement("div"); sl.className="story-slide";
    sl.innerHTML='<img src="'+s.img+'" alt=""'+fpSty(s.img)+'><div class="story-cap">'+(s.hero
      ?'<div class="ov">'+esc(s.ov)+'</div><div class="wm"><span class="wm-s">Bia</span><span class="wm-n">CASTELANO</span></div><div class="tag">'+esc(s.tag)+'</div>'
      :((s.lab||s.ln)?'<div class="lab">'+esc(s.lab)+'</div><div class="ln">'+esc(s.ln)+'</div>':''))+'</div>';
    track.appendChild(sl); sprog.appendChild(document.createElement("b"));
  }
  slides=[].slice.call(track.children); sdots=[].slice.call(sprog.children); N=slides.length;
  track.scrollLeft=0; setActive(0);
}
function applyImages(m){
  var ai=$("#aboutImg"); if(ai){ var ap=m.portrait||m.about||""; ai.src=ap; ai.style.objectPosition=fpPos(ap)||"50% 50%"; }
  var c=$("#contato"); if(c){ var cb=m.contactBg||""; c.style.backgroundImage="url("+cb+")"; var cp=fpPos(cb); if(cp) c.style.backgroundPosition=cp; }
}
function applyTexts(s){
  if(!s) return;
  if(s.proposito&&s.proposito.length){ var eb=$("#essBody"); if(eb){ eb.innerHTML=""; s.proposito.forEach(function(p){var el=document.createElement("p");el.textContent=p;eb.appendChild(el);}); } }
  if(s.sobre&&s.sobre.length){ var eb2=$("#sobre .eyebrow"); if(eb2){ var sb=eb2.parentNode; Array.prototype.slice.call(sb.querySelectorAll("p")).forEach(function(p){p.remove();}); var ref=eb2; s.sobre.forEach(function(t){var el=document.createElement("p");el.textContent=t; sb.insertBefore(el, ref.nextSibling); ref=el;}); } }
  if(s.stat1_num||s.stat2_num||s.stat3_num){
    var nb=$("#nb"); if(nb){ nb.innerHTML="";
      [[s.stat1_num,s.stat1_label],[s.stat2_num,s.stat2_label],[s.stat3_num,s.stat3_label]].forEach(function(st){
        if(!st[0]&&!st[1])return; var d=document.createElement("div"); d.className="cell";
        d.innerHTML='<div class="num">'+esc(st[0]||"")+'</div><div class="lab">'+esc(st[1]||"")+'</div>'; nb.appendChild(d);
      });
    }
  }
  function contactAll(ph,href){ document.querySelectorAll("[data-ph="+ph+"]").forEach(function(a){ a.setAttribute("href",href); a.removeAttribute("data-ph"); }); }
  if(s.whatsapp){ var wa=/^https?:/i.test(s.whatsapp)?s.whatsapp:("https://wa.me/"+(""+s.whatsapp).replace(/[^0-9]/g,"")); contactAll("whatsapp",wa); }
  if(s.instagram){ var ig=/^https?:/i.test(s.instagram)?s.instagram:("https://instagram.com/"+(""+s.instagram).replace(/^@/,"")); contactAll("instagram",ig); }
  if(s.email){ contactAll("email", /^mailto:/i.test(s.email)?s.email:("mailto:"+s.email)); }
}
function buildAll(m){ buildPortfolio(m); buildStory(m); buildTestimonials(m); buildFilms(m); applyImages(m); }

/* ---------------- story (horizontal) ---------------- */
var story=null;
function setActive(i){ i=Math.max(0,Math.min(N-1,Math.round(i))); sdots.forEach(function(d,k){d.classList.toggle("on",k===i);}); }
function storyGo(i){ var track=$("#storyTrack"); if(!track)return; i=Math.max(0,Math.min(N-1,i)); track.scrollTo({left:i*track.clientWidth,behavior:"smooth"}); }
function storyIndex(){ var track=$("#storyTrack"); return track?Math.round(track.scrollLeft/Math.max(1,track.clientWidth)):0; }

/* ---------------- galeria (grade justificada, estilo Pixieset) + visor ---------------- */
var album,photo,albImg;
var GAL={photos:[],title:"",dims:null}, P={photos:[],i:0};
function galRatio(u){ var m=/[#&]ar=([\d.]+),([\d.]+)/.exec(u||""); return (m&&+m[2])?(+m[1]/+m[2]):0; }
var _galRelayout=null;
function scheduleGalLayout(){ clearTimeout(_galRelayout); _galRelayout=setTimeout(function(){ if(album&&album.classList.contains("open")) galLayout(); },160); }
function galLayout(){
  var grid=$("#galGrid"); if(!grid||!GAL.ratios) return;
  var cw=grid.clientWidth; if(cw<=0) return;
  var gap=6, targetH=(innerWidth<600?165:(innerWidth<1000?235:300));
  grid.innerHTML=""; var row=[], sum=0;
  function flush(stretch){
    var h=stretch?((cw-gap*(row.length-1))/sum):targetH;
    var rd=document.createElement("div"); rd.className="gal-row"; rd.style.gap=gap+"px"; rd.style.marginBottom=gap+"px";
    if(!stretch) rd.style.justifyContent="center"; // última linha curta fica centralizada
    row.forEach(function(idx){ var it=GAL.ratios[idx];
      var cell=document.createElement("div"); cell.className="gal-cell"; cell.style.width=Math.round(it.r*h)+"px"; cell.style.height=Math.round(h)+"px";
      var im=document.createElement("img"); im.alt=""; im.loading="lazy"; im.decoding="async";
      imgThumb(im, GAL.photos[idx]); cell.appendChild(im);
      if(!it.exact){ im.addEventListener("load",function(){ if(im.naturalWidth&&im.naturalHeight){ var nr=im.naturalWidth/im.naturalHeight; if(Math.abs(nr-it.r)>0.02) it.r=nr; it.exact=true; scheduleGalLayout(); } }); }
      cell.addEventListener("click",(function(k){return function(){ openPhoto(k); };})(idx));
      rd.appendChild(cell);
    });
    grid.appendChild(rd); row=[]; sum=0;
  }
  GAL.photos.forEach(function(u,i){ row.push(i); sum+=GAL.ratios[i].r; if(sum*targetH+gap*(row.length-1)>=cw) flush(true); });
  if(row.length) flush(false);
}
function openAlbum(p){
  if(!p||!p.photos||!p.photos.length) return;
  GAL={photos:p.photos.slice(), title:p.title||""};
  GAL.ratios=GAL.photos.map(function(u){ var r=galRatio(u); return {r:r||1.5, exact:r>0}; }); // usa proporção salva (#ar); senão estima e corrige ao carregar
  var tt=$("#albTitle"); if(tt) tt.textContent=GAL.title;
  var sc=$("#galScroll"); if(sc) sc.scrollTop=0;
  album.classList.add("open"); document.body.style.overflow="hidden"; if(lenis)lenis.stop();
  galLayout(); // desenha a grade na hora; as fotos entram sozinhas (lazy) conforme rola
}
function closeGallery(){ album.classList.remove("open"); document.body.style.overflow=""; if(lenis)lenis.start(); }
function preNb(){ if(P.photos.length<2) return; [1,-1].forEach(function(d){
  var j=(P.i+d+P.photos.length)%P.photos.length; var x=new Image(); x.decoding="async"; x.src=P.photos[j]; }); }
function renderPhoto(){ var im=$("#phImg"); if(im) im.src=P.photos[P.i]; preNb(); var c=$("#phCount"); if(c) c.textContent=(P.i+1)+" / "+P.photos.length; }
function openPhoto(i){ P={photos:GAL.photos, i:i}; renderPhoto(); photo.classList.add("open"); }
function stepPhoto(n){ if(!P.photos.length)return; P.i=(P.i+n+P.photos.length)%P.photos.length; renderPhoto(); }
function closePhoto(){ photo.classList.remove("open"); }
var vmodal,vImg,vTitle,vPlay,vWatch;
function ytId(u){ if(!u) return ""; u=(""+u).trim();
  var m=u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if(m) return m[1]; if(/^[A-Za-z0-9_-]{11}$/.test(u)) return u; return ""; }
function openVideo(v){
  vTitle.textContent=v.title||"";
  var frame=document.querySelector("#vmodal .vframe"), note=document.querySelector("#vmodal .vnote"), w=$("#vWatch");
  var id=ytId(v.yt||"");
  if(id){
    frame.innerHTML='<iframe src="https://www.youtube.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="'+esc(v.title||"")+'" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>';
    if(note) note.style.display="none";
    if(w){ w.href=v.yt; w.style.display=""; }
  } else {
    frame.innerHTML='<img src="'+(v.thumb||"")+'" alt=""><span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
    if(note) note.style.display="";
    if(w){ w.href=v.yt||"#"; }
  }
  vmodal.classList.add("open"); document.body.style.overflow="hidden"; if(lenis)lenis.stop();
}
function closeVideo(){ vmodal.classList.remove("open");
  var frame=document.querySelector("#vmodal .vframe"); if(frame) frame.innerHTML=""; // remove o iframe pra parar o vídeo
  document.body.style.overflow=""; if(lenis)lenis.start(); }

/* ---------------- setup once ---------------- */
function setupOnce(){
  // intro / splash com logo
  (function(){ var intro=document.getElementById("intro"); if(!intro) return;
    if(reduce){ intro.remove(); introDone=true; return; }
    setTimeout(function(){ showIntro(INTRO_WORD); }, 650);   // fallback se o banco demorar a responder
    ["wheel","touchstart","pointerdown","keydown"].forEach(function(ev){ addEventListener(ev,dismissIntro,{once:true,passive:true}); });
    setTimeout(dismissIntro, 5000);                          // failsafe
  })();
  // lenis
  if(!reduce && window.Lenis){ lenis=new Lenis({lerp:0.085,wheelMultiplier:1,smoothWheel:true,touchMultiplier:1.6}); var raf=function(t){lenis.raf(t);requestAnimationFrame(raf);}; requestAnimationFrame(raf); }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener("click",function(e){ var id=a.getAttribute("href"); if(!id||id.length<2)return; var t=document.querySelector(id); if(!t)return; e.preventDefault(); if(lenis)lenis.scrollTo(t,{offset:-84,duration:1.4}); else t.scrollIntoView(); }); });
  // abertura horizontal: arrasta pro lado; no desktop a roda do mouse move pro lado
  story=$("#story");
  var track=$("#storyTrack");
  track.addEventListener("scroll",function(){ setActive(track.scrollLeft/Math.max(1,track.clientWidth)); },{passive:true});
  var sPrev=$("#stPrev"), sNext=$("#stNext"), sprog=$("#storyProg");
  if(sPrev) sPrev.addEventListener("click",function(){ storyGo(storyIndex()-1); });
  if(sNext) sNext.addEventListener("click",function(){ storyGo(storyIndex()+1); });
  if(sprog) sprog.addEventListener("click",function(e){ var b=e.target.closest("b"); if(!b)return; storyGo([].indexOf.call(sprog.children,b)); });
  var isTouch=matchMedia("(hover:none)").matches;
  if(!isTouch){
    // arrastar pro lado com o mouse (a rolagem vertical segue normal, saindo da abertura)
    var down=false,px=0,pl=0,moved=false;
    track.addEventListener("pointerdown",function(e){ if(e.pointerType==="touch")return; down=true;moved=false;px=e.clientX;pl=track.scrollLeft;track.classList.add("drag"); });
    track.addEventListener("pointermove",function(e){ if(!down)return; var delta=e.clientX-px; if(Math.abs(delta)>3)moved=true; track.scrollLeft=pl-delta; });
    var endDrag=function(){ if(!down)return; down=false;track.classList.remove("drag"); storyGo(storyIndex()); };
    track.addEventListener("pointerup",endDrag); track.addEventListener("pointercancel",endDrag); track.addEventListener("pointerleave",endDrag);
    track.addEventListener("click",function(e){ if(moved){e.preventDefault();e.stopPropagation();} },true);
  }
  // header
  var hdr=$("#hdr"); var onScroll=function(){hdr.classList.toggle("solid",window.scrollY>(story?story.offsetHeight-90:innerHeight*0.7));}; onScroll(); addEventListener("scroll",onScroll,{passive:true});
  // nav
  var nav=$("#nav"),mb=$("#menuBtn"),hdrEl=$("#hdr");
  function setMenu(open){ nav.classList.toggle("open",open); hdrEl.classList.toggle("menu-open",open); mb.textContent=open?"Fechar":"Menu"; if(lenis){ open?lenis.stop():lenis.start(); } }
  mb.addEventListener("click",function(){ setMenu(!nav.classList.contains("open")); });
  nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){ setMenu(false); });});
  // reveal + scrollspy
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{threshold:.12});
  document.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});
  var links=[].slice.call(document.querySelectorAll(".nav a"));
  var spy=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(l){l.classList.toggle("active",l.getAttribute("href")==="#"+e.target.id);});});},{rootMargin:"-45% 0px -50% 0px"});
  document.querySelectorAll("main section[id]").forEach(function(s){spy.observe(s);});
  // filters
  document.querySelectorAll(".filters button").forEach(function(b){ b.addEventListener("click",function(){ document.querySelector(".filters .active").classList.remove("active"); b.classList.add("active"); applyFilter(b.dataset.f); }); });
  // galeria + visor + vídeo
  album=$("#album"); photo=$("#photo"); vmodal=$("#vmodal");
  vTitle=$("#vTitle"); vPlay=$("#vPlay"); vWatch=$("#vWatch");
  var galClose=$("#albClose"); if(galClose) galClose.addEventListener("click",closeGallery);
  var phNext=$("#phNext"), phPrev=$("#phPrev"), phClose=$("#phClose");
  if(phNext) phNext.addEventListener("click",function(e){e.stopPropagation();stepPhoto(1);});
  if(phPrev) phPrev.addEventListener("click",function(e){e.stopPropagation();stepPhoto(-1);});
  if(phClose) phClose.addEventListener("click",closePhoto);
  var sx=0; if(photo){ photo.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;},{passive:true});
    photo.addEventListener("touchend",function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>45)stepPhoto(dx<0?1:-1);});
    photo.addEventListener("click",function(e){ if(e.target===photo) closePhoto(); }); }
  var vClose=$("#vmodal .lb-close"); if(vClose) vClose.addEventListener("click",closeVideo);
  if(vmodal) vmodal.addEventListener("click",function(e){ if(e.target===vmodal) closeVideo(); });
  addEventListener("resize",function(){ if(album&&album.classList.contains("open")) galLayout(); });
  var vBuy=$("#vBuy"); if(vBuy) vBuy.addEventListener("click",function(e){ e.preventDefault(); closeVideo(); var t=$("#contato"); if(!t)return; setTimeout(function(){ if(lenis){lenis.start();lenis.scrollTo(t,{offset:-84,duration:1.2});} else t.scrollIntoView({behavior:"smooth"}); },70); });
  var sDown=$("#storyDown"); if(sDown) sDown.addEventListener("click",function(){ var t=$("#essencia"); if(!t)return; if(lenis)lenis.scrollTo(t,{offset:-70,duration:1.2}); else t.scrollIntoView({behavior:"smooth"}); });
  addEventListener("keydown",function(e){
    if(e.key==="Escape"){ if(photo&&photo.classList.contains("open")) closePhoto(); else if(album&&album.classList.contains("open")) closeGallery(); else closeVideo(); }
    if(photo&&photo.classList.contains("open")){ if(e.key==="ArrowRight")stepPhoto(1); if(e.key==="ArrowLeft")stepPhoto(-1); }
  });
  // theme
  var tb=$("#themeBtn"),root=document.documentElement,stored=null;
  try{stored=localStorage.getItem("bz-theme");}catch(e){}
  if(stored)root.setAttribute("data-theme",stored);
  tb.addEventListener("click",function(){var cur=root.getAttribute("data-theme");var isDark=cur?cur==="dark":matchMedia("(prefers-color-scheme:dark)").matches;var next=isDark?"light":"dark";root.setAttribute("data-theme",next);try{localStorage.setItem("bz-theme",next);}catch(e){}});
  // placeholder links (only those still without href)
  function ph(a){ if(!a) return; a.addEventListener("click",function(e){ if((a.getAttribute("href")||"#")==="#"){ e.preventDefault(); var t=a.textContent; a.textContent="a definir"; setTimeout(function(){a.textContent=t;},1300); } }); }
  document.querySelectorAll("[data-ph]").forEach(ph); [vPlay,vWatch].forEach(ph);
}

/* ---------------- DB overlay ---------------- */
async function loadDB(){
  if(!window.supabase) return;
  var db; try{ db=window.supabase.createClient(SB_URL,SB_KEY); }catch(e){ return; }
  try{
    var r=await Promise.all([
      db.from("site_settings").select("*").eq("id",1).maybeSingle(),
      db.from("albums").select("*").order("sort",{ascending:true}).order("created_at",{ascending:true}),
      db.from("testimonials").select("*").order("sort",{ascending:true}).order("created_at",{ascending:true}),
      db.from("films").select("*").order("sort",{ascending:true}).order("created_at",{ascending:true})
    ]);
    var st=r[0]&&r[0].data, al=(r[1]&&r[1].data)||[], te=(r[2]&&r[2].data)||[], fi=(r[3]&&r[3].data)||[];
    var alb=al.map(function(a){return {title:a.title,sub:a.subtitle,cat:a.category,photos:a.photos||[]};}).filter(function(a){return a.photos.length;});
    var gal=(st&&st.hero_gallery&&st.hero_gallery.length)?st.hero_gallery:null;
    var m={
      heroGallery:gal,
      heroVideo:(st&&st.hero_video)||"",
      hero:(st&&st.hero_image)||(gal&&gal[0])||FALLBACK.hero,
      about:FALLBACK.about,
      portrait:(st&&st.about_image)||FALLBACK.portrait,
      contactBg:(st&&st.contact_image)||FALLBACK.contactBg,
      albums: alb.length?alb:FALLBACK.albums,
      quotes: te.length?te.map(function(t){return {h:t.handle,date:t.date_label,txt:t.body,couple:t.couple_photo,avatar:t.avatar_photo};}):FALLBACK.quotes,
      films: fi.length?fi.map(function(f){return {title:f.title,sub:f.subtitle,thumb:f.thumb,yt:f.youtube_url};}):FALLBACK.films
    };
    buildAll(m);
    applyTexts(st);
  }catch(e){ /* mantém fallback */ }
}

/* ---------------- start ---------------- */
setupOnce();
buildAll(FALLBACK);
loadDB();
})();
'''

# splice: keep everything up to and including the lenis <script>, then our supabase + new script
idx = BASE.find('<script src="https://cdn.jsdelivr.net/npm/lenis')
after_lenis = BASE.find('</script>', idx) + len('</script>')
head = BASE[:after_lenis]
html = head + '\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script>\n' + NEW_SCRIPT + '\n</script>\n</body>\n</html>\n'

# inject fallback image data URIs (webp) — keep bytes out of the model text
for i in range(7):
    b = base64.b64encode(open('single_img/p%d.webp'%i,'rb').read()).decode()
    html = html.replace('__IMG_P%d__'%i, 'data:image/webp;base64,'+b)

assert '__IMG_P' not in html, "token leftover"
os.makedirs('build', exist_ok=True)
open('build/index.html','w',encoding='utf-8').write(html)
print('build/index.html %.2f MB'%(len(html.encode())/1024/1024))
print('supabase-js tag:', 'supabase-js@2' in html, '| data URIs:', html.count('data:image'))
