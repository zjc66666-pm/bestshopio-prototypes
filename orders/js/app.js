/* BestShopio Admin · Orders prototype — list + detail + modals, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin orders. */
(function () {
  const D = window.DATA_ORDERS;
  const ICO = window.ICONS || {};
  const root = document.getElementById('root');

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    chevRight: svg('<path d="m9 18 6-6-6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    truck: svg('<path d="M10 17h4V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>'),
    money: svg('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    tag: svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 13),
    store: svg('<path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>', 14),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- status -> pill mapping (mirrors OrderStatusCell / PaymentStatusCell / FulfillmentStatusCell + PillTag) ----
  const ORDER_STATUS = {
    to_pay:   { text: 'To pay',          cls: 'pill-orange' },
    to_ship:  { text: 'To ship',         cls: 'pill-blue' },
    shipped:  { text: 'Shipped',         cls: 'pill-gray' },
    review:   { text: 'Awaiting Review', cls: 'pill-gray' },
    archived: { text: 'Done',            cls: 'pill-gray' },
    refund:   { text: 'Refunded',        cls: 'pill-red' },
    cancel:   { text: 'Canceled',        cls: 'pill-red' },
  };
  const PAY_STATUS = {
    paid:   { text: 'Paid',   cls: 'pill-gray' },
    unpaid: { text: 'Unpaid', cls: 'pill-orange' },
  };
  const FULFILL_STATUS = {
    fulfilled:   { text: 'Fulfilled',   cls: 'pill-gray' },
    partial:     { text: 'Partial Fulfilled', cls: 'pill-blue' },
    unfulfilled: { text: 'Unfulfilled', cls: 'pill-orange' },
    '--':        { text: '--', dash: true },
  };
  const pill = (map, key) => {
    const m = map[key] || { text: key, cls: 'pill-gray' };
    if (m.dash) return '<span class="muted">--</span>';
    return '<span class="pill ' + m.cls + '"><span class="dot"></span>' + esc(m.text) + '</span>';
  };

  // ---- count rows per tab (for tab badges) ----
  const tabCount = (key) => key === 'all' ? D.ORDERS.length : D.ORDERS.filter((o) => o.order_status === key).length;

  // ================= LIST VIEW =================
  // filter state lives on a module-level object so re-renders keep it
  const LST = {
    tab: 'all', kwType: 'order_sn', kw: '', kwApplied: '',
    timeType: 'create_date', dateStart: '', dateEnd: '',
    totalMin: '', totalMax: '', totalApplied: false,
    page: 1, size: 20,
  };

  function filteredRows() {
    let rows = D.ORDERS.slice();
    if (LST.tab !== 'all') rows = rows.filter((o) => o.order_status === LST.tab);
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

  function shipOneLine(s) {
    return [s.detail, s.city, s.province, s.post_code, s.country].filter(Boolean).join(', ');
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

    // filter tags row (active keyword / date / total)
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
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Orders</h1>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-default" data-act="export">Export</button>' +
          '<button class="btn btn-primary" data-act="create">Create order</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="ord-tabs">' + tabsHtml + '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // keyword group
            '<div class="flex" style="min-width:428px">' +
              '<select class="filter-select" id="kw-type" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // time group
            '<div class="flex" style="min-width:428px">' +
              '<select class="filter-select" id="time-type" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0">' + timeOpts + '</select>' +
              '<input class="filter-input" id="date-start" type="date" value="' + esc(LST.dateStart) + '" style="width:135px;border-radius:0;margin-left:-1px" />' +
              '<input class="filter-input" id="date-end" type="date" value="' + esc(LST.dateEnd) + '" style="width:135px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
            '</div>' +
            // total range chip
            '<div class="sel-trigger" id="total-chip" style="width:240px">' +
              '<span class="' + (LST.totalApplied ? '' : 'muted') + '">' + esc(totalChipText) + '</span>' + I.chevDown +
            '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1240px">' +
          '<thead><tr>' +
            '<th>Order number</th><th>Order date</th><th>User</th><th>Shipping address</th>' +
            '<th class="num">Total</th><th>Order status</th><th>Payment status</th>' +
            '<th>Payment method</th><th>Fulfillment status</th><th style="text-align:center">Actions</th>' +
          '</tr></thead>' +
          '<tbody id="ord-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="10" style="text-align:center;padding:40px" class="muted">No orders match these filters.</td></tr>') +
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

  function rowHtml(o) {
    return '<tr data-id="' + o.order_id + '">' +
      '<td style="font-weight:600;color:var(--brand)">' + esc(o.order_sn) + '</td>' +
      '<td class="muted">' + esc(o.create_time) + '</td>' +
      '<td>' + esc(o.user.nickname) + '</td>' +
      '<td style="max-width:240px"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(shipOneLine(o.shipping)) + '">' +
        '<span style="font-weight:500;color:var(--ink)">' + esc(o.shipping.name) + '</span> · ' + esc(o.shipping.city) + ', ' + esc(o.shipping.country) + '</div></td>' +
      '<td class="num" style="font-weight:600;color:var(--ink)">' + money(o.total) + '</td>' +
      '<td>' + pill(ORDER_STATUS, o.order_status) + '</td>' +
      '<td>' + pill(PAY_STATUS, o.payment_status) + '</td>' +
      '<td class="muted">' + esc(o.payment_method) + '</td>' +
      '<td>' + pill(FULFILL_STATUS, o.fulfillment_status) + '</td>' +
      '<td style="text-align:center"><button class="back-btn" data-view="' + o.order_id + '" title="View detail" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
    // tabs
    root.querySelectorAll('#ord-tabs .tab').forEach((t) => t.onclick = () => { LST.tab = t.getAttribute('data-tab'); LST.page = 1; renderList(); });
    // keyword type / input
    const kwType = root.querySelector('#kw-type');
    const kwInput = root.querySelector('#kw-input');
    if (kwType) kwType.onchange = () => { LST.kwType = kwType.value; };
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    // time type + dates
    const timeType = root.querySelector('#time-type');
    if (timeType) timeType.onchange = () => { LST.timeType = timeType.value; };
    const ds = root.querySelector('#date-start'), de = root.querySelector('#date-end');
    if (ds) ds.onchange = () => { LST.dateStart = ds.value; LST.page = 1; renderList(); };
    if (de) de.onchange = () => { LST.dateEnd = de.value; LST.page = 1; renderList(); };
    // total range popover
    const chip = root.querySelector('#total-chip');
    if (chip) chip.onclick = () => openTotalPopover(chip);
    // filter tags clear
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'date') { LST.dateStart = ''; LST.dateEnd = ''; }
      if (k === 'total') { LST.totalApplied = false; LST.totalMin = ''; LST.totalMax = ''; }
      LST.page = 1; renderList();
    });
    // page size
    const ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    // pagination
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row + view -> detail
    root.querySelectorAll('#ord-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goDetail(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goDetail(b.getAttribute('data-view')); });
    // header actions
    const exp = root.querySelector('[data-act="export"]'); if (exp) exp.onclick = () => toast('Export — generates a CSV of the filtered orders (roadmap)');
    const cr = root.querySelector('[data-act="create"]'); if (cr) cr.onclick = () => toast('Create order — draft-order builder (roadmap)');
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

    const showVerify = !!o.verify_code && o.paid === 1;
    const showFulfill = o.paid === 1 && (o.fulfillment_status === 'unfulfilled' || o.fulfillment_status === 'partial');
    const showRefund = o.paid === 1 && o.status !== 'refund' && o.status !== 'cancel';

    const actions =
      (showVerify ? '<button class="btn btn-default" data-act="verify">' + I.check + ' Verify code</button>' : '') +
      (showFulfill ? '<button class="btn btn-primary" data-act="fulfill">' + I.truck + ' Fulfill</button>' : '') +
      (showRefund ? '<button class="btn btn-default" data-act="refund">' + I.money + ' Refund</button>' : '');

    root.innerHTML =
      // header
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to orders">' + I.arrowLeft + '</button>' +
          '<div class="flex items-center gap-2">' +
            '<span class="page-title">' + esc(o.order_sn) + '</span>' +
            '<button class="back-btn" data-act="copy" title="Copy order number" style="width:30px;height:30px">' + I.copy + '</button>' +
            pill(ORDER_STATUS, o.status) + pill(PAY_STATUS, o.payment_status) + pill(FULFILL_STATUS, o.fulfillment_status) +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' + actions + '</div>' +
      '</div>' +
      // two-column body
      '<div class="flex gap-4" style="align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:320px">' +
          productsCard(o) +
          amountCard(o) +
          shippingAddressCard(o) +
          shippingLogisticsCard(o) +
          timelineCard(o) +
        '</div>' +
        '<div style="width:300px;flex:0 0 300px">' +
          notesCard(o) +
          userCard(o) +
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

  // ---- Products card: SPLIT-ORDER grouped by per-vendor sub-orders ----
  function productsCard(o) {
    const subs = o.subOrders || [];
    const multi = subs.length > 1;
    const groups = subs.map((sub, gi) => {
      const vTag = sub.self
        ? '<span class="src-tag src-Commerce"><span class="dot"></span>' + I.store + ' ' + esc(sub.vendor) + '</span>'
        : '<span class="src-tag src-Behavior"><span class="dot"></span>' + I.store + ' ' + esc(sub.vendor) + '</span>';
      const subSn = sub.sub_order_sn
        ? '<span class="muted" style="font-size:12px;font-variant-numeric:tabular-nums">' + esc(sub.sub_order_sn) + '</span>'
        : '<span class="muted" style="font-size:12px">Self-operated · no sub-order</span>';
      const fulfill = pill(FULFILL_STATUS, sub.fulfillment_status);
      const canFulfill = sub.fulfillment_status === 'unfulfilled';
      const subFulfillBtn = canFulfill
        ? '<button class="lnk" data-subfulfill="' + gi + '" style="font-size:12.5px">Fulfill this package</button>'
        : (sub.delivery_id && sub.delivery_id !== '—'
            ? '<span class="muted" style="font-size:12px">' + esc(sub.delivery_name) + ' · ' + esc(sub.delivery_id) + '</span>'
            : '');

      const items = sub.items.map((it) => {
        const disc = (it.discounts || []).map((d) =>
          '<div class="flex items-center gap-1 mt-1" style="font-size:12px;color:#8B8B8B">' + I.tag +
          '<span>' + esc(d.name) + ' (-' + money(d.amount) + ')</span></div>').join('');
        const hasDisc = (it.discounts || []).length > 0;
        const orig = it.unit_price * it.qty;
        return '<div class="flex items-start gap-3" style="padding:12px 0;border-top:1px solid var(--hair)">' +
          '<img src="' + it.image + '" alt="" style="width:44px;height:44px;border-radius:6px;flex:none" />' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:500;font-size:13.5px;color:var(--ink)">' + esc(it.title) + '</div>' +
            '<div class="muted" style="font-size:12px">SKU: ' + esc(it.sku) + ' · SPU: ' + esc(it.spu) + '</div>' +
            '<div class="muted" style="font-size:12px">Barcode: ' + esc(it.barcode) + '</div>' +
            disc +
          '</div>' +
          '<div class="muted" style="font-size:13px;white-space:nowrap">' + money(it.unit_price) + ' × ' + it.qty + '</div>' +
          '<div style="text-align:right;min-width:78px">' +
            '<div style="font-weight:600;font-size:13.5px;color:var(--ink)">' + money(it.line_total) + '</div>' +
            (hasDisc ? '<div class="muted" style="font-size:12px;text-decoration:line-through">' + money(orig) + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');

      return '<div style="border:1px solid var(--hair);border-radius:10px;padding:12px 14px 4px;margin-bottom:' + (gi === subs.length - 1 ? '0' : '12px') + '">' +
        '<div class="flex items-center justify-between" style="flex-wrap:wrap;gap:8px">' +
          '<div class="flex items-center gap-2">' + vTag + subSn + '</div>' +
          '<div class="flex items-center gap-3">' + subFulfillBtn + fulfill + '</div>' +
        '</div>' +
        items +
      '</div>';
    }).join('');

    const splitNote = multi
      ? '<span class="muted" style="font-size:12px;margin-left:6px">Split into ' + subs.length + ' sub-orders by vendor</span>'
      : '';
    return cardOpen('<span>Product</span>' + pill(FULFILL_STATUS, o.fulfillment_status) + splitNote) + groups + '</div>';
  }

  // ---- Amount card: 3-layer discounts (product line discounts shown in products; order + shipping here) ----
  function amountCard(o) {
    const row = (label, valHtml, opts) => {
      opts = opts || {};
      return '<div class="flex items-center justify-between" style="padding:7px 0;' + (opts.border ? 'border-top:1px solid var(--hair);' : '') + '">' +
        '<div class="' + (opts.sub ? '' : 'subtle') + '" style="' + (opts.sub ? 'font-size:12px;color:#8B8B8B;display:flex;align-items:center;gap:4px' : 'font-size:13.5px') + (opts.bold ? ';font-weight:700;color:var(--ink)' : '') + '">' + (opts.sub ? I.tag : '') + label + '</div>' +
        '<div style="' + (opts.sub ? 'font-size:12px;color:#8B8B8B' : 'font-size:13.5px;font-weight:500;color:var(--ink)') + (opts.bold ? ';font-weight:700' : '') + '">' + valHtml + '</div>' +
      '</div>';
    };
    const shipFee = Number(o.shipping_fee || 0);
    let body = row('Subtotal · ' + (o.total_num || 0) + ' items', money(o.subtotal));
    // order discounts (layer 2)
    (o.order_discounts || []).forEach((d) => { body += row(esc(d.name), '-' + money(d.amount), { sub: true }); });
    // shipping (layer 3 = shipping discount)
    const shipDisc = (o.shipping_discounts || [])[0];
    if (shipDisc && shipFee > 0) {
      body += row('Shipping', '<span class="muted" style="text-decoration:line-through;margin-right:6px">-' + money(shipDisc.amount) + '</span><span>FREE</span>');
      body += row(esc(shipDisc.name), '-' + money(shipDisc.amount), { sub: true });
    } else {
      body += row('Shipping', shipFee > 0 ? money(shipFee) : 'FREE');
    }
    body += row('Total', money(o.total), { border: true, bold: true });
    if ((o.total_savings || 0) > 0) body += row('TOTAL SAVINGS ' + money(o.total_savings), '', { sub: true });
    body += row('Paid', money(o.paid_amount));
    if ((o.refunded || 0) > 0) body += row('Refunded', '<span style="color:var(--err)">-' + money(o.refunded) + '</span>');
    return cardOpen('<span>Amount</span>' + pill(PAY_STATUS, o.payment_status)) + body + '</div>';
  }

  function descRow(label, val) {
    return '<div style="display:flex;padding:6px 0"><div class="muted" style="width:120px;flex:none;font-size:13px">' + label + '</div>' +
      '<div class="subtle" style="font-size:13px">' + (val || '--') + '</div></div>';
  }

  function shippingAddressCard(o) {
    const s = o.shipping;
    const editable = o.order_type === 0 && o.status === 'to_ship' && o.paid === 1;
    const right = editable ? '<button class="lnk" data-act="edit-address">Edit</button>' : '';
    const grid =
      '<div class="grid grid-cols-2" style="gap:0 16px">' +
        descRow('First name', esc(s.first_name)) + descRow('Last name', esc(s.last_name)) +
        descRow('Address', esc(s.detail)) + descRow('Apartment', esc(s.detail2)) +
        descRow('City', esc(s.city)) + descRow('State', esc(s.province)) +
        descRow('ZIP code', esc(s.post_code)) + descRow('Country', esc(s.country)) +
        descRow('Phone', '+' + esc(s.phone_code) + ' ' + esc(s.phone)) + descRow('Email', esc(s.email)) +
      '</div>';
    return cardOpen('<span>Shipping address</span>', right) + grid + '</div>';
  }

  function shippingLogisticsCard(o) {
    // top-level package = the self-operated sub-order (main fulfillment), if any
    const main = (o.subOrders || []).find((s) => s.self) || (o.subOrders || [])[0] || {};
    const tn = main.delivery_id && main.delivery_id !== '—' ? main.delivery_id : '';
    const track = tn ? '<a class="lnk" href="https://t.17track.net/en#nums=' + encodeURIComponent(tn) + '" target="_blank" rel="noreferrer">Order tracking</a>' : '';
    const grid =
      '<div class="grid grid-cols-2" style="gap:0 16px">' +
        descRow('Logistics', esc(main.delivery_name || '')) +
        '<div style="display:flex;padding:6px 0"><div class="muted" style="width:120px;flex:none;font-size:13px">Tracking number</div>' +
          '<div class="subtle flex items-center gap-2" style="font-size:13px">' + (tn ? esc(tn) : '--') + ' ' + track + '</div></div>' +
      '</div>';
    return cardOpen('<span>Shipping logistics</span>') + grid + '</div>';
  }

  function timelineCard(o) {
    const items = (o.timeline || []).map((t, i, arr) =>
      '<div class="cl-item">' +
        '<div class="cl-rail"><div class="cl-dot"></div>' + (i < arr.length - 1 ? '<div class="cl-line"></div>' : '') + '</div>' +
        '<div class="cl-body" style="padding-bottom:' + (i < arr.length - 1 ? '14px' : '0') + '">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<span class="subtle" style="font-size:13px">' + esc(t.label) + '</span>' +
            '<span class="muted" style="font-size:12px;white-space:nowrap">' + esc(t.time) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>').join('');
    return cardOpen('<span>Timeline</span>') + '<div>' + (items || '<div class="muted">No activity yet.</div>') + '</div></div>';
  }

  function notesCard(o) {
    const buyer = o.remark ? esc(o.remark) : '<span class="muted">No buyer remark</span>';
    const admin = o.admin_mark ? esc(o.admin_mark) : '<span class="muted">No staff note</span>';
    return cardOpen('<span>Notes</span>', '<button class="lnk" data-act="edit-note">Edit</button>') +
      '<div class="mb-3"><div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px">Buyer remark</div>' +
        '<div class="subtle" style="font-size:13px">' + buyer + '</div></div>' +
      '<div><div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px">Staff note</div>' +
        '<div class="subtle" style="font-size:13px">' + admin + '</div></div>' +
    '</div>';
  }

  function userCard(o) {
    const svip = o.user.is_svip ? '<span class="st st-beta" style="margin-left:6px"><span class="dot"></span>SVIP</span>' : '';
    return cardOpen('<span>User</span>') +
      descRow('Nickname', esc(o.user.nickname) + svip) +
      descRow('User ID', String(o.user.uid)) +
      descRow('Payment', esc(o.payment_method)) +
      (o.transaction_id ? descRow('Transaction', '<span style="font-variant-numeric:tabular-nums">' + esc(o.transaction_id) + '</span>') : '') +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Order #' + esc(id) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Detail not available in this prototype</div>' +
        '<div class="muted">Open one of the orders flagged with sample detail: SILIX1042, SILIX1041, SILIX1040, SILIX1039 or SILIX1037.</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/orders'; };
  }

  function wireDetail(o) {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = () => { location.hash = '#/orders'; };
    const copy = root.querySelector('[data-act="copy"]'); if (copy) copy.onclick = () => { try { navigator.clipboard.writeText(o.order_sn); } catch (e) {} toast('Copied ' + o.order_sn); };
    const ful = root.querySelector('[data-act="fulfill"]'); if (ful) ful.onclick = () => openFulfillModal(o, null);
    const ref = root.querySelector('[data-act="refund"]'); if (ref) ref.onclick = () => openRefundModal(o);
    const ver = root.querySelector('[data-act="verify"]'); if (ver) ver.onclick = () => openVerifyModal(o);
    const ea = root.querySelector('[data-act="edit-address"]'); if (ea) ea.onclick = () => openEditAddressModal(o);
    const en = root.querySelector('[data-act="edit-note"]'); if (en) en.onclick = () => openEditNoteModal(o);
    root.querySelectorAll('[data-subfulfill]').forEach((b) => b.onclick = () => openFulfillModal(o, Number(b.getAttribute('data-subfulfill'))));
  }

  // ================= MODALS =================
  function modal({ title, body, width, okText, onOk, okDisabledMsg }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
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

  // Fulfillment modal (tracking-number) — ShippingButton.tsx
  function openFulfillModal(o, subIndex) {
    const sub = subIndex != null ? o.subOrders[subIndex] : null;
    const heading = sub
      ? 'Fulfill package · ' + (sub.sub_order_sn || sub.vendor)
      : 'Fulfill order';
    const carriers = D.CARRIERS.map((c) => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('');
    const body =
      (sub ? '<div class="muted mb-3" style="font-size:13px">Vendor: <span class="subtle" style="font-weight:500">' + esc(sub.vendor) + '</span></div>' : '') +
      '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Logistics <span style="color:var(--err)">*</span></label>' +
        '<select class="input" id="f-carrier" style="margin-top:4px">' + carriers + '</select></div>' +
      '<div><label class="ctrl-label" style="text-transform:none">Tracking number <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="f-tracking" placeholder="Enter tracking number" style="margin-top:4px" /></div>' +
      '<div id="f-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: heading, width: 520, okText: 'Confirm',
      body,
      onOk: (m, close) => {
        const carrier = m.querySelector('#f-carrier').value;
        const tracking = m.querySelector('#f-tracking').value.trim();
        if (!tracking) { const e = m.querySelector('#f-err'); e.textContent = 'Please enter a tracking number.'; e.style.display = 'block'; return; }
        close();
        toast(sub ? ('Package ' + (sub.sub_order_sn || sub.vendor) + ' fulfilled · ' + carrier + ' ' + tracking)
                  : ('Order ' + o.order_sn + ' fulfilled · ' + carrier + ' ' + tracking));
      },
    });
  }

  // Refund modal — check -> compute -> submit (RefundOrderModal.tsx + getRefundCheck/compute)
  function openRefundModal(o) {
    // build per-item refundable list from sub-orders
    const lines = [];
    (o.subOrders || []).forEach((sub) => sub.items.forEach((it) => lines.push({ sub: sub.vendor, it })));
    const rowsHtml = lines.map((L, i) =>
      '<tr>' +
        '<td><label class="edit-check" style="padding:0"><input type="checkbox" class="rf-pick" data-i="' + i + '" data-amt="' + L.it.line_total + '" />' +
          '<span><span style="font-weight:500">' + esc(L.it.title) + '</span><div class="muted" style="font-size:12px">' + esc(L.sub) + ' · ' + esc(L.it.sku) + '</div></span></label></td>' +
        '<td class="num">' + money(L.it.unit_price) + '</td>' +
        '<td class="num">' + L.it.qty + '</td>' +
        '<td class="num" style="font-weight:600">' + money(L.it.line_total) + '</td>' +
      '</tr>').join('');
    const reasons = D.REFUND_REASONS.map((r) => '<option value="' + esc(r) + '">' + esc(r) + '</option>').join('');
    const body =
      '<div class="muted mb-2" style="font-size:13px">Select items to refund, then compute the amount.</div>' +
      '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden;margin-bottom:14px">' +
        '<table class="tbl" style="font-size:13px"><thead><tr><th>Product</th><th class="num">Price</th><th class="num">Qty</th><th class="num">Line total</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table></div>' +
      '<div class="flex items-end gap-3 mb-3" style="flex-wrap:wrap">' +
        '<div style="flex:1;min-width:150px"><label class="ctrl-label" style="text-transform:none">Refund amount <span style="color:var(--err)">*</span></label>' +
          '<input class="input" id="rf-amt" type="number" step="0.01" placeholder="$0.00" style="margin-top:4px" /></div>' +
        '<button class="btn btn-default" id="rf-compute">Compute from selection</button>' +
      '</div>' +
      '<div class="mb-1"><label class="ctrl-label" style="text-transform:none">Reason for refund <span style="color:var(--err)">*</span></label>' +
        '<select class="input" id="rf-reason" style="margin-top:4px"><option value="">Select a reason</option>' + reasons + '</select></div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px">Only you and other staff can see this reason.</div>' +
      '<div id="rf-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    const ctrl = modal({
      title: 'Refund', width: 720, okText: 'Submit refund',
      body,
      onOk: (m, close) => {
        const amt = Number(m.querySelector('#rf-amt').value);
        const reason = m.querySelector('#rf-reason').value;
        const e = m.querySelector('#rf-err');
        if (!amt || amt <= 0) { e.textContent = 'Please enter a refund amount greater than 0.'; e.style.display = 'block'; return; }
        if (amt > o.paid_amount + 0.001) { e.textContent = 'Refund cannot exceed the paid amount (' + money(o.paid_amount) + ').'; e.style.display = 'block'; return; }
        if (!reason) { e.textContent = 'Please select a refund reason.'; e.style.display = 'block'; return; }
        close();
        toast('Refund of ' + money(amt) + ' submitted · ' + reason);
      },
    });
    // compute = sum of checked line totals (compute step)
    const m = ctrl.m;
    m.querySelector('#rf-compute').onclick = () => {
      let sum = 0; m.querySelectorAll('.rf-pick:checked').forEach((c) => sum += Number(c.getAttribute('data-amt')));
      if (sum <= 0) { const e = m.querySelector('#rf-err'); e.textContent = 'Select at least one item to compute.'; e.style.display = 'block'; return; }
      m.querySelector('#rf-err').style.display = 'none';
      m.querySelector('#rf-amt').value = sum.toFixed(2);
    };
  }

  // Verify code modal — VerifyOrderButton.tsx (product table + qty)
  function openVerifyModal(o) {
    const lines = [];
    (o.subOrders || []).forEach((sub) => sub.items.forEach((it) => lines.push(it)));
    const rowsHtml = lines.map((it, i) =>
      '<tr>' +
        '<td><label class="edit-check" style="padding:0"><input type="checkbox" class="vf-pick" data-i="' + i + '" />' +
          '<span><span style="font-weight:500">' + esc(it.title) + '</span><div class="muted" style="font-size:12px">' + esc(it.sku) + '</div></span></label></td>' +
        '<td class="num">' + money(it.unit_price) + '</td>' +
        '<td class="num">' + it.qty + '</td>' +
        '<td class="num"><input class="input" type="number" min="1" max="' + it.qty + '" value="' + it.qty + '" style="width:72px;height:30px" data-vqty="' + i + '" /></td>' +
      '</tr>').join('');
    const body =
      '<div class="flex items-center justify-between mb-3" style="font-size:13px">' +
        '<span class="muted">Order: <span class="subtle" style="font-weight:500">' + esc(o.order_sn) + '</span></span>' +
        '<span class="muted">Code: <span class="subtle" style="font-weight:500">' + esc(o.verify_code) + '</span></span>' +
      '</div>' +
      '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden">' +
        '<table class="tbl" style="font-size:13px"><thead><tr><th>Product</th><th class="num">Price</th><th class="num">Remaining</th><th class="num">Verify qty</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table></div>' +
      '<div id="vf-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: 'Verify order', width: 720, okText: 'Verify',
      body,
      onOk: (m, close) => {
        const n = m.querySelectorAll('.vf-pick:checked').length;
        if (!n) { const e = m.querySelector('#vf-err'); e.textContent = 'Please select products to verify.'; e.style.display = 'block'; return; }
        close(); toast(n + ' item(s) verified for ' + o.order_sn);
      },
    });
  }

  // Edit shipping-address modal — EditShippingAddressButton.tsx (subset of fields)
  function openEditAddressModal(o) {
    const s = o.shipping;
    const fld = (id, label, val, w) => '<div style="' + (w ? 'grid-column:span 2' : '') + '"><label class="ctrl-label" style="text-transform:none">' + label + '</label>' +
      '<input class="input" id="' + id + '" value="' + esc(val || '') + '" style="margin-top:4px" /></div>';
    const body =
      '<div class="grid grid-cols-2 gap-3">' +
        fld('a-first', 'First name', s.first_name) + fld('a-last', 'Last name', s.last_name) +
        fld('a-addr', 'Address', s.detail, true) + fld('a-apt', 'Apartment', s.detail2, true) +
        fld('a-city', 'City', s.city) + fld('a-state', 'State', s.province) +
        fld('a-zip', 'ZIP code', s.post_code) + fld('a-country', 'Country', s.country) +
        fld('a-phone', 'Phone', s.phone) + fld('a-email', 'Email', s.email) +
      '</div>';
    modal({
      title: 'Edit shipping address', width: 620, okText: 'Save',
      body,
      onOk: (m, close) => { close(); toast('Shipping address updated for ' + o.order_sn); },
    });
  }

  // Edit note modal — NotesCard.tsx
  function openEditNoteModal(o) {
    const body =
      '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Buyer remark</label>' +
        '<textarea class="input" id="n-buyer" rows="2" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(o.remark || '') + '</textarea></div>' +
      '<div><label class="ctrl-label" style="text-transform:none">Staff note</label>' +
        '<textarea class="input" id="n-admin" rows="3" placeholder="Enter note" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(o.admin_mark || '') + '</textarea></div>';
    modal({
      title: 'Edit note', width: 560, okText: 'Save',
      body,
      onOk: (m, close) => {
        o.remark = m.querySelector('#n-buyer').value;
        o.admin_mark = m.querySelector('#n-admin').value;
        close(); toast('Note updated'); renderDetail(o.order_id);
      },
    });
  }

  // ================= ROUTER =================
  function goDetail(id) { location.hash = '#/orders/' + id; }

  function route() {
    closePops();
    const hash = location.hash || '#/orders';
    const m = hash.match(/^#\/orders\/(.+)$/);
    if (m) { renderDetail(decodeURIComponent(m[1])); root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/orders';
  route();
})();
