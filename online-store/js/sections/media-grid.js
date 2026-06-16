/* Media grid — image/video cards with caption bars (lookbook / gallery tiles).
   Homogeneous Media item blocks (max 18). Video items show the cover image + a centered play button. */
(function () {
  const OS = window.OS;
  OS.css('media-grid', [
    '.mgx{box-sizing:border-box}.mgx *{box-sizing:border-box}',
    '.mgx .mg-head{margin-bottom:22px}',
    '.mgx .mg-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.mgx h2{margin:0;line-height:1.12}',
    '.mgx .mg-subh{font-size:15px;line-height:1.6;opacity:.75;margin-top:8px;max-width:640px}',
    '.mgx .mg-grid{display:grid}',
    '.mgx .mg-scroll{display:grid;grid-auto-flow:column;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
    '.mgx .mg-scroll::-webkit-scrollbar{display:none}',
    '.mgx .mg-scroll>*{scroll-snap-align:start}',
    '.mgx .mg-card{display:block;text-decoration:none;color:inherit;min-width:0}',
    '.mgx .mg-frame{position:relative;overflow:hidden}',
    '.mgx .mg-media{width:100%;height:100%;display:block;background-color:#ececec}',
    '.mgx a.mg-card .mg-img{transition:transform .4s ease}',
    '.mgx a.mg-card:hover .mg-img{transform:scale(1.04)}',
    '.mgx .mg-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}',
    '.mgx .mg-play span{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;color:#111;box-shadow:0 2px 10px rgba(0,0,0,.25)}',
    '.mgx .mg-play svg{width:22px;height:22px}',
    '.mgx .mg-bar{display:block;font-size:14px;font-weight:600;line-height:1.3;padding:13px 14px}',
    '.mgx .mg-ovl{position:absolute;left:0;right:0;bottom:0;padding:30px 16px 14px;color:#fff;font-size:15px;font-weight:600;line-height:1.3;background:linear-gradient(to top,rgba(0,0,0,.6),rgba(0,0,0,0));text-shadow:0 1px 6px rgba(0,0,0,.35)}',
    '.mgx .mg-below{display:block;font-size:14px;font-weight:600;line-height:1.3;margin-top:10px}',
    '.mgx .mg-empty{padding:28px;text-align:center;opacity:.6;font-size:13px;border:1px dashed rgba(0,0,0,.15);border-radius:12px}',
  ].join(''));

  const RATIO = { square: '1/1', portrait: '3/4', landscape: '4/3', wide: '16/9', original: 'auto' };

  OS.register('media-grid', {
    name: 'Media grid', group: 'content', icon: 'grid',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'heading', control: 'text', label: 'Heading', default: '' },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'desktop_columns', control: 'select', label: 'Columns · Desktop', default: '2', options: [{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
      { key: 'mobile_layout', control: 'select', label: 'Mobile layout', default: 'one-column', options: [{ value: 'one-column', label: 'One column' }, { value: 'two-columns', label: 'Two columns' }, { value: 'scroll', label: 'Scroll' }] },
      { key: 'gap', control: 'range', label: 'Gap', min: 12, max: 48, step: 1, unit: 'px', default: 32 },
      { key: 'media_ratio', control: 'select', label: 'Media ratio', default: 'landscape', options: [{ value: 'square', label: 'Square' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }, { value: 'wide', label: 'Wide' }, { value: 'original', label: 'Original' }] },
      { key: 'media_fit', control: 'select', label: 'Media fit', default: 'cover', options: [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }] },
      { key: 'card_radius', control: 'range', label: 'Card corner radius', min: 0, max: 24, step: 1, unit: 'px', default: 8 },
      { key: 'show_card_border', control: 'toggle', label: 'Show card border', default: true },
      { key: 'card_border_color', control: 'color', label: 'Card border color', default: '#F2D6DC', visibleWhen: (s) => s.show_card_border },
      { key: 'caption_position', control: 'select', label: 'Caption position', default: 'bottom-bar', options: [{ value: 'bottom-bar', label: 'Bottom bar' }, { value: 'overlay', label: 'Overlay' }, { value: 'below', label: 'Below image' }, { value: 'hidden', label: 'Hidden' }] },
      { key: 'caption_background', control: 'color', label: 'Caption background', default: '#F8D8DD', allowTransparent: true, visibleWhen: (s) => s.caption_position === 'bottom-bar' },
      { key: 'caption_text', control: 'color', label: 'Caption text', default: '#111111' },
      { key: 'caption_alignment', control: 'segmented', label: 'Caption alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
    ],
    blocks: {
      name: 'Media item', kind: 'item', max: 18,
      fields: [
        { key: 'media_type', control: 'select', label: 'Media type', default: 'image', options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }] },
        { key: 'image', control: 'image', label: 'Image', default: '', visibleWhen: (s) => s.media_type === 'image' },
        { key: 'video_cover', control: 'image', label: 'Video cover', default: '', visibleWhen: (s) => s.media_type === 'video' },
        { key: 'title', control: 'text', label: 'Title', default: '' },
        { key: 'link', control: 'url', label: 'Link', default: '' },
      ],
      defaults: () => ({ media_type: 'image', image: OS.sample.IMG.cat1, title: 'A caption' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('mg'), kind: 'item', hidden: false, settings: { media_type: 'image', image: OS.sample.IMG.cat1, title: 'Turmeric · Ginger', link: '' } },
      { id: OS.uid('mg'), kind: 'item', hidden: false, settings: { media_type: 'image', image: OS.sample.IMG.cat2, title: 'Matcha · Coffee', link: '' } },
      { id: OS.uid('mg'), kind: 'item', hidden: false, settings: { media_type: 'image', image: OS.sample.IMG.cat3, title: 'Citrus · Mint', link: '' } },
      { id: OS.uid('mg'), kind: 'item', hidden: false, settings: { media_type: 'image', image: OS.sample.IMG.cat4, title: 'Berry · Acai', link: '' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bodyColor = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const gap = OS.clamp(s.gap, 12, 48, 32);
      const radius = OS.clamp(s.card_radius, 0, 24, 8);
      const ratio = RATIO[s.media_ratio] || '4/3';
      const fit = s.media_fit === 'contain' ? 'contain' : 'cover';
      const capPos = s.caption_position || 'bottom-bar';
      const capAlign = s.caption_alignment || 'center';
      const align = s.heading_alignment === 'left' ? 'left' : 'center';
      const colsD = OS.clamp(Number(s.desktop_columns) || 2, 2, 4, 2);
      const border = s.show_card_border ? '1px solid ' + OS.col(s.card_border_color || '#F2D6DC', '#F2D6DC') : 'none';
      const items = (blocks || []).filter((b) => !b.hidden);

      const centered = mob || align === 'center';
      const head = (s.heading || s.subheading)
        ? '<div class="mg-head" style="text-align:' + (centered ? 'center' : 'left') + '">' +
          (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 26 : 34) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
          (s.subheading ? '<div class="mg-subh"' + (centered ? ' style="margin-left:auto;margin-right:auto"' : '') + '>' + OS.esc(s.subheading) + '</div>' : '') +
          '</div>'
        : '';

      if (!items.length) {
        return '<div class="mgx" style="background:' + bg + ';color:' + bodyColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
          '<div style="max-width:' + maxW + ';margin:0 auto">' + head +
          '<div class="mg-empty">Add a media item to show a card.</div></div></div>';
      }

      // Where the rounded corners + border live depends on whether the caption is part of the card unit.
      // bottom-bar / overlay: image + caption read as one rounded, optionally-bordered unit (radius+border on the card).
      // below / hidden: caption sits outside, so the rounded, optionally-bordered unit is just the image frame.
      const unitOnCard = capPos === 'bottom-bar' || capPos === 'overlay';
      const unitCss = (s.show_card_border ? 'border:' + border + ';' : '') + 'border-radius:' + radius + 'px;overflow:hidden';

      const card = (b0) => {
        const b = b0.settings;
        const isVideo = b.media_type === 'video';
        const src = isVideo ? (b.video_cover || OS.sample.IMG.cat1) : (b.image || OS.sample.IMG.cat1);
        const title = b.title || '';
        const tag = b.link ? 'a' : 'div';
        const href = b.link ? ' href="' + OS.esc(b.link) + '"' : '';
        const frame =
          '<div class="mg-frame" style="aspect-ratio:' + ratio + (unitOnCard ? '' : ';' + unitCss) + '">' +
            '<div class="mg-media mg-img" style="height:100%;background-image:url(' + OS.esc(src) + ');background-size:' + fit + ';background-position:center;background-repeat:no-repeat"></div>' +
            (isVideo ? '<div class="mg-play"><span>' + OS.icon('play') + '</span></div>' : '') +
            (capPos === 'overlay' && title ? '<div class="mg-ovl" style="text-align:' + capAlign + '">' + OS.esc(title) + '</div>' : '') +
          '</div>';
        let caption = '';
        if (title && capPos === 'bottom-bar') {
          caption = '<div class="mg-bar" style="background:' + OS.bgOrTransparent(s.caption_background || '#F8D8DD') + ';color:' + OS.col(s.caption_text, '#111111') + ';text-align:' + capAlign + '">' + OS.esc(title) + '</div>';
        } else if (title && capPos === 'below') {
          caption = '<div class="mg-below" style="color:' + OS.col(s.caption_text, bodyColor) + ';text-align:' + capAlign + '">' + OS.esc(title) + '</div>';
        }
        return '<' + tag + ' class="mg-card" data-block-id="' + OS.esc(b0.id) + '"' + href + ' style="' + (unitOnCard ? unitCss : '') + '">' + frame + caption + '</' + tag + '>';
      };

      const cells = items.map(card).join('');
      const scroll = mob && s.mobile_layout === 'scroll';
      let grid;
      if (scroll) {
        const basis = 'minmax(' + Math.round(100 / 1.25) + '%,1fr)';
        grid = '<div class="mg-scroll" style="grid-auto-columns:' + basis + ';gap:' + gap + 'px;padding-bottom:4px">' + cells + '</div>';
      } else {
        const colsM = mob ? (s.mobile_layout === 'two-columns' ? 2 : 1) : colsD;
        grid = '<div class="mg-grid" style="grid-template-columns:repeat(' + colsM + ',minmax(0,1fr));gap:' + gap + 'px">' + cells + '</div>';
      }

      return '<div class="mgx" style="background:' + bg + ';color:' + bodyColor + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + grid + '</div></div>';
    },
  });
})();
