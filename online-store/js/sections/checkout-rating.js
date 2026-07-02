/* Checkout · Rating bar — Trustpilot-style "Excellent ★★★★★ Trustpilot" trust strip for the right
   rail (or full-width). Green star tiles + provider + a subtitle line. ctx.rail → compact padding. */
(function () {
  const OS = window.OS;
  const STAR = '<svg viewBox="0 0 24 24" fill="#fff"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';
  const STARG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="#00b67a" style="vertical-align:-2px"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';
  OS.css('checkout-rating', [
    '.ck-rate{box-sizing:border-box}.ck-rate *{box-sizing:border-box}',
    '.ck-rate .ckr-card{display:flex;flex-direction:column;gap:7px}',
    '.ck-rate .ckr-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}',
    '.ck-rate .ckr-lab{font-size:15px;font-weight:800}',
    '.ck-rate .ckr-stars{display:inline-flex;gap:3px}',
    '.ck-rate .ckr-st{width:21px;height:21px;border-radius:3px;display:grid;place-items:center}',
    '.ck-rate .ckr-st svg{width:14px;height:14px}',
    '.ck-rate .ckr-prov{display:inline-flex;align-items:center;gap:4px;font-size:13.5px;font-weight:700}',
    '.ck-rate .ckr-sub{font-size:12px;opacity:.7}',
  ].join(''));

  OS.register('checkout-rating', {
    name: 'Rating bar', group: 'commerce', icon: 'star',
    schema: [
      { key: 'label', control: 'text', label: 'Label', default: 'Excellent' },
      { key: 'stars', control: 'range', label: 'Stars', min: 1, max: 5, step: 1, default: 5 },
      { key: 'provider', control: 'text', label: 'Provider', default: 'Trustpilot' },
      { key: 'sub', control: 'text', label: 'Subtitle', default: 'Rated 4.8 / 5 by 45,000+ customers' },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padV = ctx.rail ? (mob ? 12 : 16) : OS.secSpace(t, mob);
      const padH = OS.ckPad(t, mob); // follows configurable page padding (symmetric with left column)
      const green = '#00b67a';
      const n = Math.max(1, Math.min(5, parseInt(s.stars, 10) || 5));
      let stars = '';
      for (let i = 0; i < 5; i++) stars += '<span class="ckr-st" style="background:' + (i < n ? green : '#d6d9dd') + '">' + STAR + '</span>';
      return '<div class="ck-rate" style="font-family:' + OS.bodyFamily(t) + ';color:' + (c.text_color || '#1a1a1a') + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="' + (ctx.rail ? '' : 'max-width:560px;margin:0 auto') + '"><div class="ckr-card">' +
          '<div class="ckr-top"><span class="ckr-lab" style="color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.label) + '</span>' +
            '<span class="ckr-stars">' + stars + '</span>' +
            '<span class="ckr-prov">' + STARG + OS.esc(s.provider) + '</span></div>' +
          (s.sub ? '<div class="ckr-sub">' + OS.esc(s.sub) + '</div>' : '') +
        '</div></div></div>';
    },
  });
})();
