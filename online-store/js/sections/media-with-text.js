/* Media with text — image/video beside copy, blocks auto-alternate. Ported from media-with-text.canvas.tsx.
   Homogeneous Image blocks (max 10). Buttons map to global Button tokens for primary style. */
(function () {
  const OS = window.OS;
  OS.css('media-with-text', [
    '.mwtx{box-sizing:border-box}.mwtx *{box-sizing:border-box}',
    '.mwtx .mwt-shead{text-align:center;margin-bottom:8px}',
    '.mwtx .mwt-ssub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;text-align:center;margin-bottom:6px}',
    '.mwtx h2{margin:0;line-height:1.12}',
    '.mwtx .mwt-row{display:grid;align-items:center}',
    '.mwtx .mwt-media{background-size:cover;background-position:center;aspect-ratio:4/3}',
    '.mwtx .mwt-num{font-size:13px;font-weight:700;opacity:.4;margin-bottom:8px}',
    '.mwtx .mwt-bh{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:8px}',
    '.mwtx .mwt-bhead{margin:0 0 12px;line-height:1.15}',
    '.mwtx .mwt-rich{font-size:15px;line-height:1.65;opacity:.9}.mwtx .mwt-rich a{color:inherit}',
    '.mwtx .mwt-btn{display:inline-flex;align-items:center;gap:6px;text-decoration:none;margin-top:16px;cursor:pointer}',
    '.mwtx.mob .mwt-row{grid-template-columns:1fr!important;gap:18px!important}',
  ].join(''));

  const SP = { none: 0, small: 40, medium: 72, large: 110 };

  OS.register('media-with-text', {
    name: 'Media with text', group: 'content', icon: 'image',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'section_subheading', control: 'text', label: 'Section subheading', default: '' },
      { key: 'section_heading', control: 'text', label: 'Section heading', default: '' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
      { key: 'spacing', control: 'select', label: 'Spacing between blocks', default: 'small', options: [{ value: 'none', label: 'None' }, { value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }] },
      { key: 'show_block_numbers', control: 'toggle', label: 'Show block numbers', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true, info: 'Blank inherits the theme body text color.' },
    ],
    blocks: {
      name: 'Image', kind: 'image', max: 10,
      fields: [
        { key: 'image', control: 'image', label: 'Image', default: '' },
        { key: 'image_width', control: 'range', label: 'Image width', min: 30, max: 60, step: 1, unit: '%', default: 50 },
        { key: 'image_position', control: 'segmented', label: 'Image position', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
        { sub: 'Text' },
        { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
        { key: 'heading', control: 'text', label: 'Heading', default: '' },
        { key: 'content', control: 'richtext', label: 'Content', default: '' },
        { key: 'button_text', control: 'text', label: 'Button text', default: '' },
        { key: 'button_url', control: 'url', label: 'Button URL', default: '' },
        { key: 'button_style', control: 'select', label: 'Button style', default: 'text', options: [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'text', label: 'Text link' }, { value: 'underline', label: 'Underline link' }] },
      ],
      defaults: () => ({ image: OS.sample.IMG.iwt, image_width: 50, image_position: 'left', heading: 'A heading for this block', content: 'Add a paragraph of supporting copy to describe this feature or product story.', button_text: 'Learn more', button_url: '#', button_style: 'text' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('mwt'), kind: 'image', hidden: false, settings: { image: OS.sample.IMG.iwt, image_width: 50, image_position: 'left', subheading: 'The science of comfort', heading: 'Engineered for your body', content: 'Our linen-feel fabric is breathable, lightweight and designed to move with you all day long.', button_text: 'Explore the technology', button_url: '#', button_style: 'text' } },
      { id: OS.uid('mwt'), kind: 'image', hidden: false, settings: { image: OS.sample.IMG.cat3, image_width: 50, image_position: 'right', subheading: 'Made to last', heading: 'Considered, not disposable', content: 'Every piece is built from durable materials and finished by hand, so it stays with you season after season.', button_text: 'Our story', button_url: '#', button_style: 'underline' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const gap = SP[s.spacing] != null ? SP[s.spacing] : 40;
      const rad = OS.layoutRadius(t, 'image');
      const list = (blocks || []).filter((b) => !b.hidden);
      const heading = s.section_heading
        ? '<div class="mwt-shead" style="text-align:' + (mob ? 'center' : s.heading_alignment) + '">' +
          (s.section_subheading ? '<div class="mwt-ssub" style="text-align:inherit">' + OS.esc(s.section_subheading) + '</div>' : '') +
          '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px">' + OS.esc(s.section_heading) + '</h2></div>'
        : '';
      const btnHtml = (b) => {
        if (!b.button_text) return '';
        const url = OS.esc(b.button_url || '#');
        if (b.button_style === 'primary') return '<a class="mwt-btn" href="' + url + '" style="' + OS.btnStyle(t) + '">' + OS.esc(b.button_text) + '</a>';
        if (b.button_style === 'secondary') return '<a class="mwt-btn" href="' + url + '" style="' + OS.btnStyle(t, { variant: 'secondary' }) + '">' + OS.esc(b.button_text) + '</a>';
        const dec = b.button_style === 'underline' ? 'underline' : 'none';
        return '<a class="mwt-btn" href="' + url + '" style="color:' + ((t.colors && t.colors.link_color) || text) + ';font-weight:600;text-decoration:' + dec + '">' + OS.esc(b.button_text) + ' →</a>';
      };
      const rows = list.map((b0, i) => {
        const b = b0.settings; const iw = OS.clamp(b.image_width, 30, 60, 50);
        const media = '<div class="mwt-media" style="background-image:url(' + OS.esc(b.image || OS.sample.IMG.iwt) + ');border-radius:' + rad + 'px"></div>';
        const txt = '<div>' + (s.show_block_numbers ? '<div class="mwt-num">' + String(i + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0') + '</div>' : '') +
          (b.subheading ? '<div class="mwt-bh">' + OS.esc(b.subheading) + '</div>' : '') +
          (b.heading ? '<h3 class="mwt-bhead" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 22 : 28) + 'px">' + OS.esc(b.heading) + '</h3>' : '') +
          (b.content ? '<div class="mwt-rich">' + b.content + '</div>' : '') + btnHtml(b) + '</div>';
        const cols = b.image_position === 'right' ? ('1fr ' + iw + '%') : (iw + '% 1fr');
        const inner = b.image_position === 'right' ? txt + media : media + txt;
        return '<div class="mwt-row" data-block-id="' + OS.esc(b0.id) + '" style="grid-template-columns:' + cols + ';gap:' + OS.clamp(64, 24, 80, 64) + 'px;margin-bottom:' + gap + 'px">' + inner + '</div>';
      }).join('');
      return '<div class="mwtx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + heading + (list.length ? rows : '<div style="text-align:center;opacity:.5;font-size:13px;padding:24px">Add an image block.</div>') + '</div></div>';
    },
  });
})();
