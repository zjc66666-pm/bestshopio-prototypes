/* BestShopio Admin · Menu prototype — list + edit + item modal, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin
   .../views/admin/menu:
     list/table.tsx     — Menu title | Menu items (comma labels) | Action(eye)
     list/search.tsx    — compact field-select + input + closable tag
     edit.tsx           — Menu title card + Menu items table + Update/Delete
     MenuItemsTable.tsx — expandable two-level table (Label | Link | Sort | Action)
     MenuItemModal.tsx  — Menu item type (L1/L2) + Parent + Label + Link + Sort
   Items show by sort DESC ("Higher sort show first"). Link may be empty. */
(function () {
  const D = window.DATA_MENU;
  let root; // set by the SPA shell router via VIEWS.menu.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DASH = '- -';

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 15),
    trash: svg('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>', 15),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 16),
    chevRight: svg('<path d="m9 18 6-6-6-6"/>', 16),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>', 16),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17h.01"/>', 14),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 16),
  };

  // ---- module-scoped styles (NOT in the shared theme.css) ----
  // Mirrors reference/bestvoy-admin .../views/admin/menu:
  //   (unsaved-changes bar is shared now: theme.css .unsaved-bar + UI.unsavedBar)
  //   compact search group -> list/search.tsx (Input.Group compact: Select 150 + Input 268)
  //   icon buttons / expand chevrons / child rows -> MenuItemsTable.tsx columns
  // Injected once; safe to call on every render.
  function injectStyles() {
    if (document.getElementById('menu-mod-styles')) return;
    const css =
      // (unsaved-changes bar is shared now: theme.css .unsaved-bar + UI.unsavedBar)
      // compact search group (Select + Input joined, shared border like antd Input.Group compact)
      '.mnu-group{display:flex;align-items:stretch;width:418px;max-width:100%;}' +
      '.mnu-group .filter-select{width:150px;border-radius:var(--radius) 0 0 var(--radius);}' +
      '.mnu-group .wrap{position:relative;flex:1;margin-left:-1px;}' +
      '.mnu-group .filter-input{width:100%;height:34px;padding:0 32px 0 12px;border-radius:0 var(--radius) var(--radius) 0;}' +
      '.mnu-group .filter-select:focus,.mnu-group .filter-input:focus{position:relative;z-index:1;}' +
      // row icon buttons (Eye / Pencil / Trash2 ghost buttons)
      '.mnu-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;' +
      'border:none;background:transparent;color:var(--ink-muted);border-radius:6px;cursor:pointer;}' +
      '.mnu-icon-btn:hover{background:#eef0f7;color:var(--ink);}' +
      '.mnu-icon-btn.danger{color:var(--err);}' +
      '.mnu-icon-btn.danger:hover{background:#fdecec;color:var(--err);}' +
      // expand / collapse chevron (level-1 rows with children)
      '.mnu-expand{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;' +
      'border:none;background:transparent;color:var(--ink-muted);cursor:pointer;padding:0;}' +
      '.mnu-expand:hover{color:var(--ink);}' +
      '.mnu-expand.placeholder{cursor:default;}' +
      // child rows (level-2) — subtle indent + tint
      '.mnu-childrow td{background:#fafbfc;}' +
      '.mnu-child-label{padding-left:24px;}' +
      // single-line truncating link / items cell
      '.mnu-link-cell{display:block;max-width:460px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-body);}' +
      // inline char counter overlay (matches antd Input showCount)
      '.mnu-count{font-size:12px;color:var(--ink-muted);pointer-events:none;}' +
      // inline field error (matches antd FormItem help in error state)
      '.mnu-field-err{color:var(--err);font-size:12px;margin-top:4px;}' +
      // Sort column header help affordance
      '.mnu-help{display:inline-flex;align-items:center;gap:4px;}' +
      '.mnu-help .qm{display:inline-flex;color:var(--ink-muted);cursor:pointer;}' +
      // radio group (Menu item type: Level 1 / Level 2)
      '.mnu-radio-row{display:flex;align-items:center;gap:20px;}' +
      '.mnu-radio{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink);cursor:pointer;}' +
      '.mnu-radio input{accent-color:var(--brand);width:15px;height:15px;cursor:pointer;}' +
      // empty state (real list/table.tsx renderEmptyState)
      '.mnu-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 20px;}' +
      '.mnu-empty-state h3{font-size:18px;font-weight:600;color:var(--ink);margin:8px 0 16px;}';
    const s = document.createElement('style');
    s.id = 'menu-mod-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }
  injectStyles();

  // ---- toast (stands in for antd message.success / .error) ----
  const toast = (msg, kind) => {
    const t = document.createElement('div');
    const bg = kind === 'error' ? '#b42318' : '#242833';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:' + bg + ';color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;max-width:520px;text-align:center;box-shadow:var(--float-shadow)';
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  };

  // sort helpers — higher `sort` first; missing/0 sorts last but keeps input order
  const bySortDesc = (a, b) => (b.sort || 0) - (a.sort || 0);
  const sortedItems = (items) => (items || []).slice().sort(bySortDesc).map((it) => ({
    ...it, children: (it.children || []).slice().sort(bySortDesc),
  }));
  function flatLabels(items) {
    const out = [];
    sortedItems(items).forEach((t) => { out.push(t.label); (t.children || []).forEach((c) => out.push(c.label)); });
    return out.filter(Boolean);
  }

  // ================= LIST VIEW =================
  const LST = { field: 'title', kw: '', kwApplied: '', page: 1, size: 20 };

  function rowsFiltered() {
    let rows = D.MENUS.slice();
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((m) => m.title.toLowerCase().includes(q));
    }
    return rows;
  }

  function renderList() {
    const rows = rowsFiltered();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const tag = LST.kwApplied
      ? '<div class="mt-3"><span class="field-pill" data-clear="kw" style="background:#e6f0ff;border-color:#cfe1ff;color:#0058c4">Menu title: ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span></div>'
      : '';

    const body =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Menu</h1>' +
        '<button class="btn btn-primary" data-act="create">' + I.plus + ' Add menu</button>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px">' +
          '<div class="tab active">All<span class="count-badge">' + total + '</span></div>' +
        '</div>' +
        '<div class="card-pad" style="padding-bottom:12px">' +
          '<div class="mnu-group">' +
            '<select class="filter-select" id="mnu-field"><option value="title"' + (LST.field === 'title' ? ' selected' : '') + '>Menu title</option></select>' +
            '<div class="wrap">' +
              '<input class="filter-input" id="mnu-search" placeholder="Search" value="' + esc(LST.kw) + '" />' +
              '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
            '</div>' +
          '</div>' + tag +
        '</div>' +
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:720px">' +
          '<thead><tr>' +
            '<th style="width:36px"><input type="checkbox" id="mnu-all" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></th>' +
            '<th>Menu title</th><th>Menu items</th><th style="width:180px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="mnu-tbody">' +
            pageRows.map(listRowHtml).join('') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + total + ' records</span>' +
          pagerHtml(LST.page, pages) +
        '</div>' +
      '</div>';

    // Empty state only when there is genuinely no data (no menus at all, no active search).
    if (D.MENUS.length === 0 && !LST.kwApplied) {
      root.innerHTML =
        '<div class="flex items-center justify-between mb-4"><h1 class="page-title">Menu</h1></div>' +
        '<div class="panel">' + emptyStateHtml() + '</div>';
      const a = root.querySelector('[data-act="create-empty"]'); if (a) a.onclick = () => goEdit('new');
      return;
    }

    root.innerHTML = body;
    wireList(rows, pageRows);
  }

  function listRowHtml(m) {
    const labels = flatLabels(m.items);
    const text = labels.length ? labels.join(', ') : DASH;
    return '<tr data-id="' + m.id + '">' +
      '<td onclick="event.stopPropagation()"><input type="checkbox" class="mnu-pick" style="width:15px;height:15px;accent-color:var(--brand);cursor:pointer" /></td>' +
      '<td style="font-weight:600;color:var(--ink)">' + esc(m.title) + '</td>' +
      '<td><span class="mnu-link-cell" style="max-width:520px;color:var(--ink-body)" title="' + (text === DASH ? '' : esc(text)) + '">' + esc(text) + '</span></td>' +
      '<td style="text-align:center"><button class="mnu-icon-btn" data-view="' + m.id + '" title="View / edit">' + I.eye + '</button></td>' +
    '</tr>';
  }

  function emptyStateHtml() {
    return '<div class="mnu-empty-state">' +
      '<svg width="180" height="160" viewBox="0 0 200 200" fill="none">' +
        '<circle cx="100" cy="100" r="78" fill="#DBEAFE" opacity="0.3"/>' +
        '<rect x="58" y="62" width="84" height="76" rx="8" fill="white" stroke="#E5E7EB" stroke-width="2"/>' +
        '<rect x="76" y="82" width="48" height="6" rx="3" fill="#CBD5E1"/>' +
        '<rect x="76" y="98" width="48" height="6" rx="3" fill="#CBD5E1"/>' +
        '<rect x="76" y="114" width="48" height="6" rx="3" fill="#CBD5E1"/>' +
        '<circle cx="66" cy="85" r="3" fill="#3B82F6"/><circle cx="66" cy="101" r="3" fill="#3B82F6"/><circle cx="66" cy="117" r="3" fill="#3B82F6"/>' +
        '<circle cx="146" cy="136" r="18" fill="#3B82F6"/>' +
        '<path d="M146 128v16M138 136h16" stroke="white" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>' +
      '<h3>Add and manage your menu</h3>' +
      '<button class="btn btn-primary" data-act="create-empty">Add menu</button>' +
    '</div>';
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
    const inp = root.querySelector('#mnu-search');
    if (inp) {
      inp.oninput = () => { LST.kw = inp.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      inp.onkeydown = (e) => { if (e.key === 'Enter') inp.blur(); };
      inp.onblur = commit;
    }
    const tagX = root.querySelector('[data-clear="kw"] .x'); if (tagX) tagX.onclick = () => { LST.kw = ''; LST.kwApplied = ''; LST.page = 1; renderList(); };
    const ps = root.querySelector('#pg-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    root.querySelectorAll('#mnu-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goEdit(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goEdit(b.getAttribute('data-view')); });
    const all = root.querySelector('#mnu-all');
    if (all) all.onclick = () => { root.querySelectorAll('.mnu-pick').forEach((c) => { c.checked = all.checked; }); };
    const cr = root.querySelector('[data-act="create"]'); if (cr) cr.onclick = () => goEdit('new');
  }

  // ================= EDIT VIEW =================
  // CUR is a deep-cloned working copy (cancel/leave is non-destructive).
  let CUR = null;          // { id, title, handle, item:[ {localId, level, label, link, sort, children} ] }
  let ORIGIN = null;       // JSON string snapshot for dirty-check
  let titleError = '';
  let seed = 0;
  const newLocalId = () => 'mi-' + Date.now() + '-' + (++seed);
  const expanded = {};     // localId -> bool

  function withLocalIds(items) {
    return (items || []).map((it) => {
      const localId = newLocalId();
      return {
        localId, level: 1, label: it.label, link: it.link, sort: it.sort || 0,
        children: (it.children || []).map((c) => ({ localId: newLocalId(), parentLocalId: localId, level: 2, label: c.label, link: c.link, sort: c.sort || 0, children: null })),
      };
    });
  }

  function loadEdit(id) {
    titleError = '';
    if (id === 'new') {
      CUR = { id: null, title: '', handle: '', item: [] };
    } else {
      const src = D.DETAILS[id] || D.DETAILS[Number(id)];
      if (!src) { CUR = null; return; }
      CUR = { id: src.id, title: src.title, handle: src.handle, item: withLocalIds(src.item) };
    }
    ORIGIN = JSON.stringify({ title: CUR.title, item: CUR.item });
  }
  const isDirty = () => ORIGIN !== JSON.stringify({ title: CUR.title, item: CUR.item });

  function renderEdit(id) {
    loadEdit(id);
    if (CUR === null) { renderMissing(id); return; }
    const isNew = CUR.id == null;
    // pageTitle (store/menu.ts): new -> "Add menu"; edit -> title || "Edit menu"
    const title = isNew ? 'Add menu' : esc(CUR.title || 'Edit menu');

    root.innerHTML =
      '<div class="detail-wrap">' +
        '<div id="mnu-savebar-slot"></div>' +
        '<div class="flex items-center gap-2 mb-4">' +
          '<button class="back-btn" data-act="back" title="Back to menus">' + I.arrowLeft + '</button>' +
          '<span class="page-title">' + title + '</span>' +
        '</div>' +
        infoCard() +
        itemsCard() +
        '<div class="flex justify-end gap-2 mt-4">' +
          '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add menu' : 'Update menu') + '</button>' +
          (isNew ? '' : '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:var(--ctl)">Delete menu</button>') +
        '</div>' +
      '</div>';

    wireEdit();
    refreshSaveBar();
  }

  function infoCard() {
    const count = (CUR.title || '').length;
    return '<div class="panel card-pad mb-4">' +
      '<div class="card-title mb-1">Menu title</div>' +
      '<div style="margin-top:10px;position:relative">' +
        '<input class="input" id="ed-title" maxlength="100" value="' + esc(CUR.title) + '" placeholder="e.g., Header menu" style="' + (titleError ? 'border-color:var(--err)' : '') + '" />' +
        '<span class="mnu-count" id="ed-title-count" style="position:absolute;right:10px;top:9px;background:#fff;padding-left:4px">' + count + ' / 100</span>' +
      '</div>' +
      (titleError ? '<div class="mnu-field-err">' + esc(titleError) + '</div>' : '') +
    '</div>';
  }

  function itemsCard() {
    return '<div class="panel mb-4">' +
      '<div class="flex items-center justify-between card-pad" style="border-bottom:1px solid var(--hair)">' +
        '<div class="card-title">Menu items</div>' +
        '<button class="btn btn-gray" data-act="add-item">Add menu item</button>' +
      '</div>' +
      '<div style="overflow-x:auto" id="ed-items-host">' + itemsTableHtml() + '</div>' +
    '</div>';
  }

  function itemsTableHtml() {
    const tops = sortedItems(CUR.item);
    const rows = [];
    if (!tops.length) {
      return '<table class="tbl" style="min-width:640px"><thead>' + itemsHead() + '</thead>' +
        '<tbody><tr><td colspan="4" style="text-align:center;padding:44px" class="muted">No menu items yet. Use “Add menu item” to create your first link.</td></tr></tbody></table>';
    }
    tops.forEach((t) => {
      const hasKids = (t.children || []).length > 0;
      const isOpen = !!expanded[t.localId];
      rows.push(topRowHtml(t, hasKids, isOpen));
      if (isOpen) (t.children || []).forEach((c) => rows.push(childRowHtml(c)));
    });
    return '<table class="tbl" style="min-width:640px"><thead>' + itemsHead() + '</thead><tbody id="ed-tbody">' + rows.join('') + '</tbody></table>';
  }

  function itemsHead() {
    return '<tr>' +
      '<th>Label</th><th>Link</th>' +
      '<th style="width:120px"><span class="mnu-help">Sort <span class="qm" title="Higher sort show first">' + I.help + '</span></span></th>' +
      '<th style="width:120px;text-align:center">Action</th>' +
    '</tr>';
  }

  function topRowHtml(t, hasKids, isOpen) {
    const chev = hasKids
      ? '<button class="mnu-expand" data-expand="' + t.localId + '" title="' + (isOpen ? 'Collapse' : 'Expand') + '">' + (isOpen ? I.chevDown : I.chevRight) + '</button>'
      : '<span class="mnu-expand placeholder"></span>';
    return '<tr data-row="' + t.localId + '">' +
      '<td><div class="flex items-center gap-2">' + chev + '<span style="font-weight:600;color:var(--ink)">' + esc(t.label || DASH) + '</span>' +
        (hasKids ? '<span class="muted" style="font-size:11.5px">(' + t.children.length + ')</span>' : '') + '</div></td>' +
      '<td>' + linkCell(t.link) + '</td>' +
      '<td>' + (t.sort ? t.sort : '<span class="muted">' + DASH + '</span>') + '</td>' +
      '<td style="text-align:center">' + rowActions(t.localId) + '</td>' +
    '</tr>';
  }

  function childRowHtml(c) {
    return '<tr class="mnu-childrow" data-row="' + c.localId + '">' +
      '<td><div class="flex items-center gap-2 mnu-child-label"><span style="color:var(--ink-muted)">└</span><span style="color:var(--ink-body)">' + esc(c.label || DASH) + '</span></div></td>' +
      '<td>' + linkCell(c.link) + '</td>' +
      '<td>' + (c.sort ? c.sort : '<span class="muted">' + DASH + '</span>') + '</td>' +
      '<td style="text-align:center">' + rowActions(c.localId) + '</td>' +
    '</tr>';
  }

  function linkCell(link) {
    if (!link) return '<span class="muted">' + DASH + '</span>';
    return '<span class="mnu-link-cell" title="' + esc(link) + '">' + esc(link) + '</span>';
  }
  function rowActions(localId) {
    return '<div class="flex items-center justify-center gap-1">' +
      '<button class="mnu-icon-btn" data-edit-item="' + localId + '" title="Edit">' + I.pencil + '</button>' +
      '<button class="mnu-icon-btn danger" data-del-item="' + localId + '" title="Delete">' + I.trash + '</button>' +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Menu #' + esc(id) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Menu not editable in this prototype</div>' +
        '<div class="muted">Open one with a sample tree: Main menu, Footer menu, Header promo bar or Mobile menu.</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/menu'; };
  }

  // ---- unsaved-changes bar ----
  function refreshSaveBar() {
    const slot = root.querySelector('#mnu-savebar-slot');
    if (!slot) return;
    if (!isDirty()) { slot.innerHTML = ''; return; }
    // shared full-width "You have unsaved changes" bar (UI.unsavedBar) — only injected when dirty (show:true)
    slot.innerHTML = window.UI.unsavedBar({ saveLabel: CUR.id == null ? 'Add' : 'Update', saveAct: 'save2', show: true });
    const dc = slot.querySelector('[data-act="discard"]'); if (dc) dc.onclick = onDiscard;
    const sv = slot.querySelector('[data-act="save2"]'); if (sv) sv.onclick = doSave;
  }

  function wireEdit() {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = tryLeave;
    const del = root.querySelector('[data-act="delete"]'); if (del) del.onclick = () => openDeleteMenuModal(CUR.id);
    const save = root.querySelector('[data-act="save"]'); if (save) save.onclick = doSave;

    const t = root.querySelector('#ed-title');
    const cnt = root.querySelector('#ed-title-count');
    if (t) {
      t.oninput = () => { CUR.title = t.value; if (cnt) cnt.textContent = t.value.length + ' / 100'; if (titleError) { titleError = ''; t.style.borderColor = ''; const e = t.parentElement.parentElement.querySelector('.mnu-field-err'); if (e) e.remove(); } refreshSaveBar(); };
      t.onblur = () => { CUR.title = t.value.trim(); t.value = CUR.title; };
    }
    wireItemsArea();
  }

  function wireItemsArea() {
    const add = root.querySelector('[data-act="add-item"]'); if (add) add.onclick = () => openItemModal('add', null);
    root.querySelectorAll('[data-expand]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); const id = b.getAttribute('data-expand'); expanded[id] = !expanded[id]; rerenderItems(); });
    root.querySelectorAll('[data-edit-item]').forEach((b) => b.onclick = () => openItemModal('edit', b.getAttribute('data-edit-item')));
    root.querySelectorAll('[data-del-item]').forEach((b) => b.onclick = () => removeItem(b.getAttribute('data-del-item')));
  }

  function rerenderItems() {
    const host = root.querySelector('#ed-items-host');
    if (host) host.innerHTML = itemsTableHtml();
    wireItemsArea();
    refreshSaveBar();
  }

  // ---- find item by localId (top or child) ----
  function findItem(localId) {
    for (const t of CUR.item) {
      if (t.localId === localId) return { node: t, parent: null };
      const c = (t.children || []).find((x) => x.localId === localId);
      if (c) return { node: c, parent: t };
    }
    return { node: null, parent: null };
  }

  function removeItem(localId) {
    const { node } = findItem(localId);
    if (!node) return;
    // level-1 with children cannot be deleted (must clear sub-items first)
    if (node.level === 1 && (node.children || []).length > 0) {
      toast('Unable to delete. This menu item has nested sub-menu item. Please delete the sub-menu item first.', 'error');
      return;
    }
    openConfirm({
      title: 'Confirm to delete?',
      message: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!',
      okText: 'Confirm', danger: true,
      onOk: () => {
        if (node.level === 1) {
          CUR.item = CUR.item.filter((x) => x.localId !== localId);
        } else {
          CUR.item.forEach((t) => { if (t.children) t.children = t.children.filter((x) => x.localId !== localId); });
        }
        toast('Deleted successfully');
        rerenderItems();
      },
    });
  }

  // ================= ITEM MODAL (add / edit) =================
  // mode 'add' | 'edit'; editId is a localId when editing.
  function openItemModal(mode, editId) {
    const editing = mode === 'edit';
    let draft = { level: 1, parentLocalId: undefined, label: '', link: '', sort: undefined };
    if (editing) {
      const { node } = findItem(editId);
      if (!node) return;
      draft = { level: node.level, parentLocalId: node.parentLocalId, label: node.label, link: node.link, sort: node.sort || undefined };
    }
    const errs = {};

    const parentOpts = () => CUR.item
      .filter((t) => t.level === 1 && t.localId !== editId)
      .map((t) => '<option value="' + t.localId + '"' + (t.localId === draft.parentLocalId ? ' selected' : '') + '>' + esc(t.label) + '</option>').join('');

    const body =
      '<div class="mb-3">' +
        '<label class="ctrl-label" style="text-transform:none">Menu item type <span style="color:var(--err)">*</span></label>' +
        '<div class="mnu-radio-row" style="margin-top:6px">' +
          '<label class="mnu-radio"><input type="radio" name="it-level" value="1"' + (draft.level === 1 ? ' checked' : '') + ' /> Level 1</label>' +
          '<label class="mnu-radio"><input type="radio" name="it-level" value="2"' + (draft.level === 2 ? ' checked' : '') + ' /> Level 2</label>' +
        '</div>' +
      '</div>' +
      '<div id="it-parent-slot"></div>' +
      '<div class="mb-3">' +
        '<label class="ctrl-label" style="text-transform:none">Label <span style="color:var(--err)">*</span></label>' +
        '<div style="position:relative;margin-top:4px">' +
          '<input class="input" id="it-label" maxlength="100" value="' + esc(draft.label) + '" placeholder="e.g., About us" />' +
          '<span class="mnu-count" id="it-label-count" style="position:absolute;right:10px;top:9px;background:#fff;padding-left:4px">' + (draft.label || '').length + ' / 100</span>' +
        '</div>' +
        '<div class="mnu-field-err" id="it-label-err" style="display:none"></div>' +
      '</div>' +
      '<div class="mb-3">' +
        '<label class="ctrl-label" style="text-transform:none">Link</label>' +
        '<div style="position:relative;margin-top:4px">' +
          '<input class="input" id="it-link" maxlength="255" value="' + esc(draft.link) + '" placeholder="Please enter link" />' +
          '<span class="mnu-count" id="it-link-count" style="position:absolute;right:10px;top:9px;background:#fff;padding-left:4px">' + (draft.link || '').length + ' / 255</span>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label class="ctrl-label" style="text-transform:none">Sort</label>' +
        '<input class="input" id="it-sort" type="number" min="1" max="9999" value="' + (draft.sort != null ? draft.sort : '') + '" placeholder="1-9999" style="margin-top:4px" />' +
        '<div class="muted" style="font-size:12px;margin-top:4px">Higher sort show first</div>' +
        '<div class="mnu-field-err" id="it-sort-err" style="display:none"></div>' +
      '</div>';

    const ctrl = modal({
      title: editing ? 'Edit menu item' : 'Add menu item', width: 520, okText: editing ? 'Update' : 'Add',
      body,
      onOk: (m, close) => {
        const label = (m.querySelector('#it-label').value || '').trim();
        const link = (m.querySelector('#it-link').value || '').trim();
        const sortRaw = m.querySelector('#it-sort').value;
        const level = Number(m.querySelector('input[name="it-level"]:checked').value);
        const parentLocalId = level === 2 ? (m.querySelector('#it-parent') || {}).value || '' : undefined;

        // validate (mirrors validateMenuItemDraft + sort range)
        let ok = true;
        const labelErr = m.querySelector('#it-label-err');
        const sortErr = m.querySelector('#it-sort-err');
        labelErr.style.display = 'none'; sortErr.style.display = 'none';

        if (level === 2 && !parentLocalId) { ok = false; setParentErr('Please select a menu category'); }
        if (!label) { ok = false; labelErr.textContent = 'Please enter menu title'; labelErr.style.display = 'block'; }
        else {
          // uniqueness: level-1 unique among tops; level-2 unique within parent
          if (level === 1) {
            const dup = CUR.item.some((t) => t.localId !== editId && t.label === label);
            if (dup) { ok = false; labelErr.textContent = 'Label already exist'; labelErr.style.display = 'block'; }
          } else if (parentLocalId) {
            const parent = CUR.item.find((t) => t.localId === parentLocalId);
            const dup = parent && (parent.children || []).some((c) => c.localId !== editId && c.label === label);
            if (dup) { ok = false; labelErr.textContent = 'Label already exist'; labelErr.style.display = 'block'; }
          }
        }
        let sortVal = 0;
        if (sortRaw !== '' && sortRaw != null) {
          const n = Number(sortRaw);
          if (!Number.isInteger(n) || n < 1 || n > 9999) { ok = false; sortErr.textContent = 'Sort must be an integer between 1 and 9999.'; sortErr.style.display = 'block'; }
          else sortVal = n;
        }
        if (!ok) return;

        // block converting a level-1-with-children into level-2
        if (editing) {
          const { node } = findItem(editId);
          if (node && node.level === 1 && level === 2 && (node.children || []).length > 0) {
            toast('Unable to convert. This menu item has nested sub-menu item. Please delete the sub-menu item first.', 'error');
            return;
          }
        }

        applyItem({ editId: editing ? editId : null, level, parentLocalId, label, link, sort: sortVal });
        close();
        toast(editing ? 'Update menu item successfully' : 'Add menu item successfully');
        rerenderItems();
      },
    });

    const m = ctrl.m;
    const setParentErr = (msg) => {
      const e = m.querySelector('#it-parent-err');
      if (e) { e.textContent = msg; e.style.display = msg ? 'block' : 'none'; }
    };
    const renderParentSlot = () => {
      const slot = m.querySelector('#it-parent-slot');
      if (draft.level === 2) {
        slot.innerHTML = '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Parent menu item <span style="color:var(--err)">*</span></label>' +
          '<select class="input" id="it-parent" style="margin-top:4px"><option value="">Select a menu category</option>' + parentOpts() + '</select>' +
          '<div class="mnu-field-err" id="it-parent-err" style="display:none"></div></div>';
      } else {
        slot.innerHTML = '';
      }
    };
    renderParentSlot();
    m.querySelectorAll('input[name="it-level"]').forEach((r) => r.onchange = () => { draft.level = Number(r.value); if (draft.level === 1) draft.parentLocalId = undefined; renderParentSlot(); });
    const lab = m.querySelector('#it-label'); const labCnt = m.querySelector('#it-label-count');
    if (lab) lab.oninput = () => { labCnt.textContent = lab.value.length + ' / 100'; };
    const lnk = m.querySelector('#it-link'); const lnkCnt = m.querySelector('#it-link-count');
    if (lnk) lnk.oninput = () => { lnkCnt.textContent = lnk.value.length + ' / 255'; };
  }

  // insert / update item into CUR (mirrors insertItem + removeItem flow)
  function applyItem({ editId, level, parentLocalId, label, link, sort }) {
    // remove existing node first if editing
    let existingChildren = [];
    if (editId) {
      const { node } = findItem(editId);
      if (node && node.level === 1) existingChildren = node.children || [];
      CUR.item = CUR.item.filter((t) => t.localId !== editId);
      CUR.item.forEach((t) => { if (t.children) t.children = t.children.filter((x) => x.localId !== editId); });
    }
    const localId = editId || newLocalId();
    if (level === 1) {
      CUR.item.push({ localId, level: 1, label, link, sort, children: (editId ? existingChildren : []) });
    } else {
      const parent = CUR.item.find((t) => t.localId === parentLocalId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push({ localId, parentLocalId, level: 2, label, link, sort, children: null });
        expanded[parentLocalId] = true; // reveal the new child
      }
    }
  }

  // ================= CONFIRM / DELETE-MENU / DISCARD =================
  function onDiscard() {
    openConfirm({
      title: 'Are you sure you want to discard the changed contents?',
      message: 'Your edits to this menu will be lost.',
      okText: 'Discard', danger: true,
      onOk: () => { renderEdit(CUR.id == null ? 'new' : String(CUR.id)); },
    });
  }

  function tryLeave() {
    if (!isDirty()) { location.hash = '#/menu'; return; }
    openConfirm({
      title: 'Are you sure you want to leave?',
      message: 'Unsaved changes will be lost.',
      okText: 'Exit', danger: false,
      onOk: () => { location.hash = '#/menu'; },
    });
  }

  function openDeleteMenuModal(id) {
    openConfirm({
      title: 'Confirm to delete?',
      message: 'Once deleted, the data cannot be retrieved. Please confirm before proceeding!',
      okText: 'Confirm', danger: true,
      onOk: () => {
        const idx = D.MENUS.findIndex((x) => String(x.id) === String(id));
        if (idx >= 0) D.MENUS.splice(idx, 1);
        delete D.DETAILS[id]; delete D.DETAILS[Number(id)];
        toast('Deleted successfully');
        ORIGIN = JSON.stringify({ title: CUR.title, item: CUR.item }); // suppress leave-guard
        location.hash = '#/menu';
      },
    });
  }

  function openConfirm({ title, message, okText, danger, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + esc(title) + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.55">' + esc(message) + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn ' + (danger ? 'btn-default' : 'btn-primary') + '" data-ok' + (danger ? ' style="color:#fff;background:var(--err);border-color:var(--err)"' : '') + '>' + esc(okText || 'Confirm') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); onOk && onOk(); };
  }

  // ================= GENERIC MODAL shell =================
  function modal({ title, body, width, okText, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + esc(title) + '</span>' +
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

  // ================= SAVE =================
  function doSave() {
    CUR.title = (CUR.title || '').trim();
    if (!CUR.title) {
      // surface the title error in place — do NOT re-render (that would reload from the store and drop item edits)
      const t = root.querySelector('#ed-title');
      if (t) {
        t.value = '';
        t.style.borderColor = 'var(--err)';
        const card = t.closest('.panel');
        if (card && !card.querySelector('.mnu-field-err')) card.appendChild(h('<div class="mnu-field-err">Can\'t be blank</div>'));
        t.focus();
      }
      return;
    }
    // strip localIds back to MenuItem shape for the "saved" record
    const stripped = sortedItems(CUR.item).map((t) => ({
      level: 1, label: t.label, link: t.link, sort: t.sort || 0,
      children: (t.children || []).map((c) => ({ level: 2, label: c.label, link: c.link, sort: c.sort || 0, children: null })),
    }));

    if (CUR.id == null) {
      const newId = Math.max(0, ...D.MENUS.map((m) => m.id)) + 1;
      CUR.id = newId;
      const handle = CUR.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      D.MENUS.unshift({ id: newId, title: CUR.title, handle, items: stripped });
      D.DETAILS[newId] = { id: newId, title: CUR.title, handle, item: stripped };
      toast('Menu “' + CUR.title + '” created');
    } else {
      const row = D.MENUS.find((m) => m.id === CUR.id);
      if (row) { row.title = CUR.title; row.items = stripped; }
      D.DETAILS[CUR.id] = { id: CUR.id, title: CUR.title, handle: CUR.handle, item: stripped };
      toast('Saved successfully');
    }
    ORIGIN = JSON.stringify({ title: CUR.title, item: CUR.item }); // mark clean -> suppress leave-guard
    location.hash = '#/menu';
  }

  // ================= ROUTER (SPA: registered with the shell router) =================
  function goEdit(id) { location.hash = '#/menu/' + id; }

  function route(rest) {
    if (rest) { renderEdit(decodeURIComponent(rest)); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.menu = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
