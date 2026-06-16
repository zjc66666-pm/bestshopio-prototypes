/* Slideshow — full-width hero carousel. Ported from the editor's SlideshowLive + slideshow spec.
   Homogeneous Image blocks (max 5). Hero CTA uses the global Button tokens (cascade demo). */
(function () {
  const OS = window.OS;
  OS.css('slideshow', [
    '.ssx{position:relative;overflow:hidden}.ssx *{box-sizing:border-box}',
    '.ssx .ss-slide{position:relative;background-size:cover;background-position:center;display:flex}',
    '.ssx .ss-overlay{position:absolute;inset:0}',
    '.ssx .ss-inner{position:relative;z-index:2;width:100%;display:flex;padding:48px 68px}',
    '.ssx .ss-content{max-width:560px}',
    '.ssx .ss-eyebrow{font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}',
    '.ssx .ss-head{line-height:1.05;margin:0 0 18px;text-shadow:0 2px 12px rgba(0,0,0,.25)}',
    '.ssx .ss-cta{text-decoration:none}',
    '.ssx .ss-dots{position:absolute;bottom:18px;left:0;right:0;z-index:3;display:flex;justify-content:center;gap:8px}',
    '.ssx .ss-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.55);cursor:pointer;border:0}',
    '.ssx .ss-dot.on{background:#fff;width:22px;border-radius:5px}',
    '.ssx .ss-arr{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.85);color:#111;font-size:18px;cursor:pointer;display:grid;place-items:center}',
    '.ssx .ss-arr.l{left:16px}.ssx .ss-arr.r{right:16px}',
    '.ssx.mob .ss-inner{padding:24px}.ssx.mob .ss-arr{display:none}',
  ].join(''));

  const HEIGHT = { small: 320, original: 440, medium: 480, large: 600, full: 680 };
  const HSIZE = { xxl: 56, xl: 46, large: 38, medium: 30, small: 24 };
  const POS = { 'top-left': ['flex-start', 'flex-start', 'left'], 'top-center': ['flex-start', 'center', 'center'], 'middle-center': ['center', 'center', 'center'], 'middle-left': ['center', 'flex-start', 'left'], 'bottom-left': ['flex-end', 'flex-start', 'left'], 'bottom-center': ['flex-end', 'center', 'center'] };

  OS.register('slideshow', {
    name: 'Slideshow', group: 'hero', icon: 'image',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: true },
      { key: 'media_size', control: 'select', label: 'Media size', default: 'medium', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'full', label: 'Full screen height' }] },
      { key: 'controls', control: 'select', label: 'Controls', default: 'dots', options: [{ value: 'dots', label: 'Dots' }, { value: 'number', label: 'Number' }, { value: 'none', label: 'None' }] },
      { key: 'auto_rotate', control: 'toggle', label: 'Auto rotate between slides', default: false },
      { key: 'change_seconds', control: 'range', label: 'Change slides every', min: 4, max: 20, step: 1, unit: 's', default: 5, visibleWhen: (s) => s.auto_rotate },
      { key: 'background', control: 'color', label: 'Background', default: '#F2F2F2', allowTransparent: true },
    ],
    blocks: {
      name: 'Image', kind: 'image', max: 5,
      fields: [
        { key: 'image', control: 'image', label: 'Image', default: '', required: true },
        { key: 'mobile_image', control: 'image', label: 'Mobile image', default: '' },
        { key: 'content_position', control: 'select', label: 'Content position', default: 'middle-left', options: Object.keys(POS).map((v) => ({ value: v, label: v.replace('-', ' ') })) },
        { key: 'content_max_width', control: 'range', label: 'Content maximum width', min: 400, max: 1200, step: 20, unit: 'px', default: 1200 },
        { sub: 'Text' },
        { key: 'subheading', control: 'text', label: 'Subheading', default: '' },
        { key: 'heading', control: 'text', label: 'Heading', default: '' },
        { key: 'heading_size', control: 'select', label: 'Heading size', default: 'xxl', options: [{ value: 'xxl', label: 'XX-Large' }, { value: 'xl', label: 'X-Large' }, { value: 'large', label: 'Large' }, { value: 'medium', label: 'Medium' }, { value: 'small', label: 'Small' }] },
        { key: 'button_text', control: 'text', label: 'Button text', default: '' },
        { key: 'button_link', control: 'url', label: 'Button link', default: '' },
        { sub: 'Colors' },
        { key: 'text_color', control: 'color', label: 'Text', default: '#FFFFFF' },
        { key: 'overlay', control: 'color', label: 'Overlay', default: '#000000' },
        { key: 'overlay_opacity', control: 'range', label: 'Overlay opacity', min: 0, max: 100, step: 5, unit: '%', default: 25 },
      ],
      defaults: () => ({ image: OS.sample.IMG.hero1, heading: 'New season, new you', subheading: 'Just dropped', heading_size: 'xxl', button_text: 'Shop now', button_link: '/collections/new-arrivals', content_position: 'middle-left', content_max_width: 1200, text_color: '#FFFFFF', overlay: '#000000', overlay_opacity: 25 }),
    },
    defaultBlocks: () => ([
      { id: OS.uid('slide'), kind: 'image', hidden: false, settings: { image: OS.sample.IMG.hero1, subheading: 'Just dropped', heading: 'New linen-feel styles', heading_size: 'xxl', button_text: 'Shop now', button_link: '/collections/new-arrivals', content_position: 'middle-left', content_max_width: 1200, text_color: '#FFFFFF', overlay: '#000000', overlay_opacity: 22 } },
      { id: OS.uid('slide'), kind: 'image', hidden: false, settings: { image: OS.sample.IMG.hero2, subheading: 'Exclusive offer', heading: 'Up to 70% off the sale', heading_size: 'xl', button_text: 'Shop the sale', button_link: '/collections/sale', content_position: 'bottom-left', content_max_width: 1100, text_color: '#FFFFFF', overlay: '#000000', overlay_opacity: 30 } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob;
      const slides = (blocks || []).filter((b) => !b.hidden);
      const height = HEIGHT[s.media_size] || 480;
      const bg = OS.bgOrTransparent(s.background);
      if (!slides.length) return '<div class="ssx" style="background:' + bg + ';height:' + (mob ? 260 : height) + 'px;display:grid;place-items:center;color:#9aa3b0;font-size:13px">Add a slide from the structure tree.</div>';
      let active = 0;
      if (ctx.selectedBlockId) { const i = slides.findIndex((b) => b.id === ctx.selectedBlockId); if (i >= 0) active = i; }
      const b = slides[active].settings;
      const img = (mob && b.mobile_image) ? b.mobile_image : b.image;
      const pos = POS[b.content_position] || POS['middle-left'];
      const cta = b.button_text ? '<a class="ss-cta" href="' + OS.esc(b.button_link || '#') + '" style="' + OS.btnStyle(t) + ';margin-top:6px">' + OS.esc(b.button_text) + '</a>' : '';
      const dots = s.controls === 'dots' && slides.length > 1 ? '<div class="ss-dots">' + slides.map((x, i) => '<button class="ss-dot' + (i === active ? ' on' : '') + '" data-ss-dot="' + i + '"></button>').join('') + '</div>' : '';
      const num = s.controls === 'number' && slides.length > 1 ? '<div class="ss-dots" style="color:#fff;font-size:13px;font-weight:600">' + (active + 1) + ' / ' + slides.length + '</div>' : '';
      const arrows = !mob && slides.length > 1 ? '<button class="ss-arr l" data-ss-prev>‹</button><button class="ss-arr r" data-ss-next>›</button>' : '';
      const slide = '<div class="ss-slide" data-block-id="' + OS.esc(slides[active].id) + '" style="height:' + (mob ? Math.round(height * 0.62) : height) + 'px;background-image:url(' + OS.esc(img) + ');align-items:' + pos[0] + '">' +
        '<div class="ss-overlay" style="background:' + OS.bgOrTransparent(b.overlay) + ';opacity:' + ((b.overlay_opacity || 0) / 100) + '"></div>' +
        '<div class="ss-inner" style="justify-content:' + pos[1] + '"><div class="ss-content" style="max-width:' + OS.clamp(b.content_max_width, 400, 1200, 1200) + 'px;text-align:' + pos[2] + ';color:' + (b.text_color || '#fff') + '">' +
        (b.subheading ? '<div class="ss-eyebrow">' + OS.esc(b.subheading) + '</div>' : '') +
        (b.heading ? '<h2 class="ss-head" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, (mob ? 0.6 : 1) * (HSIZE[b.heading_size] || 56)) + 'px">' + OS.esc(b.heading) + '</h2>' : '') +
        cta + '</div></div>' + arrows + dots + num + '</div>';
      return '<div class="ssx' + (mob ? ' mob' : '') + '" style="background:' + bg + '">' + slide + '</div>';
    },
    hydrate: function (root, s, blocks) {
      const slides = (blocks || []).filter((b) => !b.hidden); if (slides.length < 2) return;
      let i = 0; const findActive = () => { const el = root.querySelector('.ss-slide'); const id = el && el.getAttribute('data-block-id'); const k = slides.findIndex((b) => b.id === id); return k < 0 ? 0 : k; };
      i = findActive();
      const go = (n) => { i = (n + slides.length) % slides.length; root.dispatchEvent(new CustomEvent('os-reselect', { bubbles: true })); paint(); };
      const paint = () => { /* lightweight: just swap bg + content by re-reading; simplest is to trigger app re-render via dot data — but keep local */
        const el = root.querySelector('.ss-slide'); if (!el) return; const b = slides[i].settings; const mob = root.classList.contains('mob');
        el.style.backgroundImage = 'url(' + ((mob && b.mobile_image) ? b.mobile_image : b.image) + ')'; el.setAttribute('data-block-id', slides[i].id);
        const c = el.querySelector('.ss-content'); if (c) { const head = c.querySelector('.ss-head'); const eye = c.querySelector('.ss-eyebrow'); if (head) head.textContent = b.heading || ''; if (eye) eye.textContent = b.subheading || ''; }
        root.querySelectorAll('.ss-dot').forEach((d, k) => d.classList.toggle('on', k === i));
      };
      const p = root.querySelector('[data-ss-prev]'), n = root.querySelector('[data-ss-next]');
      if (p) p.onclick = (e) => { e.stopPropagation(); go(i - 1); };
      if (n) n.onclick = (e) => { e.stopPropagation(); go(i + 1); };
      root.querySelectorAll('[data-ss-dot]').forEach((d) => d.onclick = (e) => { e.stopPropagation(); go(Number(d.getAttribute('data-ss-dot'))); });
      if (s.auto_rotate) { if (root._t) clearInterval(root._t); root._t = setInterval(() => { if (!document.body.contains(root)) { clearInterval(root._t); return; } go(i + 1); }, Math.max(2, s.change_seconds || 5) * 1000); }
    },
  });
})();
