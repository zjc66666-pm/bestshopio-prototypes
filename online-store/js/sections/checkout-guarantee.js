/* Checkout · Guarantee badge — money-back reassurance for the checkout page.
   Shield seal + "{days}-DAY" pill + title + copy. Row or centered layout. Full-width by default. */
(function () {
  const OS = window.OS;
  const SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>';
  OS.css('checkout-guarantee', [
    '.ck-grt{box-sizing:border-box}.ck-grt *{box-sizing:border-box}',
    '.ck-grt .ckg-card{display:flex;align-items:center;gap:16px;border:1.5px solid #e4e4e7;padding:18px 20px;max-width:560px;margin:0 auto;background:#fff}',
    '.ck-grt.center .ckg-card{flex-direction:column;text-align:center;gap:12px}',
    '.ck-grt .ckg-seal{flex:none;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;color:#fff}',
    '.ck-grt .ckg-seal svg{width:30px;height:30px}',
    '.ck-grt .ckg-pill{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:2px 8px;border-radius:20px;margin:0 0 5px}',
    '.ck-grt .ckg-title{font-weight:800;font-size:15.5px;line-height:1.25;margin:0 0 4px}',
    '.ck-grt .ckg-text{font-size:12.5px;line-height:1.55;opacity:.82;margin:0}',
  ].join(''));

  OS.register('checkout-guarantee', {
    name: 'Guarantee badge', group: 'commerce', icon: 'lock',
    schema: [
      { key: 'days', control: 'text', label: 'Days', default: '120' },
      { key: 'title', control: 'text', label: 'Title', default: 'No Results, or Your Money Back' },
      { key: 'text', control: 'textarea', label: 'Text', default: "Try it risk-free. If you don't feel the difference within the guarantee window, we'll refund your purchase — no questions asked." },
      { key: 'layout', control: 'select', label: 'Layout', default: 'row', options: [
        { value: 'row', label: 'Row' }, { value: 'center', label: 'Centered' } ] },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padH = OS.ckPad(t, mob), padV = OS.secSpace(t, mob);
      const accent = (c.primary_color) || '#103635';
      const rad = OS.layoutRadius(t, 'card');
      return '<div class="ck-grt' + (s.layout === 'center' ? ' center' : '') + '" style="font-family:' + OS.bodyFamily(t) + ';padding:' + Math.round(padV * 0.5) + 'px ' + padH + 'px ' + Math.round(padV * 0.5) + 'px">' +
        '<div class="ckg-card" style="border-radius:' + rad + 'px">' +
          '<div class="ckg-seal" style="background:' + accent + '">' + SHIELD + '</div>' +
          '<div>' +
            (s.days ? '<span class="ckg-pill" style="color:' + accent + ';background:' + accent + '14">' + OS.esc(s.days) + '-Day Guarantee</span>' : '') +
            '<div class="ckg-title" style="color:' + (c.heading_color || '#1a1a1a') + ';font-family:' + OS.headingFamily(t) + '">' + OS.esc(s.title) + '</div>' +
            '<p class="ckg-text" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.esc(s.text) + '</p>' +
          '</div>' +
        '</div></div>';
    },
  });
})();
