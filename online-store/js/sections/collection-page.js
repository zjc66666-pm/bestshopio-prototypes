/* Collection page — product feed with filters, sort, pagination.
   Ported from the team's collection-canvas-demo (collectionPage section), re-homed onto the
   BestShopio OS section framework: schema uses our 15 control types, the grid reuses the shared
   OS.productCard (Theme settings › Product cards) with this section's per-card overrides, and the
   chrome inherits theme tokens. Filters render as Sidebar / Drawer / Topbar on desktop; mobile is
   always a Drawer. Pagination supports Pages / Load more / Infinite scroll. */
(function () {
  const OS = window.OS;
  OS.css('collection-page', [
    '.cpgx{box-sizing:border-box;position:relative}.cpgx *{box-sizing:border-box}',
    '.cpgx .cpg-bc{font-size:12px;opacity:.6;margin-bottom:10px}',
    '.cpgx h1{margin:0 0 6px;line-height:1.1}',
    '.cpgx .cpg-desc{font-size:14px;line-height:1.6;opacity:.8;max-width:720px}',
    '.cpgx .cpg-count{font-size:13px;opacity:.6;margin-top:8px}',
    '.cpgx .cpg-body{display:grid;grid-template-columns:230px 1fr;gap:32px;margin-top:22px;align-items:start}',
    '.cpgx .cpg-body.nosb{grid-template-columns:1fr}',
    '.cpgx .cpg-side{position:sticky;top:12px}',
    '.cpgx .cpg-ftitle{font-weight:700;font-size:14px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between}',
    '.cpgx .cpg-fgroup{border-bottom:1px solid rgba(0,0,0,.1);padding:12px 0}',
    '.cpgx .cpg-fh{display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:13.5px;font-weight:600}',
    '.cpgx .cpg-fh .cnt{font-weight:400;opacity:.5;font-size:12px;margin-left:6px}',
    '.cpgx .cpg-fh .cv{transition:transform .2s}.cpgx .cpg-fgroup.collapsed .cpg-fh .cv{transform:rotate(-90deg)}',
    '.cpgx .cpg-fbody{padding-top:10px;display:flex;flex-wrap:wrap;gap:8px}.cpgx .cpg-fgroup.collapsed .cpg-fbody{display:none}',
    '.cpgx .cpg-fopt{font-size:12.5px;border:1px solid rgba(0,0,0,.18);border-radius:6px;padding:5px 10px;cursor:pointer;background:none;font-family:inherit;color:inherit}.cpgx .cpg-fopt.on{border-color:currentColor;background:rgba(0,0,0,.04);font-weight:600}',
    '.cpgx .cpg-sw{width:24px;height:24px;border-radius:50%;border:1px solid rgba(0,0,0,.15);cursor:pointer;box-shadow:0 0 0 2px transparent;padding:0}.cpgx .cpg-sw.on{box-shadow:0 0 0 2px currentColor}',
    '.cpgx .cpg-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}',
    '.cpgx .cpg-topbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}',
    '.cpgx .cpg-tb-g{position:relative}',
    '.cpgx .cpg-tb-btn{font-size:13px;border:1px solid rgba(0,0,0,.2);border-radius:8px;height:36px;padding:0 12px;background:#fff;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;color:inherit}',
    '.cpgx .cpg-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.cpgx .cpg-chip{font-size:12px;border:1px solid rgba(0,0,0,.15);border-radius:999px;padding:4px 10px;display:inline-flex;gap:6px;align-items:center}.cpgx .cpg-chip b{cursor:pointer}',
    '.cpgx .cpg-clear{font-size:12px;opacity:.6;cursor:pointer}',
    '.cpgx .cpg-sort{height:36px;border:1px solid rgba(0,0,0,.2);border-radius:8px;padding:0 10px;font-family:inherit;font-size:13px;background:#fff;color:inherit}',
    '.cpgx .cpg-grid{display:grid}',
    '.cpgx .cpg-list .oc-card{display:grid;grid-template-columns:160px 1fr;gap:16px;text-align:left!important;align-items:center}',
    '.cpgx .cpg-list .oc-img{margin-bottom:0}',
    '.cpgx .cpg-mfilter{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(0,0,0,.2);border-radius:8px;height:36px;padding:0 12px;background:#fff;cursor:pointer;font-family:inherit;font-size:13px;color:inherit}',
    '.cpgx .cpg-pager{display:flex;justify-content:center;gap:6px;margin-top:28px}',
    '.cpgx .cpg-pg{min-width:34px;height:34px;border:1px solid rgba(0,0,0,.15);border-radius:6px;display:grid;place-items:center;font-size:13px;cursor:pointer;background:none;color:inherit;font-family:inherit}.cpgx .cpg-pg.on{border-color:currentColor;font-weight:700}',
    '.cpgx .cpg-more{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:26px}',
    '.cpgx .cpg-morebtn{cursor:pointer;font-family:inherit}',
    '.cpgx .cpg-inf{font-size:12px;opacity:.55;margin-top:24px;text-align:center}',
    '.cpgx .cpg-empty{padding:50px 20px;text-align:center;opacity:.7;font-size:14px}',
    /* slide-in drawer (mobile + desktop "Drawer" layout) */
    '.cpgx .cpg-drawer{position:absolute;inset:0;z-index:30;display:none}',
    '.cpgx .cpg-drawer.open{display:block}',
    '.cpgx .cpg-dback{position:absolute;inset:0;background:rgba(0,0,0,.35)}',
    '.cpgx .cpg-dpanel{position:absolute;top:0;bottom:0;left:0;width:300px;max-width:84%;background:#fff;color:#1a1a1a;padding:18px;overflow:auto;box-shadow:2px 0 18px rgba(0,0,0,.18)}',
    '.cpgx .cpg-dhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:700}',
    '.cpgx .cpg-dx{border:none;background:none;cursor:pointer;color:inherit;padding:4px}',
    '.cpgx .cpg-dapply{margin-top:16px;width:100%;cursor:pointer;font-family:inherit}',
    '.cpgx.mob .cpg-body{grid-template-columns:1fr}.cpgx.mob .cpg-side,.cpgx.mob .cpg-topbar{display:none}',
  ].join(''));

  const COLLECTION = { title: 'Best sellers', description: 'Our most-loved pieces — the styles customers keep coming back for, across every category.', count: 48 };
  const SORTS = [
    { value: 'featured', label: 'Featured' }, { value: 'best-selling', label: 'Best selling' },
    { value: 'price-asc', label: 'Price, low to high' }, { value: 'price-desc', label: 'Price, high to low' },
    { value: 'date-desc', label: 'Date, new to old' }, { value: 'date-asc', label: 'Date, old to new' },
  ];
  // filter groups (counts are illustrative storefront facets)
  const FILTERS = [
    { name: 'Color', kind: 'swatch', opts: [['#1b1f24', 'Black'], ['#33415c', 'Navy'], ['#c8b6a6', 'Sand'], ['#1b3a2b', 'Forest'], ['#b08968', 'Tan']] },
    { name: 'Size', kind: 'opt', opts: ['XS', 'S', 'M', 'L', 'XL'] },
    { name: 'Price', kind: 'opt', opts: ['Under $25', '$25–$50', '$50–$100', '$100+'] },
    { name: 'Availability', kind: 'opt', opts: ['In stock', 'On sale'] },
  ];
  const FCOUNT = { Color: 5, Size: 5, Price: 4, Availability: 2 };

  OS.register('collection-page', {
    name: 'Collection page', group: 'collection', icon: 'grid',
    schema: [
      { sub: 'Layout' },
      { key: 'products_per_page', control: 'number', label: 'Products per page', default: 12, min: 12, max: 100, step: 1, info: 'Products shown before pagination / load more.' },
      { key: 'products_per_row_mobile', control: 'segmented', label: 'Products per row · Mobile', default: '2', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'products_per_row_desktop', control: 'range', label: 'Products per row · Desktop', default: 4, min: 2, max: 6, step: 1 },
      { key: 'layout_type', control: 'select', label: 'Layout type', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
      { sub: 'Page header' },
      { key: 'show_breadcrumb', control: 'toggle', label: 'Show breadcrumb', default: true },
      { key: 'show_collection_title', control: 'toggle', label: 'Show collection title', default: true },
      { key: 'show_collection_description', control: 'toggle', label: 'Show collection description', default: true },
      { key: 'show_product_count', control: 'toggle', label: 'Show product count', default: true },
      { sub: 'Product card' },
      { key: 'show_badge', control: 'toggle', label: 'Show badge', default: true, info: 'Auto discount label, e.g. 30% OFF.' },
      { key: 'show_custom_badge', control: 'toggle', label: 'Show custom badge', default: false, info: 'Manual labels, e.g. Best seller.' },
      { key: 'show_collection_badge', control: 'toggle', label: 'Show collection badge', default: false },
      { key: 'show_vendor', control: 'toggle', label: 'Show vendor', default: false },
      { key: 'show_rating', control: 'toggle', label: 'Show rating', default: true, info: 'Inherits Theme settings.' },
      { key: 'show_color_swatches', control: 'toggle', label: 'Show color swatches', default: true, info: 'Inherits Theme settings.' },
      { key: 'swatch_type', control: 'select', label: 'Swatch type', default: 'color', options: [{ value: 'color', label: 'Color' }, { value: 'variant-image', label: 'Variant image' }], visibleWhen: (v) => v.show_color_swatches },
      { key: 'show_quick_add', control: 'toggle', label: 'Show quick add', default: true, info: 'Inherits Theme settings.' },
      { key: 'enable_image_hover', control: 'toggle', label: 'Enable image hover switch', default: true, info: 'Desktop: swap to 2nd image on hover.' },
      { sub: 'Promotion text' },
      { key: 'show_promotion_text', control: 'toggle', label: 'Show promotion text', default: true },
      { key: 'promotion_text_source', control: 'select', label: 'Promotion text source', default: 'metafield', options: [{ value: 'metafield', label: 'Product metafield' }, { value: 'custom', label: 'Custom text' }], visibleWhen: (v) => v.show_promotion_text },
      { key: 'custom_promotion_text', control: 'text', label: 'Custom promotion text', default: '', placeholder: 'e.g. Buy 2 Save 10%', visibleWhen: (v) => v.show_promotion_text && v.promotion_text_source === 'custom' },
      { sub: 'Filters' },
      { key: 'show_filters', control: 'toggle', label: 'Show filters', default: true },
      { key: 'desktop_layout', control: 'select', label: 'Desktop layout', default: 'sidebar', options: [{ value: 'sidebar', label: 'Sidebar (left)' }, { value: 'drawer', label: 'Drawer (slide-in)' }, { value: 'topbar', label: 'Topbar (above grid)' }], visibleWhen: (v) => v.show_filters },
      { info: 'Mobile filter layout is always Drawer.' },
      { key: 'open_first_group', control: 'toggle', label: 'Open first group by default', default: false, visibleWhen: (v) => v.show_filters },
      { key: 'show_filter_count', control: 'toggle', label: 'Show filter count', default: true, visibleWhen: (v) => v.show_filters },
      { key: 'show_group_name', control: 'toggle', label: 'Show group name', default: true, visibleWhen: (v) => v.show_filters },
      { sub: 'Sort' },
      { key: 'show_sort_by', control: 'toggle', label: 'Show sort by', default: true },
      { key: 'default_sort', control: 'select', label: 'Default sort', default: 'featured', options: SORTS, visibleWhen: (v) => v.show_sort_by },
      { sub: 'Pagination' },
      { key: 'pagination_type', control: 'select', label: 'Pagination type', default: 'pagination', options: [{ value: 'pagination', label: 'Pagination' }, { value: 'load-more', label: 'Load more' }, { value: 'infinite-scroll', label: 'Infinite scroll' }] },
      { key: 'empty_collection_text', control: 'text', label: 'Empty collection text', default: 'No products found', placeholder: 'No products found' },
      { sub: 'Section style' },
      { key: 'container_max_width', control: 'number', label: 'Container max width', default: '', min: 600, max: 1600, step: 10, info: 'Blank = theme content width. px.' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank = inherit theme text color.' },
      { key: 'padding_top', control: 'number', label: 'Padding top', default: '', min: 0, max: 160, step: 4, info: 'Blank = theme spacing. px.' },
      { key: 'padding_bottom', control: 'number', label: 'Padding bottom', default: '', min: 0, max: 160, step: 4, info: 'Blank = theme spacing. px.' },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padT = (s.padding_top === '' || s.padding_top == null) ? OS.secSpace(t, mob) : Number(s.padding_top);
      const padB = (s.padding_bottom === '' || s.padding_bottom == null) ? OS.secSpace(t, mob) : Number(s.padding_bottom);
      const padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = (s.container_max_width ? Number(s.container_max_width) : OS.pageWidth(t)) + 'px';
      const cols = s.layout_type === 'list' ? 1 : (mob ? (Number(s.products_per_row_mobile) || 2) : OS.clamp(s.products_per_row_desktop, 2, 6, 4));
      const limit = OS.clamp(s.products_per_page, 12, 100, 12);

      // product feed (sample loops to fill the requested page size)
      const cardOpts = {
        showVendor: s.show_vendor, showRating: s.show_rating, showQuickAdd: s.show_quick_add,
        enableHover: s.enable_image_hover, showSaleBadge: s.show_badge,
        showCustomBadge: s.show_custom_badge, showCollectionBadge: s.show_collection_badge,
        showSwatches: s.show_color_swatches, swatchType: s.swatch_type,
        showPromoText: s.show_promotion_text, promoSource: s.promotion_text_source, promoText: s.custom_promotion_text,
      };
      const prodAt = (i) => OS.sample.products[i % OS.sample.products.length];
      const cardsHtml = (from, to) => { let o = ''; for (let i = from; i < to; i++) o += OS.productCard(prodAt(i), t, cardOpts); return o; };

      const header = '<div>' +
        (s.show_breadcrumb ? '<div class="cpg-bc">Home / Collections / ' + OS.esc(COLLECTION.title) + '</div>' : '') +
        (s.show_collection_title ? '<h1 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a') + '">' + OS.esc(COLLECTION.title) + '</h1>' : '') +
        (s.show_collection_description ? '<div class="cpg-desc">' + OS.esc(COLLECTION.description) + '</div>' : '') +
        (s.show_product_count ? '<div class="cpg-count">' + COLLECTION.count + ' products</div>' : '') + '</div>';

      // filter group builder — reused by sidebar, drawer, and topbar layouts
      const optHtml = (g) => g.opts.map((o, i) => g.kind === 'swatch'
        ? '<button class="cpg-sw' + (i === 0 ? ' on' : '') + '" data-cpg-opt title="' + OS.esc(o[1]) + '" style="background:' + o[0] + '"></button>'
        : '<button class="cpg-fopt' + (g.name === 'Size' && i === 1 ? ' on' : '') + '" data-cpg-opt>' + OS.esc(o) + '</button>').join('');
      const groupHtml = (g, idx) => {
        const open = s.open_first_group ? idx === 0 : false;
        const cnt = s.show_filter_count ? '<span class="cnt">' + (FCOUNT[g.name] || g.opts.length) + '</span>' : '';
        const label = s.show_group_name ? g.name : 'Filter';
        return '<div class="cpg-fgroup' + (open ? '' : ' collapsed') + '"><div class="cpg-fh" data-cpg-fh>' + OS.esc(label) + cnt + '<span class="cv">' + OS.icon('chev') + '</span></div><div class="cpg-fbody">' + optHtml(g) + '</div></div>';
      };
      const groupsHtml = FILTERS.map(groupHtml).join('');

      // active-filter chips + sort + result count toolbar
      const chips = s.show_filters ? '<div class="cpg-chips"><span class="cpg-chip">Black <b data-cpg-chip>×</b></span><span class="cpg-chip">Size M <b data-cpg-chip>×</b></span><span class="cpg-clear" data-cpg-clear>Clear all</span></div>' : '<span></span>';
      const sortSel = s.show_sort_by ? '<select class="cpg-sort">' + SORTS.map((o) => '<option value="' + o.value + '"' + (o.value === s.default_sort ? ' selected' : '') + '>' + o.label + '</option>').join('') + '</select>' : '';
      const resultCount = '<span style="font-size:13px;opacity:.6">' + limit + ' of ' + COLLECTION.count + '</span>';

      const desk = mob ? 'drawer' : (s.desktop_layout || 'sidebar');
      const useSidebar = s.show_filters && desk === 'sidebar' && !mob;
      const useTopbar = s.show_filters && desk === 'topbar' && !mob;
      const useDrawer = s.show_filters && (desk === 'drawer' || mob);

      const filterBtn = useDrawer ? '<button class="cpg-mfilter" data-cpg-drawer>' + OS.icon('layers') + ' Filters</button>' : '';
      const topbarRow = useTopbar ? '<div class="cpg-topbar">' + FILTERS.map((g) => '<div class="cpg-tb-g"><button class="cpg-tb-btn" data-cpg-tb>' + OS.esc(s.show_group_name ? g.name : 'Filter') + (s.show_filter_count ? ' (' + (FCOUNT[g.name] || g.opts.length) + ')' : '') + ' ' + OS.icon('chev') + '</button></div>').join('') + '</div>' : '';

      // top toolbar: filters chips/btn on the left, sort + count on the right
      const barLeft = useSidebar ? chips : (useDrawer ? filterBtn : (s.show_filters ? chips : '<span></span>'));
      const barRight = '<div style="display:flex;align-items:center;gap:12px">' + resultCount + sortSel + '</div>';
      const bar = '<div class="cpg-bar">' + barLeft + barRight + '</div>';

      const grid = '<div class="cpg-grid' + (s.layout_type === 'list' ? ' cpg-list' : '') + '" data-cpg-grid style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + Math.max(gap, 16) + 'px" data-next="' + limit + '">' + cardsHtml(0, limit) + '</div>';

      // pagination footer varies by type
      let foot = '';
      if (s.pagination_type === 'pagination') foot = '<div class="cpg-pager">' + [1, 2, 3].map((n) => '<button class="cpg-pg' + (n === 1 ? ' on' : '') + '">' + n + '</button>').join('') + '<button class="cpg-pg">' + OS.icon('chevR') + '</button></div>';
      else if (s.pagination_type === 'load-more') foot = '<div class="cpg-more"><button class="cpg-morebtn" data-cpg-more style="' + OS.btnStyle(t, { variant: 'secondary' }) + '">Load more</button><span style="font-size:12px;opacity:.55">Showing ' + limit + ' of ' + COLLECTION.count + '</span></div>';
      else foot = '<div class="cpg-inf" data-cpg-inf>↻ Loading more as you scroll…</div>';

      const right = '<div>' + topbarRow + bar + grid + foot + '</div>';

      // slide-in drawer markup (rendered once; toggled in hydrate)
      const drawer = useDrawer ? '<div class="cpg-drawer" data-cpg-drawerel><div class="cpg-dback" data-cpg-dclose></div><div class="cpg-dpanel"><div class="cpg-dhead">Filters <button class="cpg-dx" data-cpg-dclose>' + OS.icon('x') + '</button></div>' + groupsHtml + '<button class="cpg-dapply" data-cpg-dclose style="' + OS.btnStyle(t) + '">Apply</button></div></div>' : '';

      const sidebar = useSidebar ? '<aside class="cpg-side"><div class="cpg-ftitle">Filters</div>' + groupsHtml + '</aside>' : '';

      return '<div class="cpgx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padT + 'px ' + padH + 'px ' + padB + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + header +
        '<div class="cpg-body' + (useSidebar ? '' : ' nosb') + '">' + sidebar + right + '</div></div>' + drawer +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') + '</div>';
    },
    hydrate: function (root, s, blocks, ctx) {
      const t = ctx && ctx.tokens;
      // collapsible filter groups
      root.querySelectorAll('[data-cpg-fh]').forEach((hd) => hd.addEventListener('click', (e) => { e.stopPropagation(); hd.closest('.cpg-fgroup').classList.toggle('collapsed'); }));
      // toggle filter option pills / swatches
      root.querySelectorAll('[data-cpg-opt]').forEach((o) => o.addEventListener('click', (e) => { e.stopPropagation(); o.classList.toggle('on'); }));
      // active-filter chips remove + clear all
      root.querySelectorAll('[data-cpg-chip]').forEach((x) => x.addEventListener('click', (e) => { e.stopPropagation(); x.closest('.cpg-chip').remove(); }));
      const clr = root.querySelector('[data-cpg-clear]'); if (clr) clr.addEventListener('click', (e) => { e.stopPropagation(); root.querySelectorAll('.cpg-chip').forEach((c) => c.remove()); });
      // drawer open/close
      const drawerEl = root.querySelector('[data-cpg-drawerel]');
      const openBtn = root.querySelector('[data-cpg-drawer]');
      if (openBtn && drawerEl) openBtn.addEventListener('click', (e) => { e.stopPropagation(); drawerEl.classList.add('open'); });
      root.querySelectorAll('[data-cpg-dclose]').forEach((x) => x.addEventListener('click', (e) => { e.stopPropagation(); if (drawerEl) drawerEl.classList.remove('open'); }));
      // topbar dropdown buttons (visual toggle of the drawer for the demo)
      root.querySelectorAll('[data-cpg-tb]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); if (drawerEl) drawerEl.classList.add('open'); }));
      // load more — append another page of cards
      const grid = root.querySelector('[data-cpg-grid]');
      const more = root.querySelector('[data-cpg-more]');
      const appendPage = () => {
        if (!grid) return; const cardOpts = {
          showVendor: s.show_vendor, showRating: s.show_rating, showQuickAdd: s.show_quick_add, enableHover: s.enable_image_hover,
          showSaleBadge: s.show_badge, showCustomBadge: s.show_custom_badge, showCollectionBadge: s.show_collection_badge,
          showSwatches: s.show_color_swatches, swatchType: s.swatch_type, showPromoText: s.show_promotion_text,
          promoSource: s.promotion_text_source, promoText: s.custom_promotion_text,
        };
        const next = Number(grid.getAttribute('data-next')) || 0;
        const add = OS.clamp(s.products_per_page, 12, 100, 12);
        let html = ''; for (let i = next; i < next + add; i++) html += OS.productCard(OS.sample.products[i % OS.sample.products.length], t, cardOpts);
        grid.insertAdjacentHTML('beforeend', html); grid.setAttribute('data-next', next + add);
      };
      if (more) more.addEventListener('click', (e) => { e.stopPropagation(); appendPage(); });
      // infinite scroll — append once when the sentinel enters view
      const inf = root.querySelector('[data-cpg-inf]');
      if (inf && 'IntersectionObserver' in window) {
        let fired = 0;
        const io = new IntersectionObserver((ents) => { ents.forEach((en) => { if (en.isIntersecting && fired < 2) { fired++; appendPage(); } }); });
        io.observe(inf);
      }
    },
  });
})();
