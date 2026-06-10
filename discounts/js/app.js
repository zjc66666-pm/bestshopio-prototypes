/* BestShopio Admin · Discounts prototype — list + create-picker + detail/edit, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only renders the
   module body into #root. Mirrors reference/bestvoy-admin discounts (list/table.tsx,
   components/list/search.tsx, components/edit/*). */
(function () {
  const D = window.DATA_DISCOUNTS;
  let root; // set by the SPA shell router via VIEWS.discounts.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    tag: svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
    truck: svg('<path d="M10 17h4V5H2v12h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    chevRight: svg('<path d="m9 18 6-6-6-6"/>', 14),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', 14),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', 14),
    alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', 14),
  };
  const TYPE_ICON = { 1: I.inbox, 2: I.tag, 3: I.truck };
  const DIM_ICON = { order: I.inbox, product: I.tag, shipping: I.truck };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };
  const copyText = (s) => { try { navigator.clipboard.writeText(s); } catch (e) {} toast('Copied ' + s); };

  // ---- run_status pill (statusColorMap in table.tsx) ----
  const RUN_STATUS = {
    Active:    'pill-green',
    Scheduled: 'pill-blue',
    Expired:   'pill-gray',
  };
  const runPill = (s) => '<span class="pill ' + (RUN_STATUS[s] || 'pill-gray') + '"><span class="dot"></span>' + esc(s || '-') + '</span>';

  const COMBO_LABEL = { product_discount: 'Product discount', order_discount: 'Order discount', shipping_discount: 'Free shipping' };
  const COMBO_ICON = { product_discount: I.tag, order_discount: I.inbox, shipping_discount: I.truck };

  const tabCount = (key) => {
    const k = key.toLowerCase();
    if (k === 'all') return D.STATUS_COUNTS.all;
    return D.STATUS_COUNTS[k] || 0;
  };

  // ================= LIST VIEW =================
  const LST = {
    tab: 'All', kw: '', kwApplied: '',
    types: [], methods: [], combines: [],
    dateStart: '', dateEnd: '',
    usedMin: '', usedMax: '', usedApplied: false,
    page: 1, size: 20,
  };

  function filteredRows() {
    let rows = D.DISCOUNTS.slice();
    if (LST.tab !== 'All') rows = rows.filter((d) => d.run_status === LST.tab);
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((d) => (d.title_display || '').toLowerCase().includes(q));
    }
    if (LST.types.length) rows = rows.filter((d) => LST.types.includes(d.discount_dimension));
    if (LST.methods.length) rows = rows.filter((d) => LST.methods.includes(d.discount_form));
    if (LST.combines.length) rows = rows.filter((d) => LST.combines.some((k) => d.combinations && d.combinations[k]));
    if (LST.dateStart) rows = rows.filter((d) => d.start_date >= LST.dateStart);
    if (LST.dateEnd) rows = rows.filter((d) => d.start_date <= LST.dateEnd);
    if (LST.usedApplied) {
      const lo = LST.usedMin === '' ? -Infinity : Number(LST.usedMin);
      const hi = LST.usedMax === '' ? Infinity : Number(LST.usedMax);
      rows = rows.filter((d) => (d.total_used || 0) >= lo && (d.total_used || 0) <= hi);
    }
    return rows;
  }

  function ruleText(d) {
    const s = d.second_line_info || {};
    return [s.discount_info, s.minimum_purchase, s.maximum_uses].filter(Boolean).join('  •  ');
  }

  function renderList() {
    LST.page = LST.page || 1;
    const rows = filteredRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const tabsHtml = D.TABS.map((t) =>
      '<div class="tab' + (t.key === LST.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + tabCount(t.key) + '</span></div>').join('');

    // active filter tags
    const tags = [];
    if (LST.kwApplied) tags.push('<span class="field-pill" data-clear="kw">Title/Discount code: ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    if (LST.types.length) {
      const lbl = D.TYPE_OPTIONS.filter((o) => LST.types.includes(o.value)).map((o) => o.label).join(', ');
      tags.push('<span class="field-pill" data-clear="types">Type: ' + esc(lbl) + ' <span class="x">&times;</span></span>');
    }
    if (LST.methods.length) {
      const lbl = D.METHOD_OPTIONS.filter((o) => LST.methods.includes(o.value)).map((o) => o.label).join(', ');
      tags.push('<span class="field-pill" data-clear="methods">Method: ' + esc(lbl) + ' <span class="x">&times;</span></span>');
    }
    if (LST.combines.length) {
      const lbl = D.COMBINES_OPTIONS.filter((o) => LST.combines.includes(o.value)).map((o) => o.label).join(', ');
      tags.push('<span class="field-pill" data-clear="combines">Combines with: ' + esc(lbl) + ' <span class="x">&times;</span></span>');
    }
    if (LST.dateStart && LST.dateEnd) tags.push('<span class="field-pill" data-clear="date">Start date: ' + esc(LST.dateStart) + ' ~ ' + esc(LST.dateEnd) + ' <span class="x">&times;</span></span>');
    if (LST.usedApplied) {
      const txt = (LST.usedMin !== '' ? LST.usedMin : '0') + (LST.usedMax !== '' ? ' – ' + LST.usedMax : '+');
      tags.push('<span class="field-pill" data-clear="used">Times used: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }

    const filterChip = (id, label, active) =>
      '<div class="sel-trigger" id="' + id + '" style="width:auto;min-width:130px;height:32px">' +
        '<span class="' + (active ? '' : 'muted') + '">' + esc(label) + '</span>' + I.chevDown + '</div>';

    const typeLbl = LST.types.length ? 'Type · ' + LST.types.length : 'Type';
    const methodLbl = LST.methods.length ? 'Method · ' + LST.methods.length : 'Method';
    const combLbl = LST.combines.length ? 'Combines · ' + LST.combines.length : 'Combines with';
    const dateLbl = (LST.dateStart && LST.dateEnd) ? (LST.dateStart + ' ~ ' + LST.dateEnd) : 'Start date';
    const usedLbl = LST.usedApplied ? ((LST.usedMin !== '' ? LST.usedMin : '0') + (LST.usedMax !== '' ? '–' + LST.usedMax : '+') + ' used') : 'Times used';

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Discounts</h1>' +
        '<button class="btn btn-primary" data-act="create">' + I.plus + ' Add discount</button>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="dsc-tabs">' + tabsHtml + '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            '<div style="position:relative;width:420px;max-width:100%">' +
              '<input class="filter-input" id="kw-input" placeholder="Title / Discount code" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px" />' +
              '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
            '</div>' +
            filterChip('type-chip', typeLbl, LST.types.length > 0) +
            filterChip('method-chip', methodLbl, LST.methods.length > 0) +
            filterChip('comb-chip', combLbl, LST.combines.length > 0) +
            filterChip('date-chip', dateLbl, !!(LST.dateStart && LST.dateEnd)) +
            filterChip('used-chip', usedLbl, LST.usedApplied) +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1080px">' +
          '<thead><tr>' +
            '<th>Title</th><th style="width:130px">Status</th><th style="width:120px">Method</th>' +
            '<th style="width:210px">Type</th><th style="width:150px">Combinations</th><th class="num" style="width:90px">Used</th>' +
          '</tr></thead>' +
          '<tbody id="dsc-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">No discounts match these filters.</td></tr>') +
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

  function rowHtml(d) {
    const copyBtn = d.method_text === 'Code'
      ? '<span class="dsc-copy" data-stop="1" data-copy="' + esc(d.title_display) + '" title="Copy code" style="color:var(--ink-muted);cursor:pointer;display:inline-flex;padding:2px;border-radius:4px">' + I.copy + '</span>'
      : '';
    const combos = ['product_discount', 'order_discount', 'shipping_discount'].map((k) => {
      const on = d.combinations && d.combinations[k];
      return '<span title="' + COMBO_LABEL[k] + '" style="color:' + (on ? 'var(--ink)' : '#d7dbe7') + ';display:inline-flex">' + COMBO_ICON[k] + '</span>';
    }).join('');
    return '<tr data-id="' + d.activity_id + '">' +
      '<td style="max-width:420px">' +
        '<div class="flex items-center gap-1.5">' +
          '<span style="font-weight:600;color:var(--ink)">' + esc(d.title_display) + '</span>' + copyBtn +
        '</div>' +
        '<div class="muted" style="font-size:12px;margin-top:2px">' + esc(ruleText(d)) + '</div>' +
      '</td>' +
      '<td>' + runPill(d.run_status) + '</td>' +
      '<td class="muted">' + esc(d.method_text) + '</td>' +
      '<td><span class="inline-flex items-center gap-1.5" style="color:var(--ink-body)">' + (TYPE_ICON[d.discount_dimension] || '') + '<span>' + esc(d.type_text) + '</span></span></td>' +
      '<td><div class="flex items-center gap-2">' + combos + '</div></td>' +
      '<td class="num" style="font-weight:500;color:var(--ink)">' + (d.total_used || 0) + '</td>' +
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
    root.querySelectorAll('#dsc-tabs .tab').forEach((t) => t.onclick = () => { LST.tab = t.getAttribute('data-tab'); LST.page = 1; renderList(); });
    const kwInput = root.querySelector('#kw-input');
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    // checkbox filter popovers
    const typeChip = root.querySelector('#type-chip'); if (typeChip) typeChip.onclick = () => openCheckPopover(typeChip, D.TYPE_OPTIONS, LST.types, (next) => { LST.types = next; LST.page = 1; renderList(); });
    const methodChip = root.querySelector('#method-chip'); if (methodChip) methodChip.onclick = () => openCheckPopover(methodChip, D.METHOD_OPTIONS, LST.methods, (next) => { LST.methods = next; LST.page = 1; renderList(); });
    const combChip = root.querySelector('#comb-chip'); if (combChip) combChip.onclick = () => openCheckPopover(combChip, D.COMBINES_OPTIONS, LST.combines, (next) => { LST.combines = next; LST.page = 1; renderList(); });
    const dateChip = root.querySelector('#date-chip'); if (dateChip) dateChip.onclick = () => openDatePopover(dateChip);
    const usedChip = root.querySelector('#used-chip'); if (usedChip) usedChip.onclick = () => openUsedPopover(usedChip);
    // filter tags clear
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'types') LST.types = [];
      if (k === 'methods') LST.methods = [];
      if (k === 'combines') LST.combines = [];
      if (k === 'date') { LST.dateStart = ''; LST.dateEnd = ''; }
      if (k === 'used') { LST.usedApplied = false; LST.usedMin = ''; LST.usedMax = ''; }
      LST.page = 1; renderList();
    });
    const ps = root.querySelector('#pg-size'); if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row -> detail; copy code stops propagation
    root.querySelectorAll('#dsc-tbody tr[data-id]').forEach((tr) => tr.onclick = (e) => {
      if (e.target.closest('[data-stop]')) return;
      goDetail(tr.getAttribute('data-id'));
    });
    root.querySelectorAll('.dsc-copy').forEach((c) => c.onclick = (e) => { e.stopPropagation(); copyText(c.getAttribute('data-copy')); });
    const cr = root.querySelector('[data-act="create"]'); if (cr) cr.onclick = openCreateModal;
  }

  // generic checkbox popover for Type / Method / Combines
  function openCheckPopover(anchor, options, current, apply) {
    closePops();
    const sel = current.slice();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:200px;padding:8px"></div>');
    pop.innerHTML = options.map((o) =>
      '<label class="edit-check" data-v="' + o.value + '"><input type="checkbox" ' + (sel.includes(o.value) ? 'checked' : '') + ' /><span>' + esc(o.label) + '</span></label>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('label[data-v]').forEach((lb) => {
      const raw = lb.getAttribute('data-v');
      const val = isNaN(Number(raw)) ? raw : Number(raw);
      lb.querySelector('input').onchange = (e) => {
        if (e.target.checked) { if (!sel.includes(val)) sel.push(val); }
        else { const i = sel.indexOf(val); if (i >= 0) sel.splice(i, 1); }
        apply(sel.slice());
      };
    });
    bindOutside(pop, anchor);
  }

  function openDatePopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:300px;padding:14px"></div>');
    pop.innerHTML =
      '<div class="ctrl-label" style="margin-bottom:8px">Start date range</div>' +
      '<div class="flex items-center gap-2">' +
        '<input class="input" id="d-start" type="text" placeholder="YYYY-MM-DD" value="' + esc(LST.dateStart) + '" style="flex:1" />' +
        '<span class="muted">to</span>' +
        '<input class="input" id="d-end" type="text" placeholder="YYYY-MM-DD" value="' + esc(LST.dateEnd) + '" style="flex:1" />' +
      '</div>' +
      '<div class="flex gap-3 mt-3" style="font-size:13px"><span class="lnk" data-sc="week">Last week</span><span class="lnk" data-sc="month">Last month</span></div>' +
      '<div class="flex justify-end gap-2 mt-3"><button class="btn btn-default" data-x>Clear</button><button class="btn btn-primary" data-apply>Apply</button></div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    pop.querySelectorAll('[data-sc]').forEach((s) => s.onclick = () => {
      const end = new Date('2026-06-05'); const start = new Date(end);
      start.setDate(start.getDate() - (s.getAttribute('data-sc') === 'week' ? 7 : 30));
      pop.querySelector('#d-start').value = fmt(start); pop.querySelector('#d-end').value = fmt(end);
    });
    pop.querySelector('[data-apply]').onclick = () => { LST.dateStart = pop.querySelector('#d-start').value; LST.dateEnd = pop.querySelector('#d-end').value; LST.page = 1; closePops(); renderList(); };
    pop.querySelector('[data-x]').onclick = () => { LST.dateStart = ''; LST.dateEnd = ''; LST.page = 1; closePops(); renderList(); };
    bindOutside(pop, anchor);
  }

  function openUsedPopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:280px;padding:14px"></div>');
    pop.innerHTML =
      '<div class="ctrl-label" style="margin-bottom:8px">Times used</div>' +
      '<div class="flex items-center gap-2">' +
        '<input class="input" id="u-min" type="number" min="0" placeholder="Minimum value" value="' + esc(LST.usedMin) + '" style="flex:1" />' +
        '<span class="muted">-</span>' +
        '<input class="input" id="u-max" type="number" min="0" placeholder="Maximum value" value="' + esc(LST.usedMax) + '" style="flex:1" />' +
      '</div>' +
      '<div class="flex justify-end gap-2 mt-3"><button class="btn btn-default" data-x>Clear</button><button class="btn btn-primary" data-apply>Confirm</button></div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelector('[data-apply]').onclick = () => {
      LST.usedMin = pop.querySelector('#u-min').value; LST.usedMax = pop.querySelector('#u-max').value;
      LST.usedApplied = LST.usedMin !== '' || LST.usedMax !== ''; LST.page = 1; closePops(); renderList();
    };
    pop.querySelector('[data-x]').onclick = () => { LST.usedApplied = false; LST.usedMin = ''; LST.usedMax = ''; LST.page = 1; closePops(); renderList(); };
    bindOutside(pop, anchor);
  }

  function bindOutside(pop, anchor) {
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ================= CREATE-TYPE MODAL =================
  function openCreateModal() {
    const cards = D.TYPE_CARDS.map((c) =>
      '<div class="dsc-type-card" data-type="' + c.key + '" style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--hair);border-radius:10px;padding:14px 16px;cursor:pointer">' +
        '<div class="flex items-center gap-3">' +
          '<span style="width:36px;height:36px;border-radius:9px;background:#e6f0ff;color:var(--brand);display:grid;place-items:center;flex:none">' + DIM_ICON[c.key === 'product' ? 'product' : c.key === 'order' ? 'order' : 'shipping'] + '</span>' +
          '<div><div style="font-weight:600;color:var(--ink)">' + esc(c.label) + '</div><div class="muted" style="font-size:12.5px">' + esc(c.desc) + '</div></div>' +
        '</div>' +
        '<span style="color:var(--ink-muted)">' + I.chevRight + '</span>' +
      '</div>').join('');
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:520px"></div>');
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>Select discount type</span><span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:10px">' + cards + '</div></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelectorAll('.dsc-type-card').forEach((card) => {
      card.onmouseenter = () => card.style.borderColor = 'var(--brand)';
      card.onmouseleave = () => card.style.borderColor = 'var(--hair)';
      card.onclick = () => { close(); goNew(card.getAttribute('data-type')); };
    });
  }

  // ================= DETAIL / EDIT VIEW =================
  // ED holds the working copy of the form for the current route
  let ED = null;

  function buildNewState(dim) {
    return {
      activity_id: 0, dimension: dim, run_status: '', status: 0, dirty: false,
      method: 'code', discount_code: '', title: '',
      discount_value_type: 'percentage', discount_value: '',
      applies_to: dim === 'product' ? 'specific_products' : 'all_order',
      products: [],
      minimum_purchase_type: 'none', minimum_purchase_value: '',
      maximum_uses: { totalEnabled: false, total: '', customerEnabled: false, customer: '', oncePerOrder: false },
      customer_scope: 'All customers',
      countries: 'all',
      combinations: { product_discount: false, order_discount: false, shipping_discount: false },
      start_date: '2026-06-05 00:00:00', end_date: '', never_expires: true,
      total_used: 0, total_sales: 0, logs: [],
    };
  }

  // deep-ish clone of a detail record into the editable working state
  function cloneDetail(rec) {
    const c = JSON.parse(JSON.stringify(rec));
    c.dirty = false;
    return c;
  }

  // mark the working copy dirty and refresh so the unsaved bar appears
  function markDirty() {
    if (ED && !ED.dirty) { ED.dirty = true; renderEdit(); }
  }

  function dimTitle(dim) {
    return dim === 'product' ? 'Amount off products' : dim === 'order' ? 'Amount off order' : 'Free shipping';
  }
  function dimLabel(dim) {
    return dim === 'product' ? 'Product discount' : dim === 'order' ? 'Order discount' : 'Free shipping';
  }

  function renderEdit() {
    const e = ED;
    const isEdit = e.activity_id !== 0;
    const pageTitle = isEdit
      ? (e.method === 'code' ? (e.discount_code || 'Discount') : (e.title || 'Discount'))
      : ('Add ' + (e.dimension === 'product' ? 'product' : e.dimension === 'order' ? 'order' : 'shipping') + ' discount');

    // Turn on/off button visibility (mirrors index.tsx header logic):
    //   Turn on  when isEdit && (status === 0 || run_status === 'Scheduled')
    //   Turn off when isEdit && status === 1
    let statusBtn = '';
    if (isEdit) {
      if (e.status === 1) statusBtn = '<button class="btn btn-primary" data-act="turnoff" style="background:var(--err);border-color:var(--err)">Turn off</button>';
      else if (e.status === 0 || e.run_status === 'Scheduled') statusBtn = '<button class="btn btn-primary" data-act="turnon">Turn on</button>';
    }

    root.innerHTML =
      (e.dirty ? unsavedBar(isEdit) : '') +
      '<div class="detail-wrap">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to discounts">' + I.arrowLeft + '</button>' +
          '<span class="page-title" style="word-break:break-all">' + esc(pageTitle) + '</span>' +
          (isEdit && e.run_status ? runPill(e.run_status) : '') +
        '</div>' +
        '<div class="flex items-center gap-2">' + statusBtn + '</div>' +
      '</div>' +
      '<div class="detail-cols">' +
        '<div class="detail-main" style="display:flex;flex-direction:column;gap:16px" id="ed-form">' +
          methodCard(e) +
          (e.dimension !== 'shipping' ? valueCard(e) : '') +
          (e.dimension === 'product' ? appliesToCard(e) : '') +
          minimumCard(e) +
          (e.method === 'code' ? maximumCard(e) : '') +
          (e.dimension === 'shipping' ? countriesCard(e) : '') +
          eligibilityCard(e) +
          combinationsCard(e) +
          activeTimeCard(e) +
          (isEdit ? logsCard(e) : '') +
          '<div class="flex justify-end"><button class="btn btn-primary" data-act="save">' + (isEdit ? 'Update' : 'Add') + '</button></div>' +
        '</div>' +
        '<div class="detail-rail">' + overviewCard(e) + '</div>' +
      '</div>' +
      '</div>';

    wireEdit(e);
  }

  // ---- Unsaved-changes bar — shared full-width top bar (UI.unsavedBar) ----
  // Rendered only when dirty (conditional render + markDirtyLive), so show:true.
  function unsavedBar(isEdit) {
    return window.UI.unsavedBar({ saveLabel: isEdit ? 'Update' : 'Add', saveAct: 'save', show: true });
  }

  function sectionCard(title, body, rightHtml) {
    return '<div class="panel card-pad">' +
      '<div class="flex items-center justify-between mb-3"><div class="card-title">' + title + '</div>' + (rightHtml || '') + '</div>' +
      body + '</div>';
  }

  // radio helpers (styled buttons + plain radios)
  function segBtn(name, opts, val) {
    return '<div class="dsc-seg" data-seg="' + name + '" style="display:inline-flex;border:1px solid var(--ctl);border-radius:8px;overflow:hidden">' +
      opts.map((o, i) =>
        '<button type="button" class="dsc-seg-btn' + (o.value === val ? ' active' : '') + '" data-v="' + o.value + '" style="height:32px;padding:0 14px;font-size:13px;border:none;cursor:pointer;' +
        (i ? 'border-left:1px solid var(--ctl);' : '') +
        (o.value === val ? 'background:var(--brand);color:#fff' : 'background:#fff;color:var(--ink)') + '">' + esc(o.label) + '</button>').join('') +
    '</div>';
  }
  function radioRow(name, value, current, label, sub) {
    const on = String(value) === String(current);
    return '<label class="flex items-start gap-2" style="cursor:pointer;padding:3px 0">' +
      '<span class="dsc-radio" data-radio="' + name + '" data-v="' + esc(value) + '" style="width:16px;height:16px;border-radius:50%;border:2px solid ' + (on ? 'var(--brand)' : 'var(--ctl)') + ';flex:none;margin-top:2px;display:grid;place-items:center">' +
        (on ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--brand)"></span>' : '') + '</span>' +
      '<span><span style="font-size:14px;color:var(--ink)">' + esc(label) + '</span>' + (sub ? '<div class="muted" style="font-size:12px">' + esc(sub) + '</div>' : '') + '</span>' +
    '</label>';
  }
  function checkRow(name, checked, label, sub) {
    return '<label class="flex items-start gap-2" style="cursor:pointer;padding:3px 0">' +
      '<span class="dsc-check" data-check="' + name + '" style="width:16px;height:16px;border-radius:4px;border:2px solid ' + (checked ? 'var(--brand)' : 'var(--ctl)') + ';background:' + (checked ? 'var(--brand)' : '#fff') + ';flex:none;margin-top:2px;display:grid;place-items:center;color:#fff">' +
        (checked ? svg('<path d="M20 6 9 17l-5-5"/>', 11) : '') + '</span>' +
      '<span><span style="font-size:14px;color:var(--ink)">' + esc(label) + '</span>' + (sub ? '<div class="muted" style="font-size:12px;margin-top:1px">' + esc(sub) + '</div>' : '') + '</span>' +
    '</label>';
  }

  // ---- Method (header) ----
  function methodCard(e) {
    const field = e.method === 'code'
      ? '<div class="mt-4"><div class="card-title" style="font-weight:500;margin-bottom:6px">Discount code</div>' +
          '<div class="flex gap-2"><input class="input" id="f-code" placeholder="Eg. BLACKFRIDAY20" value="' + esc(e.discount_code) + '" style="flex:1" />' +
          '<button class="btn btn-gray" data-act="gencode">Generate</button></div>' +
          '<div class="muted" style="font-size:12px;margin-top:6px">Customers must enter this code at checkout.</div></div>'
      : '<div class="mt-4"><div class="card-title" style="font-weight:500;margin-bottom:6px">Title</div>' +
          '<input class="input" id="f-title" placeholder="Eg. Black Friday" value="' + esc(e.title) + '" />' +
          '<div class="muted" style="font-size:12px;margin-top:6px">Customers will see this in their cart and at checkout.</div></div>';
    const body =
      '<div class="card-title" style="margin-bottom:10px">Method</div>' +
      segBtn('method', [{ label: 'Discount code', value: 'code' }, { label: 'Automatic discount', value: 'automatic' }], e.method) +
      field;
    return sectionCard(esc(dimTitle(e.dimension)), body);
  }

  // ---- Discount value ----
  function valueCard(e) {
    const isPct = e.discount_value_type === 'percentage';
    const body =
      '<div class="flex items-center gap-3" style="flex-wrap:wrap">' +
        segBtn('valuetype', [{ label: 'Percentage off', value: 'percentage' }, { label: 'Fixed amount', value: 'fixed' }], e.discount_value_type) +
        '<div style="display:inline-flex;align-items:stretch;border:1px solid var(--ctl);border-radius:8px;overflow:hidden;height:36px;width:170px">' +
          (isPct ? '' : '<span style="display:grid;place-items:center;padding:0 10px;background:var(--panel);color:var(--ink-body);font-size:13px;border-right:1px solid var(--ctl)">$</span>') +
          '<input class="dsc-bare" id="f-value" type="number" step="0.01" min="0.01" placeholder="0.01" value="' + esc(e.discount_value) + '" style="flex:1;border:none;outline:none;padding:0 10px;font-size:13px;width:100%" />' +
          (isPct ? '<span style="display:grid;place-items:center;padding:0 10px;background:var(--panel);color:var(--ink-body);font-size:13px;border-left:1px solid var(--ctl)">%</span>' : '') +
        '</div>' +
      '</div>';
    return sectionCard('Discount value', body);
  }

  // ---- Applies to (product only) ----
  function appliesToCard(e) {
    const list = (e.products || []).map((p) =>
      '<div class="flex items-center justify-between" style="padding:10px 12px;border-top:1px solid var(--hair)">' +
        '<div class="flex items-center gap-3">' +
          '<div style="width:40px;height:40px;border-radius:6px;background:#f3f4f6;display:grid;place-items:center;font-size:11px;color:var(--ink-muted);flex:none">IMG</div>' +
          '<div><div style="font-weight:500;font-size:13.5px;color:var(--ink)">' + esc(p.name) + '</div>' +
            (p.has_variants ? '<div class="muted" style="font-size:12px">(' + p.selected + ' of ' + p.total + ' variants selected)</div>' : '<div class="muted" style="font-size:12px">' + esc(p.store) + '</div>') +
          '</div>' +
        '</div>' +
        '<span class="dsc-prod-x" data-pid="' + p.id + '" style="color:var(--ink-muted);cursor:pointer;display:inline-flex;padding:4px">' + I.x + '</span>' +
      '</div>').join('');
    const body =
      radioRow('appliesto', 'specific_products', e.applies_to, 'Specific products') +
      '<div class="mt-3">' +
        '<div class="dsc-pick" data-act="pick-products" style="width:100%;height:36px;border:1px solid var(--ctl);border-radius:8px;padding:0 12px;font-size:13px;color:var(--ink-muted);display:flex;align-items:center;gap:8px;cursor:pointer;background:#fff">' +
          I.plus + '<span>Select products</span></div>' +
        ((e.products || []).length ? '<div style="margin-top:12px;border:1px solid var(--hair);border-radius:10px;background:#fff">' + list + '</div>' : '') +
      '</div>';
    return sectionCard('Applies to', body);
  }

  // ---- Minimum purchase ----
  function minimumCard(e) {
    const t = e.minimum_purchase_type;
    // Note text mirrors minimumPurchase.tsx note() exactly:
    //   non-product → "Applies to all products"
    //   product + amount   → "Applies only to selected collections"
    //   product + quantity → "Applies only to selected products"
    const noteFor = (type) => {
      if (e.dimension !== 'product') return 'Applies to all products';
      return type === 'amount' ? 'Applies only to selected collections' : 'Applies only to selected products';
    };
    let extra = '';
    if (t === 'amount') {
      extra = '<div class="mt-2 flex gap-3 items-center" style="padding-left:24px">' +
        '<div style="display:inline-flex;align-items:stretch;border:1px solid var(--ctl);border-radius:8px;overflow:hidden;height:36px;width:190px">' +
          '<span style="display:grid;place-items:center;padding:0 10px;background:var(--panel);font-size:13px;border-right:1px solid var(--ctl)">$</span>' +
          '<input class="dsc-bare" id="f-min" type="number" step="0.01" min="0.01" placeholder="0.01" value="' + esc(e.minimum_purchase_value) + '" style="flex:1;border:none;outline:none;padding:0 10px;font-size:13px;width:100%" /></div>' +
        '<span class="muted" style="font-size:12px">' + noteFor('amount') + '</span>' +
      '</div>';
    } else if (t === 'quantity') {
      extra = '<div class="mt-2 flex gap-3 items-center" style="padding-left:24px">' +
        '<div style="display:inline-flex;align-items:stretch;border:1px solid var(--ctl);border-radius:8px;overflow:hidden;height:36px;width:190px">' +
          '<input class="dsc-bare" id="f-min" type="number" min="1" step="1" placeholder="1" value="' + esc(e.minimum_purchase_value) + '" style="flex:1;border:none;outline:none;padding:0 10px;font-size:13px;width:100%" />' +
          '<span style="display:grid;place-items:center;padding:0 10px;background:var(--panel);font-size:13px;border-left:1px solid var(--ctl)">item(s)</span></div>' +
        '<span class="muted" style="font-size:12px">' + noteFor('quantity') + '</span>' +
      '</div>';
    }
    const body =
      radioRow('minimum', 'none', t, 'No minimum requirements') +
      radioRow('minimum', 'amount', t, 'Minimum purchase amount') +
      (t === 'amount' ? extra : '') +
      radioRow('minimum', 'quantity', t, 'Minimum quantity of items') +
      (t === 'quantity' ? extra : '');
    return sectionCard('Minimum purchase requirements', body);
  }

  // ---- Maximum uses (code only) ----
  function maximumCard(e) {
    const mu = e.maximum_uses;
    const totalInput = mu.totalEnabled
      ? '<div class="mt-2" style="padding-left:24px"><div style="display:inline-flex;align-items:stretch;border:1px solid var(--ctl);border-radius:8px;overflow:hidden;height:36px;width:200px">' +
          '<input class="dsc-bare" id="f-mu-total" type="number" min="1" placeholder="Unlimited" value="' + esc(mu.total) + '" style="flex:1;border:none;outline:none;padding:0 10px;font-size:13px;width:100%" />' +
          '<span style="display:grid;place-items:center;padding:0 10px;background:var(--panel);font-size:13px;border-left:1px solid var(--ctl)">times</span></div></div>'
      : '';
    const custInput = mu.customerEnabled
      ? '<div class="mt-2" style="padding-left:24px"><div style="display:inline-flex;align-items:stretch;border:1px solid var(--ctl);border-radius:8px;overflow:hidden;height:36px;width:200px">' +
          '<input class="dsc-bare" id="f-mu-cust" type="number" min="1" placeholder="Unlimited" value="' + esc(mu.customer) + '" style="flex:1;border:none;outline:none;padding:0 10px;font-size:13px;width:100%" />' +
          '<span style="display:grid;place-items:center;padding:0 10px;background:var(--panel);font-size:13px;border-left:1px solid var(--ctl)">times</span></div></div>'
      : '';
    const body =
      checkRow('mu-total', mu.totalEnabled, 'Limit number of times this discount can be used in total') + totalInput +
      checkRow('mu-cust', mu.customerEnabled, 'Limit number of times this discount can be used per customer') + custInput +
      (e.dimension === 'product'
        ? checkRow('mu-once', mu.oncePerOrder, 'Once per order', 'If not selected, the amount will be taken off each eligible item in an order.')
        : '');
    return sectionCard('Maximum discount uses', body);
  }

  // ---- Countries (shipping only) ----
  function countriesCard(e) {
    return sectionCard('Countries', radioRow('countries', 'all', e.countries, 'All countries'));
  }

  // ---- Eligibility ----
  // Reference ships a single "All customers" option (eligibility.tsx).
  function eligibilityCard(e) {
    return sectionCard('Eligibility', radioRow('eligibility', 'All customers', e.customer_scope, 'All customers'));
  }

  // ---- Combinations ----
  function combinationsCard(e) {
    const c = e.combinations;
    // Mirrors combinations.tsx renderNote() exactly (incl. the order/product quirk).
    const note = (key) => {
      if (e.dimension === 'order') {
        if (key === 'product_discount') return 'Customers must enter this code at checkout.';
        if (key === 'order_discount') return 'All eligible order discounts will apply';
        return 'The largest eligible shipping discount will apply in addition to eligible order discounts';
      }
      if (key === 'product_discount') return 'Each eligible item in the cart may receive up to one product discount';
      if (key === 'order_discount') return 'All eligible order discounts will apply in addition to eligible product discounts';
      return 'The largest eligible shipping discount will apply in addition to eligible product discounts';
    };
    let rows = checkRow('cmb-product', c.product_discount, 'Product discount', c.product_discount ? note('product_discount') : '');
    rows += checkRow('cmb-order', c.order_discount, 'Order discount', c.order_discount ? note('order_discount') : '');
    if (e.dimension !== 'shipping') rows += checkRow('cmb-shipping', c.shipping_discount, 'Shipping discounts', c.shipping_discount ? note('shipping_discount') : '');
    const count = combinableCount(e);
    const banner =
      '<div class="mt-4" style="border:1px solid var(--hair);border-radius:10px;padding:12px">' +
        '<div style="font-size:13px;color:var(--ink-body)">This discount could combine with <span class="lnk" data-act="combinable">' + count + ' discounts</span> at checkout</div>' +
        '<div class="info-banner" style="margin-top:10px;margin-bottom:0">' + I.info + '<span style="font-size:12.5px">Test different combinations to avoid unexpected reductions</span></div>' +
      '</div>';
    return sectionCard('Combinations', rows + banner);
  }

  // how many other discounts this could stack with (sample: count rows of the chosen dims, excluding self)
  function combinableCount(e) {
    const dims = [];
    if (e.combinations.product_discount) dims.push(2);
    if (e.combinations.order_discount) dims.push(1);
    if (e.combinations.shipping_discount) dims.push(3);
    if (!dims.length) return 0;
    return D.DISCOUNTS.filter((d) => d.activity_id !== e.activity_id && dims.includes(d.discount_dimension)).length;
  }

  // ---- Active time ----
  function activeTimeCard(e) {
    const isEdit = e.activity_id !== 0;
    const startVal = (e.start_date || '').replace(' ', 'T').slice(0, 16);
    const endVal = (e.end_date || '').replace(' ', 'T').slice(0, 16);
    // Real activeTime.tsx disables the Start time picker on existing records.
    const startDisabled = isEdit ? ' disabled style="width:260px;background:var(--panel);color:var(--ink-muted);cursor:not-allowed"' : ' style="width:260px"';
    const body =
      '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<div><div class="muted" style="font-size:13px;margin-bottom:4px">Start time (UTC+00:00)</div>' +
          '<input class="input" id="f-start" type="text" placeholder="YYYY-MM-DD HH:mm" value="' + esc(startVal.replace('T', ' ')) + '"' + startDisabled + ' /></div>' +
        (!e.never_expires
          ? '<div><div class="muted" style="font-size:13px;margin-bottom:4px">End time (UTC+00:00)</div>' +
            '<input class="input" id="f-end" type="text" placeholder="YYYY-MM-DD HH:mm" value="' + esc(endVal.replace('T', ' ')) + '" style="width:260px" /></div>'
          : '') +
        checkRow('never', e.never_expires, 'Never expires') +
      '</div>';
    return sectionCard('Active time', body);
  }

  // ---- Logs / Timeline (edit only) ----
  function logsCard(e) {
    const items = (e.logs || []).map((l, i, arr) =>
      '<div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:' + (i < arr.length - 1 ? '14px' : '0') + ';padding-left:20px">' +
        '<span style="position:absolute;left:0;top:5px;width:9px;height:9px;border-radius:50%;background:var(--brand);box-shadow:0 0 0 2px #cfe1ff"></span>' +
        (i < arr.length - 1 ? '<span style="position:absolute;left:4px;top:16px;bottom:0;width:2px;background:var(--hair)"></span>' : '') +
        '<span class="subtle" style="font-size:13px">' + esc(l.content) + '</span>' +
        '<span class="muted" style="font-size:12px;white-space:nowrap;margin-left:12px">' + esc(l.create_time) + '</span>' +
      '</div>').join('');
    return sectionCard('Timeline', items ? '<div>' + items + '</div>' : '<div class="muted" style="font-size:13px">No logs yet.</div>');
  }

  // ---- Overview (right summary panel) ----
  function overviewCard(e) {
    const title = e.method === 'code' ? (e.discount_code || '—') : (e.title || '—');
    const methodText = e.method === 'code' ? 'Code' : 'Automatic';
    const typeText = dimTitle(e.dimension);
    // value text
    let valueText;
    if (e.dimension === 'shipping') valueText = 'Free shipping on all products';
    else {
      const v = e.discount_value || '0';
      const pcount = (e.products || []).length;
      if (e.discount_value_type === 'percentage') valueText = e.dimension === 'order' ? (v + '% off entire order') : (v + '% off ' + pcount + ' product' + (pcount === 1 ? '' : 's'));
      else valueText = e.dimension === 'order' ? ('$' + v + ' off entire order') : ('$' + v + ' off ' + pcount + ' product' + (pcount === 1 ? '' : 's'));
    }
    // minimum text
    let minText;
    if (e.minimum_purchase_type === 'amount') minText = 'Minimum purchase of $' + (e.minimum_purchase_value || '0');
    else if (e.minimum_purchase_type === 'quantity') minText = 'Minimum purchase of ' + (e.minimum_purchase_value || '0') + ' items';
    else minText = 'No minimum purchase requirement';
    // max uses
    const mu = e.maximum_uses; const muPieces = [];
    if (e.method === 'code') {
      if (mu.totalEnabled && mu.total) muPieces.push('Use ' + mu.total + ' times in total');
      if (mu.customerEnabled && mu.customer) muPieces.push('Use ' + mu.customer + ' times per customer');
      if (mu.oncePerOrder) muPieces.push('Applies once per order');
    }
    // combinations
    const entries = [];
    if (e.combinations.product_discount) entries.push('product');
    if (e.combinations.order_discount) entries.push('order');
    if (e.combinations.shipping_discount) entries.push('shipping');
    let comboText;
    if (!entries.length) comboText = "Can't combine with other discounts";
    else if (entries.length === 3) comboText = 'Combines with product, order, and shipping discounts';
    else comboText = 'Combines with ' + entries.join(', ') + ' discounts';

    const li = (t) => '<li>' + esc(t) + '</li>';
    // Real overview.tsx hardcodes "All customers" (eligibility has the single option).
    const details =
      li('All customers') + li(valueText) + li(minText) +
      (muPieces.length ? li(muPieces.join(', ')) : '') + li(comboText) +
      (e.start_date ? li('Start at ' + e.start_date) : '') +
      (e.end_date ? li('End at ' + e.end_date) : '');

    return '<div class="panel card-pad" style="position:sticky;top:8px">' +
      '<div class="flex items-center justify-between mb-1"><div class="card-title" style="font-size:15px">Overview</div>' + (e.run_status ? runPill(e.run_status) : '') + '</div>' +
      '<div class="flex items-center gap-2"><div style="font-size:14px;color:var(--ink);word-break:break-all">' + esc(title) + '</div>' +
        (title !== '—' ? '<span class="dsc-copy" data-copy="' + esc(title) + '" style="color:var(--ink-muted);cursor:pointer;display:inline-flex;padding:2px">' + I.copy + '</span>' : '') + '</div>' +
      '<div class="muted" style="font-size:13px;margin-bottom:8px">' + methodText + '</div>' +
      '<div style="font-size:13px;color:var(--ink)">Type</div>' +
      '<div class="flex items-center gap-2 muted" style="font-size:13px;margin:2px 0 8px">' + DIM_ICON[e.dimension] + '<span>' + esc(typeText) + '</span></div>' +
      '<div style="font-size:13px;color:var(--ink)">Details</div>' +
      '<ul class="muted" style="font-size:13px;list-style:disc;padding-left:18px;margin:4px 0 8px;display:flex;flex-direction:column;gap:4px">' + details + '</ul>' +
      '<div style="font-size:13px;color:var(--ink)">Performance</div>' +
      '<ul class="muted" style="font-size:13px;list-style:disc;padding-left:18px;margin-top:4px;display:flex;flex-direction:column;gap:4px">' +
        '<li>' + (e.total_used || 0) + ' used</li>' +
        '<li>' + money(e.total_sales) + ' in total sales</li>' +
      '</ul>' +
    '</div>';
  }

  function reRenderEdit() { renderEdit(); root.parentElement.scrollTop = root.parentElement.scrollTop; }

  function wireEdit(e) {
    const isEdit = e.activity_id !== 0;
    // header
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = () => { location.hash = '#/discounts'; };
    // Turn on/off: real index.tsx blocks status change while the form is dirty.
    const on = root.querySelector('[data-act="turnon"]'); if (on) on.onclick = () => {
      if (e.dirty) { toast('Please save changes before updating status.'); return; }
      e.status = 1; e.run_status = e.run_status === 'Expired' ? 'Expired' : 'Active'; toast('Turned on successfully'); renderEdit();
    };
    const off = root.querySelector('[data-act="turnoff"]'); if (off) off.onclick = () => {
      if (e.dirty) { toast('Please save changes before updating status.'); return; }
      e.status = 0; toast('Turned off successfully'); renderEdit();
    };
    // Save (inline footer button + the dark unsaved bar both use data-act="save")
    root.querySelectorAll('[data-act="save"]').forEach((s) => s.onclick = () => doSave(e, isEdit));
    // Discard (only on the dark bar) — confirm then revert/leave (mirrors handleDiscard)
    root.querySelectorAll('[data-act="discard"]').forEach((d) => d.onclick = () => handleDiscard(e, isEdit));

    // segmented buttons (method / valuetype)
    root.querySelectorAll('.dsc-seg-btn').forEach((b) => b.onclick = () => {
      const seg = b.closest('.dsc-seg').getAttribute('data-seg');
      const v = b.getAttribute('data-v');
      if (seg === 'method') { if (e.method !== v) { e.method = v; e.dirty = true; renderEdit(); } }
      else if (seg === 'valuetype') { if (e.discount_value_type !== v) { e.discount_value_type = v; e.discount_value = ''; e.dirty = true; renderEdit(); } }
    });

    // radios
    root.querySelectorAll('.dsc-radio').forEach((r) => r.onclick = () => {
      const name = r.getAttribute('data-radio'); const v = r.getAttribute('data-v');
      if (name === 'appliesto') e.applies_to = v;
      else if (name === 'minimum') { e.minimum_purchase_type = v; if (v === 'none') e.minimum_purchase_value = ''; }
      else if (name === 'countries') e.countries = v;
      else if (name === 'eligibility') e.customer_scope = v;
      e.dirty = true; renderEdit();
    });

    // checkboxes
    root.querySelectorAll('.dsc-check').forEach((c) => c.onclick = () => {
      const name = c.getAttribute('data-check');
      if (name === 'mu-total') e.maximum_uses.totalEnabled = !e.maximum_uses.totalEnabled;
      else if (name === 'mu-cust') e.maximum_uses.customerEnabled = !e.maximum_uses.customerEnabled;
      else if (name === 'mu-once') e.maximum_uses.oncePerOrder = !e.maximum_uses.oncePerOrder;
      else if (name === 'cmb-product') e.combinations.product_discount = !e.combinations.product_discount;
      else if (name === 'cmb-order') e.combinations.order_discount = !e.combinations.order_discount;
      else if (name === 'cmb-shipping') e.combinations.shipping_discount = !e.combinations.shipping_discount;
      else if (name === 'never') { e.never_expires = !e.never_expires; if (e.never_expires) e.end_date = ''; }
      e.dirty = true; renderEdit();
    });

    // text/number inputs — keep state on input (no re-render to preserve focus).
    // First keystroke flips dirty and reveals the bar imperatively (focus stays put).
    const bind = (id, fn) => { const el = root.querySelector(id); if (el) el.oninput = () => { fn(el.value); markDirtyLive(isEdit); }; };
    const codeEl = root.querySelector('#f-code'); if (codeEl) codeEl.oninput = () => { e.discount_code = codeEl.value; markDirtyLive(isEdit); };
    bind('#f-title', (v) => e.title = v);
    bind('#f-value', (v) => e.discount_value = v);
    bind('#f-min', (v) => e.minimum_purchase_value = v);
    bind('#f-mu-total', (v) => e.maximum_uses.total = v);
    bind('#f-mu-cust', (v) => e.maximum_uses.customer = v);
    bind('#f-start', (v) => e.start_date = v ? v.replace('T', ' ') + ':00' : '');
    bind('#f-end', (v) => e.end_date = v ? v.replace('T', ' ') + ':00' : '');

    // overview update on blur of key fields (so the summary reflects edits)
    ['#f-code', '#f-title', '#f-value', '#f-min', '#f-mu-total', '#f-mu-cust'].forEach((id) => {
      const el = root.querySelector(id); if (el) el.onblur = () => renderEdit();
    });

    // generate code
    const gen = root.querySelector('[data-act="gencode"]'); if (gen) gen.onclick = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
      for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
      e.discount_code = s; e.dirty = true; renderEdit();
    };

    // applies-to product picker + remove
    const pick = root.querySelector('[data-act="pick-products"]'); if (pick) pick.onclick = () => openProductPicker(e);
    root.querySelectorAll('.dsc-prod-x').forEach((x) => x.onclick = () => {
      const pid = Number(x.getAttribute('data-pid'));
      e.products = (e.products || []).filter((p) => p.id !== pid); e.dirty = true; renderEdit();
    });

    // copy in overview
    root.querySelectorAll('.dsc-copy').forEach((c) => c.onclick = (ev) => { ev.stopPropagation(); copyText(c.getAttribute('data-copy')); });

    // combinable modal
    const comb = root.querySelector('[data-act="combinable"]'); if (comb) comb.onclick = () => openCombinableModal(e);
  }

  // Reveal the unsaved bar on the first dirty keystroke without re-rendering
  // (so the focused input keeps focus). Subsequent keystrokes are no-ops.
  function markDirtyLive(isEdit) {
    if (!ED || ED.dirty) return;
    ED.dirty = true;
    if (root.querySelector('#unsaved-bar')) return;
    const bar = h(unsavedBar(isEdit));
    root.insertBefore(bar, root.firstChild);
    bar.querySelectorAll('[data-act="save"]').forEach((s) => s.onclick = () => doSave(ED, isEdit));
    bar.querySelectorAll('[data-act="discard"]').forEach((d) => d.onclick = () => handleDiscard(ED, isEdit));
  }

  // Discard: confirm, then revert to the saved record (edit) or leave (new).
  function handleDiscard(e, isEdit) {
    confirmModal({
      title: 'Discard changes?',
      text: 'All unsaved changes will be lost.',
      okText: 'Discard',
      onOk: () => {
        if (isEdit) {
          const rec = D.DETAILS[e.activity_id];
          if (rec) { ED = cloneDetail(rec); renderEdit(); }
          else { ED.dirty = false; renderEdit(); }
        } else {
          location.hash = '#/discounts';
        }
      },
    });
  }

  // Lightweight confirm dialog (Modal.confirm analogue)
  function confirmModal(opts) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:420px"></div>');
    m.innerHTML =
      '<div class="modal-head">' + esc(opts.title) + '</div>' +
      '<div class="modal-body"><div class="muted" style="font-size:13.5px">' + esc(opts.text || '') + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>' + esc(opts.cancelText || 'Cancel') + '</button>' +
        '<button class="btn btn-primary" data-ok style="background:var(--err);border-color:var(--err)">' + esc(opts.okText || 'OK') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (ev) => { if (ev.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); opts.onOk && opts.onOk(); };
  }

  // ---- Product picker modal (subset of the real ProductSelectModal) ----
  const SAMPLE_PRODUCTS = [
    { id: 901, name: 'Aero Running Tee',  store: 'BestShop Athletics', total: 5, has_variants: true },
    { id: 902, name: 'Featherlite Shorts',store: 'BestShop Athletics', total: 1, has_variants: false },
    { id: 903, name: 'Trail Cap',         store: 'BestShop Athletics', total: 4, has_variants: true },
    { id: 811, name: 'Velocity Runner X', store: 'BestShop Footwear',  total: 6, has_variants: true },
    { id: 812, name: 'Court Classic Low', store: 'BestShop Footwear',  total: 8, has_variants: true },
    { id: 701, name: 'Bloom Linen Dress', store: 'BestShop Apparel',   total: 4, has_variants: true },
    { id: 702, name: 'Garden Tote Bag',   store: 'BestShop Apparel',   total: 1, has_variants: false },
    { id: 555, name: 'Hydro Bottle 750ml',store: 'BestShop Outdoors',  total: 3, has_variants: true },
  ];
  function openProductPicker(e) {
    const chosen = new Set((e.products || []).map((p) => p.id));
    let kw = '';
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:640px"></div>');
    const renderBody = () => {
      const rows = SAMPLE_PRODUCTS.filter((p) => p.name.toLowerCase().includes(kw.toLowerCase())).map((p) =>
        '<label class="flex items-center gap-3" style="padding:10px 12px;border-bottom:1px solid var(--hair);cursor:pointer">' +
          '<input type="checkbox" class="pk" data-id="' + p.id + '" ' + (chosen.has(p.id) ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:var(--brand)" />' +
          '<div style="width:36px;height:36px;border-radius:6px;background:#f3f4f6;display:grid;place-items:center;font-size:10px;color:var(--ink-muted);flex:none">IMG</div>' +
          '<div style="flex:1"><div style="font-weight:500;font-size:13.5px;color:var(--ink)">' + esc(p.name) + '</div>' +
            '<div class="muted" style="font-size:12px">' + esc(p.store) + (p.has_variants ? ' · ' + p.total + ' variants' : '') + '</div></div>' +
        '</label>').join('');
      return '<div style="position:relative;margin-bottom:12px"><input class="filter-input" id="pk-search" placeholder="Search products" value="' + esc(kw) + '" style="width:100%;padding-left:32px" />' +
        '<span style="position:absolute;left:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span></div>' +
        '<div style="border:1px solid var(--hair);border-radius:8px;max-height:340px;overflow:auto">' + (rows || '<div class="muted" style="padding:20px;text-align:center">No products found.</div>') + '</div>';
    };
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>Select products</span><span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body" id="pk-body">' + renderBody() + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-primary" data-add>Add</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    const rewire = () => {
      const s = m.querySelector('#pk-search'); if (s) { s.oninput = () => { kw = s.value; const c = m.querySelector('#pk-body'); c.innerHTML = renderBody(); rewire(); const ns = m.querySelector('#pk-search'); ns.focus(); ns.setSelectionRange(ns.value.length, ns.value.length); }; }
      m.querySelectorAll('.pk').forEach((cb) => cb.onchange = () => { const id = Number(cb.getAttribute('data-id')); if (cb.checked) chosen.add(id); else chosen.delete(id); });
    };
    rewire();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (ev) => { if (ev.target === backdrop) close(); };
    m.querySelector('[data-add]').onclick = () => {
      e.products = SAMPLE_PRODUCTS.filter((p) => chosen.has(p.id)).map((p) => ({ id: p.id, name: p.name, store: p.store, selected: p.total, total: p.total, has_variants: p.has_variants, image: '' }));
      close(); renderEdit();
    };
  }

  // ---- "Discount can combine with" modal ----
  function openCombinableModal(e) {
    const dims = [];
    if (e.combinations.product_discount) dims.push(2);
    if (e.combinations.order_discount) dims.push(1);
    if (e.combinations.shipping_discount) dims.push(3);
    const list = D.DISCOUNTS.filter((d) => d.activity_id !== e.activity_id && dims.includes(d.discount_dimension));
    const rows = list.length
      ? list.map((d) =>
          '<tr><td><span style="font-weight:500">' + esc(d.title_display) + '</span></td>' +
          '<td>' + runPill(d.run_status) + '</td>' +
          '<td><span class="inline-flex items-center gap-1.5">' + (TYPE_ICON[d.discount_dimension] || '') + '<span>' + esc(d.type_text) + '</span></span></td></tr>').join('')
      : '<tr><td colspan="3" class="muted" style="text-align:center;padding:24px">No discounts selected to combine with.</td></tr>';
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:760px"></div>');
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>Discount can combine with</span><span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body" style="padding:0">' +
        '<table class="tbl"><thead><tr><th>Title</th><th style="width:140px">Status</th><th style="width:220px">Type</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn btn-primary" data-done>Done</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-done]').onclick = close;
    backdrop.onclick = (ev) => { if (ev.target === backdrop) close(); };
  }

  function doSave(e, isEdit) {
    // light validation mirroring the real form
    if (e.method === 'code' && !e.discount_code.trim()) { toast("Discount code can't be blank"); return; }
    if (e.method === 'automatic' && !e.title.trim()) { toast("Title can't be blank"); return; }
    if (e.dimension !== 'shipping' && !e.discount_value) { toast("Discount value can't be blank"); return; }
    if (e.dimension === 'product' && !(e.products || []).length) { toast('Please select at least one product or variant'); return; }
    if (isEdit) { e.dirty = false; toast('Updated successfully'); renderEdit(); }
    else { toast('Discount created successfully'); location.hash = '#/discounts'; }
  }

  // ================= ROUTER (SPA: registered with the shell router) =================
  function goDetail(id) { location.hash = '#/discounts/' + id; }
  function goNew(dim) { location.hash = '#/discounts/new/' + dim; }

  function route(rest) {
    closePops();
    let m = rest.match(/^new\/(product|order|shipping)$/);
    if (m) { ED = buildNewState(m[1]); renderEdit(); root.parentElement.scrollTop = 0; return; }
    m = rest.match(/^(\d+)$/);
    if (m) {
      const rec = D.DETAILS[m[1]] || D.DETAILS[Number(m[1])];
      if (rec) { ED = cloneDetail(rec); renderEdit(); root.parentElement.scrollTop = 0; return; }
      renderMissing(m[1]); return;
    }
    renderList();
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4"><button class="back-btn" data-act="back">' + I.arrowLeft + '</button><span class="page-title">Discount #' + esc(id) + '</span></div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Detail not available in this prototype</div>' +
        '<div class="muted">Open a discount flagged with sample detail: SUMMER25, WELCOME10, Free shipping over $75, Sneaker clearance, BLACKFRIDAY40 or SPRING20.</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/discounts'; };
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.discounts = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
