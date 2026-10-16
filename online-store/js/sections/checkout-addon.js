/* Checkout · Upsell add-on — "Customers Also Grabbed" cross-sell list for the checkout page.
   Homogeneous Item blocks (max 6): checkbox + small thumbnail + name + price (struck compare-at).
   Themed via Layout (card/image radius) + Color tokens. Visual-only checkboxes. */
(function () {
  const OS = window.OS;
  // inline check glyph — the engine icon set has no 'check', so draw it locally
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  OS.css('checkout-addon', [
    '.ck-addon{box-sizing:border-box}.ck-addon *{box-sizing:border-box}',
    '.ck-addon .cka-head{margin:0 0 14px;line-height:1.2}',
    '.ck-addon .cka-card{border:1.5px solid #e4e4e7;background:#fff;overflow:hidden}',
    '.ck-addon .cka-item{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer}',
    '.ck-addon .cka-item + .cka-item{border-top:1px solid #f0f0f2}',
    '.ck-addon .cka-item.on{background:#f7faf9}',
    '.ck-addon .cka-box{flex:none;width:20px;height:20px;border-radius:5px;border:2px solid #c4c4cc;display:grid;place-items:center;color:#fff}',
    '.ck-addon .cka-item.on .cka-box{background:currentColor;border-color:currentColor}',
    '.ck-addon .cka-box svg{width:13px;height:13px;display:none}',
    '.ck-addon .cka-item.on .cka-box svg{display:block;color:#fff}',
    '.ck-addon .cka-img{flex:none;width:48px;height:48px;background-size:cover;background-position:center;background-color:#eceef1}',
    '.ck-addon .cka-name{flex:1;min-width:0;font-size:13.5px;font-weight:600;line-height:1.3}',
    '.ck-addon .cka-price{flex:none;white-space:nowrap;text-align:right;font-size:13.5px}',
    '.ck-addon .cka-price b{font-weight:800}',
    '.ck-addon .cka-price s{font-size:11.5px;opacity:.5;margin-left:6px}',
  ].join(''));

  OS.register('checkout-addon', {
    name: 'Upsell add-on', group: 'commerce', icon: 'plus',
    schema: [
      { key: 'title', control: 'text', label: 'Title', default: 'Customers Also Grabbed' },
    ],
    blocks: {
      name: 'Item', kind: 'item', max: 6,
      fields: [
        { key: 'name', control: 'text', label: 'Name', default: '' },
        { key: 'price', control: 'text', label: 'Price', default: '' },
        { key: 'compare_at', control: 'text', label: 'Compare-at price', default: '' },
        { key: 'image', control: 'image', label: 'Image', default: '' },
      ],
      defaults: () => ({ name: 'Add-on product', price: '19.9' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('adn'), kind: 'item', hidden: false, settings: { name: 'Tech Neck Rescue Cream', price: '19.9', compare_at: '49', image: OS.sample.IMG.p5 } },
      { id: OS.uid('adn'), kind: 'item', hidden: false, settings: { name: 'Anti-Wrinkle Facial Patches', price: '15.9', compare_at: '', image: OS.sample.IMG.p2 } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const accent = (c.primary_color) || '#103635';
      const rad = OS.layoutRadius(t, 'card'), imgRad = OS.layoutRadius(t, 'image');
      const padV = OS.secSpace(t, mob), padH = OS.ckPad(t, mob);
      const sale = (c.sale_price_color) || '#d92d20';
      const items = (blocks || []).filter((b) => !b.hidden);

      const rows = items.map((b0) => {
        const b = b0.settings; const on = b0.id === ctx.selectedBlockId;
        const price = '<div class="cka-price" style="color:' + (c.text_color || '#1a1a1a') + '"><b' + (b.compare_at ? ' style="color:' + sale + '"' : '') + '>$' + OS.esc(b.price) + '</b>' + (b.compare_at ? '<s>$' + OS.esc(b.compare_at) + '</s>' : '') + '</div>';
        return '<div class="cka-item' + (on ? ' on' : '') + '" data-block-id="' + OS.esc(b0.id) + '" style="color:' + accent + '">' +
          '<span class="cka-box">' + CHECK + '</span>' +
          '<span class="cka-img" style="border-radius:' + imgRad + 'px;background-image:url(' + OS.esc(b.image) + ')"></span>' +
          '<span class="cka-name" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.esc(b.name) + '</span>' +
          price +
          '</div>';
      }).join('');

      const head = s.title
        ? '<h2 class="cka-head" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 17 : 20) + 'px;color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.title) + '</h2>'
        : '';

      return '<div class="ck-addon" style="background:' + OS.bgOrTransparent(c.background) + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:560px;margin:0 auto">' + head +
        '<div class="cka-card" style="border-radius:' + rad + 'px">' + (items.length ? rows : '<div style="opacity:.5;font-size:13px;padding:14px">Add an item from the structure tree.</div>') + '</div>' +
        '</div></div>';
    },
  });
})();
