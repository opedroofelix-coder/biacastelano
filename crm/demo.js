/* Ambiente de teste do CRM (só nos endereços *.vercel.app).
   Troca o Supabase por um banco falso que vive no próprio navegador, com dados fictícios.
   Nada daqui chega ao banco de verdade. Os dados ficam salvos neste navegador
   (localStorage) e podem ser restaurados pelo botão da faixa amarela.
   Carregado pelo index.html ANTES do supabase-js, para que o cliente use este fetch. */
(function(){
  "use strict";
  var SB_HOST = "ufacszuqskvgpmcjyaqi.supabase.co";
  var KEY = "crm-demo-db-v1";
  var LOGIN = {email:"teste@demo.com", senha:"teste123"};
  var realFetch = window.fetch.bind(window);

  var uuid = function(){ return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);})); };
  var now = function(){ return new Date().toISOString(); };
  var PK = {crm_settings:'key', cx_meses:'mes', site_settings:'id'};

  // ---------- dados fictícios ----------
  function seed(){
    var dd=function(off){ var x=new Date(); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); };
    var ym=function(off){ var x=new Date(); x.setDate(1); x.setMonth(x.getMonth()+off); return x.toISOString().slice(0,7); };
    var ids={}; ['ana','marina','helena','sofia','julia','camila','lara'].forEach(function(k){ ids[k]=uuid(); });
    var base=function(){ return {checklist:[],marcos:{},servicos:[],parcelas_avulsas:[],created_at:now(),updated_at:now()}; };
    var C=function(o){ return Object.assign(base(),o); };
    var db = {
      crm_clients:[
        C({id:ids.ana,couple:'Ana & Léo',stage:'lead',event_type:'wed',event_date:dd(210),venue:'Fazenda Vista Alegre',package:'Foto',value:8500,source:'instagram',whatsapp:'11999990001',email:'ana.leo@exemplo.com'}),
        C({id:ids.marina,couple:'Marina & Rafa',stage:'prop',event_type:'wed',event_date:dd(120),venue:'Casa Jardim',value:12000,source:'site',contrato:'Pendente'}),
        C({id:ids.helena,couple:'Helena & Théo',stage:'contr',event_type:'wed',event_date:dd(35),venue:'Igreja São José',value:15000,source:'indicacao',contrato:'Assinado',servicos:['Foto','Vídeo']}),
        C({id:ids.julia,couple:'Júlia & Pedro',stage:'contr',event_type:'pre',event_date:dd(14),venue:'Parque Ibirapuera',value:2800,source:'instagram',contrato:'Assinado'}),
        C({id:ids.camila,couple:'Camila & Bruno',stage:'contr',event_type:'wed',event_date:dd(80),venue:'Espaço Villa',value:13500,source:'indicacao',contrato:'Assinado',servicos:['Foto']}),
        C({id:ids.sofia,couple:'Sofia & Dan',stage:'done',event_type:'wed',event_date:dd(-120),venue:'Hotel Fasano',value:9000,source:'outro',contrato:'Assinado'}),
        C({id:ids.lara,couple:'Lara & Gui',stage:'lead',event_type:'ens',event_date:dd(45),value:1500,source:'instagram'})
      ],
      crm_events:[
        {id:uuid(),client_id:ids.marina,type:'reu',title:'Reunião com Marina & Rafa',starts_at:new Date(Date.now()+2*864e5).toISOString(),created_at:now()},
        {id:uuid(),client_id:ids.julia,type:'pre',title:'Pré-wedding Júlia & Pedro',starts_at:new Date(Date.now()+14*864e5).toISOString(),created_at:now()},
        {id:uuid(),client_id:ids.helena,type:'wed',title:'Casamento Helena & Théo',starts_at:new Date(Date.now()+35*864e5).toISOString(),created_at:now()}
      ],
      crm_payments:[
        {id:uuid(),client_id:ids.helena,description:'Entrada',amount:3000,due_date:dd(-40),paid_at:dd(-40),created_at:now()},
        {id:uuid(),client_id:ids.helena,description:'Parcela 2',amount:6000,due_date:dd(-5),paid_at:null,created_at:now()},
        {id:uuid(),client_id:ids.helena,description:'Final',amount:6000,due_date:dd(25),paid_at:null,created_at:now()},
        {id:uuid(),client_id:ids.camila,description:'Entrada',amount:4000,due_date:dd(-20),paid_at:dd(-20),created_at:now()},
        {id:uuid(),client_id:ids.camila,description:'Final',amount:9500,due_date:dd(70),paid_at:null,created_at:now()},
        {id:uuid(),client_id:ids.julia,description:'Integral',amount:2800,due_date:dd(7),paid_at:null,created_at:now()}
      ],
      crm_deliveries:[
        {id:uuid(),client_id:ids.sofia,item:'Galeria completa',detail:'400 fotos',due_date:dd(-3),progress:60,done:false,created_at:now()},
        {id:uuid(),client_id:ids.sofia,item:'Álbum',detail:'30x30, 40 páginas',due_date:dd(40),progress:10,done:false,created_at:now()}
      ],
      crm_tasks:[
        {id:uuid(),client_id:ids.ana,title:'Enviar proposta',due_date:dd(1),done:false,created_at:now()},
        {id:uuid(),client_id:ids.helena,title:'Confirmar roteiro do dia',due_date:dd(20),done:false,created_at:now()}
      ],
      crm_settings:[], crm_historico:[], crm_acessos:[],
      cx_meses:[], cx_movimentos:[], cx_historico:[],
      cx_contas:[
        {id:'conta-aluguel',nome:'Aluguel do estúdio',valor:2200,dia:5},
        {id:'conta-internet',nome:'Internet',valor:150,dia:10},
        {id:'conta-adobe',nome:'Adobe Creative Cloud',valor:290,dia:15},
        {id:'conta-contador',nome:'Contador',valor:450,dia:20}
      ]
    };
    // três meses de caixa, com lançamentos em ordem
    var linhas=[
      ['Helena & Théo - parcela',3000,null,'',ids.helena],
      ['Aluguel do estúdio',null,2200,'','',"conta-aluguel"],
      ['Combustível casamento',null,180,'',''],
      ['Internet',null,150,'','',"conta-internet"],
      ['Camila & Bruno - parcela',4000,null,'',ids.camila],
      ['Freela segundo fotógrafo',null,600,'',''],
      ['Adobe Creative Cloud',null,290,'','',"conta-adobe"],
      ['Impressão de álbum',null,850,'','']
    ];
    var saldo=10000;
    [-2,-1,0].forEach(function(off){
      var m=ym(off), so=0;
      linhas.forEach(function(l,i){
        if(off!==0 && /parcela/.test(l[0])) return; // parcelas só no mês atual
        db.cx_movimentos.push({id:m+'-'+uuid().slice(0,8),mes:m,d:l[0],e:l[1],s:l[2],c:l[3],o:i,client_id:l[4]||null,conta_id:l[5]||null,payment_id:null,created_at:now()});
        saldo+=(l[1]||0)-(l[2]||0); });
      db.cx_meses.push({mes:m,saldo_final:off<0?saldo:null});
    });
    return db;
  }

  var DB;
  try{ DB=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(_){ DB=null; }
  if(!DB) DB=seed();
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(DB)); }catch(_){} }
  save();

  // ---------- PostgREST simplificado ----------
  function parseVal(v){ if(v==='null')return null; if(v==='true')return true; if(v==='false')return false; return v; }
  function cmp(a,b){ if(a==null&&b==null)return 0; if(a==null)return 1; if(b==null)return -1; var na=+a,nb=+b;
    if(!isNaN(na)&&!isNaN(nb)&&typeof a!=='boolean'&&a!==''&&b!=='') return na-nb; return String(a)<String(b)?-1:String(a)>String(b)?1:0; }
  function matches(row,filters){ return filters.every(function(f){ var col=f[0],op=f[1],val=f[2],v=row[col], neg=false;
    if(op==='not'){ var j=val.indexOf('.'); op=val.slice(0,j); val=val.slice(j+1); neg=true; }
    var r;
    switch(op){ case 'eq': r=String(v)===String(parseVal(val)); break; case 'neq': r=String(v)!==String(val); break;
      case 'gt': r=cmp(v,val)>0; break; case 'gte': r=cmp(v,val)>=0; break; case 'lt': r=cmp(v,val)<0; break; case 'lte': r=cmp(v,val)<=0; break;
      case 'is': r=val==='null'? v==null : String(v)===val; break;
      case 'in': r=val.replace(/^\(|\)$/g,'').split(',').map(function(s){return s.replace(/^"|"$/g,'');}).indexOf(String(v))>=0; break;
      case 'like': case 'ilike': var re=new RegExp('^'+val.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/[%*]/g,'.*')+'$',op==='ilike'?'i':''); r=re.test(String(v==null?'':v)); break;
      default: r=true; }
    return neg?!r:r; }); }

  var USER={id:'11111111-1111-1111-1111-111111111111',aud:'authenticated',role:'authenticated',email:LOGIN.email,app_metadata:{provider:'email'},user_metadata:{},created_at:now()};
  var session=function(){ return {access_token:'demo',token_type:'bearer',expires_in:3600*24,expires_at:Math.floor(Date.now()/1000)+3600*24,refresh_token:'demo',user:USER}; };

  function J(status,body,extra){ var h=Object.assign({'content-type':'application/json'},extra||{});
    return new Response(status===204||body===undefined?null:JSON.stringify(body),{status:status,headers:h}); }

  function handle(url,method,headers,bodyTxt){
    var path=url.pathname;
    if(path==='/auth/v1/token'){ var b=JSON.parse(bodyTxt||'{}');
      if(url.searchParams.get('grant_type')==='password'){
        if(String(b.email||'').trim().toLowerCase()===LOGIN.email&&b.password===LOGIN.senha) return J(200,session());
        return J(400,{code:400,error_code:'invalid_credentials',msg:'Invalid login credentials'}); }
      return J(200,session()); }
    if(path==='/auth/v1/user') return J(200,USER);
    if(path==='/auth/v1/logout') return J(204);
    if(path.indexOf('/auth/v1/')===0) return J(200,{});
    if(path.indexOf('/functions/v1/')===0) return J(400,{error:'Não disponível no ambiente de teste.'});
    if(path.indexOf('/storage/v1/object/list/')===0) return J(200,[]);
    if(path.indexOf('/storage/v1/')===0) return J(200,{Key:path.replace('/storage/v1/object/','')});
    var rpc=/^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(path);
    if(rpc){ if(rpc[1]==='crm_eh_admin') return J(200,true);
      return J(404,{code:'PGRST202',message:'Could not find the function public.'+rpc[1]+' in the schema cache'}); }
    var mt=/^\/rest\/v1\/([a-z_]+)$/.exec(path); if(!mt) return J(404,{message:'não simulado: '+path});
    var table=mt[1]; if(!DB[table]) DB[table]=[];
    var rows=DB[table], pk=PK[table]||'id';
    var filters=[], order=[], limit=null, offset=0, select='*';
    url.searchParams.forEach(function(v,k){
      if(k==='select') select=v; else if(k==='order') order=v.split(','); else if(k==='limit') limit=+v; else if(k==='offset') offset=+v;
      else if(k==='on_conflict'||k==='columns'){} else { var i=v.indexOf('.'); filters.push([k,v.slice(0,i),v.slice(i+1)]); } });
    var prefer=headers.get('prefer')||'', accept=headers.get('accept')||'';
    var wantRep=/return=representation/.test(prefer), single=/vnd\.pgrst\.object/.test(accept);
    var cols=select==='*'?null:select.split(',').map(function(c){return c.trim();}).filter(function(c){return c&&c.indexOf('(')<0;});
    var proj=function(r){ if(!cols||cols.indexOf('*')>=0) return Object.assign({},r); var o={}; cols.forEach(function(c){ var n=c.split(':').pop(); o[n]=r[n]===undefined?null:r[n]; }); return o; };
    var out=function(list,status){ status=status||200;
      if(single){ if(list.length!==1) return J(406,{code:'PGRST116',message:'JSON object requested, multiple (or no) rows returned'}); return J(status,list[0]); }
      return J(status,list,{'content-range':'0-'+Math.max(0,list.length-1)+'/'+list.length}); };
    if(method==='GET'||method==='HEAD'){
      var res=rows.filter(function(r){return matches(r,filters);});
      if(order.length) res.sort(function(a,b){ for(var i=0;i<order.length;i++){ var p=order[i].split('.'), c=p[0], r=cmp(a[c],b[c]); if(p[1]==='desc'&&a[c]!=null&&b[c]!=null) r=-r; if(r) return r; } return 0; });
      res=res.slice(offset, limit!=null?offset+limit:undefined);
      return out(res.map(proj)); }
    var body=bodyTxt?JSON.parse(bodyTxt):null, changed=[];
    if(method==='POST'){
      var list=Array.isArray(body)?body:[body], merge=/resolution=merge-duplicates/.test(prefer), ignore=/resolution=ignore-duplicates/.test(prefer);
      var conf=url.searchParams.get('on_conflict')||pk;
      for(var i=0;i<list.length;i++){ var r=Object.assign({},list[i]);
        var ex=null; for(var k=0;k<rows.length;k++) if(r[conf]!=null&&String(rows[k][conf])===String(r[conf])){ ex=rows[k]; break; }
        if(ex){ if(ignore) continue; if(!merge) return J(409,{code:'23505',message:'duplicate key value violates unique constraint "'+table+'_pkey"'});
          Object.assign(ex,r); changed.push(ex); continue; }
        if(r[pk]==null&&pk==='id') r.id=uuid();
        if(r.created_at===undefined&&table.indexOf('crm_')===0) r.created_at=now();
        if(table==='crm_historico'||table==='cx_historico'){ if(r.t==null) r.t=now(); if(r.id==null) r.id=uuid(); }
        rows.push(r); changed.push(r); }
      save(); return wantRep? out(changed.map(proj),201) : J(201); }
    if(method==='PATCH'){ var res2=rows.filter(function(r){return matches(r,filters);}); res2.forEach(function(r){ Object.assign(r,body); });
      save(); return wantRep? out(res2.map(proj)) : J(204); }
    if(method==='DELETE'){ var gone=rows.filter(function(r){return matches(r,filters);});
      DB[table]=rows.filter(function(r){return gone.indexOf(r)<0;});
      if(table==='crm_clients'){ var gid=gone.map(function(r){return r.id;}); ['crm_events','crm_payments','crm_deliveries','crm_tasks'].forEach(function(t){ DB[t]=(DB[t]||[]).filter(function(x){return gid.indexOf(x.client_id)<0;}); }); }
      save(); return wantRep? out(gone.map(proj)) : J(204); }
    return J(405,{message:'método não simulado'});
  }

  window.fetch=function(input,init){
    var url=new URL(typeof input==='string'?input:(input&&input.url)||String(input), location.href);
    if(url.hostname!==SB_HOST) return realFetch(input,init);
    init=init||{};
    var method=(init.method||(input&&input.method)||'GET').toUpperCase();
    var headers=new Headers(init.headers||(input&&input.headers)||{});
    var body=init.body;
    return Promise.resolve(typeof body==='string'||body==null?body:new Response(body).text()).then(function(txt){
      return new Promise(function(res){ setTimeout(function(){ try{ res(handle(url,method,headers,txt)); }catch(e){ res(J(500,{message:String(e&&e.message||e)})); } },60); }); });
  };

  // tempo real (websocket do Supabase): finge que conectou e não manda nada
  var RealWS=window.WebSocket;
  function FakeWS(url){ var self=this; this.url=url; this.readyState=0; this.binaryType='blob';
    setTimeout(function(){ self.readyState=1; if(self.onopen) self.onopen({}); },50); }
  FakeWS.prototype.send=function(m){ var self=this; try{ var j=JSON.parse(m);
    setTimeout(function(){ if(self.onmessage) self.onmessage({data:JSON.stringify({event:'phx_reply',topic:j.topic,ref:j.ref,join_ref:j.join_ref,payload:{status:'ok',response:{postgres_changes:[]}}})}); },20); }catch(_){} };
  FakeWS.prototype.close=function(){ this.readyState=3; if(this.onclose) this.onclose({code:1000}); };
  FakeWS.prototype.addEventListener=function(t,f){ this['on'+t]=f; };
  FakeWS.prototype.removeEventListener=function(){};
  FakeWS.CONNECTING=0; FakeWS.OPEN=1; FakeWS.CLOSING=2; FakeWS.CLOSED=3;
  window.WebSocket=function(url,p){ return String(url).indexOf(SB_HOST)>=0? new FakeWS(url) : new RealWS(url,p); };
  Object.assign(window.WebSocket,{CONNECTING:0,OPEN:1,CLOSING:2,CLOSED:3});

  // faixa de aviso + login preenchido
  document.addEventListener('DOMContentLoaded',function(){
    var bar=document.createElement('div');
    bar.setAttribute('role','note');
    bar.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#F2C14E;color:#1A1D22;font:500 12.5px system-ui,sans-serif;padding:6px 12px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;box-shadow:0 -1px 6px rgba(0,0,0,.15)';
    bar.innerHTML='<span>Ambiente de teste: dados fictícios, salvos só neste navegador. Login: <b>'+LOGIN.email+'</b> / <b>'+LOGIN.senha+'</b></span>'+
      '<button type="button" style="font:inherit;border:1px solid #1A1D22;background:transparent;border-radius:6px;padding:2px 8px;cursor:pointer">Restaurar dados de exemplo</button>';
    bar.querySelector('button').onclick=function(){ if(!confirm('Apagar as mudanças feitas aqui e voltar aos dados de exemplo?')) return;
      try{ localStorage.removeItem(KEY); }catch(_){} location.reload(); };
    document.body.appendChild(bar); document.body.style.paddingBottom='34px';
    var e=document.getElementById('email'), p=document.getElementById('password');
    if(e&&!e.value) e.value=LOGIN.email; if(p&&!p.value) p.value=LOGIN.senha;
  });
})();
