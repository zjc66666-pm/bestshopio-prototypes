/* UGC gallery — user photo wall. Homogeneous UGC item blocks (max 30).
   Desktop: masonry (CSS columns) / grid / carousel rail. Mobile: carousel / one column / two columns.
   Each tile = image with optional hover overlay (social handle + a shopping-bag dot when a product is tagged). */
(function () {
  const OS = window.OS;
  OS.css('ugc-gallery', [
    '.ugx{box-sizing:border-box}.ugx *{box-sizing:border-box}',
    '.ugx .ug-head{margin-bottom:18px}',
    '.ugx .ug-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.ugx h2{margin:0 0 8px;line-height:1.12}',
    '.ugx .ug-desc{font-size:14px;line-height:1.6;opacity:.8;max-width:640px}',
    '.ugx .ug-head.c{text-align:center}.ugx .ug-head.c .ug-desc{margin-left:auto;margin-right:auto}',
    '.ugx .ug-grid{display:grid}',
    '.ugx .ug-mason{display:block}.ugx .ug-mason .ug-tile{break-inside:avoid;display:block;width:100%}',
    '.ugx .ug-rail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}',
    '.ugx .ug-rail::-webkit-scrollbar{display:none}',
    '.ugx .ug-rail .ug-tile{flex:none;min-width:0;scroll-snap-align:start}',
    '.ugx .ug-tile{position:relative;overflow:hidden;background:#e7e9ee}',
    '.ugx .ug-tile img{display:block;width:100%;height:100%;object-fit:cover}',
    '.ugx .ug-tile.sq img{aspect-ratio:1/1}',
    '.ugx .ug-over{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:10px;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.55) 100%);opacity:0;transition:opacity .18s ease;color:#fff}',
    '.ugx .ug-tile:hover .ug-over{opacity:1}',
    '.ugx .ug-handle{font-size:12px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.4)}',
    '.ugx .ug-src{font-size:10px;font-weight:600;opacity:.85;text-shadow:0 1px 4px rgba(0,0,0,.4)}',
    '.ugx .ug-cap{font-size:11px;line-height:1.4;margin-top:2px;opacity:.95;text-shadow:0 1px 4px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.ugx .ug-bag{position:absolute;top:9px;right:9px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.92);color:#111;display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.2);z-index:2}',
    '.ugx .ug-bag svg{width:14px;height:14px}',
    '.ugx .ug-empty{opacity:.5;font-size:13px;padding:24px;text-align:center}',
  ].join(''));

  // small shopping-bag glyph (not in the shared icon set)
  const BAG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';

  OS.register('ugc-gallery', {
    name: 'UGC gallery', group: 'social', icon: 'image',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Real life, real results' },
      { key: 'description', control: 'richtext', label: 'Description', default: '' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'desktop_layout', control: 'select', label: 'Desktop layout', default: 'grid', options: [{ value: 'masonry', label: 'Masonry' }, { value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }] },
      { key: 'desktop_columns', control: 'range', label: 'Desktop columns', min: 2, max: 6, step: 1, default: 4 },
      { key: 'mobile_layout', control: 'select', label: 'Mobile layout', default: 'two-columns', options: [{ value: 'carousel', label: 'Carousel' }, { value: 'one-column', label: 'One column' }, { value: 'two-columns', label: 'Two columns' }] },
      { key: 'gap', control: 'range', label: 'Gap', min: 4, max: 32, step: 1, unit: 'px', default: 12 },
      { key: 'image_radius', control: 'range', label: 'Image corner radius', min: 0, max: 24, step: 1, unit: 'px', default: 12 },
      { key: 'image_fit', control: 'select', label: 'Image fit', default: 'cover', options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }] },
      { key: 'show_social_handle', control: 'toggle', label: 'Show social handle on hover', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
    ],
    blocks: {
      name: 'UGC item', kind: 'item', max: 30,
      fields: [
        { key: 'image', control: 'image', label: 'Image', default: '', required: true },
        { key: 'caption', control: 'text', label: 'Caption', default: '' },
        { key: 'social_handle', control: 'text', label: 'Social handle', default: '' },
        { key: 'source_label', control: 'text', label: 'Source label', default: '', placeholder: 'Instagram' },
        { key: 'associated_product', control: 'product', label: 'Associated product', default: '' },
      ],
      defaults: () => ({ image: OS.sample.IMG.cat2, social_handle: '@customer' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('ugc'), kind: 'item', hidden: false, settings: { image: OS.sample.IMG.cat1, social_handle: '@mara_j', source_label: 'Instagram', caption: 'Obsessed with this set!', associated_product: 'p1' } },
      { id: OS.uid('ugc'), kind: 'item', hidden: false, settings: { image: OS.sample.IMG.cat2, social_handle: '@liv.styles', source_label: 'Instagram' } },
      { id: OS.uid('ugc'), kind: 'item', hidden: false, settings: { image: OS.sample.IMG.cat3, social_handle: '@thefitlife', source_label: 'TikTok', associated_product: 'p2' } },
      { id: OS.uid('ugc'), kind: 'item', hidden: false, settings: { image: OS.sample.IMG.cat4, social_handle: '@daily.wear', source_label: 'Instagram' } },
      { id: OS.uid('ugc'), kind: 'item', hidden: false, settings: { image: OS.sample.IMG.p2, social_handle: '@wellnessco', source_label: 'Instagram' } },
      { id: OS.uid('ugc'), kind: 'item', hidden: false, settings: { image: OS.sample.IMG.p5, social_handle: '@studio.aura', source_label: 'TikTok' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const gap = OS.clamp(s.gap, 4, 32, 12);
      const rad = OS.clamp(s.image_radius, 0, 24, 12);
      const fit = s.image_fit === 'contain' ? 'contain' : 'cover';
      const align = mob ? 'left' : (s.heading_alignment || 'center');
      const items = (blocks || []).filter((b) => !b.hidden && b.settings.image);

      // resolve layout for the active viewport
      const dLayout = s.desktop_layout || 'grid';
      const mLayout = s.mobile_layout || 'two-columns';
      const layout = mob
        ? (mLayout === 'carousel' ? 'carousel' : 'grid')
        : dLayout;
      const cols = mob
        ? (mLayout === 'one-column' ? 1 : 2)
        : OS.clamp(s.desktop_columns, 2, 6, 4);

      const head = '<div class="ug-head' + (align === 'center' ? ' c' : '') + '">' +
        (s.subheading ? '<div class="ug-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 32) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.description ? '<div class="ug-desc">' + s.description + '</div>' : '') + '</div>';

      if (!items.length) {
        return '<div class="ugx" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
          '<div style="max-width:' + maxW + ';margin:0 auto">' + head +
          '<div class="ug-empty">Add a UGC item from the structure tree.</div></div></div>';
      }

      const isCarousel = layout === 'carousel';
      const isMasonry = layout === 'masonry';
      // carousel item width = N visible per view (mobile two-cols → ~2.2, one-col → ~1.15 peek)
      const perView = mob ? (mLayout === 'one-column' ? 1.15 : 2.2) : OS.clamp(s.desktop_columns, 2, 6, 4);
      const railW = 'calc((100% - ' + gap + 'px * ' + (perView - 1) + ') / ' + perView + ')';

      const tile = (b0) => {
        const b = b0.settings;
        const hasProd = !!b.associated_product && !!OS.sample.products.find((p) => p.id === b.associated_product);
        const handle = (s.show_social_handle && (b.social_handle || b.caption || b.source_label))
          ? '<div class="ug-over">' +
              (b.social_handle ? '<div class="ug-handle">' + OS.esc(b.social_handle) + '</div>' : '') +
              (b.source_label ? '<div class="ug-src">' + OS.esc(b.source_label) + '</div>' : '') +
              (b.caption ? '<div class="ug-cap">' + OS.esc(b.caption) + '</div>' : '') +
            '</div>'
          : '';
        const bag = hasProd ? '<div class="ug-bag" title="Shoppable">' + BAG + '</div>' : '';
        // masonry keeps the natural image aspect (no forced square) so the column wall staggers
        const sq = isMasonry ? '' : ' sq';
        const wStyle = isCarousel ? 'width:' + railW + ';margin-right:' + gap + 'px;' : '';
        const masonGap = isMasonry ? 'margin-bottom:' + gap + 'px;' : '';
        return '<div class="ug-tile' + sq + '" data-block-id="' + OS.esc(b0.id) + '" style="border-radius:' + rad + 'px;' + wStyle + masonGap + '">' +
          '<img src="' + OS.esc(b.image) + '" alt="' + OS.esc(b.caption || b.social_handle || 'Customer photo') + '" loading="lazy" style="object-fit:' + fit + '">' +
          handle + bag + '</div>';
      };

      const tiles = items.map(tile).join('');

      let container;
      if (isCarousel) {
        container = '<div class="ug-rail">' + tiles + '</div>';
      } else if (isMasonry) {
        container = '<div class="ug-mason" style="column-count:' + cols + ';column-gap:' + gap + 'px">' + tiles + '</div>';
      } else {
        container = '<div class="ug-grid" style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px">' + tiles + '</div>';
      }

      return '<div class="ugx" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + container + '</div></div>';
    },
  });
})();
