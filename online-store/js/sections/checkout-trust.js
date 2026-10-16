/* Checkout · Trust & certifications — the round "seal wall" every DTC checkout shows
   (GMP Certified · Made in USA · GMO Free · All Natural · FDA Registered · Secure …).
   Block-based like As-seen-in, but each block is a round cert badge (built-in icon presets
   so a merchant gets instant value with no uploads). ctx.rail → compact badges + padding. */
(function () {
  const OS = window.OS;

  // built-in cert/trust icon presets — stroke SVGs so they tint to one accent and read at any size
  const I = {
    quality: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4"/><path d="M9 14.5 7.5 22 12 19l4.5 3L15 14.5"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4s1.5-1 4-1 4 2 7 2 4-1 4-1v9s-1.5 1-4 1-4-2-7-2-4 1-4 1"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-6 8-9 16-9 0 8-3 16-9 16Z"/><path d="M4 21c2-6 6-9 12-11"/></svg>',
    nogmo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6 18.4 18.4"/><path d="M9 14c0-3 2-5 6-5"/></svg>',
    shieldCheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    refund: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></svg>',
    paw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="10" r="1.8"/><circle cx="17.5" cy="10" r="1.8"/><circle cx="9.5" cy="6" r="1.8"/><circle cx="14.5" cy="6" r="1.8"/><path d="M12 12c-2.5 0-5 2-5 4.5C7 19 9 20 12 20s5-1 5-3.5C17 14 14.5 12 12 12Z"/></svg>',
  };
  const PRESETS = {
    gmp:     { icon: 'quality',     label: 'GMP Certified' },
    usa:     { icon: 'flag',        label: 'Made in USA' },
    gmofree: { icon: 'nogmo',       label: 'GMO Free' },
    natural: { icon: 'leaf',        label: 'All Natural' },
    fda:     { icon: 'shieldCheck', label: 'FDA Registered' },
    cruelty: { icon: 'paw',         label: 'Cruelty Free' },
    secure:  { icon: 'lock',        label: 'Secure Checkout' },
    refund:  { icon: 'refund',      label: 'Money-Back' },
    custom:  { icon: 'shieldCheck', label: '' },
  };

  OS.css('checkout-trust', [
    '.ck-tr{box-sizing:border-box}.ck-tr *{box-sizing:border-box}',
    '.ck-tr .ckt-h{font-weight:800;line-height:1.2;text-align:center;margin:0 0 14px}',
    '.ck-tr .ckt-grid{display:grid;justify-items:center;gap:16px 10px}',
    '.ck-tr .ckt-seal{display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0;width:100%}',
    '.ck-tr .ckt-badge{flex:none;border-radius:50%;display:grid;place-items:center;border:2px solid currentColor;background:#fff}',
    '.ck-tr .ckt-badge img{width:72%;height:72%;object-fit:contain;border-radius:50%}',
    '.ck-tr .ckt-lab{font-weight:800;line-height:1.2;margin-top:7px;letter-spacing:.01em}',
    '.ck-tr .ckt-sub{opacity:.62;line-height:1.3;margin-top:2px}',
    '.ck-tr.gray .ckt-badge{color:#8b9096 !important}.ck-tr.gray .ckt-lab{color:#6b7178 !important}',
    '.ck-tr .ckt-empty{padding:20px;text-align:center;opacity:.6;font-size:13px}',
  ].join(''));

  function sealHtml(b, sz, accent, labColor, labFs, subFs) {
    const s = b.settings || {};
    const p = PRESETS[s.preset] || PRESETS.gmp;
    const label = (s.label != null && s.label !== '') ? s.label : p.label;
    const inner = (s.preset === 'custom' && s.image)
      ? '<img src="' + OS.esc(s.image) + '" alt="' + OS.esc(label) + '">'
      : '<span style="width:' + Math.round(sz * 0.5) + 'px;height:' + Math.round(sz * 0.5) + 'px">' + (I[p.icon] || I.quality) + '</span>';
    return '<div class="ckt-seal" data-block-id="' + OS.esc(b.id) + '">' +
      '<span class="ckt-badge" style="width:' + sz + 'px;height:' + sz + 'px;color:' + accent + '">' + inner + '</span>' +
      (label ? '<span class="ckt-lab" style="color:' + labColor + ';font-size:' + labFs + 'px">' + OS.esc(label) + '</span>' : '') +
      (s.sub ? '<span class="ckt-sub" style="font-size:' + subFs + 'px">' + OS.esc(s.sub) + '</span>' : '') +
      '</div>';
  }

  OS.register('checkout-trust', {
    name: 'Trust & certifications', group: 'commerce', icon: 'lock',
    schema: [
      { key: 'heading', control: 'text', label: 'Heading', default: '', placeholder: 'Optional — e.g. Why people trust us' },
      { key: 'columns_desktop', control: 'range', label: 'Per row · Desktop', min: 2, max: 6, step: 1, default: 5 },
      { key: 'columns_mobile', control: 'range', label: 'Per row · Mobile', min: 2, max: 4, step: 1, default: 3 },
      { key: 'badge_size', control: 'range', label: 'Badge size', min: 40, max: 96, step: 2, unit: 'px', default: 64 },
      { key: 'grayscale', control: 'toggle', label: 'Monochrome', default: false, info: 'Tone the seals down to grey so they reassure without shouting.' },
      { sub: 'Colors' },
      { key: 'accent', control: 'color', label: 'Seal color', default: '', allowTransparent: true, info: 'Blank inherits the theme primary color.' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
    ],
    blocks: {
      name: 'Seal', kind: 'seal', max: 12,
      fields: [
        { key: 'preset', control: 'select', label: 'Seal', default: 'gmp', options: [
          { value: 'gmp', label: 'GMP Certified' }, { value: 'usa', label: 'Made in USA' },
          { value: 'gmofree', label: 'GMO Free' }, { value: 'natural', label: 'All Natural' },
          { value: 'fda', label: 'FDA Registered' }, { value: 'cruelty', label: 'Cruelty Free' },
          { value: 'secure', label: 'Secure Checkout' }, { value: 'refund', label: 'Money-Back' },
          { value: 'custom', label: 'Custom image' } ] },
        { key: 'image', control: 'image', label: 'Custom seal image', default: '', visibleWhen: (s) => s.preset === 'custom' },
        { key: 'label', control: 'text', label: 'Label', default: '', placeholder: 'Defaults to the seal name' },
        { key: 'sub', control: 'text', label: 'Sub-label', default: '' },
      ],
      defaults: () => ({ preset: 'gmp', label: '' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('seal'), kind: 'seal', hidden: false, settings: { preset: 'gmp', label: '' } },
      { id: OS.uid('seal'), kind: 'seal', hidden: false, settings: { preset: 'usa', label: '' } },
      { id: OS.uid('seal'), kind: 'seal', hidden: false, settings: { preset: 'gmofree', label: '' } },
      { id: OS.uid('seal'), kind: 'seal', hidden: false, settings: { preset: 'natural', label: '' } },
      { id: OS.uid('seal'), kind: 'seal', hidden: false, settings: { preset: 'fda', label: '' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const rail = ctx.rail;
      const padV = rail ? (mob ? 12 : 16) : OS.secSpace(t, mob);
      const padH = OS.ckPad(t, mob); // follows configurable page padding (symmetric with left column)
      const accent = OS.col(s.accent, c.primary_color || '#103635');
      const labColor = c.text_color || '#1a1a1a';
      const bg = OS.bgOrTransparent(s.background);
      const seals = (blocks || []).filter((b) => !b.hidden);

      // rail is narrow → shrink badges and cap the columns so they never crush
      let per = mob ? OS.clamp(s.columns_mobile, 2, 4, 3) : OS.clamp(s.columns_desktop, 2, 6, 5);
      let sz = OS.clamp(s.badge_size, 40, 96, 64);
      if (rail) { per = Math.min(per, mob ? 3 : 4); sz = Math.min(sz, 56); }
      const labFs = rail ? 10.5 : (mob ? 11 : 12);
      const subFs = rail ? 9.5 : 10.5;

      const head = s.heading
        ? '<div class="ckt-h" style="font-family:' + OS.headingFamily(t) + ';color:' + (c.heading_color || '#1a1a1a') + ';font-size:' + (rail ? 13 : OS.headingSize(t, mob ? 16 : 18)) + 'px">' + OS.esc(s.heading) + '</div>'
        : '';
      const body = seals.length
        ? '<div class="ckt-grid" style="grid-template-columns:repeat(' + per + ',minmax(0,1fr))">' +
            seals.map((b) => sealHtml(b, sz, accent, labColor, labFs, subFs)).join('') + '</div>'
        : '<div class="ckt-empty">Add a seal block to build your trust row.</div>';

      return '<div class="ck-tr' + (s.grayscale ? ' gray' : '') + '" style="background:' + bg + ';color:' + labColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="' + (rail ? '' : 'max-width:680px;') + 'margin:0 auto">' + head + body + '</div></div>';
    },
  });
})();
