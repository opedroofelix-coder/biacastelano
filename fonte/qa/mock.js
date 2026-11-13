// Fake Supabase (auth + PostgREST + storage) para testes. Estado em memória por contexto.
const crypto=require('crypto'); const fs=require('fs');
const uuid=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
const PK={crm_settings:'key',cx_meses:'mes',site_settings:'id'};
const TYPES={ // tipos/validações essenciais do schema real
 crm_clients:{couple:{nn:1},stage:{nn:1,def:'lead'},event_type:{nn:1,def:'wed'},source:{nn:1,def:'instagram'},event_date:{t:'date'},value:{t:'num'},sinal:{t:'num'},data_sinal:{t:'date'},data_final:{t:'date'},data_multa:{t:'date'},checklist:{def:[]},marcos:{def:{}},servicos:{def:[]},parcelas_avulsas:{def:[]},created_at:{def:'now'},updated_at:{def:'now'}},
 crm_events:{title:{nn:1},starts_at:{nn:1,t:'ts'},type:{nn:1,def:'reu'},created_at:{def:'now'}},
 crm_payments:{amount:{nn:1,t:'num',def:0},due_date:{t:'date'},paid_at:{t:'date'},created_at:{def:'now'}},
 crm_deliveries:{item:{nn:1},due_date:{t:'date'},progress:{nn:1,t:'int',def:0,min:0,max:100},done:{nn:1,def:false},created_at:{def:'now'}},
 crm_tasks:{title:{nn:1},due_date:{t:'date'},done:{nn:1,def:false},created_at:{def:'now'}},
 crm_historico:{a:{nn:1},det:{def:''},t:{def:'now'}}, cx_historico:{a:{nn:1},det:{def:''},t:{def:'now'}},
 cx_meses:{mes:{nn:1,re:/^\d{4}-\d{2}$/},saldo_final:{t:'num'}},
 cx_contas:{nome:{def:''},valor:{t:'num',def:0},dia:{t:'int',min:1,max:31}},
 cx_movimentos:{mes:{nn:1,fk:['cx_meses','mes']},d:{def:''},e:{t:'num'},s:{t:'num'},c:{def:''},o:{t:'int',def:0},created_at:{def:'now'}},
 crm_settings:{updated_at:{def:'now'}},
 albums:{title:{nn:1},category:{nn:1,def:'wed',enumv:['pre','wed']},photos:{def:[]},sort:{def:0},created_at:{def:'now'}},
 testimonials:{sort:{def:0},created_at:{def:'now'}}, films:{sort:{def:0},created_at:{def:'now'}},
 site_settings:{id:{chk:v=>v===1}},
};
function seed(){
 const d=(off)=>{const x=new Date(); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10);};
 const c1=uuid(),c2=uuid(),c3=uuid(),c4=uuid();
 const base={checklist:[],marcos:{},servicos:[],parcelas_avulsas:[],created_at:now(),updated_at:now()};
 return {
  crm_clients:[
   {...base,id:c1,couple:'Ana & Léo',stage:'lead',event_type:'wed',event_date:d(200),venue:'Fazenda X',package:'Foto',value:8000,source:'instagram',whatsapp:'11999990000',email:'ana@x.com'},
   {...base,id:c2,couple:'Marina & Rafa',stage:'prop',event_type:'wed',event_date:d(90),value:12000,source:'site',contrato:'Pendente'},
   {...base,id:c3,couple:'Helena & Théo',stage:'contr',event_type:'wed',event_date:d(30),value:15000,source:'indicacao',contrato:'Assinado',servicos:['Foto','Vídeo']},
   {...base,id:c4,couple:'Sofia & Dan',stage:'done',event_type:'wed',event_date:d(-120),value:9000,source:'outro',contrato:'Assinado'}],
  crm_events:[{id:uuid(),client_id:c2,type:'reu',title:'Reunião Marina',starts_at:new Date(Date.now()+2*864e5).toISOString(),created_at:now()}],
  crm_payments:[{id:uuid(),client_id:c3,description:'Entrada',amount:3000,due_date:d(-5),paid_at:null,created_at:now()},{id:uuid(),client_id:c3,description:'Final',amount:12000,due_date:d(25),paid_at:null,created_at:now()}],
  crm_deliveries:[{id:uuid(),client_id:c4,item:'Galeria completa',detail:'400 fotos',due_date:d(-3),progress:60,done:false,created_at:now()}],
  crm_tasks:[{id:uuid(),client_id:c1,title:'Enviar proposta',due_date:d(1),done:false,created_at:now()}],
  crm_settings:[], crm_historico:[], cx_meses:[], cx_movimentos:[], cx_contas:[], cx_historico:[],
  site_settings:[{id:1,proposito:['Parágrafo A'],sobre:['Sobre A'],stats:[{num:'+400',label:'casamentos'}],whatsapp:'5511945198244',instagram:'bia.castelano',email:'bia@x.com',location:'SP',hero_gallery:[],hero_video:'',about_image:null,contact_image:null}],
  albums:[{id:uuid(),title:'Álbum 1',subtitle:'Wedding',category:'wed',photos:['https://ufacszuqskvgpmcjyaqi.supabase.co/storage/v1/object/public/fotos/a.webp'],sort:0,created_at:now()}],
  testimonials:[{id:uuid(),handle:'@casal',date_label:'1 de jan',body:'Lindo',sort:0,created_at:now()}],
  films:[{id:uuid(),title:'Filme 1',subtitle:'Trailer',thumb:null,youtube_url:'https://youtu.be/dQw4w9WgXcQ',sort:0,created_at:now()}],
 };
}
function parseVal(v){ if(v==='null')return null; if(v==='true')return true; if(v==='false')return false; return v; }
function cmp(a,b){ if(a==null&&b==null)return 0; if(a==null)return 1; if(b==null)return -1; const na=+a,nb=+b; if(!isNaN(na)&&!isNaN(nb)&&typeof a!=='boolean'&&a!==''&&b!=='') return na-nb; return String(a)<String(b)?-1:String(a)>String(b)?1:0; }
function matches(row,filters){ return filters.every(([col,op,val])=>{ const v=row[col];
  switch(op){ case 'eq': return String(v)===String(parseVal(val)); case 'neq': return String(v)!==String(val);
   case 'gt': return cmp(v,val)>0; case 'gte': return cmp(v,val)>=0; case 'lt': return cmp(v,val)<0; case 'lte': return cmp(v,val)<=0;
   case 'is': return val==='null'? v==null : String(v)===val;
   case 'in': return val.replace(/^\(|\)$/g,'').split(',').map(s=>s.replace(/^"|"$/g,'')).includes(String(v));
   case 'cs': try{ const want=JSON.parse(val.replace(/^\{/,'[').replace(/\}$/,']')); return want.every(w=>(v||[]).includes(w)); }catch(_){ return true; }
   default: return true; } }); }
