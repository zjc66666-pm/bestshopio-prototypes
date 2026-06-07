/* BestShopio Admin · Online store prototype — theme list + visual store builder (mock), hash-routed.
   Chrome (sidebar + header) is injected by ../assets/shell.js; this file only renders the
   module body into #root. The builder is a STATIC MOCK of the real Online store micro-app
   (reference/bestvoy-admin onlineStore: list.tsx + themeEdit.tsx + pagePresets.ts) — a builder
   UI mock, not a real editor. */
(function () {
  const D = window.DATA_ONLINE_STORE;
  let root; // set by the SPA shell router via VIEWS['online-store'].render(el, rest)

  // tiny html -> element helper
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- inline icons (svg style matches shell.js .nav-ico) ----
  const svg = (p, w) => '<svg viewBox="0 0 24 24" width="' + (w || 16) + '" height="' + (w || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const I = {
    arrowLeft: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', 18),
    chevDown: svg('<path d="m6 9 6 6 6-6"/>'),
    desktop: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', 15),
    mobile: svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', 15),
    image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
    percent: svg('<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    layers: svg('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    tabs: svg('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M9 6V4M15 6V4"/>'),
    header: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'),
    footer: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18"/>'),
    grip: svg('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>', 14),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 14),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>', 15),
    searchSm: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', 15),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', 15),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 14),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 15),
  };
  const ICO = (name) => I[name] || I.layers;

  // ---- toast ----
  const toast = (msg) => { const t = document.createElement('div'); t.textContent = msg; t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#242833;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:120;box-shadow:var(--float-shadow)'; document.body.appendChild(t); setTimeout(() => t.remove(), 1900); };

  // ========================================================================
  //  THEME LIST  (#/online-store)
  // ========================================================================
  function renderList() {
    closeBuilder();
    const cards = D.THEMES.map(themeCardHtml).join('');
    root.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<div>' +
          '<h1 class="page-title">Online store</h1>' +
          '<div class="muted" style="margin-top:2px">Themes for your storefront. Edit the layout, sections and content in the visual builder.</div>' +
        '</div>' +
        '<button class="btn btn-default" data-act="library">Theme library</button>' +
      '</div>' +
      '<div class="tabs mb-4">' +
        '<div class="tab active">My theme</div>' +
        '<div class="tab" data-act="library2">Theme library</div>' +
      '</div>' +
      '<div class="flex flex-col" style="gap:20px;max-width:1240px">' + cards + '</div>';

    root.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => goEdit(b.getAttribute('data-edit')));
    root.querySelectorAll('[data-preview]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); toast('Preview opens the live storefront in a new tab (roadmap)'); });
    root.querySelectorAll('[data-act="library"],[data-act="library2"]').forEach((b) => b.onclick = () => toast('Theme library — browse and install free / paid themes (roadmap)'));
  }

  function themeCardHtml(t) {
    const badge = t.published
      ? '<span class="os-live"><span class="dot"></span>' + esc(t.role) + '</span>'
      : '<span class="st st-planned"><span class="dot"></span>' + esc(t.role) + '</span>';
    return '<section class="os-theme-card" data-theme="' + esc(t.handle) + '">' +
      '<div class="os-theme-previews">' +
        '<div class="os-prev-pc"><img src="' + t.pc_image + '" alt="Desktop theme preview" loading="lazy" /></div>' +
        '<div class="os-prev-h5"><img src="' + t.h5_image + '" alt="Mobile theme preview" loading="lazy" /></div>' +
      '</div>' +
      '<div class="os-theme-meta">' +
        '<div style="min-width:0">' +
          '<div class="flex items-center gap-2">' +
            '<h2 style="margin:0;font-size:16px;font-weight:600;color:var(--ink)">' + esc(t.title) + '</h2>' + badge +
          '</div>' +
          '<div class="muted" style="margin-top:6px;font-size:13px">Last saved: ' + esc(t.updated_time) + '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button class="btn btn-default" data-preview="' + esc(t.handle) + '">' + I.eye + ' Preview</button>' +
          '<button class="btn btn-primary" data-edit="' + esc(t.handle) + '">' + I.edit + ' Edit theme</button>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  // ========================================================================
  //  BUILDER  (#/online-store/edit/:handle)  — full-screen visual editor mock
  // ========================================================================
  // editor state (re-created each time the builder opens)
  let ED = null;

  function startEditor(handle) {
    const theme = D.THEMES.find((t) => t.handle === handle) || D.THEMES[0];
    ED = {
      theme,
      pageType: 'HOME',
      viewport: 'pc',
      // deep clone the page list so edits in the mock don't mutate sample data
      sections: clone(D.PAGES['HOME']),
      global: clone(D.GLOBAL),
      selected: null,      // { scope:'section', instanceId } | { scope:'global', componentId } | null
      leftTab: 'add',      // 'add' | 'layers'
      dirty: false,
    };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function goEdit(handle) { location.hash = '#/online-store/edit/' + encodeURIComponent(handle); }

  function renderBuilder(handle) {
    if (!ED || ED.theme.handle !== handle) startEditor(handle);
    closeBuilder();

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

  // ---- TOP BAR (Back · page-type select · PC/Mobile · Discard/Save) ----
  function builderTopBar() {
    const cur = D.PAGE_TYPES.find((p) => p.value === ED.pageType) || D.PAGE_TYPES[0];
    const top = h('<div class="os-bld-top"></div>');
    top.innerHTML =
      '<div class="flex items-center gap-3">' +
        '<button class="back-btn" id="bld-back" title="Back to themes">' + I.arrowLeft + '</button>' +
        '<div class="os-pagesel" id="bld-pagesel"><span>' + esc(cur.label) + '</span>' + I.chevDown + '</div>' +
        '<span class="muted" style="font-size:13px">' + esc(ED.theme.title) + '</span>' +
      '</div>' +
      '<div class="os-seg" id="bld-seg">' +
        '<button data-vp="pc" class="' + (ED.viewport === 'pc' ? 'active' : '') + '">' + I.desktop + 'Desktop</button>' +
        '<button data-vp="mobile" class="' + (ED.viewport === 'mobile' ? 'active' : '') + '">' + I.mobile + 'Mobile</button>' +
      '</div>' +
      '<div class="flex items-center gap-2" style="justify-self:end">' +
        '<button class="btn btn-default" id="bld-discard"' + (ED.dirty ? '' : ' disabled style="opacity:.5;cursor:not-allowed"') + '>Discard</button>' +
        '<button class="btn btn-primary" id="bld-save"' + (ED.dirty ? '' : ' disabled style="opacity:.5;cursor:not-allowed"') + '>Save</button>' +
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
    // only blocks valid for the current page type
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
    html += '<div class="muted" style="font-size:12px;padding:10px 4px;line-height:1.6">Drag-and-drop is mocked here — click a block to append it to the current page.</div>';
    return html;
  }

  function layersHtml() {
    const headerActive = ED.selected && ED.selected.scope === 'global' && ED.selected.componentId === 'storefront-header';
    const footerActive = ED.selected && ED.selected.scope === 'global' && ED.selected.componentId === 'storefront-footer';
    const top =
      '<div class="os-lib-label">Header</div>' +
      '<div class="os-layer fixed' + (headerActive ? ' active' : '') + '" data-gsel="storefront-header">' +
        '<div class="os-layer-ico">' + I.header + '</div><div class="os-layer-name">Header (global)</div></div>';
    const secs =
      '<div class="os-lib-label" style="margin-top:6px">Page sections</div>' +
      ED.sections.map((s) => {
        const active = ED.selected && ED.selected.scope === 'section' && ED.selected.instanceId === s.instanceId;
        return '<div class="os-layer' + (active ? ' active' : '') + '" data-sel="' + esc(s.instanceId) + '">' +
          '<div class="os-layer-ico">' + ICO(libIcon(s.componentId)) + '</div>' +
          '<div class="os-layer-name">' + esc(s.name || s.componentId) + '</div>' +
          '<span class="os-layer-grip" title="Reorder (mock)">' + I.grip + '</span>' +
        '</div>';
      }).join('');
    const bottom =
      '<div class="os-lib-label" style="margin-top:6px">Footer</div>' +
      '<div class="os-layer fixed' + (footerActive ? ' active' : '') + '" data-gsel="storefront-footer">' +
        '<div class="os-layer-ico">' + I.footer + '</div><div class="os-layer-name">Footer (global)</div></div>';
    return top + secs + bottom;
  }

  function libIcon(componentId) {
    const c = D.COMPONENT_LIBRARY.find((x) => x.componentId === componentId);
    return c ? c.icon : 'layers';
  }

  // ---- CENTER (canvas) ----
  function builderCenter() {
    const center = h('<div class="os-center"></div>');
    const cur = D.PAGE_TYPES.find((p) => p.value === ED.pageType) || D.PAGE_TYPES[0];
    center.innerHTML =
      '<div class="os-canvas-bar">' + I.eye + ' Live preview · ' + esc(cur.label) + ' · ' + (ED.viewport === 'pc' ? 'Desktop 1080px' : 'Mobile 390px') + '</div>' +
      '<div class="os-canvas-scroll" id="bld-canvas-scroll">' +
        '<div class="os-frame ' + ED.viewport + '" id="bld-frame">' + canvasHtml() + '</div>' +
      '</div>';
    return center;
  }

  function canvasHtml() {
    const mob = ED.viewport === 'mobile';
    let html = '';
    // global header
    html += sectionWrap('global', 'storefront-header', 'Header', headerMock(ED.global.header.settings, mob));
    // page sections
    ED.sections.forEach((s) => {
      html += sectionWrap('section', s.instanceId, s.name || s.componentId, sectionMock(s, mob));
    });
    // global footer
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
    const nav = (s.categories || []).map((c) => '<span>' + esc(c.label) + '</span>').join('');
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
      case 'tabbed-product-floor': return tabbedMock(s.settings);
      default: return '<div style="padding:24px;text-align:center;color:#999">' + esc(s.componentId) + '</div>';
    }
  }

  function heroMock(s, mob) {
    const first = (s.slides || [])[0] || {};
    const dots = (s.slides || []).map((sl, i) => '<i class="' + (i === 0 ? 'on' : '') + '"></i>').join('');
    return '<div class="sf-hero' + (mob ? ' mob' : '') + '" style="background-image:url(' + first.url + ')">' +
      '<div class="sf-hero-inner">' +
        '<div class="sf-hero-eyebrow">' + esc(s.eyebrow) + '</div>' +
        '<div class="sf-hero-title">' + esc(s.title) + '</div>' +
        '<span class="sf-hero-cta">' + esc(s.ctaText) + '</span>' +
      '</div>' +
      '<div class="sf-dots">' + dots + '</div>' +
    '</div>';
  }

  function benefitMock(s) {
    const items = (s.benefits || []).map((b) =>
      '<div class="sf-benefit' + (b.variant === 'code' ? ' code' : '') + '">' +
        '<div class="b-title">' + esc(b.title) + '</div><div class="b-sub">' + esc(b.subtitle) + '</div></div>').join('');
    return '<div class="sf-benefits" style="background:' + esc(s.background || '#fff5ec') + '">' + items + '</div>';
  }

  function catGridMock(s) {
    const items = (s.items || []).map((it) =>
      '<div class="sf-cat" style="background-image:url(' + it.url + ')"><span class="lbl">' + esc(it.alt) + '</span></div>').join('');
    return '<div class="sf-cat-grid">' + items + '</div>';
  }

  function promoMock(s) {
    const items = (s.items || []).map((it) => '<div class="sf-promo" style="background-image:url(' + it.url + ')"></div>').join('');
    return '<div class="sf-floor-title">' + esc(s.title) + '</div><div class="sf-promo-grid">' + items + '</div>';
  }

  function tabbedMock(s) {
    const tabs = (s.tabs || []).map((t, i) => '<span class="' + (i === 0 ? 'on' : '') + '">' + esc(t.label) + '</span>').join('');
    const prods = (s.products || []).map((p) =>
      '<div class="sf-prod"><div class="ph" style="background-image:url(' + p.url + ')"></div>' +
        '<div class="nm">' + esc(p.name) + '</div>' +
        '<div class="pr">' + esc(p.price) + (p.compareAt ? '<s>' + esc(p.compareAt) + '</s>' : '') + '</div></div>').join('');
    return '<div class="sf-floor-title">' + esc(s.title) + '</div>' +
      '<div class="sf-tabs">' + tabs + '</div><div class="sf-prod-grid">' + prods + '</div>';
  }

  function footerMock(s, mob) {
    const cols = (s.linkSections || []).map((sec) =>
      '<div class="sf-foot-col"><h5>' + esc(sec.title) + '</h5>' +
        (sec.links || []).map((l) => '<a>' + esc(l.label) + '</a>').join('') + '</div>').join('');
    const pay = (s.paymentMethods || []).map((p) => '<span>' + esc(p) + '</span>').join('');
    const newsletter =
      '<div class="sf-foot-col"><h5>Newsletter</h5>' +
        '<p style="margin-bottom:8px">' + esc(s.subscribeText) + '</p>' +
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
      const g = ED.selected.componentId === 'storefront-header' ? ED.global.header : ED.global.footer;
      return rightHead(g.componentId === 'storefront-header' ? 'header' : 'footer',
                       g.componentId === 'storefront-header' ? 'Header' : 'Footer', 'Global · shown on every page') +
        '<div class="os-right-scroll">' + (g.componentId === 'storefront-header' ? headerForm(g.settings) : footerForm(g.settings)) + '</div>';
    }
    const s = ED.sections.find((x) => x.instanceId === ED.selected.instanceId);
    if (!s) return '<div class="os-empty-right">Section not found.</div>';
    const lib = D.COMPONENT_LIBRARY.find((x) => x.componentId === s.componentId) || {};
    return rightHead(lib.icon || 'layers', s.name || s.componentId, lib.label || s.componentId) +
      '<div class="os-right-scroll" id="bld-form">' + sectionForm(s) +
        '<button class="btn btn-default" data-remove="' + esc(s.instanceId) + '" style="width:100%;justify-content:center;margin-top:6px;color:var(--err);border-color:#f3c9c0">Remove section</button>' +
      '</div>';
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
  function fColor(id, label, val) {
    return '<div class="os-fld"><div class="os-fld-label">' + esc(label) + '</div>' +
      '<div class="os-swatch"><span class="chip-color" style="background:' + esc(val) + '"></span>' +
      '<input class="input" data-f="' + id + '" value="' + esc(val) + '" style="flex:1" /></div></div>';
  }
  function fToggle(id, label, on) {
    return '<div class="os-fld"><div class="os-fld-label" style="margin-bottom:0">' + esc(label) +
      '<span class="os-toggle' + (on ? ' on' : '') + '" data-toggle="' + id + '"><i></i></span></div></div>';
  }

  // section-specific forms ------------------------------------------------
  function sectionForm(s) {
    const ss = s.settings;
    switch (s.componentId) {
      case 'hero-carousel':
        return fText('eyebrow', 'Eyebrow text', ss.eyebrow) +
          fArea('title', 'Headline', ss.title) +
          fText('ctaText', 'Button label', ss.ctaText) +
          fToggle('autoplay', 'Autoplay slides', ss.autoplay) +
          '<div class="os-subhead">Slides (' + (ss.slides || []).length + ')</div>' +
          (ss.slides || []).map((sl, i) =>
            '<div class="os-rep">' +
              '<div class="os-rep-head"><img class="os-rep-thumb" src="' + sl.url + '" alt="" />Slide ' + (i + 1) +
                '<span class="x" data-del-slide="' + i + '">' + I.x + '</span></div>' +
              '<input class="os-mini" data-slide-alt="' + i + '" value="' + esc(sl.alt) + '" placeholder="Alt text" style="margin-bottom:6px" />' +
              '<input class="os-mini" data-slide-href="' + i + '" value="' + esc(sl.href) + '" placeholder="Link" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-slide>+ Add slide</button>';

      case 'coupon-benefit-strip':
        return fColor('background', 'Strip background', ss.background || '#fff5ec') +
          '<div class="os-subhead">Benefits (' + (ss.benefits || []).length + ')</div>' +
          (ss.benefits || []).map((b, i) =>
            '<div class="os-rep">' +
              '<div class="os-rep-head">Benefit ' + (i + 1) + ' · ' + esc(b.variant) +
                '<span class="x" data-del-benefit="' + i + '">' + I.x + '</span></div>' +
              '<input class="os-mini" data-ben-title="' + i + '" value="' + esc(b.title) + '" placeholder="Title" style="margin-bottom:6px" />' +
              '<input class="os-mini" data-ben-sub="' + i + '" value="' + esc(b.subtitle) + '" placeholder="Subtitle" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-benefit>+ Add benefit</button>';

      case 'category-quick-entry-grid':
        return fText('columns', 'Columns per row', String(ss.columns || 4)) +
          '<div class="os-subhead">Tiles (' + (ss.items || []).length + ')</div>' +
          (ss.items || []).map((it, i) =>
            '<div class="os-rep"><div class="os-rep-head"><img class="os-rep-thumb" src="' + it.url + '" alt="" />' +
              esc(it.alt) + '<span class="x" data-del-item="' + i + '">' + I.x + '</span></div>' +
              '<input class="os-mini" data-item-col="' + i + '" value="' + esc(it.collectionId) + '" placeholder="Collection handle" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-item>+ Add tile</button>';

      case 'promo-product-floor':
        return fText('title', 'Floor title', ss.title) +
          '<div class="os-subhead">Promo images (' + (ss.items || []).length + ')</div>' +
          (ss.items || []).map((it, i) =>
            '<div class="os-rep"><div class="os-rep-head"><img class="os-rep-thumb" src="' + it.url + '" alt="" />' +
              esc(it.alt) + '<span class="x" data-del-promo="' + i + '">' + I.x + '</span></div>' +
              '<input class="os-mini" data-promo-href="' + i + '" value="' + esc(it.href) + '" placeholder="Link" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-promo>+ Add promo image</button>';

      case 'tabbed-product-floor':
        return fText('title', 'Floor title', ss.title) +
          '<div class="os-subhead">Tabs (' + (ss.tabs || []).length + ')</div>' +
          (ss.tabs || []).map((t, i) =>
            '<div class="os-rep"><div class="os-rep-head">Tab ' + (i + 1) +
              '<span class="x" data-del-tab="' + i + '">' + I.x + '</span></div>' +
              '<input class="os-mini" data-tab-label="' + i + '" value="' + esc(t.label) + '" placeholder="Tab label" style="margin-bottom:6px" />' +
              '<input class="os-mini" data-tab-count="' + i + '" value="' + esc(t.productCount) + '" placeholder="Products" />' +
            '</div>').join('') +
          '<button class="os-add-rep" data-add-tab>+ Add tab</button>' +
          '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.5">Products are pulled live from the selected collection.</div>';

      default:
        return '<div class="muted" style="font-size:13px">No editable settings for this section.</div>';
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
      (s.categories || []).map((c, i) =>
        '<div class="os-rep"><div class="os-rep-head">Item ' + (i + 1) +
          '<span class="x" data-del-cat="' + i + '">' + I.x + '</span></div>' +
          '<input class="os-mini" data-cat-label="' + i + '" value="' + esc(c.label) + '" placeholder="Label" style="margin-bottom:6px" />' +
          '<input class="os-mini" data-cat-href="' + i + '" value="' + esc(c.href) + '" placeholder="Link" />' +
        '</div>').join('') +
      '<button class="os-add-rep" data-add-cat>+ Add menu item</button>' +
      '<div class="muted" style="font-size:12px;margin-top:8px;line-height:1.5">Header and footer are global — changes apply to every page of the theme.</div>';
  }

  function footerForm(s) {
    return fArea('subscribeText', 'Newsletter copy', s.subscribeText) +
      fText('subscribeButtonText', 'Subscribe button', s.subscribeButtonText) +
      fText('copyrightText', 'Copyright', s.copyrightText) +
      '<div class="os-subhead">Link columns</div>' +
      (s.linkSections || []).map((sec, i) =>
        '<div class="os-rep"><div class="os-rep-head">' + esc(sec.title) +
          '<span class="muted" style="margin-left:auto;font-weight:400">' + (sec.links || []).length + ' links</span></div>' +
          '<input class="os-mini" data-foot-title="' + i + '" value="' + esc(sec.title) + '" placeholder="Column title" />' +
        '</div>').join('') +
      '<div class="os-subhead">Contact</div>' +
      (s.contactItems || []).map((c, i) =>
        '<div class="os-fld" style="margin-bottom:8px"><div class="os-fld-label">' + esc(c.label) + '</div>' +
          '<input class="input" data-contact="' + i + '" value="' + esc(c.value) + '" /></div>').join('');
  }

  // ---- WIRING ----
  function wireBuilder() {
    const b = document.getElementById('os-builder');
    if (!b) return;

    // back (with unsaved-changes guard)
    b.querySelector('#bld-back').onclick = () => attemptLeave(() => { location.hash = '#/online-store'; });

    // page-type select
    b.querySelector('#bld-pagesel').onclick = (e) => openPageTypeMenu(e.currentTarget);

    // viewport segmented
    b.querySelectorAll('#bld-seg button').forEach((btn) => btn.onclick = () => {
      const vp = btn.getAttribute('data-vp');
      if (vp === ED.viewport) return;
      ED.viewport = vp;
      refreshCenterAndTop();
    });

    // discard / save
    const disc = b.querySelector('#bld-discard');
    if (disc && ED.dirty) disc.onclick = () => openConfirm({
      title: 'Discard changes?',
      body: 'Are you sure you want to revert to the last saved state? Your unsaved changes will be lost.',
      okText: 'Discard',
      onOk: () => { startEditor(ED.theme.handle); renderBuilder(ED.theme.handle); toast('Reverted to last saved version'); },
    });
    const save = b.querySelector('#bld-save');
    if (save && ED.dirty) save.onclick = () => { ED.dirty = false; ED.theme.updated_time = nowStr(); refreshChrome(); toast('Design saved'); };

    // left tabs
    b.querySelectorAll('[data-lt]').forEach((t) => t.onclick = () => { ED.leftTab = t.getAttribute('data-lt'); refreshLeft(); });

    // add section from library
    b.querySelectorAll('[data-add]').forEach((el) => el.onclick = () => addSection(el.getAttribute('data-add')));

    // layers selection
    b.querySelectorAll('[data-sel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-sel') }));
    b.querySelectorAll('[data-gsel]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-gsel') }));

    // canvas selection
    b.querySelectorAll('[data-csel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-csel') }));
    b.querySelectorAll('[data-csel-global]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-csel-global') }));

    wireRightForm();
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
      inp.oninput = () => { target[inp.getAttribute('data-f')] = inp.value; markDirty(); refreshCanvasOnly(); syncColorChips(form); };
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
      // [delAttr, addAttr, arrKey, newItemFactory, fieldBindings...]
      { del: 'data-del-slide', add: 'data-add-slide', key: 'slides', make: () => ({ id: 'slide-' + Date.now(), url: D.IMG.hero2, alt: 'New slide', href: '/' }),
        binds: [['data-slide-alt', 'alt'], ['data-slide-href', 'href']] },
      { del: 'data-del-benefit', add: 'data-add-benefit', key: 'benefits', make: () => ({ title: 'NEW', subtitle: 'Edit me', variant: 'stat' }),
        binds: [['data-ben-title', 'title'], ['data-ben-sub', 'subtitle']] },
      { del: 'data-del-item', add: 'data-add-item', key: 'items', make: () => ({ url: D.IMG.cat5, alt: 'New tile', collectionId: 'all' }),
        binds: [['data-item-col', 'collectionId']] },
      { del: 'data-del-promo', add: 'data-add-promo', key: 'items', make: () => ({ url: D.IMG.cat6, alt: 'New promo', href: '/' }),
        binds: [['data-promo-href', 'href']] },
      { del: 'data-del-tab', add: 'data-add-tab', key: 'tabs', make: () => ({ key: 't' + Date.now(), label: 'New Tab', productCount: 8 }),
        binds: [['data-tab-label', 'label'], ['data-tab-count', 'productCount']] },
      { del: 'data-del-cat', add: 'data-add-cat', key: 'categories', make: () => ({ label: 'New', href: '/products' }),
        binds: [['data-cat-label', 'label'], ['data-cat-href', 'href']] },
    ];

    repeaterMap.forEach((R) => {
      if (!Array.isArray(target[R.key])) return;
      // field bindings
      R.binds.forEach(([attr, prop]) => {
        form.querySelectorAll('[' + attr + ']').forEach((inp) => {
          inp.oninput = () => { const i = Number(inp.getAttribute(attr)); if (target[R.key][i]) { target[R.key][i][prop] = inp.value; markDirty(); refreshCanvasOnly(); } };
        });
      });
      // delete
      form.querySelectorAll('[' + R.del + ']').forEach((x) => x.onclick = () => {
        const i = Number(x.getAttribute(R.del)); target[R.key].splice(i, 1); markDirty(); refreshRightAndCanvas();
      });
      // add
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

  function syncColorChips(form) {
    form.querySelectorAll('[data-f]').forEach((inp) => {
      const chip = inp.parentElement && inp.parentElement.querySelector('.chip-color');
      if (chip) chip.style.background = inp.value;
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
    // seed new section from the matching sample (so it looks real), else minimal
    const sample = (D.PAGES.HOME.concat(D.PAGES.PRODUCT_LIST, D.PAGES.PRODUCT_DETAIL)).find((s) => s.componentId === componentId);
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
    // scroll canvas to bottom so the new section is visible
    const sc = document.getElementById('bld-canvas-scroll'); if (sc) sc.scrollTop = sc.scrollHeight;
    toast('Added ' + lib.label);
  }

  function removeSection(instanceId) {
    const idx = ED.sections.findIndex((x) => x.instanceId === instanceId);
    if (idx === -1) return;
    const nm = ED.sections[idx].name;
    ED.sections.splice(idx, 1);
    ED.selected = null;
    ED.dirty = true;
    renderBuilder(ED.theme.handle);
    toast('Removed ' + nm);
  }

  // ---- partial refreshers (avoid full rebuild where possible) ----
  function refreshChrome() {
    // re-render top bar (Discard/Save enabled state) in place
    const b = document.getElementById('os-builder');
    if (!b) return;
    const oldTop = b.querySelector('.os-bld-top');
    const newTop = builderTopBar();
    oldTop.replaceWith(newTop);
    // rewire top-bar controls
    newTop.querySelector('#bld-back').onclick = () => attemptLeave(() => { location.hash = '#/online-store'; });
    newTop.querySelector('#bld-pagesel').onclick = (e) => openPageTypeMenu(e.currentTarget);
    newTop.querySelectorAll('#bld-seg button').forEach((btn) => btn.onclick = () => { const vp = btn.getAttribute('data-vp'); if (vp !== ED.viewport) { ED.viewport = vp; refreshCenterAndTop(); } });
    const disc = newTop.querySelector('#bld-discard');
    if (disc && ED.dirty) disc.onclick = () => openConfirm({ title: 'Discard changes?', body: 'Are you sure you want to revert to the last saved state? Your unsaved changes will be lost.', okText: 'Discard', onOk: () => { startEditor(ED.theme.handle); renderBuilder(ED.theme.handle); toast('Reverted to last saved version'); } });
    const save = newTop.querySelector('#bld-save');
    if (save && ED.dirty) save.onclick = () => { ED.dirty = false; ED.theme.updated_time = nowStr(); refreshChrome(); toast('Design saved'); };
  }

  function refreshLeft() {
    const b = document.getElementById('os-builder');
    if (!b) return;
    const old = b.querySelector('.os-left');
    const nw = builderLeft();
    old.replaceWith(nw);
    nw.querySelectorAll('[data-lt]').forEach((t) => t.onclick = () => { ED.leftTab = t.getAttribute('data-lt'); refreshLeft(); });
    nw.querySelectorAll('[data-add]').forEach((el) => el.onclick = () => addSection(el.getAttribute('data-add')));
    nw.querySelectorAll('[data-sel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-sel') }));
    nw.querySelectorAll('[data-gsel]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-gsel') }));
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
    nw.querySelectorAll('[data-csel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-csel') }));
    nw.querySelectorAll('[data-csel-global]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-csel-global') }));
    refreshChrome();
  }

  function refreshCanvasOnly() {
    const frame = document.getElementById('bld-frame');
    if (!frame) return;
    frame.className = 'os-frame ' + ED.viewport;
    frame.innerHTML = canvasHtml();
    frame.querySelectorAll('[data-csel]').forEach((el) => el.onclick = () => select({ scope: 'section', instanceId: el.getAttribute('data-csel') }));
    frame.querySelectorAll('[data-csel-global]').forEach((el) => el.onclick = () => select({ scope: 'global', componentId: el.getAttribute('data-csel-global') }));
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
    const pop = h('<div class="menu-pop" style="position:fixed;min-width:180px"></div>');
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
      ED.dirty = false;
      renderBuilder(ED.theme.handle);
    };
    if (!ED.dirty) { doSwitch(); return; }
    // unsaved-changes modal: Save and switch / Discard and switch / Cancel
    openSwitchModal(pt, doSwitch);
  }

  // ---- MODALS ----
  function openConfirm({ title, body, okText, onOk }) {
    const backdrop = h('<div class="modal-backdrop" style="z-index:130"></div>');
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

  // Switch-page unsaved-changes modal (mirrors handlePageTypeChange in themeEdit.tsx)
  function openSwitchModal(pt, doSwitch) {
    const label = (D.PAGE_TYPES.find((p) => p.value === pt) || {}).label || pt;
    const backdrop = h('<div class="modal-backdrop" style="z-index:130"></div>');
    const m = h('<div class="modal" style="width:520px"></div>');
    m.innerHTML =
      '<div class="modal-head">Unsaved changes</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">' +
        'You have unsaved changes on this page. Do you want to save them before switching to <b>' + esc(label) + '</b>?</div></div>' +
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

  // Leaving the builder with unsaved changes (mirrors handleClose in themeEdit.tsx)
  function attemptLeave(proceed) {
    if (!ED || !ED.dirty) { proceed(); return; }
    const backdrop = h('<div class="modal-backdrop" style="z-index:130"></div>');
    const m = h('<div class="modal"></div>');
    m.innerHTML =
      '<div class="modal-head">Are you sure you want to leave?</div>' +
      '<div class="modal-body"><div class="subtle" style="font-size:13.5px;line-height:1.6">Unsaved changes will be lost.</div></div>' +
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
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  // ========================================================================
  //  SIDEBAR ACTIVE STATE
  // ========================================================================
  // The shared manifest (assets/nav.js) still lists this module as `planned`,
  // so the shell renders it as a non-clickable "Soon" placeholder. This prototype
  // is built, so upgrade our own entry in place to the active link the shell would
  // emit for a `ready` module. Scoped to this page only — no shared file is touched.
  function activateSidebar() {
    const aside = document.querySelector('aside.app-sidebar');
    if (!aside) return false;
    const node = [...aside.querySelectorAll('.nav-item')].find((n) => {
      const span = n.querySelector('span:not(.nav-soon)');
      return span && span.textContent.trim() === 'Online store';
    });
    if (!node) return false;
    if (node.tagName === 'A' && node.classList.contains('active')) return true; // already correct
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
  // shell.js runs synchronously before this file, but guard for ordering just in case.
  if (!activateSidebar()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activateSidebar);
    else setTimeout(activateSidebar, 0);
  }

  // ========================================================================
  //  ROUTER (SPA: registered with the shell router)
  // ========================================================================
  // `rest` is the hash part after `online-store` (e.g. '' for the list,
  // 'edit/<handle>' for the builder).
  function route(rest) {
    closePops();
    const m = (rest || '').match(/^edit\/(.+)$/);
    if (m) { renderBuilder(decodeURIComponent(m[1])); }
    else { renderList(); }
  }

  window.VIEWS = window.VIEWS || {};
  window.VIEWS['online-store'] = { render: function (el, rest) { root = el; route(rest || ''); } };
})();
