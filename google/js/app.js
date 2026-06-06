/* BestShopio Admin · Google (Merchant Center) prototype — products + variants + variant detail + raw data, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only renders the module body into #root.
   Mirrors reference/bestvoy-admin admin/google components. Reads window.DATA_GOOGLE from js/data.js. */
(function () {
  const D = window.DATA_GOOGLE;
  const root = document.getElementById('root');

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
    sync: svg('<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>'),
    code: svg('<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    check: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    x: svg('<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>', 14),
    external: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', 14),
    google: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
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
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Products</h1>' +
        '<div class="flex items-center gap-2">' + accountChip() +
          '<button class="btn btn-primary" data-act="batch-sync">' + I.sync + ' Batch sync</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="pl-tabs">' + tabsHtml + '</div>' +
        // selection toolbar (mirrors selection-toolbar in table.tsx)
        (selIds.length
          ? '<div class="card-pad flex items-center gap-3" style="padding-bottom:0">' +
              '<span class="subtle"><strong>' + selIds.length + ' Selected</strong></span>' +
              '<button class="btn btn-default" style="height:28px" data-act="sync-selected">' + I.sync + ' Sync GMC</button>' +
              '<button class="lnk" data-act="clear-sel">Clear selection</button>' +
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
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="pl-all" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (pageRows.length && pageRows.every((p) => PL.selected[p.product_id]) ? ' checked' : '') + ' /></th>' +
            '<th>Product</th><th>Variants</th><th style="width:300px">GMC issues summary</th>' +
            '<th style="width:180px">Last sync</th><th style="width:160px">Status</th>' +
            '<th style="text-align:center;width:120px">Actions</th>' +
          '</tr></thead>' +
          '<tbody id="pl-tbody">' +
            (pageRows.length ? pageRows.map(productRowHtml).join('')
              : '<tr><td colspan="7" style="text-align:center;padding:40px" class="muted">No products match these filters.</td></tr>') +
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
    return '<tr data-id="' + p.product_id + '">' +
      '<td onclick="event.stopPropagation()"><input type="checkbox" class="pl-pick" data-id="' + p.product_id + '" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (PL.selected[p.product_id] ? ' checked' : '') + ' /></td>' +
      '<td><div class="flex items-center gap-2">' +
        '<img src="' + esc(p.image) + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none;object-fit:cover" onerror="this.style.visibility=\'hidden\'" />' +
        '<span class="lnk" style="font-weight:500">' + esc(p.store_name) + '</span>' +
      '</div></td>' +
      '<td><span style="color:var(--ok);font-weight:600">' + vs.approved + '</span> Approved / ' +
        '<span style="color:var(--brand);font-weight:600">' + vs.submitted + '</span> Submitted / ' +
        '<span style="font-weight:600;color:var(--ink)">' + vs.total + '</span> Total</td>' +
      '<td><div class="flex items-center gap-1" style="flex-wrap:wrap">' + (issueChips || '<span class="muted">—</span>') + '</div></td>' +
      '<td class="muted">' + esc(fmtTs(p.last_sync_time)) + '</td>' +
      '<td>' + submitPill(p.submit_status) + '</td>' +
      '<td style="text-align:center" onclick="event.stopPropagation()">' +
        '<button class="lnk" data-variants="' + p.product_id + '">View variants</button>' +
        '<span class="muted" style="margin:0 6px">·</span>' +
        '<button class="lnk" data-sync="' + p.product_id + '">Sync</button>' +
      '</td>' +
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
    const clearSel = root.querySelector('[data-act="clear-sel"]'); if (clearSel) clearSel.onclick = () => { PL.selected = {}; renderProducts(); };
    const syncSel = root.querySelector('[data-act="sync-selected"]'); if (syncSel) syncSel.onclick = () => { const n = Object.keys(PL.selected).filter((k) => PL.selected[k]).length; toast('Sync queued for ' + n + ' product(s) to Google Merchant Center'); };
    // pagination + size
    wirePager('pl', PL, renderProducts);
    // row -> variants
    root.querySelectorAll('#pl-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goVariants(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-variants]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goVariants(b.getAttribute('data-variants')); });
    root.querySelectorAll('[data-sync]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); const p = D.PRODUCTS.find((x) => String(x.product_id) === b.getAttribute('data-sync')); toast('Sync queued · ' + (p ? p.store_name : b.getAttribute('data-sync'))); });
    const bs = root.querySelector('[data-act="batch-sync"]'); if (bs) bs.onclick = () => toast('Batch sync queued for all products in the current view');
  }

  // ============================================================
  // VARIANTS LIST  (#/variants  &  #/variants?product=:id)
  // ============================================================
  const VL = { productId: null, tab: 0, kwType: 'variant', kw: '', kwApplied: '', page: 1, size: 20, selected: {} };

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
    return rows;
  }

  function renderVariants() {
    VL.page = VL.page || 1;
    const product = VL.productId ? D.PRODUCTS.find((p) => String(p.product_id) === String(VL.productId)) : null;
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

    const tags = VL.kwApplied
      ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap"><span class="field-pill" data-clear="kw">' +
          esc((D.VARIANT_KEYWORD_OPTIONS.find((o) => o.value === VL.kwType) || {}).label || '') + ': ' + esc(VL.kwApplied) +
          ' <span class="x">&times;</span></span></div>'
      : '';

    const subtitle = product
      ? '<span class="muted" style="font-size:13px;margin-left:10px">' + esc(product.store_name) + ' · Product ID ' + esc(product.product_id) + '</span>'
      : '<span class="muted" style="font-size:13px;margin-left:10px">All variants across products</span>';

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to products">' + I.arrowLeft + '</button>' +
          '<span class="page-title">Variants</span>' + subtitle +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-primary" data-act="batch-sync">' + I.sync + ' Batch sync</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="vl-tabs">' + tabsHtml + '</div>' +
        (selIds.length
          ? '<div class="card-pad flex items-center gap-3" style="padding-bottom:0">' +
              '<span class="subtle"><strong>' + selIds.length + ' Selected</strong></span>' +
              '<button class="btn btn-default" style="height:28px" data-act="sync-selected">' + I.sync + ' Sync GMC</button>' +
              '<button class="lnk" data-act="clear-sel">Clear selection</button>' +
            '</div>'
          : '') +
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex" style="max-width:430px">' +
            '<select class="filter-select" id="vl-kw-type" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + kwOpts + '</select>' +
            '<div style="position:relative;flex:1">' +
              '<input class="filter-input" id="vl-kw" placeholder="Search" value="' + esc(VL.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
              '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
            '</div>' +
          '</div>' + tags +
        '</div>' +
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1400px">' +
          '<thead><tr>' +
            '<th style="width:38px"><input type="checkbox" id="vl-all" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (pageRows.length && pageRows.every((v) => VL.selected[v.unique]) ? ' checked' : '') + ' /></th>' +
            '<th>Variant</th><th style="width:180px">SKU</th><th style="width:90px" class="num">Price</th>' +
            '<th style="width:90px" class="num">Inventory</th><th style="width:150px">Variant ID</th><th style="width:130px">Status</th>' +
            '<th>' + destHeader('Free Listings') + '</th><th>' + destHeader('Shopping Ads') + '</th><th>' + destHeader('Display Ads') + '</th>' +
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

  const destHeader = (label) => '<span class="flex items-center gap-1" style="color:var(--ink-muted)">' + I.google + esc(label) + '</span>';

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
      '<td onclick="event.stopPropagation()"><input type="checkbox" class="vl-pick" data-id="' + esc(v.unique) + '" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer"' + (VL.selected[v.unique] ? ' checked' : '') + ' /></td>' +
      '<td><div class="flex items-center gap-2">' +
        '<img src="' + esc(v.image) + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none;object-fit:cover" onerror="this.style.visibility=\'hidden\'" />' +
        '<span class="lnk" style="font-weight:500">' + esc(text) + '</span>' +
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
    root.querySelector('[data-act="back"]').onclick = () => { location.hash = '#/products'; };
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
    const all = root.querySelector('#vl-all');
    if (all) all.onchange = () => { variantRows(variantsForProduct(VL.productId)).slice((VL.page - 1) * VL.size, (VL.page - 1) * VL.size + VL.size).forEach((v) => VL.selected[v.unique] = all.checked); renderVariants(); };
    root.querySelectorAll('.vl-pick').forEach((c) => c.onchange = () => { VL.selected[c.getAttribute('data-id')] = c.checked; renderVariants(); });
    const clearSel = root.querySelector('[data-act="clear-sel"]'); if (clearSel) clearSel.onclick = () => { VL.selected = {}; renderVariants(); };
    const syncSel = root.querySelector('[data-act="sync-selected"]'); if (syncSel) syncSel.onclick = () => { const n = Object.keys(VL.selected).filter((k) => VL.selected[k]).length; toast('Sync queued for ' + n + ' variant(s)'); };
    const bs = root.querySelector('[data-act="batch-sync"]'); if (bs) bs.onclick = () => toast('Batch sync queued for the variants in this view');
    wirePager('vl', VL, renderVariants);
    root.querySelectorAll('#vl-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goVariantEdit(tr.getAttribute('data-id')));
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
    const detail = D.DETAILS[unique];
    const meta = findVariantMeta(unique);
    if (!detail) { renderMissing(unique, meta); return; }

    const a = detail.gmc_assembled_data || {};
    const dests = detail.gmc_destinations || {};
    const title = a.title || (meta ? meta.sku : unique);

    // destination cards (mirrors renderStatusCards in detail.tsx)
    const cards = [
      { key: 'FREE_LISTINGS', label: 'Free Listings' },
      { key: 'SHOPPING_ADS', label: 'Shopping Ads' },
      { key: 'DISPLAY_ADS', label: 'Display Ads' },
    ].map((c) => destinationCard(c.label, dests[c.key])).join('');

    // raw data button only when Submitted (status 2) — mirrors detail.tsx `status.value === 2`
    const rawBtn = detail.submit_status === 2
      ? '<button class="btn btn-default" data-act="raw">' + I.code + ' View raw data</button>' : '';

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to variants">' + I.arrowLeft + '</button>' +
          '<span class="page-title">Variant detail</span>' +
          '<span class="muted" style="font-size:13px">' + esc(title) + '</span>' +
          submitPill(detail.submit_status) +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-default" data-act="edit-product">' + I.external + ' Edit product</button>' + rawBtn +
          '<button class="btn btn-primary" data-act="sync">' + I.sync + ' Sync GMC</button>' +
        '</div>' +
      '</div>' +
      '<div class="flex gap-4 mb-4" style="flex-wrap:wrap">' + cards + '</div>' +
      sectionBasicInformation(a) +
      sectionBasicProductData(a) +
      sectionProductCategory(a) +
      sectionProductIdentifiers(a) +
      sectionDetailedDescription(a) +
      sectionPriceAvailability(a) +
      sectionShippingCampaigns(a) +
      sectionDestinations(a) +
      sectionShipping(a);

    wireVariantEdit(unique, detail, meta);
  }

  // one destination status card
  function destinationCard(label, dest) {
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
      '<div class="flex items-center gap-2">' + I.google + '<span class="muted" style="font-size:13px">' + esc(label) + '</span></div>' +
      '<div class="flex items-center gap-2" style="margin-top:8px">' +
        '<span style="color:' + color + '">' + conf.ico + '</span>' +
        '<span style="font-size:16px;font-weight:600;color:' + color + '">' + esc(status) + '</span>' +
      '</div>' + issuesHtml +
    '</div>';
  }

  // ---- section + descRow helpers (read-only display, mirrors module/*.tsx labels) ----
  function section(title, desc, bodyHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="card-title" style="margin-bottom:' + (desc ? '4px' : '12px') + '">' + esc(title) + '</div>' +
      (desc ? '<div class="muted" style="font-size:12.5px;line-height:1.5;margin-bottom:14px;max-width:880px">' + esc(desc) + '</div>' : '') +
      bodyHtml +
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

  function sectionBasicInformation(a) {
    return section('Basic information', '', grid2([
      dRow('name', a.name), dRow('offerId', a.offer_id),
      dRow('itemGroupId', a.item_group_id), dRow('contentLanguage', a.content_language),
      dRow('feedLabel', a.feed_label), dRow('versionNumber', a.version_number),
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
      body);
  }
  function sectionProductCategory(a) {
    return section('Product category',
      "You can use these attributes to organize your advertising campaigns in Google Ads and to override Google's automatic product categorization in specific cases.",
      dRow('Google product category', a.google_product_category) +
      dRow('Product type', (a.product_types || []).join(', ')));
  }
  function sectionProductIdentifiers(a) {
    return section('Product identifiers', 'Include codes that identify your product.', grid2([
      dRow('Brand', a.brand), dRow('GTIN', a.gtin),
      dRow('MPN', a.mpn), dRow('Identifier exists', a.identifier_exists),
    ]));
  }
  function sectionDetailedDescription(a) {
    return section('Detailed product description',
      "These attributes are used to provide product identifiers that define the products you're selling in the global marketplace and can help boost the performance of your ads and free listings.",
      grid2([
        dRow('Condition', a.condition), dRow('Adult', a.adult),
        dRow('Multipack', a.multipack), dRow('Bundle', a.bundle),
        dRow('Age group', a.age_group), dRow('Color', a.color),
        dRow('Gender', a.gender), dRow('Material', a.material),
        dRow('Pattern', a.pattern), dRow('Size', a.size),
        dRow('Size type', a.size_type), dRow('Size system', a.size_system),
        dRow('Product length', a.product_length), dRow('Product width', a.product_width),
        dRow('Product height', a.product_height), dRow('Product weight', a.product_weight),
      ]) +
      '<div style="display:flex;padding:7px 0;border-top:1px solid var(--hair)"><div class="muted" style="width:220px;flex:none;font-size:13px">Product highlight</div><div style="font-size:13px">' + list(a.product_highlights) + '</div></div>');
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
      ]));
  }
  function sectionShippingCampaigns(a) {
    return section('Shopping campaigns', '', grid2([
      dRow('Ads redirect', a.ads_redirect), dRow('Promotion ID', a.promotion_id),
      dRow('Custom label 0', a.custom_label_0), dRow('Custom label 1', a.custom_label_1),
      dRow('Custom label 2', a.custom_label_2), dRow('Custom label 3', a.custom_label_3),
      dRow('Custom label 4', a.custom_label_4), dRow('', ''),
    ]) +
    '<div style="display:flex;padding:7px 0;border-top:1px solid var(--hair)"><div class="muted" style="width:220px;flex:none;font-size:13px">Lifestyle image links</div><div style="font-size:13px">' + list(a.lifestyle_image_links) + '</div></div>');
  }
  function sectionDestinations(a) {
    return section('Destinations',
      'These attributes can be used to control the different locations where your content can appear.',
      dRow('Excluded destination', (a.excluded_destination || []).join(', ')) +
      dRow('Included destination', (a.included_destination || []).join(', ')) +
      dRow('Pause', a.pause));
  }
  function sectionShipping(a) {
    const s = a.shipping || {};
    return section('Shipping',
      'These attributes can be used together with the account shipping settings and return settings to help you provide accurate shipping and return costs.',
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
      ]));
  }

  function wireVariantEdit(unique, detail, meta) {
    root.querySelector('[data-act="back"]').onclick = () => {
      location.hash = meta ? '#/variants?product=' + meta.product_id : '#/variants';
    };
    const sync = root.querySelector('[data-act="sync"]'); if (sync) sync.onclick = () => toast('Sync queued · ' + (detail.gmc_assembled_data && detail.gmc_assembled_data.offer_id || unique));
    const ep = root.querySelector('[data-act="edit-product"]'); if (ep) ep.onclick = () => toast('Opens the storefront product editor (roadmap)');
    const raw = root.querySelector('[data-act="raw"]'); if (raw) raw.onclick = () => goVariantRaw(unique);
  }

  function renderMissing(unique, meta) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Variant ' + esc(unique) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Assembled GMC detail not available in this prototype</div>' +
        '<div class="muted">Open a variant flagged with sample detail: gmc-510202, gmc-510204, gmc-510205 or gmc-510401.</div></div></div>';
    root.querySelector('[data-act="back"]').onclick = () => { location.hash = meta ? '#/variants?product=' + meta.product_id : '#/variants'; };
  }

  // ============================================================
  // VARIANT RAW DATA  (#/variants/:id/raw)
  // ============================================================
  function renderVariantRaw(unique) {
    const meta = findVariantMeta(unique);
    const raw = D.RAW_DATA[unique];
    const json = raw ? JSON.stringify(raw, null, 2) : '{}';
    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to variant detail">' + I.arrowLeft + '</button>' +
          '<span class="page-title">Raw data</span>' +
          '<span class="muted" style="font-size:13px;font-variant-numeric:tabular-nums">' + esc(unique) + '</span>' +
        '</div>' +
        '<button class="btn btn-default" data-act="copy">Copy JSON</button>' +
      '</div>' +
      '<div class="panel card-pad">' +
        (raw
          ? '<div class="muted" style="font-size:12.5px;margin-bottom:10px">GMC API response (products.get) — the assembled payload synced to Google Merchant Center.</div>' +
            '<pre class="ql-editor" style="white-space:pre-wrap;word-break:break-word;min-height:auto;margin:0;border:1px solid var(--hair);border-radius:8px;background:var(--panel)">' + esc(json) + '</pre>'
          : '<div class="placeholder"><div><div style="font-weight:600;margin-bottom:6px">No raw data captured for this variant</div>' +
            '<div class="muted">Raw GMC responses are available for submitted variants gmc-510202 and gmc-510401.</div></div></div>') +
      '</div>';
    root.querySelector('[data-act="back"]').onclick = () => { location.hash = '#/variants/' + encodeURIComponent(unique); };
    const cp = root.querySelector('[data-act="copy"]'); if (cp) cp.onclick = () => { try { navigator.clipboard.writeText(json); } catch (e) {} toast('Raw JSON copied'); };
  }

  // ============================================================
  // shared: account chip, pagination
  // ============================================================
  function accountChip() {
    const ac = D.ACCOUNT || {};
    return '<span class="chip" title="Linked Google Merchant Center account">' + I.google +
      '<span>' + esc(ac.account_name || 'Merchant Center') + '</span>' +
      '<span class="muted">· ID ' + esc(ac.merchant_id || '') + '</span></span>';
  }

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

  // ============================================================
  // ROUTER
  // ============================================================
  function goVariants(pid) { location.hash = '#/variants?product=' + encodeURIComponent(pid); }
  function goVariantEdit(unique) { location.hash = '#/variants/' + encodeURIComponent(unique); }
  function goVariantRaw(unique) { location.hash = '#/variants/' + encodeURIComponent(unique) + '/raw'; }

  function route() {
    const hash = location.hash || '#/products';
    const scrollTop = () => { if (root.parentElement) root.parentElement.scrollTop = 0; };

    let m;
    if ((m = hash.match(/^#\/variants\/([^/]+)\/raw$/))) { renderVariantRaw(decodeURIComponent(m[1])); scrollTop(); return; }
    if ((m = hash.match(/^#\/variants\/([^/?]+)$/))) { renderVariantEdit(decodeURIComponent(m[1])); scrollTop(); return; }
    if (hash.indexOf('#/variants') === 0) {
      const q = hash.match(/[?&]product=([^&]+)/);
      const pid = q ? decodeURIComponent(q[1]) : null;
      if (pid !== VL.productId) { VL.productId = pid; VL.tab = 0; VL.kw = ''; VL.kwApplied = ''; VL.page = 1; VL.selected = {}; }
      renderVariants(); scrollTop(); return;
    }
    // default: products list
    renderProducts(); scrollTop();
  }

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/products';
  route();
})();
