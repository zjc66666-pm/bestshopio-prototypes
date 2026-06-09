/* BestShopio Admin · Settings prototype — SPA sub-module of the shared shell.
   When the route is #/settings/* the shell (../assets/shell.js) renders the
   settings sidebar (7 items) + a "Settings" bar, then mounts this module via
   window.VIEWS.settings.render(rootEl, rest). This file renders ONLY the content
   of the active settings sub-page into #root (NO internal left sub-nav). `rest`
   (the part after #/settings/) selects the sub-page.
   Mirrors reference/bestvoy-admin web-antd settings/** views & copy exactly.
   SECURITY: secret fields render masked placeholders only — never plaintext. */
(function () {
  const D = window.DATA_SETTINGS;
  let root; // set by the SPA shell router via VIEWS.settings.render(el, rest)

  // tiny html -> element helper (same pattern as orders prototype)
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- inline icons (match shell.js .nav-ico style) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    truck:  svg('<path d="M10 17h4V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>'),
    chevR:  svg('<path d="m9 18 6-6-6-6"/>', 16),
    chevL:  svg('<path d="m15 18-6-6 6-6"/>', 18),
    chevD:  svg('<path d="m6 9 6 6 6-6"/>', 16),
    plus:   svg('<path d="M12 5v14M5 12h14"/>', 16),
    image:  svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L5 19"/>', 18),
    x:      svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    globe:  svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18"/>', 16),
    check:  svg('<path d="M20 6 9 17l-5-5"/>', 14),
    tagSm:  svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 18),
    grid:   svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 16),
    trash:  svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 16),
    dots:   svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', 16),
    grip:   svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 16),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', 16),
    info:   svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', 16),
  };

  // ---- toast (same as orders) ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- confirm dialog (mirrors Ant Modal.confirm) ----
  const confirm = (opts) => modal({
    title: opts.title, width: opts.width || 460,
    body: '<div class="muted" style="font-size:13.5px;line-height:1.6">' + esc(opts.content) + '</div>',
    okText: opts.okText || 'OK', danger: opts.danger,
    onOk: (m, close) => { close(); opts.onOk && opts.onOk(); },
  });

  // ===== shared small builders (reuse theme classes) =====
  // Linked/Not linked dot pill (matches render.tsx tag-dot-success / tag-dot-bg)
  const linkedPill = (linked) => linked
    ? '<span class="pill pill-green"><span class="dot"></span>Linked</span>'
    : '<span class="pill pill-gray"><span class="dot"></span>Not linked</span>';

  const sectionTitle = (t, sub) =>
    '<div class="card-title">' + esc(t) + '</div>' + (sub ? '<div class="muted" style="font-size:12.5px;margin-top:2px">' + esc(sub) + '</div>' : '');

  // a soft framed inner row block (mirrors the .b-c framed rows in the admin)
  const block = (inner, bg) => '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;background:' + (bg || 'var(--panel)') + '">' + inner + '</div>';

  // an Ant-style Switch (visual)
  let sw = 0;
  const toggle = (on, label) => {
    const id = 'sw' + (++sw);
    return '<label class="set-switch' + (on ? ' on' : '') + '" data-toggle="' + id + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '><span class="set-knob"></span></label>';
  };

  // method chips for payment cards
  const methodChips = (arr) => arr.map((m) => '<span class="pay-chip">' + esc(m) + '</span>').join('');

  // ===========================================================================
  // PAINT: shell renders the sidebar + "Settings" bar; we render ONLY the active
  // sub-page content into #root. Edit-like centered pages use .detail-wrap.
  // ===========================================================================
  // `centered` pages mirror the real admin's centered w-[860px] forms.
  function paint(bodyHtml, centered) {
    root.innerHTML =
      '<style>' + STYLES + '</style>' +
      (centered ? '<div class="set-narrow">' + bodyHtml + '</div>' : bodyHtml);
    // wire generic toggles (visual only)
    root.querySelectorAll('[data-toggle]').forEach((el) => el.onclick = () => el.classList.toggle('on'));
  }

  // a Page-style header (title + optional description + optional right slot)
  const pageHead = (title, sub, rightHtml) =>
    '<div class="flex items-start justify-between mb-4" style="gap:12px">' +
      '<div><div class="page-title" style="font-size:20px">' + esc(title) + '</div>' +
        (sub ? '<div class="muted" style="font-size:13px;margin-top:2px">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="flex items-center gap-2">' + (rightHtml || '') + '</div>' +
    '</div>';

  const updateBtn = '<button class="btn btn-primary" data-act="save">Update</button>';

  // editable text field for a modal. `secret` only adds a "masked" note — the
  // value itself is always masked in DATA for secret fields.
  function field(label, value, placeholder, opts) {
    opts = opts || {};
    const v = value || '';
    const req = opts.optional ? '' : ' <span style="color:var(--err)">*</span>';
    const learn = opts.learnMore ? '<a class="lnk" href="' + esc(opts.learnMore) + '" target="_blank" rel="noreferrer" style="font-weight:400;float:right">Learn more</a>' : '';
    const addon = opts.addonBefore
      ? '<div class="set-addon"><span class="set-addon-prefix">' + esc(opts.addonBefore) + '</span><input class="input" value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '" style="border-top-left-radius:0;border-bottom-left-radius:0" /></div>'
      : '<input class="input" value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '" />';
    return '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">' + esc(label) + req + learn + '</div>' +
      addon +
      (opts.secret && v ? '<div class="muted" style="font-size:11.5px;margin-top:4px">Stored securely · value is masked</div>' : '') +
      (opts.hint ? '<div class="muted" style="font-size:11.5px;margin-top:4px">' + esc(opts.hint) + '</div>' : '') +
      '</div>';
  }

  // PC + Mobile preview modal (NoDataPreviewModal / checkout preview modal)
  function openPreviewModal(title) {
    modal({ title: title, width: 760, okText: 'Complete', hideCancel: true,
      body:
        '<div style="display:grid;grid-template-columns:3fr 2fr;gap:20px">' +
          '<div><div class="text-sm" style="text-align:center;font-weight:600;color:var(--ink);margin-bottom:10px">PC Display</div>' +
            '<div class="preview-frame" style="height:230px"><span class="muted">Storefront PC preview</span></div></div>' +
          '<div><div class="text-sm" style="text-align:center;font-weight:600;color:var(--ink);margin-bottom:10px">Mobile Display</div>' +
            '<div class="preview-frame" style="height:230px"><span class="muted">Mobile preview</span></div></div>' +
        '</div>',
      onOk: (m, close) => close() });
  }

  // ===========================================================================
  // TAB 1 — BASE  ("Basic settings", centered w-860)
  //   render.tsx: Store information / Product information / Order information /
  //   Login through social media (Google only) / Data analysis. One Update btn.
  // ===========================================================================
  function renderBase() {
    const b = D.base;

    const uploadCard = (u, label, desc, previewTitle) => {
      const tile = u.set
        ? '<div class="up-tile filled"><span class="up-ico">' + I.image + '</span><span class="up-name">' + esc(u.name) + '</span>' +
            '<button class="up-x" title="Remove">' + I.x + '</button></div>'
        : '<div class="up-tile"><span class="up-plus">' + I.plus + '</span><span class="up-add">Add images</span></div>';
      return block(
        '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">' + esc(label) + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-bottom:10px">' + esc(desc) +
          ' <a class="lnk" data-preview="' + esc(previewTitle) + '">Preview display here.</a>' +
          ' Recommended size: ' + esc(u.rec) + ', format: ' + esc(u.format) + '.</div>' +
        tile
      );
    };

    const fontTags = b.store.fonts.map((f) =>
      '<span class="field-pill">' + esc(f) + ' <span class="x" data-font="' + esc(f) + '">&times;</span></span>').join('');

    const storeCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Store information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          uploadCard(b.store.logo, 'Store logo', 'This logo is displayed on the store.', 'Display Position of Store logo') +
          uploadCard(b.store.ico, 'Store ico', 'The icon displayed in the browser window.', 'Display Position of Store ico') +
          uploadCard(b.store.noData, 'No data icon', 'This logo is displayed on the store.', 'Display Position of No data icon') +
          block(
            '<div class="flex items-center justify-between mb-1">' +
              '<div><div class="text-sm" style="font-weight:600;color:var(--ink)">Store Font</div>' +
              '<div class="muted" style="font-size:12.5px">Add your preferred fonts to control store typography.</div></div>' +
              '<button class="btn btn-gray" data-act="add-font">Add font</button>' +
            '</div>' +
            '<div class="flex flex-wrap gap-1 mt-3">' + (fontTags || '<span class="muted" style="font-size:12.5px">No fonts added</span>') + '</div>'
          ) +
        '</div>' +
      '</div>';

    const prodRow = (p, name) => block(
      '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(name) + '</span>' + toggle(p.on, name) + '</div>' +
      '<div class="muted" style="font-size:12.5px">' + esc(p.desc) + '</div>'
    );
    const productCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Product information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          prodRow(b.product.reviews, 'Product Reviews') +
          prodRow(b.product.original, 'Original Price') +
          prodRow(b.product.vendor, 'Product vendor') +
        '</div>' +
      '</div>';

    const orderCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Order information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">Order ID prefix</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:8px">Order ID starts from 1001 by default. You may add a prefix to create custom IDs. e.g. "EN1001"</div>' +
            '<input class="input" id="ord-prefix" maxlength="10" placeholder="Please enter" value="' + esc(b.order.prefix) + '" style="width:300px" />' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Order ID will be displayed as <span class="subtle" id="ord-prefix-eg">' + esc(b.order.prefix) + '1001, ' + esc(b.order.prefix) + '1002, ' + esc(b.order.prefix) + '1003...</span></div>'
          ) +
          block(
            '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Order Auto-Cancel Time</span>' +
              '<div class="set-addon"><input class="input" type="number" value="' + b.order.autoCancelMinutes + '" min="1" max="1440" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Minutes</span></div></div>' +
            '<div class="muted" style="font-size:12.5px">Duration for To pay orders after Place order.</div>'
          ) +
          block(
            '<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Order Auto-Receive Time</span>' +
              '<div class="set-addon"><input class="input" type="number" value="' + b.order.autoReceiveDays + '" min="1" max="100" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Days</span></div></div>' +
            '<div class="muted" style="font-size:12.5px">Orders are auto-Receive after a set number of days from shipping (e.g., 10 days).</div>'
          ) +
        '</div>' +
      '</div>';

    const socialRow = (s) =>
      '<div class="flex items-center justify-between" style="padding:12px 0">' +
        '<div class="flex items-center gap-3">' + I.globe +
          '<span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(s.name) + '</span>' + linkedPill(s.linked) +
        '</div>' +
        '<button class="btn btn-gray" data-social="' + s.key + '">' + (s.linked ? 'Edit' : 'Link') + '</button>' +
      '</div>';
    const socialCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Login through social media', 'After connecting, customers can log in to the online store through their social media accounts.') +
        '<div class="mt-2">' + block(b.social.map(socialRow).join('')) + '</div>' +
      '</div>';

    const a = b.analytics;
    const analyticsCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Data analysis', 'After connecting, customers can log in to the online store through their social media accounts.') +
        '<div class="mt-2">' + block(
          '<div class="flex items-center justify-between" style="padding:12px 0">' +
            '<div class="flex items-center gap-3">' + I.globe +
              '<span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(a.name) + '</span>' + linkedPill(a.linked) +
            '</div>' +
            '<button class="btn btn-gray" data-act="ga4">' + (a.linked ? 'Edit' : 'Link') + '</button>' +
          '</div>'
        ) + '</div>' +
      '</div>';

    paint(
      pageHead('Basic settings') +
      storeCard + productCard + orderCard + socialCard + analyticsCard +
      '<div class="flex justify-end">' + updateBtn + '</div>',
      true
    );

    // wiring
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Settings updated successfully'));
    root.querySelectorAll('[data-preview]').forEach((b2) => b2.onclick = () => openPreviewModal(b2.getAttribute('data-preview')));
    const addFont = root.querySelector('[data-act="add-font"]'); if (addFont) addFont.onclick = () => openAddFontModal();
    root.querySelectorAll('[data-font]').forEach((x) => x.onclick = () => toast('Removed font ' + x.getAttribute('data-font')));
    root.querySelectorAll('[data-social]').forEach((b2) => b2.onclick = () => openLoginModal(b2.getAttribute('data-social')));
    const ga = root.querySelector('[data-act="ga4"]'); if (ga) ga.onclick = () => openAnalyticsModal();
    const pfx = root.querySelector('#ord-prefix');
    if (pfx) pfx.oninput = () => { const v = pfx.value || ''; const eg = root.querySelector('#ord-prefix-eg'); if (eg) eg.textContent = v + '1001, ' + v + '1002, ' + v + '1003...'; };
  }

  function openAddFontModal() {
    const opts = D.base.store.fontOptions.map((f) => {
      const on = D.base.store.fonts.includes(f);
      return '<label class="edit-check" style="padding:7px 0"><input type="checkbox" ' + (on ? 'checked' : '') + ' /><span>' + esc(f) + '</span></label>';
    }).join('');
    modal({ title: 'Add font', width: 400, okText: 'OK',
      body: '<div class="flex items-center gap-4" style="margin-bottom:8px"><span class="text-sm" style="font-weight:600;color:var(--ink);width:48px">Font:</span><div style="flex:1">' + opts + '</div></div>',
      onOk: (m, close) => { close(); toast('Store fonts updated'); } });
  }
  function openLoginModal(key) {
    const s = D.base.social.find((x) => x.key === key);
    const body =
      '<div class="muted mb-4" style="font-size:13px">' + esc(s.blurb) + '</div>' +
      field('App ID', s.fields.appId, 'Please enter App ID') +
      field('App Secret', s.fields.appSecret, 'Please enter App Secret', { secret: true }) +
      field('Redirect URIs', s.fields.redirectUris, "Please enter Redirect URIs, You can enter your store's homepage URL.");
    modal({ title: s.modalTitle, width: 620, okText: 'Save',
      body, onOk: (m, close) => { close(); toast(s.linked ? 'Edit successfully' : 'Connected successfully'); },
      extraLeft: s.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast('Cancelled connection successfully'); } });
  }
  function openAnalyticsModal() {
    const a = D.base.analytics;
    modal({ title: a.modalTitle, width: 620, okText: 'Save',
      body: '<div class="muted mb-4" style="font-size:13px">' + esc(a.blurb) + '</div>' + field('Measurement Id', a.measurementId, 'Please enter Measurement Id'),
      onOk: (m, close) => { close(); toast('Connected successfully'); },
      extraLeft: a.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast('Cancelled connection successfully'); } });
  }

  // ===========================================================================
  // TAB 2 — PAYMENTS  ("Payments", centered w-860)
  //   render.tsx: "Card Payments & Express Checkout" card (processor radio +
  //   Airwallex then Stripe rows: logo + method icons + Linked dot + Edit/Link)
  //   then a separate PayPal card. Credentials are entered in modals only.
  // ===========================================================================
  function renderPayments() {
    const p = D.payments;
    const active = p.activeProcessor;

    // a card-processor row: method chips + linked dot + Edit/Link button
    const processorRow = (prov, extra) =>
      '<div class="prov-card mb-4">' +
        '<div class="flex items-center justify-between mb-3">' +
          '<div class="flex items-center gap-2"><span class="card-title">' + esc(prov.name) + '</span>' + linkedPill(prov.linked) + '</div>' +
          '<button class="btn btn-gray" data-prov="' + prov.kindKey + '">' + (prov.linked ? 'Edit' : 'Link') + '</button>' +
        '</div>' +
        '<div class="mb-2">' + methodChips(p.cardMethods.concat(extra || [])) + '</div>' +
      '</div>';

    const air = Object.assign({ kindKey: 'airwallex' }, p.providers.airwallex);
    const stripe = Object.assign({ kindKey: 'stripe' }, p.providers.stripe);

    const procOpt = (key) => {
      const opt = p.processorOptions.find((o) => o.value === key);
      const on = active === key;
      return '<label class="set-radio" data-proc="' + key + '" style="margin-right:18px">' +
        '<span class="proc-radio">' + (on ? '<span class="proc-dot"></span>' : '') + '</span>' + esc(opt.label) + '</label>';
    };

    const cardCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Card Payments & Express Checkout') +
        '<div class="mt-4">' +
          '<div class="set-note mb-4" style="background:#f7f8fa">' +
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Payment Processor</div>' +
            '<div class="flex items-center">' + procOpt('airwallex') + procOpt('stripe') + '</div>' +
            '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.5">Choose which processor handles Card, Apple Pay, and Google Pay. Switching processors requires re-entering credentials. Switching processors requires Apple Pay domain re-verification. Please contact our support team to complete the switch.</div>' +
          '</div>' +
          processorRow(air, []) +
          processorRow(stripe, p.stripeExtraMethods) +
        '</div>' +
      '</div>';

    const pp = Object.assign({ kindKey: 'paypal' }, p.paypal);
    const paypalCard =
      '<div class="panel card-pad mb-4">' +
        '<div class="prov-card">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="flex items-center gap-2"><span class="card-title">' + esc(pp.name) + '</span>' + linkedPill(pp.linked) + '</div>' +
            '<button class="btn btn-gray" data-prov="paypal">' + (pp.linked ? 'Edit' : 'Link') + '</button>' +
          '</div>' +
          '<div class="muted" style="font-size:12.5px">Buy Now · Pay Later</div>' +
        '</div>' +
      '</div>';

    paint(
      pageHead('Payments') +
      cardCard + paypalCard,
      true
    );

    // switch processor (re-render so the active radio updates)
    root.querySelectorAll('[data-proc]').forEach((el) => el.onclick = () => {
      const key = el.getAttribute('data-proc');
      if (key === D.payments.activeProcessor) return;
      D.payments.activeProcessor = key;
      renderPayments();
      toast('Updated successfully — re-enter credentials to finish');
    });
    root.querySelectorAll('[data-prov]').forEach((b2) => b2.onclick = () => openProviderModal(b2.getAttribute('data-prov')));
  }

  function openProviderModal(key) {
    const p = D.payments;
    const prov = key === 'paypal' ? p.paypal : p.providers[key];
    let body = '<div class="muted mb-4" style="font-size:13px">' + esc(prov.blurb) + '</div>';
    body += prov.fields.map((f) => field(f.label, f.value, 'Please enter ' + f.label, { secret: f.secret, learnMore: f.learnMore })).join('');
    if (key === 'airwallex') {
      body += '<div style="margin-top:4px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Airwallex domain verification file</div>' +
        '<button class="btn btn-gray" type="button">Upload ZIP</button>' +
        '<div class="muted" style="font-size:11.5px;margin-top:4px">Only .zip files up to 1MB are supported.</div></div>';
    }
    if (key === 'paypal') {
      body += '<div style="margin-top:4px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Mode</div>' +
        '<label class="set-radio' + (prov.mode === 'live' ? ' on' : '') + '" style="margin-right:16px"><span class="proc-radio">' + (prov.mode === 'live' ? '<span class="proc-dot"></span>' : '') + '</span>Live</label>' +
        '<label class="set-radio' + (prov.mode === 'sandbox' ? ' on' : '') + '"><span class="proc-radio">' + (prov.mode === 'sandbox' ? '<span class="proc-dot"></span>' : '') + '</span>Sandbox</label></div>';
    }
    modal({ title: prov.modalTitle, width: 620, okText: 'Save',
      body, onOk: (m, close) => { close(); toast(prov.linked ? 'Edit successfully' : 'Connected successfully'); },
      extraLeft: prov.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast('Cancelled connection successfully'); } });
  }

  // ===========================================================================
  // TAB 3 — CURRENCY  ("Currency", full width)
  //   index.vue: description "Default currency: USD $" + search bar + table.
  //   edit.vue rendered as a modal here (rate/symbol/status), exchange_rate_type
  //   0 = automatic, 1 = manual; price rounding "Round up to the nearest …".
  // ===========================================================================
  function renderCurrency() {
    const c = D.currency;
    const rows = c.list.map((r) =>
      '<tr data-cid="' + r.id + '">' +
        '<td><div class="flex items-center gap-2"><span class="ccy-flag">' + esc(r.country_code) + '</span>' +
          '<span class="subtle" style="font-weight:500">' + esc(r.country_name) + '</span></div></td>' +
        '<td>' + esc(r.currency_code) + '</td>' +
        '<td>' + esc(r.currency_symbol) + '</td>' +
        '<td>' + toggle(r.currency_status === 1, r.currency_code + ' status') + '</td>' +
        '<td>' + esc(r.exchange_rate_type_text) + '</td>' +
        '<td class="muted">' + esc(r.exchange_rate_round_type_text) + '</td>' +
        '<td style="text-align:right"><button class="lnk" data-edit-ccy="' + r.id + '">Edit</button></td>' +
      '</tr>').join('');

    const fieldOpts = c.searchFieldOptions.map((o) => '<option value="' + o.value + '">' + esc(o.label) + '</option>').join('');

    const table =
      '<div class="panel">' +
        '<div class="card-pad" style="background:#f7f8fb;border-bottom:1px solid var(--hair);border-radius:10px 10px 0 0;padding:12px 16px">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<select class="filter-select" style="width:160px">' + fieldOpts + '</select>' +
            '<input class="filter-input" placeholder="Please enter keywords to search" style="padding-left:12px;width:268px" />' +
            '<select class="filter-select" style="width:160px"><option>Status</option><option>On</option><option>Off</option></select>' +
            '<select class="filter-select" style="width:160px"><option>Exchange rate</option><option>Automatic</option><option>Manual</option></select>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:900px">' +
          '<thead><tr><th>Country</th><th>Currency code</th><th>Currency symbol</th><th>Status</th><th>Exchange rate</th><th>Price rounding</th><th style="text-align:right">Action</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
      '</div>';

    paint(
      pageHead('Currency', 'Default currency: ' + c.defaultCurrency) +
      table,
      false
    );

    root.querySelectorAll('[data-edit-ccy]').forEach((b2) => b2.onclick = (e) => { e.stopPropagation(); openCurrencyEdit(Number(b2.getAttribute('data-edit-ccy'))); });
    root.querySelectorAll('#root tr[data-cid]').forEach((tr) => tr.onclick = () => openCurrencyEdit(Number(tr.getAttribute('data-cid'))));
  }

  function openCurrencyEdit(id) {
    const r = D.currency.list.find((x) => x.id === id);
    if (!r) return;
    const auto = r.exchange_rate_type === 0;
    const radio = (on, label, sub) =>
      '<label class="set-radio2' + (on ? ' on' : '') + '"><span class="proc-radio">' + (on ? '<span class="proc-dot"></span>' : '') + '</span>' +
      '<span><span class="subtle" style="font-weight:500">' + esc(label) + '</span>' + (sub ? '<div class="muted" style="font-size:12px;margin-top:2px">' + esc(sub) + '</div>' : '') + '</span></label>';
    const round = r.exchange_rate_round_type === 1;
    const body =
      block('<div class="flex gap-8 text-sm"><div><span class="muted">Currency code:</span> <span class="subtle" style="font-weight:500">' + esc(r.currency_code) + '</span></div>' +
            '<div><span class="muted">Currency symbol:</span> <span class="subtle" style="font-weight:500">' + esc(r.currency_symbol) + '</span></div></div>') +
      // Exchange rate
      '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;margin-top:16px">' +
        '<div class="card-title" style="font-size:15px;margin-bottom:10px">Exchange rate</div>' +
        '<div class="flex flex-col gap-2">' +
          radio(auto, 'Using automatic exchange rates', 'The price of an item will change automatically based on the market rate and includes a 0% conversion fee. 1 ' + r.original_currency + ' = ' + r.exchange_rate_auto_value + ' ' + r.currency_code + '.') +
          radio(!auto, 'Use manual exchange rates', 'Customized exchange rates, no conversion fees.') +
        '</div>' +
        '<div class="mt-2 flex items-center gap-2" style="' + (auto ? 'opacity:.5' : '') + '"><span class="muted text-sm">1 ' + esc(r.original_currency) + ' =</span>' +
          '<div class="set-addon"><input class="input" type="number" value="' + esc(r.exchange_rate) + '" step="0.01" min="0" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">' + esc(r.currency_code) + '</span></div></div>' +
      '</div>' +
      // Price rounding
      '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;margin-top:16px">' +
        '<div class="card-title" style="font-size:15px;margin-bottom:10px">Price rounding</div>' +
        '<div class="flex flex-col gap-2">' +
          '<label class="set-radio' + (round ? ' on' : '') + '"><span class="proc-radio">' + (round ? '<span class="proc-dot"></span>' : '') + '</span><span>Round up to the nearest ' + esc(r.currency_code) + ' ' + esc(r.currency_symbol) + '</span>' +
            '<input class="input" type="number" value="' + (r.exchange_rate_round || 1) + '" min="1" style="width:120px;margin-left:8px"' + (round ? '' : ' disabled') + ' /></label>' +
          '<label class="set-radio' + (round ? '' : ' on') + '"><span class="proc-radio">' + (round ? '' : '<span class="proc-dot"></span>') + '</span>Do not round prices</label>' +
          (round ? '' : '<div class="muted" style="font-size:12px;margin-left:24px">The price will automatically be rounded to two decimal places.</div>') +
        '</div>' +
      '</div>' +
      // Price decimal
      '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px;margin-top:16px">' +
        '<div class="card-title" style="font-size:15px;margin-bottom:10px">Price decimal</div>' +
        '<div class="flex flex-col gap-2">' + [0, 1, 2].map((d) => '<label class="set-radio' + (r.exchange_rate_decimal === d ? ' on' : '') + '"><span class="proc-radio">' + (r.exchange_rate_decimal === d ? '<span class="proc-dot"></span>' : '') + '</span>' + d + '</label>').join('') + '</div>' +
      '</div>';
    modal({ title: r.country_name, width: 600, okText: 'Update', body, onOk: (m, close) => { close(); toast('Updated successfully'); } });
  }

  // ===========================================================================
  // TAB 4 — CHECKOUT  ("Checkout", centered w-860)
  //   EditForm.tsx: ONLY a "Customize checkout" card (logo upload + width +
  //   alignment + position). No cart / shipping / gift card / order-note.
  // ===========================================================================
  function renderCheckout() {
    const c = D.checkout;
    const radioGroup = (name, opts, sel) => opts.map((o) =>
      '<label class="set-radio' + (o.value === sel ? ' on' : '') + '" data-radio="' + name + '" data-val="' + o.value + '" style="margin-right:16px;margin-bottom:6px">' +
      '<span class="proc-radio">' + (o.value === sel ? '<span class="proc-dot"></span>' : '') + '</span>' + esc(o.label) + '</label>').join('');

    const logoCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Customize checkout') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">Checkout logo</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:10px">This logo is displayed on Checkout page. <a class="lnk" data-preview="Display Position of Checkout logo">Preview display here.</a> Format: png. If no Checkout logo is uploaded, the Store logo will be used by default.</div>' +
            '<div class="up-tile"><span class="up-plus">' + I.plus + '</span><span class="up-add">Add images</span></div>'
          ) +
          block(
            '<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:72px">Width</div>' +
            '<input type="range" min="50" max="300" value="' + c.logo.width + '" class="set-range" id="logo-w" style="max-width:200px" />' +
            '<div class="set-addon"><input class="input" type="number" value="' + c.logo.width + '" id="logo-w-num" min="50" max="300" style="width:120px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">px</span></div></div>',
            '#f7f8fa'
          ) +
          block('<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:120px">Logo alignment</div><div>' + radioGroup('align', c.logo.alignmentOptions, c.logo.alignment) + '</div></div>', '#f7f8fa') +
          block('<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:120px">Logo position</div><div>' + radioGroup('pos', c.logo.positionOptions, c.logo.position) + '</div></div>', '#f7f8fa') +
        '</div>' +
      '</div>';

    paint(
      pageHead('Checkout') +
      logoCard +
      '<div class="flex justify-end">' + updateBtn + '</div>',
      true
    );

    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Updated successfully'));
    root.querySelectorAll('[data-preview]').forEach((b2) => b2.onclick = () => openPreviewModal(b2.getAttribute('data-preview')));
    root.querySelectorAll('[data-radio]').forEach((el) => el.onclick = () => {
      const name = el.getAttribute('data-radio');
      root.querySelectorAll('[data-radio="' + name + '"]').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
    const wr = root.querySelector('#logo-w'), wn = root.querySelector('#logo-w-num');
    if (wr && wn) { wr.oninput = () => { wn.value = wr.value; }; wn.oninput = () => { wr.value = wn.value; }; }
  }

  // ===========================================================================
  // TAB 5 — METAFIELDS  ("Metafields", centered w-860)
  //   list.tsx (resource picker) -> detail.tsx (Name / Data Type / Used in) ->
  //   form.tsx (add/edit, custom. prefix). No system pill / nskey in the table.
  //   sub-state: mfResource = null (picker) | 'products' | 'variants'
  // ===========================================================================
  let mfResource = null;

  function renderMetafields() {
    const m = D.metafields;
    if (!mfResource) {
      const rows = m.resources.map((r) => {
        const count = (m.definitions[r.key] || []).length;
        const ico = r.badge
          ? '<span class="mf-res-ico">' + esc(r.badge) + '</span>'
          : '<span class="mf-res-ico">' + I.tagSm + '</span>';
        return '<button class="mf-res" data-res="' + r.key + '">' + ico +
          '<span style="flex:1;text-align:left"><span class="text-sm" style="font-weight:600;color:var(--ink);display:block">' + esc(r.title) + '</span>' +
          '<span class="muted" style="font-size:12.5px">' + count + ' definitions</span></span>' +
          '<span class="muted">' + I.chevR + '</span></button>';
      }).join('');
      paint(
        pageHead('Metafields', 'Add a custom piece of data to a specific part of your store') +
        '<div class="panel card-pad">' + sectionTitle('Metafield', 'Select a module to manage extended fields') +
          '<div class="mt-4 flex flex-col gap-2">' + rows + '</div>' +
        '</div>',
        true
      );
      root.querySelectorAll('[data-res]').forEach((b2) => b2.onclick = () => { mfResource = b2.getAttribute('data-res'); renderMetafields(); });
      return;
    }

    const r = m.resources.find((x) => x.key === mfResource);
    const defs = m.definitions[mfResource] || [];
    const suffix = mfResource === 'variants' ? 'variants' : 'products';
    const title = mfResource === 'variants' ? 'Product variant metafields' : 'Product metafields';
    const rows = defs.map((d) =>
      '<tr>' +
        '<td><div class="flex items-center gap-3"><span class="muted mf-grip">' + I.grip + '</span><span class="subtle" style="font-weight:500">' + esc(d.name) + '</span></div></td>' +
        '<td><div class="flex items-center gap-2"><span class="mf-type-ico">' + I.tagSm + '</span><span>' + esc(d.typeLabel) + '</span></div></td>' +
        '<td class="muted">' + d.usedIn + ' ' + suffix + '</td>' +
      '</tr>').join('');

    paint(
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="mf-back" title="Back">' + I.chevL + '</button>' +
          '<div class="page-title" style="font-size:18px">' + esc(title) + '</div>' +
        '</div>' +
        (defs.length ? '<button class="btn btn-primary" data-act="mf-add">Add fields</button>' : '') +
      '</div>' +
      (defs.length
        ? '<div class="panel"><div style="overflow-x:auto"><table class="tbl" style="min-width:560px">' +
            '<thead><tr><th>Name</th><th>Data Type</th><th>Used in</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table></div>' +
            '<div class="flex items-center justify-between card-pad"><span class="muted" style="font-size:13px">Total ' + defs.length + ' records</span></div>' +
          '</div>'
        : // blank state (blank.tsx)
          '<div class="panel" style="min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px">' +
            '<div class="mf-blank-ico">' + I.tagSm + '</div>' +
            '<div class="card-title" style="font-size:18px;margin-top:16px">' + (mfResource === 'variants' ? 'Add metafield for product variant' : 'Add metafield for product category') + '</div>' +
            '<div class="muted" style="font-size:13px;margin-top:6px;margin-bottom:18px">' + (mfResource === 'variants' ? 'Used to add extention fields and data for product variant' : 'Used to add extention fields and data for product category') + '</div>' +
            '<button class="btn btn-primary" data-act="mf-add">Add fields</button>' +
          '</div>'),
      true
    );
    const back = root.querySelector('[data-act="mf-back"]'); if (back) back.onclick = () => { mfResource = null; renderMetafields(); };
    root.querySelectorAll('[data-act="mf-add"]').forEach((b2) => b2.onclick = () => openAddDefinition(r));
  }

  function openAddDefinition(resource) {
    const m = D.metafields;
    const typeOpts = m.typeOptions.map((g) =>
      '<optgroup label="' + esc(g.group) + '">' + g.types.map((t) => '<option value="' + t.type + '">' + esc(t.label) + '</option>').join('') + '</optgroup>').join('');
    const title = resource.key === 'variants' ? 'Add variant metafield definition' : 'Add product metafield definition';
    const body =
      field('Name', '', 'Name') +
      field('Namespace and key', '', 'namespace.key', { addonBefore: 'custom.' }) +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Type <span style="color:var(--err)">*</span></div>' +
        '<select class="input"><option value="" disabled selected>Select type</option>' + typeOpts + '</select></div>' +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Description (Optional)</div>' +
        '<textarea class="input" rows="3" placeholder="Please Enter" style="height:auto;padding:8px 12px;resize:vertical"></textarea></div>';
    modal({ title: title, width: 560, okText: 'Add', body, onOk: (mm, close) => { close(); toast(resource.key + ' metafield definition created successfully'); } });
  }

  // ===========================================================================
  // TAB 6 — SHIPPABLE LOCATIONS  ("Ship locations", full width)
  //   index.vue + list.tsx + table.tsx: filter bar + expandable table
  //   (Country/Region / Located in / Status (Visible|Hidden) / Sort / Action).
  //   LocationFormModal: Country/Region + Located in + Status radio + Sort.
  // ===========================================================================
  function flattenLocations(nodes, depth, acc, openSet) {
    nodes.forEach((n) => {
      acc.push({ node: n, depth: depth });
      if (n.children && n.children.length && openSet.has(n.id)) {
        flattenLocations(n.children, depth + 1, acc, openSet);
      }
    });
    return acc;
  }
  let locOpen = new Set([1]); // expanded row ids (North America open by default)

  function renderLocations() {
    const tree = D.locations.tree;
    let total = 0;
    tree.forEach((n) => { total++; });

    const rowsHtml = () => {
      const flat = flattenLocations(tree, 0, [], locOpen);
      return flat.map(({ node: n, depth }) => {
        const indent = depth * 16;
        const hasKids = n.snum && n.snum > 0;
        const caret = hasKids
          ? '<button class="loc-caret' + (locOpen.has(n.id) ? ' open' : '') + '" data-loc-toggle="' + n.id + '">' + I.chevR + '</button>'
          : '<span style="width:16px;display:inline-block"></span>';
        const flag = depth === 0 && n.code ? '<span class="ccy-flag" style="width:20px;height:14px">' + esc(n.code) + '</span>' : (depth === 0 ? '<span class="ccy-flag" style="width:20px;height:14px"></span>' : '');
        const vis = n.is_show === 1;
        const sortVal = (!n.sort || Number(n.sort) === 0) ? '--' : n.sort;
        return '<tr data-locrow="' + n.id + '">' +
          '<td><div class="flex items-center gap-2" style="padding-left:' + indent + 'px">' + caret + flag + '<span>' + esc(n.name) + '</span></div></td>' +
          '<td class="muted">' + (n.located_in ? esc(n.located_in) : '- -') + '</td>' +
          '<td><div class="flex items-center gap-2">' + toggle(vis, n.name + ' status') + '<span class="muted">' + (vis ? 'Visible' : 'Hidden') + '</span></div></td>' +
          '<td class="muted">' + esc(sortVal) + '</td>' +
          '<td><div class="flex items-center gap-1">' +
            '<button class="set-icon-btn" data-loc-edit="' + n.id + '" title="Edit">' + I.pencil + '</button>' +
            '<button class="set-icon-btn danger" data-loc-del="' + n.id + '" title="Delete">' + I.trash + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('');
    };

    paint(
      pageHead('Ship locations', 'Set delivery regions at checkout', '<button class="btn btn-primary" data-act="loc-add">Add location</button>') +
      '<div class="panel">' +
        '<div class="card-pad" style="background:#fff;border-bottom:1px solid var(--hair);padding:16px">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<select class="filter-select" style="width:150px"><option value="country">Country/Region</option><option value="locatedIn">Located in</option></select>' +
            '<input class="filter-input" placeholder="Search" style="padding-left:12px;width:268px" />' +
            '<select class="filter-select" style="width:160px"><option>Status</option><option>Visible</option><option>Hidden</option></select>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto"><table class="tbl loc-table" style="min-width:760px">' +
          '<thead><tr><th>Country/Region</th><th>Located in</th><th style="width:160px">Status</th><th style="width:120px">Sort</th><th style="width:110px">Action</th></tr></thead>' +
          '<tbody id="loc-tbody">' + rowsHtml() + '</tbody>' +
        '</table></div>' +
        '<div class="flex items-center justify-between card-pad"><span class="muted" style="font-size:13px">Total ' + total + ' records</span></div>' +
      '</div>',
      false
    );

    const wire = () => {
      root.querySelectorAll('[data-loc-toggle]').forEach((el) => el.onclick = (e) => {
        e.stopPropagation();
        const id = Number(el.getAttribute('data-loc-toggle'));
        if (locOpen.has(id)) locOpen.delete(id); else locOpen.add(id);
        const tb = root.querySelector('#loc-tbody'); if (tb) { tb.innerHTML = rowsHtml(); wire(); }
      });
      root.querySelectorAll('[data-loc-edit]').forEach((el) => el.onclick = (e) => { e.stopPropagation(); openLocationModal('edit', Number(el.getAttribute('data-loc-edit'))); });
      root.querySelectorAll('[data-loc-del]').forEach((el) => el.onclick = (e) => {
        e.stopPropagation();
        confirm({ title: 'Delete location', content: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!', okText: 'Delete', danger: true, onOk: () => toast('Location deleted successfully') });
      });
    };
    wire();
    const add = root.querySelector('[data-act="loc-add"]'); if (add) add.onclick = () => openLocationModal('add');
  }

  function findLocNode(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) { const f = findLocNode(n.children, id); if (f) return f; }
    }
    return null;
  }

  function openLocationModal(mode, id) {
    const rec = mode === 'edit' ? findLocNode(D.locations.tree, id) : null;
    // flat list of all locations as "Located in" options
    const flatOpts = [];
    const walk = (nodes, prefix) => nodes.forEach((n) => {
      flatOpts.push({ id: n.id, label: (prefix ? prefix + ' > ' : '') + n.name });
      if (n.children) walk(n.children, (prefix ? prefix + ' > ' : '') + n.name);
    });
    walk(D.locations.tree, '');
    const vis = rec ? rec.is_show === 1 : true;
    const body =
      field('Country/Region', rec ? rec.name : '', 'Country/Region') +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Located in <span style="color:var(--err)">*</span></div>' +
        '<select class="input"' + (mode === 'edit' ? ' disabled' : '') + '><option value="" disabled' + (rec ? '' : ' selected') + '>Please select</option>' +
          flatOpts.map((o) => '<option value="' + o.id + '"' + (rec && rec.located_in && o.label === (rec.located_in) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') +
        '</select></div>' +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Status <span style="color:var(--err)">*</span></div>' +
        '<label class="set-radio' + (vis ? ' on' : '') + '" style="margin-right:16px"><span class="proc-radio">' + (vis ? '<span class="proc-dot"></span>' : '') + '</span>Visible</label>' +
        '<label class="set-radio' + (vis ? '' : ' on') + '"><span class="proc-radio">' + (vis ? '' : '<span class="proc-dot"></span>') + '</span>Hidden</label></div>' +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Sort</div>' +
        '<div class="flex items-center gap-3"><input class="input" type="number" min="0" placeholder="Sort" value="' + (rec && rec.sort ? rec.sort : '') + '" style="width:200px" />' +
        '<span class="muted" style="font-size:12px">Higher sort show first</span></div></div>';
    modal({ title: mode === 'edit' ? 'Edit location' : 'Add location', width: 620, okText: mode === 'edit' ? 'Update' : 'Add', body,
      onOk: (m, close) => { close(); toast(mode === 'edit' ? 'Updated successfully' : 'Added successfully'); } });
  }

  // ===========================================================================
  // TAB 7 — SHIPPING RATES  ("Shipping rates", centered w-860)
  //   list.tsx -> general.tsx / custom.tsx (profile detail with ZonesPanel +
  //   NoChargeAreas; custom adds profile-name + Products). Rate/Zone modals.
  //   sub-state: rateProfile = null (list) | profile id
  // ===========================================================================
  let rateProfile = null;

  function renderRates() {
    const data = D.rates;
    if (rateProfile == null) {
      const general = data.profiles.find((p) => p.is_general === 1);
      const customs = data.profiles.filter((p) => p.is_general === 0);

      const generalRow = general
        ? '<div class="rate-row" data-profile="' + general.id + '">' +
            '<span class="rate-ico">' + I.globe + '</span>' +
            '<span style="flex:1;text-align:left"><span class="muted" style="font-size:13px">Supported shipping ' + general.zones_count + ' zone(s)</span></span>' +
            '<span class="muted">' + I.chevR + '</span></div>'
        : '';
      const generalCard =
        '<div class="panel card-pad mb-4">' +
          '<div class="mb-2"><div class="text-sm" style="font-weight:600;color:var(--ink)">General shipping rates</div>' +
            '<div class="muted" style="font-size:12.5px">All products that are not in other shipping profiles.</div></div>' +
          generalRow +
        '</div>';

      const customRow = (p) =>
        '<div class="rate-row" data-profile="' + p.id + '">' +
          '<span class="rate-ico">' + I.globe + '</span>' +
          '<span style="flex:1;text-align:left">' +
            '<span class="text-sm" style="font-weight:600;color:var(--ink);display:block">' + esc(p.name) + '</span>' +
            '<span class="muted" style="font-size:12.5px">Includes ' + (p.products_count || 0) + ' product(s), available for shipping to ' + (p.regions_count || 0) + ' region(s)</span>' +
          '</span>' +
          '<span class="muted">' + I.chevR + '</span></div>';
      const customCard =
        '<div class="panel card-pad mb-4">' +
          '<div class="flex items-center justify-between mb-2"><div><div class="text-sm" style="font-weight:600;color:var(--ink)">Custom shipping profile</div>' +
            '<div class="muted" style="font-size:12.5px">Create a shipping profile to add custom rates for groups of products.</div></div>' +
            '<button class="btn btn-primary" data-act="add-profile">Add</button></div>' +
          '<div class="mt-3 flex flex-col gap-3">' + (customs.length ? customs.map(customRow).join('') : '<div class="muted text-sm" style="text-align:center;padding:24px 0">No custom profiles</div>') + '</div>' +
        '</div>';

      paint(
        pageHead('Shipping rates', 'Set shipping fees at checkout.') +
        generalCard + customCard,
        true
      );
      root.querySelectorAll('[data-profile]').forEach((b2) => b2.onclick = () => { rateProfile = Number(b2.getAttribute('data-profile')); renderRates(); });
      const ap = root.querySelector('[data-act="add-profile"]'); if (ap) ap.onclick = () => { rateProfile = 'new'; renderRates(); };
      return;
    }

    renderRateProfile();
  }

  function renderRateProfile() {
    const data = D.rates;
    const isNew = rateProfile === 'new';
    const p = isNew ? null : data.profiles.find((x) => x.id === rateProfile);
    if (!isNew && !p) { rateProfile = null; renderRates(); return; }
    const isCustom = isNew || p.is_general === 0;
    const sym = data.currencySymbol;
    const title = p ? (p.is_general === 1 ? 'General shipping rates' : 'Edit the shipping rates for custom profile') : 'Add the shipping rates for custom profile';

    const rateRule = (rt) => {
      if (rt.condition_type === 'none') return '';
      if (rt.condition_type === 'price') {
        const mn = Number(rt.min_value || 0);
        return rt.max_value == null ? 'Orders ' + sym + mn.toFixed(2) + ' and up' : 'Orders ' + sym + mn.toFixed(2) + '-' + sym + Number(rt.max_value).toFixed(2);
      }
      const mn = Number(rt.min_value || 0);
      return rt.max_value == null ? 'Weight ' + mn.toFixed(2) + 'g and up' : 'Weight ' + mn.toFixed(2) + 'g-' + Number(rt.max_value).toFixed(2) + 'g';
    };
    const ratePrice = (rt) => rt.price === 0
      ? '<span class="rate-free">Free</span>'
      : '<span class="rate-price">' + sym + Number(rt.price).toFixed(2) + '</span>';

    const zones = p ? p.zones : [];
    const zoneBlock = (z) => {
      const areasText = (z.areas && z.areas.length) ? z.areas.join(', ') : (z.region_ids ? z.region_ids.length + ' region(s)' : '');
      const rates = z.rates.length
        ? '<div class="rate-list">' + z.rates.map((rt) =>
            '<div class="rate-item"><div style="min-width:0"><div class="subtle" style="font-weight:500;font-size:13px">' + esc(rt.name) + '</div>' +
              (rateRule(rt) ? '<div class="muted" style="font-size:12px">' + rateRule(rt) + '</div>' : '') + '</div>' +
              '<div class="flex items-center gap-2">' + ratePrice(rt) +
                '<button class="set-icon-btn" data-rate-menu="' + z.id + ':' + rt.id + '" title="More">' + I.dots + '</button></div></div>').join('') + '</div>'
        : '<div class="rate-empty"><div class="muted text-sm">No shipping rates found for this region</div>' +
            '<div style="margin-top:10px"><button class="btn btn-primary" style="height:28px" data-add-rate="' + z.id + '">Add shipping rate</button></div>' +
            '<div style="margin-top:10px;font-size:12px;color:var(--err)">Add shipping to ensure that customers in this area complete the checkout</div></div>';
      return '<div class="zone-block">' +
        '<div class="flex items-center justify-between">' +
          '<div class="flex items-center gap-2"><span class="zone-ico">' + I.truck + '</span><span class="subtle" style="font-weight:600">' + esc(z.name) + '</span></div>' +
          '<div class="flex items-center gap-2">' +
            (z.rates.length ? '<button class="btn btn-gray" style="height:28px" data-add-rate="' + z.id + '">Add shipping rate</button>' : '') +
            '<button class="set-icon-btn" data-zone-menu="' + z.id + '" title="More">' + I.dots + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="muted" style="font-size:12px;margin:4px 0 10px">Includes deliveries to: ' + esc(areasText) + '</div>' +
        rates +
      '</div>';
    };

    const zonesCard =
      '<div class="panel mb-4">' +
        '<div class="flex items-center justify-between card-pad" style="border-bottom:1px solid var(--hair);padding:16px"><div>' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);font-size:15px">Shipping zones and shipping rates</div>' +
          '<div class="muted" style="font-size:12px;margin-top:2px">Set shipping zones and rates visible to customers at checkout.</div></div>' +
          (zones.length ? '<button class="btn btn-gray" style="height:28px" data-act="add-zone">Add shipping zone</button>' : '') +
        '</div>' +
        (zones.length
          ? '<div class="card-pad flex flex-col gap-3" style="padding:16px">' + zones.map(zoneBlock).join('') + '</div>'
          : '<div class="card-pad" style="text-align:center;padding:40px"><div class="muted text-sm">No shipping zones yet</div>' +
              '<div style="margin-top:10px"><button class="btn btn-primary" style="height:28px" data-act="add-zone">Add shipping zone</button></div></div>') +
      '</div>';

    const noChargeAreas = D.rates.noChargeAreas;
    const noCharge =
      '<div class="panel card-pad mb-4">' +
        '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:6px">Areas with no shipping charges added</div>' +
        (noChargeAreas.length
          ? '<div class="muted" style="font-size:12px">' + noChargeAreas.length + ' countries/regions: ' + esc(noChargeAreas.join(', ')) + '</div>'
          : '<div class="muted text-sm">No data available</div>') +
      '</div>';

    // custom-profile name + products
    let customHead = '';
    if (isCustom) {
      const prods = (p && p.products) || [];
      const prodRows = prods.length
        ? '<div class="rate-list">' + prods.map((pr) =>
            '<div class="rate-item"><div class="flex items-center gap-3"><span class="prod-thumb">IMG</span>' +
              '<div><div class="text-sm">' + esc(pr.store_name) + '</div>' + (pr.spec_type === 1 ? '<div class="muted" style="font-size:12px">(' + pr.variantNum + ' variants selected)</div>' : '') + '</div></div>' +
              '<button class="set-icon-btn" title="Remove">' + I.x + '</button></div>').join('') + '</div>'
        : '<div class="muted text-sm" style="text-align:center;padding:24px 0">No data available<div style="margin-top:8px"><button class="btn btn-primary" style="height:28px" data-act="add-products">Add products</button></div></div>';
      customHead =
        '<div class="panel card-pad mb-4">' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:6px">Custom profile name <span class="muted" style="font-weight:400">(Customers won\'t see this)</span></div>' +
          '<input class="input" maxlength="100" placeholder="Please enter" value="' + esc(p ? p.name : '') + '" /></div>' +
        '<div class="panel card-pad mb-4">' +
          '<div class="flex items-center justify-between mb-3"><div class="text-sm" style="font-weight:600;color:var(--ink);font-size:15px">Products</div>' +
            (prods.length ? '<button class="btn btn-gray" style="height:28px" data-act="add-products">Add products</button>' : '') + '</div>' +
          prodRows +
        '</div>';
    } else {
      // general profile shows a read-only Products panel
      customHead =
        '<div class="panel card-pad mb-4">' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);font-size:15px">Products</div>' +
          '<div class="muted" style="font-size:12px;margin-top:4px">All products not in other profiles. Newly created products are added to this profile.</div>' +
          '<div class="muted text-sm" style="text-align:center;padding:24px 0;margin-top:8px;border:1px solid var(--hair);border-radius:8px">No data available</div>' +
        '</div>';
    }

    const footer = isCustom
      ? '<div class="flex items-center ' + (isNew ? 'justify-end' : 'justify-between') + '">' +
          (isNew ? '' : '<button class="btn" style="background:var(--err);color:#fff" data-act="del-profile">Delete group profile</button>') +
          '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add' : 'Update') + '</button>' +
        '</div>'
      : '<div class="flex justify-end">' + updateBtn + '</div>';

    paint(
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="rate-back" title="Back">' + I.chevL + '</button>' +
        '<div class="page-title" style="font-size:20px">' + esc(title) + '</div>' +
      '</div>' +
      customHead + zonesCard + noCharge + footer,
      true
    );

    const back = root.querySelector('[data-act="rate-back"]'); if (back) back.onclick = () => { rateProfile = null; renderRates(); };
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => { toast(isNew ? 'Created successfully' : 'Updated successfully'); if (isNew) { rateProfile = null; renderRates(); } });
    const az = root.querySelector('[data-act="add-zone"]'); if (az) az.onclick = () => openZoneModal('add');
    const ap2 = root.querySelector('[data-act="add-products"]'); if (ap2) ap2.onclick = () => toast('Add products — select products for this profile');
    const dp = root.querySelector('[data-act="del-profile"]'); if (dp) dp.onclick = () => confirm({ title: 'Delete group profile', content: 'Are you sure you want to delete this profile?', okText: 'Delete', danger: true, onOk: () => { toast('Deleted successfully'); rateProfile = null; renderRates(); } });
    root.querySelectorAll('[data-add-rate]').forEach((b2) => b2.onclick = () => openRateModal('add', Number(b2.getAttribute('data-add-rate')), null));
    root.querySelectorAll('[data-rate-menu]').forEach((b2) => b2.onclick = (e) => {
      const [zid, rid] = b2.getAttribute('data-rate-menu').split(':').map(Number);
      openRowMenu(e.currentTarget, [
        { label: 'Edit rate', onClick: () => openRateModal('edit', zid, rid) },
        { label: 'Delete', danger: true, onClick: () => { const z = (p.zones || []).find((x) => x.id === zid); confirm({ title: 'Delete rate', content: 'Are you sure you want to delete "' + (z ? (z.rates.find((r) => r.id === rid) || {}).name : '') + '"?', okText: 'Delete', danger: true, onOk: () => { if (z) z.rates = z.rates.filter((r) => r.id !== rid); renderRateProfile(); } }); } },
      ]);
    });
    root.querySelectorAll('[data-zone-menu]').forEach((b2) => b2.onclick = (e) => {
      const zid = Number(b2.getAttribute('data-zone-menu'));
      openRowMenu(e.currentTarget, [
        { label: 'Edit zone', onClick: () => openZoneModal('edit', zid) },
        { label: 'Delete', danger: true, onClick: () => { const z = (p.zones || []).find((x) => x.id === zid); confirm({ title: 'Delete zone', content: 'Are you sure you want to delete "' + (z ? z.name : '') + '"?', okText: 'Delete', danger: true, onOk: () => { if (p) p.zones = p.zones.filter((x) => x.id !== zid); renderRateProfile(); } }); } },
      ]);
    });
  }

  // tiny dropdown menu anchored to a button (mirrors Ant Dropdown)
  function openRowMenu(anchor, items) {
    document.querySelectorAll('.row-menu').forEach((m) => m.remove());
    const menu = h('<div class="row-menu"></div>');
    menu.innerHTML = items.map((it, i) => '<button class="row-menu-item' + (it.danger ? ' danger' : '') + '" data-i="' + i + '">' + esc(it.label) + '</button>').join('');
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.top = (r.bottom + window.scrollY + 4) + 'px';
    menu.style.left = (r.right + window.scrollX - menu.offsetWidth) + 'px';
    menu.querySelectorAll('[data-i]').forEach((el) => el.onclick = () => { const it = items[Number(el.getAttribute('data-i'))]; menu.remove(); it.onClick(); });
    setTimeout(() => {
      const close = (e) => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); } };
      document.addEventListener('click', close);
    }, 0);
  }

  function openZoneModal(mode, zoneId) {
    const data = D.rates;
    const p = data.profiles.find((x) => x.id === rateProfile);
    const z = mode === 'edit' && p ? (p.zones || []).find((x) => x.id === zoneId) : null;
    const regionNames = [];
    const walk = (nodes) => nodes.forEach((n) => { regionNames.push(n.name); if (n.children) walk(n.children); });
    walk(D.locations.tree);
    const selected = z && z.areas ? z.areas : [];
    const body =
      '<div style="margin-bottom:16px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Shipping zone name <span class="muted" style="font-weight:400">(Customers won\'t see this)</span></div>' +
        '<input class="input" maxlength="100" placeholder="Please enter shipping zone name" value="' + esc(z ? z.name : '') + '" /></div>' +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Shipping zone</div>' +
        '<div class="zone-region-pick">' +
          regionNames.slice(0, 12).map((nm) =>
            '<label class="edit-check" style="padding:5px 0"><input type="checkbox"' + (selected.includes(nm) ? ' checked' : '') + ' /><span>' + esc(nm) + '</span></label>').join('') +
        '</div></div>';
    modal({ title: mode === 'edit' ? 'Edit shipping zone' : 'Add shipping zone', width: 560, okText: mode === 'edit' ? 'Done' : 'Add', body,
      onOk: (m, close) => { close(); toast('Shipping zone saved'); } });
  }

  function openRateModal(mode, zoneId, rateId) {
    const data = D.rates;
    const p = data.profiles.find((x) => x.id === rateProfile);
    const zone = p ? (p.zones || []).find((z) => z.id === zoneId) : null;
    const rt = (mode === 'edit' && zone) ? (zone.rates.find((r) => r.id === rateId) || {}) : {};
    const sym = data.currencySymbol;
    const cond = rt.condition_type || 'none';
    const hasCond = cond === 'price' || cond === 'weight';

    const condRadio = (val, label) =>
      '<label class="set-radio' + (cond === val ? ' on' : '') + '" data-radio="cond" data-val="' + val + '" style="margin-right:16px"><span class="proc-radio">' + (cond === val ? '<span class="proc-dot"></span>' : '') + '</span>' + esc(label) + '</label>';

    const isPrice = cond === 'price';
    const minMaxBlock = (unit, before) =>
      '<div class="flex items-center gap-3" style="margin-top:8px"><div class="text-sm" style="width:140px">Minimum ' + unit + ':</div>' +
        '<div class="set-addon">' + (before ? '<span class="set-addon-prefix">' + esc(sym) + '</span>' : '') + '<input class="input" type="number" min="0" step="0.01" value="' + (rt.min_value != null ? rt.min_value : '') + '" style="width:120px' + (before ? ';border-top-left-radius:0;border-bottom-left-radius:0' : '') + '" />' + (before ? '' : '<span class="set-addon-suffix">g</span>') + '</div></div>' +
      '<div class="flex items-center gap-3" style="margin-top:8px"><div class="text-sm" style="width:140px">Maximum ' + unit + ':</div>' +
        '<div class="set-addon">' + (before ? '<span class="set-addon-prefix">' + esc(sym) + '</span>' : '') + '<input class="input" type="number" min="0" step="0.01" placeholder="No limit" value="' + (rt.max_value != null ? rt.max_value : '') + '" style="width:120px' + (before ? ';border-top-left-radius:0;border-bottom-left-radius:0' : '') + '" />' + (before ? '' : '<span class="set-addon-suffix">g</span>') + '</div></div>';

    const body =
      '<div style="margin-bottom:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Shipping rate name <span class="muted" style="font-weight:400">(Displayed during checkout when the customer chooses a logistics option. PayPal limits this to 24 characters — longer names may cause checkout errors.)</span></div>' +
        '<input class="input" maxlength="24" placeholder="Please enter shipping rate name" value="' + esc(rt.name || '') + '" list="rate-name-sugg" />' +
        '<datalist id="rate-name-sugg">' + data.rateNameSuggestions.map((s) => '<option value="' + esc(s) + '"></option>').join('') + '</datalist></div>' +
      '<div style="margin-bottom:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Additional description</div>' +
        '<textarea class="input" rows="3" maxlength="100" placeholder="Additional description for logistic timeliness, delivery noticeand other information, which will be displayed when there is no freight merge. (Optional)" style="height:auto;padding:8px 12px;resize:vertical">' + esc(rt.description || '') + '</textarea></div>' +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Price:</div>' +
        '<div class="set-addon"><span class="set-addon-prefix">' + esc(sym) + '</span><input class="input" type="number" min="0" step="0.01" value="' + (rt.price != null ? rt.price : '') + '" style="width:160px;border-top-left-radius:0;border-bottom-left-radius:0" /></div></div>' +
      '<div style="margin-bottom:10px"><a class="lnk" data-act="toggle-cond">' + (hasCond ? 'Delete conditions' : 'More pricing options') + '</a></div>' +
      '<div data-cond-wrap style="display:' + (hasCond ? 'block' : 'none') + '">' +
        '<div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Charging method <span class="muted" style="font-weight:400">(Conditions are inclusive on both ends: Minimum ≤ value ≤ Maximum)</span></div>' +
        '<div style="margin-bottom:4px">' + condRadio('weight', 'Based on item weight') + condRadio('price', 'Based on order price') + '</div>' +
        '<div data-minmax>' + (cond === 'weight' ? minMaxBlock('weight', false) : minMaxBlock('price', true)) + '</div>' +
      '</div>' +
      '<div style="margin-top:14px"><div class="ctrl-label" style="text-transform:none;margin-bottom:8px">Checkout preview</div>' +
        '<div class="checkout-preview"><div class="checkout-preview-row"><div style="max-width:80%"><div class="text-sm" style="font-weight:500">' + esc(rt.name || 'Shipping rate name') + '</div>' +
          '<div class="muted" style="font-size:12px">' + esc(rt.description || 'Additional description') + '</div></div>' +
          '<div class="text-sm" style="font-weight:500">' + (Number(rt.price || 0) === 0 ? '<span class="rate-free">Free</span>' : sym + Number(rt.price || 0).toFixed(2)) + '</div></div></div>' +
      '</div>';

    const ctrl = modal({ title: mode === 'edit' ? 'Edit shipping rate' : 'Add shipping rate', width: 640, okText: mode === 'edit' ? 'Done' : 'Add', body,
      onOk: (m, close) => { close(); toast('Shipping rate saved'); } });

    // toggle "More pricing options"
    const tog = ctrl.m.querySelector('[data-act="toggle-cond"]');
    const wrap = ctrl.m.querySelector('[data-cond-wrap]');
    if (tog) tog.onclick = () => {
      const open = wrap.style.display === 'none';
      wrap.style.display = open ? 'block' : 'none';
      tog.textContent = open ? 'Delete conditions' : 'More pricing options';
    };
    // charging-method radio toggle + swap min/max units
    const wireCond = () => ctrl.m.querySelectorAll('[data-radio="cond"]').forEach((el) => el.onclick = () => {
      const val = el.getAttribute('data-val');
      ctrl.m.querySelectorAll('[data-radio="cond"]').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
      const mm = ctrl.m.querySelector('[data-minmax]');
      if (mm) mm.innerHTML = val === 'weight' ? minMaxBlock('weight', false) : minMaxBlock('price', true);
    });
    wireCond();
  }

  // ===========================================================================
  // MODAL (shared) — mirrors the orders prototype modal
  // ===========================================================================
  function modal({ title, body, width, okText, onOk, extraLeft, onExtra, danger, hideCancel }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + esc(title) + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body" style="max-height:70vh;overflow:auto">' + body + '</div>' +
      '<div class="modal-foot" style="justify-content:' + (extraLeft ? 'space-between' : 'flex-end') + '">' +
        (extraLeft || '') +
        '<div class="flex gap-2">' + (hideCancel ? '' : '<button class="btn btn-default" data-cancel>Cancel</button>') +
        '<button class="btn ' + (danger ? '' : 'btn-primary') + '" ' + (danger ? 'style="background:var(--err);color:#fff"' : '') + ' data-ok>' + (okText || 'Save') + '</button></div></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    const cancelBtn = m.querySelector('[data-cancel]'); if (cancelBtn) cancelBtn.onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    const disc = m.querySelector('[data-disc]'); if (disc && onExtra) disc.onclick = () => onExtra(m, close);
    // generic radio/checkbox visual toggles inside modal (skip ones wired by caller)
    m.querySelectorAll('.set-radio:not([data-radio]), .set-radio2').forEach((el) => el.onclick = () => {
      const grp = el.parentElement;
      grp.querySelectorAll('.set-radio, .set-radio2').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
    return { m, close };
  }

  // ===========================================================================
  // ROUTER  (SPA: shell passes `rest` = the part after #/settings/)
  // sub-page ids: base | payments | currency | checkout | metafields |
  //   shippable-locations | shipping-rates. Deeper segments pre-seed drill state.
  // ===========================================================================
  function renderRoles() {
    const roles = [
      { name: 'Store owner', desc: 'Full access to the store, billing and staff.', members: 1, system: true },
      { name: 'Administrator', desc: 'Manage products, orders, customers, content and settings.', members: 2 },
      { name: 'Staff', desc: 'Manage products and orders; no access to settings.', members: 3 },
      { name: 'Fulfillment', desc: 'View and fulfill orders only.', members: 1 },
    ];
    root.innerHTML =
      '<div class="set-narrow" style="width:980px">' +
        '<div class="flex items-center justify-between" style="margin-bottom:16px">' +
          '<div><div class="page-title">Roles</div><div class="muted" style="font-size:13px;margin-top:4px">Define what each role can access, then assign roles to staff.</div></div>' +
          '<button class="btn btn-primary">Add role</button>' +
        '</div>' +
        '<div class="panel"><table class="tbl"><thead><tr><th>Role</th><th>Description</th><th class="num" style="width:120px">Members</th><th style="width:110px">Action</th></tr></thead><tbody>' +
          roles.map((r) => '<tr><td style="font-weight:500;color:var(--ink)">' + r.name + (r.system ? ' <span class="pill pill-gray" style="padding:1px 8px;font-size:11px"><span class="dot"></span>System</span>' : '') + '</td><td class="muted">' + r.desc + '</td><td class="num">' + r.members + '</td><td>' + (r.system ? '<span class="muted">--</span>' : '<span class="lnk">Edit</span>') + '</td></tr>').join('') +
        '</tbody></table></div>' +
      '</div>';
  }

  function renderStaff() {
    const staff = [
      { name: 'Emma Whitfield', email: 'emma@minilizm.com', role: 'Store owner', status: 'Active', last: '2026-06-06 09:12' },
      { name: 'Liam Carter', email: 'liam@minilizm.com', role: 'Administrator', status: 'Active', last: '2026-06-05 18:40' },
      { name: 'Sophia Nguyen', email: 'sophia@minilizm.com', role: 'Staff', status: 'Active', last: '2026-06-04 11:05' },
      { name: 'Noah Bennett', email: 'noah@minilizm.com', role: 'Fulfillment', status: 'Invited', last: '--' },
    ];
    const pillFor = (st) => st === 'Active' ? '<span class="pill pill-green"><span class="dot"></span>Active</span>' : '<span class="pill pill-orange"><span class="dot"></span>Invited</span>';
    root.innerHTML =
      '<div class="set-narrow" style="width:980px">' +
        '<div class="flex items-center justify-between" style="margin-bottom:16px">' +
          '<div><div class="page-title">Staff</div><div class="muted" style="font-size:13px;margin-top:4px">People who can log in and manage this store.</div></div>' +
          '<button class="btn btn-primary">Add staff</button>' +
        '</div>' +
        '<div class="panel"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th style="width:150px">Role</th><th style="width:120px">Status</th><th style="width:170px">Last login</th></tr></thead><tbody>' +
          staff.map((m) => '<tr><td style="font-weight:500;color:var(--ink)">' + m.name + '</td><td class="muted">' + m.email + '</td><td>' + m.role + '</td><td>' + pillFor(m.status) + '</td><td class="muted">' + m.last + '</td></tr>').join('') +
        '</tbody></table></div>' +
      '</div>';
  }

  const ROUTES = {
    base: renderBase,
    payments: renderPayments,
    currency: renderCurrency,
    checkout: renderCheckout,
    metafields: renderMetafields,
    'shippable-locations': renderLocations,
    'shipping-rates': renderRates,
    roles: renderRoles,
    staff: renderStaff,
  };

  let curRest = '';
  // settings dirty bar: any edit in the content flips the shell header to "You have unsaved changes"
  function wireDirty() {
    if (!root || root.__dirtyWired) return;
    root.__dirtyWired = true;
    const onEdit = () => {
      if (!window.SettingsChrome) return;
      window.SettingsChrome.setDirty(true, {
        onDiscard: () => { show(curRest); if (window.SettingsChrome) window.SettingsChrome.setDirty(false); },
        onUpdate: () => { toast('Updated successfully'); if (window.SettingsChrome) window.SettingsChrome.setDirty(false); },
      });
    };
    root.addEventListener('input', onEdit);
    root.addEventListener('change', onEdit);
  }
  function show(rest) {
    curRest = rest || '';
    const parts = String(rest || '').split('/').filter(Boolean);
    const key = ROUTES[parts[0]] ? parts[0] : 'base';
    const sub = parts[1];
    // reset / seed drill-down sub-states for the active sub-page
    mfResource = (key === 'metafields' && sub) ? decodeURIComponent(sub) : null;
    rateProfile = (key === 'shipping-rates' && sub != null && sub !== '')
      ? (sub === 'new' ? 'new' : Number(decodeURIComponent(sub))) : null;
    ROUTES[key]();
    wireDirty();
    if (root && root.parentElement) root.parentElement.scrollTop = 0;
  }

  // ===========================================================================
  // page-scoped styles (Settings-only widgets layered on top of theme.css)
  // ===========================================================================
  const STYLES = `
  /* centered forms mirror the real admin's w-[860px] pages */
  .set-narrow { width: 860px; max-width: 100%; margin: 0 auto; }

  /* switch */
  .set-switch { display: inline-flex; align-items: center; width: 40px; height: 22px; border-radius: 9999px; background: var(--ctl); cursor: pointer; transition: background .15s; flex: none; padding: 2px; }
  .set-switch.on { background: var(--brand); }
  .set-knob { width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgb(0 0 0 / 20%); }
  .set-switch.on .set-knob { transform: translateX(18px); }

  /* upload tile */
  .up-tile { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 104px; height: 104px; border: 1px dashed var(--ctl); border-radius: 8px; background: var(--panel); color: var(--ink-muted); cursor: pointer; }
  .up-tile:hover { border-color: var(--brand); color: var(--brand); }
  .up-plus { display: inline-flex; }
  .up-add { font-size: 11.5px; }
  .up-tile.filled { border-style: solid; background: #fff; position: relative; color: var(--ink-body); }
  .up-ico { color: var(--brand); }
  .up-name { font-size: 10.5px; max-width: 88px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .up-x { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 6px; border: none; background: rgba(0,0,0,.45); color: #fff; display: grid; place-items: center; cursor: pointer; }

  /* input addon (suffix/prefix) */
  .set-addon { display: inline-flex; align-items: stretch; }
  .set-addon .input { border-radius: var(--radius); }
  .set-addon-suffix, .set-addon-prefix { display: inline-flex; align-items: center; padding: 0 12px; border: 1px solid var(--ctl); background: var(--panel); font-size: 13px; color: var(--ink-body); }
  .set-addon-suffix { border-left: none; border-top-right-radius: var(--radius); border-bottom-right-radius: var(--radius); }
  .set-addon-prefix { border-right: none; border-top-left-radius: var(--radius); border-bottom-left-radius: var(--radius); }

  .set-range { flex: 1; accent-color: var(--brand); height: 4px; }

  /* note / banner box */
  .set-note { background: var(--panel); border: 1px solid var(--hair); border-radius: 10px; padding: 14px 16px; }

  /* payments */
  .pay-chip { display: inline-flex; align-items: center; padding: 2px 8px; margin: 0 4px 4px 0; border: 1px solid var(--hair); border-radius: 6px; font-size: 11px; color: var(--ink-body); background: #fff; }
  .prov-card { border: 1px solid var(--hair); border-radius: 10px; padding: 14px 16px; }
  .proc-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--ctl); display: inline-grid; place-items: center; flex: none; }
  .set-radio.on .proc-radio, .set-radio2.on .proc-radio { border-color: var(--brand); }
  .proc-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand); }
  .set-radio { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; }
  .set-radio2 { display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; padding: 8px 10px; border: 1px solid var(--hair); border-radius: 8px; }
  .set-radio2.on { border-color: var(--brand); background: #e6f0ff; }

  /* currency flag chip */
  .ccy-flag { display: inline-grid; place-items: center; width: 22px; height: 16px; border-radius: 3px; background: var(--panel); border: 1px solid var(--hair); font-size: 9px; font-weight: 700; color: var(--ink-muted); letter-spacing: -.02em; }

  /* metafields */
  .mf-res { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 14px; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); cursor: pointer; }
  .mf-res:hover { background: #f1f3f8; }
  .mf-res-ico { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px; background: #fff; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; font-size: 11px; font-weight: 600; }
  .mf-grip { cursor: move; color: var(--ink-muted); display: inline-flex; }
  .mf-type-ico { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 5px; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; }
  .mf-blank-ico { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #e6f0ff; color: var(--brand); }

  /* icon button (table row actions / dropdown trigger) */
  .set-icon-btn { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; border: none; background: transparent; color: var(--ink-muted); cursor: pointer; }
  .set-icon-btn:hover { background: var(--panel); color: var(--ink); }
  .set-icon-btn.danger:hover { color: var(--err); }

  /* shippable locations table */
  .loc-table tbody tr { cursor: default; }
  .loc-caret { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; padding: 0; border: none; background: transparent; cursor: pointer; color: var(--ink-muted); transition: transform .15s; flex: none; }
  .loc-caret.open { transform: rotate(90deg); }

  /* dropdown row menu */
  .row-menu { position: absolute; z-index: 95; min-width: 120px; background: #fff; border: 1px solid var(--hair); border-radius: 8px; box-shadow: var(--float-shadow); padding: 4px; }
  .row-menu-item { display: block; width: 100%; text-align: left; padding: 7px 10px; border: none; background: transparent; font-size: 13px; color: var(--ink-body); border-radius: 6px; cursor: pointer; }
  .row-menu-item:hover { background: var(--panel); }
  .row-menu-item.danger { color: var(--err); }

  /* shipping rates */
  .rate-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); cursor: pointer; }
  .rate-row:hover { background: #f1f3f8; }
  .rate-ico { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: #fff; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; }
  .zone-block { border: 1px solid var(--hair); border-radius: 12px; padding: 14px 16px; }
  .zone-ico { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 7px; background: #e6f0ff; color: var(--brand); flex: none; }
  .rate-list { border: 1px solid var(--hair); border-radius: 8px; overflow: hidden; }
  .rate-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #fff; border-bottom: 1px solid var(--hair); }
  .rate-item:last-child { border-bottom: none; }
  .rate-empty { border: 1px solid var(--hair); border-radius: 8px; background: var(--panel); padding: 16px; text-align: center; }
  .rate-free { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: var(--ok-bg); color: #00684a; font-size: 12px; font-weight: 600; }
  .rate-price { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: #e6f0ff; color: #0058c4; font-size: 12px; font-weight: 600; }
  .prod-thumb { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 6px; background: var(--panel); border: 1px solid var(--hair); color: var(--ink-muted); font-size: 10px; flex: none; }

  /* checkout preview (rate modal) */
  .checkout-preview { background: var(--panel); border-radius: 8px; padding: 14px; }
  .checkout-preview-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid var(--hair); border-radius: 8px; padding: 10px 14px; }

  /* zone region picker */
  .zone-region-pick { max-height: 220px; overflow: auto; border: 1px solid var(--hair); border-radius: 8px; padding: 8px 12px; }

  /* preview modal frame */
  .preview-frame { display: grid; place-items: center; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); }
  `;

  // ---- SPA registration (the shell drives render + renders the sidebar) ----
  window.VIEWS = window.VIEWS || {};
  window.VIEWS.settings = { render: function (el, rest) { root = el; show(rest || 'base'); } };
})();
