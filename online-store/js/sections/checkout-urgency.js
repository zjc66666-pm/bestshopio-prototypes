/* Checkout · Urgency bar — scarcity countdown / reservation reassurance for the checkout page.
   Two styles: 'reserve' (green "your order is reserved for…") and 'stock' (red "LIMITED STOCK").
   The time is a static display value — the builder re-renders on edit, so no live tick. Full-width. */
(function () {
  const OS = window.OS;
  const CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const ALARM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
  OS.css('checkout-urgency', [
    '.ck-urg{box-sizing:border-box}.ck-urg *{box-sizing:border-box}',
    '.ck-urg .cku-bar{display:flex;align-items:center;justify-content:center;gap:9px;border:1.5px solid;border-radius:10px;padding:11px 16px;font-size:14px;font-weight:600;line-height:1.35;text-align:center}',
    '.ck-urg .cku-ic{flex:none;width:18px;height:18px}.ck-urg .cku-ic svg{width:18px;height:18px;display:block}',
    '.ck-urg .cku-time{font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:.03em}',
  ].join(''));

  OS.register('checkout-urgency', {
    name: 'Urgency bar', group: 'commerce', icon: 'cart',
    schema: [
      { key: 'style', control: 'select', label: 'Style', default: 'reserve', options: [
        { value: 'reserve', label: 'Reserved (green)' }, { value: 'stock', label: 'Limited stock (red)' } ] },
      { key: 'message', control: 'text', label: 'Message', default: 'Due to high demand your order is reserved for:' },
      { key: 'time', control: 'text', label: 'Countdown', default: '02:45' },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padH = OS.ckPad(t, mob);
      const stock = s.style === 'stock';
      const fg = stock ? ((c.sale_price_color) || '#d92d20') : ((c.success_color) || '#0f8a5f');
      const bg = stock ? '#fef2f2' : '#eefaf3';
      const ic = stock ? ALARM : CLOCK;
      // Full-width band at the very top of the checkout (matches the DTC "reserved for…" bar).
      return '<div class="ck-urg" style="font-family:' + OS.bodyFamily(t) + ';padding:' + (mob ? 12 : 14) + 'px ' + padH + 'px 0">' +
        '<div class="cku-bar" style="color:' + fg + ';border-color:' + fg + '40;background:' + bg + '">' +
          '<span class="cku-ic">' + ic + '</span>' +
          '<span>' + OS.esc(s.message) + (s.time ? ' <span class="cku-time">' + OS.esc(s.time) + '</span>' : '') + '</span>' +
        '</div></div>';
    },
  });
})();
