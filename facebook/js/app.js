/* BestShopio Admin · Facebook & Instagram workspace SPA module — hash-routed.
   Chrome (sidebar + header) injected by ../assets/shell.js; this file only renders #root.
   Routes:
     #/facebook         -> renderHome    (workspace card grid, Shopline-style)
     #/facebook/pixel   -> renderPixel   (Meta Pixel + CAPI form + event matrix)
     #/facebook/<other> -> renderHome    (placeholder modules redirect to home)
   Reads window.DATA_FACEBOOK from js/data.js. */
(function () {
  const D = window.DATA_FACEBOOK;
  let root;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- Meta brand mark used across the workspace ----
  const META_MARK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.407 0 22.675 0z"/></svg>';

  // ---- Tiny SVG helpers (line-stroke icons, same style as shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    info:      svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', 16),
    x:         svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    check:     svg('<path d="M20 6 9 17l-5-5"/>', 14),
  };

  // Per-module icons — each module gets its own visual cue. Differentiates the card
  // grid so it doesn't look like 5 copies of the same Meta mark.
  const M_ICONS = {
    domain:    svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>', 22), // verified shield
    pixel:     svg('<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>', 22),                              // trending up
    shop:      svg('<path d="M3 9h18l-1.5 11a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2L3 9z"/><path d="M8 9V6a4 4 0 1 1 8 0v3"/>', 22), // shopping bag
    ads:       svg('<path d="M3 11h6l4-7v15l-4-4H3z"/><path d="M17 9a4 4 0 0 1 0 6"/>', 22),               // megaphone
    messenger: svg('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>', 22), // chat bubble
  };

  // Linked / Not-linked pill (shared widget — matches settings/payments)
  const linkedPill = (linked) => linked
    ? '<span class="pill pill-green"><span class="dot"></span>Linked</span>'
    : '<span class="pill pill-gray"><span class="dot"></span>Not linked</span>';

  // Reusable form field (mirrors settings/app.js field())
  const field = (label, value, placeholder, opts) => {
    opts = opts || {};
    const v = value || '';
    const req = opts.optional ? '' : ' <span style="color:var(--err)">*</span>';
    const learn = opts.learnMore ? '<a class="lnk" href="' + esc(opts.learnMore) + '" target="_blank" rel="noreferrer" style="font-weight:400;float:right">Learn more</a>' : '';
    return '<div style="margin-bottom:14px">' +
      '<div class="ctrl-label" style="text-transform:none;margin-bottom:6px">' + esc(label) + req + learn + '</div>' +
      '<input class="input" value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '" />' +
      (opts.secret && v ? '<div class="muted" style="font-size:11.5px;margin-top:4px">Stored securely · value is masked</div>' : '') +
      (opts.hint ? '<div class="muted" style="font-size:11.5px;margin-top:4px">' + esc(opts.hint) + '</div>' : '') +
      '</div>';
  };

  // ---- Page-scoped styles ----
  const STYLES =
    '.fb-narrow{width:980px;max-width:100%;margin:0 auto;padding:0 4px}' +

    /* Page head */
    '.fb-head{display:flex;align-items:center;gap:10px;margin:0 0 18px;font-size:22px;font-weight:600;color:var(--ink)}' +
    '.fb-head-mark{display:inline-flex;align-items:center}' +
    '.fb-back{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:7px;color:var(--ink-muted);cursor:pointer;font-size:13px;font-weight:500;text-decoration:none;background:transparent;border:none}' +
    '.fb-back:hover{background:var(--panel);color:var(--ink)}' +

    /* Workspace cards (home grid) — compact 2-col layout */
    '.fb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:12px;margin-bottom:14px}' +
    '.fb-card{display:flex;gap:14px;align-items:flex-start;background:#fff;border:1px solid var(--hair);border-radius:12px;padding:16px 18px;transition:border-color .15s,box-shadow .15s}' +
    '.fb-card.active{cursor:pointer}' +
    '.fb-card.active:hover{border-color:var(--brand);box-shadow:0 1px 4px rgba(24,119,242,.08)}' +
    '.fb-card.disabled{opacity:.72}' +
    '.fb-card-ico{flex:none;width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#e4eeff 0%,#cfddff 100%);display:grid;place-items:center;color:#1877F2}' +
    '.fb-card-bd{flex:1;min-width:0}' +
    '.fb-card-h{display:flex;align-items:center;gap:8px;margin-bottom:4px}' +
    '.fb-card-t{font-size:14px;font-weight:600;color:var(--ink)}' +
    '.fb-bdg{display:inline-flex;align-items:center;padding:1px 7px;border-radius:5px;font-size:11px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}' +
    '.fb-bdg-p0{background:#e6f0ff;color:var(--brand)}' +
    '.fb-bdg-p1{background:#f2f2f4;color:#7c8194}' +
    '.fb-card-sub{font-size:12.5px;font-weight:600;color:var(--ink);margin-bottom:3px}' +
    '.fb-card-desc{font-size:12.5px;color:var(--ink-muted);line-height:1.55}' +
    '.fb-card-cta{flex:none;margin-left:8px;align-self:center}' +
    '.fb-card-soon{color:var(--ink-muted);font-size:11.5px;font-weight:500;white-space:nowrap}' +

    /* Pixel page (data tracking) */
    '.fb-note{display:flex;gap:10px;align-items:flex-start;background:#f7f8fb;border-radius:8px;padding:14px 16px;margin-bottom:18px}' +
    '.fb-note-ico{color:var(--brand);flex:none;display:inline-flex}' +
    '.fb-note-bd{font-size:12.5px;line-height:1.55;color:var(--ink-muted)}' +
    '.fb-status{display:flex;align-items:center;justify-content:space-between;background:#f7f8fb;border-radius:10px;padding:14px 16px;margin-bottom:18px}' +
    '.fb-status-l{display:flex;align-items:center;gap:12px}' +
    '.fb-status-l b{color:var(--ink);font-weight:600;font-size:13.5px}' +
    '.fb-status-l span{font-size:12.5px;color:var(--ink-muted)}' +

    /* Event matrix table */
    '.fb-evtable{width:100%;border-collapse:collapse;font-size:13px}' +
    '.fb-evtable th{font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-muted);text-align:left;padding:10px 14px;border-bottom:1px solid var(--hair)}' +
    '.fb-evtable td{padding:12px 14px;border-bottom:1px solid var(--hair);vertical-align:top}' +
    '.fb-evtable tr:last-child td{border-bottom:none}' +
    '.fb-evtable .ev-name{font-weight:500;color:var(--ink)}' +
    '.fb-evtable .ev-fires{font-size:11.5px;color:var(--ink-muted);margin-top:2px}' +
    '.fb-evtable .ev-meta{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--ink-body)}' +

    /* Switch (reuse settings/app.js .set-switch styling rules locally) */
    '.fb-sw{display:inline-flex;align-items:center;width:40px;height:22px;border-radius:9999px;background:var(--ctl);cursor:pointer;transition:background .15s;flex:none;padding:2px}' +
    '.fb-sw.on{background:var(--brand)}' +
    '.fb-sw-k{width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}' +
    '.fb-sw.on .fb-sw-k{transform:translateX(18px)}' +

    /* Section title in cards */
    '.fb-stitle{font-size:15px;font-weight:600;color:var(--ink);margin-bottom:2px}' +
    '.fb-ssub{font-size:12.5px;color:var(--ink-muted)}' +
    '.fb-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border-radius:10px;background:#f7f8fb}';

  // Render container helper — top-level paint with shared styles + optional .fb-narrow wrapper
  function paint(html) {
    root.innerHTML = '<style>' + STYLES + '</style><div class="fb-narrow">' + html + '</div>';
    root.querySelectorAll('[data-toggle]').forEach((el) => el.onclick = () => el.classList.toggle('on'));
    if (root && root.parentElement) root.parentElement.scrollTop = 0;
  }

  // ============================================================================
  // HOME — workspace card grid (Shopline-style: each module is a big card)
  // ============================================================================
  function renderHome() {
    const card = (m) => {
      const ico = M_ICONS[m.id] || M_ICONS.pixel;
      const bdgCls = m.badge === 'P0' ? 'fb-bdg-p0' : 'fb-bdg-p1';
      const cta = m.enabled
        ? '<button class="btn btn-primary" data-go="' + esc(m.id) + '" style="padding:5px 14px;font-size:12.5px">Set up</button>'
        : '<span class="fb-card-soon">Coming soon · P1</span>';
      const cls = 'fb-card' + (m.enabled ? ' active' : ' disabled');
      const clickAttr = m.enabled ? ' data-card-go="' + esc(m.id) + '"' : '';
      return '<div class="' + cls + '"' + clickAttr + '>' +
        '<div class="fb-card-ico">' + ico + '</div>' +
        '<div class="fb-card-bd">' +
          '<div class="fb-card-h">' +
            '<span class="fb-card-t">' + esc(m.title) + '</span>' +
            (m.badge ? '<span class="fb-bdg ' + bdgCls + '">' + esc(m.badge) + '</span>' : '') +
          '</div>' +
          '<div class="fb-card-sub">' + esc(m.subtitle) + '</div>' +
          '<div class="fb-card-desc">' + esc(m.desc) + '</div>' +
        '</div>' +
        '<div class="fb-card-cta">' + cta + '</div>' +
      '</div>';
    };

    paint(
      '<div class="fb-head"><span class="fb-head-mark">' + META_MARK + '</span>Facebook & Instagram</div>' +
      '<div class="fb-grid">' + D.modules.map(card).join('') + '</div>'
    );
    const go = (id) => { location.hash = '#/facebook/' + id; };
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); go(b.getAttribute('data-go')); });
    root.querySelectorAll('[data-card-go]').forEach((c) => c.onclick = () => go(c.getAttribute('data-card-go')));
  }

  // ============================================================================
  // DATA TRACKING — Meta Pixel + Conversion API form + event matrix
  // ============================================================================
  function renderPixel() {
    const p = D.pixel;
    const linked = !!p.pixelId;

    const evRow = (e) =>
      '<tr><td><div class="ev-name">' + esc(e.name) + '</div>' +
        '<div class="ev-fires">' + esc(e.fires) + '</div></td>' +
        '<td class="ev-meta">' + esc(e.meta) + '</td>' +
      '</tr>';

    paint(
      '<button class="fb-back" data-back>' + I.arrowLeft + 'Facebook & Instagram</button>' +
      '<div class="fb-head" style="margin-top:6px"><span class="fb-head-mark">' + META_MARK + '</span>Data tracking</div>' +

      '<div class="fb-note">' +
        '<span class="fb-note-ico">' + I.info + '</span>' +
        '<div class="fb-note-bd">Pixel events fire from <b>both</b> the storefront browser <b>and</b> our server-side Conversion API with a shared <code>event_id</code> — Meta dedupes automatically, so attribution survives iOS 14+ tracking blocks (which would otherwise eat 30–50% of client-side events).</div>' +
      '</div>' +

      '<div class="panel card-pad mb-4">' +
        '<div class="card-title">Pixel + Conversion API</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:2px;margin-bottom:14px">Connect one Meta Pixel for this store. CAPI access token enables server-side de-duped events post-iOS 14.</div>' +

        '<div class="fb-row" style="margin-bottom:18px">' +
          '<div class="fb-status-l">' +
            '<span class="fb-head-mark">' + META_MARK + '</span>' +
            '<div><div><b>Meta Pixel</b></div>' +
              '<div style="margin-top:3px"><span>' + (linked ? 'Pixel ID: ' + esc(p.pixelId) + (p.capiToken ? ' · CAPI token set' : '') : 'Not connected yet') + '</span></div></div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:14px">' +
            linkedPill(linked) +
            '<div class="fb-sw' + (p.enabled ? ' on' : '') + '" data-toggle="enable" aria-label="Enable"><span class="fb-sw-k"></span></div>' +
          '</div>' +
        '</div>' +

        field('Pixel ID', p.pixelId, 'e.g. 102938475610293', { learnMore: p.docs }) +
        field('CAPI access token', p.capiToken, 'EAA…', { secret: true, hint: 'Events Manager → Settings → Conversions API → Generate access token.' }) +
        field('Test event code', p.testEventCode, 'TEST12345', { optional: true, hint: 'Optional — see live events in Events Manager → Test events.' }) +

        '<div class="fb-row" style="margin-top:6px">' +
          '<div>' +
            '<div class="fb-stitle">Advanced matching</div>' +
            '<div class="fb-ssub">Hash and send email / phone with each event for stronger attribution. PII is hashed (SHA-256) before leaving our server.</div>' +
          '</div>' +
          '<div class="fb-sw' + (p.advMatching ? ' on' : '') + '" data-toggle="adv" aria-label="Advanced matching"><span class="fb-sw-k"></span></div>' +
        '</div>' +

        '<div style="display:flex;gap:10px;margin-top:18px">' +
          '<button class="btn btn-primary" data-save>Save</button>' +
          (linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Disconnect</button>' : '') +
        '</div>' +
      '</div>' +

      '<div class="panel mb-4">' +
        '<div class="card-pad" style="padding-bottom:0">' +
          '<div class="card-title">Events sent automatically</div>' +
          '<div class="muted" style="font-size:12.5px;margin-top:2px">BestShopio fires these events client-side and server-side (CAPI). You don\'t install any tracking code per app.</div>' +
        '</div>' +
        '<div style="overflow-x:auto;padding:16px"><table class="fb-evtable">' +
          '<thead><tr><th style="min-width:280px">Event</th><th>Meta event name</th></tr></thead>' +
          '<tbody>' + D.events.map(evRow).join('') + '</tbody>' +
        '</table></div>' +
      '</div>'
    );

    const back = root.querySelector('[data-back]'); if (back) back.onclick = () => { location.hash = '#/facebook'; };
    const save = root.querySelector('[data-save]'); if (save) save.onclick = () => toast(linked ? 'Saved successfully' : 'Connected successfully');
    const disc = root.querySelector('[data-disc]'); if (disc) disc.onclick = () => toast('Disconnected');
  }

  // ============================================================================
  // ROUTER
  // ============================================================================
  function show(rest) {
    const parts = String(rest || '').split('/').filter(Boolean);
    const sub = parts[0] || '';
    if (sub === 'pixel') return renderPixel();
    // Placeholder modules (domain / shop / ads / messenger) currently bounce back to home;
    // when they ship, add their renderers here and remove the redirect.
    return renderHome();
  }

  // ---- SPA registration (shell drives render + renders the sidebar) ----
  window.VIEWS = window.VIEWS || {};
  window.VIEWS.facebook = { render: function (el, rest) { root = el; show(rest || ''); } };
})();
