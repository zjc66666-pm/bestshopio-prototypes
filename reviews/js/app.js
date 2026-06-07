/* BestShopio Admin · Reviews prototype — list + detail/edit + modals, hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only
   renders the module body into #root. Mirrors reference/bestvoy-admin product/vendor
   reviews (reviewsList / table / search / reviewEdit / replyModal). */
(function () {
  const D = window.DATA_REVIEWS;
  const root = document.getElementById('root');

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.7 3.6M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.8 10.8 0 0 0 4.4-.9"/><path d="M14 14a3 3 0 0 1-4-4"/><path d="m2 2 20 20"/>'),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    star: svg('<path d="m12 3 2.9 6 6.1.9-4.5 4.3 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.9 9 9z"/>'),
    reply: svg('<path d="M9 17l-6-6 6-6"/><path d="M3 11h11a6 6 0 0 1 6 6v2"/>', 15),
    pin: svg('<path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', 14),
    play: svg('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/>', 22),
    store: svg('<path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>', 14),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 14),
    trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', 15),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  };

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:90;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ---- find a review by id ----
  const byId = (id) => D.REVIEWS.find((r) => String(r.id) === String(id));

  // ---- status pill (utils.ts REVIEW_STATUS_META) ----
  const statusPill = (s) => { const m = D.STATUS[s] || D.STATUS[0]; return '<span class="pill ' + m.cls + '"><span class="dot"></span>' + esc(m.text) + '</span>'; };

  // ---- star rating render (Ant Rate, green like reference #2a8b22) ----
  const stars = (n, size) => {
    size = size || 15;
    let out = '<span style="display:inline-flex;gap:2px;color:#2a8b22;line-height:1">';
    for (let i = 1; i <= 5; i++) {
      out += '<span style="opacity:' + (i <= n ? '1' : '.22') + '">' + svg('<path d="m12 3 2.9 6 6.1.9-4.5 4.3 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.9 9 9z" fill="currentColor" stroke="none"/>', size) + '</span>';
    }
    return out + '</span>';
  };

  // ---- review-type tag (product = commerce blue, vendor = behavior purple) ----
  const typeTag = (t) => t === 'vendor'
    ? '<span class="src-tag src-Behavior"><span class="dot"></span>Vendor</span>'
    : '<span class="src-tag src-Commerce"><span class="dot"></span>Product</span>';

  // ---- customer initial color (table.tsx CUSTOMER_INITIAL_COLORS) ----
  const INIT_COLORS = ['#A0D911', '#FAAD14', '#13C2C2', '#1677FF'];
  const initialColor = (name) => { const n = (name || '').trim(); const hash = [...n].reduce((a, c) => a + c.charCodeAt(0), 0); return INIT_COLORS[hash % INIT_COLORS.length]; };
  const initial = (name) => { const n = (name || '').trim(); return n ? n.charAt(0).toUpperCase() : '?'; };

  // small avatar block (img if avatar present, else colored initial)
  function avatarHtml(name, url, px) {
    px = px || 36;
    if (url) return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:50%;overflow:hidden;flex:none;background:#f1f1f1;display:inline-block"><img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover" /></span>';
    return '<span style="width:' + px + 'px;height:' + px + 'px;border-radius:50%;flex:none;display:grid;place-items:center;color:#fff;font-size:' + Math.round(px * 0.4) + 'px;font-weight:600;background:' + initialColor(name) + '">' + esc(initial(name)) + '</span>';
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
    rating: [], type: [], status: [],   // multi-select arrays
    page: 1, size: 20,
  };

  function tabType(tab) { return tab === 'product' ? 'product' : tab === 'vendor' ? 'vendor' : null; }

  // tab counts (count_statistics): respect keyword/rating/status filters but NOT the type tab
  function baseFiltered() {
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
          case 'vendorName':    return (r.vendorName || '').toLowerCase().includes(q);
          case 'variantId':     return String(r.variantId || '').includes(q);
          default: return true;
        }
      });
    }
    if (LST.rating.length) rows = rows.filter((r) => LST.rating.includes(r.rating));
    if (LST.status.length) rows = rows.filter((r) => LST.status.includes(r.status));
    // the Review-type multi-select (separate from tabs)
    if (LST.type.length) rows = rows.filter((r) => LST.type.includes(r.reviewType));
    return rows;
  }

  function tabCount(key) {
    const rows = baseFiltered();
    const t = tabType(key);
    return t ? rows.filter((r) => r.reviewType === t).length : rows.length;
  }

  function filteredRows() {
    let rows = baseFiltered();
    const t = tabType(LST.tab);
    if (t) rows = rows.filter((r) => r.reviewType === t);
    // newest first (table.tsx sortByCreatedAtDesc)
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows;
  }

  function renderList() {
    LST.page = LST.page || 1;
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
    if (LST.type.length) tags.push('<span class="field-pill" data-clear="type">Review type: ' + LST.type.map((t) => t === 'vendor' ? 'Vendor' : 'Product').join(', ') + ' <span class="x">&times;</span></span>');
    if (LST.status.length) tags.push('<span class="field-pill" data-clear="status">Status: ' + LST.status.map((s) => D.STATUS[s].text).join(', ') + ' <span class="x">&times;</span></span>');

    const ratingChip = LST.rating.length ? LST.rating.length + ' selected' : 'Rating';
    const typeChip = LST.type.length ? LST.type.length + ' selected' : 'Review type';
    const statusChip = LST.status.length ? LST.status.length + ' selected' : 'Status';

    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<h1 class="page-title">Reviews</h1>' +
        '<button class="btn btn-primary" data-act="add">' + I.plus + ' Add review</button>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="tabs" style="padding:0 8px" id="rv-tabs">' + tabsHtml + '</div>' +
        // filter bar
        '<div class="card-pad" style="padding-bottom:8px">' +
          '<div class="flex items-start gap-2" style="flex-wrap:wrap">' +
            // keyword field + input group
            '<div class="flex" style="min-width:440px">' +
              '<select class="filter-select" id="kw-field" style="width:170px;border-top-right-radius:0;border-bottom-right-radius:0">' + fieldOpts + '</select>' +
              '<div style="position:relative;flex:1">' +
                '<input class="filter-input" id="kw-input" placeholder="Search" value="' + esc(LST.kw) + '" style="width:100%;padding-left:12px;padding-right:32px;border-top-left-radius:0;border-bottom-left-radius:0;margin-left:-1px" />' +
                '<span style="position:absolute;right:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span>' +
              '</div>' +
            '</div>' +
            // rating multi-select
            '<div class="sel-trigger" id="rating-chip" style="width:180px"><span class="' + (LST.rating.length ? '' : 'muted') + '">' + esc(ratingChip) + '</span>' + I.chevDown + '</div>' +
            // review-type multi-select
            '<div class="sel-trigger" id="type-chip" style="width:180px"><span class="' + (LST.type.length ? '' : 'muted') + '">' + esc(typeChip) + '</span>' + I.chevDown + '</div>' +
            // status multi-select
            '<div class="sel-trigger" id="status-chip" style="width:160px"><span class="' + (LST.status.length ? '' : 'muted') + '">' + esc(statusChip) + '</span>' + I.chevDown + '</div>' +
          '</div>' +
          (tags.length ? '<div class="flex gap-2 mt-3" style="flex-wrap:wrap" id="filter-tags">' + tags.join('') + '</div>' : '') +
        '</div>' +
        // table
        '<div style="overflow-x:auto">' +
        '<table class="tbl" style="min-width:1080px">' +
          '<thead><tr>' +
            '<th>Review</th><th style="width:230px">Customer</th><th style="width:300px">Product / Vendor</th>' +
            '<th style="width:120px">Status</th><th style="width:130px">Recommend</th><th style="width:90px;text-align:center">Action</th>' +
          '</tr></thead>' +
          '<tbody id="rv-tbody">' +
            (pageRows.length ? pageRows.map(rowHtml).join('')
              : '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">No reviews match these filters.</td></tr>') +
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
    const media = r.firstMediaUrl;
    const mediaCount = (r.mediaUrls || []).length;
    const mediaCell = media
      ? '<span style="position:relative;width:56px;height:56px;border-radius:8px;overflow:hidden;flex:none;background:#f1f1f1;display:inline-block">' +
          '<img src="' + esc(media) + '" alt="" style="width:100%;height:100%;object-fit:cover" />' +
          (isVideo(media) ? '<span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(0,0,0,.28)">' + I.play + '</span>' : '') +
          (mediaCount > 1 ? '<span style="position:absolute;right:2px;bottom:2px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:0 4px;border-radius:4px">+' + (mediaCount - 1) + '</span>' : '') +
        '</span>'
      : '<span style="width:56px;height:56px;border-radius:8px;flex:none;display:grid;place-items:center;background:#e9ecf2;color:#9aa3b2;font-size:11px;font-weight:600">IMG</span>';

    const subjImg = r.reviewType === 'product' ? r.productImage : r.vendorLogo;
    const subjName = r.reviewType === 'product' ? r.productName : r.vendorName;

    const recommend = r.recommend
      ? '<span class="st st-beta" title="Featured on homepage"><span class="dot"></span>Featured · P' + (r.priority || 0) + '</span>'
      : '<span class="muted" style="font-size:12.5px">—</span>';

    return '<tr data-id="' + r.id + '">' +
      // Review cell: media thumb + comment (2-line clamp) + stars + type tag
      '<td><div class="flex items-start gap-3" style="min-width:340px">' + mediaCell +
        '<div style="min-width:0;flex:1">' +
          '<div style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink);font-size:13.5px;line-height:1.45" title="' + esc(r.comment) + '">' + esc(r.comment || '- -') + '</div>' +
          '<div class="flex items-center gap-2 mt-2">' + stars(r.rating, 14) + typeTag(r.reviewType) + '</div>' +
        '</div>' +
      '</div></td>' +
      // Customer
      '<td><div class="flex items-center gap-2">' + avatarHtml(r.customerName, r.customerAvatar, 36) +
        '<span style="color:var(--ink)">' + esc(r.customerName || '- -') + '</span></div></td>' +
      // Product / Vendor
      '<td><div class="flex items-center gap-2" style="max-width:280px">' + thumb(subjImg, 40) +
        '<span style="min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink);font-size:13px" title="' + esc(subjName) + '">' + esc(subjName || '- -') + '</span></div></td>' +
      // Status
      '<td>' + statusPill(r.status) + '</td>' +
      // Recommend / featured
      '<td>' + recommend + '</td>' +
      // Action
      '<td style="text-align:center"><button class="back-btn" data-view="' + r.id + '" title="View / reply" style="width:30px;height:30px">' + I.eye + '</button></td>' +
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
    const tc = root.querySelector('#type-chip'); if (tc) tc.onclick = () => openMultiPopover(tc, 'type');
    const sc = root.querySelector('#status-chip'); if (sc) sc.onclick = () => openMultiPopover(sc, 'status');
    // filter tags clear
    root.querySelectorAll('#filter-tags [data-clear]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-clear');
      if (k === 'kw') { LST.kw = ''; LST.kwApplied = ''; }
      if (k === 'rating') LST.rating = [];
      if (k === 'type') LST.type = [];
      if (k === 'status') LST.status = [];
      LST.page = 1; renderList();
    });
    // page size
    const ps = root.querySelector('#pg-size'); if (ps) ps.onchange = () => { LST.size = Number(ps.value); LST.page = 1; renderList(); };
    // pagination
    root.querySelectorAll('.pg-item[data-page]').forEach((el) => el.onclick = () => { LST.page = Number(el.getAttribute('data-page')); renderList(); });
    // row + view -> detail
    root.querySelectorAll('#rv-tbody tr[data-id]').forEach((tr) => tr.onclick = () => goDetail(tr.getAttribute('data-id')));
    root.querySelectorAll('[data-view]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); goDetail(b.getAttribute('data-view')); });
    // add review
    const add = root.querySelector('[data-act="add"]'); if (add) add.onclick = () => toast('Add review — opens the blank review composer (roadmap)');
  }

  // multi-select dropdown (Rating / Review type / Status) — SelectMulti.tsx equivalent
  function openMultiPopover(anchor, key) {
    closePops();
    const optsByKey = {
      rating: [ { label: '1 star', value: 1 }, { label: '2 stars', value: 2 }, { label: '3 stars', value: 3 }, { label: '4 stars', value: 4 }, { label: '5 stars', value: 5 } ],
      type:   [ { label: 'Product', value: 'product' }, { label: 'Vendor', value: 'vendor' } ],
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

  // ================= DETAIL / EDIT VIEW =================
  function renderDetail(id) {
    const r = byId(id);
    if (!r) { renderMissing(id); return; }
    const isProduct = r.reviewType === 'product';

    root.innerHTML =
      '<div class="detail-wrap">' +
        // header
        '<div class="flex items-center justify-between mb-4">' +
          '<div class="flex items-center gap-3">' +
            '<button class="back-btn" data-act="back" title="Back to reviews">' + I.arrowLeft + '</button>' +
            '<span class="page-title">Edit review</span>' +
            '<span class="muted" style="font-size:13px">#' + esc(r.id) + '</span>' +
            typeTag(r.reviewType) +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<button class="btn btn-default" data-act="toggle">' + (r.status === 0 ? I.eyeOff + ' Hide' : I.eye + ' Show') + '</button>' +
            '<button class="btn btn-primary" data-act="reply">' + I.reply + ' Reply</button>' +
          '</div>' +
        '</div>' +
        // two-column body
        '<div class="detail-cols">' +
          '<div class="detail-main">' +
            reviewTypeCard(r, isProduct) +
            reviewDetailsCard(r) +
            mediaCard(r) +
            (r.merchantReplyContent ? replyCard(r) : '') +
            '<div class="flex gap-2 mt-1" style="justify-content:flex-end">' +
              '<button class="btn btn-primary" data-act="save">Update</button>' +
              '<button class="btn btn-default" data-act="delete" style="color:var(--err);border-color:#f3c4ba">' + I.trash + ' Delete review</button>' +
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

    wireDetail(r);
  }

  function cardOpen(titleHtml, rightHtml) {
    return '<div class="panel card-pad mb-4">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div class="card-title flex items-center gap-2">' + titleHtml + '</div>' +
        (rightHtml || '') +
      '</div>';
  }

  // ---- Review type card: Product/Vendor radio + linked subject selector ----
  function reviewTypeCard(r, isProduct) {
    const subjImg = isProduct ? r.productImage : r.vendorLogo;
    const subjName = isProduct ? r.productName : r.vendorName;
    const radio = (val, label) =>
      '<label class="flex items-center gap-2" style="cursor:pointer;font-size:13.5px"><input type="radio" name="rv-type" value="' + val + '"' + (r.reviewType === val ? ' checked' : '') + ' style="accent-color:var(--brand);width:15px;height:15px" /> ' + label + '</label>';
    const subjMeta = isProduct
      ? '<div class="muted" style="font-size:12px;margin-top:2px">SKU: ' + esc(r.productSku || '- -') + ' · SPU: ' + esc(r.productSpu || '- -') + ' · ID ' + esc(r.productId) + '</div>'
      : '<div class="muted" style="font-size:12px;margin-top:2px">' + esc(r.vendorAddress || '') + ' · ' + esc(r.vendorProductCount || 0) + ' products</div>';
    const selector =
      '<button class="sel-trigger" id="subj-trigger" style="height:auto;padding:8px 12px;text-align:left">' +
        '<span class="flex items-center gap-2" style="min-width:0">' +
          '<span style="width:18px;height:18px;border-radius:50%;flex:none;display:grid;place-items:center;background:#171717;color:#fff;font-size:12px;font-weight:600">+</span>' +
          thumb(subjImg, 28) +
          '<span style="min-width:0">' +
            '<span style="display:block;color:var(--ink);font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:360px">' + esc(subjName || (isProduct ? 'Select a product' : 'Select a vendor')) + '</span>' +
            subjMeta +
          '</span>' +
        '</span>' + I.chevDown +
      '</button>';
    return cardOpen('<span>Review type</span>') +
      '<div class="flex gap-6 mb-3" id="rv-type-group">' + radio('product', 'Product') + radio('vendor', 'Vendor') + '</div>' +
      selector +
    '</div>';
  }

  // ---- Review details card: rating + content + review time ----
  function reviewDetailsCard(r) {
    return cardOpen('<span>Review details</span>') +
      '<div style="background:#F8FAFC;border:1px solid var(--hair);border-radius:10px;padding:16px">' +
        '<div class="mb-4"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Rating <span style="color:var(--err)">*</span></div>' +
          '<div id="rv-rate" style="cursor:pointer">' + stars(r.rating, 22) + '</div></div>' +
        '<div class="mb-4"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Review content <span style="color:var(--err)">*</span></div>' +
          '<textarea class="input" id="rv-comment" rows="5" maxlength="1000" style="height:auto;padding:10px 12px;resize:vertical" placeholder="Share more details about the product, such as quality, fit, shipping, or overall experience.">' + esc(r.comment) + '</textarea>' +
          '<div class="muted" style="font-size:11px;text-align:right;margin-top:4px" id="rv-comment-count">' + (r.comment || '').length + ' / 1000</div></div>' +
        '<div><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Review time (UTC+0) <span style="color:var(--err)">*</span></div>' +
          '<input class="input" id="rv-time" value="' + esc(r.createdAt) + '" /></div>' +
      '</div>' +
    '</div>';
  }

  // ---- Media gallery card (AddImageVideo) ----
  function mediaCard(r) {
    const media = r.mediaUrls || [];
    const cells = media.map((u, i) =>
      '<span class="rv-media" data-i="' + i + '" style="position:relative;width:92px;height:92px;border-radius:8px;overflow:hidden;border:1px solid var(--hair);cursor:pointer;flex:none;display:inline-block">' +
        '<img src="' + esc(u) + '" alt="" style="width:100%;height:100%;object-fit:cover" />' +
        (isVideo(u) ? '<span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(0,0,0,.28)">' + I.play + '</span>' : '') +
      '</span>').join('');
    const addTile = '<span style="width:92px;height:92px;border-radius:8px;border:2px dashed var(--ctl);display:grid;place-items:center;color:var(--ink-muted);flex:none">' + I.plus + '</span>';
    return cardOpen('<span>Photos &amp; videos</span>', '<span class="muted" style="font-size:12px">' + media.length + ' / 9</span>') +
      '<div class="flex" style="gap:10px;flex-wrap:wrap">' + (cells || '') + addTile + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:10px">Supports jpg, png, webp, gif, mp4, webm and mov. Files smaller than 4MB work better. Maximum file size 10MB.</div>' +
    '</div>';
  }

  // ---- Merchant public reply card (Response from {name}) ----
  function replyCard(r) {
    return cardOpen('<span>Response from ' + esc(r.merchantReplyName || 'Bestshopio') + '</span>', '<button class="lnk" data-act="edit-reply">Edit</button>') +
      '<div class="muted" style="font-size:12px;margin-bottom:6px">' + esc(r.merchantReplyTime || '- -') + '</div>' +
      '<div class="subtle" style="font-size:13.5px;white-space:pre-wrap;line-height:1.55">' + esc(r.merchantReplyContent) + '</div>' +
    '</div>';
  }

  // ---- right column: Status ----
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
      ? '<div style="position:relative"><div style="height:170px;border:1px solid var(--hair);border-radius:8px;overflow:hidden;background:#f8fafc;display:grid;place-items:center"><img src="' + esc(r.customerAvatar) + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain" /></div></div>'
      : '<div style="height:170px;border:2px dashed var(--ctl);border-radius:8px;display:grid;place-items:center;background:#f8fafc"><span class="btn btn-primary" data-act="add-avatar" style="cursor:pointer">Add image</span></div>';
    return cardOpen('<span>Customer</span>') +
      '<div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Name <span style="color:var(--err)">*</span></div>' +
      '<input class="input" id="rv-customer" maxlength="50" value="' + esc(r.customerName) + '" placeholder="Reviewer\'s name" />' +
      '<div class="ctrl-label" style="text-transform:none;margin:14px 0 6px">Avatar</div>' + av +
    '</div>';
  }

  // ---- right column: Recommend (featured on homepage) + Priority ----
  function recommendCard(r) {
    const priority = r.recommend
      ? '<div id="rv-priority-wrap" style="margin-top:10px"><div class="ctrl-label" style="text-transform:none;margin-bottom:6px">Priority</div>' +
        '<input class="input" id="rv-priority" type="number" min="0" value="' + (r.priority == null ? '' : r.priority) + '" placeholder="Enter priority" />' +
        '<div class="muted" style="font-size:12px;margin-top:6px">Higher priority reviews show first</div></div>'
      : '';
    return cardOpen('<span>Recommend</span>') +
      '<label class="flex items-center gap-2" style="cursor:pointer;font-size:13.5px"><input type="checkbox" id="rv-recommend"' + (r.recommend ? ' checked' : '') + ' style="accent-color:var(--brand);width:15px;height:15px" /> Show on homepage</label>' +
      priority +
    '</div>';
  }

  // ---- right column: Theme template ----
  function themeCard(r) {
    const opts = D.THEME_TEMPLATES.map((t) => '<option value="' + esc(t) + '" selected>' + esc(t) + '</option>').join('');
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

  function wireDetail(r) {
    const back = root.querySelector('[data-act="back"]'); if (back) back.onclick = () => { location.hash = '#/reviews'; };

    // review-type radio -> swap subject selector
    root.querySelectorAll('#rv-type-group input[name="rv-type"]').forEach((el) => el.onchange = () => {
      r.reviewType = el.value;
      // clear opposite subject for realism
      renderDetail(r.id);
    });
    // subject selector -> picker modal
    const subj = root.querySelector('#subj-trigger'); if (subj) subj.onclick = () => openSubjectPicker(r);

    // rating click (set 1..5 by clicking the nth star) — stars() = <span>(<span/>)x5</span>
    function wireRate() {
      const rt = root.querySelector('#rv-rate'); if (!rt || !rt.firstElementChild) return;
      Array.from(rt.firstElementChild.children).forEach((sEl, i) => {
        sEl.style.cursor = 'pointer';
        sEl.onclick = () => { r.rating = i + 1; rt.innerHTML = stars(r.rating, 22); wireRate(); };
      });
    }
    wireRate();

    // comment count + sync
    const comment = root.querySelector('#rv-comment');
    const count = root.querySelector('#rv-comment-count');
    if (comment) comment.oninput = () => { r.comment = comment.value; if (count) count.textContent = comment.value.length + ' / 1000'; };
    const time = root.querySelector('#rv-time'); if (time) time.onchange = () => { r.createdAt = time.value; };

    // media -> lightbox
    root.querySelectorAll('.rv-media').forEach((m) => m.onclick = () => openLightbox(r, Number(m.getAttribute('data-i'))));

    // status radios
    root.querySelectorAll('#rv-status-group input[name="rv-status"]').forEach((el) => el.onchange = () => { r.status = Number(el.value); });

    // customer name
    const cust = root.querySelector('#rv-customer'); if (cust) cust.oninput = () => { r.customerName = cust.value; };
    const addAv = root.querySelector('[data-act="add-avatar"]'); if (addAv) addAv.onclick = () => toast('Add image — opens the file library (roadmap)');

    // recommend toggle + priority
    const rec = root.querySelector('#rv-recommend');
    if (rec) rec.onchange = () => { r.recommend = rec.checked; if (!rec.checked) r.priority = undefined; renderDetail(r.id); };
    const prio = root.querySelector('#rv-priority'); if (prio) prio.oninput = () => { r.priority = prio.value === '' ? undefined : Number(prio.value); };

    // header + footer actions
    const reply = root.querySelector('[data-act="reply"]'); if (reply) reply.onclick = () => openReplyModal(r);
    const editReply = root.querySelector('[data-act="edit-reply"]'); if (editReply) editReply.onclick = () => openReplyModal(r);
    const toggle = root.querySelector('[data-act="toggle"]'); if (toggle) toggle.onclick = () => { r.status = r.status === 0 ? 1 : 0; toast(r.status === 1 ? 'Review hidden from storefront' : 'Review is now visible'); renderDetail(r.id); };
    const save = root.querySelector('[data-act="save"]'); if (save) save.onclick = () => { if (!(r.comment || '').trim()) { toast('Please enter review content'); return; } if (!(r.customerName || '').trim()) { toast('Please enter customer name'); return; } toast('Review updated'); };
    const del = root.querySelector('[data-act="delete"]'); if (del) del.onclick = () => openDeleteModal(r);
  }

  // ================= MODALS =================
  function modal({ title, body, width, okText, onOk }) {
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    if (width) m.style.width = width + 'px';
    m.innerHTML =
      '<div class="modal-head flex items-center justify-between"><span>' + title + '</span>' +
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

  // Reply modal (replyModal.tsx) — reply name + content, then shows as merchant response
  function openReplyModal(r) {
    const body =
      '<div class="mb-3"><label class="ctrl-label" style="text-transform:none">Reply name <span style="color:var(--err)">*</span></label>' +
        '<input class="input" id="rp-name" maxlength="100" placeholder="e.g. Store name" value="' + esc(r.merchantReplyName || '') + '" style="margin-top:4px" /></div>' +
      '<div><label class="ctrl-label" style="text-transform:none">Reply content <span style="color:var(--err)">*</span></label>' +
        '<textarea class="input" id="rp-content" rows="6" maxlength="1000" placeholder="Write a reply..." style="margin-top:4px;height:auto;padding:8px 12px;resize:vertical">' + esc(r.merchantReplyContent || '') + '</textarea></div>' +
      '<div id="rp-err" style="color:var(--err);font-size:12px;margin-top:8px;display:none"></div>';
    modal({
      title: 'Reply', width: 520, okText: 'Reply',
      body,
      onOk: (m, close) => {
        const name = m.querySelector('#rp-name').value.trim();
        const content = m.querySelector('#rp-content').value.trim();
        const e = m.querySelector('#rp-err');
        if (!name) { e.textContent = 'Please enter reply name.'; e.style.display = 'block'; return; }
        if (!content) { e.textContent = 'Please enter reply content.'; e.style.display = 'block'; return; }
        r.merchantReplyName = name;
        r.merchantReplyContent = content;
        r.merchantReplyTime = '2026-06-05 10:00';
        close(); toast('Replied successfully'); renderDetail(r.id);
      },
    });
  }

  // Subject picker (AddProductsModal / addVendorModal) — single-select list of products or vendors
  function openSubjectPicker(r) {
    const isProduct = r.reviewType === 'product';
    // gather distinct subjects from sample data of the matching type
    const seen = {}; const items = [];
    D.REVIEWS.forEach((x) => {
      if (isProduct && x.reviewType === 'product' && x.productId && !seen['p' + x.productId]) {
        seen['p' + x.productId] = 1; items.push({ id: x.productId, name: x.productName, image: x.productImage, meta: 'SKU ' + (x.productSku || '- -') + ' · SPU ' + (x.productSpu || '- -') });
      }
      if (!isProduct && x.reviewType === 'vendor' && x.vendorId && !seen['v' + x.vendorId]) {
        seen['v' + x.vendorId] = 1; items.push({ id: x.vendorId, name: x.vendorName, image: x.vendorLogo, meta: (x.vendorAddress || '') + ' · ' + (x.vendorProductCount || 0) + ' products' });
      }
    });
    const curId = isProduct ? r.productId : r.vendorId;
    const rowsHtml = items.map((it) =>
      '<label class="flex items-center gap-3" data-pick="' + it.id + '" style="padding:10px 12px;border-bottom:1px solid var(--hair);cursor:pointer">' +
        '<input type="radio" name="subj-pick" value="' + it.id + '"' + (String(it.id) === String(curId) ? ' checked' : '') + ' style="accent-color:var(--brand);width:15px;height:15px" />' +
        thumb(it.image, 40) +
        '<span style="min-width:0"><span style="display:block;color:var(--ink);font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px">' + esc(it.name) + '</span>' +
        '<span class="muted" style="font-size:12px">' + esc(it.meta) + '</span></span>' +
      '</label>').join('');
    const body =
      '<div style="position:relative;margin-bottom:10px"><input class="filter-input" id="subj-search" placeholder="Search ' + (isProduct ? 'products' : 'vendors') + '" style="width:100%;padding-left:32px" />' +
        '<span style="position:absolute;left:10px;top:9px;color:var(--ink-muted)">' + I.search + '</span></div>' +
      '<div style="border:1px solid var(--hair);border-radius:8px;max-height:320px;overflow:auto" id="subj-list">' + rowsHtml + '</div>';
    const ctrl = modal({
      title: isProduct ? 'Select product' : 'Select vendor', width: 560, okText: 'Select',
      body,
      onOk: (m, close) => {
        const picked = m.querySelector('input[name="subj-pick"]:checked');
        if (!picked) { close(); return; }
        const it = items.find((x) => String(x.id) === picked.value);
        if (it) {
          if (isProduct) { r.productId = it.id; r.productName = it.name; r.productImage = it.image; }
          else { r.vendorId = it.id; r.vendorName = it.name; r.vendorLogo = it.image; }
        }
        close(); renderDetail(r.id);
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
      box.innerHTML =
        '<div style="background:#000;border-radius:12px;overflow:hidden;display:grid;place-items:center;max-height:84vh">' +
          (isVideo(u)
            ? '<div style="position:relative;display:grid;place-items:center"><img src="' + esc(u) + '" style="max-width:80vw;max-height:84vh;object-fit:contain" /><span style="position:absolute;color:#fff">' + I.play + '</span><div style="position:absolute;bottom:10px;color:#fff;font-size:12px;background:rgba(0,0,0,.5);padding:2px 8px;border-radius:6px">Video preview</div></div>'
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
    const body =
      '<div style="font-size:13.5px;color:var(--ink-body);line-height:1.6">Once deleted, the data cannot be retrieved.<br/>Please confirm before proceeding!</div>';
    const backdrop = h('<div class="modal-backdrop"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML =
      '<div class="modal-head">Confirm to delete?</div>' +
      '<div class="modal-body">' + body + '</div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok style="background:var(--err);border-color:var(--err)">Delete</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => {
      const i = D.REVIEWS.findIndex((x) => x.id === r.id);
      if (i >= 0) D.REVIEWS.splice(i, 1);
      close(); toast('Deleted successfully'); location.hash = '#/reviews';
    };
  }

  // ================= ROUTER =================
  function goDetail(id) { location.hash = '#/reviews/' + id; }

  function route() {
    closePops();
    const hash = location.hash || '#/reviews';
    const m = hash.match(/^#\/reviews\/(.+)$/);
    if (m) { renderDetail(decodeURIComponent(m[1])); root.parentElement.scrollTop = 0; }
    else { renderList(); }
  }

  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/reviews';
  route();
})();
