/* Collection list — multiple collection entry cards. Built from PRD V1.137.4 (doc5).
   Collection blocks (each = one collection card; image + overlay + heading). */
(function () {
  const OS = window.OS;
  OS.css('collection-list', [
    '.clstx{box-sizing:border-box}.clstx *{box-sizing:border-box}',
    '.clstx .cls-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap}',
    '.clstx h2{margin:0;line-height:1.12}',
    '.clstx .cls-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.clstx .cls-view{font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}',
    '.clstx .cls-grid{display:grid}',
    '.clstx .cls-card{position:relative;display:block;overflow:hidden;aspect-ratio:3/4;text-decoration:none;border-radius:10px}',
    '.clstx .cls-card .bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .4s}',
    '.clstx .cls-card:hover .bg{transform:scale(1.05)}',
    '.clstx .cls-card .ov{position:absolute;inset:0}',
    '.clstx .cls-card .txt{position:absolute;left:0;right:0;bottom:0;padding:18px;z-index:2}',
    '.clstx .cls-card .ch{font-size:18px;font-weight:700;line-height:1.15}',
    '.clstx .cls-card .csub{font-size:12px;opacity:.9;margin-bottom:3px}',
    '.clstx.mob .cls-grid.scroll{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}',
    '.clstx.mob .cls-grid.scroll::-webkit-scrollbar{display:none}',
    '.clstx.mob .cls-grid.scroll .cls-card{flex:0 0 70%;scroll-snap-align:start}',
  ].join(''));

  OS.register('collection-list', {
    name: 'Collection list', group: 'collection', icon: 'grid',
    schema: [
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Shop by category' },
      { key: 'content', control: 'richtext', label: 'Content', default: '' },
      { key: 'link_text', control: 'text', label: 'Link text', default: 'View all' },
      { key: 'link_url', control: 'url', label: 'Link URL', default: '/collections' },
      { sub: 'Layout' },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'columns_desktop', control: 'select', label: 'Collections per row · Desktop', default: '4', options: ['2', '3', '4', '5', '6'].map((v) => ({ value: v, label: v })) },
      { key: 'columns_mobile', control: 'select', label: 'Collections per row · Mobile', default: '2', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: 'scroll', label: 'Horizontal scroll' }] },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
    ],
    blocks: {
      name: 'Collection', kind: 'collection', max: 12,
      fields: [
        { key: 'collection', control: 'collection', label: 'Collection', default: 'best-sellers' },
        { key: 'image', control: 'image', label: 'Image', default: '', info: 'Blank uses the collection’s image.' },
        { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
        { key: 'heading', control: 'text', label: 'Heading', default: '', info: 'Blank uses the collection’s title.' },
        { key: 'link', control: 'url', label: 'Link', default: '' },
        { sub: 'Colors' },
        { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
        { key: 'overlay', control: 'color', label: 'Overlay', default: '#000000' },
        { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 100, step: 5, unit: '%', default: 25 },
      ],
      defaults: () => ({ collection: 'best-sellers', overlay: '#000000', overlay_opacity: 25, text_color: '#FFFFFF' }),
    },
    defaultBlocks: () => ['best-sellers', 'dresses', 'tops', 'new-arrivals'].map((id) => ({ id: OS.uid('cl'), kind: 'collection', hidden: false, settings: { collection: id, overlay: '#000000', overlay_opacity: 25, text_color: '#FFFFFF' } })),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const cols = mob ? (s.columns_mobile === 'scroll' ? 1 : Number(s.columns_mobile) || 2) : (Number(s.columns_desktop) || 4);
      const scroll = mob && s.columns_mobile === 'scroll';
      const items = (blocks || []).filter((b) => !b.hidden);
      const cards = items.map((b0) => {
        const b = b0.settings; const c = OS.sample.collections.find((x) => x.id === b.collection) || {};
        const img = b.image || c.image || OS.sample.IMG.cat1;
        const heading = b.heading || c.title || 'Collection';
        return '<a class="cls-card" data-block-id="' + OS.esc(b0.id) + '" href="' + OS.esc(b.link || ('/collections/' + (b.collection || ''))) + '">' +
          '<div class="bg" style="background-image:url(' + OS.esc(img) + ')"></div>' +
          '<div class="ov" style="background:' + OS.bgOrTransparent(b.overlay) + ';opacity:' + ((b.overlay_opacity || 0) / 100) + '"></div>' +
          '<div class="txt" style="color:' + (b.text_color || '#fff') + '">' + (b.subheading ? '<div class="csub">' + OS.esc(b.subheading) + '</div>' : '') + '<div class="ch">' + OS.esc(heading) + '</div></div></a>';
      }).join('');
      const head = '<div class="cls-head"><div>' + (s.subheading ? '<div class="cls-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 30) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.content ? '<div style="font-size:14px;opacity:.85;margin-top:6px">' + s.content + '</div>' : '') + '</div>' +
        (s.link_text ? '<a class="cls-view" href="' + OS.esc(s.link_url || '#') + '" style="color:' + ((t.colors && t.colors.link_color) || headColor) + '">' + OS.esc(s.link_text) + ' →</a>' : '') + '</div>';
      return '<div class="clstx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a') + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + '<div class="cls-grid' + (scroll ? ' scroll' : '') + '" style="' + (scroll ? 'gap:' + gap + 'px' : 'grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px') + '">' + (items.length ? cards : '<div style="opacity:.5;font-size:13px;padding:20px">Add a collection.</div>') + '</div></div></div>';
    },
  });
})();
