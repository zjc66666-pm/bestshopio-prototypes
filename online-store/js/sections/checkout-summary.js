/* Checkout · Order summary — RUNTIME, cart-driven. Line items, quantities, variants and totals come
   from the customer's cart at checkout (orderDetail.orderList[].orderProduct in production), so they
   are NOT editable in the builder — this is a faithful PREVIEW with sample cart data. Structure +
   styles ported 1:1 from the production checkout: reference/shop-pc/pages/payment.vue · .right-section
   (product-item: image + quantity-badge + name + variant pill + price/struck; summary rows:
   Subtotal · N Items / Order discount / Shipping FREE / Total / TOTAL SAVINGS). The only builder
   setting is whether the coupon field shows. ctx.rail → renders inside the checkout right panel. */
(function () {
  const OS = window.OS;
  const TAG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4a1.2 1.2 0 0 1 1.2-1.2h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor"/></svg>';
  OS.css('checkout-summary', [
    '.ck-sum{box-sizing:border-box}.ck-sum *{box-sizing:border-box}',
    '.ck-sum .cks-hint{display:flex;gap:7px;align-items:flex-start;font-size:11.5px;color:#8a93a0;background:rgba(255,255,255,.6);border:1px dashed #d6d9dd;border-radius:8px;padding:8px 10px;margin-bottom:14px;line-height:1.45}.ck-sum .cks-hint svg{flex:none;margin-top:1px}',
    '.ck-sum .cks-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px}.ck-sum.rail .cks-card{background:transparent;border:0;padding:0}',
    '.ck-sum .pl-item{display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid #e5e7eb}.ck-sum .pl-item:first-child{padding-top:2px}.ck-sum .pl-item:last-child{border-bottom:0}',
    '.ck-sum .pl-img{position:relative;width:72px;height:72px;border-radius:8px;flex-shrink:0;background-size:cover;background-position:center;background-color:#eceef1}',
    '.ck-sum .pl-qty{position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:1px solid #fff;padding:0 5px}',
    '.ck-sum .pl-det{flex:1;min-width:0}.ck-sum .pl-name{font-weight:500;color:#333;margin-bottom:6px;line-height:1.3;font-size:13.5px}',
    '.ck-sum .pl-var{display:flex;flex-wrap:wrap;gap:5px}.ck-sum .pl-var span{font-size:11.5px;color:#6b7280;padding:3px 9px;border-radius:999px;background:#f0f0f0;line-height:1.25}',
    '.ck-sum .pl-disc{display:flex;align-items:center;gap:4px;font-size:11.5px;color:#6b7280;margin-top:6px}',
    '.ck-sum .pl-price{display:flex;flex-direction:column;align-items:flex-end;font-weight:600;color:#333;white-space:nowrap;font-size:13.5px}.ck-sum .pl-price .o{color:#888;text-decoration:line-through;font-size:12px;font-weight:500;margin-top:2px}',
    '.ck-sum .cks-coupon{display:flex;gap:8px;margin:14px 0 6px}.ck-sum .cks-cin{flex:1;min-width:0}.ck-sum .cks-capply{flex:none;padding:0 16px;border:1px solid #b5b5b5;background:#f8f8fa;border-radius:8px;font-weight:600;font-size:13.5px;color:#222;cursor:default}',
    '.ck-sum .sr{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:14px;padding:6px 0}.ck-sum .sr .l{color:#333}.ck-sum .sr .v{font-weight:600;color:#333;white-space:nowrap}',
    '.ck-sum .sr.sub .l{display:flex;align-items:center;gap:5px;color:#6b7280;font-size:13px}.ck-sum .sr.sub .v{color:#6b7280;font-weight:600}.ck-sum .sr .v .strike{color:#888;text-decoration:line-through;margin-right:6px;font-weight:500}',
    '.ck-sum .cks-total{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-top:12px;padding-top:14px;border-top:1px solid #e5e7eb}.ck-sum .cks-total .tl{font-size:18px;font-weight:800;color:#222}.ck-sum .cks-total .ta{font-size:22px;font-weight:800;color:#222}.ck-sum .cks-total .cur{font-size:13px;font-weight:600;opacity:.6;margin-right:4px}',
    '.ck-sum .cks-savings{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:12px;font-size:13px;font-weight:700;color:#1f8f4e}',
  ].join(''));

  // Sample cart — represents the runtime orderProduct list (NOT editable; the real cart drives it).
  function sampleCart() {
    const IMG = OS.sample.IMG || {};
    return [
      { image: IMG.p1, qty: 1, name: 'Folding Table Lamp · USB Touch Dimmable', variant: ['Color: White', 'Plug-in (no battery)'], price: '$9.32' },
      { image: IMG.p5, qty: 2, name: 'Cayenne Softgels · 3-Month Supply', variant: ['Flavor: Original'], price: '$79.90', compare: '$119.80', disc: 'BOGO50 (−$39.95)' },
    ];
  }

  OS.register('checkout-summary', {
    name: 'Order summary', group: 'commerce', icon: 'list', core: true,
    schema: [
      { info: 'Items, quantities, variants & totals come from the customer’s cart at checkout — shown here as a non-editable preview with sample data.' },
      { key: 'show_coupon', control: 'toggle', label: 'Show coupon field', default: true },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const accent = (c.primary_color) || '#103635';
      const padV = ctx.rail ? (mob ? 12 : 16) : OS.secSpace(t, mob);
      // Horizontal padding follows the theme's page padding (configurable) so the summary's outer
      // (right) edge stays symmetric with the payment column's outer (left) edge. Unlike the
      // hardcoded production checkout, BestShopio's checkout is theme-configurable.
      const padH = OS.ckPad(t, mob);
      const items = sampleCart();

      const rows = items.map(function (it) {
        const vars = (it.variant || []).map(function (v) { return '<span>' + OS.esc(v) + '</span>'; }).join('');
        return '<div class="pl-item">' +
          '<div class="pl-img" style="background-image:url(' + OS.esc(it.image) + ')"><span class="pl-qty" style="background:' + accent + '">' + it.qty + '</span></div>' +
          '<div class="pl-det"><div class="pl-name">' + OS.esc(it.name) + '</div>' + (vars ? '<div class="pl-var">' + vars + '</div>' : '') + (it.disc ? '<div class="pl-disc">' + TAG + OS.esc(it.disc) + '</div>' : '') + '</div>' +
          '<div class="pl-price">' + OS.esc(it.price) + (it.compare ? '<span class="o">' + OS.esc(it.compare) + '</span>' : '') + '</div>' +
        '</div>';
      }).join('');

      const coupon = s.show_coupon ? '<div class="cks-coupon"><input class="cks-cin" readonly placeholder="Discount code" style="' + OS.inputStyle(t) + ';width:100%"><button class="cks-capply">Apply</button></div>' : '';

      return '<div class="ck-sum' + (ctx.rail ? ' rail' : '') + '" style="color:#222;font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="' + (ctx.rail ? '' : 'max-width:560px;margin:0 auto') + '">' +
          '<div class="cks-card">' +
            '<div data-ck-part="cart">' + rows + '</div>' +
            '<div data-ck-part="discounts">' + coupon + '<div class="sr sub"><span class="l">' + TAG + 'BOGO50</span><span class="v">−$39.95</span></div></div>' +
            '<div data-ck-part="total">' +
              '<div class="sr"><span class="l">Subtotal • 3 Items</span><span class="v">$89.22</span></div>' +
              '<div class="sr"><span class="l">Shipping</span><span class="v"><span class="strike">−$8.99</span>FREE</span></div>' +
              '<div class="cks-total"><span class="tl">Total</span><span class="ta"><span class="cur">USD</span>$49.27</span></div>' +
              '<div class="cks-savings">' + TAG + 'TOTAL SAVINGS $48.94</div>' +
            '</div>' +
          '</div>' +
        '</div></div>';
    },
  });
})();
