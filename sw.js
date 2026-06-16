const CACHE_NAME = 'ruedard-stable-v32';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './assets/ruedard-hero-dominicana.png'];

const STABLE_RESET = `
<style id="ruedard-stable-reset">
  @media (min-width:768px){
    .topbar{height:58px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:0!important;padding:0 18px!important;}
    .top-left{display:flex!important;grid-column:auto!important;justify-content:flex-start!important;gap:8px!important;}
    .t-logo{font-size:1.3rem!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;}
    .t-right{display:flex!important;grid-column:auto!important;justify-content:flex-end!important;gap:7px!important;}
    .public-nav{display:flex!important;align-items:center!important;gap:24px!important;margin-left:auto!important;margin-right:24px!important;flex:0 1 auto!important;}
    .public-nav button{font-size:.76rem!important;white-space:normal!important;}
    .public-actions{display:flex!important;align-items:center!important;gap:8px!important;}
    .mobile-menu-btn,.mobile-quick-btn,.mobile-drawer{display:none!important;}
    .stepper{top:58px!important;}
    .main{margin-top:108px!important;}
    #pg-login{max-width:none!important;width:auto!important;margin:-22px -14px -80px!important;min-height:calc(100vh - 58px)!important;padding:0!important;overflow:hidden!important;}
    .login-shell{display:grid!important;grid-template-columns:minmax(340px,480px) 1fr!important;gap:70px!important;align-items:center!important;min-height:calc(100vh - 58px)!important;padding:58px max(24px,calc((100vw - 1180px)/2))!important;background:#0B2545 url('assets/ruedard-hero-dominicana.png') center/cover no-repeat!important;}
    .login-shell::before{background:linear-gradient(90deg,rgba(5,20,39,.88) 0%,rgba(5,20,39,.57) 44%,rgba(5,20,39,.16) 76%)!important;}
    .login-box{width:auto!important;max-width:none!important;margin:0!important;}
    .login-hero-copy{display:block!important;}
  }
  @media (min-width:768px) and (max-width:1099px){
    .topbar{height:62px!important;padding-left:22px!important;padding-right:22px!important;}
    .stepper{top:62px!important;}
    .main{margin-top:112px!important;}
    .public-nav{gap:14px!important;margin-right:14px!important;}
    .public-nav button{font-size:.7rem!important;}
    .t-right{gap:8px!important;}
    .t-pill{padding:8px 11px!important;border-radius:16px!important;}
  }
  @media (max-width:767px){
    .topbar{height:64px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding-left:12px!important;padding-right:12px!important;gap:8px!important;}
    .top-left{flex:1!important;min-width:0!important;justify-content:flex-start!important;}
    .t-logo{font-size:1.15rem!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
    .t-right{gap:7px!important;justify-content:flex-end!important;}
    .mobile-menu-btn{display:flex!important;width:42px!important;height:42px!important;border-radius:14px!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(255,255,255,.1)!important;color:#fff!important;font-size:1.25rem!important;}
    .mobile-quick-btn{display:none!important;}
    .mobile-drawer{position:fixed!important;top:64px!important;left:10px!important;right:10px!important;bottom:auto!important;z-index:950!important;display:none;background:#0B2545!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:0 0 18px 18px!important;box-shadow:0 24px 50px rgba(0,0,0,.32)!important;padding:12px!important;overflow:visible!important;}
    .mobile-drawer.open{display:block!important;}
    .mobile-menu-head,.mobile-menu-section,.mobile-menu-list{display:none!important;}
    .mobile-drawer-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
    .mobile-drawer button{border:1px solid rgba(255,255,255,.16)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;border-radius:12px!important;padding:12px 10px!important;font:inherit!important;font-size:.77rem!important;font-weight:800!important;text-align:left!important;min-height:auto!important;}
    .mobile-drawer button.primary{background:#60A5FA!important;color:#061A32!important;border-color:#60A5FA!important;}
    .mobile-drawer .drawer-wide{grid-column:1/-1!important;text-align:center!important;}
    .public-nav,.public-actions,.session-badge,#account-btn,#switch-btn,#logout-btn,#mode-btn,.t-lang,.t-theme{display:none!important;}
    #usr-info{display:flex!important;gap:6px!important;min-width:0!important;}
    .header-back.show{max-width:78px!important;padding:8px 10px!important;border-radius:16px!important;font-size:.68rem!important;line-height:1.1!important;white-space:normal!important;display:flex!important;}
    #pg-login{width:auto!important;margin:-22px -14px -80px!important;}
    .login-shell{display:block!important;min-height:auto!important;padding:28px 12px 80px!important;background-position:64% center!important;}
    .login-shell::before{background:rgba(5,20,39,.67)!important;}
    .login-hero-copy{display:none!important;}
  }
</style>
<script id="ruedard-stable-reset-js">
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  ready(function(){
    var old=document.getElementById('ruedard-layout-fix');if(old)old.remove();
    var oldjs=document.getElementById('ruedard-layout-fix-js');if(oldjs)oldjs.remove();
    var drawer=document.getElementById('mobile-drawer');
    if(drawer && !drawer.querySelector('.mobile-drawer-grid')){
      drawer.innerHTML='<div class="mobile-drawer-grid"><button class="primary" onclick="mobileAction(\'account\')">👤 Mi cuenta</button><button onclick="mobileAction(\'switch\')">⇄ Cambiar perfil</button><button onclick="mobileAction(\'find\')">🚗 Buscar carros</button><button onclick="mobileAction(\'publish\')">🔑 Publicar carro</button><button onclick="mobileAction(\'lang\')" id="drawer-lang">🌐 Idioma</button><button onclick="mobileAction(\'theme\')">☀️ Tema</button><button class="drawer-wide" onclick="mobileAction(\'logout\')">Salir</button></div>';
    }
    var quick=document.querySelector('.mobile-quick-btn');if(quick)quick.remove();
    var menu=document.querySelector('.mobile-menu-btn'), right=document.querySelector('.t-right');
    if(menu && right && menu.parentElement!==right){right.appendChild(menu);}
  });
})();
</script>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function injectStableReset(html) {
  html = html.replace(/<style id="ruedard-layout-fix">[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style id="ruedard-iphone-menu-fix">[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style id="ruedard-stable-reset">[\s\S]*?<\/script>/g, '');
  return html.replace('</head>', STABLE_RESET + '</head>');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode === 'navigate' || request.url.endsWith('/index.html') || request.url.endsWith('/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => response.text().then((html) => new Response(injectStableReset(html), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        })))
        .catch(() => caches.match('./index.html').then((cached) => cached ? cached.text().then((html) => new Response(injectStableReset(html), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })) : Response.error()))
    );
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});