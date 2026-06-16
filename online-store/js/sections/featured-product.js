/* Featured product — full in-page buy box for one product. Ported from featured-product.canvas.tsx.
   Bound to a single Product; content is composed from ordered heterogeneous block rows
   (Tag / Title / Price / Rating / Variant picker / Quantity / Buy buttons / Description / Share). */
(function () {
  const OS = window.OS;
  OS.css('featured-product', [
    '.fpx{box-sizing:border-box}.fpx *{box-sizing:border-box}',
    '.fpx .fp-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:start}',
    '.fpx.mob .fp-grid{grid-template-columns:1fr;gap:22px}',
    '.fpx .fp-gallery{display:flex;flex-direction:column;gap:10px}',
    '.fpx .fp-main{aspect-ratio:3/4;background-size:cover;background-position:center;background-color:#f1f2f4}',
    '.fpx .fp-thumbs{display:flex;gap:8px}',
    '.fpx .fp-thumb{width:64px;height:64px;background-size:cover;background-position:center;border-radius:6px;cursor:pointer;border:2px solid transparent}',
    '.fpx .fp-thumb.on{border-color:currentColor}',
    '.fpx .fp-info{display:flex;flex-direction:column;gap:14px}',
    '.fpx .fp-row[data-block-id]{scroll-margin:80px}',
    '.fpx .fp-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 11px;border-radius:999px}',
    '.fpx .fp-title{margin:0;line-height:1.12}',
    '.fpx .fp-rate{display:flex;align-items:center;gap:6px;font-size:13px}.fpx .fp-rate svg{width:15px;height:15px;color:#f5b301}',
    '.fpx .fp-price{display:flex;align-items:baseline;gap:10px}.fpx .fp-price .now{font-size:24px;font-weight:700}.fpx .fp-price s{opacity:.5;font-size:16px}.fpx .fp-price .save{font-size:12px;font-weight:700;padding:2px 7px;border-radius:4px;color:#fff}',
    '.fpx .fp-vlabel{font-size:12px;font-weight:600;letter-spacing:.02em;margin-bottom:7px;opacity:.75}',
    '.fpx .fp-swatches{display:flex;gap:8px}.fpx .fp-sw{width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,0,0,.15);cursor:pointer;box-shadow:0 0 0 2px transparent}.fpx .fp-sw.on{box-shadow:0 0 0 2px currentColor}',
    '.fpx .fp-sizes{display:flex;gap:8px;flex-wrap:wrap}.fpx .fp-size{min-width:46px;height:38px;padding:0 10px;border:1px solid rgba(0,0,0,.2);border-radius:6px;background:none;cursor:pointer;font-size:13px;font-family:inherit}.fpx .fp-size.on{border-color:currentColor;background:rgba(0,0,0,.04);font-weight:600}',
    '.fpx .fp-qty{display:inline-flex;align-items:center;border:1px solid rgba(0,0,0,.2);border-radius:8px;overflow:hidden}.fpx .fp-qty button{width:38px;height:42px;border:0;background:none;cursor:pointer;font-size:16px}.fpx .fp-qty span{min-width:40px;text-align:center;font-weight:600}',
    '.fpx .fp-buy{display:flex;flex-direction:column;gap:10px;margin-top:4px}',
    '.fpx .fp-add{width:100%}',
    '.fpx .fp-paypal{width:100%;height:46px;border-radius:8px;border:0;background:#ffc439;color:#003087;font-weight:800;font-style:italic;cursor:pointer}',
    '.fpx .fp-desc-h{font-size:13px;font-weight:700;margin-bottom:6px}',
    '.fpx .fp-rich{font-size:14px;line-height:1.65;opacity:.9}.fpx .fp-rich a{color:inherit}',
    '.fpx .fp-share{display:flex;gap:10px;align-items:center;font-size:13px}.fpx .fp-share a{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(0,0,0,.15);text-decoration:none;color:inherit}',
  ].join(''));

  const TAG_SZ = { large: 13, medium: 12, small: 11 };

  const BLOCK_KINDS = {
    tag: { name: 'Tag', fields: [
      { key: 'tag_text', control: 'text', label: 'Tag text', default: 'Best seller' },
      { key: 'tag_color', control: 'color', label: 'Tag color', default: '', allowTransparent: true, info: 'Blank inherits the theme primary color.' },
    ], defaults: () => ({}) },
    title: { name: 'Title', fields: [
      { key: 'title_size', control: 'select', label: 'Title size', default: 'large', options: [{ value: 'large', label: 'Large' }, { value: 'medium', label: 'Medium' }, { value: 'small', label: 'Small' }] },
    ], defaults: () => ({}) },
    rating: { name: 'Rating', fields: [], defaults: () => ({}) },
    price: { name: 'Price', fields: [
      { key: 'show_compare_at', control: 'toggle', label: 'Show compare-at price', default: true },
      { key: 'show_savings', control: 'toggle', label: 'Show savings text', default: true },
    ], defaults: () => ({}) },
    variant: { name: 'Variant picker', fields: [
      { key: 'picker_type', control: 'segmented', label: 'Picker type', default: 'buttons', options: [{ value: 'buttons', label: 'Buttons' }, { value: 'dropdown', label: 'Dropdown' }] },
    ], defaults: () => ({}) },
    quantity: { name: 'Quantity selector', fields: [], defaults: () => ({}) },
    buy: { name: 'Buy buttons', fields: [
      { key: 'button_text', control: 'text', label: 'Add to cart text', default: 'Add to cart' },
      { key: 'show_paypal', control: 'toggle', label: 'Show PayPal button', default: true },
    ], defaults: () => ({}) },
    description: { name: 'Description', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: 'Details' },
      { key: 'content', control: 'richtext', label: 'Description', default: 'Add product details, materials and care instructions here.' },
    ], defaults: () => ({}) },
    share: { name: 'Share buttons', fields: [], defaults: () => ({}) },
  };

  OS.register('featured-product', {
    name: 'Featured product', group: 'products', icon: 'grid',
    schema: [
      { key: 'full_width', control: 'toggle', label: 'Full width', default: false },
      { key: 'product', control: 'product', label: 'Product', default: 'p1', required: true, info: 'Pick the product this buy box sells.' },
      { key: 'enable_image_zoom', control: 'toggle', label: 'Enable image zoom', default: true },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: 'transparent', allowTransparent: true },
      { key: 'text', control: 'color', label: 'Text', default: '', allowTransparent: true },
    ],
    blocks: { kinds: BLOCK_KINDS, max: 12 },
    defaultBlocks: () => ([
      { id: OS.uid('fp'), kind: 'tag', hidden: false, settings: { tag_text: 'Best seller' } },
      { id: OS.uid('fp'), kind: 'title', hidden: false, settings: { title_size: 'large' } },
      { id: OS.uid('fp'), kind: 'rating', hidden: false, settings: {} },
      { id: OS.uid('fp'), kind: 'price', hidden: false, settings: { show_compare_at: true, show_savings: true } },
      { id: OS.uid('fp'), kind: 'variant', hidden: false, settings: { picker_type: 'buttons' } },
      { id: OS.uid('fp'), kind: 'quantity', hidden: false, settings: {} },
      { id: OS.uid('fp'), kind: 'buy', hidden: false, settings: { button_text: 'Add to cart', show_paypal: true } },
      { id: OS.uid('fp'), kind: 'description', hidden: false, settings: { heading: 'Details', content: 'Soft, breathable linen-feel fabric with a relaxed fit. Machine washable. Designed in-house and made to last.' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const p = OS.sample.products.find((x) => x.id === s.product) || OS.sample.products[0];
      const text = OS.col(s.text, c.text_color || '#1a1a1a');
      const bg = OS.bgOrTransparent(s.background);
      const padV = OS.secSpace(t, mob), padH = OS.pagePad(t, mob);
      const maxW = s.full_width ? '100%' : OS.pageWidth(t) + 'px';
      const sale = p.compareAt && p.compareAt > p.price, pct = sale ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
      const saleColor = c.sale_price_color || '#d92d20';
      const thumbs = [p.image, OS.sample.IMG.iwt, OS.sample.IMG.cat2, OS.sample.IMG.cat4];

      const rowHtml = (b0) => {
        const b = b0.settings, kind = b0.kind; let body = '';
        if (kind === 'tag') { if (!b.tag_text) return ''; body = '<span class="fp-tag" style="background:' + OS.hexAlpha(OS.col(b.tag_color, c.primary_color || '#103635'), .12) + ';color:' + OS.col(b.tag_color, c.primary_color || '#103635') + '">' + OS.esc(b.tag_text) + '</span>'; }
        else if (kind === 'title') { const px = { large: 30, medium: 24, small: 20 }[b.title_size] || 30; body = '<h2 class="fp-title" style="font-family:' + OS.headingFamily(t) + ';font-size:' + OS.headingSize(t, mob ? px * 0.82 : px) + 'px;color:' + OS.col(s.text, c.heading_color || '#1a1a1a') + '">' + OS.esc(p.title) + '</h2>'; }
        else if (kind === 'rating') { if (!p.rating) return ''; let st = ''; for (let i = 1; i <= 5; i++) st += '<span style="color:' + (p.rating >= i ? '#f5b301' : '#d8dce3') + '">' + OS.icon('star') + '</span>'; body = '<div class="fp-rate">' + st + ' <b>' + p.rating + '</b> <span style="opacity:.6">(' + (p.reviews || 0) + ' reviews)</span></div>'; }
        else if (kind === 'price') { body = '<div class="fp-price"><span class="now"' + (sale ? ' style="color:' + saleColor + '"' : '') + '>' + OS.money(p.price) + '</span>' + (sale && b.show_compare_at ? '<s>' + OS.money(p.compareAt) + '</s>' : '') + (sale && b.show_savings ? '<span class="save" style="background:' + saleColor + '">Save ' + OS.money(p.compareAt - p.price) + '</span>' : '') + '</div>'; }
        else if (kind === 'variant') {
          const sw = (p.swatches || ['#222', '#ccc']).map((cl, i) => '<button class="fp-sw' + (i === 0 ? ' on' : '') + '" style="background:' + cl + '"></button>').join('');
          const sizes = ['S', 'M', 'L', 'XL'].map((z, i) => b.picker_type === 'dropdown' ? '' : '<button class="fp-size' + (i === 1 ? ' on' : '') + '">' + z + '</button>').join('');
          const sizeBlock = b.picker_type === 'dropdown'
            ? '<select class="fp-size" style="height:40px;width:160px">' + ['S', 'M', 'L', 'XL'].map((z) => '<option>' + z + '</option>').join('') + '</select>'
            : '<div class="fp-sizes">' + sizes + '</div>';
          body = '<div><div class="fp-vlabel">Color</div><div class="fp-swatches">' + sw + '</div></div><div style="margin-top:12px"><div class="fp-vlabel">Size</div>' + sizeBlock + '</div>';
        }
        else if (kind === 'quantity') { body = '<div><div class="fp-vlabel">Quantity</div><div class="fp-qty"><button data-q="-">−</button><span>1</span><button data-q="+">+</button></div></div>'; }
        else if (kind === 'buy') { body = '<div class="fp-buy"><button class="fp-add" style="' + OS.btnStyle(t) + ';width:100%">' + OS.esc(b.button_text || 'Add to cart') + '</button>' + (b.show_paypal ? '<button class="fp-paypal">Pay<span style="color:#002f86">Pal</span></button>' : '') + '</div>'; }
        else if (kind === 'description') { if (!b.content) return ''; body = (b.heading ? '<div class="fp-desc-h">' + OS.esc(b.heading) + '</div>' : '') + '<div class="fp-rich">' + b.content + '</div>'; }
        else if (kind === 'share') { body = '<div class="fp-share"><span style="opacity:.7">Share</span><a>f</a><a>𝕏</a><a>◎</a></div>'; }
        return '<div class="fp-row" data-block-id="' + OS.esc(b0.id) + '">' + body + '</div>';
      };

      const info = '<div class="fp-info">' + (blocks || []).filter((b) => !b.hidden).map(rowHtml).join('') + '</div>';
      const gallery = '<div class="fp-gallery"><div class="fp-main" data-fp-main style="background-image:url(' + OS.esc(p.image) + ');border-radius:' + OS.layoutRadius(t, 'image') + 'px"></div>' +
        '<div class="fp-thumbs">' + thumbs.map((im, i) => '<div class="fp-thumb' + (i === 0 ? ' on' : '') + '" data-fp-thumb style="background-image:url(' + OS.esc(im) + ')"></div>').join('') + '</div></div>';
      return '<div class="fpx' + (mob ? ' mob' : '') + '" style="background:' + bg + ';color:' + text + ';font-family:' + OS.bodyFamily(t) + ';padding:' + padV + 'px ' + padH + 'px">' +
        '<div style="max-width:' + maxW + ';margin:0 auto"><div class="fp-grid">' + gallery + info + '</div></div></div>';
    },
    hydrate: function (root) {
      const main = root.querySelector('[data-fp-main]');
      root.querySelectorAll('[data-fp-thumb]').forEach((th) => th.addEventListener('click', (e) => { e.stopPropagation(); root.querySelectorAll('[data-fp-thumb]').forEach((x) => x.classList.remove('on')); th.classList.add('on'); if (main) main.style.backgroundImage = th.style.backgroundImage; }));
      root.querySelectorAll('.fp-sw,.fp-size').forEach((el) => el.tagName !== 'SELECT' && el.addEventListener('click', (e) => { e.stopPropagation(); const sib = el.parentElement.children; [].forEach.call(sib, (x) => x.classList && x.classList.remove('on')); el.classList.add('on'); }));
      const span = root.querySelector('.fp-qty span'); let q = 1;
      root.querySelectorAll('.fp-qty [data-q]').forEach((bn) => bn.addEventListener('click', (e) => { e.stopPropagation(); q = Math.max(1, q + (bn.getAttribute('data-q') === '+' ? 1 : -1)); if (span) span.textContent = q; }));
    },
  });
})();
