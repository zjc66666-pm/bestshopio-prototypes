/* Footer — global. Ported (lean) from footer.canvas.tsx. Heterogeneous block kinds
   (newsletter / linklist / policy / contactinfo / logo / text / payment icons), max 10.
   Multi-column desktop; mobile stacked or accordion (link lists collapse). Bottom bar. */
(function () {
  const OS = window.OS;
  OS.css('footer', [
    '.ftx{font-family:inherit}.ftx *{box-sizing:border-box}',
    '.ftx .ft-inner{margin:0 auto;width:100%}',
    '.ftx .ft-cols{display:grid;gap:32px}',
    '.ftx .ft-bh{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:14px}',
    '.ftx a.ft-link{display:block;font-size:13.5px;text-decoration:none;margin-bottom:9px;opacity:.85}.ftx a.ft-link:hover{opacity:1}',
    '.ftx .ft-rich{font-size:13.5px;line-height:1.7;opacity:.85}.ftx .ft-rich a{color:inherit}',
    '.ftx .ft-form{display:flex;gap:8px;margin-top:6px}',
    '.ftx .ft-input{flex:1;min-width:0;background:transparent;border:0;border-bottom:1px solid currentColor;color:inherit;font-size:14px;padding:8px 2px;outline:none;font-family:inherit}',
    '.ftx .ft-fbtn{border:0;background:none;color:inherit;cursor:pointer;font-weight:600;font-size:18px}',
    '.ftx .ft-logo{font-weight:800;font-size:22px;letter-spacing:-.02em}',
    '.ftx .ft-pay{display:flex;flex-wrap:wrap;gap:8px}',
    '.ftx .ft-pay span{background:#fff;color:#222;border-radius:5px;font-size:10px;font-weight:800;padding:5px 8px;letter-spacing:.04em}',
    '.ftx .ft-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:28px;padding-top:18px;font-size:12.5px;opacity:.85}',
    '.ftx .ft-social{display:flex;gap:12px}.ftx .ft-social a{color:inherit;opacity:.85}.ftx .ft-social svg{width:18px;height:18px}',
    '.ftx .ft-acc-tog{display:none}',
    '.ftx.mob .ft-cols{grid-template-columns:1fr!important;gap:0}',
    '.ftx.mob .ft-block{border-bottom:1px solid rgba(255,255,255,.12);padding:14px 0}',
    '.ftx.mob.acc .ft-acc .ft-links{display:none}.ftx.mob.acc .ft-acc.open .ft-links{display:block}',
    '.ftx.mob.acc .ft-acc .ft-acc-tog{display:inline;float:right}',
    '.ftx.mob .ft-bottom{justify-content:center;text-align:center}',
  ].join(''));

  const SOC = { facebook_url: 'f', instagram_url: '◎', tiktok_url: '♪', youtube_url: '▶', pinterest_url: 'P', twitter_url: '𝕏' };

  const BLOCK_KINDS = {
    newsletter: { name: 'Newsletter', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: 'Let’s stay in touch' },
      { key: 'content', control: 'richtext', label: 'Content', default: 'Get 10% off your first order.' },
      { key: 'placeholder', control: 'text', label: 'Input placeholder', default: 'E-mail' },
      { key: 'button_style', control: 'segmented', label: 'Button style', default: 'icon', options: [{ value: 'icon', label: 'Icon button' }, { value: 'text', label: 'Text button' }] },
      { key: 'button_text', control: 'text', label: 'Button text', default: 'Subscribe', visibleWhen: (s) => s.button_style === 'text' },
    ], defaults: () => ({}) },
    linklist: { name: 'Links', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: 'Shop' },
      { key: 'menu', control: 'menu', label: 'Menu', default: 'menu-footer-shop' },
      { key: 'open_new_tab', control: 'toggle', label: 'Open links in new tab', default: false },
    ], defaults: () => ({}) },
    policy: { name: 'Policy links', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: 'Policies' },
    ], defaults: () => ({}) },
    contactinfo: { name: 'Contact info', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: 'Contact' },
      { key: 'email', control: 'text', label: 'Email', default: 'hello@aura.shop' },
      { key: 'phone', control: 'text', label: 'Phone', default: '+1 (508) 204-3308' },
      { key: 'address', control: 'richtext', label: 'Address', default: '7300 Miller Dr, Frederick CO 80504, US' },
    ], defaults: () => ({}) },
    logo: { name: 'Logo', fields: [
      { key: 'logo_image', control: 'image', label: 'Logo image', default: '' },
      { key: 'logo_text', control: 'text', label: 'Logo text', default: 'AURA' },
    ], defaults: () => ({}) },
    text: { name: 'Text', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: 'About us' },
      { key: 'content', control: 'richtext', label: 'Content', default: 'We design comfortable, modern essentials for everyday life.' },
    ], defaults: () => ({}) },
    paymentIcons: { name: 'Payment icons', fields: [
      { key: 'heading', control: 'text', label: 'Heading', default: '' },
      { key: 'alignment', control: 'segmented', label: 'Alignment', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
    ], defaults: () => ({}) },
  };

  OS.register('footer', {
    name: 'Footer', group: 'footer', icon: 'footer',
    schema: [
      { key: 'footer_layout', control: 'select', label: 'Footer layout', default: 'multicolumn', options: [{ value: 'multicolumn', label: 'Multi column' }, { value: 'simpleHorizontal', label: 'Simple horizontal' }] },
      { key: 'full_width', control: 'toggle', label: 'Full width', default: true },
      { key: 'desktop_columns', control: 'select', label: 'Desktop columns', default: '5', options: ['2', '3', '4', '5', '6'].map((v) => ({ value: v, label: v })), visibleWhen: (s) => s.footer_layout === 'multicolumn' },
      { key: 'mobile_layout', control: 'segmented', label: 'Mobile layout', default: 'accordion', options: [{ value: 'stacked', label: 'Stacked' }, { value: 'accordion', label: 'Accordion' }] },
      { sub: 'Bottom bar' },
      { key: 'show_social_media', control: 'toggle', label: 'Show social media', default: true },
      { key: 'show_copyright', control: 'toggle', label: 'Show copyright', default: true },
      { key: 'copyright_text', control: 'text', label: 'Copyright text', default: '© {{year}} {{shop_name}}. All Rights Reserved.' },
      { key: 'show_powered_by', control: 'toggle', label: 'Show “Powered by”', default: false },
      { sub: 'Colors' },
      { key: 'background', control: 'color', label: 'Background', default: '', allowTransparent: true, info: 'Blank inherits Theme settings › Colors › Footer background.' },
      { key: 'text', control: 'color', label: 'Text', default: '#FFFFFF' },
      { key: 'heading_text', control: 'color', label: 'Heading text', default: '#FFFFFF' },
    ],
    blocks: { kinds: BLOCK_KINDS, max: 10 },
    defaultBlocks: () => ([
      { id: OS.uid('fb'), kind: 'newsletter', hidden: false, settings: { heading: 'Let’s stay in touch', content: 'Sign up and save 10% on your first order.', placeholder: 'E-mail', button_style: 'icon' } },
      { id: OS.uid('fb'), kind: 'linklist', hidden: false, settings: { heading: 'Shop', menu: 'menu-footer-shop', open_new_tab: false } },
      { id: OS.uid('fb'), kind: 'linklist', hidden: false, settings: { heading: 'Help', menu: 'menu-footer-help', open_new_tab: false } },
      { id: OS.uid('fb'), kind: 'policy', hidden: false, settings: { heading: 'Policies' } },
      { id: OS.uid('fb'), kind: 'contactinfo', hidden: false, settings: { heading: 'Contact', email: 'hello@aura.shop', phone: '+1 (508) 204-3308', address: '7300 Miller Dr, Frederick CO 80504' } },
    ]),
    render: function (s, blocks, ctx) {
      const t = ctx.tokens, mob = ctx.mob, c = t.colors || {};
      const bg = OS.bgOrTransparent(OS.col(s.background, c.footer_background || '#103635'));
      const fg = s.text || '#fff', headFg = s.heading_text || '#fff';
      const padH = OS.pagePad(t, mob), maxW = s.full_width ? 1480 : OS.clamp(1200, 360, 1480, 1200);
      const list = (blocks || []).filter((b) => !b.hidden);
      const cols = OS.clamp(Number(s.desktop_columns) || 5, 2, 6, 5);
      const blockHtml = (b0) => {
        const b = b0.settings; const kind = b0.kind;
        const head = (txt) => txt ? '<div class="ft-bh" style="color:' + headFg + '">' + OS.esc(txt) + '</div>' : '';
        let body = '';
        if (kind === 'newsletter') {
          body = head(b.heading) + (b.content ? '<div class="ft-rich" style="margin-bottom:8px">' + b.content + '</div>' : '') +
            '<div class="ft-form"><input class="ft-input" placeholder="' + OS.esc(b.placeholder || 'E-mail') + '">' + (b.button_style === 'text' ? '<button class="ft-fbtn" style="font-size:14px">' + OS.esc(b.button_text || 'Subscribe') + '</button>' : '<button class="ft-fbtn">→</button>') + '</div>';
        } else if (kind === 'linklist') {
          const m = OS.sample.menus.find((x) => x.id === b.menu); const links = m ? (m.items || []) : [];
          body = '<div class="ft-acc' + '">' + head(b.heading).replace('ft-bh', 'ft-bh ft-acc-h') + '<div class="ft-links">' + links.map((l) => '<a class="ft-link" href="' + OS.esc(l.url) + '" style="color:' + fg + '">' + OS.esc(l.title) + '</a>').join('') + '</div></div>';
        } else if (kind === 'policy') {
          body = '<div class="ft-acc">' + head(b.heading) + '<div class="ft-links">' + OS.sample.pages.filter((p) => /Policy|Terms/.test(p.title)).map((p) => '<a class="ft-link" href="' + OS.esc(p.url) + '" style="color:' + fg + '">' + OS.esc(p.title) + '</a>').join('') + '</div></div>';
        } else if (kind === 'contactinfo') {
          body = head(b.heading) + '<div class="ft-rich" style="color:' + fg + '">' + (b.email ? '<a href="mailto:' + OS.esc(b.email) + '" style="color:inherit">' + OS.esc(b.email) + '</a><br>' : '') + (b.phone ? OS.esc(b.phone) + '<br>' : '') + (b.address || '') + '</div>';
        } else if (kind === 'logo') {
          body = b.logo_image ? '<img src="' + OS.esc(b.logo_image) + '" style="height:34px">' : '<div class="ft-logo" style="color:' + headFg + '">' + OS.esc(b.logo_text || 'LOGO') + '</div>';
        } else if (kind === 'text') {
          body = head(b.heading) + '<div class="ft-rich" style="color:' + fg + '">' + (b.content || '') + '</div>';
        } else if (kind === 'paymentIcons') {
          body = head(b.heading) + '<div class="ft-pay" style="justify-content:' + (b.alignment === 'center' ? 'center' : b.alignment === 'right' ? 'flex-end' : 'flex-start') + '">' + ['VISA', 'MC', 'PayPal', 'AMEX'].map((x) => '<span>' + x + '</span>').join('') + '</div>';
        }
        return '<div class="ft-block ' + (kind === 'linklist' || kind === 'policy' ? 'ft-acc' : '') + '" data-block-id="' + OS.esc(b0.id) + '">' + body + '</div>';
      };
      const social = s.show_social_media ? '<div class="ft-social">' + Object.keys(SOC).filter((k) => (t.social_media || {})[k]).map((k) => '<a href="' + OS.esc(t.social_media[k]) + '">' + SOC[k] + '</a>').join('') + '</div>' : '';
      const copy = s.show_copyright ? '<div>' + OS.esc((s.copyright_text || '').replace('{{year}}', '2026').replace('{{shop_name}}', 'Aura')) + (s.show_powered_by ? ' · Powered by BestShopio' : '') + '</div>' : '<div></div>';
      const bottom = (social || s.show_copyright) ? '<div class="ft-bottom" style="border-top:1px solid rgba(255,255,255,.14)">' + copy + social + '</div>' : '';
      return '<div class="ftx' + (mob ? ' mob' : '') + (mob && s.mobile_layout === 'accordion' ? ' acc' : '') + '" style="background:' + bg + ';color:' + fg + ';padding:' + OS.secSpace(t, mob) + 'px ' + padH + 'px;font-family:' + OS.bodyFamily(t) + '">' +
        '<div class="ft-inner" style="max-width:' + maxW + 'px"><div class="ft-cols" style="grid-template-columns:repeat(' + (s.footer_layout === 'simpleHorizontal' ? 1 : cols) + ',minmax(0,1fr))">' +
        (list.length ? list.map(blockHtml).join('') : '<div style="opacity:.6;font-size:13px">Add a footer block.</div>') + '</div>' + bottom + '</div></div>';
    },
    hydrate: function (root) {
      if (!root.classList.contains('acc')) return;
      root.querySelectorAll('.ft-acc').forEach((a) => { const h = a.querySelector('.ft-bh'); if (h) { h.style.cursor = 'pointer'; h.onclick = (e) => { e.stopPropagation(); a.classList.toggle('open'); }; } });
    },
  });
})();
