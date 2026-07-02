/* Checkout · Specialist endorsement — "Doctor / Specialist Approved" trust card for the right rail.
   Photo + name/title + green approval seal + a short quote. ctx.rail → compact padding. */
(function () {
  const OS = window.OS;
  const SEAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
  OS.css('checkout-endorsement', [
    '.ck-end{box-sizing:border-box}.ck-end *{box-sizing:border-box}',
    '.ck-end .cke-card{border:1.5px solid #e4e4e7;background:#fff;padding:15px 16px}',
    '.ck-end .cke-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}',
    '.ck-end .cke-photo{flex:none;width:52px;height:52px;border-radius:50%;object-fit:cover;background:#eceef1}',
    '.ck-end .cke-h{font-size:14px;font-weight:800;line-height:1.2}',
    '.ck-end .cke-by{font-size:11.5px;opacity:.72;margin-top:3px;line-height:1.35}',
    '.ck-end .cke-seal{flex:none;margin-left:auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff}',
    '.ck-end .cke-seal svg{width:16px;height:16px}',
    '.ck-end .cke-q{font-size:12.5px;line-height:1.55;margin:0;opacity:.88}',
  ].join(''));

  OS.register('checkout-endorsement', {
    name: 'Specialist endorsement', group: 'commerce', icon: 'user',
    schema: [
      { key: 'badge', control: 'text', label: 'Heading', default: 'Specialist Approved' },
      { key: 'name', control: 'text', label: 'Name', default: 'Dr. Michael Reeves' },
      { key: 'title', control: 'text', label: 'Title', default: 'Cardiovascular Specialist' },
      { key: 'image', control: 'image', label: 'Photo', default: '' },
      { key: 'quote', control: 'textarea', label: 'Quote', default: 'These symptoms aren’t random — they’re driven by low Nitric Oxide and poor blood flow as vessels stiffen with age. A targeted, high-strength formula helps restore healthy circulation.' },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padV = ctx.rail ? (mob ? 12 : 16) : OS.secSpace(t, mob);
      const padH = OS.ckPad(t, mob); // follows configurable page padding (symmetric with left column)
      const rad = OS.layoutRadius(t, 'card');
      const accent = (c.success_color) || '#0f8a5f';
      const img = s.image || (OS.sample.IMG && OS.sample.IMG.av1) || '';
      return '<div class="ck-end" style="font-family:' + OS.bodyFamily(t) + ';color:' + (c.text_color || '#1a1a1a') + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="' + (ctx.rail ? '' : 'max-width:560px;margin:0 auto') + '"><div class="cke-card" style="border-radius:' + rad + 'px">' +
          '<div class="cke-row"><img class="cke-photo" src="' + OS.esc(img) + '" alt="">' +
            '<div><div class="cke-h" style="color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.badge) + '</div><div class="cke-by"><b>' + OS.esc(s.name) + '</b><br>' + OS.esc(s.title) + '</div></div>' +
            '<div class="cke-seal" style="background:' + accent + '">' + SEAL + '</div></div>' +
          '<p class="cke-q">' + OS.esc(s.quote) + '</p>' +
        '</div></div></div>';
    },
  });
})();
