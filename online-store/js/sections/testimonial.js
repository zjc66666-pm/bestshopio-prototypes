/* Testimonial — customer review cards. Ported from testimonial.canvas.tsx.
   Homogeneous Testimonial blocks (max 20). Grid on desktop, fewer columns on mobile. */
(function () {
  const OS = window.OS;
  OS.css('testimonial', [
    '.tmx{box-sizing:border-box}.tmx *{box-sizing:border-box}',
    '.tmx .tm-head{text-align:center;margin-bottom:22px}',
    '.tmx .tm-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.tmx h2{margin:0;line-height:1.12}',
    '.tmx .tm-grid{display:grid}',
    '.tmx .tm-card{border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px}',
    '.tmx .tm-stars{display:flex;gap:2px}.tmx .tm-stars svg{width:16px;height:16px}',
    '.tmx .tm-q{font-size:14px;line-height:1.6}',
    '.tmx .tm-h{font-weight:700;font-size:15px}',
    '.tmx .tm-author{display:flex;align-items:center;gap:10px;margin-top:auto}',
    '.tmx .tm-av{width:38px;height:38px;background-size:cover;background-position:center;background-color:#e7e9ee;flex:none}',
    '.tmx .tm-av.round{border-radius:50%}',
    '.tmx .tm-name{font-size:13px;font-weight:600}',
    '.tmx .tm-verified{font-size:11px;display:flex;align-items:center;gap:3px}',
    '.tmx .tm-prod{display:flex;align-items:center;gap:8px;border-top:1px solid rgba(0,0,0,.08);padding-top:10px;margin-top:2px}',
    '.tmx .tm-prod-img{width:34px;height:34px;border-radius:6px;background-size:cover;background-position:center;flex:none}',
  ].join(''));

  const stars = (n, color) => { let h = ''; for (let i = 1; i <= 5; i++) { const fill = n >= i ? color : '#d8dce3'; h += '<span style="color:' + fill + '">' + OS.icon('star') + '</span>'; } return '<div class="tm-stars">' + h + '</div>'; };

  OS.register('testimonial', {
    name: 'Testimonial', group: 'social', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'What our customers say' },
      { key: 'desktop_columns', control: 'range', label: 'Desktop columns', min: 1, max: 6, step: 1, default: 4 },
      { key: 'mobile_columns', control: 'range', label: 'Mobile columns', min: 1, max: 2, step: 1, default: 1 },
      { key: 'content_alignment', control: 'segmented', label: 'Content alignment', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'card_background', control: 'color', label: 'Card background', default: '#FFFFFF', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
      { key: 'star_color', control: 'color', label: 'Star color', default: '#F5B301' },
      { key: 'verified_color', control: 'color', label: 'Verified badge', default: '#22C55E' },
    ],
    blocks: {
      name: 'Testimonial', kind: 'review', max: 20,
      fields: [
        { key: 'avatar', control: 'image', label: 'Avatar', default: '' },
        { key: 'round_avatar', control: 'toggle', label: 'Round avatar', default: true },
        { key: 'show_rating', control: 'toggle', label: 'Show rating', default: true },
        { key: 'rating', control: 'range', label: 'Rating', min: 1, max: 5, step: 0.5, default: 5, visibleWhen: (s) => s.show_rating },
        { key: 'author', control: 'text', label: 'Author', default: '' },
        { key: 'show_verified', control: 'toggle', label: 'Show verified buyer', default: false },
        { key: 'heading', control: 'text', label: 'Heading', default: '' },
        { key: 'content', control: 'richtext', label: 'Content', default: '', required: true },
        { key: 'associated_product', control: 'product', label: 'Associated product', default: '' },
      ],
      defaults: () => ({ round_avatar: true, show_rating: true, rating: 5, content: 'Absolutely love it — exactly as described and great quality.' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('tm'), kind: 'review', hidden: false, settings: { avatar: OS.sample.IMG.av1, round_avatar: true, show_rating: true, rating: 5, author: 'Sarah M.', show_verified: true, heading: 'Pure quality', content: 'The fit is perfect and the fabric feels amazing. I’ve already ordered two more.', associated_product: 'p1' } },
      { id: OS.uid('tm'), kind: 'review', hidden: false, settings: { avatar: OS.sample.IMG.av2, round_avatar: true, show_rating: true, rating: 4.5, author: 'James L.', show_verified: true, heading: 'Great value', content: 'Shipping was fast and the product exceeded my expectations for the price.', associated_product: 'p3' } },
      { id: OS.uid('tm'), kind: 'review', hidden: false, settings: { avatar: OS.sample.IMG.av3, round_avatar: true, show_rating: true, rating: 5, author: 'Mei K.', show_verified: false, heading: 'Obsessed', content: 'My new favourite. Comfortable enough to wear every single day.', associated_product: 'p2' } },
      { id: OS.uid('tm'), kind: 'review', hidden: false, settings: { avatar: OS.sample.IMG.av1, round_avatar: true, show_rating: true, rating: 4.5, author: 'Dana P.', show_verified: true, heading: 'Will buy again', content: 'Soft, well made and true to size. Highly recommend.', associated_product: 'p4' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background), cardBg = OS.bgOrTransparent(s.card_background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob), gap = OS.gridGap(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const cols = mob ? OS.clamp(s.mobile_columns, 1, 2, 1) : OS.clamp(s.desktop_columns, 1, 6, 4);
      const items = (blocks || []).filter((b) => !b.hidden && b.settings.content);
      const muted = (t.colors && t.colors.secondary_color) || '#777';
      const cards = items.map((b0) => {
        const b = b0.settings; const prod = b.associated_product ? OS.sample.products.find((p) => p.id === b.associated_product) : null;
        return '<div class="tm-card" data-block-id="' + OS.esc(b0.id) + '" style="background:' + cardBg + ';color:' + text + ';text-align:' + s.content_alignment + ';box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.05)">' +
          (b.show_rating ? stars(b.rating, s.star_color || '#f5b301') : '') +
          (b.heading ? '<div class="tm-h">' + OS.esc(b.heading) + '</div>' : '') +
          '<div class="tm-q">' + (b.content || '') + '</div>' +
          (prod ? '<div class="tm-prod"><div class="tm-prod-img" style="background-image:url(' + OS.esc(prod.image) + ')"></div><div style="font-size:12px"><div style="font-weight:600">' + OS.esc(prod.title) + '</div>' + (s.show_product_price ? '<div style="color:' + ((t.colors && t.colors.sale_price_color) || '#d92d20') + '">' + OS.money(prod.price) + '</div>' : '') + '</div></div>' : '') +
          '<div class="tm-author">' + (b.avatar ? '<div class="tm-av' + (b.round_avatar ? ' round' : '') + '" style="background-image:url(' + OS.esc(b.avatar) + ')"></div>' : '') +
          '<div><div class="tm-name">' + OS.esc(b.author || 'Verified buyer') + '</div>' + (b.show_verified ? '<div class="tm-verified" style="color:' + (s.verified_color || '#22c55e') + '">✓ Verified buyer</div>' : '') + '</div></div>' +
          '</div>';
      }).join('');
      const head = '<div class="tm-head">' + (s.subheading ? '<div class="tm-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 32) + 'px;color:' + OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a') + '">' + OS.esc(s.heading) + '</h2>' : '') + '</div>';
      return '<div class="tmx" style="background:' + bg + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + '<div class="tm-grid" style="grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px">' + (items.length ? cards : '<div style="opacity:.5;font-size:13px;padding:20px">Add a testimonial.</div>') + '</div></div></div>';
    },
  });
})();
