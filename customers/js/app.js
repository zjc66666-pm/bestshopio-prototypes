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

  function renderDetail(id) {
    const c = D.DETAILS[id] || D.DETAILS[Number(id)];
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
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center gap-3" style="flex-wrap:wrap;margin-bottom:12px">' +
        '<div style="font-size:16px;font-weight:600;color:var(--ink)">' + esc(displayName(c)) + '</div>' +
        acctBadge(c.account_status) +
      '</div>' +
      '<div class="muted" style="font-size:13px;margin-bottom:6px">Last signed in : <span class="subtle">' + esc(c.last_time || '- -') + '</span></div>' +
      '<div class="muted" style="font-size:13px">Source : <span class="subtle">' + esc(c.create_time || '') + ' from ' + esc(c.source || '-') + '</span></div>' +
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
  function orderListCard(c) {
    const all = D.ORDERS[c.id] || D.ORDERS[Number(c.id)] || [];
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / DET.orderSize));
    if (DET.orderPage > pages) DET.orderPage = pages;
    const start = (DET.orderPage - 1) * DET.orderSize;
    const pageOrders = all.slice(start, start + DET.orderSize);

    const ordersHtml = pageOrders.length ? pageOrders.map((order) => {
      const cur = (order.country_currency_dto && order.country_currency_dto.currency_symbol) || '$';
      // Subtotal = sum of product_price rows (matches utils.getOrderSubtotalAmount when orderProduct present).
      const subtotal = (order.orderProduct || []).reduce((s, p) => s + Number.parseFloat(String(p.product_price || 0)), 0);
      // Shipping: total_postage first, else 0 (customer list endpoint has no pay_postage).
      const shipping = Number.parseFloat(String(order.total_postage != null ? order.total_postage : 0)) || 0;
      // Total: pay_price first, else total_price (matches utils.getOrderTotalAmount).
      const total = Number.parseFloat(String(order.pay_price != null ? order.pay_price : order.total_price || 0));

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
            '<div class="muted" style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(sku) + '</div>' +
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
            '<a class="lnk" href="#/orders/' + esc(order.order_id) + '" style="display:inline-block;margin-top:6px;font-size:13px">View detail</a>' +
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
        '<span class="muted" style="font-size:13px">Total ' + total + ' records</span>' +
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
    if (rest) { renderDetail(decodeURIComponent(rest)); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.customers = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
