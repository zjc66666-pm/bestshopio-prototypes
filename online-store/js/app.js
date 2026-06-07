/* BestShopio Admin · Online store prototype — theme list + visual store builder (mock), hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file renders ONLY the module
   body into the passed `root`. Mirrors reference/bestvoy-admin onlineStore:
     - views/admin/onlineStore/pages/list.tsx       -> "My theme" tab + theme cards (PC+H5 preview, Edit)
     - views/admin/onlineStore/pages/themeEdit.tsx  -> full-screen editor: Back + page Select +
                                                        PC/Mobile Segmented + Discard/Save; micro-app canvas
     - views/admin/onlineStore/pages/pagePresets.ts -> per-page-type component presets + global shell
   The visual builder is a STATIC MOCK of the real wujie micro-app (its canvas is an opaque iframe in
   production); structure/labels/components match the presets so it reads true to the live editor. */
(function () {
  const D = window.DATA_ONLINE_STORE;
  let root; // set by the SPA shell router via VIEWS['online-store'].render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 16),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>', 14),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
    percent: svg('<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    layers: svg('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    tabs: svg('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M9 6V4M15 6V4"/>'),
    header: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'),
    footer: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18"/>'),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 14),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 14),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 14),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>', 16),
    searchSm: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', 16),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', 16),
    monitor: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', 15),
    smartphone: svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', 15),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', 14),
  };
  const ICO = (name) => I[name] || I.layers;

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:200;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ========================================================================
  //  SCOPED STYLES (module-specific; the builder has no shared theme classes)
  // ========================================================================
  const STYLE_ID = 'os-style';
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ========================================================================
  //  THEME LIST  (#/online-store)  — mirrors list.tsx
  // ========================================================================
  function renderList() {
    closeBuilder();
    ensureStyles();
    const cards = D.THEMES.map(themeCardHtml).join('');
    // list.tsx: a Tabs with a single "My theme" pane, then one card per theme, centered max 1435px.
    root.innerHTML =
      '<div class="os-list">' +
        '<div class="tabs os-theme-tabs"><div class="tab active">My theme</div></div>' +
        '<div class="os-theme-cards">' + cards + '</div>' +
      '</div>';

    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => goEdit(b.getAttribute('data-edit')));
  }

  function themeCardHtml(t) {
    // list.tsx card: previews on a #f7f7f8 panel (PC wide + H5 narrow≥lg), then meta row with
    // title (#242833), "Last saved: {updated_time}" (#4b5563) and a primary "Edit theme" button.
    return '<section class="os-theme-card" data-theme="' + esc(t.handle) + '">' +
      '<div class="os-theme-previews">' +
        '<div class="os-prev-pc"><img src="' + esc(t.pc_image) + '" alt="Desktop theme preview" loading="lazy" /></div>' +
        '<div class="os-prev-h5"><img src="' + esc(t.h5_image) + '" alt="Mobile theme preview" loading="lazy" /></div>' +
      '</div>' +
      '<div class="os-theme-meta">' +
        '<div style="min-width:0">' +
          '<h2 class="os-theme-name">' + esc(t.title || '-') + '</h2>' +
          '<p class="os-theme-saved">Last saved: ' + esc(t.updated_time || '-') + '</p>' +
        '</div>' +
        '<button class="btn btn-primary" data-edit="' + esc(t.handle) + '">Edit theme</button>' +
      '</div>' +
    '</section>';
  }

  // ========================================================================
  //  BUILDER  (#/online-store/edit/:handle)  — full-screen visual editor mock
  // ========================================================================
  let ED = null; // editor state (re-created when the builder opens)

  function startEditor(handle) {
    const theme = D.THEMES.find((t) => t.handle === handle) || D.THEMES[0];
    ED = {
      theme,
      pageType: 'HOME',
      viewport: 'pc',          // 'pc' | 'mobile' (matches editorViewportMode)
      sections: clone(D.PAGES.HOME),
      global: clone(D.GLOBAL),
      selected: null,          // { scope:'section', instanceId } | { scope:'global', componentId } | null
      leftTab: 'add',          // 'add' | 'layers'
      dirty: false,
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  const isComposable = () => ED.pageType === 'HOME'; // only Home composes from the add-section library
  function goEdit(handle) { location.hash = '#/online-store/edit/' + encodeURIComponent(handle); }

  function renderBuilder(handle) {
    if (!ED || ED.theme.handle !== handle) startEditor(handle);
    closeBuilder();
    ensureStyles();

    const b = h('<div class="os-builder" id="os-builder"></div>');
    b.appendChild(builderTopBar());
    const body = h('<div class="os-bld-body"></div>');
    body.appendChild(builderLeft());
    body.appendChild(builderCenter());
    body.appendChild(builderRight());
    b.appendChild(body);
    document.body.appendChild(b);

    wireBuilder();
  }

  function closeBuilder() { const ex = document.getElementById('os-builder'); if (ex) ex.remove(); }

  // ---- TOP BAR: 3-col grid (Back + page Select | PC/Mobile Segmented | Discard/Save) ----
  // Mirrors themeEdit.tsx header: gridTemplateColumns '1fr auto 1fr'.
  function builderTopBar() {
    const cur = D.PAGE_TYPES.find((p) => p.value === ED.pageType) || D.PAGE_TYPES[0];
    const top = h('<div class="os-bld-top"></div>');
    top.innerHTML =
      '<div class="os-top-left">' +
        '<button class="os-back" id="bld-back" title="Back to themes">' + I.arrowLeft + '<span>Back</span></button>' +
        '<div class="os-pagesel" id="bld-pagesel"><span>' + esc(cur.label) + '</span>' + I.chevDown + '</div>' +
      '</div>' +
      '<div class="os-seg" id="bld-seg">' +
        '<button data-vp="pc" class="' + (ED.viewport === 'pc' ? 'active' : '') + '">PC</button>' +
        '<button data-vp="mobile" class="' + (ED.viewport === 'mobile' ? 'active' : '') + '">Mobile</button>' +
      '</div>' +
      '<div class="os-top-right">' +
        '<button class="btn btn-default" id="bld-discard"' + (ED.dirty ? '' : ' disabled') + '>Discard</button>' +
        '<button class="btn btn-primary" id="bld-save"' + (ED.dirty ? '' : ' disabled') + '>Save</button>' +
      '</div>';
    return top;
  }

  // ---- LEFT PANEL (Add section library + Layers) ----
  function builderLeft() {
    const left = h('<div class="os-left"></div>');
    left.innerHTML =
      '<div class="os-left-tabs">' +
        '<div class="os-left-tab' + (ED.leftTab === 'add' ? ' active' : '') + '" data-lt="add">Add section</div>' +
        '<div class="os-left-tab' + (ED.leftTab === 'layers' ? ' active' : '') + '" data-lt="layers">Layers</div>' +
      '</div>' +
      '<div class="os-left-scroll" id="bld-left-scroll">' +
        (ED.leftTab === 'add' ? libraryHtml() : layersHtml()) +
      '</div>';
    return left;
  }

  function libraryHtml() {
    // Collections / Products are system pages: fixed sections, no add-section library (matches presets).
    if (!isComposable()) {
      return '<div class="os-sys-note">' +
        '<div class="os-sys-note-title">System page</div>' +
        '<div class="os-sys-note-body">The ' + esc(curPageLabel()) +
        ' page is generated from your products and collections. Its sections are fixed — switch to ' +
        '<b>Home page</b> to add and arrange sections.</div></div>';
    }
    const blocks = D.COMPONENT_LIBRARY.filter((c) => c.pages.indexOf(ED.pageType) !== -1);
    const groups = {};
    blocks.forEach((c) => { (groups[c.group] = groups[c.group] || []).push(c); });
    let html = '';
    Object.keys(groups).forEach((g) => {
      html += '<div class="os-lib-label">' + esc(g) + '</div>';
      html += groups[g].map((c) =>
        '<div class="os-block" data-add="' + esc(c.componentId) + '" title="Click to add to the page">' +
          '<div class="os-block-ico">' + ICO(c.icon) + '</div>' +
          '<div style="min-width:0">' +
            '<div class="os-block-name">' + esc(c.label) + '</div>' +
            '<div class="os-block-desc">' + esc(c.desc) + '</div>' +
          '</div>' +
          '<span class="os-grip">' + I.plus + '</span>' +
        '</div>').join('');
    });
    html += '<div class="os-left-hint">Drag-and-drop is mocked here — click a block to append it to the current page.</div>';
    return html;
  }

  function layersHtml() {
    const headerActive = ED.selected && ED.selected.scope === 'global' && ED.selected.componentId === 'storefront-header';
    const footerActive = ED.selected && ED.selected.scope === 'global' && ED.selected.componentId === 'storefront-footer';
    const top =
      '<div class="os-lib-label">Header</div>' +
      '<div class="os-layer fixed' + (headerActive ? ' active' : '') + '" data-gsel="storefront-header">' +
        '<div class="os-layer-ico">' + I.header + '</div><div class="os-layer-name">Header (global)</div>' +
        '<span class="os-layer-lock" title="Global section">' + I.lock + '</span></div>';
    const composable = isComposable();
    const secs =
      '<div class="os-lib-label" style="margin-top:6px">Page sections</div>' +
      ED.sections.map((s) => {
        const active = ED.selected && ED.selected.scope === 'section' && ED.selected.instanceId === s.instanceId;
        const fixed = !composable; // system pages: sections are not removable / reorderable
        return '<div class="os-layer' + (active ? ' active' : '') + (fixed ? ' fixed' : '') + '" data-sel="' + esc(s.instanceId) + '">' +
          '<div class="os-layer-ico">' + ICO(secIcon(s.componentId)) + '</div>' +
          '<div class="os-layer-name">' + esc(secLabel(s)) + '</div>' +
          (fixed
            ? '<span class="os-layer-lock" title="System section">' + I.lock + '</span>'
            : '<span class="os-layer-grip" title="Reorder (mock)">' + I.grip + '</span>') +
        '</div>';
      }).join('');
    const bottom =
      '<div class="os-lib-label" style="margin-top:6px">Footer</div>' +
      '<div class="os-layer fixed' + (footerActive ? ' active' : '') + '" data-gsel="storefront-footer">' +
        '<div class="os-layer-ico">' + I.footer + '</div><div class="os-layer-name">Footer (global)</div>' +
        '<span class="os-layer-lock" title="Global section">' + I.lock + '</span></div>';
    return top + secs + bottom;
  }

  function curPageLabel() { const p = D.PAGE_TYPES.find((x) => x.value === ED.pageType); return p ? p.label : ED.pageType; }
  function secIcon(componentId) {
    const c = D.COMPONENT_LIBRARY.find((x) => x.componentId === componentId);
    if (c) return c.icon;
    const sys = D.SYSTEM_SECTIONS[componentId];
    return sys ? sys.icon : 'layers';
  }
  function secLabel(s) {
    if (s.name) return s.name;
    const c = D.COMPONENT_LIBRARY.find((x) => x.componentId === s.componentId);
    if (c) return c.label;
    const sys = D.SYSTEM_SECTIONS[s.componentId];
    return sys ? sys.label : s.componentId;
  }

  // ---- CENTER (canvas) ----
  function builderCenter() {
    const center = h('<div class="os-center"></div>');
    center.innerHTML =
      '<div class="os-canvas-bar">Live preview · ' + esc(curPageLabel()) + ' · ' + (ED.viewport === 'pc' ? 'PC' : 'Mobile') + '</div>' +
      '<div class="os-canvas-scroll" id="bld-canvas-scroll">' +
        '<div class="os-frame ' + ED.viewport + '" id="bld-frame">' + canvasHtml() + '</div>' +
      '</div>';
    return center;
  }

  function canvasHtml() {
    const mob = ED.viewport === 'mobile';
    let html = '';
    html += sectionWrap('global', 'storefront-header', 'Header', headerMock(ED.global.header.settings, mob));
    ED.sections.forEach((s) => {
      html += sectionWrap('section', s.instanceId, secLabel(s), sectionMock(s, mob));
    });
    html += sectionWrap('global', 'storefront-footer', 'Footer', footerMock(ED.global.footer.settings, mob));
    return html;
  }

  function sectionWrap(scope, id, label, inner) {
    const active = ED.selected && (
      (scope === 'section' && ED.selected.scope === 'section' && ED.selected.instanceId === id) ||
      (scope === 'global' && ED.selected.scope === 'global' && ED.selected.componentId === id)
    );
    const attr = scope === 'global' ? 'data-csel-global="' + esc(id) + '"' : 'data-csel="' + esc(id) + '"';
    return '<div class="os-sec' + (active ? ' active' : '') + '" ' + attr + '>' +
      '<span class="os-sec-tag">' + esc(label) + '</span>' + inner + '</div>';
  }

  // ---------- storefront section mocks ----------
  function headerMock(s, mob) {
    const nav = (s.categories || []).map((c) =>
      '<span' + ((c.dropdownColumns && c.dropdownColumns.length) ? ' class="has-mega"' : '') + '>' + esc(c.label) + '</span>').join('');
    return '<div class="sf-utility">' + esc(s.utilityText) + ' <a>' + esc(s.utilityLinkText) + '</a></div>' +
      '<div class="sf-header">' +
        '<div class="sf-logo">' + esc(s.logoText) + '</div>' +
        '<div class="sf-nav">' + nav + '</div>' +
        '<div class="sf-icons">' + I.searchSm + I.user + I.cart + '</div>' +
      '</div>';
  }

  function sectionMock(s, mob) {
    switch (s.componentId) {
      case 'hero-carousel': return heroMock(s.settings, mob);
      case 'coupon-benefit-strip': return benefitMock(s.settings);
      case 'category-quick-entry-grid': return catGridMock(s.settings);
      case 'promo-product-floor': return promoMock(s.settings);
      case 'editorial-trend-floor': return promoMock(s.settings);
      case 'tabbed-product-floor': return tabbedMock(s.settings);
      // system (config-driven) sections — opaque in production; render a labeled placeholder.
      case 'product-list-page-header': return sysMock('Collection header', 'Title · breadcrumb · sort & filter bar', mob);
      case 'product-list-page-content': return sysGridMock('Collection product grid', mob);
      case 'product-detail-page-main': return pdpMainMock(mob);
      case 'product-detail-benefits-floor': return sysMock('Product benefits', 'Free shipping · 30-day returns · secure checkout', mob);
      case 'product-detail-recommendations-floor': return sysGridMock('You may also like', mob);
      default: return '<div class="sf-unknown">' + esc(s.componentId) + '</div>';
    }
  }

  function heroMock(s, mob) {
    const first = (s.slides || [])[0] || {};
    const dots = (s.slides || []).map((sl, i) => '<i class="' + (i === 0 ? 'on' : '') + '"></i>').join('');
    return '<div class="sf-hero' + (mob ? ' mob' : '') + '" style="background-image:url(' + esc(first.url) + ')">' +
      '<div class="sf-hero-inner">' +
        '<div class="sf-hero-eyebrow">' + esc(s.eyebrow) + '</div>' +
        '<div class="sf-hero-title">' + esc(s.title).replace(/\n/g, '<br>') + '</div>' +
        '<span class="sf-hero-cta">' + esc(s.ctaText) + '</span>' +
      '</div>' +
      '<div class="sf-dots">' + dots + '</div>' +
    '</div>';
  }

  function benefitMock(s) {
    const items = (s.benefits || []).map((b) =>
      '<div class="sf-benefit' + (b.variant === 'code' ? ' code' : '') + '">' +
        '<div class="b-title">' + esc(b.title) + '</div><div class="b-sub">' + esc(b.subtitle) + '</div></div>').join('');
    return '<div class="sf-benefits">' + items + '</div>';
  }

  function catGridMock(s) {
    const items = (s.items || []).map((it) =>
      '<div class="sf-cat" style="background-image:url(' + esc(it.url) + ')"><span class="lbl">' + esc(it.alt) + '</span></div>').join('');
    return '<div class="sf-cat-grid">' + items + '</div>';
  }

  function promoMock(s) {
    const items = (s.items || []).map((it) =>
      '<div class="sf-promo" style="background-image:url(' + esc(it.url) + ')"></div>').join('');
    return (s.title ? '<div class="sf-floor-title">' + esc(s.title) + '</div>' : '') + '<div class="sf-promo-grid">' + items + '</div>';
  }

  function tabbedMock(s) {
    const tabs = (s.tabs || []).map((t, i) => '<span class="' + (i === 0 ? 'on' : '') + '">' + esc(t.label) + '</span>').join('');
    const prods = (s.products || []).map((p) =>
      '<div class="sf-prod"><div class="ph" style="background-image:url(' + esc(p.url) + ')"></div>' +
        '<div class="nm">' + esc(p.name) + '</div>' +
        '<div class="pr">' + esc(p.price) + (p.compareAt ? '<s>' + esc(p.compareAt) + '</s>' : '') + '</div></div>').join('');
    return '<div class="sf-floor-title">' + esc(s.title) + '</div>' +
      '<div class="sf-tabs">' + tabs + '</div><div class="sf-prod-grid">' + prods + '</div>';
  }

  // system / config-driven section placeholders
  function sysMock(title, sub, mob) {
    return '<div class="sf-sys"><div class="sf-sys-title">' + esc(title) + '</div>' +
      '<div class="sf-sys-sub">' + esc(sub) + '</div></div>';
  }
  function sysGridMock(title, mob) {
    const cells = Array.from({ length: mob ? 4 : 8 }).map(() => '<div class="sf-sys-cell"></div>').join('');
    return '<div class="sf-floor-title">' + esc(title) + '</div><div class="sf-sys-grid">' + cells + '</div>';
  }
  function pdpMainMock(mob) {
    return '<div class="sf-pdp">' +
      '<div class="sf-pdp-gallery"></div>' +
      '<div class="sf-pdp-info">' +
        '<div class="sf-pdp-title">Linen-feel wide pants</div>' +
        '<div class="sf-pdp-price">$32.99 <s>$45.00</s></div>' +
        '<div class="sf-pdp-row"></div><div class="sf-pdp-row"></div>' +
        '<div class="sf-pdp-cta">ADD TO CART</div>' +
      '</div></div>';
  }

  function footerMock(s, mob) {
    const cols = (s.linkSections || []).map((sec) =>
      '<div class="sf-foot-col"><h5>' + esc(sec.title) + '</h5>' +
        (sec.links || []).map((l) => '<a>' + esc(l.label) + '</a>').join('') + '</div>').join('');
    const pay = (s.paymentMethods || []).map((p) => '<span>' + esc(p && p.value != null ? p.value : p) + '</span>').join('');
    const newsletter =
      '<div class="sf-foot-col"><h5>Newsletter</h5>' +
        '<p class="sf-foot-sub">' + esc(s.subscribeText) + '</p>' +
        '<div class="sf-pay">' + pay + '</div></div>';
    return '<div class="sf-footer">' +
      '<div class="sf-foot-cols">' + cols + newsletter + '</div>' +
      '<div class="sf-copy">' + esc(s.copyrightText) + '</div>' +
    '</div>';
  }

  // ---- RIGHT PANEL (settings for the selected section) ----
  function builderRight() {
    const right = h('<div class="os-right"></div>');
    right.innerHTML = rightInner();
    return right;
  }

  function rightInner() {
    if (!ED.selected) {
      return '<div class="os-right-head"><div class="ico">' + I.layers + '</div>' +
          '<div><div class="os-right-title">Section settings</div><div class="os-right-sub">Nothing selected</div></div></div>' +
        '<div class="os-empty-right">Select a section in the canvas or the Layers panel to edit its content and style.</div>';
    }
    if (ED.selected.scope === 'global') {
      const isHeader = ED.selected.componentId === 'storefront-header';
      const g = isHeader ? ED.global.header : ED.global.footer;
      return rightHead(isHeader ? 'header' : 'footer', isHeader ? 'Header' : 'Footer', 'Global · shown on every page') +
        '<div class="os-right-scroll">' + (isHeader ? headerForm(g.settings) : footerForm(g.settings)) + '</div>';
    }
    const s = ED.sections.find((x) => x.instanceId === ED.selected.instanceId);
    if (!s) return '<div class="os-empty-right">Section not found.</div>';
    const composable = isComposable();
    const lib = D.COMPONENT_LIBRARY.find((x) => x.componentId === s.componentId);
    const sys = D.SYSTEM_SECTIONS[s.componentId];
    const headIcon = lib ? lib.icon : (sys ? sys.icon : 'layers');
    const headSub = lib ? lib.label : (sys ? sys.label : s.componentId);
    const removeBtn = composable
      ? '<button class="os-remove" data-remove="' + esc(s.instanceId) + '">Remove section</button>'
      : '';
    return rightHead(headIcon, secLabel(s), headSub) +
      '<div class="os-right-scroll" id="bld-form">' + sectionForm(s) + removeBtn + '</div>';
  }

  function rightHead(icon, title, sub) {
    return '<div class="os-right-head"><div class="ico">' + ICO(icon) + '</div>' +
      '<div style="min-width:0"><div class="os-right-title">' + esc(title) + '</div>' +
        '<div class="os-right-sub">' + esc(sub) + '</div></div></div>';
  }

  // generic field builders ------------------------------------------------
  function fText(id, label, val, ph) {
    return '<div class="os-fld"><div class="os-fld-label">' + esc(label) + '</div>' +
      '<input class="input" data-f="' + id + '" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '" /></div>';
  }
  function fArea(id, label, val) {
    return '<div class="os-fld"><div class="os-fld-label">' + esc(label) + '</div>' +
      '<textarea class="input" data-f="' + id + '" rows="3">' + esc(val) + '</textarea></div>';
  }
  function fToggle(id, label, on) {
    return '<div class="os-fld os-fld-row"><div class="os-fld-label" style="margin-bottom:0">' + esc(label) + '</div>' +
      '<span class="os-toggle' + (on ? ' on' : '') + '" data-toggle="' + id + '"><i></i></span></div>';
  }

  // section-specific forms ------------------------------------------------
  function sectionForm(s) {
    const ss = s.settings;
    switch (s.componentId) {
      case 'hero-carousel':
        return fText('eyebrow', 'Eyebrow text', ss.eyebrow) +
          fArea('title', 'Headline', ss.title) +
          fText('ctaText', 'Button label', ss.ctaText) +
          '<div class="os-subhead">Slides (' + (ss.slides || []).length + ')</div>' +
          (ss.slides || []).map((sl, i) =>
            '<div class="os-rep">' +
              '<div class="os-rep-head"><img class="os-rep-thumb" src="' + esc(sl.url) + '" alt="" />Slide ' + (i + 1) +
                '<span class="x" data-del-slide="' + i + '" title="Remove">' + I.x + '</span></div>' +
              '<input class="os-mini" data-slide-alt="' + i + '" value="' + esc(sl.alt) + '" placeholder="Alt text" style="margin-bottom:6px" />' +
              '<input class="os-mini" data-slide-href="' + i + '" value="' + esc(sl.href) + '" placeholder="Link" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-slide>' + I.plus + ' Add slide</button>';

      case 'coupon-benefit-strip':
        return '<div class="os-subhead">Benefits (' + (ss.benefits || []).length + ')</div>' +
          (ss.benefits || []).map((b, i) =>
            '<div class="os-rep">' +
              '<div class="os-rep-head">Benefit ' + (i + 1) + ' · ' + esc(b.variant) +
                '<span class="x" data-del-benefit="' + i + '" title="Remove">' + I.x + '</span></div>' +
              '<input class="os-mini" data-ben-title="' + i + '" value="' + esc(b.title) + '" placeholder="Title" style="margin-bottom:6px" />' +
              '<input class="os-mini" data-ben-sub="' + i + '" value="' + esc(b.subtitle) + '" placeholder="Subtitle" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-benefit>' + I.plus + ' Add benefit</button>';

      case 'category-quick-entry-grid':
        return '<div class="os-subhead">Tiles (' + (ss.items || []).length + ')</div>' +
          (ss.items || []).map((it, i) =>
            '<div class="os-rep"><div class="os-rep-head"><img class="os-rep-thumb" src="' + esc(it.url) + '" alt="" />' +
              esc(it.alt) + '<span class="x" data-del-item="' + i + '" title="Remove">' + I.x + '</span></div>' +
              '<input class="os-mini" data-item-col="' + i + '" value="' + esc(it.collectionId) + '" placeholder="Collection" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-item>' + I.plus + ' Add tile</button>' +
          '<div class="os-left-hint">Tiles link to collections — pick from your store collections in the live editor.</div>';

      case 'promo-product-floor':
      case 'editorial-trend-floor': {
        const noun = s.componentId === 'editorial-trend-floor' ? 'image' : 'promo image';
        const del = s.componentId === 'editorial-trend-floor' ? 'data-del-trend' : 'data-del-promo';
        const add = s.componentId === 'editorial-trend-floor' ? 'data-add-trend' : 'data-add-promo';
        const hrefAttr = s.componentId === 'editorial-trend-floor' ? 'data-trend-href' : 'data-promo-href';
        return fText('title', 'Floor title', ss.title) +
          '<div class="os-subhead">' + (s.componentId === 'editorial-trend-floor' ? 'Images' : 'Promo images') + ' (' + (ss.items || []).length + ')</div>' +
          (ss.items || []).map((it, i) =>
            '<div class="os-rep"><div class="os-rep-head"><img class="os-rep-thumb" src="' + esc(it.url) + '" alt="" />' +
              esc(it.alt) + '<span class="x" ' + del + '="' + i + '" title="Remove">' + I.x + '</span></div>' +
              '<input class="os-mini" ' + hrefAttr + '="' + i + '" value="' + esc(it.href) + '" placeholder="Link" />' +
            '</div>').join('') +
          '<button class="os-add-rep" ' + add + '>' + I.plus + ' Add ' + noun + '</button>';
      }

      case 'tabbed-product-floor':
        return fText('title', 'Floor title', ss.title) +
          '<div class="os-subhead">Tabs (' + (ss.tabs || []).length + ')</div>' +
          (ss.tabs || []).map((t, i) =>
            '<div class="os-rep"><div class="os-rep-head">Tab ' + (i + 1) +
              '<span class="x" data-del-tab="' + i + '" title="Remove">' + I.x + '</span></div>' +
              '<input class="os-mini" data-tab-label="' + i + '" value="' + esc(t.label) + '" placeholder="Tab label" style="margin-bottom:6px" />' +
              '<div class="os-mini-static">' + ((t.productIds || []).length) + ' products selected</div>' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-tab>' + I.plus + ' Add tab</button>' +
          '<div class="os-left-hint">Each tab pulls live products by the IDs you pick in the live editor.</div>';

      // ---- system (config-driven) sections: opaque config object in production ----
      case 'product-list-page-header':
      case 'product-list-page-content':
      case 'product-detail-page-main':
      case 'product-detail-benefits-floor':
      case 'product-detail-recommendations-floor':
        return '<div class="os-sys-note os-sys-note--inset">' +
          '<div class="os-sys-note-title">System section</div>' +
          '<div class="os-sys-note-body">This section renders from live store data and a JSON config. ' +
          'Open the live editor to tune its layout and content.</div></div>' +
          '<div class="os-fld"><div class="os-fld-label">Config (JSON)</div>' +
          '<textarea class="input" rows="3" readonly>' + esc(ss && ss.config != null ? ss.config : '{}') + '</textarea></div>';

      default:
        return '<div class="os-left-hint">No editable settings for this section.</div>';
    }
  }

  function headerForm(s) {
    return fText('logoText', 'Logo text', s.logoText) +
      fText('homeHref', 'Logo link', s.homeHref) +
      '<div class="os-subhead">Announcement bar</div>' +
      fText('utilityText', 'Message', s.utilityText) +
      fText('utilityLinkText', 'Link label', s.utilityLinkText) +
      fText('utilityLinkHref', 'Link URL', s.utilityLinkHref) +
      '<div class="os-subhead">Menu (' + (s.categories || []).length + ')</div>' +
      (s.categories || []).map((c, i) => {
        const mega = (c.dropdownColumns && c.dropdownColumns.length)
          ? '<div class="os-mini-static">Mega menu · ' + c.dropdownColumns.length + ' columns</div>' : '';
        return '<div class="os-rep"><div class="os-rep-head">Item ' + (i + 1) +
          '<span class="x" data-del-cat="' + i + '" title="Remove">' + I.x + '</span></div>' +
          '<input class="os-mini" data-cat-label="' + i + '" value="' + esc(c.label) + '" placeholder="Label" style="margin-bottom:6px" />' +
          '<input class="os-mini" data-cat-href="' + i + '" value="' + esc(c.href) + '" placeholder="Link" />' + mega +
        '</div>';
      }).join('') +
      '<button class="os-add-rep" data-add-cat>' + I.plus + ' Add menu item</button>' +
      '<div class="os-left-hint">Header and footer are global — changes apply to every page of the theme.</div>';
  }

  function footerForm(s) {
    return fArea('subscribeText', 'Newsletter copy', s.subscribeText) +
      fText('subscribeButtonText', 'Subscribe button', s.subscribeButtonText) +
      fText('copyrightText', 'Copyright', s.copyrightText) +
      '<div class="os-subhead">Link columns</div>' +
      (s.linkSections || []).map((sec, i) =>
        '<div class="os-rep"><div class="os-rep-head">' + esc(sec.title) +
          '<span class="os-mini-tail">' + (sec.links || []).length + ' links</span></div>' +
          '<input class="os-mini" data-foot-title="' + i + '" value="' + esc(sec.title) + '" placeholder="Column title" />' +
        '</div>').join('') +
      '<div class="os-subhead">Contact</div>' +
      (s.contactItems || []).map((c, i) =>
        '<div class="os-fld" style="margin-bottom:8px"><div class="os-fld-label">' + esc(c.label) + '</div>' +
          '<input class="input" data-contact="' + i + '" value="' + esc(c.value) + '" /></div>').join('') +
      '<div class="os-subhead">Social</div>' +
      '<div class="os-chips">' + (s.socialItems || []).map((x) => '<span class="os-chip">' + esc(x.label) + '</span>').join('') + '</div>' +
      '<div class="os-subhead">Trust badges</div>' +
      '<div class="os-chips">' + (s.trustBadges || []).map((x) => '<span class="os-chip">' + esc(x.value) + '</span>').join('') + '</div>';
  }

  // ---- WIRING ----
  function wireBuilder() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    wireTopBar(b);
    wireLeft(b);
    wireCanvasSelection(b);
    wireRightForm();
  }

  function wireTopBar(scope) {
    scope.querySelector('#bld-back').onclick = () => attemptLeave(() => { location.hash = '#/online-store'; });
    scope.querySelector('#bld-pagesel').onclick = (e) => openPageTypeMenu(e.currentTarget);
    scope.querySelectorAll('#bld-seg button').forEach((btn) => btn.onclick = () => {
      const vp = btn.getAttribute('data-vp');
      if (vp === ED.viewport) return;
      ED.viewport = vp;
      refreshCenterAndTop();
    });
    const disc = scope.querySelector('#bld-discard');
    if (disc && ED.dirty) disc.onclick = () => openConfirm({
      title: 'Discard changes?',
      body: 'Are you sure you want to revert to the last saved state? Your unsaved changes will be lost.',
      okText: 'Discard',
      onOk: () => { startEditor(ED.theme.handle); renderBuilder(ED.theme.handle); toast('Reverted to last saved version'); },
    });
    const save = scope.querySelector('#bld-save');
    if (save && ED.dirty) save.onclick = () => { ED.dirty = false; ED.theme.updated_time = nowStr(); refreshChrome(); toast('Design saved'); };
  }

  function wireLeft(scope) {
    scope.querySelectorAll('[data-lt]').forEach((t) => t.onclick = () => { ED.leftTab = t.getAttribute('data-lt'); refreshLeft(); });
    scope.querySelectorAll('[data-add]').forEach((el) => el.onclick = () => addSection(el.getAttribute('data-add')));
    scope.querySelectorAll('[data-sel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-sel') }));
    scope.querySelectorAll('[data-gsel]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-gsel') }));
  }

  function wireCanvasSelection(scope) {
    scope.querySelectorAll('[data-csel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-csel') }));
    scope.querySelectorAll('[data-csel-global]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-csel-global') }));
  }

  function wireRightForm() {
    const b = document.getElementById('os-builder');
    if (!b || !ED.selected) return;
    const form = b.querySelector('.os-right-scroll');
    if (!form) return;

    const markDirty = () => { if (!ED.dirty) { ED.dirty = true; refreshChrome(); } };
    const target = currentSettings();
    if (!target) return;

    // generic text/textarea fields -> settings[key], live-update canvas
    form.querySelectorAll('[data-f]').forEach((inp) => {
      inp.oninput = () => { target[inp.getAttribute('data-f')] = inp.value; markDirty(); refreshCanvasOnly(); };
    });
    // toggles
    form.querySelectorAll('[data-toggle]').forEach((tg) => tg.onclick = () => {
      const k = tg.getAttribute('data-toggle'); target[k] = !target[k]; tg.classList.toggle('on'); markDirty();
    });
    // remove section
    const rm = form.querySelector('[data-remove]');
    if (rm) rm.onclick = () => removeSection(rm.getAttribute('data-remove'));

    // ----- repeater wiring per section type -----
    const repeaterMap = [
      { del: 'data-del-slide', add: 'data-add-slide', key: 'slides', make: () => ({ id: 'slide-' + Date.now(), url: D.IMG.hero2, alt: 'New slide', href: '/' }),
        binds: [['data-slide-alt', 'alt'], ['data-slide-href', 'href']] },
      { del: 'data-del-benefit', add: 'data-add-benefit', key: 'benefits', make: () => ({ title: 'NEW', subtitle: 'Edit me', variant: 'stat' }),
        binds: [['data-ben-title', 'title'], ['data-ben-sub', 'subtitle']] },
      { del: 'data-del-item', add: 'data-add-item', key: 'items', make: () => ({ url: D.IMG.cat5, alt: 'New tile', collectionId: 'all' }),
        binds: [['data-item-col', 'collectionId']] },
      { del: 'data-del-promo', add: 'data-add-promo', key: 'items', make: () => ({ url: D.IMG.promo1, alt: 'New promo', href: '/' }),
        binds: [['data-promo-href', 'href']] },
      { del: 'data-del-trend', add: 'data-add-trend', key: 'items', make: () => ({ url: D.IMG.cat2, alt: 'New trend', href: '/' }),
        binds: [['data-trend-href', 'href']] },
      { del: 'data-del-tab', add: 'data-add-tab', key: 'tabs', make: () => ({ key: 't' + Date.now(), label: 'New Tab', productIds: [] }),
        binds: [['data-tab-label', 'label']] },
      { del: 'data-del-cat', add: 'data-add-cat', key: 'categories', make: () => ({ label: 'New', href: '/products', dropdownColumns: [] }),
        binds: [['data-cat-label', 'label'], ['data-cat-href', 'href']] },
    ];

    repeaterMap.forEach((R) => {
      if (!Array.isArray(target[R.key])) return;
      R.binds.forEach(([attr, prop]) => {
        form.querySelectorAll('[' + attr + ']').forEach((inp) => {
          inp.oninput = () => { const i = Number(inp.getAttribute(attr)); if (target[R.key][i]) { target[R.key][i][prop] = inp.value; markDirty(); refreshCanvasOnly(); } };
        });
      });
      form.querySelectorAll('[' + R.del + ']').forEach((x) => x.onclick = () => {
        const i = Number(x.getAttribute(R.del)); target[R.key].splice(i, 1); markDirty(); refreshRightAndCanvas();
      });
      const addBtn = form.querySelector('[' + R.add + ']');
      if (addBtn) addBtn.onclick = () => { target[R.key].push(R.make()); markDirty(); refreshRightAndCanvas(); };
    });

    // footer column titles + contact values
    form.querySelectorAll('[data-foot-title]').forEach((inp) => inp.oninput = () => {
      const i = Number(inp.getAttribute('data-foot-title')); if (target.linkSections && target.linkSections[i]) { target.linkSections[i].title = inp.value; markDirty(); refreshCanvasOnly(); }
    });
    form.querySelectorAll('[data-contact]').forEach((inp) => inp.oninput = () => {
      const i = Number(inp.getAttribute('data-contact')); if (target.contactItems && target.contactItems[i]) { target.contactItems[i].value = inp.value; markDirty(); }
    });
  }

  // current settings object for the selected element
  function currentSettings() {
    if (!ED.selected) return null;
    if (ED.selected.scope === 'global') {
      return ED.selected.componentId === 'storefront-header' ? ED.global.header.settings : ED.global.footer.settings;
    }
    const s = ED.sections.find((x) => x.instanceId === ED.selected.instanceId);
    return s ? s.settings : null;
  }

  // ---- actions ----
  function select(sel) { ED.selected = sel; refreshLeft(); refreshRight(); refreshCanvasSelection(); }

  function addSection(componentId) {
    const lib = D.COMPONENT_LIBRARY.find((x) => x.componentId === componentId);
    if (!lib) return;
    const sample = D.PAGES.HOME.find((s) => s.componentId === componentId);
    const inst = {
      instanceId: componentId + '-' + Date.now(),
      componentId,
      name: lib.label,
      settings: sample ? clone(sample.settings) : {},
    };
    ED.sections.push(inst);
    ED.dirty = true;
    ED.selected = { scope: 'section', instanceId: inst.instanceId };
    ED.leftTab = 'layers';
    renderBuilder(ED.theme.handle);
    const sc = document.getElementById('bld-canvas-scroll'); if (sc) sc.scrollTop = sc.scrollHeight;
    toast('Added ' + lib.label);
  }

  function removeSection(instanceId) {
    const idx = ED.sections.findIndex((x) => x.instanceId === instanceId);
    if (idx === -1) return;
    const nm = secLabel(ED.sections[idx]);
    ED.sections.splice(idx, 1);
    ED.selected = null;
    ED.dirty = true;
    renderBuilder(ED.theme.handle);
    toast('Removed ' + nm);
  }

  // ---- partial refreshers ----
  function refreshChrome() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    const oldTop = b.querySelector('.os-bld-top');
    const newTop = builderTopBar();
    oldTop.replaceWith(newTop);
    wireTopBar(newTop);
  }

  function refreshLeft() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    const old = b.querySelector('.os-left');
    const nw = builderLeft();
    old.replaceWith(nw);
    wireLeft(nw);
  }

  function refreshRight() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    const old = b.querySelector('.os-right');
    const nw = builderRight();
    old.replaceWith(nw);
    wireRightForm();
  }

  function refreshRightAndCanvas() { refreshRight(); refreshCanvasOnly(); }

  function refreshCenterAndTop() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    const old = b.querySelector('.os-center');
    const nw = builderCenter();
    old.replaceWith(nw);
    wireCanvasSelection(nw);
    refreshChrome();
  }

  function refreshCanvasOnly() {
    const frame = document.getElementById('bld-frame');
    if (!frame) return;
    frame.className = 'os-frame ' + ED.viewport;
    frame.innerHTML = canvasHtml();
    wireCanvasSelection(frame);
  }

  function refreshCanvasSelection() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    b.querySelectorAll('.os-sec').forEach((el) => {
      const isSec = el.hasAttribute('data-csel') && ED.selected && ED.selected.scope === 'section' && el.getAttribute('data-csel') === ED.selected.instanceId;
      const isGlobal = el.hasAttribute('data-csel-global') && ED.selected && ED.selected.scope === 'global' && el.getAttribute('data-csel-global') === ED.selected.componentId;
      el.classList.toggle('active', !!(isSec || isGlobal));
    });
  }

  // ---- page-type menu (Home page / Collections / Products) ----
  function openPageTypeMenu(anchor) {
    closePops();
    const layer = h('<div class="pop-layer"></div>');
    const pop = h('<div class="menu-pop os-pagemenu"></div>');
    pop.innerHTML = D.PAGE_TYPES.map((p) =>
      '<div class="opt" data-pt="' + p.value + '"' + (p.value === ED.pageType ? ' style="color:var(--brand);font-weight:600"' : '') + '>' + esc(p.label) + '</div>').join('');
    layer.appendChild(pop); document.body.appendChild(layer);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = r.left + 'px';
    pop.querySelectorAll('[data-pt]').forEach((o) => o.onclick = () => { closePops(); switchPageType(o.getAttribute('data-pt')); });
    setTimeout(() => document.addEventListener('mousedown', function hh(e) { if (!pop.contains(e.target) && !anchor.contains(e.target)) { closePops(); document.removeEventListener('mousedown', hh); } }), 0);
  }
  const closePops = () => document.querySelectorAll('.pop-layer').forEach((p) => p.remove());

  function switchPageType(pt) {
    if (pt === ED.pageType) return;
    const doSwitch = () => {
      ED.pageType = pt;
      ED.sections = clone(D.PAGES[pt]);
      ED.selected = null;
      ED.leftTab = 'add';
      ED.dirty = false;
      renderBuilder(ED.theme.handle);
    };
    if (!ED.dirty) { doSwitch(); return; }
    openSwitchModal(doSwitch);
  }

  // ---- MODALS ----
  function openConfirm({ title, body, okText, onOk }) {
    const backdrop = h('<div class="modal-backdrop" style="z-index:230"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML =
      '<div class="modal-head">' + esc(title) + '</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">' + esc(body) + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>' + esc(okText || 'OK') + '</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); onOk && onOk(); };
  }

  // Switch-page unsaved-changes modal (mirrors handlePageTypeChange in themeEdit.tsx):
  //   title "Unsaved changes", body "Do you want to save your changes before switching?",
  //   buttons Cancel / Discard and switch / Save and switch (primary).
  function openSwitchModal(doSwitch) {
    const backdrop = h('<div class="modal-backdrop" style="z-index:230"></div>');
    const m = h('<div class="modal" style="width:520px"></div>');
    m.innerHTML =
      '<div class="modal-head">Unsaved changes</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">Do you want to save your changes before switching?</div></div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-default" data-discard>Discard and switch</button>' +
        '<button class="btn btn-primary" data-save>Save and switch</button>' +
      '</div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-discard]').onclick = () => { close(); doSwitch(); };
    m.querySelector('[data-save]').onclick = () => { close(); ED.dirty = false; ED.theme.updated_time = nowStr(); toast('Design saved'); doSwitch(); };
  }

  // Leaving the builder with unsaved changes (mirrors handleClose in themeEdit.tsx):
  //   title "Are you sure you want to leave?", body "Unsaved changes will be lost",
  //   okText "Exit", cancelText "Cancel".
  function attemptLeave(proceed) {
    if (!ED || !ED.dirty) { proceed(); return; }
    const backdrop = h('<div class="modal-backdrop" style="z-index:230"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML =
      '<div class="modal-head">Are you sure you want to leave?</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">Unsaved changes will be lost</div></div>' +
      '<div class="modal-foot"><button class="btn btn-default" data-cancel>Cancel</button>' +
        '<button class="btn btn-primary" data-ok>Exit</button></div>';
    backdrop.appendChild(m); document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    m.querySelector('[data-cancel]').onclick = close;
    backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
    m.querySelector('[data-ok]').onclick = () => { close(); proceed(); };
  }

  function nowStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  // ========================================================================
  //  SIDEBAR ACTIVE STATE
  // ========================================================================
  // The shared manifest may still list this module as `planned` (non-clickable "Soon"
  // placeholder). This prototype is built, so upgrade our own sidebar entry in place to the
  // active link the shell emits for a `ready` module. Scoped to this page — no shared file touched.
  function activateSidebar() {
    const aside = document.querySelector('aside.app-sidebar');
    if (!aside) return false;
    const node = [...aside.querySelectorAll('.nav-item')].find((n) => {
      const span = n.querySelector('span:not(.nav-soon)');
      return span && span.textContent.trim() === 'Online store';
    });
    if (!node) return false;
    if (node.tagName === 'A' && node.classList.contains('active')) return true;
    const shellScript = document.querySelector('script[src$="shell.js"]');
    const base = (shellScript && shellScript.getAttribute('data-base')) || '../';
    const ico = (window.ICONS && window.ICONS.globe) || node.querySelector('.nav-ico').outerHTML;
    const link = document.createElement('a');
    link.className = 'nav-item active';
    link.href = base + 'online-store/index.html';
    link.innerHTML = ico + '<span>Online store</span>';
    node.replaceWith(link);
    return true;
  }
  if (!activateSidebar()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activateSidebar);
    else setTimeout(activateSidebar, 0);
  }

  // ========================================================================
  //  ROUTER (SPA: registered with the shell router)
  // ========================================================================
  function route(rest) {
    closePops();
    const m = (rest || '').match(/^edit\/(.+)$/);
    if (m) { renderBuilder(decodeURIComponent(m[1])); }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS['online-store'] = {
    render: function (el, rest) { root = el; route(rest || ''); },
    unmount: function () { closeBuilder(); closePops(); },
  };

  // ========================================================================
  //  CSS  (module-scoped; injected once into <head>)
  // ========================================================================
  var CSS = [
    /* ----- theme list ----- */
    '.os-list{max-width:1435px;margin:0 auto}',
    '.os-theme-tabs{margin-bottom:12px}',
    '.os-theme-tabs .tab{font-size:20px;font-weight:600;padding:6px 2px 14px}',
    '.os-theme-cards{display:flex;flex-direction:column;gap:24px}',
    '.os-theme-card{max-width:1435px;margin:0 auto;width:100%;overflow:hidden;border-radius:8px;border:1px solid #e5e7eb;background:#fff}',
    '.os-theme-previews{display:flex;gap:20px;overflow:hidden;background:#f7f7f8;padding:20px}',
    '.os-prev-pc{min-width:0;flex:1 1 auto;overflow:hidden;border-radius:3px;background:#fff;aspect-ratio:16/9}',
    '.os-prev-pc img{height:100%;width:100%;object-fit:cover;object-position:top;display:block}',
    '.os-prev-h5{width:34%;min-width:280px;overflow:hidden;border-radius:3px;background:#fff;aspect-ratio:16/9}',
    '.os-prev-h5 img{height:100%;width:100%;object-fit:cover;object-position:top;display:block}',
    '@media (max-width:1023px){.os-prev-h5{display:none}}',
    '.os-theme-meta{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px 20px}',
    '.os-theme-name{margin:0;font-size:16px;font-weight:600;color:#242833}',
    '.os-theme-saved{margin:8px 0 0;font-size:14px;color:#4b5563}',

    /* ----- builder shell (full-screen overlay above the SPA) ----- */
    '.os-builder{position:fixed;inset:0;z-index:140;background:#fff;display:flex;flex-direction:column}',
    '.os-bld-top{display:grid;align-items:center;grid-template-columns:1fr auto 1fr;gap:12px;padding:12px 16px;border-bottom:1px solid #eaedf1;flex-shrink:0;background:#fff}',
    '.os-top-left{display:flex;align-items:center;gap:12px}',
    '.os-top-right{display:flex;align-items:center;gap:12px;justify-self:end}',
    '.os-back{display:flex;align-items:center;gap:4px;padding:4px 8px;color:#356DFF;background:none;border:0;cursor:pointer;font-size:14px;font-weight:500;border-radius:6px}',
    '.os-back:hover{background:#f1f5ff}',
    '.os-pagesel{display:flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:1px solid var(--line,#e5e7eb);border-radius:6px;background:#fff;cursor:pointer;font-size:13px;min-width:180px;justify-content:space-between;color:var(--ink,#242833)}',
    '.os-pagesel:hover{border-color:var(--brand,#0066e6)}',
    '.os-pagemenu{position:fixed;min-width:180px}',
    '.os-seg{display:inline-flex;background:#f1f2f4;border-radius:8px;padding:3px;gap:2px}',
    '.os-seg button{border:0;background:none;cursor:pointer;font-size:13px;font-weight:500;color:#5b6472;padding:5px 16px;border-radius:6px;line-height:1}',
    '.os-seg button.active{background:#fff;color:var(--ink,#242833);box-shadow:0 1px 2px rgba(0,0,0,.12)}',
    '.os-bld-top .btn[disabled]{opacity:.45;cursor:not-allowed}',

    '.os-bld-body{flex:1;min-height:0;display:grid;grid-template-columns:280px 1fr 320px;overflow:hidden}',

    /* ----- left panel ----- */
    '.os-left{border-right:1px solid #eaedf1;display:flex;flex-direction:column;min-height:0;background:#fff}',
    '.os-left-tabs{display:flex;border-bottom:1px solid #eaedf1;flex-shrink:0}',
    '.os-left-tab{flex:1;text-align:center;padding:11px 0;font-size:13px;font-weight:500;color:#5b6472;cursor:pointer;border-bottom:2px solid transparent}',
    '.os-left-tab.active{color:var(--brand,#0066e6);border-bottom-color:var(--brand,#0066e6)}',
    '.os-left-scroll{flex:1;overflow:auto;padding:12px}',
    '.os-lib-label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#9aa3b0;margin:10px 4px 6px}',
    '.os-block{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid #eef0f3;border-radius:8px;margin-bottom:7px;cursor:pointer;background:#fff;transition:border-color .12s,background .12s}',
    '.os-block:hover{border-color:var(--brand,#0066e6);background:#f7faff}',
    '.os-block-ico{width:30px;height:30px;flex-shrink:0;border-radius:7px;background:#f1f4f9;display:flex;align-items:center;justify-content:center;color:#5b6472}',
    '.os-block-name{font-size:13px;font-weight:600;color:var(--ink,#242833)}',
    '.os-block-desc{font-size:11.5px;color:#8a93a1;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.os-grip{margin-left:auto;color:#c4cad3;flex-shrink:0;display:flex}',
    '.os-block:hover .os-grip{color:var(--brand,#0066e6)}',
    '.os-left-hint{font-size:12px;color:#8a93a1;padding:10px 4px;line-height:1.6}',
    '.os-layer{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #eef0f3;border-radius:8px;margin-bottom:6px;cursor:pointer;background:#fff}',
    '.os-layer:hover{border-color:#d6dbe3;background:#fafbfc}',
    '.os-layer.active{border-color:var(--brand,#0066e6);background:#f2f7ff}',
    '.os-layer.fixed{background:#fafbfc}',
    '.os-layer-ico{width:26px;height:26px;flex-shrink:0;border-radius:6px;background:#f1f4f9;display:flex;align-items:center;justify-content:center;color:#5b6472}',
    '.os-layer-name{font-size:13px;font-weight:500;color:var(--ink,#242833);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.os-layer-grip{margin-left:auto;color:#c4cad3;cursor:grab;flex-shrink:0;display:flex}',
    '.os-layer-lock{margin-left:auto;color:#c4cad3;flex-shrink:0;display:flex}',
    '.os-sys-note{border:1px dashed #d6dbe3;border-radius:8px;padding:14px;background:#fafbfc;margin-top:6px}',
    '.os-sys-note--inset{margin:0 0 12px}',
    '.os-sys-note-title{font-size:13px;font-weight:600;color:var(--ink,#242833);margin-bottom:4px}',
    '.os-sys-note-body{font-size:12.5px;color:#6b7280;line-height:1.6}',

    /* ----- center canvas ----- */
    '.os-center{display:flex;flex-direction:column;min-height:0;background:#eef0f3}',
    '.os-canvas-bar{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:8px 14px;font-size:12px;color:#6b7280;background:#f7f8fa;border-bottom:1px solid #eaedf1}',
    '.os-canvas-scroll{flex:1;overflow:auto;padding:20px;display:flex;justify-content:center;align-items:flex-start}',
    '.os-frame{width:100%;max-width:1080px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08);border-radius:4px;overflow:hidden}',
    '.os-frame.mobile{max-width:390px}',
    '.os-sec{position:relative;outline:2px solid transparent;outline-offset:-2px;cursor:pointer;transition:outline-color .12s}',
    '.os-sec:hover{outline-color:#b9d2ff}',
    '.os-sec.active{outline-color:var(--brand,#0066e6)}',
    '.os-sec-tag{position:absolute;top:0;left:0;z-index:3;background:var(--brand,#0066e6);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-bottom-right-radius:6px;opacity:0;pointer-events:none;transition:opacity .12s}',
    '.os-sec:hover .os-sec-tag,.os-sec.active .os-sec-tag{opacity:1}',

    /* ----- right panel ----- */
    '.os-right{border-left:1px solid #eaedf1;display:flex;flex-direction:column;min-height:0;background:#fff}',
    '.os-right-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #eaedf1;flex-shrink:0}',
    '.os-right-head .ico{width:34px;height:34px;flex-shrink:0;border-radius:8px;background:#f1f4f9;display:flex;align-items:center;justify-content:center;color:#5b6472}',
    '.os-right-title{font-size:14px;font-weight:600;color:var(--ink,#242833);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.os-right-sub{font-size:12px;color:#8a93a1;margin-top:1px}',
    '.os-right-scroll{flex:1;overflow:auto;padding:14px 16px}',
    '.os-empty-right{flex:1;display:flex;align-items:center;text-align:center;padding:24px 22px;font-size:13px;color:#8a93a1;line-height:1.7}',
    '.os-fld{margin-bottom:12px}',
    '.os-fld-row{display:flex;align-items:center;justify-content:space-between;gap:10px}',
    '.os-fld-label{font-size:12px;font-weight:600;color:#5b6472;margin-bottom:6px}',
    '.os-subhead{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#9aa3b0;margin:16px 0 8px;padding-top:12px;border-top:1px solid #f0f2f5}',
    '.os-rep{border:1px solid #eef0f3;border-radius:8px;padding:9px;margin-bottom:8px;background:#fafbfc}',
    '.os-rep-head{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--ink,#242833);margin-bottom:7px}',
    '.os-rep-thumb{width:26px;height:26px;border-radius:5px;object-fit:cover;flex-shrink:0}',
    '.os-rep-head .x{margin-left:auto;color:#b6bdc7;cursor:pointer;display:flex}',
    '.os-rep-head .x:hover{color:var(--err,#e02e2e)}',
    '.os-mini-tail{margin-left:auto;font-weight:400;color:#9aa3b0;font-size:11.5px}',
    '.os-mini{width:100%;height:30px;padding:0 9px;border:1px solid var(--line,#e5e7eb);border-radius:6px;font-size:12.5px;color:var(--ink,#242833);background:#fff;font-family:inherit}',
    '.os-mini:focus{outline:none;border-color:var(--brand,#0066e6)}',
    '.os-mini-static{font-size:12px;color:#8a93a1;margin-top:6px}',
    '.os-add-rep{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;height:32px;border:1px dashed #cbd2db;border-radius:7px;background:#fff;color:var(--brand,#0066e6);font-size:12.5px;font-weight:500;cursor:pointer;margin-top:2px}',
    '.os-add-rep:hover{background:#f7faff;border-color:var(--brand,#0066e6)}',
    '.os-remove{display:flex;align-items:center;justify-content:center;width:100%;height:34px;border:1px solid #f3c9c0;border-radius:7px;background:#fff;color:var(--err,#e02e2e);font-size:13px;font-weight:500;cursor:pointer;margin-top:8px}',
    '.os-remove:hover{background:#fef4f2}',
    '.os-toggle{position:relative;width:38px;height:22px;border-radius:999px;background:#cfd5de;cursor:pointer;flex-shrink:0;transition:background .15s}',
    '.os-toggle.on{background:var(--brand,#0066e6)}',
    '.os-toggle i{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}',
    '.os-toggle.on i{left:18px}',
    '.os-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.os-chip{font-size:12px;color:#5b6472;background:#f1f4f9;border:1px solid #e5e9ef;border-radius:6px;padding:3px 9px}',

    /* ----- storefront preview mocks (inside the canvas frame) ----- */
    '.sf-utility{background:#242833;color:#fff;font-size:11px;letter-spacing:.04em;text-align:center;padding:7px 12px}',
    '.sf-utility a{color:#fff;text-decoration:underline;margin-left:6px}',
    '.sf-header{display:flex;align-items:center;gap:16px;padding:14px 22px;border-bottom:1px solid #eee}',
    '.sf-logo{font-size:22px;font-weight:800;letter-spacing:-.02em;color:#242833;flex-shrink:0}',
    '.sf-nav{display:flex;gap:18px;flex:1;flex-wrap:wrap}',
    '.sf-nav span{font-size:12.5px;font-weight:600;color:#3a3f4a;white-space:nowrap}',
    '.sf-nav span.has-mega::after{content:"\\25BE";font-size:8px;margin-left:3px;color:#9aa3b0}',
    '.sf-icons{display:flex;gap:14px;color:#3a3f4a;flex-shrink:0}',
    '.os-frame.mobile .sf-nav{display:none}',
    '.sf-hero{position:relative;height:360px;background-size:cover;background-position:center;display:flex;align-items:center}',
    '.os-frame.mobile .sf-hero{height:300px}',
    '.sf-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,0) 60%)}',
    '.sf-hero-inner{position:relative;z-index:2;padding:0 48px;color:#fff;max-width:60%}',
    '.os-frame.mobile .sf-hero-inner{padding:0 24px;max-width:90%}',
    '.sf-hero-eyebrow{font-size:13px;font-weight:600;letter-spacing:.05em;margin-bottom:10px;text-shadow:0 1px 6px rgba(0,0,0,.4)}',
    '.sf-hero-title{font-size:40px;font-weight:800;line-height:1.05;letter-spacing:-.02em;text-shadow:0 2px 10px rgba(0,0,0,.4)}',
    '.os-frame.mobile .sf-hero-title{font-size:30px}',
    '.sf-hero-cta{display:inline-block;margin-top:20px;background:#fff;color:#242833;font-size:12px;font-weight:700;letter-spacing:.05em;padding:11px 26px;border-radius:2px}',
    '.sf-dots{position:absolute;bottom:16px;left:0;right:0;z-index:2;display:flex;justify-content:center;gap:7px}',
    '.sf-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5)}',
    '.sf-dots i.on{background:#fff;width:18px;border-radius:4px}',
    '.sf-benefits{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;background:#fff5ec;padding:18px 22px}',
    '.sf-benefit{text-align:center;min-width:120px}',
    '.sf-benefit .b-title{font-size:20px;font-weight:800;color:#e0623a}',
    '.sf-benefit .b-sub{font-size:11px;color:#8a6a5a;margin-top:2px}',
    '.sf-benefit.code{border:1.5px dashed #e0623a;border-radius:8px;padding:6px 16px;background:#fff}',
    '.sf-floor-title{font-size:22px;font-weight:800;color:#242833;text-align:center;padding:26px 0 14px;letter-spacing:-.01em}',
    '.sf-cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;padding:0 2px 2px}',
    '.os-frame.mobile .sf-cat-grid{grid-template-columns:repeat(2,1fr)}',
    '.sf-cat{position:relative;aspect-ratio:3/4;background-size:cover;background-position:center}',
    '.sf-cat .lbl{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.55));color:#fff;font-size:12px;font-weight:600;padding:18px 10px 8px;text-align:center}',
    '.sf-promo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 22px 26px}',
    '.os-frame.mobile .sf-promo-grid{grid-template-columns:repeat(2,1fr);padding:0 12px 18px}',
    '.sf-promo{aspect-ratio:3/4;background-size:cover;background-position:center;border-radius:6px}',
    '.sf-tabs{display:flex;gap:22px;justify-content:center;border-bottom:1px solid #eee;margin:0 22px}',
    '.sf-tabs span{font-size:13px;font-weight:600;color:#9aa3b0;padding:0 2px 12px;border-bottom:2px solid transparent;white-space:nowrap}',
    '.sf-tabs span.on{color:#242833;border-bottom-color:#242833}',
    '.sf-prod-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:18px 22px 28px}',
    '.os-frame.mobile .sf-prod-grid{grid-template-columns:repeat(2,1fr);padding:18px 12px}',
    '.sf-prod .ph{aspect-ratio:3/4;background-size:cover;background-position:center;border-radius:6px;background-color:#f1f2f4}',
    '.sf-prod .nm{font-size:12.5px;color:#3a3f4a;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sf-prod .pr{font-size:13px;font-weight:700;color:#e0623a;margin-top:3px}',
    '.sf-prod .pr s{color:#b6bdc7;font-weight:400;margin-left:6px}',
    '.sf-sys{margin:18px 22px;border:1px dashed #d6dbe3;border-radius:8px;background:#fafbfc;padding:22px;text-align:center}',
    '.sf-sys-title{font-size:14px;font-weight:700;color:#3a3f4a}',
    '.sf-sys-sub{font-size:12px;color:#8a93a1;margin-top:5px}',
    '.sf-sys-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:6px 22px 28px}',
    '.os-frame.mobile .sf-sys-grid{grid-template-columns:repeat(2,1fr);padding:6px 12px 18px}',
    '.sf-sys-cell{aspect-ratio:3/4;background:#eef0f3;border-radius:6px}',
    '.sf-pdp{display:grid;grid-template-columns:1.1fr 1fr;gap:26px;padding:24px 22px}',
    '.os-frame.mobile .sf-pdp{grid-template-columns:1fr;gap:16px}',
    '.sf-pdp-gallery{aspect-ratio:3/4;background:#eef0f3;border-radius:8px}',
    '.sf-pdp-title{font-size:22px;font-weight:700;color:#242833}',
    '.sf-pdp-price{font-size:18px;font-weight:700;color:#e0623a;margin-top:10px}',
    '.sf-pdp-price s{color:#b6bdc7;font-weight:400;margin-left:8px;font-size:14px}',
    '.sf-pdp-row{height:38px;background:#f1f2f4;border-radius:6px;margin-top:14px}',
    '.sf-pdp-cta{margin-top:18px;background:#242833;color:#fff;text-align:center;font-size:13px;font-weight:700;letter-spacing:.05em;padding:13px;border-radius:3px}',
    '.sf-unknown{padding:24px;text-align:center;color:#9aa3b0;font-size:13px}',
    '.sf-footer{background:#242833;color:#cfd5de;padding:34px 26px 22px}',
    '.sf-foot-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding-bottom:24px;border-bottom:1px solid #3a3f4a}',
    '.os-frame.mobile .sf-foot-cols{grid-template-columns:repeat(2,1fr)}',
    '.sf-foot-col h5{font-size:13px;font-weight:700;color:#fff;margin:0 0 12px}',
    '.sf-foot-col a{display:block;font-size:12px;color:#aab2bf;margin-bottom:7px;text-decoration:none}',
    '.sf-foot-sub{font-size:12px;color:#aab2bf;line-height:1.6;margin:0 0 10px}',
    '.sf-pay{display:flex;flex-wrap:wrap;gap:6px}',
    '.sf-pay span{font-size:10px;font-weight:600;color:#cfd5de;background:#3a3f4a;border-radius:4px;padding:3px 7px}',
    '.sf-copy{font-size:11px;color:#8a93a1;text-align:center;padding-top:18px}',
  ].join('');
})();
