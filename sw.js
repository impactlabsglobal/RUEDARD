const CACHE_NAME = 'ruedard-layout-v30';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './assets/ruedard-hero-dominicana.png'];

const LAYOUT_FIX = `
<style id="ruedard-layout-fix">
.topbar{gap:18px!important;padding-left:clamp(16px,3vw,44px)!important;padding-right:clamp(16px,3vw,44px)!important;}
.top-left{min-width:max-content!important;}
.t-right{flex-shrink:0!important;}
.public-nav{display:flex!important;align-items:center!important;justify-content:center!important;gap:clamp(14px,2vw,28px)!important;margin-left:auto!important;margin-right:auto!important;min-width:0!important;flex:1!important;}
.public-nav button,.public-actions button{white-space:nowrap!important;}
.public-actions{flex-shrink:0!important;}
#pg-login.vis{max-width:none!important;width:calc(100% + 28px)!important;margin:-108px -14px -80px!important;min-height:calc(100dvh - 58px)!important;overflow:hidden!important;}
#pg-login .login-shell{width:100%!important;min-height:calc(100dvh - 58px)!important;display:grid!important;grid-template-columns:minmax(320px,440px) minmax(0,1fr)!important;gap:clamp(34px,6vw,78px)!important;align-items:center!important;padding:clamp(28px,5vw,58px) max(24px,calc((100vw - 1180px)/2))!important;background-size:cover!important;background-position:center!important;}
#pg-login .login-box{width:100%!important;max-width:440px!important;}
@media(max-width:1099px){
  .topbar{height:64px!important;display:grid!important;grid-template-columns:48px 1fr 48px!important;padding-left:14px!important;padding-right:14px!important;gap:8px!important;}
  .top-left{grid-column:2!important;justify-content:center!important;min-width:0!important;}
  .t-logo{font-size:1.2rem!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
  .t-right{grid-column:3!important;justify-content:flex-end!important;gap:0!important;}
  .mobile-menu-btn{display:flex!important;grid-column:1!important;grid-row:1!important;justify-self:start!important;width:44px!important;height:44px!important;border:0!important;background:transparent!important;color:#fff!important;font-size:1.65rem!important;align-items:center!important;justify-content:center!important;}
  .mobile-quick-btn{display:flex!important;width:44px!important;height:44px!important;border:0!important;background:transparent!important;color:#fff!important;font-size:1.45rem!important;align-items:center!important;justify-content:center!important;}
  .public-nav,.public-actions,.session-badge,#usr-info,#account-btn,#switch-btn,#logout-btn,#mode-btn,.t-lang,.t-theme,.header-back.show{display:none!important;}
  #pg-login.vis{width:calc(100% + 28px)!important;margin:-114px -14px -80px!important;min-height:calc(100dvh - 64px)!important;}
  #pg-login .login-shell{grid-template-columns:minmax(320px,460px)!important;justify-content:center!important;align-content:center!important;min-height:calc(100dvh - 64px)!important;padding:36px 22px 70px!important;background-position:center!important;}
  #pg-login .login-shell::before{background:rgba(5,20,39,.62)!important;}
  #pg-login .login-box{width:100%!important;max-width:460px!important;}
  #pg-login .login-hero-copy{display:none!important;}
  .mobile-drawer{position:fixed!important;top:64px!important;left:0!important;right:0!important;bottom:0!important;z-index:950!important;display:none;background:#0B2545!important;color:#fff!important;overflow:auto!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:0 0 calc(18px + env(safe-area-inset-bottom))!important;}
  .mobile-drawer.open{display:block!important;}
  .mobile-menu-head{background:#123B68;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.08);}
  .mobile-menu-welcome{font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8FC1FF;margin-bottom:3px;}
  .mobile-menu-name{font-size:1.42rem;font-weight:800;letter-spacing:-.02em;}
  .mobile-menu-status{text-align:right;font-size:.68rem;color:rgba(255,255,255,.72);font-weight:750;line-height:1.35;}
  .mobile-menu-status strong{display:block;color:#fff;font-size:1.05rem;}
  .mobile-menu-section{background:#08203B;padding:9px 22px;font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8FC1FF;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);}
  .mobile-menu-list{display:grid;}
  .mobile-menu-item{width:100%;min-height:68px;border:0!important;border-bottom:1px solid rgba(255,255,255,.09)!important;background:#0E335B!important;color:#fff!important;padding:0 22px!important;font:inherit!important;text-align:left!important;display:flex!important;align-items:center!important;gap:17px!important;font-size:1.08rem!important;font-weight:650!important;border-radius:0!important;}
  .mobile-menu-item:nth-child(even){background:#103A67!important;}
  .mobile-menu-item .mi-icon{width:28px;text-align:center;font-size:1.25rem;opacity:.96;}
  .mobile-menu-item .mi-copy{display:flex;flex-direction:column;gap:2px;line-height:1.2;}
  .mobile-menu-item small{font-size:.68rem;color:rgba(255,255,255,.64);font-weight:650;}
  .mobile-menu-item.danger{font-weight:800;background:#0B2545!important;}
  .mobile-menu-item .mi-arrow{margin-left:auto;font-size:1.35rem;color:rgba(255,255,255,.7);}
}
@media(min-width:1100px){
  .mobile-menu-btn,.mobile-quick-btn,.mobile-drawer{display:none!important;}
}
</style>
<script id="ruedard-layout-fix-js">
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  ready(function(){
    var topbar=document.querySelector('.topbar'), right=document.querySelector('.t-right'), drawer=document.getElementById('mobile-drawer');
    if(topbar){
      var menu=document.querySelector('.mobile-menu-btn');
      if(menu&&menu.parentElement!==topbar)topbar.insertBefore(menu,topbar.firstChild);
      if(right&&!document.querySelector('.mobile-quick-btn')){
        var quick=document.createElement('button');
        quick.className='mobile-quick-btn'; quick.type='button'; quick.setAttribute('aria-label','Cuenta'); quick.innerHTML='&#x260E;';
        quick.onclick=function(){window.mobileQuickAction?window.mobileQuickAction():(window.openPublicLogin&&window.openPublicLogin());};
        right.appendChild(quick);
      }
    }
    if(drawer){
      drawer.innerHTML='<div class="mobile-menu-head"><div><div class="mobile-menu-welcome" id="mobile-menu-welcome">Welcome</div><div class="mobile-menu-name" id="mobile-menu-name">RuedaRD</div></div><div class="mobile-menu-status"><span id="mobile-menu-role">Guest</span><strong id="mobile-menu-points">Start</strong></div></div><div class="mobile-menu-section">Reservation</div><div class="mobile-menu-list"><button class="mobile-menu-item" id="mobile-back-row" onclick="mobileAction(\'back\')" style="display:none"><span class="mi-icon">←</span><span class="mi-copy">Back<small>Return to previous step</small></span><span class="mi-arrow">›</span></button><button class="mobile-menu-item" onclick="mobileAction(\'find\')"><span class="mi-icon">🚗</span><span class="mi-copy">Start reservation<small>Dates, car, protection and payment</small></span><span class="mi-arrow">›</span></button><button class="mobile-menu-item" onclick="mobileAction(\'account\')"><span class="mi-icon">👤</span><span class="mi-copy">My account<small>Receipts, contracts and profile</small></span><span class="mi-arrow">›</span></button></div><div class="mobile-menu-section">Owners</div><div class="mobile-menu-list"><button class="mobile-menu-item" onclick="mobileAction(\'publish\')"><span class="mi-icon">🔑</span><span class="mi-copy">List my car<small>Individual partner or rent car company</small></span><span class="mi-arrow">›</span></button><button class="mobile-menu-item" onclick="mobileAction(\'switch\')"><span class="mi-icon">⇄</span><span class="mi-copy">Switch profile<small>Renter, owner or company panel</small></span><span class="mi-arrow">›</span></button></div><div class="mobile-menu-section">Tools</div><div class="mobile-menu-list"><button class="mobile-menu-item" onclick="mobileAction(\'lang\')" id="drawer-lang"><span class="mi-icon">🌐</span><span class="mi-copy">Language<small>English / Español</small></span><span class="mi-arrow">›</span></button><button class="mobile-menu-item" onclick="mobileAction(\'theme\')"><span class="mi-icon">☀️</span><span class="mi-copy">Display mode<small>Light or dark view</small></span><span class="mi-arrow">›</span></button><button class="mobile-menu-item danger" onclick="mobileAction(\'logout\')"><span class="mi-icon">⎋</span><span class="mi-copy">Sign out<small>Close this demo session</small></span><span class="mi-arrow">›</span></button></div>';
    }
    window.renderMobileChrome=function(){
      var user=window.S&&S.user?S.user:null, roleName=user&&user.role==='fleet'?'Company':user&&user.role==='owner'?'Owner':user?'Renter':'Guest';
      var name=document.getElementById('mobile-menu-name'),role=document.getElementById('mobile-menu-role'),points=document.getElementById('mobile-menu-points'),quick=document.querySelector('.mobile-quick-btn');
      if(name)name.textContent=user?(user.name||'RuedaRD').split(' ')[0]:'RuedaRD';
      if(role)role.textContent=roleName;
      if(points)points.textContent=user?'Verified':'Start';
      if(quick){quick.innerHTML=user?(user.init||'JP'):'&#x260E;';quick.style.fontSize=user?'1rem':'1.45rem';}
    };
    window.closeMobileMenu=function(){var d=document.getElementById('mobile-drawer');if(d)d.className='mobile-drawer';var b=document.querySelector('.mobile-menu-btn');if(b)b.textContent='☰';};
    window.toggleMobileMenu=function(){var d=document.getElementById('mobile-drawer');if(!d)return;renderMobileChrome();var open=d.className.indexOf(' open')>-1;d.className=open?'mobile-drawer':'mobile-drawer open';var b=document.querySelector('.mobile-menu-btn');if(b)b.textContent=open?'☰':'×';};
    window.mobileQuickAction=function(){if(window.S&&S.user&&window.showAccount)showAccount();else if(window.openPublicLogin)openPublicLogin();};
    window.mobileAction=function(action){
      closeMobileMenu();
      if(action==='back'){if(window.appBack)appBack();return;}
      if(action==='account'){if(window.S&&S.user&&window.showAccount)showAccount();else if(window.openPublicLogin)openPublicLogin();return;}
      if(action==='switch'){if(window.S&&S.user&&window.showProfileSwitcher)showProfileSwitcher();else if(window.openPublicSignup)openPublicSignup('r');return;}
      if(action==='find'){if(window.S&&S.user&&window.showPage)showPage(1);else if(window.goPublicSection)goPublicSection('featured');return;}
      if(action==='publish'){if(window.S&&S.user&&window.showOwner)showOwner();else if(window.openPublicSignup)openPublicSignup('o');return;}
      if(action==='lang'&&window.toggleLanguage){toggleLanguage();return;}
      if(action==='theme'&&window.toggleTheme){toggleTheme();return;}
      if(action==='logout'&&window.logout){logout();return;}
    };
    var oldBack=window.updateBackButton;
    window.updateBackButton=function(show){if(oldBack)oldBack(show);var mb=document.getElementById('mobile-back-row');if(mb)mb.style.display=show?'flex':'none';};
    renderMobileChrome();
  });
})();
</script>`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function fixedHtml(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  html = html.replace(/<style id="ruedard-layout-fix">[\s\S]*?<\/script>/, '');
  html = html.replace(/<style id="ruedard-mobile-patch">[\s\S]*?<\/script>/, '');
  html = html.replace('</body>', LAYOUT_FIX + '</body>');
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => fixedHtml(response))
        .catch(() => caches.match('./index.html').then((cached) => cached ? fixedHtml(cached) : Response.error()))
    );
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
