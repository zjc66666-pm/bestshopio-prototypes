/* Collection list — a strip of collection entry cards (sub-category navigation).
   Ported from the team's collection-canvas-demo (collectionList section + its Collection block),
   re-homed onto the BestShopio OS section framework. Each block is one collection card with its own
   image, overlay, heading style, and 9-point content position. Desktop = grid; mobile stacks
   (Stack collections ON) or becomes a horizontal snap-scroll (OFF). */
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
    '.clstx .cls-card .cont{position:absolute;inset:0;display:flex;flex-direction:column;padding:18px;z-index:2}',
    '.clstx .cls-card .ch{font-weight:700;line-height:1.15}',
    '.clstx .cls-card .csub{font-size:12px;opacity:.9;margin-bottom:3px}',
    '.clstx.mob .cls-grid.scroll{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;gap:14px}',
    '.clstx.mob .cls-grid.scroll::-webkit-scrollbar{display:none}',
    '.clstx.mob .cls-grid.scroll .cls-card{flex:0 0 70%;scroll-snap-align:start}',
  ].join(''));

  const HEAD_SIZE = { small: 16, medium: 20, large: 26, 'x-large': 34 };
  // 9-point content position → flex placement (vertical from first token, horizontal from second)
  function posStyle(pos) {
    const parts = String(pos || 'middle-center').split('-'), v = parts[0], hz = parts[1];
    const justify = v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center';
    const align = hz === 'left' ? 'flex-start' : hz === 'right' ? 'flex-end' : 'center';
    const ta = hz === 'center' ? 'center' : hz;
    return 'justify-content:' + justify + ';align-items:' + align + ';text-align:' + ta;
  }
  const POSITIONS = [
    { value: 'top-left', label: 'Top left' }, { value: 'top-center', label: 'Top center' }, { value: 'top-right', label: 'Top right' },
    { value: 'middle-left', label: 'Middle left' }, { value: 'middle-center', label: 'Middle center' }, { value: 'middle-right', label: 'Middle right' },
    { value: 'bottom-left', label: 'Bottom left' }, { value: 'bottom-center', label: 'Bottom center' }, { value: 'bottom-right', label: 'Bottom right' },
  ];

  OS.register('collection-list', {
    name: 'Collection list', group: 'collection', icon: 'grid',
    schema: [
      { sub: 'Header' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Collection list', placeholder: 'Collection list' },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'content', control: 'textarea', label: 'Content', default: '' },
      { key: 'link_url', control: 'url', label: 'Link URL', default: '/collections' },
      { key: 'link_text', control: 'text', label: 'Link text', default: 'View all', placeholder: 'View all' },
      { sub: 'Layout' },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false, info: 'On: background fills the browser width. Off: theme content width.' },
      { key: 'stack_collections', control: 'toggle', label: 'Stack collections', default: false, info: 'On: stack cards on mobile. Off: horizontal scroll.' },
      { key: 'collections_per_row_mobile', control: 'segmented', label: 'Collections per row · Mobile', default: '1', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }] },
      { key: 'collections_per_row_desktop', control: 'range', label: 'Collections per row · Desktop', default: 3, min: 2, max: 6, step: 1 },
      { sub: 'Colors' },
      { key: 'heading_color', control: 'color', label: 'Heading', default: '', allowTransparent: true, info: 'Blank = inherit theme heading color.' },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank = inherit theme text color.' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { sub: 'Advanced' },
      { key: 'custom_css', control: 'custom_css', label: 'Custom CSS', default: '' },
    ],
    blocks: {
      name: 'Collection', kind: 'collection', max: 12,
      fields: [
        { key: 'collection', control: 'collection', label: 'Collection', default: 'best-sellers', info: 'The collection this card links to.' },
        { key: 'image', control: 'image', label: 'Image', default: '', info: 'Recommended 1500 × 1800px · falls back to the collection image.' },
        { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
        { key: 'heading', control: 'text', label: 'Heading', default: '', placeholder: 'Uses Collection title' },
        { key: 'link', control: 'url', label: 'Link', default: '', placeholder: 'Uses Collection URL' },
        { key: 'heading_style', control: 'select', label: 'Heading style', default: 'large', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'x-large', label: 'X-Large' }] },
        { key: 'content_position', control: 'select', label: 'Content position', default: 'middle-center', options: POSITIONS },
        { sub: 'Colors' },
        { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
        { key: 'overlay_color', control: 'color', label: 'Overlay', default: '#000000' },
        { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 80, step: 1, unit: '%', default: 30 },
      ],
      defaults: () => ({ collection: 'best-sellers', heading_style: 'large', content_position: 'middle-center', text_color: '#FFFFFF', overlay_color: '#000000', overlay_opacity: 30 }),
    },
    defaultBlocks: () => ['best-sellers', 'dresses', 'tops', 'new-arrivals'].map((id) => ({
      id: OS.uid('cl'), kind: 'collection', hidden: false,
      settings: { collection: id, heading_style: 'large', content_position: 'middle-center', text_color: '#FFFFFF', overlay_color: '#000000', overlay_opacity: 30 },
    })),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.heading_color, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const scroll = mob && !s.stack_collections; // OFF = horizontal scroll on mobile
      const cols = mob ? (Number(s.collections_per_row_mobile) || 1) : OS.clamp(s.collections_per_row_desktop, 2, 6, 3);

      const items = (blocks || []).filter((b) => !b.hidden);
      const cards = items.map((b0) => {
        const b = b0.settings; const c = OS.sample.collections.find((x) => x.id === b.collection) || {};
        const img = b.image || c.image || OS.sample.IMG.cat1;
        const heading = b.heading || c.title || 'Collection';
        const hpx = HEAD_SIZE[b.heading_style] || 26;
        return '<a class="cls-card" data-block-id="' + OS.esc(b0.id) + '" href="' + OS.esc(b.link || ('/collections/' + (b.collection || ''))) + '">' +
          '<div class="bg" style="background-image:url(' + OS.esc(img) + ')"></div>' +
          '<div class="ov" style="background:' + OS.bgOrTransparent(b.overlay_color) + ';opacity:' + ((b.overlay_opacity || 0) / 100) + '"></div>' +
          '<div class="cont" style="color:' + (b.text_color || '#fff') + ';' + posStyle(b.content_position) + '">' +
          (b.subheading ? '<div class="csub">' + OS.esc(b.subheading) + '</div>' : '') +
          '<div class="ch" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, hpx) + 'px">' + OS.esc(heading) + '</div></div></a>';
      }).join('');

      const head = '<div class="cls-head"><div>' +
        (s.subheading ? '<div class="cls-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 30) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.content ? '<div style="font-size:14px;opacity:.85;margin-top:6px">' + OS.esc(s.content) + '</div>' : '') + '</div>' +
        (s.link_text ? '<a class="cls-view" href="' + OS.esc(s.link_url || '#') + '" style="color:' + ((t.colors && t.colors.link_color) || headColor) + '">' + OS.esc(s.link_text) + ' →</a>' : '') + '</div>';

      return '<div class="clstx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a') + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head +
        '<div class="cls-grid' + (scroll ? ' scroll' : '') + '" style="' + (scroll ? 'gap:' + gap + 'px' : 'grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px') + '">' +
        (items.length ? cards : '<div style="opacity:.5;font-size:13px;padding:20px">Add a collection.</div>') + '</div></div>' +
        (s.custom_css ? '<style>' + s.custom_css + '</style>' : '') + '</div>';
    },
  });
})();
