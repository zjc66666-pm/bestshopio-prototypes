/* BestShopio Admin · Apps — pluggable app marketplace (V1.142).
   The home for pluggable apps (系统架构认知 §2.4). Subscriptions is the first one:
   turn it ON and its workspace becomes resident in the sidebar (shell.getMenu()
   reads window.buildMenu()). Registers window.VIEWS.apps for the SPA shell router. */
(function () {
  const APPS = window.PLUGGABLE_APPS || [];
  const DET = (window.DATA_APPS && window.DATA_APPS.details) || {};
  const ICONS = window.ICONS || {};
  let root;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 18),
    check: svg('<path d="M20 6 9 17l-5-5"/>', 15),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 14),
  };

  const STYLES =
    '.app-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:16px}' +
    '.app-card{display:flex;flex-direction:column;padding:18px;cursor:pointer;transition:box-shadow .15s,border-color .15s}' +
    '.app-card:hover{border-color:var(--ctl);box-shadow:var(--float-shadow)}' +
    '.app-card.soon{cursor:default;opacity:.7}.app-card.soon:hover{box-shadow:none;border-color:var(--hair)}' +
    '.app-ico{width:46px;height:46px;border-radius:11px;flex:none;display:grid;place-items:center;background:var(--brand-50);color:var(--brand)}' +
    '.app-ico svg{width:24px;height:24px}' +
    '.app-card-top{display:flex;gap:13px;align-items:flex-start;margin-bottom:12px}' +
    '.app-name{font-size:15px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
    '.app-tag{font-size:12.5px;color:var(--ink-muted);line-height:1.45;margin-top:4px}' +
    '.app-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:16px}' +
    '.app-badge{font-size:10px;font-weight:600;color:var(--ink-muted);border:1px solid var(--hair);border-radius:4px;padding:1px 6px;text-transform:uppercase;letter-spacing:.03em}' +
    '.app-sec-h{font-size:11px;font-weight:600;color:var(--ink-muted);text-transform:uppercase;letter-spacing:.04em;margin:0 0 12px}' +
    '.app-dr-bd{position:fixed;inset:0;background:rgba(20,24,40,.45);z-index:120;display:flex;justify-content:flex-end}' +
    '.app-dr{width:min(440px,94vw);height:100%;background:var(--page);box-shadow:var(--float-shadow);display:flex;flex-direction:column;animation:appDrIn .22s ease}' +
    '@keyframes appDrIn{from{transform:translateX(24px);opacity:.4}to{transform:none;opacity:1}}' +
    '.app-dr-head{display:flex;gap:14px;align-items:flex-start;padding:20px 22px;border-bottom:1px solid var(--hair)}' +
    '.app-dr-body{flex:1;overflow:auto;padding:18px 22px}' +
    '.app-dr-foot{border-top:1px solid var(--hair);padding:14px 22px;display:flex;gap:10px}' +
    '.app-dr-h{font-size:11px;font-weight:600;color:var(--ink-muted);text-transform:uppercase;letter-spacing:.04em;margin:20px 0 8px}' +
    '.app-feat,.app-perm{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--ink-body);line-height:1.5;padding:5px 0;list-style:none}' +
    '.app-feat svg{color:var(--ok);flex:none;margin-top:2px}.app-perm svg{color:var(--ink-muted);flex:none;margin-top:2px}' +
    '.app-ul{margin:0;padding:0}';

  const byId = (id) => APPS.find((a) => a.id === id);
  const isOn = (id) => !!(window.AppState && window.AppState.isEnabled(id));
  const setOn = (id, on) => { if (window.AppState) window.AppState.setEnabled(id, on); };

  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:200;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); };

  function appIcon(app) { return '<span class="app-ico">' + (ICONS[app.icon] || ICONS.apps || '') + '</span>'; }

  function statusPill(app) {
    if (app.status === 'coming_soon') return '<span class="pill pill-gray">Coming soon</span>';
    return isOn(app.id) ? '<span class="pill pill-green">On</span>' : '<span class="pill pill-gray">Off</span>';
  }

  function card(app) {
    const soon = app.status === 'coming_soon';
    const on = isOn(app.id);
    const right = soon ? ''
      : (on ? '<button class="btn btn-default" data-open="' + app.id + '">Open</button>'
            : '<button class="btn btn-primary" data-on="' + app.id + '">Turn on</button>');
    return '<div class="panel app-card' + (soon ? ' soon' : '') + '" data-app="' + app.id + '">' +
        '<div class="app-card-top">' + appIcon(app) +
          '<div style="min-width:0"><div class="app-name">' + esc(app.name) + (app.builtin ? ' <span class="app-badge">Built-in</span>' : '') + '</div>' +
          '<div class="app-tag">' + esc(app.tagline || '') + '</div></div>' +
        '</div>' +
        '<div class="app-card-foot">' + statusPill(app) + (right || '<span></span>') + '</div>' +
      '</div>';
  }

  function section(title, list) {
    if (!list.length) return '';
    return '<div style="margin-bottom:26px"><div class="app-sec-h">' + esc(title) + '</div>' +
      '<div class="app-grid">' + list.map(card).join('') + '</div></div>';
  }

  function render() {
    const installed = APPS.filter((a) => a.status === 'available');
    const soon = APPS.filter((a) => a.status === 'coming_soon');
    root.innerHTML = '<style>' + STYLES + '</style>' +
      '<div class="flex items-center justify-between mb-4"><h1 class="page-title">Apps</h1></div>' +
      '<div class="info-banner" style="margin-bottom:20px">Pluggable apps add optional selling powers without bloating your store. Turn one on and its workspace appears in your sidebar; turn it off and your store runs exactly as before.</div>' +
      section('Built-in apps', installed) +
      section('Coming soon', soon);
    wire();
  }

  function wire() {
    root.querySelectorAll('[data-app]').forEach((c) => {
      const app = byId(c.getAttribute('data-app'));
      if (!app || app.status === 'coming_soon') return;
      c.onclick = (e) => { if (e.target.closest('[data-on],[data-open]')) return; openDetail(app.id); };
    });
    root.querySelectorAll('[data-on]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); turnOn(b.getAttribute('data-on')); });
    root.querySelectorAll('[data-open]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); openWorkspace(b.getAttribute('data-open')); });
  }

  function turnOn(id) {
    setOn(id, true);
    if (window.Shell) window.Shell.refresh();   // make the workspace resident in the sidebar
    render();
    const app = byId(id);
    toast(esc(app.name) + ' is on — find it in your sidebar');
  }
  function turnOff(id) {
    setOn(id, false);
    if (window.Shell) window.Shell.refresh();
    render();
    toast(esc((byId(id) || {}).name) + ' turned off');
  }
  function openWorkspace(id) {
    const app = byId(id);
    if (app && app.menu && app.menu.route) location.hash = app.menu.route;
  }

  // ---------- detail drawer ----------
  let drawerBd = null;
  function closeDrawer() { if (drawerBd) { drawerBd.remove(); drawerBd = null; } }

  function openDetail(id) {
    closeDrawer();
    const app = byId(id); if (!app) return;
    const det = DET[id] || {};
    const on = isOn(id);
    const feats = (det.features || []).map((f) => '<li class="app-feat">' + I.check + '<span>' + esc(f) + '</span></li>').join('');
    const perms = (app.permissions || []).map((p) => '<li class="app-perm">' + I.lock + '<span>' + esc(p) + '</span></li>').join('');

    const foot = on
      ? '<button class="btn btn-primary" data-d-open style="flex:1">Open</button>' +
        '<button class="btn btn-default" data-d-off style="color:var(--err);border-color:#f3c4ba">Turn off</button>'
      : '<button class="btn btn-primary" data-d-on style="flex:1">Turn on ' + esc(app.name) + '</button>';

    drawerBd = document.createElement('div');
    drawerBd.className = 'app-dr-bd';
    drawerBd.innerHTML =
      '<div class="app-dr" role="dialog">' +
        '<div class="app-dr-head">' + appIcon(app) +
          '<div style="flex:1;min-width:0"><div class="app-name" style="font-size:17px">' + esc(app.name) + (app.builtin ? ' <span class="app-badge">Built-in</span>' : '') + '</div>' +
          '<div style="margin-top:6px;display:flex;align-items:center;gap:8px">' + statusPill(app) + '<span class="muted" style="font-size:12px">' + esc(app.category || '') + '</span></div></div>' +
          '<button class="back-btn" data-d-x title="Close" style="flex:none">' + I.x + '</button>' +
        '</div>' +
        '<div class="app-dr-body">' +
          '<div style="font-size:13.5px;color:var(--ink-body);line-height:1.6">' + esc(app.blurb || app.tagline || '') + '</div>' +
          (feats ? '<div class="app-dr-h">What you can do</div><ul class="app-ul">' + feats + '</ul>' : '') +
          (det.worksWith ? '<div class="app-dr-h">How it fits your store</div><div style="font-size:13px;color:var(--ink-body);line-height:1.6">' + esc(det.worksWith) + '</div>' : '') +
          (perms ? '<div class="app-dr-h">Permissions</div><ul class="app-ul">' + perms + '</ul>' : '') +
        '</div>' +
        '<div class="app-dr-foot">' + foot + '</div>' +
      '</div>';
    document.body.appendChild(drawerBd);

    drawerBd.addEventListener('mousedown', (e) => { if (e.target === drawerBd) closeDrawer(); });
    drawerBd.querySelector('[data-d-x]').onclick = closeDrawer;
    const on1 = drawerBd.querySelector('[data-d-on]'); if (on1) on1.onclick = () => { closeDrawer(); turnOn(id); };
    const off1 = drawerBd.querySelector('[data-d-off]'); if (off1) off1.onclick = () => { closeDrawer(); turnOff(id); };
    const open1 = drawerBd.querySelector('[data-d-open]'); if (open1) open1.onclick = () => { closeDrawer(); openWorkspace(id); };
  }

  // ---------- SPA registration ----------
  window.VIEWS = window.VIEWS || {};
  window.VIEWS.apps = {
    render: function (el) { root = el; closeDrawer(); render(); },
    unmount: function () { closeDrawer(); },
  };
})();
