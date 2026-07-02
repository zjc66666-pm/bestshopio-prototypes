/* Checkout · Header — the brand logo bar at the very top of the checkout. Real checkouts open with
   the store's logo (the storefront nav is stripped on checkout), so this gives the merchant a place
   to put it. Configurable logo image (or text wordmark fallback), alignment, height, optional
   secure-checkout line + bottom divider. Full-width — sits above the two-column body. */
(function () {
  const OS = window.OS;
  OS.css('checkout-header', [
    '.ck-hd{box-sizing:border-box}.ck-hd *{box-sizing:border-box}',
    '.ck-hd .ckh-in{display:flex;flex-direction:column;gap:7px}',
    '.ck-hd.left .ckh-in{align-items:flex-start}.ck-hd.center .ckh-in{align-items:center}',
    '.ck-hd .ckh-logo{display:block;width:auto;object-fit:contain}',
    '.ck-hd .ckh-word{font-weight:800;letter-spacing:.05em;text-transform:uppercase;line-height:1}',
    '.ck-hd .ckh-ph{display:grid;place-items:center;border:1.5px dashed #cfd5dd;border-radius:7px;color:#9aa3af;font-size:11.5px;font-weight:600;padding:0 14px}',
    '.ck-hd .ckh-secure{display:flex;align-items:center;gap:6px;font-size:12px;opacity:.62}',
    '.ck-hd .ckh-secure svg{width:13px;height:13px}',
  ].join(''));

  OS.register('checkout-header', {
    name: 'Checkout header', group: 'commerce', icon: 'image',
    schema: [
      { key: 'logo_image', control: 'image', label: 'Logo image', default: '', info: 'Blank shows the text wordmark below.' },
      { key: 'logo_text', control: 'text', label: 'Logo text (fallback)', default: 'AURA', visibleWhen: (s) => !s.logo_image },
      { key: 'logo_height', control: 'range', label: 'Logo height', min: 20, max: 72, step: 1, unit: 'px', default: 34 },
      { key: 'align', control: 'segmented', label: 'Alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'show_secure', control: 'toggle', label: 'Secure-checkout line', default: false },
      { key: 'divider', control: 'toggle', label: 'Bottom divider', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
    ],
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const padH = OS.ckPad(t, mob);
      const h = OS.clamp(s.logo_height, 20, 72, 34);
      const align = s.align === 'left' ? 'left' : 'center';
      const hc = c.heading_color || '#1a1a1a';
      let logo;
      if (s.logo_image) {
        logo = '<img class="ckh-logo" src="' + OS.esc(s.logo_image) + '" alt="" style="height:' + h + 'px">';
      } else if (s.logo_text) {
        logo = '<span class="ckh-word" style="font-family:' + OS.headingFamily(t) + ';font-size:' + Math.round(h * 0.62) + 'px;color:' + hc + '">' + OS.esc(s.logo_text) + '</span>';
      } else {
        logo = '<span class="ckh-ph" style="height:' + h + 'px">Add your logo</span>';
      }
      const secure = s.show_secure ? '<div class="ckh-secure" style="color:' + (c.text_color || '#1a1a1a') + '">' + OS.icon('lock') + 'Secure checkout</div>' : '';
      const border = s.divider ? ';border-bottom:1px solid ' + (c.border_color || '#ededf0') : '';
      return '<div class="ck-hd ' + align + '" style="background:' + OS.bgOrTransparent(s.background) + ';font-family:' + OS.bodyFamily(t) + ';padding:' + (mob ? 16 : 20) + 'px ' + padH + 'px' + border + '">' +
        '<div class="ckh-in">' + logo + secure + '</div></div>';
    },
  });
})();
