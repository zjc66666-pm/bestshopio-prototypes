/* Collection banner — the hero at the top of the Collection page.
   Ported from the team's collection-canvas-demo (collectionBanner section), re-homed onto the
   BestShopio OS section framework: separate desktop/mobile background images + content positions
   (9-point), image-size height presets, 5-step title size, and an optional featured-product card
   (desktop only). Colors inherit theme tokens; the card reuses theme money formatting. */
(function () {
  const OS = window.OS;
  OS.css('collection-banner', [
    '.cbnx{position:relative;overflow:hidden}.cbnx *{box-sizing:border-box}',
    '.cbnx .cbn-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-color:#e9eaec}',
    '.cbnx .cbn-ov{position:absolute;inset:0}',
    '.cbnx .cbn-inner{position:relative;z-index:2;display:flex;flex-direction:column;padding:48px;height:100%}',
    '.cbnx .cbn-copy{max-width:620px}',
    '.cbnx h1{margin:0 0 12px;line-height:1.08}',
    '.cbnx .cbn-desc{font-size:15px;line-height:1.6;opacity:.92;max-width:560px}',
    '.cbnx .cbn-fp{position:absolute;top:50%;right:48px;transform:translateY(-50%);z-index:3;background:#fff;color:#111;border-radius:12px;padding:14px;width:230px;box-shadow:0 10px 30px rgba(0,0,0,.18)}',
    '.cbnx .cbn-fp .fp-h{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:8px}',
    '.cbnx .cbn-fp .ph{aspect-ratio:1/1;background-size:cover;background-position:center;border-radius:8px;margin-bottom:10px;background-color:#f1f2f4}',
    '.cbnx .cbn-fp .nm{font-size:13px;font-weight:600;line-height:1.3}',
    '.cbnx .cbn-fp .pr{font-size:14px;font-weight:700;margin-top:3px}.cbnx .cbn-fp .pr s{opacity:.5;font-weight:400;margin-left:6px}',
    '.cbnx.mob .cbn-inner{padding:28px 18px}',
    '.cbnx.mob .cbn-fp{display:none}',
  ].join(''));

  const COLLECTION = { title: 'Best sellers', description: 'Our most-loved pieces — the styles customers keep coming back for, across every category.' };
  const TITLE_PX = { small: 22, medium: 30, large: 38, 'x-large': 48, 'xx-large': 60 };
  const BANNER_H = { original: 420, small: 260, medium: 360, large: 500, adapt: 620 };
  const POSITIONS = [
    { value: 'top-left', label: 'Top left' }, { value: 'top-center', label: 'Top center' }, { value: 'top-right', label: 'Top right' },
    { value: 'middle-left', label: 'Middle left' }, { value: 'middle-center', label: 'Middle center' }, { value: 'middle-right', label: 'Middle right' },
    { value: 'bottom-left', label: 'Bottom left' }, { value: 'bottom-center', label: 'Bottom center' }, { value: 'bottom-right', label: 'Bottom right' },
  ];
  // 9-point position → flex placement (vertical from first token, horizontal from second)
  function posStyle(pos) {
    const parts = String(pos || 'middle-center').split('-'), v = parts[0], hz = parts[1];
    const justify = v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center';
    const align = hz === 'left' ? 'flex-start' : hz === 'right' ? 'flex-end' : 'center';
    const ta = hz === 'center' ? 'center' : hz;
    return 'justify-content:' + justify + ';align-items:' + align + ';text-align:' + ta;
  }

  OS.register('collection-banner', {
    name: 'Collection banner', group: 'collection', icon: 'image',
    schema: [
      { sub: 'Basics' },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false, info: 'On: banner fills the browser width. Off: theme content width.' },
      { key: 'allow_transparent_header', control: 'toggle', label: 'Allow transparent header', default: false, info: 'Only when this is the page’s first section.' },
      { key: 'show_collection_title', control: 'toggle', label: 'Show collection title', default: true },
      { key: 'show_collection_description', control: 'toggle', label: 'Show collection description', default: true },
      { key: 'show_collection_image', control: 'toggle', label: 'Show collection image', default: true, info: 'Master toggle for the banner background image.' },
      { key: 'collection_title_size', control: 'select', label: 'Collection title size', default: 'xx-large', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'x-large', label: 'X-Large' }, { value: 'xx-large', label: 'XX-Large' }] },
      { key: 'image_size', control: 'select', label: 'Image size', default: 'original', options: [{ value: 'original', label: 'Original image ratio' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'adapt', label: 'Adapt to screen' }] },
      { key: 'image', control: 'image', label: 'Image', default: '', info: 'Recommended 3200 × 1600px. Blank uses the collection’s own image.' },
      { key: 'mobile_image', control: 'image', label: 'Mobile image', default: '', info: 'Recommended 1300 × 1500px. Blank uses the desktop image.' },
      { key: 'desktop_content_position', control: 'select', label: 'Desktop content position', default: 'middle-center', options: POSITIONS },
      { key: 'mobile_content_position', control: 'select', label: 'Mobile content position', default: 'middle-center', options: POSITIONS },
      { sub: 'Featured product' },
      { key: 'featured_product_id', control: 'select', label: 'Product', default: '', options: [{ value: '', label: 'None' }].concat((OS.sample.products || []).map((p) => ({ value: p.id, label: p.title }))), info: 'Shown as a card on the right (desktop only).' },
      { key: 'featured_heading', control: 'text', label: 'Heading', default: 'Featured product', placeholder: 'Featured product', visibleWhen: (s) => !!s.featured_product_id },
      { sub: 'Colors' },
      { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'overlay_color', control: 'color', label: 'Overlay', default: '#000000' },
      { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 80, step: 1, unit: '%', default: 30 },
    ],
    defaults: () => ({}),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const baseH = BANNER_H[s.image_size] || 420;
      const bannerH = mob ? Math.round(baseH * 0.78) : baseH;
      const titlePx = (mob ? 0.62 : 1) * (TITLE_PX[s.collection_title_size] || 60);
      const pos = mob ? s.mobile_content_position : s.desktop_content_position;
      const padH = OS.pagePad(t, mob);

      // background image (master toggle); desktop/mobile variants
      const imgUrl = s.show_collection_image ? ((mob && s.mobile_image) ? s.mobile_image : (s.image || OS.sample.IMG.cat3)) : '';
      const bg = imgUrl ? '<div class="cbn-bg" style="background-image:url(' + OS.esc(imgUrl) + ')"></div>' : '<div class="cbn-bg"></div>';
      const ov = '<div class="cbn-ov" style="background:' + OS.bgOrTransparent(s.overlay_color) + ';opacity:' + ((s.overlay_opacity || 0) / 100) + '"></div>';

      // featured product card (desktop only)
      const fp = (!mob && s.featured_product_id) ? OS.sample.products.find((p) => p.id === s.featured_product_id) : null;
      const sale = fp && fp.compareAt && fp.compareAt > fp.price;
      const fpCard = fp ? '<div class="cbn-fp">' +
        (s.featured_heading ? '<div class="fp-h">' + OS.esc(s.featured_heading) + '</div>' : '') +
        '<div class="ph" style="background-image:url(' + OS.esc(fp.image) + ')"></div>' +
        '<div class="nm">' + OS.esc(fp.title) + '</div>' +
        '<div class="pr">' + OS.money(fp.price) + (sale ? '<s>' + OS.money(fp.compareAt) + '</s>' : '') + '</div></div>' : '';

      const copy = '<div class="cbn-copy" style="color:' + (s.text_color || '#fff') + '">' +
        (s.show_collection_title ? '<h1 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, titlePx) + 'px">' + OS.esc(COLLECTION.title) + '</h1>' : '') +
        (s.show_collection_description ? '<div class="cbn-desc">' + OS.esc(COLLECTION.description) + '</div>' : '') + '</div>';

      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      return '<div class="cbnx' + (mob ? ' mob' : '') + '" style="font-family:' + OS.bodyFamily(t) + ';height:' + bannerH + 'px;max-width:' + maxW + ';margin:0 auto' + (s.full_width ? '' : ';border-radius:0') + '">' +
        bg + ov +
        '<div class="cbn-inner" style="padding-left:' + Math.max(padH, 24) + 'px;padding-right:' + Math.max(padH, 24) + 'px;' + posStyle(pos) + '">' + copy + '</div>' +
        fpCard + '</div>';
    },
  });
})();
