/* Collection page — product feed with filters, sort, pagination. Built from PRD V1.137.4 (doc5).
   Product cards inherit Theme settings › Product cards. Desktop sidebar / mobile filter drawer. */
(function () {
  const OS = window.OS;
  OS.css('collection-page', [
    '.cpgx{box-sizing:border-box}.cpgx *{box-sizing:border-box}',
    '.cpgx .cpg-bc{font-size:12px;opacity:.6;margin-bottom:10px}',
    '.cpgx h1{margin:0 0 6px;line-height:1.1}',
    '.cpgx .cpg-desc{font-size:14px;line-height:1.6;opacity:.8;max-width:720px}',
    '.cpgx .cpg-count{font-size:13px;opacity:.6;margin-top:8px}',
    '.cpgx .cpg-body{display:grid;grid-template-columns:230px 1fr;gap:32px;margin-top:22px;align-items:start}',
    '.cpgx .cpg-side{position:sticky;top:12px}',
    '.cpgx .cpg-fgroup{border-bottom:1px solid rgba(0,0,0,.1);padding:12px 0}',
    '.cpgx .cpg-fh{display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:13.5px;font-weight:600}',
    '.cpgx .cpg-fh .cv{transition:transform .2s}.cpgx .cpg-fgroup.collapsed .cpg-fh .cv{transform:rotate(-90deg)}',
    '.cpgx .cpg-fbody{padding-top:10px;display:flex;flex-wrap:wrap;gap:8px}.cpgx .cpg-fgroup.collapsed .cpg-fbody{display:none}',
    '.cpgx .cpg-fopt{font-size:12.5px;border:1px solid rgba(0,0,0,.18);border-radius:6px;padding:5px 10px;cursor:pointer;background:none;font-family:inherit}.cpgx .cpg-fopt.on{border-color:currentColor;background:rgba(0,0,0,.04);font-weight:600}',
    '.cpgx .cpg-sw{width:24px;height:24px;border-radius:50%;border:1px solid rgba(0,0,0,.15);cursor:pointer;box-shadow:0 0 0 2px transparent}.cpgx .cpg-sw.on{box-shadow:0 0 0 2px currentColor}',
    '.cpgx .cpg-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}',
    '.cpgx .cpg-chips{display:flex;gap:8px;flex-wrap:wrap}.cpgx .cpg-chip{font-size:12px;border:1px solid rgba(0,0,0,.15);border-radius:999px;padding:4px 10px;display:inline-flex;gap:6px;align-items:center}.cpgx .cpg-chip b{cursor:pointer}',
    '.cpgx .cpg-sort{height:36px;border:1px solid rgba(0,0,0,.2);border-radius:8px;padding:0 10px;font-family:inherit;font-size:13px;background:#fff}',
    '.cpgx .cpg-grid{display:grid}',
    '.cpgx .cpg-list .oc-card{display:grid;grid-template-columns:160px 1fr;gap:16px;text-align:left!important;align-items:center}',
    '.cpgx .cpg-list .oc-img{margin-bottom:0}',
    '.cpgx .cpg-mfilter{display:none}',
    '.cpgx .cpg-pager{display:flex;justify-content:center;gap:6px;margin-top:28px}',
    '.cpgx .cpg-pg{min-width:34px;height:34px;border:1px solid rgba(0,0,0,.15);border-radius:6px;display:grid;place-items:center;font-size:13px;cursor:pointer}.cpgx .cpg-pg.on{border-color:currentColor;font-weight:700}',
    '.cpgx.mob .cpg-body{grid-template-columns:1fr}.cpgx.mob .cpg-side{display:none}.cpgx.mob .cpg-mfilter{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(0,0,0,.2);border-radius:8px;height:36px;padding:0 12px;background:#fff;cursor:pointer;font-family:inherit;font-size:13px}',
  ].join(''));

  const COLLECTION = { title: 'Maternity Jeans', description: 'Side-panel and over-bump fits in soft, recovery denim — cut for every trimester and beyond.', count: 136 };
  const SORTS = ['Featured', 'Best selling', 'Price: low to high', 'Price: high to low', 'Newest'];
  const COLORS = ['#1b1f24', '#33415c', '#c8b6a6', '#1b3a2b', '#b08968'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

  OS.register('collection-page', {
    name: 'Collection page', group: 'collection', icon: 'grid',
    schema: [
      { key: 'layout_type', control: 'segmented', label: 'Layout type', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
      { key: 'products_per_row_desktop', control: 'select', label: 'Products per row · Desktop', default: '4', options: ['2', '3', '4', '5'].map((v) => ({ value: v, label: v })) },
      { key: 'products_per_row_mobile', control: 'select', label: 'Products per row · Mobile', default: '2', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'products_per_page', control: 'number', label: 'Products per page', default: 8, min: 4, max: 50 },
      { sub: 'Page header' },
      { key: 'show_breadcrumb', control: 'toggle', label: 'Show breadcrumb', default: true },
      { key: 'show_collection_title', control: 'toggle', label: 'Show collection title', default: true },
      { key: 'show_collection_description', control: 'toggle', label: 'Show collection description', default: true },
      { key: 'show_product_count', control: 'toggle', label: 'Show product count', default: true },
      { sub: 'Filtering & sorting' },
      { key: 'show_filters', control: 'toggle', label: 'Show filters', default: true },
      { key: 'desktop_filter_layout', control: 'select', label: 'Desktop filter layout', default: 'sidebar', options: [{ value: 'sidebar', label: 'Sidebar' }, { value: 'drawer', label: 'Drawer' }, { value: 'topbar', label: 'Top bar' }] },
      { key: 'show_sort', control: 'toggle', label: 'Show sort by', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = OS.pageWidth(t) + 'px';
      const cols = s.layout_type === 'list' ? 1 : (mob ? (Number(s.products_per_row_mobile) || 2) : (Number(s.products_per_row_desktop) || 4));
      const limit = OS.clamp(s.products_per_page, 4, 50, 8);
      const prods = []; for (let i = 0; i < limit; i++) prods.push(OS.sample.products[i % OS.sample.products.length]);

      const header = '<div>' +
        (s.show_breadcrumb ? '<div class="cpg-bc">Home / Collections / ' + OS.esc(COLLECTION.title) + '</div>' : '') +
        (s.show_collection_title ? '<h1 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a') + '">' + OS.esc(COLLECTION.title) + '</h1>' : '') +
        (s.show_collection_description ? '<div class="cpg-desc">' + OS.esc(COLLECTION.description) + '</div>' : '') +
        (s.show_product_count ? '<div class="cpg-count">' + COLLECTION.count + ' products</div>' : '') + '</div>';

      const fgroup = (name, body, open) => '<div class="cpg-fgroup' + (open ? '' : ' collapsed') + '"><div class="cpg-fh" data-cpg-fh>' + name + '<span class="cv">' + OS.icon('chev') + '</span></div><div class="cpg-fbody">' + body + '</div></div>';
      const sidebar = s.show_filters ? '<aside class="cpg-side"><div style="font-weight:700;font-size:14px;margin-bottom:6px">Filters</div>' +
        fgroup('Color', COLORS.map((c, i) => '<button class="cpg-sw' + (i === 0 ? ' on' : '') + '" data-cpg-opt style="background:' + c + '"></button>').join(''), true) +
        fgroup('Size', SIZES.map((z, i) => '<button class="cpg-fopt' + (i === 1 ? ' on' : '') + '" data-cpg-opt>' + z + '</button>').join(''), true) +
        fgroup('Price', ['Under $25', '$25–$50', '$50–$100', '$100+'].map((z) => '<button class="cpg-fopt" data-cpg-opt>' + z + '</button>').join(''), true) +
        fgroup('Availability', ['In stock', 'On sale'].map((z) => '<button class="cpg-fopt" data-cpg-opt>' + z + '</button>').join(''), false) +
        '</aside>' : '';

      const sortSel = s.show_sort ? '<select class="cpg-sort">' + SORTS.map((o) => '<option>' + o + '</option>').join('') + '</select>' : '<span></span>';
      const chips = s.show_filters ? '<div class="cpg-chips"><span class="cpg-chip">Black <b>×</b></span><span class="cpg-chip">Size M <b>×</b></span><span style="font-size:12px;opacity:.6;cursor:pointer;align-self:center">Clear all</span></div>' : '<span></span>';
      const bar = '<div class="cpg-bar">' + (mob ? '<button class="cpg-mfilter" data-cpg-mfilter>' + OS.icon('layers') + ' Filters</button>' : chips) + sortSel + '</div>';

      const grid = '<div class="cpg-grid' + (s.layout_type === 'list' ? ' cpg-list' : '') + '" style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + Math.max(gap, 16) + 'px">' + prods.map((p) => OS.productCard(p, t)).join('') + '</div>';
      const pager = '<div class="cpg-pager">' + [1, 2, 3].map((n) => '<div class="cpg-pg' + (n === 1 ? ' on' : '') + '">' + n + '</div>').join('') + '<div class="cpg-pg">→</div></div>';
      const right = '<div>' + bar + grid + pager + '</div>';
      const hasSidebar = s.show_filters && s.desktop_filter_layout === 'sidebar';

      return '<div class="cpgx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + header +
        '<div class="cpg-body" style="' + (hasSidebar ? '' : 'grid-template-columns:1fr') + '">' + (hasSidebar ? sidebar : '') + right + '</div></div></div>';
    },
    hydrate: function (root) {
      root.querySelectorAll('[data-cpg-fh]').forEach((h) => h.addEventListener('click', (e) => { e.stopPropagation(); h.closest('.cpg-fgroup').classList.toggle('collapsed'); }));
      root.querySelectorAll('[data-cpg-opt]').forEach((o) => o.addEventListener('click', (e) => { e.stopPropagation(); o.classList.toggle('on'); }));
      const mf = root.querySelector('[data-cpg-mfilter]'); if (mf) mf.addEventListener('click', (e) => { e.stopPropagation(); });
    },
  });
})();
