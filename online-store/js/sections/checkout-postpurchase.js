/* Thank-you · Post-purchase one-click upsell — the CC core "buy again in one click, no re-entering
   payment" offer shown right after the order. Card: ONE-TIME OFFER tag + heading + optional timer +
   a product (image / name / new vs compare-at price / discount badge) + Add-to-order CTA + decline.
   Full-width (thank-you page stacks full-width). Themed via Button + Color + Layout tokens. */
(function () {
  const OS = window.OS;
  const CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  OS.css('checkout-postpurchase', [
    '.ck-pp{box-sizing:border-box}.ck-pp *{box-sizing:border-box}',
    '.ck-pp .ckpp-card{max-width:520px;margin:0 auto;border:2px solid;border-radius:14px;padding:22px 24px;text-align:center}',
    '.ck-pp .ckpp-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fff;border-radius:6px;padding:3px 10px;margin-bottom:10px}',
    '.ck-pp .ckpp-h{font-weight:800;margin:0 0 5px;line-height:1.2}',
    '.ck-pp .ckpp-sub{font-size:13px;opacity:.75;line-height:1.5;margin:0 auto 14px;max-width:430px}',
    '.ck-pp .ckpp-timer{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;margin-bottom:16px}.ck-pp .ckpp-timer svg{width:15px;height:15px}',
    '.ck-pp .ckpp-prod{display:flex;align-items:center;gap:14px;text-align:left;border:1px solid #e4e4e7;border-radius:10px;padding:12px 14px;margin-bottom:16px;background:#fff}',
    '.ck-pp .ckpp-img{flex:none;width:64px;height:64px;border-radius:8px;background-size:cover;background-position:center;background-color:#f1f1f3;border:1px solid #ededf0}',
    '.ck-pp .ckpp-info{flex:1;min-width:0}.ck-pp .ckpp-name{font-size:14px;font-weight:600;line-height:1.3}',
    '.ck-pp .ckpp-price{margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.ck-pp .ckpp-new{font-size:17px;font-weight:800}.ck-pp .ckpp-old{font-size:13px;text-decoration:line-through;opacity:.5}',
    '.ck-pp .ckpp-badge{font-size:11px;font-weight:800;color:#fff;border-radius:5px;padding:2px 7px}',
    '.ck-pp .ckpp-add{width:100%;margin-bottom:10px}',
    '.ck-pp .ckpp-decline{display:inline-block;font-size:13px;opacity:.6;text-decoration:underline;cursor:pointer}',
  ].join(''));

  OS.register('checkout-postpurchase', {
    name: 'Post-purchase upsell', group: 'thankyou', icon: 'plus',
    schema: [
      { key: 'tag', control: 'text', label: 'Tag', default: 'One-time offer' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Wait — add this to your order?' },
      { key: 'sub', control: 'textarea', label: 'Subheading', default: 'Exclusive one-time offer, only on this page. Add it with one click — no need to re-enter your payment details.' },
      { key: 'show_timer', control: 'toggle', label: 'Countdown', default: true },
      { key: 'time', control: 'text', label: 'Time', default: '04:59', visibleWhen: (s) => s.show_timer },
      { key: 'name', control: 'text', label: 'Product name', default: 'Cayenne Softgels — 3-Month Supply' },
      { key: 'price', control: 'text', label: 'Price', default: '$29.95' },
      { key: 'compare', control: 'text', label: 'Compare-at', default: '$59.90' },
      { key: 'badge', control: 'text', label: 'Discount badge', default: '50% OFF' },
      { key: 'image', control: 'image', label: 'Image', default: '' },
      { key: 'cta', control: 'text', label: 'Accept button', default: 'Add to my order' },
      { key: 'decline', control: 'text', label: 'Decline link', default: 'No thanks, I’ll pass' },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padV = OS.secSpace(t, mob), padH = OS.ckPad(t, mob);
      const accent = (c.primary_color) || '#103635';
      const sale = (c.sale_price_color) || '#d92d20';
      const rad = OS.layoutRadius(t, 'card');
      const img = s.image || (OS.sample.IMG && OS.sample.IMG.p5) || '';
      const timer = s.show_timer ? '<div class="ckpp-timer" style="color:' + sale + '">' + CLOCK + 'Offer expires in ' + OS.esc(s.time) + '</div>' : '';
      return '<div class="ck-pp" style="background:' + OS.bgOrTransparent(c.background) + ';color:' + (c.text_color || '#1a1a1a') + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div class="ckpp-card" style="border-color:' + accent + '33;border-radius:' + rad + 'px;background:' + OS.hexAlpha(accent, .03) + '">' +
          (s.tag ? '<span class="ckpp-tag" style="background:' + sale + '">' + OS.esc(s.tag) + '</span>' : '') +
          '<h2 class="ckpp-h" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 18 : 22) + 'px;color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.heading) + '</h2>' +
          (s.sub ? '<p class="ckpp-sub">' + OS.esc(s.sub) + '</p>' : '') + timer +
          '<div class="ckpp-prod" style="border-radius:' + rad + 'px">' +
            '<span class="ckpp-img" style="background-image:url(' + OS.esc(img) + ')"></span>' +
            '<span class="ckpp-info"><div class="ckpp-name" style="color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.name) + '</div>' +
              '<div class="ckpp-price"><span class="ckpp-new" style="color:' + sale + '">' + OS.esc(s.price) + '</span>' + (s.compare ? '<span class="ckpp-old">' + OS.esc(s.compare) + '</span>' : '') + (s.badge ? '<span class="ckpp-badge" style="background:' + sale + '">' + OS.esc(s.badge) + '</span>' : '') + '</div></span>' +
          '</div>' +
          '<button class="ckpp-add" style="' + OS.btnStyle(t) + ';width:100%">' + OS.esc(s.cta) + '</button>' +
          '<a class="ckpp-decline" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.esc(s.decline) + '</a>' +
        '</div></div>';
    },
  });
})();
