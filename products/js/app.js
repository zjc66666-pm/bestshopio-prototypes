/* BestShopio Admin · Products prototype — list + edit + modals/drawers, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only renders
   the module body into #root. Mirrors reference/bestvoy-admin admin/products
   (products.vue, productEdit.vue, pages/list.tsx, pages/edit.tsx,
    components/list/*, components/edit/*, components/common/*, components/AddImageVideo,
    components/Metafields/*, components/UnSavedChanges). */
(function () {
  const D = window.DATA_PRODUCTS;
  let root; // set by the SPA shell router via VIEWS.products.render(el, rest)

  // ---- tiny helpers ----
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);
  // Price column (table.tsx): "$min - $max" when min!=max, else "$min". Plain ASCII hyphen, no decimals forced.
  const dollars = (n) => '$' + Number(n);
  const priceText = (p) => p.price_min === p.price_max ? dollars(p.price_min) : (dollars(p.price_min) + ' - ' + dollars(p.price_max));

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    edit3: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 16),
    trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 15),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 15),
    plusBig: svg('<path d="M12 5v14M5 12h14"/>', 28),
    minus: svg('<path d="M5 12h14"/>', 15),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', 16),
    imagePlus: svg('<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><circle cx="8.5" cy="9" r="1.6"/><path d="m21 15-5-5L5 21"/><path d="M16 5h6M19 2v6"/>', 18),
    grip: svg('<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>', 16),
    alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', 14),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    play: svg('<path d="m8 5 11 7-11 7z"/>', 20),
    help: svg('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>', 15),
    chevRight: svg('<path d="m9 18 6-6-6-6"/>', 15),
    // rich-text toolbar icons (TinyMCE-style toolbar mock — editor.tsx toolbar groups)
    undo: svg('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>', 16),
    redo: svg('<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>', 16),
    link: svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>', 16),
    video: svg('<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>', 16),
    table: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>', 16),
    palette: svg('<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 1 0 0 20 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h2a4 4 0 0 0 4-4 10 10 0 0 0-10-8z"/>', 16),
    highlighter: svg('<path d="m9 11-6 6v3h3l6-6"/><path d="M14 4l6 6-7 7-6-6z"/>', 16),
    alignLeft: svg('<path d="M3 6h18M3 12h12M3 18h15"/>', 16),
  };

  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ---- status derivation (table.tsx getProductStatus) + tab mapping ----
  const statusOf = (p) => p.is_del === 1 ? 'archived' : (p.is_show === 1 ? 'activated' : 'deactivated');
  const STATUS_TAB = { activated: 1, deactivated: 2, archived: 3 };

  // ---- inventory cell (table.tsx renderInventoryStatus) ----
  function inventoryCell(p) {
    const onSale = '<span style="color:var(--ink)">' + p.on_sale_stock.toLocaleString() + ' on sale</span>';
    // multi-variant: on-sale qty on line 1, variant count on line 2 (mirrors real admin)
    const left = p.spec_type === 1
      ? '<div style="line-height:1.45">' + onSale + '<div class="muted" style="font-size:13px">' + p.variant_count + ' variants</div></div>'
      : '<div>' + onSale + '</div>';
    let badge = '';
    if (p.inventory_status === 1) badge = '<span class="pill pill-orange" style="padding:2px 9px;white-space:nowrap">' + I.alert + ' Out of stock</span>';
    else if (p.inventory_status === 2) badge = '<span class="pill pill-orange" style="padding:2px 9px;white-space:nowrap">' + I.alert + ' Partial - Out of stock</span>';
    // badge sits to the right of the qty block, vertically centered, never wrapping
    return badge ? '<div class="flex items-center gap-3">' + left + badge + '</div>' : left;
  }

  // ================= LIST VIEW =================
  const LST = {
    tab: 0, kwType: 'product_name', kw: '', kwApplied: '',
    cate: 0, priceMin: '', priceMax: '', priceApplied: false,
    sortField: '', sortOrder: '', // sortField: 'price' | 'stock' ; sortOrder: 'asc' | 'desc'
    page: 1, size: 20,
    sel: {},   // product_id -> true
  };

  function matchesKeyword(p) {
    if (!LST.kwApplied) return true;
    const q = LST.kwApplied.toLowerCase();
    const has = (v) => String(v == null ? '' : v).toLowerCase().includes(q);
    switch (LST.kwType) {
      case 'product_id': return has(p.product_id);
      case 'product_spu': return has(p.product_spu);
      case 'product_sku': return has(p.sku);
      case 'barcode': return has(p.barcode);
      case 'variant_id': return has(p.variant_id);
      default: return has(p.store_name);
    }
  }

  function filteredRows() {
    let rows = D.PRODUCTS.slice();
    if (LST.tab !== 0) rows = rows.filter((p) => STATUS_TAB[statusOf(p)] === LST.tab);
    rows = rows.filter(matchesKeyword);
    if (LST.cate) {
      // Parent categories (e.g. "Activewear") include their children ("Activewear / Leggings").
      const sel = D.CATEGORIES.find((c) => c.value === LST.cate);
      const selLabel = sel ? sel.label : '';
      const childIds = D.CATEGORIES
        .filter((c) => c.value === LST.cate || (selLabel && c.label.indexOf(selLabel + ' / ') === 0))
        .map((c) => c.value);
      rows = rows.filter((p) => childIds.includes(p.cate_id));
    }
    if (LST.priceApplied) {
      const lo = LST.priceMin === '' ? -Infinity : Number(LST.priceMin);
      const hi = LST.priceMax === '' ? Infinity : Number(LST.priceMax);
      rows = rows.filter((p) => p.price_max >= lo && p.price_min <= hi);
    }
    if (LST.sortField && LST.sortOrder) {
      const key = LST.sortField === 'price' ? 'price_min' : 'on_sale_stock';
      rows.sort((a, b) => LST.sortOrder === 'asc' ? a[key] - b[key] : b[key] - a[key]);
    }
    return rows;
  }

  const tabCount = (key) => key === 0 ? D.PRODUCTS.length : D.PRODUCTS.filter((p) => STATUS_TAB[statusOf(p)] === key).length;
  const selectedRows = () => D.PRODUCTS.filter((p) => LST.sel[p.product_id]);

  // sort-arrow caret for a sortable column header (stacked ▲▼ with breathing room)
  function sortCaret(field) {
    const active = LST.sortField === field;
    const up = active && LST.sortOrder === 'asc' ? 'var(--brand)' : 'var(--ctl)';
    const dn = active && LST.sortOrder === 'desc' ? 'var(--brand)' : 'var(--ctl)';
    return '<span class="sort-caret"><span style="color:' + up + '">▲</span><span style="color:' + dn + '">▼</span></span>';
  }
  // antd-style 3-state sort tooltip text for the next click
  function sortTip(field) {
    if (LST.sortField !== field) return 'Click to sort ascending';
    return LST.sortOrder === 'asc' ? 'Click to sort descending' : 'Click to cancel sorting';
  }

  function renderList() {
    const rows = filteredRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const kwOpts = D.SEARCH_FIELDS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const tabsHtml = D.TABS.map((t) =>
      '<div class="tab' + (t.key === LST.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + tabCount(t.key) + '</span></div>').join('');

    // active filter tags (search.tsx renderFilterTagContent)
    const tags = [];
    if (LST.kwApplied) {
      const lbl = (D.SEARCH_FIELDS.find((o) => o.value === LST.kwType) || {}).value || '';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.cate) {
      const lbl = categoryLabel(LST.cate) || ((D.CATEGORIES.find((o) => o.value === LST.cate) || {}).label || '');
      tags.push('<span class="field-pill" data-clear="cate">Category: ' + esc(lbl) + ' <span class="x">&times;</span></span>');
    }
    if (LST.priceApplied) {
      const txt = (LST.priceMin !== '' ? money(LST.priceMin) : 'Min') + ' - ' + (LST.priceMax !== '' ? money(LST.priceMax) : 'Max');
      tags.push('<span class="field-pill" data-clear="price">Price range: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }

    const priceChipText = LST.priceApplied
      ? ((LST.priceMin !== '' ? money(LST.priceMin) : 'Min') + ' - ' + (LST.priceMax !== '' ? money(LST.priceMax) : 'Max'))
      : 'Price range';

    const selCount = selectedRows().length;
    const allOnPageSel = pageRows.length > 0 && pageRows.every((p) => LST.sel[p.product_id]);

    root.innerHTML =
      // title row (list.tsx) — Add product only (Product Grabber commented out in real)
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Products</h1>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-primary" data-act="add">Add product</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="pr-tabs">' + tabsHtml + '</div>' +
        // filter bar (search.tsx): keyword group (418) + Category + Price range. No sort dropdown — columns sort.
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            '<div class="flex" style="min-width:418px">' +
              '<select class="filter-select" id="kw-type" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // Category — same cascading TreeCascadeSelect picker as the edit rail (drill-in tree), not a flat select
            '<div class="sel-trigger" id="cate-trigger" style="width:220px">' +
              '<span class="' + (LST.cate ? '' : 'muted') + '" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(LST.cate ? categoryLabel(LST.cate) : 'Category') + '</span>' + I.chevDown +
            '</div>' +
            '<div class="sel-trigger" id="price-chip" style="width:220px">' +
              '<span class="' + (LST.priceApplied ? '' : 'muted') + '">' + esc(priceChipText) + '</span>' + I.chevDown +
            '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // bulk selection toolbar (table.tsx selection-toolbar) — N Selected + 3 actions, no clear link
        (selCount > 0 ?
          '<div class="card-pad" style="padding-top:0;padding-bottom:10px"><div class="flex items-center gap-3" style="background:#e6f0ff;border:1px solid #cfe1ff;border-radius:8px;padding:8px 12px">' +
            '<strong style="font-size:13px">' + selCount + ' Selected</strong>' +
            '<button class="btn btn-default" style="height:28px" data-bulk="activate">Activate</button>' +
            '<button class="btn btn-default" style="height:28px" data-bulk="deactivate">Deactivate</button>' +
            '<button class="btn btn-default" style="height:28px" data-bulk="archive">Archive products</button>' +
          '</div></div>' : '') +
        // table — columns: select, Product, Price (sortable), Inventory quantity (sortable), Status, Action
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1180px">' +
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="sel-all" ' + (allOnPageSel ? 'checked' : '') + ' style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></th>' +
            '<th>Product</th>' +
            '<th style="width:150px;cursor:pointer;user-select:none" data-sort="price" data-tip="' + sortTip('price') + '">Price' + sortCaret('price') + '</th>' +
            '<th style="width:300px;cursor:pointer;user-select:none" data-sort="stock" data-tip="' + sortTip('stock') + '">Inventory quantity' + sortCaret('stock') + '</th>' +
            '<th style="width:150px">Status</th><th style="width:80px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="pr-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">No products match these filters.</td></tr>') +
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

  function rowHtml(p) {
    const st = statusOf(p);
    const checked = LST.sel[p.product_id] ? 'checked' : '';
    const statusCell = st === 'archived'
      ? '<span class="muted">Archived</span>'
      : '<label class="flex items-center gap-2" style="cursor:pointer" data-stop><span class="sw' + (st === 'activated' ? ' on' : '') + '" data-toggle="' + p.product_id + '"></span><span style="font-size:13px">' + (st === 'activated' ? 'Activated' : 'Deactivated') + '</span></label>';
    return '<tr data-id="' + p.product_id + '">' +
      '<td data-stop><input type="checkbox" class="row-sel" data-id="' + p.product_id + '" ' + checked + ' style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></td>' +
      '<td><div class="flex items-center gap-3">' +
        '<img src="' + p.image + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none;object-fit:cover;background:#f3f4f6" />' +
        '<span style="font-weight:500;color:var(--ink)">' + esc(p.store_name) + '</span>' +
      '</div></td>' +
      '<td style="font-variant-numeric:tabular-nums;color:var(--ink)">' + priceText(p) + '</td>' +
      '<td>' + inventoryCell(p) + '</td>' +
      '<td>' + statusCell + '</td>' +
      '<td style="text-align:center" data-stop><button class="back-btn" data-view="' + p.product_id + '" title="Preview" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
    root.querySelectorAll('#pr-tabs .tab').forEach((t) => t.onclick = () => { LST.tab = Number(t.getAttribute('data-tab')); LST.page = 1; renderList(); });
    const kwType = root.querySelector('#kw-type');
    const kwInput = root.querySelector('#kw-input');
    if (kwType) kwType.onchange = () => { LST.kwType = kwType.value; if (LST.kwApplied) { LST.page = 1; renderList(); } };
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') kwInput.blur(); };
      kwInput.onblur = commit;
    }
    const cateTrig = root.querySelector('#cate-trigger');
    if (cateTrig) cateTrig.onclick = () => openCategoryCascade(cateTrig, (node) => { LST.cate = node.value; LST.page = 1; renderList(); });
    const chip = root.querySelector('#price-chip');
    if (chip) chip.onclick = () => openPricePopover(chip);
    // sortable column headers (price / stock) cycle: none -> asc -> desc -> none
    root.querySelectorAll('th[data-sort]').forEach((th) => th.onclick = () => {
      const f = th.getAttribute('data-sort');
      if (LST.sortField !== f) { LST.sortField = f; LST.sortOrder = 'asc'; }
      else if (LST.sortOrder === 'asc') { LST.sortOrder = 'desc'; }
      else { LST.sortField = ''; LST.sortOrder = ''; }
      renderList();
    });
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'cate') { LST.cate = 0; }
      if (k === 'price') { LST.priceApplied = false; LST.priceMin = ''; LST.priceMax = ''; }
      LST.page = 1; renderList();
    });
    const ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });

    // selection
    const selAll = root.querySelector('#sel-all');
    if (selAll) selAll.onchange = () => {
      const rows = filteredRows().slice((LST.page - 1) * LST.size, (LST.page - 1) * LST.size + LST.size);
      rows.forEach((p) => { if (selAll.checked) LST.sel[p.product_id] = true; else delete LST.sel[p.product_id]; });
      renderList();
    };
    root.querySelectorAll('.row-sel').forEach((c) => c.onchange = (e) => {
      e.stopPropagation();
      const id = c.getAttribute('data-id');
      if (c.checked) LST.sel[id] = true; else delete LST.sel[id];
      renderList();
    });
    // bulk actions (table.tsx Popconfirm)
    root.querySelectorAll('[data-bulk]').forEach((b) => b.onclick = () => openBulkConfirm(b.getAttribute('data-bulk')));
    // inline status toggle (Switch in Status column)
    root.querySelectorAll('[data-toggle]').forEach((sw) => sw.onclick = (e) => {
      e.stopPropagation();
      const id = Number(sw.getAttribute('data-toggle'));
      const p = D.PRODUCTS.find((x) => x.product_id === id);
      if (p) { p.is_show = p.is_show === 1 ? 0 : 1; renderList(); }
    });
    // row click -> edit ; ignore clicks on interactive cells (isInteractiveTableClick)
    root.querySelectorAll('#pr-tbody tr[data-id]').forEach((tr) => tr.onclick = (e) => {
      if (e.target.closest('[data-stop]')) return;
      goEdit(tr.getAttribute('data-id'));
    });
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); toast('Storefront preview opens in a new tab (roadmap)'); });
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  function openPricePopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;width:360px;padding:16px"></div>');
    pop.innerHTML =
      '<div class="flex items-center gap-2">' +
        '<div class="pr-field"><span class="pr-cur">$</span><input class="pr-input" id="pr-min" placeholder="Minimum value" type="number" value="' + esc(LST.priceMin) + '" /></div>' +
        '<span class="muted">-</span>' +
        '<div class="pr-field"><span class="pr-cur">$</span><input class="pr-input" id="pr-max" placeholder="Maximum value" type="number" value="' + esc(LST.priceMax) + '" /></div>' +
      '</div>' +
      '<div class="flex justify-end gap-2 mt-3">' +
        '<button class="btn btn-default" data-x>Clear</button>' +
        '<button class="btn btn-primary" data-apply>Confirm</button>' +
      '</div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, r.right - 360) + 'px'; // right-align under the trigger (matches real admin)
    pop.querySelector('[data-apply]').onclick = () => {
      LST.priceMin = pop.querySelector('#pr-min').value;
      LST.priceMax = pop.querySelector('#pr-max').value;
      LST.priceApplied = LST.priceMin !== '' || LST.priceMax !== '';
      LST.page = 1; closePops(); renderList();
    };
    pop.querySelector('[data-x]').onclick = () => { LST.priceApplied = false; LST.priceMin = ''; LST.priceMax = ''; LST.page = 1; closePops(); renderList(); };
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  // bulk confirm (table.tsx Popconfirm copy). activate/deactivate only act on eligible rows.
  function openBulkConfirm(act) {
    const n = selectedRows().length;
    const META = {
      activate: { title: 'Activate ' + n + ' products?', desc: 'Activated products will be visible and available for purchase.' },
      deactivate: { title: 'Deactivate ' + n + ' products?', desc: "Deactivated products won't be available for purchase on any sales channel." },
      archive: { title: 'Archive ' + n + ' products in bulk', desc: 'Archiving this product will hide it from your sales channels. You can use the status filter in the product list to find it.' },
    }[act];
    modal({
      title: META.title, width: 460, okText: 'Confirm',
      body: '<div class="muted" style="font-size:13.5px;line-height:1.6">' + esc(META.desc) + '</div>',
      onOk: (m, close) => {
        let affected = 0;
        if (act === 'activate') { selectedRows().filter((p) => statusOf(p) === 'deactivated').forEach((p) => { p.is_show = 1; affected++; }); }
        else if (act === 'deactivate') { selectedRows().filter((p) => statusOf(p) === 'activated').forEach((p) => { p.is_show = 0; affected++; }); }
        else if (act === 'archive') { selectedRows().filter((p) => statusOf(p) === 'deactivated').forEach((p) => { p.is_del = 1; affected++; }); }
        LST.sel = {}; close();
        const verb = act === 'archive' ? 'archived' : act === 'activate' ? 'activated' : 'deactivated';
        toast('Successfully ' + verb + ' ' + affected + ' products');
        renderList();
      },
    });
  }

  // ================= EDIT VIEW =================
  let EDIT = null;     // current form state (deep clone)
  let EDIT_ID = null;  // route id string ('0' = new)
  let ORIGIN = null;   // JSON snapshot of EDIT at load (edit.tsx hasUnsavedChanges / resetToOrigin)
  let DIRTY = false;

  function blankProduct() {
    return {
      product_id: 0, name: '', summary: '', highlights: [''], description: '', detail: '',
      cate_id: 0, category_label: '', product_spu: '', images: [],
      hasVariants: false, spec_type: 0, attr: [], attrValue: [],
      price: undefined, compareAtPrice: undefined, itemCost: undefined, sku: '', barcode: '', inventoryQuantity: undefined,
      params: [{ name: '', values: [], sort: 0, single: '' }],
      metafields: { custom: {}, google: {} },
      settings: { activated: false, status: 'deactivated', spu: '', weight: 0, category: 0, metaTitle: '', metaDescription: '', urlHandle: '', seoKeywords: [], homeTemplate: 'default' },
    };
  }

  function loadEdit(id) {
    EDIT_ID = id; DIRTY = false;
    if (id === '0' || id === 'new') { EDIT = blankProduct(); EDIT_ID = '0'; return true; }
    const src = D.DETAILS[id] || D.DETAILS[Number(id)];
    if (src) { EDIT = JSON.parse(JSON.stringify(src)); return true; }
    // fallback: synthesize a minimal record from the list row so any row is openable
    const row = D.PRODUCTS.find((p) => String(p.product_id) === String(id));
    if (!row) { EDIT = null; return false; }
    EDIT = Object.assign(blankProduct(), {
      product_id: row.product_id, name: row.store_name, spec_type: row.spec_type, hasVariants: row.spec_type === 1,
      product_spu: row.product_spu, sku: row.sku, barcode: row.barcode,
      price: row.price_min, compareAtPrice: row.price_max, inventoryQuantity: row.on_sale_stock,
      images: [{ uid: 'x', name: 'image', url: row.image }],
      attr: row.spec_type === 1 ? [{ value: 'Size', detail: [{ pic: '', value: 'S' }, { pic: '', value: 'M' }, { pic: '', value: 'L' }] }] : [],
      attrValue: row.spec_type === 1
        ? [{ unique: 'V-' + row.product_id + '-S', detail: { Size: 'S' }, image: row.image, bar_code: (row.sku || 'SKU-' + row.product_id) + '-S', price: String(row.price_min), ot_price: String(row.price_max), cost: '0', stock: Math.round(row.on_sale_stock / 3), weight: '180', bar_code_number: '', is_show: 1, is_default_select: 1 }]
        : [{ unique: 'V-' + row.product_id, detail: { Title: 'Default' }, image: row.image, bar_code: row.sku || 'SKU-' + row.product_id, price: String(row.price_min), ot_price: String(row.price_max), cost: '0', stock: row.on_sale_stock, weight: '180', bar_code_number: '', is_show: 1, is_default_select: 1 }],
      metafields: { custom: {}, google: {} },
      settings: Object.assign(blankProduct().settings, { activated: row.is_show === 1, status: statusOf(row), category: row.cate_id || 0, spu: row.product_spu, archived: row.is_del === 1 }),
    });
    return true;
  }

  const isEditMode = () => EDIT_ID !== '0' && EDIT_ID !== 'new';

  // Dirty = current form differs from the origin snapshot (edit.tsx hasUnsavedChanges,
  // which tracks an origin snapshot so reverting a change clears the bar again).
  const snapshot = () => JSON.stringify(EDIT);
  function recomputeDirty() {
    DIRTY = ORIGIN !== null && snapshot() !== ORIGIN;
    syncUnsavedBar();
  }
  function syncUnsavedBar() {
    const bar = document.getElementById('unsaved-bar');
    if (bar) bar.style.display = DIRTY ? 'flex' : 'none';
    if (root && root.parentElement) root.parentElement.classList.toggle('has-unsaved-bar', DIRTY);
  }
  // markDirty stays as the call site after every mutation; it now diffs against ORIGIN
  // so edits that cancel out (e.g. type then delete) correctly hide the bar.
  const markDirty = () => { recomputeDirty(); };

  // variant title from detail object (SkuList.tsx getVariantTitle): Object.values join ' • '
  function variantTitle(v) {
    if (v.detail && typeof v.detail === 'object') return Object.values(v.detail).join(' • ');
    return v.title || '';
  }

  // Unknown product id (e.g. a stale/typo hash) -> friendly empty state, not a blank editable form.
  function renderNotFound(id) {
    DIRTY = false;
    root.innerHTML =
      '<div class="detail-wrap">' +
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back" title="Back to products">' + I.arrowLeft + '</button>' +
        '<h1 class="page-title">Product not found</h1>' +
      '</div>' +
      '<div class="panel card-pad" style="text-align:center;padding:48px 16px">' +
        '<div style="color:var(--ink-muted);margin-bottom:6px">' + I.alert + '</div>' +
        '<div style="font-weight:600;margin-bottom:4px">No product with ID ' + esc(id) + '</div>' +
        '<div class="muted" style="font-size:13px;margin-bottom:16px">It may have been deleted, or the link is out of date.</div>' +
        '<button class="btn btn-primary" data-act="back-list">Back to products</button>' +
      '</div></div>';
    const go = () => { location.hash = '#/products'; };
    const b1 = root.querySelector('[data-act="back"]'); if (b1) b1.onclick = go;
    const b2 = root.querySelector('[data-act="back-list"]'); if (b2) b2.onclick = go;
  }

  function renderEdit(id) {
    if (!loadEdit(id)) { renderNotFound(id); return; }
    const isEdit = isEditMode();
    const title = isEdit ? (EDIT.name || 'Edit product') : 'Add product';

    root.innerHTML =
      // full-width unsaved-changes bar (UnSavedChanges.tsx) — fixed at the very TOP of the page,
      // dark, square top corners (className override !top-[0px] !rounded-tl/tr-[0px]); hidden until dirty.
      // layout: left spacer / centered alert + "You have unsaved changes" / right Discard + primary.
      '<div id="unsaved-bar" class="unsaved-bar" style="display:none">' +
        '<div style="flex:1"></div>' +
        '<div class="flex items-center gap-2"><span style="display:inline-flex">' + I.alert + '</span><span style="font-size:13.5px">You have unsaved changes</span></div>' +
        '<div class="flex items-center justify-end gap-3" style="flex:1">' +
          '<button class="btn unsaved-discard" data-act="discard">Discard</button>' +
          '<button class="btn btn-primary" data-act="save-bar">' + (isEdit ? 'Update' : 'Add') + '</button>' +
        '</div>' +
      '</div>' +
      // fixed 1200px centered container (productEdit.vue w-[1200px]) — .detail-* shared classes
      '<div class="detail-wrap">' +
        // header (edit.tsx): back button + title
        '<div class="flex items-center gap-2 mb-4">' +
          '<button class="back-btn" data-act="back" title="Back to products">' + I.arrowLeft + '</button>' +
          '<h1 class="page-title" style="min-width:0;word-break:break-word">' + esc(title) + '</h1>' +
        '</div>' +
        // two-column body: left sections (flex), right settings rail (fixed 275px)
        '<div class="detail-cols">' +
          '<div class="detail-main" id="edit-main"></div>' +
          '<div class="detail-rail" id="edit-side"></div>' +
        '</div>' +
      '</div>';

    document.getElementById('edit-main').innerHTML = mainHtml(isEdit);
    document.getElementById('edit-side').innerHTML = sideHtml(isEdit);

    // capture origin AFTER the form is fully built; dirty is measured against this.
    ORIGIN = snapshot();
    DIRTY = false;
    wireEdit(isEdit);
    syncUnsavedBar();
    if (root.parentElement) root.parentElement.scrollTop = 0;
  }

  // edit.tsx left column order: ProductInformation, ImageVideo, [Pricing+Inventory if no variants],
  // Variants, SkuList, ProductSpecifics, [Metafields custom + google if isEdit], footer actions.
  function mainHtml(isEdit) {
    return secProductInfo() + secImages() +
      (EDIT.hasVariants ? '' : secPricing() + secInventory()) +
      secVariants() + secSkuList() + secSpecifics() +
      (isEdit ? secMetafields('custom', 'Product metafields', D.SHOP_PRODUCT_DEFS) + secMetafields('google', 'Google Metafields', D.GOOGLE_PRODUCT_DEFS) : '') +
      footerHtml(isEdit);
  }
  function sideHtml(isEdit) {
    return secSettings(isEdit) + secSeo() + (isEdit ? secTemplate() : '');
  }

  // footer actions (edit.tsx 264-293)
  function footerHtml(isEdit) {
    const s = EDIT.settings || {};
    const archived = !!s.archived;            // is_del === 1
    const deactivated = isEdit && !archived && !s.activated; // is_show === 0 && is_del === 0
    let btns = '<button class="btn btn-primary" data-act="save">' + (isEdit ? 'Update Product' : 'Add Product') + '</button>';
    if (archived && isEdit) {
      btns += '<button class="btn btn-default danger-btn" data-act="destroy">Delete the product</button>';
      btns += '<button class="btn btn-default danger-btn" data-act="unarchive">Set product as unarchived</button>';
    } else if (deactivated) {
      btns += '<button class="btn btn-default danger-btn" data-act="archive-one">Archive the product</button>';
    }
    return '<div class="flex justify-end gap-2 mt-2 mb-6">' + btns + '</div>';
  }

  // ---- card shell for edit sections (Ant Card + Card.Meta header) ----
  // White card with the title on white, then a grey .b-c box wrapping the body —
  // the card padding is the white gap around the grey (mirrors real admin Add product:
  // Card > Card.Meta + <div class="b-c p-4">). plain=true = white right-rail cards.
  function card(titleHtml, bodyHtml, right, plain) {
    const head = '<div class="flex items-center justify-between mb-3"><div class="card-title">' + titleHtml + '</div>' + (right || '') + '</div>';
    const body = plain ? bodyHtml : '<div class="b-c" style="padding:16px">' + bodyHtml + '</div>';
    return '<div class="panel card-pad mb-4">' + head + body + '</div>';
  }
  const lbl = (t, hint) => '<div class="ctrl-label" style="text-transform:none;letter-spacing:normal;font-size:14px;font-weight:500;color:var(--ink);margin-bottom:0">' +
    '<span class="flex items-center gap-1">' + t + (hint ? '<span class="muted" title="' + esc(hint) + '" style="cursor:help;display:inline-flex">' + I.help + '</span>' : '') + '</span></div>';
  const field = (id, label, val, ph, hint) => '<div class="mb-3">' + lbl(label, hint) +
    '<input class="input" id="' + id + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '" style="margin-top:4px" /></div>';
  // textarea with char counter (showCount)
  function counted(id, label, val, ph, rows, max) {
    const len = (val || '').length;
    return '<div class="mb-3">' + lbl(label) +
      '<div style="position:relative;margin-top:4px">' +
        '<textarea class="input" id="' + id + '" rows="' + rows + '" maxlength="' + max + '" placeholder="' + esc(ph) + '" style="height:auto;padding:8px 12px;resize:vertical">' + esc(val) + '</textarea>' +
        '<span class="muted" id="' + id + '-cnt" style="position:absolute;right:10px;bottom:8px;font-size:11px">' + len + ' / ' + max + '</span>' +
      '</div></div>';
  }

  // RichTextEditor mock (editor.tsx). Toolbar groups mirror the real TinyMCE config:
  //   undo redo | blocks(Paragraph) fontfamily fontsize | bold italic underline strikethrough
  //   forecolor backcolor | link image media table | align | bullist numlist
  // The editable area is a contenteditable div that keeps the product's HTML body intact.
  function richTextEditor(id, htmlValue, ph) {
    const tb = [
      '<button class="rt-btn" data-rt="undo" title="Undo">' + I.undo + '</button>',
      '<button class="rt-btn" data-rt="redo" title="Redo">' + I.redo + '</button>',
      '<span class="rt-sep"></span>',
      '<select class="rt-select" data-rt="block" title="Paragraph format">' +
        '<option value="P">Paragraph</option><option value="H1">Heading 1</option>' +
        '<option value="H2">Heading 2</option><option value="H3">Heading 3</option>' +
        '<option value="BLOCKQUOTE">Quote</option><option value="PRE">Code</option></select>',
      '<select class="rt-select" data-rt="font" title="Font family">' +
        '<option value="">Font</option><option value="Helvetica,Arial,sans-serif">Sans serif</option>' +
        '<option value="Georgia,serif">Serif</option><option value="ui-monospace,Menlo,Consolas,monospace">Monospace</option></select>',
      '<select class="rt-select" data-rt="size" title="Font size">' +
        '<option value="">Size</option><option value="2">Small</option><option value="3">Normal</option>' +
        '<option value="5">Large</option><option value="6">Huge</option></select>',
      '<span class="rt-sep"></span>',
      '<button class="rt-btn" data-rt="bold" title="Bold"><b>B</b></button>',
      '<button class="rt-btn" data-rt="italic" title="Italic"><i>I</i></button>',
      '<button class="rt-btn" data-rt="underline" title="Underline"><u>U</u></button>',
      '<button class="rt-btn" data-rt="strikeThrough" title="Strikethrough"><s>S</s></button>',
      '<span class="rt-sep"></span>',
      '<button class="rt-btn" data-rt="forecolor" title="Text color">' + I.palette + '</button>',
      '<button class="rt-btn" data-rt="backcolor" title="Highlight">' + I.highlighter + '</button>',
      '<span class="rt-sep"></span>',
      '<button class="rt-btn" data-rt="link" title="Insert link">' + I.link + '</button>',
      '<button class="rt-btn" data-rt="image" title="Insert image">' + I.image + '</button>',
      '<button class="rt-btn" data-rt="video" title="Insert video">' + I.video + '</button>',
      '<button class="rt-btn" data-rt="table" title="Insert table">' + I.table + '</button>',
      '<span class="rt-sep"></span>',
      '<button class="rt-btn" data-rt="align" title="Align">' + I.alignLeft + '</button>',
      '<button class="rt-btn" data-rt="bullist" title="Bulleted list">&#8226; List</button>',
      '<button class="rt-btn" data-rt="numlist" title="Numbered list">1. List</button>',
    ].join('');
    return '<div class="rich-text-editor" style="margin-top:4px;border:1px solid var(--ctl);border-radius:8px;overflow:hidden">' +
      '<div class="rt-toolbar">' + tb + '</div>' +
      '<div class="rt-editor" id="' + id + '" contenteditable="true" data-ph="' + esc(ph) + '">' + (htmlValue || '') + '</div>' +
    '</div>';
  }

  // 1) Product information (ProductInformation.tsx)
  function secProductInfo() {
    const idHead = EDIT.product_id
      ? '<div class="flex items-center gap-2 muted" style="font-size:13px"><span>Product ID: <span class="lnk">' + EDIT.product_id + '</span></span><button class="back-btn" data-act="copy-id" title="Copy" style="width:26px;height:26px">' + I.copy + '</button></div>'
      : '';
    const highlights = EDIT.highlights.map((hl, i) =>
      '<div class="flex items-start gap-2 mb-2" data-hl="' + i + '">' +
        '<div style="position:relative;flex:1">' +
          '<input class="input" data-hl-input="' + i + '" value="' + esc(hl) + '" maxlength="150" placeholder="List the top reasons why customers should buy this product" style="padding-right:64px" />' +
          '<span class="muted" data-hl-cnt="' + i + '" style="position:absolute;right:10px;top:9px;font-size:11px">' + (hl || '').length + ' / 150</span>' +
        '</div>' +
        (i === 0
          ? '<button class="btn btn-default" data-hl-add style="width:34px;padding:0;justify-content:center">' + I.plus + '</button>'
          : '<button class="btn btn-default" data-hl-del="' + i + '" style="width:34px;padding:0;justify-content:center">' + I.minus + '</button>') +
      '</div>').join('');
    const body =
      field('f-name', 'Name', EDIT.name, 'Example: short-sleeved T-shirt') +
      counted('f-summary', 'Summary', EDIT.summary, 'Tell us something about this product (example: what makes it special)', 3, 400) +
      '<div class="mb-3">' + lbl('Highlights') + '<div style="margin-top:4px" id="hl-list">' + highlights + '</div></div>' +
      counted('f-desc', 'Description', EDIT.description, 'Describe your product’s main features and benefits to attract customers', 6, 5000) +
      '<div>' + lbl('Detail') +
        // RichTextEditor (editor.tsx — TinyMCE). Faithful mock: full toolbar (undo/redo, Paragraph,
        // font family, font size, B/I/U/S, color/highlight, link, image, video, table, align, lists)
        // over a contenteditable area that preserves the product's HTML body.
        richTextEditor('f-detail', EDIT.detail || '', 'Add comprehensive details and user guides for this product') +
      '</div>';
    return card('Product information', body, idHead);
  }

  // 2) Image/video (AddImageVideo) — empty state vs 6-col grid with featured first tile + drag reorder
  const MAX_VISIBLE_COLLAPSED = 8;
  let imgGridExpanded = false;
  function secImages() {
    const list = EDIT.images || [];
    let body;
    if (list.length === 0) {
      // empty state: dashed box, "Upload new" + "Select existing", "Accepts images,videos", support text
      body =
        '<div style="min-height:220px;display:flex;align-items:center;justify-content:center;border:2px dashed var(--ctl);border-radius:10px;padding:48px;margin-bottom:12px">' +
          '<div style="text-align:center">' +
            '<div class="flex items-center justify-center gap-3 mb-3">' +
              '<button class="btn btn-default" data-img-upload>Upload new</button>' +
              '<button class="btn" style="background:transparent;border:none;color:var(--ink)" data-img-select>Select existing</button>' +
            '</div>' +
            '<div class="muted" style="font-size:13px">Accepts images,videos</div>' +
          '</div>' +
        '</div>' +
        '<div class="muted" style="font-size:12px">' + esc(D.MEDIA_SUPPORT_TEXT) + '</div>';
    } else {
      const hasMore = list.length > MAX_VISIBLE_COLLAPSED;
      const remaining = Math.max(list.length - MAX_VISIBLE_COLLAPSED, 0);
      const visible = imgGridExpanded ? list : list.slice(0, MAX_VISIBLE_COLLAPSED);
      const tiles = visible.map((im, i) => {
        const isFirst = i === 0;
        const isLastCollapsed = !imgGridExpanded && hasMore && i === MAX_VISIBLE_COLLAPSED - 1;
        const span = isFirst ? 'grid-column:span 2;grid-row:span 2' : '';
        const inner = im.type === 'video'
          ? '<div style="position:relative;width:100%;height:100%;background:#0b1220">' +
              '<img src="' + im.url + '" alt="" style="width:100%;height:100%;object-fit:contain;opacity:.85" />' +
              '<span style="position:absolute;inset:0;display:grid;place-items:center"><span style="width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1)">' + I.play + '</span></span>' +
            '</div>'
          : '<img src="' + im.url + '" alt="" style="width:100%;height:100%;object-fit:contain;background:#fff" />';
        const overlay = isLastCollapsed
          ? '<div data-img-expand style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.5);cursor:pointer"><span style="color:#fff;font-size:22px;font-weight:700">+' + remaining + '</span></div>'
          : '';
        const del = isLastCollapsed ? ''
          : '<button class="img-del" data-img-del="' + i + '" title="Remove" style="position:absolute;right:4px;top:4px;width:22px;height:22px;border:none;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;cursor:pointer;display:grid;place-items:center;opacity:0;transition:opacity .15s">' + I.x + '</button>';
        return '<div class="img-tile" data-img="' + i + '"' + (isLastCollapsed ? '' : ' draggable="true"') +
          ' style="position:relative;border:1px solid var(--hair);border-radius:6px;overflow:hidden;cursor:move;' + span + '">' +
          inner + overlay + del +
        '</div>';
      }).join('');
      const addTile = '<div data-img-add-tile style="display:grid;place-items:center;border:2px dashed var(--ctl);border-radius:6px;cursor:pointer;color:var(--ink-muted);min-height:100px">' + I.plusBig + '</div>';
      const collapseBtn = imgGridExpanded
        ? '<div class="mb-3" style="text-align:center"><button class="btn" style="background:transparent;border:none;color:var(--ink)" data-img-collapse>Collapse</button></div>'
        : '';
      body =
        '<div id="img-grid" style="display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:100px;gap:8px;margin-bottom:12px">' + tiles + addTile + '</div>' +
        collapseBtn +
        '<div class="muted" style="font-size:12px">' + esc(D.MEDIA_SUPPORT_TEXT) + '</div>';
    }
    return card('Image/video', body);
  }

  // 3) Price settings (PriceSettings.tsx) — single-product only (hidden when hasVariants)
  function secPricing() {
    const v = (EDIT.attrValue && EDIT.attrValue[0]) || {};
    const num = (id, label, val, hint) => '<div>' + lbl(label, hint) +
      '<div style="position:relative;margin-top:4px"><span style="position:absolute;left:10px;top:9px;color:var(--ink-muted)">$</span>' +
      '<input class="input" id="' + id + '" type="number" min="0" step="0.01" value="' + (val == null ? '' : val) + '" placeholder="Please enter" style="padding-left:22px" /></div></div>';
    const body = '<div class="grid grid-cols-3 gap-4">' +
      num('p-price', 'Price', EDIT.price != null ? EDIT.price : v.price, 'When products participate in various promotional activities, the prices used for checkout may not be as stated.') +
      num('p-compare', 'Compare at price', EDIT.compareAtPrice != null ? EDIT.compareAtPrice : v.ot_price, 'To display a markdown, enter a value higher than your price. Often shown with a strikethrough (e.g. $25.00).') +
      num('p-cost', 'Item cost', EDIT.itemCost != null ? EDIT.itemCost : v.cost, "This won't be displayed to customers.") +
      '</div>';
    return card('Price settings', body);
  }

  // 4) Inventory (Inventory.tsx) — single-product only
  function secInventory() {
    const v = (EDIT.attrValue && EDIT.attrValue[0]) || {};
    const body = '<div class="grid grid-cols-3 gap-4">' +
      '<div>' + lbl('SKU') + '<input class="input" id="i-sku" value="' + esc(EDIT.sku || v.bar_code || '') + '" placeholder="Please enter" style="margin-top:4px" /></div>' +
      '<div>' + lbl('Barcode (ISBN, UPC, GTIN, etc.)') + '<input class="input" id="i-barcode" value="' + esc(EDIT.barcode || v.bar_code_number || '') + '" placeholder="Please enter" style="margin-top:4px" /></div>' +
      '<div>' + lbl('Inventory quantity') + '<input class="input" id="i-stock" type="number" min="0" value="' + (EDIT.inventoryQuantity != null ? EDIT.inventoryQuantity : (v.stock != null ? v.stock : '')) + '" placeholder="Please enter" style="margin-top:4px" /></div>' +
      '</div>';
    return card('Inventory', body);
  }

  // 5) Variants (Variants.tsx) — checkbox + option rows (AutoComplete name + value chips)
  function secVariants() {
    const checked = EDIT.hasVariants ? 'checked' : '';
    const orderBtn = EDIT.hasVariants ? '<button class="btn btn-default" data-act="variant-order">Variant display order</button>' : '';
    let optionRows = '';
    if (EDIT.hasVariants) {
      optionRows = (EDIT.attr || []).map((opt, i) => {
        const chips = (opt.detail || []).map((d, vi) =>
          '<span style="display:inline-flex;align-items:center;gap:4px;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:6px;font-size:13px">' + esc(d.value) +
          ' <span class="x" data-vval="' + i + ':' + vi + '" style="cursor:pointer;font-weight:700;display:inline-flex">' + I.x + '</span></span>').join('');
        return '<div class="flex gap-4 items-start" style="border-bottom:1px solid var(--hair);padding-bottom:16px;margin-bottom:16px" data-opt="' + i + '">' +
          '<div style="width:25%">' +
            '<input class="input" list="opt-names" data-opt-name="' + i + '" value="' + esc(opt.value) + '" placeholder="e.g. Color" />' +
          '</div>' +
          '<div style="flex:1">' +
            '<div class="flex items-center gap-2" style="flex-wrap:wrap;min-height:32px;border:1px solid var(--ctl);border-radius:8px;padding:5px 8px;background:#fff">' +
              chips +
              '<input data-opt-val="' + i + '" placeholder="Add value..." style="border:0;outline:0;background:transparent;width:128px;font-size:13px" />' +
            '</div>' +
          '</div>' +
          '<div data-opt-edit="' + i + '" title="Edit variations" style="cursor:pointer;color:var(--ink-muted);height:25px;display:flex;align-items:center">' + I.pencil + '</div>' +
          '<div data-opt-del="' + i + '" title="Delete" style="cursor:pointer;color:var(--err);height:25px;display:flex;align-items:center">' + I.trash + '</div>' +
        '</div>';
      }).join('') +
      ((EDIT.attr || []).length < 4 ? '<button class="btn btn-default" data-act="opt-add">+ Add product variant</button>' : '') +
      '<datalist id="opt-names">' + D.OPTION_NAMES.map((n) => '<option value="' + n + '">').join('') + '</datalist>';
    }
    const body =
      '<div class="flex items-center justify-between mb-2">' +
        '<label class="flex items-center gap-2" style="cursor:pointer"><input type="checkbox" id="has-variants" ' + checked + ' style="width:16px;height:16px;accent-color:var(--brand)" /><span style="font-size:13.5px">This Product has multiple variants</span></label>' +
        orderBtn +
      '</div>' +
      (EDIT.hasVariants ? '<div style="border-top:1px solid var(--hair);padding-top:16px;margin-top:6px">' + optionRows + '</div>' : '');
    return card('Variants', body);
  }

  // 6) SKU list (SkuList.tsx) — only when variants on
  function secSkuList() {
    if (!EDIT.hasVariants) return '';
    const rows = (EDIT.attrValue || []).map((v, i) => {
      const t = variantTitle(v);
      return '<tr data-sku="' + i + '">' +
        '<td><div style="width:40px;height:40px;border:1px dashed var(--ctl);border-radius:6px;overflow:hidden;cursor:pointer;display:grid;place-items:center;background:#fff" data-sku-img="' + i + '">' +
          (v.image ? '<img src="' + v.image + '" style="width:100%;height:100%;object-fit:cover" />' : I.imagePlus) + '</div></td>' +
        '<td style="white-space:nowrap"><span class="flex items-center gap-2"><span style="font-weight:500">' + esc(t) + '</span>' +
          (v.unique ? '<button class="back-btn" data-sku-copy="' + i + '" title="Copy Variant ID" style="width:24px;height:24px">' + I.copy + '</button>' : '') + '</span></td>' +
        '<td><input class="input" style="height:32px;width:150px" value="' + esc(v.bar_code || '') + '" data-skf="bar_code:' + i + '" placeholder="Please enter" /></td>' +
        '<td><div style="position:relative;width:120px"><span style="position:absolute;left:8px;top:8px;color:var(--ink-muted);font-size:12px">$</span><input class="input" style="height:32px;width:120px;padding-left:18px" type="number" min="0" step="0.01" value="' + (v.price == null ? '' : v.price) + '" data-skf="price:' + i + '" placeholder="Price" /></div></td>' +
        '<td><div style="position:relative;width:120px"><span style="position:absolute;left:8px;top:8px;color:var(--ink-muted);font-size:12px">$</span><input class="input" style="height:32px;width:120px;padding-left:18px" type="number" min="0" step="0.01" value="' + (v.ot_price == null ? '' : v.ot_price) + '" data-skf="ot_price:' + i + '" placeholder="Compare at price" /></div></td>' +
        '<td><div style="position:relative;width:120px"><span style="position:absolute;left:8px;top:8px;color:var(--ink-muted);font-size:12px">$</span><input class="input" style="height:32px;width:120px;padding-left:18px" type="number" min="0" step="0.01" value="' + (v.cost == null ? '' : v.cost) + '" data-skf="cost:' + i + '" placeholder="Item cost" /></div></td>' +
        '<td><input class="input" style="height:32px;width:120px" type="number" min="0" value="' + (v.stock == null ? '' : v.stock) + '" data-skf="stock:' + i + '" placeholder="Inventory" /></td>' +
        '<td><div class="flex"><input class="input" style="height:32px;width:80px;border-top-right-radius:0;border-bottom-right-radius:0" type="number" min="0" value="' + (v.weight == null ? '' : v.weight) + '" data-skf="weight:' + i + '" placeholder="Weight" /><span class="muted" style="display:inline-flex;align-items:center;padding:0 8px;border:1px solid var(--ctl);border-left:0;border-radius:0 6px 6px 0;background:var(--panel);font-size:12px">g</span></div></td>' +
        '<td><input class="input" style="height:32px;width:120px" value="' + esc(v.bar_code_number || '') + '" data-skf="bar_code_number:' + i + '" placeholder="Barcode" /></td>' +
        '<td style="text-align:center"><button class="back-btn" style="width:28px;height:28px" data-sku-meta="' + i + ':custom" title="Edit variant metafields"' + (v.unique ? '' : ' disabled') + '>' + I.pencil + '</button></td>' +
        '<td style="text-align:center"><button class="back-btn" style="width:28px;height:28px" data-sku-meta="' + i + ':google" title="Edit variant Google metafields"' + (v.unique ? '' : ' disabled') + '>' + I.pencil + '</button></td>' +
        '<td style="text-align:center"><span class="sw' + (v.is_default_select === 1 ? ' on' : '') + '" data-sku-default="' + i + '"></span></td>' +
        '<td style="text-align:center"><span class="sw sw-lbl' + (v.is_show === 1 ? ' on' : '') + '" data-sku-show="' + i + '" data-on="Show" data-off="Hide"></span></td>' +
      '</tr>';
    }).join('');
    const body =
      '<div style="overflow-x:auto"><table class="tbl" style="min-width:1480px;font-size:13px">' +
        '<thead><tr><th>Image</th><th>Variant</th><th>SKU</th><th>Price</th><th>Compare at price</th><th>Item cost</th><th>Inventory</th><th>Weight</th><th>Barcode</th><th style="text-align:center">Metafields</th><th style="text-align:center">Google Metafields</th><th style="text-align:center">Default</th><th style="text-align:center">Action</th></tr></thead>' +
        '<tbody id="sku-body">' + rows + '</tbody>' +
      '</table></div>';
    return card('SKU list', body);
  }

  // 7) Product specifics (ProductSpecifics.tsx) — name + value, single is the value
  function secSpecifics() {
    const rows = (EDIT.params || []).map((sp, i) =>
      '<div class="flex gap-2 items-start mb-2" data-sp="' + i + '">' +
        '<input class="input" data-sp-name="' + i + '" value="' + esc(sp.name) + '" placeholder="Specific name" style="flex:1" />' +
        '<input class="input" data-sp-val="' + i + '" value="' + esc(sp.single) + '" placeholder="Specific value" style="flex:1" />' +
        (i === 0
          ? '<button class="btn btn-default" data-sp-add style="width:34px;padding:0;justify-content:center">' + I.plus + '</button>'
          : '<button class="btn btn-default" data-sp-del="' + i + '" style="width:34px;padding:0;justify-content:center">' + I.minus + '</button>') +
      '</div>').join('');
    return card('Product specifics', '<div id="sp-list">' + rows + '</div>');
  }

  // ---- Metafields (MetafieldGroup) — typed form: one row per definition, name label + typed control ----
  // ns 'custom' (shop) titled "Product metafields"; 'google' titled "Google Metafields".
  function metafieldControl(def, ns, value) {
    const ck = def.namespace + ':' + def.key;
    const dataAttr = 'data-mf="' + ns + '|' + esc(ck) + '|' + def.type + '"';
    const v = value;
    switch (def.type) {
      case 'boolean':
        return '<span class="sw' + (v === true ? ' on' : '') + '" ' + dataAttr + ' data-mf-bool="1"></span>';
      case 'choice_list': {
        const choices = (def.validation && def.validation.choices) || [];
        const opts = ['<option value="">Select…</option>'].concat(choices.map((c) => '<option value="' + esc(c) + '"' + (String(v) === String(c) ? ' selected' : '') + '>' + esc(c) + '</option>')).join('');
        return '<select class="input" ' + dataAttr + ' style="max-width:320px">' + opts + '</select>';
      }
      case 'multi_line_text':
        return '<textarea class="input" ' + dataAttr + ' rows="3" placeholder="Please enter text" style="height:auto;padding:8px 12px;resize:vertical">' + esc(v || '') + '</textarea>';
      case 'number_integer':
        return '<input class="input" ' + dataAttr + ' type="number" step="1" value="' + (v == null ? '' : esc(v)) + '" placeholder="Please enter" style="max-width:240px" />';
      case 'number_decimal':
      case 'money':
        return '<input class="input" ' + dataAttr + ' type="number" step="0.01" value="' + (v == null ? '' : esc(v)) + '" placeholder="Please enter" style="max-width:240px" />';
      case 'date':
        return '<input class="input" ' + dataAttr + ' type="date" value="' + esc(v || '') + '" style="max-width:240px" />';
      case 'url':
        return '<input class="input" ' + dataAttr + ' type="url" value="' + esc(v || '') + '" placeholder="https://" />';
      default: // single_line_text and fallbacks
        return '<div class="flex items-center gap-2"><input class="input" ' + dataAttr + ' value="' + esc(v || '') + '" placeholder="Please enter text" style="flex:1" />' +
          '<button class="lnk" data-mf-clear="' + ns + '|' + esc(ck) + '" type="button">Clear</button></div>';
    }
  }

  function secMetafields(ns, title, defs) {
    const values = (EDIT.metafields && EDIT.metafields[ns]) || {};
    const body = defs.length
      ? '<div class="space-y-4">' + defs.map((def) => {
          const ck = def.namespace + ':' + def.key;
          const labelHtml = '<span class="flex items-center gap-1" style="font-size:13px;color:var(--ink)">' + esc(def.name) +
            (def.description ? '<span class="muted" title="' + esc(def.description) + '" style="cursor:help;display:inline-flex">' + I.help + '</span>' : '') + '</span>';
          return '<div class="flex items-start gap-4" style="padding:2px 0">' +
            '<div style="width:160px;flex:none;padding-top:7px">' + labelHtml + '</div>' +
            '<div style="flex:1;min-width:0">' + metafieldControl(def, ns, values[ck]) + '</div>' +
          '</div>';
        }).join('') + '</div>'
      : '<div class="muted" style="font-size:13px">No data</div>';
    return card(esc(title), body);
  }

  // Resolve a category value to its full label path (TreeCascadeSelect findNodePath) across CATEGORY_TREE.
  function categoryPath(value, nodes, trail) {
    nodes = nodes || D.CATEGORY_TREE; trail = trail || [];
    for (const n of nodes) {
      const next = trail.concat([n.label]);
      if (n.value === value) return next;
      if (n.children) { const r = categoryPath(value, n.children, next); if (r) return r; }
    }
    return null;
  }
  const categoryLabel = (value) => { const p = value ? categoryPath(value) : null; return p ? p.join(' > ') : ''; };

  // Right rail — Product Settings (settings.tsx). NOTE: Tags & Collections are commented out in real admin.
  function secSettings(isEdit) {
    const s = EDIT.settings || {};
    const catLabel = categoryLabel(s.category);
    const archived = !!s.archived;
    const v = (EDIT.attrValue && EDIT.attrValue[0]) || {};

    let body = '';
    if (archived) {
      body += '<div style="margin-bottom:14px">' +
        '<div class="flex items-center justify-between" style="background:var(--panel);border-radius:8px;padding:6px 10px">' +
          '<span class="flex items-center gap-2" style="font-weight:500;color:var(--ink)">' + I.clock + ' Archived</span>' +
          '<button class="lnk" data-act="unarchive" style="padding:0">Cancel</button></div>' +
        '<div class="muted" style="font-size:12px;margin-top:4px">Once unarchived, product status will be changed as Deactivated, you can still activate it for sale</div></div>';
    } else {
      body += '<div class="flex items-center justify-between mb-3">' + lbl('Activate') +
        '<span class="sw' + (s.activated ? ' on' : '') + '" id="set-activate"></span></div>';
    }
    body += field('set-spu', 'SPU', s.spu, 'Add SPU', 'A standardized product unit with the same attribute value and characteristics');
    if (!EDIT.hasVariants) {
      const w = (v.weight != null && v.weight !== '') ? v.weight : (s.weight == null ? '' : s.weight);
      body += '<div class="mb-3">' + lbl('Weight') + '<div class="flex" style="margin-top:4px"><input class="input" id="set-weight" type="number" min="0" step="0.1" value="' + (w === '' ? '' : w) + '" placeholder="0" style="border-top-right-radius:0;border-bottom-right-radius:0" /><span class="muted" style="display:inline-flex;align-items:center;padding:0 10px;border:1px solid var(--ctl);border-left:0;border-radius:0 8px 8px 0;background:var(--panel);font-size:13px">g</span></div></div>';
    }
    // Category — cascading picker (TreeCascadeSelect): readonly input trigger showing the selected
    // path; clicking opens a drill-in dropdown (top categories -> subcategories).
    body += '<div>' + lbl('Category') +
      '<div class="input cascade-trigger" id="set-category" style="margin-top:4px;cursor:pointer" title="' + esc(catLabel) + '">' +
        '<span class="' + (catLabel ? '' : 'muted') + '" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" id="set-category-label">' + esc(catLabel || 'Choose a category') + '</span>' +
        I.chevDown +
      '</div></div>';
    return card('Product Settings', body, null, true);
  }

  // SEO URL prefix (settings.tsx urlPrefix: VITE_SHOP_URL + /listing/{product_id}/).
  // Live storefront for this shop is minilizm.com (per the SEO card/drawer screenshots).
  const SHOP_URL = 'https://www.minilizm.com';
  const seoBase = () => SHOP_URL + '/listing/' + (EDIT.product_id || '{product_id}') + '/';

  // Right rail — Search engine optimization card (settings.tsx) — opens SEO drawer
  function secSeo() {
    const s = EDIT.settings || {};
    const base = seoBase();
    const body =
      '<div class="muted" style="font-size:12px;word-break:break-all;margin-bottom:6px">' + base + esc(s.urlHandle || '') + '</div>' +
      '<div style="font-size:13.5px;color:var(--brand);word-break:break-word">' + esc(s.metaTitle || EDIT.name || 'Blank Title') + '</div>' +
      '<div class="muted" style="font-size:13px;word-break:break-word;margin-top:2px">' + esc(s.metaDescription || EDIT.description || 'Blank Description') + '</div>';
    const right = '<button class="back-btn" data-act="seo" title="Edit SEO" style="width:30px;height:30px">' + I.edit3 + '</button>';
    return card('Search engine optimization', body, right, true);
  }

  // Right rail — theme template (settings.tsx; only when isEdit)
  function secTemplate() {
    const s = EDIT.settings || {};
    const opts = D.TEMPLATES.map((t) => '<option value="' + t.value + '"' + (t.value === (s.homeTemplate || 'default') ? ' selected' : '') + '>' + esc(t.label) + '</option>').join('');
    const body = '<select class="input" id="set-template">' + opts + '</select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you\'d like the page to look like</div>' +
      ((s.homeTemplate && s.homeTemplate !== 'default') ? '<div class="lnk" style="margin-top:6px" data-act="design">Design</div>' : '');
    return card('Theme template', body, null, true);
  }

  // ---- wire edit interactions ----
  function wireEdit(isEdit) {
    const q = (sel) => root.querySelector(sel);
    const all = (sel) => root.querySelectorAll(sel);

    q('[data-act="back"]').onclick = () => maybeLeave(() => { location.hash = '#/products'; });
    const cid = q('[data-act="copy-id"]'); if (cid) cid.onclick = () => { try { navigator.clipboard.writeText(String(EDIT.product_id)); } catch (e) {} toast('Copied'); };

    // text fields -> state + dirty
    const bind = (sel, fn) => { const el = q(sel); if (el) { el.oninput = () => { fn(el.value); markDirty(); }; } };
    bind('#f-name', (v) => { EDIT.name = v; });
    bindCounted('#f-summary', '#f-summary-cnt', 400, (v) => { EDIT.summary = v; });
    bindCounted('#f-desc', '#f-desc-cnt', 5000, (v) => { EDIT.description = v; });
    wireRichText('f-detail', (html) => { EDIT.detail = html; });

    // highlights (with live count)
    all('[data-hl-input]').forEach((el) => el.oninput = () => {
      const i = Number(el.getAttribute('data-hl-input'));
      EDIT.highlights[i] = el.value;
      const c = q('[data-hl-cnt="' + i + '"]'); if (c) c.textContent = el.value.length + ' / 150';
      markDirty();
    });
    const hladd = q('[data-hl-add]'); if (hladd) hladd.onclick = () => { if (EDIT.highlights.length >= 20) return; EDIT.highlights.push(''); markDirty(); rerenderMain(isEdit); };
    all('[data-hl-del]').forEach((b) => b.onclick = () => { EDIT.highlights.splice(Number(b.getAttribute('data-hl-del')), 1); markDirty(); rerenderMain(isEdit); });

    // images — empty-state buttons
    const iu = q('[data-img-upload]'); if (iu) iu.onclick = () => pickLocalFiles((added) => { added.forEach((f) => EDIT.images.push({ uid: f.uid, name: f.name, url: f.url })); markDirty(); rerenderMain(isEdit); });
    const is = q('[data-img-select]'); if (is) is.onclick = () => openSelectFileModal(isEdit);
    // images — grid: add tile, delete, expand/collapse, drag reorder
    const at = q('[data-img-add-tile]'); if (at) at.onclick = () => openSelectFileModal(isEdit);
    all('[data-img-del]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); const i = Number(b.getAttribute('data-img-del')); EDIT.images.splice(i, 1); markDirty(); rerenderMain(isEdit); });
    const ex = q('[data-img-expand]'); if (ex) ex.onclick = () => { imgGridExpanded = true; rerenderMain(isEdit); };
    const co = q('[data-img-collapse]'); if (co) co.onclick = () => { imgGridExpanded = false; rerenderMain(isEdit); };
    wireImageDrag(isEdit);

    // pricing / inventory (single)
    bindNum('#p-price', (v) => { EDIT.price = v; });
    bindNum('#p-compare', (v) => { EDIT.compareAtPrice = v; });
    bindNum('#p-cost', (v) => { EDIT.itemCost = v; });
    bind('#i-sku', (v) => { EDIT.sku = v; });
    bind('#i-barcode', (v) => { EDIT.barcode = v; });
    bindNum('#i-stock', (v) => { EDIT.inventoryQuantity = v; });

    // variants toggle (confirm dialog like Variants.tsx)
    const hv = q('#has-variants'); if (hv) hv.onchange = () => {
      modal({
        title: 'Tip', width: 460, okText: 'OK', icon: 'warn', hideX: true,
        body: '<div class="muted" style="font-size:13.5px;line-height:1.6">' + (isEdit
          ? 'The product Variant ID will be changed. This may impact ad performance, marketing and inventory data management.'
          : "Make sure you've filled in all product variant information. Any change you make here may affect your ad performance, marketing, and inventory.") + '</div>',
        onOk: (m, close) => {
          EDIT.hasVariants = hv.checked; EDIT.spec_type = hv.checked ? 1 : 0;
          if (hv.checked && (!EDIT.attr || EDIT.attr.length === 0)) EDIT.attr = [{ value: '', detail: [] }];
          markDirty(); close(); rerenderMain(isEdit);
        },
        onCancel: () => { hv.checked = EDIT.hasVariants; },
      });
    };
    const vorder = q('[data-act="variant-order"]'); if (vorder) vorder.onclick = () => openVariantOrderModal(isEdit);
    const optadd = q('[data-act="opt-add"]'); if (optadd) optadd.onclick = () => { EDIT.attr.push({ value: '', detail: [] }); markDirty(); rerenderMain(isEdit); };
    all('[data-opt-name]').forEach((el) => el.oninput = () => { EDIT.attr[Number(el.getAttribute('data-opt-name'))].value = el.value; markDirty(); });
    all('[data-opt-del]').forEach((b) => b.onclick = () => {
      const i = Number(b.getAttribute('data-opt-del'));
      modal({ title: '', width: 440, okText: 'Delete', danger: true,
        body: '<div class="flex items-start gap-2"><span style="color:var(--err);display:inline-flex">' + I.alert + '</span><span style="font-size:13.5px;line-height:1.6">After it is deleted, the corresponding product will be deleted together and cannot be restored.</span></div>',
        onOk: (m, close) => { EDIT.attr.splice(i, 1); rebuildSkusFromOptions(); markDirty(); close(); rerenderMain(isEdit); } });
    });
    all('[data-opt-edit]').forEach((b) => b.onclick = () => openEditAttrModal(Number(b.getAttribute('data-opt-edit')), isEdit));
    all('[data-opt-val]').forEach((el) => el.onkeydown = (e) => {
      if (e.key === 'Enter' && el.value.trim()) {
        const i = Number(el.getAttribute('data-opt-val')); const val = el.value.trim();
        const det = EDIT.attr[i].detail || (EDIT.attr[i].detail = []);
        if (!det.some((d) => d.value === val)) { det.push({ pic: '', value: val }); rebuildSkusFromOptions(); markDirty(); rerenderMain(isEdit); }
      }
    });
    all('[data-vval]').forEach((x) => x.onclick = () => { const [i, vi] = x.getAttribute('data-vval').split(':').map(Number); EDIT.attr[i].detail.splice(vi, 1); rebuildSkusFromOptions(); markDirty(); rerenderMain(isEdit); });

    // SKU table inputs
    all('[data-skf]').forEach((el) => el.oninput = () => {
      const [f, i] = el.getAttribute('data-skf').split(':'); const idx = Number(i);
      const numFields = ['stock', 'weight']; // price/ot_price/cost kept as strings (SkuList stores String)
      EDIT.attrValue[idx][f] = numFields.includes(f) ? (el.value === '' ? undefined : Number(el.value)) : el.value;
      markDirty();
    });
    all('[data-sku-default]').forEach((sw) => sw.onclick = () => { const i = Number(sw.getAttribute('data-sku-default')); EDIT.attrValue.forEach((v, j) => v.is_default_select = j === i ? 1 : 0); markDirty(); rerenderMain(isEdit); });
    all('[data-sku-show]').forEach((sw) => sw.onclick = () => { const i = Number(sw.getAttribute('data-sku-show')); EDIT.attrValue[i].is_show = EDIT.attrValue[i].is_show === 1 ? 0 : 1; markDirty(); rerenderMain(isEdit); });
    all('[data-sku-img]').forEach((b) => b.onclick = () => { const i = Number(b.getAttribute('data-sku-img')); openSkuImageModal(i, isEdit); });
    all('[data-sku-copy]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); const i = Number(b.getAttribute('data-sku-copy')); try { navigator.clipboard.writeText(String(EDIT.attrValue[i].unique || '')); } catch (er) {} toast('Copied'); });
    all('[data-sku-meta]').forEach((b) => b.onclick = () => { if (b.disabled) return; const [i, ns] = b.getAttribute('data-sku-meta').split(':'); openVariantMetafieldModal(EDIT.attrValue[Number(i)], ns); });

    // specifics
    all('[data-sp-name]').forEach((el) => el.oninput = () => { EDIT.params[Number(el.getAttribute('data-sp-name'))].name = el.value; markDirty(); });
    all('[data-sp-val]').forEach((el) => el.oninput = () => { EDIT.params[Number(el.getAttribute('data-sp-val'))].single = el.value; markDirty(); });
    const spadd = q('[data-sp-add]'); if (spadd) spadd.onclick = () => { EDIT.params.push({ name: '', values: [], sort: EDIT.params.length, single: '' }); markDirty(); rerenderMain(isEdit); };
    all('[data-sp-del]').forEach((b) => b.onclick = () => { EDIT.params.splice(Number(b.getAttribute('data-sp-del')), 1); markDirty(); rerenderMain(isEdit); });

    // metafields (typed controls)
    all('[data-mf]').forEach((el) => {
      const [ns, ck] = el.getAttribute('data-mf').split('|');
      if (el.getAttribute('data-mf-bool') === '1') {
        el.onclick = () => { EDIT.metafields[ns] = EDIT.metafields[ns] || {}; EDIT.metafields[ns][ck] = !EDIT.metafields[ns][ck]; el.classList.toggle('on'); markDirty(); };
      } else {
        el.oninput = () => { EDIT.metafields[ns] = EDIT.metafields[ns] || {}; EDIT.metafields[ns][ck] = el.value; markDirty(); };
        el.onchange = el.oninput;
      }
    });
    all('[data-mf-clear]').forEach((b) => b.onclick = () => { const [ns, ck] = b.getAttribute('data-mf-clear').split('|'); EDIT.metafields[ns] = EDIT.metafields[ns] || {}; EDIT.metafields[ns][ck] = ''; const inp = b.parentElement.querySelector('input'); if (inp) inp.value = ''; markDirty(); });

    // settings rail
    const sa = q('#set-activate'); if (sa) sa.onclick = () => { EDIT.settings.activated = !EDIT.settings.activated; EDIT.settings.status = EDIT.settings.activated ? 'activated' : 'deactivated'; markDirty(); rerenderMain(isEdit); };
    bind('#set-spu', (v) => { EDIT.settings.spu = v; });
    bindNum('#set-weight', (v) => { EDIT.settings.weight = v == null ? 0 : v; if (EDIT.attrValue && EDIT.attrValue[0]) EDIT.attrValue[0].weight = v; });
    const sc = q('#set-category'); if (sc) sc.onclick = () => openCategoryCascade(sc, (node) => { EDIT.settings.category = node.value; markDirty(); rerenderSide(isEdit); });
    const st = q('#set-template'); if (st) st.onchange = () => { EDIT.settings.homeTemplate = st.value; markDirty(); rerenderSide(isEdit); };
    const seo = q('[data-act="seo"]'); if (seo) seo.onclick = () => openSeoDrawer(isEdit);
    const design = q('[data-act="design"]'); if (design) design.onclick = () => toast('Visual template designer opens full-screen (roadmap)');

    // footer + bar actions. Save commits the current state as the new origin (edit.tsx reloads
    // the product detail after saving, which makes hasUnsavedChanges false again).
    const doSave = () => { ORIGIN = snapshot(); DIRTY = false; syncUnsavedBar(); toast(isEdit ? 'Product updated' : 'Product added'); };
    const sb = q('[data-act="save"]'); if (sb) sb.onclick = doSave;
    const sbar = q('[data-act="save-bar"]'); if (sbar) sbar.onclick = doSave;
    const disc = q('[data-act="discard"]'); if (disc) disc.onclick = () => modal({
      title: 'Are you sure you want to discard changes?', width: 460, okText: 'Discard', danger: true,
      body: '<div class="muted" style="font-size:13.5px">All unsaved changes will be lost</div>',
      onOk: (m, close) => { close(); if (isEdit) renderEdit(EDIT_ID); else location.hash = '#/products'; },
    });
    const arc = q('[data-act="archive-one"]'); if (arc) arc.onclick = () => modal({
      title: 'Archive the product', width: 460, okText: 'Confirm',
      body: '<div class="muted" style="font-size:13.5px;line-height:1.6">Archiving this product will hide it from your sales channels. You can use the status filter in the product list to find it.</div>',
      onOk: (m, close) => { EDIT.settings.archived = true; EDIT.settings.activated = false; EDIT.settings.status = 'deactivated'; close(); toast('Product archived successfully'); renderEdit(EDIT_ID); },
    });
    const un = q('[data-act="unarchive"]'); if (un) un.onclick = () => { EDIT.settings.archived = false; EDIT.settings.status = 'deactivated'; toast('Product set as unarchived successfully'); renderEdit(EDIT_ID); };
    const de = q('[data-act="destroy"]'); if (de) de.onclick = () => modal({
      title: 'Delete the product', width: 460, okText: 'Delete', danger: true,
      body: '<div class="muted" style="font-size:13.5px;line-height:1.6">This permanently deletes the product and cannot be undone.</div>',
      onOk: (m, close) => { close(); toast('Product deleted successfully'); location.hash = '#/products'; },
    });
  }

  // RichTextEditor wiring (editor.tsx) — contenteditable + execCommand-driven toolbar mock.
  function wireRichText(id, fn) {
    const ed = root.querySelector('#' + id);
    if (!ed) return;
    const sync = () => { fn(ed.innerHTML); markDirty(); };
    ed.addEventListener('input', sync);
    const exec = (cmd, val) => { ed.focus(); try { document.execCommand(cmd, false, val); } catch (e) {} sync(); };
    const toolbar = ed.parentElement.querySelector('.rt-toolbar');
    if (!toolbar) return;
    toolbar.querySelectorAll('[data-rt]').forEach((btn) => {
      const cmd = btn.getAttribute('data-rt');
      if (btn.tagName === 'SELECT') {
        btn.onchange = () => {
          const v = btn.value;
          if (cmd === 'block') exec('formatBlock', v ? '<' + v + '>' : '<P>');
          else if (cmd === 'font') { if (v) exec('fontName', v); }
          else if (cmd === 'size') { if (v) exec('fontSize', v); }
          btn.selectedIndex = 0;
        };
        return;
      }
      btn.onmousedown = (e) => e.preventDefault(); // keep selection while clicking the button
      btn.onclick = () => {
        switch (cmd) {
          case 'undo': case 'redo':
          case 'bold': case 'italic': case 'underline': case 'strikeThrough':
            exec(cmd); break;
          case 'forecolor': exec('foreColor', '#0066e6'); break;
          case 'backcolor': exec('hiliteColor', '#fff3bf'); break;
          case 'align': exec('justifyLeft'); break;
          case 'bullist': exec('insertUnorderedList'); break;
          case 'numlist': exec('insertOrderedList'); break;
          case 'link': { const u = prompt('Link URL', 'https://'); if (u) exec('createLink', u); break; }
          case 'image': { const u = prompt('Image URL', 'https://'); if (u) exec('insertImage', u); break; }
          case 'video': { const u = prompt('Video URL (mp4)', 'https://'); if (u) exec('insertHTML', '<video controls src="' + u.replace(/"/g, '&quot;') + '" style="max-width:100%"></video>'); break; }
          case 'table': exec('insertHTML', '<table><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table>'); break;
        }
      };
    });
  }

  // counted textarea binder (updates the counter)
  function bindCounted(sel, cntSel, max, fn) {
    const el = root.querySelector(sel); if (!el) return;
    el.oninput = () => { fn(el.value); const c = root.querySelector(cntSel); if (c) c.textContent = el.value.length + ' / ' + max; markDirty(); };
  }
  // numeric binder -> undefined when blank
  function bindNum(sel, fn) {
    const el = root.querySelector(sel); if (!el) return;
    el.oninput = () => { fn(el.value === '' ? undefined : Number(el.value)); markDirty(); };
  }

  // open the OS file picker (or accept a drop); read images/videos via FileReader as real media
  function readFiles(fileList, onDone) {
    const files = Array.from(fileList || []);
    if (!files.length) { onDone([]); return; }
    let pending = files.length; const added = [];
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const ext = (f.name.split('.').pop() || '').toUpperCase();
          added.push({ uid: 'u' + Date.now() + Math.round(Math.random() * 1e6), name: f.name, url: reader.result, kind: (f.type || '').indexOf('video') === 0 ? 'video' : 'image', ext: ext });
        }
        if (--pending === 0) onDone(added);
      };
      reader.readAsDataURL(f);
    });
  }
  function pickLocalFiles(onPick) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*,video/*'; inp.multiple = true; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.onchange = () => readFiles(inp.files, (added) => { document.body.removeChild(inp); if (added.length) onPick(added); });
    inp.click();
  }

  // image drag-reorder (AddImageVideo handleDragStart/Over/Drop)
  let imgDragIndex = null;
  function wireImageDrag(isEdit) {
    root.querySelectorAll('.img-tile[draggable="true"]').forEach((tile) => {
      tile.addEventListener('dragstart', () => { imgDragIndex = Number(tile.getAttribute('data-img')); });
      tile.addEventListener('dragover', (e) => { e.preventDefault(); });
      tile.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = Number(tile.getAttribute('data-img'));
        if (imgDragIndex === null || imgDragIndex === target) return;
        const arr = EDIT.images; const moved = arr.splice(imgDragIndex, 1)[0];
        arr.splice(target, 0, moved);
        imgDragIndex = null; markDirty(); rerenderMain(isEdit);
      });
      tile.addEventListener('dragend', () => { imgDragIndex = null; });
    });
  }

  function rerenderMain(isEdit) {
    document.getElementById('edit-main').innerHTML = mainHtml(isEdit);
    document.getElementById('edit-side').innerHTML = sideHtml(isEdit);
    wireEdit(isEdit);
    syncUnsavedBar();
  }
  function rerenderSide(isEdit) {
    document.getElementById('edit-side').innerHTML = sideHtml(isEdit);
    wireEdit(isEdit);
    syncUnsavedBar();
  }

  // regenerate SKU rows from option combinations (SkuList.tsx generateCombinations + buildVariantDetail)
  function rebuildSkusFromOptions() {
    const valid = (EDIT.attr || []).filter((o) => o.detail && o.detail.length > 0).map((o) => ({ name: o.value || '', values: o.detail.map((d) => d.value) }));
    if (!valid.length) { EDIT.attrValue = []; return; }
    const combos = [];
    const helper = (cur, idx) => {
      if (idx === valid.length) { combos.push(cur.slice()); return; }
      valid[idx].values.forEach((v) => helper(cur.concat([v]), idx + 1));
    };
    helper([], 0);
    const prev = EDIT.attrValue || [];
    const buildDetail = (options) => { const d = {}; valid.forEach((o, idx) => { d[o.name || ('Option ' + (idx + 1))] = options[idx] || ''; }); return d; };
    EDIT.attrValue = combos.map((options, i) => {
      const title = options.join(' • ');
      const ex = prev.find((p) => variantTitle(p) === title);
      return ex || { unique: 'V-new-' + i + '-' + Date.now(), detail: buildDetail(options), image: '', bar_code: '', price: EDIT.price != null ? String(EDIT.price) : '', ot_price: EDIT.compareAtPrice != null ? String(EDIT.compareAtPrice) : '', cost: EDIT.itemCost != null ? String(EDIT.itemCost) : '', stock: undefined, weight: '', bar_code_number: '', is_show: 1, is_default_select: i === 0 ? 1 : 0 };
    });
    if (!EDIT.attrValue.some((v) => v.is_default_select === 1) && EDIT.attrValue[0]) EDIT.attrValue[0].is_default_select = 1;
  }

  // ================= MODALS / DRAWERS =================
  function modal({ title, body, width, okText, onOk, onCancel, danger, icon, hideX }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    const iconHtml = icon === 'warn' ? '<span class="modal-warn">' + svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', 18) + '</span>' : '';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span class="flex items-center gap-2">' + iconHtml + (title || '') + '</span>' +
        (hideX ? '' : '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span>') + '</div>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn ' + (danger ? 'btn-default danger-btn' : 'btn-primary') + '" data-ok>' + (okText || 'Save') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    const cancel = () => { close(); if (onCancel) onCancel(); };
    const xEl = m.querySelector('[data-x]'); if (xEl) xEl.onclick = cancel;
    m.querySelector('[data-cancel]').onclick = cancel;
    backdrop.onclick = (e) => { if (e.target === backdrop) cancel(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    return { m, close };
  }

  // Media library (mixed file types) backing the SelectFile modal — mirrors the real admin's asset list
  function buildMediaLibrary() {
    const imgs = D.PRODUCTS.map((p) => p.image);
    const NAMES = ['product-main', 'front-view', 'back-view', 'detail-shot', 'size-chart', 'fabric-closeup', 'model-pose', 'flat-lay', 'packaging', 'lifestyle', 'swatch-card', 'hangtag'];
    const IMG_EXT = ['WEBP', 'JPG', 'PNG', 'WEBP', 'WEBP', 'PNG', 'WEBP', 'JPG'];
    const out = [];
    for (let i = 0; i < 26; i++) {
      out.push({ id: 'f' + i, name: NAMES[i % NAMES.length] + (i >= NAMES.length ? '-' + (Math.floor(i / NAMES.length) + 1) : ''), ext: IMG_EXT[i % IMG_EXT.length], kind: 'image', url: imgs[i % imgs.length] });
    }
    // sprinkle videos + a raw asset bundle so the type filter has something to do
    out.splice(3, 0, { id: 'v1', name: 'product-demo', ext: 'WEBM', kind: 'video', url: imgs[2] });
    out.splice(8, 0, { id: 'v2', name: 'unboxing-clip', ext: 'MP4', kind: 'video', url: imgs[6 % imgs.length] });
    out.splice(13, 0, { id: 'z1', name: 'brand-assets', ext: 'ZIP', kind: 'raw' });
    return out;
  }

  // SelectFile modal — media library picker (search + type + sort + drop zone + grid + pager), mirrors real admin
  function openSelectFileModal(isEdit) {
    const FILES = buildMediaLibrary();
    const PAGE = 18;
    const st = { q: '', type: 'all', sort: 'new', page: 1, sel: {} };
    const SRCH = svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 15);
    const CHK = svg('<path d="M20 6 9 17l-5-5"/>', 12);
    const PLAY = svg('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>', 22);

    const ctrl = modal({
      title: 'Select file', width: 860, okText: 'Done',
      body:
        '<div class="sf-toolbar">' +
          '<div class="sf-search"><span class="ic">' + SRCH + '</span><input id="sf-q" placeholder="Search by file name" /></div>' +
          '<select class="filter-select" id="sf-type" style="width:130px">' +
            '<option value="all">All</option><option value="image">Images</option><option value="video">Videos</option><option value="raw">Other</option>' +
          '</select>' +
          '<select class="filter-select" id="sf-sort" style="width:210px">' +
            '<option value="new">Date added (newest first)</option><option value="old">Date added (oldest first)</option><option value="name">File name (A–Z)</option>' +
          '</select>' +
        '</div>' +
        '<div class="sf-drop"><div>Drag and drop images, videos</div><button class="btn btn-default" id="sf-upload">Upload new</button></div>' +
        '<div class="sf-grid" id="sf-grid"></div>' +
        '<div class="sf-pager" id="sf-pager"></div>',
      onOk: (m, close) => {
        const picked = FILES.filter((f) => st.sel[f.id] && f.kind !== 'raw');
        if (picked.length) { picked.forEach((f) => EDIT.images.push({ uid: 'm' + Date.now() + Math.random(), name: f.name + '.' + f.ext.toLowerCase(), url: f.url })); markDirty(); }
        close(); rerenderMain(isEdit);
      },
    });
    const m = ctrl.m;
    const grid = m.querySelector('#sf-grid');
    const pager = m.querySelector('#sf-pager');

    function view() {
      let list = FILES.slice();
      const q = st.q.trim().toLowerCase();
      if (q) list = list.filter((f) => (f.name + '.' + f.ext).toLowerCase().indexOf(q) >= 0);
      if (st.type !== 'all') list = list.filter((f) => f.kind === st.type);
      if (st.sort === 'old') list.reverse();
      else if (st.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
      return list;
    }
    function tile(f) {
      const inner = f.kind === 'raw'
        ? '<span class="sf-raw">' + esc(f.ext) + '</span>'
        : '<img src="' + f.url + '" />' + (f.kind === 'video' ? '<span class="sf-play">' + PLAY + '</span>' : '');
      return '<div class="sf-tile' + (st.sel[f.id] ? ' sel' : '') + '" data-id="' + f.id + '">' +
        '<div class="sf-thumb">' + inner + '<span class="sf-check">' + CHK + '</span></div>' +
        '<div class="sf-name" title="' + esc(f.name + '.' + f.ext.toLowerCase()) + '">' + esc(f.name) + '</div>' +
        '<div class="sf-type">' + esc(f.ext) + '</div>' +
      '</div>';
    }
    function pagerHtml(page, pages) {
      if (pages <= 1) return '';
      const it = (lbl, p, d, a) => '<span class="pg-item' + (a ? ' active' : '') + (d ? ' disabled' : '') + '"' + (d ? '' : ' data-p="' + p + '"') + '>' + lbl + '</span>';
      let s = it('‹', page - 1, page <= 1);
      for (let p = 1; p <= pages; p++) s += it(String(p), p, false, p === page);
      s += it('›', page + 1, page >= pages);
      return '<div class="pg">' + s + '</div>';
    }
    function render() {
      const list = view();
      const pages = Math.max(1, Math.ceil(list.length / PAGE));
      if (st.page > pages) st.page = pages;
      const items = list.slice((st.page - 1) * PAGE, st.page * PAGE);
      grid.innerHTML = items.length ? items.map(tile).join('') : '<div class="muted" style="grid-column:1/-1;text-align:center;padding:48px 0">No files found.</div>';
      pager.innerHTML = pagerHtml(st.page, pages);
      grid.querySelectorAll('.sf-tile').forEach((t) => t.onclick = () => { const id = t.getAttribute('data-id'); st.sel[id] = !st.sel[id]; t.classList.toggle('sel', st.sel[id]); });
      pager.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { st.page = Number(b.getAttribute('data-p')); render(); });
    }
    render();
    m.querySelector('#sf-q').oninput = (e) => { st.q = e.target.value; st.page = 1; render(); };
    m.querySelector('#sf-type').onchange = (e) => { st.type = e.target.value; st.page = 1; render(); };
    m.querySelector('#sf-sort').onchange = (e) => { st.sort = e.target.value; st.page = 1; render(); };
    // Upload new / drag-drop: read real files, add to the library grid, auto-select them
    function ingest(added) {
      added.forEach((f) => { FILES.unshift({ id: f.uid, name: f.name.replace(/\.[^.]+$/, ''), ext: f.ext || 'IMG', kind: f.kind, url: f.url }); st.sel[f.uid] = true; });
      st.page = 1; render();
    }
    m.querySelector('#sf-upload').onclick = () => pickLocalFiles(ingest);
    const drop = m.querySelector('.sf-drop');
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('drag'); readFiles(e.dataTransfer.files, ingest); });
  }

  // SKU-row image picker (SelectFile, single)
  function openSkuImageModal(idx, isEdit) {
    const lib = D.PRODUCTS.slice(0, 8).map((p) => ({ name: p.store_name, url: p.image }));
    let chosen = null;
    const grid = lib.map((f, i) =>
      '<div data-lib="' + i + '" style="position:relative;border:2px solid var(--hair);border-radius:8px;overflow:hidden;cursor:pointer;aspect-ratio:1"><img src="' + f.url + '" style="width:100%;height:100%;object-fit:cover" /></div>').join('');
    const ctrl = modal({
      title: 'Select file', width: 640, okText: 'Confirm',
      body: '<div class="muted" style="font-size:13px;margin-bottom:10px">Pick a variant image.</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' + grid + '</div>',
      onOk: (m, close) => { if (chosen != null) { EDIT.attrValue[idx].image = lib[chosen].url; markDirty(); } close(); rerenderMain(isEdit); },
    });
    ctrl.m.querySelectorAll('[data-lib]').forEach((c) => c.onclick = () => {
      chosen = Number(c.getAttribute('data-lib'));
      ctrl.m.querySelectorAll('[data-lib]').forEach((x) => x.style.borderColor = 'var(--hair)');
      c.style.borderColor = 'var(--brand)';
    });
  }

  // Variant display-order modal (VariantOrderModal) — drag handle look; reorder option values via up/down
  function openVariantOrderModal(isEdit) {
    const work = JSON.parse(JSON.stringify(EDIT.attr || []));
    const render = (m) => {
      m.querySelector('#vo-body').innerHTML = work.map((opt, oi) =>
        '<div class="flex items-start gap-4" style="margin-bottom:16px">' +
          '<div style="min-width:120px;display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--hair);border-radius:8px;background:var(--panel)"><span class="muted">' + I.grip + '</span><span style="font-size:13px;font-weight:500">' + esc(opt.value || ('Option ' + (oi + 1))) + '</span></div>' +
          '<div style="flex:1;display:flex;flex-wrap:wrap;gap:8px">' +
            (opt.detail || []).map((d, vi) =>
              '<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--hair);border-radius:8px;background:#fff">' +
                '<span class="muted">' + I.grip + '</span><span style="font-size:13px">' + esc(d.value) + '</span>' +
                '<button class="back-btn" style="width:22px;height:22px" data-vo-up="' + oi + ':' + vi + '"' + (vi === 0 ? ' disabled' : '') + '>↑</button>' +
                '<button class="back-btn" style="width:22px;height:22px" data-vo-down="' + oi + ':' + vi + '"' + (vi === opt.detail.length - 1 ? ' disabled' : '') + '>↓</button>' +
              '</div>').join('') +
          '</div>' +
        '</div>').join('');
      m.querySelectorAll('[data-vo-up]').forEach((b) => b.onclick = () => { const [oi, vi] = b.getAttribute('data-vo-up').split(':').map(Number); const arr = work[oi].detail; [arr[vi - 1], arr[vi]] = [arr[vi], arr[vi - 1]]; render(m); });
      m.querySelectorAll('[data-vo-down]').forEach((b) => b.onclick = () => { const [oi, vi] = b.getAttribute('data-vo-down').split(':').map(Number); const arr = work[oi].detail; [arr[vi + 1], arr[vi]] = [arr[vi], arr[vi + 1]]; render(m); });
    };
    const ctrl = modal({
      title: 'Variant display order', width: 600, okText: 'Save',
      body: '<div id="vo-body"></div>',
      onOk: (m, close) => { EDIT.attr = work; rebuildSkusFromOptions(); markDirty(); close(); rerenderMain(isEdit); toast('Variant order saved'); },
    });
    render(ctrl.m);
  }

  // Edit variations modal (editAttr.tsx) — Name + Image table per value
  function openEditAttrModal(oi, isEdit) {
    const opt = JSON.parse(JSON.stringify(EDIT.attr[oi] || { value: '', detail: [] }));
    const render = (m) => {
      m.querySelector('#ea-rows').innerHTML = (opt.detail || []).map((d, vi) =>
        '<tr>' +
          '<td style="width:50%"><input class="input" data-ea-val="' + vi + '" value="' + esc(d.value) + '" placeholder="Enter variation name" /></td>' +
          '<td style="width:50%"><div class="flex items-center gap-2">' +
            (d.pic
              ? '<div style="width:80px;height:80px;border:1px solid var(--ctl);border-radius:6px;overflow:hidden"><img src="' + d.pic + '" style="width:100%;height:100%;object-fit:cover" /></div><button class="lnk" data-ea-pic="' + vi + '">Change</button>'
              : '<div data-ea-pic="' + vi + '" style="width:80px;height:80px;border:2px dashed var(--ctl);border-radius:6px;display:grid;place-items:center;cursor:pointer;color:var(--ink-muted);font-size:22px">+</div>') +
          '</div></td>' +
        '</tr>').join('');
      m.querySelectorAll('[data-ea-val]').forEach((el) => el.oninput = () => { opt.detail[Number(el.getAttribute('data-ea-val'))].value = el.value; });
      m.querySelectorAll('[data-ea-pic]').forEach((b) => b.onclick = () => { const vi = Number(b.getAttribute('data-ea-pic')); opt.detail[vi].pic = D.PRODUCTS[(vi + 1) % D.PRODUCTS.length].image; render(m); });
    };
    const ctrl = modal({
      title: '<span style="font-weight:700;font-size:16px">Edit Variations</span>', width: 800, okText: 'Save',
      body: '<div class="mb-4"><p style="color:var(--ink-body);margin-bottom:6px;font-size:13.5px">Customers can view the uploaded image when choosing different variations.</p>' +
        '<p class="muted" style="font-size:13px">Support images in .jpg, .png, and .gif formats. Maximum file size is 4 MB. Recommended file size: 96px * 96px</p></div>' +
        '<table class="tbl" style="font-size:13px"><thead><tr><th>Name</th><th>Image</th></tr></thead><tbody id="ea-rows"></tbody></table>',
      onOk: (m, close) => { opt.value = EDIT.attr[oi].value; EDIT.attr[oi] = opt; rebuildSkusFromOptions(); markDirty(); close(); rerenderMain(isEdit); },
    });
    render(ctrl.m);
  }

  // Variant metafields modal (MetafieldEditor in AntModal) — typed form per variant definitions
  function openVariantMetafieldModal(variant, ns) {
    const title = ns === 'google' ? 'Google Metafields' : 'Variant Metafields';
    const defs = ns === 'google' ? D.GOOGLE_VARIANT_DEFS : D.SHOP_VARIANT_DEFS;
    const seed = {}; // start blank; seed a GTIN sample for google
    if (ns === 'google') seed['google:gtin'] = variant.bar_code_number || '';
    const rowsHtml = defs.map((def) => {
      const ck = def.namespace + ':' + def.key;
      const labelHtml = '<span class="flex items-center gap-1" style="font-size:13px;color:var(--ink)">' + esc(def.name) +
        (def.description ? '<span class="muted" title="' + esc(def.description) + '" style="cursor:help;display:inline-flex">' + I.help + '</span>' : '') + '</span>';
      return '<div class="flex items-start gap-4" style="padding:2px 0">' +
        '<div style="width:140px;flex:none;padding-top:7px">' + labelHtml + '</div>' +
        '<div style="flex:1;min-width:0">' + metafieldControl(def, ns, seed[ck]) + '</div>' +
      '</div>';
    }).join('');
    const body =
      '<div class="muted" style="font-size:13px;margin-bottom:12px">Variant: <span style="font-weight:500;color:var(--ink)">' + esc(variantTitle(variant)) + '</span></div>' +
      '<div class="space-y-4">' + rowsHtml + '</div>';
    modal({ title, width: 1000, okText: 'OK', body, onOk: (m, close) => { close(); toast('Variant metafields saved'); } });
  }

  // Category cascade popover (TreeCascadeSelect) — drill into top categories -> subcategories.
  // Parent rows show a child count + ">"; leaf rows select the value and close.
  function openCategoryCascade(anchor, onPick) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="cascade-pop" style="position:fixed"></div>');
    layer.appendChild(pop); document.body.appendChild(layer);
    let path = []; // stack of parent nodes drilled into

    const currentNodes = () => path.length ? (path[path.length - 1].children || []) : D.CATEGORY_TREE;
    const render = () => {
      const head = path.length
        ? '<div class="cascade-head" data-back>' + I.arrowLeft + '<span>' + esc(path[path.length - 1].label) + '</span></div>'
        : '';
      const rows = currentNodes().map((n, i) => {
        const kids = n.children && n.children.length;
        const arrow = kids ? '<span class="cascade-arrow" data-into="' + i + '">' + n.children.length + ' ' + I.chevRight + '</span>' : '';
        return '<div class="cascade-item" data-pick="' + i + '"><span class="item-label">' + esc(n.label) + '</span>' + arrow + '</div>';
      }).join('');
      pop.innerHTML = head + '<div>' + rows + '</div>';
      const back = pop.querySelector('[data-back]'); if (back) back.onclick = () => { path.pop(); render(); };
      pop.querySelectorAll('[data-into]').forEach((a) => a.onclick = (e) => {
        e.stopPropagation(); path.push(currentNodes()[Number(a.getAttribute('data-into'))]); render();
      });
      pop.querySelectorAll('[data-pick]').forEach((row) => row.onclick = () => {
        const node = currentNodes()[Number(row.getAttribute('data-pick'))];
        if (node.children && node.children.length) { path.push(node); render(); return; } // drill on parent body click
        closePops(); onPick(node); // leaf selected — caller decides what to do with it
      });
    };
    render();
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, r.right - pop.offsetWidth) + 'px';
    pop.style.minWidth = Math.max(260, r.width) + 'px';
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  // SEO drawer (settings.tsx SEO Drawer) — right slide-in, Confirm footer
  function openSeoDrawer(isEdit) {
    const s = EDIT.settings || {};
    const base = seoBase();
    const form = { metaTitle: s.metaTitle || EDIT.name || '', metaDescription: s.metaDescription || EDIT.description || '', urlHandle: s.urlHandle || '', seoKeywords: (s.seoKeywords || []).slice() };
    const backdrop = h('<div class="drawer-backdrop"></div>');
    const drawer = h('<div class="drawer" style="width:480px"></div>');
    const kwChip = (k, i) => '<span style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;border:1px solid #dbeafe;color:#2563eb;padding:2px 8px;border-radius:6px;font-size:13px">' + esc(k) + ' <span class="x" data-kw-del="' + i + '" style="cursor:pointer;font-weight:700;display:inline-flex">' + I.x + '</span></span>';
    const kwHtml = () => form.seoKeywords.map(kwChip).join('');
    const preview = () =>
      '<div class="muted" style="font-size:12px;word-break:break-all">' + base + esc(form.urlHandle || '') + '</div>' +
      '<div style="font-size:13.5px;color:var(--brand);word-break:break-word;margin-top:2px">' + esc(form.metaTitle || '') + '</div>' +
      '<div class="muted" style="font-size:13px;word-break:break-word;margin-top:2px">' + esc(form.metaDescription || '') + '</div>';
    const helpIco = (t) => '<span class="muted" title="' + esc(t) + '" style="cursor:help;display:inline-flex">' + I.help + '</span>';
    drawer.innerHTML =
      '<div class="drawer-head"><span>Search engine optimization</span><span class="drawer-x" data-x>' + I.x + '</span></div>' +
      '<div class="drawer-body">' +
        '<div class="mb-4"><div class="card-title mb-2">Preview</div><div id="seo-preview">' + preview() + '</div></div>' +
        '<div class="divider mb-4"></div>' +
        '<div class="mb-4"><div class="flex items-center justify-between mb-1"><span class="flex items-center gap-1" style="font-size:13px;font-weight:500">Page title ' + helpIco('Page titles make it easier for customers to quickly find content. We recommend using simple and intuitive words.') + '</span><span class="muted" id="seo-title-cnt" style="font-size:11px">' + form.metaTitle.length + ' / 50</span></div>' +
          '<input class="input" id="seo-title" maxlength="50" value="' + esc(form.metaTitle) + '" placeholder="Product Title" /></div>' +
        '<div class="mb-4"><div class="flex items-center justify-between mb-1"><span class="flex items-center gap-1" style="font-size:13px;font-weight:500">Meta description ' + helpIco('Try to describe the product features or page contents to attract visitors. Too many keywords may drag down your ranking.') + '</span><span class="muted" id="seo-desc-cnt" style="font-size:11px">' + form.metaDescription.length + ' / 500</span></div>' +
          '<textarea class="input" id="seo-desc" rows="4" maxlength="500" placeholder="Product Description" style="height:auto;padding:8px 12px;resize:vertical">' + esc(form.metaDescription) + '</textarea></div>' +
        '<div class="mb-4"><div class="flex items-center gap-1 mb-1"><span style="font-size:13px;font-weight:500">URL</span> ' + helpIco('Short and descriptive (e.g. product-colour-size).') + '</div>' +
          '<div class="muted" style="font-size:11px;margin-bottom:4px;word-break:break-all">' + base + '</div><input class="input" id="seo-url" value="' + esc(form.urlHandle) + '" placeholder="product-colour-size" /></div>' +
        '<div><div class="flex items-center gap-1 mb-1"><span style="font-size:13px;font-weight:500">SEO keywords</span> ' + helpIco("Using relevant keywords can improve ranking and visibility on search engines. Don't use too many keywords as it may drag down your ranking.") + '</div>' +
          '<div class="flex items-center gap-2" style="flex-wrap:wrap;min-height:34px;border:1px solid var(--ctl);border-radius:8px;padding:5px 8px;background:#fff" id="seo-kwbox">' + kwHtml() +
          '<input id="seo-kw" placeholder="Press \'Enter\' to complete the keywords input" style="border:0;outline:0;background:transparent;flex:1;min-width:120px;font-size:13px" /></div></div>' +
      '</div>' +
      '<div class="drawer-foot" style="justify-content:flex-end"><button class="btn btn-primary" data-confirm>Confirm</button></div>';
    backdrop.appendChild(drawer); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    const syncPreview = () => { drawer.querySelector('#seo-preview').innerHTML = preview(); };
    const redrawKw = () => {
      const box = drawer.querySelector('#seo-kwbox');
      box.querySelectorAll('span[style]').forEach((e) => { if (e.querySelector('[data-kw-del]')) e.remove(); });
      drawer.querySelector('#seo-kw').insertAdjacentHTML('beforebegin', kwHtml());
      box.querySelectorAll('[data-kw-del]').forEach((x) => x.onclick = () => { form.seoKeywords.splice(Number(x.getAttribute('data-kw-del')), 1); redrawKw(); });
    };
    drawer.querySelector('[data-x]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    drawer.querySelector('#seo-title').oninput = (e) => { form.metaTitle = e.target.value; drawer.querySelector('#seo-title-cnt').textContent = e.target.value.length + ' / 50'; if (!isEdit) { form.urlHandle = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); drawer.querySelector('#seo-url').value = form.urlHandle; } syncPreview(); };
    drawer.querySelector('#seo-desc').oninput = (e) => { form.metaDescription = e.target.value; drawer.querySelector('#seo-desc-cnt').textContent = e.target.value.length + ' / 500'; syncPreview(); };
    drawer.querySelector('#seo-url').oninput = (e) => { form.urlHandle = e.target.value; syncPreview(); };
    drawer.querySelector('#seo-kw').onkeydown = (e) => { if (e.key === 'Enter' && e.target.value.trim()) { e.preventDefault(); const v = e.target.value.trim(); if (!form.seoKeywords.includes(v)) { form.seoKeywords.push(v); redrawKw(); } e.target.value = ''; } };
    drawer.querySelector('[data-confirm]').onclick = () => {
      EDIT.settings.metaTitle = form.metaTitle || EDIT.name || ''; EDIT.settings.metaDescription = form.metaDescription || EDIT.description || '';
      EDIT.settings.urlHandle = form.urlHandle || ''; EDIT.settings.seoKeywords = form.seoKeywords.slice();
      markDirty(); close(); rerenderSide(isEdit); toast('SEO settings saved');
    };
    redrawKw();
  }

  // ================= ROUTER =================
  function goEdit(id) { location.hash = '#/products/' + id; }
  function maybeLeave(go) {
    if (!DIRTY) { go(); return; }
    modal({ title: 'Leave with unsaved changes?', width: 460, okText: 'Leave', danger: true,
      body: '<div class="muted" style="font-size:13.5px">All unsaved changes will be lost.</div>',
      onOk: (m, close) => { DIRTY = false; close(); go(); } });
  }

  function route(rest) {
    closePops();
    imgGridExpanded = false;
    if (rest) renderEdit(decodeURIComponent(rest));
    else renderList();
  }

  // module-scoped CSS shim: on/off switch (+ Show/Hide labelled variant), danger button, helpers
  const style = document.createElement('style');
  style.textContent =
    // Unsaved-changes bar (UnSavedChanges.tsx): dark, full-width of the content column, sticky at the
    // very top of the scroll area (real admin uses fixed top:0 left/right:0). Square top corners,
    // rounded bottom; centered "You have unsaved changes" with Discard (ghost) + primary on the right.
    '.unsaved-bar{position:fixed;top:0;left:0;right:0;z-index:80;min-height:60px;display:flex;align-items:center;gap:8px;background:#242833;color:#fff;padding:0 24px;box-shadow:0 4px 12px rgba(0,0,0,.18)}' +
    '.unsaved-bar .btn-primary{height:32px}' +
    '.unsaved-discard{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.55);height:32px}' +
    '.unsaved-discard:hover{background:rgba(255,255,255,.12)}' +
    '.rt-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:2px;border-bottom:1px solid var(--hair);padding:5px 8px;background:var(--panel)}' +
    '.rt-btn{min-width:28px;height:28px;padding:0 6px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--ink-body);font-size:13px;cursor:pointer;line-height:1}' +
    '.rt-btn:hover{background:#fff;border-color:var(--hair);color:var(--ink)}' +
    '.rt-sep{width:1px;height:18px;background:var(--hair);margin:0 4px}' +
    '.rt-select{height:28px;border:1px solid var(--hair);border-radius:6px;background:#fff;color:var(--ink-body);font-size:12.5px;padding:0 4px;cursor:pointer}' +
    '.rt-editor{min-height:200px;padding:12px 14px;font-size:14px;color:var(--ink);outline:none;line-height:1.6;overflow:auto;background:#fff}' +
    '.rt-editor:empty:before{content:attr(data-ph);color:var(--ink-muted)}' +
    '.rt-editor h1,.rt-editor h2,.rt-editor h3{margin:.4em 0;font-weight:600}.rt-editor h2{font-size:1.25em}.rt-editor h3{font-size:1.1em}' +
    '.rt-editor p{margin:.4em 0}.rt-editor ul,.rt-editor ol{margin:.4em 0;padding-left:1.4em}' +
    '.rt-editor table{border-collapse:collapse;margin:.5em 0}.rt-editor td{border:1px solid var(--ctl);padding:4px 8px;min-width:48px}' +
    '.rt-editor img{max-width:100%}' +
    // Cascading category trigger + dropdown (TreeCascadeSelect): drill into top categories with a
    // child count + chevron, header row to go back, leaf rows select and close.
    '.cascade-trigger{display:flex;align-items:center;justify-content:space-between;gap:6px}' +
    '.cascade-pop{background:#fff;border:1px solid var(--hair);border-radius:10px;box-shadow:var(--float-shadow);min-width:260px;max-height:320px;overflow:auto;padding:6px}' +
    '.cascade-head{display:flex;align-items:center;gap:6px;padding:7px 8px;border-bottom:1px solid var(--hair);margin-bottom:4px;cursor:pointer;color:var(--ink-body);font-size:13px;font-weight:500}' +
    '.cascade-head:hover{color:var(--ink)}' +
    '.cascade-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:7px;font-size:13px;color:var(--ink);cursor:pointer}' +
    '.cascade-item:hover{background:#e6f0ff}' +
    '.cascade-arrow{display:inline-flex;align-items:center;gap:4px;color:var(--ink-muted);font-size:12px}' +
    '.cascade-arrow:hover{color:var(--brand)}' +
    '.sw{position:relative;display:inline-block;width:34px;height:18px;border-radius:9999px;background:var(--ctl);cursor:pointer;transition:background .15s;flex:none;vertical-align:middle}' +
    '.sw::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}' +
    '.sw.on{background:var(--brand)}.sw.on::after{transform:translateX(16px)}' +
    '.sw-lbl{width:58px}.sw-lbl::before{content:attr(data-off);position:absolute;right:8px;top:1px;font-size:10px;color:#fff;line-height:16px}.sw-lbl.on::before{content:attr(data-on);left:8px;right:auto}.sw-lbl::after{}.sw-lbl.on::after{transform:translateX(40px)}' +
    '.danger-btn{color:var(--err);border-color:#f3c0b4}.danger-btn:hover{background:#fdece8}' +
    '.img-tile:hover .img-del{opacity:1 !important}' +
    '.space-y-4>*+*{margin-top:16px}.space-y-6>*+*{margin-top:24px}';
  document.head.appendChild(style);

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.products = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
