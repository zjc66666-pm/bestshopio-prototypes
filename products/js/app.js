/* BestShopio Admin · Products prototype — list + edit + modals/drawers, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only renders
   the module body into #root. Mirrors reference/bestvoy-admin admin/products
   (products.vue, productEdit.vue, components/list/*, components/edit/*). */
(function () {
  const D = window.DATA_PRODUCTS;
  let root; // set by the SPA shell router via VIEWS.products.render(el, rest)

  // ---- tiny helpers ----
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);
  const priceText = (p) => p.price_min === p.price_max ? money(p.price_min) : (money(p.price_min) + ' – ' + money(p.price_max));

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 15),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 15),
    minus: svg('<path d="M5 12h14"/>', 15),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', 16),
    grip: svg('<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>', 16),
    alert: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', 14),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    play: svg('<path d="m8 5 11 7-11 7z"/>', 14),
  };

  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ---- status derivation (table.tsx getProductStatus) + pill ----
  const statusOf = (p) => p.is_del === 1 ? 'archived' : (p.is_show === 1 ? 'activated' : 'deactivated');
  const STATUS_TAB = { activated: 1, deactivated: 2, archived: 3 };

  // ---- SKU sync -> pill (driven by sku_sync_stats / SkuSyncStats) ----
  function syncPill(s) {
    if (!s || s.total_skus === 0) return '<span class="muted" style="font-size:12.5px">No SKU</span>';
    if (s.failed > 0) return '<span class="pill pill-red"><span class="dot"></span>' + s.failed + ' failed</span>';
    if (s.processing > 0) return '<span class="pill pill-blue"><span class="dot"></span>Syncing ' + s.processing + '</span>';
    if (s.is_partially_synced || s.not_synchronized > 0) return '<span class="pill pill-orange"><span class="dot"></span>Partial ' + s.synchronized + '/' + s.total_skus + '</span>';
    return '<span class="pill pill-green"><span class="dot"></span>Synced</span>';
  }

  // ---- inventory cell (table.tsx renderInventoryStatus) ----
  function inventoryCell(p) {
    const variants = p.spec_type === 1 ? ' · ' + p.variant_count + ' variants' : '';
    const base = '<span style="color:var(--ink)">' + p.on_sale_stock.toLocaleString() + ' on sale</span><span class="muted">' + variants + '</span>';
    if (p.inventory_status === 1) return '<div class="flex items-center gap-2">' + base + '<span class="pill pill-orange" style="padding:2px 9px">' + I.alert + ' Out of stock</span></div>';
    if (p.inventory_status === 2) return '<div class="flex items-center gap-2">' + base + '<span class="pill pill-orange" style="padding:2px 9px">' + I.alert + ' Partial - Out of stock</span></div>';
    return '<div>' + base + '</div>';
  }

  // ================= LIST VIEW =================
  const LST = {
    tab: 0, kwType: 'product_name', kw: '', kwApplied: '',
    cate: 0, priceMin: '', priceMax: '', priceApplied: false,
    sort: '', page: 1, size: 20,
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
    if (LST.sort) {
      const [f, dir] = LST.sort.split('_');
      const key = f === 'price' ? 'price_min' : 'on_sale_stock';
      rows.sort((a, b) => dir === 'asc' ? a[key] - b[key] : b[key] - a[key]);
    }
    return rows;
  }

  const tabCount = (key) => key === 0 ? D.PRODUCTS.length : D.PRODUCTS.filter((p) => STATUS_TAB[statusOf(p)] === key).length;
  const selectedRows = () => D.PRODUCTS.filter((p) => LST.sel[p.product_id]);

  function renderList() {
    const rows = filteredRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const kwOpts = D.SEARCH_FIELDS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const cateOpts = D.CATEGORIES.map((o) => '<option value="' + o.value + '"' + (o.value === LST.cate ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const sortOpts = D.SORT_OPTIONS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.sort ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const tabsHtml = D.TABS.map((t) =>
      '<div class="tab' + (t.key === LST.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + tabCount(t.key) + '</span></div>').join('');

    // active filter tags
    const tags = [];
    if (LST.kwApplied) {
      const lbl = (D.SEARCH_FIELDS.find((o) => o.value === LST.kwType) || {}).label || '';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.cate) {
      const lbl = (D.CATEGORIES.find((o) => o.value === LST.cate) || {}).label || '';
      tags.push('<span class="field-pill" data-clear="cate">Category: ' + esc(lbl) + ' <span class="x">&times;</span></span>');
    }
    if (LST.priceApplied) {
      const txt = (LST.priceMin !== '' ? money(LST.priceMin) : 'Min') + ' – ' + (LST.priceMax !== '' ? money(LST.priceMax) : 'Max');
      tags.push('<span class="field-pill" data-clear="price">Price range: ' + esc(txt) + ' <span class="x">&times;</span></span>');
    }

    const priceChipText = LST.priceApplied
      ? ((LST.priceMin !== '' ? money(LST.priceMin) : 'Min') + ' – ' + (LST.priceMax !== '' ? money(LST.priceMax) : 'Max'))
      : 'Price range';

    const selCount = selectedRows().length;
    const allOnPageSel = pageRows.length > 0 && pageRows.every((p) => LST.sel[p.product_id]);

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Products</h1>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-default" data-act="export">Export</button>' +
          '<button class="btn btn-primary" data-act="add">Add product</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="pr-tabs">' + tabsHtml + '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // keyword group (field select + input) — width 418 like search.tsx
            '<div class="flex" style="min-width:418px">' +
              '<select class="filter-select" id="kw-type" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // category select
            '<select class="filter-select" id="cate-sel" style="width:220px">' + cateOpts + '</select>' +
            // price range chip (popover)
            '<div class="sel-trigger" id="price-chip" style="width:220px">' +
              '<span class="' + (LST.priceApplied ? '' : 'muted') + '">' + esc(priceChipText) + '</span>' + I.chevDown +
            '</div>' +
            // sort select
            '<select class="filter-select" id="sort-sel" style="width:200px;margin-left:auto">' + sortOpts + '</select>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // bulk selection toolbar (table.tsx selection-toolbar)
        (selCount > 0 ?
          '<div class="card-pad" style="padding-top:0;padding-bottom:10px"><div class="flex items-center gap-3" style="background:#e6f0ff;border:1px solid #cfe1ff;border-radius:8px;padding:8px 12px">' +
            '<strong style="font-size:13px">' + selCount + ' Selected</strong>' +
            '<button class="btn btn-default" style="height:28px" data-bulk="activate">Activate</button>' +
            '<button class="btn btn-default" style="height:28px" data-bulk="deactivate">Deactivate</button>' +
            '<button class="btn btn-default" style="height:28px" data-bulk="archive">Archive products</button>' +
            '<button class="lnk" style="margin-left:auto" data-bulk="clear">Clear selection</button>' +
          '</div></div>' : '') +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1180px">' +
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="sel-all" ' + (allOnPageSel ? 'checked' : '') + ' style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></th>' +
            '<th>Product</th><th style="width:140px">Price</th><th style="width:300px">Inventory quantity</th>' +
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
    const cate = root.querySelector('#cate-sel');
    if (cate) cate.onchange = () => { LST.cate = Number(cate.value); LST.page = 1; renderList(); };
    const sort = root.querySelector('#sort-sel');
    if (sort) sort.onchange = () => { LST.sort = sort.value; LST.page = 1; renderList(); };
    const chip = root.querySelector('#price-chip');
    if (chip) chip.onclick = () => openPricePopover(chip);
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
    // bulk actions
    root.querySelectorAll('[data-bulk]').forEach((b) => b.onclick = () => {
      const act = b.getAttribute('data-bulk');
      if (act === 'clear') { LST.sel = {}; renderList(); return; }
      openBulkConfirm(act);
    });
    // inline status toggle
    root.querySelectorAll('[data-toggle]').forEach((sw) => sw.onclick = (e) => {
      e.stopPropagation();
      const id = Number(sw.getAttribute('data-toggle'));
      const p = D.PRODUCTS.find((x) => x.product_id === id);
      if (p) { p.is_show = p.is_show === 1 ? 0 : 1; toast('Product ' + (p.is_show ? 'activated' : 'deactivated')); renderList(); }
    });
    // row click -> edit ; but ignore clicks on interactive cells
    root.querySelectorAll('#pr-tbody tr[data-id]').forEach((tr) => tr.onclick = (e) => {
      if (e.target.closest('[data-stop]')) return;
      goEdit(tr.getAttribute('data-id'));
    });
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); toast('Storefront preview opens in a new tab (roadmap)'); });
    const exp = root.querySelector('[data-act="export"]'); if (exp) exp.onclick = () => toast('Export — generates a CSV of the filtered products (roadmap)');
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('new');
  }

  function openPricePopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:260px;padding:14px"></div>');
    pop.innerHTML =
      '<div class="ctrl-label" style="margin-bottom:8px">Price range</div>' +
      '<div class="flex items-center gap-2">' +
        '<input class="input" id="pr-min" placeholder="Min" type="number" value="' + esc(LST.priceMin) + '" style="width:96px" />' +
        '<span class="muted">to</span>' +
        '<input class="input" id="pr-max" placeholder="Max" type="number" value="' + esc(LST.priceMax) + '" style="width:96px" />' +
      '</div>' +
      '<div class="flex justify-end gap-2 mt-3">' +
        '<button class="btn btn-default" data-x>Clear</button>' +
        '<button class="btn btn-primary" data-apply>Apply</button>' +
      '</div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelector('[data-apply]').onclick = () => {
      LST.priceMin = pop.querySelector('#pr-min').value;
      LST.priceMax = pop.querySelector('#pr-max').value;
      LST.priceApplied = LST.priceMin !== '' || LST.priceMax !== '';
      LST.page = 1; closePops(); renderList();
    };
    pop.querySelector('[data-x]').onclick = () => { LST.priceApplied = false; LST.priceMin = ''; LST.priceMax = ''; LST.page = 1; closePops(); renderList(); };
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  // bulk confirm (table.tsx Popconfirm copy)
  function openBulkConfirm(act) {
    const n = selectedRows().length;
    const META = {
      activate: { title: 'Activate ' + n + ' products?', desc: 'Activated products will be visible and available for purchase.', ok: 'Confirm' },
      deactivate: { title: 'Deactivate ' + n + ' products?', desc: "Deactivated products won't be available for purchase on any sales channel.", ok: 'Confirm' },
      archive: { title: 'Archive ' + n + ' products in bulk', desc: 'Archiving hides products from your sales channels. Use the status filter to find them later.', ok: 'Confirm' },
    }[act];
    modal({
      title: META.title, width: 460, okText: META.ok,
      body: '<div class="muted" style="font-size:13.5px;line-height:1.6">' + esc(META.desc) + '</div>',
      onOk: (m, close) => {
        selectedRows().forEach((p) => {
          if (act === 'activate' && statusOf(p) !== 'archived') p.is_show = 1;
          if (act === 'deactivate' && statusOf(p) !== 'archived') p.is_show = 0;
          if (act === 'archive') p.is_del = 1;
        });
        LST.sel = {}; close();
        toast('Successfully ' + (act === 'archive' ? 'archived' : act + 'd') + ' ' + n + ' products');
        renderList();
      },
    });
  }

  // ================= EDIT VIEW =================
  // working copy of the product being edited
  let EDIT = null;     // current form state (deep-ish clone)
  let EDIT_ID = null;
  let DIRTY = false;

  function blankProduct() {
    return {
      product_id: 0, name: '', summary: '', highlights: [''], description: '', detail: '',
      cate_id: 0, category_label: '', product_spu: '', images: [],
      hasVariants: false, spec_type: 0, attr: [], attrValue: [],
      price: undefined, compareAtPrice: undefined, itemCost: undefined, sku: '', barcode: '', inventoryQuantity: undefined,
      params: [{ name: '', single: '' }],
      metafields: { shop: [], google: [] },
      settings: { activated: false, status: 'deactivated', spu: '', weight: 0, vendor_id: undefined, category: 0, tags: [], metaTitle: '', metaDescription: '', urlHandle: '', seoKeywords: [], homeTemplate: 'default' },
    };
  }

  function loadEdit(id) {
    EDIT_ID = id; DIRTY = false;
    if (id === 'new') { EDIT = blankProduct(); return true; }
    const src = D.DETAILS[id] || D.DETAILS[Number(id)];
    if (src) { EDIT = JSON.parse(JSON.stringify(src)); return true; }
    // fallback: synthesize a minimal record from the list row so any row is openable
    const row = D.PRODUCTS.find((p) => String(p.product_id) === String(id));
    if (!row) { EDIT = null; return false; } // unknown id -> caller shows a not-found state
    EDIT = Object.assign(blankProduct(), {
      product_id: row.product_id, name: row.store_name, spec_type: row.spec_type, hasVariants: row.spec_type === 1,
      product_spu: row.product_spu, sku: row.sku, barcode: row.barcode,
      price: row.price_min, compareAtPrice: row.price_max, inventoryQuantity: row.on_sale_stock,
      images: [{ uid: 'x', name: 'image', url: row.image, cover: true }],
      attr: row.spec_type === 1 ? [{ value: 'Size', detail: [{ value: 'S' }, { value: 'M' }, { value: 'L' }] }] : [],
      attrValue: row.spec_type === 1
        ? [{ unique: 'V-' + row.product_id + '-S', title: 'S', image: row.image, sku: (row.sku || 'SKU-' + row.product_id) + '-S', price: row.price_min, ot_price: row.price_max, cost: 0, stock: Math.round(row.on_sale_stock / 3), weight: 180, bar_code_number: '', is_show: 1, is_default_select: 1 }]
        : [{ unique: 'V-' + row.product_id, title: 'Default', image: row.image, sku: row.sku || 'SKU-' + row.product_id, price: row.price_min, ot_price: row.price_max, cost: 0, stock: row.on_sale_stock, weight: 180, bar_code_number: '', is_show: 1, is_default_select: 1 }],
      settings: Object.assign(blankProduct().settings, { activated: row.is_show === 1, status: statusOf(row), category: row.cate_id || 0, spu: row.product_spu, archived: row.is_del === 1 }),
    });
    return true;
  }

  const markDirty = () => { if (!DIRTY) { DIRTY = true; const bar = document.getElementById('unsaved-bar'); if (bar) bar.style.display = 'flex'; } };

  // Unknown product id (e.g. a stale/typo hash) -> friendly empty state, not a blank editable form.
  function renderNotFound(id) {
    DIRTY = false;
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back" title="Back to products">' + I.arrowLeft + '</button>' +
        '<h1 class="page-title">Product not found</h1>' +
      '</div>' +
      '<div class="panel card-pad" style="text-align:center;padding:48px 16px">' +
        '<div style="color:var(--ink-muted);margin-bottom:6px">' + I.alert + '</div>' +
        '<div style="font-weight:600;margin-bottom:4px">No product with ID ' + esc(id) + '</div>' +
        '<div class="muted" style="font-size:13px;margin-bottom:16px">It may have been deleted, or the link is out of date.</div>' +
        '<button class="btn btn-primary" data-act="back-list">Back to products</button>' +
      '</div>';
    const go = () => { location.hash = '#/products'; };
    const b1 = root.querySelector('[data-act="back"]'); if (b1) b1.onclick = go;
    const b2 = root.querySelector('[data-act="back-list"]'); if (b2) b2.onclick = go;
  }

  function renderEdit(id) {
    if (!loadEdit(id)) { renderNotFound(id); return; }
    const isEdit = id !== 'new';
    const title = isEdit ? (EDIT.name || 'Edit product') : 'Add product';
    const archived = !!(EDIT.settings && EDIT.settings.archived);

    root.innerHTML =
      // fixed 1200px centered container (matches real admin) — .detail-* shared classes in theme.css
      '<div class="detail-wrap">' +
        // unsaved-changes bar (UnSavedChanges.tsx) — hidden until a field changes
        '<div id="unsaved-bar" style="display:none;align-items:center;justify-content:space-between;gap:12px;background:#242833;color:#fff;border-radius:10px;padding:10px 16px;margin-bottom:16px">' +
          '<span style="font-size:13.5px">Unsaved changes</span>' +
          '<div class="flex items-center gap-2">' +
            '<button class="btn" style="background:rgba(255,255,255,.16);color:#fff" data-act="discard">Discard</button>' +
            '<button class="btn btn-primary" data-act="save-bar">' + (isEdit ? 'Update' : 'Add') + '</button>' +
          '</div>' +
        '</div>' +
        // header
        '<div class="flex items-center gap-3 mb-4">' +
          '<button class="back-btn" data-act="back" title="Back to products">' + I.arrowLeft + '</button>' +
          '<h1 class="page-title" style="min-width:0;word-break:break-word">' + esc(title) + '</h1>' +
          (archived ? '<span class="pill pill-gray">' + I.clock + ' Archived</span>' : '') +
        '</div>' +
        // two-column body: left sections (flex), right settings rail (fixed 275px)
        '<div class="detail-cols">' +
          '<div class="detail-main" id="edit-main"></div>' +
          '<div class="detail-rail" id="edit-side"></div>' +
        '</div>' +
      '</div>';

    document.getElementById('edit-main').innerHTML =
      secProductInfo() + secImages() +
      (EDIT.hasVariants ? '' : secPricing() + secInventory()) +
      secVariants() + secSkuList() + secSpecifics() +
      (isEdit ? secMetafields('shop', 'Product metafields') + secMetafields('google', 'Google metafields') : '') +
      // footer actions (edit.tsx)
      '<div class="flex justify-end gap-2 mt-2 mb-6">' +
        '<button class="btn btn-primary" data-act="save">' + (isEdit ? 'Update Product' : 'Add Product') + '</button>' +
        (archived ? '<button class="btn btn-default" style="color:var(--err);border-color:#f3c0b4" data-act="unarchive">Set product as unarchived</button><button class="btn btn-default" style="color:var(--err);border-color:#f3c0b4" data-act="destroy">Delete the product</button>'
          : (isEdit && EDIT.settings && !EDIT.settings.activated ? '<button class="btn btn-default" style="color:var(--err);border-color:#f3c0b4" data-act="archive-one">Archive the product</button>' : '')) +
      '</div>';

    document.getElementById('edit-side').innerHTML = secSettings(isEdit) + secSeo() + (isEdit ? secTemplate() : '');

    wireEdit(isEdit);
    if (root.parentElement) root.parentElement.scrollTop = 0;
  }

  // ---- card shell for edit sections (matches Ant Card.Meta header) ----
  function card(titleHtml, bodyHtml, right) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center justify-between mb-3"><div class="card-title">' + titleHtml + '</div>' + (right || '') + '</div>' +
      bodyHtml + '</div>';
  }
  const lbl = (t, hint) => '<div class="ctrl-label" style="text-transform:none;font-size:13px;font-weight:500;color:var(--ink)">' + t + (hint ? ' <span class="muted" title="' + esc(hint) + '" style="cursor:help">(?)</span>' : '') + '</div>';
  const field = (id, label, val, ph, hint) => '<div class="mb-3">' + lbl(label, hint) +
    '<input class="input" id="' + id + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '" style="margin-top:4px" /></div>';

  // 1) Product information
  function secProductInfo() {
    const idHead = EDIT.product_id
      ? '<div class="flex items-center gap-2 muted" style="font-size:13px"><span>Product ID: <span class="lnk">' + EDIT.product_id + '</span></span><button class="back-btn" data-act="copy-id" title="Copy" style="width:26px;height:26px">' + I.copy + '</button></div>'
      : '';
    const highlights = EDIT.highlights.map((hl, i) =>
      '<div class="flex items-start gap-2 mb-2" data-hl="' + i + '">' +
        '<input class="input" data-hl-input="' + i + '" value="' + esc(hl) + '" placeholder="List a top reason customers should buy this product" style="flex:1" />' +
        (i === 0
          ? '<button class="btn btn-default" data-hl-add style="width:34px;padding:0;justify-content:center">' + I.plus + '</button>'
          : '<button class="btn btn-default" data-hl-del="' + i + '" style="width:34px;padding:0;justify-content:center">' + I.minus + '</button>') +
      '</div>').join('');
    const body =
      field('f-name', 'Name', EDIT.name, 'Example: short-sleeved T-shirt') +
      '<div class="mb-3">' + lbl('Summary') +
        '<textarea class="input" id="f-summary" rows="3" placeholder="Tell us something about this product" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(EDIT.summary) + '</textarea></div>' +
      '<div class="mb-3">' + lbl('Highlights') + '<div style="margin-top:4px" id="hl-list">' + highlights + '</div></div>' +
      '<div class="mb-3">' + lbl('Description') +
        '<textarea class="input" id="f-desc" rows="5" placeholder="Describe the product\'s main features and benefits" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(EDIT.description) + '</textarea></div>' +
      '<div>' + lbl('Detail') +
        // simple rich-text-ish toolbar (RichTextEditor stand-in)
        '<div class="ql-wrap" style="margin-top:4px"><div class="ql-head"><div class="flex items-center gap-3 muted" style="font-size:13px"><b>B</b><i>I</i><u>U</u><span>H2</span><span>List</span><span>Link</span></div></div>' +
        '<textarea class="ql-editor" id="f-detail" placeholder="Add comprehensive details, user guides, and care info">' + esc((EDIT.detail || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) + '</textarea></div></div>';
    return card('Product information', body, idHead);
  }

  // 2) Images / Videos
  function secImages() {
    const tiles = (EDIT.images || []).map((im, i) =>
      '<div style="position:relative;width:96px;height:96px;border:1px solid var(--hair);border-radius:8px;overflow:hidden;background:#f3f4f6" data-img="' + i + '">' +
        '<img src="' + im.url + '" alt="" style="width:100%;height:100%;object-fit:cover" />' +
        (im.type === 'video' ? '<span style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.35);color:#fff">' + I.play + '</span>' : '') +
        (im.cover ? '<span class="st st-ready" style="position:absolute;left:4px;top:4px"><span class="dot"></span>Cover</span>' : '') +
        '<button class="back-btn" data-img-del="' + i + '" title="Remove" style="position:absolute;right:3px;top:3px;width:22px;height:22px;background:rgba(255,255,255,.9)">' + I.x + '</button>' +
      '</div>').join('');
    const body =
      '<div class="flex items-center gap-3" style="flex-wrap:wrap">' + tiles +
        '<button id="img-add" style="width:96px;height:96px;border:1px dashed var(--ctl);border-radius:8px;background:#fff;color:var(--brand);display:grid;place-items:center;cursor:pointer">' +
          '<div style="text-align:center;font-size:12px">' + I.image + '<div style="margin-top:4px">Add</div></div></button>' +
      '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Add up to 12 images or a short video. First image is used as the cover. PNG, JPG, MP4.</div>';
    return card('Images / Videos', body);
  }

  // 3) Pricing (single-product)
  function secPricing() {
    const v = EDIT.attrValue && EDIT.attrValue[0] || {};
    const num = (id, label, val, hint) => '<div>' + lbl(label, hint) +
      '<div style="position:relative;margin-top:4px"><span style="position:absolute;left:10px;top:9px;color:var(--ink-muted)">$</span>' +
      '<input class="input" id="' + id + '" type="number" min="0" step="0.01" value="' + (val == null ? '' : val) + '" placeholder="0.00" style="padding-left:22px" /></div></div>';
    const body = '<div class="grid grid-cols-3 gap-4">' +
      num('p-price', 'Price', EDIT.price != null ? EDIT.price : v.price, 'Checkout price may differ during promotions.') +
      num('p-compare', 'Compare at price', EDIT.compareAtPrice != null ? EDIT.compareAtPrice : v.ot_price, 'Shown with a strikethrough when higher than price.') +
      num('p-cost', 'Item cost', EDIT.itemCost != null ? EDIT.itemCost : v.cost, "Won't be displayed to customers.") +
      '</div>';
    return card('Price settings', body);
  }

  // 4) Inventory (single-product)
  function secInventory() {
    const v = EDIT.attrValue && EDIT.attrValue[0] || {};
    const body = '<div class="grid grid-cols-3 gap-4">' +
      field('i-sku', 'SKU', EDIT.sku || v.sku) +
      field('i-barcode', 'Barcode (ISBN, UPC, GTIN, etc.)', EDIT.barcode || v.bar_code_number) +
      '<div>' + lbl('Inventory quantity') + '<input class="input" id="i-stock" type="number" min="0" value="' + (EDIT.inventoryQuantity != null ? EDIT.inventoryQuantity : (v.stock != null ? v.stock : '')) + '" placeholder="0" style="margin-top:4px" /></div>' +
      '</div>';
    return card('Inventory', body);
  }

  // 5) Variants (options)
  function secVariants() {
    const checked = EDIT.hasVariants ? 'checked' : '';
    const orderBtn = EDIT.hasVariants ? '<button class="btn btn-default" data-act="variant-order">Variant display order</button>' : '';
    let optionRows = '';
    if (EDIT.hasVariants) {
      optionRows = (EDIT.attr || []).map((opt, i) => {
        const chips = (opt.detail || []).map((d, vi) =>
          '<span class="field-pill" style="background:#dbeafe;border-color:#bfdbfe;color:#1e40af">' + esc(d.value) +
          ' <span class="x" data-vval="' + i + ':' + vi + '">&times;</span></span>').join('');
        return '<div class="flex gap-3 items-start" style="border-bottom:1px solid var(--hair);padding-bottom:12px;margin-bottom:12px" data-opt="' + i + '">' +
          '<div style="width:25%">' +
            '<input class="input" list="opt-names" data-opt-name="' + i + '" value="' + esc(opt.value) + '" placeholder="e.g. Color" />' +
          '</div>' +
          '<div style="flex:1">' +
            '<div class="flex items-center gap-2" style="flex-wrap:wrap;min-height:34px;border:1px solid var(--ctl);border-radius:8px;padding:5px 8px;background:#fff">' +
              chips +
              '<input data-opt-val="' + i + '" placeholder="Add value..." style="border:0;outline:0;background:transparent;width:120px;font-size:13px" />' +
            '</div>' +
          '</div>' +
          '<button class="back-btn" data-opt-edit="' + i + '" title="Edit option" style="width:30px;height:30px">' + I.pencil + '</button>' +
          '<button class="back-btn" data-opt-del="' + i + '" title="Delete option" style="width:30px;height:30px;color:var(--err)">' + I.trash + '</button>' +
        '</div>';
      }).join('') +
      ((EDIT.attr || []).length < 4 ? '<button class="btn btn-default" data-act="opt-add">' + I.plus + ' Add product variant</button>' : '') +
      '<datalist id="opt-names">' + D.OPTION_NAMES.map((n) => '<option value="' + n + '">').join('') + '</datalist>';
    }
    const body =
      '<div class="flex items-center justify-between mb-2">' +
        '<label class="flex items-center gap-2" style="cursor:pointer"><input type="checkbox" id="has-variants" ' + checked + ' style="width:16px;height:16px;accent-color:var(--brand)" /><span style="font-size:13.5px">This Product has multiple variants</span></label>' +
        orderBtn +
      '</div>' +
      (EDIT.hasVariants ? '<div style="border-top:1px solid var(--hair);padding-top:14px;margin-top:6px">' + optionRows + '</div>' : '');
    return card('Variants', body);
  }

  // 6) SKU list (table) — only when variants on
  function secSkuList() {
    if (!EDIT.hasVariants) return '';
    const rows = (EDIT.attrValue || []).map((v, i) =>
      '<tr data-sku="' + i + '">' +
        '<td><div style="width:38px;height:38px;border:1px dashed var(--ctl);border-radius:6px;overflow:hidden;cursor:pointer;display:grid;place-items:center;background:#fff" data-sku-img="' + i + '">' +
          (v.image ? '<img src="' + v.image + '" style="width:100%;height:100%;object-fit:cover" />' : I.image) + '</div></td>' +
        '<td style="font-weight:500;white-space:nowrap">' + esc(v.title) + '</td>' +
        '<td><input class="input" style="height:30px;width:130px" value="' + esc(v.sku || '') + '" data-skf="sku:' + i + '" placeholder="SKU" /></td>' +
        '<td><input class="input" style="height:30px;width:96px" type="number" min="0" step="0.01" value="' + (v.price == null ? '' : v.price) + '" data-skf="price:' + i + '" placeholder="$" /></td>' +
        '<td><input class="input" style="height:30px;width:96px" type="number" min="0" step="0.01" value="' + (v.ot_price == null ? '' : v.ot_price) + '" data-skf="ot_price:' + i + '" placeholder="$" /></td>' +
        '<td><input class="input" style="height:30px;width:96px" type="number" min="0" step="0.01" value="' + (v.cost == null ? '' : v.cost) + '" data-skf="cost:' + i + '" placeholder="$" /></td>' +
        '<td><input class="input" style="height:30px;width:84px" type="number" min="0" value="' + (v.stock == null ? '' : v.stock) + '" data-skf="stock:' + i + '" placeholder="0" /></td>' +
        '<td><div class="flex"><input class="input" style="height:30px;width:64px;border-top-right-radius:0;border-bottom-right-radius:0" type="number" min="0" value="' + (v.weight == null ? '' : v.weight) + '" data-skf="weight:' + i + '" /><span class="muted" style="display:inline-flex;align-items:center;padding:0 8px;border:1px solid var(--ctl);border-left:0;border-radius:0 6px 6px 0;background:var(--panel);font-size:12px">g</span></div></td>' +
        '<td><input class="input" style="height:30px;width:130px" value="' + esc(v.bar_code_number || '') + '" data-skf="bar_code_number:' + i + '" placeholder="Barcode" /></td>' +
        '<td style="text-align:center"><button class="back-btn" style="width:28px;height:28px" data-sku-meta="' + i + ':custom" title="Variant metafields">' + I.pencil + '</button></td>' +
        '<td style="text-align:center"><button class="back-btn" style="width:28px;height:28px" data-sku-meta="' + i + ':google" title="Google metafields">' + I.pencil + '</button></td>' +
        '<td style="text-align:center"><span class="sw' + (v.is_default_select === 1 ? ' on' : '') + '" data-sku-default="' + i + '"></span></td>' +
        '<td style="text-align:center"><span class="sw' + (v.is_show === 1 ? ' on' : '') + '" data-sku-show="' + i + '" title="' + (v.is_show === 1 ? 'Shown' : 'Hidden') + '"></span></td>' +
      '</tr>').join('');
    const body =
      '<div style="overflow-x:auto"><table class="tbl" style="min-width:1320px;font-size:13px">' +
        '<thead><tr><th>Image</th><th>Variant</th><th>SKU</th><th>Price</th><th>Compare at price</th><th>Item cost</th><th>Inventory</th><th>Weight</th><th>Barcode</th><th style="text-align:center">Metafields</th><th style="text-align:center">Google</th><th style="text-align:center">Default</th><th style="text-align:center">Action</th></tr></thead>' +
        '<tbody id="sku-body">' + rows + '</tbody>' +
      '</table></div>';
    return card('SKU list', body);
  }

  // 7) Product specifics
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

  // 8a/8b) Metafields (shop / google)
  function secMetafields(ns, title) {
    const list = (EDIT.metafields && EDIT.metafields[ns]) || [];
    const rows = list.length ? list.map((mf, i) =>
      '<div class="flex gap-2 items-start mb-2" data-mf="' + ns + ':' + i + '">' +
        '<input class="input" data-mfk="' + ns + ':' + i + '" value="' + esc(mf.key) + '" placeholder="Key" style="flex:1" />' +
        '<input class="input" data-mft="' + ns + ':' + i + '" value="' + esc(mf.type) + '" placeholder="Type" style="width:150px" list="mf-types" />' +
        '<input class="input" data-mfv="' + ns + ':' + i + '" value="' + esc(mf.value) + '" placeholder="Value" style="flex:1" />' +
        '<button class="back-btn" data-mf-del="' + ns + ':' + i + '" style="width:34px;height:34px;color:var(--err)">' + I.trash + '</button>' +
      '</div>').join('')
      : '<div class="muted" style="font-size:13px;padding:4px 0 8px">No ' + (ns === 'google' ? 'Google ' : '') + 'metafields yet.</div>';
    const body = '<div data-mf-list="' + ns + '">' + rows + '</div>' +
      '<button class="btn btn-default" data-mf-add="' + ns + '">' + I.plus + ' Add metafield</button>' +
      '<datalist id="mf-types">' + D.METAFIELD_TYPES.map((t) => '<option value="' + t + '">').join('') + '</datalist>';
    const sub = '<span class="muted" style="font-size:12px;font-weight:400">namespace: ' + ns + '</span>';
    return card(esc(title) + ' &nbsp; ' + sub, body);
  }

  // Right rail — Product settings
  function secSettings(isEdit) {
    const s = EDIT.settings || {};
    const vendorOpts = '<option value="">Choose a vendor</option>' + D.VENDORS.map((v) => '<option value="' + v.value + '"' + (v.value === s.vendor_id ? ' selected' : '') + '>' + esc(v.label) + '</option>').join('');
    const cateOpts = D.CATEGORIES.map((c) => '<option value="' + c.value + '"' + (c.value === s.category ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('');
    const tags = (s.tags || []).map((t, i) => '<span class="field-pill" style="background:#dbeafe;border-color:#bfdbfe;color:#1e40af">' + esc(t) + ' <span class="x" data-tag-del="' + i + '">&times;</span></span>').join('');
    const archived = !!s.archived;

    let body = '';
    if (archived) {
      body += '<div style="background:var(--panel);border-radius:8px;padding:8px 10px;margin-bottom:14px">' +
        '<div class="flex items-center justify-between"><span class="flex items-center gap-2" style="font-weight:500">' + I.clock + ' Archived</span><button class="lnk" data-act="unarchive">Cancel</button></div>' +
        '<div class="muted" style="font-size:12px;margin-top:4px">Once unarchived, status changes to Deactivated. You can still activate it for sale.</div></div>';
    } else {
      body += '<div class="flex items-center justify-between mb-3">' + lbl('Activate') +
        '<span class="sw' + (s.activated ? ' on' : '') + '" id="set-activate"></span></div>';
    }
    body += field('set-spu', 'SPU', s.spu, 'Add SPU', 'A standardized product unit with the same attribute value and characteristics.');
    if (!EDIT.hasVariants) {
      body += '<div class="mb-3">' + lbl('Weight') + '<div class="flex" style="margin-top:4px"><input class="input" id="set-weight" type="number" min="0" step="0.1" value="' + (s.weight == null ? '' : s.weight) + '" placeholder="0" style="border-top-right-radius:0;border-bottom-right-radius:0" /><span class="muted" style="display:inline-flex;align-items:center;padding:0 10px;border:1px solid var(--ctl);border-left:0;border-radius:0 8px 8px 0;background:var(--panel);font-size:13px">g</span></div></div>';
    }
    body += '<div class="mb-3">' + lbl('Vendor') + '<select class="input" id="set-vendor" style="margin-top:4px">' + vendorOpts + '</select></div>';
    body += '<div class="mb-3">' + lbl('Category') + '<select class="input" id="set-category" style="margin-top:4px">' + cateOpts + '</select></div>';
    body += '<div>' + lbl('Tags') + '<div class="flex items-center gap-2" style="flex-wrap:wrap;min-height:34px;border:1px solid var(--ctl);border-radius:8px;padding:5px 8px;margin-top:4px;background:#fff" id="tag-box">' + tags +
      '<input id="tag-input" placeholder="Add tag..." style="border:0;outline:0;background:transparent;width:90px;font-size:13px" /></div></div>';
    return card('Product Settings', body);
  }

  // Right rail — SEO preview card (opens SEO drawer)
  function secSeo() {
    const s = EDIT.settings || {};
    const base = 'https://www.bestvoy.com/listing/' + (EDIT.product_id || '{id}') + '/';
    const body =
      '<div class="muted" style="font-size:12px;word-break:break-all;margin-bottom:6px">' + base + esc(s.urlHandle || '') + '</div>' +
      '<div style="font-size:13.5px;color:var(--brand);word-break:break-word">' + esc(s.metaTitle || EDIT.name || 'Blank Title') + '</div>' +
      '<div class="muted" style="font-size:13px;word-break:break-word;margin-top:2px">' + esc(s.metaDescription || EDIT.description || 'Blank Description') + '</div>';
    const right = '<button class="back-btn" data-act="seo" title="Edit SEO" style="width:30px;height:30px">' + I.pencil + '</button>';
    return card('Search engine optimization', body, right);
  }

  // Right rail — theme template (edit only)
  function secTemplate() {
    const s = EDIT.settings || {};
    const opts = D.TEMPLATES.map((t) => '<option value="' + t.value + '"' + (t.value === (s.homeTemplate || 'default') ? ' selected' : '') + '>' + esc(t.label) + '</option>').join('');
    const body = '<select class="input" id="set-template">' + opts + '</select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you\'d like the page to look.</div>' +
      ((s.homeTemplate && s.homeTemplate !== 'default') ? '<div class="lnk" style="margin-top:6px" data-act="design">Design</div>' : '');
    return card('Theme template', body);
  }

  // ---- wire edit interactions ----
  function wireEdit(isEdit) {
    const q = (sel) => root.querySelector(sel);
    const all = (sel) => root.querySelectorAll(sel);

    q('[data-act="back"]').onclick = () => maybeLeave(() => { location.hash = '#/products'; });
    const cid = q('[data-act="copy-id"]'); if (cid) cid.onclick = () => { try { navigator.clipboard.writeText(String(EDIT.product_id)); } catch (e) {} toast('Copied ' + EDIT.product_id); };

    // text fields -> state + dirty
    const bind = (sel, fn) => { const el = q(sel); if (el) { el.oninput = () => { fn(el.value); markDirty(); }; } };
    bind('#f-name', (v) => { EDIT.name = v; });
    bind('#f-summary', (v) => { EDIT.summary = v; });
    bind('#f-desc', (v) => { EDIT.description = v; });
    bind('#f-detail', (v) => { EDIT.detail = v; });

    // highlights
    all('[data-hl-input]').forEach((el) => el.oninput = () => { EDIT.highlights[Number(el.getAttribute('data-hl-input'))] = el.value; markDirty(); });
    const hladd = q('[data-hl-add]'); if (hladd) hladd.onclick = () => { EDIT.highlights.push(''); markDirty(); rerenderMain(isEdit); };
    all('[data-hl-del]').forEach((b) => b.onclick = () => { EDIT.highlights.splice(Number(b.getAttribute('data-hl-del')), 1); markDirty(); rerenderMain(isEdit); });

    // images
    const imgadd = q('#img-add'); if (imgadd) imgadd.onclick = () => { EDIT.images.push({ uid: 'n' + Date.now(), name: 'image', url: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="6" fill="%23cbd5e1"/></svg>'), cover: EDIT.images.length === 0 }); markDirty(); rerenderMain(isEdit); };
    all('[data-img-del]').forEach((b) => b.onclick = () => { const i = Number(b.getAttribute('data-img-del')); EDIT.images.splice(i, 1); if (EDIT.images.length && !EDIT.images.some((x) => x.cover)) EDIT.images[0].cover = true; markDirty(); rerenderMain(isEdit); });

    // pricing / inventory (single)
    bind('#p-price', (v) => { EDIT.price = v === '' ? undefined : Number(v); });
    bind('#p-compare', (v) => { EDIT.compareAtPrice = v === '' ? undefined : Number(v); });
    bind('#p-cost', (v) => { EDIT.itemCost = v === '' ? undefined : Number(v); });
    bind('#i-sku', (v) => { EDIT.sku = v; });
    bind('#i-barcode', (v) => { EDIT.barcode = v; });
    bind('#i-stock', (v) => { EDIT.inventoryQuantity = v === '' ? undefined : Number(v); });

    // variants toggle
    const hv = q('#has-variants'); if (hv) hv.onchange = () => {
      // confirm dialog like Variants.tsx
      modal({
        title: 'Tip', width: 460, okText: 'OK',
        body: '<div class="muted" style="font-size:13.5px;line-height:1.6">' + (isEdit
          ? 'The product Variant ID will be changed. This may impact ad performance, marketing and inventory data management.'
          : "Make sure you've filled in all product variant information. Any change here may affect ad performance, marketing, and inventory.") + '</div>',
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
        body: '<div class="flex items-start gap-2"><span style="color:var(--err)">' + I.alert + '</span><span style="font-size:13.5px;line-height:1.6">After it is deleted, the corresponding product variant will be deleted together and cannot be restored.</span></div>',
        onOk: (m, close) => { EDIT.attr.splice(i, 1); rebuildSkusFromOptions(); markDirty(); close(); rerenderMain(isEdit); } });
    });
    all('[data-opt-edit]').forEach((b) => b.onclick = () => openEditAttrModal(Number(b.getAttribute('data-opt-edit')), isEdit));
    all('[data-opt-val]').forEach((el) => el.onkeydown = (e) => {
      if (e.key === 'Enter' && el.value.trim()) {
        const i = Number(el.getAttribute('data-opt-val')); const val = el.value.trim();
        const det = EDIT.attr[i].detail || (EDIT.attr[i].detail = []);
        if (!det.some((d) => d.value === val)) { det.push({ value: val }); rebuildSkusFromOptions(); markDirty(); rerenderMain(isEdit); }
      }
    });
    all('[data-vval]').forEach((x) => x.onclick = () => { const [i, vi] = x.getAttribute('data-vval').split(':').map(Number); EDIT.attr[i].detail.splice(vi, 1); rebuildSkusFromOptions(); markDirty(); rerenderMain(isEdit); });

    // SKU table inputs
    all('[data-skf]').forEach((el) => el.oninput = () => {
      const [f, i] = el.getAttribute('data-skf').split(':'); const idx = Number(i);
      const numFields = ['price', 'ot_price', 'cost', 'stock', 'weight'];
      EDIT.attrValue[idx][f] = numFields.includes(f) ? (el.value === '' ? undefined : Number(el.value)) : el.value;
      markDirty();
    });
    all('[data-sku-default]').forEach((sw) => sw.onclick = () => { const i = Number(sw.getAttribute('data-sku-default')); EDIT.attrValue.forEach((v, j) => v.is_default_select = j === i ? 1 : 0); markDirty(); rerenderMain(isEdit); });
    all('[data-sku-show]').forEach((sw) => sw.onclick = () => { const i = Number(sw.getAttribute('data-sku-show')); EDIT.attrValue[i].is_show = EDIT.attrValue[i].is_show === 1 ? 0 : 1; markDirty(); rerenderMain(isEdit); });
    all('[data-sku-img]').forEach((b) => b.onclick = () => toast('Image picker opens the media library (roadmap)'));
    all('[data-sku-meta]').forEach((b) => b.onclick = () => { const [i, ns] = b.getAttribute('data-sku-meta').split(':'); openVariantMetafieldModal(EDIT.attrValue[Number(i)], ns); });

    // specifics
    all('[data-sp-name]').forEach((el) => el.oninput = () => { EDIT.params[Number(el.getAttribute('data-sp-name'))].name = el.value; markDirty(); });
    all('[data-sp-val]').forEach((el) => el.oninput = () => { EDIT.params[Number(el.getAttribute('data-sp-val'))].single = el.value; markDirty(); });
    const spadd = q('[data-sp-add]'); if (spadd) spadd.onclick = () => { EDIT.params.push({ name: '', single: '' }); markDirty(); rerenderMain(isEdit); };
    all('[data-sp-del]').forEach((b) => b.onclick = () => { EDIT.params.splice(Number(b.getAttribute('data-sp-del')), 1); markDirty(); rerenderMain(isEdit); });

    // metafields
    all('[data-mfk]').forEach((el) => el.oninput = () => { const [ns, i] = el.getAttribute('data-mfk').split(':'); EDIT.metafields[ns][Number(i)].key = el.value; markDirty(); });
    all('[data-mft]').forEach((el) => el.oninput = () => { const [ns, i] = el.getAttribute('data-mft').split(':'); EDIT.metafields[ns][Number(i)].type = el.value; markDirty(); });
    all('[data-mfv]').forEach((el) => el.oninput = () => { const [ns, i] = el.getAttribute('data-mfv').split(':'); EDIT.metafields[ns][Number(i)].value = el.value; markDirty(); });
    all('[data-mf-add]').forEach((b) => b.onclick = () => { const ns = b.getAttribute('data-mf-add'); EDIT.metafields[ns].push({ key: '', type: 'Single line text', value: '' }); markDirty(); rerenderMain(isEdit); });
    all('[data-mf-del]').forEach((b) => b.onclick = () => { const [ns, i] = b.getAttribute('data-mf-del').split(':'); EDIT.metafields[ns].splice(Number(i), 1); markDirty(); rerenderMain(isEdit); });

    // settings rail
    const sa = q('#set-activate'); if (sa) sa.onclick = () => { EDIT.settings.activated = !EDIT.settings.activated; EDIT.settings.status = EDIT.settings.activated ? 'activated' : 'deactivated'; markDirty(); rerenderSide(isEdit); };
    bind('#set-spu', (v) => { EDIT.settings.spu = v; });
    bind('#set-weight', (v) => { EDIT.settings.weight = v === '' ? 0 : Number(v); });
    const sv = q('#set-vendor'); if (sv) sv.onchange = () => { EDIT.settings.vendor_id = sv.value === '' ? undefined : Number(sv.value); markDirty(); };
    const sc = q('#set-category'); if (sc) sc.onchange = () => { EDIT.settings.category = Number(sc.value); markDirty(); };
    const st = q('#set-template'); if (st) st.onchange = () => { EDIT.settings.homeTemplate = st.value; markDirty(); rerenderSide(isEdit); };
    const ti = q('#tag-input'); if (ti) ti.onkeydown = (e) => { if (e.key === 'Enter' && ti.value.trim()) { const v = ti.value.trim(); EDIT.settings.tags = EDIT.settings.tags || []; if (!EDIT.settings.tags.includes(v)) EDIT.settings.tags.push(v); markDirty(); rerenderSide(isEdit); } };
    all('[data-tag-del]').forEach((x) => x.onclick = () => { EDIT.settings.tags.splice(Number(x.getAttribute('data-tag-del')), 1); markDirty(); rerenderSide(isEdit); });
    const seo = q('[data-act="seo"]'); if (seo) seo.onclick = () => openSeoDrawer(isEdit);
    const design = q('[data-act="design"]'); if (design) design.onclick = () => toast('Visual template designer opens full-screen (roadmap)');

    // footer + bar actions
    const doSave = () => { DIRTY = false; const bar = document.getElementById('unsaved-bar'); if (bar) bar.style.display = 'none'; toast(isEdit ? 'Product updated' : 'Product added'); };
    const sb = q('[data-act="save"]'); if (sb) sb.onclick = doSave;
    const sbar = q('[data-act="save-bar"]'); if (sbar) sbar.onclick = doSave;
    const disc = q('[data-act="discard"]'); if (disc) disc.onclick = () => modal({
      title: 'Are you sure you want to discard changes?', width: 460, okText: 'Discard', danger: true,
      body: '<div class="muted" style="font-size:13.5px">All unsaved changes will be lost.</div>',
      onOk: (m, close) => { close(); renderEdit(EDIT_ID); },
    });
    const arc = q('[data-act="archive-one"]'); if (arc) arc.onclick = () => modal({
      title: 'Archive the product', width: 460, okText: 'Confirm',
      body: '<div class="muted" style="font-size:13.5px;line-height:1.6">Archiving hides this product from your sales channels. You can find it later with the Archived status filter.</div>',
      onOk: (m, close) => { EDIT.settings.archived = true; EDIT.settings.activated = false; close(); toast('Product archived'); renderEdit(EDIT_ID); },
    });
    const un = q('[data-act="unarchive"]'); if (un) un.onclick = () => { EDIT.settings.archived = false; EDIT.settings.status = 'deactivated'; toast('Product set as unarchived'); renderEdit(EDIT_ID); };
    const de = q('[data-act="destroy"]'); if (de) de.onclick = () => modal({
      title: 'Delete the product', width: 460, okText: 'Delete', danger: true,
      body: '<div class="muted" style="font-size:13.5px;line-height:1.6">This permanently deletes the product and cannot be undone.</div>',
      onOk: (m, close) => { close(); toast('Product deleted'); location.hash = '#/products'; },
    });
  }

  function rerenderMain(isEdit) {
    document.getElementById('edit-main').innerHTML =
      secProductInfo() + secImages() +
      (EDIT.hasVariants ? '' : secPricing() + secInventory()) +
      secVariants() + secSkuList() + secSpecifics() +
      (isEdit ? secMetafields('shop', 'Product metafields') + secMetafields('google', 'Google metafields') : '') +
      '<div class="flex justify-end gap-2 mt-2 mb-6">' +
        '<button class="btn btn-primary" data-act="save">' + (isEdit ? 'Update Product' : 'Add Product') + '</button>' +
        (EDIT.settings && EDIT.settings.archived ? '<button class="btn btn-default" style="color:var(--err);border-color:#f3c0b4" data-act="unarchive">Set product as unarchived</button><button class="btn btn-default" style="color:var(--err);border-color:#f3c0b4" data-act="destroy">Delete the product</button>'
          : (isEdit && EDIT.settings && !EDIT.settings.activated ? '<button class="btn btn-default" style="color:var(--err);border-color:#f3c0b4" data-act="archive-one">Archive the product</button>' : '')) +
      '</div>';
    document.getElementById('edit-side').innerHTML = secSettings(isEdit) + secSeo() + (isEdit ? secTemplate() : '');
    wireEdit(isEdit);
  }
  function rerenderSide(isEdit) {
    document.getElementById('edit-side').innerHTML = secSettings(isEdit) + secSeo() + (isEdit ? secTemplate() : '');
    // pricing/weight visibility depends on hasVariants but side only; rewire whole edit to keep handlers consistent
    wireEdit(isEdit);
  }

  // regenerate SKU rows from option combinations (SkuList.tsx generateCombinations)
  function rebuildSkusFromOptions() {
    const valid = (EDIT.attr || []).filter((o) => o.detail && o.detail.length > 0).map((o) => ({ name: o.value, values: o.detail.map((d) => d.value) }));
    if (!valid.length) { EDIT.attrValue = []; return; }
    const combos = [];
    const helper = (cur, idx) => { if (idx === valid.length) { combos.push(cur.join(' • ')); return; } valid[idx].values.forEach((v) => helper([...cur, v], idx + 1)); };
    helper([], 0);
    const prev = EDIT.attrValue || [];
    EDIT.attrValue = combos.map((title, i) => {
      const ex = prev.find((p) => p.title === title);
      return ex || { unique: 'V-new-' + i + '-' + Date.now(), title, image: '', sku: '', price: EDIT.price, ot_price: EDIT.compareAtPrice, cost: EDIT.itemCost, stock: undefined, weight: undefined, bar_code_number: '', is_show: 1, is_default_select: i === 0 ? 1 : 0 };
    });
    if (!EDIT.attrValue.some((v) => v.is_default_select === 1) && EDIT.attrValue[0]) EDIT.attrValue[0].is_default_select = 1;
  }

  // ================= MODALS / DRAWERS =================
  function modal({ title, body, width, okText, onOk, onCancel, danger }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + (title || '') + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn ' + (danger ? 'btn-default' : 'btn-primary') + '"' + (danger ? ' style="background:var(--err);color:#fff;border-color:var(--err)"' : '') + ' data-ok>' + (okText || 'Save') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    const cancel = () => { close(); if (onCancel) onCancel(); };
    m.querySelector('[data-x]').onclick = cancel;
    m.querySelector('[data-cancel]').onclick = cancel;
    backdrop.onclick = (e) => { if (e.target === backdrop) cancel(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    return { m, close };
  }

  // Variant display-order modal (VariantOrderModal) — reorder option values via up/down
  function openVariantOrderModal(isEdit) {
    const work = JSON.parse(JSON.stringify(EDIT.attr || []));
    const render = (m) => {
      m.querySelector('#vo-body').innerHTML = work.map((opt, oi) =>
        '<div style="margin-bottom:14px">' +
          '<div class="ctrl-label" style="text-transform:none">' + esc(opt.value || ('Option ' + (oi + 1))) + '</div>' +
          '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden">' +
            (opt.detail || []).map((d, vi) =>
              '<div class="flex items-center justify-between" style="padding:8px 12px;border-bottom:1px solid var(--hair)">' +
                '<span class="flex items-center gap-2" style="font-size:13.5px"><span class="muted">' + I.grip + '</span>' + esc(d.value) + '</span>' +
                '<span class="flex items-center gap-1">' +
                  '<button class="back-btn" style="width:26px;height:26px" data-vo-up="' + oi + ':' + vi + '"' + (vi === 0 ? ' disabled' : '') + '>↑</button>' +
                  '<button class="back-btn" style="width:26px;height:26px" data-vo-down="' + oi + ':' + vi + '"' + (vi === opt.detail.length - 1 ? ' disabled' : '') + '>↓</button>' +
                '</span>' +
              '</div>').join('') +
          '</div>' +
        '</div>').join('');
      m.querySelectorAll('[data-vo-up]').forEach((b) => b.onclick = () => { const [oi, vi] = b.getAttribute('data-vo-up').split(':').map(Number); const arr = work[oi].detail; [arr[vi - 1], arr[vi]] = [arr[vi], arr[vi - 1]]; render(m); });
      m.querySelectorAll('[data-vo-down]').forEach((b) => b.onclick = () => { const [oi, vi] = b.getAttribute('data-vo-down').split(':').map(Number); const arr = work[oi].detail; [arr[vi + 1], arr[vi]] = [arr[vi], arr[vi + 1]]; render(m); });
    };
    const ctrl = modal({
      title: 'Variant display order', width: 520, okText: 'Save',
      body: '<div class="muted" style="font-size:13px;margin-bottom:10px">Reorder how variant values appear on the storefront.</div><div id="vo-body"></div>',
      onOk: (m, close) => { EDIT.attr = work; rebuildSkusFromOptions(); markDirty(); close(); rerenderMain(isEdit); toast('Variant order saved'); },
    });
    render(ctrl.m);
  }

  // Edit attribute modal (editAttr) — rename option + manage its values
  function openEditAttrModal(oi, isEdit) {
    const opt = JSON.parse(JSON.stringify(EDIT.attr[oi] || { value: '', detail: [] }));
    const render = (m) => {
      m.querySelector('#ea-vals').innerHTML = (opt.detail || []).map((d, vi) =>
        '<div class="flex items-center gap-2 mb-2"><input class="input" data-ea-val="' + vi + '" value="' + esc(d.value) + '" style="flex:1" />' +
        '<button class="back-btn" data-ea-del="' + vi + '" style="width:34px;height:34px;color:var(--err)">' + I.trash + '</button></div>').join('');
      m.querySelectorAll('[data-ea-val]').forEach((el) => el.oninput = () => { opt.detail[Number(el.getAttribute('data-ea-val'))].value = el.value; });
      m.querySelectorAll('[data-ea-del]').forEach((b) => b.onclick = () => { opt.detail.splice(Number(b.getAttribute('data-ea-del')), 1); render(m); });
    };
    const ctrl = modal({
      title: 'Edit option', width: 520, okText: 'Save',
      body: '<div class="mb-3">' + lbl('Option name') + '<input class="input" id="ea-name" value="' + esc(opt.value) + '" placeholder="e.g. Color" style="margin-top:4px" /></div>' +
        '<div>' + lbl('Values') + '<div id="ea-vals" style="margin-top:4px"></div>' +
        '<button class="btn btn-default" id="ea-add">' + I.plus + ' Add value</button></div>',
      onOk: (m, close) => { opt.value = m.querySelector('#ea-name').value; EDIT.attr[oi] = opt; rebuildSkusFromOptions(); markDirty(); close(); rerenderMain(isEdit); },
    });
    ctrl.m.querySelector('#ea-add').onclick = () => { opt.detail = opt.detail || []; opt.detail.push({ value: '' }); render(ctrl.m); };
    render(ctrl.m);
  }

  // Variant metafields modal (MetafieldEditor in AntModal)
  function openVariantMetafieldModal(variant, ns) {
    const title = ns === 'google' ? 'Google Metafields' : 'Variant Metafields';
    const rows = [
      { key: 'gtin', type: 'Single line text', value: variant.bar_code_number || '' },
      { key: 'condition', type: 'Single line text', value: 'New' },
    ];
    const body =
      '<div class="muted" style="font-size:13px;margin-bottom:10px">Variant: <span class="subtle" style="font-weight:500">' + esc(variant.title) + '</span> &nbsp;·&nbsp; namespace: ' + ns + '</div>' +
      '<table class="tbl" style="font-size:13px"><thead><tr><th>Key</th><th>Type</th><th>Value</th></tr></thead><tbody>' +
        rows.map((r) => '<tr><td><input class="input" style="height:30px" value="' + esc(r.key) + '" /></td><td><input class="input" style="height:30px" value="' + esc(r.type) + '" list="mf-types2" /></td><td><input class="input" style="height:30px" value="' + esc(r.value) + '" /></td></tr>').join('') +
      '</tbody></table><datalist id="mf-types2">' + D.METAFIELD_TYPES.map((t) => '<option value="' + t + '">').join('') + '</datalist>';
    modal({ title, width: 720, okText: 'Save', body, onOk: (m, close) => { close(); toast('Variant metafields saved'); } });
  }

  // SEO drawer (settings.tsx SEO Drawer) — right slide-in
  function openSeoDrawer(isEdit) {
    const s = EDIT.settings || {};
    const base = 'https://www.bestvoy.com/listing/' + (EDIT.product_id || '{id}') + '/';
    const form = { metaTitle: s.metaTitle || EDIT.name || '', metaDescription: s.metaDescription || EDIT.description || '', urlHandle: s.urlHandle || '', seoKeywords: (s.seoKeywords || []).slice() };
    const backdrop = h('<div class="drawer-backdrop"></div>');
    const drawer = h('<div class="drawer" style="width:480px"></div>');
    const kwHtml = () => form.seoKeywords.map((k, i) => '<span class="field-pill" style="background:#dbeafe;border-color:#bfdbfe;color:#1e40af">' + esc(k) + ' <span class="x" data-kw-del="' + i + '">&times;</span></span>').join('');
    const preview = () =>
      '<div class="muted" style="font-size:12px;word-break:break-all">' + base + esc(form.urlHandle) + '</div>' +
      '<div style="font-size:13.5px;color:var(--brand);word-break:break-word;margin-top:2px">' + esc(form.metaTitle || 'Blank Title') + '</div>' +
      '<div class="muted" style="font-size:13px;word-break:break-word;margin-top:2px">' + esc(form.metaDescription || 'Blank Description') + '</div>';
    drawer.innerHTML =
      '<div class="drawer-head"><span>Search engine optimization</span><span class="drawer-x" data-x>' + I.x + '</span></div>' +
      '<div class="drawer-body">' +
        '<div class="mb-4"><div class="card-title mb-2">Preview</div><div id="seo-preview">' + preview() + '</div></div>' +
        '<div class="divider mb-4"></div>' +
        '<div class="mb-4">' + lbl('Page title') + '<input class="input" id="seo-title" value="' + esc(form.metaTitle) + '" placeholder="Product Title" style="margin-top:4px" /></div>' +
        '<div class="mb-4">' + lbl('Meta description') + '<textarea class="input" id="seo-desc" rows="4" placeholder="Product Description" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(form.metaDescription) + '</textarea></div>' +
        '<div class="mb-4">' + lbl('URL') + '<div class="muted" style="font-size:11px;margin:4px 0">' + base + '</div><input class="input" id="seo-url" value="' + esc(form.urlHandle) + '" placeholder="product-colour-size" /></div>' +
        '<div>' + lbl('SEO keywords') + '<div class="flex items-center gap-2" style="flex-wrap:wrap;min-height:34px;border:1px solid var(--ctl);border-radius:8px;padding:5px 8px;margin-top:4px;background:#fff" id="seo-kwbox">' + kwHtml() +
          '<input id="seo-kw" placeholder="Press Enter to add a keyword" style="border:0;outline:0;background:transparent;flex:1;min-width:120px;font-size:13px" /></div></div>' +
      '</div>' +
      '<div class="drawer-foot" style="justify-content:flex-end"><button class="btn btn-default" data-x2>Cancel</button><button class="btn btn-primary" data-confirm>Confirm</button></div>';
    backdrop.appendChild(drawer); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    const syncPreview = () => { drawer.querySelector('#seo-preview').innerHTML = preview(); };
    const rewireKw = () => drawer.querySelectorAll('[data-kw-del]').forEach((x) => x.onclick = () => { form.seoKeywords.splice(Number(x.getAttribute('data-kw-del')), 1); drawer.querySelector('#seo-kwbox').querySelectorAll('.field-pill').forEach((e) => e.remove()); drawer.querySelector('#seo-kw').insertAdjacentHTML('beforebegin', kwHtml()); rewireKw(); });
    drawer.querySelector('[data-x]').onclick = close;
    drawer.querySelector('[data-x2]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    drawer.querySelector('#seo-title').oninput = (e) => { form.metaTitle = e.target.value; if (EDIT_ID === 'new') { form.urlHandle = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); drawer.querySelector('#seo-url').value = form.urlHandle; } syncPreview(); };
    drawer.querySelector('#seo-desc').oninput = (e) => { form.metaDescription = e.target.value; syncPreview(); };
    drawer.querySelector('#seo-url').oninput = (e) => { form.urlHandle = e.target.value; syncPreview(); };
    drawer.querySelector('#seo-kw').onkeydown = (e) => { if (e.key === 'Enter' && e.target.value.trim()) { const v = e.target.value.trim(); if (!form.seoKeywords.includes(v)) { form.seoKeywords.push(v); e.target.insertAdjacentHTML('beforebegin', '<span class="field-pill" style="background:#dbeafe;border-color:#bfdbfe;color:#1e40af">' + esc(v) + ' <span class="x" data-kw-del="' + (form.seoKeywords.length - 1) + '">&times;</span></span>'); rewireKw(); } e.target.value = ''; } };
    drawer.querySelector('[data-confirm]').onclick = () => {
      EDIT.settings.metaTitle = form.metaTitle; EDIT.settings.metaDescription = form.metaDescription;
      EDIT.settings.urlHandle = form.urlHandle; EDIT.settings.seoKeywords = form.seoKeywords.slice();
      markDirty(); close(); rerenderSide(EDIT_ID !== 'new'); toast('SEO settings saved');
    };
    rewireKw();
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
    if (rest) renderEdit(decodeURIComponent(rest));
    else renderList();
  }

  // small CSS shim for the on/off switch used in tables/settings (kept module-scoped)
  const style = document.createElement('style');
  style.textContent =
    '.sw{position:relative;display:inline-block;width:34px;height:18px;border-radius:9999px;background:var(--ctl);cursor:pointer;transition:background .15s;flex:none}' +
    '.sw::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}' +
    '.sw.on{background:var(--brand)}.sw.on::after{transform:translateX(16px)}' +
    '.pr-row-meta{font-size:12px;color:var(--ink-muted)}';
  document.head.appendChild(style);

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.products = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
