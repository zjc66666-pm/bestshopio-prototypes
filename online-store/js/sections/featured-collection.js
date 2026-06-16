/* Featured collection — tabbed product grid. Ported from FeaturedCollectionLive + featured-collection spec.
   Tab blocks (max 8). Product cards inherit Theme settings › Product cards (OS.productCard). */
(function () {
  const OS = window.OS;
  OS.css('featured-collection', [
    '.fcx{box-sizing:border-box}.fcx *{box-sizing:border-box}',
    '.fcx .fc-head{margin-bottom:18px}',
    '.fcx .fc-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.fcx h2{margin:0;line-height:1.12}',
    '.fcx .fc-tabs{display:flex;gap:22px;border-bottom:1px solid rgba(0,0,0,.1);margin-bottom:20px;flex-wrap:wrap}',
    '.fcx .fc-tab{border:0;background:none;cursor:pointer;font-size:14px;font-weight:600;color:#9aa3b0;padding:0 2px 12px;border-bottom:2px solid transparent;font-family:inherit}',
    '.fcx .fc-tab.on{color:inherit;border-bottom-color:currentColor}',
    '.fcx .fc-grid{display:grid}',
    '.fcx .fc-view{display:flex;justify-content:center;margin-top:24px}',
    '.fcx .fc-view a{text-decoration:none;font-weight:600;cursor:pointer}',
  ].join(''));

  function tabProducts(t, count) {
    const all = OS.sample.products; const out = [];
    for (let i = 0; i < count; i++) out.push(all[i % all.length]);
    return out;
  }

  OS.register('featured-collection', {
    name: 'Featured collection', group: 'products', icon: 'grid',
    schema: [
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Best sellers' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'columns_desktop', control: 'select', label: 'Products per row · Desktop', default: '4', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }] },
      { key: 'columns_mobile', control: 'select', label: 'Products per row · Mobile', default: '2', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'product_limit', control: 'range', label: 'Product limit', min: 2, max: 12, step: 1, default: 8 },
      { key: 'show_view_all', control: 'toggle', label: 'Show view all button', default: false },
      { key: 'view_all_text', control: 'text', label: 'View all text', default: 'View all', visibleWhen: (s) => s.show_view_all },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme heading color. Product cards follow Theme settings › Product cards.' },
    ],
    blocks: {
      name: 'Tab', kind: 'tab', max: 8,
      fields: [
        { key: 'tab_title', control: 'text', label: 'Tab title', default: '' },
        { key: 'product_source', control: 'select', label: 'Product source', default: 'collection', options: [{ value: 'collection', label: 'Collection' }, { value: 'manual', label: 'Manually selected products' }] },
        { key: 'collection', control: 'collection', label: 'Collection', default: 'best-sellers', visibleWhen: (s) => s.product_source === 'collection' },
        { key: 'products', control: 'product', label: 'Products', default: [], visibleWhen: (s) => s.product_source === 'manual' },
        { key: 'view_all_link', control: 'url', label: 'View all link', default: '' },
      ],
      defaults: () => ({ tab_title: 'New arrivals', product_source: 'collection', collection: 'new-arrivals', products: [] }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('tab'), kind: 'tab', hidden: false, settings: { tab_title: 'Best sellers', product_source: 'collection', collection: 'best-sellers', products: [] } },
      { id: OS.uid('tab'), kind: 'tab', hidden: false, settings: { tab_title: 'New arrivals', product_source: 'collection', collection: 'new-arrivals', products: [] } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const cols = mob ? (Number(s.columns_mobile) || 2) : (Number(s.columns_desktop) || 4);
      const limit = OS.clamp(s.product_limit, 2, 12, 8);
      const tabs = (blocks || []).filter((b) => !b.hidden);
      let active = 0; if (ctx.selectedBlockId) { const i = tabs.findIndex((b) => b.id === ctx.selectedBlockId); if (i >= 0) active = i; }
      const showTabs = tabs.length > 1;
      const cur = tabs[active] || { id: '_', settings: { tab_title: s.heading } };
      const prods = tabProducts(t, limit);
      const grid = '<div class="fc-grid" data-block-id="' + OS.esc(cur.id) + '" style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px">' +
        prods.map((p) => OS.productCard(p, t)).join('') + '</div>';
      const tabNav = showTabs ? '<div class="fc-tabs" style="color:' + headColor + '">' + tabs.map((b, i) => '<button class="fc-tab' + (i === active ? ' on' : '') + '" data-fc-tab="' + i + '" data-block-id="' + OS.esc(b.id) + '">' + OS.esc(b.settings.tab_title || ('Tab ' + (i + 1))) + '</button>').join('') + '</div>' : '';
      const head = '<div class="fc-head" style="text-align:' + (mob ? 'left' : s.heading_alignment) + '">' +
        (s.subheading ? '<div class="fc-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 32) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') + '</div>';
      const viewAll = s.show_view_all ? '<div class="fc-view"><a style="' + OS.btnStyle(t, { variant: 'secondary' }) + '">' + OS.esc(s.view_all_text || 'View all') + '</a></div>' : '';
      return '<div class="fcx" style="background:' + bg + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + tabNav + grid + viewAll + '</div></div>';
    },
    hydrate: function (root) {
      root.querySelectorAll('[data-fc-tab]').forEach((b) => b.addEventListener('click', (e) => {
        // selection of the tab block is handled by app via data-block-id; also flip the active tab visually
        root.querySelectorAll('.fc-tab').forEach((x) => x.classList.remove('on')); b.classList.add('on');
      }));
    },
  });
})();
