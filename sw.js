// Service worker: guarda o app no aparelho para uso off-line
const C='falhas-glova-v7';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./favicon-48.png','./splash.png'];
self.addEventListener('install',e=>{
  // cada arquivo é guardado separadamente: um arquivo faltando não impede o resto
  e.waitUntil(caches.open(C).then(c=>Promise.all(FILES.map(f=>
    fetch(f,{cache:'reload'}).then(r=>{if(r.ok) return c.put(f,r);}).catch(()=>{})))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin) return;
  if(req.mode==='navigate'){
    // páginas: abre direto do aparelho (funciona sem sinal) e atualiza em segundo plano quando houver internet
    const net=fetch(req).then(r=>{
      if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put('./index.html',cp));}
      return r;
    });
    e.respondWith(caches.match('./index.html').then(hit=>hit||caches.match('./')).then(hit=>hit||net));
    e.waitUntil(net.catch(()=>{}));
    return;
  }
  // demais arquivos: cache primeiro, rede depois (e guarda o que vier da rede)
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{
    if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp));}
    return r;
  })));
});