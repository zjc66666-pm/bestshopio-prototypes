/* BestShopio Admin · Blog prototype — list + edit, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin .../admin/blog
   (list = posts table + field/status filters; edit = Blog title / Organization /
   Content on the left, Status / Recommend / SEO / Image / Theme on the right,
   plus the SEO right-drawer and discard/delete confirm modals). */
(function () {
  const D = window.DATA_BLOG;
  let root; // set by the SPA shell router via VIEWS.blog.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 16),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17h.01"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    xsm: svg('<path d="M18 6 6 18M6 6l12 12"/>', 14),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', 22),
    bold: svg('<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>', 15),
    italic: svg('<path d="M19 4h-9M14 20H5M15 4 9 20"/>', 15),
    list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 15),
    link: svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>', 15),
    h2: svg('<path d="M4 12h8M4 18V6M12 18V6"/><path d="M17 12c1.5-1 4-1 4 1.5 0 1.5-2 2.5-4 4.5h4"/>', 15),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  const statusPill = (st) => {
    const m = D.STATUS_PILL[st] || { text: String(st), cls: 'pill-gray' };
    return '<span class="pill ' + m.cls + '"><span class="dot"></span>' + esc(m.text) + '</span>';
  };

  // ===========================================================================
  // LIST VIEW
  // ===========================================================================
  const LST = {
    field: 'title', kw: '', kwApplied: '',
    status: [],          // multi-select of 0 / 1
    sel: [],             // selected row ids (row-selection checkboxes)
    page: 1, size: 20,
  };

  function filteredRows() {
    let rows = D.POSTS.slice();
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((p) => String(LST.field === 'author' ? p.author : p.title).toLowerCase().includes(q));
    }
    if (LST.status.length) rows = rows.filter((p) => LST.status.includes(p.status));
    return rows;
  }

  function renderList() {
    ensureBlogStyles();
    LST.page = LST.page || 1;
    // "no data ever" → rich empty state (mirrors hasEverHadData=false branch in list.tsx + table.tsx)
    const hasEverHadData = D.POSTS.length > 0;
    if (!hasEverHadData) { renderEmptyList(); return; }

    const rows = filteredRows();
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const fieldOpts = D.SEARCH_FIELDS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.field ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');
    const fieldLabel = (D.SEARCH_FIELDS.find((o) => o.value === LST.field) || {}).label || '';
    const statusText = LST.status.length
      ? LST.status.map((v) => (D.STATUS_OPTIONS.find((o) => o.value === v) || {}).label).join(', ')
      : 'Status';

    // active filter tags
    const tags = [];
    if (LST.kwApplied) tags.push('<span class="field-pill" data-clear="kw">' + esc(fieldLabel) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    if (LST.status.length) tags.push('<span class="field-pill" data-clear="status">Status: ' + esc(LST.status.map((v) => (D.STATUS_OPTIONS.find((o) => o.value === v) || {}).label).join(', ')) + ' <span class="x">&times;</span></span>');

    // header checkbox: checked when every visible row is selected
    const allOnPage = pageRows.length > 0 && pageRows.every((p) => LST.sel.includes(p.article_id));

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Blog</h1>' +
        '<button class="btn btn-primary" data-act="add">Add blog</button>' +
      '</div>' +
      '<div class="panel">' +
        // single "All" tab with count (reflects the filtered total, like the reference)
        '<div class="tabs" style="padding:0 8px"><div class="tab active">All<span class="count-badge">' + total + '</span></div></div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // field + keyword group
            '<div class="flex" style="min-width:418px">' +
              '<select class="filter-select" id="bl-field" style="width:150px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="bl-kw" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // status multi-select
            '<div class="sel-trigger" id="bl-status" style="width:200px">' +
              '<span class="' + (LST.status.length ? '' : 'muted') + '">' + esc(statusText) + '</span>' + I.chevDown +
            '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="bl-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:800px">' +
          '<thead><tr>' +
            '<th style="width:44px"><input type="checkbox" class="row-ck" id="bl-ckall"' + (allOnPage ? ' checked' : '') + ' /></th>' +
            '<th>Blog title</th><th style="width:140px">Status</th><th style="width:160px">Author</th>' +
            '<th style="width:180px">Last updated</th><th style="width:80px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="bl-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">No blogs match these filters.</td></tr>') +
          '</tbody>' +
        '</table>' +
        '</div>' +
        // pagination footer
        '<div class="flex items-center justify-between card-pad">' +
          '<span class="muted" style="font-size:13px">Total ' + total + ' records</span>' +
          pagerHtml(LST.page, pages) +
        '</div>' +
      '</div>';

    wireList();
  }

  // rich empty state (mirrors renderEmptyState in table.tsx): illustration + copy + Add blog
  function renderEmptyList() {
    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Blog</h1>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="flex flex-col items-center justify-center" style="padding:80px 24px;text-align:center">' +
          '<div style="margin-bottom:24px">' + emptyArt() + '</div>' +
          '<h3 style="font-size:20px;font-weight:600;color:var(--ink);margin:0 0 8px">Add and manage your blog</h3>' +
          '<p class="muted" style="font-size:13.5px;max-width:420px;margin:0 0 24px">Blogs are great tools for giving your brand a voice and promoting new products and promotions.</p>' +
          '<button class="btn btn-primary" data-act="add" style="height:40px;padding:0 20px;font-size:14px">Add blog</button>' +
        '</div>' +
      '</div>';
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  // empty-state illustration (mirrors the inline SVG in table.tsx)
  function emptyArt() {
    return '<svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">' +
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
  }

  function rowHtml(p) {
    const on = LST.sel.includes(p.article_id);
    return '<tr data-id="' + p.article_id + '"' + (on ? ' class="sel-row"' : '') + '>' +
      '<td><input type="checkbox" class="row-ck" data-ck="' + p.article_id + '"' + (on ? ' checked' : '') + ' /></td>' +
      '<td>' +
        '<div class="flex items-center gap-3">' +
          '<img src="' + p.image_input + '" alt="" style="width:40px;height:40px;border-radius:6px;flex:none;background:#f3f4f6" />' +
          '<span style="font-weight:500;color:var(--ink)">' + esc(p.title) + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' + statusPill(p.status) + '</td>' +
      '<td class="' + (p.author ? '' : 'muted') + '">' + esc(p.author || '- -') + '</td>' +
      '<td class="muted">' + esc(p.create_time || '- -') + '</td>' +
      '<td style="text-align:center"><button class="back-btn" data-edit="' + p.article_id + '" title="Edit blog" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
      '<select class="pg-size" id="bl-size">' +
        ['20', '50', '100'].map((s) => '<option value="' + s + '"' + (Number(s) === LST.size ? ' selected' : '') + '>' + s + ' / page</option>').join('') +
      '</select>' +
    '</div>';
  }

  function wireList() {
    const field = root.querySelector('#bl-field');
    if (field) field.onchange = () => { LST.field = field.value; if (LST.kwApplied) { LST.page = 1; renderList(); } };
    const kw = root.querySelector('#bl-kw');
    if (kw) {
      kw.oninput = () => { LST.kw = kw.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kw.onkeydown = (e) => { if (e.key === 'Enter') kw.blur(); };
      kw.onblur = commit;
    }
    const stTrig = root.querySelector('#bl-status');
    if (stTrig) stTrig.onclick = () => openStatusPopover(stTrig);
    root.querySelectorAll('#bl-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'status') { LST.status = []; }
      LST.page = 1; renderList();
    });
    const ps = root.querySelector('#bl-size');
    if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row + eye -> edit
    root.querySelectorAll('#bl-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goEdit(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goEdit(b.getAttribute('data-edit')); });
    // row-selection checkboxes (per row + header select-all on current page)
    root.querySelectorAll('#bl-tbody .row-ck[data-ck]').forEach((ck) => {
      ck.onclick = (e) => e.stopPropagation();
      ck.onchange = () => {
        const id = Number(ck.getAttribute('data-ck'));
        LST.sel = LST.sel.filter((x) => x !== id);
        if (ck.checked) LST.sel.push(id);
        const tr = ck.closest('tr'); if (tr) tr.classList.toggle('sel-row', ck.checked);
        const head = root.querySelector('#bl-ckall');
        if (head) { const pageIds = filteredRows().slice((LST.page - 1) * LST.size, (LST.page - 1) * LST.size + LST.size).map((p) => p.article_id); head.checked = pageIds.length > 0 && pageIds.every((x) => LST.sel.includes(x)); }
      };
    });
    const ckAll = root.querySelector('#bl-ckall');
    if (ckAll) ckAll.onchange = () => {
      const pageIds = filteredRows().slice((LST.page - 1) * LST.size, (LST.page - 1) * LST.size + LST.size).map((p) => p.article_id);
      if (ckAll.checked) pageIds.forEach((id) => { if (!LST.sel.includes(id)) LST.sel.push(id); });
      else LST.sel = LST.sel.filter((x) => !pageIds.includes(x));
      renderList();
    };
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goEdit('0');
  }

  // status multi-select popover (mirrors SelectMulti)
  function openStatusPopover(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:200px;padding:6px"></div>');
    pop.innerHTML = D.STATUS_OPTIONS.map((o) =>
      '<label class="edit-check" data-v="' + o.value + '" style="padding:7px 10px;border-radius:6px">' +
        '<input type="checkbox"' + (LST.status.includes(o.value) ? ' checked' : '') + ' />' +
        '<span>' + esc(o.label) + '</span>' +
      '</label>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('.edit-check').forEach((lab) => {
      const v = Number(lab.getAttribute('data-v'));
      lab.onclick = (e) => {
        // let the checkbox toggle naturally; sync after the tick
        setTimeout(() => {
          const on = lab.querySelector('input').checked;
          LST.status = LST.status.filter((x) => x !== v);
          if (on) LST.status.push(v);
          LST.page = 1; renderList();
          // keep popover open for multi-pick
          const again = root.querySelector('#bl-status'); if (again) openStatusPopover(again);
        }, 0);
      };
    });
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ===========================================================================
  // EDIT VIEW  (#/blog/edit/:id ; id "0" = new)
  // ===========================================================================
  // working copy of the blog being edited (mirrors blogStore.formData + settings)
  let F = null;
  let ORIG = null;        // JSON snapshot used to detect unsaved changes (mirrors blogStore.resetToOrigin)
  let isNew = false;
  let saved = false;      // set when we intentionally leave (save/discard/delete) — suppresses the leave guard

  // normalize for dirty-compare: drop internal __ helper keys
  const snap = (o) => {
    const c = JSON.parse(JSON.stringify(o || {}));
    delete c.__createCat; delete c.__catTitle;
    return JSON.stringify(c);
  };
  const isDirty = () => snap(F) !== ORIG;

  function blankForm() {
    return {
      article_id: 0, cid: '', title: '', author: '', image_input: '',
      status: 1, is_recommend: 0, sort: undefined, background_color: '#E6F0FF',
      template: 'default', synopsis: '',
      seo_title: '', seo_description: '', seo_keywords: [], article_seo_title: '',
      content: { content: '' },
    };
  }

  function loadForm(id) {
    isNew = (id === '0' || id === 0);
    if (isNew) {
      F = blankForm();
    } else {
      const src = D.DETAILS[id] || D.DETAILS[Number(id)];
      if (src) { F = JSON.parse(JSON.stringify(src)); }
      else {
        // a list row without a fleshed-out detail record — synthesize from the row
        const p = D.POSTS.find((x) => String(x.article_id) === String(id));
        F = Object.assign(blankForm(), p ? {
          article_id: p.article_id, cid: p.cid, title: p.title, author: p.author,
          image_input: p.image_input, status: p.status, is_recommend: p.is_recommend || 0,
          sort: p.sort, article_seo_title: slug(p.title),
          content: { content: '<p>' + esc(p.title) + '</p>' },
        } : {});
      }
    }
    // Snapshot the pristine form as the dirty baseline — for NEW blogs too.
    // Previously the isNew branch returned early and left ORIG stale/null, so
    // isDirty() was always true and the dark "Unsaved changes" bar showed the
    // instant you opened "Add blog" without touching anything.
    F.seo_keywords = F.seo_keywords || [];
    ORIG = snap(F);
    saved = false;
  }

  const categoryHandle = () => {
    const c = D.CATEGORIES.find((x) => x.article_category_id === Number(F.cid));
    return c && c.seo_path ? c.seo_path : '';
  };
  const seoUrlPrefix = () => {
    const ch = categoryHandle();
    return D.SHOP_URL + '/blog' + (ch ? '/' + ch + '/' : '/');
  };

  function renderEdit(id) {
    loadForm(id);
    paintEdit();
  }

  function paintEdit() {
    ensureBlogStyles();
    const pageTitle = isNew ? 'Add blog' : 'Edit blog';

    root.innerHTML =
      // fixed 1200px centered container (matches real admin detail width; the
      // dark unsaved bar lives inside it, exactly like the real blogEdit.vue)
      '<div class="detail-wrap">' +
        // shared full-width "You have unsaved changes" bar (UI.unsavedBar) — toggled by syncUnsaved().
        // blog keeps its single data-act="save" wiring (binds footer + bar together).
        window.UI.unsavedBar({ saveLabel: isNew ? 'Add' : 'Update', saveAct: 'save' }) +
        // header
        '<div class="flex items-center gap-2 mb-5">' +
          '<button class="back-btn" data-act="back" title="Back to blog">' + I.arrowLeft + '</button>' +
          '<h1 class="page-title">' + esc(pageTitle) + '</h1>' +
        '</div>' +
        // two-column body
        '<div class="detail-cols">' +
          '<div class="detail-main">' +
            infoCard() +
            organizationCard() +
            contentCard() +
            // footer actions
            '<div class="flex justify-end gap-2 mt-1">' +
              '<button class="btn btn-primary" data-act="save">' + (isNew ? 'Add' : 'Update') + '</button>' +
              (isNew ? '' : '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:#f3c2b8">Delete blog</button>') +
            '</div>' +
          '</div>' +
          '<div class="detail-rail">' +
            statusCard() +
            recommendCard() +
            seoCard() +
            imageCard() +
            themeCard() +
          '</div>' +
        '</div>' +
      '</div>';

    wireEdit();
    syncUnsaved(); // shared bar renders hidden; apply the current dirty state (e.g. dirty repaint after category change)
  }

  // toggle the dark unsaved bar based on current dirty state (call after any field edit)
  function syncUnsaved() {
    window.UI.setUnsavedBar(root, isDirty());
  }

  // module-scoped styles injected once (mirrors the convention used by the page module):
  // rich-text, status radios, SEO keyword input, image card/picker, row-selection
  // — none of these classes exist in theme.css. (The unsaved bar is shared: UI.unsavedBar.)
  function ensureBlogStyles() {
    if (document.getElementById('bl-mod-styles')) return;
    const css =
      // status radios (Visible / Hidden) — mirror Ant Radio.Group
      '.rt-radio{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--ink-body);cursor:pointer;}' +
      '.rt-dot{width:16px;height:16px;border-radius:50%;border:1px solid var(--ctl);flex:none;transition:border-color .15s;}' +
      '.rt-radio:hover .rt-dot{border-color:var(--brand);}' +
      '.rt-dot.on{border-color:var(--brand);border-width:5px;}' +
      // rich-text editor mock
      '.rt-wrap{border:1px solid var(--ctl);border-radius:8px;overflow:hidden;background:#fff;}' +
      '.rt-toolbar{display:flex;align-items:center;gap:2px;padding:6px 8px;border-bottom:1px solid var(--hair);background:#fafbfc;flex-wrap:wrap;}' +
      '.rt-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:none;background:transparent;border-radius:6px;color:var(--ink-body);cursor:pointer;}' +
      '.rt-btn:hover{background:#eef0f7;color:var(--ink);}' +
      '.rt-editor{min-height:300px;max-height:600px;overflow:auto;padding:12px 14px;font-size:14px;line-height:1.6;color:var(--ink-body);outline:none;}' +
      '.rt-editor:focus{box-shadow:inset 0 0 0 1px var(--brand);}' +
      '.rt-editor h2{font-size:17px;font-weight:600;color:var(--ink);margin:10px 0 6px;}' +
      '.rt-editor p{margin:0 0 8px;}' +
      // SEO keyword tag input
      '.kw-box{display:flex;flex-wrap:wrap;gap:6px;min-height:36px;border:1px solid var(--ctl);border-radius:8px;padding:5px 8px;align-items:center;}' +
      '.kw-box:focus-within{border-color:var(--brand);}' +
      '.kw-tag{display:inline-flex;align-items:center;gap:4px;background:#e6f0ff;border:1px solid #cfe1ff;color:#0058c4;' +
        'border-radius:6px;padding:1px 4px 1px 8px;font-size:12.5px;word-break:break-all;}' +
      '.kw-x{display:inline-flex;cursor:pointer;color:#0058c4;}.kw-x:hover{color:#003e8f;}' +
      '.kw-input{flex:1;min-width:120px;border:none;outline:none;background:transparent;font-size:13px;height:24px;color:var(--ink);}' +
      // URL addon-before (matches Ant addonBefore)
      '.addon-before{display:inline-flex;align-items:center;padding:0 10px;background:var(--panel);border:1px solid var(--ctl);' +
        'border-right:none;border-radius:8px 0 0 8px;font-size:12.5px;color:var(--ink-muted);white-space:nowrap;max-width:60%;overflow:hidden;text-overflow:ellipsis;}' +
      // image card remove badge + picker grid
      '.img-x{position:absolute;right:8px;top:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;' +
        'border-radius:50%;background:rgba(0,0,0,.5);color:#fff;cursor:pointer;transition:background .15s;}' +
      '.img-x:hover{background:rgba(0,0,0,.7);}' +
      '.img-pick{border:1px solid var(--hair);border-radius:8px;overflow:hidden;cursor:pointer;transition:border-color .15s;}' +
      '.img-pick:hover{border-color:var(--brand);}' +
      // list row-selection checkbox
      '.row-ck{width:15px;height:15px;accent-color:var(--brand);cursor:pointer;vertical-align:middle;}' +
      '.tbl tbody tr.sel-row>td{background:#f3f7ff;}';
    const el = document.createElement('style');
    el.id = 'bl-mod-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function card(titleHtml, bodyHtml, rightHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center justify-between" style="margin-bottom:14px">' +
        '<div class="card-title">' + titleHtml + '</div>' + (rightHtml || '') +
      '</div>' + bodyHtml + '</div>';
  }

  const lbl = (t) => '<label style="display:block;font-size:13px;font-weight:500;color:var(--ink);margin-bottom:4px">' + t + '</label>';

  // counter shown below an input, right-aligned (mirrors Ant showCount)
  const counterBelow = (id, n, max) => '<div style="text-align:right"><span class="muted" id="' + id + '" style="font-size:12px">' + n + ' / ' + max + '</span></div>';

  // ---- Blog title card (card title IS the label; input has showCount, no inner label) ----
  function infoCard() {
    const body =
      '<div>' +
        '<input class="input" id="f-title" maxlength="255" placeholder="Example: publish a blog as &quot;New Products&quot; for newly released products" value="' + esc(F.title) + '" />' +
        counterBelow('f-title-cnt', (F.title || '').length, 255) +
        '<div id="f-title-err" style="color:var(--err);font-size:12px;margin-top:4px;display:none">Can\'t be blank</div>' +
      '</div>';
    return card('Blog title', body);
  }

  // ---- Organization card (Author + Blog category, with inline create) ----
  function organizationCard() {
    const opts = D.CATEGORIES.map((c) =>
      '<option value="' + c.article_category_id + '"' + (Number(F.cid) === c.article_category_id ? ' selected' : '') + '>' + esc(c.title) + '</option>').join('');
    const creating = F.__createCat;
    const body =
      '<div class="mb-4">' + lbl('Author') +
        '<input class="input" id="f-author" maxlength="50" value="' + esc(F.author) + '" style="margin-top:4px" />' +
        counterBelow('f-author-cnt', (F.author || '').length, 50) +
      '</div>' +
      '<div' + (creating ? ' class="mb-4"' : '') + '>' + lbl('Blog category') +
        '<select class="input" id="f-cat" style="margin-top:4px">' +
          '<option value=""' + (!F.cid && !creating ? ' selected' : '') + ' disabled>Choose a blog category</option>' +
          opts +
          '<option value="__create__"' + (creating ? ' selected' : '') + '>+ Create a blog category</option>' +
        '</select>' +
        '<div id="f-cat-err" style="color:var(--err);font-size:12px;margin-top:4px;display:none">Can\'t be blank</div>' +
      '</div>' +
      (creating
        ? '<div>' + lbl('Blog category title') +
            '<input class="input" id="f-cattitle" maxlength="100" placeholder="Example: Gifting Ideas" value="' + esc(F.__catTitle || '') + '" style="margin-top:4px" />' +
            counterBelow('f-cattitle-cnt', (F.__catTitle || '').length, 100) +
            '<div id="f-cattitle-err" style="color:var(--err);font-size:12px;margin-top:4px;display:none">Can\'t be blank</div>' +
          '</div>'
        : '');
    return card('Organization', body);
  }

  // ---- Content card (Overview textarea + rich-text Main body mock) ----
  function contentCard() {
    const tb = (cmd, ic, t) => '<button class="rt-btn" data-cmd="' + cmd + '" title="' + t + '" type="button">' + ic + '</button>';
    const body =
      '<div class="mb-5">' + lbl('Overview') +
        '<textarea class="input" id="f-synopsis" maxlength="255" rows="3" placeholder="Give your blog a brief overview to be shown on the title page" style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(F.synopsis) + '</textarea>' +
        counterBelow('f-synopsis-cnt', (F.synopsis || '').length, 255) +
      '</div>' +
      '<div>' + lbl('Main body') +
        '<div class="rt-wrap" style="margin-top:4px">' +
          '<div class="rt-toolbar">' + tb('h2', I.h2, 'Heading') + tb('bold', I.bold, 'Bold') + tb('italic', I.italic, 'Italic') + tb('insertUnorderedList', I.list, 'List') + tb('createLink', I.link, 'Link') + tb('insertImage', I.image, 'Image') + '</div>' +
          '<div class="rt-editor" id="f-content" contenteditable="true">' + (F.content && F.content.content ? F.content.content : '') + '</div>' +
        '</div>' +
      '</div>';
    return card('Content', body);
  }

  // ---- Status card (Visible / Hidden radio) ----
  function statusCard() {
    const radio = (v, t) =>
      '<label class="rt-radio" data-v="' + v + '">' +
        '<span class="rt-dot' + (Number(F.status) === v ? ' on' : '') + '"></span><span>' + t + '</span>' +
      '</label>';
    return card('Status', '<div class="flex flex-col gap-2" id="f-status">' + radio(1, 'Visible') + radio(0, 'Hidden') + '</div>');
  }

  // ---- Recommend card (Show on homepage + Priority + Background color) ----
  function recommendCard() {
    const on = F.is_recommend === 1;
    const extra = on
      ? '<div class="mt-3">' +
          '<input class="input" id="f-sort" type="number" min="0" placeholder="Priority" value="' + (F.sort != null ? F.sort : '') + '" />' +
          '<div class="muted" style="font-size:12px;margin-top:6px">Higher priority blog show first</div>' +
        '</div>' +
        '<div class="mt-3">' +
          '<div style="font-size:13px;color:var(--ink-body);margin-bottom:6px">Background Color</div>' +
          '<div class="flex items-center gap-2">' +
            '<input type="color" id="f-bg" value="' + esc(F.background_color || '#E6F0FF') + '" style="width:40px;height:40px;border:1px solid var(--ctl);border-radius:8px;cursor:pointer;padding:2px;background:#fff" />' +
            '<span style="font-size:13px;color:var(--ink-body)" id="f-bg-val">' + esc((F.background_color || '').toUpperCase()) + '</span>' +
          '</div>' +
        '</div>'
      : '';
    const body =
      '<label class="edit-check" id="f-rec" style="padding:0"><input type="checkbox"' + (on ? ' checked' : '') + ' /><span>Show on homepage</span></label>' +
      extra;
    return card('Recommend', body);
  }

  // ---- SEO card (preview + pencil opens drawer) ----
  function seoCard() {
    const right = '<span class="lnk" data-act="seo" title="Edit SEO" style="display:inline-flex">' + I.pencil + '</span>';
    const body =
      '<div class="muted" style="font-size:12px;word-break:break-all;margin-bottom:8px">' + esc(seoUrlPrefix()) + esc(F.article_seo_title || '') + '</div>' +
      '<div style="font-size:13.5px;color:var(--brand);word-break:break-all;margin-bottom:2px">' + esc(F.seo_title || F.title || 'Page title') + '</div>' +
      '<div class="muted" style="font-size:13px;word-break:break-all">' + esc(F.seo_description || F.synopsis || 'Meta description') + '</div>';
    return card('Search engine optimization', body, right);
  }

  // ---- Image card ----
  function imageCard() {
    const has = !!F.image_input;
    const body = has
      ? '<div style="position:relative">' +
          '<div style="height:160px;border:1px solid var(--hair);border-radius:8px;background:#f7f8fb;display:flex;align-items:center;justify-content:center;overflow:hidden">' +
            '<img src="' + F.image_input + '" alt="" style="max-height:100%;max-width:100%;object-fit:contain" />' +
          '</div>' +
          '<span class="img-x" id="f-imgrm" title="Remove image">' + I.xsm + '</span>' +
          '<div class="muted" style="font-size:12px;margin-top:8px">Supports files in jpg/jpeg/png formats. Files smaller than 4MB work better.</div>' +
        '</div>'
      : '<div style="border:2px dashed var(--ctl);border-radius:8px;background:#f7f8fb;min-height:160px;display:flex;align-items:center;justify-content:center;padding:24px">' +
          '<button class="btn btn-primary" id="f-imgadd" type="button">Add image</button>' +
        '</div>' +
        '<div class="muted" style="font-size:12px;margin-top:8px">Supports files in jpg/jpeg/png formats. Files smaller than 4MB work better.</div>';
    return card('Image', body);
  }

  // ---- Theme template card ----
  function themeCard() {
    const body =
      '<select class="input" id="f-template"><option value="default" selected>Default</option></select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you\'d like the page to look like</div>';
    return card('Theme template', body);
  }

  const setCnt = (id, n, max) => { const el = root.querySelector('#' + id); if (el) el.textContent = n + ' / ' + max; };

  // ---- wire the edit view ----
  function wireEdit() {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = guardBack;

    const title = root.querySelector('#f-title');
    if (title) title.oninput = () => { F.title = title.value; setCnt('f-title-cnt', title.value.length, 255); syncUnsaved(); };

    const author = root.querySelector('#f-author');
    if (author) author.oninput = () => { F.author = author.value; setCnt('f-author-cnt', author.value.length, 50); syncUnsaved(); };

    const cat = root.querySelector('#f-cat');
    if (cat) cat.onchange = () => {
      if (cat.value === '__create__') { F.__createCat = true; F.cid = ''; }
      else { F.__createCat = false; F.cid = cat.value; }
      // repaint with the current working copy (preserves in-progress edits);
      // this refreshes the Organization card + the SEO preview URL (category-dependent)
      paintEdit();
    };
    const catTitle = root.querySelector('#f-cattitle');
    if (catTitle) catTitle.oninput = () => { F.__catTitle = catTitle.value; setCnt('f-cattitle-cnt', catTitle.value.length, 100); syncUnsaved(); };

    const syn = root.querySelector('#f-synopsis');
    if (syn) syn.oninput = () => { F.synopsis = syn.value; setCnt('f-synopsis-cnt', syn.value.length, 255); syncUnsaved(); refreshSeoPreview(); };

    const content = root.querySelector('#f-content');
    if (content) content.oninput = () => { F.content = F.content || {}; F.content.content = content.innerHTML; syncUnsaved(); };
    root.querySelectorAll('.rt-btn').forEach((b) => b.onclick = () => toast('Rich-text editor — formatting toolbar (prototype)'));

    // right column (status / recommend / seo / image / theme)
    wireRight();

    // save (footer + dark bar) / discard (dark bar) / delete (footer)
    root.querySelectorAll('[data-act="save"]').forEach((b) => b.onclick = onSave);
    root.querySelectorAll('[data-act="discard"]').forEach((b) => b.onclick = onDiscard);
    const del = root.querySelector('[data-act="delete"]'); if (del) del.onclick = openDeleteConfirm;
  }

  // wire interactions inside the right rail (shared by wireEdit + rerenderRight)
  function wireRight() {
    // status radios
    root.querySelectorAll('#f-status .rt-radio').forEach((r) => r.onclick = () => {
      F.status = Number(r.getAttribute('data-v'));
      root.querySelectorAll('#f-status .rt-dot').forEach((d) => d.classList.remove('on'));
      r.querySelector('.rt-dot').classList.add('on');
      syncUnsaved();
    });
    // recommend checkbox + (when on) priority + background color
    const rec = root.querySelector('#f-rec input');
    if (rec) rec.onchange = () => { F.is_recommend = rec.checked ? 1 : 0; rerenderRight(); syncUnsaved(); };
    const sort = root.querySelector('#f-sort');
    if (sort) sort.oninput = () => { F.sort = sort.value === '' ? undefined : Number(sort.value); syncUnsaved(); };
    const bg = root.querySelector('#f-bg');
    if (bg) bg.oninput = () => { F.background_color = bg.value; const v = root.querySelector('#f-bg-val'); if (v) v.textContent = bg.value.toUpperCase(); syncUnsaved(); };
    // SEO drawer
    const seo = root.querySelector('[data-act="seo"]'); if (seo) seo.onclick = openSeoDrawer;
    // image add / remove
    const imgadd = root.querySelector('#f-imgadd'); if (imgadd) imgadd.onclick = openImagePicker;
    const imgrm = root.querySelector('#f-imgrm'); if (imgrm) imgrm.onclick = () => { F.image_input = ''; rerenderRight(); syncUnsaved(); };
    // theme template
    const tpl = root.querySelector('#f-template'); if (tpl) tpl.onchange = () => { F.template = tpl.value; syncUnsaved(); };
  }

  // re-render just the right column cards in place (status/recommend/seo/image/theme)
  function rerenderRight() {
    const rightCol = root.querySelector('.detail-rail');
    if (!rightCol) { paintEdit(); return; }
    rightCol.innerHTML = statusCard() + recommendCard() + seoCard() + imageCard() + themeCard();
    wireRight();
  }

  function refreshSeoPreview() {
    const cardEl = root.querySelector('[data-act="seo"]');
    if (!cardEl) return;
    rerenderRight();
  }

  function openImagePicker() {
    // mimic SelectFile: pick from a small set of media thumbnails
    const swatches = ['#2563eb', '#0ea5e9', '#f97316', '#16a34a', '#7c3aed', '#db2777', '#0891b2', '#059669'];
    const grid = swatches.map((c, i) =>
      '<div class="img-pick" data-c="' + c + '"><img src="' + D.tint(c) + '" alt="media ' + (i + 1) + '" style="width:100%;height:72px;object-fit:cover;border-radius:8px" /></div>').join('');
    modal({
      title: 'Select image', width: 560, okText: 'Done', hideOk: true,
      body: '<div class="muted mb-3" style="font-size:13px">Choose an image from your media library.</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' + grid + '</div>',
      onMount: (m, close) => {
        m.querySelectorAll('.img-pick').forEach((el) => el.onclick = () => {
          F.image_input = D.tint(el.getAttribute('data-c'));
          close(); rerenderRight(); syncUnsaved(); toast('Image added');
        });
      },
    });
  }

  // ---- validation + save (mirrors validate() in BlogInformation + handleSave) ----
  function validateEdit() {
    let ok = true;
    const titleErr = root.querySelector('#f-title-err');
    if (!(F.title || '').trim()) { if (titleErr) titleErr.style.display = 'block'; ok = false; }
    else if (titleErr) titleErr.style.display = 'none';

    if (F.__createCat) {
      const e = root.querySelector('#f-cattitle-err');
      if (!(F.__catTitle || '').trim()) { if (e) e.style.display = 'block'; ok = false; }
      else if (e) e.style.display = 'none';
    } else {
      const e = root.querySelector('#f-cat-err');
      if (!F.cid) { if (e) e.style.display = 'block'; ok = false; }
      else if (e) e.style.display = 'none';
    }
    return ok;
  }

  function onSave() {
    if (!validateEdit()) { toast('Please fix the highlighted fields'); return; }
    if (isNew) {
      // mirrors handleSave: on create, redirect to the list
      toast('Blog added');
      saved = true;
      setTimeout(() => { location.hash = '#/blog'; }, 350);
    } else {
      // mirrors handleSave: on update, stay on the page; clear the dirty/unsaved state
      ORIG = snap(F);
      syncUnsaved();
      toast('Blog updated');
    }
  }

  // mirrors handleDiscard: confirm, then on edit reset to origin / on new go back to list
  function onDiscard() {
    confirmModal({
      title: 'Are you sure you want to discard changes?',
      content: 'All unsaved changes will be lost',
      okText: 'Discard',
      onOk: () => {
        if (isNew) { saved = true; location.hash = '#/blog'; }
        else { F = JSON.parse(ORIG); F.seo_keywords = F.seo_keywords || []; paintEdit(); }
      },
    });
  }

  // mirrors onBeforeRouteLeave + confirmLeave: prompt when there are unsaved changes
  function guardBack() {
    if (!isDirty()) { location.hash = '#/blog'; return; }
    confirmModal({
      title: 'Are you sure you want to leave?',
      content: 'Unsaved changes will be lost',
      okText: 'Exit',
      onOk: () => { saved = true; location.hash = '#/blog'; },
    });
  }

  function openDeleteConfirm() {
    confirmModal({
      title: 'Delete blog',
      content: 'Are you sure you want to delete this blog?',
      okText: 'Confirm', danger: true,
      onOk: () => { saved = true; toast('Blog deleted successfully'); location.hash = '#/blog'; },
    });
  }

  // ===========================================================================
  // SEO DRAWER (right slide-in) — mirrors BlogSettings SEO Drawer
  // ===========================================================================
  function openSeoDrawer() {
    // local working copy
    const S = {
      seoTitle: F.seo_title || F.title || '',
      seoDescription: F.seo_description || F.synopsis || '',
      handle: F.article_seo_title || '',
      keywords: (F.seo_keywords || []).slice(),
    };
    const backdrop = h('<div class="drawer-backdrop"></div>');
    const dr = h('<div class="drawer" style="width:480px"></div>');

    const render = () => {
      const kwTags = S.keywords.map((k, i) =>
        '<span class="kw-tag" data-i="' + i + '">' + esc(k) + '<span class="kw-x">' + I.xsm + '</span></span>').join('');
      dr.innerHTML =
        '<div class="drawer-head"><span>Search engine optimization</span>' +
          '<span class="drawer-x" data-x>' + I.x + '</span></div>' +
        '<div class="drawer-body">' +
          // preview
          '<div class="mb-4">' +
            '<div class="card-title" style="margin-bottom:8px">Preview</div>' +
            '<div class="muted" style="font-size:12px;word-break:break-all;margin-bottom:4px">' + esc(seoUrlPrefix()) + '<span style="color:var(--brand)">' + esc(S.handle || 'Handle') + '</span></div>' +
            '<div style="font-size:14px;font-weight:500;color:var(--brand);word-break:break-all;margin-bottom:2px">' + esc(S.seoTitle || F.title || 'Page title') + '</div>' +
            '<div class="muted" style="font-size:13px;word-break:break-all">' + esc(S.seoDescription || F.synopsis || 'Meta description') + '</div>' +
          '</div>' +
          '<div class="divider mb-4"></div>' +
          // page title
          '<div class="mb-4">' +
            '<div class="flex items-center justify-between" style="margin-bottom:6px">' +
              '<span style="font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:5px">Page title <span class="muted" title="Page titles make it easier for customers to quickly find content.">' + I.help + '</span></span>' +
              '<span class="muted" style="font-size:12px">' + S.seoTitle.length + '</span>' +
            '</div>' +
            '<input class="input" id="d-title" placeholder="Please enter" value="' + esc(S.seoTitle) + '" />' +
          '</div>' +
          // meta description
          '<div class="mb-4">' +
            '<div class="flex items-center justify-between" style="margin-bottom:6px">' +
              '<span style="font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:5px">Meta description <span class="muted" title="Try to describe the page contents to attract visitors.">' + I.help + '</span></span>' +
              '<span class="muted" style="font-size:12px">' + S.seoDescription.length + '</span>' +
            '</div>' +
            '<textarea class="input" id="d-desc" rows="4" placeholder="Add a description so that the page can achieve a higher search ranking" style="height:auto;padding:8px 12px;resize:vertical">' + esc(S.seoDescription) + '</textarea>' +
          '</div>' +
          // URL
          '<div class="mb-4">' +
            '<div style="font-size:13px;font-weight:500;margin-bottom:6px;display:inline-flex;align-items:center;gap:5px">URL <span class="muted" title="Short and descriptive URL handle for better SEO">' + I.help + '</span></div>' +
            '<div class="flex" style="align-items:stretch">' +
              '<span class="addon-before">' + esc(seoUrlPrefix()) + '</span>' +
              '<input class="input" id="d-handle" placeholder="Please enter" value="' + esc(S.handle) + '" style="border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
            '</div>' +
          '</div>' +
          // keywords
          '<div>' +
            '<div style="font-size:13px;font-weight:500;margin-bottom:6px;display:inline-flex;align-items:center;gap:5px">SEO keywords <span class="muted" title="Relevant keywords can improve ranking. Do not use too many.">' + I.help + '</span></div>' +
            '<div class="kw-box" id="d-kwbox">' + kwTags +
              '<input type="text" id="d-kw" class="kw-input" placeholder="' + (S.keywords.length ? '' : "Press 'Enter' to complete the keywords input") + '" />' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-foot" style="justify-content:flex-end">' +
          '<button class="btn btn-primary" data-save>Confirm</button>' +
        '</div>';

      // wire
      dr.querySelector('[data-x]').onclick = close;
      dr.querySelector('[data-save]').onclick = () => {
        F.seo_title = S.seoTitle || F.title || '';
        F.seo_description = S.seoDescription || F.synopsis || '';
        F.article_seo_title = S.handle || '';
        F.seo_keywords = S.keywords.slice();
        close(); rerenderRight(); syncUnsaved(); toast('SEO settings saved');
      };
      const dt = dr.querySelector('#d-title');
      dt.oninput = () => { S.seoTitle = dt.value; if (isNew) S.handle = slug(dt.value); render(); dr.querySelector('#d-title').focus(); place(dr.querySelector('#d-title')); };
      const dd = dr.querySelector('#d-desc');
      dd.oninput = () => { S.seoDescription = dd.value; const c = dd.parentElement.querySelector('.muted'); if (c) c.textContent = dd.value.length; };
      const dh = dr.querySelector('#d-handle');
      dh.oninput = () => { S.handle = dh.value; };
      const kw = dr.querySelector('#d-kw');
      const commitKw = () => { const v = kw.value.trim(); if (v && !S.keywords.includes(v)) { S.keywords.push(v); } kw.value = ''; render(); dr.querySelector('#d-kw').focus(); };
      kw.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); commitKw(); } };
      kw.onblur = () => { if (kw.value.trim()) commitKw(); };
      dr.querySelectorAll('.kw-tag').forEach((tg) => tg.querySelector('.kw-x').onclick = () => { S.keywords.splice(Number(tg.getAttribute('data-i')), 1); render(); });
    };
    // keep cursor at end of an input after a re-render
    const place = (el) => { try { const v = el.value; el.value = ''; el.value = v; } catch (e) {} };

    const close = () => { backdrop.remove(); };
    backdrop.appendChild(dr); document.body.appendChild(backdrop);
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    render();
  }

  // ===========================================================================
  // MODALS
  // ===========================================================================
  function modal({ title, body, width, okText, onOk, onMount, hideOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        (hideOk ? '' : '<button class="btn btn-primary" data-ok>' + (okText || 'Save') + '</button>') + '</div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    const ok = m.querySelector('[data-ok]'); if (ok) ok.onclick = () => onOk(m, close);
    if (onMount) onMount(m, close);
    return { m, close };
  }

  // small centered confirm (mirrors Ant Modal.confirm)
  function confirmModal({ title, content, okText, danger, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal" style="width:416px"></div>');
    m.innerHTML =
      '<div class="modal-body" style="padding:24px">' +
        '<div style="font-size:16px;font-weight:600;color:var(--ink);margin-bottom:8px">' + esc(title) + '</div>' +
        '<div class="muted" style="font-size:13.5px;line-height:1.5">' + esc(content) + '</div>' +
      '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn ' + (danger ? 'btn-default' : 'btn-primary') + '" data-ok' + (danger ? ' style="background:var(--err);color:#fff;border-color:var(--err)"' : '') + '>' + (okText || 'OK') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); onOk && onOk(); };
  }

  // ===========================================================================
  // ROUTER (SPA: registered with the shell router)
  // ===========================================================================
  function goEdit(id) { location.hash = '#/blog/edit/' + id; }

  function route(rest) {
    closePops();
    const m = (rest || '').match(/^edit\/(.+)$/);
    if (m) { renderEdit(decodeURIComponent(m[1])); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.blog = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
