/* BestShopio Admin · Orders prototype — list + detail + modals, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin orders:
     - views/admin/orders/pages/list.tsx + components/list/* (tabs, search, table)
     - views/admin/orders/pages/detial.tsx + components/detail/* (cards, modals) */
(function () {
  const D = window.DATA_ORDERS;
  let root; // set by the SPA shell router via VIEWS.orders.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>', 14),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', 18),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    tag: svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 13),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- status -> pill mapping ----
  // OrderStatusCell.tsx: to_pay->orange; to_ship(status 0,paid)->blue; shipped/review/
  //   archived(Done)->gray(undefined); refund(Refunded)->red; cancel(Canceled)->red.
  const ORDER_STATUS = {
    to_pay:   { text: 'To pay',          cls: 'pill-orange' },
    to_ship:  { text: 'To ship',         cls: 'pill-blue' },
    shipped:  { text: 'Shipped',         cls: 'pill-gray' },
    review:   { text: 'Awaiting Review', cls: 'pill-gray' },
    archived: { text: 'Done',            cls: 'pill-gray' },
    refund:   { text: 'Refunded',        cls: 'pill-red' },
    cancel:   { text: 'Canceled',        cls: 'pill-red' },
  };
  // PaymentStatusCell.tsx: Paid -> gray(undefined); Unpaid -> orange.
  const PAY_STATUS = {
    paid:   { text: 'Paid',   cls: 'pill-gray' },
    unpaid: { text: 'Unpaid', cls: 'pill-orange' },
  };
  // FulfillmentStatusCell.tsx: only Fulfilled(gray) / Unfulfilled(orange) / '--'.
  const FULFILL_STATUS = {
    fulfilled:   { text: 'Fulfilled',   cls: 'pill-gray' },
    unfulfilled: { text: 'Unfulfilled', cls: 'pill-orange' },
    '--':        { text: '--', dash: true },
  };
  const pill = (map, key) => {
    const m = map[key] || { text: key, cls: 'pill-gray' };
    if (m.dash) return '<span class="muted">--</span>';
    return '<span class="pill ' + m.cls + '"><span class="dot"></span>' + esc(m.text) + '</span>';
  };

  // Fulfillment is derived from order status (FulfillmentStatusCell.mapOrderStatus +
  // mapFulfillment): refund -> '--'; shipped/review/archived -> Fulfilled; else Unfulfilled.
  function deriveFulfillment(orderStatus) {
    if (orderStatus === 'refund') return '--';
    if (orderStatus === 'shipped' || orderStatus === 'review' || orderStatus === 'archived') return 'fulfilled';
    return 'unfulfilled';
  }

  // ---- count rows per tab (for tab badges) ----
  // tab badges reflect the active search/total filter (mirrors the live admin), excluding the tab itself
  const tabCount = (key) => { const base = nonTabFiltered(); return key === 'all' ? base.length : base.filter((o) => o.order_status === key).length; };

  // ================= LIST VIEW =================
  const LST = {
    tab: 'all', kwType: 'order_sn', kw: '', kwApplied: '',
    timeType: 'create_date', dateStart: '', dateEnd: '',
    totalMin: '', totalMax: '', totalApplied: false,
    page: 1, size: 20,
  };

  // everything EXCEPT the status-tab filter (so tab badges can count this set)
  function nonTabFiltered() {
    let rows = D.ORDERS.slice();
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((o) => {
        switch (LST.kwType) {
          case 'order_sn': return o.order_sn.toLowerCase().includes(q);
          case 'receiver': return (o.shipping.name || '').toLowerCase().includes(q);
          case 'email': return (o.shipping.email || '').toLowerCase().includes(q);
          case 'phone': return (o.shipping.phone || '').toLowerCase().includes(q);
          case 'country': return (o.shipping.country || '').toLowerCase().includes(q);
          case 'nickname': return (o.user.nickname || '').toLowerCase().includes(q);
          default: return JSON.stringify(o).toLowerCase().includes(q);
        }
      });
    }
    if (LST.totalApplied) {
      const lo = LST.totalMin === '' ? -Infinity : Number(LST.totalMin);
      const hi = LST.totalMax === '' ? Infinity : Number(LST.totalMax);
      rows = rows.filter((o) => o.total >= lo && o.total <= hi);
    }
    return rows;
  }

  function filteredRows() {
    let rows = nonTabFiltered();
    if (LST.tab !== 'all') rows = rows.filter((o) => o.order_status === LST.tab);
    return rows;
  }

  function shipName(o) {
    const s = o.shipping || {};
    return [s.first_name, s.last_name].filter(Boolean).join(' ') || s.name || '--';
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
    const timeOpts = D.TIME_OPTIONS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.timeType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const tabsHtml = D.TABS.map((t) =>
      '<div class="tab' + (t.key === LST.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + tabCount(t.key) + '</span></div>').join('');

    // filter tags row (active keyword / date / total) — mirrors search.tsx blue Tags
    const tags = [];
    if (LST.kwApplied) {
      const lbl = (D.KEYWORD_OPTIONS.find((o) => o.value === LST.kwType) || {}).label || '';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.dateStart && LST.dateEnd) {
      const lbl = (D.TIME_OPTIONS.find((o) => o.value === LST.timeType) || {}).label || '';
      tags.push('<span class="field-pill" data-clear="date">' + esc(lbl) + ': ' + esc(LST.dateStart) + ' ~ ' + esc(LST.dateEnd) + ' <span class="x">&times;</span></span>');
    }
    if (LST.totalApplied) {
      const txt = (LST.totalMin !== '' ? money(LST.totalMin) : 'Min') + ' – ' + (LST.totalMax !== '' ? money(LST.totalMax) : 'Max');
      tags.push('<span class="field-pill" data-clear="total">Total range: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }

    const totalChipText = LST.totalApplied
      ? ((LST.totalMin !== '' ? money(LST.totalMin) : 'Min') + ' – ' + (LST.totalMax !== '' ? money(LST.totalMax) : 'Max'))
      : 'Total range';

    root.innerHTML =
      // list.tsx header: just the page title, no action buttons
      '<div class="mb-4"><h1 class="page-title">Orders</h1></div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="ord-tabs">' + tabsHtml + '</div>' +
        // filter bar (search.tsx: keyword group / time group / total-range chip)
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            '<div class="flex" style="min-width:428px">' +
              '<select class="filter-select" id="kw-type" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:52px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span class="kw-clear" data-kw-clear title="Clear">&times;</span>' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="flex" style="min-width:428px">' +
              '<select class="filter-select" id="time-type" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0">' + timeOpts + '</select>' +
              // dual-month English range picker (widgets.js) — hidden inputs keep ids so wireList reads them
              '<div class="ui-range filter-input" data-ui-range style="width:268px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px;padding-left:12px;padding-right:10px">' +
                '<input type="hidden" id="date-start" data-range="start" value="' + esc(LST.dateStart) + '" />' +
                '<input type="hidden" id="date-end" data-range="end" value="' + esc(LST.dateEnd) + '" />' +
              '</div>' +
            '</div>' +
            '<div class="sel-trigger" id="total-chip" style="width:240px">' +
              '<span class="' + (LST.totalApplied ? '' : 'muted') + '">' + esc(totalChipText) + '</span>' + I.chevDown +
            '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table (table.tsx columns + leading row-selection checkbox)
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1320px">' +
          '<thead><tr>' +
            '<th style="width:48px;text-align:center"><input type="checkbox" class="ord-check-all" /></th>' +
            '<th>Order number</th><th>Order date</th><th>User</th><th>Shipping address</th>' +
            '<th>Total</th><th>Order status</th><th>Payment status</th>' +
            '<th>Payment method</th><th>Fulfillment status</th><th style="text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="ord-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="11" style="text-align:center;padding:40px" class="muted">No orders match these filters.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        // pagination footer (table.tsx: "Total N records" + Ant Pagination)
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + totalRecords + ' records</span>' +
          pagerHtml(LST.page, pages) +
        '</div>' +
      '</div>';

    wireList();
  }

  function rowHtml(o) {
    const ful = deriveFulfillment(o.order_status);
    return '<tr data-id="' + o.order_id + '">' +
      '<td style="text-align:center"><input type="checkbox" class="ord-check" data-id="' + o.order_id + '" /></td>' +
      '<td style="font-weight:600;color:var(--brand)">' + esc(o.order_sn) + '</td>' +
      '<td class="muted">' + esc(o.create_time) + '</td>' +
      '<td>' + esc(o.user.nickname) + '</td>' +
      // shipping address: name + chevron, click opens full-address popover (table.tsx Popover)
      '<td style="max-width:200px">' +
        '<span class="ship-cell" data-ship="' + o.order_id + '" style="display:inline-flex;align-items:center;gap:4px;max-width:100%;cursor:pointer">' +
          '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(shipName(o)) + '</span>' +
          '<span class="muted" style="display:inline-flex">' + I.chevDown + '</span>' +
        '</span>' +
      '</td>' +
      '<td style="font-weight:600;color:var(--ink)">' + money(o.total) + '</td>' +
      '<td>' + pill(ORDER_STATUS, o.order_status) + '</td>' +
      '<td>' + pill(PAY_STATUS, o.payment_status) + '</td>' +
      '<td class="muted">' + esc(o.payment_method) + '</td>' +
      '<td>' + pill(FULFILL_STATUS, ful) + '</td>' +
      '<td style="text-align:center"><button class="back-btn" data-view="' + o.order_id + '" title="Detail" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
    root.querySelectorAll('#ord-tabs .tab').forEach((t) => t.onclick = () => { LST.tab = t.getAttribute('data-tab'); LST.page = 1; renderList(); });
    const kwType = root.querySelector('#kw-type');
    const kwInput = root.querySelector('#kw-input');
    if (kwType) kwType.onchange = () => { LST.kwType = kwType.value; };
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    const kwClear = root.querySelector('[data-kw-clear]');
    if (kwClear) kwClear.onclick = () => { LST.kw = ''; LST.kwApplied = ''; LST.page = 1; renderList(); };
    const timeType = root.querySelector('#time-type');
    if (timeType) timeType.onchange = () => { LST.timeType = timeType.value; };
    const ds = root.querySelector('#date-start'), de = root.querySelector('#date-end');
    // range picker writes both hidden inputs then fires change on #date-end only -> one re-render
    const applyDates = () => { LST.dateStart = ds ? ds.value : ''; LST.dateEnd = de ? de.value : ''; LST.page = 1; renderList(); };
    if (ds) ds.onchange = applyDates;
    if (de) de.onchange = applyDates;
    const chip = root.querySelector('#total-chip');
    if (chip) chip.onclick = () => openTotalPopover(chip);
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'date') { LST.dateStart = ''; LST.dateEnd = ''; }
      if (k === 'total') { LST.totalApplied = false; LST.totalMin = ''; LST.totalMax = ''; }
      LST.page = 1; renderList();
    });
    const ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row click -> detail (but not when clicking checkbox / ship popover / view button)
    root.querySelectorAll('#ord-tbody tr[data-id]').forEach((tr) => tr.onclick = (e) => {
      if (e.target.closest('.ord-check') || e.target.closest('.ship-cell') || e.target.closest('[data-view]')) return;
      goDetail(tr.getAttribute('data-id'));
    });
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goDetail(b.getAttribute('data-view')); });
    // shipping-address popover
    root.querySelectorAll('.ship-cell').forEach((c) => c.onclick = (e) => { e.stopPropagation(); openShipPopover(c, c.getAttribute('data-ship')); });
    // select-all checkbox (visual only)
    const all = root.querySelector('.ord-check-all');
    if (all) all.onchange = () => { root.querySelectorAll('.ord-check').forEach((c) => { c.checked = all.checked; }); };
  }

  // shipping-address popover (table.tsx renderShippingAddressDetail)
  function openShipPopover(anchor, id) {
    closePops();
    const o = D.ORDERS.find((r) => String(r.order_id) === String(id));
    if (!o) return;
    const s = o.shipping || {};
    const lines = [];
    if (s.detail) lines.push(esc(s.detail));
    if (s.detail2) lines.push(esc(s.detail2));
    const cityLine = [s.city, s.province, s.post_code].filter(Boolean).map(esc).join(' ');
    if (cityLine) lines.push(cityLine);
    if (s.country) lines.push(esc(s.country));
    if (s.email) lines.push(esc(s.email));
    if (s.phone) lines.push('+' + esc(s.phone_code) + ' ' + esc(s.phone));
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:300px;max-width:420px;padding:14px;line-height:1.9"></div>');
    pop.innerHTML = '<div style="font-weight:600;color:var(--ink)">' + esc(shipName(o)) + '</div>' +
      lines.map((l) => '<div class="subtle" style="font-size:13px">' + l + '</div>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  function openTotalPopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:260px;padding:14px"></div>');
    pop.innerHTML =
      '<div class="ctrl-label" style="margin-bottom:8px">Total range</div>' +
      '<div class="flex items-center gap-2">' +
        '<input class="input" id="tr-min" placeholder="Min" type="number" value="' + esc(LST.totalMin) + '" style="width:96px" />' +
        '<span class="muted">to</span>' +
        '<input class="input" id="tr-max" placeholder="Max" type="number" value="' + esc(LST.totalMax) + '" style="width:96px" />' +
      '</div>' +
      '<div class="flex justify-end gap-2 mt-3">' +
        '<button class="btn btn-default" data-x>Clear</button>' +
        '<button class="btn btn-primary" data-apply>Apply</button>' +
      '</div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelector('[data-apply]').onclick = () => {
      LST.totalMin = pop.querySelector('#tr-min').value;
      LST.totalMax = pop.querySelector('#tr-max').value;
      LST.totalApplied = LST.totalMin !== '' || LST.totalMax !== '';
      LST.page = 1; closePops(); renderList();
    };
    pop.querySelector('[data-x]').onclick = () => { LST.totalApplied = false; LST.totalMin = ''; LST.totalMax = ''; LST.page = 1; closePops(); renderList(); };
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ================= DETAIL VIEW =================
  function renderDetail(id) {
    const o = D.DETAILS[id] || D.DETAILS[Number(id)];
    if (!o) { renderMissing(id); return; }

    const fulfillment = deriveFulfillment(o.status);

    // Action visibility mirrors detial.tsx computed flags:
    //   showVerifyOrder = order_type !== 0 && paid === 1
    //   showShipping    = (order_type 0|2) && status === 'to_ship' && paid === 1
    //   showEditAddr    = order_type === 0 && status === 'to_ship' && paid === 1
    //   showRefund      = status !== 'refund' && paid === 1 && status not done/failed
    const showVerify = o.order_type !== 0 && o.paid === 1;
    const showShipping = (o.order_type === 0 || o.order_type === 2) && o.status === 'to_ship' && o.paid === 1;
    const showEditAddr = o.order_type === 0 && o.status === 'to_ship' && o.paid === 1;
    const showRefund = o.status !== 'refund' && o.paid === 1 && o.status !== 'cancel' && o.status !== 'archived';

    // All detail actions are primary (blue) buttons with plain labels (no icons).
    const actions =
      (showVerify ? '<button class="btn btn-primary" data-act="verify">Verify order</button>' : '') +
      (showShipping ? '<button class="btn btn-primary" data-act="fulfill">Shipping</button>' : '') +
      (showEditAddr ? '<button class="btn btn-primary" data-act="edit-address">Edit shipping address</button>' : '') +
      (showRefund ? '<button class="btn btn-primary" data-act="refund">Refund</button>' : '');

    root.innerHTML =
      '<div class="detail-wrap">' +
        // header: back square + order_sn + copy + 3 status pills | actions
        '<div class="flex items-center justify-between mb-4">' +
          '<div class="flex items-center gap-3">' +
            '<button class="back-btn" data-act="back" title="Back">' + I.arrowLeft + '</button>' +
            '<div class="flex items-center gap-2" style="flex-wrap:wrap">' +
              '<span class="page-title">' + esc(o.order_sn) + '</span>' +
              '<button class="back-btn" data-act="copy" title="Copy" style="width:30px;height:30px;background:transparent">' + I.copy + '</button>' +
              pill(ORDER_STATUS, o.status) + pill(PAY_STATUS, o.payment_status) + pill(FULFILL_STATUS, fulfillment) +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2">' + actions + '</div>' +
        '</div>' +
        // two-column body (main + 275px rail) — detial.tsx layout
        '<div class="detail-cols">' +
          '<div class="detail-main">' +
            productsCard(o, fulfillment) +
            amountCard(o) +
            shippingAddressCard(o) +
            shippingLogisticsCard(o) +
            timelineCard(o) +
          '</div>' +
          '<div class="detail-rail">' +
            notesCard(o) +
            userCard(o) +
          '</div>' +
        '</div>' +
      '</div>';

    wireDetail(o);
  }

  function cardOpen(titleHtml, rightHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div class="card-title flex items-center gap-2">' + titleHtml + '</div>' +
        (rightHtml || '') +
      '</div>';
  }

  // ---- Products card: flat ant List (ProductsCard.tsx) — title + SKU + discount tags ----
  function productsCard(o, fulfillment) {
    const items = (o.items || []).map((it, i, arr) => {
      const hasDisc = (it.discounts || []).length > 0;
      const disc = (it.discounts || []).map((d) =>
        '<div class="flex items-center gap-1 mt-1" style="font-size:12px;color:#8B8B8B">' + I.tag +
        '<span>' + esc(d.name) + ' (-' + money(d.amount) + ')</span></div>').join('');
      // grid: [1fr 140px 80px] — left product, middle unit×qty, right line price (after disc) + struck original
      return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 140px 80px;gap:16px;align-items:flex-start;padding:14px 0' +
          (i < arr.length - 1 ? ';border-bottom:1px solid var(--hair)' : '') + '">' +
        '<div class="flex items-center gap-3" style="min-width:0">' +
          '<img src="' + it.image + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none" />' +
          '<div style="min-width:0">' +
            '<div style="font-weight:500;font-size:13.5px;color:var(--ink);line-height:1.35">' + esc(it.title) + '</div>' +
            '<div class="muted" style="font-size:12px">' + esc(it.sku) + '</div>' +
            disc +
          '</div>' +
        '</div>' +
        '<div class="muted" style="font-size:13px">' + money(it.unit_price) + ' x ' + it.qty + '</div>' +
        '<div style="font-size:13px;font-weight:500;color:var(--ink-body)">' +
          '<div>' + money(it.product_price) + '</div>' +
          (hasDisc ? '<div class="muted" style="text-decoration:line-through">' + money(it.line_total) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    const inner = '<div style="border:1px solid var(--hair);border-radius:10px;padding:0 16px">' + items + '</div>';
    return cardOpen('<span>Product</span>' + pill(FULFILL_STATUS, fulfillment)) + inner + '</div>';
  }

  // ---- Amount card (AmountCard.tsx): subtotal / order discounts / shipping / total / savings / paid ----
  function amountCard(o) {
    const row = (label, valHtml, opts) => {
      opts = opts || {};
      return '<div class="flex items-center justify-between" style="padding:7px 0;' + (opts.border ? 'border-top:1px solid var(--hair);margin-top:2px;padding-top:12px;' : '') + '">' +
        '<div style="' + (opts.sub ? 'font-size:12px;color:#8B8B8B;display:flex;align-items:center;gap:4px' : 'font-size:13.5px;color:var(--ink-body)') + (opts.bold ? ';font-weight:700;color:var(--ink)' : '') + '">' + (opts.sub ? I.tag : '') + label + '</div>' +
        '<div style="' + (opts.sub ? 'font-size:12px;color:#8B8B8B' : 'font-size:13.5px;font-weight:500;color:var(--ink)') + (opts.bold ? ';font-weight:700' : '') + '">' + valHtml + '</div>' +
      '</div>';
    };
    const shipFee = Number(o.shipping_fee || 0);
    const orderDiscs = o.order_discounts || [];
    const shipDisc = (o.shipping_discounts || [])[0];

    let body = row('Subtotal <span class="muted" style="margin-left:6px">· ' + (o.total_num || 0) + ' items</span>', money(o.subtotal));
    // order discounts (header label + each discount sub-row), mirroring AmountCard
    if (orderDiscs.length) {
      body += row('Order discount', '');
      orderDiscs.forEach((d) => { body += row(esc(d.name), '-' + money(d.amount), { sub: true }); });
    }
    // shipping line: struck -amount + FREE when a shipping discount applies and shipping > 0
    if (shipDisc && shipFee > 0) {
      body += row('Shipping', '<span class="muted" style="text-decoration:line-through;margin-right:6px">-' + money(shipDisc.amount) + '</span><span>FREE</span>');
      body += row(esc(shipDisc.name || 'Free Shipping'), '-' + money(shipDisc.amount), { sub: true });
    } else {
      body += row('Shipping', shipFee > 0 ? money(shipFee) : 'FREE');
    }
    body += row('Total', money(o.total), { border: true, bold: true });
    if ((o.total_savings || 0) > 0) body += row('TOTAL SAVINGS ' + money(o.total_savings), '', { sub: true });
    body += row('Paid', money(o.paid_amount));
    return cardOpen('<span>Amount</span>' + pill(PAY_STATUS, o.payment_status)) + body + '</div>';
  }

  function descRow(label, val) {
    return '<div style="display:flex;padding:6px 0"><div class="muted" style="width:120px;flex:none;font-size:13px">' + label + '</div>' +
      '<div class="subtle" style="font-size:13px;min-width:0;word-break:break-word">' + (val || '--') + '</div></div>';
  }

  // ---- Shipping address card (ShippingAddressCard.tsx): 2-col, no inline edit ----
  function shippingAddressCard(o) {
    const s = o.shipping;
    const phone = s.phone ? ('+' + esc(s.phone_code) + ' ' + esc(s.phone)) : '';
    const grid =
      '<div class="grid grid-cols-2" style="gap:0 16px">' +
        descRow('First name', esc(s.first_name)) + descRow('Last name', esc(s.last_name)) +
        descRow('Address', esc(s.detail)) + descRow('Apartment', esc(s.detail2)) +
        descRow('City', esc(s.city)) + descRow('State', esc(s.province)) +
        descRow('ZIP code', esc(s.post_code)) + descRow('Country', esc(s.country)) +
        descRow('Phone', phone) + descRow('Email', esc(s.email)) +
      '</div>';
    return cardOpen('<span>Shipping address</span>') + grid + '</div>';
  }

  // ---- Shipping logistics card (ShippingLogisticsCard.tsx): order-level delivery ----
  function shippingLogisticsCard(o) {
    const tn = o.delivery_id && o.delivery_id !== '—' ? o.delivery_id : '';
    const track = tn ? '<a class="lnk" href="https://t.17track.net/en#nums=' + encodeURIComponent(tn) + '" target="_blank" rel="noreferrer">Order tracking</a>' : '';
    const grid =
      '<div class="grid grid-cols-2" style="gap:0 16px">' +
        descRow('Logistics', esc(o.delivery_name || '')) +
        '<div style="display:flex;padding:6px 0"><div class="muted" style="width:120px;flex:none;font-size:13px">Tracking number</div>' +
          '<div class="subtle flex items-center gap-2" style="font-size:13px">' + (tn ? esc(tn) : '--') + ' ' + track + '</div></div>' +
      '</div>';
    return cardOpen('<span>Shipping logistics</span>') + grid + '</div>';
  }

  // ---- Timeline card (TimelineCard.tsx): label left, time right; Ant Empty when none ----
  function timelineCard(o) {
    const list = o.timeline || [];
    const items = list.map((t, i, arr) =>
      '<div class="cl-item">' +
        '<div class="cl-rail"><div class="cl-dot"></div>' + (i < arr.length - 1 ? '<div class="cl-line"></div>' : '') + '</div>' +
        '<div class="cl-body" style="padding-bottom:' + (i < arr.length - 1 ? '14px' : '0') + '">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<span class="subtle" style="font-size:13px">' + esc(t.label || '--') + '</span>' +
            '<span class="muted" style="font-size:12px;white-space:nowrap">' + esc(t.time || '--') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>').join('');
    const empty = '<div class="muted" style="text-align:center;padding:18px 0;font-size:13px">No data</div>';
    return cardOpen('<span>Timeline</span>') + '<div>' + (items || empty) + '</div></div>';
  }

  // ---- Notes card (NotesCard.tsx): single note value + pencil-edit ----
  function notesCard(o) {
    const note = o.note ? esc(o.note) : '<span class="muted">No notes</span>';
    const editBtn = '<button class="back-btn" data-act="edit-note" title="Edit" style="width:28px;height:28px;background:transparent">' + I.pencil + '</button>';
    return cardOpen('<span>Notes</span>', editBtn) +
      '<div class="subtle" style="font-size:13px;white-space:pre-wrap">' + note + '</div>' +
    '</div>';
  }

  // ---- User card (UserCard.tsx): Nickname + User ID only ----
  function userCard(o) {
    return cardOpen('<span>User</span>') +
      descRow('Nickname', esc(o.user.nickname)) +
      descRow('User ID', String(o.user.uid)) +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="detail-wrap">' +
        '<div class="flex items-center gap-3 mb-4">' +
          '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
          '<span class="page-title">#' + esc(id) + '</span>' +
        '</div>' +
        '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Detail not available in this prototype</div>' +
          '<div class="muted">Open one of the orders with sample detail: SILIX1042, SILIX1041, SILIX1040, SILIX1039 or SILIX1037.</div></div></div>' +
      '</div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/orders'; };
  }

  function wireDetail(o) {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = () => { location.hash = '#/orders'; };
    const copy = root.querySelector('[data-act="copy"]'); if (copy) copy.onclick = () => { try { navigator.clipboard.writeText(o.order_sn); } catch (e) {} toast('Copied'); };
    const ful = root.querySelector('[data-act="fulfill"]'); if (ful) ful.onclick = () => openShippingModal(o);
    const ref = root.querySelector('[data-act="refund"]'); if (ref) ref.onclick = () => openRefundModal(o);
    const ver = root.querySelector('[data-act="verify"]'); if (ver) ver.onclick = () => openVerifyModal(o);
    const ea = root.querySelector('[data-act="edit-address"]'); if (ea) ea.onclick = () => openEditAddressModal(o);
    const en = root.querySelector('[data-act="edit-note"]'); if (en) en.onclick = () => openEditNoteModal(o);
  }

  // ================= MODALS =================
  function modal({ title, body, width, okText, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.style.maxWidth = 'calc(100vw - 32px)';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
        '<span class="drawer-x" data-x>' + I.x + '</span></div>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>' + (okText || 'Save') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    return { m, close };
  }

  // Shipping modal (ShippingButton.tsx): Logistics + Tracking number, ok=Confirm
  function openShippingModal(o) {
    const body =
      '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Logistics <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="f-carrier" placeholder="Please enter Logistics" value="' + esc(o.delivery_name || '') + '" style="margin-top:4px" /></div>' +
      '<div><label class="ctrl-label" style="text-transform:none">Tracking number <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="f-tracking" placeholder="Please enter Tracking number" value="' + esc(o.delivery_id || '') + '" style="margin-top:4px" /></div>' +
      '<div id="f-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: 'Shipping', width: 520, okText: 'Confirm',
      body,
      onOk: (m, close) => {
        const carrier = m.querySelector('#f-carrier').value.trim();
        const tracking = m.querySelector('#f-tracking').value.trim();
        const e = m.querySelector('#f-err');
        if (!carrier) { e.textContent = 'Please enter Logistics'; e.style.display = 'block'; return; }
        if (!tracking) { e.textContent = 'Please enter Tracking number'; e.style.display = 'block'; return; }
        close(); toast('Shipped');
      },
    });
  }

  // Refund modal (RefundOrderModal.tsx): Refund amount + Reason for refund, ok=Save
  function openRefundModal(o) {
    const body =
      '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Refund amount <span style="color:var(--err)">*</span></label>' +
        '<div style="position:relative;margin-top:4px"><span class="muted" style="position:absolute;left:12px;top:8px">$</span>' +
        '<input class="input" id="rf-amt" type="number" step="0.01" min="0" placeholder="0.00" style="padding-left:24px" /></div></div>' +
      '<div><label class="ctrl-label" style="text-transform:none">Reason for refund <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="rf-reason" placeholder="Please enter Refund reason" style="margin-top:4px" />' +
        '<div class="muted" style="font-size:12px;margin-top:6px">Only you and other staff can see this reason</div></div>' +
      '<div id="rf-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: 'Refund', width: 920, okText: 'Save',
      body,
      onOk: (m, close) => {
        const amt = Number(m.querySelector('#rf-amt').value);
        const reason = m.querySelector('#rf-reason').value.trim();
        const e = m.querySelector('#rf-err');
        if (!amt || amt <= 0) { e.textContent = 'Please enter Refund amount'; e.style.display = 'block'; return; }
        if (amt > o.paid_amount + 0.001) { e.textContent = 'Refund cannot exceed the paid amount (' + money(o.paid_amount) + ').'; e.style.display = 'block'; return; }
        if (!reason) { e.textContent = 'Please enter Refund reason'; e.style.display = 'block'; return; }
        close(); toast('Refund submitted');
      },
    });
  }

  // Verify order modal (VerifyOrderButton.tsx): Order/Code header + product table + qty, ok=Verify
  function openVerifyModal(o) {
    const items = o.items || [];
    const rowsHtml = items.map((it, i) => {
      const remaining = it.remaining != null ? it.remaining : it.qty;
      return '<tr>' +
        '<td style="width:40px;text-align:center"><input type="checkbox" class="vf-pick" data-i="' + i + '"' + (remaining <= 0 ? ' disabled' : '') + ' /></td>' +
        '<td><div class="flex items-center gap-3"><img src="' + it.image + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none" />' +
          '<div style="min-width:0"><div style="font-weight:500;font-size:13px">' + esc(it.title) + '</div><div class="muted" style="font-size:12px">' + esc(it.sku) + '</div></div></div></td>' +
        '<td class="num">' + money(it.unit_price) + '</td>' +
        '<td class="num">' + remaining + '</td>' +
        '<td class="num"><input class="input" type="number" min="1" max="' + remaining + '" value="' + Math.max(remaining, 1) + '"' + (remaining <= 0 ? ' disabled' : '') + ' style="width:72px;height:30px" data-vqty="' + i + '" /></td>' +
      '</tr>';
    }).join('');
    const body =
      '<div class="flex items-center justify-between mb-3" style="font-size:13px">' +
        '<span class="muted">Order: <span class="subtle" style="font-weight:500">' + esc(o.order_sn) + '</span></span>' +
        '<span class="muted">Code: <span class="subtle" style="font-weight:500">' + esc(o.verify_code || '--') + '</span></span>' +
      '</div>' +
      '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden">' +
        '<table class="tbl" style="font-size:13px"><thead><tr><th></th><th>Product</th><th class="num">Price</th><th class="num">Remaining</th><th class="num">Verify qty</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table></div>' +
      '<div id="vf-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: 'Verify order', width: 920, okText: 'Verify',
      body,
      onOk: (m, close) => {
        const n = m.querySelectorAll('.vf-pick:checked').length;
        if (!n) { const e = m.querySelector('#vf-err'); e.textContent = 'Please select products to verify'; e.style.display = 'block'; return; }
        close(); toast('Verified');
      },
    });
  }

  // Edit shipping address modal (EditShippingAddressButton.tsx): Contact + Delivery sections, ok=Save
  function openEditAddressModal(o) {
    const s = o.shipping;
    const inp = (id, ph, val) => '<input class="input" id="' + id + '" placeholder="' + esc(ph) + '" value="' + esc(val || '') + '" style="margin-bottom:12px" />';
    const body =
      '<div style="font-size:13px;font-weight:500;color:var(--ink);margin-bottom:8px">Contact</div>' +
      inp('a-email', 'Email', s.email) +
      '<div style="font-size:13px;font-weight:500;color:var(--ink);margin:4px 0 8px">Delivery</div>' +
      inp('a-country', 'Country/Region', s.country) +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div>' + inp('a-first', 'First name', s.first_name) + '</div>' +
        '<div>' + inp('a-last', 'Last name', s.last_name) + '</div>' +
      '</div>' +
      inp('a-addr', 'Address', s.detail) +
      inp('a-apt', 'Apartment, suite, etc.(optional)', s.detail2) +
      '<div class="grid grid-cols-3 gap-3">' +
        '<div>' + inp('a-state', 'State', s.province) + '</div>' +
        '<div>' + inp('a-city', 'City', s.city) + '</div>' +
        '<div>' + inp('a-zip', 'ZIP code', s.post_code) + '</div>' +
      '</div>' +
      '<div class="flex" style="margin-bottom:0">' +
        '<div class="flex items-center justify-center" style="height:34px;width:72px;flex:none;border:1px solid var(--ctl);border-right:none;border-radius:6px 0 0 6px;background:var(--panel);font-size:13px;color:var(--ink-body)">+' + esc(s.phone_code || '1') + '</div>' +
        '<input class="input" id="a-phone" placeholder="Phone" value="' + esc(s.phone || '') + '" style="border-radius:0 6px 6px 0" />' +
      '</div>' +
      '<div id="a-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: 'Edit shipping address', width: 760, okText: 'Save',
      body,
      onOk: (m, close) => {
        const req = ['a-email', 'a-country', 'a-first', 'a-last', 'a-addr', 'a-state', 'a-city', 'a-zip', 'a-phone'];
        const missing = req.some((id) => !m.querySelector('#' + id).value.trim());
        if (missing) { const e = m.querySelector('#a-err'); e.textContent = 'Please fill in all required fields.'; e.style.display = 'block'; return; }
        close(); toast('Updated');
      },
    });
  }

  // Edit note modal (NotesCard.tsx): single textarea + char counter + blank validation, ok=Save
  function openEditNoteModal(o) {
    const MAX = 5000;
    const body =
      '<div><textarea class="input" id="n-note" placeholder="Enter note" maxlength="' + MAX + '" style="height:auto;min-height:112px;padding:8px 12px;resize:vertical">' + esc(o.note || '') + '</textarea></div>' +
      '<div class="flex items-center justify-between" style="margin-top:6px">' +
        '<span id="n-err" style="color:var(--err);font-size:12px"></span>' +
        '<span class="muted" id="n-count" style="font-size:12px">' + String(o.note || '').length + '/' + MAX + '</span>' +
      '</div>';
    const ctrl = modal({
      title: 'Edit note', width: 620, okText: 'Save',
      body,
      onOk: (m, close) => {
        const v = m.querySelector('#n-note').value;
        if (!v.trim()) { m.querySelector('#n-err').textContent = "Can't be blank"; return; }
        o.note = v;
        close(); toast('Updated'); renderDetail(o.order_id);
      },
    });
    const ta = ctrl.m.querySelector('#n-note');
    const cnt = ctrl.m.querySelector('#n-count');
    ta.oninput = () => { cnt.textContent = ta.value.length + '/' + MAX; ctrl.m.querySelector('#n-err').textContent = ''; };
  }

  // ================= ROUTER (SPA: registered with the shell router) =================
  function goDetail(id) { location.hash = '#/orders/' + id; }

  function route(rest) {
    closePops();
    if (rest) { renderDetail(decodeURIComponent(rest)); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.orders = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
