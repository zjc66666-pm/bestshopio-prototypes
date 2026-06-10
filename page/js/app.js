/* BestShopio Admin · Page (Content > Pages) prototype — list + edit, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin .../admin/page:
     list.tsx / components/list/{search,table}.tsx  -> list view
     pages/edit.tsx + components/edit/{PageInformation,PageContent,PageSettings}.tsx -> edit view
   Routes:  #/page  (list)   #/page/<id>  (edit existing)   #/page/new  (add). */
(function () {
  var D = window.DATA_PAGE;
  var I = window.ICONS || {};
  var root; // set by the SPA shell router via VIEWS.page.render(el, rest)

  // tiny html -> element helper
  var h = function (html) { var t = document.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstElementChild; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  var svg = function (p, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
  var IC = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 3.5"/><path d="M12 17h.01"/>', 14),
    alert: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/>', 15),
    external: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', 13),
    // toolbar / format icons (decorative — match the real RichTextEditor toolbar)
    bold: svg('<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>', 15),
    italic: svg('<path d="M19 4h-9M14 20H5M15 4 9 20"/>', 15),
    underline: svg('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 20h16"/>', 15),
    list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 15),
    link: svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>', 15),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', 15),
  };

  // ---- toast ----
  var toast = function (msg) { var t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 1900); };

  // ---- module-scoped styles (rich-text editor, keyword box, unsaved bar) ----
  // These classes are specific to this module and are NOT in the shared theme.css,
  // so we inject them once. bar-tip mirrors the real admin's dark UnSavedChanges bar.
  function injectStyles() {
    if (document.getElementById('page-mod-styles')) return;
    var css =
      // (unsaved-changes bar is shared now: theme.css .unsaved-bar + UI.unsavedBar)
      // rich-text editor
      '.rt-wrap{border:1px solid var(--ctl);border-radius:8px;overflow:hidden;background:#fff;}' +
      '.rt-toolbar{display:flex;align-items:center;gap:2px;padding:6px 8px;border-bottom:1px solid var(--hair);' +
      'background:#fafbfc;flex-wrap:wrap;}' +
      '.rt-block{height:30px;border:1px solid var(--ctl);border-radius:6px;font-size:13px;padding:0 8px;' +
      'background:#fff;color:var(--ink);margin-right:4px;}' +
      '.rt-sep{width:1px;height:18px;background:var(--hair);margin:0 4px;}' +
      '.rt-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:none;' +
      'background:transparent;color:var(--ink-body);border-radius:6px;cursor:pointer;}' +
      '.rt-btn:hover{background:#eef0f7;color:var(--ink);}' +
      '.rt-body{min-height:280px;max-height:600px;overflow:auto;padding:14px 16px;font-size:14px;line-height:1.6;' +
      'color:var(--ink-body);outline:none;}' +
      '.rt-body:focus{outline:none;}' +
      '.rt-body h2{font-size:20px;font-weight:600;margin:0 0 8px;color:var(--ink);}' +
      '.rt-body h3{font-size:16px;font-weight:600;margin:12px 0 6px;color:var(--ink);}' +
      '.rt-body p{margin:0 0 10px;}' +
      '.rt-body ul{margin:0 0 10px;padding-left:20px;list-style:disc;}' +
      '.rt-body a{color:var(--brand);text-decoration:underline;}' +
      // SEO keyword box (drawer)
      '.kw-box{border:1px solid var(--ctl);border-radius:6px;padding:5px 6px;min-height:36px;display:flex;' +
      'flex-wrap:wrap;gap:6px;align-items:center;}' +
      '.kw-box:focus-within{border-color:var(--brand);}' +
      '.kw-chip{display:inline-flex;align-items:center;gap:4px;background:#eff5ff;color:var(--brand);' +
      'border:1px solid #d6e4ff;border-radius:4px;padding:1px 6px;font-size:13px;word-break:break-all;}' +
      '.kw-chip .kw-x{cursor:pointer;display:inline-flex;}.kw-chip .kw-x:hover{color:#0a3d8f;}' +
      '.kw-input{flex:1;min-width:140px;border:none;outline:none;font-size:13px;height:24px;background:transparent;}' +
      // drawer URL/handle addon
      '.rt-addon{display:inline-flex;align-items:center;height:36px;padding:0 10px;background:var(--panel);' +
      'border:1px solid var(--ctl);border-radius:6px 0 0 6px;font-size:12px;color:var(--ink-muted);white-space:nowrap;}';
    var s = document.createElement('style');
    s.id = 'page-mod-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }
  injectStyles();

  var SHOP_PREFIX = D.SHOP_URL.replace(/\/$/, '') + '/page/';
  // handle = path without the leading slash (real edit shows {prefix}{handle})
  var toHandle = function (path) { return String(path || '').replace(/^\/+/, ''); };
  var slugify = function (s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'); };

  // status -> pill (mirrors STATUS_COLOR in components/list/table.tsx)
  var statusPill = function (st) {
    return st === 1
      ? '<span class="pill pill-blue"><span class="dot"></span>Visible</span>'
      : '<span class="pill pill-gray"><span class="dot"></span>Hidden</span>';
  };

  // ===================================================================
  // LIST VIEW
  // ===================================================================
  var LST = { kwType: 'title', kw: '', kwApplied: '', status: [], page: 1, size: 20 };

  function filteredRows() {
    var rows = D.PAGES.slice();
    if (LST.kwApplied) {
      var q = LST.kwApplied.toLowerCase();
      rows = rows.filter(function (p) { return (p.title || '').toLowerCase().indexOf(q) >= 0; });
    }
    if (LST.status.length) rows = rows.filter(function (p) { return LST.status.indexOf(p.status) >= 0; });
    return rows;
  }

  // status label always orders Visible before Hidden (mirrors renderStatusLabel in search.tsx)
  function statusLabel() {
    var labels = [];
    if (LST.status.indexOf(1) >= 0) labels.push('Visible');
    if (LST.status.indexOf(0) >= 0) labels.push('Hidden');
    return labels.join(', ');
  }

  // full empty state (mirrors table.tsx renderEmptyState — illustration + copy + Add page)
  function emptyStateHtml() {
    var ill =
      '<svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="100" cy="100" r="80" fill="#DBEAFE" opacity="0.3"/>' +
        '<rect x="60" y="70" width="80" height="60" rx="4" fill="white" stroke="#E5E7EB" stroke-width="2"/>' +
        '<rect x="60" y="70" width="80" height="8" fill="#6B7280"/>' +
        '<rect x="70" y="85" width="20" height="15" rx="2" fill="#E5E7EB"/>' +
        '<path d="M75 92 L78 89 L81 92 L85 88" stroke="#9CA3AF" stroke-width="1.5" fill="none"/>' +
        '<rect x="95" y="86" width="35" height="3" rx="1.5" fill="#E5E7EB"/>' +
        '<rect x="95" y="92" width="25" height="2" rx="1" fill="#E5E7EB"/>' +
        '<rect x="70" y="105" width="50" height="2" rx="1" fill="#E5E7EB"/>' +
        '<rect x="70" y="110" width="40" height="2" rx="1" fill="#E5E7EB"/>' +
        '<rect x="70" y="115" width="45" height="2" rx="1" fill="#E5E7EB"/>' +
        '<circle cx="40" cy="100" r="18" fill="#3B82F6"/><circle cx="40" cy="100" r="14" fill="white"/>' +
        '<path d="M40 94 L40 106 M34 100 L46 100 M36 96 L44 104 M36 104 L44 96" stroke="#3B82F6" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="160" cy="100" r="18" fill="#3B82F6"/><circle cx="160" cy="100" r="14" fill="white"/>' +
        '<path d="M160 94 L160 106 M154 100 L166 100" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>';
    return '<div class="panel" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px">' +
      '<div style="margin-bottom:24px">' + ill + '</div>' +
      '<h3 style="font-size:20px;font-weight:600;color:var(--ink);margin:0 0 8px">Add and manage your pages</h3>' +
      '<p class="muted" style="font-size:13px;text-align:center;max-width:420px;margin:0 0 24px">' +
        'Pages are a great way to share information and help customers learn more about your business.</p>' +
      '<button class="btn btn-primary" data-act="add" style="height:40px;padding:0 20px">Add page</button>' +
    '</div>';
  }

  function renderList() {
    var rows = filteredRows();
    var totalRecords = rows.length;
    var pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    var start = (LST.page - 1) * LST.size;
    var pageRows = rows.slice(start, start + LST.size);

    var fieldOpts = D.FIELD_OPTIONS.map(function (o) {
      return '<option value="' + o.value + '"' + (o.value === LST.kwType ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');

    // active filter tags (mirror the closable Tag row in search.tsx)
    var tags = [];
    if (LST.kwApplied) {
      var lbl = (D.FIELD_OPTIONS.find(function (o) { return o.value === LST.kwType; }) || {}).label || 'Page title';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.status.length) {
      tags.push('<span class="field-pill" data-clear="status">Status: ' + esc(statusLabel()) + ' <span class="x">&times;</span></span>');
    }

    var statusChipText = LST.status.length ? statusLabel() : 'Status';

    // empty state: account has never had any pages (mirrors table.tsx renderEmptyState
    // + list.tsx hiding the Add button / tabs / filters until hasEverHadData).
    if (D.PAGES.length === 0) {
      root.innerHTML =
        '<div class="flex items-center justify-between mb-4">' +
          '<h1 class="page-title">Page</h1>' +
        '</div>' +
        emptyStateHtml();
      var addE = root.querySelector('[data-act="add"]'); if (addE) addE.onclick = function () { location.hash = '#/page/new'; };
      return;
    }

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Page</h1>' +
        '<button class="btn btn-primary" data-act="add">Add page</button>' +
      '</div>' +
      '<div class="panel">' +
        // single "All" tab with count (mirrors list.tsx Tabs)
        '<div class="tabs" style="padding:0 8px" id="pg-tabs">' +
          '<div class="tab active">All<span class="count-badge">' + D.PAGES.length + '</span></div>' +
        '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // keyword group: field select + input (compact, real width ~418px)
            '<div class="flex" style="min-width:418px">' +
              '<select class="filter-select" id="kw-type" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + IC.search + '</span>' +
              '</div>' +
            '</div>' +
            // status multi-select trigger
            '<div class="sel-trigger" id="status-chip" style="width:200px">' +
              '<span class="' + (LST.status.length ? '' : 'muted') + '">' + esc(statusChipText) + '</span>' + IC.chevDown +
            '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:720px">' +
          '<thead><tr>' +
            '<th>Page title</th>' +
            '<th style="width:140px">Status</th>' +
            '<th style="width:180px">Last updated</th>' +
            '<th style="width:80px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="pg-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="4" style="text-align:center;padding:40px" class="muted">No pages match these filters.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        // pagination footer (Total N records + pager, sizes 20/50/100)
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + totalRecords + ' records</span>' +
          pagerHtml(LST.page, pages) +
        '</div>' +
      '</div>';

    wireList();
  }

  function rowHtml(p) {
    return '<tr data-id="' + p.page_id + '">' +
      '<td style="font-weight:500;color:var(--ink)">' + esc(p.title) + '</td>' +
      '<td>' + statusPill(p.status) + '</td>' +
      '<td class="muted">' + esc(p.update_time || '- -') + '</td>' +
      '<td style="text-align:center"><button class="back-btn" data-view="' + p.page_id + '" title="Edit page" style="width:30px;height:30px">' + IC.eye + '</button></td>' +
    '</tr>';
  }

  function pagerHtml(page, pages) {
    var item = function (label, p, opts) {
      opts = opts || {};
      var cls = 'pg-item' + (opts.active ? ' active' : '') + (opts.disabled ? ' disabled' : '');
      return '<span class="' + cls + '"' + (opts.disabled ? '' : ' data-page="' + p + '"') + '>' + label + '</span>';
    };
    var nums = '';
    for (var p = 1; p <= pages; p++) nums += item(String(p), p, { active: p === page });
    return '<div class="pg">' +
      item('‹', page - 1, { disabled: page <= 1 }) + nums + item('›', page + 1, { disabled: page >= pages }) +
      '<select class="pg-size" id="pg-size">' +
        ['20', '50', '100'].map(function (s) { return '<option value="' + s + '"' + (Number(s) === LST.size ? ' selected' : '') + '>' + s + ' / page</option>'; }).join('') +
      '</select>' +
    '</div>';
  }

  function wireList() {
    var kwType = root.querySelector('#kw-type');
    var kwInput = root.querySelector('#kw-input');
    if (kwType) kwType.onchange = function () { LST.kwType = kwType.value; };
    if (kwInput) {
      kwInput.oninput = function () { LST.kw = kwInput.value; };
      var commit = function () { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = function (e) { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    var statusChip = root.querySelector('#status-chip');
    if (statusChip) statusChip.onclick = function () { openStatusPopover(statusChip); };

    root.querySelectorAll('#filter-tags [data-clear]').forEach(function (tg) {
      tg.onclick = function () {
        var k = tg.getAttribute('data-clear');
        if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
        if (k === 'status') { LST.status = []; }
        LST.page = 1; renderList();
      };
    });

    var ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = function () { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach(function (el) { el.onclick = function () { LST.page = Number(el.getAttribute('data-page')); renderList(); }; });

    // row click + eye -> edit
    root.querySelectorAll('#pg-tbody tr[data-id]').forEach(function (tr) { tr.onclick = function () { goEdit(tr.getAttribute('data-id')); }; });
    root.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); goEdit(b.getAttribute('data-view')); }; });

    var add = root.querySelector('[data-act="add"]'); if (add) add.onclick = function () { location.hash = '#/page/new'; };
  }

  // status multi-select popover (checkbox list, mirrors SelectMulti)
  function openStatusPopover(anchor) {
    closePops();
    var layer = h('<div class="pop-layer"></div>');
    var pop = h('<div class="menu-pop" style="position:fixed;min-width:200px;padding:6px"></div>');
    var opt = function (v, label) {
      var on = LST.status.indexOf(v) >= 0;
      return '<label class="opt" style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
        '<input type="checkbox" data-v="' + v + '"' + (on ? ' checked' : '') + ' style="accent-color:var(--brand)" />' +
        '<span>' + esc(label) + '</span></label>';
    };
    pop.innerHTML = opt(1, 'Visible') + opt(0, 'Hidden');
    layer.appendChild(pop);
    document.body.appendChild(layer);
    var r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 4) + 'px';
    pop.style.left = r.left + 'px';
    pop.style.width = r.width + 'px';
    layer.onclick = function (e) { if (e.target === layer) closePops(); };
    pop.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
      cb.onchange = function () {
        var v = Number(cb.getAttribute('data-v'));
        var i = LST.status.indexOf(v);
        if (cb.checked && i < 0) LST.status.push(v);
        if (!cb.checked && i >= 0) LST.status.splice(i, 1);
        LST.page = 1; renderList();
        var nc = root.querySelector('#status-chip'); if (nc) openStatusPopover(nc);
      };
    });
  }

  function closePops() { document.querySelectorAll('.pop-layer').forEach(function (p) { p.remove(); }); }

  // ===================================================================
  // EDIT VIEW  (left: title + content cards / right 275px: status, SEO, template)
  // ===================================================================
  // working copy of the page being edited + origin snapshot for dirty-tracking
  var EDIT = null;
  var ORIGIN = null; // JSON string of the form fields at load (mirrors store originFormData)

  // the subset of fields the real store diff-checks for hasUnsavedChanges
  function formSnapshot() {
    if (!EDIT) return '';
    return JSON.stringify({
      title: EDIT.title || '',
      content: EDIT.content || '',
      status: EDIT.status,
      template: EDIT.template || 'default',
      path: EDIT.path || '',
      seo_title: EDIT.seo_title || '',
      seo_description: EDIT.seo_description || '',
      seo_keywords: EDIT.seo_keywords || [],
    });
  }

  // mirrors store.hasUnsavedChanges: new page is dirty once it differs from blank;
  // existing page is dirty once it differs from the loaded origin.
  function isDirty() { return ORIGIN != null && formSnapshot() !== ORIGIN; }

  function loadEdit(id) {
    if (id === 'new' || id === '0') {
      EDIT = Object.assign({}, D.NEW_PAGE, { seo_keywords: [] });
      EDIT._isNew = true;
    } else {
      var src = D.DETAILS[id] || D.DETAILS[Number(id)];
      if (!src) { EDIT = null; ORIGIN = null; return; }
      // clone so edits don't mutate the sample dataset
      EDIT = JSON.parse(JSON.stringify(src));
      EDIT._isNew = false;
    }
    ORIGIN = formSnapshot();
  }

  // show/hide the shared dark unsaved-changes bar based on current dirtiness
  function syncUnsavedBar() {
    window.UI.setUnsavedBar(root, isDirty());
  }

  function renderEdit(id) {
    loadEdit(id);
    if (!EDIT) { renderMissing(id); return; }
    var isNew = EDIT._isNew;
    var headerTitle = isNew ? 'Add page' : (EDIT.title || 'Untitled page');

    root.innerHTML =
      // fixed 1200px centered container (mirrors the real admin edit page width)
      '<div class="detail-wrap">' +
      // shared full-width "You have unsaved changes" bar (UI.unsavedBar); toggled by syncUnsavedBar().
      window.UI.unsavedBar({ saveLabel: isNew ? 'Add' : 'Update', saveAct: 'save' }) +
      // header: back + title  (mirrors back-btn-square + h1 in pages/edit.tsx)
      '<div class="flex items-center justify-between mb-6">' +
        '<div class="flex items-center gap-3">' +
          '<button class="back-btn" data-act="back" title="Back to pages">' + IC.arrowLeft + '</button>' +
          '<h1 class="page-title" id="hdr-title">' + esc(headerTitle) + '</h1>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          (isNew ? '' : '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:var(--err)">Delete page</button>') +
          '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add' : 'Update') + '</button>' +
        '</div>' +
      '</div>' +
      // two-column body: main (fluid) + 275px right rail
      '<div class="detail-cols">' +
        '<div class="detail-main">' +
          titleCard() +
          contentCard() +
          // bottom action row (real layout repeats Add/Update + Delete here)
          '<div class="flex justify-end gap-2" style="margin-top:24px">' +
            '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add' : 'Update') + '</button>' +
            (isNew ? '' : '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:var(--err)">Delete page</button>') +
          '</div>' +
        '</div>' +
        '<div class="detail-rail">' +
          statusCard() +
          seoCard() +
          templateCard() +
        '</div>' +
      '</div>' +
      '</div>';

    wireEdit();
  }

  // ---- left cards ----
  function titleCard() {
    var len = (EDIT.title || '').length;
    return '<div class="panel card-pad" style="margin-bottom:24px">' +
      '<div class="card-title" style="margin-bottom:12px">Page title</div>' +
      '<div style="position:relative">' +
        '<input class="input" id="f-title" placeholder="Please name the page" maxlength="255" value="' + esc(EDIT.title) + '" style="padding-right:56px" />' +
        '<span class="muted" id="title-count" style="position:absolute;right:12px;top:9px;font-size:12px">' + len + ' / 255</span>' +
      '</div>' +
      '<div id="title-err" class="hidden" style="color:var(--err);font-size:12px;margin-top:6px">Can\'t be blank</div>' +
    '</div>';
  }

  // rich-text "Content" card — decorative toolbar + contenteditable body (real uses RichTextEditor)
  function contentCard() {
    var tool = function (icon, cmd, title) {
      return '<button class="rt-btn" data-cmd="' + cmd + '" title="' + title + '" type="button">' + icon + '</button>';
    };
    return '<div class="panel card-pad">' +
      '<div class="card-title" style="margin-bottom:4px">Content</div>' +
      '<div class="muted" style="font-size:12px;margin-bottom:12px">Main body</div>' +
      '<div class="rt-wrap">' +
        '<div class="rt-toolbar">' +
          '<select class="rt-block" id="rt-block" title="Paragraph style">' +
            '<option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>' +
          '</select>' +
          '<span class="rt-sep"></span>' +
          tool(IC.bold, 'bold', 'Bold') + tool(IC.italic, 'italic', 'Italic') + tool(IC.underline, 'underline', 'Underline') +
          '<span class="rt-sep"></span>' +
          tool(IC.list, 'insertUnorderedList', 'Bullet list') + tool(IC.link, 'createLink', 'Insert link') + tool(IC.image, 'image', 'Insert image') +
        '</div>' +
        '<div class="rt-body scroll-thin" id="f-content" contenteditable="true">' + (EDIT.content || '') + '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- right cards ----
  function statusCard() {
    var radio = function (v, label) {
      var on = EDIT.status === v;
      return '<label class="pg-radio" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 0">' +
        '<input type="radio" name="pg-status" data-v="' + v + '"' + (on ? ' checked' : '') + ' style="accent-color:var(--brand)" />' +
        '<span>' + esc(label) + '</span></label>';
    };
    return '<div class="panel card-pad" style="margin-bottom:24px">' +
      '<div class="card-title" style="margin-bottom:10px">Status</div>' +
      radio(1, 'Visible') + radio(0, 'Hidden') +
    '</div>';
  }

  // SEO live-preview card + pencil to open drawer (mirrors PageSettings.tsx)
  function seoCard() {
    var handle = toHandle(EDIT.path);
    var title = EDIT.seo_title || EDIT.title || 'Page title';
    var desc = stripHtml(EDIT.seo_description) || stripHtml(EDIT.content) || 'Meta description';
    return '<div class="panel card-pad" style="margin-bottom:24px">' +
      '<div class="flex items-center justify-between" style="margin-bottom:12px">' +
        '<div class="card-title">Search engine optimization</div>' +
        '<button class="back-btn" data-act="seo" title="Edit SEO" style="width:28px;height:28px">' + IC.pencil + '</button>' +
      '</div>' +
      '<div class="muted" style="font-size:12px;margin-bottom:6px;word-break:break-all">' + esc(SHOP_PREFIX) + esc(handle) + '</div>' +
      '<div style="font-size:13px;color:var(--brand);word-break:break-all;margin-bottom:2px" id="seo-prev-title">' + esc(title) + '</div>' +
      '<div class="subtle" style="font-size:13px;word-break:break-word" id="seo-prev-desc">' + esc(desc) + '</div>' +
    '</div>';
  }

  function templateCard() {
    var opts = D.TEMPLATE_OPTIONS.map(function (o) {
      return '<option value="' + o.value + '"' + (o.value === EDIT.template ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    return '<div class="panel card-pad">' +
      '<div class="card-title" style="margin-bottom:10px">Theme template</div>' +
      '<select class="input" id="f-template" style="height:36px">' + opts + '</select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you\'d like the page to look like</div>' +
    '</div>';
  }

  // ---- helpers ----
  function stripHtml(html) {
    if (!html) return '';
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').substring(0, 200);
  }

  function refreshSeoPreview() {
    var t = root.querySelector('#seo-prev-title');
    var d = root.querySelector('#seo-prev-desc');
    if (t) t.textContent = EDIT.seo_title || EDIT.title || 'Page title';
    if (d) d.textContent = stripHtml(EDIT.seo_description) || stripHtml(EDIT.content) || 'Meta description';
    var hdr = root.querySelector('#hdr-title');
    if (hdr && !EDIT._isNew) hdr.textContent = EDIT.title || 'Untitled page';
    // url line lives as the first .muted inside the SEO card; rebuild it cheaply
    var urlLine = root.querySelector('#seo-prev-title') ? root.querySelector('#seo-prev-title').previousElementSibling : null;
    if (urlLine) urlLine.textContent = SHOP_PREFIX + toHandle(EDIT.path);
  }

  function wireEdit() {
    root.querySelectorAll('[data-act="back"]').forEach(function (b) { b.onclick = guardedBack; });

    // title input + counter + live header/SEO sync
    var ti = root.querySelector('#f-title');
    if (ti) {
      ti.oninput = function () {
        EDIT.title = ti.value;
        var c = root.querySelector('#title-count'); if (c) c.textContent = ti.value.length + ' / 255';
        var err = root.querySelector('#title-err'); if (err) err.classList.add('hidden');
        if (ti.style) ti.style.borderColor = '';
        refreshSeoPreview();
        syncUnsavedBar();
      };
    }

    // rich-text toolbar (execCommand on the contenteditable body)
    var body = root.querySelector('#f-content');
    root.querySelectorAll('.rt-btn').forEach(function (btn) {
      btn.onmousedown = function (e) { e.preventDefault(); }; // keep selection
      btn.onclick = function () {
        var cmd = btn.getAttribute('data-cmd');
        if (!body) return;
        body.focus();
        if (cmd === 'createLink') {
          var url = prompt('Link URL', 'https://');
          if (url) document.execCommand('createLink', false, url);
        } else if (cmd === 'image') {
          var src = prompt('Image URL', 'https://');
          if (src) document.execCommand('insertImage', false, src);
        } else {
          document.execCommand(cmd, false, null);
        }
        EDIT.content = body.innerHTML;
        syncUnsavedBar();
      };
    });
    var blockSel = root.querySelector('#rt-block');
    if (blockSel && body) blockSel.onchange = function () { body.focus(); document.execCommand('formatBlock', false, blockSel.value); EDIT.content = body.innerHTML; syncUnsavedBar(); };
    if (body) body.oninput = function () { EDIT.content = body.innerHTML; refreshSeoPreview(); syncUnsavedBar(); };

    // status radios
    root.querySelectorAll('input[name="pg-status"]').forEach(function (r) {
      r.onchange = function () { if (r.checked) { EDIT.status = Number(r.getAttribute('data-v')); syncUnsavedBar(); } };
    });

    // template select
    var tpl = root.querySelector('#f-template');
    if (tpl) tpl.onchange = function () { EDIT.template = tpl.value; syncUnsavedBar(); };

    // SEO drawer
    root.querySelectorAll('[data-act="seo"]').forEach(function (b) { b.onclick = openSeoDrawer; });

    // unsaved bar: discard
    root.querySelectorAll('[data-act="discard"]').forEach(function (b) { b.onclick = onDiscard; });

    // save / delete
    root.querySelectorAll('[data-act="save"]').forEach(function (b) { b.onclick = onSave; });
    root.querySelectorAll('[data-act="delete"]').forEach(function (b) { b.onclick = onDelete; });

    syncUnsavedBar();
  }

  // back arrow guards against losing unsaved edits (mirrors onBeforeRouteLeave)
  function guardedBack() {
    if (!isDirty()) { location.hash = '#/page'; return; }
    confirmModal({
      title: 'Are you sure you want to leave?',
      body: 'Unsaved changes will be lost',
      ok: 'Exit',
      onOk: function () { location.hash = '#/page'; },
    });
  }

  // Discard button on the unsaved bar (mirrors handleDiscard Modal.confirm)
  function onDiscard() {
    confirmModal({
      title: 'Are you sure you want to discard changes?',
      body: 'All unsaved changes will be lost',
      ok: 'Discard',
      danger: true,
      onOk: function () {
        if (EDIT && EDIT._isNew) { location.hash = '#/page'; return; }
        // reset existing page back to its origin snapshot
        renderEdit(String(EDIT.page_id));
      },
    });
  }

  function onSave() {
    if (!(EDIT.title || '').trim()) {
      var err = root.querySelector('#title-err'); if (err) err.classList.remove('hidden');
      var ti = root.querySelector('#f-title'); if (ti) { ti.focus(); ti.style.borderColor = 'var(--err)'; }
      return;
    }
    if (EDIT._isNew) {
      // new page -> success toast then back to the list (mirrors router.push on create)
      toast('Added successfully');
      ORIGIN = formSnapshot(); // mark clean so the leave-guard doesn't fire
      setTimeout(function () { location.hash = '#/page'; }, 500);
    } else {
      // existing page -> stay on the edit page; bar clears as origin re-baselines
      toast('Updated successfully');
      ORIGIN = formSnapshot();
      syncUnsavedBar();
    }
  }

  // ===================================================================
  // SEO DRAWER  (right, ~480 — mirrors the Drawer in PageSettings.tsx)
  // ===================================================================
  function openSeoDrawer() {
    closePops();
    var seo = {
      seoTitle: EDIT.seo_title || EDIT.title || '',
      seoDescription: stripHtml(EDIT.seo_description) || stripHtml(EDIT.content) || '',
      handle: toHandle(EDIT.path),
      keywords: (EDIT.seo_keywords || []).slice(),
    };

    var backdrop = h('<div class="drawer-backdrop"></div>');
    var drawer = h('<div class="drawer" style="width:480px"></div>');
    drawer.innerHTML =
      '<div class="drawer-head">Search engine optimization<span class="drawer-x" data-x>' + IC.x + '</span></div>' +
      '<div class="drawer-body">' +
        // preview
        '<div style="margin-bottom:20px">' +
          '<div style="font-size:14px;font-weight:600;margin-bottom:8px">Preview</div>' +
          '<div class="muted" style="font-size:12px;margin-bottom:4px;word-break:break-all">' + esc(SHOP_PREFIX) + '<span style="color:var(--brand)" id="dr-prev-handle">' + esc(seo.handle || 'handle') + '</span></div>' +
          '<div style="font-size:14px;color:var(--brand);font-weight:500;margin-bottom:4px;word-break:break-all" id="dr-prev-title">' + esc(seo.seoTitle || 'Page title') + '</div>' +
          '<div class="subtle" style="font-size:13px;word-break:break-word" id="dr-prev-desc">' + esc(seo.seoDescription || 'Meta description') + '</div>' +
        '</div>' +
        '<div class="divider" style="margin:16px 0"></div>' +
        // page title
        fieldHead('Page title', 'Page titles make it easier for customers to quickly find content. Use simple, intuitive words.', 'dr-c-title') +
        '<input class="input" id="dr-title" value="' + esc(seo.seoTitle) + '" placeholder="Please enter" style="margin-bottom:18px" />' +
        // meta description
        fieldHead('Meta description', 'Describe the page contents to attract visitors. Too many keywords may hurt ranking.', 'dr-c-desc') +
        '<textarea class="input" id="dr-desc" rows="4" placeholder="Add a description so the page can achieve a higher search ranking" style="height:auto;padding:8px 12px;margin-bottom:18px">' + esc(seo.seoDescription) + '</textarea>' +
        // URL handle
        '<div class="flex items-center gap-1" style="margin-bottom:6px"><span style="font-size:13px;font-weight:500">URL</span><span class="muted" title="Short, descriptive URL handle for better SEO">' + IC.help + '</span></div>' +
        '<div class="flex" style="margin-bottom:18px">' +
          '<span class="rt-addon">' + esc(SHOP_PREFIX) + '</span>' +
          '<input class="input" id="dr-handle" value="' + esc(seo.handle) + '" placeholder="handle" style="border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
        '</div>' +
        // keywords
        '<div class="flex items-center gap-1" style="margin-bottom:6px"><span style="font-size:13px;font-weight:500">SEO keywords</span><span class="muted" title="Relevant keywords can improve ranking. Avoid keyword stuffing.">' + IC.help + '</span></div>' +
        '<div class="kw-box" id="dr-kwbox">' +
          seo.keywords.map(kwChip).join('') +
          '<input type="text" id="dr-kw-input" class="kw-input" placeholder="' + (seo.keywords.length ? '' : "Press 'Enter' to add a keyword") + '" />' +
        '</div>' +
      '</div>' +
      '<div class="drawer-foot" style="justify-content:flex-end"><button class="btn btn-primary" data-save>Confirm</button></div>';

    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);

    var close = function () { backdrop.remove(); };
    backdrop.onclick = function (e) { if (e.target === backdrop) close(); };
    drawer.querySelector('[data-x]').onclick = close;

    var prevHandle = drawer.querySelector('#dr-prev-handle');
    var prevTitle = drawer.querySelector('#dr-prev-title');
    var prevDesc = drawer.querySelector('#dr-prev-desc');

    var elTitle = drawer.querySelector('#dr-title');
    var elDesc = drawer.querySelector('#dr-desc');
    var elHandle = drawer.querySelector('#dr-handle');
    elTitle.oninput = function () { seo.seoTitle = elTitle.value; prevTitle.textContent = seo.seoTitle || 'Page title';
      // for a brand-new page, auto-fill the handle from the title (real behavior)
      if (EDIT._isNew && !elHandle.dataset.touched) { seo.handle = slugify(seo.seoTitle); elHandle.value = seo.handle; prevHandle.textContent = seo.handle || 'handle'; }
    };
    elDesc.oninput = function () { seo.seoDescription = elDesc.value; prevDesc.textContent = seo.seoDescription || 'Meta description'; };
    elHandle.oninput = function () { elHandle.dataset.touched = '1'; seo.handle = elHandle.value; prevHandle.textContent = seo.handle || 'handle'; };

    // keyword input -> chips on Enter / blur
    var kwInput = drawer.querySelector('#dr-kw-input');
    var addKw = function () {
      var v = kwInput.value.trim();
      if (!v) return;
      if (seo.keywords.indexOf(v) < 0) seo.keywords.push(v);
      kwInput.value = '';
      renderKw();
    };
    var renderKw = function () {
      var box = drawer.querySelector('#dr-kwbox');
      box.querySelectorAll('.kw-chip').forEach(function (c) { c.remove(); });
      var html = seo.keywords.map(kwChip).join('');
      kwInput.insertAdjacentHTML('beforebegin', html);
      kwInput.placeholder = seo.keywords.length ? '' : "Press 'Enter' to add a keyword";
      box.querySelectorAll('.kw-chip [data-rm]').forEach(function (x) {
        x.onclick = function () { var i = Number(x.getAttribute('data-rm')); seo.keywords.splice(i, 1); renderKw(); };
      });
      kwInput.focus();
    };
    kwInput.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addKw(); } };
    kwInput.onblur = addKw;
    // wire initial chip removers
    drawer.querySelectorAll('#dr-kwbox .kw-chip [data-rm]').forEach(function (x) {
      x.onclick = function () { var i = Number(x.getAttribute('data-rm')); seo.keywords.splice(i, 1); renderKw(); };
    });

    drawer.querySelector('[data-save]').onclick = function () {
      EDIT.seo_title = seo.seoTitle || EDIT.title || '';
      EDIT.seo_description = seo.seoDescription || stripHtml(EDIT.content) || '';
      EDIT.path = seo.handle ? '/' + toHandle(seo.handle) : '';
      EDIT.seo_keywords = seo.keywords.slice();
      close();
      refreshSeoPreview();
      syncUnsavedBar();
    };
  }

  function kwChip(k, i) {
    return '<span class="kw-chip">' + esc(k) + '<span class="kw-x" data-rm="' + i + '">' + IC.x + '</span></span>';
  }

  function fieldHead(label, tip, id) {
    return '<div class="flex items-center justify-between" style="margin-bottom:6px">' +
      '<div class="flex items-center gap-1"><span style="font-size:13px;font-weight:500">' + esc(label) + '</span>' +
      '<span class="muted" title="' + esc(tip) + '">' + IC.help + '</span></div></div>';
  }

  // ===================================================================
  // Confirm modal helper (mirrors antd Modal.confirm used across edit.tsx)
  //   opts: { title, body, ok, cancel?, danger?, onOk }
  // ===================================================================
  function confirmModal(opts) {
    closePops();
    var backdrop = h('<div class="modal-backdrop"></div>');
    var modal = h('<div class="modal"></div>');
    modal.innerHTML =
      '<div class="modal-head">' + esc(opts.title) + '</div>' +
      '<div class="modal-body subtle" style="font-size:13.5px">' + esc(opts.body) + '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn-default" data-cancel>' + esc(opts.cancel || 'Cancel') + '</button>' +
        '<button class="btn btn-primary" data-confirm' + (opts.danger ? ' style="background:var(--err)"' : '') + '>' + esc(opts.ok || 'Confirm') + '</button>' +
      '</div>';
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    var close = function () { backdrop.remove(); };
    backdrop.onclick = function (e) { if (e.target === backdrop) close(); };
    modal.querySelector('[data-cancel]').onclick = close;
    modal.querySelector('[data-confirm]').onclick = function () { close(); if (opts.onOk) opts.onOk(); };
  }

  // DELETE confirm (mirrors Modal.confirm in pages/edit.tsx -> handleDelete)
  function onDelete() {
    confirmModal({
      title: 'Delete page',
      body: 'Are you sure you want to delete this page?',
      ok: 'Confirm',
      danger: true,
      onOk: function () {
        toast('Page deleted successfully');
        ORIGIN = formSnapshot(); // avoid the leave-guard firing on navigation
        setTimeout(function () { location.hash = '#/page'; }, 500);
      },
    });
  }

  // ---- missing page (bad id) ----
  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + IC.arrowLeft + '</button>' +
        '<span class="page-title">Page not found</span>' +
      '</div>' +
      '<div class="panel card-pad muted">No page exists for id "' + esc(id) + '".</div>';
    var b = root.querySelector('[data-act="back"]'); if (b) b.onclick = function () { location.hash = '#/page'; };
  }

  // ===================================================================
  // ROUTER
  // ===================================================================
  function goEdit(id) { location.hash = '#/page/' + id; }

  function route(rest) {
    closePops();
    if (rest) { renderEdit(decodeURIComponent(rest)); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.page = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
