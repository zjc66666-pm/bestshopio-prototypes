/* Feature cards — icon + title + text benefit cards. Homogeneous Feature card blocks (icon / heading / content / link, max 18).
   Grid (2/3/4 desktop cols, 1 col mobile) or horizontal carousel. */
(function () {
  const OS = window.OS;

  // Inline line-icon set for the block icon picker (24x24, stroke currentColor). 'none' renders nothing.
  const SI = (inner) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  const ICONS = {
    none: '',
    moon: SI('<path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/>'),
    fire: SI('<path d="M12 3c.5 3-2 4-2 7a2 2 0 0 0 4 0c0-.7-.2-1.2-.2-1.6 1.7 1 2.7 2.8 2.7 4.6a4.5 4.5 0 0 1-9 0C7.5 11 10 8 12 3z"/>'),
    leaf: SI('<path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14a6 6 0 0 1-1-1z"/><path d="M5 19c2-4 5-7 9-9"/>'),
    heart: SI('<path d="M12 20s-7-4.6-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-1.9 4.4-7 9-7 9z"/>'),
    drop: SI('<path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10z"/>'),
    flask: SI('<path d="M9 3h6M10 3v6l-4.5 8A2 2 0 0 0 7.3 20h9.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M8 14h8"/>'),
    star: SI('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  };
  const glyph = (name) => ICONS[name] != null ? ICONS[name] : ICONS.leaf;

  OS.css('feature-cards', [
    '.fcx{box-sizing:border-box}.fcx *{box-sizing:border-box}',
    '.fcx .fc-head{margin-bottom:26px}',
    '.fcx .fc-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.fcx h2{margin:0;line-height:1.14}',
    '.fcx .fc-grid{display:grid}',
    '.fcx .fc-rail{display:grid;grid-auto-flow:column;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:6px}',
    '.fcx .fc-rail>.fc-card{scroll-snap-align:start}',
    '.fcx .fc-card{display:flex;flex-direction:column;padding:26px 22px;min-width:0}',
    '.fcx .fc-card.center{align-items:center;text-align:center}',
    '.fcx .fc-card.left{align-items:flex-start;text-align:left}',
    '.fcx .fc-ic{flex:none;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px}',
    '.fcx .fc-ic svg{display:block;width:100%;height:100%}',
    '.fcx .fc-h{font-weight:700;font-size:17px;line-height:1.3;margin:0 0 8px}',
    '.fcx .fc-rich{font-size:14px;line-height:1.6;opacity:.9}.fcx .fc-rich a{color:inherit}',
    '.fcx .fc-link{display:inline-flex;align-items:center;gap:5px;margin-top:14px;font-size:13px;font-weight:600;text-decoration:none}',
    '.fcx .fc-empty{grid-column:1/-1;text-align:center;opacity:.5;font-size:13px;padding:24px}',
  ].join(''));

  OS.register('feature-cards', {
    name: 'Feature cards', group: 'content', icon: 'grid',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Why you’ll love it' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'layout_style', control: 'select', label: 'Layout style', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }] },
      { key: 'desktop_columns', control: 'select', label: 'Desktop columns', default: '3', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
      { key: 'gap', control: 'range', label: 'Gap', min: 12, max: 48, step: 1, unit: 'px', default: 32 },
      { key: 'text_alignment', control: 'segmented', label: 'Text alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { sub: 'Card' },
      { key: 'card_background', control: 'color', label: 'Card background', default: '#FFF7FA', allowTransparent: true },
      { key: 'show_card_border', control: 'toggle', label: 'Show card border', default: true },
      { key: 'card_border_color', control: 'color', label: 'Card border', default: '#F0DEE6', visibleWhen: (s) => s.show_card_border },
      { key: 'card_radius', control: 'range', label: 'Card radius', min: 0, max: 28, step: 1, unit: 'px', default: 14 },
      { key: 'icon_size', control: 'range', label: 'Icon size', min: 28, max: 72, step: 1, unit: 'px', default: 52 },
      { key: 'icon_color', control: 'color', label: 'Icon', default: '', allowTransparent: true, info: 'Blank inherits the theme primary color.' },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'heading_color', control: 'color', label: 'Heading', default: '', allowTransparent: true },
      { key: 'content_color', control: 'color', label: 'Content', default: '', allowTransparent: true },
    ],
    blocks: {
      name: 'Feature card', kind: 'card', max: 18,
      fields: [
        { key: 'icon', control: 'select', label: 'Icon', default: 'leaf', options: [
          { value: 'none', label: 'None' }, { value: 'moon', label: 'Moon' }, { value: 'fire', label: 'Fire' }, { value: 'leaf', label: 'Leaf' },
          { value: 'heart', label: 'Heart' }, { value: 'drop', label: 'Drop' }, { value: 'flask', label: 'Flask' }, { value: 'star', label: 'Star' },
        ] },
        { key: 'heading', control: 'text', label: 'Heading', default: '' },
        { key: 'content', control: 'richtext', label: 'Content', default: '' },
        { key: 'link', control: 'url', label: 'Link', default: '' },
      ],
      defaults: () => ({ icon: 'leaf', heading: 'A key benefit', content: 'A sentence describing this benefit.' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('fc'), kind: 'card', hidden: false, settings: { icon: 'drop', heading: 'Deeply hydrating', content: 'Locks in moisture for 24h', link: '' } },
      { id: OS.uid('fc'), kind: 'card', hidden: false, settings: { icon: 'leaf', heading: 'Clean ingredients', content: 'Vegan and cruelty-free', link: '' } },
      { id: OS.uid('fc'), kind: 'card', hidden: false, settings: { icon: 'heart', heading: 'Dermatologist loved', content: 'Gentle on sensitive skin', link: '' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const bg = OS.bgOrTransparent(s.background);
      const cardBg = OS.bgOrTransparent(s.card_background);
      const headColor = OS.col(s.heading_color, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const contentColor = OS.col(s.content_color, (t.colors && t.colors.text_color) || '#1a1a1a');
      const icColor = OS.col(s.icon_color, (t.colors && t.colors.primary_color) || '#1a1a1a');
      const linkColor = (t.colors && t.colors.link_color) || icColor;
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const gap = OS.clamp(s.gap, 12, 48, 32);
      const rad = OS.clamp(s.card_radius, 0, 28, 14);
      const icSize = OS.clamp(s.icon_size, 28, 72, 52);
      const dcols = OS.clamp(parseInt(s.desktop_columns, 10), 2, 4, 3);
      const align = s.text_alignment === 'left' ? 'left' : 'center';
      const carousel = s.layout_style === 'carousel';
      const border = s.show_card_border ? '1px solid ' + (s.card_border_color || '#f0dee6') : '0';
      const items = (blocks || []).filter((b) => !b.hidden);

      const cards = items.map((b0) => {
        const b = b0.settings;
        const ic = b.icon && b.icon !== 'none'
          ? '<span class="fc-ic" style="width:' + icSize + 'px;height:' + icSize + 'px;color:' + icColor + '">' + glyph(b.icon) + '</span>'
          : '';
        const link = b.link
          ? '<a class="fc-link" href="' + OS.esc(b.link) + '" style="color:' + linkColor + '">Learn more →</a>'
          : '';
        return '<div class="fc-card ' + align + '" data-block-id="' + OS.esc(b0.id) + '" style="background:' + cardBg + ';border:' + border + ';border-radius:' + rad + 'px">' +
          ic +
          (b.heading ? '<h3 class="fc-h" style="font-family:' + OS.headingFamily(t) + ';color:' + headColor + '">' + OS.esc(b.heading) + '</h3>' : '') +
          (b.content ? '<div class="fc-rich" style="color:' + contentColor + '">' + b.content + '</div>' : '') +
          link +
          '</div>';
      }).join('');

      const head = (s.subheading || s.heading)
        ? '<div class="fc-head" style="text-align:' + (mob ? 'center' : s.heading_alignment) + '">' +
          (s.subheading ? '<div class="fc-sub">' + OS.esc(s.subheading) + '</div>' : '') +
          (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
          '</div>'
        : '';

      const cols = mob ? 1 : dcols;
      let wrap;
      if (carousel && !mob) {
        // Fixed-basis track so cards keep a sensible width and overflow scrolls horizontally.
        const basis = Math.round(100 / dcols) + '%';
        wrap = '<div class="fc-rail" style="grid-auto-columns:minmax(220px,' + basis + ');gap:' + gap + 'px">' + cards + '</div>';
      } else {
        wrap = '<div class="fc-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:' + gap + 'px">' + cards + '</div>';
      }

      return '<div class="fcx" style="background:' + bg + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head +
        (items.length ? wrap : '<div class="fc-empty">Add a feature card.</div>') +
        '</div></div>';
    },
  });
})();
