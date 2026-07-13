/* BestShopio Admin · Customers prototype — list + detail + note modal, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin
   .../views/admin/customer (customer.vue / detial.tsx + detail cards). */
(function () {
  const D = window.DATA_CUSTOMERS;
  let root; // set by the SPA shell router via VIEWS.customers.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n, cur) => (cur || '$') + Number.parseFloat(String(n == null ? 0 : n) || 0).toFixed(2);
  // Keep order-history option values aligned with the order-detail convention.
  const variantText = (value) => String(value == null ? '' : value).trim().replace(/\s*,\s*/g, ' / ');

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', 15),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/>', 15),
    phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>', 15),
    tag: svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 13),
    recurring: svg('<path d="M21 12a9 9 0 0 0-15.2-6.5L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.2 6.5L21 16"/><path d="M21 21v-5h-5"/>', 13),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  };

  // ---- toast (mirrors message.success used across the module) ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- marketing status -> badge meta (utils.ts getMarketingStatusMeta) ----
  // Colors mirror the real getMarketingStatusMeta: Subscribed=blue, Not subscribed=gray,
  // Unsubscribed=yellow (#FFEB78 bg / #333 dot). The shared theme has no yellow pill, so
  // that one row is tinted inline to stay faithful without adding a second design system.
  const MK = {
    subscribed:     { label: 'Subscribed',     cls: 'pill-blue' },
    not_subscribed: { label: 'Not subscribed', cls: 'pill-gray' },
    unsubscribed:   { label: 'Unsubscribed',   cls: 'pill', style: 'background:#FFEB78', dotStyle: 'background:#333333' },
  };
  const mkBadge = (status) => {
    const m = MK[status] || MK.not_subscribed;
    return '<span class="pill ' + m.cls + '"' + (m.style ? ' style="' + m.style + '"' : '') + '>' +
      '<span class="dot"' + (m.dotStyle ? ' style="' + m.dotStyle + '"' : '') + '></span>' + m.label + '</span>';
  };
  // account status reuses the same pill vocabulary (HeaderSummaryCard maps registered->subscribed look).
  const acctBadge = (status) => status === 'guest'
    ? '<span class="pill pill-gray"><span class="dot"></span>Guest</span>'
    : '<span class="pill pill-blue"><span class="dot"></span>Registered</span>';

  // ---- formatting helpers (utils.ts) ----
  const displayName = (c) => {
    const n = [c.first_name, c.last_name].map((v) => String(v == null ? '' : v).trim()).filter(Boolean).join(' ');
    return n || String(c.email || '').trim() || '- -';
  };
  const phoneText = (code, phone) => {
    const raw = String(phone == null ? '' : phone).trim();
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    const c = String(code == null ? '' : code).replace(/^\+/, '').trim();
    return c ? '+' + c + ' ' + raw : raw;
  };
  const aov = (spent, count) => {
    const a = Number.parseFloat(String(spent == null ? 0 : spent));
    const n = Number(count || 0);
    if (!Number.isFinite(a) || !n) return '0.00';
    return (a / n).toFixed(2);
  };
  const locLines = (loc) => {
    if (!loc || typeof loc === 'string') { const t = String(loc == null ? '' : loc).trim(); return t ? [t] : []; }
    const l1 = [loc.detail, loc.detail2].map((v) => String(v == null ? '' : v).trim()).filter(Boolean).join(', ');
    const l2 = [loc.city, loc.province, loc.post_code, loc.country].map((v) => String(v == null ? '' : v).trim()).filter(Boolean).join(', ');
    return [l1, l2].filter(Boolean);
  };

  // generic pill (color -> theme pill class; undefined/'' -> gray, matching PillTag default)
  const colorCls = (color) => ({ orange: 'pill-orange', blue: 'pill-blue', red: 'pill-red', gray: 'pill-gray' }[color] || 'pill-gray');
  const pillTag = (text, color) => '<span class="pill ' + colorCls(color) + '"><span class="dot"></span>' + esc(text) + '</span>';

  // ---- order status cells (orders/components/list: OrderStatusCell / PaymentStatusCell / FulfillmentStatusCell) ----
  // The customer order-list card stacks all three pills, same as the live admin.
  function orderStatusCell(o) {
    if (Number(o.is_del || 0) !== 0) return pillTag('Canceled', 'red');
    if (Number(o.paid || 0) === 0) return pillTag('To pay', 'orange');
    const st = String(o.status == null ? '' : o.status);
    const ot = Number(o.order_type || 0);
    const mapA = { '0': 'To ship', '1': 'Shipped', '2': 'Awaiting Review', '3': 'Done', '-1': 'Refunded', '9': 'Failed group', '10': 'To pay balance', '11': 'Balance payment expired' };
    const mapB = { '0': 'To pick up', '1': 'To pick up', '2': 'Awaiting Review', '3': 'Done', '-1': 'Refunded', '9': 'Failed group' };
    const text = (ot === 0 || ot === 2 ? mapA[st] : mapB[st]) || '--';
    // Only an unshipped (status 0) paid order is blue; everything else uses the default gray pill.
    const color = ((ot === 0 || ot === 2) && Number(o.status || 0) === 0) ? 'blue' : undefined;
    return pillTag(text, color);
  }
  function paymentStatusCell(o) {
    const paid = Number(o.paid || 0) === 1;
    return pillTag(paid ? 'Paid' : 'Unpaid', paid ? undefined : 'orange');
  }
  function fulfillmentStatusCell(o) {
    // Derive the canonical order status, then map to Fulfilled / Unfulfilled / -- (refund).
    let s;
    if (Number(o.is_del || 0) !== 0) s = 'cancel';
    else if (Number(o.status || 0) === -1) s = 'refund';
    else if (Number(o.paid || 0) !== 1) s = 'to_pay';
    else if (Number(o.status) === 3) s = 'archived';
    else if (Number(o.status) === 2) s = 'await';
    else if (Number(o.status) === 1) s = 'shipped';
    else s = 'to_ship';
    if (s === 'refund') return pillTag('--', undefined);
    if (s === 'shipped' || s === 'await' || s === 'archived') return pillTag('Fulfilled', undefined);
    return pillTag('Unfulfilled', 'orange');
  }

  // tab counts keyed on account_status
  const tabCount = (key) => key === 'all' ? D.CUSTOMERS.length : D.CUSTOMERS.filter((c) => c.account_status === key).length;

  // ================= LIST VIEW =================
  const LST = {
    tab: 'all', kwType: 'customer_name', kw: '', kwApplied: '',
    marketing: [], account: [],
    ordMin: '', ordMax: '', ordApplied: false,
    spentMin: '', spentMax: '', spentApplied: false,
    page: 1, size: 20,
  };

  function filteredRows() {
    let rows = D.CUSTOMERS.slice();
    if (LST.tab !== 'all') rows = rows.filter((c) => c.account_status === LST.tab);
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((c) => {
        switch (LST.kwType) {
          case 'customer_name': return displayName(c).toLowerCase().includes(q);
          case 'email': return (c.email || '').toLowerCase().includes(q);
          case 'phone': return (c.phone || '').toLowerCase().includes(q);
          default: return JSON.stringify(c).toLowerCase().includes(q);
        }
      });
    }
    if (LST.marketing.length) rows = rows.filter((c) => LST.marketing.includes(c.marketing_status));
    if (LST.account.length) rows = rows.filter((c) => LST.account.includes(c.account_status));
    if (LST.ordApplied) {
      const lo = LST.ordMin === '' ? -Infinity : Number(LST.ordMin);
      const hi = LST.ordMax === '' ? Infinity : Number(LST.ordMax);
      rows = rows.filter((c) => c.orders_count >= lo && c.orders_count <= hi);
    }
    if (LST.spentApplied) {
      const lo = LST.spentMin === '' ? -Infinity : Number(LST.spentMin);
      const hi = LST.spentMax === '' ? Infinity : Number(LST.spentMax);
      rows = rows.filter((c) => Number(c.total_spent) >= lo && Number(c.total_spent) <= hi);
    }
    return rows;
  }

  // generic multi-select trigger (mirrors SelectMulti) -> opens a checkbox popover
  function multiLabel(values, options, placeholder) {
    if (!values.length) return '<span class="muted">' + esc(placeholder) + '</span>';
    const labels = options.filter((o) => values.includes(o.value)).map((o) => o.label);
    return '<span>' + esc(labels.join(', ')) + '</span>';
  }

  function renderList() {
    LST.page = LST.page || 1;
    const rows = filteredRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const kwOpts = D.KEYWORD_OPTIONS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const tabsHtml = D.TABS.map((t) =>
      '<div class="tab' + (t.key === LST.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + tabCount(t.key) + '</span></div>').join('');

    // active filter tags
    const tags = [];
    if (LST.kwApplied) {
      const lbl = (D.KEYWORD_OPTIONS.find((o) => o.value === LST.kwType) || {}).label || '';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.marketing.length) {
      const txt = D.MARKETING_OPTIONS.filter((o) => LST.marketing.includes(o.value)).map((o) => o.label).join(', ');
      tags.push('<span class="field-pill" data-clear="marketing">Email subscription: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }
    if (LST.account.length) {
      const txt = D.ACCOUNT_OPTIONS.filter((o) => LST.account.includes(o.value)).map((o) => o.label).join(', ');
      tags.push('<span class="field-pill" data-clear="account">Account status: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }
    if (LST.ordApplied) {
      const txt = (LST.ordMin !== '' ? LST.ordMin : 'Min') + ' – ' + (LST.ordMax !== '' ? LST.ordMax : 'Max');
      tags.push('<span class="field-pill" data-clear="orders">Order range: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }
    if (LST.spentApplied) {
      const txt = (LST.spentMin !== '' ? money(LST.spentMin) : 'Min') + ' – ' + (LST.spentMax !== '' ? money(LST.spentMax) : 'Max');
      tags.push('<span class="field-pill" data-clear="spent">Amount spent range: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }

    const ordChipText = LST.ordApplied
      ? ((LST.ordMin !== '' ? LST.ordMin : 'Min') + ' – ' + (LST.ordMax !== '' ? LST.ordMax : 'Max'))
      : 'Order range';
    const spentChipText = LST.spentApplied
      ? ((LST.spentMin !== '' ? money(LST.spentMin) : 'Min') + ' – ' + (LST.spentMax !== '' ? money(LST.spentMax) : 'Max'))
      : 'Amount spent range';

    root.innerHTML =
      '<div class="mb-4">' +
        '<h1 class="page-title">Customers</h1>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="cu-tabs">' + tabsHtml + '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // keyword group
            '<div class="flex" style="min-width:400px">' +
              '<select class="filter-select" id="kw-type" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // email subscription multi
            '<div class="sel-trigger" id="mk-chip" style="width:185px">' + multiLabel(LST.marketing, D.MARKETING_OPTIONS, 'Email subscription') + I.chevDown + '</div>' +
            // account status multi
            '<div class="sel-trigger" id="ac-chip" style="width:160px">' + multiLabel(LST.account, D.ACCOUNT_OPTIONS, 'Account status') + I.chevDown + '</div>' +
            // order range
            '<div class="sel-trigger" id="ord-chip" style="width:150px"><span class="' + (LST.ordApplied ? '' : 'muted') + '">' + esc(ordChipText) + '</span>' + I.chevDown + '</div>' +
            // amount spent range
            '<div class="sel-trigger" id="spent-chip" style="width:200px"><span class="' + (LST.spentApplied ? '' : 'muted') + '">' + esc(spentChipText) + '</span>' + I.chevDown + '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1200px">' +
          '<thead><tr>' +
            '<th>Customer name</th>' +
            '<th style="width:230px">Email</th>' +
            '<th style="width:190px">Email subscription</th>' +
            '<th style="width:280px">Location</th>' +
            '<th class="num" style="width:120px">Orders</th>' +
            '<th class="num" style="width:140px">Amount spent</th>' +
            '<th style="width:90px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="cu-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="7" style="text-align:center;padding:40px" class="muted">No customers match these filters.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        // pagination footer
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + totalRecords + ' records</span>' +
          pagerHtml(LST.page, pages) +
        '</div>' +
      '</div>';

    wireList();
  }

  function rowHtml(c) {
    const ord = Number(c.orders_count || 0);
    const lines = locLines(c.location);
    const locCell = lines.length
      ? '<div style="line-height:1.75">' + lines.map((l) => '<div>' + esc(l) + '</div>').join('') + '</div>'
      : '<span class="muted">- -</span>';
    return '<tr data-id="' + c.id + '">' +
      '<td style="font-weight:500;color:var(--ink)">' + esc(displayName(c)) + '</td>' +
      '<td class="muted">' + (c.email ? esc(c.email) : '--') + '</td>' +
      '<td>' + mkBadge(c.marketing_status) + '</td>' +
      '<td class="subtle">' + locCell + '</td>' +
      '<td class="num">' + ord + ' ' + (ord <= 1 ? 'order' : 'orders') + '</td>' +
      '<td class="num" style="font-weight:600;color:var(--ink)">' + money(c.total_spent) + '</td>' +
      '<td style="text-align:center"><button class="back-btn" data-view="' + c.id + '" title="Detail" style="width:30px;height:30px">' + I.eye + '</button></td>' +
    '</tr>';
  }

  function pagerHtml(page, pages) {
    const item = (label, p, opts) => {
      opts = opts || {};
      const cls = 'pg-item' + (opts.active ? ' active' : '') + (opts.disabled ? ' disabled' : '');
      return '<span class="' + cls + '"' + (opts.disabled ? '' : ' data-page="' + p + '"') + '>' + label + '</span>';
    };
    let nums = '';
    for (let p = 1; p <= pages; p++) nums += item(String(p), p, { active: p === page });
    return '<div class="pg">' +
      item('‹', page - 1, { disabled: page <= 1 }) + nums + item('›', page + 1, { disabled: page >= pages }) +
      '<select class="pg-size" id="pg-size">' +
        ['20', '50', '100'].map((s) => '<option value="' + s + '"' + (Number(s) === LST.size ? ' selected' : '') + '>' + s + ' / page</option>').join('') +
      '</select>' +
    '</div>';
  }

  function wireList() {
    root.querySelectorAll('#cu-tabs .tab').forEach((t) => t.onclick = () => { LST.tab = t.getAttribute('data-tab'); LST.page = 1; renderList(); });
    const kwType = root.querySelector('#kw-type');
    const kwInput = root.querySelector('#kw-input');
    if (kwType) kwType.onchange = () => { LST.kwType = kwType.value; if (LST.kwApplied) { LST.page = 1; renderList(); } };
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    const mkChip = root.querySelector('#mk-chip');
    if (mkChip) mkChip.onclick = () => openMultiPopover(mkChip, 'marketing', D.MARKETING_OPTIONS);
    const acChip = root.querySelector('#ac-chip');
    if (acChip) acChip.onclick = () => openMultiPopover(acChip, 'account', D.ACCOUNT_OPTIONS);
    const ordChip = root.querySelector('#ord-chip');
    if (ordChip) ordChip.onclick = () => openRangePopover(ordChip, 'ord', { title: 'Order range', precision: 0 });
    const spentChip = root.querySelector('#spent-chip');
    if (spentChip) spentChip.onclick = () => openRangePopover(spentChip, 'spent', { title: 'Amount spent range', precision: 2, prefix: '$' });
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'marketing') LST.marketing = [];
      if (k === 'account') LST.account = [];
      if (k === 'orders') { LST.ordApplied = false; LST.ordMin = ''; LST.ordMax = ''; }
      if (k === 'spent') { LST.spentApplied = false; LST.spentMin = ''; LST.spentMax = ''; }
      LST.page = 1; renderList();
    });
    const ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    root.querySelectorAll('#cu-tbody tr[data-id]').forEach((tr) => tr.onclick = () => {
      const sel = window.getSelection ? window.getSelection() : null;
      if (sel && sel.toString()) return;
      goDetail(tr.getAttribute('data-id'));
    });
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goDetail(b.getAttribute('data-view')); });
  }

  // ---- multi-select checkbox popover ----
  function openMultiPopover(anchor, key, options) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:200px;padding:8px"></div>');
    pop.innerHTML = options.map((o) =>
      '<label class="edit-check" style="padding:6px 8px"><input type="checkbox" data-v="' + o.value + '"' + (LST[key].includes(o.value) ? ' checked' : '') + ' /><span>' + esc(o.label) + '</span></label>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.onchange = () => {
      const v = cb.getAttribute('data-v');
      if (cb.checked) { if (!LST[key].includes(v)) LST[key].push(v); }
      else LST[key] = LST[key].filter((x) => x !== v);
      LST.page = 1; renderList();
    });
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  // ---- min/max range popover (useRange) ----
  function openRangePopover(anchor, key, opts) {
    closePops();
    const minK = key + 'Min', maxK = key + 'Max', appK = key + 'Applied';
    const prefix = opts.prefix || '';
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:260px;padding:14px"></div>');
    pop.innerHTML =
      '<div class="ctrl-label" style="margin-bottom:8px;text-transform:none">' + esc(opts.title) + '</div>' +
      '<div class="flex items-center gap-2">' +
        '<input class="input" id="r-min" placeholder="' + (prefix ? prefix + 'Min' : 'Min') + '" type="number" value="' + esc(LST[minK]) + '" style="width:100px" />' +
        '<span class="muted">to</span>' +
        '<input class="input" id="r-max" placeholder="' + (prefix ? prefix + 'Max' : 'Max') + '" type="number" value="' + esc(LST[maxK]) + '" style="width:100px" />' +
      '</div>' +
      '<div class="flex justify-end gap-2 mt-3">' +
        '<button class="btn btn-default" data-x>Clear</button>' +
        '<button class="btn btn-primary" data-apply>Apply</button>' +
      '</div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 280)) + 'px';
    pop.querySelector('[data-apply]').onclick = () => {
      LST[minK] = pop.querySelector('#r-min').value;
      LST[maxK] = pop.querySelector('#r-max').value;
      LST[appK] = LST[minK] !== '' || LST[maxK] !== '';
      LST.page = 1; closePops(); renderList();
    };
    pop.querySelector('[data-x]').onclick = () => { LST[appK] = false; LST[minK] = ''; LST[maxK] = ''; LST.page = 1; closePops(); renderList(); };
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ================= DETAIL VIEW =================
  // order-list card pagination state (independent of list), keyed in module scope.
  const DET = { orderPage: 1, orderSize: 5 };

  // Orders is the source of truth for current-order mock data. The customer module
  // keeps its older history records only as a fallback for customers without a mapped
  // canonical order snapshot.
  function sharedOrdersForCustomer(c) {
    const source = window.DATA_ORDERS;
    if (!source || !Array.isArray(source.ORDERS) || !source.DETAILS) return [];
    return source.ORDERS
      .filter((order) => order && order.user && String(order.user.uid) === String(c.id))
      .map((order) => {
        const detail = source.DETAILS[order.order_id] || source.DETAILS[Number(order.order_id)];
        return detail ? { kind: 'shared', list: order, detail } : null;
      })
      .filter(Boolean);
  }

  function orderEntryKey(entry) {
    const order = entry && entry.kind === 'shared' ? entry.list : entry;
    return order && (order.order_id != null ? 'id:' + order.order_id : 'sn:' + order.order_sn);
  }

  function formatHistoryDate(value, offset) {
    const fallback = '2026-01-01 12:00';
    const stamp = String(value || fallback).replace(' ', 'T') + 'Z';
    const date = new Date(stamp);
    const safe = Number.isNaN(date.getTime()) ? new Date('2026-01-01T12:00:00Z') : date;
    safe.setUTCDate(safe.getUTCDate() - (35 * offset));
    const pad = (part) => String(part).padStart(2, '0');
    return safe.getUTCFullYear() + '-' + pad(safe.getUTCMonth() + 1) + '-' + pad(safe.getUTCDate()) +
      ' ' + pad(safe.getUTCHours()) + ':' + pad(safe.getUTCMinutes());
  }

  function historyOrderForCustomer(c, offset, amount) {
    const id = Math.abs(Number(c.id) || 0);
    const fallback = 42 + ((id + offset * 17) % 58);
    const total = Number.isFinite(amount) ? Math.max(0, amount) : fallback;
    const quantity = 1;
    const productNames = ['Everyday Essentials', 'Signature Blend', 'Seasonal Refill'];
    const productName = productNames[offset % productNames.length];
    return {
      // The live API returns historical pages independently. Keep equivalent, complete
      // mock history here so the customer count, page count, and visible cards agree.
      order_id: 9000000 + id * 10 + offset,
      order_sn: 'EN' + (1000 + (id % 7000) + offset),
      create_time: formatHistoryDate(c.last_order_at || c.create_time, offset),
      status: [3, 1, 0, 2, -1][offset % 5],
      paid: 1,
      is_del: 0,
      order_type: 0,
      pay_price: total.toFixed(2),
      total_price: total.toFixed(2),
      total_num: quantity,
      total_postage: '0.00',
      country_currency_dto: { currency_symbol: '$' },
      orderProduct: [{
        order_product_id: 8000000 + id * 10 + offset,
        product_num: quantity,
        product_price: total.toFixed(2),
        total_price: total.toFixed(2),
        cart_info: { product: { store_name: productName, image: '' }, productAttr: { sku: 'HIS-' + id + '-' + String(offset).padStart(2, '0') } },
      }],
      orderDiscount: [],
    };
  }

  function allOrdersForCustomer(c) {
    const merged = [];
    const seen = new Set();
    const add = (entry) => {
      const key = orderEntryKey(entry);
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(entry);
    };

    // Canonical orders carry the current order-detail snapshots; legacy customer data
    // fills the historical list. Neither source may hide the other.
    sharedOrdersForCustomer(c).forEach(add);
    (D.ORDERS[c.id] || D.ORDERS[Number(c.id)] || []).forEach(add);

    const target = Math.max(0, Number(c.orders_count) || 0);
    const knownTotal = merged.reduce((sum, entry) => {
      const order = entry.kind === 'shared' ? entry.list : entry;
      return sum + (Number(order.total != null ? order.total : order.pay_price) || 0);
    }, 0);
    const spent = Number(c.total_spent);
    const hasSpent = Number.isFinite(spent);
    let remainingCents = hasSpent ? Math.max(0, Math.round((spent - knownTotal) * 100)) : 0;
    for (let offset = 1; merged.length < target; offset += 1) {
      const slots = target - merged.length;
      const amount = hasSpent ? Math.floor(remainingCents / slots) / 100 : undefined;
      add(historyOrderForCustomer(c, offset, amount));
      if (hasSpent) remainingCents -= Math.round(amount * 100);
    }

    return merged.sort((a, b) => {
      const aOrder = a.kind === 'shared' ? a.list : a;
      const bOrder = b.kind === 'shared' ? b.list : b;
      return String(bOrder.create_time || '').localeCompare(String(aOrder.create_time || ''));
    });
  }

  // Orders can point to a customer not included in the compact Customers fixture.
  // Build a read-only customer base from that canonical order snapshot so every
  // customer link remains navigable without inventing a second customer record.
  function customerFromOrderSnapshot(id) {
    const source = window.DATA_ORDERS;
    if (!source || !Array.isArray(source.ORDERS)) return null;
    const matches = source.ORDERS.filter((order) => order && order.user && String(order.user.uid) === String(id));
    if (!matches.length) return null;
    const latest = matches.slice().sort((a, b) => String(b.create_time || '').localeCompare(String(a.create_time || '')))[0];
    const detail = source.DETAILS && (source.DETAILS[latest.order_id] || source.DETAILS[Number(latest.order_id)]);
    const shipping = (detail && detail.shipping) || latest.shipping || {};
    const nameParts = String((latest.user && latest.user.nickname) || shipping.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = shipping.first_name || nameParts.shift() || 'Customer';
    const lastName = shipping.last_name || nameParts.join(' ');
    const totalSpent = matches.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    return {
      id: Number(id), first_name: firstName, last_name: lastName,
      email: shipping.email || '', phone: shipping.phone || '', phone_code: shipping.phone_code || '',
      account_status: 'registered', marketing_status: 'not_subscribed',
      orders_count: matches.length, total_spent: totalSpent.toFixed(2), last_order_at: latest.create_time || '',
      source: latest.source || 'Online Store', create_time: latest.create_time || '',
      location: Object.assign({}, shipping, { first_name: firstName, last_name: lastName }),
    };
  }

  function customerDetail(id) {
    const stored = D.DETAILS[id] || D.DETAILS[Number(id)];
    if (stored) return stored;
    const base = D.CUSTOMERS.find((customer) => String(customer.id) === String(id)) || customerFromOrderSnapshot(id);
    if (!base) return null;
    const orders = sharedOrdersForCustomer(base);
    const first = orders.length ? orders[0].detail : null;
    const shipping = (first && first.shipping) || {};
    const location = Object.assign({}, (base.location && typeof base.location === 'object' ? base.location : {}), shipping, {
      email: shipping.email || base.email,
      phone: shipping.phone || base.phone,
      phone_code: shipping.phone_code || base.phone_code,
    });
    return Object.assign({}, base, {
      last_time: base.last_time || '- -',
      subscription: base.marketing_status === 'subscribed' ? { subscribe_time: base.create_time } : null,
      location,
      note: '',
      logs: orders.map((entry, index) => ({
        id: orders.length - index + 1,
        content: 'Placed order ' + entry.detail.order_sn,
        create_time: entry.detail.create_time,
      })).concat([{ id: 1, content: 'Account created from ' + (base.source || 'Online Store'), create_time: base.create_time }]),
    });
  }

  function renderDetail(id) {
    const c = customerDetail(id);
    if (!c) { renderMissing(id); return; }

    root.innerHTML =
      // fixed 1200px centered container (mirrors real admin .detail-wrap)
      '<div class="detail-wrap">' +
        // header
        '<div class="flex items-center justify-between mb-4">' +
          '<div class="flex items-center gap-3">' +
            '<button class="back-btn" data-act="back" title="Back to customers">' + I.arrowLeft + '</button>' +
            '<span class="page-title">' + esc(displayName(c)) + '</span>' +
          '</div>' +
        '</div>' +
        // two-column body: main + 275px right rail
        '<div class="detail-cols">' +
          '<div class="detail-main">' +
            headerSummaryCard(c) +
            statsCards(c) +
            orderListCard(c) +
            timelineCard(c) +
          '</div>' +
          '<div class="detail-rail">' +
            detailsCard(c) +
            subscriptionsCard(c) +
            addressCard(c) +
            notesCard(c) +
          '</div>' +
        '</div>' +
      '</div>';

    wireDetail(c);
  }

  function cardOpen(titleHtml, rightHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div class="card-title flex items-center gap-2">' + titleHtml + '</div>' +
        (rightHtml || '') +
      '</div>';
  }

  // ---- HeaderSummaryCard.tsx ----
  function headerSummaryCard(c) {
    const customerOrders = allOrdersForCustomer(c);
    const latest = customerOrders[0] || null;
    const latestOrder = latest && latest.kind === 'shared' ? latest.detail : null;
    const latestRecord = latest && (latest.kind === 'shared' ? latest.list : latest);
    const lastOrderValue = latestOrder
      ? '<a class="lnk customer-summary-meta-value" href="#/orders/' + encodeURIComponent(latestOrder.order_id) + '" style="font-weight:500">' + esc(latestOrder.order_sn) + '</a>'
      : '<span class="subtle customer-summary-meta-value">' + esc((latestRecord && latestRecord.order_sn) || c.last_order_at || '--') + '</span>';
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center gap-3" style="flex-wrap:wrap;margin-bottom:12px">' +
        '<div style="font-size:16px;font-weight:600;color:var(--ink)">' + esc(displayName(c)) + '</div>' +
        acctBadge(c.account_status) +
      '</div>' +
      '<div class="customer-summary-meta">' +
        '<div class="customer-summary-meta-item muted"><span class="customer-summary-meta-label">Customer since:</span><span class="subtle customer-summary-meta-value">' + esc(c.create_time || '--') + '</span></div>' +
        '<div class="customer-summary-meta-item muted"><span class="customer-summary-meta-label">Source:</span><span class="subtle customer-summary-meta-value">' + esc(c.source || '--') + '</span></div>' +
        '<div class="customer-summary-meta-item muted"><span class="customer-summary-meta-label">Customer ID:</span><span class="subtle customer-summary-meta-value" style="font-variant-numeric:tabular-nums">' + esc(c.id) + '</span></div>' +
        '<div class="customer-summary-meta-item muted"><span class="customer-summary-meta-label">Last order:</span>' + lastOrderValue + '</div>' +
        '<div class="customer-summary-meta-item muted"><span class="customer-summary-meta-label">Last signed in:</span><span class="subtle customer-summary-meta-value">' + esc(c.last_time || '- -') + '</span></div>' +
      '</div>' +
    '</div>';
  }

  // ---- StatsCards.tsx (Orders / Amount spent / Average Order Value) ----
  function statsCards(c) {
    const cards = [
      { label: 'Orders', value: Number(c.orders_count || 0) + ' Orders' },
      { label: 'Amount spent', value: money(c.total_spent) },
      { label: 'Average Order Value', value: money(aov(c.total_spent, c.orders_count)) },
    ];
    return '<div class="grid grid-cols-3 gap-4 mb-4" style="grid-template-columns:repeat(3,1fr)">' +
      cards.map((card) =>
        '<div class="panel card-pad" style="min-height:88px">' +
          '<div style="font-size:14px;font-weight:500;color:var(--ink);margin-bottom:10px">' + esc(card.label) + '</div>' +
          '<div style="font-size:18px;font-weight:600;color:var(--ink)">' + esc(card.value) + '</div>' +
        '</div>').join('') +
    '</div>';
  }

  // ---- OrderListCard.tsx (paginated, grouped product rows + discounts) ----
  function sharedOrderStatusCell(order) {
    const meta = {
      to_pay: ['To pay', 'orange'], to_ship: ['To ship', 'blue'], shipped: ['Shipped'],
      review: ['Awaiting Review'], archived: ['Done'], refund: ['Refunded', 'red'], cancel: ['Canceled', 'red'],
    }[order.order_status] || ['--'];
    return pillTag(meta[0], meta[1]);
  }

  function sharedPaymentStatusCell(order) {
    return pillTag(order.payment_status === 'paid' ? 'Paid' : 'Unpaid', order.payment_status === 'paid' ? undefined : 'orange');
  }

  function sharedFulfillmentStatusCell(order) {
    if (order.order_status === 'refund') return pillTag('--');
    if (order.order_status === 'shipped' || order.order_status === 'review' || order.order_status === 'archived') return pillTag('Fulfilled');
    return pillTag('Unfulfilled', 'orange');
  }

  function sharedPurchaseTags(order, detail) {
    const items = detail.items || [];
    const subscription = Boolean(order.has_subscription || order.sub || detail.sub || items.some((item) => item && item.subLine));
    const bundle = Boolean(order.bundle || detail.bundle || items.some((item) => item && item.bundle));
    return (subscription ? '<span class="pill pill-blue"><span class="dot"></span>Subscription</span>' : '') +
      (bundle ? '<span class="pill pill-gray"><span class="dot"></span>Bundle</span>' : '');
  }

  function legacySharedOrderItemsHtml(detail) {
    const seenBundleMeta = {};
    return (detail.items || []).map((item, index) => {
      const discountLines = [];
      const bundleKey = item.bundle || '';
      if (bundleKey && item.bundleMeta && !seenBundleMeta[bundleKey]) {
        if (item.bundleMeta.bundleDiscount) discountLines.push(item.bundleMeta.bundleDiscount);
        if (item.bundleMeta.subscriptionLabel) discountLines.push(item.bundleMeta.subscriptionLabel);
        seenBundleMeta[bundleKey] = true;
      }
      (item.discounts || []).forEach((discount) => {
        const name = String(discount.name || 'Discount');
        if ((String(discount.type || '').toLowerCase() === 'bundle' || /^Bundle Discount\b/i.test(name)) && item.bundleMeta) return;
        const label = /^Delivery every\b/i.test(name) ? 'Subscription discount' : name;
        discountLines.push(label + ' (-' + money(discount.amount) + ')');
      });
      const uniqueDiscounts = Array.from(new Set(discountLines));
      const delivery = (item.subscription && item.subscription.deliveryLabel) || (item.subLine && detail.sub && detail.sub.deliveryLabel) || '';
      const deliveryText = String(delivery).replace(/\s*\([^)]*\)\s*$/, '');
      const paid = Number(item.product_price != null ? item.product_price : item.line_total || 0);
      const compare = Number(item.line_total != null ? item.line_total : paid);
      const image = item.image
        ? '<img src="' + esc(item.image) + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none" />'
        : '<div style="width:40px;height:40px;border-radius:6px;border:1px solid var(--hair);background:var(--panel);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink-muted);flex:none">IMG</div>';
      const meta = (item.bundle ? '<span style="display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;color:#9a6400;background:#fff4de;border-radius:3px;padding:3px 6px">Bundle · ' + esc(item.bundle) + '</span>' : '') +
        (item.subLine && deliveryText ? '<span style="font-size:12px;color:var(--ink-body)">Subscription · ' + esc(deliveryText) + '</span>' : '');
      return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 44px 104px;gap:14px;align-items:start;padding:12px 0' + (index ? ';border-top:1px solid var(--hair)' : '') + '">' +
        '<div class="flex items-start gap-3" style="min-width:0">' + image +
          '<div style="min-width:0"><div style="font-weight:500;font-size:13.5px;color:var(--ink);line-height:1.35">' + esc(item.title) + (item.gift ? ' <span style="color:#1f8f4e;font-size:10.5px;font-weight:700">FREE GIFT</span>' : '') + '</div>' +
            '<div class="muted" style="font-size:12px">' + esc(variantText(item.sku)) + '</div>' +
            (meta ? '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:5px">' + meta + '</div>' : '') +
            (uniqueDiscounts.length ? '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:5px">' + uniqueDiscounts.map((line) => '<span class="flex items-center gap-1" style="font-size:12px;color:#8B8B8B">' + I.tag + '<span>' + esc(line) + '</span></span>').join('') + '</div>' : '') +
          '</div></div>' +
        '<div class="muted" style="font-size:13px;text-align:right;white-space:nowrap;padding-top:2px">x ' + esc(item.qty) + '</div>' +
        '<div style="text-align:right;font-size:13px;font-weight:500;color:var(--ink-body);white-space:nowrap"><div>' + (item.gift ? '<span style="color:#1f8f4e">Free</span>' : money(paid)) + '</div>' +
          (!item.gift && compare > paid + 0.001 ? '<div class="muted" style="text-decoration:line-through">' + money(compare) + '</div>' : '') + '</div>' +
      '</div>';
    }).join('');
  }

  function sharedItemSubscription(item, fallbackSub) {
    return item && item.subscription ? item.subscription : (item && item.subLine ? fallbackSub : null);
  }

  function sharedBundleSubscription(group, fallbackSub) {
    const scoped = group.find((item) => item && item.subscription);
    return scoped ? scoped.subscription : (group.some((item) => item && item.subLine) ? fallbackSub : null);
  }

  function sharedSubscriptionContractReference(sub) {
    if (!sub || !sub.id) return '';
    return '<span aria-hidden="true" class="muted">&middot;</span>' +
      '<a href="#/subscriptions/contracts/' + encodeURIComponent(sub.id) + '" style="color:var(--brand);font-weight:500;text-decoration:none">' + esc(sub.id) + '</a>';
  }

  function sharedDiscountType(item, discount) {
    const type = String((discount && discount.type) || '').toLowerCase();
    if (type === 'subscription' || type === 'product' || type === 'bundle') return type;
    const name = String((discount && discount.name) || '');
    if (/^bundle discount\b/i.test(name)) return 'bundle';
    if (/^(subscription discount|delivery every\b)/i.test(name)) return 'subscription';
    if (/^product discount\b/i.test(name)) return 'product';
    return item && item.subLine ? 'subscription' : 'product';
  }

  function sharedSubscriptionDiscountLabel(discount) {
    const label = String((discount && discount.name) || '').trim();
    return /^delivery every\b/i.test(label) ? 'Subscription discount' : (label || 'Subscription discount');
  }

  function sharedProductImage(item) {
    return item.image
      ? '<img src="' + esc(item.image) + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none" />'
      : '<div style="width:40px;height:40px;border-radius:6px;border:1px solid var(--hair);background:var(--panel);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink-muted);flex:none">IMG</div>';
  }

  function sharedNormalOrderItemHtml(item, fallbackSub) {
    const sub = sharedItemSubscription(item, fallbackSub);
    const discounts = item.discounts || [];
    const productDiscounts = discounts.filter((discount) => sharedDiscountType(item, discount) === 'product');
    const subscriptionDiscounts = item.subLine
      ? discounts.filter((discount) => sharedDiscountType(item, discount) === 'subscription')
      : [];
    const paid = Number(item.product_price != null ? item.product_price : item.line_total || 0);
    const compare = Number(item.line_total != null ? item.line_total : paid);
    const delivery = sub && sub.deliveryLabel ? String(sub.deliveryLabel).replace(/\s*\([^)]*\)\s*$/, '') : (item.subLabel || 'Delivery schedule');
    const subscriptionHtml = item.subLine && sub
      ? '<div style="grid-column:1 / -1;display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:2px;font-size:12px;color:var(--ink-body);line-height:1.45">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--brand-50);color:var(--brand);flex:none">' + I.recurring + '</span>' +
          '<span style="font-weight:600;color:var(--ink)">Subscription</span><span aria-hidden="true" class="muted">&middot;</span>' +
          '<span>' + esc(delivery) + '</span>' + sharedSubscriptionContractReference(sub) +
        '</div>'
      : '';
    const productDiscountHtml = productDiscounts.map((discount) =>
      '<div class="flex items-center gap-1 mt-1" style="font-size:12px;color:#8B8B8B">' + I.tag +
        '<span>' + esc(discount.name) + ' (-' + money(discount.amount) + ')</span></div>').join('');
    const subscriptionDiscountHtml = subscriptionDiscounts.length
      ? '<div style="grid-column:1 / -1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:2px">' + subscriptionDiscounts.map((discount) =>
          '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-muted);line-height:1.45"><span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:none">' + I.tag + '</span><span>' + esc(sharedSubscriptionDiscountLabel(discount)) + ' (-' + money(discount.amount) + ')</span></span>').join('') +
        '</div>'
      : '';
    return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 44px 104px;gap:14px;align-items:flex-start;padding:14px 0">' +
      '<div class="flex items-center gap-3" style="min-width:0">' + sharedProductImage(item) +
        '<div style="min-width:0"><div style="font-weight:500;font-size:13.5px;color:var(--ink);line-height:1.35">' + esc(item.title) + '</div>' +
          (item.sku ? '<div class="muted" style="font-size:12px">' + esc(variantText(item.sku)) + '</div>' : '') + productDiscountHtml +
        '</div>' +
      '</div>' +
      '<div class="muted" style="font-size:13px;text-align:right;white-space:nowrap;padding-top:2px">x ' + esc(item.qty) + '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;min-width:0;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;font-weight:500;color:var(--ink-body);line-height:1.35;white-space:nowrap"><div>' + (item.gift ? '<span style="color:#1f8f4e">Free</span>' : money(paid)) + '</div>' +
        (!item.gift && compare > paid + 0.001 ? '<div class="muted" style="text-decoration:line-through">' + money(compare) + '</div>' : '') +
      '</div>' + subscriptionHtml + subscriptionDiscountHtml +
    '</div>';
  }

  function sharedBundleGroupHtml(name, group, fallbackSub) {
    const compareTotal = group.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
    const paidTotal = group.reduce((sum, item) => sum + (Number(item.product_price) || 0), 0);
    const sub = sharedBundleSubscription(group, fallbackSub);
    const meta = (group.find((item) => item.bundleMeta) || {}).bundleMeta || {};
    const discountLines = [];
    if (meta.bundleDiscount) discountLines.push(meta.bundleDiscount);
    if (meta.subscriptionLabel) discountLines.push(meta.subscriptionLabel);
    if (!discountLines.length) {
      group.forEach((item) => (item.discounts || []).forEach((discount) => {
        discountLines.push(String(discount.name || 'Discount') + ' (-' + money(discount.amount) + ')');
      }));
    }
    const seen = {};
    const discountHtml = discountLines.filter((line) => {
      const key = String(line);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).map((line) => {
      const amount = (String(line).match(/\([^)]*\)\s*$/) || [])[0];
      const text = /^Delivery every\b/i.test(line)
        ? 'Subscription discount' + (amount ? ' ' + amount : '')
        : String(line);
      return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-muted);line-height:1.45"><span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:none">' + I.tag + '</span><span>' + esc(text) + '</span></span>';
    }).join('');
    const delivery = sub && sub.deliveryLabel ? String(sub.deliveryLabel).replace(/\s*\([^)]*\)\s*$/, '') : '';
    const subscriptionHtml = sub
      ? '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:0 14px 10px;font-size:12px;color:var(--ink-body);line-height:1.45">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--brand-50);color:var(--brand);flex:none">' + I.recurring + '</span>' +
          '<span style="font-weight:600;color:var(--ink)">Subscription</span><span aria-hidden="true" class="muted">&middot;</span>' +
          '<span>' + esc(delivery || 'Delivery schedule') + '</span>' + sharedSubscriptionContractReference(sub) +
        '</div>'
      : '';
    const rows = group.map((item, index) =>
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:12px;align-items:start;padding:12px 14px' + (index ? ';border-top:1px solid var(--hair)' : '') + '">' +
        '<div class="flex items-start gap-3" style="min-width:0">' + sharedProductImage(item) +
          '<div style="min-width:0"><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;line-height:1.35">' +
            (item.gift
              ? '<span style="display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;color:#16794a;background:#e8f7ee;border-radius:3px;padding:3px 6px">Free</span>'
              : '<span style="display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;color:#9a6400;background:#fff4de;border-radius:3px;padding:3px 6px">Included</span>') +
            '<span style="font-weight:500;font-size:13px;color:var(--ink)">' + esc(item.title) + '</span></div>' +
            (item.sku ? '<div class="muted" style="font-size:12px;margin-top:3px">' + esc(variantText(item.sku)) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="muted" style="font-size:13px;text-align:right;padding-top:4px;white-space:nowrap">x ' + esc(item.qty) + '</div>' +
      '</div>').join('');
    return '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden;background:#fff">' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 104px;gap:14px;align-items:start;padding:14px">' +
        '<div style="display:flex;align-items:center;gap:9px;min-width:0"><span style="display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:#9a6400;background:#fff4de;border-radius:3px;padding:4px 7px;flex:none">Bundle</span><span style="font-weight:500;font-size:13.5px;color:var(--ink);min-width:0;word-break:break-word">' + esc(name) + '</span></div>' +
        '<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;text-align:right;white-space:nowrap">' +
          (compareTotal > paidTotal + 0.001 ? '<span class="muted" style="font-size:12px;text-decoration:line-through">' + money(compareTotal) + '</span>' : '') +
          '<span style="font-weight:600;font-size:13.5px;color:var(--ink)">' + money(paidTotal) + '</span>' +
        '</div>' +
      '</div>' + subscriptionHtml +
      (discountHtml ? '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:0 14px 10px">' + discountHtml + '</div>' : '') +
      '<div style="border-top:1px solid var(--hair)">' + rows + '</div>' +
    '</div>';
  }

  function sharedOrderItemsHtml(detail) {
    const items = detail.items || [];
    const blocks = [];
    let index = 0;
    while (index < items.length) {
      if (items[index].bundle) {
        const name = items[index].bundle;
        const group = [];
        while (index < items.length && items[index].bundle === name) {
          group.push(items[index]);
          index += 1;
        }
        blocks.push(sharedBundleGroupHtml(name, group, detail.sub));
      } else {
        blocks.push('<div style="border:1px solid var(--hair);border-radius:8px;padding:0 14px">' + sharedNormalOrderItemHtml(items[index], detail.sub) + '</div>');
        index += 1;
      }
    }
    return blocks.join('<div style="height:10px"></div>');
  }

  function sharedOrderCardHtml(entry) {
    const order = entry.list;
    const detail = entry.detail;
    const orderDiscounts = detail.order_discounts || [];
    const shippingDiscounts = detail.shipping_discounts || [];
    const shipping = Number(detail.shipping_fee || 0);
    const total = Number(detail.total || order.total || 0);
    const discountRows = orderDiscounts.map((discount) =>
      '<div class="flex items-center justify-between gap-3" style="padding:4px 0;font-size:12px;color:#8B8B8B"><span class="flex items-center gap-1">' + I.tag + '<span>' + esc(discount.name) + '</span></span><span>-' + money(discount.amount) + '</span></div>').join('');
    const shippingDiscountRows = shippingDiscounts.map((discount) =>
      '<div class="flex items-center justify-between gap-3" style="padding:4px 0;font-size:12px;color:#8B8B8B"><span class="flex items-center gap-1">' + I.tag + '<span>' + esc(discount.name) + '</span></span><span>-' + money(discount.amount) + '</span></div>').join('');
    return '<div style="border:1px solid var(--hair);border-radius:10px;overflow:hidden;margin-bottom:12px">' +
      '<div class="flex items-start justify-between gap-4" style="padding:14px 16px;border-bottom:1px solid var(--hair)">' +
        '<div style="min-width:0"><div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:6px"><span style="font-size:15px;font-weight:600;color:var(--ink)">' + esc(detail.order_sn) + '</span>' +
          sharedOrderStatusCell(order) + sharedPaymentStatusCell(order) + sharedFulfillmentStatusCell(order) + sharedPurchaseTags(order, detail) +
        '</div><div class="muted" style="font-size:13px">' + esc(detail.create_time || order.create_time || '-') + '</div></div>' +
        '<div style="text-align:right"><div style="font-size:15px;font-weight:600;color:var(--ink)">' + money(total) + '</div><a class="lnk" href="#/orders/' + esc(order.order_id) + '" style="display:inline-block;margin-top:6px;font-size:13px">View detail</a></div>' +
      '</div>' +
      '<div style="padding:8px 16px">' + sharedOrderItemsHtml(detail) + '</div>' +
      '<div style="border-top:1px solid var(--hair);padding:12px 16px;font-size:13.5px;color:var(--ink-muted)">' +
        '<div class="flex items-center justify-between" style="padding:3px 0"><span>Subtotal · ' + esc(detail.total_num || 0) + ' items</span><span>' + money(detail.subtotal) + '</span></div>' +
        (orderDiscounts.length ? '<div class="flex items-center justify-between" style="padding:3px 0"><span>Order Discount</span><span></span></div>' : '') + discountRows +
        '<div class="flex items-center justify-between" style="padding:3px 0"><span>Shipping</span><span>' + (shipping > 0 ? money(shipping) : 'FREE') + '</span></div>' + shippingDiscountRows +
        '<div class="flex items-center justify-between" style="padding:6px 0;font-size:14px;font-weight:600;color:var(--ink)"><span>Total</span><span>' + money(total) + '</span></div>' +
        (Number(detail.total_savings || 0) > 0 ? '<div class="flex items-center justify-between" style="padding:6px 0;font-size:12px;font-weight:500;color:var(--ink-body)"><span class="flex items-center gap-1">' + I.tag + '<span>TOTAL SAVINGS ' + money(detail.total_savings) + '</span></span></div>' : '') +
        (Number(detail.refunded_amount || 0) > 0 ? '<div class="flex items-center justify-between" style="padding:4px 0;font-size:12px;color:#8B8B8B"><span>Refunded</span><span>-' + money(detail.refunded_amount) + '</span></div>' : '') +
        '<div class="flex items-center justify-between" style="padding:8px 0 0;border-top:1px solid var(--hair)"><span>Paid</span><span>' + money(detail.paid_amount) + '</span></div>' +
      '</div></div>';
  }

  function orderListCard(c) {
    const all = allOrdersForCustomer(c);
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / DET.orderSize));
    if (DET.orderPage > pages) DET.orderPage = pages;
    const start = (DET.orderPage - 1) * DET.orderSize;
    const pageOrders = all.slice(start, start + DET.orderSize);

    const ordersHtml = pageOrders.length ? pageOrders.map((order) => {
      if (order.kind === 'shared') return sharedOrderCardHtml(order);
      const cur = (order.country_currency_dto && order.country_currency_dto.currency_symbol) || '$';
      // Subtotal = sum of product_price rows (matches utils.getOrderSubtotalAmount when orderProduct present).
      const subtotal = (order.orderProduct || []).reduce((s, p) => s + Number.parseFloat(String(p.product_price || 0)), 0);
      // Shipping: total_postage first, else 0 (customer list endpoint has no pay_postage).
      const shipping = Number.parseFloat(String(order.total_postage != null ? order.total_postage : 0)) || 0;
      // Total: pay_price first, else total_price (matches utils.getOrderTotalAmount).
      const total = Number.parseFloat(String(order.pay_price != null ? order.pay_price : order.total_price || 0));
      const sourceDetail = window.DATA_ORDERS && window.DATA_ORDERS.DETAILS && (window.DATA_ORDERS.DETAILS[order.order_id] || window.DATA_ORDERS.DETAILS[Number(order.order_id)]);
      const detailLink = sourceDetail && String(sourceDetail.order_sn) === String(order.order_sn)
        ? '<a class="lnk" href="#/orders/' + esc(order.order_id) + '" style="display:inline-block;margin-top:6px;font-size:13px">View detail</a>'
        : '';

      const products = (order.orderProduct || []).map((p) => {
        const name = (p.cart_info && p.cart_info.product && p.cart_info.product.store_name) || 'Unnamed product';
        const sku = (p.cart_info && p.cart_info.productAttr && p.cart_info.productAttr.sku) || '';
        const dd = p.discount_detail && (p.discount_detail.activity_name || p.discount_detail.discount_code) ? p.discount_detail : null;
        const hasDisc = !!dd;
        const unit = Number(p.product_num) ? Number((Number(p.total_price) / Number(p.product_num)).toFixed(2)) : 0;
        return '<div style="display:grid;grid-template-columns:48px minmax(0,1fr) 84px 52px 88px;align-items:center;gap:12px;padding:6px 0">' +
          '<div style="width:40px;height:40px;border-radius:6px;border:1px solid var(--hair);background:var(--panel);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink-muted)">IMG</div>' +
          '<div style="min-width:0">' +
            '<div style="font-weight:500;font-size:13.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(name) + '</div>' +
            '<div class="muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(variantText(sku)) + '</div>' +
            (hasDisc ? '<div class="flex items-center gap-1 mt-1" style="font-size:12px;color:#8B8B8B">' + I.tag + '<span>' + esc(dd.activity_name || dd.discount_code) + ' (-' + money(dd.discount_amount, cur) + ')</span></div>' : '') +
          '</div>' +
          '<div class="muted" style="text-align:right;font-size:13px">' + money(unit, cur) + '</div>' +
          '<div class="muted" style="text-align:center;font-size:13px">x ' + p.product_num + '</div>' +
          '<div style="text-align:right;font-size:13px">' +
            '<div class="muted">' + money(p.product_price || p.total_price, cur) + '</div>' +
            (hasDisc ? '<div class="muted" style="text-decoration:line-through">' + money(p.total_price, cur) + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');

      // Order-dimension discounts (discount_form 1/2), shipping discounts, and total savings — all per utils.ts.
      const orderDisc = (order.orderDiscount || []).filter((d) => (d.activity_name || d.discount_code) && Number(d.discount_dimension) === 1 && (Number(d.discount_form) === 1 || Number(d.discount_form) === 2));
      const shipDiscAll = (order.orderDiscountInfo && order.orderDiscountInfo.shipping_discounts) || [];
      const visibleShipDisc = shipping > 0 ? shipDiscAll.slice(0, 1) : [];
      const primaryShipDisc = visibleShipDisc[0];

      const di = order.discount_info || {};
      const nonShip = Number.parseFloat(String(di.discount_price || 0)) || 0;
      const ship = Number.parseFloat(String(di.shipping_discount_total || 0)) || 0;
      let totalSavings = (nonShip > 0 || ship > 0) ? nonShip + ship : 0;
      if (!totalSavings) {
        const prodSav = (order.orderProduct || []).reduce((s, p) => s + (p.discount_detail && (p.discount_detail.activity_name || p.discount_detail.discount_code) ? Number.parseFloat(String(p.discount_detail.discount_amount || 0)) : 0), 0);
        const ordSav = orderDisc.reduce((s, d) => s + (Number.parseFloat(String(d.discount_amount || 0)) || 0), 0);
        const shipSav = shipDiscAll.reduce((s, d) => s + (Number.parseFloat(String(d.discount_amount || 0)) || 0), 0);
        totalSavings = prodSav + ordSav + shipSav;
      }

      const discRows = orderDisc.map((d) =>
        '<div class="flex items-center justify-between gap-3" style="padding:4px 0;font-size:12px;color:#8B8B8B">' +
          '<span class="flex items-center gap-1" style="min-width:0">' + I.tag + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(d.activity_name || d.discount_code) + '</span></span>' +
          '<span>-' + money(d.discount_amount, cur) + '</span>' +
        '</div>').join('');

      const shippingRow = primaryShipDisc
        ? '<span class="flex items-center gap-1"><span style="text-decoration:line-through">-' + money(primaryShipDisc.discount_amount, cur) + '</span><span>FREE</span></span>'
        : '<span>' + (shipping > 0 ? money(shipping, cur) : 'FREE') + '</span>';
      const shipDiscRows = visibleShipDisc.map((d) =>
        '<div class="flex items-center justify-between gap-3" style="padding:4px 0;font-size:12px;color:#8B8B8B">' +
          '<span class="flex items-center gap-1" style="min-width:0">' + I.tag + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(d.activity_name || d.discount_code || 'Free Shipping') + '</span></span>' +
          '<span>-' + money(d.discount_amount, cur) + '</span>' +
        '</div>').join('');

      return '<div style="border:1px solid var(--hair);border-radius:14px;overflow:hidden;margin-bottom:12px">' +
        '<div class="flex items-start justify-between gap-4" style="padding:14px 16px;border-bottom:1px solid var(--hair)">' +
          '<div style="min-width:0">' +
            '<div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:6px">' +
              '<span style="font-size:15px;font-weight:600;color:var(--ink)">' + esc(order.order_sn) + '</span>' +
              orderStatusCell(order) + paymentStatusCell(order) + fulfillmentStatusCell(order) +
            '</div>' +
            '<div class="muted" style="font-size:13px">' + esc(order.create_time || '-') + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:15px;font-weight:600;color:var(--ink)">' + money(total, cur) + '</div>' +
            detailLink +
          '</div>' +
        '</div>' +
        '<div style="padding:8px 16px">' + products + '</div>' +
        '<div style="border-top:1px solid var(--hair);padding:12px 16px;font-size:13.5px;color:var(--ink-muted)">' +
          '<div class="flex items-center justify-between" style="padding:3px 0"><span>Subtotal . ' + (order.total_num || 0) + ' items</span><span>' + money(subtotal, cur) + '</span></div>' +
          (orderDisc.length ? '<div class="flex items-center justify-between" style="padding:3px 0"><span>Order discount</span><span></span></div>' : '') +
          discRows +
          '<div class="flex items-center justify-between" style="padding:3px 0"><span>Shipping</span>' + shippingRow + '</div>' +
          shipDiscRows +
          '<div class="flex items-center justify-between" style="padding:6px 0;font-size:14px;font-weight:600;color:var(--ink)"><span>Total</span><span>' + money(total, cur) + '</span></div>' +
          (totalSavings > 0 ? '<div class="flex items-center justify-between" style="padding:6px 0;font-size:12px;font-weight:500;color:var(--ink-body)"><span class="flex items-center gap-1" style="text-transform:uppercase">' + I.tag + '<span>TOTAL SAVINGS ' + money(totalSavings, cur) + '</span></span></div>' : '') +
          (Number(order.paid || 0) === 1 ? '<div class="flex items-center justify-between" style="padding:8px 0 0;border-top:1px solid var(--hair)"><span>Paid</span><span>' + money(total, cur) + '</span></div>' : '') +
        '</div>' +
      '</div>';
    }).join('') : '<div style="border:1px solid var(--hair);border-radius:8px;padding:40px;text-align:center" class="muted">No orders</div>';

    const pagerFoot =
      '<div class="flex items-center justify-between" style="padding-top:4px">' +
        '<span class="muted" style="font-size:13px">' + (Number(c.orders_count || 0) > total ? 'Showing ' + total + ' of ' + Number(c.orders_count || 0) + ' orders' : 'Total ' + total + ' records') + '</span>' +
        (pages > 1 ? '<div class="pg" id="ord-pager">' +
          '<span class="pg-item' + (DET.orderPage <= 1 ? ' disabled' : '') + '"' + (DET.orderPage <= 1 ? '' : ' data-op="' + (DET.orderPage - 1) + '"') + '>‹</span>' +
          (function () { let s = ''; for (let p = 1; p <= pages; p++) s += '<span class="pg-item' + (p === DET.orderPage ? ' active' : '') + '" data-op="' + p + '">' + p + '</span>'; return s; })() +
          '<span class="pg-item' + (DET.orderPage >= pages ? ' disabled' : '') + '"' + (DET.orderPage >= pages ? '' : ' data-op="' + (DET.orderPage + 1) + '"') + '>›</span>' +
        '</div>' : '') +
      '</div>';

    return cardOpen('<span>Order list</span>') + ordersHtml + pagerFoot + '</div>';
  }

  // ---- TimelineCard.tsx (logs) ----
  function timelineCard(c) {
    const logs = c.logs || [];
    const items = logs.length ? logs.map((t, i, arr) =>
      '<div class="cl-item">' +
        '<div class="cl-rail"><div class="cl-dot"></div>' + (i < arr.length - 1 ? '<div class="cl-line"></div>' : '') + '</div>' +
        '<div class="cl-body" style="padding-bottom:' + (i < arr.length - 1 ? '14px' : '0') + '">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<span class="subtle" style="font-size:13px">' + esc(t.content || '--') + '</span>' +
            '<span class="muted" style="font-size:12px;white-space:nowrap">' + esc(t.create_time || '--') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>').join('') : '<div class="muted">No activity yet.</div>';
    return cardOpen('<span>Timeline</span>') + '<div>' + items + '</div></div>';
  }

  // ---- DetailsCard.tsx (email + phone) ----
  function detailsCard(c) {
    const phone = phoneText(c.phone_code, c.phone);
    return cardOpen('<span>Details</span>') +
      '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<div class="flex items-center gap-2" style="min-width:0">' +
          '<span style="color:var(--ink-muted);flex:none">' + I.mail + '</span>' +
          '<span class="subtle" style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + esc(c.email || 'No information') + '</span>' +
          (c.email ? '<button class="back-btn" data-act="copy-email" title="Copy email" style="width:28px;height:28px;background:transparent">' + I.copy + '</button>' : '') +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<span style="color:var(--ink-muted);flex:none">' + I.phone + '</span>' +
          '<span class="subtle" style="font-size:14px">' + esc(phone || 'No information') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- SubscriptionsCard.tsx ----
  function subscriptionsCard(c) {
    const date = (c.subscription && c.subscription.subscribe_time) || '- -';
    return cardOpen('<span>Subscriptions</span>') +
      '<div style="display:flex;flex-direction:column;gap:12px;font-size:14px">' +
        '<div class="flex items-center gap-2"><span class="muted">Email</span>' + mkBadge(c.marketing_status) + '</div>' +
        '<div class="muted">Subscription date: <span class="subtle">' + esc(date) + '</span></div>' +
      '</div>' +
    '</div>';
  }

  // ---- AddressCard.tsx (multi-country, ordered lines) ----
  function addressCard(c) {
    const loc = c.location || {};
    const name = [loc.first_name, loc.last_name].filter(Boolean).join(' ').trim() || loc.real_name || '';
    const cityStateZip = [loc.city, loc.province, loc.post_code].map((v) => String(v == null ? '' : v).trim()).filter(Boolean).join(' ');
    const rows = [
      name,
      String(loc.detail == null ? '' : loc.detail).trim(),
      String(loc.detail2 == null ? '' : loc.detail2).trim(),
      cityStateZip,
      String(loc.country == null ? '' : loc.country).trim(),
      String(loc.email == null ? '' : loc.email).trim(),
      phoneText(loc.phone_code, loc.phone),
    ].filter(Boolean);
    const body = rows.length
      ? rows.map((l) => '<div>' + esc(l) + '</div>').join('')
      : '<div class="subtle" style="font-weight:500">No address</div>';
    return cardOpen('<span>Address</span>') +
      '<div class="muted" style="font-size:14px;display:flex;flex-direction:column;gap:6px;overflow-wrap:anywhere">' + body + '</div>' +
    '</div>';
  }

  // ---- NotesCard.tsx (editable via modal) ----
  function notesCard(c) {
    const note = c.note ? esc(c.note) : '<span class="muted">No notes</span>';
    return cardOpen('<span>Notes</span>', '<button class="back-btn" data-act="edit-note" title="Edit note" style="width:28px;height:28px;background:transparent">' + I.pencil + '</button>') +
      '<div class="subtle" style="font-size:13.5px;line-height:1.6">' + note + '</div>' +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Customer #' + esc(id) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Detail not available in this prototype</div>' +
        '<div class="muted">Open one of the customers flagged with sample detail: Emma Whitfield, Yuki Tanaka, Ava Johnson or the Toronto guest shopper.</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/customers'; };
  }

  function wireDetail(c) {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = () => { location.hash = '#/customers'; };
    const ce = root.querySelector('[data-act="copy-email"]'); if (ce) ce.onclick = () => { try { navigator.clipboard.writeText(c.email); } catch (e) {} toast('Copied'); };
    const en = root.querySelector('[data-act="edit-note"]'); if (en) en.onclick = () => openEditNoteModal(c);
    root.querySelectorAll('#ord-pager [data-op]').forEach((el) => el.onclick = () => { DET.orderPage = Number(el.getAttribute('data-op')); renderDetail(c.id); });
  }

  // ================= MODAL (Edit note — NotesCard.tsx) =================
  function modal(opts) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (opts.width) m.style.width = opts.width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + opts.title + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body">' + opts.body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>' + (opts.okText || 'Save') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => opts.onOk(m, close);
    return { m, close };
  }

  function openEditNoteModal(c) {
    const maxLen = 5000;
    const body =
      '<label class="ctrl-label" style="text-transform:none">Note</label>' +
      '<textarea class="input" id="n-note" rows="5" maxlength="' + maxLen + '" placeholder="Enter note" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(c.note || '') + '</textarea>' +
      '<div class="flex items-center justify-between" style="margin-top:6px">' +
        '<span id="n-err" style="color:var(--err);font-size:12px"></span>' +
        '<span class="muted" id="n-count" style="font-size:12px">' + String((c.note || '').length) + '/' + maxLen + '</span>' +
      '</div>';
    const ctrl = modal({
      title: 'Edit note', width: 620, okText: 'Save',
      body,
      onOk: (m, close) => {
        const val = m.querySelector('#n-note').value;
        if (!val.trim()) { m.querySelector('#n-err').textContent = "Can't be blank"; return; }
        c.note = val.trim();
        close(); toast('Updated'); renderDetail(c.id);
      },
    });
    const ta = ctrl.m.querySelector('#n-note');
    const count = ctrl.m.querySelector('#n-count');
    ta.oninput = () => { count.textContent = ta.value.length + '/' + maxLen; if (ta.value.trim()) ctrl.m.querySelector('#n-err').textContent = ''; };
  }

  // ================= ROUTER (SPA: registered with the shell router) =================
  function goDetail(id) { DET.orderPage = 1; location.hash = '#/customers/' + id; }

  function route(rest) {
    closePops();
    if (rest) {
      renderDetail(decodeURIComponent(rest));
      if (root && root.parentElement) {
        root.parentElement.scrollTop = 0;
        root.parentElement.scrollLeft = 0;
      }
    }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.customers = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
