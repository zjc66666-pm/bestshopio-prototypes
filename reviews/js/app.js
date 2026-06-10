/* BestShopio Admin · Reviews prototype — list + detail/edit + modals, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin product
   reviews (reviewsList / table / search / reviewEdit / replyModal / emptyState).
   1:1 with views/admin/products/{pages,components}/reviews + api/modules/admin/review.ts. */
(function () {
  const D = window.DATA_REVIEWS;
  let root; // set by the SPA shell router via VIEWS.reviews.render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // default merchant-reply display name when none set (utils.ts getReplyDisplayName / reviewEdit replyDisplayName)
  const DEFAULT_REPLY_NAME = 'Bestvoy';

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    play: svg('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/>', 22),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 14),
    trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- find a review by id ----
  const byId = (id) => D.REVIEWS.find((r) => String(r.id) === String(id));

  // ---- status pill (utils.ts REVIEW_STATUS_META: exact inline colors + dot) ----
  // 0 Visible -> bg #DCE6FC / dot #2563EB ; 1 Hidden -> bg #E4E5E8 / dot #6B7280
  const statusPill = (s) => {
    const m = D.STATUS[s] || D.STATUS[0];
    return '<span style="display:inline-flex;align-items:center;gap:8px;border-radius:9999px;padding:4px 12px;font-size:13px;font-weight:500;background:' + m.bg + ';color:' + m.dot + '">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:' + m.dot + '"></span>' + esc(m.text) + '</span>';
  };

  // ---- star rating render (Ant Rate, green #2a8b22) ----
  const stars = (n, size) => {
    size = size || 15;
    let out = '<span style="display:inline-flex;gap:2px;color:#2a8b22;line-height:1">';
    for (let i = 1; i <= 5; i++) {
      out += '<span style="opacity:' + (i <= n ? '1' : '.22') + '">' + svg('<path d="m12 3 2.9 6 6.1.9-4.5 4.3 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.9 9 9z" fill="currentColor" stroke="none"/>', size) + '</span>';
    }
    return out + '</span>';
  };

  // ---- customer initial color (table.tsx CUSTOMER_INITIAL_COLORS) ----
  const INIT_COLORS = ['#A0D911', '#FAAD14', '#13C2C2', '#1677FF'];
  const initialColor = (name) => { const n = (name || '').trim(); const hash = [...n].reduce((a, c) => a + c.charCodeAt(0), 0); return INIT_COLORS[hash % INIT_COLORS.length]; };
  const initial = (name) => { const n = (name || '').trim(); return n ? n.charAt(0).toUpperCase() : '?'; };

  // small avatar block (img if avatar present, else colored initial)
  function avatarHtml(name, url, px) {
    px = px || 40;
    if (url) return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:50%;overflow:hidden;flex:none;background:#f1f1f1;display:inline-block"><img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover" /></span>';
    return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:50%;flex:none;display:grid;place-items:center;color:#fff;font-size:' + Math.round(px * 0.35) + 'px;font-weight:500;background:' + initialColor(name) + '">' + esc(initial(name)) + '</span>';
  }

  // small square thumbnail (subject image)
  function thumb(url, px) {
    px = px || 40;
    if (url) return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:6px;overflow:hidden;flex:none;background:#f1f1f1;display:inline-block"><img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover" /></span>';
    return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:6px;flex:none;display:grid;place-items:center;background:#e9ecf2;color:#9aa3b2;font-size:10px;font-weight:600">IMG</span>';
  }

  const isVideo = (u) => /\.(mp4|webm|mov)(\?|$)/i.test(u || '');

  // ================= LIST VIEW =================
  // filter state lives on a module-level object so re-renders keep it
  const LST = {
    tab: 'all', kwField: 'reviewContent', kw: '', kwApplied: '',
    rating: [], status: [],   // multi-select arrays
    page: 1, size: 20,
  };

  function tabType(tab) { return tab === 'product' ? 'product' : null; }

  // count_statistics: applies the keyword/rating/status filters (review.ts
  // buildReviewCountStatisticsParams drops page/limit). The "All" tab count reflects
  // the keyword/rating/status filtered set.
  function statFiltered() {
    let rows = D.REVIEWS.slice();
    if (LST.kwApplied) {
      const q = LST.kwApplied.toLowerCase();
      rows = rows.filter((r) => {
        switch (LST.kwField) {
          case 'reviewContent': return (r.comment || '').toLowerCase().includes(q);
          case 'customerName':  return (r.customerName || '').toLowerCase().includes(q);
          case 'productName':   return (r.productName || '').toLowerCase().includes(q);
          case 'productSpu':    return (r.productSpu || '').toLowerCase().includes(q);
          case 'productSku':    return (r.productSku || '').toLowerCase().includes(q);
          case 'productBarcode':return (r.productBarcode || '').toLowerCase().includes(q);
          case 'productId':     return String(r.productId || '').includes(q);
          case 'variantId':     return String(r.variantId || '').includes(q);
          default: return true;
        }
      });
    }
    if (LST.rating.length) rows = rows.filter((r) => LST.rating.includes(r.rating));
    if (LST.status.length) rows = rows.filter((r) => LST.status.includes(r.status));
    return rows;
  }

  function tabCount(key) {
    const rows = statFiltered();
    const t = tabType(key);
    return t ? rows.filter((r) => r.reviewType === t).length : rows.length;
  }

  // the visible rows: count_statistics base + active tab + the Review-type multi-select
  function filteredRows() {
    let rows = statFiltered();
    const t = tabType(LST.tab);
    if (t) rows = rows.filter((r) => r.reviewType === t);
    // newest first (table.tsx sortByCreatedAtDesc)
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows;
  }

  const hasActiveFilters = () => !!(LST.kwApplied || LST.rating.length || LST.status.length);

  function renderList() {
    LST.page = LST.page || 1;

    // empty state (emptyState.tsx) — only when no reviews at all AND no active filters
    if (D.REVIEWS.length === 0 && !hasActiveFilters()) { renderEmptyState(); return; }

    const rows = filteredRows();
    const totalRecords = rows.length;
    const pages = Math.max(1, Math.ceil(totalRecords / LST.size));
    if (LST.page > pages) LST.page = pages;
    const start = (LST.page - 1) * LST.size;
    const pageRows = rows.slice(start, start + LST.size);

    const fieldOpts = D.SEARCH_FIELDS.map((o) => '<option value="' + o.value + '"' + (o.value === LST.kwField ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('');

    const tabsHtml = D.TABS.map((t) =>
      '<div class="tab' + (t.key === LST.tab ? ' active' : '') + '" data-tab="' + t.key + '">' + esc(t.label) +
      '<span class="count-badge">' + tabCount(t.key) + '</span></div>').join('');

    // active filter tags (search.tsx getActiveReviewFilterTags)
    const tags = [];
    if (LST.kwApplied) {
      const lbl = (D.SEARCH_FIELDS.find((o) => o.value === LST.kwField) || {}).label || '';
      tags.push('<span class="field-pill" data-clear="kw">' + esc(lbl) + ': ' + esc(LST.kwApplied) + ' <span class="x">&times;</span></span>');
    }
    if (LST.rating.length) tags.push('<span class="field-pill" data-clear="rating">Rating: ' + LST.rating.slice().sort().map((n) => n + ' stars').join(', ') + ' <span class="x">&times;</span></span>');
    if (LST.status.length) tags.push('<span class="field-pill" data-clear="status">Status: ' + LST.status.map((s) => D.STATUS[s].text).join(', ') + ' <span class="x">&times;</span></span>');

    const ratingChip = LST.rating.length ? LST.rating.length + ' selected' : 'Rating';
    const statusChip = LST.status.length ? LST.status.length + ' selected' : 'Status';

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Reviews</h1>' +
        '<button class="btn btn-primary" data-act="add">Add review</button>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="rv-tabs">' + tabsHtml + '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // keyword field + input group (Input.Group compact, 468px)
            '<div class="flex" style="min-width:468px">' +
              '<select class="filter-select" id="kw-field" style="width:190px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // rating multi-select
            '<div class="sel-trigger" id="rating-chip" style="width:180px"><span class="' + (LST.rating.length ? '' : 'muted') + '">' + esc(ratingChip) + '</span>' + I.chevDown + '</div>' +
            // status multi-select
            '<div class="sel-trigger" id="status-chip" style="width:160px"><span class="' + (LST.status.length ? '' : 'muted') + '">' + esc(statusChip) + '</span>' + I.chevDown + '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table (5 columns: Review / Customer / Product / Status / Action)
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1080px">' +
          '<thead><tr>' +
            '<th>Review</th><th style="width:220px">Customer</th><th style="width:320px">Product</th>' +
            '<th style="width:140px">Status</th><th style="width:80px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="rv-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="5" style="text-align:center;padding:40px" class="muted">No reviews match these filters.</td></tr>') +
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

  function rowHtml(r) {
    // Review media: video poster preferred when first media is a video (table.tsx)
    const media = (isVideo(r.firstMediaUrl) && r.videoPosterUrl) ? r.videoPosterUrl : r.firstMediaUrl;
    const mediaCell = media
      ? '<span style="position:relative;width:56px;height:56px;border-radius:6px;overflow:hidden;flex:none;background:#f1f1f1;display:inline-block">' +
          '<img src="' + esc(media) + '" alt="" style="width:100%;height:100%;object-fit:cover" />' +
          (isVideo(r.firstMediaUrl) ? '<span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(0,0,0,.28)">' + I.play + '</span>' : '') +
        '</span>'
      : '<span style="width:56px;height:56px;border-radius:6px;flex:none;display:grid;place-items:center;background:#e9ecf2;color:#9aa3b2;font-size:11px;font-weight:600">IMG</span>';

    const subjImg = r.productImage;
    const subjName = r.productName;
    const clamp = 2;

    return '<tr data-id="' + r.id + '">' +
      // Review cell: media thumb + comment (2-line clamp) + stars (no type tag — matches real)
      '<td><div class="flex items-start gap-3" style="min-width:340px;padding:4px 0">' + mediaCell +
        '<div style="min-width:0;flex:1">' +
          '<div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink);font-size:13.5px;line-height:1.45" title="' + esc(r.comment || '- -') + '">' + esc(r.comment || '- -') + '</div>' +
          '<div class="mt-2">' + stars(r.rating, 14) + '</div>' +
        '</div>' +
      '</div></td>' +
      // Customer (avatar 40 + name)
      '<td><div class="flex items-center gap-3">' + avatarHtml(r.customerName, r.customerAvatar, 40) +
        '<span style="color:var(--ink)">' + esc(r.customerName || '- -') + '</span></div></td>' +
      // Product (image 40 + title, clamp 2)
      '<td><div class="flex items-center gap-3">' + thumb(subjImg, 40) +
        '<span style="min-width:0;flex:1;display:-webkit-box;-webkit-line-clamp:' + clamp + ';-webkit-box-orient:vertical;overflow:hidden;color:var(--ink)" title="' + esc(subjName || '- -') + '">' + esc(subjName || '- -') + '</span></div></td>' +
      // Status
      '<td>' + statusPill(r.status) + '</td>' +
      // Action (text button, Eye icon)
      '<td style="text-align:center"><button class="back-btn" data-view="' + r.id + '" title="View" style="width:30px;height:30px;color:var(--ink-muted)">' + I.eye + '</button></td>' +
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
    // tabs
    root.querySelectorAll('#rv-tabs .tab').forEach((t) => t.onclick = () => { LST.tab = t.getAttribute('data-tab'); LST.page = 1; renderList(); });
    // keyword field / input
    const kwField = root.querySelector('#kw-field');
    const kwInput = root.querySelector('#kw-input');
    if (kwField) kwField.onchange = () => { LST.kwField = kwField.value; if ((LST.kw || '').trim()) { LST.kwApplied = LST.kw.trim(); LST.page = 1; renderList(); } };
    if (kwInput) {
      kwInput.oninput = () => { LST.kw = kwInput.value; };
      const commit = () => { LST.kwApplied = (LST.kw || '').trim(); LST.page = 1; renderList(); };
      kwInput.onkeydown = (e) => { if (e.key === 'Enter') commit(); };
      kwInput.onblur = commit;
    }
    // multi-select popovers
    const rc = root.querySelector('#rating-chip'); if (rc) rc.onclick = () => openMultiPopover(rc, 'rating');
    const sc = root.querySelector('#status-chip'); if (sc) sc.onclick = () => openMultiPopover(sc, 'status');
    // filter tags clear
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'rating') LST.rating = [];
      if (k === 'status') LST.status = [];
      LST.page = 1; renderList();
    });
    // page size
    const ps = root.querySelector('#pg-size'); if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    // pagination
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row + view -> detail (whole row clickable, customRow in table.tsx)
    root.querySelectorAll('#rv-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goDetail(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goDetail(b.getAttribute('data-view')); });
    // add review -> blank composer (reviews/0)
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goDetail('0');
  }

  // multi-select dropdown (Rating / Review type / Status) — SelectMulti.tsx equivalent
  function openMultiPopover(anchor, key) {
    closePops();
    const optsByKey = {
      rating: [ { label: '1 star', value: 1 }, { label: '2 stars', value: 2 }, { label: '3 stars', value: 3 }, { label: '4 stars', value: 4 }, { label: '5 stars', value: 5 } ],
      status: [ { label: 'Visible', value: 0 }, { label: 'Hidden', value: 1 } ],
    };
    const cur = LST[key];
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:' + anchor.offsetWidth + 'px;padding:6px"></div>');
    pop.innerHTML = optsByKey[key].map((o) =>
      '<label class="edit-check" style="padding:6px 8px;margin:0;border-radius:6px"><input type="checkbox" data-v="' + o.value + '"' + (cur.includes(o.value) ? ' checked' : '') + ' /><span>' + esc(o.label) + '</span></label>'
    ).join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.onchange = () => {
      let raw = cb.getAttribute('data-v');
      const val = (key === 'rating' || key === 'status') ? Number(raw) : raw;
      const arr = LST[key];
      if (cb.checked) { if (!arr.includes(val)) arr.push(val); }
      else { const i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1); }
      LST.page = 1; renderList();
      // keep popover open: reopen after re-render
      openMultiPopover(root.querySelector('#' + key + '-chip'), key);
    });
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  // ---- empty state (emptyState.tsx) ----
  function renderEmptyState() {
    root.innerHTML =
      '<div class="flex items-center justify-between mb-4"><h1 class="page-title">Reviews</h1></div>' +
      '<div class="flex flex-col items-center justify-center" style="padding:80px 0">' +
        '<div style="margin-bottom:24px">' +
          '<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="100" cy="100" r="80" fill="#DBEAFE" opacity="0.3"/>' +
            '<rect x="60" y="70" width="80" height="60" rx="4" fill="white" stroke="#E5E7EB" stroke-width="2"/>' +
            '<rect x="60" y="70" width="80" height="8" fill="#2563EB"/>' +
            '<rect x="68" y="85" width="22" height="12" rx="2" fill="#E5E7EB"/>' +
            '<rect x="95" y="86" width="34" height="4" rx="2" fill="#E5E7EB"/>' +
            '<rect x="95" y="93" width="28" height="3" rx="1.5" fill="#E5E7EB"/>' +
            '<rect x="70" y="106" width="50" height="3" rx="1.5" fill="#E5E7EB"/>' +
            '<rect x="70" y="112" width="44" height="3" rx="1.5" fill="#E5E7EB"/>' +
            '<rect x="70" y="118" width="38" height="3" rx="1.5" fill="#E5E7EB"/>' +
            '<circle cx="44" cy="100" r="18" fill="#2563EB"/><circle cx="44" cy="100" r="14" fill="white"/>' +
            '<path d="M38 100H50M44 94V106" stroke="#2563EB" stroke-linecap="round" stroke-width="2.5"/>' +
            '<circle cx="156" cy="100" r="18" fill="#111827"/><circle cx="156" cy="100" r="14" fill="white"/>' +
            '<path d="M150 100H162" stroke="#111827" stroke-linecap="round" stroke-width="2.5"/>' +
          '</svg>' +
        '</div>' +
        '<h3 style="margin:0 0 8px;font-size:20px;font-weight:600;color:var(--ink)">Add and manage your reviews</h3>' +
        '<button class="btn btn-primary" data-act="add" style="margin-top:16px;height:40px;padding:0 20px;font-size:14px">Add review</button>' +
      '</div>';
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => goDetail('0');
  }

  // ================= DETAIL / EDIT VIEW =================
  // Working copy of the form so edits/discard don't mutate the stored row until "save".
  let EDIT = null;       // ReviewFormState working copy
  let ORIGINAL = null;   // snapshot for dirty-check + discard
  let EDIT_ID = null;    // null = Add review (reviews/0)

  function emptyForm() {
    return {
      id: 0, reviewType: 'product', productId: 0,
      productName: '', productImage: '', productSku: '', productSpu: '', productBarcode: '', variantId: 0,
      rating: 5, comment: '', createdAt: '2026-06-07 10:00',
      mediaUrls: [], firstMediaUrl: '', videoUrl: '', videoPosterUrl: '',
      status: 0, customerName: '', customerAvatar: '',
      recommend: false, priority: undefined, themeTemplate: 'Default',
      merchantReplyName: '', merchantReplyContent: '', merchantReplyTime: '',
    };
  }

  const snapshot = (o) => JSON.parse(JSON.stringify(o));
  const isDirty = () => JSON.stringify(EDIT) !== JSON.stringify(ORIGINAL);
  const syncBar = () => window.UI.setUnsavedBar(document, isDirty());

  function renderDetail(id) {
    const isEdit = String(id) !== '0';
    if (isEdit) {
      const r = byId(id);
      if (!r) { renderMissing(id); return; }
      EDIT_ID = r.id;
      EDIT = snapshot(r);
    } else {
      EDIT_ID = null;
      EDIT = emptyForm();
    }
    ORIGINAL = snapshot(EDIT);
    paintDetail(isEdit);
  }

  function paintDetail(isEdit) {
    const r = EDIT;
    const saveText = isEdit ? 'Update' : 'Add review';

    root.innerHTML =
      '<div class="detail-wrap">' +
        // shared full-width "You have unsaved changes" bar (UI.unsavedBar); toggled by syncBar().
        window.UI.unsavedBar({ saveLabel: saveText }) +
        // header: back + title; Reply button on the right ONLY when editing
        '<div class="flex items-center justify-between mb-6">' +
          '<div class="flex items-center gap-2">' +
            '<button class="back-btn" data-act="back" title="Back to reviews">' + I.arrowLeft + '</button>' +
            '<span class="page-title">' + (isEdit ? 'Edit review' : 'Add review') + '</span>' +
          '</div>' +
          (isEdit ? '<button class="btn btn-primary" data-act="reply">Reply</button>' : '') +
        '</div>' +
        // two-column body
        '<div class="detail-cols">' +
          '<div class="detail-main">' +
            reviewTypeCard(r) +
            reviewDetailsCard(r) +
            mediaCard(r) +
            (r.merchantReplyContent ? replyCard(r) : '') +
            '<div class="flex gap-2 mt-1" style="justify-content:flex-end">' +
              '<button class="btn btn-primary" data-act="save">' + saveText + '</button>' +
              (isEdit ? '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:#f3c4ba">Delete review</button>' : '') +
            '</div>' +
          '</div>' +
          '<div class="detail-rail">' +
            statusCard(r) +
            customerCard(r) +
            recommendCard(r) +
            themeCard(r) +
          '</div>' +
        '</div>' +
      '</div>';

    wireDetail(isEdit);
  }

  function cardOpen(titleHtml, rightHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div class="card-title flex items-center gap-2">' + titleHtml + '</div>' +
        (rightHtml || '') +
      '</div>';
  }

  // ---- Product card: linked product selector (name only, no meta) ----
  function reviewTypeCard(r) {
    const hasSubject = !!r.productId;
    // linked selector (reviewEdit renderLinkedSelection): + circle (#171717), then image+name OR placeholder
    const selectorInner = hasSubject
      ? '<span class="flex items-center gap-2" style="min-width:0">' + thumb(r.productImage, 24) +
          '<span style="min-width:0;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.productName) + '</span></span>'
      : '<span style="color:#A3A3A3">Select a product</span>';
    const selector =
      '<div style="width:100%;border:1px solid var(--ctl);border-radius:8px;background:#fff;padding:0 12px;font-size:13.5px">' +
        '<button id="subj-trigger" type="button" style="display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:8px 0;text-align:left;background:none;border:none;cursor:pointer">' +
          '<span style="width:16px;height:16px;border-radius:50%;flex:none;display:grid;place-items:center;background:#171717;color:#fff;font-size:12px;font-weight:600">+</span>' +
          selectorInner +
        '</button>' +
      '</div>';
    return cardOpen('<span>Product</span>') +
      selector +
    '</div>';
  }

  // ---- Review details card: rating + content + review time (inside a #F8FAFC panel) ----
  function reviewDetailsCard(r) {
    return cardOpen('<span>Review details</span>') +
      '<div style="background:#F8FAFC;border-radius:10px;padding:16px">' +
        '<div class="mb-4"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Rating <span style="color:var(--err)">*</span></div>' +
          '<div id="rv-rate" style="cursor:pointer">' + stars(r.rating, 22) + '</div></div>' +
        '<div class="mb-4"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Review content <span style="color:var(--err)">*</span></div>' +
          '<textarea class="input" id="rv-comment" rows="6" maxlength="1000" style="height:auto;padding:10px 12px;resize:vertical" placeholder="Share more details about the product, such as quality, fit, shipping, or overall experience.">' + esc(r.comment) + '</textarea>' +
          '<div class="muted" style="font-size:11px;text-align:right;margin-top:4px" id="rv-comment-count">' + (r.comment || '').length + ' / 1000</div></div>' +
        '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Review time (UTC+0) <span style="color:var(--err)">*</span></div>' +
          '<input class="input" id="rv-time" value="' + esc(r.createdAt) + '" placeholder="YYYY-MM-DD HH:mm:ss" /></div>' +
      '</div>' +
    '</div>';
  }

  // ---- Media gallery card (AddImageVideo) — 9 max ----
  function mediaCard(r) {
    const media = r.mediaUrls || [];
    const cells = media.map((u, i) => {
      const poster = (isVideo(u) && r.videoPosterUrl) ? r.videoPosterUrl : u;
      return '<span class="rv-media" data-i="' + i + '" style="position:relative;width:92px;height:92px;border-radius:8px;overflow:hidden;border:1px solid var(--hair);cursor:pointer;flex:none;display:inline-block">' +
        '<img src="' + esc(poster) + '" alt="" style="width:100%;height:100%;object-fit:cover" />' +
        (isVideo(u) ? '<span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(0,0,0,.28)">' + I.play + '</span>' : '') +
        '<span class="rv-media-x" data-del="' + i + '" title="Remove" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;cursor:pointer">' + I.x + '</span>' +
      '</span>';
    }).join('');
    const addTile = media.length < 9
      ? '<span id="media-add" style="width:92px;height:92px;border-radius:8px;border:2px dashed var(--ctl);display:grid;place-items:center;color:var(--ink-muted);flex:none;cursor:pointer">' + I.plus + '</span>'
      : '';
    return cardOpen('<span>Photos &amp; videos</span>', '<span class="muted" style="font-size:12px">' + media.length + ' / 9</span>') +
      '<div class="flex" style="gap:10px;flex-wrap:wrap">' + (cells || '') + addTile + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:10px">Supports files in jpg, png, webp, gif, mp4, webm, and mov formats. Files smaller than 4MB work better. Maximum file size 10MB.</div>' +
    '</div>';
  }

  // ---- Merchant public reply card (Response from {name}); no inline Edit — header Reply edits it ----
  function replyCard(r) {
    const name = (r.merchantReplyName || '').trim() || DEFAULT_REPLY_NAME;
    return cardOpen('<span>Response from ' + esc(name) + '</span>') +
      '<div class="muted" style="font-size:12px;margin-bottom:6px">' + esc(r.merchantReplyTime || '- -') + '</div>' +
      '<div class="subtle" style="font-size:13.5px;white-space:pre-wrap;line-height:1.55">' + esc(r.merchantReplyContent) + '</div>' +
    '</div>';
  }

  // ---- right column: Status (Visible / Hidden radios) ----
  function statusCard(r) {
    const radio = (val, label) =>
      '<label class="flex items-center gap-2" style="cursor:pointer;font-size:13.5px"><input type="radio" name="rv-status" value="' + val + '"' + (r.status === val ? ' checked' : '') + ' style="accent-color:var(--brand);width:15px;height:15px" /> ' + label + '</label>';
    return cardOpen('<span>Status</span>') +
      '<div class="flex flex-col gap-3" id="rv-status-group">' + radio('0', 'Visible') + radio('1', 'Hidden') + '</div>' +
    '</div>';
  }

  // ---- right column: Customer (name + avatar) ----
  function customerCard(r) {
    const av = r.customerAvatar
      ? '<div style="position:relative"><div style="height:200px;border:1px solid var(--hair);border-radius:8px;overflow:hidden;background:#f8fafc;display:grid;place-items:center"><img src="' + esc(r.customerAvatar) + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain" /></div>' +
          '<span class="rv-avatar-x" data-act="rm-avatar" title="Remove" style="position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;display:grid;place-items:center;cursor:pointer">' + I.x + '</span></div>' +
          '<div class="muted" style="font-size:11px;margin-top:6px">Supports files in jpg/jpeg/png/webp formats. Files smaller than 4MB work better.</div>'
      : '<div style="min-height:200px;border:2px dashed var(--ctl);border-radius:8px;display:grid;place-items:center;background:#f8fafc"><span class="btn btn-primary" data-act="add-avatar" style="cursor:pointer">Add image</span></div>' +
        '<div class="muted" style="font-size:11px;margin-top:6px">Supports files in jpg/jpeg/png/webp formats. Files smaller than 4MB work better.</div>';
    return cardOpen('<span>Customer</span>') +
      '<div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Name <span style="color:var(--err)">*</span></div>' +
      '<div style="position:relative"><input class="input" id="rv-customer" maxlength="50" value="' + esc(r.customerName) + '" placeholder="Reviewer\'s name" style="padding-right:48px" />' +
        '<span class="muted" id="rv-customer-count" style="position:absolute;right:10px;top:8px;font-size:11px">' + (r.customerName || '').length + ' / 50</span></div>' +
      '<div class="ctrl-label" style="text-transform:none;margin:14px 0 6px">Avatar</div>' + av +
    '</div>';
  }

  // ---- right column: Recommend (show on homepage) + Priority ----
  function recommendCard(r) {
    const priority = r.recommend
      ? '<div id="rv-priority-wrap"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Priority</div>' +
        '<input class="input" id="rv-priority" type="number" min="0" max="99999999" value="' + (r.priority == null ? '' : r.priority) + '" placeholder="Enter priority" />' +
        '<div class="muted" style="font-size:12px;margin-top:8px">Higher priority review show first</div></div>'
      : '';
    return cardOpen('<span>Recommend</span>') +
      '<label class="flex items-center gap-2 mb-3" style="cursor:pointer;font-size:13.5px"><input type="checkbox" id="rv-recommend"' + (r.recommend ? ' checked' : '') + ' style="accent-color:var(--brand);width:15px;height:15px" /> Show on homepage</label>' +
      priority +
    '</div>';
  }

  // ---- right column: Theme template (Default only) ----
  function themeCard(r) {
    const opts = D.THEME_TEMPLATES.map((t) => '<option value="' + esc(t) + '"' + (t === r.themeTemplate ? ' selected' : '') + '>' + esc(t) + '</option>').join('');
    return cardOpen('<span>Theme template</span>') +
      '<select class="input" id="rv-theme">' + opts + '</select>' +
      '<div class="muted" style="font-size:12px;margin-top:8px">Choose how you\'d like the page to look like</div>' +
    '</div>';
  }

  function renderMissing(id) {
    root.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
        '<button class="back-btn" data-act="back">' + I.arrowLeft + '</button>' +
        '<span class="page-title">Review #' + esc(id) + '</span>' +
      '</div>' +
      '<div class="panel placeholder"><div><div style="font-weight:600;margin-bottom:6px">Review not found</div>' +
        '<div class="muted">Go back and open one of the reviews from the list.</div></div></div>';
    const b = root.querySelector('[data-act="back"]'); if (b) b.onclick = () => { location.hash = '#/reviews'; };
  }

  function wireDetail(isEdit) {
    const r = EDIT;
    const back = root.querySelector('[data-act="back"]');
    if (back) back.onclick = () => { if (!leaveGuard()) return; location.hash = '#/reviews'; };

    // subject selector -> picker modal
    const subj = root.querySelector('#subj-trigger'); if (subj) subj.onclick = () => openSubjectPicker(r, isEdit);

    // rating click (set 1..5 by clicking the nth star)
    function wireRate() {
      const rt = root.querySelector('#rv-rate'); if (!rt || !rt.firstElementChild) return;
      Array.from(rt.firstElementChild.children).forEach((sEl, i) => {
        sEl.style.cursor = 'pointer';
        sEl.onclick = () => { r.rating = i + 1; rt.innerHTML = stars(r.rating, 22); wireRate(); syncBar(); };
      });
    }
    wireRate();

    // comment + count
    const comment = root.querySelector('#rv-comment');
    const count = root.querySelector('#rv-comment-count');
    if (comment) comment.oninput = () => { r.comment = comment.value; if (count) count.textContent = comment.value.length + ' / 1000'; syncBar(); };
    const time = root.querySelector('#rv-time'); if (time) time.oninput = () => { r.createdAt = time.value; syncBar(); };

    // media: add / remove / lightbox
    const mediaAdd = root.querySelector('#media-add');
    if (mediaAdd) mediaAdd.onclick = () => {
      r.mediaUrls = r.mediaUrls || [];
      r.mediaUrls.push(placeholderMedia());
      r.firstMediaUrl = r.mediaUrls[0];
      paintDetail(isEdit); syncBar();
    };
    root.querySelectorAll('.rv-media [data-del]').forEach((b) => b.onclick = (e) => {
      e.stopPropagation();
      const i = Number(b.getAttribute('data-del'));
      r.mediaUrls.splice(i, 1);
      r.firstMediaUrl = r.mediaUrls[0] || '';
      paintDetail(isEdit); syncBar();
    });
    root.querySelectorAll('.rv-media').forEach((m) => m.onclick = (e) => { if (e.target.closest('[data-del]')) return; openLightbox(r, Number(m.getAttribute('data-i'))); });

    // status radios
    root.querySelectorAll('#rv-status-group input[name="rv-status"]').forEach((el) => el.onchange = () => { r.status = Number(el.value); syncBar(); });

    // customer name + count
    const cust = root.querySelector('#rv-customer');
    const custCount = root.querySelector('#rv-customer-count');
    if (cust) cust.oninput = () => { r.customerName = cust.value; if (custCount) custCount.textContent = cust.value.length + ' / 50'; syncBar(); };
    const addAv = root.querySelector('[data-act="add-avatar"]'); if (addAv) addAv.onclick = () => { r.customerAvatar = placeholderAvatar(r.customerName); paintDetail(isEdit); syncBar(); };
    const rmAv = root.querySelector('[data-act="rm-avatar"]'); if (rmAv) rmAv.onclick = () => { r.customerAvatar = ''; paintDetail(isEdit); syncBar(); };

    // recommend toggle + priority
    const rec = root.querySelector('#rv-recommend');
    if (rec) rec.onchange = () => { r.recommend = rec.checked; if (!rec.checked) r.priority = undefined; paintDetail(isEdit); syncBar(); };
    const prio = root.querySelector('#rv-priority'); if (prio) prio.oninput = () => { r.priority = prio.value === '' ? undefined : Number(prio.value); syncBar(); };

    // theme template
    const theme = root.querySelector('#rv-theme'); if (theme) theme.onchange = () => { r.themeTemplate = theme.value; syncBar(); };

    // header Reply (edit only)
    const reply = root.querySelector('[data-act="reply"]'); if (reply) reply.onclick = () => openReplyModal(r, isEdit);

    // footer + bar actions
    const save = root.querySelector('[data-act="save"]'); if (save) save.onclick = () => doSave(isEdit);
    const saveBar = root.querySelector('[data-act="save-bar"]'); if (saveBar) saveBar.onclick = () => doSave(isEdit);
    const discard = root.querySelector('[data-act="discard"]'); if (discard) discard.onclick = () => doDiscard(isEdit);
    const del = root.querySelector('[data-act="delete"]'); if (del) del.onclick = () => openDeleteModal(r);

    syncBar();
  }

  // validateReviewForm (reviewEdit.utils.ts)
  function validateForm(r) {
    if (!r.productId) return 'Please select a product';
    if (!r.rating) return 'Please select rating';
    if (!(r.comment || '').trim()) return 'Please enter review content';
    if (!(r.createdAt || '').trim()) return 'Please select review time';
    if (!(r.customerName || '').trim()) return 'Please enter customer name';
    if (r.recommend && (r.priority === undefined || r.priority === null || Number.isNaN(Number(r.priority)))) return 'Please enter priority';
    return null;
  }

  function doSave(isEdit) {
    const err = validateForm(EDIT);
    if (err) { toast(err); return; }
    if (isEdit) {
      // commit working copy back into the stored row
      const idx = D.REVIEWS.findIndex((x) => x.id === EDIT_ID);
      if (idx >= 0) D.REVIEWS[idx] = Object.assign({}, D.REVIEWS[idx], EDIT);
      ORIGINAL = snapshot(EDIT);
      syncBar();
      toast('Updated successfully');
    } else {
      // create: assign an id, insert, then return to the list
      const newId = Math.max.apply(null, D.REVIEWS.map((x) => x.id)) + 1;
      EDIT.id = newId;
      D.REVIEWS.unshift(snapshot(EDIT));
      ORIGINAL = snapshot(EDIT);
      toast('Added successfully');
      location.hash = '#/reviews';
    }
  }

  function doDiscard(isEdit) {
    if (!isDirty()) { if (!isEdit) location.hash = '#/reviews'; return; }
    confirmModal({
      title: 'Discard changes?', body: 'All unsaved changes will be lost',
      okText: 'Discard', cancelText: 'Cancel',
      onOk: () => {
        EDIT = snapshot(ORIGINAL);
        if (!isEdit) { location.hash = '#/reviews'; return; }
        paintDetail(isEdit);
      },
    });
  }

  // leave guard for back nav (onBeforeRouteLeave) — synchronous confirm
  function leaveGuard() {
    if (!isDirty()) return true;
    return window.confirm('Unsaved changes will be lost. Leave this page?');
  }

  // synthetic placeholder media / avatar for the "Add image" mocks
  function placeholderMedia() {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#cbd5e1"/><text x="60" y="68" font-family="Inter,Arial" font-size="16" fill="#64748b" text-anchor="middle">New</text></svg>');
  }
  function placeholderAvatar(name) {
    const letter = initial(name);
    const bg = initialColor(name).replace('#', '%23');
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="60" fill="' + bg.replace('%23', '#') + '"/><text x="60" y="78" font-family="Inter,Arial" font-size="52" font-weight="600" fill="#ffffff" text-anchor="middle">' + letter + '</text></svg>');
  }

  // ================= MODALS =================
  function modal({ title, body, width, okText, okDanger, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
        '<span class="drawer-x" data-x style="cursor:pointer">' + I.x + '</span></div>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok' + (okDanger ? ' style="background:var(--err);border-color:var(--err)"' : '') + '>' + (okText || 'Save') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-x]').onclick = close;
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => onOk(m, close);
    return { m, close };
  }

  // simple confirm (Discard / Delete) — Ant Modal.confirm equivalent
  function confirmModal({ title, body, okText, cancelText, okDanger, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML =
      '<div class="modal-head">' + esc(title) + '</div>' +
      '<div class="modal-body"><div style="font-size:13.5px;color:var(--ink-body);line-height:1.6;white-space:pre-line">' + esc(body) + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>' + esc(cancelText || 'Cancel') + '</button>' +
        '<button class="btn btn-primary" data-ok' + (okDanger ? ' style="background:var(--err);border-color:var(--err)"' : '') + '>' + esc(okText || 'OK') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); onOk(); };
  }

  // Reply modal (replyModal.tsx) — reply name + content, then shows as merchant response
  function openReplyModal(r, isEdit) {
    const body =
      '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Reply name <span style="color:var(--err)">*</span></label>' +
        '<div style="position:relative;margin-top:4px"><input class="input" id="rp-name" maxlength="100" placeholder="e.g. Store name" value="' + esc(r.merchantReplyName || '') + '" style="padding-right:54px" />' +
        '<span class="muted" id="rp-name-count" style="position:absolute;right:10px;top:8px;font-size:11px">' + (r.merchantReplyName || '').length + ' / 100</span></div></div>' +
      '<div><label class="ctrl-label" style="text-transform:none">Reply content <span style="color:var(--err)">*</span></label>' +
        '<textarea class="input" id="rp-content" rows="6" maxlength="1000" placeholder="Write a reply..." style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(r.merchantReplyContent || '') + '</textarea>' +
        '<div class="muted" id="rp-content-count" style="font-size:11px;text-align:right;margin-top:4px">' + (r.merchantReplyContent || '').length + ' / 1000</div></div>' +
      '<div id="rp-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    const ctrl = modal({
      title: 'Reply', width: 520, okText: 'Reply',
      body,
      onOk: (m, close) => {
        const name = m.querySelector('#rp-name').value.trim();
        const content = m.querySelector('#rp-content').value.trim();
        const e = m.querySelector('#rp-err');
        if (!name) { e.textContent = 'Please enter reply name'; e.style.display = 'block'; return; }
        if (!content) { e.textContent = 'Please enter reply content'; e.style.display = 'block'; return; }
        r.merchantReplyName = name;
        r.merchantReplyContent = content;
        r.merchantReplyTime = '2026-06-07 10:00';
        // reply persists immediately (replyReview) — also reflect in stored row + original
        if (isEdit && EDIT_ID != null) {
          const idx = D.REVIEWS.findIndex((x) => x.id === EDIT_ID);
          if (idx >= 0) { D.REVIEWS[idx].merchantReplyName = name; D.REVIEWS[idx].merchantReplyContent = content; D.REVIEWS[idx].merchantReplyTime = r.merchantReplyTime; }
          ORIGINAL.merchantReplyName = name; ORIGINAL.merchantReplyContent = content; ORIGINAL.merchantReplyTime = r.merchantReplyTime;
        }
        close(); toast('Replied successfully'); paintDetail(isEdit);
      },
    });
    const nm = ctrl.m.querySelector('#rp-name'); const nc = ctrl.m.querySelector('#rp-name-count');
    if (nm) nm.oninput = () => { if (nc) nc.textContent = nm.value.length + ' / 100'; };
    const cm = ctrl.m.querySelector('#rp-content'); const cc = ctrl.m.querySelector('#rp-content-count');
    if (cm) cm.oninput = () => { if (cc) cc.textContent = cm.value.length + ' / 1000'; };
  }

  // Subject picker (AddProductsModal) — single-select list
  function openSubjectPicker(r, isEdit) {
    // gather distinct products from sample data
    const seen = {}; const items = [];
    D.REVIEWS.forEach((x) => {
      if (x.productId && !seen['p' + x.productId]) {
        seen['p' + x.productId] = 1; items.push({ id: x.productId, name: x.productName, image: x.productImage, meta: 'SKU ' + (x.productSku || '- -') + ' · SPU ' + (x.productSpu || '- -') });
      }
    });
    const curId = r.productId;
    const rowsHtml = items.map((it) =>
      '<label class="flex items-center gap-3" data-pick="' + it.id + '" style="padding:10px 12px;border-bottom:1px solid var(--hair);cursor:pointer">' +
        '<input type="radio" name="subj-pick" value="' + it.id + '"' + (String(it.id) === String(curId) ? ' checked' : '') + ' style="accent-color:var(--brand);width:15px;height:15px" />' +
        thumb(it.image, 40) +
        '<span style="min-width:0"><span style="display:block;color:var(--ink);font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px">' + esc(it.name) + '</span>' +
        '<span class="muted" style="font-size:12px">' + esc(it.meta) + '</span></span>' +
      '</label>').join('');
    const body =
      '<div style="position:relative;margin-bottom:10px"><input class="filter-input" id="subj-search" placeholder="Search products" style="width:100%;padding-left:32px" />' +
        '<span style="position:absolute;left:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span></div>' +
      '<div style="border:1px solid var(--hair);border-radius:8px;max-height:320px;overflow:auto" id="subj-list">' + (rowsHtml || '<div class="muted" style="padding:20px;text-align:center">No products found.</div>') + '</div>';
    const ctrl = modal({
      title: 'Select product', width: 560, okText: 'Select',
      body,
      onOk: (m, close) => {
        const picked = m.querySelector('input[name="subj-pick"]:checked');
        if (!picked) { close(); return; }
        const it = items.find((x) => String(x.id) === picked.value);
        if (it) { r.productId = it.id; r.productName = it.name; r.productImage = it.image; }
        close(); paintDetail(isEdit); syncBar();
      },
    });
    const sb = ctrl.m.querySelector('#subj-search');
    if (sb) sb.oninput = () => { const q = sb.value.toLowerCase(); ctrl.m.querySelectorAll('#subj-list [data-pick]').forEach((row) => { const name = (items.find((x) => String(x.id) === row.getAttribute('data-pick')) || {}).name || ''; row.style.display = name.toLowerCase().includes(q) ? '' : 'none'; }); };
  }

  // Media lightbox (image / video preview)
  function openLightbox(r, idx) {
    const media = r.mediaUrls || [];
    let i = idx;
    const backdrop = h('<div class="modal-backdrop"></div>');
    const box = h('<div style="position:relative;max-width:80vw;max-height:84vh"></div>');
    const render = () => {
      const u = media[i];
      const poster = (isVideo(u) && r.videoPosterUrl) ? r.videoPosterUrl : u;
      box.innerHTML =
        '<div style="background:#000;border-radius:12px;overflow:hidden;display:grid;place-items:center;max-height:84vh">' +
          (isVideo(u)
            ? '<div style="position:relative;display:grid;place-items:center"><img src="' + esc(poster) + '" style="max-width:80vw;max-height:84vh;object-fit:contain" /><span style="position:absolute;color:#fff">' + I.play + '</span><div style="position:absolute;bottom:10px;color:#fff;font-size:12px;background:rgba(0,0,0,.5);padding:2px 8px;border-radius:6px">Video preview</div></div>'
            : '<img src="' + esc(u) + '" style="max-width:80vw;max-height:84vh;object-fit:contain" />') +
        '</div>' +
        '<span class="drawer-x" data-x style="position:absolute;top:-34px;right:0;color:#fff;cursor:pointer">' + I.x + '</span>' +
        (media.length > 1 ? '<div style="position:absolute;bottom:-32px;left:50%;transform:translateX(-50%);color:#fff;font-size:12px">' + (i + 1) + ' / ' + media.length + '</div>' : '') +
        (media.length > 1 ? '<span data-prev style="position:absolute;left:-40px;top:50%;transform:translateY(-50%);color:#fff;cursor:pointer;font-size:28px">‹</span><span data-next style="position:absolute;right:-40px;top:50%;transform:translateY(-50%);color:#fff;cursor:pointer;font-size:28px">›</span>' : '');
      box.querySelector('[data-x]').onclick = () => backdrop.remove();
      const pv = box.querySelector('[data-prev]'); if (pv) pv.onclick = () => { i = (i - 1 + media.length) % media.length; render(); };
      const nx = box.querySelector('[data-next]'); if (nx) nx.onclick = () => { i = (i + 1) % media.length; render(); };
    };
    backdrop.appendChild(box); document.body.appendChild(backdrop);
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
    render();
  }

  // Delete confirm (reviewEdit handleDelete)
  function openDeleteModal(r) {
    confirmModal({
      title: 'Confirm to delete?',
      body: 'Once deleted, the data cannot be retrieved.\nPlease confirm before proceeding!',
      okText: 'Delete', cancelText: 'Cancel', okDanger: true,
      onOk: () => {
        const i = D.REVIEWS.findIndex((x) => x.id === r.id);
        if (i >= 0) D.REVIEWS.splice(i, 1);
        ORIGINAL = snapshot(EDIT); // suppress leave guard
        toast('Deleted successfully'); location.hash = '#/reviews';
      },
    });
  }

  // ================= ROUTER (SPA: registered with the shell router) =================
  function goDetail(id) { location.hash = '#/reviews/' + id; }

  function route(rest) {
    closePops();
    if (rest) { renderDetail(decodeURIComponent(rest)); if (root && root.parentElement) root.parentElement.scrollTop = 0; }
    else { EDIT = ORIGINAL = EDIT_ID = null; renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS.reviews = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
