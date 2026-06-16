const CACHE_NAME = 'ruedard-menu-ipad-v35';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './assets/ruedard-hero-dominicana.png'];

const MENU_PATCH = `
<style id="ruedard-menu-ipad-patch">
.mobile-menu-btn{display:none;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;font-weight:900;align-items:center;justify-content:center;}
.mobile-drawer{position:fixed;top:58px;left:10px;right:10px;z-index:950;display:none;background:#0B2545;border:1px solid rgba(255,255,255,.14);border-radius:0 0 18px 18px;box-shadow:0 24px 50px rgba(0,0,0,.32);padding:12px;}
.mobile-drawer.open{display:block;animation:fup .16s ease both;}
.mobile-drawer-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mobile-drawer button{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;border-radius:12px;padding:12px 10px;font:inherit;font-size:.77rem;font-weight:800;text-align:left;}
.mobile-drawer button.primary{background:#60A5FA;color:#061A32;border-color:#60A5FA;}
.mobile-drawer .drawer-wide{grid-column:1/-1;text-align:center;}
@media(max-width:767px){
  .topbar{height:64px!important;padding-left:12px!important;padding-right:12px!important;gap:8px!important;display:flex!important;}
  .stepper{top:64px!important;}
  .main{margin-top:114px!important;}
  .topbar>div:first-child{flex:1!important;min-width:0!important;}
  .t-logo{font-size:1.15rem!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
  .t-right{gap:7px!important;}
  .mobile-menu-btn{display:flex!important;flex-shrink:0!important;}
  .mobile-drawer{top:64px!important;}
  .public-nav,.public-actions,.session-badge,#account-btn,#switch-btn,#logout-btn,#mode-btn,.t-lang,.t-theme{display:none!important;}
  #usr-info{display:flex!important;gap:6px!important;min-width:0!important;}
  .t-name{display:none!important;}
  .t-av{width:34px!important;height:34px!important;}
  .header-back.show{max-width:78px!important;padding:8px 10px!important;border-radius:16px!important;font-size:.68rem!important;line-height:1.1!important;white-space:normal!important;}
}
@media(min-width:768px) and (max-width:1099px){
  .topbar{height:62px!important;padding-left:22px!important;padding-right:22px!important;display:flex!important;}
  .stepper{top:62px!important;}
  .main{margin-top:112px!important;}
  .topbar>div:first-child{flex:1!important;min-width:0!important;}
  .public-nav,.public-actions,.session-badge,#account-btn,#switch-btn,#logout-btn,#mode-btn{display:none!important;}
  .mobile-menu-btn{display:flex!important;flex-shrink:0!important;}
  .mobile-drawer{top:62px!important;left:auto!important;right:18px!important;width:min(380px,calc(100vw - 36px))!important;}
  .t-right{gap:8px!important;}
  .t-pill{padding:8px 11px!important;border-radius:16px!important;}
  #usr-info{display:flex!important;gap:7px!important;min-width:0!important;}
  .t-name{display:none!important;}
}
@media(min-width:1100px){.mobile-menu-btn,.mobile-drawer{display:none!important;}}
</style>
<script id="ruedard-menu-ipad-js">
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  ready(function(){
    var drawer=document.getElementById('mobile-drawer');
    if(!drawer){
      drawer=document.createElement('div');
      drawer.className='mobile-drawer';
      drawer.id='mobile-drawer';
      drawer.innerHTML='<div class="mobile-drawer-grid"><button class="primary" onclick="mobileAction(\\'account\\')">👤 Mi cuenta</button><button onclick="mobileAction(\\'switch\\')">⇄ Cambiar perfil</button><button onclick="mobileAction(\\'find\\')">🚗 Buscar carros</button><button onclick="mobileAction(\\'publish\\')">🔑 Publicar carro</button><button onclick="mobileAction(\\'lang\\')" id="drawer-lang">🌐 Idioma</button><button onclick="mobileAction(\\'theme\\')">☀️ Tema</button><button class="drawer-wide" onclick="mobileAction(\\'logout\\')">Salir</button></div>';
      var header=document.querySelector('.topbar');
      if(header&&header.parentNode)header.parentNode.insertBefore(drawer,header.nextSibling);
    }
    if(!document.querySelector('.mobile-menu-btn')){
      var btn=document.createElement('button');
      btn.className='mobile-menu-btn';btn.type='button';btn.setAttribute('aria-label','Abrir menú');btn.textContent='☰';
      btn.onclick=function(){window.toggleMobileMenu&&window.toggleMobileMenu();};
      var right=document.querySelector('.t-right');if(right)right.appendChild(btn);
    }
    window.toggleMobileMenu=function(){var d=document.getElementById('mobile-drawer');if(!d)return;d.className=d.className.indexOf(' open')>-1?'mobile-drawer':'mobile-drawer open';};
    window.closeMobileMenu=function(){var d=document.getElementById('mobile-drawer');if(d)d.className='mobile-drawer';};
    window.mobileAction=function(action){
      closeMobileMenu();
      if(action==='account'){if(window.S&&S.user&&window.showAccount)showAccount();else if(window.openPublicLogin)openPublicLogin();return;}
      if(action==='switch'){if(window.S&&S.user&&window.showProfileSwitcher)showProfileSwitcher();else if(window.openPublicSignup)openPublicSignup('r');return;}
      if(action==='find'){if(window.S&&S.user&&window.showPage)showPage(1);else if(window.goPublicSection)goPublicSection('featured');return;}
      if(action==='publish'){if(window.S&&S.user&&window.showOwner)showOwner();else if(window.openPublicSignup)openPublicSignup('o');return;}
      if(action==='lang'&&window.toggleLanguage){toggleLanguage();return;}
      if(action==='theme'&&window.toggleTheme){toggleTheme();return;}
      if(action==='logout'&&window.logout){logout();return;}
    };
  });
})();
</script>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

function patchHtml(html) {
  html = html.replace(/<style id="ruedard-layout-fix">[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style id="ruedard-iphone-menu-fix">[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style id="ruedard-stable-reset">[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style id="ruedard-menu-ipad-patch">[\s\S]*?<\/script>/g, '');
  return html.replace('</head>', MENU_PATCH + '</head>');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode === 'navigate' || request.url.endsWith('/index.html') || request.url.endsWith('/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }).then((response) => response.text().then((html) => new Response(patchHtml(html), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }))).catch(() => caches.match('./index.html').then((cached) => cached ? cached.text().then((html) => new Response(patchHtml(html), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })) : Response.error())));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});