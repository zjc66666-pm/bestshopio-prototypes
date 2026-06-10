/* BestShopio Admin · Collections prototype — list + edit, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin
   .../products/components/collections/* (collectionsList, table, collectionEdit,
   CollectionProductsTable, CollectionSubCollectionsTable, ProductSelect). */
(function () {
  const D = window.DATA_COLLECTIONS;
  let root; // set by the SPA shell router via VIEWS.collections.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);
  const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    trash: svg('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', 15),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 16),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>', 14),
    alert: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><circle cx="12" cy="16" r=".6" fill="currentColor"/>', 14),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };
  // ---- close any open floating popovers (price range / status multi-select) ----
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((el) => el.remove());

  // ---- product status (getProductStatus: is_del -> archived, is_show -> activated, else deactivated) ----
  const productStatus = (p) => p.is_del === 1 ? 'Archived' : (p.is_show === 1 ? 'Activated' : 'Deactivated');
  const priceText = (p) => {
    const lo = Number(p.price_min != null ? p.price_min : p.price || 0);
    const hi = Number(p.price_max != null ? p.price_max : p.price || 0);
    return (!hi || lo === hi) ? money(lo) : money(lo) + ' ~ ' + money(hi);
  };
  // inventory cell (renderInventoryStatus): "N on sale · K variants" + out-of-stock pill
  const inventoryHtml = (p) => {
    const stock = p.on_sale_stock || 0;
    const vc = p.variant_count || 0;
    const base = stock + ' on sale' + (p.spec_type === 1 && vc > 0 ? ' &middot; ' + vc + ' variant' + (vc > 1 ? 's' : '') : '');
    if (p.inventory_status === 1) return '<span>' + base + '</span> <span class="pill pill-orange" style="padding:2px 9px;font-size:11.5px"><span class="dot"></span>Out of stock</span>';
    if (p.inventory_status === 2) return '<span>' + base + '</span> <span class="pill pill-orange" style="padding:2px 9px;font-size:11.5px"><span class="dot"></span>Partial - Out of stock</span>';
    return '<span>' + base + '</span>';
  };
  const prodImg = (p, size) => {
    size = size || 40;
    return p.image
      ? '<div style="height:' + size + 'px;width:' + size + 'px;flex:none;border-radius:6px;overflow:hidden;background:#f3f4f6"><img src="' + p.image + '" alt="" style="height:100%;width:100%;object-fit:cover" /></div>'
      : '<div style="height:' + size + 'px;width:' + size + 'px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#e5e7eb;color:#9ca3af;font-size:11px">IMG</div>';
  };
  const sortLabel = (v) => (D.SORT_ORDERS.find((o) => o.value === v) || {}).label || 'Custom';

  // ================= LIST VIEW (collectionsList.tsx + table.tsx + search.tsx) =================
  const LST = { kwType: 'name', kw: '', kwApplied: '', sortDir: '', page: 1, size: 20, sel: {} };

  function listRows() {
    let rows = D.COLLECTIONS.slice();
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((c) => (c.name || '').toLowerCase().includes(q));
    }
    if (LST.sortDir === 'asc') rows.sort((a, b) => a.product_count - b.product_count);
    else if (LST.sortDir === 'desc') rows.sort((a, b) => b.product_count - a.product_count);
    return rows;
  }

  // empty state (emptyState.tsx) — only when the store has zero collections and no search filter
  function renderEmptyState() {
    const card = (hex) =>
      '<div style="height:128px;width:96px;overflow:hidden;border-radius:8px;border:1px solid var(--hair);background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.05)">' +
        '<div style="height:80px;background:' + hex + '"></div>' +
        '<div style="padding:8px"><div style="height:8px;border-radius:4px;background:#e5e7eb;margin-bottom:6px"></div><div style="height:8px;width:75%;border-radius:4px;background:#e5e7eb"></div></div>' +
      '</div>';
    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Collections</h1>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 16px">' +
        '<div style="margin-bottom:32px"><div class="flex items-center gap-3">' +
          '<div class="flex gap-2">' + card('#60a5fa') + card('#d1d5db') + card('#fde047') + '</div>' +
          '<div style="display:flex;height:128px;width:96px;align-items:center;justify-content:center;border-radius:8px;border:2px dashed #93c5fd;background:#eff6ff">' +
            '<div style="display:flex;height:48px;width:48px;align-items:center;justify-content:center;border-radius:9999px;background:#3b82f6;color:#fff">' + I.plus + '</div>' +
          '</div>' +
        '</div></div>' +
        '<h2 style="margin:0 0 12px;font-size:22px;font-weight:600;color:var(--ink)">Add and manage product collections</h2>' +
        '<p style="margin:0 0 32px;max-width:28rem;text-align:center;color:var(--ink-body);font-size:14px">Make it easier for customers to find what they want by grouping products in commonly-known collections.</p>' +
        '<button class="btn btn-primary" data-act="add" style="height:40px;padding:0 18px">Add collection</button>' +
      '</div>';
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  function renderList() {
    // empty state mirrors isEmptyState: data loaded, 0 records, no search condition
    if (D.COLLECTIONS.length === 0 && !LST.kwApplied) { renderEmptyState(); return; }
    const rows = listRows();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const fieldOpts = D.SEARCH_FIELDS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const sortArrow = '<span class="sort-caret"><span style="color:' + (LST.sortDir === 'asc' ? 'var(--brand)' : 'var(--ctl)') + '">▲</span><span style="color:' + (LST.sortDir === 'desc' ? 'var(--brand)' : 'var(--ctl)') + '">▼</span></span>';
    const sortTip = LST.sortDir === '' ? 'Click to sort ascending' : LST.sortDir === 'asc' ? 'Click to sort descending' : 'Click to cancel sorting';

    const tag = LST.kwApplied
      ? '<div class="flex gap-2 mt-3" id="filter-tags"><span class="field-pill" data-clear="kw">Collection name: ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span></div>'
      : '';

    const allOnPageSel = pageRows.length > 0 && pageRows.every((c) => LST.sel[c.id]);

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Collections</h1>' +
        '<button class="btn btn-primary" data-act="add">Add collection</button>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px"><div class="tab active">All<span class="count-badge">' + D.COLLECTIONS.length + '</span></div></div>' +
        // search bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex">' +
            '<select class="filter-select" id="kw-type" style="width:160px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
            '<div style="position:relative;width:268px">' +
              '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
              '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
            '</div>' +
          '</div>' +
          tag +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:760px">' +
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="sel-all" ' + (allOnPageSel ? 'checked' : '') + ' style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></th>' +
            '<th>Collection name</th>' +
            '<th style="width:150px">Type</th>' +
            '<th style="width:200px;cursor:pointer;user-select:none" id="sort-pc" data-tip="' + sortTip + '">Product quantity' + sortArrow + '</th>' +
            '<th style="width:150px">Action</th>' +
          '</tr></thead>' +
          '<tbody id="col-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="5" style="text-align:center;padding:40px" class="muted">No collections match your search.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + total + ' records</span>' +
          pagerHtml(LST.page, pages) +
        '</div>' +
      '</div>';

    wireList();
  }

  function rowHtml(c) {
    const checked = LST.sel[c.id] ? 'checked' : '';
    return '<tr data-id="' + c.id + '">' +
      '<td data-stop><input type="checkbox" class="row-sel" data-id="' + c.id + '" ' + checked + ' style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></td>' +
      '<td><div class="flex items-center gap-2">' + prodImg({ image: c.image_url }, 40) +
        '<span style="color:var(--ink);font-weight:500">' + esc(c.name) + '</span></div></td>' +
      '<td style="color:var(--ink)">' + esc(c.type || 'manual') + '</td>' +
      '<td style="color:var(--ink)">' + c.product_count + '</td>' +
      '<td data-stop><button class="back-btn" data-view="' + c.id + '" title="View/Edit" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
      item('&lsaquo;', page - 1, { disabled: page <= 1 }) + nums + item('&rsaquo;', page + 1, { disabled: page >= pages }) +
      '<select class="pg-size" id="pg-size">' +
        ['10', '20', '50', '100'].map((s) => '<option value="' + s + '"' + (Number(s) === LST.size ? ' selected' : '') + '>' + s + ' / page</option>').join('') +
      '</select>' +
    '</div>';
  }

  function wireList() {
    const kwType = root.querySelector('#kw-type');
    const kwInput = root.querySelector('#kw-input');
    if (kwType) kwType.onchange = () => { LST.kwType = kwType.value; };
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    const sp = root.querySelector('#sort-pc');
    if (sp) sp.onclick = () => { LST.sortDir = LST.sortDir === 'asc' ? 'desc' : (LST.sortDir === 'desc' ? '' : 'asc'); renderList(); };
    const tg = root.querySelector('#filter-tags [data-clear="kw"]');
    if (tg) tg.onclick = () => { LST.kw = ''; LST.kwApplied = ''; LST.page = 1; renderList(); };
    const ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row click opens detail, except clicks inside interactive cells ([data-stop])
    root.querySelectorAll('#col-tbody tr[data-id]').forEach((tr) => tr.onclick = (e) => { if (e.target.closest('[data-stop]')) return; goEdit(tr.getAttribute('data-id')); });
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goEdit(b.getAttribute('data-view')); });
    // selection checkboxes (rowSelection in table.tsx) — select-all toggles current page
    const selAll = root.querySelector('#sel-all');
    if (selAll) selAll.onchange = () => { listRows().slice((LST.page - 1) * LST.size, (LST.page - 1) * LST.size + LST.size).forEach((c) => { if (selAll.checked) LST.sel[c.id] = true; else delete LST.sel[c.id]; }); renderList(); };
    root.querySelectorAll('.row-sel').forEach((cb) => cb.onchange = () => { const id = Number(cb.getAttribute('data-id')); if (cb.checked) LST.sel[id] = true; else delete LST.sel[id]; const sa = root.querySelector('#sel-all'); if (sa) { const pageRows = listRows().slice((LST.page - 1) * LST.size, (LST.page - 1) * LST.size + LST.size); sa.checked = pageRows.length > 0 && pageRows.every((c) => LST.sel[c.id]); } });
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  // ================= EDIT VIEW (collectionEdit.tsx) =================
  // working-copy state for the open editor; ST mirrors formData + products + sub_collections.
  let ST = null;
  let ORIG = null;

  function blankState() {
    return {
      id: null, name: '', handle: '', description: '', image: '',
      seo_title: '', seo_description: '', seo_keywords: [], template: 'default',
      sortOrder: 'custom', subSortOrder: 'custom',
      products: [], subCollections: [],
    };
  }

  function stateFromDetail(detail) {
    return {
      id: detail.id,
      name: detail.name || '',
      handle: detail.handle || '',
      description: detail.description || '',
      image: detail.image_url || '',
      seo_title: detail.seo_title != null ? detail.seo_title : (detail.name || ''),
      seo_description: detail.seo_description != null ? detail.seo_description : (detail.description || ''),
      seo_keywords: (detail.seo_keywords || []).slice(),
      template: detail.template || 'default',
      sortOrder: detail.sort_order || 'custom',
      subSortOrder: detail.sub_sort_order || 'custom',
      products: (detail.products || []).map((p, i) => Object.assign({}, p, { sort_order: p.sort_order != null ? p.sort_order : i + 1 })),
      subCollections: (detail.sub_collections || []).map((s, i) => Object.assign({}, s, { sort_order: s.sort_order != null ? s.sort_order : i + 1 })),
    };
  }

  const snapshot = (s) => JSON.stringify({
    name: s.name, handle: s.handle, description: s.description, image: s.image,
    seo_title: s.seo_title, seo_description: s.seo_description, seo_keywords: s.seo_keywords,
    sortOrder: s.sortOrder, subSortOrder: s.subSortOrder,
    products: s.products.map((p) => ({ id: p.product_id, sort: p.sort_order })),
    subs: s.subCollections.map((c) => ({ id: c.id, sort: c.sort_order })),
  });
  const isDirty = () => ST && ORIG !== snapshot(ST);

  function renderEdit(id) {
    const isNew = id === '0' || id === 0;
    if (isNew) { ST = blankState(); }
    else {
      const detail = D.DETAILS[id] || D.DETAILS[Number(id)];
      if (!detail) { renderMissing(id); return; }
      ST = stateFromDetail(detail);
    }
    ORIG = snapshot(ST);
    paintEdit(isNew);
  }

  function paintEdit(isNew) {
    const dirty = isDirty();
    const title = isNew ? 'Add collection' : (ST.name.trim() || 'Edit collection');
    const confirmText = isNew ? 'Add collection' : 'Update collection';

    root.innerHTML =
      // unsaved-changes warning bar (UnSavedChanges) — sticky top
      (dirty ? unsavedBar(isNew) : '') +
      // fixed 1200px centered container (matches real admin)
      '<div class="detail-wrap">' +
        // header
        '<div class="flex items-center gap-3 mb-5">' +
          '<button class="back-btn" data-act="back" title="Back to collections">' + I.arrowLeft + '</button>' +
          '<h1 class="page-title">' + esc(title) + '</h1>' +
        '</div>' +
        // two-column layout: main + 275px rail
        '<div class="detail-cols">' +
          '<div class="detail-main">' +
            detailsCard() +
            typeCard() +
            productsCard() +
            subCollectionsCard() +
            '<div class="flex justify-end gap-2 mt-5">' +
              '<button class="btn btn-primary" data-act="save">' + confirmText + '</button>' +
              (isNew ? '' : '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:#f3c4b8">Delete the collection</button>') +
            '</div>' +
          '</div>' +
          '<div class="detail-rail">' +
            seoCard() +
            imageCard() +
            templateCard() +
          '</div>' +
        '</div>' +
      '</div>';

    wireEdit(isNew);
  }

  // Unsaved-changes bar — shared full-width top bar (UI.unsavedBar). Rendered only
  // when dirty (see paintEdit), so it renders visible (show:true).
  function unsavedBar(isNew) {
    return window.UI.unsavedBar({ saveLabel: isNew ? 'Add' : 'Update', saveAct: 'save', show: true });
  }

  // ---- Collection details (name + rich description) ----
  function detailsCard() {
    return '<div class="panel card-pad mb-5">' +
      '<div class="card-title mb-3">Collection details</div>' +
      '<div class="mb-4">' +
        '<label class="ctrl-label" style="text-transform:none">Collection name <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="f-name" maxlength="100" placeholder="Example: Best Sellers, New Arrival, Summer collection, Under $100, Staff picks" value="' + esc(ST.name) + '" />' +
        '<div id="f-name-err" style="color:var(--err);font-size:12px;margin-top:4px;display:none">Can\'t be blank</div>' +
      '</div>' +
      '<div>' +
        '<label class="ctrl-label" style="text-transform:none">Collection description</label>' +
        // lightweight rich-text stand-in: a toolbar strip + editable area (RichTextEditor)
        '<div class="ql-wrap">' +
          '<div class="ql-head" style="gap:10px;justify-content:flex-start">' +
            ['B', 'I', 'U', 'S'].map((b) => '<span style="font-weight:600;color:var(--ink-muted);cursor:default;font-size:13px">' + b + '</span>').join('') +
            '<span style="color:var(--hair)">|</span>' +
            '<span class="ql-name">Rich text</span>' +
          '</div>' +
          '<textarea class="ql-editor" id="f-desc" placeholder="Describe this collection for shoppers" style="min-height:120px">' + esc(ST.description) + '</textarea>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- Collection type (Manual only) ----
  function typeCard() {
    return '<div class="panel card-pad mb-5">' +
      '<div class="card-title mb-3">Collection type</div>' +
      '<label class="flex items-start gap-2" style="cursor:default">' +
        '<input type="radio" checked disabled style="margin-top:3px;accent-color:var(--brand)" />' +
        '<span><span style="color:var(--ink);font-weight:500">Manual</span>' +
          '<div class="muted" style="font-size:13px;margin-top:2px">Add products to this collection one by one</div></span>' +
      '</label>' +
    '</div>';
  }

  // ---- Collection products (sort select + add-products + table) ----
  function productsCard() {
    const sortOpts = D.SORT_ORDERS.map((o) => '<option value="' + o.value + '"' + (o.value === ST.sortOrder ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const rows = sortedProducts();
    const canDrag = ST.sortOrder === 'custom';

    const body = rows.length
      ? '<div style="overflow-x:auto"><table class="tbl" style="min-width:760px"><thead><tr>' +
          '<th style="width:80px">No.</th><th style="width:240px">Product</th>' +
          '<th style="width:300px">Inventory quantity</th><th style="width:150px">Price</th>' +
          '<th style="width:130px">Status</th><th style="width:70px">Action</th>' +
        '</tr></thead><tbody id="cp-tbody">' +
          rows.map((p, idx) => productRowHtml(p, idx, canDrag)).join('') +
        '</tbody></table></div>'
      : '<div style="border:1px dashed var(--ctl);border-radius:8px;background:var(--panel);padding:40px 24px;text-align:center">' +
          '<div style="color:var(--ink);font-weight:500;font-size:13.5px">Add products to the collection</div>' +
          '<div class="muted" style="font-size:13px;margin-top:6px">Products added will be displayed here.</div>' +
          '<button class="btn btn-primary" data-act="add-products" style="margin-top:14px">Add products</button>' +
        '</div>';

    return '<div class="panel card-pad mb-5">' +
      '<div class="flex items-center justify-between mb-3" style="flex-wrap:wrap;gap:8px">' +
        '<div class="card-title" style="font-size:16px">Collection products</div>' +
        '<div class="flex items-center gap-3">' +
          '<div class="flex items-center gap-2"><span class="muted" style="font-size:13px">Sort:</span>' +
            '<select class="filter-select" id="cp-sort" style="width:200px">' + sortOpts + '</select></div>' +
          '<button class="btn btn-primary" data-act="add-products">Add products</button>' +
        '</div>' +
      '</div>' +
      body +
    '</div>';
  }

  function sortedProducts() {
    const list = ST.products.slice();
    const labelOf = (p) => (p.store_name || p.name || '').trim();
    const hi = (p) => Number(p.price_max != null ? p.price_max : (p.price != null ? p.price : p.price_min) || 0);
    const lo = (p) => Number(p.price_min != null ? p.price_min : (p.price != null ? p.price : p.price_max) || 0);
    const ts = (p) => p.create_time ? Date.parse(String(p.create_time).replace(' ', 'T')) || 0 : 0;
    const stable = (a, b) => (a.sort_order || 0) - (b.sort_order || 0);
    switch (ST.sortOrder) {
      case 'highest_price': list.sort((a, b) => hi(b) - hi(a) || stable(a, b)); break;
      case 'lowest_price': list.sort((a, b) => lo(a) - lo(b) || stable(a, b)); break;
      case 'product_title_az': list.sort((a, b) => labelOf(a).localeCompare(labelOf(b), undefined, { numeric: true, sensitivity: 'base' }) || stable(a, b)); break;
      case 'product_title_za': list.sort((a, b) => labelOf(b).localeCompare(labelOf(a), undefined, { numeric: true, sensitivity: 'base' }) || stable(a, b)); break;
      case 'newest': list.sort((a, b) => ts(b) - ts(a) || stable(a, b)); break;
      case 'oldest': list.sort((a, b) => ts(a) - ts(b) || stable(a, b)); break;
      default: list.sort(stable);
    }
    return list;
  }

  function productRowHtml(p, idx, canDrag) {
    const grip = canDrag
      ? '<span class="cp-grip" draggable="true" data-idx="' + idx + '" title="Drag to reorder" style="cursor:grab;color:#9ca3af;display:inline-flex">' + I.grip + '</span>'
      : '';
    return '<tr data-idx="' + idx + '" data-pid="' + p.product_id + '">' +
      '<td><div class="flex items-center gap-2">' + grip + '<span style="color:var(--ink)">' + (idx + 1) + '</span></div></td>' +
      '<td><div class="flex items-center gap-2">' + prodImg(p, 40) + '<span style="color:var(--ink)">' + esc(p.store_name || p.name) + '</span></div></td>' +
      '<td class="muted" style="font-size:13px">' + inventoryHtml(p) + '</td>' +
      '<td>' + priceText(p) + '</td>' +
      '<td style="color:var(--ink)">' + productStatus(p) + '</td>' +
      '<td><button class="back-btn cp-del" data-pid="' + p.product_id + '" title="Remove" style="width:30px;height:30px;background:transparent;color:var(--err)">' + I.trash + '</button></td>' +
    '</tr>';
  }

  // ---- Sub-collections (nesting + reorder) ----
  function subCollectionsCard() {
    const rows = ST.subCollections.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    if (!rows.length) {
      return '<div class="panel card-pad mb-5">' +
        '<div class="card-title mb-3" style="font-size:16px">Sub-collections</div>' +
        '<div style="border:1px dashed var(--ctl);border-radius:8px;background:var(--panel);padding:40px 24px;text-align:center">' +
          '<div class="muted" style="font-size:13px">Link other collections to create a navigation menu at the top of this collection page.</div>' +
          '<button class="btn btn-primary" data-act="add-collections" style="margin-top:14px">Add collections</button>' +
        '</div>' +
      '</div>';
    }
    return '<div class="panel card-pad mb-5">' +
      '<div class="flex items-center justify-between mb-3" style="flex-wrap:wrap;gap:8px">' +
        '<div class="card-title" style="font-size:16px">Sub-collections</div>' +
        '<div class="flex items-center gap-3">' +
          '<div class="flex items-center gap-2"><span class="muted" style="font-size:13px">Sort:</span>' +
            '<select class="filter-select" id="sc-sort" style="width:160px"><option value="custom" selected>Custom</option></select></div>' +
          '<button class="btn btn-primary" data-act="add-collections">Add collections</button>' +
        '</div>' +
      '</div>' +
      '<div style="overflow-x:auto"><table class="tbl" style="min-width:620px"><thead><tr>' +
        '<th style="width:100px">No.</th><th>Collection name</th>' +
        '<th style="width:140px">Type</th><th style="width:160px">Product quantity</th><th style="width:80px">Action</th>' +
      '</tr></thead><tbody id="sc-tbody">' +
        rows.map((c, idx) => subRowHtml(c, idx)).join('') +
      '</tbody></table></div>' +
    '</div>';
  }

  function subRowHtml(c, idx) {
    return '<tr data-idx="' + idx + '" data-cid="' + c.id + '">' +
      '<td><div class="flex items-center gap-2">' +
        '<span class="sc-grip" draggable="true" data-idx="' + idx + '" title="Drag to reorder" style="cursor:grab;color:#9ca3af;display:inline-flex">' + I.grip + '</span>' +
        '<span>' + (idx + 1) + '</span></div></td>' +
      '<td><div class="flex items-center gap-3">' + prodImg({ image: c.image_url || c.image }, 40) +
        '<span style="color:var(--ink)">' + esc(c.name) + '</span></div></td>' +
      '<td>' + esc(c.type || 'manual') + '</td>' +
      '<td>' + (c.product_count != null ? c.product_count : (c.product_quantity || 0)) + '</td>' +
      '<td><button class="back-btn sc-del" data-cid="' + c.id + '" title="Remove" style="width:30px;height:30px;background:transparent;color:var(--err)">' + I.trash + '</button></td>' +
    '</tr>';
  }

  // ---- right sidebar: SEO summary ----
  function seoCard() {
    const url = D.DOMAIN + '/collections/' + (ST.handle || 'handle');
    const pageTitle = ST.seo_title || ST.name || 'Page title';
    const metaDesc = (ST.seo_description || ST.description || '').replace(/<[^>]+>/g, ' ').trim() || 'Meta description';
    return '<div class="panel card-pad mb-5">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div style="font-size:14px;font-weight:600;color:var(--ink)">Search engine optimization</div>' +
        '<button class="back-btn" data-act="edit-seo" title="Edit SEO" style="width:28px;height:28px;background:transparent;color:var(--ink-muted)">' + I.pencil + '</button>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--ink-muted);word-break:break-all;margin-bottom:6px">' + esc(url) + '</div>' +
      '<div style="font-size:13.5px;color:var(--brand);word-break:break-all;margin-bottom:2px">' + esc(pageTitle) + '</div>' +
      '<div style="font-size:13px;color:var(--ink-body);word-break:break-word">' + esc(metaDesc) + '</div>' +
    '</div>';
  }

  // ---- right sidebar: cover image ----
  function imageCard() {
    const body = ST.image
      ? '<div style="position:relative">' +
          '<div style="height:200px;display:flex;align-items:center;justify-content:center;border:1px solid var(--hair);border-radius:8px;background:#f9fafb;overflow:hidden"><img src="' + ST.image + '" alt="" style="max-height:100%;max-width:100%;object-fit:contain" /></div>' +
          '<button class="back-btn" data-act="rm-image" title="Remove image" style="position:absolute;top:8px;right:8px;width:30px;height:30px;background:rgba(0,0,0,.55);color:#fff">' + I.x + '</button>' +
          '<div class="muted" style="font-size:12px;margin-top:8px">Supports files in jpg/jpeg/png formats. Files smaller than 4MB work better.</div>' +
        '</div>'
      : '<div>' +
          '<div style="min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed var(--ctl);border-radius:8px;background:var(--panel)">' +
            '<button class="btn btn-primary" data-act="add-image">Add image</button>' +
          '</div>' +
          '<div class="muted" style="font-size:12px;margin-top:8px">Supports files in jpg/jpeg/png formats. Files smaller than 4MB work better.</div>' +
        '</div>';
    return '<div class="panel card-pad mb-5"><div style="font-weight:600;color:var(--ink);margin-bottom:12px">Image</div>' + body + '</div>';
  }

  // ---- right sidebar: theme template ----
  function templateCard() {
    const opts = D.TEMPLATES.map((o) => '<option value="' + o.value + '"' + (o.value === ST.template ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    return '<div class="panel card-pad mb-5"><div style="font-weight:600;color:var(--ink);margin-bottom:12px">Theme template</div>' +
      '<select class="input" id="f-template" style="height:36px">' + opts + '</select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you\'d like the page to look like</div>' +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Collection #' + esc(id) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Detail not available in this prototype</div>' +
        '<div class="muted">Open one of the collections flagged with sample detail: Best Sellers, New Arrivals, Summer Collection or Clearance.</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/collections'; };
  }

  // ---- repaint just the dirty bar + cards in place (keeps scroll position on field edits) ----
  function refreshEdit() {
    const isNew = ST.id == null;
    paintEdit(isNew);
  }

  function wireEdit(isNew) {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = tryLeave;
    // name + description + handle/template
    const name = root.querySelector('#f-name');
    if (name) {
      name.oninput = () => {
        const prevSynced = ST.seo_title === '' || ST.seo_title === ST._lastName;
        ST.name = name.value;
        if (isNew) ST.handle = slugify(name.value);     // new: handle follows name
        if (prevSynced) ST.seo_title = name.value;        // page title follows name until edited
        ST._lastName = name.value;
        updateDirtyBar(); updateSeoCard();
      };
    }
    const desc = root.querySelector('#f-desc');
    if (desc) desc.oninput = () => {
      const prevSynced = ST.seo_description === '' || ST.seo_description === ST._lastDesc;
      ST.description = desc.value;
      if (prevSynced) ST.seo_description = desc.value;
      ST._lastDesc = desc.value;
      updateDirtyBar(); updateSeoCard();
    };
    const tmpl = root.querySelector('#f-template'); if (tmpl) tmpl.onchange = () => { ST.template = tmpl.value; updateDirtyBar(); };
    // product sort
    const cpSort = root.querySelector('#cp-sort'); if (cpSort) cpSort.onchange = () => { ST.sortOrder = cpSort.value; refreshEdit(); };
    // add products / collections
    root.querySelectorAll('[data-act="add-products"]').forEach((b) => b.onclick = openProductPicker);
    root.querySelectorAll('[data-act="add-collections"]').forEach((b) => b.onclick = openCollectionPicker);
    // delete product rows
    root.querySelectorAll('.cp-del').forEach((b) => b.onclick = () => { ST.products = ST.products.filter((p) => p.product_id !== Number(b.getAttribute('data-pid'))); reindexProducts(); refreshEdit(); });
    root.querySelectorAll('.sc-del').forEach((b) => b.onclick = () => { ST.subCollections = ST.subCollections.filter((c) => c.id !== Number(b.getAttribute('data-cid'))); reindexSubs(); refreshEdit(); });
    // image
    const ai = root.querySelector('[data-act="add-image"]'); if (ai) ai.onclick = openImagePicker;
    const ri = root.querySelector('[data-act="rm-image"]'); if (ri) ri.onclick = () => { ST.image = ''; refreshEdit(); };
    // SEO drawer
    const es = root.querySelector('[data-act="edit-seo"]'); if (es) es.onclick = openSeoDrawer;
    // save / delete / discard
    root.querySelectorAll('[data-act="save"]').forEach((b) => b.onclick = saveCollection);
    const del = root.querySelector('[data-act="delete"]'); if (del) del.onclick = confirmDelete;
    root.querySelectorAll('[data-act="discard"]').forEach((b) => b.onclick = discardChanges);
    // drag-reorder
    wireProductDrag();
    wireSubDrag();
  }

  // surgical updates that avoid a full repaint (so focus/scroll survive typing)
  function updateDirtyBar() {
    const existing = root.querySelector('[data-act="discard"]') ? root.firstElementChild : null;
    const dirty = isDirty();
    if (dirty && !existing) refreshEdit();
    else if (!dirty && existing) refreshEdit();
  }
  function updateSeoCard() {
    const card = root.querySelector('[data-act="edit-seo"]');
    if (!card) return;
    const panel = card.closest('.panel');
    const fresh = h(seoCard());
    panel.replaceWith(fresh);
    const es = fresh.querySelector('[data-act="edit-seo"]'); if (es) es.onclick = openSeoDrawer;
  }

  function reindexProducts() { ST.products.forEach((p, i) => p.sort_order = i + 1); }
  function reindexSubs() { ST.subCollections.forEach((c, i) => c.sort_order = i + 1); }

  // ---- drag reorder: products (custom sort only) ----
  function wireProductDrag() {
    if (ST.sortOrder !== 'custom') return;
    const tbody = root.querySelector('#cp-tbody'); if (!tbody) return;
    let from = null;
    tbody.querySelectorAll('.cp-grip').forEach((g) => {
      const tr = g.closest('tr');
      g.ondragstart = (e) => { from = Number(g.getAttribute('data-idx')); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(from)); } catch (x) {} };
      tr.ondragover = (e) => { e.preventDefault(); tr.style.borderTop = '2px solid var(--brand)'; };
      tr.ondragleave = () => { tr.style.borderTop = ''; };
      tr.ondrop = (e) => {
        e.preventDefault(); tr.style.borderTop = '';
        const to = Number(tr.getAttribute('data-idx'));
        if (from == null || from === to) return;
        const arr = sortedProducts();             // current visual order
        const [m] = arr.splice(from, 1); arr.splice(to, 0, m);
        arr.forEach((p, i) => p.sort_order = i + 1);
        ST.products = arr; from = null; refreshEdit();
      };
    });
  }

  // ---- drag reorder: sub-collections ----
  function wireSubDrag() {
    const tbody = root.querySelector('#sc-tbody'); if (!tbody) return;
    let from = null;
    tbody.querySelectorAll('.sc-grip').forEach((g) => {
      const tr = g.closest('tr');
      g.ondragstart = (e) => { from = Number(g.getAttribute('data-idx')); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(from)); } catch (x) {} };
      tr.ondragover = (e) => { e.preventDefault(); tr.style.borderTop = '2px solid var(--brand)'; };
      tr.ondragleave = () => { tr.style.borderTop = ''; };
      tr.ondrop = (e) => {
        e.preventDefault(); tr.style.borderTop = '';
        const to = Number(tr.getAttribute('data-idx'));
        if (from == null || from === to) return;
        const arr = ST.subCollections.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        const [m] = arr.splice(from, 1); arr.splice(to, 0, m);
        arr.forEach((c, i) => c.sort_order = i + 1);
        ST.subCollections = arr; from = null; refreshEdit();
      };
    });
  }

  // ================= SAVE / DISCARD / DELETE =================
  function saveCollection() {
    if (!ST.name.trim()) {
      const e = root.querySelector('#f-name-err'); if (e) e.style.display = 'block';
      const n = root.querySelector('#f-name'); if (n) n.focus();
      return;
    }
    ORIG = snapshot(ST);
    if (ST.id == null) { toast('Collection "' + ST.name.trim() + '" added'); location.hash = '#/collections'; }
    else { toast('Collection updated'); refreshEdit(); }
  }
  function discardChanges() {
    confirm2({
      title: 'Are you sure you want to discard changes?',
      text: 'All unsaved changes will be lost.',
      okText: 'Discard',
      onOk: () => {
        if (ST.id == null) { location.hash = '#/collections'; }
        else { ST = stateFromDetail(D.DETAILS[ST.id] || D.DETAILS[Number(ST.id)]); ORIG = snapshot(ST); refreshEdit(); }
      },
    });
  }
  function confirmDelete() {
    confirm2({
      title: 'Confirm to delete?',
      text: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!',
      okText: 'Confirm', danger: true,
      onOk: () => { toast('Collection deleted'); location.hash = '#/collections'; },
    });
  }
  function tryLeave() {
    if (isDirty()) {
      confirm2({
        title: 'Leave with unsaved changes?',
        text: 'All unsaved changes will be lost.',
        okText: 'Leave', danger: true,
        onOk: () => { location.hash = '#/collections'; },
      });
    } else { location.hash = '#/collections'; }
  }

  // ================= MODAL primitives =================
  function modal({ title, body, width, okText, onOk, footer }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.style.maxWidth = '94vw';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body">' + body + '</div>' +
      (footer != null ? footer : ('<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>' + (okText || 'Save') + '</button></div>'));
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => { closePops(); backdrop.remove(); };
    m.querySelector('[data-x]').onclick = close;
    const c = m.querySelector('[data-cancel]'); if (c) c.onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    const ok = m.querySelector('[data-ok]'); if (ok && onOk) ok.onclick = () => onOk(m, close);
    return { m, close };
  }

  // simple confirm dialog (Modal.confirm)
  function confirm2({ title, text, okText, danger, onOk }) {
    modal({
      title, width: 440, okText: okText || 'Confirm',
      body: '<div class="subtle" style="font-size:13.5px;line-height:1.6">' + esc(text) + '</div>',
      onOk: (m, close) => { close(); onOk && onOk(); },
    });
    if (danger) { const ok = document.querySelector('.modal-backdrop:last-child [data-ok]'); if (ok) { ok.style.background = 'var(--err)'; ok.style.borderColor = 'var(--err)'; } }
  }

  // ================= PRODUCT PICKER MODAL (ProductSelect.tsx) =================
  // Filters mirror the real picker: keyword (field select + input), Category
  // (TreeCascadeSelect → flat select here), Price range (Popover) and multi-select
  // Status. Selected ids persist across pages/filters (preserveSelectedRowKeys).
  function openProductPicker() {
    const PK = {
      field: 'product_name', kw: '', kwApplied: '', cate: undefined,
      priceMin: '', priceMax: '', priceApplied: false,
      status: [], page: 1, size: 20,
      max: 100, selected: new Set(ST.products.map((p) => p.product_id)),
    };
    const fieldOpts = D.PRODUCT_SEARCH_FIELDS.map((o) => '<option value="' + o.value + '">' + esc(o.label) + '</option>').join('');
    const cateLabel = (v) => (D.CATEGORIES.find((c) => c.value === v) || {}).label || '';
    const fieldLabel = (v) => (D.PRODUCT_SEARCH_FIELDS.find((o) => o.value === v) || {}).label || 'Product name';

    const ctrl = modal({
      title: 'Add products', width: 1200,
      body: '<div id="pk-root"></div>',
      footer: '<div></div>',
    });
    const host = ctrl.m.querySelector('#pk-root');

    function pkFiltered() {
      let rows = D.PRODUCTS.slice();
      if (PK.kwApplied) {
        const q = PK.kwApplied.toLowerCase();
        rows = rows.filter((p) => {
          switch (PK.field) {
            case 'product_spu': return (p.product_spu || '').toLowerCase().includes(q);
            case 'product_sku': return (p.product_sku || '').toLowerCase().includes(q);
            case 'barcode': return (p.barcode || '').toLowerCase().includes(q);
            case 'product_id': return String(p.product_id).includes(q);
            case 'variant_id': return String(p.product_id).includes(q);
            default: return (p.store_name || '').toLowerCase().includes(q);
          }
        });
      }
      if (PK.cate !== undefined && PK.cate !== '') rows = rows.filter((p) => p.pid === Number(PK.cate));
      if (PK.priceApplied) {
        const lo = PK.priceMin !== '' ? Number(PK.priceMin) : -Infinity;
        const hi = PK.priceMax !== '' ? Number(PK.priceMax) : Infinity;
        rows = rows.filter((p) => Number(p.price_max != null ? p.price_max : p.price_min) >= lo && Number(p.price_min != null ? p.price_min : p.price_max) <= hi);
      }
      if (PK.status.length) {
        rows = rows.filter((p) => PK.status.includes(productStatus(p).toLowerCase()));
      }
      return rows;
    }

    // active filter tags (activeFilterTags) — category / keyword / price / status
    function pkTags() {
      const tags = [];
      if (PK.cate !== undefined && PK.cate !== '') tags.push({ key: 'category', label: 'Category', value: cateLabel(Number(PK.cate)) });
      if (PK.kwApplied) tags.push({ key: 'keyword', label: fieldLabel(PK.field), value: PK.kwApplied });
      if (PK.priceApplied) {
        const mn = PK.priceMin !== '' ? Number(PK.priceMin) : undefined;
        const mx = PK.priceMax !== '' ? Number(PK.priceMax) : undefined;
        let txt = '';
        if (mn !== undefined && mx !== undefined) txt = money(mn) + ' ~ ' + money(mx);
        else if (mn !== undefined) txt = money(mn) + '+';
        else if (mx !== undefined) txt = '≤' + money(mx);
        if (txt) tags.push({ key: 'price', label: 'Price range', value: txt });
      }
      if (PK.status.length) tags.push({ key: 'status', label: 'Status', value: PK.status.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') });
      return tags;
    }

    function statusText() {
      if (PK.status.length === 1) return PK.status[0].charAt(0).toUpperCase() + PK.status[0].slice(1);
      if (PK.status.length > 1) return PK.status.length + ' selected';
      return 'Status';
    }

    function paint() {
      const rows = pkFiltered();
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / PK.size));
      if (PK.page > pages) PK.page = pages;
      const pageRows = rows.slice((PK.page - 1) * PK.size, (PK.page - 1) * PK.size + PK.size);
      const cateOpts = '<option value="">Category</option>' +
        D.CATEGORIES.map((c) => '<option value="' + c.value + '"' + (String(PK.cate) === String(c.value) ? ' selected' : '') + '>' + esc(c.label) + '</option>').join('');
      const tags = pkTags();

      host.innerHTML =
        // filter bar
        '<div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:2px">' +
          '<div class="flex" style="width:418px">' +
            '<select class="filter-select" id="pk-field" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
            '<div style="position:relative;flex:1">' +
              '<input class="filter-input" id="pk-kw" placeholder="Search" value="' + esc(PK.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
              '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
            '</div>' +
          '</div>' +
          // Category
          '<select class="filter-select" id="pk-cate" style="width:200px">' + cateOpts + '</select>' +
          // Price range chip (popover)
          '<div class="sel-trigger" id="pk-price" style="width:320px">' +
            '<span class="' + (PK.priceApplied ? '' : 'muted') + '">' + esc(priceChipText()) + '</span>' + I.chevDown +
          '</div>' +
          // Status (multi-select)
          '<div class="sel-trigger" id="pk-status" style="width:160px">' +
            '<span class="' + (PK.status.length ? '' : 'muted') + '">' + esc(statusText()) + '</span>' + I.chevDown +
          '</div>' +
        '</div>' +
        // filter tags
        (tags.length ? '<div class="flex gap-2" style="flex-wrap:wrap;margin-top:8px" id="pk-tags">' +
          tags.map((t) => '<span class="field-pill" data-clear="' + t.key + '"><span class="muted">' + esc(t.label) + ':</span> ' + esc(t.value) + ' <span class="x">&times;</span></span>').join('') +
        '</div>' : '') +
        // table
        '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden;margin-top:12px">' +
        '<div style="max-height:460px;overflow:auto"><table class="tbl"><thead><tr>' +
          '<th style="width:44px"></th><th>Product</th><th style="width:300px">Inventory quantity</th>' +
          '<th style="width:150px">Price</th><th style="width:150px">Status</th>' +
        '</tr></thead><tbody id="pk-tbody">' +
          (pageRows.length ? pageRows.map(pkRow).join('')
            : '<tr><td colspan="5" style="text-align:center;padding:36px" class="muted">No products match these filters.</td></tr>') +
        '</tbody></table></div></div>' +
        // footer
        '<div class="flex items-center justify-between" style="margin-top:14px;flex-wrap:wrap;gap:10px">' +
          '<span class="muted" style="font-size:13px"><span id="pk-count">' + PK.selected.size + '</span>/' + PK.max + ' products selected</span>' +
          '<div class="flex items-center gap-3">' + pagerMini(PK.page, pages) +
            '<button class="btn btn-default" data-pk-cancel>Cancel</button>' +
            '<button class="btn btn-primary"' + (PK.selected.size === 0 ? ' disabled' : '') + ' data-pk-add>Add</button>' +
          '</div>' +
        '</div>';

      // wire filter
      const field = host.querySelector('#pk-field'); if (field) field.onchange = () => { PK.field = field.value; PK.kwApplied = PK.kw.trim(); PK.page = 1; paint(); };
      const kw = host.querySelector('#pk-kw');
      if (kw) {
        kw.oninput = () => { PK.kw = kw.value; if (!kw.value.trim() && PK.kwApplied) { PK.kwApplied = ''; PK.page = 1; paint(); } };
        const commit = () => { PK.kwApplied = PK.kw.trim(); PK.page = 1; paint(); };
        kw.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
        kw.onblur = commit;
      }
      const cate = host.querySelector('#pk-cate'); if (cate) cate.onchange = () => { PK.cate = cate.value === '' ? undefined : cate.value; PK.page = 1; paint(); };
      const priceChip = host.querySelector('#pk-price'); if (priceChip) priceChip.onclick = () => openPkPrice(priceChip);
      const statusChip = host.querySelector('#pk-status'); if (statusChip) statusChip.onclick = () => openPkStatus(statusChip);
      // filter tag removal
      host.querySelectorAll('#pk-tags [data-clear]').forEach((tg) => tg.onclick = () => {
        const k = tg.getAttribute('data-clear');
        if (k === 'category') PK.cate = undefined;
        if (k === 'keyword') { PK.kw = ''; PK.kwApplied = ''; }
        if (k === 'price') { PK.priceApplied = false; PK.priceMin = ''; PK.priceMax = ''; }
        if (k === 'status') PK.status = [];
        PK.page = 1; paint();
      });
      // row toggles
      host.querySelectorAll('#pk-tbody tr[data-pid]').forEach((tr) => tr.onclick = () => {
        const id = Number(tr.getAttribute('data-pid'));
        if (PK.selected.has(id)) PK.selected.delete(id);
        else if (PK.selected.size < PK.max) PK.selected.add(id);
        paint();
      });
      // pager
      host.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { PK.page = Number(el.getAttribute('data-page')); paint(); });
      // actions
      host.querySelector('[data-pk-cancel]').onclick = ctrl.close;
      const addBtn = host.querySelector('[data-pk-add]');
      if (addBtn) addBtn.onclick = () => {
        if (PK.selected.size === 0) return;
        const ids = Array.from(PK.selected);
        const existing = new Map(ST.products.map((p) => [p.product_id, p]));
        ST.products = ids.map((id, i) => {
          const src = existing.get(id) || D.PRODUCTS.find((p) => p.product_id === id);
          return Object.assign({}, src, { sort_order: i + 1 });
        });
        ctrl.close(); refreshEdit();
      };
    }

    function priceChipText() {
      if (!PK.priceApplied) return 'Price range';
      const mn = PK.priceMin !== '' ? money(Number(PK.priceMin)) : '';
      const mx = PK.priceMax !== '' ? money(Number(PK.priceMax)) : '';
      if (mn && mx) return mn + ' ~ ' + mx;
      if (mn) return mn + '+';
      if (mx) return '≤' + mx;
      return 'Price range';
    }

    // price-range popover (useRange)
    function openPkPrice(anchor) {
      closePops();
      const layer = h('<div class="pop-layer"></div>');
      const pop = h('<div class="menu-pop" style="position:fixed;min-width:280px;padding:14px;z-index:120"></div>');
      pop.innerHTML =
        '<div class="ctrl-label" style="margin-bottom:8px">Price range</div>' +
        '<div class="flex items-center gap-2">' +
          '<input class="input" id="pk-pmin" placeholder="Min" type="number" value="' + esc(PK.priceMin) + '" style="width:110px" />' +
          '<span class="muted">to</span>' +
          '<input class="input" id="pk-pmax" placeholder="Max" type="number" value="' + esc(PK.priceMax) + '" style="width:110px" />' +
        '</div>' +
        '<div class="flex justify-end gap-2 mt-3">' +
          '<button class="btn btn-default" data-x>Clear</button>' +
          '<button class="btn btn-primary" data-apply>Confirm</button>' +
        '</div>';
      layer.appendChild(pop); document.body.appendChild(layer);
      const r = anchor.getBoundingClientRect();
      pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
      pop.querySelector('[data-apply]').onclick = () => {
        PK.priceMin = pop.querySelector('#pk-pmin').value;
        PK.priceMax = pop.querySelector('#pk-pmax').value;
        PK.priceApplied = PK.priceMin !== '' || PK.priceMax !== '';
        PK.page = 1; closePops(); paint();
      };
      pop.querySelector('[data-x]').onclick = () => { PK.priceApplied = false; PK.priceMin = ''; PK.priceMax = ''; PK.page = 1; closePops(); paint(); };
      setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
    }

    // status multi-select popover (checkbox list)
    function openPkStatus(anchor) {
      closePops();
      const opts = [['activated', 'Activated'], ['deactivated', 'Deactivated'], ['archived', 'Archived']];
      const layer = h('<div class="pop-layer"></div>');
      const pop = h('<div class="menu-pop" style="position:fixed;min-width:180px;padding:6px;z-index:120"></div>');
      pop.innerHTML = opts.map(([v, l]) =>
        '<label class="menu-item flex items-center gap-2" style="padding:7px 10px;cursor:pointer;border-radius:6px">' +
          '<input type="checkbox" data-v="' + v + '"' + (PK.status.includes(v) ? ' checked' : '') + ' style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" />' +
          '<span style="font-size:13px">' + l + '</span></label>').join('');
      layer.appendChild(pop); document.body.appendChild(layer);
      const r = anchor.getBoundingClientRect();
      pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px'; pop.style.minWidth = r.width + 'px';
      pop.querySelectorAll('input[data-v]').forEach((cb) => cb.onchange = () => {
        const v = cb.getAttribute('data-v');
        if (cb.checked) { if (!PK.status.includes(v)) PK.status.push(v); }
        else PK.status = PK.status.filter((s) => s !== v);
        PK.page = 1; paint();
      });
      setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
    }

    function pkRow(p) {
      const checked = PK.selected.has(p.product_id);
      return '<tr data-pid="' + p.product_id + '" style="cursor:pointer">' +
        '<td><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:15px;height:15px;accent-color:var(--brand);pointer-events:none" /></td>' +
        '<td><div class="flex items-center gap-2">' + prodImg(p, 40) + '<span style="color:var(--ink)">' + esc(p.store_name) + '</span></div></td>' +
        '<td class="muted" style="font-size:13px">' + inventoryHtml(p) + '</td>' +
        '<td>' + priceText(p) + '</td>' +
        '<td style="color:var(--ink)">' + productStatus(p) + '</td>' +
      '</tr>';
    }
    paint();
  }

  // ================= COLLECTION PICKER MODAL (CollectionSelectModal — for sub-collections) =================
  function openCollectionPicker() {
    const PK = { kw: '', kwApplied: '', sortDir: '', selected: new Set(ST.subCollections.map((c) => c.id)) };
    const exclude = new Set([ST.id]); // can't nest itself

    const ctrl = modal({
      title: 'Add collections', width: 960,
      body: '<div id="cc-root"></div>',
      footer: '<div></div>',
    });
    const host = ctrl.m.querySelector('#cc-root');

    function ccFiltered() {
      let rows = D.COLLECTIONS.filter((c) => !exclude.has(c.id));
      if (PK.kwApplied) { const q = PK.kwApplied.toLowerCase(); rows = rows.filter((c) => c.name.toLowerCase().includes(q)); }
      if (PK.sortDir === 'asc') rows = rows.slice().sort((a, b) => a.product_count - b.product_count);
      else if (PK.sortDir === 'desc') rows = rows.slice().sort((a, b) => b.product_count - a.product_count);
      return rows;
    }
    function paint() {
      const rows = ccFiltered();
      const max = rows.length; // maxSelectable follows list total in real modal
      const sortArrow = PK.sortDir === 'asc' ? ' &uarr;' : (PK.sortDir === 'desc' ? ' &darr;' : '');
      // Collection name field group (field select + input) mirrors the real modal
      host.innerHTML =
        '<div class="flex" style="width:480px;margin-bottom:10px">' +
          '<select class="filter-select" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0"><option value="name" selected>Collection name</option></select>' +
          '<div style="position:relative;flex:1">' +
            '<input class="filter-input" id="cc-kw" placeholder="Search" value="' + esc(PK.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
            '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
          '</div>' +
        '</div>' +
        (PK.kwApplied ? '<div class="flex gap-2" style="margin-bottom:10px"><span class="field-pill" data-cc-clear>Collection name: ' + esc(PK.kwApplied) + ' <span class="x">&times;</span></span></div>' : '') +
        '<div style="border:1px solid var(--hair);border-radius:8px;overflow:hidden">' +
        '<div style="max-height:460px;overflow:auto"><table class="tbl"><thead><tr>' +
          '<th style="width:44px"></th><th>Collection name</th><th style="width:140px">Type</th><th style="width:180px;cursor:pointer" id="cc-sort">Product quantity' + sortArrow + '</th>' +
        '</tr></thead><tbody id="cc-tbody">' +
          (rows.length ? rows.map(ccRow).join('')
            : '<tr><td colspan="4" style="text-align:center;padding:36px" class="muted">No collections found.</td></tr>') +
        '</tbody></table></div></div>' +
        '<div class="flex items-center justify-between" style="margin-top:14px">' +
          '<span class="muted" style="font-size:13px"><span id="cc-count">' + PK.selected.size + '</span>/' + max + ' collections selected</span>' +
          '<div class="flex items-center gap-2">' +
            '<button class="btn btn-default" data-cc-cancel>Cancel</button>' +
            '<button class="btn btn-primary"' + (PK.selected.size === 0 ? ' disabled' : '') + ' data-cc-add>Add</button>' +
          '</div>' +
        '</div>';
      const sortEl = host.querySelector('#cc-sort'); if (sortEl) sortEl.onclick = () => { PK.sortDir = PK.sortDir === 'asc' ? 'desc' : (PK.sortDir === 'desc' ? '' : 'asc'); paint(); };
      const clr = host.querySelector('[data-cc-clear]'); if (clr) clr.onclick = () => { PK.kw = ''; PK.kwApplied = ''; paint(); };
      const kw = host.querySelector('#cc-kw');
      if (kw) {
        kw.oninput = () => { PK.kw = kw.value; if (!kw.value.trim() && PK.kwApplied) { PK.kwApplied = ''; paint(); } };
        const commit = () => { PK.kwApplied = PK.kw.trim(); paint(); };
        kw.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
        kw.onblur = commit;
      }
      host.querySelectorAll('#cc-tbody tr[data-cid]').forEach((tr) => tr.onclick = () => {
        const id = Number(tr.getAttribute('data-cid'));
        if (PK.selected.has(id)) PK.selected.delete(id); else PK.selected.add(id);
        paint();
      });
      host.querySelector('[data-cc-cancel]').onclick = ctrl.close;
      const ccAdd = host.querySelector('[data-cc-add]');
      if (ccAdd) ccAdd.onclick = () => {
        if (PK.selected.size === 0) return;
        const ids = Array.from(PK.selected);
        const existing = new Map(ST.subCollections.map((c) => [c.id, c]));
        ST.subCollections = ids.map((id, i) => {
          const src = existing.get(id) || D.COLLECTIONS.find((c) => c.id === id);
          return { id: src.id, name: src.name, image_url: src.image_url, type: 'manual', product_count: src.product_count, sort_order: i + 1 };
        });
        ctrl.close(); refreshEdit();
      };
    }
    function ccRow(c) {
      const checked = PK.selected.has(c.id);
      return '<tr data-cid="' + c.id + '" style="cursor:pointer">' +
        '<td><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:15px;height:15px;accent-color:var(--brand);pointer-events:none" /></td>' +
        '<td><div class="flex items-center gap-3">' + prodImg({ image: c.image_url }, 40) + '<span style="color:var(--ink)">' + esc(c.name) + '</span></div></td>' +
        '<td style="color:var(--ink)">manual</td>' +
        '<td>' + c.product_count + '</td>' +
      '</tr>';
    }
    paint();
  }

  // ================= IMAGE PICKER (SelectFile stand-in) =================
  function openImagePicker() {
    const swatches = ['#2563eb', '#0ea5a4', '#f59e0b', '#7c3aed', '#db2777', '#16a34a', '#0891b2', '#be123c', '#4d7c0f', '#1f2937'];
    const grid = swatches.map((hex) => {
      const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="' + hex + '"/></svg>');
      return '<div class="img-pick" data-uri="' + uri + '" style="height:88px;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid transparent"><img src="' + uri + '" alt="" style="width:100%;height:100%;object-fit:cover" /></div>';
    }).join('');
    const ctrl = modal({
      title: 'Select image', width: 560,
      body: '<div class="muted" style="font-size:13px;margin-bottom:12px">Pick a cover image from your media library.</div>' +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">' + grid + '</div>',
      footer: '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button></div>',
    });
    ctrl.m.querySelectorAll('.img-pick').forEach((el) => el.onclick = () => { ST.image = el.getAttribute('data-uri'); ctrl.close(); refreshEdit(); });
  }

  // ================= SEO DRAWER (collectionEdit.tsx seoDrawer) =================
  function openSeoDrawer() {
    const draft = {
      pageTitle: ST.seo_title || ST.name || '',
      metaDescription: (ST.seo_description || ST.description || '').replace(/<[^>]+>/g, ' ').trim(),
      handle: ST.handle || '',
      keywords: (ST.seo_keywords || []).slice(),
    };
    const urlPrefix = D.DOMAIN + '/collections/';

    const backdrop = h('<div class="drawer-backdrop"></div>');
    const drawer = h('<div class="drawer" style="width:480px"></div>');
    backdrop.appendChild(drawer); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

    function kwChips() {
      return draft.keywords.map((k, i) =>
        '<span style="display:inline-flex;align-items:center;gap:4px;background:#e6f0ff;color:var(--brand);border:1px solid #cfe1ff;border-radius:6px;padding:2px 8px;font-size:12.5px;word-break:break-all">' +
          esc(k) + '<span class="kw-rm" data-i="' + i + '" style="cursor:pointer;display:inline-flex">' + I.x + '</span></span>').join('');
    }
    function paint() {
      const previewUrl = urlPrefix + (draft.handle || 'collection-handle');
      drawer.innerHTML =
        '<div class="drawer-head"><span>Search engine optimization</span><span class="drawer-x" data-x>' + I.x + '</span></div>' +
        '<div class="drawer-body">' +
          // preview
          '<div style="margin-bottom:18px">' +
            '<div style="font-weight:600;color:var(--ink);margin-bottom:8px">Preview</div>' +
            '<div style="font-size:12px;color:var(--ink-muted);margin-bottom:4px;word-break:break-all">' + esc(previewUrl) + '</div>' +
            '<div style="font-size:14px;font-weight:500;color:var(--brand);margin-bottom:2px;word-break:break-all">' + esc(draft.pageTitle || 'Page title') + '</div>' +
            '<div style="font-size:13px;color:var(--ink-body);word-break:break-word">' + esc(draft.metaDescription || 'Meta description') + '</div>' +
          '</div>' +
          '<div class="divider" style="margin:16px 0"></div>' +
          // page title
          '<div style="margin-bottom:16px">' +
            '<div class="flex items-center justify-between mb-2"><span class="flex items-center gap-1" style="font-size:13px;font-weight:500;color:var(--ink)">Page title <span style="color:var(--ink-muted)">' + I.help + '</span></span>' +
              '<span class="muted" style="font-size:12px">' + draft.pageTitle.length + '</span></div>' +
            '<input class="input" id="seo-title" maxlength="200" placeholder="Please enter" value="' + esc(draft.pageTitle) + '" />' +
          '</div>' +
          // meta description
          '<div style="margin-bottom:16px">' +
            '<div class="flex items-center justify-between mb-2"><span class="flex items-center gap-1" style="font-size:13px;font-weight:500;color:var(--ink)">Meta description <span style="color:var(--ink-muted)">' + I.help + '</span></span>' +
              '<span class="muted" style="font-size:12px">' + draft.metaDescription.length + '</span></div>' +
            '<textarea class="input" id="seo-desc" maxlength="500" rows="4" placeholder="Add a description so that the page can achieve a higher search ranking" style="height:auto;padding:8px 12px;resize:vertical">' + esc(draft.metaDescription) + '</textarea>' +
          '</div>' +
          // url
          '<div style="margin-bottom:16px">' +
            '<div class="flex items-center gap-1 mb-2" style="font-size:13px;font-weight:500;color:var(--ink)">URL <span style="color:var(--ink-muted)">' + I.help + '</span></div>' +
            '<div class="flex" style="align-items:stretch">' +
              '<span style="display:inline-flex;align-items:center;padding:0 10px;background:var(--panel);border:1px solid var(--ctl);border-right:none;border-radius:8px 0 0 8px;font-size:12px;color:var(--ink-muted);white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis">' + esc(urlPrefix) + '</span>' +
              '<input class="input" id="seo-handle" value="' + esc(draft.handle) + '" style="border-radius:0 8px 8px 0" />' +
            '</div>' +
          '</div>' +
          // keywords
          '<div>' +
            '<div class="flex items-center gap-1 mb-2" style="font-size:13px;font-weight:500;color:var(--ink)">SEO keywords <span style="color:var(--ink-muted)">' + I.help + '</span></div>' +
            '<div id="seo-kw-box" style="display:flex;flex-wrap:wrap;gap:6px;min-height:36px;border:1px solid var(--ctl);border-radius:8px;padding:6px 8px">' +
              kwChips() +
              '<input id="seo-kw-input" placeholder="' + (draft.keywords.length ? '' : "Press 'Enter' to complete the keywords input") + '" style="flex:1;min-width:140px;border:none;outline:none;font-size:13px;background:transparent" />' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-foot" style="justify-content:flex-end"><button class="btn btn-primary" data-seo-confirm>Confirm</button></div>';

      drawer.querySelector('[data-x]').onclick = close;
      const t = drawer.querySelector('#seo-title'); if (t) t.oninput = () => { draft.pageTitle = t.value; syncPreview(); };
      const d = drawer.querySelector('#seo-desc'); if (d) d.oninput = () => { draft.metaDescription = d.value; syncPreview(); };
      const hd = drawer.querySelector('#seo-handle'); if (hd) hd.oninput = () => { draft.handle = hd.value; syncPreview(); };
      const ki = drawer.querySelector('#seo-kw-input');
      if (ki) {
        const addKw = () => { const v = ki.value.trim(); if (v && !draft.keywords.includes(v)) { draft.keywords.push(v); ki.value = ''; paint(); drawer.querySelector('#seo-kw-input').focus(); } };
        ki.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addKw(); } };
        ki.onblur = addKw;
      }
      drawer.querySelectorAll('.kw-rm').forEach((x) => x.onclick = () => { draft.keywords.splice(Number(x.getAttribute('data-i')), 1); paint(); });
      drawer.querySelector('[data-seo-confirm]').onclick = () => {
        ST.seo_title = draft.pageTitle;
        ST.seo_description = draft.metaDescription;
        ST.handle = draft.handle.trim();
        ST.seo_keywords = draft.keywords.slice();
        ST._lastName = ST.name; ST._lastDesc = ST.description; // decouple from auto-sync after manual edit
        close(); refreshEdit();
      };
    }
    // live preview without full repaint (keeps focus while typing)
    function syncPreview() {
      const previewUrl = urlPrefix + (draft.handle || 'collection-handle');
      const body = drawer.querySelector('.drawer-body');
      body.querySelector('div > div:nth-child(2)').textContent = previewUrl;
      const titleEl = body.querySelector('div > div:nth-child(3)'); if (titleEl) titleEl.textContent = draft.pageTitle || 'Page title';
      const descEl = body.querySelector('div > div:nth-child(4)'); if (descEl) descEl.textContent = draft.metaDescription || 'Meta description';
    }
    paint();
  }

  // ---- tiny pager for modals ----
  function pagerMini(page, pages) {
    const item = (label, p, opts) => {
      opts = opts || {};
      const cls = 'pg-item' + (opts.active ? ' active' : '') + (opts.disabled ? ' disabled' : '');
      return '<span class="' + cls + '"' + (opts.disabled ? '' : ' data-page="' + p + '"') + '>' + label + '</span>';
    };
    let nums = '';
    const maxBtns = 7;
    let lo = 1, hi = pages;
    if (pages > maxBtns) { lo = Math.max(1, page - 3); hi = Math.min(pages, lo + maxBtns - 1); lo = Math.max(1, hi - maxBtns + 1); }
    for (let p = lo; p <= hi; p++) nums += item(String(p), p, { active: p === page });
    return '<div class="pg">' + item('&lsaquo;', page - 1, { disabled: page <= 1 }) + nums + item('&rsaquo;', page + 1, { disabled: page >= pages }) + '</div>';
  }

  // ================= ROUTER (SPA: registered with the shell router) =================
  function goEdit(id) { location.hash = '#/collections/' + id; }

  function route(rest) {
    if (rest) { renderEdit(decodeURIComponent(rest)); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { ST = null; ORIG = null; renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.collections = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
