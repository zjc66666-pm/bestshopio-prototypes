/* Video feed — shoppable short-video carousel. Homogeneous Video item blocks (max 20).
   No real playback: renders the cover image + a play overlay. Three card styles (simple/social/product).
   Carousel uses a horizontal scroll-snap rail; item width = container / videos-per-view. */
(function () {
  const OS = window.OS;
  OS.css('video-feed', [
    '.vfx{box-sizing:border-box}.vfx *{box-sizing:border-box}',
    '.vfx .vf-head{margin-bottom:18px}',
    '.vfx .vf-sub{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin-bottom:6px}',
    '.vfx h2{margin:0 0 8px;line-height:1.12}',
    '.vfx .vf-desc{font-size:14px;line-height:1.6;opacity:.8;max-width:640px}',
    '.vfx .vf-head.c{text-align:center}.vfx .vf-head.c .vf-desc{margin-left:auto;margin-right:auto}',
    '.vfx .vf-rail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:4px}',
    '.vfx .vf-rail::-webkit-scrollbar{display:none}',
    '.vfx .vf-grid{display:grid}',
    '.vfx .vf-card{min-width:0;scroll-snap-align:start;flex:none;display:flex;flex-direction:column}',
    '.vfx .vf-media{position:relative;width:100%;overflow:hidden;background:#ddd}',
    '.vfx .vf-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}',
    '.vfx .vf-grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.6) 100%)}',
    '.vfx .vf-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.92);color:#111;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.25)}',
    '.vfx .vf-play svg{width:24px;height:24px;margin-left:3px}',
    '.vfx .vf-tag{position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 7px;border-radius:6px;background:rgba(0,0,0,.55);color:#fff;backdrop-filter:blur(2px)}',
    '.vfx .vf-over{position:absolute;left:12px;right:12px;bottom:12px;color:#fff;z-index:2}',
    '.vfx .vf-user{font-size:13px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;gap:6px}',
    '.vfx .vf-cap{font-size:12px;line-height:1.4;margin-top:3px;opacity:.95;text-shadow:0 1px 4px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.vfx .vf-foot{padding:10px 2px 0}',
    '.vfx .vf-foot .vf-fuser{font-size:13px;font-weight:600}.vfx .vf-foot .vf-fcap{font-size:12px;opacity:.7;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.vfx .vf-prod{display:flex;align-items:center;gap:9px;margin-top:10px;padding:8px;border:1px solid rgba(0,0,0,.08);border-radius:10px}',
    '.vfx .vf-prod-img{width:40px;height:40px;border-radius:7px;background-size:cover;background-position:center;flex:none}',
    '.vfx .vf-prod-info{min-width:0}',
    '.vfx .vf-prod-t{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.vfx .vf-prod-p{font-size:12px;margin-top:1px}',
    '.vfx .vf-empty{opacity:.5;font-size:13px;padding:24px;text-align:center}',
  ].join(''));

  const ASPECT = { '9/16': 9 / 16, '4/5': 4 / 5, '1/1': 1, '16/9': 16 / 9 };
  const PLAT = {
    tiktok: { label: 'TikTok', color: '#000' },
    instagram: { label: 'Instagram', color: '#C13584' },
    youtube: { label: 'YouTube', color: '#FF0000' },
  };

  OS.register('video-feed', {
    name: 'Video feed', group: 'content', icon: 'play',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
      { key: 'heading', control: 'text', label: 'Heading', default: 'Shop the feed' },
      { key: 'description', control: 'richtext', label: 'Description', default: '' },
      { key: 'heading_alignment', control: 'segmented', label: 'Heading alignment', default: 'center', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }] },
      { key: 'layout_style', control: 'select', label: 'Layout', default: 'carousel', options: [{ value: 'carousel', label: 'Carousel' }, { value: 'grid', label: 'Grid' }] },
      { key: 'video_card_style', control: 'select', label: 'Video card style', default: 'social', options: [{ value: 'simple', label: 'Simple' }, { value: 'social', label: 'Social' }, { value: 'product', label: 'Product' }] },
      { key: 'desktop_videos', control: 'range', label: 'Videos per row · Desktop', min: 1, max: 6, step: 1, default: 5 },
      { key: 'mobile_videos', control: 'range', label: 'Videos per row · Mobile', min: 1, max: 2, step: 1, default: 1 },
      { key: 'gap', control: 'range', label: 'Gap', min: 8, max: 40, step: 1, unit: 'px', default: 20 },
      { key: 'video_aspect_ratio', control: 'select', label: 'Video aspect ratio', default: '9/16', options: [{ value: '9/16', label: '9:16 (vertical)' }, { value: '4/5', label: '4:5' }, { value: '1/1', label: '1:1' }, { value: '16/9', label: '16:9' }] },
      { key: 'border_radius', control: 'range', label: 'Corner radius', min: 0, max: 24, step: 1, unit: 'px', default: 12 },
      { key: 'show_play_button', control: 'toggle', label: 'Show play button', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'card_background', control: 'color', label: 'Card background', default: '#F5F5F5', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
    ],
    blocks: {
      name: 'Video item', kind: 'item', max: 20,
      fields: [
        { key: 'cover_image', control: 'image', label: 'Cover image', default: '', required: true },
        { key: 'username', control: 'text', label: 'Username', default: '' },
        { key: 'title', control: 'text', label: 'Title', default: '' },
        { key: 'platform', control: 'select', label: 'Platform', default: 'none', options: [{ value: 'none', label: 'None' }, { value: 'tiktok', label: 'TikTok' }, { value: 'instagram', label: 'Instagram' }, { value: 'youtube', label: 'YouTube' }] },
        { key: 'associated_product', control: 'product', label: 'Associated product', default: '' },
      ],
      defaults: () => ({ cover_image: OS.sample.IMG.cat1, username: '@creator', title: 'Watch the look' }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('vid'), kind: 'item', hidden: false, settings: { cover_image: OS.sample.IMG.cat1, username: '@aria.style', title: 'Styling the linen set 3 ways', platform: 'tiktok', associated_product: 'p1' } },
      { id: OS.uid('vid'), kind: 'item', hidden: false, settings: { cover_image: OS.sample.IMG.cat2, username: '@maya.fit', title: 'My everyday capsule haul', platform: 'instagram', associated_product: 'p2' } },
      { id: OS.uid('vid'), kind: 'item', hidden: false, settings: { cover_image: OS.sample.IMG.cat3, username: '@theo', title: 'Unboxing the new drop', platform: 'youtube', associated_product: 'p3' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const text = OS.col(s.text, (t.colors && t.colors.text_color) || '#1a1a1a');
      const headColor = OS.col(s.text, (t.colors && t.colors.heading_color) || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background), cardBg = OS.bgOrTransparent(s.card_background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const gap = OS.clamp(s.gap, 8, 40, 20);
      const rad = OS.clamp(s.border_radius, 0, 24, 12);
      const style = s.video_card_style || 'social';
      const ratio = ASPECT[s.video_aspect_ratio] ? s.video_aspect_ratio : '9/16';
      const isGrid = s.layout_style === 'grid';
      const perView = mob ? OS.clamp(s.mobile_videos, 1, 2, 1) : OS.clamp(s.desktop_videos, 1, 6, 5);
      const align = mob ? 'left' : (s.heading_alignment || 'center');
      const muted = (t.colors && t.colors.secondary_color) || '#777';
      const saleColor = (t.colors && t.colors.sale_price_color) || '#d92d20';
      const items = (blocks || []).filter((b) => !b.hidden && b.settings.cover_image);

      const head = '<div class="vf-head' + (align === 'center' ? ' c' : '') + '">' +
        (s.subheading ? '<div class="vf-sub">' + OS.esc(s.subheading) + '</div>' : '') +
        (s.heading ? '<h2 style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? 24 : 32) + 'px;color:' + headColor + '">' + OS.esc(s.heading) + '</h2>' : '') +
        (s.description ? '<div class="vf-desc">' + s.description + '</div>' : '') + '</div>';

      if (!items.length) {
        return '<div class="vfx" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
          '<div style="max-width:' + maxW + ';margin:0 auto">' + head +
          '<div class="vf-empty">Add a Video item from the structure tree.</div></div></div>';
      }

      const itemW = isGrid ? 'auto' : 'calc((100% - ' + gap + 'px * ' + (perView - 1) + ') / ' + perView + ')';

      const cards = items.map((b0) => {
        const b = b0.settings;
        const plat = b.platform && PLAT[b.platform] ? PLAT[b.platform] : null;
        const prod = b.associated_product ? OS.sample.products.find((p) => p.id === b.associated_product) : null;
        const playBtn = s.show_play_button ? '<div class="vf-play">' + OS.icon('play') + '</div>' : '';
        const platTag = (style !== 'product' && plat) ? '<span class="vf-tag" style="background:' + plat.color + '">' + OS.esc(plat.label) + '</span>' : '';
        // social style: overlay username/title on the media; gradient for legibility
        const overlay = style === 'social'
          ? '<div class="vf-grad"></div><div class="vf-over">' +
              (b.username ? '<div class="vf-user">' + OS.esc(b.username) + (plat ? '<span style="font-weight:500;opacity:.85;font-size:11px">· ' + OS.esc(plat.label) + '</span>' : '') + '</div>' : '') +
              (b.title ? '<div class="vf-cap">' + OS.esc(b.title) + '</div>' : '') +
            '</div>'
          : '';
        const media = '<div class="vf-media" style="aspect-ratio:' + ratio + ';border-radius:' + rad + 'px">' +
          '<img src="' + OS.esc(b.cover_image) + '" alt="' + OS.esc(b.title || b.username || 'Video') + '" loading="lazy">' +
          overlay + platTag + playBtn + '</div>';
        // simple style: caption under the cover. product style: a product strip under the cover.
        let foot = '';
        if (style === 'simple') {
          foot = (b.username || b.title) ? '<div class="vf-foot">' +
            (b.username ? '<div class="vf-fuser">' + OS.esc(b.username) + '</div>' : '') +
            (b.title ? '<div class="vf-fcap">' + OS.esc(b.title) + '</div>' : '') + '</div>' : '';
        } else if (style === 'product') {
          foot = prod
            ? '<div class="vf-prod"><div class="vf-prod-img" style="background-image:url(' + OS.esc(prod.image) + ')"></div>' +
                '<div class="vf-prod-info"><div class="vf-prod-t">' + OS.esc(prod.title) + '</div>' +
                '<div class="vf-prod-p" style="color:' + saleColor + '">' + OS.money(prod.price) + '</div></div></div>'
            : (b.title ? '<div class="vf-foot"><div class="vf-fcap" style="color:' + muted + '">' + OS.esc(b.title) + '</div></div>' : '');
        }
        return '<div class="vf-card" data-block-id="' + OS.esc(b0.id) + '" style="background:' + cardBg + ';color:' + text + ';width:' + itemW + ';border-radius:' + rad + 'px;' +
          (isGrid ? '' : 'margin-right:' + gap + 'px;') + 'padding:' + (cardBg === 'transparent' ? '0' : '8px') + ';' +
          (style === 'product' && cardBg !== 'transparent' ? 'padding-bottom:8px;' : '') + '">' +
          media + foot + '</div>';
      }).join('');

      const container = isGrid
        ? '<div class="vf-grid" style="grid-template-columns:repeat(' + perView + ',1fr);gap:' + gap + 'px">' + cards + '</div>'
        : '<div class="vf-rail" style="gap:0">' + cards + '</div>';

      return '<div class="vfx" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto">' + head + container + '</div></div>';
    },
  });
})();