function validate(table,row,isInsert){
 const T=TYPES[table]||{};
 for(const [k,s] of Object.entries(T)){
  if(isInsert && row[k]===undefined && s.def!==undefined) row[k]= s.def==='now'?now():JSON.parse(JSON.stringify(s.def));
  const v=row[k];
  if(s.nn && (v===null || (isInsert&&v===undefined))) return {code:'23502',message:`null value in column "${k}" of relation "${table}" violates not-null constraint`};
  if(v==null||v==='') { if(v===''&&s.t&&s.t!=='text') return {code:'22P02',message:`invalid input syntax for type ${s.t==='num'?'numeric':s.t==='int'?'integer':s.t==='date'?'date':'timestamp with time zone'}: ""`}; continue; }
  if(s.t==='num' && isNaN(Number(v))) return {code:'22P02',message:`invalid input syntax for type numeric: "${v}"`};
  if(s.t==='num' && Math.abs(Number(v))>=1e10) return {code:'22003',message:'numeric field overflow'};
  if(s.t==='int' && !/^-?\d+$/.test(String(v))) return {code:'22P02',message:`invalid input syntax for type integer: "${v}"`};
  if(s.t==='date' && (!/^\d{4}-\d{2}-\d{2}/.test(String(v))||isNaN(Date.parse(String(v).slice(0,10))))) return {code:'22007',message:`invalid input syntax for type date: "${v}"`};
  if(s.t==='date' && /^\d{4}-\d{2}-\d{2}$/.test(String(v))){ const [y,m,dd]=String(v).split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,dd)); if(dt.getUTCMonth()!==m-1) return {code:'22008',message:`date/time field value out of range: "${v}"`}; }
  if(s.t==='ts' && isNaN(Date.parse(v))) return {code:'22007',message:`invalid input syntax for type timestamp with time zone: "${v}"`};
  if(s.min!=null && (+v<s.min||+v>s.max)) return {code:'23514',message:`new row for relation "${table}" violates check constraint "${table}_${k}_check"`};
  if(s.re && !s.re.test(v)) return {code:'23514',message:`new row for relation "${table}" violates check constraint "${table}_${k}_check"`};
  if(s.enumv && !s.enumv.includes(v)) return {code:'23514',message:`violates check constraint ${k}`};
  if(s.chk && !s.chk(v)) return {code:'23514',message:`violates check constraint ${k}`};
 }
 return null;
}
const PNG=fs.readFileSync(require('path').join(__dirname,'..','..','fallback','p1.webp'));
async function installMock(ctx,opts={}){
 const st={db:seed(),calls:[],writes:[],opts,uploads:[]};
 const USER={id:'11111111-1111-1111-1111-111111111111',aud:'authenticated',role:'authenticated',email:'bia@teste.com',app_metadata:{provider:'email'},user_metadata:{},created_at:now()};
 await ctx.routeWebSocket(/supabase\.co/, ws=>{ ws.onMessage(m=>{ try{ const j=JSON.parse(m); ws.send(JSON.stringify({event:'phx_reply',topic:j.topic,ref:j.ref,join_ref:j.join_ref,payload:{status:'ok',response:{postgres_changes:[]}}})); }catch(_){} }); });
 await ctx.route(/ufacszuqskvgpmcjyaqi\.supabase\.co/, async route=>{
  const req=route.request(); const u=new URL(req.url()); const m=req.method(); const path=u.pathname;
  const J=(status,body,headers={})=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*',...headers},body:body===undefined?'':JSON.stringify(body)});
  if(m==='OPTIONS') return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
  if(opts.latency) await new Promise(r=>setTimeout(r,opts.latency));
  st.calls.push(m+' '+path+u.search);
  // ---- auth
  if(path==='/auth/v1/token'){ const b=JSON.parse(req.postData()||'{}');
    if(u.searchParams.get('grant_type')==='password'){
      st.loginAttempts=(st.loginAttempts||0)+1;
      if(b.email==='bia@teste.com'&&b.password==='senha123') return J(200,{access_token:'tok',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'ref',user:USER});
      return J(400,{code:400,error_code:'invalid_credentials',msg:'Invalid login credentials'}); }
    return J(200,{access_token:'tok',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'ref',user:USER}); }
  if(path==='/auth/v1/user') return J(200,USER);
  if(path==='/auth/v1/logout') return route.fulfill({status:204,headers:{'access-control-allow-origin':'*'}});
  // ---- storage
  if(path.startsWith('/storage/v1/object/list/')) return J(200,[]);
  if(path.startsWith('/storage/v1/object/public/')) return route.fulfill({status:200,contentType:'image/webp',body:PNG});
  if(path.startsWith('/storage/v1/object/')){ if(opts.failUpload) return J(400,{statusCode:'413',error:'Payload too large',message:'The object exceeded the maximum allowed size'}); st.uploads.push(path); return J(200,{Key:path.replace('/storage/v1/object/','')}); }
  // ---- rest
  // RPCs do controle de acessos: a usuária de teste é administradora; sem acessos por pessoa
  // (o CRM trata a função ausente como "acesso total", igual a um banco sem acessos_setup.sql)
  const rpc=/^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(path);
  if(rpc){ if(rpc[1]==='crm_eh_admin') return J(200,true);
    if(rpc[1]==='crm_meu_acesso'&&opts.acesso) return J(200,opts.acesso);
    return J(404,{code:'PGRST202',message:`Could not find the function public.${rpc[1]} in the schema cache`}); }
  const mt=/^\/rest\/v1\/([a-z_]+)$/.exec(path); if(!mt) return J(404,{message:'not mocked '+path});
  const table=mt[1];
  if((opts.failTables||[]).includes(table) && (m==='GET'||opts.failWrites)) return J(500,{code:'XX000',message:'falha simulada em '+table});
  if((opts.failWriteTables||[]).includes(table) && m!=='GET') return J(500,{code:'XX000',message:'falha simulada ao gravar em '+table});
  if(!st.db[table]) return J(404,{code:'42P01',message:`relation "public.${table}" does not exist`});
  const rows=st.db[table]; const pk=PK[table]||'id';
  const filters=[]; let order=[],limit=null,offset=0,select='*';
  for(const [k,v] of u.searchParams){ if(k==='select') select=v; else if(k==='order') order=v.split(','); else if(k==='limit') limit=+v; else if(k==='offset') offset=+v; else if(k==='on_conflict'||k==='columns'){} else { const i=v.indexOf('.'); filters.push([k,v.slice(0,i),v.slice(i+1)]); } }
  const prefer=req.headers()['prefer']||''; const accept=req.headers()['accept']||''; const wantRep=/return=representation/.test(prefer);
  const single=/vnd\.pgrst\.object/.test(accept);
  const proj=r=>{ if(select==='*'||!select) return {...r}; const o={}; select.split(',').forEach(c=>o[c]=r[c]===undefined?null:r[c]); return o; };
  const out=(list,status=200)=>{ if(single){ if(list.length!==1) return J(406,{code:'PGRST116',message:'JSON object requested, multiple (or no) rows returned',details:`The result contains ${list.length} rows`}); return J(status,list[0]); } return J(status,list); };
  if(m==='GET'||m==='HEAD'){
    let res=rows.filter(r=>matches(r,filters));
    if(select!=='*'&&(opts.missingCols||[]).length){ for(const c of select.split(',')) if(opts.missingCols.includes(table+'.'+c)) return J(400,{code:'42703',message:`column ${table}.${c} does not exist`}); }
    if(order.length) res.sort((a,b)=>{ for(const o of order){ const [c,dir,nl]=o.split('.'); let r=cmp(a[c],b[c]); if(a[c]==null||b[c]==null){ if(a[c]==null&&b[c]!=null) r= nl==='nullsfirst'?-1:1; else if(b[c]==null&&a[c]!=null) r= nl==='nullsfirst'?1:-1; } else if(dir==='desc') r=-r; if(r) return r; } return 0; });
    res=res.slice(offset, limit!=null?offset+limit:undefined);
    return out(res.map(proj));
  }
  const body=req.postData()?JSON.parse(req.postData()):null;
  if(m==='POST'){
    const list=Array.isArray(body)?body:[body]; const merge=/resolution=merge-duplicates/.test(prefer), ignore=/resolution=ignore-duplicates/.test(prefer);
    const conf=u.searchParams.get('on_conflict')||pk; const res=[];
    for(const r0 of list){ const r={...r0};
      const ex=rows.find(x=>r[conf]!=null&&String(x[conf])===String(r[conf]));
      if(ex){ if(ignore) continue; if(!merge) return J(409,{code:'23505',message:`duplicate key value violates unique constraint "${table}_pkey"`});
        const merged={...ex,...r}; const e=validate(table,merged,false); if(e) return J(400,e); Object.assign(ex,merged); res.push(ex); st.writes.push(['upsert',table,r]); continue; }
      if(pk==='id'&&r.id==null&&!['cx_contas','cx_movimentos'].includes(table)) r.id=uuid();
      if(r[pk]==null) return J(400,{code:'23502',message:`null value in column "${pk}" violates not-null constraint`});
      const e=validate(table,r,true); if(e) return J(400,e);
      const T=TYPES[table]||{}; for(const [k,s] of Object.entries(T)) if(s.fk && !st.db[s.fk[0]].some(x=>x[s.fk[1]]===r[k])) return J(409,{code:'23503',message:`insert or update on table "${table}" violates foreign key constraint`});
      rows.push(r); res.push(r); st.writes.push(['insert',table,r]); }
    return wantRep? out(res.map(proj),201) : route.fulfill({status:201,headers:{'access-control-allow-origin':'*'},body:''});
  }
  if(m==='PATCH'){ const res=rows.filter(r=>matches(r,filters));
    for(const r of res){ const merged={...r,...body}; const e=validate(table,merged,false); if(e) return J(400,e); }
    res.forEach(r=>Object.assign(r,body)); st.writes.push(['update',table,body,filters]);
    return wantRep? out(res.map(proj)) : route.fulfill({status:204,headers:{'access-control-allow-origin':'*'},body:''}); }
  if(m==='DELETE'){ const res=rows.filter(r=>matches(r,filters)); st.db[table]=rows.filter(r=>!res.includes(r)); st.writes.push(['delete',table,filters]);
    if(table==='crm_clients'){ const ids=res.map(r=>r.id); for(const t of ['crm_events','crm_payments','crm_deliveries']) st.db[t]=st.db[t].filter(x=>!ids.includes(x.client_id)); }
    return wantRep? out(res.map(proj)) : route.fulfill({status:204,headers:{'access-control-allow-origin':'*'},body:''}); }
  return J(405,{message:'method'});
 });
 return st;
}
module.exports={installMock};
