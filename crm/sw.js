/* Service worker do CRM (PWA). Escopo: só /crm/ — o site e o /admin não passam por aqui.
   - Página do CRM: sempre tenta a rede primeiro (publicação nova aparece na hora);
     sem internet, abre a última versão salva.
   - Ícones, fontes e bibliotecas (CDN): usa o que está salvo e atualiza em segundo plano.
   - Dados (Supabase) e Google Agenda: nunca são guardados aqui, vão direto para a rede. */
var VERSAO = 'crm-v1';
var BASE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function soRede(url) {
  return /supabase\.co$/.test(url.hostname) || /(^|\.)google\.com$/.test(url.hostname) ||
    (/googleapis\.com$/.test(url.hostname) && url.hostname !== 'fonts.googleapis.com');
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (soRede(url)) return;

  // a página: rede primeiro, cópia salva se estiver sem internet
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      var cp = r.clone(); caches.open(VERSAO).then(function (c) { c.put('./index.html', cp); });
      return r;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }

  // o resto (ícones, fontes, bibliotecas): o salvo na hora, atualizando por trás
  e.respondWith(caches.open(VERSAO).then(function (c) {
    return c.match(req).then(function (salvo) {
      var rede = fetch(req).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
        return r;
      }).catch(function () { return salvo; });
      return salvo || rede;
    });
  }));
});
