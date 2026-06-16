/* Text with icon — row of icon + text trust badges. Homogeneous Item blocks (icon / heading / content, max 8).
   Two item layouts: icon-top (stacked, centered) / icon-left (icon beside text). Responsive grid. */
(function () {
  const OS = window.OS;

  // Inline line-icon set for the block icon picker (24x24, stroke currentColor). 'none' renders nothing.
  const SI = (inner) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  const ICONS = {
    none: '',
    box: SI('<path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 21.5V12"/>'),
    truck: SI('<path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>'),
    shield: SI('<path d="M12 3 5 6v5c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>'),
    lock: SI('<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    return: SI('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/>'),
    support: SI('<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><path d="M19 14a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z"/><path d="M5 14a2 2 0 0 0 2 2h1v-5H7a2 2 0 0 0-2 2z"/><path d="M12 19h2"/>'),
    gift: SI('<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M2 9h20M12 9v11"/><path d="M12 9C9 9 7 7.5 7 6a2 2 0 0 1 5-1c3 0 5 1.5 5 3 0 1-2 1-5 1z"/>'),
    star: SI('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    heart: SI('<path d="M12 20s-7-4.6-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-1.9 4.4-7 9-7 9z"/>'),
  };
  const glyph = (name) => ICONS[name] != null ? ICONS[name] : ICONS.box;

  OS.css('text-with-icon', [
    '.twix{box-sizing:border-box}.twix *{box-sizing:border-box}',
    '.twix h2{margin:0 0 22px;line-height:1.15}',
    '.twix .twi-grid{display:grid}',
    '.twix .twi-item{display:flex}',
    '.twix .twi-item.top{flex-direction:column;align-items:center;text-align:center}',
    '.twix .twi-item.left{flex-direction:row;align-items:flex-start;gap:14px;text-align:left}',
    '.twix .twi-ic{flex:none;display:inline-flex;align-items:center;justify-content:center}',
    '.twix .twi-ic svg{display:block;width:100%;height:100%}',
    '.twix .twi-item.top .twi-ic{margin-bottom:12px}',
    '.twix .twi-body{min-width:0}',
    '.twix .twi-h{font-weight:700;font-size:15px;line-height:1.3;margin:0 0 4px}',
    '.twix .twi-rich{font-size:13px;line-height:1.55;opacity:.8}.twix .twi-rich a{color:inherit}',
    '.twix .twi-empty{grid-column:1/-1;text-align:center;opacity:.5;font-size:13px;padding:20px}',
  ].join(''));

  OS.register('text-with-icon', {
    name: 'Text with icon', group: 'content', icon: 'layers',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'heading', control: 'text', label: 'Heading', default: '' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'desktop_grid', control: 'range', label: 'Desktop columns', min: 1, max: 6, step: 1, default: 4 },
      { key: 'mobile_grid', control: 'range', label: 'Mobile columns', min: 1, max: 3, step: 1, default: 2 },
      { key: 'item_layout', control: 'segmented', label: 'Item layout', default: 'icon-top', options: [{ value: 'icon-top', label: 'Icon top' }, { value: 'icon-left', label: 'Icon left' }] },
      { key: 'gap', control: 'range', label: 'Gap', min: 8, max: 48, step: 1, unit: 'px', default: 24 },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
      { key: 'icon_color', control: 'color', label: 'Icon', default: '', allowTransparent: true, info: 'Blank inherits the theme primary color.' },
    ],
    blocks: {
      name: 'Item', kind: 'item', max: 8,
      fields: [
        { key: 'icon', control: 'select', label: 'Icon', default: 'box', options: [
          { value: 'none', label: 'None' }, { value: 'box', label: 'Box' }, { value: 'truck', label: 'Truck' }, { value: 'shield', label: 'Shield' },
          { value: 'lock', label: 'Lock' }, { value: 'return', label: 'Return' }, { value: 'support', label: 'Support' }, { value: 'gift', label: 'Gift' },
          { value: 'star', label: 'Star' }, { value: 'heart', label: 'Heart' },
        ] },
        { key: 'heading', control: 'text', label: 'Heading', default: '' },
        { key: 'content', control: 'richtext', label: 'Content', default: '' },
      ],
      defaults: () => ({ icon: 'box', heading: 'Benefit', content: 'Short supporting line.' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('twi'), kind: 'item', hidden: false, settings: { icon: 'truck', heading: 'Free shipping', content: 'On orders over $50' } },
      { id: OS.uid('twi'), kind: 'item', hidden: false, settings: { icon: 'support', heading: '24/7 support', content: 'We are here to help' } },
      { id: OS.uid('twi'), kind: 'item', hidden: false, settings: { icon: 'shield', heading: '30-day guarantee', content: 'No-questions returns' } },
      { id: OS.uid('twi'), kind: 'item', hidden: false, settings: { icon: 'lock', heading: 'Secure payments', content: 'SSL encrypted checkout' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const head = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const icColor = OS.col(s.icon_color, (t.colors && t.colors.primary_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const cols = mob ? OS.clamp(s.mobile_grid, 1, 3, 2) : OS.clamp(s.desktop_grid, 1, 6, 4);
      const gap = OS.clamp(s.gap, 8, 48, 24);
      const layout = s.item_layout === 'icon-left' ? 'left' : 'top';
      const icSize = mob ? 28 : 30;
      const items = (blocks || []).filter((b) => !b.hidden);

      const cards = items.map((b0) => {
        const b = b0.settings;
        const ic = b.icon && b.icon !== 'none'
          ? '<span class="twi-ic" style="width:' + icSize + 'px;height:' + icSize + 'px;color:' + icColor + '">' + glyph(b.icon) + '</span>'
          : '';
        const body = '<div class="twi-body">' +
          (b.heading ? '<div class="twi-h" style="font-family:' + OS.headingFamily(t) + '">' + OS.esc(b.heading) + '</div>' : '') +
          (b.content ? '<div class="twi-rich">' + b.content + '</div>' : '') + '</div>';
        return '<div class="twi-item ' + layout + '" data-block-id="' + OS.esc(b0.id) + '">' + ic + body + '</div>';
      }).join('');

      const heading = s.heading
        ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 30) + 'px;color:' + head + ';text-align:' + (mob ? 'center' : s.heading_alignment) + '">' + OS.esc(s.heading) + '</h2>'
        : '';

      return '<div class="twix" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + heading +
        '<div class="twi-grid" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:' + gap + 'px">' +
        (items.length ? cards : '<div class="twi-empty">Add an item to get started.</div>') +
        '</div></div></div>';
    },
  });
})();
