/* Checkout · Bundle picker — tiered offer cards for a one-page DTC checkout (Lovocross-style).
   Homogeneous Offer blocks (max 5): radio-select card with title, free-shipping pill, subtitle,
   price + struck compare-at, corner badge (BEST SELLER / BEST DEAL). The default/selected offer
   shows a variant-select row. Themed via the global Layout (card radius) + Button/Color tokens. */
(function () {
  const OS = window.OS;
  OS.css('checkout-bundle', [
    '.ck-bundle{box-sizing:border-box}.ck-bundle *{box-sizing:border-box}',
    '.ck-bundle .ckb-head{margin:0 0 16px;line-height:1.2}',
    '.ck-bundle .ckb-list{display:flex;flex-direction:column;gap:12px}',
    '.ck-bundle .ckb-offer{position:relative;display:flex;align-items:center;gap:14px;border:1.5px solid #e4e4e7;background:#fff;padding:16px 18px;cursor:pointer;transition:border-color .12s,box-shadow .12s}',
    '.ck-bundle .ckb-offer.on{border-color:currentColor}',
    '.ck-bundle .ckb-dot{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid #c4c4cc;display:grid;place-items:center}',
    '.ck-bundle .ckb-offer.on .ckb-dot{border-color:currentColor}',
    '.ck-bundle .ckb-dot i{width:10px;height:10px;border-radius:50%;background:currentColor;display:none}',
    '.ck-bundle .ckb-offer.on .ckb-dot i{display:block}',
    '.ck-bundle .ckb-main{flex:1;min-width:0}',
    '.ck-bundle .ckb-title{font-weight:700;font-size:15px;line-height:1.25;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.ck-bundle .ckb-ship{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;letter-spacing:.02em;padding:2px 8px;border-radius:999px;background:#e7f6ec;color:#15803d}',
    '.ck-bundle .ckb-sub{font-size:12.5px;opacity:.7;margin-top:3px}',
    '.ck-bundle .ckb-price{flex:none;text-align:right;white-space:nowrap}',
    '.ck-bundle .ckb-now{font-weight:800;font-size:17px}',
    '.ck-bundle .ckb-was{display:block;font-size:12px;text-decoration:line-through;opacity:.5}',
    '.ck-bundle .ckb-badge{position:absolute;top:-9px;right:14px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fff;padding:3px 9px;border-radius:999px}',
    '.ck-bundle .ckb-variant{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1px dashed #e4e4e7}',
    '.ck-bundle .ckb-variant label{font-size:12.5px;font-weight:600;opacity:.8}',
    '.ck-bundle .ckb-variant select{flex:1;-webkit-appearance:none;appearance:none;cursor:pointer}',
    '.ck-bundle.mob .ckb-now{font-size:16px}',
  ].join(''));

  OS.register('checkout-bundle', {
    name: 'Bundle picker', group: 'commerce', icon: 'layers',
    schema: [
      { key: 'step_title', control: 'text', label: 'Step title', default: 'Step 1: Choose Your Bundles' },
      { key: 'currency', control: 'text', label: 'Currency symbol', default: '$' },
      { key: 'variant_label', control: 'text', label: 'Variant label', default: 'Color' },
    ],
    blocks: {
      name: 'Offer', kind: 'offer', max: 5,
      fields: [
        { key: 'title', control: 'text', label: 'Title', default: 'Buy 2, Get 2 FREE' },
        { key: 'subtitle', control: 'text', label: 'Subtitle', default: '4 Collagen Face Wraps' },
        { key: 'price', control: 'text', label: 'Price', default: '55.90' },
        { key: 'compare_at', control: 'text', label: 'Compare-at price', default: '159.60' },
        { key: 'badge', control: 'text', label: 'Corner badge', default: '' },
        { key: 'free_shipping', control: 'toggle', label: 'Free shipping', default: false },
        { key: 'is_default', control: 'toggle', label: 'Selected by default', default: false },
      ],
      defaults: () => ({ title: 'Buy 1, Get 1 FREE', subtitle: '2 Collagen Face Wraps', price: '39.90', compare_at: '79.80' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('off'), kind: 'offer', hidden: false, settings: { title: 'Buy 1, Get 1 FREE', subtitle: '2 Collagen Face Wraps', price: '39.90', compare_at: '79.80', badge: '', free_shipping: false, is_default: false } },
      { id: OS.uid('off'), kind: 'offer', hidden: false, settings: { title: 'Buy 2, Get 2 FREE', subtitle: '4 Collagen Face Wraps', price: '55.90', compare_at: '159.60', badge: 'BEST SELLER', free_shipping: true, is_default: false } },
      { id: OS.uid('off'), kind: 'offer', hidden: false, settings: { title: 'Buy 3, Get 3 FREE', subtitle: '6 Collagen Face Wraps', price: '69.90', compare_at: '239.40', badge: 'BEST DEAL', free_shipping: true, is_default: true } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const cur = s.currency || '$';
      const accent = (c.primary_color) || '#103635';
      const rad = OS.layoutRadius(t, 'card');
      const padV = OS.secSpace(t, mob), padH = OS.ckPad(t, mob);
      const offers = (blocks || []).filter((b) => !b.hidden);
      // active offer: editor selection wins, else the is_default offer, else first
      let active = offers.findIndex((b) => b.id === ctx.selectedBlockId);
      if (active < 0) active = offers.findIndex((b) => b.settings.is_default);
      if (active < 0) active = 0;
      const badgeColor = (b) => /deal/i.test(b) ? '#d92d20' : ((c.sale_price_color) || '#e0651a');

      const cards = offers.map((b0, i) => {
        const b = b0.settings; const on = i === active;
        const badge = b.badge ? '<span class="ckb-badge" style="background:' + badgeColor(b.badge) + '">' + OS.esc(b.badge) + '</span>' : '';
        const ship = b.free_shipping ? '<span class="ckb-ship">&#10003; Free Shipping</span>' : '';
        const was = b.compare_at ? '<s class="ckb-was">' + cur + OS.esc(b.compare_at) + '</s>' : '';
        const variant = on
          ? '<div class="ckb-variant"><label>' + OS.esc(s.variant_label || 'Color') + '</label>' +
            '<select style="' + OS.inputStyle(t) + ';height:38px">' +
            '<option>Beige</option><option>Rose</option><option>Sand</option></select></div>'
          : '';
        return '<div class="ckb-offer' + (on ? ' on' : '') + '" data-block-id="' + OS.esc(b0.id) + '" style="border-radius:' + rad + 'px;color:' + accent + '">' +
          badge +
          '<span class="ckb-dot"><i></i></span>' +
          '<div class="ckb-main" style="color:' + (c.text_color || '#1a1a1a') + '">' +
          '<div class="ckb-title">' + OS.esc(b.title) + ship + '</div>' +
          (b.subtitle ? '<div class="ckb-sub">' + OS.esc(b.subtitle) + '</div>' : '') +
          variant +
          '</div>' +
          '<div class="ckb-price" style="color:' + (c.text_color || '#1a1a1a') + '"><span class="ckb-now">' + cur + OS.esc(b.price) + '</span>' + was + '</div>' +
          '</div>';
      }).join('');

      const head = s.step_title
        ? '<h2 class="ckb-head" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 20 : 24) + 'px;color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.step_title) + '</h2>'
        : '';

      return '<div class="ck-bundle' + (mob ? ' mob' : '') + '" style="background:' + OS.bgOrTransparent(c.background) + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:560px;margin:0 auto">' + head +
        '<div class="ckb-list">' + (offers.length ? cards : '<div style="opacity:.5;font-size:13px;padding:14px">Add an offer from the structure tree.</div>') + '</div>' +
        '</div></div>';
    },
  });
})();
