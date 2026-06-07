/* BestShopio prototypes — SPA shell + hash router (single persistent chrome).
   Mounted once from index.html into #app. Renders the top header (logo) + a
   persistent sidebar (the real bestvoy-admin menu), and routes by hash WITHOUT
   page reloads — module views are lazy-loaded and mounted into #root.

   A module registers itself as:
     window.VIEWS['orders'] = { render: function(rootEl, rest){...}, unmount: function(){} }
   where `rest` is the part of the hash after the module id (e.g. '5042' for
   #/orders/5042, or 'base' for #/settings/base). Internal navigation just sets
   location.hash; the router re-dispatches. */
(function () {
  var V = '20260607b'; // cache-bust for lazy-loaded module scripts
  var s = function (p) { return '<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
  var ICONS = {
    home: s('<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/>'),
    inbox: s('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
    tag: s('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    userPen: s('<path d="M2 21a8 8 0 0 1 10.4-7.6"/><circle cx="10" cy="8" r="5"/><path d="M21.4 12.6a2 2 0 0 1 0 2.8L17 19.8 14 20l.2-3 4.4-4.4a2 2 0 0 1 2.8 0z"/>'),
    badgePercent: s('<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6"/><path d="M9 9h.01"/><path d="M15 15h.01"/>'),
    newspaper: s('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M16 6h-6v4h6z"/><path d="M16 14h-6M13 18h-3"/>'),
    globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18"/>'),
    analytics: s('<path d="M4 4v16h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>'),
    google: s('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    settings: s('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.3-1.3L14 1h-4l-.3 2.5a7 7 0 0 0-2.3 1.3l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.3l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.3 1.3L10 23h4l.3-2.5a7 7 0 0 0 2.3-1.3l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/>'),
    card: s('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    coin: s('<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2A2.5 2 0 0 1 9.5 16"/><path d="M12 6v12"/>'),
    cart: s('<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/>'),
    code: s('<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'),
    pin: s('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
    search: s('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    bell: s('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
    chevDown: s('<path d="m6 9 6 6 6-6"/>'),
    caret: s('<path d="m9 18 6-6-6-6"/>'),
    menu: s('<path d="M3 6h18M3 12h18M3 18h18"/>'),
    x: s('<path d="M18 6 6 18M6 6l12 12"/>'),
    collections: s('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    vendors: s('<path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>'),
    reviews: s('<path d="m12 3 2.9 6 6.1.9-4.5 4.3 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.9 9 9z"/>'),
    page: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h6"/>'),
  };
  window.ICONS = ICONS;

  var MENU = window.NAV_MENU || [];
  var SETTINGS = window.NAV_SETTINGS || [];
  var ROUTE_MODULE = window.ROUTE_MODULE || {};
  var SITE = window.SITE || { store: 'Store' };
  window.VIEWS = window.VIEWS || {};

  var navEl, footEl, settingsBar, root, current = null, loaded = {};

  // ---------- route parsing ----------
  function parse() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    var first = parts[0] || 'home';
    return { first: first, rest: parts.slice(1).join('/'), settings: first === 'settings' };
  }

  // ---------- sidebar ----------
  function itemHtml(it, activeId) {
    var icon = it.icon ? (ICONS[it.icon] || '') : '';
    if (it.children) {
      var childActive = it.children.some(function (c) { return c.id === activeId; });
      var open = childActive || it.id === activeId;
      var subs = it.children.map(function (c) {
        return '<a class="nav-sub' + (c.id === activeId ? ' active' : '') + '" href="' + c.route + '">' + c.label + '</a>';
      }).join('');
      return '<div class="nav-group">' +
        '<a class="nav-item nav-parent' + (it.id === activeId ? ' active' : '') + '" href="' + it.route + '">' + icon + '<span>' + it.label + '</span>' +
          '<span class="nav-caret' + (open ? ' open' : '') + '">' + ICONS.caret + '</span></a>' +
        '<div class="nav-subs' + (open ? '' : ' collapsed') + '">' + subs + '</div>' +
      '</div>';
    }
    return '<a class="nav-item' + (it.id === activeId ? ' active' : '') + '" href="' + it.route + '">' + icon + '<span>' + it.label + '</span></a>';
  }

  function renderSidebar(ctx, activeId) {
    var items = ctx.settings ? SETTINGS : MENU;
    navEl.innerHTML = items.map(function (it) { return itemHtml(it, activeId); }).join('');
    footEl.innerHTML = ctx.settings ? '' : '<a class="nav-item" href="#/settings/base">' + ICONS.settings + '<span>Settings</span></a>';
  }

  // ---------- lazy module loader ----------
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = src; sc.onload = res; sc.onerror = function () { rej(new Error('load ' + src)); };
      document.body.appendChild(sc);
    });
  }
  function loadModule(id) {
    if (loaded[id]) return loaded[id];
    var chain = loadScript(id + '/js/icons.js?v=' + V).catch(function () {});            // optional (analytics)
    chain = chain.then(function () { return loadScript(id + '/js/data.js?v=' + V); }).catch(function () {}); // optional
    chain = chain.then(function () { return loadScript(id + '/js/app.js?v=' + V); });    // required
    loaded[id] = chain;
    return loaded[id];
  }

  // ---------- Home hub view ----------
  function renderHome() {
    var CL = window.CHANGELOG || [];
    var cards = [];
    MENU.forEach(function (m) {
      cards.push(m);
      (m.children || []).forEach(function (c) { cards.push(c); });
    });
    var cardHtml = cards.map(function (m) {
      var icon = ICONS[m.icon] || ICONS.tag;
      return '<a class="mod-card" href="' + m.route + '">' +
        '<div class="mod-ico">' + icon + '</div>' +
        '<div class="mod-body"><div class="mod-name">' + m.label + '</div>' +
        '<div class="mod-desc">' + (m.desc || '') + '</div></div></a>';
    }).join('');
    var resolve = function (id) {
      var found = null;
      MENU.forEach(function (m) { if (m.id === id) found = m; (m.children || []).forEach(function (c) { if (c.id === id) found = c; }); });
      return found;
    };
    var clHtml = CL.map(function (e, i) {
      var mods = (e.modules || []).map(function (id) { var m = resolve(id); return m ? '<a class="cl-mod" href="' + m.route + '">' + m.label + '</a>' : id; }).join(' · ');
      var lis = (e.items || []).map(function (t) { return '<li class="cl-li">' + ICONS.tag + '<span>' + t + '</span></li>'; }).join('');
      return '<div class="cl-item"><div class="cl-rail"><div class="cl-dot"></div>' + (i === CL.length - 1 ? '' : '<div class="cl-line"></div>') + '</div>' +
        '<div class="cl-body"><div class="cl-head"><span class="cl-ver">' + e.version + '</span><span class="cl-date">' + (e.date || '') + '</span></div>' +
        '<div class="cl-title">' + e.title + (mods ? ' &mdash; ' + mods : '') + '</div><ul class="cl-list">' + lis + '</ul></div></div>';
    }).join('');
    root.innerHTML =
      '<div class="view-wrap">' +
        '<div class="hub-hero"><div class="hub-h1">' + (SITE.brand || 'BestShopio') + ' &mdash; Admin prototype</div>' +
        '<div class="hub-sub">One living set of merchant-admin prototypes, mirroring the live admin. Pick a module, or see what changed below.</div></div>' +
        '<div class="builder hub-cols" style="gap:24px"><div class="builder-main"><div class="mod-grid">' + cardHtml + '</div></div>' +
        '<div class="builder-side"><div class="panel card-pad"><div class="card-title" style="margin-bottom:14px">What changed</div><div class="cl">' + clHtml + '</div></div></div></div>' +
      '</div>';
  }

  // ---------- router ----------
  function dispatch() {
    var p = parse();
    var moduleId = ROUTE_MODULE[p.first] || p.first;
    var activeId = p.settings ? (p.rest.split('/')[0] || 'base') : p.first;
    renderSidebar(p, activeId);
    settingsBar.style.display = p.settings ? 'flex' : 'none';
    if (current && current !== moduleId && window.VIEWS[current] && window.VIEWS[current].unmount) {
      try { window.VIEWS[current].unmount(); } catch (e) {}
    }
    if (moduleId === 'home') { renderHome(); current = 'home'; root.scrollTop = 0; return; }
    var token = moduleId;
    root.innerHTML = '<div class="view-wrap"><div class="placeholder">Loading…</div></div>';
    loadModule(moduleId).then(function () {
      if (parse().first !== p.first) return; // route changed while loading
      var v = window.VIEWS[moduleId];
      if (!v || !v.render) { root.innerHTML = '<div class="view-wrap"><div class="placeholder">Module “' + moduleId + '” not found.</div></div>'; return; }
      v.render(root, p.rest);
      current = moduleId;
      root.scrollTop = 0;
    }).catch(function () {
      root.innerHTML = '<div class="view-wrap"><div class="placeholder">Failed to load “' + moduleId + '”.</div></div>';
    });
  }

  // ---------- build persistent chrome ----------
  function build() {
    var app = document.getElementById('app');
    if (!app) return;
    app.classList.add('shell-root');
    app.innerHTML =
      '<header class="app-header">' +
        '<button class="sidebar-toggle" aria-label="Menu">' + ICONS.menu + '</button>' +
        '<a class="hdr-logo" href="#/home" title="Home"><span class="brand-mark">' + String(SITE.store || 'S').charAt(0) + '</span><span class="hdr-logo-name">' + (SITE.store || 'Store') + '</span></a>' +
      '</header>' +
      '<div class="app-body">' +
        '<aside class="app-sidebar scroll-thin">' +
          '<div class="settings-bar" style="display:none"><span>Settings</span><a class="set-close" href="#/orders" title="Close">' + ICONS.x + '</a></div>' +
          '<nav class="nav-scroll scroll-thin"></nav>' +
          '<div class="nav-footer"></div>' +
        '</aside>' +
        '<div class="content-col flex-1 flex flex-col min-w-0"><main id="view" class="shell-view flex-1 overflow-auto scroll-thin"><div id="root"></div></main></div>' +
      '</div>';

    navEl = app.querySelector('.nav-scroll');
    footEl = app.querySelector('.nav-footer');
    settingsBar = app.querySelector('.settings-bar');
    root = document.getElementById('root');

    // mobile drawer
    var backdrop = document.createElement('div'); backdrop.className = 'sidebar-backdrop'; document.body.appendChild(backdrop);
    var aside = app.querySelector('.app-sidebar');
    var toggle = app.querySelector('.sidebar-toggle');
    var closeDrawer = function () { aside.classList.remove('open'); backdrop.classList.remove('show'); };
    if (toggle) toggle.addEventListener('click', function () { aside.classList.toggle('open'); backdrop.classList.toggle('show'); });
    backdrop.addEventListener('click', closeDrawer);
    app.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#/"]')) closeDrawer(); });

    if (!location.hash) location.replace('#/home');
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
