/* Thank-you · Shipment tracking — progress bar + 3 step labels (Order placed / Shipped /
   Out for delivery). Bar fill uses `progress`% and the theme primary color. No blocks. */
(function () {
  const OS = window.OS;
  OS.css('checkout-tracking', [
    '.ck-track{box-sizing:border-box}.ck-track *{box-sizing:border-box}',
    '.ck-track .ckt-head{margin:0 0 16px;line-height:1.2}',
    '.ck-track .ckt-card{border:1.5px solid #e4e4e7;background:#fff;padding:22px 20px}',
    '.ck-track .ckt-bar{position:relative;height:6px;border-radius:999px;background:#eceef1;overflow:hidden;margin:6px 0 14px}',
    '.ck-track .ckt-fill{position:absolute;inset:0 auto 0 0;border-radius:999px}',
    '.ck-track .ckt-steps{display:flex;justify-content:space-between;gap:8px}',
    '.ck-track .ckt-step{flex:1;text-align:center;font-size:12px;line-height:1.3}',
    '.ck-track .ckt-step:first-child{text-align:left}.ck-track .ckt-step:last-child{text-align:right}',
    '.ck-track .ckt-dot{width:14px;height:14px;border-radius:50%;border:2px solid #c4c4cc;background:#fff;margin:0 auto 7px}',
    '.ck-track .ckt-step:first-child .ckt-dot{margin-left:0}.ck-track .ckt-step:last-child .ckt-dot{margin-right:0}',
    '.ck-track .ckt-step.done .ckt-dot{border-color:currentColor;background:currentColor}',
    '.ck-track .ckt-step.done .ckt-lbl{font-weight:700}',
    '.ck-track .ckt-lbl{opacity:.7}.ck-track .ckt-step.done .ckt-lbl{opacity:1}',
  ].join(''));

  const STEPS = ['Order placed', 'Shipped', 'Out for delivery'];

  OS.register('checkout-tracking', {
    name: 'Shipment tracking', group: 'thankyou', icon: 'truck',
    schema: [
      { key: 'title', control: 'text', label: 'Title', default: 'Track your shipment' },
      { key: 'progress', control: 'range', label: 'Progress', min: 0, max: 100, step: 5, unit: '%', default: 55 },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const accent = (c.primary_color) || '#103635';
      const rad = OS.layoutRadius(t, 'card');
      const padV = OS.secSpace(t, mob), padH = OS.ckPad(t, mob);
      const pct = OS.clamp(s.progress, 0, 100, 55);

      // a step is "done" once the bar fill has reached its position (0%, 50%, 100%)
      const steps = STEPS.map((label, i) => {
        const at = STEPS.length > 1 ? (i / (STEPS.length - 1)) * 100 : 0;
        const done = pct >= at - 0.01;
        return '<div class="ckt-step' + (done ? ' done' : '') + '" style="color:' + accent + '">' +
          '<span class="ckt-dot"></span>' +
          '<span class="ckt-lbl" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.esc(label) + '</span></div>';
      }).join('');

      const head = s.title
        ? '<h2 class="ckt-head" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 17 : 20) + 'px;color:' + (c.heading_color || '#1a1a1a') + '">' + OS.esc(s.title) + '</h2>'
        : '';

      return '<div class="ck-track" style="background:' + OS.bgOrTransparent(c.background) + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:560px;margin:0 auto">' + head +
        '<div class="ckt-card" style="border-radius:' + rad + 'px">' +
        '<div class="ckt-bar"><div class="ckt-fill" style="width:' + pct + '%;background:' + accent + '"></div></div>' +
        '<div class="ckt-steps">' + steps + '</div>' +
        '</div></div></div>';
    },
  });
})();
