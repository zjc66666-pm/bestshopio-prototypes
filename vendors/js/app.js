/* BestShopio Admin · Vendors prototype — list + edit + drawer/modals, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin vendors
   (vendorsList / search / table / vendorEdit / VendorProductsTable). */
(function () {
  const D = window.DATA_VENDORS;
  const root = document.getElementById('root');

  // ---- tiny html -> element helper ----
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + Number(n || 0).toFixed(2);

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    trash: svg('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>', 15),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 16),
    help: svg('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', 13),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 16),
    info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', 16),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- status pill (table.tsx STATUS_COLOR -> PillTag) ----
  const statusPill = (st) => st === 1
    ? '<span class="pill pill-blue"><span class="dot"></span>Visible</span>'
    : '<span class="pill pill-gray"><span class="dot"></span>Hidden</span>';

  const handleFromName = (name) => String(name || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // product helpers (VendorProductsTable.tsx)
  const productTitle = (p) => p.store_name || p.name || ('Product ' + p.product_id);
  const formatPrice = (p) => {
    const lo = parseFloat(p.price_min != null ? p.price_min : (p.price || 0));
    const hi = parseFloat(p.price_max != null ? p.price_max : (p.price || 0));
    if (lo === hi || !hi) return money(lo);
    return money(lo) + ' ~ ' + money(hi);
  };
  const inventoryText = (p) => {
    const stock = p.on_sale_stock || 0;
    const vc = p.variant_count || 0;
    let txt = stock + ' on sale' + (p.spec_type === 1 && vc > 0 ? ' · ' + vc + ' variant' + (vc > 1 ? 's' : '') : '');
    if (p.inventory_status === 1 || p.inventory_status === 2) {
      const tag = p.inventory_status === 1 ? 'Out of stock' : 'Partial - Out of stock';
      txt = '<span>' + esc(txt) + '</span> <span class="pill pill-orange" style="padding:2px 8px;font-size:11.5px">' + I.alert + ' ' + tag + '</span>';
      return txt;
    }
    return '<span>' + esc(txt) + '</span>';
  };
  const productStatusText = (p) => p.is_del === 1 ? 'Archived' : (p.is_show === 1 ? 'Activated' : 'Deactivated');

  // =====================================================================
  //  LIST VIEW  (vendorsList.tsx + search.tsx + table.tsx + emptyState.tsx)
  // =====================================================================
  const LST = {
    field: 'name', kw: '', kwApplied: '',
    qtyMin: '', qtyMax: '', qtyApplied: false,
    status: [],            // VendorStatus[]
    sortDir: '',           // '' | 'asc' | 'desc' on productCount
    page: 1, size: 20,
  };

  function filteredRows() {
    let rows = D.VENDORS.slice();
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((v) => (LST.field === 'address' ? v.address : v.name).toLowerCase().includes(q));
    }
    if (LST.qtyApplied) {
      const lo = LST.qtyMin === '' ? -Infinity : Number(LST.qtyMin);
      const hi = LST.qtyMax === '' ? Infinity : Number(LST.qtyMax);
      rows = rows.filter((v) => v.productCount >= lo && v.productCount <= hi);
    }
    if (LST.status.length) rows = rows.filter((v) => LST.status.includes(v.status));
    if (LST.sortDir) rows = rows.sort((a, b) => LST.sortDir === 'asc' ? a.productCount - b.productCount : b.productCount - a.productCount);
    return rows;
  }

  const hasAnyFilter = () => !!LST.kwApplied || LST.qtyApplied || LST.status.length > 0;

  function renderList() {
    // empty state: no vendors at all AND no active filter (emptyState.tsx)
    if (D.VENDORS.length === 0 && !hasAnyFilter()) { renderEmptyState(); return; }

    const rows = filteredRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const fieldOpts = D.SEARCH_FIELDS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.field ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    // status multi-select trigger label
    const statusLabel = LST.status.length
      ? LST.status.map((s) => s === 1 ? 'Visible' : 'Hidden').join(', ')
      : 'Status';
    const qtyChipText = LST.qtyApplied
      ? (LST.qtyMin !== '' && LST.qtyMax !== '' ? LST.qtyMin + ' - ' + LST.qtyMax
        : LST.qtyMin !== '' ? LST.qtyMin + '+'
        : '0 - ' + LST.qtyMax)
      : 'Products quantity';

    // filter tags (search.tsx ant-tag-blue closable)
    const tags = [];
    if (LST.kwApplied) {
      const lbl = LST.field === 'address' ? 'Address' : 'Vendor name';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.qtyApplied) tags.push('<span class="field-pill" data-clear="qty">Products quantity: ' + esc(qtyChipText) + ' <span class="x">&times;</span></span>');
    if (LST.status.length) tags.push('<span class="field-pill" data-clear="status">Status: ' + esc(statusLabel) + ' <span class="x">&times;</span></span>');

    const sortArrow = LST.sortDir === 'asc' ? ' ↑' : LST.sortDir === 'desc' ? ' ↓' : '';

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Vendors</h1>' +
        '<button class="btn btn-primary" data-act="add">Add vendor</button>' +
      '</div>' +
      '<div class="panel">' +
        // tabs (single "All" tab with count — vendorsList.tsx)
        '<div class="tabs" style="padding:0 8px">' +
          '<div class="tab active">All<span class="count-badge">' + D.VENDORS.length + '</span></div>' +
        '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // search field group (Select + Input.Group compact)
            '<div class="flex" style="min-width:418px">' +
              '<select class="filter-select" id="v-field" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="v-kw" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // products-quantity range popover trigger
            '<div class="sel-trigger" id="qty-chip" style="width:170px">' +
              '<span class="' + (LST.qtyApplied ? '' : 'muted') + '">' + esc(qtyChipText) + '</span>' + I.chevDown +
            '</div>' +
            // status multi-select trigger
            '<div class="sel-trigger" id="status-chip" style="width:200px">' +
              '<span class="' + (LST.status.length ? '' : 'muted') + '">' + esc(statusLabel) + '</span>' + I.chevDown +
            '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:900px">' +
          '<thead><tr>' +
            '<th style="width:30%">Vendor</th>' +
            '<th>Address</th>' +
            '<th data-sort="qty" style="width:180px;cursor:pointer;user-select:none">Product quantity' + sortArrow + '</th>' +
            '<th style="width:140px">Status</th>' +
            '<th style="width:80px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="v-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="5" style="text-align:center;padding:40px" class="muted">No vendors match these filters.</td></tr>') +
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

  function rowHtml(v) {
    const logo = v.image
      ? '<div style="width:40px;height:40px;border-radius:6px;overflow:hidden;background:#f3f4f6;flex:none"><img src="' + v.image + '" alt="" style="width:100%;height:100%;object-fit:cover" /></div>'
      : '<div style="width:40px;height:40px;border-radius:6px;background:#e5e7eb;display:grid;place-items:center;color:#9ca3af;font-size:11px;flex:none">IMG</div>';
    return '<tr data-id="' + v.id + '">' +
      '<td><div class="flex items-center gap-3">' + logo + '<span style="font-weight:500;color:var(--ink)">' + esc(v.name) + '</span></div></td>' +
      '<td style="max-width:340px"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + esc(v.address || '- -') + '">' + esc(v.address || '- -') + '</div></td>' +
      '<td>' + v.productCount + '</td>' +
      '<td>' + statusPill(v.status) + '</td>' +
      '<td style="text-align:center"><button class="back-btn" data-view="' + v.id + '" title="Edit vendor" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
    const field = root.querySelector('#v-field');
    const kw = root.querySelector('#v-kw');
    if (field) field.onchange = () => { LST.field = field.value; if (LST.kwApplied) { LST.page = 1; renderList(); } };
    if (kw) {
      kw.oninput = () => { LST.kw = kw.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kw.onkeydown = (e) => { if (e.key === 'Enter') kw.blur(); };
      kw.onblur = commit;
    }
    const qtyChip = root.querySelector('#qty-chip'); if (qtyChip) qtyChip.onclick = () => openQtyPopover(qtyChip);
    const statusChip = root.querySelector('#status-chip'); if (statusChip) statusChip.onclick = () => openStatusPopover(statusChip);
    // sortable header
    const sortTh = root.querySelector('th[data-sort="qty"]');
    if (sortTh) sortTh.onclick = () => { LST.sortDir = LST.sortDir === 'asc' ? 'desc' : LST.sortDir === 'desc' ? '' : 'asc'; renderList(); };
    // filter tags clear
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'qty') { LST.qtyApplied = false; LST.qtyMin = ''; LST.qtyMax = ''; }
      if (k === 'status') { LST.status = []; }
      LST.page = 1; renderList();
    });
    const ps = root.querySelector('#pg-size'); if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row + view -> edit
    root.querySelectorAll('#v-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goEdit(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goEdit(b.getAttribute('data-view')); });
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  function openQtyPopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:280px;padding:14px"></div>');
    pop.innerHTML =
      '<div class="flex items-center gap-2 mb-3">' +
        '<input class="input" id="q-min" placeholder="Minimum value" type="number" min="0" value="' + esc(LST.qtyMin) + '" style="flex:1" />' +
        '<span class="muted">-</span>' +
        '<input class="input" id="q-max" placeholder="Maximum value" type="number" min="0" value="' + esc(LST.qtyMax) + '" style="flex:1" />' +
      '</div>' +
      '<div class="flex justify-end gap-2">' +
        '<button class="btn btn-default" data-x>Clear</button>' +
        '<button class="btn btn-primary" data-apply>Confirm</button>' +
      '</div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelector('[data-apply]').onclick = () => {
      const mn = pop.querySelector('#q-min').value, mx = pop.querySelector('#q-max').value;
      // validity: at least one, and max >= min when both present (search.tsx isQuantityRangeValid)
      if (mn === '' && mx === '') return;
      if (mn !== '' && mx !== '' && Number(mx) < Number(mn)) { toast('Maximum must be greater than or equal to minimum.'); return; }
      LST.qtyMin = mn; LST.qtyMax = mx; LST.qtyApplied = true; LST.page = 1; closePops(); renderList();
    };
    pop.querySelector('[data-x]').onclick = () => { LST.qtyMin = ''; LST.qtyMax = ''; LST.qtyApplied = false; LST.page = 1; closePops(); renderList(); };
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  function openStatusPopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:200px;padding:6px"></div>');
    pop.innerHTML = D.STATUS_OPTIONS.map((o) =>
      '<label class="edit-check" style="padding:7px 10px;border-radius:6px">' +
        '<input type="checkbox" data-v="' + o.value + '"' + (LST.status.includes(o.value) ? ' checked' : '') + ' />' +
        '<span>' + esc(o.label) + '</span></label>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('input[data-v]').forEach((cb) => cb.onchange = () => {
      const val = Number(cb.getAttribute('data-v'));
      if (cb.checked) { if (!LST.status.includes(val)) LST.status.push(val); }
      else { LST.status = LST.status.filter((x) => x !== val); }
      LST.page = 1; renderList();
    });
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }

  function renderEmptyState() {
    root.innerHTML =
      '<div class="flex items-center justify-between mb-4"><h1 class="page-title">Vendors</h1></div>' +
      '<div class="panel" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:560px;text-align:center;padding:96px 20px 48px">' +
        // storefront illustration — mirrors emptyState.tsx (awning + 3 product stalls + dashed "add" tile)
        '<svg width="240" height="174" viewBox="0 0 240 174" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="margin-bottom:30px">' +
          '<circle cx="120" cy="86" r="74" fill="#EAF1FE" />' +
          '<path d="M50 55C50 52.7909 51.7909 51 54 51H184C186.209 51 188 52.7909 188 55V93H50V55Z" fill="#5F6B82" />' +
          '<rect x="50" y="93" width="138" height="72" fill="#F7F9FE" />' +
          '<rect x="64" y="66" width="51" height="10" rx="1.5" fill="#E6ECF7" />' +
          '<circle cx="62" cy="62" r="2" fill="#7B879D" /><circle cx="69" cy="62" r="2" fill="#7B879D" /><circle cx="76" cy="62" r="2" fill="#7B879D" />' +
          '<rect x="62" y="95" width="42" height="54" fill="#FFFFFF" /><rect x="110" y="95" width="42" height="54" fill="#FFFFFF" /><rect x="158" y="95" width="42" height="54" fill="#FFFFFF" />' +
          '<path d="M71 107L82 101L96 107L93 115L88 113V132H76V113L71 115V107Z" fill="#A9B8D1" />' +
          '<rect x="72" y="136" width="22" height="3" rx="1.5" fill="#E7EBF3" />' +
          '<path d="M120 119C129.5 120.5 138.5 126 145 129H120V119Z" fill="#A9B8D1" /><path d="M122 112L129 120L145 129H120L122 112Z" fill="#C2CCE0" />' +
          '<rect x="120" y="136" width="22" height="3" rx="1.5" fill="#E7EBF3" />' +
          '<ellipse cx="179" cy="119" rx="12" ry="5" fill="#A9B8D1" /><path d="M174 115C174 109 184 109 184 115V119H174V115Z" fill="#C2CCE0" />' +
          '<rect x="168" y="136" width="22" height="3" rx="1.5" fill="#E7EBF3" />' +
          '<rect x="195" y="95" width="42" height="54" fill="#FFFFFF" stroke="#B5C2D6" stroke-dasharray="4 4" />' +
          '<path d="M216 113V131M207 122H225" stroke="#3477F4" stroke-linecap="round" stroke-width="3" />' +
        '</svg>' +
        '<h2 style="font-size:20px;font-weight:600;color:#202124;margin-bottom:24px">Add and manage product vendors</h2>' +
        '<button class="btn btn-primary" data-act="add" style="width:144px;justify-content:center">Add vendor</button>' +
      '</div>';
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  // =====================================================================
  //  EDIT VIEW  (vendorEdit.tsx + VendorProductsTable.tsx)
  // =====================================================================
  // working copy of the form lives here so the products table + drawer can mutate it
  let FORM = null;
  let IS_EDIT = false;

  function blankForm() {
    return {
      id: 0, name: '', address: '', description: '', image: '', status: 1,
      handle: '', seoTitle: '', seoDescription: '', seoKeywords: [],
      template: 'Default', sortOrder: 'custom', products: [],
    };
  }

  function renderEdit(id) {
    IS_EDIT = id !== '0';
    if (IS_EDIT) {
      const src = D.DETAILS[id] || D.DETAILS[Number(id)];
      if (!src) { renderMissing(id); return; }
      FORM = JSON.parse(JSON.stringify(src));
    } else {
      FORM = blankForm();
    }
    paintEdit();
  }

  function paintEdit() {
    const f = FORM;
    const seoUrl = D.WEBSITE_DOMAIN + '/stores/' + (f.handle || '');
    const pageTitle = (f.seoTitle && f.seoTitle !== f.name) ? f.seoTitle : f.name;
    const metaDesc = (f.seoDescription && f.seoDescription !== f.description) ? f.seoDescription : f.description;
    const heading = IS_EDIT ? (f.name && f.name.trim() ? f.name : 'Edit vendor') : 'Add vendor';

    root.innerHTML =
      // header
      '<div class="flex items-center gap-2 mb-6">' +
        '<button class="back-btn" data-act="back" title="Back to vendors">' + I.arrowLeft + '</button>' +
        '<h1 class="page-title">' + esc(heading) + '</h1>' +
      '</div>' +
      // two-column body
      '<div class="flex gap-6" style="align-items:flex-start;flex-wrap:wrap">' +
        // main column
        '<div style="flex:1;min-width:340px">' +
          vendorDetailsCard(f) +
          vendorProductsCard(f) +
          '<div class="flex justify-end gap-2 mt-6">' +
            '<button class="btn btn-primary" data-act="save">' + (IS_EDIT ? 'Update' : 'Add vendor') + '</button>' +
            (IS_EDIT ? '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:#f3c6bd">Delete vendor</button>' : '') +
          '</div>' +
        '</div>' +
        // right rail (275px in vendorEdit.tsx)
        '<div style="width:275px;flex:0 0 275px;min-width:275px">' +
          statusCard(f) +
          seoCard(f, seoUrl, pageTitle, metaDesc) +
          imageCard(f) +
          templateCard(f) +
        '</div>' +
      '</div>';

    wireEdit();
  }

  function cardOpen(titleHtml, rightHtml) {
    return '<div class="panel card-pad mb-6">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="card-title">' + titleHtml + '</div>' +
        (rightHtml || '') +
      '</div>';
  }

  // ---- Vendor details card (name / address / description) ----
  function vendorDetailsCard(f) {
    return cardOpen('Vendor details') +
      '<div class="mb-4">' +
        '<label class="ctrl-label" style="text-transform:none;margin-bottom:6px">Vendor name <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="f-name" maxlength="100" placeholder="e.g. Nike, Apple, Local Artisan Co." value="' + esc(f.name) + '" />' +
        '<div id="f-name-err" style="color:var(--err);font-size:12px;margin-top:4px;display:none"></div>' +
      '</div>' +
      '<div class="mb-4">' +
        '<label class="ctrl-label" style="text-transform:none;margin-bottom:6px">Vendor address</label>' +
        '<textarea class="input" id="f-address" maxlength="300" rows="3" placeholder="e.g. 123 Main Street, New York, NY 10001, United States" style="height:auto;padding:8px 12px;resize:vertical">' + esc(f.address) + '</textarea>' +
      '</div>' +
      '<div>' +
        '<label class="ctrl-label" style="text-transform:none;margin-bottom:6px">Vendor description</label>' +
        '<textarea class="input" id="f-desc" maxlength="1000" rows="4" placeholder="Briefly describe this vendor — their specialty, product range, or any notes relevant to store. (Optional)" style="height:auto;padding:8px 12px;resize:vertical">' + esc(f.description) + '</textarea>' +
      '</div>' +
    '</div>';
  }

  // ---- Vendor products card (table + sort select + Add products) ----
  function vendorProductsCard(f) {
    const sortOpts = D.SORT_ORDERS.map((o) => '<option value="' + o.value + '"' + (o.value === f.sortOrder ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const head =
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="card-title">Vendor products</div>' +
        '<div class="flex items-center gap-3">' +
          '<div class="flex items-center gap-2"><span class="muted" style="font-size:13px">Sort:</span>' +
            '<select class="filter-select" id="vp-sort" style="width:180px">' + sortOpts + '</select></div>' +
          '<button class="btn btn-primary" data-act="add-products">Add products</button>' +
        '</div>' +
      '</div>';

    let body;
    if (f.products.length) {
      const canDrag = f.sortOrder === 'custom';
      const sorted = sortProducts(f.products, f.sortOrder);
      const rows = sorted.map((p, i) =>
        '<tr data-pid="' + p.product_id + '" data-idx="' + i + '"' + (canDrag ? ' draggable="true"' : '') + '>' +
          '<td style="width:80px"><div class="flex items-center gap-2">' +
            (canDrag ? '<span class="vp-grip" style="cursor:grab;color:#9ca3af;display:inline-flex">' + I.grip + '</span>' : '') +
            '<span>' + (i + 1) + '</span></div></td>' +
          '<td style="width:260px"><div class="flex items-center gap-2">' +
            (p.image
              ? '<div style="width:40px;height:40px;border-radius:6px;overflow:hidden;background:#f3f4f6;flex:none"><img src="' + p.image + '" alt="" style="width:100%;height:100%;object-fit:cover" /></div>'
              : '<div style="width:40px;height:40px;border-radius:6px;background:#e5e7eb;display:grid;place-items:center;color:#9ca3af;font-size:11px;flex:none">IMG</div>') +
            '<span style="color:var(--ink)">' + esc(productTitle(p)) + '</span></div></td>' +
          '<td>' + inventoryText(p) + '</td>' +
          '<td style="width:150px">' + formatPrice(p) + '</td>' +
          '<td style="width:130px">' + productStatusText(p) + '</td>' +
          '<td style="width:60px;text-align:center"><button class="back-btn" data-rm="' + p.product_id + '" title="Remove" style="width:30px;height:30px;color:var(--err)">' + I.trash + '</button></td>' +
        '</tr>').join('');
      body =
        '<div style="overflow-x:auto"><table class="tbl" style="min-width:760px">' +
          '<thead><tr><th>No.</th><th>Product</th><th>Inventory quantity</th><th>Price</th><th>Status</th><th style="text-align:center">Action</th></tr></thead>' +
          '<tbody id="vp-tbody">' + rows + '</tbody>' +
        '</table></div>';
    } else {
      body =
        '<div style="border:1px dashed var(--ctl);border-radius:8px;background:#f9fafb;padding:40px 24px;text-align:center">' +
          '<div style="font-size:13px;font-weight:600;color:#374151">Add products to the vendor</div>' +
          '<div class="muted" style="font-size:13px;margin-top:8px">Products added will be displayed here.</div>' +
          '<button class="btn btn-primary mt-4" data-act="add-products" style="margin-top:16px">Add products</button>' +
        '</div>';
    }

    return '<div class="panel card-pad mb-6">' + head + body + '</div>';
  }

  // CollectionProductSortOrder application (sort-utils equivalent)
  function sortProducts(list, order) {
    const arr = list.slice();
    const priceOf = (p) => parseFloat(p.price_min != null ? p.price_min : (p.price || 0));
    switch (order) {
      case 'newest': return arr.sort((a, b) => b.product_id - a.product_id);
      case 'oldest': return arr.sort((a, b) => a.product_id - b.product_id);
      case 'product_title_az': return arr.sort((a, b) => productTitle(a).localeCompare(productTitle(b)));
      case 'product_title_za': return arr.sort((a, b) => productTitle(b).localeCompare(productTitle(a)));
      case 'highest_price': return arr.sort((a, b) => priceOf(b) - priceOf(a));
      case 'lowest_price': return arr.sort((a, b) => priceOf(a) - priceOf(b));
      default: return arr.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)); // custom
    }
  }

  // ---- Right rail cards ----
  function statusCard(f) {
    const radio = (val, label) =>
      '<label class="flex items-center gap-2" style="cursor:pointer;font-size:13.5px;color:var(--ink-body)">' +
        '<input type="radio" name="v-status" value="' + val + '"' + (f.status === val ? ' checked' : '') + ' style="accent-color:var(--brand)" />' +
        '<span>' + label + '</span></label>';
    return '<div class="panel card-pad mb-6">' +
      '<div class="card-title mb-4">Status</div>' +
      '<div class="flex flex-col gap-3">' + radio(1, 'Visible') + radio(0, 'Hidden') + '</div>' +
    '</div>';
  }

  function seoCard(f, seoUrl, pageTitle, metaDesc) {
    return '<div class="panel card-pad mb-6">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="card-title">Search engine optimization</div>' +
        '<button class="back-btn" data-act="edit-seo" title="Edit SEO" style="width:28px;height:28px;background:transparent;color:var(--ink-muted)">' + I.pencil + '</button>' +
      '</div>' +
      '<div class="muted" style="font-size:12px;word-break:break-all;margin-bottom:8px">' + esc(seoUrl) + '</div>' +
      '<div style="font-size:13px;color:var(--brand);word-break:break-all;margin-bottom:4px">' + esc(pageTitle || 'Page title') + '</div>' +
      '<div class="muted" style="font-size:13px;word-break:break-all">' + esc(metaDesc || 'Meta description') + '</div>' +
    '</div>';
  }

  function imageCard(f) {
    const body = f.image
      ? '<div style="position:relative">' +
          '<div style="height:180px;border:1px solid var(--hair);border-radius:8px;background:#f9fafb;display:flex;align-items:center;justify-content:center;overflow:hidden">' +
            '<img src="' + f.image + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain" /></div>' +
          '<button data-act="rm-image" title="Remove image" style="position:absolute;top:8px;right:8px;width:30px;height:30px;border:none;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;cursor:pointer;display:grid;place-items:center">' + I.x + '</button>' +
        '</div>'
      : '<div style="min-height:180px;border:2px dashed var(--ctl);border-radius:8px;background:#f9fafb;display:flex;align-items:center;justify-content:center">' +
          '<button class="btn btn-primary" data-act="add-image">Add image</button></div>';
    return '<div class="panel card-pad mb-6">' +
      '<div class="card-title mb-4">Image</div>' +
      body +
      '<div class="muted" style="font-size:12px;margin-top:8px">Supports files in jpg/jpeg/png/webp formats. Files smaller than 4MB work better.</div>' +
    '</div>';
  }

  function templateCard(f) {
    const opts = D.TEMPLATES.map((t) => '<option value="' + esc(t) + '"' + (t === f.template ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
    return '<div class="panel card-pad mb-6">' +
      '<div class="card-title mb-4">Theme template</div>' +
      '<select class="input" id="f-template">' + opts + '</select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you’d like the page to look like</div>' +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-2 mb-6">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<h1 class="page-title">Vendor #' + esc(id) + '</h1>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Detail not available in this prototype</div>' +
        '<div class="muted">Open one of the vendors flagged with sample detail: Silix Official, BumpBabe, NorthPeak Outdoors or Verdant Greens (empty-products case).</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/vendors'; };
  }

  function wireEdit() {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = () => { location.hash = '#/vendors'; };

    // form fields -> FORM (live; refresh SEO preview on name/desc change)
    const name = root.querySelector('#f-name');
    if (name) name.oninput = () => {
      FORM.name = name.value;
      // keep SEO title + handle in sync when not customized (getNextSeoFields behavior)
      if (!FORM._seoTitleCustom) FORM.seoTitle = FORM.name;
      if (!FORM._handleCustom) FORM.handle = handleFromName(FORM.name);
      const err = root.querySelector('#f-name-err'); if (err && FORM.name.trim()) err.style.display = 'none';
      refreshSeoPreview();
    };
    const addr = root.querySelector('#f-address'); if (addr) addr.oninput = () => { FORM.address = addr.value; };
    const desc = root.querySelector('#f-desc'); if (desc) desc.oninput = () => {
      FORM.description = desc.value;
      if (!FORM._seoDescCustom) FORM.seoDescription = FORM.description;
      refreshSeoPreview();
    };
    const tpl = root.querySelector('#f-template'); if (tpl) tpl.onchange = () => { FORM.template = tpl.value; };
    root.querySelectorAll('input[name="v-status"]').forEach((r) => r.onchange = () => { FORM.status = Number(r.value); });

    // products: sort select
    const vpSort = root.querySelector('#vp-sort'); if (vpSort) vpSort.onchange = () => { FORM.sortOrder = vpSort.value; paintEdit(); };
    // products: remove
    root.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => {
      const pid = Number(b.getAttribute('data-rm'));
      FORM.products = FORM.products.filter((p) => p.product_id !== pid).map((p, i) => Object.assign({}, p, { sort_order: i + 1 }));
      paintEdit();
    });
    // products: add (picker modal)
    root.querySelectorAll('[data-act="add-products"]').forEach((b) => b.onclick = () => openAddProductsModal());
    // drag reorder (custom only)
    if (FORM.sortOrder === 'custom') wireDragReorder();

    // right rail
    const editSeo = root.querySelector('[data-act="edit-seo"]'); if (editSeo) editSeo.onclick = () => openSeoDrawer();
    const addImg = root.querySelector('[data-act="add-image"]'); if (addImg) addImg.onclick = () => openImageModal();
    const rmImg = root.querySelector('[data-act="rm-image"]'); if (rmImg) rmImg.onclick = () => { FORM.image = ''; paintEdit(); };

    // footer
    const save = root.querySelector('[data-act="save"]'); if (save) save.onclick = () => handleSave();
    const del = root.querySelector('[data-act="delete"]'); if (del) del.onclick = () => openDeleteModal();
  }

  function refreshSeoPreview() {
    // re-render only the SEO card region cheaply: easiest is to repaint right rail bits
    const f = FORM;
    const seoUrl = D.WEBSITE_DOMAIN + '/stores/' + (f.handle || '');
    const pageTitle = (f.seoTitle && f.seoTitle !== f.name) ? f.seoTitle : f.name;
    const metaDesc = (f.seoDescription && f.seoDescription !== f.description) ? f.seoDescription : f.description;
    const card = root.querySelector('[data-act="edit-seo"]');
    if (!card) return;
    const panel = card.closest('.panel');
    const urlEl = panel.children[1], titleEl = panel.children[2], descEl = panel.children[3];
    if (urlEl) urlEl.textContent = seoUrl;
    if (titleEl) titleEl.textContent = pageTitle || 'Page title';
    if (descEl) descEl.textContent = metaDesc || 'Meta description';
  }

  function wireDragReorder() {
    const tbody = root.querySelector('#vp-tbody'); if (!tbody) return;
    let dragIdx = null;
    tbody.querySelectorAll('tr[draggable="true"]').forEach((tr) => {
      tr.addEventListener('dragstart', (e) => { dragIdx = Number(tr.getAttribute('data-idx')); e.dataTransfer.effectAllowed = 'move'; tr.style.opacity = '.5'; });
      tr.addEventListener('dragend', () => { tr.style.opacity = ''; dragIdx = null; });
      tr.addEventListener('dragover', (e) => { e.preventDefault(); tr.style.borderTop = '2px solid var(--brand)'; });
      tr.addEventListener('dragleave', () => { tr.style.borderTop = ''; });
      tr.addEventListener('drop', (e) => {
        e.preventDefault(); tr.style.borderTop = '';
        const tgt = Number(tr.getAttribute('data-idx'));
        if (dragIdx === null || dragIdx === tgt) return;
        const sorted = sortProducts(FORM.products, 'custom');
        const moved = sorted.splice(dragIdx, 1)[0];
        sorted.splice(tgt, 0, moved);
        FORM.products = sorted.map((p, i) => Object.assign({}, p, { sort_order: i + 1 }));
        paintEdit();
      });
    });
  }

  function handleSave() {
    if (!FORM.name.trim()) {
      const err = root.querySelector('#f-name-err');
      if (err) { err.textContent = "Can't be blank"; err.style.display = 'block'; }
      const nm = root.querySelector('#f-name'); if (nm) nm.focus();
      return;
    }
    toast(IS_EDIT ? 'Updated successfully' : 'Added successfully');
    if (!IS_EDIT) setTimeout(() => { location.hash = '#/vendors'; }, 350);
  }

  // =====================================================================
  //  SEO DRAWER  (vendorEdit.tsx <Drawer> — page title / meta / handle / keywords)
  // =====================================================================
  function openSeoDrawer() {
    const f = FORM;
    const draft = {
      pageTitle: (f.seoTitle && f.seoTitle !== f.name) ? f.seoTitle : f.name,
      metaDescription: (f.seoDescription && f.seoDescription !== f.description) ? f.seoDescription : f.description,
      handle: f.handle || '',
      keywords: (f.seoKeywords || []).slice(),
    };
    let handleTouched = false;

    const backdrop = h('<div class="drawer-backdrop"></div>');
    const drawer = h('<div class="drawer" style="width:480px"></div>');
    const previewUrl = () => D.WEBSITE_DOMAIN + '/stores/' + (draft.handle || '');
    const fieldLabel = (text, tip) => '<div class="flex items-center gap-1 mb-2"><span style="font-size:13px;font-weight:500">' + text + '</span>' +
      '<span class="muted" title="' + esc(tip) + '" style="display:inline-flex;cursor:help">' + I.help + '</span></div>';

    drawer.innerHTML =
      '<div class="drawer-head"><span>Search engine optimization</span><span class="drawer-x" data-x>' + I.x + '</span></div>' +
      '<div class="drawer-body">' +
        '<div class="mb-6">' +
          '<div style="font-size:14px;font-weight:600;margin-bottom:8px">Preview</div>' +
          '<div class="muted" id="sd-url" style="font-size:12px;margin-bottom:4px;word-break:break-all">' + esc(previewUrl()) + '</div>' +
          '<div id="sd-ptitle" style="font-size:14px;font-weight:500;color:var(--brand);word-break:break-all;margin-bottom:4px">' + esc(draft.pageTitle || 'Page title') + '</div>' +
          '<div class="muted" id="sd-pdesc" style="font-size:13px;word-break:break-all">' + esc(draft.metaDescription || 'Meta description') + '</div>' +
        '</div>' +
        '<div class="divider mb-4"></div>' +
        '<div class="mb-4">' + fieldLabel('Page title', 'Page titles make it easier for customers to quickly find content. We recommend using simple and intuitive words.') +
          '<input class="input" id="sd-title" maxlength="200" placeholder="Please enter" value="' + esc(draft.pageTitle) + '" /></div>' +
        '<div class="mb-4">' + fieldLabel('Meta description', 'Try to describe the vendor contents to attract visitors. Too many keywords may drag down your ranking.') +
          '<textarea class="input" id="sd-desc" maxlength="500" rows="4" placeholder="Add a description so that the page can achieve a higher search ranking" style="height:auto;padding:8px 12px;resize:vertical">' + esc(draft.metaDescription) + '</textarea></div>' +
        '<div class="mb-4">' + fieldLabel('Handle', 'Handle is already assigned to another vendor. Choose a different value to ensure it remains unique.') +
          '<div class="flex" style="align-items:stretch">' +
            '<span class="muted" style="display:inline-flex;align-items:center;padding:0 10px;border:1px solid var(--ctl);border-right:none;border-radius:8px 0 0 8px;background:var(--panel);font-size:12px;white-space:nowrap">' + esc(D.WEBSITE_DOMAIN + '/stores/') + '</span>' +
            '<input class="input" id="sd-handle" value="' + esc(draft.handle) + '" style="border-radius:0 8px 8px 0;flex:1;min-width:0" /></div></div>' +
        '<div>' + fieldLabel('SEO keywords', "Using relevant keywords can improve ranking and visibility on search engines. Don't use too many keywords as it may drag down your ranking.") +
          '<div id="sd-kw-box" style="display:flex;flex-wrap:wrap;gap:8px;min-height:36px;border:1px solid var(--ctl);border-radius:8px;padding:6px 8px;align-items:center"></div></div>' +
      '</div>' +
      '<div class="drawer-foot" style="justify-content:flex-end"><button class="btn btn-primary" data-confirm>Confirm</button></div>';

    backdrop.appendChild(drawer); document.body.appendChild(backdrop);

    const sdUrl = drawer.querySelector('#sd-url'), sdPt = drawer.querySelector('#sd-ptitle'), sdPd = drawer.querySelector('#sd-pdesc');
    const sdTitle = drawer.querySelector('#sd-title'), sdDesc = drawer.querySelector('#sd-desc'), sdHandle = drawer.querySelector('#sd-handle');
    const kwBox = drawer.querySelector('#sd-kw-box');

    function renderKw() {
      kwBox.innerHTML = draft.keywords.map((k, i) =>
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border:1px solid #cfe1ff;background:#e6f0ff;border-radius:6px;font-size:13px;color:var(--brand)">' +
          esc(k) + '<span data-rmkw="' + i + '" style="cursor:pointer;display:inline-flex">' + I.x + '</span></span>').join('') +
        '<input id="sd-kw-input" placeholder="' + (draft.keywords.length ? '' : "Press 'Enter' to complete the keywords input") + '" style="flex:1;min-width:120px;border:none;outline:none;background:transparent;font-size:13px;height:24px" />';
      const inp = kwBox.querySelector('#sd-kw-input');
      inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addKw(inp.value); inp.value = ''; } };
      inp.onblur = () => { if (inp.value.trim()) { addKw(inp.value); inp.value = ''; } };
      kwBox.querySelectorAll('[data-rmkw]').forEach((x) => x.onclick = () => { draft.keywords.splice(Number(x.getAttribute('data-rmkw')), 1); renderKw(); });
    }
    function addKw(v) { const k = (v || '').trim(); if (!k || draft.keywords.includes(k)) return; draft.keywords.push(k); renderKw(); }
    renderKw();

    const syncPreview = () => { sdUrl.textContent = previewUrl(); sdPt.textContent = draft.pageTitle || 'Page title'; sdPd.textContent = draft.metaDescription || 'Meta description'; };
    sdTitle.oninput = () => { draft.pageTitle = sdTitle.value; if (!handleTouched) { draft.handle = handleFromName(sdTitle.value); sdHandle.value = draft.handle; } syncPreview(); };
    sdDesc.oninput = () => { draft.metaDescription = sdDesc.value; syncPreview(); };
    sdHandle.oninput = () => { draft.handle = sdHandle.value; handleTouched = true; syncPreview(); };

    const close = () => backdrop.remove();
    drawer.querySelector('[data-x]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    drawer.querySelector('[data-confirm]').onclick = () => {
      FORM.seoTitle = draft.pageTitle;
      FORM.seoDescription = draft.metaDescription;
      FORM.handle = draft.handle.trim();
      FORM.seoKeywords = draft.keywords.slice();
      FORM._seoTitleCustom = !!draft.pageTitle && draft.pageTitle !== FORM.name;
      FORM._seoDescCustom = !!draft.metaDescription && draft.metaDescription !== FORM.description;
      FORM._handleCustom = handleTouched || !!draft.handle;
      close(); paintEdit();
    };
  }

  // =====================================================================
  //  ADD PRODUCTS MODAL  (AddProductsModal — searchable picker w/ checkboxes)
  // =====================================================================
  function openAddProductsModal() {
    const selectedIds = new Set(FORM.products.map((p) => p.product_id));
    const picked = new Set();           // newly checked this session
    let q = '';

    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:720px;max-width:94vw"></div>');
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>Add products</span><span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body" style="padding:0">' +
        '<div style="position:relative;padding:14px 18px;border-bottom:1px solid var(--hair)">' +
          '<span style="position:absolute;left:30px;top:24px;color:var(--ink-muted)">' + I.search + '</span>' +
          '<input class="filter-input" id="ap-q" placeholder="Search products" style="width:100%;padding-left:34px" />' +
        '</div>' +
        '<div id="ap-list" style="max-height:420px;overflow:auto"></div>' +
      '</div>' +
      '<div class="modal-foot"><span class="muted" id="ap-count" style="margin-right:auto;font-size:13px"></span>' +
        '<button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>Add</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);

    const listEl = m.querySelector('#ap-list');
    const countEl = m.querySelector('#ap-count');

    function rows() {
      const pool = D.PRODUCT_POOL.filter((p) => productTitle(p).toLowerCase().includes(q.toLowerCase()));
      listEl.innerHTML = pool.map((p) => {
        const already = selectedIds.has(p.product_id);
        const checked = already || picked.has(p.product_id);
        return '<label class="flex items-center gap-3" style="padding:10px 18px;border-bottom:1px solid var(--hair);cursor:' + (already ? 'default' : 'pointer') + ';' + (already ? 'opacity:.55' : '') + '">' +
          '<input type="checkbox" data-pid="' + p.product_id + '"' + (checked ? ' checked' : '') + (already ? ' disabled' : '') + ' style="width:16px;height:16px;accent-color:var(--brand);flex:none" />' +
          (p.image
            ? '<div style="width:40px;height:40px;border-radius:6px;overflow:hidden;background:#f3f4f6;flex:none"><img src="' + p.image + '" alt="" style="width:100%;height:100%;object-fit:cover" /></div>'
            : '<div style="width:40px;height:40px;border-radius:6px;background:#e5e7eb;display:grid;place-items:center;color:#9ca3af;font-size:11px;flex:none">IMG</div>') +
          '<div style="flex:1;min-width:0"><div style="font-size:13.5px;color:var(--ink);font-weight:500">' + esc(productTitle(p)) + '</div>' +
            '<div class="muted" style="font-size:12px">' + formatPrice(p) + ' · ' + (p.on_sale_stock || 0) + ' on sale' + (already ? ' · already added' : '') + '</div></div>' +
        '</label>';
      }).join('') || '<div class="muted" style="padding:30px;text-align:center">No products match “' + esc(q) + '”.</div>';
      listEl.querySelectorAll('input[data-pid]:not([disabled])').forEach((cb) => cb.onchange = () => {
        const pid = Number(cb.getAttribute('data-pid'));
        if (cb.checked) picked.add(pid); else picked.delete(pid);
        updateCount();
      });
    }
    function updateCount() { countEl.textContent = picked.size ? (picked.size + ' selected') : ''; }

    rows(); updateCount();
    const qInput = m.querySelector('#ap-q');
    qInput.oninput = () => { q = qInput.value; rows(); };

    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => {
      let n = FORM.products.length;
      picked.forEach((pid) => {
        const p = D.PRODUCT_POOL.find((x) => x.product_id === pid);
        if (p && !FORM.products.some((e) => e.product_id === pid)) { n += 1; FORM.products.push(Object.assign({}, p, { sort_order: n })); }
      });
      close();
      if (picked.size) toast(picked.size + ' product' + (picked.size > 1 ? 's' : '') + ' added');
      paintEdit();
    };
  }

  // ---- Add-image modal (stand-in for SelectFile picker) ----
  function openImageModal() {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:520px"></div>');
    const choices = ['vlogo1', 'vlogo2', 'vlogo3', 'vlogo4', 'vlogo5', 'vlogo6'];
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>Select image</span><span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body">' +
        '<div class="muted mb-3" style="font-size:13px">Pick a sample image from your library, or paste an image URL.</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">' +
          choices.map((c) => '<div data-pick="https://picsum.photos/seed/' + c + '/200/200" style="aspect-ratio:1;border:2px solid var(--hair);border-radius:8px;overflow:hidden;cursor:pointer"><img src="https://picsum.photos/seed/' + c + '/120/120" alt="" style="width:100%;height:100%;object-fit:cover" /></div>').join('') +
        '</div>' +
        '<input class="input" id="img-url" placeholder="https://..." />' +
      '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-primary" data-ok>Confirm</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    let chosen = '';
    m.querySelectorAll('[data-pick]').forEach((el) => el.onclick = () => {
      chosen = el.getAttribute('data-pick');
      m.querySelectorAll('[data-pick]').forEach((x) => x.style.borderColor = 'var(--hair)');
      el.style.borderColor = 'var(--brand)';
      m.querySelector('#img-url').value = chosen;
    });
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => {
      const url = m.querySelector('#img-url').value.trim() || chosen;
      if (!url) { close(); return; }
      FORM.image = url; close(); paintEdit();
    };
  }

  // ---- Delete confirm modal (vendorEdit.tsx handleDelete) ----
  function openDeleteModal() {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:440px"></div>');
    m.innerHTML =
      '<div class="modal-head">Confirm to delete?</div>' +
      '<div class="modal-body"><div class="muted" style="font-size:13.5px;line-height:1.6">Once deleted, the data cannot be retrieved.<br/>Please confirm before proceeding!</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-primary" data-ok style="background:var(--err)">Confirm</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); toast('Deleted successfully'); setTimeout(() => { location.hash = '#/vendors'; }, 350); };
  }

  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // =====================================================================
  //  ROUTER
  // =====================================================================
  function goEdit(id) { location.hash = '#/vendors/' + id; }

  function route() {
    closePops();
    const hash = location.hash || '#/vendors';
    const m = hash.match(/^#\/vendors\/(.+)$/);
    if (m) { renderEdit(decodeURIComponent(m[1])); root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/vendors';
  route();
})();
