/* BestShopio Admin · Online store / Theme editor — engine + admin-skinned chrome.
   Ported from reference/canvases-share 2 (theme-editor.canvas.tsx model): a 3-snapshot
   deep-equal state machine (theme / savedTheme / publishedTheme), a section/block structure
   tree, a schema-driven right panel, a live storefront preview, and Save/Discard/Publish.
   The EDITOR CHROME (top bar, left tree, right panel) follows the BestShopio admin design
   system (_shared/admin-theme.css tokens); the CENTER preview is faithful to the Cursor
   storefront renderers, which live one-per-file in js/sections/<kind>.js and register via OS.register.
   Chrome (sidebar + header) of the surrounding SPA is injected by ../assets/shell.js; this file
   renders the module body into `root`, and opens the builder as a full-screen overlay. */
(function () {
  const D = window.OS_DATA;
  const SECTIONS = (window.OS_SECTIONS = window.OS_SECTIONS || {});
  let root; // set by the SPA shell router via VIEWS['online-store'].render(el, rest)

  // module base dir (…/online-store/js/) for loading section files
  const MOD_BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/app\.js.*$/, '') : 'online-store/js/';
  })();
  const OS_V = String(Date.now()); // per-load cache-bust for section files (always fresh on reload)

  // ------------------------------------------------------------------ helpers
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstElementChild; };
  const clamp = (v, lo, hi, fb) => { v = Number(v); if (!isFinite(v)) return fb == null ? lo : fb; return Math.min(hi, Math.max(lo, v)); };
  const money = (n) => '$' + Number(n || 0).toFixed(2);
  const uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
  const bgOrTransparent = (v) => (!v || v === 'transparent') ? 'transparent' : v;
  const col = (v, fb) => (v == null || v === '' || v === 'theme') ? fb : v;

  // ------------------------------------------------------------------ icons
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    back: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
    chev: svg('<path d="m6 9 6 6 6-6"/>', 14),
    chevR: svg('<path d="m9 18 6-6-6-6"/>', 14),
    layers: svg('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    eye: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>', 15),
    eyeOff: svg('<path d="M9.9 4.24A9 9 0 0 1 12 4c6 0 10 7 10 7a13 13 0 0 1-1.67 2.18M6.6 6.6A13 13 0 0 0 2 11s4 7 10 7a9 9 0 0 0 4.5-1.2"/><path d="m2 2 20 20"/>', 15),
    trash: svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>', 14),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 14),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 14),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 14),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    menu: svg('<path d="M3 12h18M3 6h18M3 18h18"/>'),
    star: svg('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" stroke="none"/>', 14),
    play: svg('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>'),
    desktop: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', 15),
    mobile: svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', 15),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 13),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', 14),
  };
  const ICON = (n) => I[n] || I.layers;

  // ------------------------------------------------------------------ token / style helpers
  const FONT_SERIF = ['Playfair Display', 'DM Serif Display', 'Georgia'];
  const fontStack = (name) => "'" + name + "', " + (FONT_SERIF.indexOf(name) >= 0 ? 'Georgia, serif' : 'system-ui, -apple-system, sans-serif');
  const fontScale = (t) => ((t && t.typography && t.typography.base_font_size) || 16) / 16;
  const SCALE = { small: 0.85, medium: 1.0, large: 1.2 };
  const headMult = (t) => SCALE[(t && t.typography && t.typography.heading_scale) || 'medium'] || 1;
  const fs = (t, px) => Math.max(8, Math.round(px * fontScale(t)));
  const headingSize = (t, basePx) => Math.max(10, Math.round(basePx * headMult(t) * fontScale(t)));
  const headingFamily = (t) => fontStack((t && t.typography && t.typography.heading_font) || 'Playfair Display');
  const bodyFamily = (t) => fontStack((t && t.typography && t.typography.body_font) || 'Inter');
  const hexAlpha = (hex, a) => { hex = String(hex || '').replace('#', ''); if (hex.length === 3) hex = hex.split('').map((c) => c + c).join(''); const n = parseInt(hex, 16); if (isNaN(n)) return 'rgba(0,0,0,' + a + ')'; return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  function btnStyle(t, opts) {
    opts = opts || {}; const b = (t && t.buttons) || {}; const sec = opts.variant === 'secondary';
    const bw = sec ? (b.button_border_width || 0) : (b.button_border_width || 0);
    let s = 'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border-style:solid;white-space:nowrap;';
    s += 'background:' + bgOrTransparent(sec ? b.secondary_button_background : b.primary_button_background) + ';';
    s += 'color:' + ((sec ? b.secondary_button_text : b.primary_button_text) || '#fff') + ';';
    s += 'border-width:' + bw + 'px;border-color:' + (bw > 0 ? (b.button_border_color || 'transparent') : 'transparent') + ';';
    s += 'border-radius:' + (b.button_border_radius || 0) + 'px;height:' + (b.button_height || 44) + 'px;padding:0 ' + (b.button_horizontal_padding || 24) + 'px;';
    s += 'text-transform:' + (b.button_text_transform || 'none') + ';font-weight:600;font-size:' + fs(t, 13) + 'px;letter-spacing:.02em;';
    return s;
  }
  function inputStyle(t, opts) {
    opts = opts || {}; const f = (t && t.forms) || {};
    const border = opts.focus ? (f.focus_border_color || '#103635') : (f.input_border_color || '#E5E5E5');
    let s = 'background:' + (f.input_background || '#fff') + ';color:' + (f.input_text || '#1a1a1a') + ';';
    s += 'border:1.5px solid ' + border + ';border-radius:' + (f.input_border_radius || 0) + 'px;';
    s += 'height:' + (f.input_height || 44) + 'px;padding:0 ' + (f.input_horizontal_padding || 16) + 'px;font-size:' + fs(t, 14) + 'px;outline:none;';
    if (opts.focus) s += 'box-shadow:0 0 0 3px ' + hexAlpha(f.focus_border_color || '#103635', .22) + ';';
    return s;
  }
  const layoutRadius = (t, which) => { const l = (t && t.layout) || {}; return (which === 'image' ? l.image_border_radius : l.card_border_radius) || 0; };
  const pick = (a, b) => (a == null ? b : a);
  // shared storefront product card — reads Theme settings › Product cards (with optional per-section overrides)
  function productCard(p, t, opts) {
    opts = opts || {}; const pc = (t && t.product_cards) || {}, c = (t && t.colors) || {};
    const ratio = { portrait: '3/4', square: '1/1', landscape: '4/3' }[opts.ratio || pc.product_image_ratio] || '3/4';
    const fit = pc.product_image_fit || 'cover';
    const align = opts.align || pc.product_card_text_alignment || 'center';
    const titlePx = { small: 13, medium: 14, large: 16 }[pc.product_title_size] || 14;
    const rad = layoutRadius(t, 'card');
    const sale = p.compareAt && p.compareAt > p.price, pct = sale ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const saleColor = c.sale_price_color || '#d92d20';
    const badge = (sale && pick(opts.showSaleBadge, pc.show_sale_badge_by_default))
      ? '<span class="oc-badge" style="' + (pc.sale_badge_style === 'outline' ? 'background:transparent;border:1px solid ' + saleColor + ';color:' + saleColor : 'background:' + saleColor + ';color:#fff') + '">-' + pct + '%</span>' : '';
    const quick = pick(opts.showQuickAdd, pc.show_quick_add_by_default) ? '<span class="oc-quick" style="' + btnStyle(t) + ';height:36px;font-size:' + fs(t, 12) + 'px">Quick add</span>' : '';
    const swatches = (pick(opts.showSwatches, pc.show_color_swatches_by_default) && p.swatches) ? '<div class="oc-sw">' + p.swatches.slice(0, 5).map((s) => '<span style="background:' + s + '"></span>').join('') + '</div>' : '';
    const vendor = (pick(opts.showVendor, pc.show_vendor_by_default) && p.vendor) ? '<div class="oc-vendor" style="color:' + (c.secondary_color || '#777') + '">' + esc(p.vendor) + '</div>' : '';
    const rating = (pick(opts.showRating, pc.show_rating_by_default) && p.rating) ? '<div class="oc-rate"><span style="color:#f5b301">' + I.star + '</span>' + p.rating + (p.reviews ? ' <i>(' + p.reviews + ')</i>' : '') + '</div>' : '';
    const price = '<div class="oc-price"><span' + (sale ? ' style="color:' + saleColor + '"' : '') + '>' + money(p.price) + '</span>' + (sale ? '<s>' + money(p.compareAt) + '</s>' : '') + '</div>';
    return '<div class="oc-card" style="text-align:' + align + ';font-family:' + bodyFamily(t) + '">' +
      '<div class="oc-img" style="aspect-ratio:' + ratio + ';border-radius:' + rad + 'px;background-image:url(' + esc(p.image) + ');background-size:' + fit + '">' + badge + quick + '</div>' +
      swatches + vendor + '<div class="oc-title" style="font-size:' + fs(t, titlePx) + 'px;color:' + (c.text_color || '#1a1a1a') + '">' + esc(p.title) + '</div>' + rating + price + '</div>';
  }

  // ------------------------------------------------------------------ public API for section files
  const OS = (window.OS = {
    esc, clone, clamp, money, uid, bgOrTransparent, col, h,
    icon: ICON, sample: D.SAMPLE, data: D,
    fs, headingSize, headingFamily, bodyFamily, fontStack, btnStyle, inputStyle, layoutRadius, hexAlpha, pick, productCard,
    register: function (kind, def) { def.kind = kind; SECTIONS[kind] = def; },
    css: function (id, text) { if (document.getElementById('oscss-' + id)) return; const st = document.createElement('style'); st.id = 'oscss-' + id; st.textContent = text; document.head.appendChild(st); },
    secSpace: (t, mob) => ((t && t.layout) ? (mob ? t.layout.section_spacing_mobile : t.layout.section_spacing_desktop) : (mob ? 40 : 64)),
    pagePad: (t, mob) => ((t && t.layout) ? (mob ? t.layout.page_horizontal_padding_mobile : t.layout.page_horizontal_padding_desktop) : (mob ? 16 : 40)),
    gridGap: (t, mob) => ((t && t.layout) ? (mob ? t.layout.grid_gap_mobile : t.layout.grid_gap_desktop) : (mob ? 16 : 24)),
    pageWidth: (t) => ((t && t.layout && t.layout.page_width) || 1200),
  });

  // ------------------------------------------------------------------ section loader
  let _sectionsP = null;
  function ensureSections() {
    if (_sectionsP) return _sectionsP;
    const kinds = ['announcement-bar', 'header', 'footer', 'collection-banner', 'collection-list', 'collection-page'];
    D.CATALOG.forEach((g) => g.entries.forEach((e) => { if (e.kind && kinds.indexOf(e.kind) < 0) kinds.push(e.kind); }));
    _sectionsP = Promise.all(kinds.map((k) => loadScript(MOD_BASE + 'sections/' + k + '.js?v=' + OS_V).catch(() => { /* not yet ported — skip */ })));
    return _sectionsP;
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.body.appendChild(s); });
  }

  // ------------------------------------------------------------------ toast
  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'os-toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = '<i></i>' + esc(msg);
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  }

  // ==========================================================================
  //  STATE  (3 snapshots + UI state, mirrors theme-editor.canvas)
  // ==========================================================================
  let ED = null;

  function buildSettingsDefaults() {
    const out = {};
    D.SETTINGS_GROUPS.forEach((g) => { out[g.key] = {}; g.fields.forEach((f) => { if (f.key) out[g.key][f.key] = f.default; }); });
    return out;
  }
  function defForKind(kind) { return SECTIONS[kind]; }
  function schemaDefaults(schema) { const o = {}; (schema || []).forEach((f) => { if (f.key) o[f.key] = f.default; }); return o; }
  function sectionDefaults(def) { return Object.assign({}, def ? schemaDefaults(def.schema) : {}, (def && def.defaults) ? def.defaults() : {}); }
  function blockDefaults(bd) { return Object.assign({}, bd ? schemaDefaults(bd.fields) : {}, (bd && bd.defaults) ? bd.defaults() : {}); }
  function matGlobal(kind, seed) {
    const def = defForKind(kind); seed = seed || {};
    const inst = { kind, hidden: !!seed.hidden, settings: Object.assign(sectionDefaults(def), seed.settings || {}) };
    if (def && def.blocks) inst.blocks = seed.blocks ? seed.blocks.map((b) => matBlock(def, b)) : (def.defaultBlocks ? def.defaultBlocks() : []);
    return inst;
  }
  function matBlock(def, seed) {
    const bd = blockDef(def, seed.kind);
    return { id: seed.id || uid('blk'), kind: seed.kind, hidden: !!seed.hidden, settings: Object.assign(blockDefaults(bd), seed.settings || {}) };
  }
  function blockDef(def, blockKind) {
    if (!def || !def.blocks) return null;
    if (def.blocks.kinds) return def.blocks.kinds[blockKind] || null;
    return def.blocks; // single homogeneous block type
  }
  function matSection(seed) {
    const def = defForKind(seed.kind);
    let blocks = [];
    if (def && def.blocks) blocks = seed.blocks ? seed.blocks.map((b) => matBlock(def, b)) : (def.defaultBlocks ? def.defaultBlocks() : []);
    return { id: seed.id || uid('sec'), kind: seed.kind, hidden: !!seed.hidden, settings: Object.assign(sectionDefaults(def), seed.settings || {}), blocks };
  }
  function materialize() {
    const T = D.DEFAULT_THEME;
    const theme = {
      name: T.name,
      announcement: matGlobal('announcement-bar', T.announcement),
      header: matGlobal('header', T.header),
      footer: matGlobal('footer', T.footer),
      settings: buildSettingsDefaults(),
      templates: {},
    };
    Object.keys(T.templates).forEach((pg) => { theme.templates[pg] = { sections: T.templates[pg].sections.map(matSection) }; });
    return theme;
  }

  function startEditor(handle) {
    const themeMeta = D.THEMES.find((t) => t.handle === handle) || D.THEMES[0];
    const base = materialize();
    ED = {
      meta: themeMeta,
      theme: base,
      savedTheme: clone(base),
      publishedTheme: clone(base),
      currentPage: 'home',
      device: 'desktop',
      leftMode: 'sections',            // 'sections' | 'settings'
      selection: { kind: 'header' },   // announcement|header|footer | {kind:'section',sectionId} | {kind:'block',sectionId,blockId}
      expand: { header: true, template: true, footer: true },
      sectionExpand: {},
      busy: null,                      // 'saving' | 'publishing' | 'discarding' | null
      settingsExpand: settingsExpandInit(),
    };
  }
  function settingsExpandInit() { const o = {}; D.SETTINGS_GROUPS.forEach((g) => { o[g.key] = !!g.open; }); return o; }

  // derived
  const isDirty = () => !eq(ED.theme, ED.savedTheme);
  const hasDraft = () => !eq(ED.savedTheme, ED.publishedTheme);
  const status = () => isDirty() ? 'unsaved' : hasDraft() ? 'draft' : 'saved';
  const pageSections = () => ED.theme.templates[ED.currentPage].sections;
  const pageLabel = () => (D.PAGE_OPTIONS.find((p) => p.value === ED.currentPage) || {}).label || ED.currentPage;
  const tokens = () => ED.theme.settings;

  // ==========================================================================
  //  THEME LIST  (#/online-store)
  // ==========================================================================
  function renderList() {
    closeBuilder(); ensureStyles();
    root.innerHTML =
      '<div class="os-list">' +
        '<div class="tabs" style="margin-bottom:14px"><div class="tab active" style="font-size:18px;font-weight:600;padding:6px 2px 14px">My theme</div></div>' +
        '<div class="os-theme-cards">' + D.THEMES.map(themeCard).join('') + '</div>' +
      '</div>';
    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => goEdit(b.getAttribute('data-edit')));
  }
  function themeCard(t) {
    return '<section class="os-theme-card">' +
      '<div class="os-theme-prev">' +
        '<div class="os-prev-pc"><img src="' + esc(t.pc_image) + '" alt="Desktop preview" loading="lazy"></div>' +
        '<div class="os-prev-h5"><img src="' + esc(t.h5_image) + '" alt="Mobile preview" loading="lazy"></div>' +
      '</div>' +
      '<div class="os-theme-meta"><div><div class="os-theme-name">' + esc(t.title) + '</div>' +
      '<div class="os-theme-saved">Last saved: ' + esc(t.updated_time) + '</div></div>' +
      '<button class="btn btn-primary" data-edit="' + esc(t.handle) + '">Customize</button></div></section>';
  }
  function goEdit(handle) { location.hash = '#/online-store/edit/' + encodeURIComponent(handle); }

  // ==========================================================================
  //  BUILDER  (#/online-store/edit/:handle)
  // ==========================================================================
  function renderBuilder(handle) {
    if (!ED || ED.meta.handle !== handle) startEditor(handle);
    closeBuilder(); ensureStyles();
    const b = h('<div class="os-builder" id="os-builder"></div>');
    b.appendChild(topBar());
    const body = h('<div class="os-body"></div>');
    body.appendChild(leftPanel());
    body.appendChild(centerPanel());
    body.appendChild(rightPanel());
    b.appendChild(body);
    document.body.appendChild(b);
    wireTop(); wireLeft(); wireCanvas();
    if (ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings') wireSettings(); else wireRight();
    applyHighlight(); scrollToSelected();
  }
  function closeBuilder() { const ex = document.getElementById('os-builder'); if (ex) ex.remove(); closePops(); }

  // -------------------------------------------------------------- TOP BAR
  function topBar() {
    const st = status();
    const pill = { unsaved: ['pill-orange', 'Unsaved changes'], draft: ['pill-blue', 'Draft pending publish'], saved: ['pill-green', 'Saved'] }[st];
    const dirty = isDirty(), draft = hasDraft(), busy = ED.busy;
    const issues = busy ? [] : validate();
    const top = h('<div class="os-top"></div>');
    top.innerHTML =
      '<div class="os-top-l">' +
        '<button class="back-btn" id="t-back" title="Back to themes">' + I.back + '</button>' +
        '<div class="os-rail">' +
          '<button class="os-rail-b' + (ED.leftMode === 'sections' ? ' on' : '') + '" data-rail="sections" title="Sections">' + I.layers + '</button>' +
          '<button class="os-rail-b' + (ED.leftMode === 'settings' ? ' on' : '') + '" data-rail="settings" title="Theme settings">' + I.gear + '</button>' +
        '</div>' +
        '<span class="os-tname">' + esc(ED.theme.name) + '</span>' +
        '<span class="pill ' + pill[0] + '"><span class="dot"></span>' + pill[1] + '</span>' +
      '</div>' +
      '<div class="os-top-c">' +
        '<div class="os-pagesel" id="t-page"><span>' + esc(pageLabel()) + '</span>' + I.chev + '</div>' +
        '<div class="os-dev">' +
          '<button class="' + (ED.device === 'desktop' ? 'on' : '') + '" data-dev="desktop" title="Desktop">' + I.desktop + '</button>' +
          '<button class="' + (ED.device === 'mobile' ? 'on' : '') + '" data-dev="mobile" title="Mobile">' + I.mobile + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="os-top-r">' +
        '<button class="btn btn-default" id="t-discard"' + (dirty && !busy ? '' : ' disabled') + '>Discard</button>' +
        '<button class="btn btn-default" id="t-save"' + (dirty && !busy ? '' : ' disabled') + '>' + (busy === 'saving' ? 'Saving…' : 'Save') + '</button>' +
        '<button class="btn ' + (issues.length ? 'btn-warn' : 'btn-primary') + '" id="t-pub"' + (((dirty || draft) && !busy) ? '' : ' disabled') + ' title="' + (issues.length ? issues.length + ' validation issue(s)' : 'Publish to storefront') + '">' +
          (busy === 'publishing' ? 'Publishing…' : (issues.length ? 'Publish · ' + issues.length : 'Publish')) + '</button>' +
      '</div>';
    return top;
  }
  function wireTop() {
    const b = document.getElementById('os-builder');
    b.querySelector('#t-back').onclick = () => attemptLeave(() => { location.hash = '#/online-store'; });
    b.querySelectorAll('[data-rail]').forEach((x) => x.onclick = () => { ED.leftMode = x.getAttribute('data-rail'); if (ED.leftMode === 'settings') ED.selection = { kind: 'theme-settings' }; else if (ED.selection.kind === 'theme-settings') ED.selection = { kind: 'header' }; rerender(); });
    b.querySelector('#t-page').onclick = (e) => openPageMenu(e.currentTarget);
    b.querySelectorAll('[data-dev]').forEach((x) => x.onclick = () => { const d = x.getAttribute('data-dev'); if (d !== ED.device) { ED.device = d; refreshTop(); refreshCanvas(); } });
    const dis = b.querySelector('#t-discard'); if (dis && !dis.disabled) dis.onclick = onDiscard;
    const sv = b.querySelector('#t-save'); if (sv && !sv.disabled) sv.onclick = onSave;
    const pb = b.querySelector('#t-pub'); if (pb && !pb.disabled) pb.onclick = onPublish;
  }

  // -------------------------------------------------------------- LEFT (tree / settings groups)
  function leftPanel() {
    const left = h('<div class="os-left"></div>');
    left.innerHTML = ED.leftMode === 'settings'
      ? '<div class="os-left-head">Theme settings</div><div class="os-left-scroll" id="os-tree">' + settingsTreeHint() + '</div>'
      : '<div class="os-left-head">Sections</div><div class="os-left-scroll" id="os-tree">' + treeHtml() + '</div>';
    return left;
  }
  function settingsTreeHint() {
    return '<div class="os-tree-note">Global tokens — every Section &amp; Block inherits from here unless overridden. Edit on the right; the preview updates live.</div>' +
      D.SETTINGS_GROUPS.map((g) => '<div class="os-tree-row" data-sgrp="' + g.key + '"><span class="os-tr-ico">' + I.gear + '</span><span class="os-tr-name">' + esc(g.name) + '</span></div>').join('');
  }
  function treeHtml() {
    const sel = ED.selection;
    const groupHead = (key, label) => '<div class="os-grp-head" data-grp="' + key + '"><span class="os-caret' + (ED.expand[key] ? ' open' : '') + '">' + I.chevR + '</span>' + esc(label) + '</div>';
    let html = '';
    // Header group
    html += groupHead('header', 'Header Group');
    if (ED.expand.header) {
      html += globalRow('announcement', 'Announcement bar', ED.theme.announcement, sel.kind === 'announcement');
      html += globalRow('header', 'Header', ED.theme.header, sel.kind === 'header');
    }
    // Template group
    html += groupHead('template', pageLabel().replace(/ page$/i, '') + ' Template');
    if (ED.expand.template) {
      pageSections().forEach((s) => { html += sectionRow(s); });
      html += '<div class="os-tree-add" data-add-sec>' + I.plus + ' Add section <span class="os-add-n">(' + countAvailable() + ')</span></div>';
    }
    // Footer group
    html += groupHead('footer', 'Footer Group');
    if (ED.expand.footer) html += globalRow('footer', 'Footer', ED.theme.footer, sel.kind === 'footer');
    return html;
  }
  function countAvailable() { let n = 0; D.CATALOG.forEach((g) => g.entries.forEach((e) => { if (e.kind && SECTIONS[e.kind]) n++; })); return n; }
  function globalRow(scope, label, inst, active) {
    const def = SECTIONS[inst.kind];
    const hasBlocks = def && def.blocks;
    const open = ED.sectionExpand[scope] !== false;
    let html = '<div class="os-row global' + (active ? ' active' : '') + (inst.hidden ? ' hid' : '') + '" data-sel-global="' + scope + '">' +
      (hasBlocks ? '<span class="os-row-caret' + (open ? ' open' : '') + '" data-tog-sec="' + scope + '">' + I.chevR + '</span>' : '<span class="os-row-caret ghost"></span>') +
      '<span class="os-tr-ico">' + ICON(def ? def.icon : 'layers') + '</span>' +
      '<span class="os-tr-name">' + esc(label) + '</span>' +
      rowActions(inst.hidden, false) + '<span class="os-tr-lock" title="Global section">' + I.lock + '</span></div>';
    if (hasBlocks && open) {
      (inst.blocks || []).forEach((bl) => {
        const bActive = ED.selection.kind === 'block' && ED.selection.sectionId === scope && ED.selection.blockId === bl.id;
        html += '<div class="os-row blk' + (bActive ? ' active' : '') + (bl.hidden ? ' hid' : '') + '" draggable="true" data-sel-blk="' + scope + ':' + bl.id + '">' +
          '<span class="os-tr-ico sm">' + ICON('layers') + '</span><span class="os-tr-name">' + esc(blockLabel(inst, bl)) + '</span>' +
          rowActions(bl.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
      });
      const bd = blockAddInfo(inst);
      if (bd) html += '<div class="os-tree-add sub" data-add-blk="' + scope + '">' + I.plus + ' ' + esc(bd) + '</div>';
    }
    return html;
  }
  function sectionRow(s) {
    const sel = ED.selection;
    const def = SECTIONS[s.kind];
    const active = sel.kind === 'section' && sel.sectionId === s.id;
    const hasBlocks = def && def.blocks;
    const open = ED.sectionExpand[s.id] !== false;
    const name = sectionLabel(s);
    let html = '<div class="os-row sec' + (active ? ' active' : '') + (s.hidden ? ' hid' : '') + '" draggable="true" data-sel-sec="' + s.id + '">' +
      (hasBlocks ? '<span class="os-row-caret' + (open ? ' open' : '') + '" data-tog-sec="' + s.id + '">' + I.chevR + '</span>' : '<span class="os-row-caret ghost"></span>') +
      '<span class="os-tr-ico">' + ICON(def ? def.icon : 'layers') + '</span>' +
      '<span class="os-tr-name">' + esc(name) + '</span>' +
      rowActions(s.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
    if (hasBlocks && open) {
      (s.blocks || []).forEach((bl) => {
        const bActive = sel.kind === 'block' && sel.blockId === bl.id;
        html += '<div class="os-row blk' + (bActive ? ' active' : '') + (bl.hidden ? ' hid' : '') + '" draggable="true" data-sel-blk="' + s.id + ':' + bl.id + '">' +
          '<span class="os-tr-ico sm">' + ICON('layers') + '</span><span class="os-tr-name">' + esc(blockLabel(s, bl)) + '</span>' +
          rowActions(bl.hidden, true) + '<span class="os-tr-grip">' + I.grip + '</span></div>';
      });
      const bd = blockAddInfo(s);
      if (bd) html += '<div class="os-tree-add sub" data-add-blk="' + s.id + '">' + I.plus + ' ' + esc(bd) + '</div>';
    }
    return html;
  }
  function rowActions(hidden, canDelete) {
    return '<span class="os-tr-acts">' +
      '<span class="os-tr-act" data-vis title="' + (hidden ? 'Show' : 'Hide') + '">' + (hidden ? I.eyeOff : I.eye) + '</span>' +
      (canDelete ? '<span class="os-tr-act danger" data-del title="Delete">' + I.trash + '</span>' : '') + '</span>';
  }
  function blockAddInfo(s) {
    const def = SECTIONS[s.kind]; if (!def || !def.blocks) return null;
    if (def.blocks.kinds) return 'Add block';
    const max = def.blocks.max || 99; if ((s.blocks || []).length >= max) return null;
    return 'Add ' + ((def.blocks.name || 'block').toLowerCase());
  }
  function sectionLabel(s) {
    const def = SECTIONS[s.kind];
    const head = s.settings && (s.settings.heading || s.settings.logoText || s.settings.title);
    if (head && String(head).trim()) return String(head).trim();
    return def ? def.name : s.kind;
  }
  function blockLabel(s, bl) {
    const def = SECTIONS[s.kind]; const bd = blockDef(def, bl.kind);
    const head = bl.settings && (bl.settings.heading || bl.settings.question || bl.settings.title || bl.settings.author || bl.settings.label);
    const base = bd ? bd.name : (bl.kind || 'Block');
    if (head && String(head).trim()) return base + ' · ' + String(head).trim().slice(0, 22);
    return base;
  }

  function wireLeft() {
    const b = document.getElementById('os-builder'); const tree = b.querySelector('#os-tree');
    if (ED.leftMode === 'settings') {
      tree.querySelectorAll('[data-sgrp]').forEach((r) => r.onclick = () => { const k = r.getAttribute('data-sgrp'); ED.settingsExpand[k] = true; ED.selection = { kind: 'theme-settings' }; refreshRight(); setTimeout(() => { const el = document.querySelector('#os-set-' + k); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); });
      return;
    }
    tree.querySelectorAll('[data-grp]').forEach((g) => g.onclick = () => { const k = g.getAttribute('data-grp'); ED.expand[k] = !ED.expand[k]; refreshTree(); });
    tree.querySelectorAll('[data-tog-sec]').forEach((c) => c.onclick = (e) => { e.stopPropagation(); const id = c.getAttribute('data-tog-sec'); ED.sectionExpand[id] = ED.sectionExpand[id] === false ? true : false; refreshTree(); });
    tree.querySelectorAll('[data-sel-global]').forEach((r) => bindRow(r, () => select({ kind: r.getAttribute('data-sel-global') })));
    tree.querySelectorAll('[data-sel-sec]').forEach((r) => bindRow(r, () => select({ kind: 'section', sectionId: r.getAttribute('data-sel-sec') })));
    tree.querySelectorAll('[data-sel-blk]').forEach((r) => bindRow(r, () => { const p = r.getAttribute('data-sel-blk').split(':'); select({ kind: 'block', sectionId: p[0], blockId: p[1] }); }));
    const addS = tree.querySelector('[data-add-sec]'); if (addS) addS.onclick = (e) => openAddSection(e.currentTarget);
    tree.querySelectorAll('[data-add-blk]').forEach((r) => r.onclick = (e) => { e.stopPropagation(); addBlock(r.getAttribute('data-add-blk'), e.currentTarget); });
    wireDrag(tree);
  }
  function bindRow(r, onSel) {
    r.onclick = (e) => { if (e.target.closest('[data-vis]') || e.target.closest('[data-del]') || e.target.closest('[data-tog-sec]')) return; onSel(); };
    const vis = r.querySelector('[data-vis]'); if (vis) vis.onclick = (e) => { e.stopPropagation(); toggleHidden(r); };
    const del = r.querySelector('[data-del]'); if (del) del.onclick = (e) => { e.stopPropagation(); confirmDelete(r); };
  }

  // -------------------------------------------------------------- CENTER (preview canvas)
  function centerPanel() {
    const c = h('<div class="os-center"></div>');
    c.innerHTML = '<div class="os-canvas-bar">Live preview · ' + esc(pageLabel()) + ' · ' + (ED.device === 'desktop' ? 'Desktop' : 'Mobile') + '</div>' +
      '<div class="os-canvas-scroll" id="os-cscroll"><div class="os-frame ' + ED.device + '" id="os-frame">' + canvasHtml() + '</div></div>';
    return c;
  }
  function canvasHtml() {
    let html = '';
    html += wrapGlobal('announcement', ED.theme.announcement);
    html += wrapGlobal('header', ED.theme.header);
    pageSections().filter((s) => !s.hidden).forEach((s) => { html += wrapSection(s); });
    html += wrapGlobal('footer', ED.theme.footer);
    if (!pageSections().filter((s) => !s.hidden).length) html += '<div class="os-empty-canvas">This template has no visible sections.<br>Add one from the left, or switch page type.</div>';
    return html;
  }
  function ctxFor(scope, id, selBool, selBlk) { return { mob: ED.device === 'mobile', tokens: tokens(), scope, sectionId: id, selected: selBool, selectedBlockId: selBlk, sample: D.SAMPLE }; }
  function wrapGlobal(scope, inst) {
    if (inst.hidden) return '';
    const def = SECTIONS[inst.kind]; const sel = ED.selection.kind === scope;
    const inner = def ? safeRender(def, inst, scope, inst.id) : unknown(inst.kind);
    return '<div class="os-sec' + (sel ? ' active' : '') + '" data-csel-global="' + scope + '"><span class="os-sec-tag">' + esc(scope === 'announcement' ? 'Announcement' : scope[0].toUpperCase() + scope.slice(1)) + '</span>' + inner + '</div>';
  }
  function wrapSection(s) {
    const def = SECTIONS[s.kind]; const sel = ED.selection.kind === 'section' && ED.selection.sectionId === s.id;
    const inner = def ? safeRender(def, s, 'section', s.id) : unknown(s.kind);
    return '<div class="os-sec' + (sel ? ' active' : '') + '" data-csel="' + s.id + '" data-preview-id="section:' + s.id + '"><span class="os-sec-tag">' + esc(sectionLabel(s)) + '</span>' + inner + '</div>';
  }
  function safeRender(def, inst, scope, id) {
    try {
      const selBlk = (ED.selection.kind === 'block' && ED.selection.sectionId === id) ? ED.selection.blockId : null;
      const selBool = (scope === 'section' ? (ED.selection.kind === 'section' && ED.selection.sectionId === id) : ED.selection.kind === scope);
      return def.render(inst.settings, inst.blocks || [], ctxFor(scope, id, selBool, selBlk));
    } catch (e) { return '<div class="os-render-err">⚠ ' + esc(def.kind) + ' failed to render: ' + esc(e.message) + '</div>'; }
  }
  function unknown(kind) { return '<div class="os-render-err">Section “' + esc(kind) + '” isn’t available yet.</div>'; }

  function wireCanvas() {
    const frame = document.getElementById('os-frame'); if (!frame) return;
    frame.querySelectorAll('[data-csel-global]').forEach((el) => el.addEventListener('click', (e) => {
      const blk = e.target.closest('[data-block-id]');
      const scope = el.getAttribute('data-csel-global');
      if (blk && el.contains(blk)) { e.stopPropagation(); /* globals expose block selection too (footer) */ select({ kind: 'block', sectionId: scope, blockId: blk.getAttribute('data-block-id') }); return; }
      select({ kind: scope });
    }));
    frame.querySelectorAll('[data-csel]').forEach((el) => el.addEventListener('click', (e) => {
      const blk = e.target.closest('[data-block-id]'); const id = el.getAttribute('data-csel');
      if (blk && el.contains(blk)) { e.stopPropagation(); select({ kind: 'block', sectionId: id, blockId: blk.getAttribute('data-block-id') }); return; }
      select({ kind: 'section', sectionId: id });
    }));
    // hydrate each section for storefront interactivity (carousels, accordions, drag sliders…)
    frame.querySelectorAll('.os-sec').forEach((secEl) => {
      const id = secEl.getAttribute('data-csel'); const gscope = secEl.getAttribute('data-csel-global');
      const inst = id ? pageSections().find((x) => x.id === id) : ED.theme[gscope];
      if (!inst) return; const def = SECTIONS[inst.kind];
      if (def && def.hydrate) { try { def.hydrate(secEl, inst.settings, inst.blocks || [], ctxFor(id ? 'section' : gscope, id || gscope, false, null)); } catch (e) { /* noop */ } }
    });
  }

  // -------------------------------------------------------------- RIGHT (config panel)
  function rightPanel() {
    const r = h('<div class="os-right"></div>');
    r.innerHTML = rightInner();
    return r;
  }
  function rightInner() {
    if (ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings') return themeSettingsPanel();
    const sel = ED.selection;
    if (sel.kind === 'announcement' || sel.kind === 'header' || sel.kind === 'footer') {
      const inst = ED.theme[sel.kind]; const def = SECTIONS[inst.kind];
      const label = sel.kind === 'announcement' ? 'Announcement bar' : sel.kind[0].toUpperCase() + sel.kind.slice(1);
      return panelHead(def ? def.icon : 'layers', label, 'Global · shown on every page', inst.hidden, 'global', sel.kind) +
        '<div class="os-right-scroll" id="os-form">' + (def ? schemaForm(def.schema, inst.settings, '') : noSettings()) + '</div>';
    }
    if (sel.kind === 'section') {
      const s = pageSections().find((x) => x.id === sel.sectionId);
      if (!s) return emptyRight('Section not found.');
      const def = SECTIONS[s.kind];
      return panelHead(def ? def.icon : 'layers', sectionLabel(s), def ? def.name : s.kind, s.hidden, 'section', s.id) +
        '<div class="os-right-scroll" id="os-form">' + (def ? schemaForm(def.schema, s.settings, '') : noSettings()) +
        '<button class="os-remove" data-remove-sec="' + s.id + '">' + I.trash + ' Remove section</button></div>';
    }
    if (sel.kind === 'block') {
      const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId);
      const bl = s && (s.blocks || []).find((x) => x.id === sel.blockId);
      if (!s || !bl) return emptyRight('Block not found.');
      const def = SECTIONS[s.kind]; const bd = blockDef(def, bl.kind);
      return panelHead('layers', blockLabel(s, bl), (bd ? bd.name : 'Block') + ' · in ' + (def ? def.name : s.kind), bl.hidden, 'block', sel.blockId) +
        '<div class="os-right-scroll" id="os-form">' + (bd ? schemaForm(bd.fields, bl.settings, '') : noSettings()) +
        '<button class="os-remove" data-remove-blk="' + sel.sectionId + ':' + bl.id + '">' + I.trash + ' Remove block</button></div>';
    }
    return emptyRight('Select a section or block to edit.');
  }
  function globalBySel(scope) { return (scope === 'footer' || scope === 'header' || scope === 'announcement') ? ED.theme[scope] : null; }
  function panelHead(icon, title, sub, hidden, scope, id) {
    return '<div class="os-right-head"><span class="os-rh-ico">' + ICON(icon) + '</span>' +
      '<div style="min-width:0"><div class="os-rh-title">' + esc(title) + '</div><div class="os-rh-sub">' + esc(sub) + '</div></div>' +
      '<button class="os-rh-vis' + (hidden ? ' off' : '') + '" data-head-vis="' + scope + ':' + id + '" title="' + (hidden ? 'Show section' : 'Hide section') + '">' + (hidden ? I.eyeOff : I.eye) + '</button></div>';
  }
  function emptyRight(msg) { return '<div class="os-right-head"><span class="os-rh-ico">' + I.layers + '</span><div><div class="os-rh-title">Settings</div><div class="os-rh-sub">Nothing selected</div></div></div><div class="os-empty-right">' + esc(msg) + '</div>'; }
  function noSettings() { return '<div class="os-info">This section has no settings.</div>'; }

  // ==========================================================================
  //  SCHEMA FORM (15 control types) — drives section/block/settings panels
  // ==========================================================================
  function schemaForm(schema, values, prefix) {
    return (schema || []).map((f) => fieldHtml(f, values)).join('');
  }
  function visible(f, values) { return !f.visibleWhen || !!f.visibleWhen(values); }
  function fieldHtml(f, values) {
    if (f.sub) return '<div class="os-sub">' + esc(f.sub) + '</div>';
    if (f.info && !f.key) return '<div class="os-info">' + esc(f.info) + '</div>';
    if (!visible(f, values)) return '';
    const val = values[f.key];
    const hint = f.info ? '<div class="os-fhint">' + esc(f.info) + '</div>' : '';
    if (f.control === 'toggle') {
      return '<div class="os-fld os-fld-row"><label class="os-flabel">' + esc(f.label) + req(f) + '</label>' + control(f, val) + '</div>' + hint;
    }
    const valTag = (f.control === 'range') ? '<span class="os-fval">' + esc(fmtRange(f, val)) + '</span>' : '';
    return '<div class="os-fld"><label class="os-flabel">' + esc(f.label) + req(f) + valTag + '</label>' + control(f, val) + hint + '</div>';
  }
  function req(f) { return f.required ? '<span class="os-req">*</span>' : ''; }
  function fmtRange(f, v) { v = (v == null ? f.default : v); return v + (f.unit || ''); }
  function control(f, val) {
    const dk = 'data-fkey="' + esc(f.key) + '" data-control="' + f.control + '"';
    switch (f.control) {
      case 'text': case 'url':
        return '<input class="os-input" ' + dk + ' type="text" value="' + esc(val) + '" placeholder="' + esc(f.placeholder || '') + '">';
      case 'textarea': case 'custom_css': case 'richtext':
        return '<textarea class="os-input os-ta' + (f.control === 'custom_css' ? ' mono' : '') + '" ' + dk + ' rows="' + (f.control === 'custom_css' ? 4 : 3) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(val) + '</textarea>' + (f.control === 'richtext' ? '<div class="os-fhint">Rich text — basic HTML allowed.</div>' : '');
      case 'select':
        return '<select class="os-select" ' + dk + '>' + (f.options || []).map((o) => '<option value="' + esc(o.value) + '"' + (String(o.value) === String(val) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>';
      case 'segmented':
        return '<div class="os-seg2" ' + dk + '>' + (f.options || []).map((o) => '<button data-v="' + esc(o.value) + '" class="' + (String(o.value) === String(val) ? 'on' : '') + '">' + esc(o.label) + '</button>').join('') + '</div>';
      case 'toggle':
        return '<span class="os-tg' + (val ? ' on' : '') + '" ' + dk + '><i></i></span>';
      case 'range':
        return '<input type="range" class="os-range" ' + dk + ' min="' + f.min + '" max="' + f.max + '" step="' + (f.step || 1) + '" value="' + (val == null ? f.default : val) + '">';
      case 'number':
        return '<input type="number" class="os-input" ' + dk + ' value="' + esc(val) + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + '>';
      case 'color':
        return colorControl(f, val, dk);
      case 'image':
        return '<div class="os-imgf" ' + dk + '>' + (val ? '<div class="os-img-prev" style="background-image:url(' + esc(val) + ')"></div>' : '<div class="os-img-box">' + I.image + ' Paste an image URL</div>') + '<input class="os-input" data-img-url value="' + esc(val) + '" placeholder="https://…"></div>';
      case 'product': case 'collection': case 'menu': case 'blog': case 'page':
        return pickerControl(f, val, dk);
      default:
        return '<input class="os-input" ' + dk + ' value="' + esc(val) + '">';
    }
  }
  function colorControl(f, val, dk) {
    const isT = val === 'transparent';
    const hex = (typeof val === 'string' && /^#/.test(val)) ? val : '#000000';
    return '<div class="os-color" ' + dk + '>' +
      '<label class="os-sw' + (isT ? ' tsp' : '') + '" style="' + (isT ? '' : 'background:' + esc(val)) + '"><input type="color" value="' + esc(hex) + '"></label>' +
      '<input class="os-hex" value="' + esc(val == null ? '' : val) + '">' +
      (f.allowTransparent ? '<button class="os-tbtn' + (isT ? ' on' : '') + '" data-tsp title="Transparent">T</button>' : '') + '</div>';
  }
  function pickerControl(f, val, dk) {
    const label = pickerLabel(f.control, val);
    return '<button class="os-picker" ' + dk + ' data-pick="' + f.control + '">' +
      '<span>' + esc(label) + '</span>' + I.chev + '</button>';
  }
  function pickerLabel(kind, val) {
    const S = D.SAMPLE;
    if (kind === 'product') { if (Array.isArray(val)) return val.length ? val.length + ' products selected' : 'Select products'; const p = S.products.find((x) => x.id === val); return p ? p.title : 'Select a product'; }
    if (kind === 'collection') { const c = S.collections.find((x) => x.id === val); return c ? c.title : 'Select a collection'; }
    if (kind === 'menu') { const m = S.menus.find((x) => x.id === val); return m ? m.name : 'Select a menu'; }
    if (kind === 'blog') { const b = S.blogs.find((x) => x.id === val); return b ? b.title : 'Select a blog'; }
    if (kind === 'page') { const p = S.pages.find((x) => x.id === val); return p ? p.title : 'Select a page'; }
    return 'Select…';
  }

  function wireRight() {
    const form = document.querySelector('#os-form'); if (!form) return;
    const target = currentSettings(); if (!target) { wireRemove(form); return; }
    const onChange = (k, v, rerenderPanel) => { target[k] = v; markDirty(); refreshAffectedCanvas(); if (rerenderPanel) refreshRight(); };
    form.querySelectorAll('[data-control]').forEach((el) => {
      const k = el.getAttribute('data-fkey'); const ctl = el.getAttribute('data-control');
      if (ctl === 'text' || ctl === 'url' || ctl === 'number') {
        el.oninput = () => onChange(k, ctl === 'number' ? clampNum(el) : el.value, false);
      } else if (ctl === 'textarea' || ctl === 'custom_css' || ctl === 'richtext') {
        el.oninput = () => onChange(k, el.value, false);
      } else if (ctl === 'select') {
        el.onchange = () => onChange(k, el.value, true);
      } else if (ctl === 'range') {
        el.oninput = () => { const fv = el.parentElement.querySelector('.os-fval'); if (fv) fv.textContent = el.value + (rangeUnit(el) || ''); onChange(k, num(el.value), false); };
      } else if (ctl === 'toggle') {
        el.onclick = () => { const nv = !el.classList.contains('on'); el.classList.toggle('on', nv); onChange(k, nv, true); };
      } else if (ctl === 'segmented') {
        el.querySelectorAll('button').forEach((bn) => bn.onclick = () => { el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); bn.classList.add('on'); onChange(k, coerce(bn.getAttribute('data-v')), true); });
      } else if (ctl === 'color') {
        const cp = el.querySelector('input[type=color]'); const hx = el.querySelector('.os-hex'); const sw = el.querySelector('.os-sw'); const tb = el.querySelector('[data-tsp]');
        cp.oninput = () => { hx.value = cp.value; sw.style.background = cp.value; sw.classList.remove('tsp'); if (tb) tb.classList.remove('on'); onChange(k, cp.value, false); };
        hx.onchange = () => { const v = hx.value.trim(); sw.style.background = v === 'transparent' ? '' : v; sw.classList.toggle('tsp', v === 'transparent'); onChange(k, v, false); };
        if (tb) tb.onclick = () => { const on = !tb.classList.contains('on'); tb.classList.toggle('on', on); sw.classList.toggle('tsp', on); if (on) { sw.style.background = ''; hx.value = 'transparent'; onChange(k, 'transparent', false); } else { sw.style.background = '#ffffff'; hx.value = '#FFFFFF'; onChange(k, '#FFFFFF', false); } };
      } else if (ctl === 'image') {
        const u = el.querySelector('[data-img-url]'); u.oninput = () => onChange(k, u.value, false); u.onchange = () => refreshRight();
      } else if (ctl === 'product' || ctl === 'collection' || ctl === 'menu' || ctl === 'blog' || ctl === 'page') {
        el.onclick = () => openPicker(ctl, target[k], (v) => onChange(k, v, true));
      }
    });
    wireRemove(form);
  }
  function wireRemove(form) {
    const rs = form.querySelector('[data-remove-sec]'); if (rs) rs.onclick = () => removeSection(rs.getAttribute('data-remove-sec'));
    const rb = form.querySelector('[data-remove-blk]'); if (rb) rb.onclick = () => { const p = rb.getAttribute('data-remove-blk').split(':'); removeBlock(p[0], p[1]); };
    const hv = document.querySelector('[data-head-vis]'); if (hv) hv.onclick = () => { const p = hv.getAttribute('data-head-vis').split(':'); toggleHiddenBySel(p[0], p[1]); };
  }
  function clampNum(el) { const f = fieldByEl(el); let v = num(el.value); if (f) { if (f.min != null) v = Math.max(f.min, v); if (f.max != null) v = Math.min(f.max, v); } return v; }
  function rangeUnit(el) { const f = fieldByEl(el); return f ? f.unit : ''; }
  function fieldByEl(el) { const k = el.getAttribute('data-fkey'); const sc = currentSchema(); return (sc || []).find((x) => x.key === k); }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function coerce(v) { if (v === 'true') return true; if (v === 'false') return false; if (v !== '' && !isNaN(v)) return Number(v); return v; }

  function currentSettings() {
    const sel = ED.selection;
    if (sel.kind === 'announcement' || sel.kind === 'header' || sel.kind === 'footer') return ED.theme[sel.kind].settings;
    if (sel.kind === 'section') { const s = pageSections().find((x) => x.id === sel.sectionId); return s ? s.settings : null; }
    if (sel.kind === 'block') { const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId); const bl = s && (s.blocks || []).find((x) => x.id === sel.blockId); return bl ? bl.settings : null; }
    return null;
  }
  function currentSchema() {
    const sel = ED.selection;
    if (sel.kind === 'announcement' || sel.kind === 'header' || sel.kind === 'footer') { const def = SECTIONS[ED.theme[sel.kind].kind]; return def && def.schema; }
    if (sel.kind === 'section') { const s = pageSections().find((x) => x.id === sel.sectionId); return s && SECTIONS[s.kind] && SECTIONS[s.kind].schema; }
    if (sel.kind === 'block') { const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId); const bl = s && (s.blocks || []).find((x) => x.id === sel.blockId); const bd = bl && blockDef(SECTIONS[s.kind], bl.kind); return bd && bd.fields; }
    return null;
  }

  // ==========================================================================
  //  THEME SETTINGS PANEL (right side, 8 collapsible groups)
  // ==========================================================================
  function themeSettingsPanel() {
    const head = '<div class="os-right-head"><span class="os-rh-ico">' + I.gear + '</span>' +
      '<div style="min-width:0"><div class="os-rh-title">Theme settings</div><div class="os-rh-sub">Global tokens — inherited everywhere</div></div>' +
      '<button class="os-expall" id="os-expall">Expand all</button></div>';
    const groups = D.SETTINGS_GROUPS.map((g) => {
      const open = ED.settingsExpand[g.key];
      const n = g.fields.filter((f) => f.key).length;
      const body = open ? '<div class="os-set-body">' + g.fields.map((f) => fieldHtml(f, ED.theme.settings[g.key])).join('') + '</div>' : '';
      return '<div class="os-set-grp' + (open ? ' open' : '') + '" id="os-set-' + g.key + '">' +
        '<div class="os-set-head" data-setgrp="' + g.key + '"><span class="os-caret' + (open ? ' open' : '') + '">' + I.chevR + '</span>' +
        '<div class="os-set-h-txt"><div class="os-set-name">' + esc(g.name) + '</div><div class="os-set-desc">' + esc(g.desc) + '</div></div>' +
        '<span class="os-set-n">' + n + ' fields</span></div>' + body + '</div>';
    }).join('');
    return head + '<div class="os-right-scroll" id="os-form">' + groups + '</div>';
  }
  function wireSettings() {
    const form = document.querySelector('#os-form'); if (!form) return;
    const exp = document.querySelector('#os-expall'); if (exp) exp.onclick = () => { const anyClosed = D.SETTINGS_GROUPS.some((g) => !ED.settingsExpand[g.key]); D.SETTINGS_GROUPS.forEach((g) => ED.settingsExpand[g.key] = anyClosed); refreshRight(); };
    form.querySelectorAll('[data-setgrp]').forEach((hd) => hd.onclick = () => { const k = hd.getAttribute('data-setgrp'); ED.settingsExpand[k] = !ED.settingsExpand[k]; refreshRight(); });
    // wire each group's fields against theme.settings[group]
    D.SETTINGS_GROUPS.forEach((g) => {
      if (!ED.settingsExpand[g.key]) return;
      const grpEl = form.querySelector('#os-set-' + g.key); if (!grpEl) return;
      const target = ED.theme.settings[g.key];
      bindFields(grpEl, target, g.fields, () => { markDirty(); refreshCanvas(); });
    });
  }
  // generic field binder used by theme settings groups (reuses control wiring without the section-panel scope)
  function bindFields(scopeEl, target, schema, after) {
    const change = (k, v, rerenderPanel) => { target[k] = v; after(); if (rerenderPanel) refreshRight(); };
    scopeEl.querySelectorAll('[data-control]').forEach((el) => {
      const k = el.getAttribute('data-fkey'); const ctl = el.getAttribute('data-control'); const f = schema.find((x) => x.key === k) || {};
      if (ctl === 'text' || ctl === 'url') el.oninput = () => change(k, el.value, false);
      else if (ctl === 'textarea' || ctl === 'custom_css' || ctl === 'richtext') el.oninput = () => change(k, el.value, false);
      else if (ctl === 'number') el.oninput = () => change(k, clamp(el.value, f.min == null ? -1e9 : f.min, f.max == null ? 1e9 : f.max, 0), false);
      else if (ctl === 'select') el.onchange = () => change(k, el.value, true);
      else if (ctl === 'range') el.oninput = () => { const fv = el.parentElement.querySelector('.os-fval'); if (fv) fv.textContent = el.value + (f.unit || ''); change(k, num(el.value), false); };
      else if (ctl === 'toggle') el.onclick = () => { const nv = !el.classList.contains('on'); el.classList.toggle('on', nv); change(k, nv, true); };
      else if (ctl === 'segmented') el.querySelectorAll('button').forEach((bn) => bn.onclick = () => { el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); bn.classList.add('on'); change(k, coerce(bn.getAttribute('data-v')), true); });
      else if (ctl === 'color') {
        const cp = el.querySelector('input[type=color]'); const hx = el.querySelector('.os-hex'); const sw = el.querySelector('.os-sw'); const tb = el.querySelector('[data-tsp]');
        cp.oninput = () => { hx.value = cp.value; sw.style.background = cp.value; sw.classList.remove('tsp'); if (tb) tb.classList.remove('on'); change(k, cp.value, false); };
        hx.onchange = () => { const v = hx.value.trim(); sw.style.background = v === 'transparent' ? '' : v; sw.classList.toggle('tsp', v === 'transparent'); change(k, v, false); };
        if (tb) tb.onclick = () => { const on = !tb.classList.contains('on'); tb.classList.toggle('on', on); sw.classList.toggle('tsp', on); if (on) { sw.style.background = ''; hx.value = 'transparent'; change(k, 'transparent', false); } else { sw.style.background = '#ffffff'; hx.value = '#FFFFFF'; change(k, '#FFFFFF', false); } };
      } else if (ctl === 'image') { const u = el.querySelector('[data-img-url]'); u.oninput = () => change(k, u.value, false); }
    });
  }

  // ==========================================================================
  //  ACTIONS
  // ==========================================================================
  function select(sel) { ED.selection = sel; if (sel.kind !== 'theme-settings') ED.leftMode = 'sections'; refreshTree(); refreshRight(); applyHighlight(); scrollToSelected(); }
  function markDirty() { refreshTop(); }

  function toggleHidden(rowEl) {
    if (rowEl.hasAttribute('data-sel-global')) { const k = rowEl.getAttribute('data-sel-global'); ED.theme[k].hidden = !ED.theme[k].hidden; }
    else if (rowEl.hasAttribute('data-sel-sec')) { const s = pageSections().find((x) => x.id === rowEl.getAttribute('data-sel-sec')); if (s) s.hidden = !s.hidden; }
    else if (rowEl.hasAttribute('data-sel-blk')) { const p = rowEl.getAttribute('data-sel-blk').split(':'); const s = pageSections().find((x) => x.id === p[0]) || globalBySel(p[0]); const bl = s && s.blocks.find((x) => x.id === p[1]); if (bl) bl.hidden = !bl.hidden; }
    markDirty(); refreshTree(); refreshCanvas();
  }
  function toggleHiddenBySel(scope, id) {
    if (scope === 'global') ED.theme[id].hidden = !ED.theme[id].hidden;
    else if (scope === 'section') { const s = pageSections().find((x) => x.id === id); if (s) s.hidden = !s.hidden; }
    else if (scope === 'block') { /* id is blockId; section is current selection */ const s = pageSections().find((x) => x.id === ED.selection.sectionId) || globalBySel(ED.selection.sectionId); const bl = s && s.blocks.find((x) => x.id === id); if (bl) bl.hidden = !bl.hidden; }
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
  }
  function confirmDelete(rowEl) {
    let what = 'section', go;
    if (rowEl.hasAttribute('data-sel-sec')) { const id = rowEl.getAttribute('data-sel-sec'); go = () => removeSection(id); }
    else if (rowEl.hasAttribute('data-sel-blk')) { what = 'block'; const p = rowEl.getAttribute('data-sel-blk').split(':'); go = () => removeBlock(p[0], p[1]); }
    else return;
    openConfirm({ title: 'Delete ' + what + '?', body: 'This ' + what + ' and its settings will be removed from the page. This can be undone with Discard before you save.', okText: 'Delete', danger: true, onOk: go });
  }
  function removeSection(id) {
    const arr = pageSections(); const i = arr.findIndex((x) => x.id === id); if (i < 0) return;
    arr.splice(i, 1); if (ED.selection.kind === 'section' && ED.selection.sectionId === id) ED.selection = { kind: 'header' };
    markDirty(); refreshTree(); refreshRight(); refreshCanvas(); toast('Section removed');
  }
  function removeBlock(secId, blkId) {
    const s = pageSections().find((x) => x.id === secId) || globalBySel(secId); if (!s) return;
    const i = s.blocks.findIndex((x) => x.id === blkId); if (i < 0) return;
    s.blocks.splice(i, 1);
    ED.selection = (s === globalBySel(secId)) ? { kind: secId } : { kind: 'section', sectionId: secId };
    markDirty(); refreshTree(); refreshRight(); refreshCanvas(); toast('Block removed');
  }
  function addBlock(secId, anchor) {
    const s = pageSections().find((x) => x.id === secId) || globalBySel(secId); if (!s) return;
    const def = SECTIONS[s.kind]; if (!def || !def.blocks) return;
    if (def.blocks.kinds) { openBlockKindMenu(anchor, s, def); return; }
    const max = def.blocks.max || 99; if (s.blocks.length >= max) { toast('Max ' + max + ' blocks', 'err'); return; }
    const nb = { id: uid('blk'), kind: def.blocks.kind || 'item', hidden: false, settings: blockDefaults(def.blocks) };
    s.blocks.push(nb); ED.selection = { kind: 'block', sectionId: secId, blockId: nb.id }; ED.sectionExpand[secId] = true;
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
  }
  function openBlockKindMenu(anchor, s, def) {
    closePops(); const layer = h('<div class="pop-layer"></div>'); const pop = h('<div class="menu-pop" style="min-width:200px"></div>');
    pop.innerHTML = Object.keys(def.blocks.kinds).map((bk) => '<div class="opt" data-bk="' + bk + '">' + esc(def.blocks.kinds[bk].name) + '</div>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('[data-bk]').forEach((o) => o.onclick = () => {
      const bk = o.getAttribute('data-bk'); const bd = def.blocks.kinds[bk];
      const max = def.blocks.max || 99; if (s.blocks.length >= max) { toast('Max ' + max + ' blocks', 'err'); closePops(); return; }
      const nb = { id: uid('blk'), kind: bk, hidden: false, settings: blockDefaults(bd) }; s.blocks.push(nb);
      ED.selection = { kind: 'block', sectionId: s.id, blockId: nb.id }; closePops(); markDirty(); refreshTree(); refreshRight(); refreshCanvas();
    });
    closeOnOutside(pop, anchor);
  }
  function addSectionKind(kind) {
    const def = SECTIONS[kind]; if (!def) { toast('“' + kind + '” isn’t available yet', 'err'); return; }
    const inst = matSection({ kind: kind });
    pageSections().push(inst); ED.selection = { kind: 'section', sectionId: inst.id }; ED.expand.template = true;
    markDirty(); refreshTree(); refreshRight(); refreshCanvas();
    const sc = document.getElementById('os-cscroll'); if (sc) sc.scrollTop = sc.scrollHeight;
    toast('Added ' + def.name);
  }

  // -------------------------------------------------------------- drag reorder
  let dragInfo = null;
  function wireDrag(tree) {
    tree.querySelectorAll('[data-sel-sec],[data-sel-blk]').forEach((row) => {
      row.addEventListener('dragstart', (e) => {
        if (row.hasAttribute('data-sel-sec')) dragInfo = { type: 'sec', id: row.getAttribute('data-sel-sec') };
        else { const p = row.getAttribute('data-sel-blk').split(':'); dragInfo = { type: 'blk', secId: p[0], id: p[1] }; }
        e.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging');
      });
      row.addEventListener('dragend', () => { row.classList.remove('dragging'); clearDrop(); dragInfo = null; });
      row.addEventListener('dragover', (e) => {
        if (!dragInfo) return;
        const isSec = row.hasAttribute('data-sel-sec');
        if (dragInfo.type === 'sec' && !isSec) return;
        if (dragInfo.type === 'blk' && (!row.hasAttribute('data-sel-blk') || row.getAttribute('data-sel-blk').split(':')[0] !== dragInfo.secId)) return;
        e.preventDefault(); const r = row.getBoundingClientRect(); const after = e.clientY > r.top + r.height / 2;
        clearDrop(); row.classList.add(after ? 'drop-after' : 'drop-before');
      });
      row.addEventListener('drop', (e) => {
        if (!dragInfo) return; e.preventDefault();
        const after = row.classList.contains('drop-after');
        if (dragInfo.type === 'sec' && row.hasAttribute('data-sel-sec')) reorderSection(dragInfo.id, row.getAttribute('data-sel-sec'), after);
        else if (dragInfo.type === 'blk' && row.hasAttribute('data-sel-blk')) { const tp = row.getAttribute('data-sel-blk').split(':'); if (tp[0] === dragInfo.secId) reorderBlock(dragInfo.secId, dragInfo.id, tp[1], after); }
        clearDrop();
      });
    });
  }
  function clearDrop() { document.querySelectorAll('.drop-before,.drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after')); }
  function reorderArr(arr, fromId, toId, after) {
    const from = arr.findIndex((x) => x.id === fromId); const to = arr.findIndex((x) => x.id === toId); if (from < 0 || to < 0 || fromId === toId) return;
    const [m] = arr.splice(from, 1); let ins = arr.findIndex((x) => x.id === toId); ins = ins + (after ? 1 : 0); arr.splice(ins, 0, m);
  }
  function reorderSection(fromId, toId, after) { reorderArr(pageSections(), fromId, toId, after); markDirty(); refreshTree(); refreshCanvas(); }
  function reorderBlock(secId, fromId, toId, after) { const s = pageSections().find((x) => x.id === secId) || globalBySel(secId); if (!s) return; reorderArr(s.blocks, fromId, toId, after); markDirty(); refreshTree(); refreshCanvas(); }

  // -------------------------------------------------------------- add-section popover
  function openAddSection(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>'); const pop = h('<div class="os-addpop"></div>');
    pop.innerHTML =
      '<div class="os-addpop-search"><input class="os-input" id="os-addsearch" placeholder="Search sections"></div>' +
      '<div class="os-addpop-body"><div class="os-addpop-list" id="os-addlist"></div>' +
      '<div class="os-addpop-prev" id="os-addprev"></div></div>' +
      '<div class="os-addpop-foot"><span id="os-addcount"></span><span>Esc to close</span></div>';
    layer.appendChild(pop); document.body.appendChild(layer);
    positionPop(pop, anchor, 640, 470);
    const renderAdd = (q) => {
      q = (q || '').toLowerCase();
      let total = 0, avail = 0, html = '';
      D.CATALOG.forEach((g) => {
        const ents = g.entries.filter((e) => !q || (e.name + ' ' + e.desc).toLowerCase().indexOf(q) >= 0);
        if (!ents.length) return;
        html += '<div class="os-addgrp">' + esc(g.label) + '</div>';
        ents.forEach((e) => {
          total++; const ok = !!SECTIONS[e.kind]; if (ok) avail++;
          html += '<div class="os-addrow' + (ok ? '' : ' soon') + '" data-add-kind="' + esc(e.kind) + '" data-name="' + esc(e.name) + '" data-desc="' + esc(e.desc) + '">' +
            '<div class="os-add-ico">' + ICON(ok ? SECTIONS[e.kind].icon : 'layers') + '</div>' +
            '<div style="min-width:0"><div class="os-add-name">' + esc(e.name) + (ok ? '' : ' <span class="os-soon">Soon</span>') + '</div>' +
            '<div class="os-add-desc">' + esc(e.desc) + '</div></div></div>';
        });
      });
      const list = pop.querySelector('#os-addlist'); list.innerHTML = html || '<div class="os-info" style="padding:12px">No sections match.</div>';
      pop.querySelector('#os-addcount').textContent = countAvailable() + ' of ' + catalogTotal() + ' section types available';
      list.querySelectorAll('.os-addrow').forEach((rw) => {
        rw.onmouseenter = () => showAddPreview(rw);
        rw.onclick = () => { if (rw.classList.contains('soon')) return; addSectionKind(rw.getAttribute('data-add-kind')); closePops(); };
      });
      const first = list.querySelector('.os-addrow'); if (first) showAddPreview(first);
    };
    const showAddPreview = (rw) => {
      pop.querySelectorAll('.os-addrow').forEach((x) => x.classList.remove('hover')); rw.classList.add('hover');
      const ok = !rw.classList.contains('soon'); const kind = rw.getAttribute('data-add-kind');
      pop.querySelector('#os-addprev').innerHTML = '<div class="os-addprev-art">' + ICON(ok && SECTIONS[kind] ? SECTIONS[kind].icon : 'image') + '</div>' +
        '<div class="os-addprev-name">' + esc(rw.getAttribute('data-name')) + '</div>' +
        '<div class="os-addprev-desc">' + esc(rw.getAttribute('data-desc')) + '</div>' +
        (ok ? '<button class="btn btn-primary" data-add-go="' + esc(kind) + '">Add ' + esc(rw.getAttribute('data-name')) + '</button>' : '<div class="os-soon-note">Coming in a later release.</div>');
      const go = pop.querySelector('[data-add-go]'); if (go) go.onclick = () => { addSectionKind(go.getAttribute('data-add-go')); closePops(); };
    };
    renderAdd('');
    const si = pop.querySelector('#os-addsearch'); si.oninput = () => renderAdd(si.value); setTimeout(() => si.focus(), 20);
    closeOnOutside(pop, anchor);
  }
  function catalogTotal() { let n = 0; D.CATALOG.forEach((g) => n += g.entries.length); return n; }

  // -------------------------------------------------------------- resource picker (product/collection/menu/blog/page)
  function openPicker(kind, current, onPick) {
    const S = D.SAMPLE; const multi = kind === 'product';
    let items = kind === 'product' ? S.products : kind === 'collection' ? S.collections : kind === 'menu' ? S.menus : kind === 'blog' ? S.blogs : S.pages;
    const nameOf = (it) => it.title || it.name;
    const sel = new Set(multi ? (Array.isArray(current) ? current : []) : (current ? [current] : []));
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="drawer"></div>');
    m.innerHTML = '<div class="drawer-head">Select ' + esc(kind) + (multi ? 's' : '') + '<span class="drawer-x">' + I.x + '</span></div>' +
      '<div class="drawer-body" id="pk-body"></div>' +
      '<div class="drawer-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-primary" data-ok>Done</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const body = m.querySelector('#pk-body');
    const draw = () => {
      body.innerHTML = items.map((it) => '<label class="os-pk-row"><input type="' + (multi ? 'checkbox' : 'radio') + '" ' + (sel.has(it.id) ? 'checked' : '') + ' data-id="' + esc(it.id) + '">' +
        (it.image ? '<span class="os-pk-thumb" style="background-image:url(' + esc(it.image) + ')"></span>' : '<span class="os-pk-thumb gen">' + ICON('layers') + '</span>') +
        '<span class="os-pk-name">' + esc(nameOf(it)) + (it.price ? ' · ' + money(it.price) : it.count != null ? ' · ' + it.count + ' items' : '') + '</span></label>').join('');
      body.querySelectorAll('input').forEach((inp) => inp.onchange = () => { const id = inp.getAttribute('data-id'); if (multi) { inp.checked ? sel.add(id) : sel.delete(id); } else { sel.clear(); sel.add(id); } });
    };
    draw();
    const close = () => back.remove();
    m.querySelector('.drawer-x').onclick = close; m.querySelector('[data-cancel]').onclick = close;
    back.onclick = (e) => { if (e.target === back) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); onPick(multi ? Array.from(sel) : (Array.from(sel)[0] || '')); };
  }

  // -------------------------------------------------------------- page-type menu
  function openPageMenu(anchor) {
    closePops(); const layer = h('<div class="pop-layer"></div>'); const pop = h('<div class="menu-pop" style="min-width:180px"></div>');
    pop.innerHTML = D.PAGE_OPTIONS.map((p) => '<div class="opt" data-pt="' + p.value + '"' + (p.value === ED.currentPage ? ' style="color:var(--brand);font-weight:600"' : '') + '>' + esc(p.label) + '</div>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('[data-pt]').forEach((o) => o.onclick = () => { closePops(); switchPage(o.getAttribute('data-pt')); });
    closeOnOutside(pop, anchor);
  }
  function switchPage(pt) {
    if (pt === ED.currentPage) return;
    ED.currentPage = pt; if (ED.selection.kind === 'section' || ED.selection.kind === 'block') ED.selection = { kind: 'header' };
    ED.leftMode = 'sections'; rerender();
  }

  // ==========================================================================
  //  SAVE / DISCARD / PUBLISH  (+ validation)
  // ==========================================================================
  function onSave() {
    if (!isDirty()) return; ED.busy = 'saving'; refreshTop();
    setTimeout(() => { ED.savedTheme = clone(ED.theme); ED.meta.updated_time = nowStr(); ED.busy = null; refreshTop(); toast('Draft saved'); }, 360);
  }
  function onDiscard() {
    openConfirm({ title: 'Discard changes?', body: 'Are you sure you want to revert to the last saved state? Your unsaved changes will be lost.', okText: 'Discard', danger: true,
      onOk: () => { ED.theme = clone(ED.savedTheme); if (!findSel()) ED.selection = { kind: 'header' }; rerender(); toast('Reverted to last saved state'); } });
  }
  function onPublish() {
    if (!isDirty() && !hasDraft()) return;
    const issues = validate();
    if (issues.length) { openIssues(issues); return; }
    ED.busy = 'publishing'; refreshTop();
    setTimeout(() => { if (isDirty()) ED.savedTheme = clone(ED.theme); ED.publishedTheme = clone(ED.savedTheme); ED.busy = null; refreshTop(); toast('Published to storefront'); }, 480);
  }
  function validate() {
    const out = [];
    if (!ED.theme.name || !ED.theme.name.trim()) out.push({ where: 'Theme', msg: 'Theme name is required' });
    const checkInst = (inst, label) => {
      if (inst.hidden) return; const def = SECTIONS[inst.kind]; if (!def) return;
      (def.schema || []).forEach((f) => { if (f.key && f.required && isMissing(inst.settings[f.key])) out.push({ where: label, msg: f.label + ' is required' }); });
      (inst.blocks || []).forEach((bl, i) => { if (bl.hidden) return; const bd = blockDef(def, bl.kind); (bd && bd.fields || []).forEach((f) => { if (f.key && f.required && isMissing(bl.settings[f.key])) out.push({ where: label + ' · ' + (bd.name || 'Block') + ' #' + (i + 1), msg: f.label + ' is required' }); }); });
    };
    checkInst(ED.theme.announcement, 'Announcement bar'); checkInst(ED.theme.header, 'Header'); checkInst(ED.theme.footer, 'Footer');
    Object.keys(ED.theme.templates).forEach((pg) => { const pl = (D.PAGE_OPTIONS.find((p) => p.value === pg) || {}).label || pg; ED.theme.templates[pg].sections.forEach((s, i) => { if (s.hidden) return; const def = SECTIONS[s.kind]; checkInst(s, pl + ' · ' + (def ? def.name : s.kind) + ' #' + (i + 1)); }); });
    return out;
  }
  function isMissing(v) { return v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length); }
  function openIssues(issues) {
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="modal" style="width:480px"></div>');
    m.innerHTML = '<div class="modal-head">Fix ' + issues.length + ' issue' + (issues.length > 1 ? 's' : '') + ' before publishing</div>' +
      '<div class="modal-body"><div class="os-issues">' + issues.slice(0, 12).map((x) => '<div class="os-issue"><span class="os-issue-w">' + esc(x.where) + '</span><span>' + esc(x.msg) + '</span></div>').join('') + (issues.length > 12 ? '<div class="os-info">…and ' + (issues.length - 12) + ' more</div>' : '') + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-primary" data-ok>Got it</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove(); m.querySelector('[data-ok]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
  }

  // -------------------------------------------------------------- leave interception
  function attemptLeave(proceed) {
    if (!ED || !isDirty()) { proceed(); return; }
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML = '<div class="modal-head">Leave with unsaved changes?</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">You have unsaved changes. Save them before you leave, or discard and exit.</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn btn-default" data-discard>Discard &amp; leave</button><button class="btn btn-primary" data-save>Save &amp; leave</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove();
    m.querySelector('[data-cancel]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
    m.querySelector('[data-discard]').onclick = () => { close(); proceed(); };
    m.querySelector('[data-save]').onclick = () => { close(); ED.savedTheme = clone(ED.theme); proceed(); };
  }

  // -------------------------------------------------------------- confirm modal
  function openConfirm(o) {
    const back = h('<div class="modal-backdrop" style="z-index:240"></div>'); const m = h('<div class="modal"></div>');
    m.innerHTML = '<div class="modal-head">' + esc(o.title) + '</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">' + esc(o.body) + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(o.okText || 'OK') + '</button></div>';
    back.appendChild(m); document.body.appendChild(back);
    const close = () => back.remove();
    m.querySelector('[data-cancel]').onclick = close; back.onclick = (e) => { if (e.target === back) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); o.onOk && o.onOk(); };
  }

  // ==========================================================================
  //  REFRESHERS
  // ==========================================================================
  function rerender() { renderBuilder(ED.meta.handle); }
  function refreshTop() { const b = document.getElementById('os-builder'); if (!b) return; const old = b.querySelector('.os-top'); const nw = topBar(); old.replaceWith(nw); wireTop(); }
  function refreshTree() { const b = document.getElementById('os-builder'); if (!b) return; const old = b.querySelector('.os-left'); const nw = leftPanel(); old.replaceWith(nw); wireLeft(); }
  function refreshRight() { const b = document.getElementById('os-builder'); if (!b) return; const old = b.querySelector('.os-right'); const nw = rightPanel(); old.replaceWith(nw); if (ED.leftMode === 'settings' || ED.selection.kind === 'theme-settings') wireSettings(); else wireRight(); }
  function refreshCanvas() { const fr = document.getElementById('os-frame'); if (!fr) return; fr.className = 'os-frame ' + ED.device; fr.innerHTML = canvasHtml(); wireCanvas(); applyHighlight(); const bar = document.querySelector('.os-canvas-bar'); if (bar) bar.textContent = 'Live preview · ' + pageLabel() + ' · ' + (ED.device === 'desktop' ? 'Desktop' : 'Mobile'); }
  function refreshAffectedCanvas() {
    const sel = ED.selection;
    if (sel.kind === 'header' || sel.kind === 'footer' || sel.kind === 'announcement') return refreshCanvas();
    refreshCanvas(); // section/block edits: simplest correct path is a full canvas refresh
  }
  function applyHighlight() {
    const fr = document.getElementById('os-frame'); if (!fr) return;
    fr.querySelectorAll('.os-block-sel').forEach((x) => x.classList.remove('os-block-sel'));
    if (ED.selection.kind === 'block') { const el = fr.querySelector('[data-block-id="' + cssesc(ED.selection.blockId) + '"]'); if (el) el.classList.add('os-block-sel'); }
  }
  function cssesc(s) { return String(s).replace(/"/g, '\\"'); }
  function scrollToSelected() {
    const sc = document.getElementById('os-cscroll'); if (!sc) return; const sel = ED.selection;
    setTimeout(() => {
      if (sel.kind === 'header' || sel.kind === 'announcement') { sc.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      let el = null;
      if (sel.kind === 'section') el = sc.querySelector('[data-preview-id="section:' + cssesc(sel.sectionId) + '"]');
      else if (sel.kind === 'block') { const sEl = sc.querySelector('[data-block-id="' + cssesc(sel.blockId) + '"]'); el = sEl; }
      else if (sel.kind === 'footer') el = sc.querySelector('[data-csel-global="footer"]');
      if (el) { const r = el.getBoundingClientRect(); const sr = sc.getBoundingClientRect(); sc.scrollTo({ top: sc.scrollTop + (r.top - sr.top) - 10, behavior: 'smooth' }); }
    }, 30);
  }
  function findSel() {
    const sel = ED.selection;
    if (sel.kind === 'section') return pageSections().some((x) => x.id === sel.sectionId);
    if (sel.kind === 'block') { const s = pageSections().find((x) => x.id === sel.sectionId) || globalBySel(sel.sectionId); return s && s.blocks.some((x) => x.id === sel.blockId); }
    return true;
  }

  // -------------------------------------------------------------- popover utils
  function closePops() { document.querySelectorAll('.pop-layer').forEach((p) => p.remove()); }
  function closeOnOutside(pop, anchor) { setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && (!anchor || !anchor.contains(e.target))) { closePops(); document.removeEventListener('mousedown', hh); } }), 0); document.addEventListener('keydown', function kk(e) { if (e.key === 'Escape') { closePops(); document.removeEventListener('keydown', kk); } }); }
  function positionPop(pop, anchor, w, hh) {
    const r = anchor.getBoundingClientRect(); pop.style.width = w + 'px';
    let left = Math.min(r.left, window.innerWidth - w - 16); let top = Math.min(Math.max(r.top, 64), window.innerHeight - hh - 16);
    pop.style.left = Math.max(8, left) + 'px'; pop.style.top = top + 'px';
  }
  function nowStr() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }

  // ==========================================================================
  //  ROUTER / SIDEBAR
  // ==========================================================================
  function route(rest) {
    closePops();
    const m = (rest || '').match(/^edit\/(.+)$/);
    if (m) { ensureSections().then(() => renderBuilder(decodeURIComponent(m[1]))); }
    else renderList();
  }
  window.VIEWS = window.VIEWS || {};
  window.VIEWS['online-store'] = { render: function (el, rest) { root = el; route(rest || ''); }, unmount: function () { closeBuilder(); } };

  // upgrade the sidebar entry to active (mirrors the prior prototype's helper)
  function activateSidebar() {
    const aside = document.querySelector('aside.app-sidebar'); if (!aside) return false;
    const node = [...aside.querySelectorAll('.nav-item')].find((n) => { const s = n.querySelector('span:not(.nav-soon)'); return s && s.textContent.trim() === 'Online store'; });
    if (!node || (node.tagName === 'A' && node.classList.contains('active'))) return !!node;
    return true;
  }
  if (!activateSidebar()) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activateSidebar); else setTimeout(activateSidebar, 0); }

  // ==========================================================================
  //  STYLES
  // ==========================================================================
  const STYLE_ID = 'os-style';
  function ensureStyles() { if (document.getElementById(STYLE_ID)) return; const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st); }
  var CSS = `
  /* theme list */
  .os-list{max-width:1100px;margin:0 auto;padding:16px 30px 40px}
  .os-theme-cards{display:flex;flex-direction:column;gap:24px}
  .os-theme-card{border:1px solid var(--hair);border-radius:12px;overflow:hidden;background:#fff}
  .os-theme-prev{display:flex;gap:18px;background:var(--panel);padding:20px;overflow:hidden}
  .os-prev-pc{flex:1 1 auto;min-width:0;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:#fff}
  .os-prev-pc img,.os-prev-h5 img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .os-prev-h5{width:30%;min-width:220px;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:#fff}
  @media (max-width:1023px){.os-prev-h5{display:none}}
  .os-theme-meta{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px}
  .os-theme-name{font-size:16px;font-weight:600;color:var(--ink)}
  .os-theme-saved{font-size:13px;color:var(--ink-muted);margin-top:6px}

  /* builder shell */
  .os-builder{position:fixed;inset:0;z-index:140;background:var(--page);display:flex;flex-direction:column;font-size:14px;color:var(--ink)}
  .os-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--hair);background:#fff;flex-shrink:0}
  .os-top-l{display:flex;align-items:center;gap:12px;min-width:0}
  .os-top-c{display:flex;align-items:center;gap:10px;justify-content:center}
  .os-top-r{display:flex;align-items:center;gap:8px;justify-self:end}
  .os-rail{display:inline-flex;background:var(--panel);border-radius:8px;padding:3px;gap:2px}
  .os-rail-b{width:32px;height:28px;border:0;background:none;color:var(--ink-muted);border-radius:6px;display:grid;place-items:center;cursor:pointer}
  .os-rail-b.on{background:#fff;color:var(--brand);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .os-tname{font-size:13.5px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
  .os-pagesel{display:flex;align-items:center;justify-content:space-between;gap:8px;height:32px;padding:0 10px;border:1px solid var(--ctl);border-radius:8px;background:#fff;font-size:13px;color:var(--ink);min-width:170px;cursor:pointer}
  .os-pagesel:hover{border-color:var(--brand)}
  .os-pagesel span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-dev{display:inline-flex;background:var(--panel);border-radius:8px;padding:3px;gap:2px}
  .os-dev button{width:32px;height:28px;border:0;background:none;color:var(--ink-muted);border-radius:6px;display:grid;place-items:center;cursor:pointer}
  .os-dev button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .btn-warn{background:#f59e0b;color:#fff}.btn-warn:hover{background:#e08c08}
  .btn-danger{background:var(--err);color:#fff}.btn-danger:hover{background:#b3401f}
  .os-top .btn[disabled]{opacity:.45;cursor:not-allowed}
  .os-body{flex:1;min-height:0;display:grid;grid-template-columns:300px 1fr 340px;overflow:hidden}

  /* left tree */
  .os-left{border-right:1px solid var(--hair);display:flex;flex-direction:column;min-height:0;background:#fff}
  .os-left-head{padding:12px 16px;font-size:13px;font-weight:600;color:var(--ink);border-bottom:1px solid var(--hair);flex-shrink:0}
  .os-left-scroll{flex:1;overflow:auto;padding:8px}
  .os-tree-note{font-size:12px;color:var(--ink-muted);line-height:1.55;background:var(--panel);border-radius:8px;padding:9px 11px;margin:4px 4px 10px}
  .os-tree-row{display:flex;align-items:center;gap:9px;padding:8px 8px;border-radius:8px;cursor:pointer;color:var(--ink-body);font-size:13.5px}
  .os-tree-row:hover{background:var(--panel)}
  .os-grp-head{display:flex;align-items:center;gap:6px;padding:9px 8px 6px;font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-muted);cursor:pointer}
  .os-caret{display:inline-flex;color:var(--ink-muted);transition:transform .15s}.os-caret.open{transform:rotate(90deg)}
  .os-row{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;color:var(--ink-body);position:relative}
  .os-row:hover{background:var(--panel)}
  .os-row.active{background:#e6f0ff;color:var(--brand);font-weight:600}
  .os-row.active .os-tr-ico{color:var(--brand)}
  .os-row.hid .os-tr-name{text-decoration:line-through;opacity:.7}
  .os-row.blk{padding-left:24px}
  .os-tr-ico{width:18px;height:18px;flex:none;color:var(--ink-muted);display:inline-flex}.os-tr-ico.sm{width:15px;height:15px}
  .os-tr-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-row-caret{width:16px;display:inline-flex;color:var(--ink-muted);transition:transform .15s;flex:none}.os-row-caret.open{transform:rotate(90deg)}.os-row-caret.ghost{visibility:hidden}
  .os-tr-acts{display:flex;gap:1px;opacity:0;flex:none}
  .os-row:hover .os-tr-acts,.os-row.hid .os-tr-acts{opacity:1}
  .os-tr-act{width:22px;height:22px;display:grid;place-items:center;color:var(--ink-muted);border-radius:6px;cursor:pointer}
  .os-tr-act:hover{background:#fff;color:var(--ink)}.os-tr-act.danger:hover{color:var(--err)}
  .os-tr-grip{color:#c4cad3;cursor:grab;display:inline-flex;flex:none;opacity:0}
  .os-row:hover .os-tr-grip{opacity:1}
  .os-tr-lock{color:#c4cad3;display:inline-flex;flex:none;margin-left:2px}
  .os-tree-add{display:flex;align-items:center;gap:6px;padding:8px;margin:4px 0 2px;border:1px dashed var(--ctl);border-radius:8px;color:var(--brand);font-size:13px;cursor:pointer}
  .os-tree-add:hover{background:var(--brand-50)}.os-tree-add.sub{margin-left:20px;font-size:12.5px;padding:6px 8px}
  .os-add-n{color:var(--ink-muted);font-size:12px}
  .os-row.dragging{opacity:.4}
  .os-row.drop-before::before,.os-row.drop-after::before{content:'';position:absolute;left:8px;right:8px;height:2px;background:var(--brand);border-radius:2px}
  .os-row.drop-before::before{top:-1px}.os-row.drop-after::before{bottom:-1px}

  /* center canvas */
  .os-center{display:flex;flex-direction:column;min-height:0;background:#eef0f3}
  .os-canvas-bar{flex-shrink:0;padding:7px 14px;font-size:12px;color:var(--ink-muted);background:#f7f8fa;border-bottom:1px solid var(--hair)}
  .os-canvas-scroll{flex:1;overflow:auto;padding:20px;display:flex;justify-content:center;align-items:flex-start}
  .os-frame{width:100%;max-width:1080px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.08);border-radius:4px;overflow:hidden;transition:max-width .2s}
  .os-frame.mobile{max-width:390px}
  .os-sec{position:relative;outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color .12s}
  .os-sec:hover{outline-color:#b9d2ff}.os-sec.active{outline-color:var(--brand)}
  .os-sec-tag{position:absolute;top:0;left:0;z-index:4;background:var(--brand);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-bottom-right-radius:6px;opacity:0;pointer-events:none;transition:opacity .12s;letter-spacing:.02em}
  .os-sec:hover .os-sec-tag,.os-sec.active .os-sec-tag{opacity:1}
  .os-block-sel{outline:2px solid var(--brand);outline-offset:-2px}
  .os-empty-canvas{padding:64px 20px;text-align:center;color:#9aa3b0;font-size:13px;line-height:1.7}
  .os-render-err{margin:8px;padding:14px;background:#fff4f2;color:#b3401f;font-size:12.5px;border:1px solid #f3c9c0;border-radius:8px}

  /* right panel */
  .os-right{border-left:1px solid var(--hair);display:flex;flex-direction:column;min-height:0;background:#fff}
  .os-right-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--hair);flex-shrink:0}
  .os-rh-ico{width:32px;height:32px;flex:none;border-radius:8px;background:var(--panel);display:grid;place-items:center;color:var(--ink-muted)}
  .os-rh-title{font-size:14px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-rh-sub{font-size:12px;color:var(--ink-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-rh-vis{margin-left:auto;width:30px;height:30px;display:grid;place-items:center;border:0;background:none;color:var(--ink-muted);border-radius:6px;cursor:pointer;flex:none}
  .os-rh-vis:hover{background:var(--panel)}.os-rh-vis.off{color:#c4cad3}
  .os-expall{margin-left:auto;font-size:12.5px;color:var(--brand);border:0;background:none;cursor:pointer}
  .os-right-scroll{flex:1;overflow:auto;padding:12px 14px}
  .os-empty-right{padding:28px 22px;text-align:center;color:#9aa3b0;font-size:13px;line-height:1.7}
  .os-remove{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:36px;margin-top:14px;border:1px solid #f3c9c0;border-radius:8px;background:#fff;color:var(--err);font-size:13px;font-weight:500;cursor:pointer}
  .os-remove:hover{background:#fef4f2}

  /* fields */
  .os-fld{margin-bottom:12px}
  .os-fld-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .os-flabel{display:flex;align-items:center;font-size:12px;font-weight:600;color:var(--ink-body);margin-bottom:6px}
  .os-fld-row .os-flabel{margin-bottom:0}
  .os-req{color:var(--err);margin-left:2px}
  .os-fval{margin-left:auto;font-size:12px;color:var(--ink-muted);font-variant-numeric:tabular-nums}
  .os-fhint{font-size:11.5px;color:#8a93a1;margin-top:4px;line-height:1.5}
  .os-sub{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#9aa3b0;margin:16px 0 8px;padding-top:12px;border-top:1px solid #f0f2f5}
  .os-info{font-size:12px;color:#8a93a1;line-height:1.55;background:var(--panel);border-radius:8px;padding:9px 11px;margin-bottom:10px}
  .os-input{width:100%;height:34px;padding:0 10px;border:1px solid var(--ctl);border-radius:8px;font-size:13px;color:var(--ink);background:#fff;font-family:inherit}
  .os-input:focus{outline:none;border-color:var(--brand)}
  .os-ta{height:auto;min-height:72px;padding:8px 10px;line-height:1.5;resize:vertical}.os-ta.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
  .os-select{width:100%;height:34px;padding:0 8px;border:1px solid var(--ctl);border-radius:8px;font-size:13px;color:var(--ink);background:#fff;font-family:inherit;cursor:pointer}
  .os-select:focus{outline:none;border-color:var(--brand)}
  .os-seg2{display:flex;background:var(--panel);border-radius:8px;padding:3px;gap:2px}
  .os-seg2 button{flex:1;border:0;background:none;font-size:12px;font-weight:500;color:var(--ink-body);padding:6px 6px;border-radius:6px;cursor:pointer;font-family:inherit;white-space:nowrap}
  .os-seg2 button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
  .os-tg{width:38px;height:22px;border-radius:999px;background:#cfd5de;cursor:pointer;flex:none;position:relative;transition:background .15s}
  .os-tg.on{background:var(--brand)}
  .os-tg i{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}.os-tg.on i{left:18px}
  .os-range{width:100%;accent-color:var(--brand);cursor:pointer}
  .os-color{display:flex;align-items:center;gap:8px}
  .os-sw{width:32px;height:32px;border-radius:8px;border:1px solid var(--ctl);cursor:pointer;flex:none;position:relative;overflow:hidden}
  .os-sw input[type=color]{position:absolute;inset:0;opacity:0;cursor:pointer;border:0;padding:0}
  .os-sw.tsp{background:conic-gradient(#ccc 25%,#fff 0 50%,#ccc 0 75%,#fff 0)50%/12px 12px}
  .os-hex{flex:1;height:32px;border:1px solid var(--ctl);border-radius:8px;padding:0 10px;font-size:12.5px;font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--ink)}
  .os-hex:focus{outline:none;border-color:var(--brand)}
  .os-tbtn{width:32px;height:32px;border:1px solid var(--ctl);border-radius:8px;background:#fff;color:var(--ink-muted);font-size:12px;font-weight:700;cursor:pointer;flex:none}
  .os-tbtn.on{border-color:var(--brand);color:var(--brand);background:var(--brand-50)}
  .os-img-box{display:flex;align-items:center;justify-content:center;gap:6px;height:60px;border:1px dashed var(--ctl);border-radius:8px;color:var(--ink-muted);font-size:12.5px;margin-bottom:6px}
  .os-img-prev{height:80px;border-radius:8px;background-size:cover;background-position:center;margin-bottom:6px;border:1px solid var(--hair)}
  .os-picker{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;height:34px;padding:0 10px;border:1px solid var(--ctl);border-radius:8px;background:#fff;font-size:13px;color:var(--ink);cursor:pointer;font-family:inherit}
  .os-picker:hover{border-color:var(--brand)}.os-picker span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* settings groups */
  .os-set-grp{border:1px solid var(--hair);border-radius:8px;margin-bottom:8px;overflow:hidden}
  .os-set-head{display:flex;align-items:center;gap:8px;padding:10px;cursor:pointer}
  .os-set-grp.open .os-set-head{background:var(--panel)}
  .os-set-h-txt{flex:1;min-width:0}
  .os-set-name{font-size:13px;font-weight:600;color:var(--ink)}
  .os-set-desc{font-size:11.5px;color:var(--ink-muted);margin-top:1px}
  .os-set-n{font-size:11px;color:var(--ink-muted);flex:none}
  .os-set-body{padding:8px 10px 10px}

  /* add-section popover */
  .os-addpop{position:fixed;z-index:61;background:#fff;border:1px solid var(--hair);border-radius:12px;box-shadow:var(--float-shadow);display:flex;flex-direction:column;overflow:hidden;pointer-events:auto;max-height:470px}
  .os-addpop-search{padding:12px;border-bottom:1px solid var(--hair)}
  .os-addpop-body{flex:1;min-height:0;display:grid;grid-template-columns:1fr 240px;overflow:hidden}
  .os-addpop-list{overflow:auto;padding:8px;border-right:1px solid var(--hair)}
  .os-addpop-prev{padding:16px;display:flex;flex-direction:column;gap:8px;overflow:auto}
  .os-addgrp{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#9aa3b0;padding:10px 6px 4px}
  .os-addrow{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer}
  .os-addrow:hover,.os-addrow.hover{background:var(--panel)}.os-addrow.soon{opacity:.55;cursor:default}
  .os-add-ico{width:30px;height:30px;flex:none;border-radius:7px;background:var(--panel);display:grid;place-items:center;color:var(--ink-muted)}
  .os-add-name{font-size:13px;font-weight:600;color:var(--ink)}
  .os-add-desc{font-size:11.5px;color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .os-soon{font-size:10px;color:#9aa3b0;border:1px solid var(--hair);border-radius:4px;padding:0 4px;margin-left:4px;font-weight:500}
  .os-addprev-art{height:120px;border-radius:8px;background:var(--panel);display:grid;place-items:center;color:#c4cad3}
  .os-addprev-art svg{width:34px;height:34px}
  .os-addprev-name{font-size:15px;font-weight:600;color:var(--ink)}
  .os-addprev-desc{font-size:12.5px;color:var(--ink-body);line-height:1.5}
  .os-soon-note{font-size:12px;color:var(--ink-muted)}
  .os-addpop-foot{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-top:1px solid var(--hair);font-size:11.5px;color:var(--ink-muted)}

  /* resource picker rows */
  .os-pk-row{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--hair);cursor:pointer;font-size:13.5px;color:var(--ink-body)}
  .os-pk-row input{accent-color:var(--brand);width:16px;height:16px;flex:none}
  .os-pk-thumb{width:40px;height:40px;border-radius:6px;background-size:cover;background-position:center;background-color:var(--panel);flex:none}
  .os-pk-thumb.gen{display:grid;place-items:center;color:var(--ink-muted)}
  .os-pk-name{flex:1;min-width:0}

  /* publish issues */
  .os-issues{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow:auto}
  .os-issue{display:flex;gap:8px;font-size:13px;color:var(--ink-body);line-height:1.5}
  .os-issue-w{font-weight:600;color:var(--ink);flex:none}

  /* toast */
  .os-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;z-index:300;box-shadow:var(--float-shadow);display:flex;align-items:center;gap:8px}
  .os-toast i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
  .os-toast.err{background:#b3261e}.os-toast.err i{background:#fff}

  /* shared storefront product card */
  .oc-card{min-width:0}
  .oc-img{position:relative;background-position:center;background-repeat:no-repeat;background-color:#f1f2f4;margin-bottom:10px;overflow:hidden}
  .oc-badge{position:absolute;top:8px;left:8px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;z-index:2}
  .oc-quick{position:absolute;left:10px;right:10px;bottom:10px;display:flex;align-items:center;justify-content:center;border-radius:6px;opacity:0;transition:opacity .15s}
  .oc-card:hover .oc-quick{opacity:1}
  .oc-sw{display:flex;gap:5px;margin-bottom:6px;justify-content:inherit}
  .oc-sw span{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.12)}
  .oc-vendor{font-size:11px;letter-spacing:.04em;text-transform:uppercase;margin-bottom:3px}
  .oc-title{font-weight:500;line-height:1.35;margin-bottom:4px}
  .oc-rate{display:flex;align-items:center;gap:4px;font-size:12px;color:#444;margin-bottom:4px;justify-content:inherit}
  .oc-rate svg{width:13px;height:13px}.oc-rate i{color:#999;font-style:normal}
  .oc-price{font-size:14px;font-weight:600;display:flex;gap:8px;align-items:baseline;justify-content:inherit}
  .oc-price s{color:#9aa3b0;font-weight:400;font-size:13px}
  `;
})();
