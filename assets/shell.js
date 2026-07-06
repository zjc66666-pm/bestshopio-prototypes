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
  var V = '20260706af'; // cache-bust for lazy-loaded module scripts
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
    facebook: s('<path d="M4 12c0-2.5 2-4.5 4.5-4.5 2 0 3 1.5 3.5 3 .5-1.5 1.5-3 3.5-3 2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5c-2 0-3-1.5-3.5-3-.5 1.5-1.5 3-3.5 3-2.5 0-4.5-2-4.5-4.5z"/>'),
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
    user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    x: s('<path d="M18 6 6 18M6 6l12 12"/>'),
    collections: s('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    reviews: s('<path d="m12 3 2.9 6 6.1.9-4.5 4.3 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.9 9 9z"/>'),
    page: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h6"/>'),
    apps: s('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>'),
    refresh: s('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v5h-5"/>'),
    box: s('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
  };
  window.ICONS = ICONS;

  var MENU = window.NAV_MENU || [];
  var SETTINGS = window.NAV_SETTINGS || [];
  var ROUTE_MODULE = window.ROUTE_MODULE || {};
  var SITE = window.SITE || { store: 'Store' };
  var STORES = window.STORES || [];
  // The SSO stores panel enters a store via index.html?store=<name>; reflect it in the chrome.
  var isNewStore = false;
  try {
    var qsStore = new URLSearchParams(location.search).get('store');
    if (qsStore) SITE.store = qsStore;
    // V1.139: provisioning sends merchants here with ?new=1 so Home shows the Setup guide.
    isNewStore = new URLSearchParams(location.search).get('new') === '1';
  } catch (e) {}
  var setupDismissed = false;
  window.VIEWS = window.VIEWS || {};

  var navEl, footEl, settingsBar, root, current = null, loaded = {}, curActiveId = 'home';

  // Sidebar menu source: prefer nav.js buildMenu() (adds enabled pluggable apps), else static MENU.
  function getMenu() { return (typeof window.buildMenu === 'function') ? window.buildMenu() : MENU; }

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
        '<a class="nav-item nav-parent' + (it.id === activeId ? ' active' : '') + '" href="' + it.route + '">' + icon + '<span>' + it.label + '</span></a>' +
        '<div class="nav-subs' + (open ? '' : ' collapsed') + '">' + subs + '</div>' +
      '</div>';
    }
    return '<a class="nav-item' + (it.id === activeId ? ' active' : '') + '" href="' + it.route + '">' + icon + '<span>' + it.label + '</span></a>';
  }

  function renderSidebar(activeId) {
    // Entries with `_group` are section dividers (nav.js buildMenu returns
    // a flat list with these sentinels). Render them as <div class="nav-group-label">.
    navEl.innerHTML = getMenu().map(function (it) {
      if (it && it._group) return '<div class="nav-group-label">' + it._group + '</div>';
      return itemHtml(it, activeId);
    }).join('');
    footEl.innerHTML = '<a class="nav-item' + (activeId === 'settings' ? ' active' : '') + '" href="#/settings/base">' + ICONS.settings + '<span>Settings</span></a>';
  }

  // ---------- full-screen Settings modal (matches the live admin) ----------
  var settingsModal = null;
  function settingsNavItem(it, sub) {
    var icon = ICONS[it.icon] || '';
    if (it.children) {
      var childActive = it.children.some(function (c) { return c.id === sub; });
      var subs = it.children.map(function (c) { return '<a class="settings-sub' + (c.id === sub ? ' active' : '') + '" href="' + c.route + '">' + c.label + '</a>'; }).join('');
      return '<div class="settings-group"><a class="settings-nav-item' + (childActive ? ' active-parent' : '') + '" href="' + it.route + '">' + icon + '<span>' + it.label + '</span></a><div class="settings-subs">' + subs + '</div></div>';
    }
    return '<a class="settings-nav-item' + (it.id === sub ? ' active' : '') + '" href="' + it.route + '">' + icon + '<span>' + it.label + '</span></a>';
  }
  function renderSettings(p) {
    var sub = p.rest.split('/')[0] || 'base';
    if (!settingsModal) {
      settingsModal = document.createElement('div');
      settingsModal.className = 'settings-modal';
      settingsModal.innerHTML =
        '<header class="settings-modal-head"></header>' +
        '<div class="settings-modal-body"><nav class="settings-nav scroll-thin"></nav><div class="settings-content scroll-thin" id="settings-content"></div></div>';
      document.body.appendChild(settingsModal);
    }
    // header bar: "Settings ✕" when clean; dark "You have unsaved changes / Discard / Update" when dirty (mirrors live admin)
    var head = settingsModal.querySelector('.settings-modal-head');
    var handlers = {};
    var info = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>';
    function renderSettingsHead(dirty) {
      head.classList.toggle('dirty', !!dirty);
      if (dirty) {
        head.innerHTML =
          '<div class="settings-head-sp"></div>' +
          '<div class="settings-unsaved">' + info + '<span>You have unsaved changes</span></div>' +
          '<div class="settings-unsaved-actions"><button class="btn settings-discard" data-st-discard>Discard</button><button class="btn btn-primary" data-st-update>Update</button></div>';
        head.querySelector('[data-st-discard]').onclick = function () { if (handlers.onDiscard) handlers.onDiscard(); };
        head.querySelector('[data-st-update]').onclick = function () { if (handlers.onUpdate) handlers.onUpdate(); };
      } else {
        head.innerHTML = '<span class="settings-modal-title">Settings</span><a class="settings-modal-x" href="#/orders" title="Close">' + ICONS.x + '</a>';
      }
    }
    renderSettingsHead(false);
    window.SettingsChrome = { setDirty: function (dirty, h) { if (h) handlers = h; renderSettingsHead(dirty); } };
    settingsModal.querySelector('.settings-nav').innerHTML = SETTINGS.map(function (it) { return settingsNavItem(it, sub); }).join('');
    var contentEl = settingsModal.querySelector('#settings-content');
    contentEl.innerHTML = '<div class="placeholder">Loading…</div>';
    loadModule('settings').then(function () {
      if (!parse().settings) return;
      var v = window.VIEWS.settings;
      if (v && v.render) v.render(contentEl, p.rest);
      if (window.UI) window.UI.scan(contentEl); // enhance settings selects right after render
      contentEl.scrollTop = 0;
    });
  }
  function removeSettings() { if (settingsModal) { settingsModal.remove(); settingsModal = null; window.SettingsChrome = null; } }

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

  // ---------- Setup guide (V1.139) — store-onboarding card on Home ----------
  // Shown when a merchant enters a freshly-provisioned store (?new=1). Tasks bind
  // to the activation milestones (D1 product / D3 payments / D7 go-live). PRD §7.4.
  var SETUP_STYLES =
    '.sg-card{padding:0;overflow:hidden;margin-bottom:22px;border:1px solid var(--hair)}' +
    '.sg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 22px 12px}' +
    '.sg-h1{font-size:17px;font-weight:700;color:var(--ink)}' +
    '.sg-meta{font-size:12.5px;color:var(--ink-muted);margin-top:4px}' +
    '.sg-x{border:0;background:none;color:var(--ink-muted);cursor:pointer;display:inline-flex;padding:4px;border-radius:6px}' +
    '.sg-x:hover{background:var(--panel);color:var(--ink)}.sg-x svg{width:18px;height:18px}' +
    '.sg-bar{height:7px;margin:0 22px 6px;background:var(--panel);border-radius:999px;overflow:hidden}' +
    '.sg-bar i{display:block;height:100%;background:var(--brand);border-radius:999px}' +
    '.sg-task{display:flex;align-items:center;gap:14px;padding:14px 22px;border-top:1px solid var(--hair)}' +
    '.sg-tc{width:24px;height:24px;border-radius:50%;border:2px solid var(--ctl);flex:none;display:inline-flex;align-items:center;justify-content:center;color:transparent}' +
    '.sg-tc.done{background:#2bb673;border-color:#2bb673;color:#fff}.sg-tc svg{width:13px;height:13px}' +
    '.sg-tt{flex:1;min-width:0}.sg-tname{font-size:14px;font-weight:600;color:var(--ink)}' +
    '.sg-task.done .sg-tname{color:var(--ink-muted);text-decoration:line-through}' +
    '.sg-tdesc{font-size:12.5px;color:var(--ink-muted);margin-top:2px}' +
    '.sg-opt{font-size:11px;color:var(--ink-muted);font-weight:600;border:1px solid var(--hair);border-radius:4px;padding:1px 6px;margin-left:4px}' +
    '.sg-cta{height:32px;padding:0 14px;font-size:13px}';
  function setupGuideHtml() {
    var tasks = [
      // 'Choose a theme' removed in V1.139 review (theme selection deferred — see PRD §10 follow-up).
      // A default starter theme is still auto-applied at provisioning; merchants customize it via Online store › Theme.
      { done: true,  title: 'Add your first product',  desc: 'List a product so customers have something to buy.',     route: '#/products',         cta: 'Add' },
      { done: false, title: 'Set up payments',         desc: 'Connect Airwallex, Stripe or PayPal to get paid.',       route: '#/settings/payments', cta: 'Start' },
      { done: false, title: 'Connect your domain',     desc: 'Use your own domain instead of the free one.',           route: '#/settings/domains', cta: 'Start', opt: true },
      { done: false, title: 'Preview & go live',       desc: 'Review your store and open it to customers.',            route: '#/online-store',     cta: 'Start' },
    ];
    var doneN = tasks.filter(function (t) { return t.done; }).length;
    var pct = Math.round(doneN / tasks.length * 100);
    var rows = tasks.map(function (t) {
      var check = '<span class="sg-tc' + (t.done ? ' done' : '') + '">' + (t.done ? MICO.check : '') + '</span>';
      var cta = t.done ? '' : '<a class="btn btn-primary sg-cta" href="' + t.route + '">' + t.cta + '</a>';
      var opt = t.opt ? ' <span class="sg-opt">Optional</span>' : '';
      return '<div class="sg-task' + (t.done ? ' done' : '') + '">' + check +
        '<div class="sg-tt"><div class="sg-tname">' + t.title + opt + '</div><div class="sg-tdesc">' + t.desc + '</div></div>' + cta + '</div>';
    }).join('');
    return '<div class="sg-card panel"><style>' + SETUP_STYLES + '</style>' +
      '<div class="sg-head"><div><div class="sg-h1">Set up your store</div>' +
        '<div class="sg-meta">' + doneN + ' of ' + tasks.length + ' tasks done · ' + pct + '%</div></div>' +
        '<button class="sg-x" data-sg-dismiss title="Hide">' + ICONS.x + '</button></div>' +
      '<div class="sg-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="sg-tasks">' + rows + '</div>' +
    '</div>';
  }
  function wireSetupGuide() {
    var x = root.querySelector('[data-sg-dismiss]');
    if (x) x.onclick = function () { setupDismissed = true; var c = root.querySelector('.sg-card'); if (c) c.remove(); };
  }

  // ---------- Home hub view ----------
  function renderHome() {
    var CL = window.CHANGELOG || [];
    var cards = [];
    getMenu().forEach(function (m) {
      cards.push(m);
      // Only sub-items that carry their own desc are real Home cards (Collections, Blog…).
      // Workspace children (Analytics / Subscriptions) have no desc and can duplicate a
      // top-level label — skip them so Home stays one clean card per module.
      (m.children || []).forEach(function (c) { if (c.desc) cards.push(c); });
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
      getMenu().forEach(function (m) { if (m.id === id) found = m; (m.children || []).forEach(function (c) { if (c.id === id) found = c; }); });
      return found;
    };
    var clHtml = CL.map(function (e, i) {
      var mods = (e.modules || []).map(function (id) { var m = resolve(id); return m ? '<a class="cl-mod" href="' + m.route + '">' + m.label + '</a>' : id; }).join(' · ');
      var lis = (e.items || []).map(function (t) { return '<li class="cl-li">' + ICONS.tag + '<span>' + t + '</span></li>'; }).join('');
      return '<div class="cl-item"><div class="cl-rail"><div class="cl-dot"></div>' + (i === CL.length - 1 ? '' : '<div class="cl-line"></div>') + '</div>' +
        '<div class="cl-body"><div class="cl-head"><span class="cl-ver">' + e.version + '</span><span class="cl-date">' + (e.date || '') + '</span></div>' +
        '<div class="cl-title">' + e.title + (mods ? ' &mdash; ' + mods : '') + '</div><ul class="cl-list">' + lis + '</ul></div></div>';
    }).join('');
    var setupHtml = (isNewStore && !setupDismissed) ? setupGuideHtml() : '';
    root.innerHTML =
      '<div class="view-wrap">' +
        setupHtml +
        '<div class="hub-hero"><div class="hub-h1">' + (SITE.brand || 'BestShopio') + ' &mdash; Admin prototype</div>' +
        '<div class="hub-sub">One living set of merchant-admin prototypes, mirroring the live admin. Pick a module, or see what changed below.</div></div>' +
        '<div class="builder hub-cols" style="gap:24px"><div class="builder-main"><div class="mod-grid">' + cardHtml + '</div></div>' +
        '<div class="builder-side"><div class="panel card-pad"><div class="card-title" style="margin-bottom:14px">What changed</div><div class="cl">' + clHtml + '</div></div></div></div>' +
      '</div>';
    if (setupHtml) wireSetupGuide();
  }

  // ---------- router ----------
  function dispatch() {
    var p = parse();
    if (p.settings) { renderSettings(p); return; }   // settings = full-screen modal overlay
    removeSettings();
    var moduleId = ROUTE_MODULE[p.first] || p.first;
    var activeId = p.first;
    if (p.first === 'analytics') { var asub = p.rest.split('/')[0]; activeId = asub ? 'analytics-' + asub : 'analytics'; }
    if (p.first === 'subscriptions') { var ssub = p.rest.split('/')[0]; activeId = ssub ? 'subscriptions-' + ssub : 'subscriptions'; }
    if (p.first === 'bestcheckout') { var bsub = p.rest.split('/')[0]; activeId = bsub ? 'bestcheckout-' + bsub : 'bestcheckout'; }
    curActiveId = activeId;
    renderSidebar(activeId);
    if (current && current !== moduleId && window.VIEWS[current] && window.VIEWS[current].unmount) {
      try { window.VIEWS[current].unmount(); } catch (e) {}
    }
    if (moduleId === 'home') { renderHome(); current = 'home'; root.scrollTop = 0; return; }
    root.innerHTML = '<div class="view-wrap"><div class="placeholder">Loading…</div></div>';
    loadModule(moduleId).then(function () {
      if (parse().first !== p.first || parse().settings) return; // route changed while loading
      var v = window.VIEWS[moduleId];
      if (!v || !v.render) { root.innerHTML = '<div class="view-wrap"><div class="placeholder">Module “' + moduleId + '” not found.</div></div>'; return; }
      v.render(root, p.rest);
      if (window.UI) window.UI.scan(root); // enhance selects/date-pickers right after render (no observer-timing dependency)
      current = moduleId;
      root.scrollTop = 0;
    }).catch(function () {
      root.innerHTML = '<div class="view-wrap"><div class="placeholder">Failed to load “' + moduleId + '”.</div></div>';
    });
  }

  // ---------- header dropdowns: store switcher + account menu (V1.129 SSO) ----------
  var MICO = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
  };
  function closeHdrMenus() {
    var open = document.querySelectorAll('.hdr-menu');
    open.forEach(function (m) { m.remove(); });
    document.removeEventListener('mousedown', onDocClickHdr, true);
  }
  function onDocClickHdr(e) { if (!(e.target.closest && e.target.closest('.hdr-menu-wrap'))) closeHdrMenus(); }
  function toggleHdrMenu(wrap, html, onMount) {
    var already = wrap.querySelector('.hdr-menu');
    closeHdrMenus();
    if (already) return;
    var panel = document.createElement('div');
    panel.className = 'hdr-menu';
    panel.innerHTML = html;
    wrap.appendChild(panel);
    if (onMount) onMount(panel);
    setTimeout(function () { document.addEventListener('mousedown', onDocClickHdr, true); }, 0);
  }
  function storeSwitcherHtml() {
    var rows = STORES.map(function (st) {
      var cur = st.name === SITE.store;
      return '<button class="hdr-store-row' + (cur ? ' current' : '') + '" data-store="' + st.name + '">' +
        '<span class="hdr-store-ico"></span>' +
        '<span class="hdr-store-meta"><span class="hdr-store-name">' + st.name + '</span><span class="hdr-store-url">' + st.url + '</span></span>' +
        (cur ? '<span class="hdr-store-check">' + MICO.check + '</span>' : '') +
      '</button>';
    }).join('');
    return '<div class="hdr-store-list">' + rows + '</div>' +
      '<a class="hdr-menu-foot" href="account/stores.html">View all stores</a>';
  }
  function userMenuHtml() {
    return '<div class="hdr-menu-head">' + MICO.user + '<span>' + (SITE.email || 'owner@bestshopio.com') + '</span></div>' +
      '<div class="hdr-menu-divider"></div>' +
      '<button class="hdr-menu-item" data-changepw>' + MICO.lock + 'Change password</button>' +
      '<a class="hdr-menu-item" href="account/signin.html">' + MICO.out + 'Sign out</a>';
  }
  // Change password — shell-level dialog (PRD 7.3 store-admin top bar)
  function openChangePassword() {
    var bd = document.createElement('div');
    bd.className = 'sh-modal-bd';
    var fld = function (label, id, ph) {
      return '<div class="sh-fld"><label class="sh-fld-label">' + label + '</label>' +
        '<input id="' + id + '" class="sh-fld-input" type="password" placeholder="' + ph + '" />' +
        '<div class="sh-fld-error" data-err="' + id + '"></div></div>';
    };
    bd.innerHTML = '<div class="sh-modal">' +
      '<div class="sh-modal-head"><span>Change password</span><button data-x>' + ICONS.x + '</button></div>' +
      '<div class="sh-modal-body">' +
        fld('Current password', 'cp-cur', 'Enter current password') +
        fld('New password', 'cp-new', 'Enter new password') +
        fld('Confirm new password', 'cp-cf', 'Re-enter new password') +
      '</div>' +
      '<div class="sh-modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-primary" data-done>Done</button></div>' +
    '</div>';
    document.body.appendChild(bd);
    var close = function () { bd.remove(); };
    bd.addEventListener('mousedown', function (e) { if (e.target === bd) close(); });
    bd.querySelector('[data-x]').onclick = close;
    bd.querySelector('[data-cancel]').onclick = close;
    var setErr = function (id, msg) {
      var el = bd.querySelector('[data-err="' + id + '"]'); var inp = bd.querySelector('#' + id);
      if (el) el.textContent = msg || ''; if (inp) inp.classList.toggle('has-error', !!msg);
    };
    bd.querySelector('[data-done]').onclick = function () {
      var cur = bd.querySelector('#cp-cur').value, nw = bd.querySelector('#cp-new').value, cf = bd.querySelector('#cp-cf').value;
      var ok = true;
      setErr('cp-cur', ''); setErr('cp-new', ''); setErr('cp-cf', '');
      if (!cur) { setErr('cp-cur', 'Please enter current password'); ok = false; }
      if (!nw) { setErr('cp-new', 'Please enter new password'); ok = false; }
      else if (nw.length < 8) { setErr('cp-new', '8 characters minimum'); ok = false; }
      if (cf !== nw) { setErr('cp-cf', 'Passwords do not match.'); ok = false; }
      if (!ok) return;
      close();
      shellToast('Change password successfully');
    };
  }
  // small bottom toast for shell-level actions (settings module has its own)
  function shellToast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#eafaf1;color:#1f8f4e;border:1px solid #cdeedb;padding:10px 16px;border-radius:8px;font-size:13.5px;font-weight:500;z-index:200;box-shadow:0 8px 24px rgba(20,40,28,.14)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2000);
  }
  function wireHeader(app) {
    var storeBtn = app.querySelector('#hdr-store');
    var userBtn = app.querySelector('#hdr-user');
    if (storeBtn) storeBtn.onclick = function (e) {
      e.stopPropagation();
      toggleHdrMenu(storeBtn.parentNode, storeSwitcherHtml(), function (panel) {
        panel.querySelectorAll('[data-store]').forEach(function (row) {
          row.onclick = function () {
            var name = row.getAttribute('data-store');
            closeHdrMenus();
            if (name === SITE.store) return;
            // PRD 7.3: open the chosen store admin in a new tab
            window.open('index.html?store=' + encodeURIComponent(name), '_blank', 'noopener');
          };
        });
      });
    };
    if (userBtn) userBtn.onclick = function (e) {
      e.stopPropagation();
      toggleHdrMenu(userBtn.parentNode, userMenuHtml(), function (panel) {
        var cp = panel.querySelector('[data-changepw]');
        if (cp) cp.onclick = function () { closeHdrMenus(); openChangePassword(); };
      });
    };
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
        '<div class="hdr-right">' +
          '<div class="hdr-menu-wrap"><button class="hdr-store" id="hdr-store">' + (SITE.store || 'Store') + ICONS.chevDown + '</button></div>' +
          '<div class="hdr-menu-wrap"><button class="hdr-user" id="hdr-user" aria-label="Account">' + ICONS.user + '</button></div>' +
        '</div>' +
      '</header>' +
      '<div class="app-body">' +
        '<aside class="app-sidebar scroll-thin">' +
          '<nav class="nav-scroll scroll-thin"></nav>' +
          '<div class="nav-footer"></div>' +
        '</aside>' +
        '<div class="content-col flex-1 flex flex-col min-w-0"><main id="view" class="shell-view flex-1 overflow-auto scroll-thin"><div id="root"></div></main></div>' +
      '</div>';

    navEl = app.querySelector('.nav-scroll');
    footEl = app.querySelector('.nav-footer');
    root = document.getElementById('root');
    wireHeader(app);

    // mobile drawer
    var backdrop = document.createElement('div'); backdrop.className = 'sidebar-backdrop'; document.body.appendChild(backdrop);
    var aside = app.querySelector('.app-sidebar');
    var toggle = app.querySelector('.sidebar-toggle');
    var closeDrawer = function () { aside.classList.remove('open'); backdrop.classList.remove('show'); };
    if (toggle) toggle.addEventListener('click', function () { aside.classList.toggle('open'); backdrop.classList.toggle('show'); });
    backdrop.addEventListener('click', closeDrawer);
    app.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#/"]')) closeDrawer(); });

    // Pluggable-app toggles (Apps page) call this to re-render the sidebar in place.
    window.Shell = { refresh: function () { if (navEl) renderSidebar(curActiveId); } };
    if (!location.hash) location.replace('#/home');
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
