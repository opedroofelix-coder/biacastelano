const { chromium, devices } = require('playwright');
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;
async function launch(){ return chromium.launch({ proxy, args:['--ignore-certificate-errors'] }); }
function watch(p, logs){
  p.on('console', m=>{ if(['error','warning'].includes(m.type())) logs.push(m.type()+': '+m.text().slice(0,250)); });
  p.on('pageerror', e=>logs.push('PAGEERROR: '+e.message.slice(0,300)));
  p.on('requestfailed', r=>{ const u=r.url(); if(/youtube|googlevideo|doubleclick/.test(u)) return; logs.push('REQFAIL: '+r.method()+' '+u.slice(0,140)+' '+r.failure().errorText); });
  p.on('response', r=>{ if(r.status()>=400) logs.push('HTTP '+r.status()+' '+r.request().method()+' '+r.url().slice(0,160)); });
}
module.exports={launch,watch,devices};
