/* As seen in — press / media logo strip (social proof). No product cards.
   Homogeneous Logo blocks (image or text wordmark, max 20). Two layouts: inline wrap / marquee scroll. */
(function () {
  const OS = window.OS;
  OS.css('as-seen-in', [
    '.asix{box-sizing:border-box}.asix *{box-sizing:border-box}',
    '.asix h2{margin:0 0 22px;line-height:1.15}',
    '.asix .asi-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px 44px}',
    '.asix .asi-logo{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:inherit;opacity:.6;filter:grayscale(1);transition:opacity .2s,filter .2s}',
    '.asix .asi-logo:hover{opacity:1;filter:grayscale(0)}',
    '.asix .asi-logo img{display:block;width:auto;object-fit:contain}',
    '.asix .asi-word{font-weight:700;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;line-height:1}',
    '.asix .asi-mq{overflow-x:auto;width:100%;scrollbar-width:none;-webkit-mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent)}',
    '.asix .asi-mq::-webkit-scrollbar{display:none}',
    '.asix .asi-track{display:inline-flex;align-items:center;gap:48px;white-space:nowrap;padding:0 8px;justify-content:center;min-width:100%}',
    '.asix .asi-empty{padding:24px;text-align:center;opacity:.6;font-size:13px}',
  ].join(''));

  function logoHtml(b, h) {
    const link = b.settings.link || '';
    const open = link ? '<a class="asi-logo" data-block-id="' + OS.esc(b.id) + '" href="' + OS.esc(link) + '">' : '<span class="asi-logo" data-block-id="' + OS.esc(b.id) + '">';
    const close = link ? '</a>' : '</span>';
    let inner;
    if (b.settings.logo_image) {
      inner = '<img src="' + OS.esc(b.settings.logo_image) + '" alt="' + OS.esc(b.settings.label || '') + '" style="height:' + h + 'px">';
    } else {
      // grayscale uppercase wordmark so a label alone still reads like a press logo
      inner = '<span class="asi-word" style="font-size:' + Math.round(h * 0.62) + 'px">' + OS.esc(b.settings.label || 'Brand') + '</span>';
    }
    return open + inner + close;
  }

  OS.register('as-seen-in', {
    name: 'As seen in', group: 'social', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'heading', control: 'text', label: 'Heading', default: 'As seen in' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'logo_layout', control: 'select', label: 'Logo layout', default: 'inline', options: [{ value: 'inline', label: 'Inline' }, { value: 'marquee', label: 'Marquee' }] },
      { key: 'logos_per_row_desktop', control: 'range', label: 'Logos per row · Desktop', min: 3, max: 10, step: 1, default: 6, visibleWhen: (s) => s.logo_layout !== 'marquee' },
      { key: 'logos_per_row_mobile', control: 'range', label: 'Logos per row · Mobile', min: 2, max: 5, step: 1, default: 3, visibleWhen: (s) => s.logo_layout !== 'marquee' },
      { key: 'logo_height', control: 'range', label: 'Logo height', min: 16, max: 80, step: 1, unit: 'px', default: 32 },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme heading color.' },
    ],
    blocks: {
      name: 'Logo', kind: 'logo', max: 20,
      fields: [
        { key: 'logo_image', control: 'image', label: 'Logo image', default: '', info: 'Blank shows the brand name as a wordmark.' },
        { key: 'label', control: 'text', label: 'Brand name', default: '', placeholder: 'Brand name' },
        { key: 'link', control: 'url', label: 'Link', default: '' },
      ],
      defaults: () => ({ label: 'Brand name' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('logo'), kind: 'logo', hidden: false, settings: { logo_image: '', label: 'VOGUE', link: '' } },
      { id: OS.uid('logo'), kind: 'logo', hidden: false, settings: { logo_image: '', label: 'Forbes', link: '' } },
      { id: OS.uid('logo'), kind: 'logo', hidden: false, settings: { logo_image: '', label: 'ELLE', link: '' } },
      { id: OS.uid('logo'), kind: 'logo', hidden: false, settings: { logo_image: '', label: 'GQ', link: '' } },
      { id: OS.uid('logo'), kind: 'logo', hidden: false, settings: { logo_image: '', label: 'Glamour', link: '' } },
      { id: OS.uid('logo'), kind: 'logo', hidden: false, settings: { logo_image: '', label: 'Refinery29', link: '' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bodyColor = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const align = s.heading_alignment === 'left' ? 'left' : 'center';
      const h = OS.clamp(s.logo_height, 16, 80, 32);
      const logos = (blocks || []).filter((b) => !b.hidden);

      const head = s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 22 : 28) + 'px;color:' + headColor + ';text-align:' + (mob ? 'center' : align) + '">' + OS.esc(s.heading) + '</h2>' : '';

      let body;
      if (!logos.length) {
        body = '<div class="asi-empty">Add a logo block to build your press strip.</div>';
      } else if (s.logo_layout === 'marquee') {
        // single-line strip; scrolls horizontally if it overflows (no infinite animation — keeps the page idle-able / screenshot-safe)
        const run = logos.map((b) => logoHtml(b, h)).join('');
        body = '<div class="asi-mq"><div class="asi-track">' + run + '</div></div>';
      } else {
        const per = mob ? OS.clamp(s.logos_per_row_mobile, 2, 5, 3) : OS.clamp(s.logos_per_row_desktop, 3, 10, 6);
        // size each logo to fit `per` across the row (flex-wrap keeps mobile from overflowing)
        const basis = 'calc(' + (100 / per).toFixed(4) + '% - 44px)';
        const items = logos.map((b) => '<div style="flex:0 1 ' + basis + ';display:flex;justify-content:center;min-width:0">' + logoHtml(b, h) + '</div>').join('');
        body = '<div class="asi-row" style="justify-content:' + (align === 'left' && !mob ? 'flex-start' : 'center') + '">' + items + '</div>';
      }

      return '<div class="asix" style="background:' + bg + ';color:' + bodyColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + body + '</div></div>';
    },
  });
})();
