/* BestShopio Admin · Google (Merchant Center) prototype — products + variants + variant detail + raw data, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only renders the module body into #root.
   Mirrors reference/bestvoy-admin admin/google components. Reads window.DATA_GOOGLE from js/data.js. */
(function () {
  const D = window.DATA_GOOGLE;
  let root; // set by the SPA shell router via VIEWS.google.render(el, rest)

  // tiny html -> element helper (same convention as orders/app.js)
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtTs = (sec) => {
    if (!sec) return '-';
    const d = new Date(sec * 1000);
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  };

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    check: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    x: svg('<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>', 14),
    // Free Listings logo (google.svg in real)
    google: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    // Shopping Ads / Display Ads logo (google_ads.svg in real) — distinct triangular Ads mark
    googleAds: svg('<path d="M10 3 3 15a3 3 0 0 0 5.2 3L15.2 6A3 3 0 0 0 10 3Z"/><path d="m14 3 7 12a3 3 0 0 1-5.2 3"/><circle cx="6" cy="18" r="2"/>'),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- submit_status -> pill (mirrors statusNameMap / statusColorMap in table.tsx) ----
  // 0 All, 1 Unsubmitted, 2 Submitted, 3 Partial submitted, 4 Pending
  const SUBMIT_PILL = {
    1: { text: 'Unsubmitted',       cls: 'pill-gray' },
    2: { text: 'Submitted',         cls: 'pill-green' },
    3: { text: 'Partial submitted', cls: 'pill-orange' },
    4: { text: 'Pending',           cls: 'pill-blue' },
  };
  const submitPill = (st) => {
    const m = SUBMIT_PILL[st] || { text: 'Unknown', cls: 'pill-gray' };
    return '<span class="pill ' + m.cls + '"><span class="dot"></span>' + esc(m.text) + '</span>';
  };

  // ---- destination status -> icon (mirrors statusConfig in table.tsx / detail.tsx) ----
  const DEST_ICON = {
    Approved:    { ico: I.check, color: 'var(--ok)' },
    Pending:     { ico: I.clock, color: 'var(--brand)' },
    Disapproved: { ico: I.x,     color: 'var(--err)' },
    Unsubmitted: { ico: I.x,     color: 'var(--ink-muted)' },
  };
  // severity -> chip color (mirrors severityConfig)
  const SEVERITY = {
    DISAPPROVED:         { color: 'var(--err)',  text: '#fff', label: 'Disapproved' },
    DEMOTED:             { color: 'var(--warn)', text: '#3a2c00', label: 'Demoted' },
    NOT_IMPACTED:        { color: '#bcbcbc',     text: '#fff', label: 'Not impacted' },
    SEVERITY_UNSPECIFIED:{ color: '#bcbcbc',     text: '#fff', label: 'Unspecified' },
  };
  const severityChip = (sev) => {
    const s = SEVERITY[sev] || SEVERITY.SEVERITY_UNSPECIFIED;
    return '<span class="pill" style="background:' + s.color + ';color:' + s.text + ';padding:2px 10px;font-size:11.5px">' + esc(s.label) + '</span>';
  };

  // group itemLevelIssues by severity -> { SEV: [desc,...] }
  function groupIssues(dest) {
    const out = {};
    ((dest && dest.itemLevelIssues) || []).forEach((iss) => {
      const sev = iss.severity || 'SEVERITY_UNSPECIFIED';
      (out[sev] = out[sev] || []).push(iss.description || iss.code || 'Unknown issue');
    });
    return out;
  }

  // ============================================================
  // PRODUCTS LIST  (#/products)
  // ============================================================
  const PL = { tab: 0, kwType: 'product_name', kw: '', kwApplied: '', page: 1, size: 20, selected: {} };

  const productTabCount = (key) => key === 0 ? D.PRODUCTS.length : D.PRODUCTS.filter((p) => p.submit_status === key).length;

  function productRows() {
    let rows = D.PRODUCTS.slice();
    if (PL.tab !== 0) rows = rows.filter((p) => p.submit_status === PL.tab);
    if (PL.kwApplied) {
      const q = PL.kwApplied.toLowerCase();
      rows = rows.filter((p) => {
        switch (PL.kwType) {
          case 'product_id': return String(p.product_id).includes(q);
          case 'variant_id': return (D.VARIANTS[p.product_id] || []).some((v) => String(v.unique).toLowerCase().includes(q) || String(v.value_id).includes(q));
          default: return (p.store_name || '').toLowerCase().includes(q);
        }
      });
    }
    return rows;
  }

  function renderProducts() {
    PL.page = PL.page || 1;
    const rows = productRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / PL.size));
    if (PL.page > pages) PL.page = pages;
    const start = (PL.page - 1) * PL.size;
    const pageRows = rows.slice(start, start + PL.size);

    const selIds = Object.keys(PL.selected).filter((k) => PL.selected[k]);

    const tabsHtml = D.PRODUCT_TABS.map((t) =>
      '<div class="tab' + (t.key === PL.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + productTabCount(t.key) + '</span></div>').join('');

    const kwOpts = D.PRODUCT_KEYWORD_OPTIONS.map((o) => '<option value="' + o.value + '"' + (o.value === PL.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const tags = PL.kwApplied
      ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap"><span class="field-pill" data-clear="kw">' +
          esc((D.PRODUCT_KEYWORD_OPTIONS.find((o) => o.value === PL.kwType) || {}).label || '') + ': ' + esc(PL.kwApplied) +
          ' <span class="x">&times;</span></span></div>'
      : '';

    root.innerHTML =
      // header — real products/list.tsx renders only the title (no actions / account chip)
      '<div class="flex items-center gap-3 mb-4">' +
        '<h1 class="page-title">Products</h1>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="pl-tabs">' + tabsHtml + '</div>' +
        // selection toolbar (mirrors selection-toolbar in products/table.tsx: "{n} Selected" + Sync GMC)
        (selIds.length
          ? '<div class="card-pad flex items-center gap-3" style="padding-bottom:0">' +
              '<span class="subtle"><strong>' + selIds.length + ' Selected</strong></span>' +
              '<button class="btn btn-default" style="height:28px" data-act="sync-selected">Sync GMC</button>' +
            '</div>'
          : '') +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex" style="max-width:430px">' +
            '<select class="filter-select" id="pl-kw-type" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
            '<div style="position:relative;flex:1">' +
              '<input class="filter-input" id="pl-kw" placeholder="Search" value="' + esc(PL.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
              '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
            '</div>' +
          '</div>' + tags +
        '</div>' +
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1100px">' +
          // columns mirror products/table.tsx exactly: Product, Variants, GMC issues summary, Last sync, Status (no Actions column)
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="pl-all" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (pageRows.length && pageRows.every((p) => PL.selected[p.product_id]) ? ' checked' : '') + ' /></th>' +
            '<th>Product</th><th>Variants</th><th style="width:300px">GMC issues summary</th>' +
            '<th style="width:180px">Last sync</th><th style="width:150px">Status</th>' +
          '</tr></thead>' +
          '<tbody id="pl-tbody">' +
            (pageRows.length ? pageRows.map(productRowHtml).join('')
              : '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">No products match these filters.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + totalRecords + ' records</span>' +
          pagerHtml(PL.page, pages, 'pl') +
        '</div>' +
      '</div>';

    wireProducts();
  }

  function productRowHtml(p) {
    const vs = p.variant_stats || { total: 0, submitted: 0, approved: 0 };
    const is = p.issues_stats || { disapproved: 0, demoted: 0, not_impacted: 0 };
    const issueChips =
      (is.disapproved > 0 ? '<span class="pill pill-red" style="padding:2px 10px;font-size:11.5px"><span class="dot"></span>' + is.disapproved + ' Disapproved</span>' : '') +
      (is.demoted > 0 ? '<span class="pill pill-orange" style="padding:2px 10px;font-size:11.5px"><span class="dot"></span>' + is.demoted + ' Demoted</span>' : '') +
      (is.not_impacted > 0 ? '<span class="pill pill-gray" style="padding:2px 10px;font-size:11.5px"><span class="dot"></span>' + is.not_impacted + ' Not impacted</span>' : '');
    // Variants cell mirrors products/table.tsx: "{approved} Approved / {submitted} Submitted / {total} Total"
    // (number plain, the label word is colored: Approved #52c41a green, Submitted #006be6 blue, Total plain)
    return '<tr data-id="' + p.product_id + '">' +
      '<td><input type="checkbox" class="pl-pick" data-id="' + p.product_id + '" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (PL.selected[p.product_id] ? ' checked' : '') + ' /></td>' +
      '<td><div class="flex items-center gap-2">' +
        '<img src="' + esc(p.image) + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none;object-fit:cover" onerror="this.style.visibility=\'hidden\'" />' +
        '<span class="lnk" data-variants="' + p.product_id + '" style="font-weight:500;cursor:pointer">' + esc(p.store_name) + '</span>' +
      '</div></td>' +
      '<td>' + vs.approved + ' <span style="color:#52c41a">Approved</span> / ' +
        vs.submitted + ' <span style="color:#006be6">Submitted</span> / ' +
        vs.total + ' <span>Total</span></td>' +
      '<td><div class="flex items-center gap-1" style="flex-wrap:wrap">' + (issueChips || '<span class="muted">—</span>') + '</div></td>' +
      '<td class="muted">' + esc(fmtTs(p.last_sync_time)) + '</td>' +
      '<td>' + submitPill(p.submit_status) + '</td>' +
    '</tr>';
  }

  function wireProducts() {
    root.querySelectorAll('#pl-tabs .tab').forEach((t) => t.onclick = () => { PL.tab = Number(t.getAttribute('data-tab')); PL.page = 1; renderProducts(); });
    const kwType = root.querySelector('#pl-kw-type');
    const kwInput = root.querySelector('#pl-kw');
    if (kwType) kwType.onchange = () => { PL.kwType = kwType.value; };
    if (kwInput) {
      kwInput.oninput = () => { PL.kw = kwInput.value; };
      const commit = () => { PL.kwApplied = (PL.kw || '').trim(); PL.page = 1; renderProducts(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    const clear = root.querySelector('[data-clear="kw"]'); if (clear) clear.onclick = () => { PL.kw = ''; PL.kwApplied = ''; PL.page = 1; renderProducts(); };
    // selection
    const all = root.querySelector('#pl-all');
    if (all) all.onchange = () => { productRows().slice((PL.page - 1) * PL.size, (PL.page - 1) * PL.size + PL.size).forEach((p) => PL.selected[p.product_id] = all.checked); renderProducts(); };
    root.querySelectorAll('.pl-pick').forEach((c) => c.onchange = () => { PL.selected[c.getAttribute('data-id')] = c.checked; renderProducts(); });
    // selection toolbar "Sync GMC" (Popconfirm in real -> confirm() here) → batchProductsSkuGmc
    const syncSel = root.querySelector('[data-act="sync-selected"]'); if (syncSel) syncSel.onclick = () => { const n = Object.keys(PL.selected).filter((k) => PL.selected[k]).length; if (confirm('Are you sure to sync GMC?')) toast('Sync GMC successfully (' + n + ' product(s))'); };
    // pagination + size
    wirePager('pl', PL, renderProducts);
    // navigation: only the product-name link opens variants (real products/table.tsx wraps store_name in a RouterLink; rows are not clickable)
    root.querySelectorAll('[data-variants]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goVariants(b.getAttribute('data-variants')); });
  }

  // ============================================================
  // VARIANTS LIST  (#/variants  &  #/variants?product=:id)
  // ============================================================
  const VL = { productId: null, tab: 0, kwType: 'variant', kw: '', kwApplied: '', priceApplied: null, invApplied: null, page: 1, size: 20, selected: {}, allInProduct: false };

  function variantsForProduct(pid) {
    if (pid && D.VARIANTS[pid]) return D.VARIANTS[pid];
    // no product selected (or product has no variant list) -> flatten everything for an "all variants" view
    return Object.keys(D.VARIANTS).reduce((acc, k) => acc.concat(D.VARIANTS[k]), []);
  }

  const variantTabCount = (key, all) => key === 0 ? all.length : all.filter((v) => v.submit_status === key).length;

  function variantRows(all) {
    let rows = all.slice();
    if (VL.tab !== 0) rows = rows.filter((v) => v.submit_status === VL.tab);
    if (VL.kwApplied) {
      const q = VL.kwApplied.toLowerCase();
      rows = rows.filter((v) => {
        if (VL.kwType === 'variant_id') return String(v.unique).toLowerCase().includes(q) || String(v.value_id).includes(q);
        const text = Object.values(v.detail || {}).join(' / ') || v.sku;
        return text.toLowerCase().includes(q) || (v.sku || '').toLowerCase().includes(q);
      });
    }
    if (VL.priceApplied) {
      const { min, max } = VL.priceApplied;
      rows = rows.filter((v) => { const p = parseFloat(v.price); return (min == null || p >= min) && (max == null || p <= max); });
    }
    if (VL.invApplied) {
      const { min, max } = VL.invApplied;
      rows = rows.filter((v) => { const s = Number(v.stock); return (min == null || s >= min) && (max == null || s <= max); });
    }
    return rows;
  }
  // range -> label (mirrors formatText in search.tsx useRange)
  function rangeLabel(r, fmt) {
    fmt = fmt || ((v) => String(v));
    if (r.min != null && r.max != null) return fmt(r.min) + ' - ' + fmt(r.max);
    if (r.min != null) return fmt(r.min) + '+';
    if (r.max != null) return fmt(0) + ' - ' + fmt(r.max);
    return '';
  }

  function renderVariants() {
    VL.page = VL.page || 1;
    const all = variantsForProduct(VL.productId);
    const rows = variantRows(all);
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / VL.size));
    if (VL.page > pages) VL.page = pages;
    const start = (VL.page - 1) * VL.size;
    const pageRows = rows.slice(start, start + VL.size);

    const selIds = Object.keys(VL.selected).filter((k) => VL.selected[k]);

    const tabsHtml = D.VARIANT_TABS.map((t) =>
      '<div class="tab' + (t.key === VL.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + variantTabCount(t.key, all) + '</span></div>').join('');

    const kwOpts = D.VARIANT_KEYWORD_OPTIONS.map((o) => '<option value="' + o.value + '"' + (o.value === VL.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const priceLbl = VL.priceApplied ? rangeLabel(VL.priceApplied, (v) => '$' + v) : '';
    const invLbl = VL.invApplied ? rangeLabel(VL.invApplied) : '';
    const tagParts = [];
    if (VL.kwApplied) tagParts.push('<span class="field-pill" data-clear="kw">' +
      esc((D.VARIANT_KEYWORD_OPTIONS.find((o) => o.value === VL.kwType) || {}).label || '') + ': ' + esc(VL.kwApplied) + ' <span class="x">&times;</span></span>');
    if (VL.priceApplied) tagParts.push('<span class="field-pill" data-clear="price">Price range: ' + esc(priceLbl) + ' <span class="x">&times;</span></span>');
    if (VL.invApplied) tagParts.push('<span class="field-pill" data-clear="inv">Inventory range: ' + esc(invLbl) + ' <span class="x">&times;</span></span>');
    const tags = tagParts.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap">' + tagParts.join('') + '</div>' : '';

    // range dropdown trigger (chip showing applied label or placeholder) + hidden panel
    const rangeCtl = (ns, applied, label, placeholder) =>
      '<div style="position:relative">' +
        '<div class="chip" id="vl-' + ns + '-trigger" style="width:180px;justify-content:space-between">' +
          '<span class="' + (applied ? '' : 'muted') + '" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(applied ? label : placeholder) + '</span>' + I.chevDown +
        '</div>' +
        '<div id="vl-' + ns + '-panel" class="panel" style="display:none;position:absolute;z-index:30;top:38px;left:0;width:300px;padding:14px;box-shadow:var(--float-shadow)">' +
          '<div class="flex items-center gap-2" style="margin-bottom:12px">' +
            '<input class="filter-input" id="vl-' + ns + '-min" type="number" placeholder="Minimum value" value="' + (applied && applied.min != null ? applied.min : '') + '" style="width:100%;padding-left:12px" />' +
            '<span class="muted">-</span>' +
            '<input class="filter-input" id="vl-' + ns + '-max" type="number" placeholder="Maximum value" value="' + (applied && applied.max != null ? applied.max : '') + '" style="width:100%;padding-left:12px" />' +
          '</div>' +
          '<div class="flex justify-end"><button class="btn btn-primary" id="vl-' + ns + '-apply">Confirm</button></div>' +
        '</div>' +
      '</div>';

    // header — real variants/list.tsx renders back button + title only (no actions / subtitle)
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back" title="Back to products">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Variants</span>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="vl-tabs">' + tabsHtml + '</div>' +
        // selection toolbar (variants/table.tsx): "{n} Selected"/"All in this product selected" + chevron menu, then Sync GMC
        (selIds.length
          ? '<div class="card-pad flex items-center gap-3" style="padding-bottom:0">' +
              '<div style="position:relative">' +
                '<span class="subtle flex items-center gap-1" id="vl-sel-trigger" style="cursor:pointer"><strong>' +
                  (VL.allInProduct ? 'All in this product selected' : (selIds.length + ' Selected')) + '</strong>' + I.chevDown + '</span>' +
                '<div id="vl-sel-menu" class="panel" style="display:none;position:absolute;z-index:30;top:26px;left:0;min-width:200px;padding:4px;box-shadow:var(--float-shadow)">' +
                  '<div class="vl-sel-opt" style="padding:8px 12px;border-radius:6px;cursor:pointer;font-size:13px">' +
                    (VL.allInProduct ? 'Unselect all' : 'Select all in this product') + '</div>' +
                '</div>' +
              '</div>' +
              '<button class="btn btn-default" style="height:28px" data-act="sync-selected">Sync GMC</button>' +
            '</div>'
          : '') +
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            '<div class="flex" style="width:388px">' +
              '<select class="filter-select" id="vl-kw-type" style="width:120px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="vl-kw" placeholder="Search" value="' + esc(VL.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            rangeCtl('price', VL.priceApplied, priceLbl, 'Price range') +
            rangeCtl('inv', VL.invApplied, invLbl, 'Inventory range') +
          '</div>' + tags +
        '</div>' +
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1400px">' +
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="vl-all" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (pageRows.length && pageRows.every((v) => VL.selected[v.unique]) ? ' checked' : '') + ' /></th>' +
            '<th>Variant</th><th style="width:180px">SKU</th><th style="width:90px" class="num">Price</th>' +
            '<th style="width:90px" class="num">Inventory</th><th style="width:150px">Variant ID</th><th style="width:130px">Status</th>' +
            '<th>' + destHeader('Free Listings', I.google) + '</th><th>' + destHeader('Shopping Ads', I.googleAds) + '</th><th>' + destHeader('Display Ads', I.googleAds) + '</th>' +
          '</tr></thead>' +
          '<tbody id="vl-tbody">' +
            (pageRows.length ? pageRows.map(variantRowHtml).join('')
              : '<tr><td colspan="10" style="text-align:center;padding:40px" class="muted">No variants match these filters.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + totalRecords + ' records</span>' +
          pagerHtml(VL.page, pages, 'vl') +
        '</div>' +
      '</div>';

    wireVariants();
  }

  // column header logo mirrors variants/table.tsx: Free Listings -> GoogleLogo, Shopping/Display Ads -> GoogleAds
  const destHeader = (label, ico) => '<span class="flex items-center gap-1" style="color:var(--ink-muted)">' + (ico || I.google) + esc(label) + '</span>';

  // destination status cell (mirrors renderStatusCell in table.tsx)
  function destCell(dest) {
    if (!dest) {
      return '<div class="flex items-center gap-2"><span style="color:var(--ink-muted)">' + I.x + '</span>' +
        '<span class="pill pill-gray" style="padding:2px 10px;font-size:11.5px">Unsubmitted</span></div>';
    }
    const conf = DEST_ICON[dest.destinationStatuses] || DEST_ICON.Unsubmitted;
    const grouped = groupIssues(dest);
    let issuesHtml = '';
    Object.keys(grouped).forEach((sev) => grouped[sev].forEach((desc) => {
      issuesHtml += '<div class="flex items-center gap-1" style="margin-top:3px">' + severityChip(sev) +
        '<span style="color:var(--err);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(desc) + '">' + esc(desc) + '</span></div>';
    }));
    return '<div class="flex items-start gap-2">' +
      '<span style="color:' + conf.color + ';flex:none" title="' + esc(dest.destinationStatuses) + '">' + conf.ico + '</span>' +
      '<div style="min-width:0">' + (issuesHtml || '<span class="muted" style="font-size:12px">' + esc(dest.destinationStatuses) + '</span>') + '</div>' +
    '</div>';
  }

  function variantRowHtml(v) {
    const text = Object.values(v.detail || {}).join(' / ') || v.sku;
    const dests = v.gmc_destinations || {};
    return '<tr data-id="' + esc(v.unique) + '">' +
      '<td><input type="checkbox" class="vl-pick" data-id="' + esc(v.unique) + '" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (VL.selected[v.unique] ? ' checked' : '') + ' /></td>' +
      '<td><div class="flex items-center gap-2">' +
        '<img src="' + esc(v.image) + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none;object-fit:cover" onerror="this.style.visibility=\'hidden\'" />' +
        '<span class="lnk" data-edit="' + esc(v.unique) + '" style="font-weight:500;cursor:pointer">' + esc(text) + '</span>' +
      '</div></td>' +
      '<td class="muted">' + esc(v.sku) + '</td>' +
      '<td class="num" style="color:var(--ink);font-weight:500">$' + esc(v.price) + '</td>' +
      '<td class="num">' + esc(v.stock) + '</td>' +
      '<td class="muted" style="font-variant-numeric:tabular-nums">' + esc(v.unique) + '</td>' +
      '<td>' + submitPill(v.submit_status) + '</td>' +
      '<td>' + destCell(dests.FREE_LISTINGS) + '</td>' +
      '<td>' + destCell(dests.SHOPPING_ADS) + '</td>' +
      '<td>' + destCell(dests.DISPLAY_ADS) + '</td>' +
    '</tr>';
  }

  function wireVariants() {
    root.querySelector('[data-act="back"]').onclick = () => { location.hash = '#/google/products'; };
    root.querySelectorAll('#vl-tabs .tab').forEach((t) => t.onclick = () => { VL.tab = Number(t.getAttribute('data-tab')); VL.page = 1; renderVariants(); });
    const kwType = root.querySelector('#vl-kw-type');
    const kwInput = root.querySelector('#vl-kw');
    if (kwType) kwType.onchange = () => { VL.kwType = kwType.value; };
    if (kwInput) {
      kwInput.oninput = () => { VL.kw = kwInput.value; };
      const commit = () => { VL.kwApplied = (VL.kw || '').trim(); VL.page = 1; renderVariants(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    const clear = root.querySelector('[data-clear="kw"]'); if (clear) clear.onclick = () => { VL.kw = ''; VL.kwApplied = ''; VL.page = 1; renderVariants(); };
    const clearPrice = root.querySelector('[data-clear="price"]'); if (clearPrice) clearPrice.onclick = () => { VL.priceApplied = null; VL.page = 1; renderVariants(); };
    const clearInv = root.querySelector('[data-clear="inv"]'); if (clearInv) clearInv.onclick = () => { VL.invApplied = null; VL.page = 1; renderVariants(); };
    // range dropdowns (price / inventory) — mirrors useRange popover in search.tsx
    wireRange('price', (v) => { VL.priceApplied = v; });
    wireRange('inv', (v) => { VL.invApplied = v; });
    const all = root.querySelector('#vl-all');
    if (all) all.onchange = () => { VL.allInProduct = false; variantRows(variantsForProduct(VL.productId)).slice((VL.page - 1) * VL.size, (VL.page - 1) * VL.size + VL.size).forEach((v) => VL.selected[v.unique] = all.checked); renderVariants(); };
    root.querySelectorAll('.vl-pick').forEach((c) => c.onchange = () => { VL.allInProduct = false; VL.selected[c.getAttribute('data-id')] = c.checked; renderVariants(); });
    // selection "{n} Selected" chevron menu: Select all in this product / Unselect all (variants/table.tsx Popover+Menu)
    const selTrigger = root.querySelector('#vl-sel-trigger');
    const selMenu = root.querySelector('#vl-sel-menu');
    if (selTrigger && selMenu) {
      const closeMenu = () => { selMenu.style.display = 'none'; document.removeEventListener('mousedown', onSelDoc); };
      const onSelDoc = (e) => { if (!selMenu.contains(e.target) && !selTrigger.contains(e.target)) closeMenu(); };
      selTrigger.onclick = () => {
        if (selMenu.style.display === 'block') { closeMenu(); return; }
        selMenu.style.display = 'block';
        setTimeout(() => document.addEventListener('mousedown', onSelDoc), 0);
      };
      const opt = selMenu.querySelector('.vl-sel-opt');
      if (opt) opt.onclick = () => {
        if (VL.allInProduct) { VL.selected = {}; VL.allInProduct = false; }
        else { VL.selected = {}; variantsForProduct(VL.productId).forEach((v) => VL.selected[v.unique] = true); VL.allInProduct = true; }
        renderVariants();
      };
    }
    // Sync GMC (Popconfirm in real -> confirm() here) → batchSkuGmc
    const syncSel = root.querySelector('[data-act="sync-selected"]'); if (syncSel) syncSel.onclick = () => { if (confirm('Are you sure to sync GMC?')) toast('Sync GMC successfully'); };
    wirePager('vl', VL, renderVariants);
    // navigation: only the variant-name link opens the editor (real variants/table.tsx wraps variant.text in a RouterLink)
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goVariantEdit(b.getAttribute('data-edit')); });
  }

  // ============================================================
  // VARIANT EDIT  (#/variants/:id)
  // ============================================================
  function findVariantMeta(unique) {
    for (const pid in D.VARIANTS) {
      const v = D.VARIANTS[pid].find((x) => x.unique === unique);
      if (v) return v;
    }
    return null;
  }

  function renderVariantEdit(unique) {
    const meta = findVariantMeta(unique);
    const detail = D.DETAILS[unique] || (meta ? D.buildDetail(meta) : null);
    if (!detail) { renderMissing(unique, meta); return; }

    const a = detail.gmc_assembled_data || {};
    const dests = detail.gmc_destinations || {};

    // destination cards (mirrors renderStatusCards in detail.tsx): Free Listings -> GoogleLogo, Ads -> GoogleAds
    const cards = [
      { key: 'FREE_LISTINGS', label: 'Free Listings', ico: I.google },
      { key: 'SHOPPING_ADS', label: 'Shopping Ads', ico: I.googleAds },
      { key: 'DISPLAY_ADS', label: 'Display Ads', ico: I.googleAds },
    ].map((c) => destinationCard(c.label, dests[c.key], c.ico)).join('');

    // raw data button only when Submitted (status 2) — mirrors detail.tsx `status.value === 2`
    // real detail.tsx: Edit Product / View raw data / Sync GMC are all type="primary" with plain text
    const rawBtn = detail.submit_status === 2
      ? '<button class="btn btn-primary" data-act="raw">View raw data</button>' : '';

    root.innerHTML =
      '<div class="detail-wrap">' +
      // header mirrors detail.tsx renderStatusCards(): back button + "Variant Detail" title, actions on the right
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to variants">' + I.arrowLeft + '</button>' +
          '<span class="page-title">Variant Detail</span>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-primary" data-act="edit-product">Edit Product</button>' + rawBtn +
          '<button class="btn btn-primary" data-act="sync">Sync GMC</button>' +
        '</div>' +
      '</div>' +
      '<div class="flex gap-4 mb-4" style="flex-wrap:wrap">' + cards + '</div>' +
      sectionBasicInformation(a) +
      sectionBasicProductData(a) +
      sectionPriceAvailability(a) +
      sectionProductCategory(a) +
      sectionProductIdentifiers(a) +
      sectionDetailedDescription(a, detail) +
      sectionShippingCampaigns(a) +
      sectionDestinations(a) +
      sectionShipping(a) +
      '</div>';

    wireVariantEdit(unique, detail, meta);
  }

  // one destination status card
  function destinationCard(label, dest, logo) {
    const status = (dest && dest.destinationStatuses) || 'Unsubmitted';
    const grouped = dest ? groupIssues(dest) : {};
    const hasIssues = Object.keys(grouped).length > 0;
    const conf = DEST_ICON[status] || DEST_ICON.Unsubmitted;
    // Approved + issues => orange (mirrors detail.tsx)
    const color = status === 'Approved' && hasIssues ? 'var(--warn)' : conf.color;
    let issuesHtml = '';
    Object.keys(grouped).forEach((sev) => grouped[sev].forEach((desc) => {
      issuesHtml += '<div class="flex items-center gap-2" style="margin-top:6px">' + severityChip(sev) +
        '<span style="color:var(--err);font-size:12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(desc) + '">' + esc(desc) + '</span></div>';
    }));
    return '<div class="panel card-pad" style="flex:1;min-width:240px">' +
      '<div class="flex items-center gap-2">' + (logo || I.google) + '<span class="muted" style="font-size:13px">' + esc(label) + '</span></div>' +
      '<div class="flex items-center gap-2" style="margin-top:8px">' +
        '<span style="color:' + color + '">' + conf.ico + '</span>' +
        '<span style="font-size:16px;font-weight:600;color:' + color + '">' + esc(status) + '</span>' +
      '</div>' + issuesHtml +
    '</div>';
  }

  // ---- spec-link footer (mirrors renderCardTitle "Product data specification:" + "Merchant API—" in module/utils.tsx) ----
  // label -> href map taken VERBATIM from module/link.json (getLinkByText). Empty href -> '#'.
  const B = 'https://support.google.com/merchants/answer/';
  const SPEC_LINKS = {
    'Item group ID': B + '6324507',
    'feedLabel': B + '14994087',
    'Title': B + '6324415',
    'Description': B + '6324468',
    'Link': B + '6324416',
    'Image link': B + '6324350',
    'Additional Image link': B + '6324370',
    '3D model link': B + '13674896',
    'Mobile link': B + '6324459',
    'Canonical link': B + '9340054',
    'Structured title': B + '6324415',
    'Structured description': B + '6324468',
    'Availability': B + '6324448',
    'Availability date': B + '6324470',
    'Cost of goods sold': B + '9017895',
    'Expiration date': B + '6324499',
    'Price': B + '6324371',
    'Sale price': B + '6324471',
    'Sale price effective date': B + '6324460',
    'Unit pricing measure': '#',
    'Unit pricing base measure': '#',
    'Google product category': B + '6324436',
    'Product type': B + '6324406',
    'Brand': B + '6324351',
    'GTIN': B + '6324461',
    'MPN': B + '6324482',
    'Identifier exists': B + '6324478',
    'Condition': B + '6324469',
    'Adult': B + '6324508',
    'Multipack': B + '6324488',
    'Bundle': B + '6324449',
    'Age group': B + '6324463',
    'Color': B + '6324487',
    'Gender': B + '6324479',
    'Material': B + '6324410',
    'Pattern': B + '6324483',
    'Size': B + '6324492',
    'Size type': B + '6324497',
    'Size system': B + '6324502',
    'Product length': B + '11018531',
    'Product width': B + '11018531',
    'Product height': B + '11018531',
    'Product weight': B + '11018531',
    'Product detail': B + '9218260',
    'Product highlight': B + '9216100',
    'Ads redirect': B + '6324450',
    'Custom label 0-4': B + '6324473',
    'Promotion ID': B + '7050148',
    'Lifestyle Image link': B + '9103186',
    'Excluded destination': B + '6324486',
    'Included destination': B + '7501026',
    'Pause': B + '11909930',
    'Shipping': B + '6324484',
    'Shipping label': B + '6324504',
    'Shipping weight': B + '6324503',
    'Shipping length': B + '6324498',
    'Shipping width': B + '6324498',
    'Shipping height': B + '6324498',
    'Free shipping threshold': B + '14768922',
  };
  // merchantApi accepts an array of {text, href} (link.json basicInformation.merchantApi has 2 entries),
  // each rendered on its own "Merchant API—<link>" line (utils.tsx renderCardTitle).
  function specFoot(links, merchantApi) {
    let out = '';
    if (merchantApi) {
      const apis = Array.isArray(merchantApi) ? merchantApi : [merchantApi];
      out += apis.map((m) => '<div style="font-size:12.5px;margin-top:10px">Merchant API—' +
        '<a class="lnk" href="' + esc(m.href) + '" target="_blank" rel="noopener">' + esc(m.text) + '</a></div>').join('');
    }
    if (links && links.length) {
      const parts = links.map((t) => '<a class="lnk" href="' + esc(SPEC_LINKS[t] || '#') + '" target="_blank" rel="noopener">' + esc(t) + '</a>').join(', ');
      out += '<div style="font-size:12.5px;margin-top:10px;line-height:1.7"><span class="muted">Product data specification: </span>' + parts + '</div>';
    }
    return out;
  }

  // ---- section + descRow helpers (read-only display, mirrors module/*.tsx labels) ----
  function section(title, desc, bodyHtml, footHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="card-title" style="margin-bottom:' + (desc ? '4px' : '12px') + '">' + esc(title) + '</div>' +
      (desc ? '<div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:14px;max-width:880px">' + esc(desc) + '</div>' : '') +
      bodyHtml +
      (footHtml || '') +
    '</div>';
  }
  // label/value row
  function dRow(label, val) {
    const v = (val == null || val === '') ? '<span class="muted">—</span>' : esc(val);
    return '<div style="display:flex;padding:7px 0;border-top:1px solid var(--hair)">' +
      '<div class="muted" style="width:220px;flex:none;font-size:13px">' + esc(label) + '</div>' +
      '<div class="subtle" style="font-size:13px;word-break:break-word">' + v + '</div></div>';
  }
  const grid2 = (rows) => '<div class="grid grid-cols-2" style="gap:0 24px">' + rows.join('') + '</div>';
  const list = (arr) => (arr && arr.length) ? arr.map((x) => '<div class="subtle" style="font-size:13px;padding:2px 0">• ' + esc(x) + '</div>').join('') : '<span class="muted">—</span>';
  // boolean string -> Yes/No (mirrors formatGmcData: gmcData.x === 'true' ? 'Yes' : 'No')
  const yesNo = (v) => (v === 'true' || v === true || v === 'Yes') ? 'Yes' : 'No';
  // multi-line row whose value is arbitrary html (used for lists / key-value maps)
  const dRowHtml = (label, valHtml) => '<div style="display:flex;padding:7px 0;border-top:1px solid var(--hair)">' +
    '<div class="muted" style="width:220px;flex:none;font-size:13px">' + esc(label) + '</div>' +
    '<div style="font-size:13px;min-width:0">' + valHtml + '</div></div>';

  function sectionBasicInformation(a) {
    // BasicInformation.tsx: single column (grid-cols-1); order name, offerId, itemGroupId,
    // contentLanguage, feedLabel, versionNumber. link.json basicInformation.merchantApi = 2 links.
    return section('Basic information', '',
      dRow('name', a.name) +
      dRow('offerId', a.offer_id) +
      dRow('itemGroupId', a.item_group_id) +
      dRow('contentLanguage', a.content_language) +
      dRow('feedLabel', a.feed_label) +
      dRow('versionNumber', a.version_number),
      specFoot(['Item group ID', 'feedLabel'], [
        { text: 'REST Resource: accounts.productInputs', href: 'https://developers.google.com/merchant/api/reference/rest/products_v1/accounts.productInputs' },
        { text: 'REST Resource: accounts.products', href: 'https://developers.google.com/merchant/api/reference/rest/products_v1/accounts.products' },
      ]));
  }
  function sectionBasicProductData(a) {
    const body =
      dRow('Title', a.title) +
      dRow('Description', a.description) +
      dRow('Link', a.link) +
      dRow('Image link', a.image_link) +
      '<div style="display:flex;padding:7px 0;border-top:1px solid var(--hair)"><div class="muted" style="width:220px;flex:none;font-size:13px">Additional image link</div><div style="font-size:13px">' + list(a.additional_image_links) + '</div></div>' +
      dRow('3D model link', a.model3d_link) +
      dRow('Mobile link', a.mobile_link) +
      dRow('Canonical link', a.canonical_link) +
      dRow('Structured title', a.structured_title_digital_source_type) +
      dRow('Structured description', a.structured_description_digital_source_type);
    return section('Basic product data',
      "The product information you submit using these attributes is the foundation for creating successful ads and free listings for your products. Make sure everything you submit is of the quality you'd show to a customer.",
      body,
      specFoot(['Title', 'Description', 'Link', 'Image link', 'Additional Image link', '3D model link', 'Mobile link', 'Canonical link', 'Structured title', 'Structured description']));
  }
  function sectionProductCategory(a) {
    return section('Product category',
      "You can use these attributes to organize your advertising campaigns in Google Ads and to override Google's automatic product categorization in specific cases.",
      dRow('Google product category', a.google_product_category) +
      dRow('Product type', (a.product_types || [])[0] || ''),
      specFoot(['Google product category', 'Product type']));
  }
  function sectionProductIdentifiers(a) {
    return section('Product identifiers', 'Include codes that identify your product.', grid2([
      dRow('Brand', a.brand), dRow('GTIN', a.gtin),
      dRow('MPN', a.mpn), dRow('Identifier exists', yesNo(a.identifier_exists)),
    ]), specFoot(['Brand', 'GTIN', 'MPN', 'Identifier exists']));
  }
  function sectionDetailedDescription(a, detail) {
    const dm = (detail && detail.detail) || {};
    const detailKeys = Object.keys(dm);
    const detailsHtml = detailKeys.length
      ? detailKeys.map((k) => '<div class="subtle" style="font-size:13px;padding:2px 0">' + esc(k) + ': ' + esc(dm[k]) + '</div>').join('')
      : '<span class="muted">—</span>';
    return section('Detailed product description',
      "These attributes are used to provide product identifiers that define the products you're selling in the global marketplace and can help boost the performance of your ads and free listings.",
      grid2([
        dRow('Condition', a.condition), dRow('Adult', yesNo(a.adult)),
        dRow('Multipack', a.multipack), dRow('Bundle', yesNo(a.bundle)),
        dRow('Age group', a.age_group), dRow('Color', a.color),
        dRow('Gender', a.gender), dRow('Material', a.material),
        dRow('Pattern', a.pattern), dRow('Size', a.size),
        dRow('Size type', a.size_type), dRow('Size system', a.size_system),
        dRow('Product length', a.product_length), dRow('Product width', a.product_width),
        dRow('Product height', a.product_height), dRow('Product weight', a.product_weight),
      ]) +
      dRowHtml('Product detail', detailsHtml) +
      dRowHtml('Product highlight', list(a.product_highlights)),
      specFoot(['Condition', 'Adult', 'Multipack', 'Bundle', 'Age group', 'Color', 'Gender', 'Material', 'Pattern', 'Size', 'Size type', 'Size system', 'Product length', 'Product width', 'Product height', 'Product weight', 'Product detail', 'Product highlight']));
  }
  function sectionPriceAvailability(a) {
    return section('Price and availability',
      'These attributes define the price and availability for your products. This information is shown to potential customers in ads and free listings.',
      grid2([
        dRow('Availability', a.availability), dRow('Availability date', a.availability_date),
        dRow('Cost of goods sold', a.cost_price ? a.cost_price + ' ' + (a.price_currency || '') : ''), dRow('Expiration date', a.expiration_date),
        dRow('Price', a.price ? a.price + ' ' + (a.price_currency || '') : ''), dRow('Sale price', a.sale_price ? a.sale_price + ' ' + (a.price_currency || '') : ''),
        dRow('Sale price effective date', a.sale_price_effective_date), dRow('Auto pricing min price', a.auto_pricing_min_price ? a.auto_pricing_min_price + ' ' + (a.price_currency || '') : ''),
        dRow('Sell on Google quantity', a.sell_on_google_quantity), dRow('', ''),
      ]),
      specFoot(['Availability', 'Availability date', 'Cost of goods sold', 'Expiration date', 'Price', 'Sale price', 'Sale price effective date', 'Unit pricing measure', 'Unit pricing base measure']));
  }
  function sectionShippingCampaigns(a) {
    return section('Shopping campaigns and other configurations',
      'These attributes are used to control how your product data is used when you create advertising campaigns in Google Ads.',
      dRow('Ads redirect', a.ads_redirect) +
      grid2([
        dRow('Custom label 0', a.custom_label_0), dRow('Custom label 1', a.custom_label_1),
        dRow('Custom label 2', a.custom_label_2), dRow('Custom label 3', a.custom_label_3),
        dRow('Custom label 4', a.custom_label_4), dRow('Promotion ID', a.promotion_id),
      ]) +
      dRowHtml('Lifestyle image link', list(a.lifestyle_image_links)),
      specFoot(['Ads redirect', 'Custom label 0-4', 'Promotion ID', 'Lifestyle Image link']));
  }
  function sectionDestinations(a) {
    return section('Destinations',
      'These attributes can be used to control the different locations where your content can appear. For example, you could use this attribute if you want a product to appear in a dynamic remarketing campaign, but not in a Shopping ads campaign.',
      dRow('Excluded destination', (a.excluded_destination || []).join(', ')) +
      dRow('Included destination', (a.included_destination || []).join(', ')) +
      dRow('Pause', a.pause),
      specFoot(['Excluded destination', 'Included destination', 'Pause']));
  }
  function sectionShipping(a) {
    const s = a.shipping || {};
    return section('Shipping',
      "These attributes can be used together with the account shipping settings and return settings to help you provide accurate shipping and return costs. People who are shopping online rely on shipping costs and speeds, as well as return policies, to help them make choices about what to buy, so it's important to take the time to submit quality information.",
      grid2([
        dRow('Price', (s.price != null ? s.price + ' ' + (s.price_currency || '') : '')), dRow('Country', s.country),
        dRow('Region', s.region), dRow('Service', s.service),
        dRow('Location ID', s.location_id), dRow('Location group name', s.location_group_name),
        dRow('Postal code', s.postal_code), dRow('Min handling time', s.min_handling_time),
        dRow('Max handling time', s.max_handling_time), dRow('Min transit time', s.min_transit_time),
        dRow('Max transit time', s.max_transit_time), dRow('Shipping label', s.shipping_label),
        dRow('Shipping weight', s.shipping_weight), dRow('Shipping length', s.shipping_length),
        dRow('Shipping width', s.shipping_width), dRow('Shipping height', s.shipping_height),
        dRow('Free shipping threshold', s.free_shipping_threshold), dRow('', ''),
      ]),
      specFoot(['Shipping', 'Shipping label', 'Shipping weight', 'Shipping length', 'Shipping width', 'Shipping height', 'Free shipping threshold']));
  }

  function wireVariantEdit(unique, detail, meta) {
    root.querySelector('[data-act="back"]').onclick = () => {
      location.hash = meta ? '#/google/variants?product=' + meta.product_id : '#/google/variants';
    };
    // Sync GMC — real wraps in a Popconfirm ("Are you sure to sync GMC?") then batchSkuGmc → success toast
    const sync = root.querySelector('[data-act="sync"]'); if (sync) sync.onclick = () => { if (confirm('Are you sure to sync GMC?')) toast('Sync GMC successfully'); };
    // Edit Product — real opens the storefront product editor in a new tab (window.open VITE_URL/admin/product/addProduct/:id)
    const ep = root.querySelector('[data-act="edit-product"]'); if (ep) ep.onclick = () => toast('Opens the storefront product editor (roadmap)');
    const raw = root.querySelector('[data-act="raw"]'); if (raw) raw.onclick = () => goVariantRaw(unique);
  }

  function renderMissing(unique, meta) {
    root.innerHTML =
      '<div class="detail-wrap">' +
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Variant ' + esc(unique) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Assembled GMC detail not available in this prototype</div>' +
        '<div class="muted">Open a variant flagged with sample detail: gmc-510202, gmc-510204, gmc-510205 or gmc-510401.</div></div></div>' +
      '</div>';
    root.querySelector('[data-act="back"]').onclick = () => { location.hash = meta ? '#/google/variants?product=' + meta.product_id : '#/google/variants'; };
  }

  // ============================================================
  // VARIANT RAW DATA  (#/variants/:id/raw)
  // ============================================================
  function renderVariantRaw(unique) {
    // mirrors rawData.tsx: back button + "Raw data" title, then a Card with a plain <pre> of the JSON
    // (real has no copy button / caption / unique label; empty data renders as "{}").
    const raw = D.RAW_DATA[unique];
    const json = raw ? JSON.stringify(raw, null, 2) : '{}';
    root.innerHTML =
      '<div class="detail-wrap">' +
      '<div class="flex items-center gap-2 mb-4">' +
        '<button class="back-btn" data-act="back" title="Back to variant detail">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Raw data</span>' +
      '</div>' +
      '<div class="panel card-pad">' +
        '<pre class="ql-editor" style="white-space:pre-wrap;word-break:break-word;min-height:auto;margin:0;border:1px solid var(--hair);border-radius:8px;background:var(--panel)">' + esc(json) + '</pre>' +
      '</div>' +
      '</div>';
    root.querySelector('[data-act="back"]').onclick = () => { location.hash = '#/google/variants/' + encodeURIComponent(unique); };
  }

  // ============================================================
  // shared: pagination
  // ============================================================
  function pagerHtml(page, pages, ns) {
    const item = (label, p, opts) => {
      opts = opts || {};
      const cls = 'pg-item' + (opts.active ? ' active' : '') + (opts.disabled ? ' disabled' : '');
      return '<span class="' + cls + '"' + (opts.disabled ? '' : ' data-page="' + p + '"') + '>' + label + '</span>';
    };
    let nums = '';
    for (let p = 1; p <= pages; p++) nums += item(String(p), p, { active: p === page });
    const size = ns === 'pl' ? PL.size : VL.size;
    return '<div class="pg">' +
      item('‹', page - 1, { disabled: page <= 1 }) + nums + item('›', page + 1, { disabled: page >= pages }) +
      '<select class="pg-size" id="' + ns + '-size">' +
        ['20', '50', '100'].map((s) => '<option value="' + s + '"' + (Number(s) === size ? ' selected' : '') + '>' + s + ' / page</option>').join('') +
      '</select>' +
    '</div>';
  }

  function wirePager(ns, state, rerender) {
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { state.page = Number(el.getAttribute('data-page')); rerender(); });
    const ps = root.querySelector('#' + ns + '-size');
    if (ps) ps.onchange = () => { state.size = Number(ps.value); state.page = 1; rerender(); };
  }

  // range dropdown wiring for the variants list (price / inventory)
  function wireRange(ns, apply) {
    const trigger = root.querySelector('#vl-' + ns + '-trigger');
    const panel = root.querySelector('#vl-' + ns + '-panel');
    if (!trigger || !panel) return;
    const minEl = panel.querySelector('#vl-' + ns + '-min');
    const maxEl = panel.querySelector('#vl-' + ns + '-max');
    const applyBtn = panel.querySelector('#vl-' + ns + '-apply');
    const close = () => { panel.style.display = 'none'; document.removeEventListener('mousedown', onDoc); };
    const onDoc = (e) => { if (!panel.contains(e.target) && !trigger.contains(e.target)) close(); };
    trigger.onclick = () => {
      const open = panel.style.display === 'block';
      if (open) { close(); return; }
      panel.style.display = 'block';
      setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
      if (minEl) minEl.focus();
    };
    const num = (el) => { if (!el || el.value === '' || el.value == null) return null; const n = Number(el.value); return isNaN(n) ? null : n; };
    if (applyBtn) applyBtn.onclick = () => {
      const min = num(minEl);
      const max = num(maxEl);
      if (min == null && max == null) { apply(null); close(); VL.page = 1; renderVariants(); return; }
      if (min != null && max != null && max < min) return; // invalid: max must be >= min
      apply({ min: min, max: max });
      VL.page = 1; renderVariants();
    };
  }

  // ============================================================
  // ROUTER
  // ============================================================
  function goVariants(pid) { location.hash = '#/google/variants?product=' + encodeURIComponent(pid); }
  function goVariantEdit(unique) { location.hash = '#/google/variants/' + encodeURIComponent(unique); }
  function goVariantRaw(unique) { location.hash = '#/google/variants/' + encodeURIComponent(unique) + '/raw'; }

  // `rest` is the hash tail after the `google` segment (e.g. '', 'products',
  // 'variants', 'variants?product=5', 'variants/<id>', 'variants/<id>/raw').
  function route(rest) {
    rest = rest || '';
    const scrollTop = () => { if (root && root.parentElement) root.parentElement.scrollTop = 0; };

    let m;
    if ((m = rest.match(/^variants\/([^/]+)\/raw$/))) { renderVariantRaw(decodeURIComponent(m[1])); scrollTop(); return; }
    if ((m = rest.match(/^variants\/([^/?]+)$/))) { renderVariantEdit(decodeURIComponent(m[1])); scrollTop(); return; }
    if (rest.indexOf('variants') === 0) {
      const q = rest.match(/[?&]product=([^&]+)/);
      const pid = q ? decodeURIComponent(q[1]) : null;
      if (pid !== VL.productId) { VL.productId = pid; VL.tab = 0; VL.kw = ''; VL.kwApplied = ''; VL.priceApplied = null; VL.invApplied = null; VL.page = 1; VL.selected = {}; VL.allInProduct = false; }
      renderVariants(); scrollTop(); return;
    }
    // default: products list (rest === '' or 'products')
    renderProducts(); scrollTop();
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.google = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
