/* BestShopio Admin · Settings prototype — SPA sub-module of the shared shell.
   When the route is #/settings/* the shell (../assets/shell.js) renders the
   settings sidebar (7 items) + a "Settings" bar with a close X, then mounts this
   module via window.VIEWS.settings.render(rootEl, rest). This file renders ONLY
   the content of the active settings sub-page into #root (full width — NO internal
   left sub-nav). `rest` (the part after #/settings/) selects the sub-page.
   Mirrors reference/bestvoy-admin web-antd settings/** field shapes.
   SECURITY: secret fields render masked placeholders only — never plaintext keys. */
(function () {
  const D = window.DATA_SETTINGS;
  let root; // set by the SPA shell router via VIEWS.settings.render(el, rest)

  // tiny html -> element helper (same pattern as orders prototype)
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);

  // ---- inline icons (match shell.js .nav-ico style) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    store:  svg('<path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>'),
    card:   svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    coins:  svg('<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>'),
    cart:   svg('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
    braces: svg('<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>'),
    pin:    svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
    truck:  svg('<path d="M10 17h4V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>'),
    chevR:  svg('<path d="m9 18 6-6-6-6"/>', 16),
    chevL:  svg('<path d="m15 18-6-6 6-6"/>', 18),
    chevD:  svg('<path d="m6 9 6 6 6-6"/>', 14),
    plus:   svg('<path d="M12 5v14M5 12h14"/>', 16),
    upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>', 18),
    image:  svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L5 19"/>', 18),
    link:   svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>', 14),
    x:      svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    globe:  svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18"/>', 16),
    check:  svg('<path d="M20 6 9 17l-5-5"/>', 14),
    tagSm:  svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 14),
    grid:   svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>', 14),
  };

  // ---- toast (same as orders) ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ===== shared small builders (reuse theme classes) =====
  const linkedPill = (linked) => linked
    ? '<span class="pill pill-green"><span class="dot"></span>Linked</span>'
    : '<span class="pill pill-gray"><span class="dot"></span>Not linked</span>';

  const sectionTitle = (t, sub) =>
    '<div class="card-title">' + esc(t) + '</div>' + (sub ? '<div class="muted" style="font-size:12.5px;margin-top:2px">' + esc(sub) + '</div>' : '');

  // a soft inner row block (mirrors the .b-c framed rows in the admin)
  const block = (inner) => '<div style="border:1px solid var(--hair);border-radius:10px;padding:14px 16px">' + inner + '</div>';

  // a toggle switch styled like Ant's Switch
  let sw = 0;
  const toggle = (on, label) => {
    const id = 'sw' + (++sw);
    return '<label class="set-switch' + (on ? ' on' : '') + '" data-toggle="' + id + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '><span class="set-knob"></span></label>';
  };

  // masked secret field — value is shown read-only & masked; never plaintext
  const secretField = (f) => {
    const masked = f.secret;
    const val = f.value || '';
    const display = val
      ? '<input class="input" value="' + esc(val) + '" readonly style="padding-right:84px;background:var(--panel)" />'
      : '<input class="input" placeholder="Not set" readonly style="background:var(--panel)" />';
    const badge = masked
      ? '<span class="mask-badge">Hidden</span>'
      : (val ? '' : '');
    return '<div style="margin-bottom:12px">' +
      '<div class="ctrl-label" style="text-transform:none;margin-bottom:6px">' + esc(f.label) +
        (f.learnMore ? '<a class="lnk" href="' + esc(f.learnMore) + '" target="_blank" rel="noreferrer" style="font-weight:400">Learn more</a>' : '') +
      '</div>' +
      '<div style="position:relative">' + display + badge + '</div>' +
    '</div>';
  };

  // ===========================================================================
  // PAINT: the shell already renders the settings sidebar + "Settings" bar, so
  // we render ONLY the active sub-page content into #root (full width, no rail).
  // ===========================================================================
  function renderShell(_activeTab, bodyHtml) {
    root.innerHTML =
      '<style>' + STYLES + '</style>' +
      '<div class="set-body">' + bodyHtml + '</div>';

    // wire generic toggles (visual only)
    root.querySelectorAll('[data-toggle]').forEach((el) => el.onclick = () => el.classList.toggle('on'));
  }

  // a per-tab header inside the content body
  const bodyHead = (title, sub, rightHtml) =>
    '<div class="flex items-start justify-between mb-4" style="gap:12px">' +
      '<div><div class="page-title" style="font-size:18px">' + esc(title) + '</div>' +
        (sub ? '<div class="muted" style="font-size:13px;margin-top:2px">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="flex items-center gap-2">' + (rightHtml || '') + '</div>' +
    '</div>';

  const updateBtn = '<button class="btn btn-primary" data-act="save">Update</button>';

  // ===========================================================================
  // TAB 1 — BASE
  // ===========================================================================
  function renderBase() {
    const b = D.base;

    // upload widget with optional preview
    const uploadCard = (u, label, desc) => {
      const tile = u.set
        ? '<div class="up-tile filled"><span class="up-ico">' + I.image + '</span><span class="up-name">' + esc(u.name) + '</span>' +
            '<button class="up-x" title="Remove">' + I.x + '</button></div>'
        : '<div class="up-tile"><span class="up-plus">' + I.plus + '</span><span class="up-add">Add image</span></div>';
      return block(
        '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">' + esc(label) + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-bottom:10px">' + esc(desc) +
          ' <a class="lnk" data-act="preview">Preview display here.</a>' +
          ' Recommended size: ' + esc(u.rec) + ', format: ' + esc(u.format) + '.</div>' +
        tile
      );
    };

    const fontTags = b.store.fonts.map((f) =>
      '<span class="field-pill">' + esc(f) + ' <span class="x" data-font="' + esc(f) + '">&times;</span></span>').join('');

    const storeCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Store information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          uploadCard(b.store.logo, 'Store logo', 'This logo is displayed on the store.') +
          uploadCard(b.store.favicon, 'Store favicon', 'The icon displayed in the browser window.') +
          uploadCard(b.store.noData, 'No data icon', 'Shown on empty states across the store.') +
          block(
            '<div class="flex items-center justify-between mb-1">' +
              '<div><div class="text-sm" style="font-weight:600;color:var(--ink)">Store font</div>' +
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
          prodRow(b.product.reviews, 'Product reviews') +
          prodRow(b.product.original, 'Original price') +
          prodRow(b.product.vendor, 'Product vendor') +
        '</div>' +
      '</div>';

    const orderCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Order information') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:2px">Order ID prefix</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:8px">Order ID starts from 1001 by default. Add a prefix to create custom IDs, e.g. "EN1001".</div>' +
            '<input class="input" id="ord-prefix" maxlength="10" value="' + esc(b.order.prefix) + '" style="width:300px" />' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Will be displayed as <span class="subtle" id="ord-prefix-eg">' + esc(b.order.prefix) + '1001, ' + esc(b.order.prefix) + '1002, ' + esc(b.order.prefix) + '1003…</span></div>'
          ) +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Order auto-cancel time</div>' +
            '<div class="set-addon"><input class="input" type="number" value="' + b.order.autoCancelMinutes + '" min="1" max="1440" style="border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Minutes</span></div>' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Duration for "To pay" orders after Place order.</div>'
          ) +
          block(
            '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Order auto-receive time</div>' +
            '<div class="set-addon"><input class="input" type="number" value="' + b.order.autoReceiveDays + '" min="1" max="100" style="border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Days</span></div>' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Orders are auto-received a set number of days after shipping.</div>'
          ) +
        '</div>' +
      '</div>';

    const socialRow = (s) =>
      '<div class="flex items-center justify-between" style="padding:12px 0;border-top:1px solid var(--hair)">' +
        '<div class="flex items-center gap-3">' + I.globe +
          '<span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(s.name) + '</span>' + linkedPill(s.linked) +
        '</div>' +
        '<button class="btn btn-gray" data-social="' + s.key + '">' + (s.linked ? 'Edit' : 'Link') + '</button>' +
      '</div>';
    const socialCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Login through social media', 'After connecting, customers can log in to the store with their social media accounts.') +
        '<div class="mt-2" style="border-bottom:1px solid var(--hair)">' + b.social.map(socialRow).join('') + '</div>' +
      '</div>';

    const a = b.analytics;
    const analyticsCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Data analysis', 'Track store traffic and conversions with Google Analytics (GA4).') +
        '<div class="mt-2" style="border-top:1px solid var(--hair)">' +
          '<div class="flex items-center justify-between" style="padding:12px 0">' +
            '<div class="flex items-center gap-3">' + I.globe +
              '<span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(a.name) + '</span>' + linkedPill(a.linked) +
              (a.linked ? '<span class="muted" style="font-size:12.5px;font-variant-numeric:tabular-nums">' + esc(a.measurementId) + '</span>' : '') +
            '</div>' +
            '<button class="btn btn-gray" data-act="ga4">' + (a.linked ? 'Edit' : 'Link') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    renderShell('base',
      bodyHead('Base', 'Store identity, product/order behavior, social login and analytics.', updateBtn) +
      storeCard + productCard + orderCard + socialCard + analyticsCard +
      '<div class="flex justify-end">' + updateBtn + '</div>'
    );

    // wiring
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Settings updated'));
    root.querySelectorAll('[data-act="preview"]').forEach((b2) => b2.onclick = () => toast('Preview — shows where this asset appears on the storefront'));
    const addFont = root.querySelector('[data-act="add-font"]'); if (addFont) addFont.onclick = () => openAddFontModal();
    root.querySelectorAll('[data-font]').forEach((x) => x.onclick = () => toast('Removed font ' + x.getAttribute('data-font')));
    root.querySelectorAll('[data-social]').forEach((b2) => b2.onclick = () => openSocialModal(b2.getAttribute('data-social')));
    const ga = root.querySelector('[data-act="ga4"]'); if (ga) ga.onclick = () => openAnalyticsModal();
    const pfx = root.querySelector('#ord-prefix');
    if (pfx) pfx.oninput = () => { const v = pfx.value || ''; const eg = root.querySelector('#ord-prefix-eg'); if (eg) eg.textContent = v + '1001, ' + v + '1002, ' + v + '1003…'; };
  }

  function openAddFontModal() {
    const opts = D.base.store.fontOptions.map((f) => {
      const on = D.base.store.fonts.includes(f);
      return '<label class="edit-check" style="padding:7px 0"><input type="checkbox" ' + (on ? 'checked' : '') + ' /><span>' + esc(f) + '</span></label>';
    }).join('');
    modal({ title: 'Add font', width: 460, okText: 'Confirm',
      body: '<div class="muted mb-2" style="font-size:13px">Choose fonts to make available across your storefront.</div>' + opts,
      onOk: (m, close) => { close(); toast('Store fonts updated'); } });
  }
  function openSocialModal(key) {
    const s = D.base.social.find((x) => x.key === key);
    const body =
      '<div class="muted mb-4" style="font-size:13px">' + esc(s.desc) + '</div>' +
      field('App ID', s.fields.appId, 'Please enter App ID') +
      field('App Secret', s.fields.appSecret, 'Please enter App Secret', true) +
      field('Redirect URIs', s.fields.redirectUris, "Enter your store's homepage URL");
    modal({ title: 'Connect ' + s.name.replace(' login', '') + ' developer account', width: 560, okText: 'Save',
      body, onOk: (m, close) => { close(); toast(s.name + (s.linked ? ' updated' : ' connected')); },
      extraLeft: s.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast(s.name + ' disconnected'); } });
  }
  function openAnalyticsModal() {
    const a = D.base.analytics;
    modal({ title: 'Connect Google Analytics', width: 560, okText: 'Save',
      body: '<div class="muted mb-4" style="font-size:13px">' + esc(a.desc) + '</div>' + field('Measurement Id', a.measurementId, 'Please enter Measurement Id'),
      onOk: (m, close) => { close(); toast('Google Analytics updated'); },
      extraLeft: a.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast('Google Analytics disconnected'); } });
  }

  // editable text field for a modal (NOT masked — used for non-secret + secret shows masked value)
  function field(label, value, placeholder, secret) {
    const v = value || '';
    return '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">' + esc(label) + ' <span style="color:var(--err)">*</span></div>' +
      '<input class="input" value="' + esc(v) + '" placeholder="' + esc(placeholder || '') + '" />' +
      (secret && v ? '<div class="muted" style="font-size:11.5px;margin-top:4px">Stored securely · value is masked</div>' : '') +
      '</div>';
  }

  // ===========================================================================
  // TAB 2 — PAYMENTS  (one card processor active at a time)
  // ===========================================================================
  function renderPayments() {
    const p = D.payments;
    const active = p.activeProcessor;

    const methodChips = (arr) => arr.map((m) => '<span class="pay-chip">' + esc(m) + '</span>').join('');

    // processor switch (radio-style)
    const procOpt = (key) => {
      const prov = p.providers[key];
      const on = active === key;
      return '<label class="proc-opt' + (on ? ' on' : '') + '" data-proc="' + key + '">' +
        '<span class="proc-radio">' + (on ? '<span class="proc-dot"></span>' : '') + '</span>' +
        '<span class="text-sm" style="font-weight:600;color:var(--ink)">' + esc(prov.name) + '</span>' +
      '</label>';
    };

    // a provider config card (shows fields per provider; secrets masked)
    const providerCard = (prov, isActiveCard) => {
      const dim = isActiveCard ? '' : ' style="opacity:.55"';
      const fields = prov.fields.map(secretField).join('');
      const extra = prov.extraMethods && prov.extraMethods.length
        ? '<div class="muted" style="font-size:12px;margin-top:8px">Plus: ' + methodChips(prov.extraMethods) + '</div>' : '';
      return '<div class="prov-card"' + dim + '>' +
        '<div class="flex items-center justify-between mb-3">' +
          '<div class="flex items-center gap-2"><span class="card-title">' + esc(prov.name) + '</span>' + linkedPill(prov.linked) +
            (isActiveCard ? '<span class="pill pill-blue"><span class="dot"></span>Active processor</span>' : '') + '</div>' +
          '<button class="btn btn-gray" data-prov="' + prov.key + '">' + (prov.linked ? 'Edit' : 'Link') + '</button>' +
        '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-bottom:10px">' + esc(prov.blurb) + '</div>' +
        '<div class="mb-3">' + methodChips(p.cardMethods) + '</div>' + extra +
        '<div class="divider" style="margin:12px 0"></div>' +
        fields +
      '</div>';
    };

    const stripe = p.providers.stripe, air = p.providers.airwallex;
    const cardProcessorCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Card payments & Express Checkout') +
        '<div class="set-note mt-3 mb-4">' +
          '<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:6px">Payment processor</div>' +
          '<div class="flex items-center gap-2">' + procOpt('stripe') + procOpt('airwallex') + '</div>' +
          '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.5">Choose which processor handles Card, Apple Pay and Google Pay. Only one can be active at a time. Switching processors requires re-entering credentials and Apple Pay domain re-verification.</div>' +
        '</div>' +
        '<div class="flex flex-col gap-4">' +
          providerCard(stripe, active === 'stripe') +
          providerCard(air, active === 'airwallex') +
        '</div>' +
      '</div>';

    const pp = p.paypal;
    const paypalCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('PayPal', 'An independent wallet method — connected separately from the card processor.') +
        '<div class="prov-card mt-3">' +
          '<div class="flex items-center justify-between mb-3">' +
            '<div class="flex items-center gap-2"><span class="card-title">' + esc(pp.name) + '</span>' + linkedPill(pp.linked) +
              '<span class="pill pill-gray"><span class="dot"></span>Mode: ' + esc(pp.mode) + '</span></div>' +
            '<button class="btn btn-gray" data-prov="paypal">' + (pp.linked ? 'Edit' : 'Link') + '</button>' +
          '</div>' +
          '<div class="muted" style="font-size:12.5px;margin-bottom:10px">' + esc(pp.blurb) + '</div>' +
          '<div class="divider" style="margin:4px 0 12px"></div>' +
          pp.fields.map(secretField).join('') +
        '</div>' +
      '</div>';

    renderShell('payments',
      bodyHead('Payments', 'Activate one card processor at a time; connect PayPal separately.', updateBtn) +
      cardProcessorCard + paypalCard +
      '<div class="flex justify-end">' + updateBtn + '</div>'
    );

    // switch processor (re-render so the active card highlights / un-dims)
    root.querySelectorAll('[data-proc]').forEach((el) => el.onclick = () => {
      const key = el.getAttribute('data-proc');
      if (key === D.payments.activeProcessor) return;
      D.payments.activeProcessor = key;
      renderPayments();
      toast('Switched card processor to ' + D.payments.providers[key].name + ' — re-enter credentials to finish');
    });
    root.querySelectorAll('[data-prov]').forEach((b2) => b2.onclick = () => openProviderModal(b2.getAttribute('data-prov')));
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Payments updated'));
  }

  function openProviderModal(key) {
    const p = D.payments;
    const prov = key === 'paypal' ? p.paypal : p.providers[key];
    const body =
      '<div class="muted mb-4" style="font-size:13px">' + esc(prov.blurb) + '</div>' +
      prov.fields.map((f) => field(f.label, f.value, 'Please enter ' + f.label, f.secret)).join('') +
      (key === 'paypal'
        ? '<div style="margin-top:4px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Mode</div>' +
          '<label class="set-radio' + (prov.mode === 'live' ? ' on' : '') + '" style="margin-right:16px"><span class="proc-radio">' + (prov.mode === 'live' ? '<span class="proc-dot"></span>' : '') + '</span>Live</label>' +
          '<label class="set-radio' + (prov.mode === 'sandbox' ? ' on' : '') + '"><span class="proc-radio">' + (prov.mode === 'sandbox' ? '<span class="proc-dot"></span>' : '') + '</span>Sandbox</label></div>'
        : '');
    modal({ title: 'Connect ' + prov.name + (key === 'paypal' || key === 'airwallex' ? ' developer account' : ' account'), width: 600, okText: 'Save',
      body, onOk: (m, close) => { close(); toast(prov.name + (prov.linked ? ' updated' : ' connected')); },
      extraLeft: prov.linked ? '<button class="btn" style="background:var(--err);color:#fff" data-disc>Cancel connection</button>' : '',
      onExtra: (m, close) => { close(); toast(prov.name + ' disconnected'); } });
  }

  // ===========================================================================
  // TAB 3 — CURRENCY  (multi-currency table + edit modal)
  // ===========================================================================
  function renderCurrency() {
    const c = D.currency;
    const rows = c.list.map((r) =>
      '<tr data-cid="' + r.id + '">' +
        '<td><div class="flex items-center gap-2"><span class="ccy-flag">' + esc(r.code.slice(0, 2)) + '</span>' +
          '<span class="subtle" style="font-weight:500">' + esc(r.country) + '</span>' +
          (r.base ? '<span class="pill pill-gray" style="padding:2px 8px;font-size:11px">Base</span>' : '') + '</div></td>' +
        '<td>' + esc(r.code) + '</td>' +
        '<td>' + esc(r.symbol) + '</td>' +
        '<td>' + toggle(r.status === 1, r.code + ' status') + '</td>' +
        '<td>' + esc(r.rateType) + '</td>' +
        '<td class="num">' + esc(r.rate) + '</td>' +
        '<td class="muted">' + esc(r.rounding) + '</td>' +
        '<td style="text-align:right"><button class="lnk" data-edit-ccy="' + r.id + '">Edit</button></td>' +
      '</tr>').join('');

    const table =
      '<div class="panel">' +
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:900px">' +
          '<thead><tr><th>Country</th><th>Currency code</th><th>Currency symbol</th><th>Status</th><th>Exchange rate</th><th class="num">Rate</th><th>Price rounding</th><th style="text-align:right">Action</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
      '</div>';

    renderShell('currency',
      bodyHead('Currency', 'Default currency: ' + c.defaultCurrency + '. Enable currencies and set exchange rates.') +
      table
    );

    root.querySelectorAll('[data-edit-ccy]').forEach((b2) => b2.onclick = (e) => { e.stopPropagation(); openCurrencyEdit(Number(b2.getAttribute('data-edit-ccy'))); });
    root.querySelectorAll('#root tr[data-cid]').forEach((tr) => tr.onclick = () => openCurrencyEdit(Number(tr.getAttribute('data-cid'))));
  }

  function openCurrencyEdit(id) {
    const r = D.currency.list.find((x) => x.id === id);
    if (!r) return;
    const auto = r.rateType === 'Automatic';
    const radio = (on, label, sub) =>
      '<label class="set-radio2' + (on ? ' on' : '') + '"><span class="proc-radio">' + (on ? '<span class="proc-dot"></span>' : '') + '</span>' +
      '<span><span class="subtle" style="font-weight:500">' + esc(label) + '</span>' + (sub ? '<div class="muted" style="font-size:12px;margin-top:2px">' + esc(sub) + '</div>' : '') + '</span></label>';
    const body =
      block('<div class="flex gap-8 text-sm"><div><span class="muted">Currency code:</span> <span class="subtle" style="font-weight:500">' + esc(r.code) + '</span></div>' +
            '<div><span class="muted">Currency symbol:</span> <span class="subtle" style="font-weight:500">' + esc(r.symbol) + '</span></div></div>') +
      '<div class="ctrl-label" style="margin:16px 0 8px">Exchange rate</div>' +
      '<div class="flex flex-col gap-2">' +
        radio(auto, 'Using automatic exchange rates', 'Price changes automatically with the market rate; 0% conversion fee. 1 USD = ' + r.rate + ' ' + r.code + '.') +
        radio(!auto, 'Use manual exchange rates', 'Customized exchange rate, no conversion fees.') +
      '</div>' +
      '<div class="mt-2 flex items-center gap-2" style="' + (auto ? 'opacity:.5' : '') + '"><span class="muted text-sm">1 USD =</span>' +
        '<div class="set-addon"><input class="input" type="number" value="' + esc(r.rate) + '" step="0.0001" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">' + esc(r.code) + '</span></div></div>' +
      '<div class="ctrl-label" style="margin:18px 0 8px">Price rounding</div>' +
      '<div class="muted text-sm">' + esc(r.rounding) + '</div>' +
      '<div class="ctrl-label" style="margin:18px 0 8px">Price decimal</div>' +
      '<div class="flex gap-3">' + [0, 1, 2].map((d) => '<label class="set-radio' + (r.decimal === d ? ' on' : '') + '"><span class="proc-radio">' + (r.decimal === d ? '<span class="proc-dot"></span>' : '') + '</span>' + d + '</label>').join('') + '</div>';
    modal({ title: r.country, width: 560, okText: 'Update', body, onOk: (m, close) => { close(); toast(r.code + ' exchange settings updated'); } });
  }

  // ===========================================================================
  // TAB 4 — CHECKOUT
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
            '<div class="muted" style="font-size:12.5px;margin-bottom:10px">Displayed on the Checkout page. <a class="lnk" data-act="preview">Preview display here.</a> Format: png. If none is uploaded, the Store logo is used by default.</div>' +
            '<div class="up-tile"><span class="up-plus">' + I.plus + '</span><span class="up-add">Add image</span></div>'
          ) +
          block(
            '<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:72px">Width</div>' +
            '<input type="range" min="50" max="300" value="' + c.logo.width + '" class="set-range" id="logo-w" />' +
            '<div class="set-addon"><input class="input" type="number" value="' + c.logo.width + '" id="logo-w-num" min="50" max="300" style="width:120px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">px</span></div></div>'
          ) +
          block('<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:120px">Logo alignment</div><div>' + radioGroup('align', c.logo.alignmentOptions, c.logo.alignment) + '</div></div>') +
          block('<div class="flex items-center gap-4"><div class="text-sm" style="font-weight:600;color:var(--ink);width:120px">Logo position</div><div>' + radioGroup('pos', c.logo.positionOptions, c.logo.position) + '</div></div>') +
        '</div>' +
      '</div>';

    const cartCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Cart rules') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block('<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Minimum order amount</span>' + toggle(c.cart.minOrderEnabled, 'Minimum order') + '</div>' +
            '<div class="muted" style="font-size:12.5px;margin-bottom:8px">Block checkout below this subtotal.</div>' +
            '<div class="set-addon"><span class="set-addon-prefix">$</span><input class="input" type="number" value="' + c.cart.minOrderAmount + '" style="width:160px;border-top-left-radius:0;border-bottom-left-radius:0" /></div>') +
          block('<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Maximum quantity per item</div>' +
            '<input class="input" type="number" value="' + c.cart.maxQtyPerItem + '" style="width:160px" />' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Caps how many units of a single product a buyer can add.</div>') +
          block('<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Auto-empty abandoned cart</div>' +
            '<div class="set-addon"><input class="input" type="number" value="' + c.cart.autoEmptyHours + '" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Hours</span></div>') +
        '</div>' +
      '</div>';

    const shipCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Shipping method at checkout') +
        '<div class="mt-3">' + radioGroup('shipmethod', c.shippingMethodOptions, c.shippingMethod) + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:8px">Controls how shipping options are presented. Flat rates are managed in the Shipping rates tab.</div>' +
      '</div>';

    const noteCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Order note') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block('<div class="flex items-center justify-between"><div class="flex items-center gap-3"><span class="text-sm" style="font-weight:600;color:var(--ink)">Show order note field</span>' + toggle(c.orderNote.enabled, 'Order note') + '</div>' +
            '<label class="edit-check" style="padding:0"><input type="checkbox" ' + (c.orderNote.required ? 'checked' : '') + ' /><span class="muted">Required</span></label></div>') +
          block('<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Field label</div><input class="input" value="' + esc(c.orderNote.label) + '" style="max-width:360px" />') +
          block('<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Placeholder</div><input class="input" value="' + esc(c.orderNote.placeholder) + '" />' +
            '<div class="muted" style="font-size:12.5px;margin-top:6px">Max length: ' + c.orderNote.maxLength + ' characters.</div>') +
        '</div>' +
      '</div>';

    const giftCard =
      '<div class="panel card-pad mb-4">' + sectionTitle('Gift card') +
        '<div class="mt-4 flex flex-col gap-4">' +
          block('<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Enable gift cards</span>' + toggle(c.giftCard.enabled, 'Gift cards') + '</div><div class="muted" style="font-size:12.5px">Sell gift cards and let buyers redeem them.</div>') +
          block('<div class="flex items-center gap-3 mb-1"><span class="text-sm" style="font-weight:600;color:var(--ink)">Allow redemption at checkout</span>' + toggle(c.giftCard.allowAtCheckout, 'Redeem at checkout') + '</div><div class="muted" style="font-size:12.5px">Show a gift-card / discount code box on the checkout page.</div>') +
          block('<div class="text-sm" style="font-weight:600;color:var(--ink);margin-bottom:8px">Gift card expiry</div><div class="set-addon"><input class="input" type="number" value="' + c.giftCard.expiryMonths + '" style="width:140px;border-top-right-radius:0;border-bottom-right-radius:0" /><span class="set-addon-suffix">Months</span></div>') +
        '</div>' +
      '</div>';

    renderShell('checkout',
      bodyHead('Checkout', 'Checkout branding, cart rules, shipping presentation, order note and gift card.', updateBtn) +
      logoCard + cartCard + shipCard + noteCard + giftCard +
      '<div class="flex justify-end">' + updateBtn + '</div>'
    );

    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Checkout settings updated'));
    root.querySelectorAll('[data-act="preview"]').forEach((b2) => b2.onclick = () => toast('Preview — shows where the checkout logo appears (PC + mobile)'));
    // radio group toggles (visual)
    root.querySelectorAll('[data-radio]').forEach((el) => el.onclick = () => {
      const name = el.getAttribute('data-radio');
      root.querySelectorAll('[data-radio="' + name + '"]').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
    // width slider <-> number sync
    const wr = root.querySelector('#logo-w'), wn = root.querySelector('#logo-w-num');
    if (wr && wn) { wr.oninput = () => { wn.value = wr.value; }; wn.oninput = () => { wr.value = wn.value; }; }
  }

  // ===========================================================================
  // TAB 5 — METAFIELDS  (definitions list per resource + add modal)
  //   sub-state: list of resources  ->  one resource's definitions
  // ===========================================================================
  let mfResource = null; // null = resource picker; else 'products' | 'variants'

  function renderMetafields() {
    const m = D.metafields;
    if (!mfResource) {
      const rows = m.resources.map((r) => {
        const count = (m.definitions[r.key] || []).length;
        return '<button class="mf-res" data-res="' + r.key + '">' +
          '<span class="mf-res-ico">' + (r.key === 'variants' ? I.grid : I.tagSm) + '</span>' +
          '<span style="flex:1;text-align:left"><span class="text-sm" style="font-weight:600;color:var(--ink);display:block">' + esc(r.title) + '</span>' +
          '<span class="muted" style="font-size:12.5px">' + esc(r.desc) + '</span></span>' +
          '<span class="muted" style="font-size:12.5px;margin-right:8px">' + count + ' definitions</span>' +
          '<span class="muted">' + I.chevR + '</span></button>';
      }).join('');
      renderShell('metafields',
        bodyHead('Metafields', 'Add custom fields to extend products and variants.') +
        '<div class="panel card-pad">' + sectionTitle('Metafield', 'Select a module to manage extended fields') +
          '<div class="mt-4 flex flex-col gap-2">' + rows + '</div>' +
        '</div>'
      );
      root.querySelectorAll('[data-res]').forEach((b2) => b2.onclick = () => { mfResource = b2.getAttribute('data-res'); renderMetafields(); });
      return;
    }

    const r = m.resources.find((x) => x.key === mfResource);
    const defs = m.definitions[mfResource] || [];
    const suffix = mfResource === 'variants' ? 'variants' : 'products';
    const rows = defs.map((d) =>
      '<tr>' +
        '<td><div class="flex items-center gap-2"><span class="subtle" style="font-weight:500">' + esc(d.name) + '</span>' +
          (d.system ? '<span class="pill pill-gray" style="padding:2px 8px;font-size:11px">System</span>' : '') + '</div>' +
          '<div class="muted" style="font-size:12px;font-variant-numeric:tabular-nums">' + esc(d.nsKey) + '</div></td>' +
        '<td><span class="src-tag src-Behavior" style="font-weight:400"><span class="dot"></span>' + esc(d.typeLabel) + '</span></td>' +
        '<td class="muted">' + d.usedIn + ' ' + suffix + '</td>' +
      '</tr>').join('');

    renderShell('metafields',
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="mf-back" title="Back">' + I.chevL + '</button>' +
          '<div><div class="page-title" style="font-size:18px">' + esc(r.title) + ' metafields</div>' +
          '<div class="muted" style="font-size:13px;margin-top:2px">' + esc(r.desc) + '</div></div>' +
        '</div>' +
        '<button class="btn btn-primary" data-act="mf-add">' + I.plus + ' Add fields</button>' +
      '</div>' +
      '<div class="panel"><div style="overflow-x:auto"><table class="tbl" style="min-width:680px">' +
        '<thead><tr><th>Name</th><th>Data type</th><th>Used in</th></tr></thead>' +
        '<tbody>' + (rows || '<tr><td colspan="3" style="text-align:center;padding:36px" class="muted">No definitions yet.</td></tr>') + '</tbody>' +
      '</table></div>' +
        '<div class="flex items-center justify-between card-pad"><span class="muted" style="font-size:13px">Total ' + defs.length + ' records</span></div>' +
      '</div>'
    );
    const back = root.querySelector('[data-act="mf-back"]'); if (back) back.onclick = () => { mfResource = null; renderMetafields(); };
    const add = root.querySelector('[data-act="mf-add"]'); if (add) add.onclick = () => openAddDefinition(r);
  }

  function openAddDefinition(resource) {
    const m = D.metafields;
    const typeOpts = m.typeOptions.map((g) =>
      '<optgroup label="' + esc(g.group) + '">' + g.types.map((t) => '<option value="' + t.type + '">' + esc(t.label) + '</option>').join('') + '</optgroup>').join('');
    const body =
      '<div class="muted mb-4" style="font-size:13px">Owner resource: <span class="subtle" style="font-weight:500">' + esc(resource.title) + '</span></div>' +
      field('Name', '', 'e.g. Care instructions') +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Namespace and key <span style="color:var(--err)">*</span></div>' +
        '<input class="input" placeholder="custom.key_name" />' +
        '<div class="muted" style="font-size:11.5px;margin-top:4px">Lowercase, format: namespace.key (e.g. custom.material).</div></div>' +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Type <span style="color:var(--err)">*</span></div>' +
        '<select class="input">' + typeOpts + '</select></div>' +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Description</div>' +
        '<textarea class="input" rows="2" placeholder="Optional" style="height:auto;padding:8px 12px;resize:vertical"></textarea></div>';
    modal({ title: 'Add metafield definition', width: 560, okText: 'Save', body, onOk: (mm, close) => { close(); toast('Definition added to ' + resource.title); } });
  }

  // ===========================================================================
  // TAB 6 — SHIPPABLE LOCATIONS  (checkable continent>country>state tree)
  // ===========================================================================
  function renderLocations() {
    const tree = D.locations.tree;

    // count selected leaves for the summary
    const collectSelected = (nodes, acc) => {
      nodes.forEach((n) => {
        if (n.shippable && (!n.children || n.children.length === 0)) acc.push(n.name);
        if (n.children) collectSelected(n.children, acc);
      });
      return acc;
    };
    const selectedCountries = [];
    tree.forEach((cont) => (cont.children || []).forEach((co) => { if (co.shippable) selectedCountries.push(co.name); }));

    const node = (n, depth) => {
      const pad = 12 + depth * 22;
      const hasKids = n.children && n.children.length;
      const caret = hasKids
        ? '<span class="loc-caret open" data-loc-toggle="' + n.id + '">' + I.chevD + '</span>'
        : '<span style="width:14px;display:inline-block"></span>';
      const cb = '<span class="loc-check' + (n.shippable ? ' on' : '') + '" data-loc-check="' + n.id + '">' + (n.shippable ? I.check : '') + '</span>';
      const code = n.code ? '<span class="muted" style="font-size:12px;margin-left:6px">' + esc(n.code) + '</span>' : '';
      const me = '<div class="loc-row" style="padding-left:' + pad + 'px">' + caret + cb +
        '<span class="subtle" style="font-weight:' + (depth === 0 ? '600' : '500') + '">' + esc(n.name) + '</span>' + code +
        '<span style="margin-left:auto">' + (n.shippable ? '<span class="pill pill-green" style="padding:2px 8px;font-size:11px">Shippable</span>' : '<span class="pill pill-gray" style="padding:2px 8px;font-size:11px">Off</span>') + '</span>' +
        '</div>';
      const kids = hasKids ? '<div class="loc-kids" data-loc-kids="' + n.id + '">' + n.children.map((c) => node(c, depth + 1)).join('') + '</div>' : '';
      return me + kids;
    };

    renderShell('locations',
      bodyHead('Shippable locations', 'Pick the countries and states you ship to. Unchecked regions are hidden at checkout.', '<button class="btn btn-primary" data-act="loc-add">' + I.plus + ' Add location</button>') +
      '<div class="set-note mb-4"><div class="flex items-center gap-2">' + I.pin +
        '<span class="text-sm subtle">Currently shipping to <span style="font-weight:600;color:var(--ink)">' + selectedCountries.length + '</span> countries / regions: ' +
        '<span class="muted">' + esc(selectedCountries.join(', ')) + '</span></span></div></div>' +
      '<div class="panel">' +
        '<div class="card-pad" style="padding-bottom:8px"><div class="flex items-center gap-2">' +
          '<input class="filter-input" placeholder="Search country or state" style="padding-left:12px" />' +
          '<select class="filter-select"><option>All status</option><option>Shippable</option><option>Off</option></select>' +
        '</div></div>' +
        '<div class="loc-tree">' + tree.map((c) => node(c, 0)).join('') + '</div>' +
      '</div>'
    );

    // expand/collapse
    root.querySelectorAll('[data-loc-toggle]').forEach((el) => el.onclick = () => {
      const id = el.getAttribute('data-loc-toggle');
      const kids = root.querySelector('[data-loc-kids="' + id + '"]');
      if (!kids) return;
      const open = el.classList.toggle('open');
      kids.style.display = open ? '' : 'none';
    });
    // check/uncheck (visual)
    root.querySelectorAll('[data-loc-check]').forEach((el) => el.onclick = () => {
      const on = el.classList.toggle('on');
      el.innerHTML = on ? I.check : '';
      const pill = el.parentElement.querySelector('.pill');
      if (pill) pill.outerHTML = on ? '<span class="pill pill-green" style="padding:2px 8px;font-size:11px">Shippable</span>' : '<span class="pill pill-gray" style="padding:2px 8px;font-size:11px">Off</span>';
    });
    const add = root.querySelector('[data-act="loc-add"]'); if (add) add.onclick = () => openLocationModal();
  }

  function openLocationModal() {
    const body =
      field('Location name', '', 'e.g. United States') +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Located in</div>' +
        '<select class="input"><option>Top level (continent)</option>' + D.locations.tree.map((c) => '<option>' + esc(c.name) + '</option>').join('') + '</select></div>' +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Region code</div><input class="input" placeholder="e.g. US-CA" /></div>' +
      '<label class="edit-check" style="padding:0"><input type="checkbox" checked /><span>Shippable (visible at checkout)</span></label>';
    modal({ title: 'Add location', width: 520, okText: 'Save', body, onOk: (m, close) => { close(); toast('Location added'); } });
  }

  // ===========================================================================
  // TAB 7 — SHIPPING RATES  (profiles -> profile detail with zones -> rates)
  // ===========================================================================
  let rateProfile = null; // null = list; else profile id

  function renderRates() {
    const data = D.rates;
    if (rateProfile == null) {
      const general = data.profiles.find((p) => p.general);
      const customs = data.profiles.filter((p) => !p.general);
      const profileRow = (p, withName) =>
        '<button class="rate-row" data-profile="' + p.id + '">' +
          '<span class="rate-ico">' + I.globe + '</span>' +
          '<span style="flex:1;text-align:left">' +
            (withName ? '<span class="text-sm" style="font-weight:600;color:var(--ink);display:block">' + esc(p.name) + '</span>' : '') +
            '<span class="muted" style="font-size:12.5px">' +
              (p.general ? 'Supported shipping ' + p.zones.length + ' zone(s)' : 'Includes ' + p.productsCount + ' product(s), ships to ' + p.regionsCount + ' region(s)') +
            '</span></span>' +
          '<span class="muted">' + I.chevR + '</span></button>';

      const generalCard =
        '<div class="panel card-pad mb-4">' + sectionTitle('General shipping rates', 'All products that are not in other shipping profiles.') +
          '<div class="mt-3">' + (general ? profileRow(general, false) : '') + '</div>' +
        '</div>';
      const customCard =
        '<div class="panel card-pad mb-4">' +
          '<div class="flex items-center justify-between mb-2"><div>' + sectionTitle('Custom shipping profiles', 'Create a profile to add custom rates for groups of products.') + '</div>' +
            '<button class="btn btn-primary" data-act="add-profile">Add</button></div>' +
          '<div class="mt-3 flex flex-col gap-3">' + (customs.length ? customs.map((p) => profileRow(p, true)).join('') : '<div class="muted text-sm" style="padding:8px 0">No custom profiles yet.</div>') + '</div>' +
        '</div>';

      renderShell('rates',
        bodyHead('Shipping rates', 'Set shipping fees at checkout via profiles, zones and rates.') +
        generalCard + customCard
      );
      root.querySelectorAll('[data-profile]').forEach((b2) => b2.onclick = () => { rateProfile = Number(b2.getAttribute('data-profile')); renderRates(); });
      const ap = root.querySelector('[data-act="add-profile"]'); if (ap) ap.onclick = () => toast('Add custom profile — name it, then add zones and products');
      return;
    }

    // ---- profile detail: zones -> rates + no-charge areas ----
    const p = data.profiles.find((x) => x.id === rateProfile);
    if (!p) { rateProfile = null; renderRates(); return; }
    const sym = data.currencySymbol;

    const rateRule = (rt) => {
      if (rt.condition_type === 'none') return 'All orders';
      if (rt.condition_type === 'price') {
        const mn = Number(rt.min_value || 0);
        return rt.max_value == null ? 'Orders ' + sym + mn.toFixed(2) + ' and up' : 'Orders ' + sym + mn.toFixed(2) + '–' + sym + Number(rt.max_value).toFixed(2);
      }
      const mn = Number(rt.min_value || 0);
      return rt.max_value == null ? 'Weight ' + mn.toFixed(0) + 'g and up' : 'Weight ' + mn.toFixed(0) + 'g–' + Number(rt.max_value).toFixed(0) + 'g';
    };
    const ratePrice = (rt) => rt.price === 0
      ? '<span class="rate-free">Free</span>'
      : '<span class="rate-price">' + sym + Number(rt.price).toFixed(2) + '</span>';

    const zoneBlock = (z) => {
      const rates = z.rates.length
        ? '<div class="rate-list">' + z.rates.map((rt) =>
            '<div class="rate-item"><div style="min-width:0"><div class="subtle" style="font-weight:500;font-size:13px">' + esc(rt.name) + '</div>' +
              '<div class="muted" style="font-size:12px">' + rateRule(rt) + '</div></div>' +
              '<div class="flex items-center gap-2">' + ratePrice(rt) + '<button class="lnk" data-edit-rate="' + z.id + ':' + rt.id + '">Edit</button></div></div>').join('') + '</div>'
        : '<div class="rate-empty"><div class="muted text-sm">No shipping rates found for this zone</div>' +
            '<div style="margin-top:8px"><button class="btn btn-primary" style="height:28px" data-add-rate="' + z.id + '">Add shipping rate</button></div>' +
            '<div style="margin-top:8px;font-size:12px;color:var(--err)">Add shipping so customers in this area can complete checkout.</div></div>';
      return '<div class="zone-block">' +
        '<div class="flex items-center justify-between">' +
          '<div class="flex items-center gap-2"><span class="zone-ico">' + I.truck + '</span><span class="subtle" style="font-weight:600">' + esc(z.name) + '</span></div>' +
          '<button class="btn btn-gray" style="height:28px" data-add-rate="' + z.id + '">Add rate</button>' +
        '</div>' +
        '<div class="muted" style="font-size:12px;margin:4px 0 10px">Includes deliveries to: ' + esc((z.areas || []).join(', ')) + '</div>' +
        rates +
      '</div>';
    };

    const zonesCard =
      '<div class="panel card-pad mb-4">' +
        '<div class="flex items-center justify-between mb-1"><div>' + sectionTitle('Shipping zones and rates', 'Zones and rates visible to customers at checkout.') + '</div>' +
          '<button class="btn btn-gray" data-act="add-zone">Add shipping zone</button></div>' +
        '<div class="mt-3 flex flex-col gap-3">' + p.zones.map(zoneBlock).join('') + '</div>' +
      '</div>';

    const noCharge =
      '<div class="panel card-pad mb-4">' + sectionTitle('Areas with no shipping charges added') +
        (p.noChargeAreas.length
          ? '<div class="muted" style="font-size:12.5px;margin-top:8px">' + p.noChargeAreas.length + ' countries/regions: ' + esc(p.noChargeAreas.join(', ')) + '</div>'
          : '<div class="muted text-sm" style="margin-top:8px">No data available</div>') +
      '</div>';

    renderShell('rates',
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="rate-back" title="Back">' + I.chevL + '</button>' +
          '<div class="flex items-center gap-2"><div class="page-title" style="font-size:18px">' + esc(p.name) + '</div>' +
            (p.general ? '<span class="pill pill-blue"><span class="dot"></span>General</span>' : '<span class="pill pill-gray"><span class="dot"></span>Custom</span>') + '</div>' +
        '</div>' +
        updateBtn +
      '</div>' +
      (p.general ? '' :
        '<div class="panel card-pad mb-4">' + sectionTitle('Products in this profile') +
          '<div class="muted" style="font-size:12.5px;margin-top:8px">' + p.productsCount + ' product(s) assigned. <a class="lnk" data-act="manage-products">Manage products</a></div></div>') +
      zonesCard + noCharge +
      '<div class="flex justify-end">' + updateBtn + '</div>'
    );

    const back = root.querySelector('[data-act="rate-back"]'); if (back) back.onclick = () => { rateProfile = null; renderRates(); };
    root.querySelectorAll('[data-act="save"]').forEach((b2) => b2.onclick = () => toast('Shipping profile updated'));
    const az = root.querySelector('[data-act="add-zone"]'); if (az) az.onclick = () => openZoneModal();
    root.querySelectorAll('[data-add-rate]').forEach((b2) => b2.onclick = () => openRateModal(p, Number(b2.getAttribute('data-add-rate')), null));
    root.querySelectorAll('[data-edit-rate]').forEach((b2) => b2.onclick = () => {
      const [zid, rid] = b2.getAttribute('data-edit-rate').split(':').map(Number);
      openRateModal(p, zid, rid);
    });
    const mp = root.querySelector('[data-act="manage-products"]'); if (mp) mp.onclick = () => toast('Manage products — assign products to this profile');
  }

  function openZoneModal() {
    const body =
      field('Zone name', '', 'e.g. North America') +
      '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Regions <span style="color:var(--err)">*</span></div>' +
        '<div class="zone-region-pick">' +
          D.locations.tree.flatMap((c) => (c.children || []).map((co) => co.name)).slice(0, 8).map((nm) =>
            '<label class="edit-check" style="padding:5px 0"><input type="checkbox" /><span>' + esc(nm) + '</span></label>').join('') +
        '</div></div>';
    modal({ title: 'Add shipping zone', width: 520, okText: 'Save', body, onOk: (m, close) => { close(); toast('Shipping zone added'); } });
  }

  function openRateModal(profile, zoneId, rateId) {
    const zone = profile.zones.find((z) => z.id === zoneId);
    const rt = rateId ? (zone.rates.find((r) => r.id === rateId) || {}) : {};
    const ct = rt.condition_type || 'none';
    const condRadio = (val, label) =>
      '<label class="set-radio' + (ct === val ? ' on' : '') + '" data-radio="cond" data-val="' + val + '" style="margin-right:14px"><span class="proc-radio">' + (ct === val ? '<span class="proc-dot"></span>' : '') + '</span>' + esc(label) + '</label>';
    const body =
      field('Rate name', rt.name || '', 'e.g. Standard') +
      '<div style="margin-bottom:12px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Price <span style="color:var(--err)">*</span></div>' +
        '<div class="set-addon"><span class="set-addon-prefix">' + esc(D.rates.currencySymbol) + '</span><input class="input" type="number" step="0.01" value="' + (rt.price != null ? rt.price : '') + '" placeholder="0.00 (enter 0 for free)" style="border-top-left-radius:0;border-bottom-left-radius:0" /></div></div>' +
      '<div style="margin-bottom:10px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Condition</div>' +
        condRadio('none', 'No condition') + condRadio('price', 'By order price') + condRadio('weight', 'By weight') + '</div>' +
      '<div class="flex items-center gap-2"><div class="set-addon"><input class="input" type="number" value="' + (rt.min_value != null ? rt.min_value : '') + '" placeholder="Min" style="width:120px" /></div>' +
        '<span class="muted">to</span><div class="set-addon"><input class="input" type="number" value="' + (rt.max_value != null ? rt.max_value : '') + '" placeholder="Max (blank = and up)" style="width:160px" /></div></div>' +
      '<div class="muted" style="font-size:11.5px;margin-top:6px">Price tiers use order subtotal; weight tiers use grams.</div>';
    const ctrl = modal({ title: (rateId ? 'Edit' : 'Add') + ' shipping rate', width: 540, okText: 'Save', body, onOk: (m, close) => { close(); toast('Shipping rate saved for ' + zone.name); } });
    // condition radio toggle
    ctrl.m.querySelectorAll('[data-radio="cond"]').forEach((el) => el.onclick = () => {
      ctrl.m.querySelectorAll('[data-radio="cond"]').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
  }

  // ===========================================================================
  // MODAL (shared) — mirrors the orders prototype modal
  // ===========================================================================
  function modal({ title, body, width, okText, onOk, extraLeft, onExtra }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body" style="max-height:70vh;overflow:auto">' + body + '</div>' +
      '<div class="modal-foot" style="justify-content:' + (extraLeft ? 'space-between' : 'flex-end') + '">' +
        (extraLeft || '') +
        '<div class="flex gap-2"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>' + (okText || 'Save') + '</button></div></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    const disc = m.querySelector('[data-disc]'); if (disc && onExtra) disc.onclick = () => onExtra(m, close);
    // generic radio/checkbox visual toggles inside modal (skip ones already wired by caller)
    m.querySelectorAll('.set-radio:not([data-radio]), .set-radio2').forEach((el) => el.onclick = () => {
      const grp = el.parentElement;
      grp.querySelectorAll('.set-radio, .set-radio2').forEach((s) => { s.classList.remove('on'); const d = s.querySelector('.proc-radio'); if (d) d.innerHTML = ''; });
      el.classList.add('on'); const dot = el.querySelector('.proc-radio'); if (dot) dot.innerHTML = '<span class="proc-dot"></span>';
    });
    return { m, close };
  }

  // ===========================================================================
  // ROUTER  (SPA: shell passes `rest` = the part after #/settings/)
  // Maps the shell's sidebar sub-page id -> this module's renderer. Two ids
  // differ from the internal renderer names (shippable-locations, shipping-rates).
  // Deeper segments (rest after the sub-page id) pre-seed the in-page drill state
  // so deep links to a metafield resource / shipping profile keep working.
  // ===========================================================================
  const ROUTES = {
    base: renderBase,
    payments: renderPayments,
    currency: renderCurrency,
    checkout: renderCheckout,
    metafields: renderMetafields,
    'shippable-locations': renderLocations,
    'shipping-rates': renderRates,
  };

  function show(rest) {
    const parts = String(rest || '').split('/').filter(Boolean);
    const key = ROUTES[parts[0]] ? parts[0] : 'base';
    const sub = parts[1];
    // reset / seed drill-down sub-states for the active sub-page
    mfResource = (key === 'metafields' && sub) ? decodeURIComponent(sub) : null;
    rateProfile = (key === 'shipping-rates' && sub != null && sub !== '') ? Number(decodeURIComponent(sub)) : null;
    ROUTES[key]();
    if (root && root.parentElement) root.parentElement.scrollTop = 0;
  }

  // ===========================================================================
  // page-scoped styles (Settings-only widgets layered on top of theme.css)
  // Declared before the VIEWS registration below so renderShell() can read it.
  // The settings sidebar/sub-nav now lives in the shared shell, so no rail CSS here.
  // ===========================================================================
  const STYLES = `
  .set-body { min-width: 0; }

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

  /* masked secret badge */
  .mask-badge { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 10.5px; font-weight: 600; color: var(--ink-muted); background: #fff; border: 1px solid var(--hair); border-radius: 9999px; padding: 1px 8px; letter-spacing: .02em; }

  /* payments */
  .pay-chip { display: inline-flex; align-items: center; padding: 2px 8px; margin: 0 4px 4px 0; border: 1px solid var(--hair); border-radius: 6px; font-size: 11px; color: var(--ink-body); background: #fff; }
  .prov-card { border: 1px solid var(--hair); border-radius: 10px; padding: 14px 16px; }
  .proc-opt { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid var(--ctl); border-radius: 8px; background: #fff; cursor: pointer; }
  .proc-opt.on { border-color: var(--brand); background: #e6f0ff; }
  .proc-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--ctl); display: inline-grid; place-items: center; flex: none; }
  .proc-opt.on .proc-radio, .set-radio.on .proc-radio, .set-radio2.on .proc-radio { border-color: var(--brand); }
  .proc-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand); }
  .set-radio { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; }
  .set-radio2 { display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: var(--ink-body); cursor: pointer; padding: 8px 10px; border: 1px solid var(--hair); border-radius: 8px; }
  .set-radio2.on { border-color: var(--brand); background: #e6f0ff; }

  /* currency flag chip */
  .ccy-flag { display: inline-grid; place-items: center; width: 22px; height: 16px; border-radius: 3px; background: var(--panel); border: 1px solid var(--hair); font-size: 9px; font-weight: 700; color: var(--ink-muted); letter-spacing: -.02em; }

  /* metafields resource picker */
  .mf-res { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 14px; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); cursor: pointer; }
  .mf-res:hover { background: #f1f3f8; }
  .mf-res-ico { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px; background: #fff; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; }

  /* shippable locations tree */
  .loc-tree { padding: 4px 0 8px; }
  .loc-row { display: flex; align-items: center; gap: 8px; padding: 8px 16px 8px 12px; border-top: 1px solid var(--hair); }
  .loc-row:hover { background: var(--panel); }
  .loc-caret { display: inline-flex; cursor: pointer; color: var(--ink-muted); transition: transform .15s; transform: rotate(-90deg); flex: none; }
  .loc-caret.open { transform: rotate(0deg); }
  .loc-check { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--ctl); display: inline-grid; place-items: center; cursor: pointer; color: #fff; flex: none; }
  .loc-check.on { background: var(--brand); border-color: var(--brand); }

  /* shipping rates */
  .rate-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 1px solid var(--hair); border-radius: 10px; background: var(--panel); cursor: pointer; }
  .rate-row:hover { background: #f1f3f8; }
  .rate-ico { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: #fff; border: 1px solid var(--hair); color: var(--ink-muted); flex: none; }
  .zone-block { border: 1px solid var(--hair); border-radius: 10px; padding: 14px 16px; }
  .zone-ico { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 7px; background: #e6f0ff; color: var(--brand); flex: none; }
  .rate-list { border: 1px solid var(--hair); border-radius: 8px; overflow: hidden; }
  .rate-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #fff; border-bottom: 1px solid var(--hair); }
  .rate-item:last-child { border-bottom: none; }
  .rate-empty { border: 1px solid var(--hair); border-radius: 8px; background: var(--panel); padding: 16px; text-align: center; }
  .rate-free { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: var(--ok-bg); color: #00684a; font-size: 12px; font-weight: 600; }
  .rate-price { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: #e6f0ff; color: #0058c4; font-size: 12px; font-weight: 600; }
  `;

  // ---- SPA registration (the shell drives render + renders the sidebar) ----
  window.VIEWS = window.VIEWS || {};
  window.VIEWS.settings = { render: function (el, rest) { root = el; show(rest || 'base'); } };
})();
