/* Image link blocks — category-nav entry tiles (collection thumbnails that link into a collection).
   Homogeneous Link blocks (collection / image / title / link, max 20). Three layouts: image-cards / circle / carousel. */
(function () {
  const OS = window.OS;
  OS.css('image-link-blocks', [
    '.ilbx{box-sizing:border-box}.ilbx *{box-sizing:border-box}',
    '.ilbx .ilb-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.ilbx h2{margin:0 0 22px;line-height:1.12}',
    '.ilbx .ilb-grid{display:grid}',
    '.ilbx .ilb-scroll{display:grid;grid-auto-flow:column;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
    '.ilbx .ilb-scroll::-webkit-scrollbar{display:none}',
    '.ilbx .ilb-scroll>*{scroll-snap-align:start}',
    '.ilbx .ilb-tile{position:relative;display:block;text-decoration:none;color:inherit;overflow:hidden}',
    '.ilbx .ilb-img{width:100%;background-size:cover;background-position:center;background-color:#ececec;display:block}',
    '.ilbx .ilb-card .ilb-img{transition:transform .4s ease}',
    '.ilbx .ilb-card:hover .ilb-img{transform:scale(1.05)}',
    '.ilbx .ilb-shade{position:absolute;left:0;right:0;bottom:0;height:55%;background:linear-gradient(to top,rgba(0,0,0,.55),rgba(0,0,0,0))}',
    '.ilbx .ilb-cap{position:absolute;left:0;right:0;bottom:0;padding:16px 18px;font-size:16px;font-weight:600;line-height:1.25;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.35)}',
    '.ilbx .ilb-circle{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit}',
    '.ilbx .ilb-circle .ilb-img{border-radius:50%;aspect-ratio:1/1}',
    '.ilbx .ilb-circle .ilb-cap-below{margin-top:12px;font-size:15px;font-weight:600;line-height:1.3}',
    '.ilbx .ilb-circle:hover .ilb-img{filter:brightness(.94)}',
    '.ilbx .ilb-empty{padding:28px;text-align:center;opacity:.6;font-size:13px;border:1px dashed rgba(0,0,0,.15);border-radius:12px}',
  ].join(''));

  const RATIO = { square: '1/1', portrait: '3/4', landscape: '4/3', wide: '16/9', original: 'auto' };

  function tileData(b) {
    const id = b.settings.collection || 'best-sellers';
    const c = (OS.sample.collections || []).find((x) => x.id === id) || null;
    return {
      image: b.settings.image || (c && c.image) || OS.sample.IMG.cat1,
      title: b.settings.title || (c && c.title) || 'Shop',
      link: b.settings.link || (c ? '/collections/' + c.id : '#'),
    };
  }

  OS.register('image-link-blocks', {
    name: 'Image link blocks', group: 'products', icon: 'grid',
    schema: [
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Shop by category' },
      { key: 'layout_style', control: 'select', label: 'Layout style', default: 'image-cards', options: [{ value: 'image-cards', label: 'Image cards' }, { value: 'circle', label: 'Circle' }, { value: 'carousel', label: 'Carousel' }] },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'columns_desktop', control: 'select', label: 'Columns · Desktop', default: '4', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' }] },
      { key: 'columns_mobile', control: 'select', label: 'Columns · Mobile', default: '2', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: 'scroll', label: 'Scroll' }] },
      { key: 'image_ratio', control: 'select', label: 'Image ratio', default: 'square', options: [{ value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }, { value: 'wide', label: 'Wide' }, { value: 'original', label: 'Original' }] },
      { key: 'text_alignment', control: 'segmented', label: 'Text alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'show_overlay', control: 'toggle', label: 'Show image overlay', default: false },
      { key: 'overlay_color', control: 'color', label: 'Overlay color', default: '#000000', allowTransparent: true, visibleWhen: (s) => s.show_overlay },
      { key: 'card_radius', control: 'range', label: 'Image corner radius', min: 0, max: 30, step: 1, unit: 'px', default: 0 },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme heading color.' },
    ],
    blocks: {
      name: 'Link block', kind: 'tile', max: 20,
      fields: [
        { key: 'collection', control: 'collection', label: 'Collection', default: 'best-sellers' },
        { key: 'image', control: 'image', label: 'Image', default: '', info: 'Blank uses the collection image.' },
        { key: 'title', control: 'text', label: 'Title', default: '', placeholder: 'Collection name' },
        { key: 'link', control: 'url', label: 'Link', default: '' },
      ],
      defaults: () => ({ collection: 'best-sellers' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('tile'), kind: 'tile', hidden: false, settings: { collection: 'best-sellers', image: '', title: '', link: '' } },
      { id: OS.uid('tile'), kind: 'tile', hidden: false, settings: { collection: 'new-arrivals', image: '', title: '', link: '' } },
      { id: OS.uid('tile'), kind: 'tile', hidden: false, settings: { collection: 'dresses', image: '', title: '', link: '' } },
      { id: OS.uid('tile'), kind: 'tile', hidden: false, settings: { collection: 'tops', image: '', title: '', link: '' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bodyColor = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const align = s.text_alignment === 'left' ? 'left' : 'center';
      const radius = OS.clamp(s.card_radius, 0, 30, 0);
      const ratio = RATIO[s.image_ratio] || '1/1';
      const colsD = OS.clamp(Number(s.columns_desktop) || 4, 2, 6, 4);
      const circle = s.layout_style === 'circle';
      const tiles = (blocks || []).filter((b) => !b.hidden);

      const head = '<div style="text-align:' + (mob ? 'left' : align) + '">' +
        (s.subheading ? '<div class="ilb-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') + '</div>';

      if (!tiles.length) {
        return '<div class="ilbx" style="background:' + bg + ';color:' + bodyColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
          '<div style="max-width:' + maxW + ';margin:0 auto">' + head +
          '<div class="ilb-empty">Add a link block to show a category tile.</div></div></div>';
      }

      const cell = (b) => {
        const d = tileData(b);
        const imgCss = 'background-image:url(' + OS.esc(d.image) + ');aspect-ratio:' + ratio + ';border-radius:' + (circle ? '50%' : radius + 'px');
        if (circle) {
          return '<a class="ilb-circle" data-block-id="' + OS.esc(b.id) + '" href="' + OS.esc(d.link) + '">' +
            '<div class="ilb-img" style="' + imgCss + '"></div>' +
            '<div class="ilb-cap-below" style="color:' + bodyColor + '">' + OS.esc(d.title) + '</div></a>';
        }
        return '<a class="ilb-tile ilb-card" data-block-id="' + OS.esc(b.id) + '" href="' + OS.esc(d.link) + '" style="border-radius:' + radius + 'px">' +
          '<div class="ilb-img" style="' + imgCss + '"></div>' +
          (s.show_overlay ? '<div class="ilb-shade" style="background:' + OS.bgOrTransparent(s.overlay_color || '#000000') + ';opacity:.5;border-radius:0 0 ' + radius + 'px ' + radius + 'px"></div>' : '') +
          '<div class="ilb-cap">' + OS.esc(d.title) + '</div></a>';
      };

      const cells = tiles.map(cell).join('');
      const scroll = s.layout_style === 'carousel' || (mob && s.columns_mobile === 'scroll');
      let grid;
      if (scroll) {
        // horizontal scroll: fixed-ish track width per tile so a few peek on screen
        const trackCols = mob ? 2 : colsD;
        const basis = 'minmax(' + Math.round(100 / (trackCols + 0.4)) + '%,1fr)';
        grid = '<div class="ilb-scroll" style="grid-auto-columns:' + basis + ';gap:' + gap + 'px;padding-bottom:4px">' + cells + '</div>';
      } else {
        const colsM = mob ? (s.columns_mobile === '1' ? 1 : 2) : colsD;
        grid = '<div class="ilb-grid" style="grid-template-columns:repeat(' + colsM + ',1fr);gap:' + gap + 'px">' + cells + '</div>';
      }

      return '<div class="ilbx" style="background:' + bg + ';color:' + bodyColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + grid + '</div></div>';
    },
  });
})();
