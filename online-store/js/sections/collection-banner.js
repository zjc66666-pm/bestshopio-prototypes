/* Collection banner — Collection-template header hero. Built from PRD V1.137.4 (doc5).
   Reads the current collection (mocked) for title/description/image; optional featured product card. */
(function () {
  const OS = window.OS;
  OS.css('collection-banner', [
    '.cbnx{position:relative;overflow:hidden}.cbnx *{box-sizing:border-box}',
    '.cbnx .cbn-bg{position:absolute;inset:0;background-size:cover;background-position:center}',
    '.cbnx .cbn-ov{position:absolute;inset:0}',
    '.cbnx .cbn-inner{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:32px;min-height:300px;padding:48px}',
    '.cbnx .cbn-copy{max-width:620px}',
    '.cbnx h1{margin:0 0 12px;line-height:1.1}',
    '.cbnx .cbn-desc{font-size:15px;line-height:1.6;opacity:.92}',
    '.cbnx .cbn-fp{background:#fff;color:#111;border-radius:12px;padding:14px;width:230px;flex:none;box-shadow:0 10px 30px rgba(0,0,0,.18)}',
    '.cbnx .cbn-fp .ph{aspect-ratio:1/1;background-size:cover;background-position:center;border-radius:8px;margin-bottom:10px}',
    '.cbnx .cbn-fp .nm{font-size:13px;font-weight:600}.cbnx .cbn-fp .pr{font-size:14px;font-weight:700;margin-top:3px}.cbnx .cbn-fp .pr s{opacity:.5;font-weight:400;margin-left:6px}',
    '.cbnx.mob .cbn-inner{flex-direction:column;text-align:center;padding:30px 18px;min-height:200px}.cbnx.mob .cbn-fp{display:none}',
  ].join(''));

  const COLLECTION = { title: 'Maternity Jeans', description: 'Side-panel and over-bump fits, cut for every trimester and beyond.', count: 136 };
  const HSIZE = { large: 48, medium: 38, small: 30 };

  OS.register('collection-banner', {
    name: 'Collection banner', group: 'collection', icon: 'image',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: true },
      { key: 'transparent_header', control: 'toggle', label: 'Allow transparent header', default: false, info: 'Lets the header overlay this banner on the collection page.' },
      { key: 'show_title', control: 'toggle', label: 'Show collection title', default: true },
      { key: 'show_description', control: 'toggle', label: 'Show collection description', default: true },
      { key: 'heading_size', control: 'select', label: 'Heading size', default: 'large', options: [{ value: 'large', label: 'Large' }, { value: 'medium', label: 'Medium' }, { value: 'small', label: 'Small' }] },
      { key: 'image', control: 'image', label: 'Background image', default: '', info: 'Overrides the collection image. Blank uses the collection’s own image.' },
      { key: 'mobile_image', control: 'image', label: 'Mobile image', default: '' },
      { sub: 'Featured product' },
      { key: 'show_featured_product', control: 'toggle', label: 'Show featured product card', default: true },
      { key: 'featured_product', control: 'product', label: 'Featured product', default: 'p3', visibleWhen: (s) => s.show_featured_product },
      { key: 'featured_position', control: 'segmented', label: 'Card position (desktop)', default: 'right', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], visibleWhen: (s) => s.show_featured_product },
      { sub: 'Colors' },
      { key: 'text', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'overlay', control: 'color', label: 'Overlay', default: '#000000' },
      { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 100, step: 5, unit: '%', default: 35 },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const img = (mob && s.mobile_image) ? s.mobile_image : (s.image || OS.sample.IMG.cat3);
      const fp = s.show_featured_product ? (OS.sample.products.find((p) => p.id === s.featured_product) || OS.sample.products[2]) : null;
      const sale = fp && fp.compareAt && fp.compareAt > fp.price;
      const fpCard = fp ? '<div class="cbn-fp"><div class="ph" style="background-image:url(' + OS.esc(fp.image) + ')"></div>' +
        '<div class="nm">' + OS.esc(fp.title) + '</div><div class="pr">' + OS.money(fp.price) + (sale ? '<s>' + OS.money(fp.compareAt) + '</s>' : '') + '</div></div>' : '';
      const copy = '<div class="cbn-copy" style="color:' + (s.text || '#fff') + '">' +
        (s.show_title ? '<h1 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, (mob ? 0.62 : 1) * (HSIZE[s.heading_size] || 48)) + 'px">' + OS.esc(COLLECTION.title) + '</h1>' : '') +
        (s.show_description ? '<div class="cbn-desc">' + OS.esc(COLLECTION.description) + '</div>' : '') + '</div>';
      const inner = (fp && s.featured_position === 'left') ? fpCard + copy : copy + fpCard;
      return '<div class="cbnx' + (mob ? ' mob' : '') + '" style="font-family:' + OS.bodyFamily(t) + '">' +
        '<div class="cbn-bg" style="background-image:url(' + OS.esc(img) + ')"></div>' +
        '<div class="cbn-ov" style="background:' + OS.bgOrTransparent(s.overlay) + ';opacity:' + ((s.overlay_opacity || 0) / 100) + '"></div>' +
        '<div class="cbn-inner">' + inner + '</div></div>';
    },
  });
})();
