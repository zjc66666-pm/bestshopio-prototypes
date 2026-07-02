/* Thank-you · Order confirmation — centered success check + headline + subtitle.
   Heading color/size + body font come from the global theme tokens. No blocks. */
(function () {
  const OS = window.OS;
  // inline check glyph — the engine icon set has no 'check', so draw it locally
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  OS.css('checkout-confirm', [
    '.ck-confirm{box-sizing:border-box;text-align:center}.ck-confirm *{box-sizing:border-box}',
    '.ck-confirm .ckc-check{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;background:#e7f6ec;color:#15803d}',
    '.ck-confirm .ckc-check svg{width:32px;height:32px}',
    '.ck-confirm .ckc-title{margin:0 0 8px;line-height:1.2}',
    '.ck-confirm .ckc-sub{font-size:15px;opacity:.7;margin:0}',
  ].join(''));

  OS.register('checkout-confirm', {
    name: 'Order confirmation', group: 'thankyou', icon: 'check',
    schema: [
      { key: 'title', control: 'text', label: 'Title', default: 'Thank you for your order!' },
      { key: 'subtitle', control: 'text', label: 'Subtitle', default: 'Order #1042 is confirmed' },
      { key: 'show_check', control: 'toggle', label: 'Show success check', default: true },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padV = OS.secSpace(t, mob), padH = OS.ckPad(t, mob);
      const check = s.show_check
        ? '<div class="ckc-check">' + CHECK + '</div>'
        : '';
      const title = s.title
        ? '<h2 class="ckc-title" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 32) + 'px;color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.title) + '</h2>'
        : '';
      const sub = s.subtitle
        ? '<p class="ckc-sub" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.esc(s.subtitle) + '</p>'
        : '';
      return '<div class="ck-confirm" style="background:' + OS.bgOrTransparent(c.background) + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:560px;margin:0 auto">' + check + title + sub + '</div></div>';
    },
  });
})();
