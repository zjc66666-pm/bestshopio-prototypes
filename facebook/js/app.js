/* BestShopio Admin · Facebook & Instagram workspace SPA — hash-routed.
   Chrome (sidebar + header) injected by ../assets/shell.js; this file only
   renders #root. Mirrors Shopline's per-channel workspace structure:
     #/facebook        -> renderHome    (single-column big-card stack)
     #/facebook/pixel  -> renderPixel   (3 sections: Website / Offline / Social)
     #/facebook/<other> -> renderHome   (P1 modules bounce back)
   Reads window.DATA_FACEBOOK from js/data.js. */
(function () {
  const D = window.DATA_FACEBOOK;
  let root;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // Meta brand mark — used in the workspace title bar and module card title rows.
  const META_MARK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#1877F2"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.407 0 22.675 0z"/></svg>';
  // Module title-row uses the simplified ∞ infinity Meta logo (line-style)
  const META_INF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1877F2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-2.5 2-4.5 4.5-4.5 2 0 3 1.5 3.5 3 .5-1.5 1.5-3 3.5-3 2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5c-2 0-3-1.5-3.5-3-.5 1.5-1.5 3-3.5 3-2.5 0-4.5-2-4.5-4.5z"/></svg>';
  // Facebook + Instagram pair shown on the Shop module title row (matches Shopline screenshot)
  const FB_IG_PAIR = '<span style="display:inline-flex;align-items:center;gap:4px">' +
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.407 0 22.675 0z"/></svg>' +
    '<svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="igG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#feda75"/><stop offset="40%" stop-color="#d62976"/><stop offset="100%" stop-color="#962fbf"/></linearGradient></defs><rect width="22" height="22" x="1" y="1" rx="6" fill="url(#igG)"/><rect width="14" height="14" x="5" y="5" rx="4" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>' +
  '</span>';

  const I = {
    arrowLeft: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
    info:      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
    check:     '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    pencil:    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    dots:      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
    question:  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4"/><circle cx="12" cy="17" r=".7" fill="currentColor"/></svg>',
    external:  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
  };

  // ---- Page-scoped styles ----
  const STYLES =
    '.fb-narrow{width:100%;max-width:1280px;margin:0 auto;padding:0 12px}' +

    /* Workspace title bar */
    '.fb-head{display:flex;align-items:center;gap:10px;margin:0 0 18px;font-size:22px;font-weight:600;color:var(--ink)}' +
    '.fb-head-mark{display:inline-flex;align-items:center}' +
    '.fb-back{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:7px;color:var(--ink-muted);cursor:pointer;font-size:13px;font-weight:500;text-decoration:none;background:transparent;border:none}' +
    '.fb-back:hover{background:var(--panel);color:var(--ink)}' +

    /* Workspace card (home page big card) */
    '.fb-mcard{background:#fff;border:1px solid var(--hair);border-radius:14px;padding:24px 28px;margin-bottom:16px;overflow:hidden}' +
    '.fb-mhead{display:flex;align-items:center;gap:10px;margin-bottom:18px}' +
    '.fb-mhead-t{font-size:17px;font-weight:600;color:var(--ink)}' +
    '.fb-mhead-new{display:inline-flex;align-items:center;padding:1px 7px;border-radius:5px;font-size:10.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;background:#ff6b6b;color:#fff;margin-left:2px}' +
    '.fb-mrow{display:flex;align-items:center;justify-content:space-between;gap:24px}' +
    '.fb-mtext{flex:1;min-width:0}' +
    '.fb-msub{font-size:15px;font-weight:600;color:var(--ink);margin-bottom:8px;line-height:1.5}' +
    '.fb-mdesc{font-size:13px;color:var(--ink-muted);line-height:1.6}' +
    '.fb-mhint{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink-muted);margin-top:10px}' +
    '.fb-mhint .ck{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#22c55e;color:#fff;flex:none}' +
    '.fb-mcta{margin-top:16px;display:flex;align-items:center;gap:10px}' +
    '.fb-mcta .btn{padding:6px 16px;font-size:13px}' +
    '.fb-msoon{color:var(--ink-muted);font-size:12.5px;font-weight:500}' +
    '.fb-millu{flex:none;width:240px;height:140px}' +
    '.fb-millu svg{display:block;width:100%;height:100%}' +

    /* Data tracking sub-page — left/right two-column section */
    '.fb-sec{display:grid;grid-template-columns:300px 1fr;gap:32px;margin-bottom:36px}' +
    '.fb-sec-l h2{font-size:17px;font-weight:600;color:var(--ink);margin:0 0 8px}' +
    '.fb-sec-l p{font-size:13px;color:var(--ink-muted);line-height:1.6;margin:0;max-width:260px}' +
    '.fb-sec-r{min-width:0}' +
    '.fb-r-card{background:#fff;border:1px solid var(--hair);border-radius:14px;padding:24px 26px;margin-bottom:14px}' +
    '.fb-r-card:last-child{margin-bottom:0}' +

    /* Tip banner (Don\'t duplicate pixels) */
    '.fb-tip{display:flex;align-items:flex-start;gap:10px;background:#e8f0ff;border-radius:8px;padding:11px 14px;margin-bottom:18px;font-size:12.5px;color:#1e3a8a;line-height:1.5}' +
    '.fb-tip .ic{color:#1877F2;flex:none;display:inline-flex;padding-top:1px}' +

    /* Title row inside right card (with action buttons) */
    '.fb-r-titlebar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}' +
    '.fb-r-title{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:600;color:var(--ink)}' +
    '.fb-r-title .q{color:var(--ink-muted);cursor:help;display:inline-flex}' +
    '.fb-r-desc{font-size:13px;color:var(--ink-muted);line-height:1.6;margin-bottom:14px}' +
    '.fb-r-desc .lnk{color:var(--brand);text-decoration:underline;text-underline-offset:2px}' +
    '.fb-r-actions{display:flex;gap:8px;flex:none}' +
    '.fb-r-actions .btn{padding:6px 16px;font-size:13px}' +

    /* Pixel table */
    '.fb-ptbl{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}' +
    '.fb-ptbl th{text-align:left;padding:10px 4px;font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-muted);border-bottom:1px solid var(--hair)}' +
    '.fb-ptbl td{padding:14px 4px;border-bottom:1px solid var(--hair);vertical-align:middle}' +
    '.fb-ptbl tr:last-child td{border-bottom:none}' +
    '.fb-ptbl .pid{color:var(--ink);font-weight:500}' +
    '.fb-ptbl .verif{display:inline-flex;align-items:center;gap:4px;color:#16a34a;font-size:12.5px;font-weight:500}' +
    '.fb-ptbl .verif::before{content:"";width:6px;height:6px;border-radius:50%;background:#22c55e}' +
    '.fb-ptbl .tok{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--ink-body);margin-left:8px}' +
    '.fb-row-act{display:flex;align-items:center;gap:8px}' +
    '.fb-iconbtn{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--ink-muted);cursor:pointer}' +
    '.fb-iconbtn:hover{background:var(--panel);color:var(--ink)}' +

    /* Pixel Helper row */
    '.fb-helper{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;background:#f7f8fb;border-radius:8px;padding:14px 16px;margin-top:18px}' +
    '.fb-helper-bd .t{font-weight:600;color:var(--ink);font-size:13.5px;margin-bottom:3px}' +
    '.fb-helper-bd .d{font-size:12.5px;color:var(--ink-muted)}' +
    '.fb-helper-go{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;font-size:13px;background:#fff;border:1px solid var(--ctl);border-radius:6px;color:var(--ink);text-decoration:none;font-weight:500;flex:none}' +
    '.fb-helper-go:hover{border-color:var(--brand);color:var(--brand)}' +

    /* Unauthorized status row (Offline / Messaging) */
    '.fb-unauth{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:8px}' +
    '.fb-unauth-l{display:flex;align-items:center;gap:10px}' +
    '.fb-unauth-l b{color:var(--ink);font-weight:600;font-size:13.5px}' +
    '.fb-pill-gray{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:6px;background:#f1f2f5;color:#6b7280;font-size:12px;font-weight:500}' +
    '.fb-pill-gray::before{content:"";width:6px;height:6px;border-radius:50%;background:#9ca3af}' +
    '.fb-soonpill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:6px;background:#f2f2f4;color:#7c8194;font-size:11.5px;font-weight:600;letter-spacing:.02em;text-transform:uppercase}';

  // Generic paint
  function paint(html) {
    root.innerHTML = '<style>' + STYLES + '</style><div class="fb-narrow">' + html + '</div>';
    if (root && root.parentElement) root.parentElement.scrollTop = 0;
  }

  // ============================================================================
  // HOME — single-column big-card stack (Shopline-style sales-channel workspace)
  // ============================================================================
  function renderHome() {
    const card = (m) => {
      // The "Shop" module shows F+IG pair instead of Meta mark; everything else uses Meta ∞
      const titleIcon = m.id === 'shop' ? FB_IG_PAIR : META_INF;
      const badge = m.titleBadge ? '<span class="fb-mhead-new">' + esc(m.titleBadge) + '</span>' : '';
      // Status hint row — shown when the module is connected (currently only Data tracking)
      const hint = (m.connectedHint && D.pixels.length)
        ? '<div class="fb-mhint"><span class="ck">' + I.check + '</span>' +
            'Connected Website Pixel ID: <b style="color:var(--ink);margin-left:3px">' + esc(D.pixels[0].pixelId) + '</b>' +
          '</div>'
        : '';
      // CTA — Setup goes to sub-page; Original ad tools is the Advertising special label;
      // disabled modules show "Coming soon"
      let cta;
      if (m.enabled) {
        cta = '<button class="btn btn-primary" data-go="' + esc(m.id) + '">Setup</button>' +
              '<button class="btn btn-default" data-info style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;font-size:13px">' + I.info + 'Learn more</button>';
      } else if (m.ctaText) {
        // Advertising-style: deep-link to Meta's own Ads Manager (no in-app build).
        // External target so the merchant lands in their own Meta Business account.
        cta = m.ctaUrl
          ? '<a class="btn btn-default" href="' + esc(m.ctaUrl) + '" target="_blank" rel="noreferrer" style="padding:6px 14px;font-size:13px;display:inline-flex;align-items:center;gap:5px;text-decoration:none">' + esc(m.ctaText) + I.external + '</a>'
          : '<button class="btn btn-default" data-soon style="padding:6px 14px;font-size:13px">' + esc(m.ctaText) + '</button>';
      } else if (m.id === 'shop') {
        // Shop only has a Setup button (no Learn more on Shopline)
        cta = '<button class="btn btn-primary" data-soon style="padding:6px 16px;font-size:13px">Setup</button>';
      } else {
        cta = '<span class="fb-msoon">Coming soon</span>';
      }
      return '<div class="fb-mcard">' +
        '<div class="fb-mhead">' + titleIcon + '<span class="fb-mhead-t">' + esc(m.title) + '</span>' + badge + '</div>' +
        '<div class="fb-mrow">' +
          '<div class="fb-mtext">' +
            '<div class="fb-msub">' + esc(m.sub) + '</div>' +
            '<div class="fb-mdesc">' + esc(m.desc) + '</div>' +
            hint +
            '<div class="fb-mcta">' + cta + '</div>' +
          '</div>' +
          '<div class="fb-millu">' + m.illu + '</div>' +
        '</div>' +
      '</div>';
    };

    paint(
      '<div class="fb-head"><span class="fb-head-mark">' + META_MARK + '</span>Facebook</div>' +
      D.modules.map(card).join('')
    );
    root.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => { location.hash = '#/facebook/' + b.getAttribute('data-go'); });
    root.querySelectorAll('[data-soon]').forEach((b) => b.onclick = () => toast('Coming soon'));
    root.querySelectorAll('[data-info]').forEach((b) => b.onclick = () => toast('Help docs coming soon'));
  }

  // ============================================================================
  // DATA TRACKING — 3 sections (Shopline layout):
  //   1. Website data reporting   — multi-Pixel table + Add modal (P0)
  //   2. Offline data reporting   — Offline Conversions API (P1 placeholder)
  //   3. Social e-commerce events — Messaging Event API (P1 placeholder)
  // ============================================================================
  function renderPixel() {
    paint(
      // Header: circle back-button + page-title in one row (matches Orders detail page convention)
      '<div class="flex items-center gap-3" style="margin-bottom:6px">' +
        '<button class="back-btn" data-back title="Back">' + I.arrowLeft + '</button>' +
        '<span class="page-title" style="font-size:22px">Data tracking</span>' +
      '</div>' +
      '<div class="muted" style="font-size:13px;margin:0 0 24px 44px;line-height:1.55">Send conversion issue reports back to Meta with Pixel and Conversion API to better manage your ad performance.</div>' +

      // ---------- Section 1: Website data reporting ----------
      '<div class="fb-sec">' +
        '<div class="fb-sec-l">' +
          '<h2>Website data reporting</h2>' +
          '<p>Once you successfully link up Pixel and Conversion API, we\'ll send the data to Meta every time there\'s a conversion.</p>' +
        '</div>' +
        '<div class="fb-sec-r">' +
          '<div class="fb-r-card">' +
            '<div class="fb-tip"><span class="ic">' + I.info + '</span>' +
              '<div>Don\'t duplicate Pixels. You can check for duplicates with <a href="' + esc(D.pixelHelperLearnUrl) + '" target="_blank" rel="noreferrer" class="lnk" style="color:#1877F2;text-decoration:underline">Meta Pixel Helper</a>.</div>' +
            '</div>' +
            '<div class="fb-r-titlebar">' +
              '<div class="fb-r-title">Authorizing Pixel and Conversion API <span class="q" title="Pixel events fire both client-side and via server-side CAPI with a shared event_id for dedup.">' + I.question + '</span></div>' +
              '<div class="fb-r-actions">' +
                '<button class="btn btn-default" data-authorize>Authorize</button>' +
                '<button class="btn btn-primary" data-add-pixel>Add</button>' +
              '</div>' +
            '</div>' +
            '<div class="fb-r-desc">Add Pixel ID and access token to send all events through Facebook Pixel and Conversions API. This will enhance your marketing ability.<br>' +
              'To connect, your BM needs shared access from the ad account owner <a href="#" class="lnk">Learn how to set this up</a>. Please do not select \'Instagram Account\' during authorization.</div>' +
            // Pixel table
            '<table class="fb-ptbl"><thead><tr>' +
              '<th>Facebook pixel</th><th>Conversion API Access Token</th><th>Create source</th><th style="text-align:right">Action</th>' +
            '</tr></thead><tbody id="fb-prows">' +
              D.pixels.map(pixelRow).join('') +
            '</tbody></table>' +
            // Pixel Helper helper row
            '<div class="fb-helper">' +
              '<div class="fb-helper-bd">' +
                '<div class="t">Install Meta Pixel Helper</div>' +
                '<div class="d">Once you added your Pixel, install Meta Pixel Helper for data analysis.</div>' +
              '</div>' +
              '<a class="fb-helper-go" href="' + esc(D.pixelHelperUrl) + '" target="_blank" rel="noreferrer">Go ' + I.external + '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ---------- Section 2: Offline data reporting (P1 placeholder) ----------
      '<div class="fb-sec">' +
        '<div class="fb-sec-l">' +
          '<h2>Offline data reporting</h2>' +
          '<p>Evaluate your Meta ads\' results over bricks-and-mortar conversions. You can also create and target offline audience groups with the right ads.</p>' +
        '</div>' +
        '<div class="fb-sec-r">' +
          '<div class="fb-r-card">' +
            '<div class="fb-r-title">Report offline conversion data with Offline Conversions API</div>' +
            '<div class="fb-r-desc" style="margin-top:8px">After authorizing data set permissions through Meta Business Extension (MBE), we\'ll report offline order events to Meta. All offline orders from the previous day will be reported at 1 am UTC+8. You can choose a Pixel ID as your dataset ID, the same as what you report on the Website data reporting.</div>' +
            '<div class="fb-unauth">' +
              '<div class="fb-unauth-l"><b>Offline Conversions API</b><span class="fb-pill-gray">Unauthorized</span></div>' +
              '<span class="fb-soonpill">Coming soon</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ---------- Section 3: Social e-commerce conversion event reporting (P1 placeholder) ----------
      '<div class="fb-sec">' +
        '<div class="fb-sec-l">' +
          '<h2>Social e-commerce conversion event reporting</h2>' +
          '<p>Conversion events achieved through live sales, post sales, and message center will be reported to Meta.</p>' +
        '</div>' +
        '<div class="fb-sec-r">' +
          '<div class="fb-r-card">' +
            '<div class="fb-r-title">MBE authorization</div>' +
            '<div class="fb-r-desc" style="margin-top:8px">Once the authorization is enabled, the conversion actions of customers in live sales, post sales, message center will be synchronized with Meta, facilitating performance tracking and continuous optimization of Meta\'s ad performance.</div>' +
            '<div class="fb-unauth">' +
              '<div class="fb-unauth-l"><b>Messaging Event API</b><span class="fb-pill-gray">Unauthorized</span></div>' +
              '<span class="fb-soonpill">Coming soon</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    const back = root.querySelector('[data-back]'); if (back) back.onclick = () => { location.hash = '#/facebook'; };
    const add  = root.querySelector('[data-add-pixel]'); if (add) add.onclick = () => openAddPixelModal();
    const auth = root.querySelector('[data-authorize]'); if (auth) auth.onclick = () => toast('OAuth authorization flow — coming soon');
    wirePixelRows();
  }

  // One row of the pixel table
  function pixelRow(p, idx) {
    const verif = '<span class="verif">Verified</span>';
    return '<tr data-pix="' + idx + '">' +
      '<td><span class="pid">' + esc(p.pixelId) + '</span></td>' +
      '<td>' + (p.status === 'verified' ? verif : '') + '<span class="tok">' + esc(p.capiToken) + '</span></td>' +
      '<td class="muted">' + esc(p.createSource) + '</td>' +
      '<td style="text-align:right"><div class="fb-row-act" style="justify-content:flex-end">' +
        '<button class="fb-iconbtn" data-edit="' + idx + '" title="Edit">' + I.pencil + '</button>' +
        '<button class="fb-iconbtn" data-more="' + idx + '" title="More">' + I.dots + '</button>' +
      '</div></td>' +
    '</tr>';
  }
  function wirePixelRows() {
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => toast('Edit pixel — coming soon'));
    root.querySelectorAll('[data-more]').forEach((b) => b.onclick = () => toast('Delete / Re-verify — coming soon'));
  }

  // ============================================================================
  // ADD PIXEL MODAL — mirrors Shopline "New FB Pixel and Conversion API tracking event"
  // ============================================================================
  function openAddPixelModal() {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:540px"></div>');

    const eventOpts = D.trackingEvents.map((e) => '<option value="' + esc(e.value) + '">' + esc(e.label) + '</option>').join('');
    const pageOpts  = D.pageTypes.map((e) => '<option value="' + esc(e.value) + '">' + esc(e.label) + '</option>').join('');

    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>New FB Pixel and Conversion API tracking event</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></span>' +
      '</div>' +
      '<div class="modal-body" style="max-height:70vh;overflow:auto">' +
        '<div style="margin-bottom:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Select tracking event</div>' +
          '<select class="input" style="width:100%">' + eventOpts + '</select></div>' +
        '<div style="margin-bottom:14px">' +
          '<div class="ctrl-label" style="text-transform:none;margin-bottom:4px">Facebook pixel</div>' +
          '<div class="muted" style="font-size:11.5px;margin-bottom:6px">It\'s usually a JavaScript code snippet obtainable on the Meta platform. <a href="#" class="lnk" style="color:var(--brand)">Learn more ↗</a></div>' +
          '<input class="input" placeholder="Paste your Facebook pixel, e.g.: 212313338444699" style="width:100%" /></div>' +
        '<div style="margin-bottom:14px">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
            '<div class="ctrl-label" style="text-transform:none">Access Token</div>' +
            '<div style="font-size:12px;color:var(--ink-muted)">' +
              '<a href="#" class="lnk" style="color:var(--brand)">What is Verification</a><span style="margin:0 6px;color:var(--ctl)">|</span><a href="#" class="lnk" style="color:var(--brand)">Need help?</a>' +
            '</div></div>' +
          '<input class="input" type="password" placeholder="Paste your access token" style="width:100%" /></div>' +
        '<div style="margin-bottom:4px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Tracking Pages Type</div>' +
          '<select class="input" style="width:100%">' + pageOpts + '</select></div>' +
      '</div>' +
      '<div class="modal-foot" style="justify-content:flex-end">' +
        '<div class="flex gap-2">' +
          '<button class="btn btn-default" data-cancel>Cancel</button>' +
          '<button class="btn btn-primary" data-ok>Save</button>' +
        '</div>' +
      '</div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => {
      const inputs = m.querySelectorAll('input');
      const pixelId = inputs[0].value.trim();
      const token = inputs[1].value.trim();
      if (!pixelId) { toast('Please enter Facebook pixel'); return; }
      // optimistic in-memory append — prototype only
      D.pixels.push({ pixelId, capiToken: token ? token.slice(0, 3) + '*****' + token.slice(-3) : '—', createSource: 'Add manually', status: token ? 'verified' : 'pending' });
      close();
      toast('Saved successfully');
      // re-render the rows
      const tbody = document.getElementById('fb-prows');
      if (tbody) {
        tbody.innerHTML = D.pixels.map(pixelRow).join('');
        wirePixelRows();
      }
    };
  }

  // ============================================================================
  // ROUTER
  // ============================================================================
  function show(rest) {
    const parts = String(rest || '').split('/').filter(Boolean);
    const sub = parts[0] || '';
    if (sub === 'pixel') return renderPixel();
    // P1 modules (domain / shop / ads / messenger) bounce back to home for now.
    return renderHome();
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.facebook = { render: function (el, rest) { root = el; show(rest || ''); } };
})();
